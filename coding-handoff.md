# Coding handoff

Status — pre-implementation. Start with the [agent entry point](README.md), the [architecture overview](overview.md) and [confirmed decisions](architecture-interview-decisions.md). Use this handoff when reconciling the original product files. The source files have not been edited.

## Product baseline changes

| Original references | Confirmed behavior |
| --- | --- |
| FR-001–002, P1–P2 | Save exact birth date or birth month/year. Manual and corrected ages are temporary browsing inputs. Approximate age can default to the younger checklist. Below two months show the coverage message and optional preview. DEC-001, DEC-003–005, DEC-014. |
| FR-004, P6, content policy §4 | Every active activity requires a reviewed direct CDC milestone link. Each placement has its own editorial position. Launch requires one or more approved activities at each published checkpoint. DEC-006, DEC-012. |
| FR-007–008, P3–P5 | Favorites are child-specific. Log practice creates a dated entry with optional difficulty and notes. Withdrawn favorites remain labeled and practice history remains readable. DEC-002, DEC-007. |
| FR-009–011, vision §3, P1, P7–P8 | Invite-only guide access uses per-device passwordless email verification. Browsing still works without a child profile. Personal records stay local. Cached guide access lasts seven days after a successful check, subject to earlier known revocation. Exports are encrypted with a password and remain available after guide access expires. DEC-008–011. |
| FR-013, E1, content policy §7 | One designated maintainer can edit, approve and publish structured content privately. DEC-013, DEC-015. |

## Readiness checks by stage

- **Deployment.** Run the [shared proof of concept](deployment-evaluation.md) and record the platform decision, evidence, costs and operating constraints. Any requirement change needs an explicit decision.
- **Concrete contracts.** After platform selection, finalize catalog schema and release identifiers, local store scope and migrations, backup envelope and test fixtures, and invitation expiry and verification behavior. Keep the logical contracts in the architecture documents.
- **Personal data isolation.** Use the proposed adult-scoped storage and export-only expiry behavior below for the proof of concept. Escalate if the candidate cannot enforce app-level isolation.
- **Product and editorial defaults.** Review the proposed upper age boundary, month-end arithmetic and content identity rules in the data model. Pin the CDC source editions, document reuse rights, and assign review ownership before publishing the production catalog. Synthetic fixtures can support implementation while this work proceeds.

## Implementation order

1. Implement catalog validation, checkpoint selection and stable ID resolution using synthetic fixtures. This can start during deployment evaluation. Verify DM-A01–04 and DM-A08.
2. Implement invitation verification and catalog delivery, then the milestone-first flow and standalone library. Verify IF-A01–03 and catalog authorization with direct resource requests.
3. Add device-local profiles, favorites and practice history. Add cache reopening and expiry checks. Verify LS-A01–02 and DM-A05.
4. Add encrypted backup and atomic restore. Verify LS-A03–05 and DM-A06, including a fixture with retired or missing references.
5. Connect private publication and automatic catalog refresh. Verify CP-A01–05, IF-A04 and LS-A06 with the two-release fixture.
6. Validate the reviewed launch catalog, then exercise the main parent flows on the target mobile browsers. Keep the FR, DEC and acceptance IDs in implementation tasks and verification evidence.

## Engineering defaults for the first pass

- Apply the five-year checklist until the sixth birthday. For a birth day absent from the target month, count completed months using the last day of that month. Use the age-range and checkpoint rules in DM-003 and DM-004.
- Preserve stable IDs for editorial revisions. Assign a new ID when the checkpoint, milestone meaning or activity procedure materially changes. Preserve the previous reference and its history.
- Scope personal records to the verified adult within a browser using a stable opaque account identifier. A second invited adult using the same browser starts with a separate local store. Treat the browser profile as a trusted device context. During the proof of concept, verify that switching accounts cannot expose another adult's data through app screens.
- When guide authorization expires, block guide content and ordinary personal screens. Keep password-protected export available only for the current local adult context. Explicit sign-out clears that context and hides its records until the adult verifies again. Keep local data intact. Restore requires an active verified context and replaces only that adult's local records. A new device can recover records from an encrypted backup independently of the backup's original access identity.
- Choose concrete wire formats, local persistence, backup encryption suite and fixtures once the deployment path is known. Use maintained platform cryptography and document the format and compatibility tests before implementing restore. Ask for product input only if a choice changes a confirmed behavior, privacy boundary or operating commitment.
- Use synthetic content for engineering. The designated maintainer selects the production CDC editions and approves provenance, reuse rights, safety and launch coverage before publication.
