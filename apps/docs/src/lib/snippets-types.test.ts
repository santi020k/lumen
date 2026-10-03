import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { expect, test } from 'vitest'

import { buildSnippets } from './snippets'

test('type checks every generated React example against the public adapter', () => {
  const directory = new URL('../examples/', import.meta.url)
  const sources = new Map(readdirSync(directory).filter(name => name.endsWith('.astro')).map(name => {
    const raw = readFileSync(new URL(name, directory), 'utf8')
    const code = buildSnippets(name.slice(0, -6), raw)[1]?.code ?? ''
    const fileName = fileURLToPath(new URL(`generated-${name}.tsx`, directory))

    return [fileName, code] as const
  }))
  const options: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    exactOptionalPropertyTypes: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    noUncheckedIndexedAccess: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ESNext
  }
  const host = ts.createCompilerHost(options)
  const getSourceFile = host.getSourceFile.bind(host)

  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const source = sources.get(fileName)

    return source === undefined ?
      getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) :
      ts.createSourceFile(fileName, source, languageVersion, true, ts.ScriptKind.TSX)
  }

  const program = ts.createProgram([...sources.keys()], options, host)
  const diagnostics = ts.getPreEmitDiagnostics(program).map(diagnostic => ({
    file: diagnostic.file?.fileName.split('/').pop(),
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  }))

  expect(diagnostics).toEqual([])
}, 60_000)
