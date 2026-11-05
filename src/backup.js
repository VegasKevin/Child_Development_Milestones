import { validateStoredProfile } from './child-profiles.js';
import { validateReference, validatePracticeEntry } from './personal-records.js';

export const maxBackupBytes = 10 * 1024 * 1024;
const encoder = new TextEncoder();
const aad = encoder.encode('milestone-guide-backup:1');
function shape(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join(',') !== keys.slice().sort().join(',')) throw new Error('Unsupported backup shape.');
}
export function validateBackup(data) {
  shape(data, ['schemaVersion', 'profiles', 'favorites', 'practice']);
  if (data.schemaVersion !== 1) throw new Error('Unsupported personal record version.');
  for (const key of ['profiles', 'favorites', 'practice']) {
    if (!Array.isArray(data[key]) || data[key].length > 10000) throw new Error('Invalid collection.');
  }
  const children = new Set();
  for (const profile of data.profiles) {
    validateStoredProfile(profile);
    if (children.has(profile.id)) throw new Error('Duplicate child.');
    children.add(profile.id);
  }
  for (const [collection, validate, key] of [
    [data.favorites, validateReference, item => JSON.stringify([item.childId, item.type, item.contentId])],
    [data.practice, validatePracticeEntry, item => item.id],
  ]) {
    const ids = new Set();
    for (const item of collection) {
      validate(item);
      if (!children.has(item.childId) || ids.has(key(item))) throw new Error('Invalid child reference or duplicate record.');
      ids.add(key(item));
    }
  }
  return data;
}
function base64(bytes) {
  let text = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) text += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(text);
}
function binary(text, length) {
  if (typeof text !== 'string' || text.length > maxBackupBytes || text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error('Invalid encoding.');
  const bytes = Uint8Array.from(atob(text), char => char.charCodeAt(0));
  if (base64(bytes) !== text || (length && bytes.length !== length)) throw new Error('Invalid encoding.');
  return bytes;
}
async function key(password, salt) {
  if (typeof password !== 'string' || !password.length || password.length > 1024) throw new Error('Enter a password of 1 to 1024 characters.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptBackup(data, password) {
  const plain = encoder.encode(JSON.stringify(validateBackup(data)));
  if (plain.length > maxBackupBytes / 2) throw new Error('Backup exceeds the supported size.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, await key(password, salt), plain);
  return JSON.stringify({ format: 'milestone-guide-backup', version: 1, suite: 'PBKDF2-SHA256-AES256-GCM', iterations: 600000,
    salt: base64(salt), iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext)) });
}
export async function decryptBackup(text, password) {
  if (typeof text !== 'string' || encoder.encode(text).length > maxBackupBytes) throw new Error('Backup exceeds the supported size.');
  const envelope = JSON.parse(text);
  shape(envelope, ['format', 'version', 'suite', 'iterations', 'salt', 'iv', 'ciphertext']);
  if (envelope.format !== 'milestone-guide-backup' || envelope.version !== 1 || envelope.suite !== 'PBKDF2-SHA256-AES256-GCM' || envelope.iterations !== 600000) throw new Error('Unsupported backup format.');
  const salt = binary(envelope.salt, 16), iv = binary(envelope.iv, 12), ciphertext = binary(envelope.ciphertext);
  if (ciphertext.length < 16) throw new Error('Invalid ciphertext.');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, await key(password, salt), ciphertext);
  return validateBackup(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain)));
}
