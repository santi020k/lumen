import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = await readFile(resolve(root, 'registry/lumen-4-contract.json'), 'utf8')
const target = resolve(root, 'packages/lumen/v4-migration.json')

if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== source) throw new Error('Stale v4 migration contract. Run pnpm run generate:v4-migration.')
} else await writeFile(target, source)

process.stdout.write('lumen: v4 migration contract is current\n')
