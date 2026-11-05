const supportedTypes = new Set(['milestone', 'activity']);

function validateReference(reference) {
  if (!reference || Object.keys(reference).sort().join(',') !== 'childId,contentId,label,type') {
    throw new TypeError('Invalid favorite record shape.');
  }
  if (typeof reference.childId !== 'string' || !reference.childId ||
      typeof reference.contentId !== 'string' || !reference.contentId ||
      typeof reference.label !== 'string' || !reference.label.trim() || reference.label.length > 200 ||
      !supportedTypes.has(reference.type)) throw new TypeError('Invalid favorite record.');
}

export function personalRecords(namespace) {
  const name = `milestone-guide-profiles:${namespace}`;
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('state')) db.createObjectStore('state', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('favorites')) {
          const favorites = db.createObjectStore('favorites', { keyPath: ['childId', 'type', 'contentId'] });
          favorites.createIndex('childId', 'childId');
        }
        if (!db.objectStoreNames.contains('practice')) {
          const practice = db.createObjectStore('practice', { keyPath: 'id' });
          practice.createIndex('childId', 'childId');
          practice.createIndex('childActivity', ['childId', 'activityId']);
        }
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Local record storage upgrade is blocked.'));
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }

  async function transact(childId, mode, action) {
    if (typeof childId !== 'string' || !childId) return [];
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(['profiles', 'favorites'], mode);
        const profiles = tx.objectStore('profiles');
        const favorites = tx.objectStore('favorites');
        let result;
        let failure;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(failure ?? tx.error ?? new Error('Local record transaction aborted.'));
        tx.onerror = () => {};
        const profileRequest = profiles.get(childId);
        profileRequest.onsuccess = () => {
          if (!profileRequest.result) {
            failure = new Error('Select a saved child before changing favorites.');
            tx.abort();
            return;
          }
          try {
            const request = action(favorites);
            if (request && typeof request === 'object' && 'onsuccess' in request) {
              request.onsuccess = () => { result = request.result; };
            }
          }
          catch (error) { failure = error; tx.abort(); }
        };
      });
    } finally { db.close(); }
  }

  return {
    loadFavorites(childId) {
      return transact(childId, 'readonly', favorites => favorites.index('childId').getAll(childId));
    },
    saveFavorite(reference) {
      validateReference(reference);
      return transact(reference.childId, 'readwrite', favorites => favorites.put(reference));
    },
    removeFavorite(childId, type, contentId) {
      if (!supportedTypes.has(type) || typeof contentId !== 'string' || !contentId) {
        throw new TypeError('Invalid favorite key.');
      }
      return transact(childId, 'readwrite', favorites => favorites.delete([childId, type, contentId]));
    },
  };
}
