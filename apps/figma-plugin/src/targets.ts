export const versions = ['5.0.0', '4.4.0'] as const
export type LumenVersion = typeof versions[number]

const appearanceOptions = {
  project: 'Use project appearance',
  paper: 'Paper',
  field: 'Field',
  studio: 'Studio',
  glass: 'Glass',
  'santi020k-light': 'santi020k Light',
  'santi020k-dark': 'santi020k Dark'
} as const

export type Appearance = keyof typeof appearanceOptions

export interface ExportTarget {
  version: LumenVersion
  appearance: Appearance
}

export const defaultTarget: ExportTarget = { version: versions[0], appearance: 'project' }

export const isVersion = (value: unknown): value is LumenVersion => versions.some(version => version === value)

export const supportsAppearance = (version: LumenVersion, value: unknown): value is Appearance => typeof value === 'string' && Object.hasOwn(appearanceOptions, value) &&
  (version === '5.0.0' || (value !== 'paper' && value !== 'field'))

export const appearancesFor = (version: LumenVersion) => Object.entries(appearanceOptions)
  .filter(([value]) => supportsAppearance(version, value))
  .map(([value, label]) => ({ value, label }))

export const layoutFor = ({ appearance, version }: ExportTarget) => {
  const imports = ['import UIPrimitives from \'@santi020k/lumen-astro/runtime\'']
  const branded = appearance.startsWith('santi020k-')
  let attribute = ''

  if (appearance !== 'project') {
    attribute = branded ? ` data-theme="${appearance}"` : ` data-lumen-preset="${appearance}"`
  }

  if (version === '4.4.0') {
    imports.push('import \'@santi020k/lumen-astro/styles.css\'')
  } else if (appearance !== 'project') {
    const stylesheet = appearance === 'glass' ? 'effects/glass' : `themes/${branded ? 'santi020k' : appearance}`

    imports.push(`import '@santi020k/lumen-astro/styles/${stylesheet}.css'`)
  }

  return `---\n${imports.join('\n')}\n\ninterface Props { title: string }\n---\n<html lang="en"${attribute}>\n  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>{Astro.props.title}</title></head>\n  <body><slot /><UIPrimitives /></body>\n</html>\n`
}
