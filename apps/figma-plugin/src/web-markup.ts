import type { WebPlatform } from './targets.js'

const html = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\r', '&#13;')

export const expression = (value: string | readonly Record<string, string>[]) => `{${JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')}}`

export const kebab = (name: string) => name.replace(/[A-Z]/gu, (letter, offset: number) => `${offset === 0 ? '' : '-'}${letter.toLowerCase()}`)

export const webMarkup = (platform: WebPlatform, add: (...names: string[]) => void) => {
  const elements = platform === 'elements'
  const react = platform === 'react'
  const text = elements ? html : expression
  const attr = (value: string) => elements ? `"${html(value)}"` : expression(value)
  const id = (value: string) => react ? `{prefix + "-${value}"}` : `"${value}"`
  const comment = (message: string) => react ? `{/* ${message} */}` : `<!-- ${message} -->`

  const tag = (name: string, attributes = '', children?: string) => {
    add(name)

    if (name === 'CardTitle') {
      if (!elements) attributes += ' as="h2"'

      if (elements) attributes += ' role="heading" aria-level="2"'
    }

    const element = elements ? `lumen-${kebab(name)}` : name

    if (children === undefined && !elements) return `<${element}${attributes} />`

    return `<${element}${attributes}>${children ?? ''}</${element}>`
  }

  const flag = (name: string, value: boolean) => value ? ` ${name}${elements ? '="true"' : ''}` : ''

  return { elements, react, text, attr, id, comment, tag, flag }
}

export type WebMarkup = ReturnType<typeof webMarkup>

// Both tab sets use the Elements adapter's authored tablist, button, and panel contract.
interface TabPanel { value: string, label: string, panel: string }

export const elementTabs = (id: string, label: string, active: string, items: readonly TabPanel[]) => {
  const triggers = items.map(item => `    <button type="button" role="tab" id="${id}-${item.value}-tab" data-value="${item.value}" aria-controls="${id}-${item.value}-panel" aria-selected="${item.value === active}" tabindex="${item.value === active ? 0 : -1}">${html(item.label)}</button>`)
  const panels = items.map(item => `  <section role="tabpanel" id="${id}-${item.value}-panel" aria-labelledby="${id}-${item.value}-tab"${item.value === active ? '' : ' hidden'}>${item.panel}</section>`)

  return `\n  <div role="tablist" aria-label="${label}">\n${triggers.join('\n')}\n  </div>\n${panels.join('\n')}\n`
}
