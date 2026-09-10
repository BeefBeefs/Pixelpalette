const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const alphaThreshold = document.getElementById('alphaThreshold');
const alphaValue = document.getElementById('alphaValue');
const ditherToggle = document.getElementById('ditherToggle');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusEl = document.getElementById('status');
const originalCanvas = document.getElementById('originalCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const originalMeta = document.getElementById('originalMeta');
const resultMeta = document.getElementById('resultMeta');
const paletteGrid = document.getElementById('paletteGrid');
const paletteCount = document.getElementById('paletteCount');

let sourceImage = null;
let sourceName = 'converted';
let lastResult = null;

function setStatus(message, kind = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`;
}

function gbaSnap(v) {
  const five = Math.max(0, Math.min(31, Math.round(v * 31 / 255)));
  return Math.round(five * 255 / 31);
}

function gbaColor([r, g, b]) {
  return [gbaSnap(r), gbaSnap(g), gbaSnap(b)];
}

function colorDistanceSq(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function nearestColor(rgb, palette) {
  let best = palette[0];
  let bestDist = Infinity;
  for (const c of palette) {
    const d = colorDistanceSq(rgb, c);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function chooseInitialCenters(colors, k) {
  if (colors.length <= k) return colors.slice();
  const centers = [];
  centers.push(colors[Math.floor(colors.length / 2)]);

  while (centers.length < k) {
    let bestColor = colors[0];
    let bestScore = -1;
    for (const c of colors) {
      let minDist = Infinity;
      for (const center of centers) minDist = Math.min(minDist, colorDistanceSq(c, center));
      if (minDist > bestScore) {
        bestScore = minDist;
        bestColor = c;
      }
    }
    centers.push(bestColor);
  }
  return centers;
}

function quantizeKMeans(colors, k, iterations = 8) {
  if (!colors.length) return [];

  const sampled = [];
  const step = Math.max(1, Math.floor(colors.length / 18000));
  for (let i = 0; i < colors.length; i += step) sampled.push(colors[i]);

  let centers = chooseInitialCenters(sampled, Math.min(k, sampled.length)).map(c => c.slice());

  for (let iter = 0; iter < iterations; iter++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const c of sampled) {
      let bestIndex = 0;
      let bestDist = Infinity;
      for (let i = 0; i < centers.length; i++) {
        const d = colorDistanceSq(c, centers[i]);
        if (d < bestDist) {
          bestDist = d;
          bestIndex = i;
        }
      }
      sums[bestIndex][0] += c[0];
      sums[bestIndex][1] += c[1];
      sums[bestIndex][2] += c[2];
      sums[bestIndex][3]++;
    }
    centers = centers.map((c, i) => {
      const n = sums[i][3];
      if (!n) return c;
      return [
        Math.round(sums[i][0] / n),
        Math.round(sums[i][1] / n),
        Math.round(sums[i][2] / n),
      ];
    });
  }

  const unique = [];
  const seen = new Set();
  for (const c of centers.map(gbaColor)) {
    const key = c.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }

  while (unique.length < Math.min(k, sampled.length)) {
    let candidate = null;
    let bestDist = -1;
    for (const c of sampled) {
      const snapped = gbaColor(c);
      const key = snapped.join(',');
      if (seen.has(key)) continue;
      let minDist = Infinity;
      for (const p of unique) minDist = Math.min(minDist, colorDistanceSq(snapped, p));
      if (minDist > bestDist) {
        bestDist = minDist;
        candidate = snapped;
      }
    }
    if (!candidate) break;
    seen.add(candidate.join(','));
    unique.push(candidate);
  }

  return unique.slice(0, k);
}

function drawSource(img) {
  originalCanvas.width = img.naturalWidth;
  originalCanvas.height = img.naturalHeight;
  const ctx = originalCanvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  originalMeta.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
}

function renderPalette(palette, hasTransparency) {
  paletteGrid.innerHTML = '';

  const entries = [];
  if (hasTransparency) entries.push(null);
  entries.push(...palette);

  entries.slice(0, 16).forEach((c, i) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    if (c === null) {
      swatch.classList.add('transparent');
      swatch.title = 'Palette index 0 — transparent';
    } else {
      swatch.style.background = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
      swatch.title = `Index ${i}: RGB(${c[0]}, ${c[1]}, ${c[2]})`;
    }
    const label = document.createElement('span');
    label.className = 'swatch-label';
    label.textContent = i;
    swatch.appendChild(label);
    paletteGrid.appendChild(swatch);
  });

  paletteCount.textContent = `${entries.length} / 16`;
}

function convertImage() {
  if (!sourceImage) return;

  const threshold = Number(alphaThreshold.value);
  const w = originalCanvas.width;
  const h = originalCanvas.height;
  const srcCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
  const src = srcCtx.getImageData(0, 0, w, h);

  const opaqueColors = [];
  let transparentPixels = 0;
  for (let i = 0; i < src.data.length; i += 4) {
    const a = src.data[i + 3];
    if (a <= threshold) {
      transparentPixels++;
      continue;
    }
    opaqueColors.push([src.data[i], src.data[i + 1], src.data[i + 2]]);
  }

  const hasTransparency = transparentPixels > 0;
  const visibleLimit = hasTransparency ? 15 : 16;
  const palette = quantizeKMeans(opaqueColors, visibleLimit);

  resultCanvas.width = w;
  resultCanvas.height = h;
  const outCtx = resultCanvas.getContext('2d', { willReadFrequently: true });
  const out = outCtx.createImageData(w, h);

  if (ditherToggle.checked && palette.length) {
    const work = new Float32Array(src.data.length);
    for (let i = 0; i < src.data.length; i++) work[i] = src.data[i];

    const spread = (x, y, er, eg, eb, factor) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const idx = (y * w + x) * 4;
      if (src.data[idx + 3] <= threshold) return;
      work[idx] += er * factor;
      work[idx + 1] += eg * factor;
      work[idx + 2] += eb * factor;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (src.data[idx + 3] <= threshold) {
          out.data[idx + 3] = 0;
          continue;
        }

        const old = [
          Math.max(0, Math.min(255, work[idx])),
          Math.max(0, Math.min(255, work[idx + 1])),
          Math.max(0, Math.min(255, work[idx + 2])),
        ];
        const chosen = nearestColor(old, palette);
        out.data[idx] = chosen[0];
        out.data[idx + 1] = chosen[1];
        out.data[idx + 2] = chosen[2];
        out.data[idx + 3] = 255;

        const er = old[0] - chosen[0];
        const eg = old[1] - chosen[1];
        const eb = old[2] - chosen[2];
        spread(x + 1, y, er, eg, eb, 7 / 16);
        spread(x - 1, y + 1, er, eg, eb, 3 / 16);
        spread(x, y + 1, er, eg, eb, 5 / 16);
        spread(x + 1, y + 1, er, eg, eb, 1 / 16);
      }
    }
  } else {
    for (let i = 0; i < src.data.length; i += 4) {
      if (src.data[i + 3] <= threshold) {
        out.data[i + 3] = 0;
        continue;
      }
      const chosen = palette.length ? nearestColor([src.data[i], src.data[i + 1], src.data[i + 2]], palette) : [0, 0, 0];
      out.data[i] = chosen[0];
      out.data[i + 1] = chosen[1];
      out.data[i + 2] = chosen[2];
      out.data[i + 3] = 255;
    }
  }

  outCtx.putImageData(out, 0, 0);
  renderPalette(palette, hasTransparency);

  const tileAligned = w % 8 === 0 && h % 8 === 0;
  resultMeta.textContent = `${w}×${h} • ${palette.length + (hasTransparency ? 1 : 0)} colors`;
  downloadBtn.disabled = false;
  lastResult = { palette, hasTransparency, width: w, height: h };

  if (tileAligned) {
    setStatus(`Converted successfully. Image is 8×8 tile aligned and uses ${palette.length + (hasTransparency ? 1 : 0)} palette entries.`, 'good');
  } else {
    setStatus(`Converted successfully, but ${w}×${h} is not divisible by 8. A later build will add automatic tile-aligned resizing/padding.`, 'warn');
  }
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    setStatus('Please choose a PNG, JPG, or WebP image.', 'warn');
    return;
  }

  sourceName = file.name.replace(/\.[^.]+$/, '') || 'converted';
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    drawSource(img);
    convertBtn.disabled = false;
    downloadBtn.disabled = true;
    resultCanvas.width = 1;
    resultCanvas.height = 1;
    paletteGrid.innerHTML = '';
    paletteCount.textContent = '0 / 16';
    resultMeta.textContent = '—';
    setStatus(`Loaded ${file.name}. Tap Convert Image to create a GBA-safe palette.`, 'info');
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus('That image could not be loaded.', 'warn');
  };
  img.src = url;
}

fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
alphaThreshold.addEventListener('input', () => alphaValue.textContent = alphaThreshold.value);
convertBtn.addEventListener('click', convertImage);
ditherToggle.addEventListener('change', () => {
  if (sourceImage) convertImage();
});

downloadBtn.addEventListener('click', () => {
  if (!lastResult) return;
  resultCanvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${sourceName}_gba.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
});

['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, e => {
  e.preventDefault();
  dropZone.classList.add('dragging');
}));
['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, e => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
}));
dropZone.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));
