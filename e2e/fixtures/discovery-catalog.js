import { releaseOne } from '../../fixtures/synthetic-catalogs.js';
import { validateCatalog } from '../../src/catalog.js';

// Test-only, entirely fictional metadata. Never served by the local guide server.
export function discoveryCatalog() {
  const catalog = structuredClone(releaseOne);
  catalog.categories.push({ id: 'category-second', label: 'Second fictional category' },
    { id: 'category-unused', label: 'Unused fictional category' });
  catalog.skills.push({ id: 'skill-second', label: 'Second fictional skill' });
  catalog.milestones.find(item => item.id === 'milestone-6-other').categoryId = 'category-second';
  for (const [id, title, materials, skillIds, milestoneId] of [
    ['activity-cloth', 'Fictional cloth activity', ['Fictional cloth', 'Fictional material'], ['skill-second'], 'milestone-6-other'],
    ['activity-paper', 'Fictional paper activity', ['Fictional paper'], ['skill-fiction'], 'milestone-6'],
    ['activity-untagged', 'Fictional no-skill activity', ['Fictional cloth'], null, 'milestone-6-other'],
  ]) {
    const activity = { ...structuredClone(catalog.activities[0]), id, title, materials };
    if (skillIds) activity.skillIds = skillIds;
    else delete activity.skillIds;
    catalog.activities.push(activity);
    catalog.links.push({ milestoneId, activityId: id, position: catalog.links.length + 1, reviewDate: '2025-12-15' });
  }
  validateCatalog(catalog);
  return catalog;
}
