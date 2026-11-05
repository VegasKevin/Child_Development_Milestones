import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

test('FR-002/CP-002: the CDC source register exposes every published checklist checkpoint', async ({ request }) => {
  const response = await request.get('/fixtures/cdc-source-register.json');
  expect(response.ok()).toBeTruthy();
  const catalog = await response.json();
  expect(catalog.edition).toBe('February 2022 revised milestone checklists');
  expect(catalog.checkpoints.map(item => item.ageMonths)).toEqual([2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60]);
  expect(catalog.checkpoints.every(item => item.originalUrl.startsWith('https://www.cdc.gov/act-early/digital-online-checklist/'))).toBe(true);
  expect(catalog.reuse.attributionRequired).toBe(true);
  expect(catalog.reuse.nonEndorsementRequired).toBe(true);
  expect(catalog.reuse.substantiveContentMustRemainUnchanged).toBe(true);
  expect(catalog.reuse.excludeThirdPartyMaterialAndAgencyMarks).toBe(true);
});

test('FR-002/CP-002: the source-linked CDC milestone draft covers each checkpoint without invented detail', async ({ request }) => {
  const response = await request.get('/fixtures/cdc-milestones-draft.json');
  expect(response.ok()).toBeTruthy();
  const catalog = await response.json();
  const registerResponse = await request.get('/fixtures/cdc-source-register.json');
  expect(registerResponse.ok()).toBeTruthy();
  const register = await registerResponse.json();
  expect(catalog.status).toBe('draft-pending-human-review');
  expect(catalog.checkpoints.map(item => item.ageMonths)).toEqual([2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60]);
  expect(catalog.checkpoints.map(({ ageMonths, sourceUrl }) => ({ ageMonths, sourceUrl }))).toEqual(
    register.checkpoints.map(({ ageMonths, originalUrl }) => ({ ageMonths, sourceUrl: originalUrl })));
  const milestones = catalog.checkpoints.flatMap(checkpoint => checkpoint.milestones);
  expect(milestones).toHaveLength(159);
  expect(new Set(milestones.map(item => item.id)).size).toBe(milestones.length);
  expect(milestones.every(item => item.sourceStatement.trim() && item.originalCategory)).toBe(true);
  expect(catalog.checkpoints.every(checkpoint => checkpoint.milestones.every(item =>
    ['Social/Emotional', 'Language/Communication', 'Cognitive (learning, thinking, problem-solving)', 'Movement/Physical Development'].includes(item.originalCategory)))).toBe(true);
  expect(milestones.every(item => !Object.hasOwn(item, 'explanation') && !Object.hasOwn(item, 'examples'))).toBe(true);
  expect(catalog.attribution).toContain('available from CDC at no charge');
  expect(catalog.attribution).toContain('not endorsed by CDC');

  const expectedSnapshots = new Map([
    [2, [11, 'cd0a523be4b2f15a3cf53f36d2502cfc2fa73555839ea179996075548f6f8a81']],
    [4, [13, '8ee32936e3198279634d0bf5c651b5dd8ad45468c763888ed18cb22a32048d4e']],
    [6, [12, '11d6a40e3aabf617d4d3b13a7ee1258b769c74b17dabf1a6e0834f35086df2de']],
    [9, [13, '76f0ac06a00c34fe772546c2279e99194fb24f15181f6c54c03b7afad86cb71d']],
    [12, [10, '70bf80a68a5dfc96e069cd99efe072cbdf6bf4930cc92329fb9d07f754ea3855']],
    [15, [13, 'cb6743dd7ea28da949558f69f34e3dea2bddd9b1f368e6f9f99578bb16a74e17']],
    [18, [15, '394226a4ea7adbd9e37b0fb8a263c4f8c0737446b58ed840a1e49c512f60bf9a']],
    [24, [13, '36e1ae64489dbff42ac2ee708278e758d8bd2c8d51a44b120d9056b7e3cc44db']],
    [30, [15, 'f17a27baae4e86c3bf99727b376265aa1c7c2a4636ed4c2a7e8cd36f472b20fa']],
    [36, [12, '9025ea61dff2816229130a94f1557c35e840d5d949fe438e23e0f6ed48052390']],
    [48, [17, '457bf4612507b0cfb3c9f00f19d3dac26592a37eb5c6b70743d07d8ae85662dc']],
    [60, [15, '3f9374aa7864b79b900b1ccaf2b0edf679748212e5fd2544fac356d149a0b8ab']],
  ]);
  for (const checkpoint of catalog.checkpoints) {
    const [expectedCount, expectedDigest] = expectedSnapshots.get(checkpoint.ageMonths) ?? [];
    expect(checkpoint.milestones).toHaveLength(expectedCount);
    expect(checkpoint.pagePublished).toBe('2025-09-04');
    expect(checkpoint.pageUpdated).toBe(checkpoint.ageMonths === 60 ? '2026-02-16' : '2026-02-17');
    expect(checkpoint.pageReviewed).toBe('2026-02-17');
    const snapshot = JSON.stringify(checkpoint.milestones.map(item => [item.originalCategory, item.sourceStatement]));
    expect(createHash('sha256').update(snapshot).digest('hex')).toBe(expectedDigest);
  }
});
