// Build 23: persistent recursive ROM-folder library.
(() => {
  const folderInput = document.getElementById('romFolderInput');
  const chooseFolderBtn = document.getElementById('chooseRomFolderBtn');
  const clearBtn = document.getElementById('clearRomLibraryBtn');
  const searchInput = document.getElementById('romLibrarySearch');
  const list = document.getElementById('romLibraryList');
  const countLabel = document.getElementById('romLibraryCount');
  const statusLabel = document.getElementById('romLibraryStatus');
  const romInput = document.getElementById('romInput');
  if (!folderInput || !chooseFolderBtn || !list) return;

  const DB_NAME = 'PixelPlayerLibrary';
  const STORE = 'roms';
  const DB_VERSION = 1;
  let rows = [];

  const style = document.createElement('style');
  style.textContent = `
    .rom-library-panel{display:grid;gap:12px}
    .rom-library-toolbar{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
    .rom-library-toolbar .primary,.rom-library-toolbar .secondary{white-space:nowrap}
    .rom-library-search{flex:1 1 220px;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:#0d120f;color:#eef6ef;outline:none}
    .rom-library-search:focus{border-color:var(--accent)}
    .rom-library-summary{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:.76rem}
    .rom-library-list{display:grid;gap:7px;max-height:430px;overflow:auto;padding-right:2px}
    .rom-library-list.empty-state{min-height:90px;place-items:center;border:1px dashed var(--border2);border-radius:12px;color:var(--muted);font-size:.82rem;padding:16px;text-align:center}
    .rom-library-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid var(--border);border-radius:12px;background:#101612}
    .rom-library-info{display:grid;gap:2px;min-width:0}
    .rom-library-info strong{font-size:.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rom-library-info span{font-size:.68rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rom-library-row button{padding:8px 13px;font-size:.75rem;flex:0 0 auto}
    @media(max-width:560px){.rom-library-toolbar{display:grid;grid-template-columns:1fr 1fr}.rom-library-search{grid-column:1/-1;width:100%}.rom-library-toolbar button{width:100%}.rom-library-list{max-height:360px}.rom-library-row{padding:10px}.rom-library-info strong{font-size:.8rem}}
  `;
  document.head.appendChild(style);

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'key' });
          store.createIndex('name', 'name');
          store.createIndex('path', 'path');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function libraryKey(file) {
    const path = file.webkitRelativePath || file.name;
    return `${path}:${file.size}:${file.lastModified || 0}`;
  }

  function fmtSize(bytes) {
    return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  async function getRows() {
    try {
      const db = await openDb();
      const result = await new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      db.close();
      return result.sort((a, b) => a.path.localeCompare(b.path, undefined, { sensitivity: 'base' }));
    } catch (error) {
      console.warn('ROM library read failed', error);
      return [];
    }
  }

  async function saveFolder(files) {
    const roms = [...files].filter(file => /\.gba$/i.test(file.name));
    if (!roms.length) {
      statusLabel.textContent = 'No .gba files were found in that folder or its subfolders.';
      return;
    }

    statusLabel.textContent = `Saving ${roms.length} ROM${roms.length === 1 ? '' : 's'} locally…`;
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        for (const file of roms) {
          const path = file.webkitRelativePath || file.name;
          store.put({
            key: libraryKey(file),
            name: file.name,
            path,
            size: file.size,
            lastModified: file.lastModified || 0,
            addedAt: Date.now(),
            blob: file
          });
        }
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Library save aborted'));
      });
      db.close();
      rows = await getRows();
      render();
      statusLabel.textContent = `Saved ${roms.length} ROM${roms.length === 1 ? '' : 's'} from the selected folder.`;
    } catch (error) {
      console.error(error);
      statusLabel.textContent = 'Could not save the whole ROM folder. Browser storage may be full.';
    }
  }

  async function clearLibrary() {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
      rows = [];
      render();
      statusLabel.textContent = 'Saved ROM library cleared.';
    } catch (error) {
      console.warn('Could not clear ROM library', error);
    }
  }

  function launch(row) {
    const file = new File([row.blob], row.name, {
      type: 'application/octet-stream',
      lastModified: row.lastModified || Date.now()
    });

    // Route through the existing ROM input so PixelPlayer's recent-ROM and
    // auto-resume bookkeeping receives the same change event as a normal pick.
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      romInput.files = transfer.files;
      romInput.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      console.warn('Could not route library ROM through file input', error);
      if (typeof window.startRom === 'function') window.startRom(file);
    }
  }

  function render() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const filtered = !query ? rows : rows.filter(row => `${row.name} ${row.path}`.toLowerCase().includes(query));
    countLabel.textContent = `${filtered.length}${query ? ` of ${rows.length}` : ''} ROM${filtered.length === 1 ? '' : 's'}`;

    if (!filtered.length) {
      list.className = 'rom-library-list empty-state';
      list.textContent = rows.length ? 'No ROMs match your search.' : 'Choose a ROM folder to build your library. Subfolders are scanned automatically.';
      return;
    }

    list.className = 'rom-library-list';
    list.innerHTML = '';
    for (const row of filtered) {
      const item = document.createElement('article');
      item.className = 'rom-library-row';
      const info = document.createElement('div');
      info.className = 'rom-library-info';
      const name = document.createElement('strong');
      name.textContent = row.name.replace(/\.gba$/i, '');
      const meta = document.createElement('span');
      meta.textContent = `${row.path} • ${fmtSize(row.size)}`;
      info.append(name, meta);
      const play = document.createElement('button');
      play.className = 'primary';
      play.type = 'button';
      play.textContent = 'Play';
      play.addEventListener('click', () => launch(row));
      item.append(info, play);
      list.append(item);
    }
  }

  chooseFolderBtn.addEventListener('click', () => folderInput.click());
  folderInput.addEventListener('change', () => {
    if (folderInput.files?.length) saveFolder(folderInput.files);
    folderInput.value = '';
  });
  clearBtn?.addEventListener('click', clearLibrary);
  searchInput?.addEventListener('input', render);

  getRows().then(saved => {
    rows = saved;
    render();
    if (rows.length) statusLabel.textContent = 'Saved ROM library restored from this browser.';
  });
})();
