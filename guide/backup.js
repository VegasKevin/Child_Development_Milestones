import { encryptBackup, decryptBackup, maxBackupBytes } from '/src/backup.js';
import { backupStore } from './backup-store.js';
import { escape } from './profiles.js';

export function backupController(onRestore, resolves) {
  const store = backupStore('local-demo');
  function screen() {
    return `<h1 tabindex="-1" data-view-title>Backup and restore</h1><p class="lead">Keep a private copy of your children's saved records.</p>
      <p>Backups include all local profiles, favorites and practice entries. Clearing browser data can remove the originals. Store your backup somewhere you can find it on another device.</p>
      <div id="backup-panel"><p role="alert" id="backup-error"></p><p role="status" id="backup-status"></p>
      <section class="backup-section"><h2>Export a backup</h2><p>Losing the password prevents recovery from this file. Choose a strong password and keep it somewhere safe.</p>
      <form id="backup-export" class="practice-form"><label for="backup-password">Backup password</label><input id="backup-password" type="password" required maxlength="1024" autocomplete="new-password">
      <button class="primary">Export encrypted backup</button></form></section>
      <section class="backup-section"><h2>Restore a backup</h2><p>Open a backup to review it before replacing this browser's records.</p>
      <form id="backup-import" class="practice-form"><label for="backup-file">Backup file</label><input id="backup-file" type="file" accept=".json,application/json" required>
      <label for="restore-password">Restore password</label><input id="restore-password" type="password" required maxlength="1024" autocomplete="off"><button class="primary">Preview restore</button></form>
      <div id="restore-preview"></div></section></div>`;
  }
  function bind() {
    const panel = document.querySelector('#backup-panel');
    if (!panel) return;
    const error = panel.querySelector('#backup-error'), status = panel.querySelector('#backup-status');
    const preview = panel.querySelector('#restore-preview');
    let candidate = null, baseline = null, busy = false;
    function discard() { candidate = null; baseline = null; preview.innerHTML = ''; }
    async function run(action, message) {
      if (busy) return;
      busy = true;
      error.textContent = ''; status.textContent = 'Working locally...';
      panel.querySelectorAll('input, button').forEach(control => { control.disabled = true; });
      try { await action(); }
      catch (failure) {
        if (failure.code === 'STALE_BACKUP') {
          discard();
          error.textContent = 'Local records changed after the preview. Preview the backup again to review the replacement before confirming.';
        } else error.textContent = message;
        status.textContent = '';
      }
      finally { busy = false; panel.querySelectorAll('input, button').forEach(control => { control.disabled = false; }); }
    }
    panel.querySelector('#backup-export').addEventListener('submit', event => {
      event.preventDefault();
      run(async () => {
        const text = await encryptBackup(await store.snapshot(), panel.querySelector('#backup-password').value);
        if (!panel.isConnected) return;
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = 'milestone-guide-backup.json'; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        panel.querySelector('#backup-password').value = '';
        status.textContent = 'Encrypted backup prepared. Keep the downloaded file and its password safe.';
      }, 'Could not export a backup. Existing records are unchanged. Retry with a password and available local storage.');
    });
    panel.querySelector('#backup-import').addEventListener('input', discard);
    panel.querySelector('#backup-import').addEventListener('submit', event => {
      event.preventDefault(); discard();
      run(async () => {
        const file = panel.querySelector('#backup-file').files[0];
        if (!file || file.size > maxBackupBytes) throw new Error('Invalid file.');
        const data = await decryptBackup(await file.text(), panel.querySelector('#restore-password').value);
        const current = await store.snapshot();
        if (!panel.isConnected) return;
        candidate = data;
        baseline = current;
        panel.querySelector('#restore-password').value = '';
        const unresolved = [...data.favorites.filter(item => !resolves(item.type, item.contentId)),
          ...data.practice.filter(item => !resolves('activity', item.activityId)).map(item => ({ label: item.activityTitle }))];
        preview.innerHTML = `<section class="remove-profile"><h3 tabindex="-1">Review replacement</h3><p>${data.profiles.length} profiles, ${data.favorites.length} favorites, ${data.practice.length} practice entries</p>
          <p>This replaces all existing personal records in this browser. There is no merge. Your current records will be removed.</p><p>Currently on this device: ${current.profiles.length} profiles, ${current.favorites.length} favorites, ${current.practice.length} practice entries.</p>
          ${unresolved.length ? `<p>${unresolved.length} unresolved catalog references will be kept with their saved labels:</p><ul>${unresolved.map(item => `<li>${escape(item.label)}</li>`).join('')}</ul>` : '<p>All content references resolve in this catalog.</p>'}
          <button id="restore-confirm" class="primary">Replace local records</button><button id="restore-cancel" class="clear-button">Cancel restore</button></section>`;
        status.textContent = 'Backup validated. Review before replacing records.';
        preview.querySelector('h3').focus();
        preview.querySelector('#restore-cancel').addEventListener('click', () => { discard(); status.textContent = 'Restore canceled. Existing records are unchanged.'; panel.querySelector('#backup-file').focus(); });
        preview.querySelector('#restore-confirm').addEventListener('click', () => run(async () => {
          await store.replace(candidate, baseline);
          discard();
          await onRestore();
          status.textContent = 'Restored personal records. Select a child from Profiles to continue.';
        }, 'Could not restore records. Existing records are unchanged. Retry the replacement.'));
      }, 'Could not open this backup. Check the password and use an intact supported backup file. Existing records are unchanged.');
    });
  }
  return { screen, bind };
}
