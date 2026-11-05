// Explicit local-demo namespace. Production storage must use verified adult identity.
export function profileStore(namespace) {
  const name = `milestone-guide-profiles:${namespace}`;
  async function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('profiles', { keyPath: 'id' });
        request.result.createObjectStore('state', { keyPath: 'id' });
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Storage upgrade blocked'));
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }
  async function transact(change) {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(['profiles', 'state'], change ? 'readwrite' : 'readonly');
        const profiles = tx.objectStore('profiles');
        const state = tx.objectStore('state');
        let result;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(tx.error ?? new Error('Storage transaction aborted'));
        tx.onerror = () => {};
        const all = profiles.getAll();
        const selection = state.get('selection');
        selection.onsuccess = () => {
          try {
            result = { profiles: all.result, selectedId: selection.result?.selectedId ?? null };
            if (change) change(result, profiles, state);
          } catch { tx.abort(); }
        };
      });
    } finally { db.close(); }
  }
  return {
    async load() {
      // Anonymous browsing does not create personal storage on supported browsers.
      if (indexedDB.databases && !(await indexedDB.databases()).some(db => db.name === name)) {
        return { profiles: [], selectedId: null };
      }
      return transact();
    },
    create(profile) {
      return transact((snapshot, profiles, state) => {
        const label = profile.label || `Child ${snapshot.profiles.length + 1}`;
        const record = { ...profile, label, revision: 1 };
        profiles.add(record);
        snapshot.profiles.push(record);
        snapshot.selectedId = profile.id;
        state.put({ id: 'selection', selectedId: profile.id });
      });
    },
    select(id) {
      return transact((snapshot, profiles, state) => {
        if (id !== null && !snapshot.profiles.some(profile => profile.id === id)) throw new Error('Missing profile');
        snapshot.selectedId = id;
        state.put({ id: 'selection', selectedId: id });
      });
    },
  };
}
