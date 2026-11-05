# Local milestone guide demo

Run `npm.cmd run dev` on Windows, or `npm run dev` elsewhere, from the repository root with Node.js 22.8 or later.
Open `http://127.0.0.1:4173` in a browser.
The application has no runtime dependencies; the server binds only to loopback and serves an explicit list of demo files.
Stop it with Ctrl+C.
For a different port, run `node scripts/serve-guide.mjs 4180`.

Enter an age in whole months, open the category tile, select a behavior, and follow a linked activity.
The existing selection function chooses the greatest published checkpoint at or below that age.
Below two months, the two-month checklist is an optional, labeled preview.
At 72 months and above, the coverage message replaces checklist navigation.
The fictional catalog contains only checkpoints 2, 4, 6 and 60 and one category.
No production CDC text, additional categories or activities are invented for this demo.

Temporary age stays in memory and is not added to URLs, saved to browser storage, or submitted to a service.
Reloading clears it; a milestone-context detail route without that context offers a return to age entry.
Back navigation retains the current in-memory age and preview label.
Materials, steps, suitability and safety notes are visible on activity details; source context uses a disclosure.

The implemented slices cover temporary-age browsing and the linked checklist/category/behavior/activity path in FR-001/002/003/004/006, standalone discovery in FR-004/005, plus DM-A01/A04/A08 and responsive/keyboard aspects of FR-014.
These are partial requirements checks using synthetic content, not completion of the full product requirements.
Profiles, saving, logging practice, persistence, offline access, catalog updates and production hosting remain separate work.
The local demo does not change Sites or its invitation policy.

## Activity library

Choose Search in the main navigation to browse activities without selecting an age or milestone first.
Search matches every case-insensitive query word across titles, materials, instructions and explicitly assigned skill labels.
Age, skill, developmental category and materials filters combine with the query, and results retain their catalog order without ranking or duplicated placements.
The age filter is separate from the temporary milestone-browsing age.
Month-range suitability matches the entered age directly and includes both endpoints.
Checkpoint suitability matches the applicable published checklist, so the six-month checkpoint also matches an age of seven months.
Below two months or at 72 months and above, there is no applicable checkpoint for this filter; this does not activate a checklist preview.
Skills use only explicit activity skill IDs; skill overlap through a linked milestone does not add a tag to an untagged activity.
The synthetic catalog has no duration or setting fields, so the interface does not invent those filters.
Materials remain searchable by keyword and also have a dedicated exact-membership filter.
Material options are deduplicated from active activity material lists; No materials listed matches only an explicitly empty list.
Category options come from categories attached to active activities through direct reviewed milestone links.
An activity matches a category when any of its direct linked milestones has that category, regardless of which checkpoint is currently being browsed.
Skill overlap alone never creates a category placement or a skill assignment.
Unused catalog categories are not offered as activity filters.
Approximate-age discovery remains separate work.

Submit Search activities to apply the entered query, age, category and materials, or toggle a skill tile to apply it together with those controls.
Clear filters resets all library controls and restores all active activities.
Filters remain in memory when opening an activity and returning to the results.
Query and filter values are not put in URLs, browser storage or network requests.
Reloading resets the filters; standalone library activity URLs can still reopen their content without an age or profile.

## Browser verification

Run `npm.cmd ci` once to install the locked development dependencies, then `npm.cmd run test:e2e`.
Use the equivalent `npm` commands elsewhere.
The Playwright configuration uses an installed Google Chrome with fresh automated contexts, not the personal Chrome profile or extension.
The test server uses port 4174 and is started and stopped by Playwright; that port must be free.
Screenshots and failure traces go into ignored `test-results/` directories.
Run `npm.cmd test` and `npm.cmd run check` for the existing platform-neutral checks.

The first browser test failed because the Milestones heading and screen did not exist.
After implementation, browser cases cover age-to-detail navigation, per-behavior editorial ordering, optional preview and upper coverage, invalid ages, reload reset, keyboard focus, narrow enlarged-text layout and unavailable detail routes.
The library browser test first failed because no Search navigation existed.
Its cases now cover standalone discovery, case/whitespace normalization, material keyword search, combined filters, missing skill metadata, suitability boundaries, empty results, return navigation, standalone-detail reload, local-only requests and enlarged text.

## Category and materials slice evidence

The new browser test first failed at the missing Developmental category control before implementation.
The tests in `e2e/catalog-filters.spec.js` use a separately validated fictional release with five activities, two linked categories, two skills, shared materials, empty materials and activities without skill tags.
One additional category has no activity placements and must not appear in the filter.
The test replaces only the catalog module response in an isolated browser context; it exercises the normal Search entry point and application code.
The test fixture is not exposed by the guide server, and the default two-activity demo catalog remains unchanged.
The fresh reviewer derived additional cases before reading the author tests and exercised them independently in Chrome.
Those cases are retained as a regression for quoted/symbol-containing material labels, a literal material named none versus an empty list, top-level navigation, dashboard/library age independence, invalid-draft rejection and the test fixture's HTTP 404 at the runtime boundary.

| Requirement or criterion | Status for this slice | Evidence or remaining limit |
| --- | --- | --- |
| FR-005: filter without selecting a milestone | Verified locally | Search is opened from the home screen with no age or milestone selected. |
| FR-005: developmental category and materials filtering | Verified locally | Direct placements, exact material membership, shared placements without duplicate results, and empty material lists are exercised in the richer catalog. |
| FR-005: only catalog-supplied filter options | Verified with synthetic data | Material options are deduplicated; unused categories are absent; actual editorial approval is not simulated or established. |
| FR-005 / DM-003: combine filters without inferring missing metadata | Verified locally | Query, age, skill, category and materials intersect; an untagged activity does not acquire a skill through its milestone links. |
| FR-014: usable filter controls | Partially verified | Keyboard selection, result focus, desktop/mobile screenshots, and 320-pixel layout with 200% text are checked; a complete accessibility audit and physical-device testing remain open. |
| FR-005: duration and indoor/outdoor setting | Unimplemented and unverified | The current catalog has neither field; this slice does not establish behavior when those fields are introduced. |
| DM-003: approximate-age discovery | Unimplemented in the UI | The library accepts an exact whole-month age only. |

Returning from an activity preserves every applied filter, and Clear filters restores the entire active catalog.
Reload clears the temporary filter state.
The passing local checks do not establish production catalog completeness or full FR-005 completion.
Desktop Chrome uses 1440 by 1000 pixels; mobile Chrome emulation uses 390 by 844 pixels.
An additional check uses a 320-pixel viewport with 200% root text size.
Viewport emulation is not a physical-phone compatibility test or a complete accessibility audit.

The design follows the bold category tiles and compact rows in the [original dashboard](../mobile-ui/milestone%20dashboard%20ui%20example.png) and [list reference](../mobile-ui/list%20of%20activites%20ui%20example.png), with the hierarchy from the [detail reference](../mobile-ui/activity%20detail%20screen%20ui%20example.png).
The palette uses paper `#f6f5f1`, ink `#191919`, lavender `#b8a3ff`, lime `#d3f34c` and orange `#ff6847`.
Trebuchet MS, with a Segoe UI fallback, provides locally available typography without font requests.
The desktop age panel sits beside the checklist; phones use one column.
