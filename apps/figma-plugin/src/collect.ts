import type { DesignNode } from './model.js'

const MAX_NODES = 1500
const MAX_DEPTH = 40
const MAX_TEXT = 100_000

const readProperties = (node: SceneNode, boundedText: (value: string) => string) => {
  const properties: Record<string, string | boolean> = {}

  if (node.type !== 'INSTANCE') return properties

  for (const [key, property] of Object.entries(node.componentProperties)) {
    const name = key.split('#')[0] ?? key

    if (Object.hasOwn(properties, name)) throw new Error('Component property names are ambiguous. Rename duplicate properties before exporting.')

    properties[name] = typeof property.value === 'string' ? boundedText(property.value) : property.value
  }

  return properties
}

const readLayout = (node: SceneNode): DesignNode['layout'] => {
  if (!('layoutMode' in node)) return null

  return {
    direction: node.layoutMode,
    gap: node.itemSpacing,
    padding: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft],
    wrap: node.layoutWrap === 'WRAP'
  }
}

const readIdentity = async (node: SceneNode): Promise<DesignNode['component']> => {
  if (node.type !== 'INSTANCE') return null

  const main = await node.getMainComponentAsync()

  if (!main) return null

  const owner = main.parent?.type === 'COMPONENT_SET' ? main.parent : main

  return { key: main.key, setKey: owner.key, name: owner.name }
}

const readPaints = async (node: SceneNode, resolveVariable: (id: string) => Promise<string>) => {
  const tokens: DesignNode['tokens'] = []
  let unboundPaints = 0

  const fields = [
    { field: 'fills', paints: 'fills' in node ? node.fills : [] },
    { field: 'strokes', paints: 'strokes' in node ? node.strokes : [] }
  ]

  for (const { field, paints } of fields) {
    if (typeof paints === 'symbol') continue

    for (const paint of paints) {
      if (paint.visible === false || paint.type !== 'SOLID') continue

      const binding = paint.boundVariables?.color

      if (binding) tokens.push({ name: await resolveVariable(binding.id), field })
      else unboundPaints += 1
    }
  }

  return { tokens, unboundPaints }
}

export const collectSelection = async (node: SceneNode): Promise<DesignNode> => {
  let count = 0
  let characters = 0
  const variables = new Map<string, string>()

  const boundedText = (value: string) => {
    characters += value.length

    if (characters > MAX_TEXT) throw new Error('This selection contains too much text. Select a smaller section.')

    return value
  }

  const resolveVariable = async (id: string) => {
    const cached = variables.get(id)

    if (cached) return cached

    const variable = await figma.variables.getVariableByIdAsync(id)
    const name = boundedText(variable?.name ?? 'Unknown variable')

    variables.set(id, name)

    return name
  }

  const read = async (current: SceneNode, depth: number): Promise<DesignNode> => {
    count += 1

    if (count > MAX_NODES || depth > MAX_DEPTH) throw new Error('This selection is too large or deeply nested. Select a smaller section (up to 1,500 layers).')

    const component = await readIdentity(current)
    const properties = readProperties(current, boundedText)
    const paints = await readPaints(current, resolveVariable)
    const children: DesignNode[] = []

    if ('children' in current) {
      for (const child of current.children) {
        if (child.visible) children.push(await read(child, depth + 1))
      }
    }

    return {
      id: current.id,
      name: boundedText(current.name),
      type: current.type,
      text: current.type === 'TEXT' ? boundedText(current.characters) : null,
      component,
      properties,
      layout: readLayout(current),
      ...paints,
      children
    }
  }

  if (!node.visible) throw new Error('Select a visible frame or component.')

  return read(node, 0)
}
