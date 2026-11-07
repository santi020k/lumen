import { expect, test } from 'vitest'

import { createCssDependencyCollector } from './build-report-css.js'

test('collects only compiler-confirmed CSS imports and replaces stale dependencies', () => {
  const dependencies = new Map<string, Set<string>>()
  const collector = createCssDependencyCollector(dependencies)
  collector.OnceExit(null, { result: { opts: { from: '/app/global.css' },
    messages: [
      { type: 'dependency', plugin: 'postcss-import', file: '/app/node_modules/@santi020k/lumen-react/styles.css' },
      { type: 'dependency', plugin: 'unrelated-watch-plugin', file: '/app/config.css' },
      { type: 'dependency', plugin: 'postcss-import', file: 'relative.css' },
      null
    ] } })
  expect([...dependencies.get('/app/global.css') ?? []]).toEqual(['/app/node_modules/@santi020k/lumen-react/styles.css'])
  collector.OnceExit(null, { result: { opts: { from: '/app/global.css' }, messages: [] } })
  expect([...dependencies.get('/app/global.css') ?? []]).toEqual([])
})

test.each([null, {}, { result: null }, { result: { opts: { from: 'relative.css' } } }])('ignores unsupported compiler metadata: %j', metadata => {
  const dependencies = new Map<string, Set<string>>()
  createCssDependencyCollector(dependencies).OnceExit(null, metadata)
  expect(dependencies.size).toBe(0)
})
