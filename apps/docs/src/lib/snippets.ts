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

const toAstroSnippet = (raw: string): string => {
  const { body, frontmatter } = splitExample(raw)

  return `---\n${frontmatter.trim()}\n---\n\n${body.trim()}\n`
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
  Code: `import { Code } from '@santi020k/lumen-react'

const themeExample = \`
  const theme = "lumen";
  const accent = "hsl(var(--accent))";
\`

export const Example = () => (
  <Code code={themeExample} copy label="theme.ts" language="ts" variant="block" />
)
`,
  Image: `import NextImage from 'next/image'
import { Image as LumenImage } from '@santi020k/lumen-react'

export const Example = () => (
  <LumenImage
    alt="Lumen UI logo"
    as={NextImage}
    height={80}
    invertOnDark
    src="/logo.svg"
    width={318}
  />
)
`,
}

const elementsOverrides: Record<string, string> = {
  Code: `${elementsHeader}

<lumen-code data-code-theme="auto" variant="block">
  <figcaption class="ui-code__header">
    <span class="ui-code__dots" aria-hidden="true">
      <span class="ui-code__dot ui-code__dot--red"></span>
      <span class="ui-code__dot ui-code__dot--yellow"></span>
      <span class="ui-code__dot ui-code__dot--green"></span>
    </span>
    <span class="ui-code__meta">
      <span class="ui-code__language">ts</span>
      <span class="ui-code__label">theme.ts</span>
    </span>
  </figcaption>
  <pre><code>const theme = "lumen";
const accent = "hsl(var(--accent))";</code></pre>
</lumen-code>
`,
  Image: `<picture>
  <source srcset="/logo.avif" type="image/avif" />
  <source srcset="/logo.webp" type="image/webp" />
  <img
    alt="Lumen UI logo"
    class="ui-image ui-image--invert-dark"
    decoding="async"
    height="80"
    loading="lazy"
    src="/logo.svg"
    width="318"
  />
</picture>
`,
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
