# Mobile UI plan

Status — proposed mobile layouts for implementation. Images are static mockups. Sample activity content is illustrative and requires editorial approval before publication.

## Core flow

1. **Access.** Verify the invitation by email on each device. After verification, offer temporary age entry or a local child profile. Creating a child profile is optional for browsing.
2. **Milestones.** Open on the applicable CDC checklist. Show the selected child or temporary age, then a compact grid of developmental categories. Each tile opens the corresponding group of tappable behavior rows. A checklist preview is labeled. Rows open details and carry no achievement controls.
3. **Behavior detail.** Lead with the behavior and a plain-language example. Show linked activities directly below in editorial order. Put provenance and extended context in a disclosure. A parent can save the behavior to a selected child.
4. **Activity detail.** Show materials, essential steps and relevant safety warnings before the practice action. Secondary details include sources, external resources, and the child's practice history.
   Keep Log practice pinned at the bottom, with space for the last step above it.
5. **Log practice.** Show the selected child and activity. Default the editable date to today and make difficulty and notes optional. Confirm only after the entry is saved locally.

## Navigation and states

- Proposed top-level destinations are **Milestones**, **Search**, **Saved**, and **Settings**. Milestones is the default. Detail and logging screens use back navigation and return to the prior screen.
- **Search** opens the activity library with a search field, colorful skill tiles, and a compact results list with useful metadata and approved filters. **Saved** shows the selected child's favorites, including labeled withdrawals. **Settings** manages profiles, backup and access.
- When browsing without a profile, saving prompts the parent to create or select one and then resumes the action. Keep any unsaved input visible on storage failure.
- Use explicit states for approximate age, first-checkpoint preview, no linked activities, offline cache miss, and expired or revoked access. Keep encrypted export reachable after access expiry per the handoff defaults.
- Use a single column on phones. Support text enlargement, visible keyboard focus, meaningful labels, and touch targets of at least 44 by 44 CSS pixels for primary controls. Test at narrow and enlarged-text sizes. Keep important safety information outside collapsed sections.

## Example screens

1. [Milestone overview](mobile-ui/01-milestones.png)
2. [Behavior detail](mobile-ui/02-milestone-detail.png)
3. [Activity detail](mobile-ui/03-activity-detail.png)
4. [Log practice](mobile-ui/04-log-practice.png)
5. [Search and browse](mobile-ui/05-search.png)
6. [Activity results](mobile-ui/06-activity-list.png)

The four destinations and visual style are proposed defaults. The supplied references informed the category dashboard, search tiles, compact activity rows, and activity detail hierarchy. Use the images for layout direction and the architecture contracts for behavior. Access, filter controls, history, settings, and error screens still need layouts.

References FR-001–011, FR-014, P1–P8 and DEC-001–014.
