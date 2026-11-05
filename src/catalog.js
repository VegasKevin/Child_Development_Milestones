function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
const text = value => typeof value === 'string' && value.trim().length > 0;
const whole = value => Number.isSafeInteger(value) && value >= 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function date(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function texts(value, nonempty = false) {
  return Array.isArray(value) && (!nonempty || value.length > 0) && value.every(text);
}

function url(value) {
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}

function fields(item, names) {
  for (const name of names) requireValue(text(item[name]), `${item.id ?? 'Record'} requires ${name}`);
}

function references(ids, target, owner, nonempty = false) {
  requireValue(texts(ids, nonempty) && new Set(ids).size === ids.length && ids.every(id => target.has(id)),
    `${owner} has invalid or dangling references`);
}

/** Validate a complete English catalog snapshot, not a patch. Throws before activation. */
export function validateCatalog(catalog, { launch = false, expectedCheckpointAges } = {}) {
  requireValue(record(catalog), 'Catalog must be an object');
  requireValue(catalog.schemaVersion === 1, 'Unsupported catalog schema version');
  fields(catalog, ['id', 'summary']);
  requireValue(typeof catalog.publishedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(catalog.publishedAt) &&
    date(catalog.publishedAt.slice(0, 10)) && Number.isFinite(Date.parse(catalog.publishedAt)), 'Invalid publication instant');

  const maps = {};
  for (const name of ['sources', 'categories', 'skills', 'checkpoints', 'milestones', 'activities', 'externalResources', 'retired']) {
    requireValue(Array.isArray(catalog[name]), `Catalog requires ${name}`);
    maps[name] = new Map();
    for (const item of catalog[name]) {
      requireValue(record(item) && text(item.id), `Invalid ${name} record`);
      // Retired IDs are typed; different entity types may legitimately share an opaque ID.
      const key = name === 'retired' ? JSON.stringify([item.type, item.id]) : item.id;
      requireValue(!maps[name].has(key), `Duplicate ${name} ID: ${item.id}`);
      maps[name].set(key, item);
    }
  }

  for (const source of catalog.sources) {
    fields(source, ['title', 'organization', 'reuseInfo']);
    requireValue(url(source.originalUrl) && date(source.reviewDate), `Invalid source metadata: ${source.id}`);
    requireValue(text(source.edition) || date(source.referenceDate), `Source requires edition or reference date: ${source.id}`);
  }
  for (const item of [...catalog.categories, ...catalog.skills]) fields(item, ['label']);
  const ages = new Set();
  for (const checkpoint of catalog.checkpoints) {
    fields(checkpoint, ['label']);
    requireValue(whole(checkpoint.ageMonths) && !ages.has(checkpoint.ageMonths), 'Checkpoint ages must be unique whole months');
    ages.add(checkpoint.ageMonths);
    references([checkpoint.sourceId], maps.sources, checkpoint.id, true);
  }

  for (const [type, items] of [['milestone', catalog.milestones], ['activity', catalog.activities]]) {
    for (const item of items) {
      requireValue(whole(item.revision) && item.revision > 0, `Invalid revision: ${item.id}`);
      references(item.sourceIds, maps.sources, item.id, true);
      if (item.skillIds !== undefined) references(item.skillIds, maps.skills, item.id);
      if (item.externalResourceIds !== undefined) references(item.externalResourceIds, maps.externalResources, item.id);
      if (type === 'milestone') {
        fields(item, ['originalCategory', 'sourceStatement', 'explanation']);
        references([item.checkpointId], maps.checkpoints, item.id, true);
        references([item.sourceId], maps.sources, item.id, true);
        references([item.categoryId], maps.categories, item.id, true);
        requireValue(texts(item.examples, true), `Milestone requires examples: ${item.id}`);
      } else {
        fields(item, ['title']);
        requireValue(date(item.reviewDate) && texts(item.materials) && texts(item.instructions, true) && texts(item.safetyWarnings),
          `Activity requires reviewed instructions, materials and safety warnings: ${item.id}`);
        if (item.durationMinutes !== undefined) requireValue(whole(item.durationMinutes) && item.durationMinutes > 0,
          `Activity duration must be positive whole minutes: ${item.id}`);
        if (item.setting !== undefined) requireValue(['indoor', 'outdoor', 'either'].includes(item.setting),
          `Activity setting must be indoor, outdoor or either: ${item.id}`);
        const suitability = item.suitability;
        requireValue(record(suitability), `Missing suitability: ${item.id}`);
        if (Object.hasOwn(suitability, 'checkpointIds')) {
          requireValue(!Object.hasOwn(suitability, 'minMonths') && !Object.hasOwn(suitability, 'maxMonths'), 'Ambiguous suitability');
          references(suitability.checkpointIds, maps.checkpoints, item.id, true);
        } else {
          requireValue(whole(suitability.minMonths) && whole(suitability.maxMonths) && suitability.minMonths <= suitability.maxMonths,
            `Invalid suitability range: ${item.id}`);
        }
      }
    }
  }

  for (const resource of catalog.externalResources) {
    fields(resource, ['title', 'provider']);
    requireValue(url(resource.originalUrl) && date(resource.reviewDate), `Invalid external resource: ${resource.id}`);
    requireValue([...catalog.activities, ...catalog.milestones].some(item => item.externalResourceIds?.includes(resource.id)),
      `External resource requires an association: ${resource.id}`);
  }

  requireValue(Array.isArray(catalog.links), 'Catalog requires links');
  const pairs = new Set(), positions = new Set(), linked = new Set(), covered = new Set();
  for (const link of catalog.links) {
    requireValue(record(link), 'Invalid link');
    const milestone = maps.milestones.get(link.milestoneId), activity = maps.activities.get(link.activityId);
    requireValue(milestone && activity, 'Dangling milestone activity link');
    requireValue(date(link.reviewDate) && whole(link.position), 'Invalid link review or editorial position');
    const pair = JSON.stringify([link.milestoneId, link.activityId]);
    const position = JSON.stringify([link.milestoneId, link.position]);
    requireValue(!pairs.has(pair) && !positions.has(position), 'Duplicate link or editorial position');
    pairs.add(pair); positions.add(position);
    const checkpoint = maps.checkpoints.get(milestone.checkpointId);
    const suitability = activity.suitability;
    requireValue(suitability.checkpointIds ? suitability.checkpointIds.includes(checkpoint.id) :
      checkpoint.ageMonths >= suitability.minMonths && checkpoint.ageMonths <= suitability.maxMonths,
    `Link does not meet activity suitability: ${activity.id}`);
    linked.add(activity.id); covered.add(checkpoint.id);
  }
  for (const activity of catalog.activities) requireValue(linked.has(activity.id), `Active activity has no reviewed milestone link: ${activity.id}`);

  for (const item of catalog.retired) {
    fields(item, ['label']);
    requireValue(['milestone', 'activity'].includes(item.type) && ['retired', 'withdrawn'].includes(item.disposition), 'Invalid retired identity');
    requireValue(!maps[item.type === 'activity' ? 'activities' : 'milestones'].has(item.id), 'Retired identity is also active');
    requireValue(Object.keys(item).every(key => ['id', 'type', 'label', 'disposition'].includes(key)), 'Retired identity must be minimal');
  }

  if (launch) {
    requireValue(Array.isArray(expectedCheckpointAges) && expectedCheckpointAges.length > 0 &&
      expectedCheckpointAges.every(whole) && new Set(expectedCheckpointAges).size === expectedCheckpointAges.length &&
      ages.size === expectedCheckpointAges.length && expectedCheckpointAges.every(age => ages.has(age)),
    'Launch requires an explicit complete approved checkpoint inventory');
    for (const checkpoint of catalog.checkpoints) requireValue(covered.has(checkpoint.id), `Launch checkpoint requires a linked activity: ${checkpoint.id}`);
  }
}

/** Read only from a validated release; links are ordered separately per milestone. */
export function linkedActivities(catalog, milestoneId) {
  const activities = new Map(catalog.activities.map(item => [item.id, item]));
  return catalog.links.filter(link => link.milestoneId === milestoneId)
    .sort((a, b) => a.position - b.position).map(link => activities.get(link.activityId));
}
