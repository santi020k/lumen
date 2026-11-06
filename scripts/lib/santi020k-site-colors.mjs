import { readFile } from 'node:fs/promises'

import themePackage from '@santi020k/theme/package.json' with { type: 'json' }

import { readCssNodes, splitCssSelectors } from './css-source.mjs'

const colorRoles = [
  'canvas', 'surface', 'surface-muted', 'surface-strong', 'line', 'ink', 'ink-soft', 'ink-muted',
  'brand', 'brand-solid', 'brand-soft', 'accent', 'success', 'warning', 'danger'
]

export const readSanti020kSiteColors = async () => {
  const source = await readFile(new URL(import.meta.resolve('@santi020k/theme/site.css')), 'utf8')
  const rules = readCssNodes(source)

  return Object.fromEntries(['light', 'dark'].map(scheme => {
    const selector = `:root[data-theme="${scheme}"]`
    const rule = rules.find(({ header }) => splitCssSelectors(header).includes(selector))

    if (!rule?.body) throw new Error(`Missing ${selector} in @santi020k/theme/site.css`)

    const channels = new Map([...rule.body.matchAll(/^\s*--([a-z-]+): (\d+ \d+% \d+%);$/gmu)]
      .map(([, role, value]) => [role, value]))

    const colors = Object.fromEntries(colorRoles.map(role => {
      const value = channels.get(role)

      if (!value) throw new Error(`Missing HSL channels for --${role} in ${selector} of @santi020k/theme/site.css`)

      return [role, value]
    }))

    return [scheme, colors]
  }))
}

export const syncSanti020kSiteColors = async styles => {
  const startMarker = '/* BEGIN:generated-santi020k-site-colors */'
  const endMarker = '/* END:generated-santi020k-site-colors */'
  const start = styles.indexOf(startMarker)
  const end = styles.indexOf(endMarker, start)

  if (start < 0 || end < start) throw new Error('Missing santi020k website palette markers in shared CSS.')

  const palette = await readSanti020kSiteColors()

  const blocks = Object.entries(palette).map(([scheme, colors]) => {
    // Lumen uses brand and muted ink for small text on cards as well as on the canvas.
    const roles = {
      ...colors,
      brand: scheme === 'dark' ? colors.accent : colors.brand,
      'ink-muted': scheme === 'light' ? colors['ink-soft'] : colors['ink-muted'],
      'ui-website-brand': colors.brand
    }

    const declarations = Object.entries(roles).map(([name, value]) => `  --${name}: ${value};`)

    return `:root[data-theme="santi020k-${scheme}"] {\n${declarations.join('\n')}\n}`
  })

  const source = `/* Generated from @santi020k/theme/site.css v${themePackage.version}. */`

  return styles.slice(0, start) + [startMarker, source, blocks.join('\n\n')].join('\n') + '\n' + styles.slice(end)
}
