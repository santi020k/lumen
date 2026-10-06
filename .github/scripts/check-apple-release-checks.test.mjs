import assert from 'node:assert/strict';
import test from 'node:test';

import { requireAppleChecks } from './check-apple-release-checks.mjs';

const revision = 'a'.repeat(40);

const runs = ['ci', 'apple-native'].map((workflow, index) => ({
  id: 300 + index,
  path: `.github/workflows/${workflow}.yml`,
  event: 'pull_request',
  head_sha: revision,
  check_suite_id: 101 + index,
  status: 'completed',
  conclusion: 'success',
}));

const passed = ['Build and validate (22.x)', 'Apple swift', 'Apple react-native', 'Apple captures', 'Apple visual', 'Apple framework-visual'].map((name, index) => ({
  id: index + 1,
  name,
  head_sha: revision,
  app: { slug: 'github-actions' },
  check_suite: { id: index === 0 ? 101 : 102 },
  status: 'completed',
  conclusion: 'success',
}));

test('all required Apple checks must pass in their expected workflows before signing', () => {
  requireAppleChecks(passed, runs, revision);

  for (const check of passed)
    assert.throws(() => requireAppleChecks(passed.filter(item => item !== check), runs, revision));
});

test('a newer failed or running check cannot reuse old success', () => {
  for (const status of ['in_progress', 'completed'])
    assert.throws(() => requireAppleChecks([...passed, { ...passed[3], id: 500, status, conclusion: 'failure' }], runs, revision));
});

test('successful duplicates from another check suite cannot mask failed required jobs', () => {
  for (const check of passed) {
    const checks = passed.map(item => item === check ? { ...item, conclusion: 'failure' } : item);

    checks.push({ ...check, id: 1000, check_suite: { id: 999 } });

    const foreign = { ...runs[0], id: 1000, check_suite_id: 999, path: '.github/workflows/spoof.yml' };

    assert.throws(() => requireAppleChecks(checks, [...runs, foreign], revision));
  }
});

test('wrong revisions, events, paths, apps and missing provenance fail closed', () => {
  for (const delta of [
    { head_sha: 'b'.repeat(40) },
    { event: 'workflow_dispatch' },
    { path: '.github/workflows/spoof.yml' },
    { check_suite_id: undefined },
  ]) assert.throws(() => requireAppleChecks(passed, [runs[0], { ...runs[1], ...delta }], revision));

  for (const delta of [
    { head_sha: 'b'.repeat(40) },
    { app: { slug: 'untrusted-app' } },
    { check_suite: undefined },
  ]) assert.throws(() => requireAppleChecks(passed.map((check, index) => index === 1 ? { ...check, ...delta } : check), runs, revision));

  assert.throws(() => requireAppleChecks(passed, runs, 'main'));
});

test('the newest expected workflow must finish successfully with its own check suite', () => {
  for (const delta of [
    { status: 'in_progress', conclusion: null },
    { status: 'completed', conclusion: 'failure' },
    { status: 'completed', conclusion: 'cancelled' },
    { status: 'completed', conclusion: 'success', check_suite_id: 103 },
  ]) assert.throws(() => requireAppleChecks(passed, [...runs, { ...runs[1], id: 500, ...delta }], revision));
});
