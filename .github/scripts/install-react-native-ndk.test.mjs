import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

test('NDK setup installs the locked version and retries download failures at most three times', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lumen-ndk-test-'));
  const bin = join(directory, 'cmdline-tools/latest/bin');
  const attempts = join(directory, 'attempts');
  const root = resolve(import.meta.dirname, '../..');

  try {
    mkdirSync(bin, { recursive: true });

    writeFileSync(join(bin, 'sleep'), '#!/bin/bash\nexit 0\n', { mode: 0o700 });

    writeFileSync(join(bin, 'sdkmanager'), '#!/bin/bash\nset -eu\necho "$1" >> "$MOCK_ATTEMPTS"\ncount=$(wc -l < "$MOCK_ATTEMPTS")\n[[ "$count" -gt "$MOCK_FAILURES" ]]\n', { mode: 0o700 });

    const source = readFileSync(join(root, 'apps/playground-react-native/node_modules/react-native/gradle/libs.versions.toml'), 'utf8');
    const expected = /^ndkVersion = "([\d.]+)"$/mu.exec(source)?.[1];

    assert.ok(expected);

    for (const failures of [0, 1, 3]) {
      writeFileSync(attempts, '');

      const result = spawnSync('bash', ['.github/scripts/install-react-native-ndk.sh'], {
        cwd: root, encoding: 'utf8',
        env: { ...process.env, ANDROID_HOME: directory, PATH: `${bin}:${process.env.PATH}`, MOCK_ATTEMPTS: attempts, MOCK_FAILURES: String(failures) },
      });

      assert.equal(result.status, failures === 3 ? 1 : 0, result.stderr);

      assert.deepEqual(readFileSync(attempts, 'utf8').trim().split('\n'), Array.from({ length: Math.min(failures + 1, 3) }, () => `ndk;${expected}`));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
