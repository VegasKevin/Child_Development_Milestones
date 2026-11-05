import { browseChecklists } from './age-browsing.js';

export function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validateBirth(birth, today = localDate()) {
  if (!birth || typeof birth !== 'object' || Array.isArray(birth) ||
      Object.keys(birth).some(key => !['year', 'month', 'day'].includes(key))) throw new Error('Unsupported birth information');
  browseChecklists({ profile: { birth }, today }, []);
}

export function validateStoredProfile(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile) ||
      Object.keys(profile).sort().join(',') !== 'birth,id,label,revision' ||
      typeof profile.id !== 'string' || !profile.id || profile.id.length > 80 ||
      typeof profile.label !== 'string' || !profile.label.trim() || profile.label !== profile.label.trim() || profile.label.length > 80 ||
      !Number.isSafeInteger(profile.revision) || profile.revision < 1) throw new Error('Unsupported profile data');
  // A device clock correction must not make a previously valid record unreadable.
  validateBirth(profile.birth, '9999-12-31');
}
