import { createHash } from 'node:crypto';

const expectedAges = [2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60];
const expectedLabels = ['2 months', '4 months', '6 months', '9 months', '1 year', '15 months', '18 months', '2 years', '30 months', '3 years', '4 years', '5 years'];
const pageRoot = 'https://www.cdc.gov/act-early/digital-online-checklist/';
const pageSlug = new Map([[2, '2-months'], [4, '4-months'], [6, '6-months'], [9, '9-months'], [12, '1-year'],
  [15, '15-months'], [18, '18-months'], [24, '2-years'], [30, '30-months'], [36, '3-years'], [48, '4-years'], [60, '5-years']]);
const categories = [
  'Social/Emotional',
  'Language/Communication',
  'Cognitive (learning, thinking, problem-solving)',
  'Movement/Physical Development',
];
const categorySlugs = new Map([
  ['Social/Emotional', 'social'],
  ['Language/Communication', 'language'],
  ['Cognitive (learning, thinking, problem-solving)', 'cognitive'],
  ['Movement/Physical Development', 'movement'],
]);
const expectedCounts = new Map([[2, 11], [4, 13], [6, 12], [9, 13], [12, 10], [15, 13], [18, 15], [24, 13], [30, 15], [36, 12], [48, 17], [60, 15]]);
const expectedDigests = new Map([
  [2, 'cd0a523be4b2f15a3cf53f36d2502cfc2fa73555839ea179996075548f6f8a81'],
  [4, '8ee32936e3198279634d0bf5c651b5dd8ad45468c763888ed18cb22a32048d4e'],
  [6, '11d6a40e3aabf617d4d3b13a7ee1258b769c74b17dabf1a6e0834f35086df2de'],
  [9, '76f0ac06a00c34fe772546c2279e99194fb24f15181f6c54c03b7afad86cb71d'],
  [12, '70bf80a68a5dfc96e069cd99efe072cbdf6bf4930cc92329fb9d07f754ea3855'],
  [15, 'cb6743dd7ea28da949558f69f34e3dea2bddd9b1f368e6f9f99578bb16a74e17'],
  [18, '394226a4ea7adbd9e37b0fb8a263c4f8c0737446b58ed840a1e49c512f60bf9a'],
  [24, '36e1ae64489dbff42ac2ee708278e758d8bd2c8d51a44b120d9056b7e3cc44db'],
  [30, 'f17a27baae4e86c3bf99727b376265aa1c7c2a4636ed4c2a7e8cd36f472b20fa'],
  [36, '9025ea61dff2816229130a94f1557c35e840d5d949fe438e23e0f6ed48052390'],
  [48, '457bf4612507b0cfb3c9f00f19d3dac26592a37eb5c6b70743d07d8ae85662dc'],
  [60, '3f9374aa7864b79b900b1ccaf2b0edf679748212e5fd2544fac356d149a0b8ab'],
]);
const pageUpdated = ageMonths => ageMonths === 60 ? '2026-02-16' : '2026-02-17';
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

function fingerprint(checkpoint) {
  const normalized = checkpoint.milestones.map(item => [item.originalCategory, item.sourceStatement]);
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

/** Validate source provenance and the independently reviewed CDC transcription snapshot. */
export function validateCdcCatalog(register, draft) {
  const issues = [];
  const add = (code, path, message) => issues.push({ code, path, message });

  if (!isRecord(register) || !isRecord(draft)) {
    add('invalid-document', '$', 'The source register and CDC draft must both be JSON objects.');
    return { issues, checkpointCount: 0, milestoneCount: 0 };
  }

  if (register.edition !== 'February 2022 revised milestone checklists') {
    add('edition-mismatch', 'register.edition', 'Record the selected CDC checklist edition exactly.');
  }
  if (register.authority?.organization !== 'Centers for Disease Control and Prevention') {
    add('authority-mismatch', 'register.authority.organization', 'CDC must remain the primary milestone authority.');
  }
  if (!isDate(register.sourceObservedAt)) {
    add('invalid-source-observed-date', 'register.sourceObservedAt', 'Record the date the official source inventory was checked.');
  }
  for (const [field, message] of [
    ['attributionRequired', 'Attribution must be preserved.'],
    ['nonEndorsementRequired', 'The CDC non-endorsement disclaimer must be preserved.'],
    ['substantiveContentMustRemainUnchanged', 'CDC source statements must remain substantively unchanged.'],
    ['mustSayAvailableFromAgencyAtNoCharge', 'Attribution must state that CDC makes the material available at no charge.'],
    ['linkDirectlyAndReviewUpdates', 'The catalog must link directly to sources and require update review.'],
    ['excludeThirdPartyMaterialAndAgencyMarks', 'Third-party materials and CDC marks must be excluded unless separately cleared.'],
  ]) {
    if (register.reuse?.[field] !== true) add('reuse-policy-incomplete', `register.reuse.${field}`, message);
  }
  if (register.reuse?.policyUrl !== 'https://www.cdc.gov/other/agencymaterials.html') {
    add('reuse-policy-source-mismatch', 'register.reuse.policyUrl', 'Link to CDC use-of-materials guidance.');
  }

  if (draft.status !== 'draft-pending-human-review') {
    add('draft-status-invalid', 'draft.status', 'This catalog cannot be marked approved without a documented human review.');
  }
  if (draft.sourceRegister !== './cdc-source-register.json') {
    add('source-register-reference-mismatch', 'draft.sourceRegister', 'The draft must point to the checked CDC source register.');
  }
  if (typeof draft.edition !== 'string' || !draft.edition.includes('February 2022 revised CDC milestone checklist framework') ||
      !draft.edition.includes('current CDC online checklist pages reviewed February 17, 2026')) {
    add('draft-edition-metadata-incomplete', 'draft.edition', 'Distinguish the checklist edition from current online page metadata.');
  }
  for (const phrase of ['Centers for Disease Control and Prevention', 'available from CDC at no charge', 'not endorsed by CDC']) {
    if (typeof draft.attribution !== 'string' || !draft.attribution.includes(phrase)) {
      add('incomplete-attribution', 'draft.attribution', `Attribution must include: ${phrase}.`);
    }
  }

  const registerCheckpoints = Array.isArray(register.checkpoints) ? register.checkpoints : [];
  const draftCheckpoints = Array.isArray(draft.checkpoints) ? draft.checkpoints : [];
  const registerAges = registerCheckpoints.map(item => item?.ageMonths);
  const draftAges = draftCheckpoints.map(item => item?.ageMonths);
  if (JSON.stringify(registerAges) !== JSON.stringify(expectedAges) || JSON.stringify(draftAges) !== JSON.stringify(expectedAges)) {
    add('checkpoint-age-inventory', 'checkpoints', 'The CDC draft and source register must each contain the 12 official ages in order.');
  }
  if (registerCheckpoints.length !== expectedAges.length || draftCheckpoints.length !== expectedAges.length) {
    add('checkpoint-count', 'checkpoints', 'Exactly 12 CDC checklist checkpoints are required.');
  }

  const seenCheckpointIds = new Set();
  const seenMilestoneIds = new Set();
  let milestoneCount = 0;
  for (let index = 0; index < expectedAges.length; index += 1) {
    const ageMonths = expectedAges[index];
    const registered = registerCheckpoints[index];
    const checkpoint = draftCheckpoints[index];
    if (!isRecord(registered) || !isRecord(checkpoint)) {
      add('checkpoint-record-invalid', `checkpoints[${index}]`, 'A register and draft record are required for every official checkpoint.');
      continue;
    }
    if (checkpoint.id !== `cdc-checkpoint-${ageMonths}m`) {
      add('checkpoint-id-mismatch', `checkpoints[${index}].id`, `Expected stable checkpoint identity cdc-checkpoint-${ageMonths}m.`);
    }
    if (seenCheckpointIds.has(checkpoint.id)) add('duplicate-checkpoint-id', `checkpoints[${index}].id`, `Duplicate checkpoint identity: ${checkpoint.id}.`);
    if (typeof checkpoint.id === 'string') seenCheckpointIds.add(checkpoint.id);
    if (registered.label !== expectedLabels[index] || checkpoint.label !== expectedLabels[index]) {
      add('checkpoint-label-mismatch', `checkpoints[${index}].label`, `The label for ${ageMonths} months does not match the CDC age.`,);
    }
    const officialUrl = `${pageRoot}${pageSlug.get(ageMonths)}.html`;
    if (registered.ageMonths !== ageMonths || checkpoint.ageMonths !== ageMonths || checkpoint.label !== registered.label ||
        registered.originalUrl !== officialUrl || checkpoint.sourceUrl !== officialUrl) {
      add('checkpoint-source-mismatch', `checkpoints[${index}]`, `The ${ageMonths}-month draft must reference its matching official CDC page.`);
    }
    if (checkpoint.pagePublished !== '2025-09-04' || checkpoint.pageUpdated !== pageUpdated(ageMonths) || checkpoint.pageReviewed !== '2026-02-17') {
      add('source-page-date-mismatch', `checkpoints[${index}]`, `The ${ageMonths}-month page publication, update, or review date differs from the checked source.`);
    }
    const registeredCategories = Array.isArray(registered.originalCategories) ? registered.originalCategories : [];
    if (JSON.stringify(registeredCategories) !== JSON.stringify(categories)) {
      add('register-category-inventory', `register.checkpoints[${index}].originalCategories`, `The ${ageMonths}-month source register must retain all four CDC category names.`);
    }

    const items = Array.isArray(checkpoint.milestones) ? checkpoint.milestones : [];
    milestoneCount += items.length;
    if (items.length !== expectedCounts.get(ageMonths)) {
      add('checkpoint-milestone-count', `checkpoints[${index}].milestones`, `Expected ${expectedCounts.get(ageMonths)} source statements at ${ageMonths} months; found ${items.length}.`);
    }
    const foundCategories = new Set();
    const categoryOrdinals = new Map();
    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      const item = items[itemIndex];
      const itemPath = `checkpoints[${index}].milestones[${itemIndex}]`;
      if (!isRecord(item)) {
        add('milestone-record-invalid', itemPath, 'A milestone must be a JSON object.');
        continue;
      }
      if (typeof item.id !== 'string' || !item.id.trim()) {
        add('milestone-id-missing', `${itemPath}.id`, 'Each milestone needs a stable nonempty ID.');
      } else if (seenMilestoneIds.has(item.id)) {
        add('duplicate-milestone-id', `${itemPath}.id`, `Duplicate milestone identity: ${item.id}.`);
      } else {
        seenMilestoneIds.add(item.id);
      }
      if (!categories.includes(item.originalCategory) || !Array.isArray(registered.originalCategories) ||
          !registered.originalCategories.includes(item.originalCategory)) {
        add('unrecognized-category', `${itemPath}.originalCategory`, 'Keep the category exactly as CDC publishes it.');
      } else {
        foundCategories.add(item.originalCategory);
        const ordinal = (categoryOrdinals.get(item.originalCategory) ?? 0) + 1;
        categoryOrdinals.set(item.originalCategory, ordinal);
        const expectedId = `cdc-${ageMonths}m-${categorySlugs.get(item.originalCategory)}-${String(ordinal).padStart(2, '0')}`;
        if (item.id !== expectedId) {
          add('milestone-id-mismatch', `${itemPath}.id`, `Expected stable source identity ${expectedId} for this age, category, and order.`);
        }
      }
      if (typeof item.sourceStatement !== 'string' || !item.sourceStatement.trim()) {
        add('source-statement-missing', `${itemPath}.sourceStatement`, 'Each CDC milestone needs its source statement.');
      }
      const allowedFields = ['id', 'originalCategory', 'sourceStatement'];
      if (Object.keys(item).some(key => !allowedFields.includes(key))) {
        add('unreviewed-milestone-fields', itemPath, 'Keep authored explanations and mappings out of this source transcript draft.');
      }
    }
    for (const category of registeredCategories) {
      if (!foundCategories.has(category)) add('missing-category', `checkpoints[${index}].milestones`, `No ${category} records were transcribed for ${ageMonths} months.`);
    }
    const fingerprintable = items.every(item => isRecord(item) && typeof item.originalCategory === 'string' && typeof item.sourceStatement === 'string');
    if (items.length && fingerprintable && expectedDigests.has(ageMonths) && fingerprint(checkpoint) !== expectedDigests.get(ageMonths)) {
      add('checkpoint-content-fingerprint', `checkpoints[${index}].milestones`, `The ${ageMonths}-month statements or categories differ from the reviewed source snapshot.`);
    }
  }

  if (milestoneCount !== 159) add('milestone-count', 'checkpoints', `Expected 159 source statements across all checkpoints; found ${milestoneCount}.`);
  return { issues, checkpointCount: draftCheckpoints.length, milestoneCount };
}
