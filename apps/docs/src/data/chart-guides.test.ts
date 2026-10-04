import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { lumenComponentNames } from '@santi020k/lumen-core'
import ts from 'typescript'
import { describe, expect, test } from 'vitest'

import { chartGuides, getChartGuide } from './chart-guides'
import { componentDocs } from './docs'

const plotNames = lumenComponentNames.filter(name => (
  (name.endsWith('Chart') && name !== 'Chart') ||
  ['BoxPlot', 'CalendarHeatmap', 'Heatmap', 'Histogram', 'Sparkline'].includes(name)
))

describe('chart guides', () => {
  test('give every public plot its own guide and existing live example', () => {
    expect(chartGuides.map(guide => guide.name).sort()).toEqual([...plotNames].sort())
    expect(new Set(chartGuides.map(guide => guide.slug)).size).toBe(chartGuides.length)

    for (const guide of chartGuides) {
      expect(componentDocs.some(component => component.name === guide.name)).toBe(true)
      expect(existsSync(new URL(`../examples/${guide.name}.astro`, import.meta.url))).toBe(true)
      expect(guide.slug).toBe(guide.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
      expect(getChartGuide(guide.name)).toBe(guide)
    }

    expect(getChartGuide('Chart')).toBeUndefined()
    expect(getChartGuide('UnknownChart')).toBeUndefined()
  })

  test('provide decision, data, interpretation, and pitfalls on every chart page', () => {
    for (const guide of chartGuides) {
      for (const text of [guide.question, guide.description, guide.when, guide.dataShape]) {
        expect(text.trim(), `${guide.name} must have complete guidance`).not.toBe('')
      }

      for (const notes of [guide.dataNotes, guide.readingNotes, guide.pitfalls]) {
        expect(notes.length, `${guide.name} needs practical notes`).toBeGreaterThanOrEqual(2)
        expect(notes.every(note => note.trim().length > 0)).toBe(true)
      }

      expect(guide.related.length).toBeGreaterThan(0)

      for (const related of guide.related) {
        expect(related).not.toBe(guide.name)
        expect(getChartGuide(related), `${guide.name} has a broken related chart link`).toBeDefined()
      }
    }
  })

  test('type checks every data recipe against the public core contracts', () => {
    const sources = new Map(chartGuides.map(guide => [
      fileURLToPath(new URL(`chart-data-${guide.slug}.ts`, import.meta.url)),
      `${guide.dataShape}\nexport {}\n`
    ]))
    const options: ts.CompilerOptions = {
      exactOptionalPropertyTypes: true,
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
        ts.createSourceFile(fileName, source, languageVersion, true, ts.ScriptKind.TS)
    }

    const program = ts.createProgram([...sources.keys()], options, host)
    const diagnostics = ts.getPreEmitDiagnostics(program).map(diagnostic => ({
      file: diagnostic.file?.fileName.split('/').pop(),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    }))

    expect(diagnostics).toEqual([])
  }, 30_000)
})
