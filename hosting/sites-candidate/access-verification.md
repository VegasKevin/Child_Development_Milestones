# Hosted invitation verification

This procedure covers POC-01/02 and IF-A01 for the synthetic Sites candidate.
It does not establish offline authorization, backup, publication permissions, or production readiness.
The completed phone observation and the cases deferred from that bounded slice are recorded in the evaluation evidence linked below.

Use the [entry page](https://milestone-access-poc-knolf.greattick1.chatgpt.site/) and its protected [catalog](https://milestone-access-poc-knolf.greattick1.chatgpt.site/catalog.json) and [essential asset](https://milestone-access-poc-knolf.greattick1.chatgpt.site/assets/essential.txt).
Use only test addresses controlled by the tester.
Keep addresses, credentials, verification codes, challenge URLs, cookies, and account screenshots out of repository evidence.

## Preconditions

Read the current Sites access policy before testing.
Confirm the candidate retains its restricted audience and the invited test address has viewer access rather than owner or editor access.
Owner access cannot substitute for invited viewer access.
Allowlist metadata alone cannot prove an email challenge or a successful viewer session.

Record the date, device, operating system, browser version, session condition, observed result, and tester for each case.
Use a fresh private session or isolated browser profile without an existing owner session.
Keep device two physically separate; mobile viewport emulation is not a second device.

## Current sign-in entry limitation

The current application page contains only a catalog link and does not contain a sign-in form or link.
A cookie-free request to the entry page returned HTTP 401.
The platform-provided [sign-in route](https://milestone-access-poc-knolf.greattick1.chatgpt.site/signin-with-chatgpt) redirects to OpenAI account sign-in and was used for the phone observation.
Use that route to test authentication when the entry page does not offer it, but record the detour rather than treating the normal-entry case as passed.
Allowlist configuration alone does not confirm an invitation email was delivered; in the observed phone flow, the tester received a code after initiating sign-in.

## Cases

| Case | Action | Expected behavior |
| --- | --- | --- |
| Entry | Open the entry page while signed out. | An explanation or access flow is available without disclosing protected content. |
| Direct resources | Open the catalog and essential asset URLs while signed out. | Neither protected payload is returned. |
| Forged identity | Run the automated probe below. | Anonymous requests and requests carrying a forged identity header cannot retrieve either payload. |
| Invited viewer, device one | Follow the normal access flow as the separately invited viewer. | Verify email control without a password and reach protected content without creating a child profile. |
| Invited viewer, device two | Repeat in an independent session on a physically different device using the same invited viewer. | Verify that device separately and reach protected content without transferring personal records. |
| Uninvited viewer | Attempt the normal access flow with another controlled address that is absent from the allowlist. | No protected content becomes available. |
| Used challenge | After a successful verification, attempt to reuse that challenge in a fresh unauthorized session. | The used challenge cannot authorize a fresh session. |
| Expired challenge | Obtain a fresh challenge, leave it unused until the provider's expiry, and attempt it in an unauthorized session. | The expired challenge cannot authorize access. |

Do not copy challenge URLs into reports to demonstrate reuse or expiry.
Do not assume that a browser already authorized by an earlier successful challenge proves challenge reuse.
If the platform exposes only ChatGPT account sign-in, record that behavior and leave passwordless email-invitation verification unmet until its actual flow is established.
If a challenge cannot be exercised or its expiry is unknown, record the case as unverified.

Run the automated negative probe from the repository root:

```powershell
node scripts/probe-sites-access.mjs https://milestone-access-poc-knolf.greattick1.chatgpt.site
```

The probe covers the named deployed origin only.
It does not exercise browser navigation, a successful email challenge, an uninvited signed-in account, or underlying hosting and cache origins.
The synthetic candidate has no personal-record UI, so an empty second device cannot establish the full application's record isolation.

## Reporting

Record redacted observations in [the evaluation evidence](../../deployment-evaluation-results.md).
Distinguish user-reported browser observations, automated request results, and access-policy metadata.
Keep POC-01 and POC-02 unverified until all their required cases are covered, or record a failure when an observed behavior contradicts a required pass condition.
Do not mark either case passed from owner access, a successful deployment, or a configured allowlist alone.
