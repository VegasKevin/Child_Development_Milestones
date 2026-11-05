# Architecture interview decisions

## Confirmed

- **DEC-001 | Before the first CDC checkpoint.** For children younger than two months, explain the coverage boundary and offer an optional, clearly labeled preview of the two-month checklist. The preview is separate from the applicable-checkpoint view. References: FR-001, FR-002, P1, P2.
- **DEC-002 | MVP tracking.** Favorites belong to a selected local child profile. Milestone tracking is limited to favorites. A single Log practice action records an activity session with a date, optional difficulty, and optional notes. Attempts and completions share the same record type without a completion field. References: FR-007, FR-008, P3, P4, P5.

- **DEC-003 | Birth-based profiles.** Saved profiles based on an exact birth date or birth month and year derive the current age as time passes. Month/year input retains its approximate precision. References: FR-001, P2.

- **DEC-004 | Temporary age entry.** Saved profiles use exact birth date or birth month and year. Direct age entry in months is for temporary browsing. This supersedes the saved manual-age mode in the draft of FR-001 and the corresponding returning-profile behavior in P2.

- **DEC-005 | Approximate age at a checkpoint boundary.** If the possible ages derived from a saved birth month and year span two CDC checklists, default to the younger checklist, label the age approximate, and offer the next checklist as a labeled preview. If the range spans the first checkpoint, retain the coverage message and optional preview from DEC-001. References FR-001, FR-002, P2.

- **DEC-006 | Required milestone links.** Every published activity must have at least one direct, reviewed link to a specific CDC milestone. The standalone library is another way to find those same activities. Skill tags support discovery. Each milestone placement has its own editorial order. This supersedes the skill-only publication allowance in the draft of FR-004. Publication validation must check for orphaned activities when a milestone or link is retired. References FR-004, FR-005, FR-013, P6, E1, and content policy section 4.

- **DEC-007 | Safety withdrawals and personal records.** After receiving a safety withdrawal, the app removes the activity from discovery and stops displaying its instructions and resource links, including cached copies. A parent’s favorite remains visible and marked Withdrawn. Dated practice entries, ratings, and notes remain readable. References FR-007, FR-008, FR-012, P3, P5, and content policy section 9.

- **DEC-008 | Password-protected backups.** MVP manual backups require a password and encrypt personal records in the exported file. Restore requires the password. Explain before export that losing the password prevents recovery from that file. References FR-009, FR-010, P8.

- **DEC-009 | Invite-only parent guide.** The guide must enforce access for invited people. Forwarding the guide URL alone does not grant access. This supersedes unrestricted anonymous entry in P1 and qualifies the no-sign-in expectations in FR-001 and FR-009. Temporary browsing without a child profile and local-only personal records remain requirements. The invitation mechanism and whether it requires an account are open. Private editorial access remains separate. References vision section 3, FR-001, FR-009, FR-013, FR-015, P1.

- **DEC-010 | Seven-day offline guide access.** An invited parent can reopen cached guide content offline for seven days after the last successful online access check. A known revocation blocks guide access immediately. Without connectivity, guide access ends at local expiry. The parent can still export local personal records after guide access ends. References FR-010, FR-011, FR-015, P7, DEC-009.

- **DEC-011 | Email invitations.** Invite a specific email address and verify access without a password on each device. An invited parent can verify on a replacement device. Access identity is separate from child profiles and practice data, which remain local and move by manual backup and restore. References FR-009, FR-010, FR-015, DEC-009, DEC-010.

- **DEC-012 | Launch activity coverage.** Require at least one approved, directly linked activity at every published CDC checkpoint at initial launch. Individual milestones and categories may have gaps. The complete CDC milestone catalog remains required. Later safety withdrawals can be published even if they leave a coverage gap. References FR-002, FR-003, FR-004, DEC-006, DEC-007, and content policy section 11.

- **DEC-013 | Editorial authoring workflow.** A technical maintainer edits structured files in a private workspace. Validate the catalog and require human approval before publishing. A private form-based editor is deferred. Authoring format and tooling remain open. References FR-013, E1, and content policy section 7.

- **DEC-014 | Corrected-age browsing.** A parent can enter a temporary corrected age in months while browsing with a selected child. The override controls checklist selection for the current session. Favorites and practice entries still belong to the selected child. The override is excluded from the saved profile and backup. References FR-001, FR-002, P2, DEC-004, and CDC checklist guidance.

- **DEC-015 | Editorial authority.** One designated maintainer can edit, approve, and publish content changes. Human review is required for each published revision. A second approver is optional. References FR-013, E1, and content policy section 7.

## Open for specification and deployment evaluation

- Define the upper browsing boundary, the exact source editions, and the validation cases for age arithmetic and checkpoint selection.
- Specify stable content identity, revisions, activity suitability and publication validation, and restoration of unresolved references.
- Evaluate both deployment candidates against invite-only access, per-device email verification, seven-day offline guide access, local persistence, encrypted backup and restore, and independent publication.
