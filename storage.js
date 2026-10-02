/* ============================================================
 * data-access/storage.js — Repository + Adapters
 * UI → Logic → Repository → Adapter (localStorage | memory | API ในอนาคต)
 * เปลี่ยน backend: เขียน ApiAdapter ที่มี load()/save() แล้วส่งเข้า Repository
 * ============================================================ */
const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'suan-khong-chan:v1';

class LocalStorageAdapter {
  constructor(key) { this.key = key; this.persistent = true; }
  async load() { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; }
  async save(data) { localStorage.setItem(this.key, JSON.stringify(data)); }
  async clear() { localStorage.removeItem(this.key); }
}
class MemoryAdapter {
  constructor() { this.data = null; this.persistent = false; }
  async load() { return this.data; }
  async save(data) { this.data = JSON.parse(JSON.stringify(data)); }
  async clear() { this.data = null; }
}

const emptyDB = () => ({
  schemaVersion: SCHEMA_VERSION,
  user: null,
  gardens: [],
  plants: [],          // UserPlant
  tasks: [],           // custom/one-time Task (garden prep, follow-up, user-added)
  taskState: {},       // { [taskId]: { completed, completedAt, result } } สำหรับงานจาก engine
  waterLogs: [],
  fertilizers: [],     // ผลิตภัณฑ์ปุ๋ยของผู้ใช้
  fertilizerLogs: [],
  photoLogs: [],       // imageUrl = "idb:<id>"
  notifications: [],
  badges: {},          // { key: earnedAtISO }
  doctorReports: [],
  customSpecies: [],
  meta: { lastNotifyDay: null, dayOffset: 0, seenCelebrations: {} },
});

function migrate(db) {
  const base = emptyDB();
  const out = Object.assign(base, db || {});
  out.meta = Object.assign(emptyDB().meta, (db && db.meta) || {});
  out.schemaVersion = SCHEMA_VERSION;
  return out;
}

class Repository {
  constructor(adapter) { this.adapter = adapter; this.db = emptyDB(); this.listeners = new Set(); this.saveFailed = false; }
  async init() {
    let data = null;
    try { data = await this.adapter.load(); }
    catch (e) { this.adapter = new MemoryAdapter(); }
    this.db = migrate(data);
    return this;
  }
  get persistent() { return this.adapter.persistent && !this.saveFailed; }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  async commit() {
    try { await this.adapter.save(this.db); this.saveFailed = false; }
    catch (e) { this.saveFailed = true; }
    this.listeners.forEach(fn => fn());
  }
  // ---- generic collection helpers ----
  all(coll) { return this.db[coll]; }
  byId(coll, id) { return this.db[coll].find(x => x.id === id) || null; }
  insert(coll, obj) { this.db[coll].push(obj); return obj; }
  update(coll, id, patch) { const o = this.byId(coll, id); if (o) Object.assign(o, patch); return o; }
  remove(coll, pred) { this.db[coll] = this.db[coll].filter(x => !pred(x)); }
  async reset() { this.db = emptyDB(); try { await this.adapter.clear(); } catch (e) {} this.listeners.forEach(fn => fn()); }
  exportJSON() { return JSON.stringify(this.db); }
  async importJSON(str) {
    const data = JSON.parse(str);
    if (!data || typeof data !== 'object' || !('plants' in data)) throw new Error('invalid');
    this.db = migrate(data); await this.commit();
  }
}

/** PhotoStore — เก็บรูป (dataURL ย่อขนาดแล้ว) ใน IndexedDB, fallback เป็นหน่วยความจำ */
const PhotoStore = (() => {
  const mem = new Map();
  const cache = new Map();
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open('suan-photos', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('photos');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const db = await open();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const t = db.transaction('photos', mode);
        const r = fn(t.objectStore('photos'));
        t.oncomplete = () => resolve(r && 'result' in r ? r.result : true);
        t.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }
  return {
    async put(id, dataUrl) {
      cache.set(id, dataUrl);
      const ok = await tx('readwrite', s => s.put(dataUrl, id));
      if (!ok) mem.set(id, dataUrl);
    },
    async get(id) {
      if (cache.has(id)) return cache.get(id);
      if (mem.has(id)) return mem.get(id);
      const v = await tx('readonly', s => s.get(id));
      if (v) cache.set(id, v);
      return v || null;
    },
    async del(id) { cache.delete(id); mem.delete(id); await tx('readwrite', s => s.delete(id)); },
    async clear() { cache.clear(); mem.clear(); await tx('readwrite', s => s.clear()); },
  };
})();

/** ย่อรูปให้เล็กลงก่อนบันทึก (performance + พื้นที่เก็บ) */
function resizeImageFile(file, maxSide = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('not-image'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
