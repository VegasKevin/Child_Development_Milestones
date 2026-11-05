import { profileStore } from './profile-store.js';
import { validateBackup } from '/src/backup.js';

const collections = ['profiles', 'favorites', 'practice'];
export function backupStore(namespace) {
  const store = profileStore(namespace);
  async function transaction(replacement, expected) {
    const db = await store.openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction([...collections, 'state'], replacement ? 'readwrite' : 'readonly');
        const snapshot = { schemaVersion: 1 };
        let failure;
        tx.onabort = () => reject(failure ?? tx.error ?? new Error('Backup transaction aborted.'));
        tx.onerror = () => {};
        tx.oncomplete = () => resolve(replacement ?? snapshot);
        let pending = collections.length;
        for (const name of collections) {
          const request = tx.objectStore(name).getAll();
          request.onsuccess = () => {
            snapshot[name] = request.result;
            if (--pending || !replacement) return;
            try {
              if (JSON.stringify(snapshot) !== JSON.stringify(expected)) {
                failure = Object.assign(new Error('Local records changed.'), { code: 'STALE_BACKUP' });
                tx.abort(); return;
              }
              for (const collection of collections) {
                const target = tx.objectStore(collection);
                target.clear();
                for (const record of replacement[collection]) target.add(record);
              }
              tx.objectStore('state').put({ id: 'selection', selectedId: null });
            } catch (error) { failure = error; tx.abort(); }
          };
        }
      });
    } finally { db.close(); }
  }
  return {
    async snapshot() { return validateBackup(await transaction()); },
    replace(data, expected) { return transaction(structuredClone(validateBackup(data)), structuredClone(validateBackup(expected))); },
  };
}
