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
