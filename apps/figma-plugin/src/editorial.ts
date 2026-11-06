import type { DesignNode } from './model.js'
import type { ExportTarget } from './targets.js'
import type { WebMarkup } from './web-markup.js'
import { elementTabs, expression } from './web-markup.js'

interface RenderContext {
  target: ExportTarget
  text: (node: DesignNode, property: string, fallback: string) => string
  choice: (node: DesignNode, property: string, options: string[], fallback: string) => string
  issue: (node: DesignNode, message: string) => void
  markup: WebMarkup
}

const layerText = (node: DesignNode, layer: string): string[] => {
  if (node.type === 'TEXT') return node.name === layer && node.text !== null ? [node.text] : []

  return node.children.flatMap(child => layerText(child, layer))
}

export const editorialRenderers = ({ target, text, choice, issue, markup }: RenderContext) => {
  const { elements, react, tag, flag } = markup
  const content = (node: DesignNode, property: string) => markup.text(text(node, property, ''))
  const textComponent = (name: string) => (node: DesignNode) => tag(name, '', content(node, 'Text'))
  const animation = (node: DesignNode) => choice(node, 'Animation', ['fade', 'slide up', 'scale'], 'fade').replaceAll(' ', '-')
  const literal = (value: number | boolean) => elements ? `"${value}"` : `{${value}}`

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

      return tag('Badge', ` variant="${variant}"`, markup.text(labels.join(' ')))
    },
    Code: (node: DesignNode) => {
      const variant = choice(node, 'Variant', ['inline', 'block'], 'inline')
      const lines = layerText(node, variant === 'inline' ? 'Code' : 'Line')
      const wrap = choice(node, 'Wrap', ['off', 'on'], 'off') === 'on'
      const editorial = variant === 'block' && ['paper', 'field'].includes(target.appearance)

      if (!lines.length) issue(node, 'The code source layers are missing. Supply the example as plain text.')

      const source = lines.join('\n')
      const modifiers = flag('wrap', wrap) + (editorial ? ' appearance="editorial"' : '')

      if (elements) {
        const code = `<code>${markup.text(source)}</code>`

        return tag('Code', ` variant="${variant}"${modifiers}`, variant === 'block' ? `<pre>${code}</pre>` : code)
      }

      return tag('Code', ` variant="${variant}" code=${expression(source)}${modifiers}`)
    },
    CardTitle: textComponent('CardTitle'),
    CardDescription: textComponent('CardDescription'),
    Kbd: textComponent('Kbd'),
    Eyebrow: textComponent('Eyebrow'),
    Callout: (node: DesignNode) => tag('Callout', '', `<strong>${content(node, 'Title')}</strong><p>${content(node, 'Body')}</p>`),
    Note: (node: DesignNode) => {
      const border = choice(node, 'Border', ['left', 'right', 'none'], 'left')
      const showLabel = node.properties['Show Label'] === true

      if (elements) return tag('Note', ` border-position="${border}"`, `${showLabel ? `<strong>${content(node, 'Label')}</strong>` : ''}<p>${content(node, 'Body')}</p>`)

      const label = showLabel ? ` label=${markup.attr(text(node, 'Label', ''))}` : ''

      return tag('Note', ` borderPosition="${border}"${label}`, content(node, 'Body'))
    },
    Stack: (node: DesignNode, _id: string, children: string) => {
      const direction = choice(node, 'Direction', ['vertical', 'horizontal'], 'vertical')
      const gap = choice(node, 'Gap', ['none', 'sm', 'md', 'lg', 'xl'], 'md')

      return tag('Stack', ` direction="${direction}" gap="${gap}"${flag('wrap', node.layout?.wrap === true)}`, `\n${children}\n`)
    },
    Prose: (node: DesignNode) => {
      const items = text(node, 'List', '').split('\n').map(line => line.trim().replace(/^•\s*/u, '')).filter(Boolean)
      const link = text(node, 'Link', '')

      if (link) issue(node, 'Supply the editorial link destination and review the heading hierarchy.')

      return tag('Prose', '', `\n  <h2>${content(node, 'Heading')}</h2>\n  <p>${content(node, 'Paragraph')}</p>\n  <h3>${content(node, 'Subheading')}</h3>${items.length ? `\n  <ul>${items.map(item => `<li>${markup.text(item)}</li>`).join('')}</ul>` : ''}${link ? `\n  <p>${markup.text(link)}</p>` : ''}\n`)
    },
    Timeline: (node: DesignNode) => {
      const events = [1, 2, 3].map(i => {
        const body = `<span>${content(node, `Event ${i} time`)}</span> <strong>${content(node, `Event ${i} title`)}</strong><p>${content(node, `Event ${i} description`)}</p>`

        return elements ? `  <li>${body}</li>` : `  ${tag('TimelineItem', '', body)}`
      })

      return tag('Timeline', elements ? ' role="list"' : '', `\n${events.join('\n')}\n`)
    },
    CodeTabs: (node: DesignNode, id: string) => {
      const items = ['Pnpm', 'Npm', 'Yarn'].map(key => ({
        value: key.toLowerCase(), label: text(node, `${key} label`, key), code: text(node, `${key} code`, '')
      }))

      const active = choice(node, 'Active', ['pnpm', 'npm', 'yarn'], 'pnpm')
      const wrap = choice(node, 'Wrap', ['on', 'off'], 'off') === 'on'
      const copy = node.properties.Copy === true

      if (elements) {
        const panels = items.map(item => ({ ...item, panel: tag('Code', ` variant="block"${flag('copy', copy)}${flag('wrap', wrap)}`, `<pre><code>${markup.text(item.code)}</code></pre>`) }))

        return tag('CodeTabs', '', elementTabs(id, 'Code examples', active, panels))
      }

      return tag('CodeTabs', ` items=${expression(items)} initialValue="${active}" copy={${copy}} wrap={${wrap}}`)
    },
    ThemeToggle: (node: DesignNode) => {
      issue(node, 'The application owns theme preference and storage. The design shows one preview state.')

      const branded = target.appearance.startsWith('santi020k-')

      if (react) return tag('ThemeToggle', ' onClick={toggleSelectionTheme}')

      if (elements) return branded ? tag('Button', ' data-lumen-figma-theme-toggle', 'Toggle color theme') : tag('ThemeToggle', ' tabindex="0" data-lumen-figma-theme-switch aria-label="Toggle color theme"')

      return tag('ThemeToggle', branded ? ' lightTheme="santi020k-light" darkTheme="santi020k-dark"' : '')
    },
    ScrollReveal: (node: DesignNode, _id: string, children: string) => tag('ScrollReveal', ` animation="${animation(node)}"`, `\n${children}\n`),
    RevealGroup: (node: DesignNode, _id: string, children: string) => {
      const duration = choice(node, 'Duration', ['fast', 'standard', 'slow'], 'standard')

      return tag('RevealGroup', ` animation="${animation(node)}" duration="${duration}" delay=${literal(numeric(node, 'Delay', 0, 'ms'))} stagger=${literal(numeric(node, 'Stagger', 80, 'ms'))} threshold=${literal(numeric(node, 'Threshold', 0.15, 'ratio'))} once=${literal(node.properties.Once !== false)}`, `\n${children}\n`)
    }
  }
}
