// cspell:words documentchange nodechange
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'

import { build } from 'esbuild'
import { beforeAll, describe, expect, test } from 'vitest'

import { componentKeys } from './contracts.js'
import type { PluginMessage } from './model.js'
import { isPluginMessage } from './model.js'

interface MockNode {
  id: string
  name: string
  type: string
  visible: boolean
  characters: string
  children: MockNode[]
  componentProperties: Record<string, { type: string, value: string | boolean }>
  getMainComponentAsync: () => Promise<{ key: string, name: string, parent: null } | null>
}

const node = (changes: Partial<MockNode> = {}): MockNode => ({
  id: '1:1',
  name: 'Example',
  type: 'FRAME',
  visible: true,
  characters: '',
  children: [],
  componentProperties: {},
  getMainComponentAsync: () => Promise.resolve(null),
  ...changes
})

let script: Script
beforeAll(async () => {
  const output = await build({
    entryPoints: [fileURLToPath(new URL('./plugin.ts', import.meta.url))],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false
  })
  const source = output.outputFiles[0]?.text
  if (!source) throw new Error('Missing sandbox bundle.')
  script = new Script(source)
})

const host = (selection: MockNode[]) => {
  const messages: PluginMessage[] = []
  const events = new Map<string, () => void>()
  const pageEvents = new Map<string, () => void>()
  const ui = {
    onmessage: (_message: unknown): void => {},
    postMessage: (message: unknown) => {
      if (!isPluginMessage(message)) throw new Error('Invalid sandbox message.')
      messages.push(message)
    }
  }
  const page = {
    selection,
    on: (type: string, callback: () => void) => {
      pageEvents.set(type, callback)
    },
    off: (type: string) => {
      pageEvents.delete(type)
    }
  }
  script.runInNewContext({
    __html__: '<div>Plugin test</div>',
    figma: {
      mixed: Symbol('mixed'),
      ui,
      currentPage: page,
      root: { setRelaunchData: () => {} },
      showUI: () => {},
      on: (type: string, callback: () => void) => {
        events.set(type, callback)
      },
      variables: { getVariableByIdAsync: () => Promise.resolve(null) }
    }
  })
  const send = async (message: unknown) => {
    ui.onmessage(message)
    await new Promise<void>(resolve => setImmediate(resolve))
  }
  return { messages, events, pageEvents, page, send }
}

describe('Figma host lifecycle', () => {
  test('waits for the UI handshake and rejects empty or multiple selections', async () => {
    const app = host([])
    expect(app.messages).toEqual([])
    await app.send({ type: 'ready' })
    expect(app.messages.at(-1)).toEqual({ type: 'selection', name: null })
    await app.send({ type: 'analyze' })
    expect(app.messages.at(-1)?.type).toBe('error')
    app.page.selection = [node(), node()]
    await app.send({ type: 'analyze' })
    expect(app.messages.at(-1)?.type).toBe('error')
  })

  test('exports visible design data and ignores malformed commands', async () => {
    const app = host([node({ children: [node({ type: 'TEXT', characters: 'Visible' }), node({ visible: false, characters: 'Hidden' })] })])
    await app.send(null)
    await app.send({ type: 'delete' })
    expect(app.messages).toEqual([])
    await app.send({ type: 'analyze' })
    const message = app.messages.at(-1)
    expect(message?.type).toBe('result')
    if (message?.type !== 'result') throw new Error('Expected conversion result.')
    expect(message.result.code).toContain('Visible')
    expect(message.result.handoff).not.toContain('Hidden')
  })

  test('normalizes property suffixes and recognizes canonical instances', async () => {
    const key = componentKeys.Button[0]
    if (!key) throw new Error('Missing Button key.')
    const app = host([node({
      type: 'INSTANCE',
      name: 'Renamed action',
      getMainComponentAsync: () => Promise.resolve({ key, name: 'Button', parent: null }),
      componentProperties: {
        'Label#12:4': { type: 'TEXT', value: 'Continue' },
        Variant: { type: 'VARIANT', value: 'Outline' },
        Size: { type: 'VARIANT', value: 'Sm' }
      }
    })])
    await app.send({ type: 'analyze' })
    const message = app.messages.at(-1)
    if (message?.type !== 'result') throw new Error('Expected conversion result.')
    expect(message.result.code).toContain('<Button variant="outline" size="sm">{"Continue"}</Button>')
  })

  test('rejects ambiguous properties without silently replacing their values', async () => {
    const app = host([node({ type: 'INSTANCE',
      componentProperties: {
        'Label#1': { type: 'TEXT', value: 'First' }, 'Label#2': { type: 'TEXT', value: 'Second' }
      } })])
    await app.send({ type: 'analyze' })
    expect(app.messages.at(-1)?.type).toBe('error')
  })

  test('rejects selections beyond layer, nesting, and text limits', async () => {
    let deep = node()
    for (let depth = 0; depth < 42; depth += 1) deep = node({ children: [deep] })
    for (const selection of [
      deep,
      node({ children: Array.from({ length: 1501 }, () => node()) }),
      node({ type: 'TEXT', characters: 'x'.repeat(100_001) }),
      node({ visible: false })
    ]) {
      const app = host([selection])
      await app.send({ type: 'analyze' })
      expect(app.messages.at(-1)?.type).toBe('error')
    }
  })

  test('invalidates stale results during a selection change', async () => {
    const selected = node({ type: 'INSTANCE' })
    const app = host([selected])
    selected.getMainComponentAsync = () => {
      app.events.get('selectionchange')?.()
      return Promise.resolve(null)
    }
    await app.send({ type: 'analyze' })
    expect(app.messages.at(-1)?.type).toBe('error')
    expect(app.messages.some(message => message.type === 'result')).toBe(false)
  })

  test('uses page-scoped changes compatible with dynamic-page access', async () => {
    const app = host([node()])
    expect(app.events.has('documentchange')).toBe(false)
    expect(app.pageEvents.has('nodechange')).toBe(true)
    app.pageEvents.get('nodechange')?.()
    expect(app.messages.at(-1)?.type).toBe('selection')
    const manifest: unknown = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'))
    expect(manifest).toMatchObject({ documentAccess: 'dynamic-page', networkAccess: { allowedDomains: ['none'] } })
  })
})
