import {
  ReviewProjectFile,
  validateReviewProjectFile,
} from "./reviewProject";

/**
 * Tiny IndexedDB wrapper holding a single autosave draft so a refresh,
 * closed browser or reboot can resume the review session. localStorage is
 * too small for full SVG projects; IndexedDB is the safe storage.
 */
const DB_NAME = "svg-editor-review-projects";
const DB_VERSION = 1;
const STORE_NAME = "active-project";
const KEY = "review";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable in this browser."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Cannot open autosave storage."));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const req = run(tx.objectStore(STORE_NAME));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Autosave storage request failed."));
        tx.onabort = () => reject(tx.error ?? new Error("Autosave storage aborted."));
        tx.oncomplete = () => db.close();
      }),
  );
}

/** Persist the draft. Fails softly — callers surface a small status message. */
export async function saveAutosaveProject(project: ReviewProjectFile): Promise<void> {
  await runTransaction("readwrite", (store) => store.put(project, KEY));
}

function validate(raw: unknown): ReviewProjectFile | null {
  const res = validateReviewProjectFile(raw);
  return res.ok ? res.project : null;
}

export async function loadAutosaveProject(): Promise<ReviewProjectFile | null> {
  const raw = await runTransaction<unknown>("readonly", (store) => store.get(KEY) as IDBRequest<unknown>);
  if (!raw) return null;
  return validate(raw);
}

export async function deleteAutosaveProject(): Promise<void> {
  await runTransaction("readwrite", (store) => store.delete(KEY) as IDBRequest<unknown>);
}

/** Cheap existence check that skips full JSON validation. */
export async function hasAutosaveProject(): Promise<boolean> {
  try {
    const count = await runTransaction<number>("readonly", (store) => store.count());
    return count > 0;
  } catch {
    return false;
  }
}
