# Coding agent entry point

Build a milestone-first child development guide. Invited adults browse CDC behaviors and human-reviewed activities. Child records stay on the device. Hosting remains open.

## Run the local guide

Run `npm.cmd run dev` on Windows, or `npm run dev` elsewhere, and open `http://127.0.0.1:4173`.
This local demo uses fictional catalog content for temporary-age browsing, milestone details, linked activities and standalone activity search.
See [the guide instructions](guide/README.md) for scope and browser checks.
Login and hosting evaluation are deferred; this demo does not select a deployment platform.

## First task

Start with platform-neutral checkpoint selection, catalog validation, and stable-reference resolution using fictional data. Read **DM-002–004, DM-006 and DM-A01–04/A08** in the [data model](data-model.md). Produce a small runnable check and two synthetic catalog releases, with one activity withdrawn in the second release. Report the acceptance IDs exercised.

Then run the [hosting proof of concept](deployment-evaluation.md) for OpenAI Sites and an independently hosted PWA. Report verified results and recommend a candidate before committing to production hosting or paid services. Continue independent work if a test is blocked.

## Load references by task

| Task | Read when needed |
| --- | --- |
| Age, catalog records, content relationships | [Data model](data-model.md) |
| Invitation, access expiry, catalog delivery | [Interfaces](interfaces.md), IF-001–005 |
| Profiles, favorites, practice history, offline storage, backups | [Local storage](local-storage.md) and DM-005–007 |
| Review, publishing, updates and safety withdrawals | [Content pipeline](content-pipeline.md) |
| Mobile navigation and screen layouts | [Mobile UI plan and owner-supplied references](mobile-ui.md) |
| System boundaries | [Overview](overview.md) |
| Implementation order, product changes and engineering defaults | [Coding handoff](coding-handoff.md) |
| Rationale or conflict with a product draft | [Confirmed decisions](architecture-interview-decisions.md) |

Read only the cited requirements and acceptance cases for the current task. Follow confirmed interview decisions when an older product draft conflicts. Use the handoff defaults for reversible choices. Escalate changes to confirmed behavior, privacy boundaries, or operating commitments.
