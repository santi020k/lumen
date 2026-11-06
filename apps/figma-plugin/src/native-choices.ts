import { isComponentBoundary, isLayoutLayer } from './contracts.js'
import type { DesignNode } from './model.js'
import { labelText } from './native-controls.js'

export interface NativeChoice {
  label: string
  description: string
  value: string
}

const namedFrame = (node: DesignNode | undefined, name: string): node is DesignNode => {
  if (node?.name !== name) return false

  return isLayoutLayer(node) && !isComponentBoundary(node)
}

const namedCopy = (node: DesignNode | undefined, name: string) => namedFrame(node, name) ? labelText(node) : null

const artworkOnly = (node: DesignNode): boolean => !isComponentBoundary(node) &&
  (node.type === 'VECTOR' || (isLayoutLayer(node) && node.children.every(artworkOnly)))

const selectedAppearance = (span: DesignNode) => {
  if (span.unboundPaints) return null

  const has = (field: string, name: string) => span.tokens.some(token => token.field === field && token.name === name)

  if (span.tokens.length === 1 && has('strokes', 'color/line')) return false

  if (span.tokens.length === 2 && has('strokes', 'color/brand') && has('fills', 'color/brand-soft')) return true

  return null
}

const choiceRow = (row: DesignNode, index: number) => {
  const [span] = row.children

  if (!namedFrame(row, 'Label') || row.children.length !== 1 || !namedFrame(span, 'Span')) return null

  const [icon, title, detail] = span.children

  if (span.children.length !== 3 || !namedFrame(icon, 'Icon') || !artworkOnly(icon)) return null

  const label = namedCopy(title, 'Strong')
  const description = namedCopy(detail, 'Small')
  const selected = selectedAppearance(span)

  if (!label || !description || selected === null) return null

  return { option: { label, description, value: `option-${index + 1}` }, selected }
}

export const drawnChoiceGroup = (node: DesignNode) => {
  const [legend, ...rows] = node.children
  const label = namedCopy(legend, 'Legend')

  if (!label || rows.length < 2) return null

  const options: NativeChoice[] = []
  let initial: string | undefined

  for (const [index, row] of rows.entries()) {
    const result = choiceRow(row, index)

    if (!result) return null

    if (result.selected) {
      if (initial) return null

      initial = result.option.value
    }

    options.push(result.option)
  }

  return initial ? { label, options, initial } : null
}
