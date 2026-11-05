const supportedTypes = new Set(['milestone', 'activity']);

export function validateReference(reference) {
  if (!reference || Object.keys(reference).sort().join(',') !== 'childId,contentId,label,type') {
    throw new TypeError('Invalid favorite record shape.');
  }
  if (typeof reference.childId !== 'string' || !reference.childId ||
      typeof reference.contentId !== 'string' || !reference.contentId ||
      typeof reference.label !== 'string' || !reference.label.trim() || reference.label.length > 200 ||
      !supportedTypes.has(reference.type)) throw new TypeError('Invalid favorite record.');
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validatePracticeEntry(entry) {
  if (!entry || typeof entry !== 'object') throw new TypeError('Invalid practice entry.');
  const required = ['activityId', 'activityRevision', 'activityTitle', 'childId', 'id', 'practiceDate'];
  const actual = Object.keys(entry);
  if (required.some(key => !actual.includes(key)) || actual.some(key => ![...required, 'difficulty', 'notes'].includes(key))) {
    throw new TypeError('Invalid practice entry shape.');
  }
  if (typeof entry.id !== 'string' || !entry.id || typeof entry.childId !== 'string' || !entry.childId ||
      typeof entry.activityId !== 'string' || !entry.activityId || !Number.isSafeInteger(entry.activityRevision) || entry.activityRevision < 1 ||
      typeof entry.activityTitle !== 'string' || !entry.activityTitle.trim() || entry.activityTitle.length > 200 || !validDate(entry.practiceDate) ||
      (entry.difficulty !== undefined && !['Easy', 'Moderate', 'Difficult'].includes(entry.difficulty)) ||
      (entry.notes !== undefined && (typeof entry.notes !== 'string' || entry.notes.length > 4000))) {
    throw new TypeError('Invalid practice entry.');
  }
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

  async function transact(childId, mode, collection, action) {
    if (typeof childId !== 'string' || !childId) return [];
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(['profiles', collection], mode);
        const profiles = tx.objectStore('profiles');
        const records = tx.objectStore(collection);
        let result;
        let failure;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(failure ?? tx.error ?? new Error('Local record transaction aborted.'));
        tx.onerror = () => {};
        const profileRequest = profiles.get(childId);
        profileRequest.onsuccess = () => {
          if (!profileRequest.result) {
            failure = new Error('Select a saved child before changing personal records.');
            tx.abort();
            return;
          }
          try {
            const request = action(records);
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
      return transact(childId, 'readonly', 'favorites', favorites => favorites.index('childId').getAll(childId));
    },
    saveFavorite(reference) {
      validateReference(reference);
      return transact(reference.childId, 'readwrite', 'favorites', favorites => favorites.put(reference));
    },
    removeFavorite(childId, type, contentId) {
      if (!supportedTypes.has(type) || typeof contentId !== 'string' || !contentId) {
        throw new TypeError('Invalid favorite key.');
      }
      return transact(childId, 'readwrite', 'favorites', favorites => favorites.delete([childId, type, contentId]));
    },
    loadPractice(childId, activityId) {
      return transact(childId, 'readonly', 'practice', practice => activityId
        ? practice.index('childActivity').getAll([childId, activityId])
        : practice.index('childId').getAll(childId));
    },
    savePractice(entry) {
      validatePracticeEntry(entry);
      return transact(entry.childId, 'readwrite', 'practice', practice => practice.add(entry));
    },
  };
}
