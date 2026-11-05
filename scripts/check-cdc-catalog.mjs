import { readFileSync } from 'node:fs';
import { validateCdcCatalog } from '../src/cdc-catalog-validation.js';

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

const register = readJson(new URL('../fixtures/cdc-source-register.json', import.meta.url));
const draft = readJson(new URL('../fixtures/cdc-milestones-draft.json', import.meta.url));
const result = validateCdcCatalog(register, draft);

if (result.issues.length) {
  for (const issue of result.issues) {
    console.error(`${issue.code} at ${issue.path}: ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`CDC catalog validation passed: ${result.checkpointCount} checkpoints, ${result.milestoneCount} source-linked statements, integrity fingerprints and reuse metadata.`);
  console.log('The catalog remains a draft pending human editorial review.');
}
