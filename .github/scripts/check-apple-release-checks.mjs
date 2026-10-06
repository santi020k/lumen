import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const requiredWorkflows = [
  { path: '.github/workflows/ci.yml', names: ['Build and validate (22.x)'] },
  { path: '.github/workflows/apple-native.yml', names: ['swift', 'react-native', 'captures', 'visual', 'framework-visual'].map(name => `Apple ${name}`) },
];

/** @param {unknown} value @returns {value is Record<string, unknown>} */
const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value);

/** @param {Record<string, unknown>} check @param {Record<string, unknown>} run @param {string} revision */
const belongsToWorkflow = (check, run, revision) => check.head_sha === revision &&
  isRecord(check.app) && check.app.slug === 'github-actions' &&
  isRecord(check.check_suite) && check.check_suite.id === run.check_suite_id;

/** @param {readonly Record<string, unknown>[]} runs @param {string} path @param {string} revision */
const latestWorkflow = (runs, path, revision) => {
  const candidates = runs.filter(run => run.path === path && run.event === 'pull_request' && run.head_sha === revision);

  if (candidates.some(run => !Number.isSafeInteger(run.id) || !Number.isSafeInteger(run.check_suite_id)))
    throw new Error(`Invalid workflow identity: ${path}`);

  const latestRun = candidates.sort((a, b) => Number(b.id) - Number(a.id))[0];

  if (!latestRun || latestRun.status !== 'completed' || latestRun.conclusion !== 'success')
    throw new Error(`Required release workflow has not passed: ${path}`);


  return latestRun;
};

/**
 * @param {readonly Record<string, unknown>[]} checks
 * @param {readonly Record<string, unknown>[]} runs
 * @param {string} revision
 */
export const requireAppleChecks = (checks, runs, revision) => {
  if (!/^[a-f0-9]{40}$/u.test(revision)) throw new Error('Expected the exact merged pull request head revision.');

  for (const workflow of requiredWorkflows) {
    const latestRun = latestWorkflow(runs, workflow.path, revision);

    for (const name of workflow.names) {
      const trusted = checks.filter(check => check.name === name && belongsToWorkflow(check, latestRun, revision));

      if (trusted.some(check => !Number.isSafeInteger(check.id))) throw new Error(`Invalid check identity: ${name}`);

      const latest = trusted.sort((a, b) => Number(b.id) - Number(a.id))[0];

      if (latest?.conclusion !== 'success' || latest.status !== 'completed')
        throw new Error(`Required release check has not passed in ${workflow.path}: ${name}`);
    }
  }
};

/** @param {unknown} value @param {string} key @returns {Record<string, unknown>[]} */
const readPages = (value, key) => {
  const pages = Array.isArray(value) ? value : [value];

  return pages.flatMap(page => {
    if (!isRecord(page) || !Array.isArray(page[key])) throw new Error(`Missing GitHub ${key} response.`);

    const entries = page[key];

    if (!entries.every(isRecord)) throw new Error(`Invalid GitHub ${key} records.`);

    return entries;
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const checks = readPages(JSON.parse(await readFile(process.argv[2], 'utf8')), 'check_runs');
  const runs = readPages(JSON.parse(await readFile(process.argv[3], 'utf8')), 'workflow_runs');

  requireAppleChecks(checks, runs, process.argv[4] ?? '');
}
