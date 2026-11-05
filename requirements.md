# MVP Requirements — Child Development Milestone Guide

**Status:** Draft for product review  
**Last revised:** 2026-11-04  
**Priority convention:** `MUST` = MVP requirement; `SHOULD` = intended but can be refined; `FUTURE` = explicitly deferred.  
**Decision convention:** **Confirmed** = explicitly selected in interview; **Proposed** = design recommendation awaiting acceptance; **Open** = not resolved.

## 1. Scope and terminology

- **Milestone behavior:** A CDC-defined observable behavior associated with an official developmental age checkpoint.
- **Age checkpoint:** The CDC-published grouping used for developmental guidance. The app must not invent a distinct milestone list for every month.
- **Developmental category:** A parent-friendly navigation grouping, while maintaining the original CDC category and provenance.
- **Activity:** A human-curated, source-referenced activity intended to help parents practice a relevant skill, *not* a validated test of milestone attainment.
- **Personal record:** Data the parent enters on their device, including profiles, favorites, observations and activity logs.

## 2. Functional requirements

### FR-001 — Determine child's age [MUST | Confirmed]

The application MUST use a saved local child profile's age when available, or allow a temporary age entry without registration. Profiles MUST permit exact birth date, month/year, or manually entered age in months. A parent MUST be able to manage multiple local child profiles.

**Acceptance criteria**
- An anonymous visitor can enter age and browse without creating a profile.
- A returning parent can select a saved child and see age-relevant content.
- No legal name, gender, photo, or medical history is required.
- If age is approximate or manual, the interface does not imply day-level precision.

### FR-002 — Age-specific milestone overview [MUST | Confirmed]

The app MUST show the applicable CDC milestone checkpoint as a compact list of behaviors grouped by parent-friendly developmental categories, including communication, cognitive, social/emotional, and physical/motor subdivisions where supported by the mapping. All CDC checkpoint ages in the 0–5 scope MUST be covered in the curated catalog.

**Acceptance criteria**
- A parent can see expected behaviors for the child's applicable CDC checkpoint.
- Behavior statements are concise and selectable.
- The underlying CDC checkpoint and original category remain traceable.
- No interpolated milestones are invented for months without a published CDC checkpoint.
- No completion percentage, diagnostic status, or automatic developmental classification is shown.

**Open:** Explicit selection rule for ages between CDC checkpoints; must be set and reviewed against CDC guidance.

### FR-003 — Milestone detail [MUST | Confirmed]

Selecting a behavior MUST display its explanation, practical examples, reviewed references, and related curated activities immediately. Extended context and source detail MUST be available through progressive disclosure. Parents MUST be able to favorite a behavior.

**Acceptance criteria**
- Related activities are visible without opening a separate activity tab.
- References are attributable and open the original source where possible.
- Additional detail does not obstruct the essential description and activities.
- The UI does not present the behavior as a diagnostic test.

### FR-004 — Activity library and relationships [MUST | Confirmed]

The app MUST include a human-curated activity library. Each activity MUST be associated with one or more reviewed developmental skills and/or milestone behaviors. Activities MUST appear both contextually within milestone details and in a standalone library. One activity MAY support multiple milestones and skills.

**Acceptance criteria**
- An activity may be reached from a linked milestone and from standalone browsing.
- Milestone-specific display order is determined by editors, not AI.
- No runtime AI creates activities, assigns relationships, or ranks results.
- Initial milestone catalog is complete; activity coverage may be intentionally limited.

### FR-005 — Standalone activity discovery [MUST | Confirmed]

The activity library MUST allow keyword search and practical filtering by child's age, developmental skill/category, duration, materials, and indoor/outdoor setting, where the curated metadata exists.

**Acceptance criteria**
- A parent can filter results without first selecting a milestone.
- Contextual milestone pages do not require filtering to reveal linked activities.
- Filter options only use editor-approved metadata.

### FR-006 — Activity detail [MUST | Confirmed]

Each activity MUST offer concise instructions and materials up front, with optional expanded steps, what to observe, approved variations, safety notes, sources, and links to external instructional videos/resources. Images MAY be attached where useful. Video hosting and embedding are not required.

**Acceptance criteria**
- Every published activity has an age/suitability indication, instructions, and source attribution.
- Relevant safety warnings are visible, without a generic warning being required on every activity.
- Links to instructional demonstrations open the original external provider.
- External video content is not claimed to be available offline.

### FR-007 — Favorites and parent observations [MUST | Confirmed]

Parents MUST be able to favorite milestone behaviors and activities. They MUST be able to record an attempted/completed activity with date, optional parent-reported difficulty, and optional notes, associated with the selected child.

**Acceptance criteria**
- The application stores the record locally and it survives ordinary app restarts while storage remains intact.
- Optional difficulty is described as the parent's observation, never a clinical score.
- A parent may log an attempt without recording difficulty or notes.
- No service-side profile account is needed.

**Open:** Exact labels for milestone statuses; selecting 'bookmarks and statuses' was followed by a description emphasizing favorites and activity logging. Do not assume a clinical-style 'achieved/not achieved' assessment workflow.

### FR-008 — Activity-specific history [MUST | Confirmed]

The app MUST show a chronological history for a given child's activity. A lightweight visual depiction of parent-recorded difficulty SHOULD be available when sufficiently many ratings exist, but no comprehensive analytics dashboard is required.

**Acceptance criteria**
- Individual session dates, ratings (if entered), and notes are reviewable.
- History is scoped to the selected child and activity.
- Graphs, if included, are labeled subjective observations, not measures of developmental status.

### FR-009 — Local privacy and storage [MUST | Confirmed]

Personal records MUST default to device-local storage. No parent account, cloud storage, or multi-device synchronization is required. Collect the minimum child information needed to deliver the selected experience.

**Acceptance criteria**
- Browsing milestones anonymously does not require personally identifying information.
- Profiles and tracking can be used without sign-in.
- Normal use does not transmit child profiles, favorites, or notes to the content host.
- Users are informed that clearing local data or changing devices can delete their records.

**Proposed:** IndexedDB for structured local records. Storage mechanisms and data-at-rest protection must be technically verified for selected deployment.

### FR-010 — Manual backup and restore [MUST | Confirmed]

Parents MUST be able to export their locally stored records and restore them from a previously exported file, without creating an online account.

**Acceptance criteria**
- Export covers all locally stored child profiles, favorites, observations and activity logs.
- Import validates the backup format and data integrity before applying it.
- Import warns before overwriting existing device records.
- Backups remain usable across compatible catalog revisions via stable identifiers or migration rules.

**Proposed:** Versioned JSON backup format. **Open:** Whether encryption/password protection is appropriate for MVP.

### FR-011 — Partial offline access [MUST | Confirmed]

Previously viewed milestone/activity content MUST be cached automatically, subject to normal browser storage limits. Local personal data and recorded history MUST remain usable offline. Content never viewed or not cached may require connectivity.

**Acceptance criteria**
- Previously accessed content can be reopened without a network connection after successful caching.
- Unavailable content displays a clear offline message.
- Users do not need to manually choose content to download.
- Online-only external video links are clearly identifiable.

### FR-012 — Updates and visibility [MUST | Confirmed]

When online, the app MUST check for and deliver newly published content without requiring manual installation. Parents MUST receive an unobtrusive notification of meaningful changes and be able to see what changed.

**Acceptance criteria**
- New or revised content is fetched when online.
- A concise notice or changelog describes relevant updates.
- Existing bookmarks and activity history continue to refer to stable content identities.
- A partial or failed update does not corrupt personal records.

### FR-013 — Separate content management [MUST | Confirmed]

Authorized editors MUST be able to add, edit, remove and publish milestones, activities, sources, developmental mappings, and display order through a private workflow separate from the parent-facing app. A formal multi-person approval feature is NOT needed for the MVP.

**Acceptance criteria**
- Parents cannot edit the published catalog.
- Editors can publish an updated approved catalog independently of changing parent personal data.
- New content appears via the regular update mechanism.
- The initial CDC catalog is researched and human reviewed prior to publishing.

**Open:** Editor interface/tool and its authentication. **Proposed:** Version-control-backed editing and publication, potentially with a separate editor UI.

### FR-014 — Language and accessibility [MUST/SHOULD | Confirmed / Proposed]

**Confirmed MUST:** MVP content and UI are in English; the content representation accommodates future translations. The interface is responsive and usable on phones.

**Proposed SHOULD:** Follow WCAG 2.2 AA patterns for text, controls, navigation and contrast; confirm accessibility test approach during engineering design.

### FR-015 — Deployment evaluation [MUST | Confirmed]

Do not make the product dependent on a particular host before a proof of concept compares OpenAI Sites with an independently hosted PWA.

**Acceptance criteria**
- Both options are evaluated for remote link distribution, local persistence, partial offline caching, automatic catalog updates, backup, editor workflow separation, privacy/policy compliance, maintenance and recurring cost.
- Findings and the final selection are recorded in an architecture decision record.
- If a platform cannot meet a non-negotiable requirement, document the limitation rather than silently changing the product requirement.

## 3. Content constraints [MUST | Confirmed]

- CDC is the authoritative primary source for milestone ages/behaviors.
- Unified, human-reviewed catalog retains source attribution and original checkpoint criteria.
- Activity materials can come from less restrictive but still credible, human-reviewed sources.
- No invented, filler, or AI-generated activity is substituted for missing approved content; a neutral empty state is acceptable.
- Source links, video links, and safety notes are included when relevant.
- Rights to copy, modify, translate and redistribute content or media must be checked before publication.

## 4. Nonfunctional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-001 | No recurring cost commitment beyond an intentionally selected hosting arrangement; favor economical operation | Confirmed objective; actual budget open |
| NFR-002 | Preserve existing locally saved records across published content updates | Confirmed |
| NFR-003 | Keep parent data separate from public content hosting and administrative edits | Confirmed |
| NFR-004 | Clearly mark medically informational content as non-diagnostic and recommend professional consultation where authoritative guidance indicates it | Confirmed principle; exact copy open |
| NFR-005 | Graceful behavior under offline/failed-network conditions | Confirmed |
| NFR-006 | Versioned content and migration-compatible backup schema | Proposed implementation |
| NFR-007 | Reasonable mobile performance, keyboard access and legibility | Proposed; quantitative thresholds open |

## 5. Deferred/out of scope

- AI-generated or personalized activity suggestions, LLM chatbot, vector database.
- Diagnostic questionnaires, scoring or formal screening.
- Cloud accounts, sync or shared family accounts.
- Video hosting or embedded video player infrastructure.
- Native Android APK as a committed distribution strategy.
- Detailed parent/child reporting dashboards and scheduled reminders.
- Formal editorial approval queues and reviewer role hierarchies.

## 6. Unresolved questions requiring actual decisions

1. **Deployment:** Which host meets the proof-of-concept criteria and relevant policies?
2. **Checkpoint selection:** What exact, source-consistent rule maps age in months to CDC published checkpoints?
3. **Milestone status:** Is there a user-defined status beyond favorites and activity history? If yes, what plain-language options are appropriate?
4. **Content readiness:** How many vetted activities per category/checkpoint are needed to call the initial release useful? No arbitrary number decided.
5. **Backup safety:** Plain vs encrypted JSON; restoration/replacement semantics.
6. **Admin tool:** Which separate editing mechanism and publication process will be built first?

## 7. Traceability

See [`user-flows.md`](user-flows.md) for paths that exercise these requirements; see [`content-policy.md`](content-policy.md) for source and content acceptance rules. Implementation tests should reference stable requirement IDs (`FR-*`, `NFR-*`).
