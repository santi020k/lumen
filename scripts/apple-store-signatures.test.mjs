import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

// cspell:words codesign keyout xcconfig

test('signature guard rejects nested certificate mismatch even when structural verification passes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-signatures-test-'));
  const app = join(directory, 'Playground.app');
  const bundle = join(app, 'Contents', 'Resources', 'LumenUI.bundle');
  const bin = join(directory, 'bin');
  const originalPath = process.env.PATH;

  try {
    await mkdir(bundle, { recursive: true });

    await mkdir(bin);

    await symlink(bundle, join(app, 'Alias.bundle'));

    for (const name of ['distribution', 'development']) {
      const result = spawnSync('/usr/bin/openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(directory, `${name}.key`), '-out', join(directory, `${name}.pem`), '-days', '1', '-subj', `/CN=Lumen Synthetic ${name}`]);

      assert.equal(result.status, 0);
    }

    const certificate = new X509Certificate(await readFile(join(directory, 'distribution.pem')));

    await writeFile(join(directory, 'distribution.der'), certificate.raw);

    await writeFile(join(directory, 'development.der'), new X509Certificate(await readFile(join(directory, 'development.pem'))).raw);

    const fixture = name => `#!/bin/sh\nif [ "$1" = --verify ]; then exit 0; fi\ncase "$4" in *.bundle) cp '${join(directory, `${name}.der`)}' "$3"0;; *) cp '${join(directory, 'distribution.der')}' "$3"0;; esac\n`;

    await writeFile(join(bin, 'codesign'), fixture('distribution'), { mode: 0o755 });

    process.env.PATH = `${bin}:${originalPath}`;

    const { checkAppStoreSignatures } = await import('../apps/playground-apple/scripts/check-app-store-signatures.mjs');
    const fingerprint = certificate.fingerprint.replaceAll(':', '');

    await checkAppStoreSignatures(app, fingerprint);

    await writeFile(join(bin, 'codesign'), fixture('development'), { mode: 0o755 });

    await assert.rejects(checkAppStoreSignatures(app, fingerprint), /different signing certificate.*LumenUI.bundle/u);

    await assert.rejects(checkAppStoreSignatures(app, 'invalid'), /validated distribution/u);

    await writeFile(join(bin, 'codesign'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });

    await assert.rejects(checkAppStoreSignatures(app, fingerprint), /signature verification failed/u);
  } finally {
    process.env.PATH = originalPath;

    await rm(directory, { recursive: true, force: true });
  }
});
