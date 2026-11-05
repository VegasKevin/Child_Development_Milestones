# Logical interfaces

Status — platform-neutral MVP draft. These are operation and result contracts. Transport, wire format, and storage technology are deployment decisions. See [data model](data-model.md), [content pipeline](content-pipeline.md) and [local storage](local-storage.md).

| ID and boundary | Inputs and outputs | Required behavior |
| --- | --- | --- |
| IF-001 · Access verification | Invited email and proof of email control. Returns a device authorization or a denial. | An invite must be active. A shared guide URL alone grants no access. The access service receives no child data. |
| IF-002 · Access check | Current device authorization. Returns authorized, denied, or temporarily unavailable. | Success establishes or renews a seven-day offline window. Denial blocks guide access. A transport failure leaves the existing deadline in force. The offline deadline survives restart. |
| IF-003 · Catalog discovery | Device authorization and optional current release ID. Returns unchanged or a candidate release ID, schema version and summary. | Catalog delivery enforces invite access. Calls carry no child, age, favorite or practice data. |
| IF-004 · Catalog retrieval | Device authorization and candidate release ID. Returns that release and any essential assets needed for caching, or an error. | Validate before activation. Incompatible, incomplete or unavailable candidates leave the prior release active subject to authorization. |
| IF-005 · Guide queries | Effective age or age interval, checkpoint or content ID, and approved library filters. Returns matching catalog data or a typed unavailable state. | Resolve age and search locally. Distinguish offline cache misses, retired or withdrawn content, and access denial. |
| IF-006 · Personal record operations | Local child and content references plus typed mutations. Returns committed data or a local error. | Validate references as specified in the data model. Never send personal mutations to a service. |
| IF-007 · Backup operations | Password and, for restore, an encrypted file. Returns an encrypted export or a validated preview followed by a commit result. | Do not apply a preview until confirmed. A preview must refer to the validated import. Recheck replacement impact if local records change before confirmation. |
| IF-008 · Editorial publication | Maintainer authorization and exact approved draft revision. Returns validation errors or a published release ID. | Keep publication separate from parent access. Make only complete validated releases discoverable. |

Traceability — IF-001–002 cover DEC-009–011. IF-003–005 cover FR-002–006 and FR-011–012. IF-006–007 cover FR-007–010. IF-008 covers FR-013 and DEC-015.

## Acceptance cases

- **IF-A01** — An uninvited visitor can open the entry point but cannot retrieve the catalog. After verification, a parent can browse without creating a child profile.
- **IF-A02** — A revoked parent who reconnects receives a denial and loses guide access even if the offline window has time remaining.
- **IF-A03** — An invited parent's catalog requests carry authorization and release information without child data.
- **IF-A04** — A maintainer can publish while a parent device is offline. That device sees the new release on a successful authorized refresh.
