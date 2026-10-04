// @vitest-environment jsdom

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { lumenElementDefinitions } from '@santi020k/lumen-elements'
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
  { name: 'CalendarHeatmap', value: '2026-08-07', label: 'Not available', rows: 7 },
  { name: 'FunnelChart', value: '600', label: 'Activated', rows: 3 },
  { name: 'BoxPlot', value: '190 ms', label: 'Median', rows: 2 },
  { name: 'LollipopChart', value: '91', label: 'Score', rows: 3 },
  { name: 'DumbbellChart', value: '91', label: 'Previous', rows: 3 },
  { name: 'BulletChart', value: '86%', label: 'Goal', rows: 5 }
])('copied $name example renders its data and units', async ({ name, value, label, rows }) => {
  const { runInNewContext } = await import('node:vm')
  const elements = await import('@santi020k/lumen-elements')
  const testPath = expect.getState().testPath

  if (!testPath) throw new Error('Expected the active Vitest test path')

  const source = readFileSync(join(dirname(testPath), `../examples/${name}.astro`), 'utf8')
  const code = buildSnippets(name, source)[2]?.code ?? ''
  const template = document.createElement('template')

  template.innerHTML = code

  const script = template.content.querySelector('script')

  if (!script?.textContent) throw new Error('Expected a runnable Elements example')

  const scriptSource = script.textContent

  script.remove()
  document.body.replaceChildren(template.content)
  runInNewContext(scriptSource.replace(/^import .* from '@santi020k\/lumen-elements'$/mu, ''), {
    ...elements,
    document
  })

  expect(document.body.querySelector('.ui-chart__empty')).toBeNull()
  expect(document.body.textContent).toContain(value)
  expect(document.body.textContent).toContain(label)
  expect(document.body.querySelectorAll('tbody tr')).toHaveLength(rows)
  document.body.replaceChildren()
})
