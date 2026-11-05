# Content and Evidence Policy — Child Development Milestone Guide

**Status:** Draft editorial policy; implementation details open  
**Last revised:** 2026-11-04  
**Primary milestone authority:** U.S. Centers for Disease Control and Prevention (CDC)

## 1. Purpose

Ensure the app presents authoritative developmental milestone information and human-reviewed practical activities, with clear provenance and without inventing developmental expectations or making clinical judgments.

## 2. Authority hierarchy

| Content type | Source standard | Publication rule |
|---|---|---|
| **Milestone behaviors, checkpoints and original categories** | **CDC developmental milestones** as the primary framework | Only include verified CDC-defined milestone records with their associated checkpoints and attribution |
| Explanations and context | CDC first; other reputable pediatric, medical, public-health or academic sources may supplement | Clearly distinguish authored explanation from the original CDC behavior and ensure consistency with it |
| Activities, demonstrations and parenting resources | Credible pediatric, public-health, academic, early-childhood education and other reviewed sources | Human-reviewed for usefulness, age suitability, safety and relevance; evidence may be less definitive than milestone evidence |

**Confirmed resolution of earlier debate:** A unified, human-reviewed catalog is desired, with **CDC as the definitive milestone framework**. External sources may supplement context and activities; they do not silently override CDC checkpoint assignments.

## 3. Milestone content rules

1. Preserve each CDC milestone's meaning, checkpoint and traceable source reference.
2. Do not fabricate developmental milestones for months between published CDC checkpoints.
3. Do not treat CDC milestones as diagnoses, normative percentile scores, or rigid individual deadlines.
4. Keep original CDC category information even if the app uses a more granular, parent-friendly category map (e.g., fine vs gross motor).
5. Review any changed category mapping before publication; do not let AI infer mappings at runtime.
6. Any substantive wording or checkpoint difference must be researched and resolved by a human before inclusion.
7. If CDC updates guidance, record the version/reference date and editorial review before publishing the corresponding change.
8. Keep original descriptions distinguishable from explanatory paraphrases where relevant.

**Open technical/content decision:** Exact age-to-checkpoint selection behavior between CDC published ages. This requires a source-consistent policy before implementation.

## 4. Activity publication rules

Each activity should have, at minimum:

- Stable identifier and title.
- Intended age range or applicable age checkpoints.
- Skills supported and directly reviewed milestone associations, if any.
- Materials and essential step-by-step instructions.
- Reviewed source URL and source organization/title.
- Display order within each linked milestone (editor-controlled).
- Applicable safety warnings.
- Editorial review status/date and last revision date.

Optional fields: estimated duration, indoor/outdoor setting, photographs or illustrations, approved variations, parent observation cues, external instructional video links, and further resource links.

**No AI-generated activity content in MVP.** Research assistance may help discover sources and draft structured records, but humans verify and approve information before publication. Do not assume a promising activity is clinically proven simply because it is popular or widely shared.

## 5. Video and external resources

- For MVP, **link to the original video/resource**; do not host or embed videos as a dependency.
- Videos must be inspected by a human for relevance, clarity, accuracy, age appropriateness, and safety.
- Store resource title, provider, source URL and review date.
- Do not present a linked video as the CDC's recommendation unless that specific endorsement is supported.
- External resources may become unavailable, change, or require internet connectivity. Display them as external links.
- A separately curated video library is future scope.

## 6. Safety and clinical boundaries

- Include specific safety guidance for identifiable risks (e.g., choking hazards, supervision near water/heights, unsafe materials) without repeating generic warnings unnecessarily.
- Explain that parents' observations are subjective and not validated developmental assessments.
- Do not infer a developmental delay from difficulty ratings, missing activity records, or nonobserved behaviors.
- Where authoritative guidance indicates potential concern or loss of previously acquired skills, communicate an appropriate recommendation to contact a pediatric healthcare professional; do not replace that consultation with activity suggestions.
- Do not label any activity as proven to treat or remediate a developmental disorder without evidence sufficient to support that specific claim.

## 7. Review and editorial workflow

**Confirmed:** Initial content is researched and human-reviewed. An authorized editor can subsequently add/edit/remove/publish content in a separate private workflow. A multi-person approval queue is not an MVP feature.

**Proposed workflow:**

1. Discover candidate CDC milestone/reference or activity resources.
2. Record the specific source and capture metadata.
3. Prepare the structured content record.
4. Manually review language, age suitability, provenance, relationships and safety.
5. Publish versioned catalog with stable IDs and human-readable release notes.
6. Periodically review sources and links for updates or breakage.

The format of drafts (Markdown, JSON, database, or editor-managed data) is **not decided**. Public runtime use should rely on published structured content rather than a GPT reading Markdown or performing live medical interpretation.

## 8. Copyright, licensing and attribution

- Verify reuse permissions for CDC text, graphics, downloadable content and any third-party articles, photographs or illustrations before distributing copies.
- Retain source URLs, titles, organizations and relevant publication/review dates.
- Linking externally is not permission to copy, host, alter, or redistribute third-party videos or images.
- Attribute supplemental content faithfully and do not misrepresent external material as CDC-originated.
- Future translations require human review to preserve medical and developmental meaning.

## 9. Catalog versioning and deletion

**Proposed engineering policy:**

- Stable IDs for every milestone, skill and activity referenced by local favorites or logs.
- Versioned published catalog and changelog with substantive modifications.
- Retire/redirect records instead of silently deleting IDs that may be referenced by parent histories.
- Keep parent records separate from public catalog updates.

These are design recommendations awaiting architecture approval, not decisions about a specific database or host.

## 10. Publication checklist

Before publishing a milestone or activity, verify:

- [ ] Source and URL are recorded and credible for the claim made.
- [ ] CDC milestone wording/checkpoint/category are faithfully represented when applicable.
- [ ] Explanatory text is understandable and does not imply diagnosis.
- [ ] Skill/milestone relationships were explicitly reviewed.
- [ ] Activity instructions are practical and safe for the intended age.
- [ ] Required metadata and editorial ordering are complete.
- [ ] External images/media are linked or licensed appropriately.
- [ ] Stable IDs and release notes are preserved for changes.

## 11. Current unresolved editorial decisions

- Exact CDC source publications and versions to seed the release catalog.
- Rules for choosing published CDC checkpoints for in-between ages.
- Minimum accepted activity coverage per age/category before launch (quality prioritized over arbitrary quantity).
- Which qualifications or review practices are required of the individual approving content (initially 'human review', not a mandated formal clinical governance process).
- How often to review source updates and check broken links.
