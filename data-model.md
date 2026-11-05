# Data model

Status — MVP specification draft. The proposed defaults below need product review. The contracts are logical and can be implemented on either deployment candidate.

The product baseline is vision.md, requirements.md, user-flows.md, and content-policy.md. Where the baseline differs from a confirmed choice, follow the [interview decisions](architecture-interview-decisions.md). Requirement IDs below are stable within this spec.

## Data boundaries

**DM-001 — Ownership** (FR-009–013, NFR-002–003, DEC-008–011, DEC-013)

- The technical maintainer edits structured drafts privately. The parent app reads approved catalog releases and maintains a local cache. Catalog publication never reads or writes parent records.
- Child profiles, favorites and practice entries are device-local. They are included in the encrypted manual backup. Published catalog content, cached assets, temporary ages, email addresses and access credentials are excluded.
- The access service owns the invited email and its authorization state. Each device verifies the email without a password. The local authorization state must distinguish valid, expired and revoked access. Offline guide access expires seven days after the most recent successful online authorization check. Once a revocation is known, block guide access immediately. Local backup export remains available when guide access ends.

## Published catalog

**DM-002 — Logical records** (FR-002–006, FR-012–014, DEC-006, DEC-012–013)

Fields are required unless marked optional. IDs are opaque, immutable strings. References are typed IDs. Dates use calendar dates unless specified as instants. Localizable content belongs to its entity and language, with English required for MVP and IDs shared across languages.

| Record | Fields and constraints |
| --- | --- |
| Catalog release | Schema version, immutable release ID, publication instant, human-readable change summary, and a coherent set of records. |
| Source reference | ID, title, organization, original URL, edition or reference date for CDC material, review date, and attribution or reuse information where applicable. An optional locator identifies a specific source passage. |
| Checkpoint | ID, unique age in whole months, display label and CDC source reference. |
| Milestone | ID, revision, checkpoint ID, original CDC category, source-backed behavior statement and CDC source reference, one primary navigation category, explanation, examples and reviewed references. Optional reviewed skill IDs. Source wording and authored copy are distinguishable. |
| Navigation category and skill | Each has its own ID and label. A category groups milestone navigation. A skill describes a capability used for discovery. |
| Activity | ID, revision, title, suitability, materials (may be empty), essential instructions, reviewed source references and review date. Optional approved skill IDs, duration, setting, extra steps, variations, observation cues and external resources. Safety warnings are required where applicable. |
| External resource | ID, title, provider, original URL and review date. A reviewed association identifies the milestone or activity on which the link is displayed. |
| Milestone activity link | Milestone ID, activity ID, review date and editorial position. The pair is unique and the position is unique within the milestone. |

**DM-003 — Publication invariants** (FR-004–006, FR-012–013, DEC-006, DEC-012–013)

- Every active activity has at least one direct, reviewed link to an active CDC milestone. Skill overlap alone never creates a link. Validate each link against the activity suitability and reject dangling references or duplicate positions.
- Proposed suitability representation is either an inclusive range of whole months or a set of checkpoint IDs. A link is valid when its checkpoint age falls within the range or its checkpoint ID is in the set. In the library, exact age queries match age ranges directly and use the selected checkpoint for checkpoint-based suitability. For approximate ages, use the selected checkpoint for checkpoint-based suitability and require the entire plausible age range to fit a month range before including the activity in age-filtered results. Missing optional metadata does not match a filter on that field.
- Launch requires the complete approved CDC checklist set and at least one approved linked activity at each checkpoint. Individual behaviors may have empty activity lists. Post-launch safety withdrawals can leave a checkpoint empty. If a change removes the last qualifying link, publish a reviewed replacement link or retire the activity in the same release.
- Record the actual CDC edition or reference date and verify reuse rights before publication. The seed checklist editions remain an editorial selection. [CDC checklist inventory](https://www.cdc.gov/act-early/resources/milestones-checklist-by-age.html)

## Age and checkpoint selection

**DM-004 — Age inputs and lookup** (FR-001–002, P1–P2, DEC-001, DEC-003–005, DEC-014)

1. Store a saved profile's birth information as exactly one of an exact calendar date or a year and month. Reject impossible or wholly future birth inputs. Derive age using the device-local calendar date. A temporary age is a nonnegative integer in months. While active, it takes precedence for browsing and never changes the saved profile or the child associated with a save.
2. For an exact date, use completed calendar months. Proposed arithmetic uses the birth day in the target month, clamped to that month's last day. For month/year, consider every possible birth date in the month through today and use the resulting minimum and maximum age. Display that age as approximate.
3. Select the greatest published checkpoint age less than or equal to the effective age. For an approximate age, use the lower bound to select the default. If the upper bound reaches the next checkpoint, offer a labeled preview. Below two months, show the coverage message and offer a labeled two-month preview. A preview leaves the effective age unchanged. [CDC guidance for ages between checklists](https://www.cdc.gov/act-early/digital-online-checklist/2-month.html)
4. Proposed upper boundary is the sixth birthday. Use the five-year checklist at 60–71 completed months. At 72 months and above, show an outside-coverage state and keep local history accessible. The upper boundary is a product scope decision. It does not add a CDC checkpoint.

## Local records and lifecycle

**DM-005 — Personal records** (FR-007–010, P3–P5, DEC-002–004, DEC-008, DEC-014)

| Record | Fields and constraints |
| --- | --- |
| Child profile | ID, birth input and optional local display label. No legal name, photo, gender or medical history is required. |
| Favorite | Child ID, content type (milestone or activity), content ID, and short display label captured on save. Unique by child, type and content ID. |
| Practice entry | ID, child ID, activity ID, activity revision, activity title captured on save, practice date, optional difficulty (Easy, Moderate or Difficult), and optional notes. Two sessions can have the same date. |

Creating a favorite or practice entry requires a selected local child. An invited browser without a child profile can create or select one before saving. Proposed behavior preserves the pending action during that transition. History is scoped by child and activity, ordered by practice date, with entry ID as a deterministic tie-breaker. A practice entry describes a session and carries no completion or milestone achievement state.

**DM-006 — Identity and withdrawal** (FR-007–008, FR-012, NFR-002, DEC-007)

- Preserve IDs for revisions that keep the same meaning. Increment the revision when a milestone or activity changes. Proposed rule for a changed checkpoint, materially different CDC behavior, or materially different activity instructions is to issue a new ID and retire the prior one. Never reuse a retired ID or silently retarget a favorite or practice entry.
- Keep a minimal catalog record for retired identities with ID, type, label and disposition. Safety withdrawals remove the item from discovery and suppress its instructions and links after the release is applied, including from cached views. Keep the favorite visible as Withdrawn and preserve history. A withdrawn item cannot be used to start a new practice entry.
- Validate a complete catalog update before making it active. A failed or interrupted update leaves the last valid release available subject to guide authorization. Applying a release never rewrites parent records.

**DM-007 — Backup and unresolved references** (FR-010, FR-012, P8, DEC-008)

- Use a versioned encrypted envelope with a password and integrity verification. Its decrypted payload contains the three personal record collections and their schema version. Password loss prevents recovery from that file. The encryption format and compatibility policy belong in the local-storage spec.
- Before replacing records, verify integrity, validate or migrate a supported schema, validate child references and uniqueness, and preview the replacement. Apply replacement as one operation after confirmation. A wrong password, invalid record, unsupported schema or failed write leaves the existing records intact.
- A missing catalog ID does not invalidate a backup. Keep the typed reference and saved label. Mark it unavailable until a catalog resolves it. If the catalog resolves it as withdrawn, apply DM-006.

## Acceptance cases

| Case | Expected behavior |
| --- | --- |
| DM-A01 · Ages 1, 6 and 7 months | At 1 month show coverage and the optional two-month preview. At 6 and 7 months select the six-month checklist. |
| DM-A02 · Birth month May, as of November 15 | Approximate age spans five and six completed months. Open the four-month checklist by default and offer a labeled six-month preview. |
| DM-A03 · Corrected-age override for a selected child | A temporary six-month entry changes the checklist. A practice entry still belongs to the selected child. A fresh browsing session uses birth-derived age. |
| DM-A04 · Shared activity across two milestones | Each detail view uses its own editorial order. Removing the activity's final link while leaving it active fails publication validation. |
| DM-A05 · Safety withdrawal after offline caching | After the withdrawal release is applied, cached instructions and links are hidden. The favorite is marked Withdrawn and dated notes remain accessible. |
| DM-A06 · Restore with a missing catalog item | Preview the unresolved reference, then retain it with its saved label after confirmation. An invalid backup leaves all existing data intact. |
| DM-A07 · Offline access expires | At seven days after the last successful online access check, cached guide content is blocked and local backup export remains available. |
| DM-A08 · Proposed age arithmetic and upper boundary | A January 31 birth reaches one completed month on February 28 in a non-leap year. At 71 months show the five-year checklist. At 72 months show outside coverage and retain history. |
