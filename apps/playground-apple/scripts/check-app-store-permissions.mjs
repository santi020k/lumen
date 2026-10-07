import { lstat, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** @param {string} appPath */
export const checkAppStorePermissions = async (appPath) => {
  const root = resolve(appPath);

  if (!(await lstat(root)).isDirectory()) throw new Error('Expected an archived application directory.');

  /** @param {string} path */
  const inspect = async (path) => {
    const entry = await lstat(path);

    // Framework symlinks carry no independent permission bits; their real entries are inspected.
    if (entry.isSymbolicLink()) return;

    const required = entry.isDirectory() ? 0o005 : 0o004;

    if ((entry.mode & required) !== required)
      throw new Error(`App Store payload must be readable by non-root users: ${path}`);

    if (entry.isDirectory()) {
      for (const name of await readdir(path)) await inspect(join(path, name));
    }
  };

  await inspect(root);
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const appPath = process.argv[2];

  if (!appPath) throw new Error('Supply the archived application directory.');

  await checkAppStorePermissions(appPath);

  console.log('App Store payload permissions passed.');
}
