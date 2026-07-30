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
  createFigmaVariableName,
  createLumenBarGeometry,
  createLumenLineGeometry,
  createLumenPieGeometry,
  createScheduleSlots,
  createScheduleStorageKey,
  createThemeBuilderTokens,
  createThemeFromHue,
  createThemePalette,
  expandRecurringScheduleEvent,
  exportThemeBuilderValue,
  exportThemeCss,
  exportThemeDesignTokens,
  exportThemeFigmaVariables,
  getContrastRatio,
  getLumenIcon,
  getLumenIconPack,
  getRegisteredLumenIconNames,
  getScheduleConflicts,
  getVirtualRange,
  hslTokenToFigmaColor,
  hslTokenToHexColor,
  loadDataViewState,
  loadScheduleEvents,
  lumenChart,
  lumenCodeTokenClassNames,
  lumenColors,
  lumenColorTokenNames,
  lumenComponentBehavior,
  lumenComponentNames,
  lumenDarkTheme,
  lumenFont,
  lumenGlass,
  lumenGlassEffectTokenNames,
  lumenGlassTokenNames,
  lumenGlobalBehaviors,
  lumenIconNames,
  lumenLightTheme,
  lumenMotion,
  lumenPackages,
  lumenRadius,
  lumenStructureTokenNames,
  lumenThemeAttribute,
  lumenTokenNames,
  moveScheduleEvent,
  normalizeLumenCode,
  normalizeThemeBuilderHex,
  parseDataViewState,
  parseScheduleEvents,
  parseThemeCss,
  pinDataViewColumn,
  registerLumenIconPack,
  renderLumenCodeHtml,
  renderLumenIconSvg,
  resizeScheduleEvent,
  resizeScheduleEvents,
  resolveLumenAstroProps,
  resolveLumenGlass,
  resolveLumenIconName,
  saveDataViewState,
  saveScheduleEvents,
  scoreThemeContrast,
  serializeDataViewState,
  serializeScheduleEvents,
  suggestReadableInk,
  toggleDataViewSelection,
  tokenizeLumenCode,
  tuneThemeContrast,
  unpinDataViewColumn
} from './index.js'

describe('lumen core metadata', () => {
  test('exports a stable component catalog without duplicates', () => {
    expect(lumenComponentNames).toContain('Button')
    expect(lumenComponentNames).toContain('CodeTabs')
    expect(lumenComponentNames).toContain('BarChart')
    expect(lumenComponentNames).toContain('Icon')
    expect(lumenComponentNames).toContain('LineChart')
    expect(lumenComponentNames).toContain('Sparkline')
    expect(lumenComponentNames).toContain('ScrollProgress')
    expect(lumenComponentNames).toContain('Tabs')
    expect(new Set(lumenComponentNames).size).toBe(lumenComponentNames.length)
  })

  test('exports chart tokens and deterministic geometry helpers', () => {
    expect(lumenChart.series1).toBeTruthy()
    expect(lumenChart.series7).toBe('52 92% 45%')
    expect(lumenChart.sequentialHigh).toBeTruthy()
    expect(
      createLumenLineGeometry([{ x: 0, y: 1 }]).points
    ).toHaveLength(1)
    expect(
      createLumenBarGeometry([{
        data: [{ x: 'A', y: 1 }],
        id: 'a',
        label: 'A'
      }]).marks
    ).toHaveLength(1)
    expect(
      createLumenPieGeometry([{ x: 'A', y: 1 }]).slices
    ).toHaveLength(1)
  })

  test('describes all package targets', () => {
    expect(lumenPackages.map(pkg => pkg.packageName)).toEqual([
      '@santi020k/lumen',
      '@santi020k/lumen-core',
      '@santi020k/lumen-astro',
      '@santi020k/lumen-react',
      '@santi020k/lumen-elements',
      '@santi020k/lumen-icons-brand'
    ])
  })

  test('publishes framework behavior for every component and global authored behavior', () => {
    expect(Object.keys(lumenComponentBehavior).sort()).toEqual([...lumenComponentNames].sort())
    expect(lumenComponentBehavior.Card).toEqual({
      astro: 'none',
      elements: 'registered-element',
      react: 'component'
    })
    expect(lumenComponentBehavior.Dialog).toEqual({
      astro: 'ui-primitives',
      elements: 'registered-element',
      react: 'hook'
    })
    expect(lumenGlobalBehaviors.map(behavior => behavior.name)).toEqual(['form-validation', 'toast-events'])
  })
})

describe('lumen icon helpers', () => {
  test('resolve supported icon names and render Lucide SVGs', () => {
    expect(lumenIconNames).toContain('search')
    expect(lumenIconNames).toContain('wand-sparkles')
    expect(resolveLumenIconName('Home')).toBe('home')
    expect(resolveLumenIconName('alert-circle')).toBe('alert-circle')
    expect(resolveLumenIconName('ChevronLeft')).toBe('chevron-left')
    expect(resolveLumenIconName('WandSparkles')).toBe('wand-sparkles')
    expect(renderLumenIconSvg('search')).toContain('lucide-search')
    expect(renderLumenIconSvg('wand-sparkles')).toContain('lucide-wand-sparkles')
    expect(renderLumenIconSvg('missing')).toBe('')
  })

  test('registers namespaced filled icon packs without changing Lucide names', () => {
    registerLumenIconPack('test-brand', {
      example: {
        height: 24,
        name: 'example',
        node: [['path', { d: 'M2 2h20v20H2z' }]],
        source: 'test-brand',
        style: 'fill',
        width: 24
      }
    })

    expect(lumenIconNames).not.toContain('test-brand:example')
    expect(getRegisteredLumenIconNames()).toContain('test-brand:example')
    expect(getLumenIconPack('TestBrand')?.example).toBeDefined()
    expect(resolveLumenIconName('test-brand:Example')).toBe('test-brand:example')
    expect(getLumenIcon('test-brand:example')?.style).toBe('fill')
    expect(renderLumenIconSvg('test-brand:example')).toContain('fill="currentColor"')
    expect(renderLumenIconSvg('test-brand:example')).toContain('stroke="none"')
    expect(resolveLumenIconName('search')).toBe('search')
  })

  test('rejects invalid icon-pack prefixes', () => {
    expect(() => {
      registerLumenIconPack('', {})
    }).toThrow('must be non-empty')
    expect(() => {
      registerLumenIconPack('brand:social', {})
    }).toThrow('cannot contain colons')
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

  test('classifies comment, number, and type tokens', () => {
    const tokens = tokenizeLumenCode('let total: number = 42 // sum', 'ts')
    const kinds = new Set(tokens.map(token => token.kind).filter(Boolean))

    expect(kinds.has('keyword')).toBe(true)
    expect(kinds.has('type')).toBe(true)
    expect(kinds.has('accent')).toBe(true)
    expect(kinds.has('comment')).toBe(true)
    expect(tokens.find(token => token.value === '// sum')?.kind).toBe('comment')
    expect(tokens.find(token => token.value === '42')?.kind).toBe('accent')
    expect(tokens.find(token => token.value === 'number')?.kind).toBe('type')
  })

  test('tokenizes YAML keys, values, booleans, numbers, and comments', () => {
    const tokens = tokenizeLumenCode(`name: Astro Doctor
enabled: true
retries: 3
paths: ['**/*.astro']
# Run on pull requests`, 'yaml')

    expect(tokens.find(token => token.value === 'name')?.kind).toBe('keyword')
    expect(tokens.find(token => token.value === 'true')?.kind).toBe('type')
    expect(tokens.find(token => token.value === '3')?.kind).toBe('accent')
    expect(tokens.find(token => token.value === '\'**/*.astro\'')?.kind).toBe('string')
    expect(tokens.find(token => token.value === '# Run on pull requests')?.kind).toBe('comment')
  })

  test('tokenizes shell commands with semantic token kinds', () => {
    const tokens = tokenizeLumenCode('pnpm add -D "$PACKAGE" # install', 'bash')

    expect(tokens.find(token => token.value === '-D')?.kind).toBe('type')
    expect(tokens.find(token => token.value === '"$PACKAGE"')?.kind).toBe('string')
    expect(tokens.find(token => token.value === '# install')?.kind).toBe('comment')
  })

  test('tokenizes JSON and markup language families', () => {
    const jsonTokens = tokenizeLumenCode('{"enabled": true, "count": 2}', 'json')
    const markupTokens = tokenizeLumenCode('<Image src="/hero.png" alt="Overview" />', 'astro')

    expect(jsonTokens.find(token => token.value === '"enabled"')?.kind).toBe('keyword')
    expect(jsonTokens.find(token => token.value === 'true')?.kind).toBe('type')
    expect(markupTokens.find(token => token.value === 'Image')?.kind).toBe('keyword')
    expect(markupTokens.find(token => token.value === 'src')?.kind).toBe('type')
  })

  test('tokenizes Markdown and Lua language families', () => {
    const markdownTokens = tokenizeLumenCode('## Install\nUse `pnpm add`.', 'markdown')
    const luaTokens = tokenizeLumenCode('local enabled = true -- ready', 'lua')

    expect(markdownTokens.find(token => token.value === '##')?.kind).toBe('keyword')
    expect(markdownTokens.find(token => token.value === '`pnpm add`')?.kind).toBe('string')
    expect(luaTokens.find(token => token.value === 'local')?.kind).toBe('keyword')
    expect(luaTokens.find(token => token.value === '-- ready')?.kind).toBe('comment')
  })

  test('tokenizes SQL language families', () => {
    const sqlTokens = tokenizeLumenCode('SELECT name FROM projects WHERE active = 1', 'sql')

    expect(sqlTokens.find(token => token.value === 'SELECT')?.kind).toBe('keyword')
    expect(sqlTokens.find(token => token.value === '1')?.kind).toBe('accent')
  })

  test('passes through unsupported languages', () => {
    expect(tokenizeLumenCode('opaque source', 'plaintext')).toEqual([
      { start: 0, value: 'opaque source' }
    ])
    expect(tokenizeLumenCode('', 'plaintext')).toEqual([])
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
    expect(css).toContain('--glass-bg: 0 0% 100% / 0.55;')
    expect(css).toContain('--glass-shadow:')
    expect(css).toContain('--ui-radius: 0.625rem;')
    expect(css).toContain('--ui-shadow-md: 0 8px 24px hsl(221 47% 11% / 0.08);')
    expect(css).toContain('--ui-duration: 160ms;')
    expect(css).toContain('--ui-ease: cubic-bezier(0.32, 0.72, 0, 1);')
    expect(parseThemeCss(css).accent).toBe('168 76% 36%')
    expect(parseThemeCss(css)['glass-refraction']).toBe('221 83% 53% / 0.08')
    expect(parseThemeCss(css)['ui-radius-sm']).toBe('0.375rem')
    expect(parseThemeCss(css)['ui-font']).toContain('Montserrat')
    expect(parseThemeCss(css)['ui-ease-emphasized']).toBe('cubic-bezier(0.22, 1, 0.36, 1)')
    expect(getContrastRatio('0 0% 0%', '0 0% 100%')).toBe(21)
    expect(scoreThemeContrast(palette).wcagAA).toBe(true)
  })

  test('creates theme builder tokens and export payloads', () => {
    const generated = createThemeBuilderTokens({
      accentHue: 140,
      hue: 260,
      scheme: 'dark'
    })
    const manual = createThemeBuilderTokens({
      mode: 'manual',
      primaryColor: '#6f20f0',
      secondaryColor: '#14b8a6'
    })

    expect(generated).toMatchObject({
      accentHue: 140,
      hue: 260,
      mode: 'generated',
      scheme: 'dark'
    })
    expect(generated.tokens.brand).toBe('260 88% 60%')
    expect(generated.tokens['glass-bg']).toBe('260 20% 13% / 0.78')
    expect(generated.tokens['glass-brightness']).toBe('1')
    expect(generated.tokens['ui-radius']).toBe('0.625rem')
    expect(generated.tokens['ui-shadow-md']).toBe('0 12px 32px hsl(0 0% 0% / 0.24)')
    expect(generated.tokens['ui-duration']).toBe('160ms')
    expect(manual.hue).toBe(263)
    expect(manual.tokens.brand).toBe('263 87% 53%')
    expect(manual.tokens['glass-refraction']).toBe('263 83% 53% / 0.08')
    expect(manual.tokens.accent).toBe('173 80% 40%')
    expect(normalizeThemeBuilderHex('fff')).toBe('#ffffff')
    expect(exportThemeBuilderValue(generated.tokens, 'dark', 'css')).toContain('color-scheme: dark;')
    expect(exportThemeBuilderValue(generated.tokens, 'dark', 'css')).toContain('--glass-bg: 260 20% 13% / 0.78;')
    expect(exportThemeBuilderValue(generated.tokens, 'dark', 'css')).toContain('--ui-radius: 0.625rem;')
    expect(exportThemeBuilderValue(generated.tokens, 'dark', 'tokens')).toContain('"$type": "color"')
    expect(exportThemeBuilderValue(generated.tokens, 'dark', 'tokens')).toContain('"glass-shadow"')
    expect(exportThemeBuilderValue(generated.tokens, 'dark', 'tokens')).toContain('"ui-radius"')
    expect(exportThemeBuilderValue(generated.tokens, 'dark', 'figma')).toContain('"collectionName": "Lumen"')
  })

  test('exports theme tokens for Figma variables', () => {
    const palette = createThemePalette('221 83% 53%', '168 76% 36%')
    const variables = exportThemeFigmaVariables(palette, {
      collectionName: 'Acme theme',
      modeName: 'Brand'
    })

    expect(createFigmaVariableName('surface-muted')).toBe('color/surface/muted')
    expect(createFigmaVariableName('glass-bg')).toBe('color/glass/bg')
    expect(hslTokenToFigmaColor('221 83% 53%')).toMatchObject({
      a: 1,
      b: 0.9215686274509803,
      g: 0.38823529411764707,
      r: 0.1411764705882353
    })
    expect(hslTokenToHexColor('0 0% 100% / 0.55')).toBe('#ffffff8c')
    expect(variables.collectionName).toBe('Acme theme')
    expect(variables.modes[0]?.name).toBe('Brand')
    expect(variables.modes[0]?.variables.find(variable => variable.name === 'color/brand')).toMatchObject({
      cssValue: 'hsl(221 83% 53%)',
      type: 'COLOR'
    })
    expect(variables.modes[0]?.variables.find(variable => variable.name === 'color/glass/bg')).toMatchObject({
      cssValue: 'hsl(0 0% 100% / 0.55)',
      type: 'COLOR'
    })
  })

  test('exports theme tokens for design-token importers (colors)', () => {
    const palette = createThemePalette('221 83% 53%', '168 76% 36%')
    const designTokens = exportThemeDesignTokens(palette)

    expect(designTokens.color.brand?.$value).toBe('#2463eb')
    expect(designTokens.color['glass-bg']?.$value).toBe('#ffffff8c')
    expect(designTokens.color['surface-muted']?.$type).toBe('color')
  })

  test('exports theme tokens for design-token importers (effects and structure)', () => {
    const palette = createThemePalette('221 83% 53%', '168 76% 36%')
    const designTokens = exportThemeDesignTokens(palette)
    const effect = designTokens.effect
    const structure = designTokens.structure

    if (!effect || !structure) throw new Error('Missing tokens')

    const blur = effect['glass-blur']
    const saturate = effect['glass-saturate']
    const radius = structure['ui-radius']
    const shadow = structure['ui-shadow-lg']
    const font = structure['ui-font']
    const duration = structure['ui-duration']
    const ease = structure['ui-ease']

    if (!blur || !saturate || !radius || !shadow || !font || !duration || !ease) {
      throw new Error('Missing specific tokens')
    }

    expect(blur.$type).toBe('dimension')
    expect(saturate.$value).toBe(1.7)
    expect(radius.$type).toBe('dimension')
    expect(radius.$value).toBe('0.625rem')
    expect(shadow.$type).toBe('shadow')
    expect(font.$type).toBe('fontFamily')
    expect(duration.$type).toBe('duration')
    expect(ease.$type).toBe('cubicBezier')
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

test('derives a full palette from a single hue', () => {
  const light = createThemeFromHue(280)
  const dark = createThemeFromHue(280, { scheme: 'dark' })
  const wrapped = createThemeFromHue(-80)

  expect(light.brand).toBe('280 85% 53%')
  expect(light.accent).toBe('70 70% 40%')
  expect(light['surface-muted']).toBe('280 16% 96%')
  expect(dark.canvas).toBe('280 24% 8%')
  expect(dark.brand).toBe('280 88% 60%')
  expect(wrapped.brand).toBe('280 85% 53%')
  expect(scoreThemeContrast(light).wcagAA).toBe(true)
})

describe('lumen theme tokens', () => {
  test('keeps the public theme constants explicit', () => {
    expect(lumenThemeAttribute).toBe('data-theme')
    expect(lumenDarkTheme).toBe('dark')
    expect(lumenLightTheme).toBe('light')
    expect(lumenColors.brand).toMatch(/^\d+ \d+% \d+%$/)
    expect(lumenGlass.blur).toBe('22px')
    expect(lumenGlass.bg).toContain('/')
    expect(lumenColorTokenNames).toContain('glass-bg')
    expect(lumenGlassEffectTokenNames).toContain('glass-shadow')
    expect(lumenGlassTokenNames).toContain('glass-blur')
    expect(lumenTokenNames).toContain('glass-refraction')
    expect(lumenStructureTokenNames).toContain('ui-radius')
    expect(lumenStructureTokenNames).toContain('ui-shadow-md')
    expect(lumenStructureTokenNames).toContain('ui-ease')
    expect(lumenTokenNames).toContain('ui-font')
    expect(lumenFont).toBe('"Montserrat", "Avenir Next", "Segoe UI", sans-serif')
    expect(lumenRadius.base).toBe('0.625rem')
    expect(lumenMotion.ease).toContain('cubic-bezier')
  })

  test('composes class names from truthy values only', () => {
    expect(composeClassName('ui-button', false, null, undefined, 'ui-button--default')).toBe(
      'ui-button ui-button--default'
    )
  })

  test('resolves Astro class lists and passthrough props without reordering classes', () => {
    const rest = { 'aria-label': 'Revenue', id: 'chart' }
    const resolved = resolveLumenAstroProps(rest, [
      'ui-chart',
      'ui-chart--glass',
      false
    ], 'custom-class', 'custom-name')

    expect(resolved.classList).toEqual([
      'ui-chart',
      'ui-chart--glass',
      false,
      'custom-class',
      'custom-name'
    ])
    expect(resolved.passthrough).toBe(rest)
  })

  test('resolves deprecated surface aliases to the glass prop shape', () => {
    expect(resolveLumenGlass()).toBe(false)
    expect(resolveLumenGlass(false, 'glass')).toBe(true)
    expect(resolveLumenGlass('subtle', 'default')).toBe('subtle')
    expect(resolveLumenGlass('strong', 'glass')).toBe('strong')
  })
})
