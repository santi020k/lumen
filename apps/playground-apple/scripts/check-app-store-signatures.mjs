import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { lstat, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// cspell:words codesign appex

export const checkAppStoreSignatures = async (appPath, fingerprint) => {
  if (!/^[A-F0-9]{40}$/u.test(fingerprint)) throw new Error('Expected a validated distribution certificate fingerprint.');

  const root = resolve(appPath);

  if (!(await lstat(root)).isDirectory()) throw new Error('Expected an archived application directory.');

  const run = args => {
    const result = spawnSync('codesign', args, { encoding: 'utf8' });

    if (result.status !== 0) throw new Error(`App Store signature verification failed: ${args.at(-1)}`);
  };

  run(['--verify', '--deep', '--strict', root]);

  const temporary = await mkdtemp(join(tmpdir(), 'lumen-signature-check-'));
  let count = 0;

  try {
    const inspect = async path => {
      const entry = await lstat(path);

      if (entry.isSymbolicLink() || !entry.isDirectory()) return;

      if (path === root || /\.(?:app|bundle|framework|xpc|appex)$/u.test(path)) {
        const prefix = join(temporary, `certificate-${count++}-`);

        run(['--display', '--extract-certificates', prefix, path]);

        const certificate = new X509Certificate(await readFile(`${prefix}0`));

        if (certificate.fingerprint.replaceAll(':', '') !== fingerprint)
          throw new Error(`App Store bundle uses a different signing certificate than its distribution profile: ${path}`);
      }

      for (const name of await readdir(path)) await inspect(join(path, name));
    };

    await inspect(root);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [appPath, fingerprintPath] = process.argv.slice(2);

  if (!appPath || !fingerprintPath) throw new Error('Supply the archived application and validated distribution fingerprint file.');

  await checkAppStoreSignatures(appPath, (await readFile(fingerprintPath, 'utf8')).trim());

  console.log('App Store nested distribution signatures passed.');
}
