// @vitest-environment jsdom

import { isValidElement } from 'react'
import * as reactJsxRuntime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runInNewContext } from 'node:vm'

import * as elements from '@santi020k/lumen-elements'
import { lumenElementDefinitions } from '@santi020k/lumen-elements'
import * as reactAdapter from '@santi020k/lumen-react'
import ts from 'typescript'
import { expect, test } from 'vitest'

import { buildSnippets } from './snippets'

test('only uses registered custom elements throughout the Elements catalog examples', () => {
  const testPath = expect.getState().testPath

  if (!testPath) throw new Error('Expected the active Vitest test path')

  const directory = join(dirname(testPath), '../examples')
  const registered = new Set<string>(lumenElementDefinitions.map(([tagName]) => tagName))
  const unknownTags: string[] = []

  for (const fileName of readdirSync(directory).filter(name => name.endsWith('.astro'))) {
    const source = readFileSync(join(directory, fileName), 'utf8')
    const code = buildSnippets(fileName.slice(0, -6), source)[2]?.code ?? ''

    for (const match of code.matchAll(/<(lumen-[a-z0-9-]+)(?=[\s>])/gu)) {
      const tag = match[1]

      if (tag && !registered.has(tag)) unknownTags.push(`${fileName}: ${tag}`)
    }
  }

  expect(unknownTags).toEqual([])
})

test('connects the copied Elements Toast example through the public controller', () => {
  const code = buildSnippets('Toast', '<lumen-toast-demo />')[2]?.code ?? ''

  expect(code).toContain('import { defineLumenElements, LumenToast } from \'@santi020k/lumen-elements\'')
  expect(code).toContain('getElementById(\'show-preview-toast\')?.addEventListener(\'click\'')
  expect(code).toContain('LumenToast.create(')
  expect(code).not.toContain('lumen-toast-demo')
})

test.each([
  { name: 'CalendarHeatmap', value: '2026-08-31', label: 'Not available', rows: 184 },
  { name: 'FunnelChart', value: '600', label: 'Activated', rows: 3 },
  { name: 'BoxPlot', value: '190 ms', label: 'Median', rows: 2 },
  { name: 'LollipopChart', value: '91', label: 'Score', rows: 3 },
  { name: 'DumbbellChart', value: '91', label: 'Previous', rows: 3 },
  { name: 'BulletChart', value: '86%', label: 'Goal', rows: 5 }
])('copied $name example renders its data and units', ({ name, value, label, rows }) => {
  const testPath = expect.getState().testPath

  if (!testPath) throw new Error('Expected the active Vitest test path')

  const source = readFileSync(join(dirname(testPath), `../examples/${name}.astro`), 'utf8')
  const code = buildSnippets(name, source)[2]?.code ?? ''
  const template = document.createElement('template')

  template.innerHTML = code

  const scripts = [...template.content.querySelectorAll('script')]

  expect(scripts.length).toBeGreaterThan(0)

  const scriptSources = scripts.map(script => script.textContent)

  for (const script of scripts) script.remove()

  document.body.replaceChildren(template.content)

  for (const scriptSource of scriptSources) runExampleModule(scriptSource)

  expect(document.body.querySelector('.ui-chart__empty')).toBeNull()
  expect(document.body.textContent).toContain(value)
  expect(document.body.textContent).toContain(label)
  expect(document.body.querySelectorAll('tbody tr')).toHaveLength(rows)
  document.body.replaceChildren()
})

const runExampleModule = (source: string): Record<string, unknown> => {
  const exports: Record<string, unknown> = {}
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ESNext
    }
  }).outputText

  runInNewContext(javascript, {
    document,
    exports,
    require: (specifier: string): unknown => {
      if (specifier === '@santi020k/lumen-elements' || specifier === '@santi020k/lumen-elements/define') return elements

      if (specifier === '@santi020k/lumen-react') return reactAdapter

      if (specifier === 'react/jsx-runtime') return reactJsxRuntime

      throw new Error(`Unexpected import in chart example: ${specifier}`)
    }
  })

  return exports
}

const tableRows = (root: ParentNode): string[][] => [...root.querySelectorAll('table tbody tr')].map(row => (
  [...row.querySelectorAll('th, td')].map(cell => cell.textContent.trim().replaceAll(/\s+/gu, ' '))
))

const isExampleFunction = (value: unknown): value is () => unknown => typeof value === 'function'

const renderReactExample = (code: string): DocumentFragment => {
  const Example = runExampleModule(code).Example

  if (!isExampleFunction(Example)) throw new Error('Missing React example')

  const result = Example()

  if (!isValidElement(result)) throw new Error('Invalid React example')

  const template = document.createElement('template')

  template.innerHTML = renderToStaticMarkup(result)

  return template.content
}

const renderElementsExample = (code: string): HTMLElement => {
  const template = document.createElement('template')

  template.innerHTML = code

  const scripts = [...template.content.querySelectorAll('script')]
  const scriptSources = scripts.map(script => script.textContent)

  for (const script of scripts) script.remove()

  document.body.replaceChildren(template.content)

  for (const script of scriptSources) runExampleModule(script)

  return document.body
}

const renderChartExamples = (name: string) => {
  const testPath = expect.getState().testPath

  if (!testPath) throw new Error('Expected the active Vitest test path')

  const source = readFileSync(join(dirname(testPath), `../examples/${name}.astro`), 'utf8')
  const snippets = buildSnippets(name, source)
  const preview = renderReactExample(snippets[1]?.code ?? '')
  const copied = renderElementsExample(snippets[2]?.code ?? '')

  return { copied, preview }
}

const getChart = (root: ParentNode): Element => {
  const chart = root.querySelector('.ui-chart, .ui-sparkline')

  if (!chart) throw new Error('Expected a rendered chart')

  return chart
}

const textAt = (root: ParentNode, selector: string): string | undefined => (
  root.querySelector(selector)?.textContent.trim()
)

test.each([
  'BarChart',
  'BoxPlot',
  'BulletChart',
  'CalendarHeatmap',
  'ComboChart',
  'DumbbellChart',
  'FunnelChart',
  'Heatmap',
  'Histogram',
  'LineChart',
  'LollipopChart',
  'PieChart',
  'RangeChart',
  'ScatterChart',
  'Sparkline',
  'WaterfallChart'
])('copied %s Elements data matches its source-derived React preview', name => {
  const { copied, preview } = renderChartExamples(name)

  expect(copied.querySelector('.ui-chart__empty')).toBeNull()
  expect(tableRows(copied)).toEqual(tableRows(preview))

  const expectedChart = getChart(preview)
  const copiedChart = getChart(copied)

  expect(copiedChart.getAttribute('aria-label')).toBe(expectedChart.getAttribute('aria-label'))

  for (const selector of ['.ui-chart__heading h3', '.ui-chart__heading p', 'figcaption']) {
    expect(textAt(copiedChart, selector)).toBe(textAt(expectedChart, selector))
  }

  document.body.replaceChildren()
})

test('copied Sparkline preserves the line geometry and accompanying statistic', () => {
  const { copied, preview } = renderChartExamples('Sparkline')
  const copiedPath = getChart(copied).querySelector('path')
  const expectedPath = getChart(preview).querySelector('path')

  expect(copiedPath).not.toBeNull()
  expect(copiedPath?.getAttribute('d')).toBe(expectedPath?.getAttribute('d'))
  for (const selector of ['.ui-stat-label', '.ui-stat-value', '.ui-stat-description', '.ui-stat-trend']) {
    expect(textAt(copied, selector)).toBe(textAt(preview, selector))
  }
  document.body.replaceChildren()
})

test.each([{ name: 'ComboChart', markers: 8 }, { name: 'RangeChart', markers: 0 }])('copied $name shows the same readable axes across adapters', ({ name, markers }) => {
  const { copied, preview } = renderChartExamples(name)

  for (const selector of ['.ui-chart__grid text', '.ui-chart__axis-labels text']) {
    const expected = [...preview.querySelectorAll(selector)].map(node => node.textContent)

    expect(expected.length).toBeGreaterThan(2)
    expect([...copied.querySelectorAll(selector)].map(node => node.textContent)).toEqual(expected)
  }

  expect(copied.querySelectorAll('.ui-line-chart__point')).toHaveLength(markers)
  expect(preview.querySelectorAll('.ui-line-chart__point')).toHaveLength(markers)

  document.body.replaceChildren()
})
