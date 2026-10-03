const spacingDimension = (token, name) => {
  const value = token?.$value

  if (value?.unit !== 'px' || !Number.isFinite(value.value) || value.value < 0) {
    throw new Error(`Invalid spacing dimension: space.${name}.`)
  }

  return value.value
}

const spacingReference = (token, name, spacing) => {
  const reference = token?.$value

  if (typeof reference !== 'string' || !reference.startsWith('{space.') || !reference.endsWith('}')) {
    throw new Error(`Invalid layout spacing reference: layout.${name}.`)
  }

  const target = reference.slice(7, -1)

  if (!Object.hasOwn(spacing, target)) throw new Error(`Unknown spacing token: ${reference}.`)

  return target
}

export const parseSpacingTokens = sourceText => {
  const source = JSON.parse(sourceText)
  const spacing = {}
  const spacingRoles = {}

  if (!source.space || !source.layout) throw new Error('Missing space or layout tokens.')

  for (const [name, token] of Object.entries(source.space)) {
    if (name.startsWith('$')) continue

    spacing[name] = spacingDimension(token, name)
  }

  for (const [name, token] of Object.entries(source.layout)) {
    if (name.startsWith('$')) continue

    spacingRoles[name] = spacingReference(token, name, spacing)
  }

  for (const role of ['related', 'group', 'section', 'inset']) {
    if (!Object.hasOwn(spacingRoles, role)) throw new Error(`Missing layout spacing role: ${role}.`)
  }

  return { spacing, spacingRoles }
}

export const generateSpacingCss = ({ spacing, spacingRoles }) => [
  '  /* BEGIN:generated-spacing */',
  ...Object.entries(spacing).map(([name, value]) => `  --ui-space-${name}: ${value / 16}rem;`),
  ...Object.entries(spacingRoles).map(([name, token]) => `  --ui-space-${name}: var(--ui-space-${token});`),
  '  /* END:generated-spacing */'
].join('\n')
