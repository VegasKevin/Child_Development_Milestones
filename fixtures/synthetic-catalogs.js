// Entirely fictional engineering fixtures. No medical content or publication approval.
export const syntheticCheckpointAges = [2, 4, 6, 60];

export const releaseOne = {
  schemaVersion: 1,
  id: 'synthetic-release-1',
  publishedAt: '2026-01-01T12:00:00Z',
  summary: 'Fictional initial catalog for engineering checks only.',
  sources: [{
    id: 'source-fiction', title: 'Fictional checklist source', organization: 'Fictional source organization',
    originalUrl: 'https://example.invalid/source', referenceDate: '2025-12-01',
    reviewDate: '2025-12-15', reuseInfo: 'Synthetic text only; no CDC text reproduced.',
  }],
  categories: [{ id: 'category-fiction', label: 'Fictional category' }],
  skills: [{ id: 'skill-fiction', label: 'Fictional skill' }],
  checkpoints: syntheticCheckpointAges.map(ageMonths => ({
    id: `checkpoint-${ageMonths}`, ageMonths, label: `Fictional ${ageMonths}-month checklist`, sourceId: 'source-fiction',
  })),
  milestones: [2, 4, 6, 60, '6-other'].map(age => ({
    id: `milestone-${age}`, revision: 1, checkpointId: `checkpoint-${age === '6-other' ? 6 : age}`,
    originalCategory: 'Fictional source category', sourceStatement: `Fictional behavior ${age}.`,
    sourceId: 'source-fiction', categoryId: 'category-fiction',
    explanation: 'Fictional authored explanation, separate from source wording.',
    examples: ['Fictional example.'], sourceIds: ['source-fiction'], skillIds: ['skill-fiction'],
  })),
  activities: [{
    id: 'activity-shared', revision: 1, title: 'Fictional shared activity',
    suitability: { minMonths: 2, maxMonths: 60 }, materials: [],
    instructions: ['Fictional instruction for software testing only.'],
    sourceIds: ['source-fiction'], reviewDate: '2025-12-15', safetyWarnings: [], skillIds: ['skill-fiction'],
  }, {
    id: 'activity-other', revision: 1, title: 'Fictional second activity',
    suitability: { checkpointIds: ['checkpoint-6'] }, materials: ['Fictional material'],
    instructions: ['Another fictional instruction for software testing only.'],
    sourceIds: ['source-fiction'], reviewDate: '2025-12-15', safetyWarnings: ['Fictional warning.'],
    externalResourceIds: ['resource-fiction'],
  }],
  externalResources: [{
    id: 'resource-fiction', title: 'Fictional resource', provider: 'Fictional provider',
    originalUrl: 'https://example.invalid/resource', reviewDate: '2025-12-15',
  }],
  links: [
    ...[2, 4, 6, 60, '6-other'].map(age => ({
      milestoneId: `milestone-${age}`, activityId: 'activity-shared',
      position: age === '6-other' ? 2 : 1, reviewDate: '2025-12-15',
    })),
    { milestoneId: 'milestone-6', activityId: 'activity-other', position: 2, reviewDate: '2025-12-15' },
    { milestoneId: 'milestone-6-other', activityId: 'activity-other', position: 1, reviewDate: '2025-12-15' },
  ],
  retired: [],
};

export const releaseTwo = {
  ...structuredClone(releaseOne),
  id: 'synthetic-release-2', publishedAt: '2026-01-02T12:00:00Z',
  summary: 'Fictional safety withdrawal of the shared activity and title revision of the second activity.',
  activities: structuredClone(releaseOne.activities.filter(item => item.id !== 'activity-shared'))
    .map(item => ({ ...item, revision: item.revision + 1, title: 'Fictional second activity (revised title)' })),
  links: structuredClone(releaseOne.links.filter(link => link.activityId !== 'activity-shared')),
  retired: [{ id: 'activity-shared', type: 'activity', label: 'Fictional shared activity', disposition: 'withdrawn' }],
};
