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

    const fixture = name => `#!/bin/sh\nif [ "$1" = --verify ]; then exit 0; fi\ncase "$2" in --extract-certificates=*) prefix="\${2#--extract-certificates=}";; *) echo 'Expected an attached certificate prefix' >&2; exit 2;; esac\ncase "$3" in *.bundle) cp '${join(directory, `${name}.der`)}' "$prefix"0;; *) cp '${join(directory, 'distribution.der')}' "$prefix"0;; esac\n`;

    await writeFile(join(bin, 'codesign'), fixture('distribution'), { mode: 0o755 });

    process.env.PATH = `${bin}:${originalPath}`;

    const { checkAppStoreSignatures } = await import('../apps/playground-apple/scripts/check-app-store-signatures.mjs');
    const fingerprint = certificate.fingerprint.replaceAll(':', '');

    await checkAppStoreSignatures(app, fingerprint);

    await writeFile(join(bin, 'codesign'), fixture('development'), { mode: 0o755 });

    await assert.rejects(checkAppStoreSignatures(app, fingerprint), /different signing certificate.*LumenUI.bundle/u);

    await assert.rejects(checkAppStoreSignatures(app, 'invalid'), /validated distribution/u);

    await writeFile(join(bin, 'codesign'), '#!/bin/sh\necho "Synthetic signature diagnostic" >&2\nexit 1\n', { mode: 0o755 });

    await assert.rejects(checkAppStoreSignatures(app, fingerprint), /signature verification failed.*Synthetic signature diagnostic/u);
  } finally {
    process.env.PATH = originalPath;

    await rm(directory, { recursive: true, force: true });
  }
});

test('signature guard extracts certificates through the real macOS codesign interface', { skip: process.platform !== 'darwin' }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-signature-interface-'));
  const app = '/System/Applications/Utilities/Terminal.app';
  const prefix = join(directory, 'certificate-');

  try {
    const result = spawnSync('/usr/bin/codesign', ['--display', `--extract-certificates=${prefix}`, app], { encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);

    const certificate = new X509Certificate(await readFile(`${prefix}0`));
    const { checkAppStoreSignatures } = await import('../apps/playground-apple/scripts/check-app-store-signatures.mjs');

    await checkAppStoreSignatures(app, certificate.fingerprint.replaceAll(':', ''));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
