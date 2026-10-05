import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const requireAppleChecks = checks => {
  const required = ['Build and validate (22.x)', ...['swift', 'react-native', 'captures', 'visual', 'framework-visual'].map(name => `Apple ${name}`)];

  for (const name of required) {
    const latest = checks.filter(check => check.name === name).sort((a, b) => b.id - a.id)[0];

    if (latest?.conclusion !== 'success' || latest.status !== 'completed')
      throw new Error(`Required release check has not passed: ${name}`);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { check_runs: checks } = JSON.parse(await readFile(process.argv[2], 'utf8'));

  requireAppleChecks(checks);
}
