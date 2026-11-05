# Hosting evaluation evidence

The platform-neutral milestone is committed in `077fcbf`.
Hosting evaluation starts from that baseline on `milestone/hosting-proof-of-concept`.
The private Sites access-test candidate is deployed; no candidate is selected for production.

## Sites access boundary slice

The user authorized publishing test candidates after the initial fixture-preparation commit.
The restricted test deployment is [Milestone guide access test](https://milestone-access-poc-knolf.greattick1.chatgpt.site).
It contains a minimal synthetic access payload, not the full guide or release catalog.
The Site identity is tracked in `hosting/sites-candidate/.openai/hosting.json`.
Its isolated publication source commit is `daff062a922ccdf3a2883f776e7d7294f785a464`.
Deployment succeeded on 2026-11-05 UTC.

Four request-boundary tests were added and run against the unmodified Worker starter.
Three failed for the expected missing entry explanation and missing protected routes before implementation.
The Sites-specific Worker serves an explanatory access page and guards direct catalog and essential-asset routes using trusted Sites-dispatch identity behind the platform access policy.
Responses disable caching for this access-only slice; offline authorization and caching remain future slices.
The adapter must not be deployed independently with untrusted client-supplied identity headers.

Local checks pass with Node.js 24.14.1 on Windows: 36 tests, the integrated milestone check, portable build, and ESM artifact validation.
A reviewer independently verified the route behavior and found no material route issue.
The review identified stale-output retention in the portable build.
A failing stale-file probe reproduced it; the build now checks the resolved output directory remains directly within its project, clears it, and reproduces the artifact.
The reviewer reran the probe and confirmed the concern resolved.

`node scripts/probe-sites-access.mjs https://milestone-access-poc-knolf.greattick1.chatgpt.site` verified HTTP 401 for both protected routes, both anonymously and with a forged identity header, without exposing either protected payload.
The initial browser automation host was unavailable when opening the deployed URL.
The user subsequently reported a successful Chrome inspection in a forked chat at desktop and mobile viewport sizes: no visible clipping or overlap, the catalog button opened synthetic JSON, and the page disclosed that email verification was not implemented.
That report establishes the observed signed-in page behavior, not an independent invited viewer, a clean profile, two physical devices, or underlying-host/cache access.

## Invited-viewer phone access slice

This bounded evidence slice records one invited viewer's email-code sign-in and protected-resource access on a phone.
The user explicitly deferred the remaining full POC-01/02 checks; this slice does not complete either evaluation case.
No application code, authentication service, or deployment artifact changed.

On 2026-11-05 UTC, a fresh Sites policy read showed only the owner and zero external visitors, correcting the earlier claim that a separate invited viewer was already allowed.
The first supplied test address matched the owner and did not establish a separate viewer invitation.
A different controlled test address was then added through Sites access management.
Sites returned restricted `custom` access, policy revision 3, and one external visitor with role `viewer` while preserving the owner.

| Observation | Evidence and result |
| --- | --- |
| Protected routes without a session | Automated deployed-origin probes before and after adding the viewer returned HTTP 401 for both `/catalog.json` and `/assets/essential.txt`, both anonymously and with a forged identity header, without exposing the protected payloads. |
| Sign-in entry | A cookie-free HTTP probe returned 401 for `/` with no redirect or sign-in link; `/signin-with-chatgpt` returned 302 to `auth.openai.com`. The tester reported that the page itself offered only the catalog link, matching the current page source. |
| Email-code sign-in | After opening the platform sign-in route, the tester reported receiving an emailed code and successfully signing in with the separately invited viewer account. The earlier allowlist update had not produced an invitation email received by the tester. |
| Protected phone content | On 2026-11-05 UTC, the tester reported synthetic JSON at `/catalog.json` and one sentence of fictional text at `/assets/essential.txt` after sign-in. No child-profile step was reported. |
| Phone conditions | User-tested Pixel 9a, Chrome, normal non-private tab. Operating system and browser versions were not supplied. |

The phone observations are user-reported results, not browser automation performed in this CLI session.
Because the phone used an existing normal browser context, this result does not establish fresh-session denial before verification or isolate prior browser state.
The successful sign-in used the platform's account service; the application itself still has no email-verification service or sign-in link on its page.
The missing entry-page sign-in path remains an observed limitation, rather than a completed normal-entry acceptance case.
A second independent viewer device, uninvited-account denial, used/expired-challenge cases, and underlying-host/cache access remain unverified.
The synthetic candidate has no personal-record UI, so this test cannot establish full application record isolation.
The [hosted verification procedure](hosting/sites-candidate/access-verification.md) retains these deferred cases for a later slice.
No test email address or credential is recorded in this repository.

## Local fixture preparation

The two fictional catalog releases in `fixtures/synthetic-catalogs.js` now satisfy the release-content setup in [the evaluation plan](deployment-evaluation.md).
Release A has two independently ordered activities at the six-month milestone.
Release B withdraws the shared activity and revises the surviving activity's title and revision while retaining its ID and procedure.
The change summary describes both changes.

The new `test/deployment-fixtures.test.js` first failed because the surviving title was unchanged.
It now verifies validation and activation through the platform-neutral catalog store, rejection of an incomplete candidate without replacing release A, current revision resolution after release B, withdrawn-reference status, and unchanged saved practice data.
This is prerequisite evidence for POC-07, not a hosted POC-07 pass.
No network interruption, browser cache, invitation, or publishing boundary is simulated by this check.

Run `npm.cmd test` and `npm.cmd run check` on Windows, or the equivalent `npm` commands elsewhere.

## Candidate results

| Check | OpenAI Sites | Independently hosted PWA | Evidence or dependency |
| --- | --- | --- | --- |
| POC-01 | Unverified | Unverified | Sites deployed-origin anonymous and forged-header probes pass; owner and invited-phone-viewer resource access is user-reported; clean-browser and underlying/cache origin checks remain unverified. |
| POC-02 | Unverified | Unverified | Invited viewer reports email-code sign-in and both protected resources on Pixel 9a/Chrome; fresh desktop viewer, uninvited-account and used/expired-challenge checks remain pending. |
| POC-03 | Unverified | Unverified | Needs browser reopening, persistent storage, and offline tests on deployed candidates. |
| POC-04 | Unverified | Unverified | Needs persistent authorization, controlled expiry, restart, revocation, and clock rollback tests. |
| POC-05 | Unverified | Unverified | Needs encrypted backup and atomic restore on device two. |
| POC-06 | Unverified | Unverified | Needs inspection of actual network requests and deployment telemetry. |
| POC-07 | Unverified | Unverified | Local two-release fixture preparation passes; actual publication and interrupted downloads remain untested. |
| POC-08 | Unverified | Unverified | Needs deployed parent and maintainer authorization boundaries. |
| POC-09 | Unverified | Unverified | Needs verified hosting, email, costs, operating constraints and mobile compatibility evidence. |

## Dependencies before hosted testing

Publishing test candidates is authorized; this does not select a production platform or authorize paid services.
The root project now tracks its GitHub repository, and `milestone/hosting-proof-of-concept` was pushed through commit `d0b0fad`.
The isolated Sites publication source remains separate from that project repository.
The independently hosted PWA still needs a connected test hosting destination and an email-verification service or equivalent test integration.
Vercel was discovered as an available integration but its connection is not confirmed.
The user supplied a private test email, retained only in the session.
The phone viewer check is recorded above; the remaining evaluation needs an independent viewer session on a second device and browser access for the deferred cases.
Do not record credentials, email challenge contents or unredacted personal information in this repository.
Do not select a candidate while any mandatory check remains failed or unverified.

A follow-up access slice can exercise a fresh desktop viewer session, uninvited-account denial and challenge validity without repeating the completed phone observation.
No production platform or paid service commitment has been made.
