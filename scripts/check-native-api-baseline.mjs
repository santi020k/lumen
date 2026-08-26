import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import ts from 'typescript'

const repositoryRoot = resolve(import.meta.dirname, '..')
const baselinePath = resolve(repositoryRoot, 'registry/native-api-baseline.json')
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
const classifications = ['supported', 'experimental', 'deprecated']
const maturities = new Set(['beta', 'stable'])

const collectTypeScriptExports = (entrypoint, source) => {
  const sourceFile = ts.createSourceFile(
    entrypoint,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )

  const exports = []

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement)) continue

    assert.ok(
      statement.exportClause && ts.isNamedExports(statement.exportClause),
      `${entrypoint} must use named exports so the native API baseline can classify every symbol`
    )

    for (const element of statement.exportClause.elements) exports.push(element.name.text)
  }

  return exports.sort()
}

const validateClassification = (adapterName, adapter) => {
  assert.ok(maturities.has(adapter.maturity), `${adapterName} has an invalid maturity`)

  assert.equal(typeof adapter.entrypoint, 'string', `${adapterName} is missing its entrypoint`)

  const classifiedNames = []

  for (const classification of classifications) {
    const names = adapter[classification]

    assert.ok(Array.isArray(names), `${adapterName}.${classification} must be an array`)

    assert.ok(
      names.every(name => typeof name === 'string' && name.length > 0),
      `${adapterName}.${classification} contains an invalid symbol`
    )

    assert.deepEqual(
      names,
      [...names].sort(),
      `${adapterName}.${classification} must remain sorted`
    )

    classifiedNames.push(...names)
  }

  assert.equal(
    new Set(classifiedNames).size,
    classifiedNames.length,
    `${adapterName} classifies at least one symbol more than once`
  )

  return classifiedNames.sort()
}

assert.equal(baseline.schemaVersion, 1, 'Unsupported native API baseline schema version')

assert.deepEqual(
  Object.keys(baseline.adapters),
  ['reactNative'],
  'Add adapters deliberately as their public API extractors become authoritative'
)

for (const [adapterName, adapter] of Object.entries(baseline.adapters)) {
  const classifiedNames = validateClassification(adapterName, adapter)
  const entrypointPath = resolve(repositoryRoot, adapter.entrypoint)
  const source = await readFile(entrypointPath, 'utf8')
  const exportedNames = collectTypeScriptExports(adapter.entrypoint, source)

  assert.deepEqual(
    classifiedNames,
    exportedNames,
    `${adapterName} public exports changed; classify intentional additions and removals in ${baselinePath}`
  )

  process.stdout.write(
    `Checked ${exportedNames.length} classified ${adapter.maturity} exports for ${adapterName}.\n`
  )
}
