const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const modeSelect = document.getElementById('modeSelect');
const sizeSelect = document.getElementById('sizeSelect');
const fitSelect = document.getElementById('fitSelect');
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
  const centers = [colors[Math.floor(colors.length / 2)]];
  const candidateStep = Math.max(1, Math.floor(colors.length / 5000));

  while (centers.length < k) {
    let bestColor = colors[0];
    let bestScore = -1;
    for (let n = 0; n < colors.length; n += candidateStep) {
      const c = colors[n];
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

function quantizeKMeans(colors, k, iterations = 7) {
  if (!colors.length) return [];

  const sampled = [];
  const maxSamples = k > 32 ? 9000 : 18000;
  const step = Math.max(1, Math.ceil(colors.length / maxSamples));
  for (let i = 0; i < colors.length; i += step) sampled.push(colors[i]);

  const target = Math.min(k, sampled.length);
  let centers = chooseInitialCenters(sampled, target).map(c => c.slice());

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
      return [Math.round(sums[i][0] / n), Math.round(sums[i][1] / n), Math.round(sums[i][2] / n)];
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

function getOutputSize() {
  const w = sourceImage.naturalWidth;
  const h = sourceImage.naturalHeight;
  const selected = sizeSelect.value;
  if (selected === 'original') return [w, h];
  if (selected === 'auto') return [Math.ceil(w / 8) * 8, Math.ceil(h / 8) * 8];
  const [outW, outH] = selected.split('x').map(Number);
  return [outW, outH];
}

function createPreparedCanvas() {
  const [w, h] = getOutputSize();
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;

  const sw = sourceImage.naturalWidth;
  const sh = sourceImage.naturalHeight;
  const fit = fitSelect.value;

  if (sizeSelect.value === 'original') {
    ctx.drawImage(sourceImage, 0, 0);
    return canvas;
  }

  if (sizeSelect.value === 'auto') {
    const x = Math.floor((w - sw) / 2);
    const y = Math.floor((h - sh) / 2);
    ctx.drawImage(sourceImage, x, y);
    return canvas;
  }

  if (fit === 'stretch') {
    ctx.drawImage(sourceImage, 0, 0, w, h);
    return canvas;
  }

  const scale = fit === 'crop' ? Math.max(w / sw, h / sh) : Math.min(w / sw, h / sh);
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const dx = Math.round((w - dw) / 2);
  const dy = Math.round((h - dh) / 2);
  ctx.drawImage(sourceImage, dx, dy, dw, dh);
  return canvas;
}

function renderPalette(palette, hasTransparency, maxEntries) {
  paletteGrid.innerHTML = '';
  const entries = [];
  if (hasTransparency) entries.push(null);
  entries.push(...palette);

  entries.slice(0, maxEntries).forEach((c, i) => {
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

  paletteGrid.classList.toggle('large-palette', maxEntries > 16);
  paletteCount.textContent = `${entries.length} / ${maxEntries}`;
}

function convertImage() {
  if (!sourceImage) return;

  const prepared = createPreparedCanvas();
  const w = prepared.width;
  const h = prepared.height;
  const threshold = Number(alphaThreshold.value);
  const mode = modeSelect.value;
  const maxEntries = mode === '8bpp' ? 256 : 16;
  const srcCtx = prepared.getContext('2d', { willReadFrequently: true });
  const src = srcCtx.getImageData(0, 0, w, h);

  const opaqueColors = [];
  let transparentPixels = 0;
  for (let i = 0; i < src.data.length; i += 4) {
    if (src.data[i + 3] <= threshold) {
      transparentPixels++;
      continue;
    }
    opaqueColors.push([src.data[i], src.data[i + 1], src.data[i + 2]]);
  }

  const hasTransparency = transparentPixels > 0;
  const visibleLimit = maxEntries - (hasTransparency ? 1 : 0);
  setStatus(`Building a ${maxEntries}-entry GBA palette…`, 'info');
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
  renderPalette(palette, hasTransparency, maxEntries);

  const totalEntries = palette.length + (hasTransparency ? 1 : 0);
  const tileAligned = w % 8 === 0 && h % 8 === 0;
  resultMeta.textContent = `${w}×${h} • ${mode} • ${totalEntries} colors`;
  downloadBtn.disabled = false;
  lastResult = { palette, hasTransparency, width: w, height: h, mode };

  if (tileAligned) {
    setStatus(`Converted successfully: ${w}×${h}, ${mode}, ${totalEntries}/${maxEntries} palette entries, and 8×8 tile aligned.`, 'good');
  } else {
    setStatus(`Converted successfully, but ${w}×${h} is not divisible by 8. Choose Auto-align or a preset size for GBA tile alignment.`, 'warn');
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
    paletteGrid.classList.remove('large-palette');
    paletteCount.textContent = `0 / ${modeSelect.value === '8bpp' ? 256 : 16}`;
    resultMeta.textContent = '—';
    setStatus(`Loaded ${file.name}. Choose your GBA settings and convert.`, 'info');
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus('That image could not be loaded.', 'warn');
  };
  img.src = url;
}

function refreshControls() {
  const maxEntries = modeSelect.value === '8bpp' ? 256 : 16;
  if (!lastResult) paletteCount.textContent = `0 / ${maxEntries}`;
  if (sourceImage) convertImage();
}

fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
alphaThreshold.addEventListener('input', () => alphaValue.textContent = alphaThreshold.value);
convertBtn.addEventListener('click', convertImage);
modeSelect.addEventListener('change', refreshControls);
sizeSelect.addEventListener('change', refreshControls);
fitSelect.addEventListener('change', refreshControls);
ditherToggle.addEventListener('change', refreshControls);

downloadBtn.addEventListener('click', () => {
  if (!lastResult) return;
  resultCanvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${sourceName}_gba_${lastResult.mode}_${lastResult.width}x${lastResult.height}.png`;
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
