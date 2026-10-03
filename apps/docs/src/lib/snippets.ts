import { lumenComponentNames } from '@santi020k/lumen-core'

export interface FrameworkSnippet {
  code: string
  label: string
  lang: 'astro' | 'html' | 'tsx'
}

const lumenNames = new Set<string>(lumenComponentNames)

const isUppercase = (character: string | undefined): boolean => (
  character !== undefined && character >= 'A' && character <= 'Z'
)

const toKebabCase = (name: string): string => {
  const output: string[] = []

  for (let index = 0; index < name.length; index += 1) {
    const character = name[index] ?? ''
    const previous = name[index - 1]
    const next = name[index + 1]
    const afterWord = previous !== undefined && /[a-z0-9]/u.test(previous)
    const beforeWord = isUppercase(previous) && next !== undefined && /[a-z]/u.test(next)

    if (isUppercase(character) && (afterWord || beforeWord)) output.push('-')

    output.push(character.toLowerCase())
  }

  return output.join('')
}

const valueDefaultTags = [
  'Checkbox',
  'DatePicker',
  'Input',
  'InputOTP',
  'Slider',
  'Switch',
  'Textarea'
]

const valueDefaultPattern = new RegExp(
  `<(${valueDefaultTags.join('|')})([^>]*?) value="`, 'g'
)

const splitExample = (raw: string) => {
  const match = /^---\n([\S\s]*?)\n---\n\n?([\S\s]*)$/.exec(raw.trim())
  const frontmatter = match?.[1]
  const body = match?.[2]

  if (frontmatter === undefined || body === undefined)
    return { body: raw.trim(), frontmatter: '' }

  return { body: body.trim(), frontmatter: frontmatter.trim() }
}

interface MarkupTag {
  closing: boolean
  end: number
  name: string
  nameEnd: number
  selfClosing: boolean
}

const isWhitespace = (character: string | undefined): boolean => (
  character !== undefined && /\s/u.test(character)
)

const quotedEnd = (source: string, start: number): number => {
  const quote = source[start]

  for (let cursor = start + 1; cursor < source.length; cursor += 1) {
    if (source[cursor] === '\\') cursor += 1
    else if (source[cursor] === quote) return cursor + 1
  }

  return source.length
}

const isQuote = (character: string | undefined): boolean => (
  character === '"' || character === '\'' || character === '`'
)

const delimitedEnd = (source: string, start: number, delimiter: string): number => {
  const end = source.indexOf(delimiter, start)

  return end === -1 ? source.length : end + delimiter.length
}

const commentEnd = (source: string, start: number): number | undefined => {
  if (source.startsWith('/*', start)) return delimitedEnd(source, start + 2, '*/')

  if (source.startsWith('//', start)) return delimitedEnd(source, start + 2, '\n')

  return undefined
}

// Advance monotonically even when an example contains an unfinished expression.
const expressionEnd = (source: string, start: number): number => {
  let depth = 1
  let cursor = start + 1

  while (cursor < source.length) {
    const character = source[cursor]

    if (isQuote(character)) {
      cursor = quotedEnd(source, cursor)

      continue
    }

    const afterComment = commentEnd(source, cursor)

    if (afterComment !== undefined) {
      cursor = afterComment

      continue
    }

    if (character === '{') depth += 1
    else if (character === '}') depth -= 1

    cursor += 1

    if (depth === 0) return cursor
  }

  return source.length
}

const isNameCharacter = (character: string | undefined): boolean => (
  character !== undefined && /[\w:-]/u.test(character)
)

const markupTag = (source: string, start: number): MarkupTag | undefined => {
  let cursor = start + 1
  const closing = source[cursor] === '/'

  if (closing) cursor += 1

  const nameStart = cursor

  while (isNameCharacter(source[cursor])) cursor += 1

  if (cursor === nameStart) return undefined

  const name = source.slice(nameStart, cursor)
  const nameEnd = cursor

  while (cursor < source.length) {
    const character = source[cursor]

    if (isQuote(character)) {
      cursor = quotedEnd(source, cursor)

      continue
    }

    if (character === '{') {
      cursor = expressionEnd(source, cursor)

      continue
    }

    if (character === '>') {
      return { closing, end: cursor + 1, name, nameEnd, selfClosing: source[cursor - 1] === '/' }
    }

    cursor += 1
  }

  return undefined
}

interface MarkupReplacement {
  end: number
  text: string
}

type MarkupTransform = (tag: MarkupTag, start: number) => MarkupReplacement

const transformMarkup = (source: string, transform: MarkupTransform): string => {
  const output: string[] = []
  let cursor = 0

  while (cursor < source.length) {
    const start = source.indexOf('<', cursor)

    if (start === -1) {
      output.push(source.slice(cursor))

      break
    }

    output.push(source.slice(cursor, start))

    if (source.startsWith('<!--', start)) {
      cursor = delimitedEnd(source, start + 4, '-->')

      output.push(source.slice(start, cursor))

      continue
    }

    const tag = markupTag(source, start)

    if (!tag) {
      const nameStart = source[start + 1] === '/' ? start + 2 : start + 1

      if (isNameCharacter(source[nameStart])) {
        output.push(source.slice(start))

        break
      }

      output.push('<')

      cursor = start + 1

      continue
    }

    const replacement = transform(tag, start)

    output.push(replacement.text)

    cursor = replacement.end
  }

  return output.join('')
}

const embeddedBlockEnd = (source: string, start: number, name: string): number => {
  let cursor = start

  while (cursor < source.length) {
    const end = source.indexOf(`</${name}`, cursor)

    if (end === -1) return source.length

    const closing = markupTag(source, end)

    if (closing?.name === name) return closing.end

    cursor = closing?.end ?? source.length
  }

  return source.length
}

const stripEmbeddedAstroBlocks = (source: string): string => {
  const lower = source.toLowerCase()

  return transformMarkup(source, (tag, start) => {
    const name = tag.name.toLowerCase()

    if (!tag.closing && (name === 'script' || name === 'style')) {
      return { end: embeddedBlockEnd(lower, tag.end, name), text: '' }
    }

    return { end: tag.end, text: source.slice(start, tag.end) }
  }).trim()
}

const elementsAttributeValue = (value: string): string => {
  if (!value.startsWith('{') || !value.endsWith('}')) return value

  const expression = value.slice(1, -1).trim()

  if (/^-?\d+(?:\.\d+)?$/u.test(expression)) return `"${expression}"`

  // Preserve expressions instead of discarding consumer data. Examples needing
  // data bindings still require a framework-specific override below.
  return value
}

const whitespaceEnd = (source: string, start: number): number => {
  let cursor = start

  while (isWhitespace(source[cursor])) cursor += 1

  return cursor
}

const attributeNameEnd = (source: string, start: number): number => {
  let cursor = start

  while (cursor < source.length) {
    const character = source[cursor]

    if (isWhitespace(character) || character === '=' || character === '{') break

    cursor += 1
  }

  return cursor
}

const attributeValueEnd = (source: string, start: number): number => {
  const character = source[start]

  if (character === '{') return expressionEnd(source, start)

  if (isQuote(character)) return quotedEnd(source, start)

  let cursor = start

  while (cursor < source.length && !isWhitespace(source[cursor])) cursor += 1

  return cursor
}

const elementsAttribute = (source: string, start: number): MarkupReplacement => {
  const nameEnd = attributeNameEnd(source, start)

  if (source[nameEnd] === '{') {
    const end = expressionEnd(source, nameEnd)

    return { end, text: source.slice(start, end) }
  }

  const name = source.slice(start, nameEnd)
  const mappedName = name === 'defaultValue' ? 'value' : toKebabCase(name)
  const afterName = whitespaceEnd(source, nameEnd)

  if (source[afterName] !== '=') return { end: afterName, text: mappedName + source.slice(nameEnd, afterName) }

  const valueStart = whitespaceEnd(source, afterName + 1)
  const end = attributeValueEnd(source, valueStart)
  const value = elementsAttributeValue(source.slice(valueStart, end))

  return { end, text: `${mappedName}${source.slice(nameEnd, valueStart)}${value}` }
}

const elementsAttributes = (source: string): string => {
  const output: string[] = []
  let cursor = 0

  while (cursor < source.length) {
    const nameStart = whitespaceEnd(source, cursor)
    const attribute = elementsAttribute(source, nameStart)

    output.push(source.slice(cursor, nameStart), attribute.text)

    cursor = attribute.end
  }

  return output.join('').trimEnd()
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

const uppercaseCssSegment = (_match: string, letter: string) => letter.toUpperCase()
const toCssCamelCase = (property: string) => property.replaceAll(/-([a-z])/g, uppercaseCssSegment)

const toReactStyleObject = (css: string) => {
  const declarations = css
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map(declaration => {
      const separatorIndex = declaration.indexOf(':')

      const property = toCssCamelCase(
        declaration.slice(0, separatorIndex).trim()
      )

      const value = declaration.slice(separatorIndex + 1).trim()

      return `${property}: '${value}'`
    })

  return `{{ ${declarations.join(', ')} }}`
}

const toReactBody = (body: string) => body
  .replaceAll(valueDefaultPattern, '<$1$2 defaultValue="')
  .replaceAll(
    /(?<=\s)style="([^"]*)"/g, (_match, css: string) => `style=${toReactStyleObject(css)}`
  )
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
  const cleanBody = stripEmbeddedAstroBlocks(body)
  const components = usedComponents(cleanBody)
  const importLine = `import { ${components.join(', ')} } from '@santi020k/lumen-react'`

  const indented = toReactBody(cleanBody)
    .split('\n')
    .map(line => (line ? `    ${line}` : line))
    .join('\n')

  return `${importLine}\n\nexport const Example = () => (\n  <>\n${indented}\n  </>\n)\n`
}

const elementsHeader = `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>`

const elementsTagName = (name: string): string => {
  if (name === 'Form') return 'form'

  return lumenNames.has(name) ? `lumen-${toKebabCase(name)}` : name
}

const elementsTag = (source: string, tag: MarkupTag): string => {
  const name = elementsTagName(tag.name)

  if (tag.closing) return `</${name}>`

  const attributes = elementsAttributes(source.slice(tag.nameEnd, tag.end - (tag.selfClosing ? 2 : 1)))
  const formBehavior = tag.name === 'Form' ? ' data-ui-form' : ''
  const requiresClosingTag = name.startsWith('lumen-') || name === 'form'
  const ending = tag.selfClosing && !requiresClosingTag ? '/>' : '>'
  const closing = tag.selfClosing && requiresClosingTag ? `</${name}>` : ''

  return `<${name}${formBehavior}${attributes}${ending}${closing}`
}

const toElementsSnippet = (body: string): string => {
  const source = stripEmbeddedAstroBlocks(body)

  const output = transformMarkup(source, tag => ({
    end: tag.end,
    text: elementsTag(source, tag)
  }))

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
  ErrorState: `import { Button, ButtonLink, ErrorState } from '@santi020k/lumen-react'

export const Example = () => (
  <ErrorState
    actions={(
      <>
        <Button size="sm">Try again</Button>
        <ButtonLink href="/docs" variant="secondary">Open help</ButtonLink>
      </>
    )}
    description="Check your connection and try again. Your existing projects are unchanged."
    id="projects-error"
    reference="REQ-4F82"
    title="Could not load projects"
  />
)
`,
  Image: `import NextImage from 'next/image'
import { Image as LumenImage } from '@santi020k/lumen-react'

export const Example = () => (
  <LumenImage
    alt="Lumen UI logo"
    as={NextImage}
    height={80}
    src="/logo.svg"
    width={310}
  />
)
`
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
  ErrorState: `${elementsHeader}

<lumen-error-state id="projects-error" aria-labelledby="projects-error-title">
  <lumen-illustration
    aria-hidden="true"
    data-slot="error-state-graphic"
    variant="error"
  ></lumen-illustration>
  <div data-slot="error-state-content">
    <h2 data-slot="error-state-title" id="projects-error-title">Could not load projects</h2>
    <p data-slot="error-state-description">
      Check your connection and try again. Your existing projects are unchanged.
    </p>
    <p data-slot="error-state-reference">Reference: <code>REQ-4F82</code></p>
  </div>
  <div data-slot="error-state-actions">
    <lumen-button size="sm">Try again</lumen-button>
    <a class="ui-button ui-button--secondary ui-button--sm" href="/docs">Open help</a>
  </div>
</lumen-error-state>
`,
  Image: `<img
  alt="Lumen UI logo"
  class="ui-image"
  decoding="async"
  height="80"
  loading="lazy"
  src="/logo.svg"
  width="310"
/>
`,
  ScrollCue: `${elementsHeader}

<lumen-scroll-cue>
  <a href="#projects" aria-label="Continue to projects">
    <span class="ui-scroll-cue__mouse" aria-hidden="true">
      <span class="ui-scroll-cue__wheel"></span>
    </span>
    <span class="ui-scroll-cue__chevron" aria-hidden="true"></span>
    <span class="ui-scroll-cue__label">Explore projects</span>
  </a>
</lumen-scroll-cue>
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
`,
  Form: `${elementsHeader}

<form data-ui-form>
  <lumen-button type="submit">Save changes</lumen-button>
</form>
`
}

export const buildSnippets = (
  name: string,
  raw: string
): FrameworkSnippet[] => {
  const { body } = splitExample(raw)

  return [
    { code: toAstroSnippet(raw), label: 'Astro', lang: 'astro' },
    {
      code: reactOverrides[name] ?? toReactSnippet(body),
      label: 'React',
      lang: 'tsx'
    },
    {
      code: elementsOverrides[name] ?? toElementsSnippet(body),
      label: 'Elements',
      lang: 'html'
    }
  ]
}
