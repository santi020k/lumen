import { getComponentEntry, reactServerComponents } from '@santi020k/lumen-core/component-delivery'
import { lumenComponentBehavior } from '@santi020k/lumen-core/components'

import type { Appearance, WebPlatform, WebTarget } from './targets.js'
import { appearanceStylesheet, layoutFor, needsGlassEffect } from './targets.js'
import { kebab } from './web-markup.js'

const setupImports = (target: WebTarget, pkg: string, names: string[]) => {
  const css = target.version === '4.4.0' ?
    ['styles.css'] :
    [
      'styles/foundation.css',
      ...names.map(name => `styles/components/${kebab(name)}.css`),
      ...(target.appearance === 'project' ? [] : [`styles/${appearanceStylesheet(target.appearance)}.css`])
    ]

  return css.map(path => `import '${pkg}/${path}'`)
}

const reactImports = (names: string[], selective: boolean) => {
  const groups = new Map<string, string[]>()

  for (const name of names) {
    const entry = selective ? getComponentEntry(name, 'react') : undefined

    const path = selective && reactServerComponents.includes(name) ?
      '@santi020k/lumen-react/server' :
      entry ?? '@santi020k/lumen-react'

    groups.set(path, [...(groups.get(path) ?? []), name])
  }

  return [...groups].map(([path, members]) => `import { ${members.join(', ')} } from '${path}'`)
}

const themeFunction = (appearance: Appearance) => {
  const prefix = appearance.startsWith('santi020k-') ? '"santi020k-"' : 'mode === "light" || mode === "dark" ? current.slice(0, suffixStart) : ""'

  return `function toggleSelectionTheme() {
  const root = document.documentElement
  const current = root.dataset.theme ?? ""
  const suffixStart = current.lastIndexOf("-") + 1
  const mode = current.slice(suffixStart)
  const scheme = root.dataset.lumenScheme
  const hasScheme = scheme === "light" || scheme === "dark"
  const activeMode = hasScheme ? scheme : mode
  const dark = activeMode === "dark" || (activeMode !== "light" && (root.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches))
  const next = dark ? "light" : "dark"
  const prefix = ${prefix}
  root.dataset.theme = prefix + next
  if (hasScheme) root.dataset.lumenScheme = next
  root.classList.toggle("dark", !dark)
}`
}

interface WebSource {
  target: WebTarget
  platform: WebPlatform
  names: string[]
  markup: string
  usesGlass: boolean
  usesId: boolean
  hasThemeToggle: boolean
}

const astroOutput = ({ names, target, markup, usesGlass }: WebSource) => {
  let statements = names.map(name => `import ${name} from '@santi020k/lumen-astro/components/${name}'`)

  if (target.version === '4.4.0' && names.length > 0) statements = [`import { ${names.join(', ')} } from '@santi020k/lumen-astro'`]

  const runtime = target.version === '4.4.0' || Object.entries(lumenComponentBehavior)
    .some(([name, behavior]) => names.includes(name) && behavior.astro === 'ui-primitives')

  return { code: `---\n${statements.join('\n')}\n---\n\n<!-- Lumen Astro ${target.version} -->\n${markup}\n`, layout: layoutFor(target, usesGlass, runtime) }
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
  const client = target.version === '4.4.0' || hooks.length > 0 || hasThemeToggle
  const code = [...(client ? ['\'use client\''] : []), ...imports, ...(hasThemeToggle ? ['', themeFunction(target.appearance)] : []), '', 'export default function LumenSelection() {', ...body, '}', ''].join('\n')

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

const elementRegistrations = (names: string[], target: WebTarget, pkg: string) => {
  if (!names.length) return []

  if (target.version === '4.4.0') return [`import { defineLumenElements } from '${pkg}/define'`, '', 'defineLumenElements()']

  return [
    ...names.map(name => `import { Lumen${name}Element } from '${getComponentEntry(name, 'elements') ?? pkg}'`),
    '',
    ...names.map(name => `if (!customElements.get('lumen-${kebab(name)}')) customElements.define('lumen-${kebab(name)}', Lumen${name}Element)`)
  ]
}

export const webOutput = (source: WebSource) => {
  const { target, platform, markup, names } = source

  if (platform === 'astro') return astroOutput(source)

  const pkg = `@santi020k/lumen-${platform}`
  const setup = setupImports(target, pkg, names)

  if (needsGlassEffect(target, source.usesGlass)) setup.push(`import '${pkg}/styles/effects/glass.css'`)

  if (platform === 'elements') setup.push(...elementRegistrations(names, target, pkg))

  if (target.appearance !== 'project') {
    const attribute = target.appearance.startsWith('santi020k-') ? 'data-theme' : 'data-lumen-preset'

    setup.push('', `// For server rendering, set ${attribute}="${target.appearance}" on <html> before first paint.`, `if (typeof document !== 'undefined' && !document.documentElement.hasAttribute('${attribute}')) {\n  document.documentElement.setAttribute('${attribute}', '${target.appearance}')\n}`)
  }

  if (platform === 'elements' && source.hasThemeToggle) addThemeSwitchBehavior(setup, target.appearance)

  return { code: platform === 'react' ? reactSource(source) : markup + '\n', layout: setup.join('\n') + '\n' }
}
