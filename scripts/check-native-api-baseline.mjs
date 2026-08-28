import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import ts from 'typescript'

const repositoryRoot = resolve(import.meta.dirname, '..')
const baselinePath = resolve(repositoryRoot, 'registry/native-api-baseline.json')
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
const classifications = ['supported', 'experimental', 'deprecated']
const maturities = new Set(['stable'])
const nativeApiAuditPath = resolve(repositoryRoot, 'docs/native-api-audit.md')
const nativeApiAudit = await readFile(nativeApiAuditPath, 'utf8')

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

assert.equal(baseline.schemaVersion, 2, 'Unsupported native API baseline schema version')

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

  const entrypointClassifications = [adapter]
  let exportCount = exportedNames.length

  for (const [subpath, subpathContract] of Object.entries(adapter.subpaths ?? {})) {
    const subpathLabel = `${adapterName}${subpath}`
    const subpathClassifiedNames = validateClassification(subpathLabel, subpathContract)
    const subpathSource = await readFile(resolve(repositoryRoot, subpathContract.entrypoint), 'utf8')
    const subpathExportedNames = collectTypeScriptExports(subpathContract.entrypoint, subpathSource)

    assert.deepEqual(
      subpathClassifiedNames,
      subpathExportedNames,
      `${subpathLabel} public exports changed; classify intentional additions and removals in ${baselinePath}`
    )

    entrypointClassifications.push(subpathContract)

    exportCount += subpathExportedNames.length
  }

  const stableEntrypointClassifications = new Map()

  for (const contract of entrypointClassifications) {
    for (const classification of classifications) {
      for (const name of contract[classification]) {
        const occurrences = stableEntrypointClassifications.get(name) ?? []

        occurrences.push(classification)

        stableEntrypointClassifications.set(name, occurrences)
      }
    }
  }

  for (const [name, occurrences] of stableEntrypointClassifications) {
    if (occurrences.length === 1) continue

    assert.deepEqual(
      [...occurrences].sort(),
      ['deprecated', 'supported'],
      `${adapterName}.${name} may span stable entrypoints only as one deprecated alias and one supported replacement`
    )
  }

  if (adapterName === 'reactNative') {
    const expectedClassification = [
      `${entrypointClassifications.reduce((count, contract) => count + contract.supported.length, 0)} Supported`,
      `${entrypointClassifications.reduce((count, contract) => count + contract.experimental.length, 0)} Experimental phone exports`,
      `${entrypointClassifications.reduce((count, contract) => count + contract.deprecated.length, 0)} Deprecated`
    ].join('; ')

    assert.ok(
      nativeApiAudit.includes(expectedClassification),
      `${nativeApiAuditPath} must derive the React Native classification summary from the reviewed baseline`
    )
  }

  process.stdout.write(
    `Checked ${exportCount} classified ${adapter.maturity} exports across ` +
      `${entrypointClassifications.length} entrypoints for ${adapterName}.\n`
  )
}

const composePhoneSource = await readFile(
  resolve(repositoryRoot, 'packages/compose/src/main/kotlin/com/santi020k/lumen/PhoneComponents.kt'),
  'utf8'
)

if (composePhoneSource.includes('annotation class ExperimentalLumenPhoneApi')) {
  assert.ok(
    nativeApiAudit.includes('ExperimentalLumenPhoneApi'),
    `${nativeApiAuditPath} must disclose the experimental Compose phone contract`
  )

  const nativeComponents = await readFile(
    resolve(repositoryRoot, 'docs/native-components.md'),
    'utf8'
  )

  const experimentalHeading = nativeComponents.indexOf('### Experimental shared surface')
  const phoneContract = nativeComponents.indexOf('| Phone input')

  assert.ok(
    experimentalHeading >= 0 && phoneContract > experimentalHeading,
    'docs/native-components.md must list Phone input under the Experimental shared surface'
  )

  const crossPlatform = await readFile(resolve(repositoryRoot, 'docs/cross-platform.md'), 'utf8')

  assert.ok(
    crossPlatform.includes('Experimental PhoneInput contracts'),
    'docs/cross-platform.md must label the shared PhoneInput contract Experimental'
  )
}

const playgrounds = await readFile(resolve(repositoryRoot, 'docs/playgrounds.md'), 'utf8')

assert.doesNotMatch(
  playgrounds,
  /all \d+ contracts shared by every native adapter/,
  'docs/playgrounds.md must derive contract totals instead of freezing a hand-maintained count'
)
