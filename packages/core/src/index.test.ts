import { describe, expect, test } from 'vitest'

import {
  applyDataViewState,
  canPlaceScheduleEvent,
  composeClassName,
  createDataViewRequestUrl,
  createDataViewSearchParams,
  createDataViewServerRequest,
  createDataViewState,
  createDataViewStorageKey,
  createScheduleSlots,
  createScheduleStorageKey,
  createThemePalette,
  expandRecurringScheduleEvent,
  exportThemeCss,
  getContrastRatio,
  getScheduleConflicts,
  getVirtualRange,
  loadDataViewState,
  loadScheduleEvents,
  lumenCodeTokenClassNames,
  lumenColors,
  lumenComponentNames,
  lumenDarkTheme,
  lumenGlass,
  lumenLightTheme,
  lumenPackages,
  lumenThemeAttribute,
  moveScheduleEvent,
  normalizeLumenCode,
  parseDataViewState,
  parseScheduleEvents,
  parseThemeCss,
  pinDataViewColumn,
  resizeScheduleEvent,
  resizeScheduleEvents,
  saveDataViewState,
  saveScheduleEvents,
  scoreThemeContrast,
  serializeDataViewState,
  serializeScheduleEvents,
  suggestReadableInk,
  renderLumenCodeHtml,
  toggleDataViewSelection,
  tokenizeLumenCode,
  tuneThemeContrast,
  unpinDataViewColumn
} from './index.js'

describe('lumen core metadata', () => {
  test('exports a stable component catalog without duplicates', () => {
    expect(lumenComponentNames).toContain('Button')
    expect(lumenComponentNames).toContain('Tabs')
    expect(new Set(lumenComponentNames).size).toBe(lumenComponentNames.length)
  })

  test('describes all package targets', () => {
    expect(lumenPackages.map(pkg => pkg.packageName)).toEqual([
      '@santi020k/lumen',
      '@santi020k/lumen-core',
      '@santi020k/lumen-astro',
      '@santi020k/lumen-react',
      '@santi020k/lumen-elements'
    ])
  })
})

describe('lumen code helpers', () => {
  test('normalizes multiline code indentation', () => {
    expect(normalizeLumenCode(`
      const theme = "lumen";
      const accent = "hsl(var(--accent))";
    `)).toBe('const theme = "lumen";\nconst accent = "hsl(var(--accent))";')
  })

  test('tokenizes and escapes lightweight JavaScript code', () => {
    const html = renderLumenCodeHtml('const label = "<lumen>";', 'ts')

    expect(tokenizeLumenCode('const label = "<lumen>";', 'ts')).toEqual([
      { kind: 'keyword', start: 0, value: 'const' },
      { start: 5, value: ' ' },
      { start: 6, value: 'label' },
      { start: 11, value: ' ' },
      { kind: 'symbol', start: 12, value: '=' },
      { start: 13, value: ' ' },
      { kind: 'string', start: 14, value: '"<lumen>"' },
      { kind: 'symbol', start: 23, value: ';' }
    ])
    expect(html).toContain(lumenCodeTokenClassNames.string)
    expect(html).toContain('&lt;lumen&gt;')
  })
})

describe('lumen product helpers', () => {
  test('creates schedule slots and moves events between resources', () => {
    const events = [{
      end: '2026-07-04T11:00:00.000Z',
      id: 'planning',
      resourceId: 'studio',
      start: '2026-07-04T10:00:00.000Z',
      title: 'Planning'
    }]

    expect(createScheduleSlots(['2026-07-04'], events, [{ id: 'studio', label: 'Studio' }])[0]?.events).toHaveLength(1)

    expect(moveScheduleEvent(events, 'planning', '2026-07-05T10:00:00.000Z', '2026-07-05T11:00:00.000Z', 'field')[0]).toMatchObject({
      resourceId: 'field',
      start: '2026-07-05T10:00:00.000Z'
    })
  })

  test('expands recurring schedule events', () => {
    const [first, second] = expandRecurringScheduleEvent({
      end: '2026-07-04T11:00:00.000Z',
      id: 'standup',
      start: '2026-07-04T10:00:00.000Z',
      title: 'Standup'
    }, 2, 1)

    expect(first?.id).toBe('standup')
    expect(second?.id).toBe('standup-2')
    expect(second?.start).toBe('2026-07-05T10:00:00.000Z')
  })

  test('detects schedule conflicts', () => {
    const events = [
      { end: '2026-07-04T11:00:00.000Z', id: 'a', resourceId: 'room', start: '2026-07-04T10:00:00.000Z', title: 'A' },
      { end: '2026-07-04T11:30:00.000Z', id: 'b', resourceId: 'room', start: '2026-07-04T10:30:00.000Z', title: 'B' },
      { end: '2026-07-04T11:30:00.000Z', id: 'c', resourceId: 'other', start: '2026-07-04T10:30:00.000Z', title: 'C' }
    ]

    expect(getScheduleConflicts(events)).toHaveLength(1)
    expect(canPlaceScheduleEvent(events, { end: '2026-07-04T13:00:00.000Z', id: 'd', resourceId: 'room', start: '2026-07-04T12:00:00.000Z', title: 'D' })).toBe(true)
  })

  test('resizes schedule events with snapping and bounds', () => {
    const event = {
      end: '2026-07-04T11:00:00.000Z',
      id: 'planning',
      start: '2026-07-04T10:00:00.000Z',
      title: 'Planning'
    }
    const resizedEnd = resizeScheduleEvent(event, '2026-07-04T11:22:00.000Z', {
      max: '2026-07-04T11:15:00.000Z',
      snapMinutes: 15
    })
    const resizedStart = resizeScheduleEvent(event, '2026-07-04T10:08:00.000Z', {
      edge: 'start',
      min: '2026-07-04T10:15:00.000Z',
      snapMinutes: 15
    })
    const resizedPastEnd = resizeScheduleEvent(event, '2026-07-04T12:30:00.000Z', {
      edge: 'start',
      snapMinutes: 15
    })

    expect(resizedEnd.end).toBe('2026-07-04T11:15:00.000Z')
    expect(resizedStart.start).toBe('2026-07-04T10:15:00.000Z')
    expect(resizedPastEnd.start).toBe('2026-07-04T10:59:00.000Z')
    expect(resizeScheduleEvents([event], 'planning', '2026-07-04T11:30:00.000Z')[0]?.end).toBe('2026-07-04T11:30:00.000Z')
  })

  test('persists schedule events through storage-like adapters', () => {
    const storage = new Map<string, string>()
    const key = createScheduleStorageKey('Production Calendar')
    const events = [{
      end: '2026-07-04T11:00:00.000Z',
      id: 'planning',
      start: '2026-07-04T10:00:00.000Z',
      title: 'Planning'
    }]

    saveScheduleEvents({
      setItem: (name, value) => storage.set(name, value)
    }, key, events)

    expect(key).toBe('lumen:schedule:production-calendar')
    expect(loadScheduleEvents({
      getItem: name => storage.get(name) ?? null
    }, key)).toEqual(events)
    expect(parseScheduleEvents('[{"id":"broken"}]')).toEqual([])
    expect(parseScheduleEvents('not json')).toEqual([])
    expect(serializeScheduleEvents(events)).toContain('planning')
  })

  test('serializes data view state and virtual ranges', () => {
    const state = createDataViewState({
      filters: { status: 'ready' },
      pinnedColumns: ['name'],
      query: 'docs',
      selectedIds: ['1'],
      sort: { direction: 'desc', key: 'updated' }
    })
    const parsed = parseDataViewState(serializeDataViewState(state))

    expect(parsed.filters.status).toBe('ready')
    expect(parsed.sort).toEqual({ direction: 'desc', key: 'updated' })
    expect(getVirtualRange(120, 200, 40, 100)).toEqual({ endIndex: 13, startIndex: 0 })

    expect(applyDataViewState([
      { id: '1', name: 'Docs', status: 'ready', updated: 2 },
      { id: '2', name: 'API', status: 'draft', updated: 1 }
    ], state).items).toEqual([{ id: '1', name: 'Docs', status: 'ready', updated: 2 }])
  })

  test('persists data view state through storage-like adapters', () => {
    const storage = new Map<string, string>()
    const key = createDataViewStorageKey('Orders Table')
    const state = createDataViewState({
      filters: { status: 'ready' },
      page: 3,
      pageSize: 50,
      query: 'handoff'
    })

    saveDataViewState({
      setItem: (name, value) => storage.set(name, value)
    }, key, state)

    expect(key).toBe('lumen:data-view:orders-table')
    expect(loadDataViewState({
      getItem: name => storage.get(name) ?? null
    }, key)).toMatchObject({
      filters: { status: 'ready' },
      page: 3,
      pageSize: 50,
      query: 'handoff'
    })
  })

  test('adapts data view state for pinned columns, selection, and server requests', () => {
    const state = createDataViewState({
      filters: { status: 'ready' },
      pinnedColumns: ['name'],
      query: 'handoff',
      selectedIds: ['1'],
      sort: { direction: 'asc', key: 'name' }
    })
    const pinned = pinDataViewColumn(state, 'status')
    const unpinned = unpinDataViewColumn(pinned, 'name')
    const selected = toggleDataViewSelection(unpinned, '2', true)
    const deselected = toggleDataViewSelection(selected, '1', false)
    const request = createDataViewServerRequest('/api/orders?tenant=acme', deselected)

    expect(pinned.pinnedColumns).toEqual(['status', 'name'])
    expect(unpinned.pinnedColumns).toEqual(['status'])
    expect(deselected.selectedIds).toEqual(['2'])
    expect(createDataViewSearchParams(deselected).get('filter.status')).toBe('ready')
    expect(createDataViewRequestUrl('/api/orders', deselected)).toContain('/api/orders?page=1')
    expect(request.url).toContain('/api/orders?tenant=acme&page=1')
    expect(request.query).toBe(serializeDataViewState(deselected))
  })

  test('exports and imports theme CSS tokens', () => {
    const palette = createThemePalette('221 83% 53%', '168 76% 36%')
    const css = exportThemeCss(palette, ':root[data-theme="acme"]')

    expect(css).toContain('--brand: 221 83% 53%;')
    expect(parseThemeCss(css).accent).toBe('168 76% 36%')
    expect(getContrastRatio('0 0% 0%', '0 0% 100%')).toBe(21)
    expect(scoreThemeContrast(palette).wcagAA).toBe(true)
  })

  test('suggests readable ink and tunes low contrast themes', () => {
    const lowContrast = {
      ...createThemePalette('221 83% 53%'),
      canvas: '0 0% 100%',
      ink: '0 0% 94%'
    }
    const tuned = tuneThemeContrast(lowContrast)

    expect(suggestReadableInk('0 0% 100%')).toMatchObject({
      foreground: '0 0% 0%',
      ratio: 21
    })
    expect(tuned.ink).toBe('0 0% 0%')
    expect(scoreThemeContrast(tuned).wcagAA).toBe(true)
  })
})

describe('lumen theme tokens', () => {
  test('keeps the public theme constants explicit', () => {
    expect(lumenThemeAttribute).toBe('data-theme')
    expect(lumenDarkTheme).toBe('dark')
    expect(lumenLightTheme).toBe('light')
    expect(lumenColors.brand).toMatch(/^\d+ \d+% \d+%$/)
    expect(lumenGlass.blur).toBe('18px')
    expect(lumenGlass.bg).toContain('/')
  })

  test('composes class names from truthy values only', () => {
    expect(composeClassName('ui-button', false, null, undefined, 'ui-button--default')).toBe(
      'ui-button ui-button--default'
    )
  })
})
