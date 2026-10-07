import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

// cspell:words agvtool iphoneos pkcs12 productbuild productsign codesign

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

test('delivery archives with automatic development signing and exports with explicit distribution profiles', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-delivery-test-'));
  const bin = join(root, 'bin');

  await mkdir(bin);

  const mocks = {
    node: `if [[ "$1" == .github/scripts/apple-store-profiles.mjs ]]; then
  if [[ "$MOCK_PROFILE_FAILURE" == true ]]; then echo "Distribution profile preflight failed" >&2; exit 1; fi
  printf '<plist><dict><key>method</key><string>app-store-connect</string><key>signingStyle</key><string>manual</string><key>teamID</key><string>BY4995HQ3J</string><key>manageAppVersionAndBuildNumber</key><false/></dict></plist>' > "$4/ExportOptions.plist"
elif [[ "$1" == --input-type=module ]]; then cat >/dev/null; elif [[ "$1" == -p ]]; then echo 1.0.3; else echo 55; fi`,
    mkdir: 'exit 0',
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
  if [[ "$APPLE_RELEASE_PLATFORM" == macOS ]]; then
    for tool in /usr/bin/productbuild /usr/bin/productsign; do
      if ! /usr/bin/grep -Fxq -- "$tool" "$MOCK_SECURITY_LOG"; then
        echo "Installer signing tool lacks unattended private-key authorization: $tool" >&2
        exit 65
      fi
    done
  fi
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
    security: 'if [[ "$1" == import ]]; then printf "%s\\n" "$@" > "$MOCK_SECURITY_LOG"; elif [[ "$1" == delete-keychain ]]; then echo cleanup >> "$MOCK_LOG"; fi',
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
        env: { ...process.env, PATH: `${bin}:/usr/bin:/bin`, RUNNER_TEMP: root, MOCK_LOG: log, MOCK_SECURITY_LOG: join(root, `${platform}.security.log`), APPLE_RELEASE_PLATFORM: platform, MOCK_EXPORT_OPTIONS: join(root, `${platform}.plist`), GITHUB_STEP_SUMMARY: summary, GITHUB_REF: 'refs/heads/main', GITHUB_SHA: 'a'.repeat(40), APPLE_DISTRIBUTION_P12_BASE64: 'dGVzdA==', APPLE_DISTRIBUTION_P12_PASSWORD: 'fixture', APP_STORE_CONNECT_API_KEY_P8: 'fixture', APP_STORE_CONNECT_KEY_ID: 'fixture', APP_STORE_CONNECT_ISSUER_ID: 'fixture' },
      });

      assert.equal(result.status, 0, result.stderr);

      const commands = await readFile(log, 'utf8');

      assert.ok(commands.includes('CODE_SIGN_IDENTITY=Apple Development'));

      assert.ok(commands.includes('DEVELOPMENT_TEAM=BY4995HQ3J'));

      assert.ok(!commands.includes('OTHER_CODE_SIGN_FLAGS='));

      assert.match(commands, /CODE_SIGN_STYLE=Automatic/u);

      assert.match(commands, /archive\n[\s\S]*-exportArchive/u);

      assert.match(commands, /cleanup/u);

      const importedArguments = (await readFile(join(root, `${platform}.security.log`), 'utf8')).trim().split('\n');
      const trustedApplications = importedArguments.filter((argument, index) => importedArguments[index - 1] === '-T');

      assert.deepEqual(trustedApplications, platform === 'macOS'
        ? ['/usr/bin/codesign', '/usr/bin/security', '/usr/bin/productbuild', '/usr/bin/productsign']
        : ['/usr/bin/codesign', '/usr/bin/security']);

      assert.ok(!importedArguments.includes('-A'));

      const exportOptions = await readFile(join(root, `${platform}.plist`), 'utf8');

      assert.match(exportOptions, /<key>method<\/key><string>app-store-connect<\/string>/u);

      assert.match(exportOptions, /<key>signingStyle<\/key><string>manual<\/string>/u);

      assert.match(exportOptions, /<key>teamID<\/key><string>BY4995HQ3J<\/string>/u);

      assert.match(exportOptions, /<key>manageAppVersionAndBuildNumber<\/key><false\/>/u);
    }

    const failureLog = join(root, 'preflight-failure.log');

    const failure = spawnSync('bash', [script, 'iOS'], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:/usr/bin:/bin`, RUNNER_TEMP: root, MOCK_LOG: failureLog, MOCK_SECURITY_LOG: join(root, 'preflight-failure.security.log'), MOCK_PROFILE_FAILURE: 'true', GITHUB_REF: 'refs/heads/main', APPLE_DISTRIBUTION_P12_BASE64: 'dGVzdA==', APPLE_DISTRIBUTION_P12_PASSWORD: 'fixture', APP_STORE_CONNECT_API_KEY_P8: 'fixture', APP_STORE_CONNECT_KEY_ID: 'fixture', APP_STORE_CONNECT_ISSUER_ID: 'fixture' },
    });

    assert.notEqual(failure.status, 0);

    assert.match(failure.stderr, /Distribution profile preflight failed/u);

    assert.equal((await readFile(failureLog, 'utf8')).trim(), 'cleanup');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
