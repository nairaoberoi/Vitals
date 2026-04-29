// Local persistence layer. All data is stored on-device.
// - localStorage holds structured logs (transfusions, ferritin, symptoms, diet)
// - IndexedDB holds binary uploads (PDF/image documents)

const KEYS = {
  transfusions: "thal.transfusions",
  ferritin: "thal.ferritin",
  fatigue: "thal.fatigue",
  headache: "thal.headache",
  diet: "thal.diet",
  documentsMeta: "thal.documents.meta",
};

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ------------- Transfusions -------------
// { id, date (YYYY-MM-DD), preHb: { date, value } | null, dayHb: { date, value } | null, units, notes,
//   attachments: [{ id, filename, mime, size, addedAt }], createdAt }
export const transfusionsAPI = {
  list() {
    return readList(KEYS.transfusions).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  get(id) {
    return this.list().find((t) => t.id === id);
  },
  upsert(entry) {
    const list = readList(KEYS.transfusions);
    const idx = list.findIndex((t) => t.id === entry.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...entry };
    } else {
      list.push({ id: uid(), createdAt: new Date().toISOString(), attachments: [], ...entry });
    }
    writeList(KEYS.transfusions, list);
    return list;
  },
  remove(id) {
    writeList(KEYS.transfusions, readList(KEYS.transfusions).filter((t) => t.id !== id));
  },
};

// ------------- Transfusion attachments (lab slips etc.) -------------
// File blobs share the same IndexedDB store as documents. Metadata lives on the parent transfusion entry.
export const transfusionAttachmentsAPI = {
  async add(transfusionId, file) {
    const entry = transfusionsAPI.get(transfusionId);
    if (!entry) throw new Error("transfusion not found");
    const id = uid();
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(file, id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    const attachments = Array.isArray(entry.attachments) ? entry.attachments.slice() : [];
    attachments.push({
      id,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      addedAt: new Date().toISOString(),
    });
    transfusionsAPI.upsert({ ...entry, attachments });
    return id;
  },
  async getBlob(attachmentId) {
    const db = await openDB();
    const blob = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(attachmentId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  },
  async remove(transfusionId, attachmentId) {
    const entry = transfusionsAPI.get(transfusionId);
    if (!entry) return;
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(attachmentId);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    const attachments = (entry.attachments || []).filter((a) => a.id !== attachmentId);
    transfusionsAPI.upsert({ ...entry, attachments });
  },
};

// ------------- Ferritin -------------
// { id, date, value (ng/mL), notes }
export const ferritinAPI = {
  list() {
    return readList(KEYS.ferritin).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  add(entry) {
    const list = readList(KEYS.ferritin);
    list.push({ id: uid(), ...entry });
    writeList(KEYS.ferritin, list);
  },
  remove(id) {
    writeList(KEYS.ferritin, readList(KEYS.ferritin).filter((t) => t.id !== id));
  },
};

// ------------- Fatigue -------------
// { id, date (YYYY-MM-DD), level: 1..5, notes }
export const fatigueAPI = {
  list() {
    return readList(KEYS.fatigue).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  byDate(date) {
    return readList(KEYS.fatigue).find((t) => t.date === date);
  },
  setForDate(date, level, notes = "") {
    const list = readList(KEYS.fatigue);
    const idx = list.findIndex((t) => t.date === date);
    if (idx >= 0) {
      list[idx] = { ...list[idx], level, notes };
    } else {
      list.push({ id: uid(), date, level, notes });
    }
    writeList(KEYS.fatigue, list);
  },
  remove(id) {
    writeList(KEYS.fatigue, readList(KEYS.fatigue).filter((t) => t.id !== id));
  },
};

// ------------- Headache -------------
// { id, date, severity: 'mild'|'moderate'|'severe', durationHours, notes }
export const headacheAPI = {
  list() {
    return readList(KEYS.headache).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  add(entry) {
    const list = readList(KEYS.headache);
    list.push({ id: uid(), ...entry });
    writeList(KEYS.headache, list);
  },
  remove(id) {
    writeList(KEYS.headache, readList(KEYS.headache).filter((t) => t.id !== id));
  },
};

// ------------- Diet -------------
// { id, date, time (HH:MM), meal: 'Breakfast'|'Lunch'|'Dinner'|'Snack', text, notes }
export const dietAPI = {
  list() {
    return readList(KEYS.diet).sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (a.time || "") < (b.time || "") ? 1 : -1;
    });
  },
  byDate(date) {
    return readList(KEYS.diet)
      .filter((t) => t.date === date)
      .sort((a, b) => (a.time || "") < (b.time || "") ? -1 : 1);
  },
  add(entry) {
    const list = readList(KEYS.diet);
    list.push({ id: uid(), ...entry });
    writeList(KEYS.diet, list);
  },
  remove(id) {
    writeList(KEYS.diet, readList(KEYS.diet).filter((t) => t.id !== id));
  },
};

// ------------- Documents (IndexedDB for blobs + meta in localStorage) -------------
const DB_NAME = "thal_docs";
const STORE = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const documentsAPI = {
  listMeta() {
    return readList(KEYS.documentsMeta).sort((a, b) => (a.testDate < b.testDate ? 1 : -1));
  },
  async add({ file, category, testDate, notes }) {
    const id = uid();
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(file, id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    const meta = readList(KEYS.documentsMeta);
    meta.push({
      id,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      category,
      testDate,
      notes: notes || "",
      uploadedAt: new Date().toISOString(),
    });
    writeList(KEYS.documentsMeta, meta);
    return id;
  },
  async getBlob(id) {
    const db = await openDB();
    const blob = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return blob;
  },
  async remove(id) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    writeList(KEYS.documentsMeta, readList(KEYS.documentsMeta).filter((m) => m.id !== id));
  },
};

// ------------- Bulk export / clear -------------
export function exportAllJSON() {
  return {
    exportedAt: new Date().toISOString(),
    transfusions: readList(KEYS.transfusions),
    ferritin: readList(KEYS.ferritin),
    fatigue: readList(KEYS.fatigue),
    headache: readList(KEYS.headache),
    diet: readList(KEYS.diet),
    documents: readList(KEYS.documentsMeta), // metadata only; file blobs are device-local
  };
}

export function clearAllData() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  // Clear IndexedDB store too
  indexedDB.deleteDatabase(DB_NAME);
}
