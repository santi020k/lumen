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

export const splitExample = (raw: string) => {
  const match = /^---\n([\S\s]*?)\n---\n\n?([\S\s]*)$/.exec(raw.trim())

  if (!match) return { body: raw.trim(), frontmatter: '' }

  return { body: match[2].trim(), frontmatter: match[1].trim() }
}

export const usedComponents = (body: string): string[] => {
  const used = new Set<string>()

  for (const match of body.matchAll(/<([A-Z][A-Za-z]*)\b/g)) {
    if (lumenNames.has(match[1])) used.add(match[1])
  }

  return [...used].sort((a, b) => a.localeCompare(b))
}

const toReactBody = (body: string) =>
  body
    .replaceAll(valueDefaultPattern, '<$1$2 defaultValue="')
    .replaceAll(/(?<=\s)class=/g, 'className=')
    .replaceAll(/(?<=\s)for=/g, 'htmlFor=')
    .replaceAll(/(?<=\s)checked(?=[\s/>])/g, 'defaultChecked')
    .replaceAll(/(?<=\s)stroke-width=/g, 'strokeWidth=')
    .replaceAll(/(?<=\s)maxlength=/g, 'maxLength=')
    .replaceAll(/(?<=\s)inputmode=/g, 'inputMode=')
    .replaceAll(/(?<=\s)tabindex=/g, 'tabIndex=')

export const toReactSnippet = (body: string): string => {
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

export const toElementsSnippet = (body: string): string => {
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

<lumen-combobox>
  <input class="ui-input" list="ex-frameworks" placeholder="Search frameworks" />
  <datalist id="ex-frameworks">
    <option value="Astro"></option>
    <option value="React"></option>
    <option value="Web Components"></option>
  </datalist>
</lumen-combobox>
`
}

export const buildSnippets = (name: string, raw: string): FrameworkSnippet[] => {
  const { body } = splitExample(raw)

  return [
    { code: `${raw.trim()}\n`, label: 'Astro', lang: 'astro' },
    { code: reactOverrides[name] ?? toReactSnippet(body), label: 'React', lang: 'tsx' },
    { code: elementsOverrides[name] ?? toElementsSnippet(body), label: 'Elements', lang: 'html' }
  ]
}
