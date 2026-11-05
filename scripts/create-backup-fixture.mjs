// Synthetic compatibility vector. Fixed salt/IV must never be used for real exports.
import { pbkdf2Sync, createCipheriv } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const payload = { schemaVersion: 1,
  profiles: [{ id: 'fixture-child', birth: { year: 2025, month: 6 }, label: 'Fixture child', revision: 1 }],
  favorites: [{ childId: 'fixture-child', type: 'activity', contentId: 'missing-activity', label: 'Archived play' }],
  practice: [{ id: 'fixture-session', childId: 'fixture-child', activityId: 'missing-activity', activityRevision: 1,
    activityTitle: 'Archived play', practiceDate: '2026-01-02', difficulty: 'Easy', notes: '<b>Synthetic note</b>' }] };
const salt = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
const iv = Buffer.from('101112131415161718191a1b', 'hex');
const key = pbkdf2Sync('fixture password', salt, 600000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(Buffer.from('milestone-guide-backup:1'));
const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final(), cipher.getAuthTag()]);
await writeFile(new URL('../fixtures/backup-v1.json', import.meta.url), JSON.stringify({
  format: 'milestone-guide-backup', version: 1, suite: 'PBKDF2-SHA256-AES256-GCM', iterations: 600000,
  salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: encrypted.toString('base64'),
}, null, 2) + '\n');
