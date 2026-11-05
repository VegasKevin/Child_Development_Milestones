# Hosting evaluation evidence

The platform-neutral milestone is committed in `077fcbf`.
Hosting evaluation starts from that baseline on `milestone/hosting-proof-of-concept`.
No hosting candidate is selected, deployed, or verified yet.

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
| POC-01 | Unverified | Unverified | Needs running candidate origins and direct catalog/asset requests. |
| POC-02 | Unverified | Unverified | Needs invitation verification, a private test email, and two devices. |
| POC-03 | Unverified | Unverified | Needs browser reopening, persistent storage, and offline tests on deployed candidates. |
| POC-04 | Unverified | Unverified | Needs persistent authorization, controlled expiry, restart, revocation, and clock rollback tests. |
| POC-05 | Unverified | Unverified | Needs encrypted backup and atomic restore on device two. |
| POC-06 | Unverified | Unverified | Needs inspection of actual network requests and deployment telemetry. |
| POC-07 | Unverified | Unverified | Local two-release fixture preparation passes; actual publication and interrupted downloads remain untested. |
| POC-08 | Unverified | Unverified | Needs deployed parent and maintainer authorization boundaries. |
| POC-09 | Unverified | Unverified | Needs verified hosting, email, costs, operating constraints and mobile compatibility evidence. |

## Dependencies before hosted testing

Publishing test candidates requires explicit authorization under the user's existing publishing constraint.
No remote is configured, and pushing has not been authorized.
The independently hosted PWA needs an approved test hosting destination and an email-verification service or equivalent test integration.
The evaluation needs a private test email address, two independent browser profiles and two devices including a phone.
Do not record credentials, email challenge contents or unredacted personal information in this repository.
Do not select a candidate while any mandatory check remains failed or unverified.

The next slice is hosted entry-point and protected catalog/asset access verification, POC-01 and IF-A01, once those dependencies are available.
No production platform or paid service commitment has been made.
