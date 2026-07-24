import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse, transform } from '@astrojs/compiler'
import ts from 'typescript'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const data = JSON.parse(await readFile(join(packageRoot, 'data/lumen-data.json'), 'utf8'))
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lumen-mcp-examples-'))
const reactFiles = []
const failures = []

const recordCompilerDiagnostics = (label, diagnostics = []) => {
  for (const diagnostic of diagnostics) {
    failures.push(`${label}: ${diagnostic.text ?? diagnostic.message ?? String(diagnostic)}`)
  }
}

try {
  for (const component of data.components) {
    if (component.frameworks.astro) {
      const framework = component.frameworkDetails.astro
      const source = `---\n${framework.importStatement}\n---\n${framework.example}`

      const result = await transform(source, {
        filename: `${component.kebab}.astro`
      })

      recordCompilerDiagnostics(`${component.name} (astro)`, result.diagnostics)
    }

    if (component.frameworks.elements) {
      const framework = component.frameworkDetails.elements

      if (/[<{][A-Z][A-Za-z0-9]*/.test(framework.example)) {
        failures.push(`${component.name} (elements): example contains unconverted component syntax`)
      }

      const result = await parse(framework.example, { position: true })

      recordCompilerDiagnostics(`${component.name} (elements)`, result.diagnostics)
    }

    if (component.frameworks.react) {
      const framework = component.frameworkDetails.react
      const hasPackageImport = framework.example.includes("from '@santi020k/lumen-react'")

      const source = hasPackageImport
        ? framework.example
        : `${framework.importStatement}\n\nexport const Example = () => <>\n${framework.example}\n</>`

      const path = join(temporaryRoot, `${component.kebab}.tsx`)

      await writeFile(path, source, 'utf8')

      reactFiles.push(path)
    }
  }

  const compilerOptions = {
    baseUrl: repoRoot,
    ignoreDeprecations: '6.0',
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    paths: {
      '@santi020k/lumen-react': ['packages/react/dist/index.d.ts'],
      react: ['packages/react/node_modules/@types/react/index.d.ts'],
      'react/*': ['packages/react/node_modules/@types/react/*']
    },
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022
  }

  const program = ts.createProgram(reactFiles, compilerOptions)

  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')

    if (!diagnostic.file || diagnostic.start === undefined) {
      failures.push(`React examples: ${message}`)

      continue
    }

    const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
    const name = diagnostic.file.fileName.slice(temporaryRoot.length + 1)

    failures.push(`${name}:${position.line + 1}:${position.character + 1}: ${message}`)
  }

  assert.deepEqual(failures, [], `Generated example validation failed:\n${failures.join('\n')}`)

  process.stdout.write(
    `lumen-mcp: validated ${data.components.length} Astro, React, and Elements component examples\n`
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
