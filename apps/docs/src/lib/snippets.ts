import { lumenComponentNames } from '@santi020k/lumen-core'

export interface FrameworkSnippet {
  code: string
  label: string
  lang: 'astro' | 'html' | 'tsx'
}

const lumenNames = new Set<string>(lumenComponentNames)
const toKebabCase = (name: string) => name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const valueDefaultTags = ['Checkbox', 'DatePicker', 'Input', 'InputOTP', 'Slider', 'Switch', 'Textarea']
const valueDefaultPattern = new RegExp(`<(${valueDefaultTags.join('|')})([^>]*?) value="`, 'g')
const astroPackageImportPattern = /import\s*\{([\S\s]*?)\}\s*from '@santi020k\/lumen-astro'/

const runtimeComponents = new Set([
  'AlertDialog',
  'Carousel',
  'Combobox',
  'Command',
  'Dialog',
  'Drawer',
  'DropdownMenu',
  'HoverCard',
  'Menubar',
  'NavigationMenu',
  'Popover',
  'RadioGroup',
  'Sheet',
  'Sonner',
  'Tabs',
  'Toggle',
  'ToggleGroup'
])

const runtimeAttributePattern = /\bdata-ui-(?:alert-dialog|carousel|command|combobox|dialog|drawer|dropdown-menu|hover-card|menubar|navigation-menu|popover|radio-group|sheet|sonner|tabs|toast|toggle)/

const splitExample = (raw: string) => {
  const match = /^---\n([\S\s]*?)\n---\n\n?([\S\s]*)$/.exec(raw.trim())
  const frontmatter = match?.[1]
  const body = match?.[2]

  if (frontmatter === undefined || body === undefined) return { body: raw.trim(), frontmatter: '' }

  return { body: body.trim(), frontmatter: frontmatter.trim() }
}

const usedComponents = (body: string): string[] => {
  const used = new Set<string>()

  for (const match of body.matchAll(/<([A-Z][A-Za-z]*)\b/g)) {
    const name = match[1]

    if (name !== undefined && lumenNames.has(name)) used.add(name)
  }

  return [...used].sort((a, b) => a.localeCompare(b))
}

const needsRuntime = (body: string) =>
  runtimeAttributePattern.test(body) || usedComponents(body).some(component => runtimeComponents.has(component))

const toAstroSnippet = (raw: string): string => {
  const { body, frontmatter } = splitExample(raw)
  let nextFrontmatter = frontmatter
  const includeRuntime = needsRuntime(body)

  if (astroPackageImportPattern.test(nextFrontmatter)) {
    nextFrontmatter = nextFrontmatter.replace(astroPackageImportPattern, (_match, imports: string) => {
      const names = imports
        .split(',')
        .map(name => name.trim())
        .filter(Boolean)

      if (includeRuntime && !names.includes('UIPrimitives')) names.push('UIPrimitives')

      return `import { ${names.join(', ')} } from '@santi020k/lumen-astro'`
    })
  } else if (includeRuntime) {
    nextFrontmatter = `import { UIPrimitives } from '@santi020k/lumen-astro'\n${nextFrontmatter}`
  }

  const nextBody = includeRuntime && !body.includes('<UIPrimitives') ? `<UIPrimitives />\n\n${body}` : body

  return `---\n${nextFrontmatter.trim()}\n---\n\n${nextBody.trim()}\n`
}

const toCssCamelCase = (property: string) =>
  property.replaceAll(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())

const toReactStyleObject = (css: string) => {
  const declarations = css
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(':')
      const property = toCssCamelCase(declaration.slice(0, separatorIndex).trim())
      const value = declaration.slice(separatorIndex + 1).trim()

      return `${property}: '${value}'`
    })

  return `{{ ${declarations.join(', ')} }}`
}

const toReactBody = (body: string) =>
  body
    .replaceAll(valueDefaultPattern, '<$1$2 defaultValue="')
    .replaceAll(/(?<=\s)style="([^"]*)"/g, (_match, css: string) => `style=${toReactStyleObject(css)}`)
    .replaceAll(/(?<=\s)class=/g, 'className=')
    .replaceAll(/(?<=\s)for=/g, 'htmlFor=')
    .replaceAll(/(?<=\s)checked(?=[\s/>])/g, 'defaultChecked')
    .replaceAll(/(?<=\s)stroke-width=/g, 'strokeWidth=')
    .replaceAll(/(?<=\s)stop-color=/g, 'stopColor=')
    .replaceAll(/(?<=\s)stop-opacity=/g, 'stopOpacity=')
    .replaceAll(/(?<=\s)maxlength=/g, 'maxLength=')
    .replaceAll(/(?<=\s)inputmode=/g, 'inputMode=')
    .replaceAll(/(?<=\s)tabindex=/g, 'tabIndex=')

const toReactSnippet = (body: string): string => {
  const components = usedComponents(body)
  const importLine = `import { ${components.join(', ')} } from '@santi020k/lumen-react'`

  const indented = toReactBody(body)
    .split('\n')
    .map(line => (line ? `    ${line}` : line))
    .join('\n')

  return `${importLine}\n\nexport const Example = () => (\n  <>\n${indented}\n  </>\n)\n`
}

const elementsHeader = `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>`

const toElementsSnippet = (body: string): string => {
  let output = body

  for (const name of usedComponents(body)) {
    const tag = `lumen-${toKebabCase(name)}`

    output = output
      .replaceAll(new RegExp(`<${name}(?=[\\s/>])`, 'g'), `<${tag}`)
      .replaceAll(`</${name}>`, `</${tag}>`)
  }

  output = output
    .replaceAll(/=\{(\d+)\}/g, '="$1"')
    .replaceAll(/<(lumen-[a-z-]+)([^<]*?)\s*\/>/g, '<$1$2></$1>')

  return `${elementsHeader}\n\n${output}\n`
}

const reactOverrides: Record<string, string> = {
  Sonner: `import { Button, Sonner } from '@santi020k/lumen-react'

export const Example = () => (
  <>
    <Sonner aria-label="Notifications" />
    <Button
      variant="outline"
      onClick={() => {
        document.dispatchEvent(new CustomEvent('ui:toast', {
          detail: { description: 'Your changes are live.', title: 'Saved', variant: 'success' }
        }))
      }}
    >
      Show toast
    </Button>
  </>
)
`
}

const elementsOverrides: Record<string, string> = {
  Combobox: `${elementsHeader}

<lumen-combobox data-ui-combobox>
  <label class="ui-label" for="ex-frameworks-input">Framework</label>
  <input
    aria-autocomplete="list"
    aria-controls="ex-frameworks"
    aria-expanded="false"
    class="ui-input"
    id="ex-frameworks-input"
    placeholder="Search frameworks"
    role="combobox"
    type="text"
  />
  <div class="ui-combobox__list" hidden id="ex-frameworks" role="listbox">
    <button data-ui-combobox-option data-value="Astro" role="option" type="button">Astro</button>
    <button data-ui-combobox-option data-value="React" role="option" type="button">React</button>
    <button data-ui-combobox-option data-value="Web Components" role="option" type="button">Web Components</button>
  </div>
</lumen-combobox>
`
}

export const buildSnippets = (name: string, raw: string): FrameworkSnippet[] => {
  const { body } = splitExample(raw)

  return [
    { code: toAstroSnippet(raw), label: 'Astro', lang: 'astro' },
    { code: reactOverrides[name] ?? toReactSnippet(body), label: 'React', lang: 'tsx' },
    { code: elementsOverrides[name] ?? toElementsSnippet(body), label: 'Elements', lang: 'html' }
  ]
}
