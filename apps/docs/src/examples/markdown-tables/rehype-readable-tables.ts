/** Editable rehype plugin. Keep Markdown parsing and content policy in the application. */
interface Node {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: Node[]
}

interface Frame {
  node: Node
  siblings: Node[]
  index: number
}

interface Options {
  label?: (tableNumber: number, caption: string) => string
  cue?: string
}

const textContent = (node: Node): string => {
  const pending = [node]
  let text = ''

  while (pending.length > 0) {
    const current = pending.pop()

    if (current?.type === 'text') text += current.value ?? ''
    else if (current?.children) {
      for (const child of current.children.toReversed()) pending.push(child)
    }
  }

  return text.trim()
}

const captionText = (table: Node): string => {
  const caption = table.children?.find(child => child.tagName === 'caption')

  return caption ? textContent(caption) : ''
}

export const rehypeReadableTables = ({
  label = (number, caption) => caption || `Table ${number}`,
  cue = 'Scroll horizontally to compare'
}: Options = {}) => (tree: Node): void => {
  const pending: Frame[] = [{ node: tree, siblings: [tree], index: 0 }]
  let number = 0

  for (let frame = pending.pop(); frame; frame = pending.pop()) {
    const { node, siblings, index } = frame

    if (node.properties?.dataReadableTable !== undefined) continue

    if (node.type !== 'element' || node.tagName !== 'table') {
      const children = node.children ?? []

      for (const [childIndex, child] of [...children.entries()].toReversed()) {
        pending.push({ node: child, siblings: children, index: childIndex })
      }

      continue
    }

    number++

    const viewport: Node = {
      type: 'element',
      tagName: 'div',
      properties: {
        className: ['ui-table-wrap'],
        dataSlot: 'table',
        dataScrollCueViewport: '',
        role: 'region',
        tabIndex: 0,
        ariaLabel: label(number, captionText(node))
      },
      children: [node]
    }

    siblings[index] = {
      type: 'element',
      tagName: 'div',
      properties: { className: ['ui-table-scroll'], dataUiScrollCue: '', dataReadableTable: '' },
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['ui-scroll-cue'], dataScrollCueMessage: '', dataSlot: 'scroll-cue', hidden: true },
          children: [{ type: 'element', tagName: 'span', properties: {}, children: [{ type: 'text', value: cue }] }]
        },
        viewport
      ]
    }
  }
}
