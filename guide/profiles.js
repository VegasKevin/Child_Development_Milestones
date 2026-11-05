import { profileStore } from '/profile-store.js';
import { localDate, validateBirth } from '/src/child-profiles.js';

export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;',
  '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const today = localDate;

export function localProfiles(onChange) {
  const store = profileStore('local-demo');
  let snapshot = { profiles: [], selectedId: null };
  let loadFailed = false;
  let busy = false;
  const emptyDraft = () => ({ label: '', birth: '', mode: 'date' });
  let draft = emptyDraft();
  let createDraft = emptyDraft();
  let editing = null;
  let removing = null;
  const mutationControls = () => [...document.querySelectorAll('#profile-form input, #profile-form select, #profile-form button, #selected-child, .profile-actions button, #confirm-remove, #keep-profile, #retry-profiles')];
  const focusAction = (attribute, id) => {
    const button = [...document.querySelectorAll(`[${attribute}]`)].find(item => item.getAttribute(attribute) === id);
    (button ?? document.querySelector('[data-view-title]'))?.focus();
  };
  async function load() {
    try { snapshot = await store.load(); loadFailed = false; }
    catch { loadFailed = true; }
  }
  const selected = () => snapshot.profiles.find(profile => profile.id === snapshot.selectedId);
  function selector() {
    return `${loadFailed ? '<p>Saved profiles could not be loaded. Open Manage local profiles to retry.</p>' : ''}${snapshot.profiles.length ? `<label for="selected-child">Selected child</label><select id="selected-child" ${loadFailed ? 'disabled' : ''}><option value="">Browse without a profile</option>${snapshot.profiles.map(profile => `<option value="${escape(profile.id)}" ${snapshot.selectedId === profile.id ? 'selected' : ''}>${escape(profile.label)}</option>`).join('')}</select>` : ''}
      <p><a href="#/profiles">Manage local profiles</a></p><p id="profile-selection-error" class="form-error" role="alert" tabindex="-1"></p>`;
  }
  function screen() {
    return `<h1 tabindex="-1" data-view-title>Local child profiles</h1><p class="lead">Pick up where you left off with a birth-based age.</p>
      <p>Profiles stay in this browser. People using this browser profile can see them. Clearing site data removes them; another device has its own profiles.</p>
      ${loadFailed ? '<p role="alert">Could not read local profiles. Retry before making changes. Existing records have not been changed.</p>' : ''}<p><button id="retry-profiles" class="clear-button">${loadFailed ? 'Retry loading profiles' : 'Reload profiles'}</button></p>
      ${removing ? `<section class="remove-profile" aria-label="Remove local profile"><h2>Remove ${escape(removing.label)}?</h2><p>This removes this child's profile from this browser. Other children's profiles stay available.</p><button id="confirm-remove" class="primary" ${loadFailed ? 'disabled' : ''}>Remove profile from this browser</button><button id="keep-profile" class="clear-button">Keep profile</button></section>` : ''}
      <div class="browse-layout"><section class="age-panel profile-form-panel"><h2>${editing ? 'Edit child' : 'Add a child'}</h2><p>A nickname is enough. No legal name is needed.</p>
      <form id="profile-form" novalidate><label for="birth-mode">Birth information</label><select id="birth-mode"><option value="date" ${draft.mode === 'date' ? 'selected' : ''}>Exact birth date</option><option value="month" ${draft.mode === 'month' ? 'selected' : ''}>Birth month and year</option></select>
      <label for="profile-label">Display label (optional)</label><input id="profile-label" maxlength="80" autocomplete="off" value="${escape(draft.label)}">
      <label for="profile-birth">${draft.mode === 'month' ? 'Birth month and year' : 'Birth date'}</label><input id="profile-birth" type="${draft.mode}" max="${draft.mode === 'month' ? today().slice(0, 7) : today()}" value="${escape(draft.birth)}">
      ${draft.mode === 'month' ? '<p class="form-help">No day is assumed. The checklist uses the younger possible age.</p>' : ''}
      <p id="profile-error" class="form-error" role="alert" tabindex="-1"></p><button class="primary" ${loadFailed ? 'disabled' : ''}>${editing ? 'Save changes' : 'Create profile'}</button>${editing ? '<button type="button" class="clear-button" id="cancel-edit">Cancel editing</button>' : ''}</form></section>
      <section><h2>Your children</h2><ul class="profile-list" aria-label="Local child profiles">${snapshot.profiles.map(profile => `<li><h3>${escape(profile.label)}</h3><div class="profile-actions"><button class="clear-button" data-use-profile="${escape(profile.id)}" ${loadFailed ? 'disabled' : ''}>Use ${escape(profile.label)}</button><button class="clear-button" data-edit-profile="${escape(profile.id)}" ${loadFailed ? 'disabled' : ''}>Edit</button><button class="clear-button" data-remove-profile="${escape(profile.id)}" ${loadFailed ? 'disabled' : ''}>Remove</button></div></li>`).join('')}</ul>${snapshot.profiles.length ? '' : '<p>No profiles yet. You can also browse with a temporary age.</p>'}<a href="#/">Back to milestones</a></section></div>`;
  }
  async function change(action, errorElement, message, clearDraft = false) {
    if (busy || loadFailed) return;
    busy = true;
    mutationControls().forEach(control => { control.disabled = true; });
    try {
      const before = selected();
      snapshot = await action();
      const after = selected();
      if (clearDraft) { draft = editing ? createDraft : emptyDraft(); editing = null; }
      removing = null;
      onChange(true, before?.id !== after?.id || JSON.stringify(before?.birth) !== JSON.stringify(after?.birth));
    } catch (error) {
      const visibleError = document.querySelector('#profile-error') ?? document.querySelector('#profile-selection-error') ?? errorElement;
      visibleError.textContent = error.code === 'STALE_PROFILE'
        ? 'Another tab changed or removed this profile. Your input is still here. Cancel editing if needed, then reload profiles and open the latest record before retrying.' : message;
      visibleError.focus();
    } finally {
      busy = false;
      mutationControls().forEach(control => { control.disabled = false; });
    }
  }
  function bind() {
    if (busy) mutationControls().forEach(control => { control.disabled = true; });
    document.querySelector('#profile-form')?.addEventListener('input', () => {
      draft = { ...draft, label: document.querySelector('#profile-label').value, birth: document.querySelector('#profile-birth').value };
    });
    document.querySelector('#birth-mode')?.addEventListener('change', event => {
      const mode = event.target.value;
      draft = { ...draft, mode, birth: mode === 'month' ? draft.birth.slice(0, 7) : '' };
      onChange(false, false);
      document.querySelector('#birth-mode').focus();
    });
    document.querySelector('#retry-profiles')?.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      const before = selected();
      await load();
      busy = false;
      const after = selected();
      onChange(false, before?.id !== after?.id || JSON.stringify(before?.birth) !== JSON.stringify(after?.birth));
    });
    document.querySelectorAll('[data-edit-profile]').forEach(button => button.addEventListener('click', () => {
      if (busy) return;
      const profile = snapshot.profiles.find(item => item.id === button.dataset.editProfile);
      if (!editing) createDraft = draft;
      editing = { id: profile.id, revision: profile.revision };
      draft = { label: profile.label, mode: Object.hasOwn(profile.birth, 'day') ? 'date' : 'month',
        birth: `${String(profile.birth.year).padStart(4, '0')}-${String(profile.birth.month).padStart(2, '0')}${Object.hasOwn(profile.birth, 'day') ? `-${String(profile.birth.day).padStart(2, '0')}` : ''}` };
      removing = null;
      onChange(false, false);
      document.querySelector('#birth-mode').focus();
    }));
    document.querySelector('#cancel-edit')?.addEventListener('click', () => {
      const id = editing.id;
      editing = null; draft = createDraft;
      onChange(false, false);
      focusAction('data-edit-profile', id);
    });
    document.querySelectorAll('[data-remove-profile]').forEach(button => button.addEventListener('click', () => {
      if (busy) return;
      const profile = snapshot.profiles.find(item => item.id === button.dataset.removeProfile);
      removing = { id: profile.id, revision: profile.revision, label: profile.label };
      onChange(false, false);
      document.querySelector('#confirm-remove').focus();
    }));
    document.querySelector('#keep-profile')?.addEventListener('click', () => {
      const id = removing.id;
      removing = null;
      onChange(false, false);
      focusAction('data-remove-profile', id);
    });
    document.querySelector('#confirm-remove')?.addEventListener('click', () => {
      change(() => store.remove(removing.id, removing.revision), document.querySelector('#profile-error'),
        'Could not remove this profile. Existing profiles are unchanged. Try again.', editing?.id === removing.id);
    });
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
      const keys = draft.mode === 'month' ? ['year', 'month'] : ['year', 'month', 'day'];
      const birth = Object.fromEntries(keys.map((key, index) => [key, Number(value.split('-')[index])]));
      try {
        if (!(draft.mode === 'month' ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(value)) throw new Error();
        validateBirth(birth);
      } catch {
        error.textContent = draft.mode === 'month' ? 'Enter a valid birth month and year that is not in the future.' : 'Enter a valid birth date that is not in the future.';
        document.querySelector('#profile-birth').focus();
        return;
      }
      const label = document.querySelector('#profile-label').value.trim();
      if (label.length > 80) { error.textContent = 'Use a display label of 80 characters or fewer.'; return; }
      if (editing) change(() => store.update(editing.id, editing.revision, { birth, label }), error,
        'Could not save changes. Your input is still here. Try again.', true);
      else change(() => store.create({ id: crypto.randomUUID(), birth, ...(label ? { label } : {}) }), error,
        'Could not save this profile. Your input is still here. Try again or browse with a temporary age.', true);
    });
  }
  return { load, selected, selector, screen, bind };
}
