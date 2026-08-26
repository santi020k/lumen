import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import ts from 'typescript'

const classifications = ['supported', 'experimental', 'deprecated']

const defaultPackages = {
  astro: {
    entrypoint: 'packages/astro/index.ts',
    packageJson: 'packages/astro/package.json'
  },
  core: {
    entrypoint: 'packages/core/src/index.ts',
    packageJson: 'packages/core/package.json'
  },
  elements: {
    entrypoint: 'packages/elements/src/index.ts',
    packageJson: 'packages/elements/package.json'
  },
  lumen: {
    entrypoint: 'packages/lumen/src/index.ts',
    packageJson: 'packages/lumen/package.json'
  },
  react: {
    entrypoint: 'packages/react/src/index.ts',
    packageJson: 'packages/react/package.json'
  }
}

const hasExportModifier = node => node.modifiers?.some(
  modifier => modifier.kind === ts.SyntaxKind.ExportKeyword
) ?? false

const scriptKindFor = filePath => {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX

  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX

  if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) return ts.ScriptKind.JS

  return ts.ScriptKind.TS
}

const sortJson = value => {
  if (Array.isArray(value)) return value.map(sortJson)

  if (value === null || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortJson(child)])
  )
}

const localModuleCandidates = modulePath => {
  const extension = extname(modulePath)
  const withoutExtension = extension ? modulePath.slice(0, -extension.length) : modulePath
  let candidates

  if (extension === '.js' || extension === '.jsx' || extension === '.mjs') {
    candidates = [`${withoutExtension}.ts`, `${withoutExtension}.tsx`, `${withoutExtension}.js`, `${withoutExtension}.jsx`, modulePath]
  } else if (extension) {
    candidates = [modulePath]
  } else {
    candidates = [
      `${modulePath}.ts`,
      `${modulePath}.tsx`,
      `${modulePath}.js`,
      `${modulePath}.jsx`,
      `${modulePath}.astro`,
      resolve(modulePath, 'index.ts'),
      resolve(modulePath, 'index.tsx'),
      resolve(modulePath, 'index.js')
    ]
  }

  return [...new Set(candidates)]
}

const createCollector = ({ packageEntrypoints, repositoryRoot }) => {
  const moduleCache = new Map()
  const sourceCache = new Map()

  const readSource = async filePath => {
    if (!sourceCache.has(filePath)) sourceCache.set(filePath, await readFile(filePath, 'utf8'))

    return sourceCache.get(filePath)
  }

  const resolveModule = async (fromFile, specifier) => {
    if (packageEntrypoints.has(specifier)) return packageEntrypoints.get(specifier)

    if (!specifier.startsWith('.')) return null

    const modulePath = resolve(dirname(fromFile), specifier)

    for (const candidate of localModuleCandidates(modulePath)) {
      try {
        await readSource(candidate)

        return candidate
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
      }
    }

    throw new Error(`Cannot resolve ${specifier} from ${fromFile}`)
  }

  const addExport = (exports, name, origin) => {
    const origins = exports.get(name) ?? []

    exports.set(name, [...origins, origin])
  }

  const addBindingNames = (exports, name, origin) => {
    if (ts.isIdentifier(name)) {
      addExport(exports, name.text, origin)

      return
    }

    for (const element of name.elements) {
      if (!ts.isOmittedExpression(element)) addBindingNames(exports, element.name, origin)
    }
  }

  const resolveReexport = async ({ ancestry, collectModule, normalizedPath, statement }) => {
    const specifier = statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
      ? statement.moduleSpecifier.text
      : null

    const targetPath = specifier ? await resolveModule(normalizedPath, specifier) : null

    const targetExports = targetPath
      ? await collectModule(targetPath, [...ancestry, normalizedPath])
      : null

    return { specifier, targetExports }
  }

  const collectExportStar = ({ exports, normalizedPath, specifier, targetExports }) => {
    assert.ok(specifier, `Export star in ${normalizedPath} is missing a module specifier`)

    assert.ok(targetExports, `Cannot inventory external export star ${specifier} from ${normalizedPath}`)

    for (const [name, origins] of targetExports) {
      if (name !== 'default') origins.forEach(targetOrigin => addExport(exports, name, targetOrigin))
    }
  }

  const collectExportDeclaration = async ({ ancestry, collectModule, exports, normalizedPath, origin, statement }) => {
    const { specifier, targetExports } = await resolveReexport({
      ancestry,
      collectModule,
      normalizedPath,
      statement
    })

    if (!statement.exportClause) {
      collectExportStar({ exports, normalizedPath, specifier, targetExports })

      return
    }

    if (ts.isNamespaceExport(statement.exportClause)) {
      addExport(exports, statement.exportClause.name.text, origin)

      return
    }

    for (const element of statement.exportClause.elements) {
      const importedName = element.propertyName?.text ?? element.name.text

      if (targetExports) {
        assert.ok(
          targetExports.has(importedName),
          `${normalizedPath} reexports missing ${importedName} from ${specifier}`
        )
      }

      addExport(exports, element.name.text, origin)
    }
  }

  const getNamedDeclarationName = statement => {
    if ('name' in statement && statement.name && ts.isIdentifier(statement.name)) {
      return statement.name.text
    }

    return undefined
  }

  const collectExportedStatement = (exports, origin, statement) => {
    if (ts.isExportAssignment(statement)) {
      addExport(exports, 'default', origin)

      return
    }

    if (!hasExportModifier(statement)) return

    if (ts.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach(
        declaration => addBindingNames(exports, declaration.name, origin)
      )

      return
    }

    const declarationName = getNamedDeclarationName(statement)

    if (declarationName) {
      addExport(exports, declarationName, origin)
    } else if (statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
      addExport(exports, 'default', origin)
    }
  }

  const collectResolvedModule = async (normalizedPath, ancestry, collectModule) => {
    if (normalizedPath.endsWith('.astro')) {
      return new Map([['default', [`${normalizedPath}:astro-default`]]])
    }

    const source = await readSource(normalizedPath)

    const sourceFile = ts.createSourceFile(
      normalizedPath,
      source,
      ts.ScriptTarget.Latest,
      true,
      scriptKindFor(normalizedPath)
    )

    const exports = new Map()

    for (const statement of sourceFile.statements) {
      const line = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line + 1
      const origin = `${normalizedPath}:${line}`

      if (ts.isExportDeclaration(statement)) {
        await collectExportDeclaration({ ancestry, collectModule, exports, normalizedPath, origin, statement })
      } else {
        collectExportedStatement(exports, origin, statement)
      }
    }

    for (const [name, origins] of exports) {
      assert.equal(
        origins.length,
        1,
        `${normalizedPath} exports ${name} more than once:\n${origins.map(item => `  - ${item}`).join('\n')}`
      )
    }

    return exports
  }

  const collectModule = async (filePath, ancestry = []) => {
    const normalizedPath = isAbsolute(filePath) ? filePath : resolve(repositoryRoot, filePath)

    assert.ok(!ancestry.includes(normalizedPath), `Circular export graph: ${[...ancestry, normalizedPath].join(' -> ')}`)

    if (moduleCache.has(normalizedPath)) return moduleCache.get(normalizedPath)

    const collectionPromise = collectResolvedModule(normalizedPath, ancestry, collectModule)

    moduleCache.set(normalizedPath, collectionPromise)

    return collectionPromise
  }

  return collectModule
}

const validatePackageDefinition = (packageKey, packageDefinition) => {
  assert.equal(typeof packageDefinition.packageName, 'string', `${packageKey}.packageName must be a string`)

  assert.equal(typeof packageDefinition.packageJson, 'string', `${packageKey}.packageJson must be a string`)

  assert.equal(typeof packageDefinition.entrypoint, 'string', `${packageKey}.entrypoint must be a string`)

  assert.ok(packageDefinition.packageExports && typeof packageDefinition.packageExports === 'object', `${packageKey}.packageExports must be an object`)

  const classified = []

  for (const classification of classifications) {
    const symbols = packageDefinition[classification]

    assert.ok(Array.isArray(symbols), `${packageKey}.${classification} must be an array`)

    assert.ok(symbols.every(symbol => typeof symbol === 'string' && symbol.length > 0), `${packageKey}.${classification} contains an invalid symbol`)

    assert.deepEqual(symbols, [...symbols].sort(), `${packageKey}.${classification} must remain sorted`)

    classified.push(...symbols)
  }

  assert.equal(new Set(classified).size, classified.length, `${packageKey} classifies at least one symbol more than once`)

  assert.deepEqual(packageDefinition.unclassified ?? [], [], `${packageKey} contains unclassified API symbols`)

  return classified.sort()
}

export const collectWebApiSnapshot = async ({ packages = defaultPackages, repositoryRoot }) => {
  const manifests = new Map()

  for (const [packageKey, paths] of Object.entries(packages)) {
    const packageJsonPath = resolve(repositoryRoot, paths.packageJson)
    const manifest = JSON.parse(await readFile(packageJsonPath, 'utf8'))

    manifests.set(packageKey, { manifest, paths })
  }

  const packageEntrypoints = new Map(
    [...manifests.values()].map(({ manifest, paths }) => [manifest.name, resolve(repositoryRoot, paths.entrypoint)])
  )

  const collectModule = createCollector({ packageEntrypoints, repositoryRoot })
  const snapshotPackages = {}

  for (const packageKey of Object.keys(packages).sort()) {
    const { manifest, paths } = manifests.get(packageKey)
    const exportedSymbols = [...(await collectModule(paths.entrypoint)).keys()].sort()

    snapshotPackages[packageKey] = {
      entrypoint: paths.entrypoint,
      packageExports: sortJson(manifest.exports),
      packageJson: paths.packageJson,
      packageName: manifest.name,
      symbols: exportedSymbols
    }
  }

  return { packages: snapshotPackages, schemaVersion: 1 }
}

const toUpdatedBaseline = (snapshot, previousBaseline) => ({
  schemaVersion: 1,
  packages: Object.fromEntries(Object.entries(snapshot.packages).map(([packageKey, current]) => {
    const previous = previousBaseline?.packages?.[packageKey]
    const previousClassifications = new Map()

    for (const classification of classifications) {
      for (const symbol of previous?.[classification] ?? []) previousClassifications.set(symbol, classification)
    }

    const isInitialBaseline = !previous
    const classified = Object.fromEntries(classifications.map(classification => [classification, []]))
    const unclassified = []

    for (const symbol of current.symbols) {
      const classification = previousClassifications.get(symbol)

      if (classification) classified[classification].push(symbol)
      else if (isInitialBaseline) classified.supported.push(symbol)
      else unclassified.push(symbol)
    }

    return [packageKey, {
      ...current,
      ...classified,
      unclassified
    }]
  }))
})

export const checkWebApiBaseline = async ({ baselinePath, packages = defaultPackages, repositoryRoot, update = false }) => {
  const snapshot = await collectWebApiSnapshot({ packages, repositoryRoot })
  let baseline = null

  try {
    baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  if (update) {
    const updatedBaseline = toUpdatedBaseline(snapshot, baseline)

    await writeFile(baselinePath, `${JSON.stringify(updatedBaseline, null, 2)}\n`)

    return updatedBaseline
  }

  assert.ok(baseline, `Missing web API baseline at ${baselinePath}`)

  assert.equal(baseline.schemaVersion, 1, 'Unsupported web API baseline schema version')

  assert.deepEqual(Object.keys(baseline.packages), Object.keys(packages).sort(), 'Web API baseline package set changed')

  for (const [packageKey, current] of Object.entries(snapshot.packages)) {
    const expected = baseline.packages[packageKey]
    const classified = validatePackageDefinition(packageKey, expected)

    assert.equal(expected.packageName, current.packageName, `${packageKey} package name changed`)

    assert.equal(expected.packageJson, current.packageJson, `${packageKey} package manifest path changed`)

    assert.equal(expected.entrypoint, current.entrypoint, `${packageKey} root entrypoint changed`)

    assert.deepEqual(expected.packageExports, current.packageExports, `${packageKey} public export subpaths or conditions changed`)

    assert.deepEqual(expected.symbols, current.symbols, `${packageKey} recorded root symbol inventory changed`)

    assert.deepEqual(classified, expected.symbols, `${packageKey} root symbol inventory contains unclassified drift`)

    assert.deepEqual(classified, current.symbols, `${packageKey} root public symbols changed; run with --update and classify intentional additions`)
  }

  return baseline
}

const parseCliArguments = arguments_ => {
  const options = { update: false }

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]

    if (argument === '--update') options.update = true
    else if (argument === '--repository-root') options.repositoryRoot = arguments_[index += 1]
    else if (argument === '--baseline') options.baselinePath = arguments_[index += 1]
    else throw new Error(`Unknown argument: ${argument}`)
  }

  return options
}

export const runCli = async (arguments_ = process.argv.slice(2)) => {
  const options = parseCliArguments(arguments_)
  const repositoryRoot = resolve(options.repositoryRoot ?? import.meta.dirname, options.repositoryRoot ? '.' : '..')
  const baselinePath = resolve(options.baselinePath ?? resolve(repositoryRoot, 'registry/web-api-baseline.json'))
  const baseline = await checkWebApiBaseline({ baselinePath, repositoryRoot, update: options.update })

  const symbolCount = Object.values(baseline.packages).reduce(
    (total, packageDefinition) => total + classifications.reduce(
      (packageTotal, classification) => packageTotal + packageDefinition[classification].length,
      0
    ) + (packageDefinition.unclassified?.length ?? 0),
    0
  )

  process.stdout.write(`${options.update ? 'Updated' : 'Checked'} ${symbolCount} root exports across ${Object.keys(baseline.packages).length} web packages.\n`)
}

const isMainModule = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isMainModule) await runCli()
