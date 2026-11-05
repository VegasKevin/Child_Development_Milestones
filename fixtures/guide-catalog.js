import { releaseOne } from './synthetic-catalogs.js';

// Entirely fictional local-demo metadata, not reviewed activity guidance.
// Keep the earlier engineering releases unchanged and use a distinct release ID.
export const guideCatalog = structuredClone(releaseOne);
Object.assign(guideCatalog, {
  id: 'synthetic-guide-release-1',
  publishedAt: '2026-01-03T12:00:00Z',
  summary: 'Fictional local guide with example duration and setting metadata.',
});
Object.assign(guideCatalog.activities[0], { revision: 2, durationMinutes: 5, setting: 'indoor' });
Object.assign(guideCatalog.activities[1], { revision: 2, durationMinutes: 15, setting: 'outdoor' });
