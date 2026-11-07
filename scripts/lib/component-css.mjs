import { findCssGroupEnd, readCssNodes, skipCssLiteral, splitCssSelectors } from './css-source.mjs'

const cssFamily = name => name.split('__')[0].split('--')[0]

// Structural siblings that intentionally share classes on the same rendered element.
export const cssFamilyAliases = {
  'button-link': 'button',
  'code-tabs': 'tabs',
  'date-picker-field': 'date-picker',
  'dialog-footer': 'dialog',
  'input-otp-field': 'input-otp',
  'select-field': 'select',
  'table-wrap': 'table'
}

export const normalizeCssFamily = name => cssFamilyAliases[cssFamily(name)] ?? cssFamily(name)

const familyNames = selector => [...selector.matchAll(/\.ui-([a-z][\w-]*)/g)]
  .map(match => normalizeCssFamily(match[1]))

/** Attribute-only selectors are public behavior hooks with corresponding style owners. */
const attributeFamily = selector => {
  for (const family of ['kanban', 'amount-field', 'schedule', 'carousel', 'list-box', 'visual-effect']) {
    if (selector.includes(`[data-ui-${family}`)) return [family]
  }

  if (selector.includes('[data-ui-tabs-layout]')) return ['tabs']

  const customElement = /(?:^|\s|>)(?:lumen-)([a-z][\w-]*)/.exec(selector)

  return customElement ? [normalizeCssFamily(customElement[1])] : []
}

const outerSelector = selector => {
  let visible = ''

  for (let index = 0; index < selector.length; index += 1) {
    const literalEnd = skipCssLiteral(selector, index)

    if (literalEnd !== index) { index = literalEnd;

 continue }

    if (selector[index] === '(' || selector[index] === '[') {
      index = findCssGroupEnd(selector, index)

      continue
    }

    visible += selector[index]
  }

  return visible
}

/** Find the closest styled compound selector, ignoring classes in negative/relational arguments. */
export const selectorFamilies = selector => {
  const compounds = outerSelector(selector).split(/[\s>+~]+/u)

  for (const compound of compounds.reverse()) {
    const families = familyNames(compound)

    if (families.length) return [...new Set(families)]
  }

  if (selector.startsWith(':is(') || selector.startsWith(':where(')) {
    const start = selector.indexOf('(')
    const end = findCssGroupEnd(selector, start)

    return [...new Set(splitCssSelectors(selector.slice(start + 1, end)).flatMap(selectorFamilies))]
  }

  return attributeFamily(selector)
}

const wrapRule = (text, ancestors) => ancestors.reduceRight((body, header) => `${header} {\n${body}\n}`, text)

// Only appearance selectors belong to opt-ins. DeviceFrame's __glass is physical hardware.
const appearanceEntry = selector => {
  if (selector.includes('[data-lumen-preset="studio"]')) return 'themes/studio'

  if (selector.includes('[data-lumen-preset="glass"]') || /\.ui-[\w-]+--glass\b/u.test(selector)) return 'effects/glass'

  if (selector.includes('[data-theme="santi020k-') || selector.includes('[data-code-theme="santi020k"]')) return 'themes/santi020k'

  return undefined
}

// A scoped appearance owns the whole block; its lower boundary may name a different theme.
const appearanceBlockEntry = header => {
  if (header === '@layer lumen.glass') return 'effects/glass'

  if (!header.startsWith('@scope (')) return undefined

  const start = header.indexOf('(')

  return appearanceEntry(header.slice(start, findCssGroupEnd(header, start)))
}

const presetAppearanceEntry = rule => {
  const entry = appearanceEntry(rule.header)

  if (entry) return entry

  if (rule.body.includes('--_ls-')) return 'themes/studio'

  if (rule.body.includes('--_lg-')) return 'effects/glass'

  return undefined
}

const partitionTokens = (source, foundation, appearances, ancestors) => {
  for (const rule of readCssNodes(source)) {
    if (rule.header.startsWith('@')) {
      if (rule.body === null) throw new Error(`Unexpected token layer statement: ${rule.header}`)

      partitionTokens(rule.body, foundation, appearances, [...ancestors, rule.header])

      continue
    }

    const entry = presetAppearanceEntry(rule)
    // Keep optional palettes above base defaults even if a bundler reverses the imports.
    // Base and scoped default resets use the same selectors for their glass variables.
    const layer = entry ? '@layer lumen.tokens' : '@layer lumen.tokens.foundation'
    const palette = entry ? appearances[entry] : foundation
    const declarations = readCssNodes(rule.body.trimEnd() + ';').filter(node => node.header)

    const groups = Map.groupBy(declarations, node =>
      !entry && (node.header.startsWith('--glass-') || node.header.startsWith('--_ld-glass-')) ? appearances['effects/glass'] : palette)

    for (const [target, values] of groups) {
      target.push(wrapRule(values.map(node => node.text).join('\n'), [...ancestors, layer, rule.header]))
    }
  }
}

/** Partition the full stylesheet into the shared foundation, appearances and component parts. */
export const partitionComponentCss = sources => {
  const foundation = []
  const appearances = { 'themes/studio': [], 'themes/santi020k': [], 'effects/glass': [] }
  const rules = []
  const parents = new Map()

  const representative = family => {
    if (!parents.has(family)) parents.set(family, family)

    const parent = parents.get(family)

    if (parent === family) return family

    const root = representative(parent)

    parents.set(family, root)

    return root
  }

  const addSelectors = (header, body, ancestors) => {
    const optionalSelectors = new Map()

    for (const selector of splitCssSelectors(header)) {
      const entry = appearanceEntry(selector)

      if (entry) {
        const selectors = optionalSelectors.get(entry) ?? []

        selectors.push(selector)

        optionalSelectors.set(entry, selectors)

        continue
      }

      const families = selectorFamilies(selector)

      if (!families.length) {
        foundation.push(wrapRule(`${selector} {${body}}`, ancestors))

        continue
      }

      for (const family of families) representative(family)

      for (const family of families.slice(1)) parents.set(representative(family), representative(families[0]))

      rules.push({ families, text: wrapRule(`${selector} {${body}}`, ancestors) })
    }

    for (const [entry, selectors] of optionalSelectors) {
      appearances[entry].push(wrapRule(`${selectors.join(',\n')} {${body}}`, ancestors))
    }
  }

  const addStatement = (header, text, ancestors) => {
    if (!header.startsWith('@import')) foundation.push(wrapRule(text, ancestors))
  }

  const visit = (source, ancestors = []) => {
    for (const node of readCssNodes(source)) {
      const { header, body, text } = node

      if (body === null) {
        addStatement(header, text, ancestors)

        continue
      }

      const appearance = appearanceBlockEntry(header)

      if (header === '@layer lumen.tokens') {
        partitionTokens(body, foundation, appearances, ancestors)
      } else if (appearance) {
        appearances[appearance].push(wrapRule(text, ancestors))
      } else if (header === '@layer lumen.base') {
        foundation.push(wrapRule(text, ancestors))
      } else if (/^@(layer|media|supports|container|scope)\b/u.test(header)) {
        visit(body, [...ancestors, header])
      } else if (/^@keyframes ui-map-(?:enter|pulse)$/u.test(header)) {
        representative('world-map')

        rules.push({ families: ['world-map'], text: wrapRule(text, ancestors) })
      } else if (header.startsWith('@')) {
        foundation.push(wrapRule(text, ancestors))
      } else {
        addSelectors(header, body, ancestors)
      }
    }
  }

  for (const source of sources) visit(source)

  const parts = new Map()

  for (const rule of rules) {
    const owner = representative(rule.families[0])
    const previous = parts.get(owner) ?? []

    previous.push(rule.text)

    parts.set(owner, previous)
  }

  return {
    appearances,
    foundation: foundation.join('\n\n'),
    parts: new Map([...parts].map(([name, values]) => [name, values.join('\n\n')])),
    families: new Map([...parents.keys()].map(family => [family, representative(family)]))
  }
}
