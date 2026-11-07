import type { DesignNode } from './model.js'

const MAX_NODES = 1500
const MAX_DEPTH = 40
const MAX_TEXT = 100_000
const componentOwner = (component: ComponentNode) => component.parent?.type === 'COMPONENT_SET' ? component.parent : component

const propertyValues = (node: SceneNode): [string, string | boolean][] => {
  if (node.type === 'INSTANCE') return Object.entries(node.componentProperties).map(([key, prop]) => [key, prop.value])

  if (node.type !== 'COMPONENT') return []

  // Figma documents this getter for component variants. Remove the exception when
  // plugin-typings separates the deprecated instance getter from ComponentNode.
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- The instance path above uses componentProperties.
  const variants = node.variantProperties

  return Object.entries(componentOwner(node).componentPropertyDefinitions).map(([key, prop]) => [
    key, prop.type === 'VARIANT' ? variants?.[key] ?? prop.defaultValue : prop.defaultValue
  ])
}

const readProperties = (node: SceneNode, boundedText: (value: string) => string) => {
  const properties = new Map<string, string | boolean>()

  for (const [key, value] of propertyValues(node)) {
    const name = key.split('#')[0] ?? key

    if (properties.has(name)) throw new Error('Component property names are ambiguous. Rename duplicate properties before exporting.')

    properties.set(boundedText(name), typeof value === 'string' ? boundedText(value) : value)
  }

  return Object.fromEntries(properties)
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
  if (node.type !== 'INSTANCE' && node.type !== 'COMPONENT') return null

  const main = node.type === 'INSTANCE' ? await node.getMainComponentAsync() : node

  if (!main) return null

  const owner = componentOwner(main)

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

  const read = async (selected: SceneNode, depth: number): Promise<DesignNode> => {
    const current = selected.type === 'COMPONENT_SET' ? selected.defaultVariant : selected

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
      id: selected.id,
      name: boundedText(selected.name),
      type: selected.type,
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
