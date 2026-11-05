# Product Vision — Child Development Milestone Guide

**Document status:** Draft baseline for review  
**Last revised:** 2026-11-04  
**Authority:** Product decisions documented in the requirements interview  
**Scope:** MVP; platform-neutral

## 1. Problem and purpose

Parents of children from birth through five years want a clear, trustworthy way to understand developmentally relevant behaviors and find practical ways to practice skills with their children. Online information varies widely in credibility and often requires substantial searching. This product brings **CDC-based milestone information** and **human-curated activities** together in a concise, parent-directed experience.

## 2. Product statement

A free, milestone-first guide for parents of children ages 0–5 that presents age-appropriate CDC developmental behaviors by category, explains each behavior in plain language, and directly connects it to vetted activities and demonstrations. Parents can optionally save favorites and local observations of activity practice.

## 3. Intended audience

- **Primary:** Parents and caregivers of children ages 0–5.
- **Initial distribution:** Small group, shared privately, not publicly marketed. A shared URL is not access control.
- **Launch language:** English. Content architecture should accommodate future translations.
- **Not aimed at:** Children as direct users or medical professionals conducting formal assessments.

## 4. Product principles — confirmed

1. **Milestones first.** The principal experience is a compact list of age-relevant behaviors grouped by developmental category. The child's age comes from an optional local profile or temporary age entry.
2. **CDC is the primary milestone authority.** Present verified CDC age checkpoints and behavior definitions; do not invent monthly expectations or claim that checkpoints are diagnostic deadlines.
3. **Parents direct the experience.** They select the behaviors they want to explore. The application does not assess, score, rank, diagnose, or proactively coach a child's development.
4. **Activities are curated, not generated.** Every published activity is human reviewed and associated with approved milestone/skill relationships. No AI-generated activities or AI ranking in MVP.
5. **Help first, detail on demand.** Milestone and activity views show useful essentials immediately, with further context and references available through progressive disclosure.
6. **Privacy by default.** Store child profiles, saved items, and activity records locally; avoid accounts and unnecessary personally identifiable information.
7. **Small, sustainable build.** Favor a low-maintenance, low-cost delivery approach. Compare OpenAI Sites and an independently hosted PWA before selecting a platform.

## 5. Primary journey — confirmed

1. Parent opens the application; if a saved child profile exists, the app uses that child's age. Otherwise the parent enters an age temporarily.
2. App shows the applicable CDC milestone checkpoint, grouped into parent-friendly developmental categories.
3. Parent opens a behavior to see a concise explanation and everyday examples.
4. App immediately shows the curated activities and reviewed supporting links associated with that behavior, in a human-defined order.
5. Parent may favorite a behavior or activity, and may log an activity attempt/completion with date, subjective child difficulty, and optional notes.
6. Parent can review prior sessions for an individual activity to recall changes they observed.

## 6. MVP outcomes (qualitative; not performance targets)

- A parent can find the CDC-based behaviors relevant to their child's age without searching the broader web.
- A parent can open a behavior and immediately locate trustworthy activity instructions or demonstrations where curated coverage exists.
- A parent can return to favorite resources and recall how an activity went previously.
- Personal observations are not uploaded to the content host as part of normal app usage.
- Content editors can make updates without editing parent data or releasing a new mobile binary.

## 7. Explicit exclusions — confirmed

- Clinical screening, diagnostic interpretation, developmental scores, or declaring a child ahead/behind.
- AI-authored activity recommendations, semantic/vector retrieval, or automated developmental coaching.
- Automatic multi-device synchronization, cloud accounts, family-sharing permissions.
- Hosting/uploading video content or building a standalone video library.
- A sophisticated progress dashboard or formal multi-stage editorial approvals.
- Native-app distribution as a committed MVP requirement.

## 8. Status and open decisions

**Confirmed:** Audience, CDC-first milestone framework, curated activity library, milestone-first navigation, optional local tracking, limited distribution, English MVP, partial offline support, manual backups, separate content-management workflow.

**Proposed, not yet approved:** IndexedDB for personal records; versioned static JSON as delivery format; specific technologies for the admin/editor workflow; precise checklist and activity schemas.

**Open:** Final deployment choice (OpenAI Sites vs independent PWA), technical feasibility and policy constraints of Sites, precise source licensing/reuse terms, concrete content coverage and release acceptance threshold, local storage recovery UX, and whether any optional milestone status beyond favorites/notes is needed.

## 9. Related documents

- [`requirements.md`](requirements.md): functional and nonfunctional requirements and acceptance criteria.
- [`user-flows.md`](user-flows.md): parent and content-management flows.
- [`content-policy.md`](content-policy.md): CDC milestone authority and editorial rules.
