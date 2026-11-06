import type { Appearance, WebPlatform, WebTarget } from './targets.js'
import { layoutFor } from './targets.js'
import { kebab } from './web-markup.js'

const stylesheet = (appearance: Appearance) => appearance === 'glass' ? 'effects/glass' : `themes/${appearance.startsWith('santi020k-') ? 'santi020k' : appearance}`

const setupImports = (target: WebTarget, pkg: string, names: string[]) => {
  const css = target.version === '4.4.0' ?
    ['styles.css'] :
    [
      'styles/foundation.css',
      ...names.map(name => `styles/components/${kebab(name)}.css`),
      ...(target.appearance === 'project' ? [] : [`styles/${stylesheet(target.appearance)}.css`])
    ]

  return css.map(path => `import '${pkg}/${path}'`)
}

// Only these entries cover parts used in the Figma component catalog.
const reactEntries: Readonly<Record<string, string>> = {
  Button: 'button',
  Card: 'card',
  Field: 'field',
  Input: 'input',
  Label: 'label',
  Dialog: 'dialog',
  DialogHeader: 'dialog',
  DialogTitle: 'dialog',
  DialogBody: 'dialog',
  DialogFooter: 'dialog',
  DialogClose: 'dialog',
  Kbd: 'kbd'
}

const reactImports = (names: string[], selective: boolean) => {
  const groups = new Map<string, string[]>()

  for (const name of names) {
    const entry = selective ? reactEntries[name] : undefined
    const path = entry ? `@santi020k/lumen-react/components/${entry}` : '@santi020k/lumen-react'

    groups.set(path, [...(groups.get(path) ?? []), name])
  }

  return [...groups].map(([path, members]) => `import { ${members.join(', ')} } from '${path}'`)
}

const themeFunction = (appearance: Appearance) => {
  const prefix = appearance.startsWith('santi020k-') ? 'santi020k-' : ''

  return `function toggleSelectionTheme() {
  const root = document.documentElement
  const current = root.dataset.theme
  const dark = current ? current === "dark" || current === "santi020k-dark" : root.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches
  root.dataset.theme = dark ? "${prefix}light" : "${prefix}dark"
  root.classList.toggle("dark", !dark)
}`
}

interface WebSource {
  target: WebTarget
  platform: WebPlatform
  names: string[]
  markup: string
  usesId: boolean
  hasThemeToggle: boolean
}

const astroOutput = ({ names, target, markup }: WebSource) => {
  let statements = names.map(name => `import ${name} from '@santi020k/lumen-astro/components/${name}'`)

  if (target.version === '4.4.0' && names.length > 0) statements = [`import { ${names.join(', ')} } from '@santi020k/lumen-astro'`]

  return { code: `---\n${statements.join('\n')}\n---\n\n<!-- Lumen Astro ${target.version} -->\n${markup}\n`, layout: layoutFor(target) }
}

const reactSource = ({ names, target, markup, usesId, hasThemeToggle }: WebSource) => {
  const dialog = names.includes('Dialog')
  const hooks = [...(usesId ? ['useId'] : []), ...(dialog ? ['useState'] : [])]
  const imports = reactImports(names, target.version === '5.0.0')

  if (hooks.length) imports.unshift(`import { ${hooks.join(', ')} } from 'react'`)

  const body = [
    ...(usesId ? ['  const prefix = useId()'] : []),
    ...(dialog ? ['  const [openDialog, setOpenDialog] = useState<string | null>(null)'] : []),
    '  return (',
    '    <>',
    ...markup.split('\n').map(line => `      ${line}`),
    '    </>',
    '  )'
  ]

  // Indenting generated JSX with embedded data is safe because expressions encode newlines.
  const code = ['\'use client\'', ...imports, ...(hasThemeToggle ? ['', themeFunction(target.appearance)] : []), '', 'export default function LumenSelection() {', ...body, '}', ''].join('\n')

  return code
}

const addThemeSwitchBehavior = (setup: string[], appearance: Appearance) => {
  if (appearance.startsWith('santi020k-')) {
    setup.push('', themeFunction(appearance), '', `document.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('[data-lumen-figma-theme-toggle]')) toggleSelectionTheme()
})`)
  } else {
    setup.push('', `document.addEventListener('keydown', event => {
  const control = event.target
  if (!(control instanceof HTMLElement) || !control.matches('[data-lumen-figma-theme-switch]')) return
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  if (!event.repeat) control.click()
})`)
  }
}

const granularElements = new Set(['Badge', 'Button', 'Card', 'Dialog', 'Input', 'Kbd', 'Label', 'Timeline'])

const elementRegistrations = (names: string[], target: WebTarget, pkg: string) => {
  if (!names.length) return []

  if (target.version === '5.0.0' && names.every(name => granularElements.has(name))) {
    return [
      ...names.map(name => `import { defineLumen${name} } from '${pkg}/components/${kebab(name)}'`),
      '',
      ...names.map(name => `defineLumen${name}()`)
    ]
  }

  const register = target.version === '5.0.0' ? `defineLumenElements(${JSON.stringify(names)})` : 'defineLumenElements()'

  return [`import { defineLumenElements } from '${pkg}/define'`, '', register]
}

export const webOutput = (source: WebSource) => {
  const { target, platform, markup, names } = source

  if (platform === 'astro') return astroOutput(source)

  const pkg = `@santi020k/lumen-${platform}`
  const setup = setupImports(target, pkg, names)

  if (platform === 'elements') setup.push(...elementRegistrations(names, target, pkg))

  if (target.appearance !== 'project') {
    const attribute = target.appearance.startsWith('santi020k-') ? 'data-theme' : 'data-lumen-preset'

    setup.push('', `// For server rendering, set ${attribute}="${target.appearance}" on <html> before first paint.`, `if (typeof document !== 'undefined' && !document.documentElement.hasAttribute('${attribute}')) {\n  document.documentElement.setAttribute('${attribute}', '${target.appearance}')\n}`)
  }

  if (platform === 'elements' && source.hasThemeToggle) addThemeSwitchBehavior(setup, target.appearance)

  return { code: platform === 'react' ? reactSource(source) : markup + '\n', layout: setup.join('\n') + '\n' }
}
