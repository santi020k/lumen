import type { DesignNode } from './model.js'
import { stackGaps } from './presentations.js'
import type { ExportTarget } from './targets.js'

// Encode design content as data inside an Astro expression, including frontmatter
// delimiters, tags, and JavaScript-looking text in editable code examples.
export const expression = (value: string | readonly Record<string, string>[]) => `{${JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')}}`

interface RenderContext {
  target: ExportTarget
  text: (node: DesignNode, property: string, fallback: string) => string
  choice: (node: DesignNode, property: string, options: string[], fallback: string) => string
  issue: (node: DesignNode, message: string) => void
  addImports: (...names: string[]) => void
}

const layerText = (node: DesignNode, layer: string): string[] => {
  if (node.type === 'TEXT') return node.name === layer && node.text !== null ? [node.text] : []

  return node.children.flatMap(child => layerText(child, layer))
}

const optionalTextAttribute = (node: DesignNode, property: string, attribute: string) => {
  const value = node.properties[property]

  return typeof value === 'string' && value ? ` ${attribute}=${expression(value)}` : ''
}

const copyAttributes = (node: DesignNode) => {
  if (node.properties['Show copy'] !== true) return ''

  return ' copy' + optionalTextAttribute(node, 'Copy label', 'copyLabel') +
    optionalTextAttribute(node, 'Copied label', 'copiedLabel') + optionalTextAttribute(node, 'Error label', 'errorLabel')
}

const codePresentation = (node: DesignNode, target: ExportTarget, variant: string, wrap: boolean) => {
  if (variant !== 'block') return ''

  const selected = node.properties.Appearance
  const editorial = selected === undefined ? ['paper', 'field'].includes(target.appearance) : selected === 'Editorial'
  const appearance = target.version === '5.0.0' && editorial ? ' appearance="editorial"' : ''
  const scrollCue = !wrap && node.properties['Show scroll cue'] === true ? ' scrollCue' : ''

  return appearance + optionalTextAttribute(node, 'Language', 'language') + copyAttributes(node) + scrollCue
}

export const editorialRenderers = ({ target, text, choice, issue, addImports }: RenderContext) => {
  const content = (node: DesignNode, property: string) => expression(text(node, property, ''))
  const textComponent = (name: string) => (node: DesignNode) => `<${name}>${content(node, 'Text')}</${name}>`
  const animation = (node: DesignNode) => choice(node, 'Animation', ['fade', 'slide up', 'scale'], 'fade').replaceAll(' ', '-')

  const numeric = (node: DesignNode, property: string, fallback: number, unit: 'ratio' | 'ms') => {
    const raw = node.properties[property]
    const value = typeof raw === 'string' ? raw.trim() : ''
    const numberText = unit === 'ms' && value.endsWith('ms') ? value.slice(0, -2).trim() : value
    const number = Number(numberText)

    if (numberText && Number.isFinite(number) && number >= 0 && (unit === 'ms' || number <= 1)) return number

    issue(node, `Review ${property}. Using ${fallback}.`)

    return fallback
  }

  return {
    Badge: (node: DesignNode) => {
      const variant = choice(node, 'Variant', ['default', 'secondary', 'outline', 'destructive', 'success', 'warning'], 'default')
      const labels = layerText(node, 'Badge')

      if (labels.length !== 1) issue(node, 'Review the badge label in the design context.')

      return `<Badge variant="${variant}">${expression(labels.join(' '))}</Badge>`
    },
    Code: (node: DesignNode) => {
      const variant = choice(node, 'Variant', ['inline', 'block'], 'inline')
      const lines = layerText(node, variant === 'inline' ? 'Code' : 'Line')
      const wrap = choice(node, 'Wrap', ['off', 'on'], 'off') === 'on'
      const presentation = codePresentation(node, target, variant, wrap)

      if (!lines.length) issue(node, 'The code source layers are missing. Supply the example as plain text.')

      return `<Code variant="${variant}" code=${expression(lines.join('\n'))}${wrap ? ' wrap' : ''}${presentation} />`
    },
    CardTitle: textComponent('CardTitle'),
    CardDescription: textComponent('CardDescription'),
    Kbd: textComponent('Kbd'),
    Eyebrow: textComponent('Eyebrow'),
    Callout: (node: DesignNode) => `<Callout><strong>${content(node, 'Title')}</strong><p>${content(node, 'Body')}</p></Callout>`,
    Note: (node: DesignNode) => {
      const border = choice(node, 'Border', ['left', 'right', 'none'], 'left')
      const label = node.properties['Show Label'] === true ? ` label=${content(node, 'Label')}` : ''

      return `<Note borderPosition="${border}"${label}>${content(node, 'Body')}</Note>`
    },
    Stack: (node: DesignNode, _id: string, children: string) => {
      const direction = choice(node, 'Direction', ['vertical', 'horizontal'], 'vertical')
      const gap = choice(node, 'Gap', stackGaps, 'md')

      return `<Stack direction="${direction}" gap="${gap}"${node.layout?.wrap ? ' wrap' : ''}>\n${children}\n</Stack>`
    },
    Prose: (node: DesignNode) => {
      const items = text(node, 'List', '').split('\n').map(line => line.trim().replace(/^•\s*/u, '')).filter(Boolean)
      const link = text(node, 'Link', '')

      if (link) issue(node, 'Supply the editorial link destination and review the heading hierarchy.')

      return `<Prose>\n  <h2>${content(node, 'Heading')}</h2>\n  <p>${content(node, 'Paragraph')}</p>\n  <h3>${content(node, 'Subheading')}</h3>${items.length ? `\n  <ul>${items.map(item => `<li>${expression(item)}</li>`).join('')}</ul>` : ''}${link ? `\n  <p>${expression(link)}</p>` : ''}\n</Prose>`
    },
    Timeline: (node: DesignNode) => {
      addImports('TimelineItem')

      const events = [1, 2, 3].map(i => `  <TimelineItem><span>${content(node, `Event ${i} time`)}</span> <strong>${content(node, `Event ${i} title`)}</strong><p>${content(node, `Event ${i} description`)}</p></TimelineItem>`)

      return `<Timeline>\n${events.join('\n')}\n</Timeline>`
    },
    CodeTabs: (node: DesignNode) => {
      const items = ['Pnpm', 'Npm', 'Yarn'].map(key => ({
        value: key.toLowerCase(), label: text(node, `${key} label`, key), code: text(node, `${key} code`, '')
      }))

      const active = choice(node, 'Active', ['pnpm', 'npm', 'yarn'], 'pnpm')
      const wrap = choice(node, 'Wrap', ['on', 'off'], 'off') === 'on'

      return `<CodeTabs items=${expression(items)} initialValue="${active}" copy={${node.properties.Copy === true}} wrap={${wrap}} />`
    },
    ThemeToggle: (node: DesignNode) => {
      issue(node, 'The application owns theme preference and storage. The design shows one preview state.')

      return target.appearance.startsWith('santi020k-') ?
        '<ThemeToggle lightTheme="santi020k-light" darkTheme="santi020k-dark" />' :
        '<ThemeToggle />'
    },
    ScrollReveal: (node: DesignNode, _id: string, children: string) => `<ScrollReveal animation="${animation(node)}">\n${children}\n</ScrollReveal>`,
    RevealGroup: (node: DesignNode, _id: string, children: string) => {
      const duration = choice(node, 'Duration', ['fast', 'standard', 'slow'], 'standard')

      return `<RevealGroup animation="${animation(node)}" duration="${duration}" delay={${numeric(node, 'Delay', 0, 'ms')}} stagger={${numeric(node, 'Stagger', 80, 'ms')}} threshold={${numeric(node, 'Threshold', 0.15, 'ratio')}} once={${node.properties.Once !== false}}>\n${children}\n</RevealGroup>`
    }
  }
}
