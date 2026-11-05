# User Flows — Child Development Milestone Guide

**Status:** Draft for product review  
**Last revised:** 2026-11-04

This file describes intended behaviors, not a final wireframe. Each flow references requirement IDs in [`requirements.md`](requirements.md).

## Flow P1 — First-time parent explores anonymously

**Preconditions:** No saved child profile; parent can reach the application online.

1. Open shared application link.
2. Enter child's age in months (temporary; no registration).
3. App identifies the appropriate published CDC checkpoint.
4. View compact behavior checklist grouped by parent-friendly developmental categories.
5. Select a behavior.
6. Read concise explanation and everyday examples.
7. See related curated activities immediately, in editorial order; optionally open a full activity or external demonstration.
8. Expand source/context details if needed.

**Expected outcome:** Useful milestone and activity guidance without creating an account or providing identifiable child details.

**Related requirements:** FR-001, FR-002, FR-003, FR-004, FR-006.

**Open:** Rule for mapping an age between CDC checkpoints.

## Flow P2 — Returning parent with local child profile

**Preconditions:** At least one locally saved child profile.

1. Open application.
2. Select child if multiple profiles exist; otherwise use current local profile.
3. Age is calculated or read according to the parent's chosen age-entry method.
4. Show age-appropriate CDC checkpoint and behavior categories.
5. Parent follows the P1 detail/activity path.

**Expected outcome:** No repeated age entry unless the chosen manual age is outdated or changed.

**Related requirements:** FR-001, FR-002, FR-009.

## Flow P3 — Save a behavior or activity

1. While browsing milestone detail or activity detail, select Favorite.
2. App saves the reference locally for the selected child.
3. Parent may return to saved behaviors and activities later.
4. If a published resource is revised, the favorite continues pointing to the same stable content identity or receives a clearly managed migration/retirement state.

**Expected outcome:** Easy return to relevant content without automated recommendation or diagnosis.

**Related requirements:** FR-003, FR-007, FR-012.

**Open:** Whether favorites are child-specific or additionally support device-global favorites; assumed child-specific for now.

## Flow P4 — Practice and log an activity

1. Parent opens an activity from a milestone or the standalone library.
2. Read materials and essential instructions; expand additional steps, safety or external video if desired.
3. Practice with child.
4. Choose Log attempt/completion (exact label pending).
5. Date defaults to today; parent may edit.
6. Optionally record difficulty (**Easy / Moderate / Difficult**) and free-text notes.
7. Save locally.

**Expected outcome:** Parent can remember past practice without the application inferring developmental achievement.

**Related requirements:** FR-006, FR-007, FR-009.

**Open:** Whether 'attempted' vs 'completed' is a required field or a single action label; should be settled in UX design.

## Flow P5 — Review activity history

1. Parent opens an activity for the selected child.
2. Select History or view the existing history section.
3. Review dated attempts, optional difficulty ratings and notes.
4. Optionally view a small difficulty trend when meaningful data exists.

**Expected outcome:** A parent can recall personal observations about this activity; the app does not score, compare, or evaluate the child.

**Related requirements:** FR-008.

## Flow P6 — Find activities directly

1. Parent opens the standalone activity library.
2. Search by keyword or filter by age, developmental skill/category, duration, materials, or indoor/outdoor setting.
3. Open an activity, review instructions and source/media links.
4. Optionally favorite or log an attempt.

**Expected outcome:** Browsing without needing to select a specific milestone first.

**Related requirements:** FR-004, FR-005, FR-006, FR-007.

## Flow P7 — Offline revisit

**Preconditions:** Parent previously visited relevant content while online and local browser storage has not been cleared.

1. Parent opens app without connectivity.
2. Previously cached milestone/activity views remain available.
3. Parent accesses local profiles, favorites and activity histories.
4. Parent can add a new activity log entry locally.
5. Uncached or external content shows an informative offline state.
6. When online again, approved content may refresh with a meaningful update notification.

**Expected outcome:** Partial offline usefulness without manual downloads or cloud synchronization.

**Related requirements:** FR-009, FR-011, FR-012.

## Flow P8 — Backup and restore

1. Parent opens local data management/settings.
2. Select Export backup; app produces a versioned file containing personal records.
3. Parent stores file independently.
4. On the same or replacement device, select Import backup.
5. App validates content, previews impact and warns about replacement of existing data.
6. Confirm import; existing compatible references are restored.

**Expected outcome:** Manual recovery and device migration without user accounts or automatic merging.

**Related requirements:** FR-010.

**Open:** Encryption and whether partial import/merge should be supported (not an MVP requirement).

## Flow E1 — Editor publishes approved content

**Actor:** Authorized editor; not a parent user.

1. Open separate private content management workflow.
2. Create/edit a milestone, activity, source, video link, skill mapping, or activity display priority.
3. Validate required fields, provenance and relationships.
4. Publish updated catalog to the content delivery location.
5. Parent apps check for changes when connected and display revised catalog with change notice.
6. Existing personal history remains unchanged and attached to stable IDs.

**Expected outcome:** Admin content can evolve without accessing any parent's local records.

**Related requirements:** FR-013, FR-012; [`content-policy.md`](content-policy.md).

**Open:** Editor UI choice, validation tooling, and deployment host.

## Important non-flows

The application does **not** automatically identify a child's weak areas, assign developmental priorities, generate activities, grade milestone achievement, issue recurring practice reminders, or synchronize parent records across devices. Parents choose where to focus.
