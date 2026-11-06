import { describe, expect, test } from 'vitest'

import { rehypeReadableTables } from './rehype-readable-tables'

describe('editable Markdown table integration', () => {
  test('preserves caption and native table, adds named keyboard region, and survives a second pass', () => {
    const table = {
      type: 'element',
      tagName: 'table',
      properties: { id: 'comparison' },
      children: [
        { type: 'element', tagName: 'caption', children: [{ type: 'text', value: 'Delivery comparison' }] },
        { type: 'element', tagName: 'tbody', children: [] }
      ]
    }
    const tree: Parameters<ReturnType<typeof rehypeReadableTables>>[0] = { type: 'root', children: [table] }
    const transform = rehypeReadableTables()

    transform(tree)

    const wrapper = tree.children?.[0]
    const viewport = wrapper?.children?.[1]

    expect(viewport?.properties).toMatchObject({ role: 'region', tabIndex: 0, ariaLabel: 'Delivery comparison' })
    expect(viewport?.children).toEqual([table])
    expect(wrapper?.children?.[0]?.properties?.hidden).toBe(true)

    const first = JSON.stringify(tree)

    transform(tree)
    expect(JSON.stringify(tree)).toBe(first)
  })

  test('numbers unnamed tables and supports application labels', () => {
    const tree: Parameters<ReturnType<typeof rehypeReadableTables>>[0] = {
      type: 'root',
      children: [
        { type: 'element', tagName: 'table', children: [] },
        { type: 'element', tagName: 'table', children: [] }
      ]
    }

    rehypeReadableTables({ label: number => `Comparison ${number}`, cue: 'Scroll to read' })(tree)
    expect(tree.children?.map(node => node.children?.[1]?.properties?.ariaLabel)).toEqual(['Comparison 1', 'Comparison 2'])
  })

  test('numbers tables in document order across nested and root containers', () => {
    const table = (id: string) => ({
      type: 'element',
      tagName: 'table',
      properties: { id },
      children: [
        { type: 'element', tagName: 'caption', children: [{ type: 'text', value: id }] }
      ]
    })
    const tree: Parameters<ReturnType<typeof rehypeReadableTables>>[0] = {
      type: 'root',
      children: [
        { type: 'element', tagName: 'section', children: [table('first')] },
        table('second'),
        { type: 'element',
          tagName: 'section',
          children: [
            { type: 'element', tagName: 'div', children: [table('third')] },
            table('fourth')
          ] }
      ]
    }
    const observed: string[] = []

    rehypeReadableTables({ label: (number, caption) => {
      const label = `Table ${number}: ${caption}`

      observed.push(label)

      return label
    } })(tree)

    expect(observed).toEqual(['Table 1: first', 'Table 2: second', 'Table 3: third', 'Table 4: fourth'])
  })
})
