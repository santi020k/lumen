import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import ts from 'typescript'

const parse = (entrypoint, source) => ts.createSourceFile(entrypoint, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

export const collectTypeScriptExports = (entrypoint, source) => {
  const exports = []

  for (const statement of parse(entrypoint, source).statements) {
    if (!ts.isExportDeclaration(statement)) {
      const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined

      assert.ok(!ts.isExportAssignment(statement) && !modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword), `${entrypoint} must use named export blocks`)

      continue
    }

    assert.ok(statement.exportClause && ts.isNamedExports(statement.exportClause), `${entrypoint} must use named exports`)

    for (const element of statement.exportClause.elements) exports.push(element.name.text)
  }

  assert.equal(new Set(exports).size, exports.length, `${entrypoint} repeats an export`)

  return exports.sort()
}

const iconExportPaths = (entrypoint, source) => {
  const paths = new Map()

  for (const statement of parse(entrypoint, source).statements) {
    if (!ts.isExportDeclaration(statement)) continue

    assert.ok(statement.exportClause && ts.isNamedExports(statement.exportClause) && statement.exportClause.elements.length === 1)

    assert.ok(statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier))

    paths.set(statement.exportClause.elements[0].name.text, statement.moduleSpecifier.text)
  }

  return paths
}

export const validateIconMembers = async (repositoryRoot, contract, source, classifiedNames) => {
  const directory = resolve(repositoryRoot, contract.membersDirectory)
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = iconExportPaths(contract.entrypoint, source)
  const members = []

  for (const entry of entries) {
    assert.ok(entry.isFile() && entry.name.endsWith('.generated.tsx'), `Unexpected icon member: ${entry.name}`)

    const memberPath = resolve(directory, entry.name)
    const exported = collectTypeScriptExports(memberPath, await readFile(memberPath, 'utf8'))

    assert.equal(exported.length, 1, `${entry.name} must export one reviewed graphic`)

    assert.equal(paths.get(exported[0]), `./static-icons/${entry.name.slice(0, -4)}.js`, 'Icon index/member mismatch')

    members.push(...exported)
  }

  assert.deepEqual(members.sort(), classifiedNames, 'Icon directory contains missing or unclassified members')

  const manifest = JSON.parse(await readFile(resolve(repositoryRoot, 'packages/react-native/package.json'), 'utf8'))

  assert.deepEqual(manifest.exports['./icons/*'], {
    types: './dist/static-icons/*.generated.d.ts',
    import: './dist/static-icons/*.generated.js'
  }, 'Icon package export pattern changed without reviewed paths')
}
