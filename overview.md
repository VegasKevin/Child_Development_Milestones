# Architecture overview

Status — platform-neutral MVP draft. Deployment remains open under FR-015.

For the coding agent, [start here](README.md).

## Application boundaries

1. **Parent guide.** An invited parent verifies email access and can browse without creating a child profile. Age selection, milestone navigation, activity discovery, favorites and practice history run on the device. Previously viewed content is available offline for the approved access window.
2. **Access and catalog delivery.** Verify invitation access and serve approved releases. Access records contain the information needed for invitations and verification. Child data stays on the device.
3. **Private editorial workspace.** One designated maintainer edits structured drafts and approves and publishes validated content. All published activities have reviewed direct CDC milestone links.
4. **Personal recovery.** Export or restore encrypted local records. Backup is independent of guide authorization. Verification on a new device grants access to the guide and backup restore transfers personal records.

## Specification map

| Document | Scope |
| --- | --- |
| [Data model](data-model.md) | Entities, age selection, relationships, revisions and references |
| [Content pipeline](content-pipeline.md) | Human approval, release validation, publishing and safety withdrawals |
| [Local storage](local-storage.md) | Offline data, persistence, encrypted backups and restore |
| [Interfaces](interfaces.md) | Contracts between guide, access, catalog, recovery and publishing |
| [Interview decisions](architecture-interview-decisions.md) | Confirmed choices and revisions to the product drafts |
| [Deployment evaluation](deployment-evaluation.md) | Shared proof of concept and candidate selection criteria |
| [Coding handoff](coding-handoff.md) | Product baseline changes, readiness gates and implementation order |

## Deployment evaluation

Run the same small proof of concept for OpenAI Sites and an independently hosted PWA. Record observations, evidence and recurring cost estimates for each. Use sample catalog and fictional child records for evaluation.

| Check | Evidence needed |
| --- | --- |
| Invite-only access | An uninvited visitor cannot retrieve protected guide content. An invited parent can verify on two devices, and known revocation blocks access. |
| Offline window | Previously viewed essentials reopen offline after restart. An expired authorization blocks the guide. Test with a controllable clock and exercise clock changes as a limitation of local enforcement. |
| Local persistence and recovery | Save a practice entry offline, restart, export an encrypted backup, and restore on another device. Confirm personal data stays out of network requests. |
| Independent publication | The maintainer can publish a valid release without accessing personal data. Failed refresh leaves the prior release usable, and a safety withdrawal hides cached instructions after refresh. |
| Operating constraints | Record hosting and verification costs, publication and maintenance steps, data handling and applicable platform policies. |

An unsupported MUST is a failed criterion. Record the final choice and tradeoffs in a deployment decision record after evaluation. Before coding, reconcile the original product drafts with confirmed interview decisions and close the remaining contract details for the chosen implementation.
