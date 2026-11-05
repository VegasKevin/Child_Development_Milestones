# First milestone verification

Run `npm.cmd test` on Windows or `npm test` elsewhere with Node.js 22.8 or later.
Run `npm.cmd run check` (or `npm run check`) for a small integrated synthetic demonstration.
The test runner uses the current process so it can run in environments that restrict child processes.
No dependencies or installation are required.

## Public boundaries

- `selectChecklist(ageMonths, publishedChecklists)` selects the greatest published checkpoint at or below an exact age.
- `browseChecklists({ profile, today, temporaryAgeMonths }, checkpoints)` derives age, selects the default and offers labeled previews.
- `validateCatalog(release, options)` validates a complete English catalog snapshot before activation.
- `linkedActivities(release, milestoneId)` reads per-milestone editorial order from a validated release.
- `createCatalogStore(release, options)` owns an isolated in-memory snapshot, resolves references and validates updates before activation.

Birth inputs are `{ year, month, day }` or `{ year, month }` in `profile.birth`.
Supply `today` as the device-local `YYYY-MM-DD` date, rather than a UTC timestamp.
Temporary age is invocation-local and never changes the saved profile or selected child.
Omitting it in a fresh invocation restores birth-derived age.
Coverage is below two months and outside the guide at 72 months, using the handoff defaults for clamped month-end arithmetic.

Catalog fields and typed foreign keys are illustrated in [the synthetic fixtures](../fixtures/synthetic-catalogs.js).
Text fields represent English content in this first schema.
Source statements and authored explanations remain separate.
`sourceIds` and `externalResourceIds` are reviewed associations to dated source and resource records.
Suitability is either `{ minMonths, maxMonths }` (inclusive) or `{ checkpointIds }`.
An empty `safetyWarnings` array explicitly means no applicable warnings in the fixture.
Active entities live in their respective collections; retired identities live only in minimal typed tombstones.
Launch validation requires `{ launch: true, expectedCheckpointAges }` with an explicitly supplied approved inventory.
The fixture inventory is an intentionally incomplete synthetic subset, not the approved CDC checklist set.
Its launch-mode checks demonstrate the validation mechanism only.
Real content, edition selection, reuse rights and human approval remain prerequisites for production publication.

Call `store.resolve({ type, contentId, label })` for a favorite or an adapted practice reference.
For a practice entry, use `type: 'activity'`, `contentId: entry.activityId`, and `label: entry.activityTitle`.
Results distinguish `active`, `retired`, `withdrawn`, and `unavailable`.
Unknown IDs retain the saved label and never match by title.
Returned content is copied; current reads after withdrawal return no instructions and no withdrawn links.
Consumers must resolve saved or cached references against the current store on every render, rather than rendering old content objects directly.
The store cannot revoke an object already copied into a caller's memory.

`store.apply(nextRelease)` validates a complete update and identity continuity before switching snapshots.
Failures leave the active snapshot unchanged.
Release IDs are immutable, tombstones persist, retired IDs cannot be reused, and changed entities require an incremented revision.
A changed checkpoint requires a new milestone ID.
Changed source wording or instructions default to requiring a new ID and retirement because code cannot infer semantic equivalence.
An editorial declaration via `store.apply(nextRelease, { equivalentEdits: [{ type, id }] })` permits explicitly reviewed same-meaning prose revisions under the same ID.
This declaration does not bypass revision, checkpoint, withdrawal or structural validation.
The store does not provide human approval or a publication service.

`store.createPracticeEntry(browseContext, activityId, details)` creates a local record value for an active activity and selected child.
Details contain an entry `id`, `practiceDate`, optional `notes` and optional `difficulty`.
The result captures the current activity revision and title and excludes temporary browsing age.
No persistence is performed and catalog updates never receive or rewrite personal records.

## Acceptance evidence

| Case | Exercised boundary |
| --- | --- |
| DM-A01 | One-month coverage and optional preview; six- and seven-month selection. |
| DM-A02 | May birth month on November 15 produces ages five to six, four-month default and six-month preview. |
| DM-A03 | Corrected age changes selection, practice entry retains selected child, fresh browsing uses birth-derived age. |
| DM-A04 | Shared activity has independent detail ordering; removing its final direct link fails validation despite skill overlap. |
| DM-A08 | January 31 clamp, leap years, five-year selection at 71 months, outside coverage at 72 with history retained. |

Additional DM-002/003/006 tests cover malformed records, typed dangling references, suitability, launch coverage, immutable releases, revision continuity, retirement, saved labels, defensive copies and failed/interrupted-update preparation.
The second synthetic release withdraws the shared activity and leaves its favorite reference and dated notes intact while suppressing current instructions and links.
This exercises the platform-neutral part of DM-A05; persistent offline-cache and browser rendering checks remain future work.

Persistent storage, backups, access authorization, library search/filtering and hosting evaluation are outside this first milestone.
The checks above exercise the closest runnable platform-neutral boundaries.
The separate [local guide browser suite](../guide/README.md) exercises the implemented age-to-activity flow with synthetic content using `npm.cmd run test:e2e`.
It requires the locked Playwright development dependency and installed Google Chrome.
