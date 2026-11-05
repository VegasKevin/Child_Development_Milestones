# Content pipeline

Status — MVP specification draft. This defines the publication contract independently of the authoring format, tooling, and host. See [data model](data-model.md) and [interview decisions](architecture-interview-decisions.md). References use requirements.md, user-flows.md, and content-policy.md.

## Authoring and review

**CP-001 — Private editorial workspace** (FR-013, E1, DEC-013). A technical maintainer edits structured drafts in a private workspace and initiates publication. Parent access does not grant editorial permissions. The workspace has no access to local child records. Parent-facing delivery reads approved releases only.

**CP-002 — Review before publication** (FR-002–006, FR-013, content policy §§2–8). Each changed record and relationship must pass human review before publication. Record the approver, date, and the exact draft revision approved. A subsequent substantive edit requires fresh approval. One designated maintainer can edit, approve, and publish a revision under DEC-015.

- For CDC milestones, record the source edition or reference date and confirm behavior, checkpoint, original category, and reuse terms. Review authored explanations and category mappings separately from the CDC statement.
- For activities, review suitability, instructions, materials, identifiable safety risks, source attribution, and every direct milestone link. AI-generated activities are excluded.
- For external resources, review the original destination for accuracy, suitability and safety. Publish links to original providers. Include assets only when reuse rights have been verified.

Exact CDC source editions are selected and recorded when seeding the catalog.

## Validate, publish, and refresh

**CP-003 — Release validation** (FR-004, FR-012–013, DEC-006, DEC-012). Validate the candidate against DM-002 and DM-003 before it can become available. Reject missing required fields, unapproved changes, dangling relationships, duplicate milestone positions, active activities without a reviewed milestone link, and links inconsistent with suitability. Verify complete CDC checklist coverage and at least one approved activity per checkpoint for the initial release. Later safety withdrawals may leave activity coverage gaps.

**CP-004 — Release integrity** (FR-012–013, NFR-002, DM-006). Produce an immutable versioned catalog with a change summary. Publish a complete candidate before making it discoverable as the current release. A failed validation or publication leaves the current release usable. The parent app checks for updates when online and authorized, validates a candidate before activation, and keeps the last valid catalog if refresh fails. Applying a catalog release does not write personal records. The interfaces spec will define the discovery and retrieval contract.

**CP-005 — Revisions and withdrawals** (FR-012, DEC-007, DM-006). Preserve stable IDs for same-meaning revisions. Retire superseded identities and publish a withdrawal record for safety removals. A withdrawal takes effect in discovery, details, and cached views once the updated catalog is applied. Preserve personal references and entries as specified in DM-006. If an earlier release must be restored, publish a new release that preserves known safety withdrawals. A parent-facing change summary should identify meaningful additions, revisions, and withdrawals in plain language.

**CP-006 — Maintenance** (content policy §§7–11). The maintainer tracks CDC source updates and periodically reviews external links and safety reports. A broken link goes through editorial review before replacement. A safety withdrawal can be published independently of a replacement activity. Review cadence and response ownership remain operational decisions.

## Acceptance cases

| Case | Expected result |
| --- | --- |
| CP-A01 · An approved draft is edited | The changed revision requires review before it can be published. |
| CP-A02 · The last milestone link for an active activity is removed | Publication is rejected until the activity has a reviewed replacement link or is retired. |
| CP-A03 · Initial release lacks an activity at one checkpoint | Release validation reports the missing coverage. A later safety withdrawal can leave that same gap. |
| CP-A04 · Publication or download is interrupted | The last valid release remains usable subject to authorization. No personal records change. |
| CP-A05 · A previous catalog is restored after a safety withdrawal | The restored release keeps the withdrawal in force and does not restore the withdrawn instructions. |
