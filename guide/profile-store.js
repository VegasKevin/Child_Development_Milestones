import { validateBirth, validateStoredProfile } from '/src/child-profiles.js';

const staleProfile = () => Object.assign(new Error('Stale profile'), { code: 'STALE_PROFILE' });
function defaultLabel(profiles, excludedId) {
  let next = 1;
  while (profiles.some(item => item.id !== excludedId && item.label === `Child ${next}`)) next++;
  return `Child ${next}`;
}
// Explicit local-demo namespace. Production storage must use verified adult identity.
export function profileStore(namespace) {
  const name = `milestone-guide-profiles:${namespace}`;
  async function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      let blocked = false;
      request.onupgradeneeded = () => {
        request.result.createObjectStore('profiles', { keyPath: 'id' });
        request.result.createObjectStore('state', { keyPath: 'id' });
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => { blocked = true; reject(new Error('Storage upgrade blocked')); };
      request.onsuccess = () => {
        if (blocked) { request.result.close(); return; }
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
        let failure;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(failure ?? tx.error ?? new Error('Storage transaction aborted'));
        tx.onerror = () => {};
        const all = profiles.getAll();
        const selection = state.get('selection');
        selection.onsuccess = () => {
          try {
            result = { profiles: all.result, selectedId: selection.result?.selectedId ?? null };
            result.profiles.forEach(validateStoredProfile);
            if (selection.result && (Object.keys(selection.result).sort().join(',') !== 'id,selectedId' || selection.result.id !== 'selection')) throw new Error('Unsupported selection data');
            if (selection.result && selection.result.selectedId !== null && typeof selection.result.selectedId !== 'string') throw new Error('Invalid selection data');
            if (result.selectedId !== null && !result.profiles.some(profile => profile.id === result.selectedId)) throw new Error('Invalid selected profile');
            if (change) change(result, profiles, state);
          } catch (error) { failure = error; tx.abort(); }
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
        validateBirth(profile.birth);
        const label = profile.label || defaultLabel(snapshot.profiles);
        const record = { ...profile, label, revision: 1 };
        validateStoredProfile(record);
        profiles.add(record);
        snapshot.profiles.push(record);
        snapshot.selectedId = profile.id;
        state.put({ id: 'selection', selectedId: profile.id });
      });
    },
    select(id) {
      return transact((snapshot, profiles, state) => {
        if (id !== null && !snapshot.profiles.some(profile => profile.id === id)) throw staleProfile();
        snapshot.selectedId = id;
        state.put({ id: 'selection', selectedId: id });
      });
    },
    update(id, revision, changes) {
      return transact((snapshot, profiles) => {
        const index = snapshot.profiles.findIndex(profile => profile.id === id);
        if (index < 0 || snapshot.profiles[index].revision !== revision) throw staleProfile();
        validateBirth(changes.birth);
        const record = { id, birth: changes.birth, label: changes.label || defaultLabel(snapshot.profiles, id), revision: revision + 1 };
        validateStoredProfile(record);
        profiles.put(record);
        snapshot.profiles[index] = record;
      });
    },
    remove(id, revision) {
      return transact((snapshot, profiles, state) => {
        const record = snapshot.profiles.find(profile => profile.id === id);
        if (!record || record.revision !== revision) throw staleProfile();
        profiles.delete(id);
        snapshot.profiles = snapshot.profiles.filter(profile => profile.id !== id);
        if (snapshot.selectedId === id) {
          snapshot.selectedId = null;
          state.put({ id: 'selection', selectedId: null });
        }
      });
    },
  };
}
