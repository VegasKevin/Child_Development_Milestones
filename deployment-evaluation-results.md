# Hosting evaluation evidence

The platform-neutral milestone is committed in `077fcbf`.
Hosting evaluation starts from that baseline on `milestone/hosting-proof-of-concept`.
The private Sites access-test candidate is deployed; no candidate is selected for production.

## Sites access boundary slice

The user authorized publishing test candidates after the initial fixture-preparation commit.
The owner-private test deployment is [Milestone guide access test](https://milestone-access-poc-knolf.greattick1.chatgpt.site).
It contains a minimal synthetic access payload, not the full guide or release catalog.
The Site identity is tracked in `hosting/sites-candidate/.openai/hosting.json`.
Its isolated publication source commit is `daff062a922ccdf3a2883f776e7d7294f785a464`.
Deployment succeeded on 2026-11-05 UTC.

Four request-boundary tests were added and run against the unmodified Worker starter.
Three failed for the expected missing entry explanation and missing protected routes before implementation.
The Sites-specific Worker now serves an explanatory access page and guards direct catalog and essential-asset routes using Sites-dispatch identity behind the owner-private platform policy.
Responses disable caching for this access-only slice; offline authorization and caching remain future slices.
The adapter must not be deployed independently with untrusted client-supplied identity headers.

Local checks pass with Node.js 24.14.1 on Windows: 36 tests, the integrated milestone check, portable build, and ESM artifact validation.
A reviewer independently verified the route behavior and found no material route issue.
The review identified stale-output retention in the portable build.
A failing stale-file probe reproduced it; the build now checks the resolved output directory remains directly within its project, clears it, and reproduces the artifact.
The reviewer reran the probe and confirmed the concern resolved.

`node scripts/probe-sites-access.mjs https://milestone-access-poc-knolf.greattick1.chatgpt.site` verified HTTP 401 for both protected routes, both anonymously and with a forged identity header, without exposing either protected payload.
The browser automation host was unavailable when opening the deployed URL, so signed-in browser behavior, visual QA, clean-profile navigation and underlying-host/cache access remain unverified.
Sites reports external visitor invitations enabled, and the supplied test address is already allowed.
This metadata does not verify passwordless email challenges, expired/used challenges or two-device access.
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
| POC-01 | Unverified | Unverified | Sites deployed-origin anonymous and forged-header probes pass; signed-in/clean-browser and underlying/cache origin checks remain unverified. |
| POC-02 | Unverified | Unverified | Needs invitation verification, a private test email, and two devices. |
| POC-03 | Unverified | Unverified | Needs browser reopening, persistent storage, and offline tests on deployed candidates. |
| POC-04 | Unverified | Unverified | Needs persistent authorization, controlled expiry, restart, revocation, and clock rollback tests. |
| POC-05 | Unverified | Unverified | Needs encrypted backup and atomic restore on device two. |
| POC-06 | Unverified | Unverified | Needs inspection of actual network requests and deployment telemetry. |
| POC-07 | Unverified | Unverified | Local two-release fixture preparation passes; actual publication and interrupted downloads remain untested. |
| POC-08 | Unverified | Unverified | Needs deployed parent and maintainer authorization boundaries. |
| POC-09 | Unverified | Unverified | Needs verified hosting, email, costs, operating constraints and mobile compatibility evidence. |

## Dependencies before hosted testing

Publishing test candidates is authorized; this does not select a production platform or authorize paid services.
The root project has no remote; only the isolated Sites publication source was pushed to its scoped service repository.
The independently hosted PWA still needs a connected test hosting destination and an email-verification service or equivalent test integration.
Vercel was discovered as an available integration but its connection is not confirmed.
The user supplied a private test email, retained only in the session.
The evaluation still needs working browser access, two independent browser profiles and two devices including a phone.
Do not record credentials, email challenge contents or unredacted personal information in this repository.
Do not select a candidate while any mandatory check remains failed or unverified.

The next slice is signed-in and email-bound invitation access verification, POC-01/02 and IF-A01, once browser and device access are available.
No production platform or paid service commitment has been made.
