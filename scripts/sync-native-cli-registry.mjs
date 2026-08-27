import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const sourcePath = join(repositoryRoot, 'registry', 'native-components.json')
const outputPath = join(repositoryRoot, 'packages', 'lumen', 'native-components.json')
const expected = await readFile(sourcePath, 'utf8')
const check = process.argv.includes('--check')

if (check) {
  const actual = await readFile(outputPath, 'utf8').catch(() => '')

  if (actual !== expected) {
    throw new Error('packages/lumen/native-components.json is stale. Run pnpm run sync:native-cli-registry.')
  }
} else {
  await writeFile(outputPath, expected)
}

process.stdout.write(`${check ? 'Checked' : 'Synchronized'} the packaged native CLI registry.\n`)
