import { browseChecklists } from '/src/age-browsing.js';
import { profileStore } from '/profile-store.js';

export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;',
  '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function localProfiles(onChange) {
  const store = profileStore('local-demo');
  let snapshot = { profiles: [], selectedId: null };
  let loadFailed = false;
  let busy = false;
  let draft = { label: '', birth: '' };
  async function load() {
    try { snapshot = await store.load(); loadFailed = false; }
    catch { loadFailed = true; }
  }
  const selected = () => snapshot.profiles.find(profile => profile.id === snapshot.selectedId);
  function selector() {
    return `${loadFailed ? '<p>Saved profiles could not be loaded. Open Manage local profiles to retry.</p>' : ''}${snapshot.profiles.length ? `<label for="selected-child">Selected child</label><select id="selected-child"><option value="">Browse without a profile</option>${snapshot.profiles.map(profile => `<option value="${escape(profile.id)}" ${snapshot.selectedId === profile.id ? 'selected' : ''}>${escape(profile.label)}</option>`).join('')}</select>` : ''}
      <p><a href="#/profiles">Manage local profiles</a></p><p id="profile-selection-error" class="form-error" role="alert"></p>`;
  }
  function screen() {
    return `<h1 tabindex="-1" data-view-title>Local child profiles</h1><p class="lead">Pick up where you left off with a birth-based age.</p>
      <p>Profiles stay in this browser. People using this browser profile can see them. Clearing site data removes them; another device has its own profiles.</p>
      ${loadFailed ? '<p role="alert">Could not read local profiles. Retry before making changes.</p><button id="retry-profiles" class="clear-button">Retry loading profiles</button>' : ''}
      <div class="browse-layout"><section class="age-panel profile-form-panel"><h2>Add a child</h2><p>A nickname is enough. No legal name is needed.</p>
      <form id="profile-form" novalidate><label for="profile-label">Display label (optional)</label><input id="profile-label" maxlength="80" autocomplete="off" value="${escape(draft.label)}">
      <label for="profile-birth">Birth date</label><input id="profile-birth" type="date" max="${today()}" value="${escape(draft.birth)}">
      <p id="profile-error" class="form-error" role="alert"></p><button class="primary" ${loadFailed ? 'disabled' : ''}>Create profile</button></form></section>
      <section><h2>Your children</h2><ul class="profile-list" aria-label="Local child profiles">${snapshot.profiles.map(profile => `<li><h3>${escape(profile.label)}</h3><button class="clear-button" data-use-profile="${escape(profile.id)}">Use ${escape(profile.label)}</button></li>`).join('')}</ul>${snapshot.profiles.length ? '' : '<p>No profiles yet. You can also browse with a temporary age.</p>'}<a href="#/">Back to milestones</a></section></div>`;
  }
  async function change(action, errorElement, message, clearDraft = false) {
    if (busy) return;
    busy = true;
    const controls = [...document.querySelectorAll('#profile-form button, #selected-child, [data-use-profile]')];
    controls.forEach(control => { control.disabled = true; });
    try {
      snapshot = await action();
      if (clearDraft) draft = { label: '', birth: '' };
      onChange();
    } catch {
      errorElement.textContent = message;
    } finally {
      busy = false;
      controls.forEach(control => { control.disabled = false; });
    }
  }
  function bind() {
    document.querySelector('#profile-form')?.addEventListener('input', () => {
      draft = { label: document.querySelector('#profile-label').value, birth: document.querySelector('#profile-birth').value };
    });
    document.querySelector('#retry-profiles')?.addEventListener('click', async () => { await load(); onChange(false); });
    document.querySelector('#selected-child')?.addEventListener('change', event => {
      const id = event.target.value || null;
      event.target.value = snapshot.selectedId ?? '';
      change(() => store.select(id), document.querySelector('#profile-selection-error'), 'Could not change the selected child. Try again.');
    });
    document.querySelectorAll('[data-use-profile]').forEach(button => button.addEventListener('click', () => {
      change(() => store.select(button.dataset.useProfile), document.querySelector('#profile-error'), 'Could not select this profile. Try again.');
    }));
    document.querySelector('#profile-form')?.addEventListener('submit', event => {
      event.preventDefault();
      if (busy || loadFailed) return;
      const value = document.querySelector('#profile-birth').value;
      const error = document.querySelector('#profile-error');
      const birth = Object.fromEntries(['year', 'month', 'day'].map((key, index) => [key, Number(value.split('-')[index])]));
      try {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error();
        browseChecklists({ profile: { birth }, today: today() }, []);
      } catch {
        error.textContent = 'Enter a valid birth date that is not in the future.';
        document.querySelector('#profile-birth').focus();
        return;
      }
      const label = document.querySelector('#profile-label').value.trim();
      if (label.length > 80) { error.textContent = 'Use a display label of 80 characters or fewer.'; return; }
      change(() => store.create({ id: crypto.randomUUID(), birth, ...(label ? { label } : {}) }), error,
        'Could not save this profile. Your input is still here. Try again or browse with a temporary age.', true);
    });
  }
  return { load, selected, selector, screen, bind };
}
