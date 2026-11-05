# Local milestone guide demo

## FR-001 local profile goal

The active work connects local child profiles to the existing age engine while preserving temporary browsing.
Slices proceed sequentially, each with a failing browser case, implementation, required checks, a fresh review and recorded evidence.

| Slice | Acceptance scope | Status |
| --- | --- | --- |
| P1: persistent exact-birth profiles | Create/select multiple profiles, persist only after an atomic commit, restore the selected child and derive age on reopening, recover from unavailable storage. | Complete for the local demo. |
| P2: month-based ages and session overrides | Birth month/year input, younger-checkpoint default and labeled preview, temporary corrected age with unchanged profile/child association, calendar refresh. | Not started. |
| P3: profile management and completion audit | Edit/remove profiles, preserve records/drafts on failed writes, handle stale state safely, verify FR-001 criteria across complete flows. | Not started. |

This remains a loopback-only local demo.
Its explicit local-demo storage namespace is separate from guide content and is not a substitute for verified-adult isolation in a deployed application.
People using the same browser profile can access its local demo profiles; clearing site data removes them.
Production identity, access expiry, backup, favorites and practice history remain outside this FR-001 goal.

### P1 completion evidence

The initial browser case failed at the missing Profiles navigation link before implementation.
The implementation adds optional exact-date profiles with opaque IDs, escaped display labels, an explicit local-demo IndexedDB namespace and transactional profile/selection writes.
The existing age engine derives the selected child's age on load rather than persisting a month count.
Ten profile browser checks pass across desktop and phone layouts, including a real disk-backed Chrome restart, unavailable storage recovery, an abort after an IndexedDB request succeeds, retained drafts and keyboard entry at 320 pixels with 200% text.
The 46 existing browser checks passed in the initial full run; the corrected profile recovery injection and added profile cases passed in the focused rerun.
All 39 unit checks and `npm.cmd run check` passed.
Desktop, phone and enlarged-text profile screenshots were inspected.
The fresh independent requirements-first review found that retrying a failed profile read cleared the form draft.
The controller now retains that draft until creation commits; the reviewer's failing case passes after the fix.
Eight independent desktop/mobile checks cover blank labels, leap-day age calculation, aborted selection writes, read-retry draft retention, concurrent creation, inert hostile labels, network/log privacy and narrow enlarged-text date entry.
After the draft fix, the full browser suite passed 64/64 cases with no retries.
The fresh review found no remaining material P1 issues.

## Run locally

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
Local profile integration is in progress as recorded above.
Favorites, logging practice, offline access, catalog updates and production hosting remain separate work.
The local demo does not change Sites or its invitation policy.

## Activity library

Choose Search in the main navigation to browse activities without selecting an age or milestone first.
Search matches every case-insensitive query word across titles, materials, instructions and explicitly assigned skill labels.
Age, skill, developmental category, materials, time and setting filters combine with the query, and results retain their catalog order without ranking or duplicated placements.
The age filter is separate from the temporary milestone-browsing age.
For an exact age, month-range suitability matches that age directly and includes both endpoints.
For an approximate age interval, the activity's month range must contain the entire inclusive interval; partial overlap does not match.
Checkpoint suitability uses the applicable published checklist at the exact age or the younger end of the interval.
The six-month checkpoint matches an exact age of seven months, while an interval from five to six months uses the four-month checkpoint.
If the younger age is below two months or at least 72 months, there is no applicable checkpoint; library filtering does not activate a checklist preview.
Skills use only explicit activity skill IDs; skill overlap through a linked milestone does not add a tag to an untagged activity.
The local guide now uses `fixtures/guide-catalog.js`, a distinct fictional release with example duration and setting metadata.
The earlier `releaseOne` and `releaseTwo` engineering fixtures remain unchanged.
The guide fixture has a new release ID and incremented activity revisions; these values do not constitute reviewed developmental guidance.
Time available offers inclusive maximums derived from the active catalog's known minute values, sorted numerically.
Activity setting offers Indoors and Outdoors only when the catalog explicitly supports them; `either` supports both choices.
Missing duration or setting does not match its selected filter, while Any duration and Any setting preserve those records.
If every activity omits a field, that field's filter is not displayed.
Activity rows and details show known values; detail views explicitly label unknown values as not listed.
Materials remain searchable by keyword and also have a dedicated exact-membership filter.
Material options are deduplicated from active activity material lists; No materials listed matches only an explicitly empty list.
Category options come from categories attached to active activities through direct reviewed milestone links.
An activity matches a category when any of its direct linked milestones has that category, regardless of which checkpoint is currently being browsed.
Skill overlap alone never creates a category placement or a skill assignment.
Unused catalog categories are not offered as activity filters.
Use an approximate age range reveals youngest and oldest possible ages, both required as nonnegative safe whole numbers of months with youngest no greater than oldest.
This is a temporary library query, not a new child-profile record or an override of the dashboard age.
Returning to exact mode clears the applied upper bound; a blank exact-age field still means no age filter.

Submit Search activities to apply the entered controls, or toggle a skill tile to apply it together with those controls.
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
The richer browser-test fixture is not exposed by the guide server.
The later duration/setting slice switches the default two-activity demo to its own isolated release without modifying the earlier engineering releases.
The fresh reviewer derived additional cases before reading the author tests and exercised them independently in Chrome.
Those cases are retained as a regression for quoted/symbol-containing material labels, a literal material named none versus an empty list, top-level navigation, dashboard/library age independence, invalid-draft rejection and the test fixture's HTTP 404 at the runtime boundary.

| Requirement or criterion | Status for this slice | Evidence or remaining limit |
| --- | --- | --- |
| FR-005: filter without selecting a milestone | Verified locally | Search is opened from the home screen with no age or milestone selected. |
| FR-005: developmental category and materials filtering | Verified locally | Direct placements, exact material membership, shared placements without duplicate results, and empty material lists are exercised in the richer catalog. |
| FR-005: only catalog-supplied filter options | Verified with synthetic data | Material options are deduplicated; unused categories are absent; actual editorial approval is not simulated or established. |
| FR-005 / DM-003: combine filters without inferring missing metadata | Verified locally | Query, age, skill, category and materials intersect; an untagged activity does not acquire a skill through its milestone links. |
| FR-014: usable filter controls | Partially verified | Keyboard selection, result focus, desktop/mobile screenshots, and 320-pixel layout with 200% text are checked; a complete accessibility audit and physical-device testing remain open. |
| FR-005: duration and indoor/outdoor setting | Completed in the following slice | See duration and setting evidence below. |
| DM-003: approximate-age discovery | Completed in the interval slice | See approximate-age evidence below. |

Returning from an activity preserves every applied filter, and Clear filters restores the entire active catalog.
Reload clears the temporary filter state.
The passing local checks do not establish production catalog completeness or full FR-005 completion.

## Duration and setting slice evidence

The new end-to-end test first failed at the missing Time available control.
An activation test also failed because malformed optional metadata was previously accepted.
The catalog validator now rejects non-positive, fractional, unsafe, nonnumeric or null durations and unrecognized settings before activation.
The activity fields and filter semantics are specified in [the data model](../data-model.md).
The browser tests override the guide catalog response with validated fictional records containing indoor-only, outdoor-only, either-location and unknown values.
The default local guide also exposes these controls using its new fictional release, so this behavior is available outside the test harness.
An additional browser case exercises that ordinary demo without overriding its catalog.
The fresh reviewer independently derived and exercised a one-minute duration, the maximum safe integer, either-only locations and records missing just one of the optional fields.
Those cases are retained in the browser suite; the failed-activation unit check also verifies unchanged active activity content, not just the release ID.

| Requirement or criterion | Status for this slice | Evidence or remaining limit |
| --- | --- | --- |
| FR-005: duration and indoor/outdoor filtering without a milestone | Verified locally | Time-boundary matches, both locations, either-location inclusion and known-only filtering are exercised from Search. |
| FR-005 / DM-003: intersect existing filters and exclude unknown metadata | Verified locally | Time and setting intersect with keyword, age, skill, materials and category; omitted metadata remains available only when its filter is unrestricted. |
| DM-002/003: valid, optional discovery metadata | Verified locally | Earlier catalogs remain valid; malformed fields prevent browser rendering and cannot replace the active catalog at the store boundary. |
| DM-006: release identity and revision continuity | Verified locally | The separate guide fixture activates from releaseOne with a new release ID and incremented activity revisions; earlier fixtures remain unchanged. |
| FR-006: show duration and location with activity essentials | Verified locally | Details expose known duration and either-location metadata, or explicit not-listed states. |
| FR-014: keyboard and responsive controls | Partially verified | Desktop/mobile screenshots and keyboard operation at 320 pixels with 200% text are checked; physical-device and full accessibility testing remain open. |
| DM-003: approximate-age discovery | Completed in the interval slice | See approximate-age evidence below. |

Returning from details preserves time and setting alongside other applied filters, Clear filters resets them, and reload clears temporary choices.
These synthetic checks do not establish real editorial approval or production content completeness.

## Approximate-age library slice evidence

The new browser test first failed because no approximate-range control existed.
The tests in `e2e/approximate-age.spec.js` use a validated fictional catalog with activities that fully contain, partially overlap or exactly match the chosen age interval, plus separate four- and six-month checkpoint activities.
An interval of five to six months includes a four-month checkpoint activity and excludes the six-month one, preserving the younger checkpoint even when the upper bound reaches the next checkpoint.
The applied result summary labels the approximate interval and states which checkpoint is being used.
Invalid bounds focus the offending input, expose a validation message and leave the prior applied results intact.
Checkbox changes edit the form; Search activities or a skill toggle applies valid controls.
Clear filters restores unrestricted discovery, and reload resets the range mode and both bounds.
No age interval is written to a URL, browser storage or service request.
The fresh reviewer's independently written probe is retained as a normal browser regression for a zero-to-71-month interval combined with every filter, invalid-draft discard, dashboard age separation and empty local/session/IndexedDB storage.

| Requirement or criterion | Status for this slice | Evidence or remaining limit |
| --- | --- | --- |
| DM-003: entire interval within month suitability | Verified locally | Inclusive ends, single-month intervals, partial overlaps and empty results are exercised. |
| DM-003/004: checkpoint chosen at the younger age | Verified locally | The five-to-six-month case uses checkpoint four rather than checkpoint six; coverage-edge cases do not activate previews. |
| FR-005: combine an approximate age with discovery filters | Verified locally | The reviewer-derived case combines interval, keyword, skill, category, materials, duration and setting through the normal Search entry point. |
| FR-001: clear approximate labeling and input validation | Verified for the library query | Missing, reversed, fractional and unsafe bounds are rejected without claiming day-level age precision. |
| FR-014: keyboard and responsive controls | Partially verified | Native checkbox/number controls, result focus, desktop/mobile screenshots and 320-pixel/200% text are checked; physical-device and full accessibility checks remain open. |
| DM-004 / DM-A02: derive an interval from profile birth month | Still unimplemented in the UI | Existing platform-neutral age tests cover the arithmetic, but this slice accepts a manually specified query interval and creates no child profile. |

This completes the local library's range-filter behavior, not production catalog approval or the separate profile, persistence and age-derivation flows.

Desktop Chrome uses 1440 by 1000 pixels; mobile Chrome emulation uses 390 by 844 pixels.
An additional check uses a 320-pixel viewport with 200% root text size.
Viewport emulation is not a physical-phone compatibility test or a complete accessibility audit.

The design follows the bold category tiles and compact rows in the [original dashboard](../mobile-ui/milestone%20dashboard%20ui%20example.png) and [list reference](../mobile-ui/list%20of%20activites%20ui%20example.png), with the hierarchy from the [detail reference](../mobile-ui/activity%20detail%20screen%20ui%20example.png).
The palette uses paper `#f6f5f1`, ink `#191919`, lavender `#b8a3ff`, lime `#d3f34c` and orange `#ff6847`.
Trebuchet MS, with a Segoe UI fallback, provides locally available typography without font requests.
The desktop age panel sits beside the checklist; phones use one column.
