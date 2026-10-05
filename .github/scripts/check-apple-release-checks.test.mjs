import assert from 'node:assert/strict';
import test from 'node:test';

import { requireAppleChecks } from './check-apple-release-checks.mjs';

const passed = ['Build and validate (22.x)', 'Apple swift', 'Apple react-native', 'Apple captures', 'Apple visual', 'Apple framework-visual'].map(name => ({ id: 1, name, status: 'completed', conclusion: 'success' }));

test('all required Apple checks must pass before signing secrets are injected', () => {
  requireAppleChecks(passed);

  for (const check of passed)
    assert.throws(() => requireAppleChecks(passed.filter(item => item !== check)));
});

test('a newer failed or running attempt cannot reuse old success', () => {
  for (const status of ['in_progress', 'completed'])
    assert.throws(() => requireAppleChecks([...passed, { id: 2, name: 'Apple captures', status, conclusion: 'failure' }]));
});
