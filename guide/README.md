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
Age and skill filters combine with the query, and results retain their catalog order without ranking or duplicated placements.
The age filter is separate from the temporary milestone-browsing age.
Month-range suitability matches the entered age directly and includes both endpoints.
Checkpoint suitability matches the applicable published checklist, so the six-month checkpoint also matches an age of seven months.
Below two months or at 72 months and above, there is no applicable checkpoint for this filter; this does not activate a checklist preview.
Skills use only explicit activity skill IDs; skill overlap through a linked milestone does not add a tag to an untagged activity.
The synthetic catalog has no duration or setting fields, so the interface does not invent those filters.
Materials are searchable by keyword; a dedicated materials filter, category filtering and approximate-age discovery remain separate work.

Submit Search activities to apply the query and age, or toggle a skill tile to apply it together with the entered query and age.
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
Desktop Chrome uses 1440 by 1000 pixels; mobile Chrome emulation uses 390 by 844 pixels.
An additional check uses a 320-pixel viewport with 200% root text size.
Viewport emulation is not a physical-phone compatibility test or a complete accessibility audit.

The design follows the bold category tiles and compact rows in the [original dashboard](../mobile-ui/milestone%20dashboard%20ui%20example.png) and [list reference](../mobile-ui/list%20of%20activites%20ui%20example.png), with the hierarchy from the [detail reference](../mobile-ui/activity%20detail%20screen%20ui%20example.png).
The palette uses paper `#f6f5f1`, ink `#191919`, lavender `#b8a3ff`, lime `#d3f34c` and orange `#ff6847`.
Trebuchet MS, with a Segoe UI fallback, provides locally available typography without font requests.
The desktop age panel sits beside the checklist; phones use one column.
