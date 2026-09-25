// "Mis audios": archivos de audio importados (por ejemplo de cursos) guardados en el teléfono
// con IndexedDB, para escucharlos sin internet.

const DB_NAME = 'calma-audios';
const STORE = 'files';
let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

async function run(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listAudios() {
  const all = (await run('readonly', (s) => s.getAll())) || [];
  return all
    .map(({ blob: _blob, ...meta }) => meta)
    .sort((a, b) => (a.folder || '').localeCompare(b.folder || '') || a.name.localeCompare(b.name));
}

export const getAudio = (id) => run('readonly', (s) => s.get(id));

export const updateAudio = async (id, changes) => {
  const rec = await getAudio(id);
  if (rec) await run('readwrite', (s) => s.put({ ...rec, ...changes }));
};

export const deleteAudio = (id) => run('readwrite', (s) => s.delete(id));

function readDuration(file) {
  return new Promise((resolve) => {
    const a = document.createElement('audio');
    const url = URL.createObjectURL(file);
    const done = (v) => { URL.revokeObjectURL(url); resolve(v); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(Number.isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => done(0);
    setTimeout(() => done(0), 8000);
    a.src = url;
  });
}

export async function importAudioFiles(files, folder = '') {
  try { await navigator.storage?.persist?.(); } catch { /* opcional */ }
  let count = 0;
  for (const file of files) {
    const duration = await readDuration(file);
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    const rec = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: name || 'Audio',
      folder,
      type: file.type,
      size: file.size,
      duration,
      addedAt: new Date().toISOString(),
      plays: 0,
      blob: file,
    };
    await run('readwrite', (s) => s.put(rec));
    count++;
  }
  return count;
}

export async function storageEstimate() {
  try {
    const e = await navigator.storage.estimate();
    return { used: e.usage || 0, quota: e.quota || 0 };
  } catch {
    return null;
  }
}

export function formatBytes(n) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
