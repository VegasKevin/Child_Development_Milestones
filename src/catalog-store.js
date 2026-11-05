import { validateCatalog, linkedActivities } from './catalog.js';

const collection = type => type === 'activity' ? 'activities' : 'milestones';
const key = item => JSON.stringify([item.type, item.id]);
const text = value => typeof value === 'string' && value.trim().length > 0;

function canonical(value) {
  return JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(name => [name, item[name]])) : item);
}

function validateTransition(previous, next, equivalentEdits) {
  if (!Array.isArray(equivalentEdits) || equivalentEdits.some(item =>
    !item || !['milestone', 'activity'].includes(item.type) || !text(item.id))) {
    throw new Error('Equivalent edits require typed IDs from editorial review.');
  }
  const tombstones = new Map(next.retired.map(item => [key(item), item]));
  for (const retired of previous.retired) {
    if (canonical(tombstones.get(key(retired))) !== canonical(retired)) {
      throw new Error('Retired identities must retain their tombstones and disposition.');
    }
  }
  for (const checkpoint of previous.checkpoints) {
    const current = next.checkpoints.find(item => item.id === checkpoint.id);
    if (current && current.ageMonths !== checkpoint.ageMonths) throw new Error('A changed checkpoint age requires a new identity.');
  }
  for (const type of ['milestone', 'activity']) {
    const current = new Map(next[collection(type)].map(item => [item.id, item]));
    for (const old of previous[collection(type)]) {
      const item = current.get(old.id);
      if (!item) {
        if (!tombstones.has(key({ type, id: old.id }))) throw new Error('Removed identities require a retired tombstone.');
        continue;
      }
      const { revision: oldRevision, ...oldContent } = old;
      const { revision, ...content } = item;
      if (revision < oldRevision || (canonical(oldContent) !== canonical(content) && revision <= oldRevision)) {
        throw new Error('Changed content requires an incremented revision.');
      }
      if (type === 'milestone' && old.checkpointId !== item.checkpointId) {
        throw new Error('A changed checkpoint requires a new milestone identity.');
      }
      // Software cannot determine semantic equivalence from prose. An explicit editorial
      // declaration allows a same-meaning revision; otherwise use a new identity.
      const field = type === 'milestone' ? 'sourceStatement' : 'instructions';
      if (canonical(old[field]) !== canonical(item[field]) &&
          !equivalentEdits.some(edit => edit.type === type && edit.id === item.id)) {
        throw new Error('Changed behavior, checkpoint or instructions require a new identity and retirement.');
      }
    }
    for (const retired of previous.retired.filter(item => item.type === type)) {
      if (current.has(retired.id)) throw new Error('A retired or withdrawn identity cannot be reused.');
    }
  }
}

/** In-memory release boundary. Persistence, authorization and UI rendering are caller concerns. */
export function createCatalogStore(initialRelease, options) {
  let active = structuredClone(initialRelease);
  validateCatalog(active, options);
  const knownReleases = new Map([[active.id, canonical(active)]]);

  function resolve(reference) {
    if (!reference || !['activity', 'milestone'].includes(reference.type) || !text(reference.contentId) || !text(reference.label)) {
      throw new Error('A typed content ID and saved label are required.');
    }
    const item = active[collection(reference.type)].find(item => item.id === reference.contentId);
    const retired = active.retired.find(item => item.id === reference.contentId && item.type === reference.type);
    return {
      type: reference.type, id: reference.contentId,
      label: item ? (reference.type === 'activity' ? item.title : item.sourceStatement) : retired?.label ?? reference.label,
      status: item ? 'active' : retired?.disposition ?? 'unavailable',
      content: item ? structuredClone(item) : null,
    };
  }

  return Object.freeze({
    get releaseId() { return active.id; },
    resolve,
    activitiesForMilestone(milestoneId) {
      return structuredClone(linkedActivities(active, milestoneId));
    },
    apply(release, { equivalentEdits = [] } = {}) {
      // Clone and validate before assigning the active pointer. Any failure keeps the prior snapshot.
      const next = structuredClone(release);
      validateCatalog(next);
      const serialized = canonical(next);
      if (knownReleases.has(next.id)) {
        if (knownReleases.get(next.id) !== serialized) throw new Error('Release identity is immutable.');
        if (active.id !== next.id) throw new Error('An older release cannot roll back the active catalog.');
        return;
      }
      if (Date.parse(next.publishedAt) < Date.parse(active.publishedAt)) throw new Error('An older release cannot replace the active catalog.');
      validateTransition(active, next, equivalentEdits);
      knownReleases.set(next.id, serialized);
      active = next;
    },
    createPracticeEntry(context, activityId, details) {
      if (!text(context?.childId)) throw new Error('Practice requires a selected child.');
      const item = active.activities.find(item => item.id === activityId);
      if (!item) throw new Error('Practice requires an active activity.');
      const day = details?.practiceDate;
      if (!text(details?.id) || typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day ||
        (details.notes !== undefined && typeof details.notes !== 'string') ||
        (details.difficulty !== undefined && !['Easy', 'Moderate', 'Difficult'].includes(details.difficulty))) {
        throw new Error('Invalid practice details.');
      }
      return {
        id: details.id, childId: context.childId, activityId: item.id,
        activityRevision: item.revision, activityTitle: item.title, practiceDate: day,
        ...(details.notes !== undefined ? { notes: details.notes } : {}),
        ...(details.difficulty !== undefined ? { difficulty: details.difficulty } : {}),
      };
    },
  });
}
