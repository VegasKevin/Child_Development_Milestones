# Local storage and recovery

Status — platform-neutral MVP draft. See [data model](data-model.md) and [interfaces](interfaces.md).

**LS-001 — Separate stores** (FR-009–012, DM-001). Persist child profiles, favorites and practice entries separately from cached guide content and access state. Catalog refresh and eviction never delete personal records. Save each personal mutation atomically and report success only after it persists. If storage is unavailable or full, show a recoverable error and keep unsaved input available while the screen is open. Explain that clearing site data or switching devices can remove access to local records.

**LS-002 — Offline use** (FR-011, DEC-010). After successful caching, the app can reopen previously viewed milestone and activity essentials, including relevant safety instructions, without a connection while authorization remains valid. Favorites and history remain locally readable, and practice entries can be saved offline. Mark missing catalog content and external resources as requiring connectivity. A known revocation or expired offline window blocks cached guide content, including direct links. Keep the local data export route available. For the proof of concept, apply the proposed export-only behavior and adult record isolation in the [handoff defaults](coding-handoff.md#engineering-defaults-for-the-first-pass).

**LS-003 — Backup creation** (FR-010, DEC-008, DM-007). Export a consistent snapshot of the three personal collections. Encrypt locally with authenticated encryption and a password-derived key using a reviewed implementation. Use a versioned envelope with the parameters needed to derive the key and decrypt the file. Use fresh randomness for each export. Keep the password out of persisted app state and the file. Explain that losing the password prevents recovery. Final envelope encoding, encryption suite and compatibility fixtures must be specified before implementation.

**LS-004 — Restore and upgrades** (FR-010, P8, DM-007). Decrypt and validate locally. Check integrity, version compatibility, record shape, child references and uniqueness before showing a preview with counts and unresolved catalog references. On confirmation, atomically replace personal records. Cancellation, validation failure or a failed write preserves the prior records. Use the same validation rules for schema upgrades. Opening newer unsupported data must leave it intact.

**LS-005 — Data handling** (FR-009, NFR-003). Keep child data and backup contents out of network requests, URLs, telemetry, diagnostics and editor tools. Treat free-text notes as text on rendering. Keep invitation credentials outside personal backups. During deployment evaluation, test local storage isolation on shared browsers and establish whether multiple invited people can safely use the same browser profile.

## Backup format v1

The local guide uses browser Web Crypto PBKDF2 with SHA-256, 600,000 iterations, a fresh 16-byte salt, and AES-256-GCM with a fresh 12-byte IV and a 128-bit authentication tag.
The UTF-8 password is used exactly as entered, without normalization or trimming.
The authenticated additional data is the UTF-8 string `milestone-guide-backup:1`.
The JSON envelope has exactly `format` (`milestone-guide-backup`), `version` (1), `suite` (`PBKDF2-SHA256-AES256-GCM`), `iterations` (600000), `salt`, `iv`, and `ciphertext`.
Binary fields use canonical padded base64; ciphertext includes the appended GCM tag.
Unknown envelope versions, suites, fields or parameters are rejected before key derivation.
The decrypted JSON has exactly `schemaVersion` (1), `profiles`, `favorites`, and `practice`.
Each collection contains the current local record shapes; record IDs, typed favorites, child references, dates and uniqueness are validated before preview.
Catalog content, selection, temporary age, invitation state and passwords are excluded.
Restore supports v1 only, preserves unresolved content references, and replaces all three collections and clears selection in one IndexedDB transaction after explicit confirmation.
Unsupported future versions are preserved by rejecting import rather than guessing a migration.
Files are limited to 10 MiB, exported plaintext to 5 MiB, and each collection to 10,000 records.
The compatibility fixture uses synthetic records and fixed randomness solely as a known-answer test, produced independently with Node crypto.
Production exports always generate fresh randomness.
Web Crypto usage follows the [deriveKey documentation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey) and [AES-GCM parameters](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams).

## Acceptance cases

| Case | Expected result |
| --- | --- |
| LS-A01 · Reopen offline after caching | A valid offline authorization permits viewing cached essentials and saving a practice entry that survives a restart. |
| LS-A02 · Authorization expires offline | Guide routes block cached content. Local encrypted export remains available. |
| LS-A03 · Interrupted restore | All previous records remain available. No subset of the backup is applied. |
| LS-A04 · Wrong password or modified backup | Restore fails before mutation. |
| LS-A05 · Restore on another device | Profiles, favorites and practice entries transfer. Guide access requires separate email verification. |
| LS-A06 · Catalog refresh fails while personal data exists | Personal records remain intact and the last valid cached guide remains available while authorized. |
