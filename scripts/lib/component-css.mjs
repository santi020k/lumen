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

/** Partition canonical styles, retaining whole tokens/base/glass layers and opaque at-rules. */
export const partitionComponentCss = sources => {
  const foundation = []
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
    for (const selector of splitCssSelectors(header)) {
      const families = selectorFamilies(selector)

      if (!families.length) {
        foundation.push(wrapRule(`${selector} {${body}}`, ancestors))

        continue
      }

      for (const family of families) representative(family)

      for (const family of families.slice(1)) parents.set(representative(family), representative(families[0]))

      rules.push({ families, text: wrapRule(`${selector} {${body}}`, ancestors) })
    }
  }

  const visit = (source, ancestors = []) => {
    for (const node of readCssNodes(source)) {
      const { header, body, text } = node

      if (body === null) {
        if (!header.startsWith('@import')) foundation.push(wrapRule(text, ancestors))

        continue
      }

      if (['@layer lumen.tokens', '@layer lumen.base', '@layer lumen.glass'].includes(header)) {
        foundation.push(wrapRule(text, ancestors))
      } else if (/^@(layer|media|supports|container)\b/u.test(header)) {
        visit(body, [...ancestors, header])
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
    foundation: foundation.join('\n\n'),
    parts: new Map([...parts].map(([name, values]) => [name, values.join('\n\n')])),
    families: new Map([...parents.keys()].map(family => [family, representative(family)]))
  }
}
