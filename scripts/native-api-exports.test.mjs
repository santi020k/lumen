import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { collectTypeScriptExports, validateIconMembers } from './lib/native-api-exports.mjs'

test('classifies explicit named, aliased and type exports', () => {
  assert.deepEqual(collectTypeScriptExports('entry.ts', "export { Foo as Bar }; export type { Shape }; export { Baz } from './baz.js'"), ['Bar', 'Baz', 'Shape'])
})

test('rejects unclassified declaration forms, wildcard and default exports', () => {
  for (const source of ["export * from './other.js'", 'export default Foo', 'export const Foo = 1', 'export function Foo() {}', 'export interface Foo {}', 'export type Foo = string', 'export class Foo {}', 'export { Foo }; export { Foo }']) {
    assert.throws(() => collectTypeScriptExports('entry.ts', source))
  }
})

test('ignores apparent exports in comments and strings', () => {
  assert.deepEqual(collectTypeScriptExports('entry.ts', '// export const Hidden = 1\nconst text = "export default Hidden"; export { text }'), ['text'])
})

test('checks every icon member against the reviewed index and package targets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-icon-api-test-'))
  const directory = join(root, 'packages/react-native/src/static-icons')
  const member = join(directory, 'search.generated.tsx')
  const manifest = join(root, 'packages/react-native/package.json')

  const contract = {
    entrypoint: 'packages/react-native/src/static-icon-exports.generated.ts',
    membersDirectory: 'packages/react-native/src/static-icons'
  }

  const source = "export { SearchGraphic } from './static-icons/search.generated.js'"

  const packageExports = {
    exports: {
      './icons/*': {
        types: './dist/static-icons/*.generated.d.ts',
        import: './dist/static-icons/*.generated.js'
      }
    }
  }

  try {
    await mkdir(directory, { recursive: true })

    await writeFile(manifest, JSON.stringify(packageExports))

    await writeFile(member, 'const SearchGraphic = () => <Svg />; export { SearchGraphic }')

    await validateIconMembers(root, contract, source, ['SearchGraphic'])

    await assert.rejects(validateIconMembers(root, contract, source.replace('search.generated', 'wrong.generated'), ['SearchGraphic']), /mismatch/u)

    await assert.rejects(validateIconMembers(root, contract, source, []), /unclassified/u)

    await writeFile(member, 'export const Hidden = 1; export { SearchGraphic }')

    await assert.rejects(validateIconMembers(root, contract, source, ['SearchGraphic']), /named export blocks/u)

    await writeFile(member, 'export { SearchGraphic }')

    await writeFile(join(directory, 'unexpected.ts'), 'export { Hidden }')

    await assert.rejects(validateIconMembers(root, contract, source, ['SearchGraphic']), /Unexpected icon member/u)

    await rm(join(directory, 'unexpected.ts'))

    await writeFile(manifest, JSON.stringify({ exports: { './icons/*': './dist/index.js' } }))

    await assert.rejects(validateIconMembers(root, contract, source, ['SearchGraphic']), /export pattern/u)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
