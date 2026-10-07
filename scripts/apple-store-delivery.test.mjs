import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

// cspell:words agvtool iphoneos pkcs12

const script = resolve(import.meta.dirname, '../apps/playground-apple/scripts/deliver-app-store.sh');

test('delivery rejects missing credentials before archiving', () => {
  const result = spawnSync('bash', [script, 'iOS'], { env: { PATH: process.env.PATH, GITHUB_REF: 'refs/heads/main' }, encoding: 'utf8' });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /Missing required signing credential/u);
});

test('delivery rejects source branches before reading signing credentials', () => {
  const result = spawnSync('bash', [script, 'iOS'], {
    env: { PATH: process.env.PATH, GITHUB_REF: 'refs/heads/release/v4.0.0' },
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);

  assert.match(result.stderr, /Apple delivery requires merged main/u);

  assert.doesNotMatch(result.stderr, /Missing required signing credential/u);
});

test('delivery archives with automatic development signing and exports for distribution', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-delivery-test-'));
  const bin = join(root, 'bin');

  await mkdir(bin);

  const mocks = {
    node: 'if [[ "$1" == --input-type=module ]]; then cat >/dev/null; elif [[ "$1" == -p ]]; then echo 1.0.3; else echo 55; fi',
    xcodebuild: `if [[ "$1" == -version ]]; then
  printf "Xcode 26.5\\nBuild version 17F42\\n"
  exit 0
fi
if [[ "$1" != -exportArchive ]]; then
  if [[ "$*" != *"CODE_SIGN_STYLE=Automatic"* || "$*" != *"CODE_SIGN_IDENTITY=Apple Development"* ]]; then
    echo "Automatic development signing conflicts with a forced distribution identity" >&2
    exit 65
  fi
  if [[ "$*" == *"OTHER_CODE_SIGN_FLAGS="* ]]; then
    echo "Development signing must search both temporary and login keychains" >&2
    exit 65
  fi
  if [[ "$*" != *"DEVELOPMENT_TEAM=BY4995HQ3J"* ]]; then
    echo "Swift resource signing requires a development team" >&2
    exit 65
  fi
else
  copy_next=false
  for argument in "$@"; do
    if [[ "$copy_next" == true ]]; then
      cp "$argument" "$MOCK_EXPORT_OPTIONS"
      copy_next=false
    fi
    if [[ "$argument" == -exportOptionsPlist ]]; then copy_next=true; fi
  done
fi
printf "%s\\n" "$@" >> "$MOCK_LOG"`,
    xcrun: 'if [[ "$1" == --sdk ]]; then echo 26.5; fi',
    sw_vers: 'if [[ "$1" == -productVersion ]]; then echo 26.5; else echo 25F77; fi',
    security: 'if [[ "$1" == delete-keychain ]]; then echo cleanup >> "$MOCK_LOG"; fi',
    openssl: 'echo temporary-test-keychain-password',
  };

  for (const [name, body] of Object.entries(mocks))
    await writeFile(join(bin, name), `#!/bin/bash\n${body}\n`, { mode: 0o755 });

  try {
    for (const platform of ['iOS', 'macOS']) {
      const log = join(root, `${platform}.log`);
      const summary = join(root, 'summary');

      const result = spawnSync('bash', [script, platform], {
        encoding: 'utf8',
        env: { ...process.env, PATH: `${bin}:/usr/bin:/bin`, RUNNER_TEMP: root, MOCK_LOG: log, MOCK_EXPORT_OPTIONS: join(root, `${platform}.plist`), GITHUB_STEP_SUMMARY: summary, GITHUB_REF: 'refs/heads/main', GITHUB_SHA: 'a'.repeat(40), APPLE_DISTRIBUTION_P12_BASE64: 'dGVzdA==', APPLE_DISTRIBUTION_P12_PASSWORD: 'fixture', APP_STORE_CONNECT_API_KEY_P8: 'fixture', APP_STORE_CONNECT_KEY_ID: 'fixture', APP_STORE_CONNECT_ISSUER_ID: 'fixture' },
      });

      assert.equal(result.status, 0, result.stderr);

      const commands = await readFile(log, 'utf8');

      assert.ok(commands.includes('CODE_SIGN_IDENTITY=Apple Development'));

      assert.ok(commands.includes('DEVELOPMENT_TEAM=BY4995HQ3J'));

      assert.ok(!commands.includes('OTHER_CODE_SIGN_FLAGS='));

      assert.match(commands, /CODE_SIGN_STYLE=Automatic/u);

      assert.match(commands, /archive\n[\s\S]*-exportArchive/u);

      assert.match(commands, /cleanup/u);

      const exportOptions = await readFile(join(root, `${platform}.plist`), 'utf8');

      assert.match(exportOptions, /<key>method<\/key><string>app-store-connect<\/string>/u);

      assert.match(exportOptions, /<key>signingStyle<\/key><string>automatic<\/string>/u);

      assert.match(exportOptions, /<key>teamID<\/key><string>BY4995HQ3J<\/string>/u);

      assert.match(exportOptions, /<key>manageAppVersionAndBuildNumber<\/key><false\/>/u);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
