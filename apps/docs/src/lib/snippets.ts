import { lumenComponentNames } from '@santi020k/lumen-core'
import ts from 'typescript'

import { reactHooksReference } from '../data/docs'

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

const toCssCamelCase = (property: string) => property.startsWith('--') ?
  property :
  property.replaceAll(/-([a-z])/g, uppercaseCssSegment)

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

      return `${JSON.stringify(property)}: ${JSON.stringify(value)}`
    })

  return `{{ ${declarations.join(', ')} }}`
}

const expandAstroShorthand = (source: string): string => transformMarkup(source, (tag, start) => {
  if (tag.closing) return { end: tag.end, text: source.slice(start, tag.end) }

  const output = [source.slice(start, tag.nameEnd)]
  let cursor = tag.nameEnd

  while (cursor < tag.end) {
    const character = source[cursor]

    if (isQuote(character)) {
      const end = quotedEnd(source, cursor)

      output.push(source.slice(cursor, end))

      cursor = end
    } else if (character === '{') {
      const end = expressionEnd(source, cursor)
      const expression = source.slice(cursor + 1, end - 1)
      const shorthand = /^[A-Za-z_$][\w$]*$/u.test(expression) && isWhitespace(source[cursor - 1])

      output.push(shorthand ? `${expression}={${expression}}` : source.slice(cursor, end))

      cursor = end
    } else {
      output.push(character ?? '')

      cursor += 1
    }
  }

  return { end: tag.end, text: output.join('') }
})

const normalizeReactTextarea = (source: string): string => transformMarkup(source, (tag, start) => {
  if (tag.name !== 'Textarea' || tag.closing || tag.selfClosing)
    return { end: tag.end, text: source.slice(start, tag.end) }

  let closing = tag.end

  while (closing < source.length && source[closing] !== '<' && source[closing] !== '{') closing += 1

  const value = source.slice(tag.end, closing)

  if (!source.startsWith('</Textarea>', closing))
    return { end: tag.end, text: source.slice(start, tag.end) }

  return {
    end: closing + '</Textarea>'.length,
    text: `${source.slice(start, tag.end - 1)} defaultValue={${JSON.stringify(value)}} />`
  }
})

const toReactBody = (body: string, styles: string[]) => expandAstroShorthand(normalizeReactTextarea(body))
  .replaceAll(valueDefaultPattern, '<$1$2 defaultValue="')
  .replaceAll(
    /(?<=\s)style="([^"]*)"/g, (_match, css: string) => {
      const value = toReactStyleObject(css)

      if (!css.includes('--')) return `style=${value}`

      const name = `exampleStyle${styles.length}`

      styles.push(`const ${name}: CSSProperties & Record<\`--\${string}\`, string | number> = ${value.slice(1, -1)}`)

      return `style={${name}}`
    }
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
  .replaceAll(/(?<=\s)contenteditable=/g, 'contentEditable=')
  .replaceAll(/(?<=\s)spellcheck=/g, 'spellCheck=')
  .replaceAll(/(?<=\s)autocomplete=/g, 'autoComplete=')
  .replaceAll(/(?<=\s)datetime=/g, 'dateTime=')
  .replaceAll(/(?<=\s)readonly(?=[\s/>])/g, 'readOnly')
  .replaceAll(/(?<=\s)(tabIndex|aria-level)="(-?\d+)"/g, '$1={$2}')
  .replaceAll(/<!--([\s\S]*?)-->/g, '{/*$1*/}')

const reactDeclarations = (frontmatter: string): string => {
  const source = ts.createSourceFile('example.ts', frontmatter, ts.ScriptTarget.Latest, true)

  return source.statements.filter(statement => (
    !ts.isImportDeclaration(statement) ||
    !ts.isStringLiteral(statement.moduleSpecifier) ||
    statement.moduleSpecifier.text !== '@santi020k/lumen-astro'
  )).map(statement => statement.getFullText(source).trim()).join('\n\n')
}

const toReactSnippet = (body: string, frontmatter: string): string => {
  const cleanBody = stripEmbeddedAstroBlocks(body)
  const components = usedComponents(cleanBody)
  const source = ts.createSourceFile('example.ts', frontmatter, ts.ScriptTarget.Latest, true)

  const imports = source.statements.filter(statement => ts.isImportDeclaration(statement) &&
    ts.isStringLiteral(statement.moduleSpecifier) &&
    statement.moduleSpecifier.text === '@santi020k/lumen-astro')

  const importLine = imports.length > 0 ?
    imports.map(statement => statement.getText(source).replaceAll('@santi020k/lumen-astro', '@santi020k/lumen-react')).join('\n') :
    `import { ${components.join(', ')} } from '@santi020k/lumen-react'`

  const styles: string[] = []

  const indented = toReactBody(cleanBody, styles)
    .split('\n')
    .map(line => (line ? `    ${line}` : line))
    .join('\n')

  const declarations = [reactDeclarations(frontmatter), ...styles].filter(Boolean).join('\n\n')

  const styleImport = styles.length > 0 ?
    'import type { CSSProperties } from \'react\'\n' :
    ''

  return `${styleImport}${importLine}\n\n${declarations ? `${declarations}\n\n` : ''}export const Example = () => (\n  <>\n${indented}\n  </>\n)\n`
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

const toElementsSnippet = (body: string, registrations?: string[]): string => {
  const source = stripEmbeddedAstroBlocks(body)

  const output = transformMarkup(source, tag => ({
    end: tag.end,
    text: elementsTag(source, tag)
  }))

  const header = registrations ?
    `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements([${registrations.map(name => `'${name}'`).join(', ')}])
</script>` :
    elementsHeader

  return `${header}\n\n${output}\n`
}

const elementsDataCharts = new Set([
  'BarChart', 'CalendarHeatmap', 'ComboChart', 'Heatmap', 'LineChart', 'PieChart', 'RangeChart', 'ScatterChart', 'Sparkline', 'Histogram', 'WaterfallChart'
])

const snippetAttribute = (body: string, start: number) => {
  if (body[start] === '{') {
    const end = expressionEnd(body, start)
    const expression = body.slice(start + 1, end - 1).trim()

    return { end, expression, name: expression, value: undefined }
  }

  const nameEnd = attributeNameEnd(body, start)
  const afterName = whitespaceEnd(body, nameEnd)
  const valueStart = body[afterName] === '=' ? whitespaceEnd(body, afterName + 1) : undefined
  const end = valueStart === undefined ? nameEnd : attributeValueEnd(body, valueStart)

  const expression = valueStart !== undefined && body[valueStart] === '{' ?
    body.slice(valueStart + 1, end - 1).trim() :
    undefined

  const value = valueStart === undefined ? undefined : body.slice(valueStart, end)

  return { end, expression, name: body.slice(start, nameEnd), value }
}

const statContentChild = (name: string, value: string | undefined): string | undefined => {
  if (!['label', 'value'].includes(name) || !value || !['"', '\''].includes(value[0] ?? '')) return undefined

  const component = name === 'label' ? 'StatLabel' : 'StatValue'
  const text = value.slice(1, -1).replaceAll('<', '&lt;').replaceAll('>', '&gt;')

  return `<${component}>${text}</${component}>`
}

const elementsStatContent = (body: string): string => transformMarkup(body, (tag, start) => {
  if (tag.name !== 'Stat' || !tag.selfClosing) return { end: tag.end, text: body.slice(start, tag.end) }

  const attributes: string[] = []
  const children: string[] = []
  const end = tag.end - 2
  let cursor = tag.nameEnd

  while (cursor < end) {
    const nameStart = whitespaceEnd(body, cursor)

    if (nameStart >= end) break

    const attribute = snippetAttribute(body, nameStart)
    const child = statContentChild(attribute.name, attribute.value)

    if (child) children.push(child)
    else attributes.push(body.slice(cursor, attribute.end))

    cursor = attribute.end
  }

  return { end: tag.end, text: `<Stat${attributes.join('')}>${children.join('')}</Stat>` }
})

const chartDataBinding = (body: string, name: string, attribute: string, id: string) => {
  let expression = attribute

  const markup = transformMarkup(body, (tag, start) => {
    if (tag.closing || tag.name !== name) return { end: tag.end, text: body.slice(start, tag.end) }

    const attributes: string[] = []
    const attributesEnd = tag.end - (tag.selfClosing ? 2 : 1)
    let cursor = tag.nameEnd

    while (cursor < attributesEnd) {
      const nameStart = whitespaceEnd(body, cursor)

      if (nameStart >= attributesEnd) break

      const binding = snippetAttribute(body, nameStart)

      if (binding.name === attribute && binding.expression !== undefined) {
        expression = binding.expression
      } else {
        attributes.push(body.slice(cursor, binding.end))
      }

      cursor = binding.end
    }

    return {
      end: tag.end,
      text: `<${name} id="${id}"${attributes.join('')}${tag.selfClosing ? ' />' : '>'}`
    }
  })

  return { expression, markup }
}

const toElementsDataChartSnippet = (name: string, body: string, frontmatter: string): string => {
  let attribute = ['CalendarHeatmap', 'Heatmap', 'RangeChart', 'WaterfallChart'].includes(name) ? 'data' : 'series'

  if (name === 'Histogram') attribute = 'bins'
  else if (name === 'Sparkline') attribute = 'values'

  const id = `example-${toKebabCase(name)}`
  const exampleBody = name === 'Sparkline' ? elementsStatContent(body) : body
  const binding = chartDataBinding(exampleBody, name, attribute, id)
  const dataExpression = name === 'PieChart' ? `[${binding.expression}]` : binding.expression
  const markup = toElementsSnippet(binding.markup, usedComponents(binding.markup))

  const declarations = ts.transpileModule(reactDeclarations(frontmatter), {
    compilerOptions: { target: ts.ScriptTarget.ESNext }
  }).outputText.trim()

  return `${markup}
<script type="module">
${declarations}

const chart = document.getElementById('${id}')

chart?.setAttribute('${attribute}', JSON.stringify(${dataExpression}))
</script>
`
}

const compoundDialogReactExample = `'use client'

import { useState } from 'react'
import { Button, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle, Input } from '@santi020k/lumen-react'

export function Example() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit record</Button>
      <Dialog open={open} onOpenChange={setOpen} aria-labelledby="record-title">
        <DialogHeader><DialogTitle id="record-title">Edit record</DialogTitle></DialogHeader>
        <DialogBody><Input name="name" aria-label="Name" /></DialogBody>
        <DialogFooter><DialogClose variant="outline">Close preview</DialogClose></DialogFooter>
      </Dialog>
    </>
  )
}
`

const reactOverrides: Record<string, string> = {
  AttachmentPreview: `import { AttachmentPreview, Button } from '@santi020k/lumen-react'

<AttachmentPreview src="/logo.svg" contentType="image/svg+xml" alt="Lumen logo"
  caption="Example attachment" actions={<Button type="button">Replace</Button>} />`,
  DialogHeader: compoundDialogReactExample,
  DialogTitle: compoundDialogReactExample,
  DialogBody: compoundDialogReactExample,
  DialogFooter: compoundDialogReactExample,
  DialogClose: compoundDialogReactExample,

  VirtualList: `'use client'

import { Button, VirtualList } from '@santi020k/lumen-react'

const records = Array.from({ length: 10000 }, (_, id) => ({ id, label: \`Record \${id + 1}\` }))

export function Example() {
  return (
    <VirtualList aria-label="Records" items={records} getKey={record => record.id}
      renderItem={record => <Button variant="ghost">{record.label}</Button>}
      itemSize={44} overscan={4} style={{ height: '12rem' }} />
  )
}`,

  AlertDialog: `'use client'

import { useState } from 'react'
import { AlertDialog, Button } from '@santi020k/lumen-react'

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>Preview confirmation</Button>
      <AlertDialog open={open} onOpenChange={setOpen} aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <h2 id="confirm-title">Delete this project?</h2>
        <p id="confirm-description">This example only demonstrates confirmation. No project is deleted.</p>
        <Button onClick={() => setOpen(false)} variant="secondary">Cancel</Button>
        <Button onClick={() => setOpen(false)} variant="destructive">Confirm preview</Button>
      </AlertDialog>
    </>
  )
}
`,
  ContextMenu: `'use client'

import { Button, ContextMenu, useContextMenu } from '@santi020k/lumen-react'

export function Example() {
  const menu = useContextMenu()

  return (
    <>
      <Button {...menu.triggerProps} variant="outline">Right-click or press Shift+F10 for project actions</Button>
      <ContextMenu {...menu.menuProps} aria-label="Project actions">
        <Button role="menuitem" onClick={menu.close} variant="ghost">Duplicate preview</Button>
        <Button role="menuitem" onClick={menu.close} variant="ghost">Close menu</Button>
      </ContextMenu>
    </>
  )
}
`,
  Drawer: `'use client'

import { Button, Checkbox, Drawer, Label, useDialog } from '@santi020k/lumen-react'

export function Example() {
  const drawer = useDialog()

  return (
    <>
      <Button {...drawer.triggerProps} variant="outline">Open filters</Button>
      <Drawer {...drawer.dialogProps} aria-labelledby="filters-title">
        <h2 id="filters-title">Filters</h2>
        <Label><Checkbox name="stable" /> Stable packages only</Label>
        <Button {...drawer.closeProps} variant="secondary">Close</Button>
      </Drawer>
    </>
  )
}
`,
  Sheet: `'use client'

import { Button, Sheet, useDialog } from '@santi020k/lumen-react'

export function Example() {
  const sheet = useDialog()

  return (
    <>
      <Button {...sheet.triggerProps} variant="outline">Open details</Button>
      <Sheet {...sheet.dialogProps} aria-labelledby="details-title">
        <h2 id="details-title">Deployment details</h2>
        <p>Illustrative build details for the preview.</p>
        <Button {...sheet.closeProps} variant="secondary">Close</Button>
      </Sheet>
    </>
  )
}
`,

  AnimatedPortrait: `import { AnimatedPortrait, Image } from '@santi020k/lumen-react'

export const Example = () => (
  <AnimatedPortrait>
    <Image alt="Mountain landscape illustration" src="/comparison-after.svg" width={960} height={600} />
  </AnimatedPortrait>
)
`,
  ButtonLink: `import { ButtonLink, Icon, Stack } from '@santi020k/lumen-react'

export const Example = () => (
  <Stack direction="horizontal" gap="sm" wrap>
    <ButtonLink href="https://santi020k.com" target="_blank" rel="noopener noreferrer">
      Visit Santiago <Icon decorative name="arrow-up-right" />
    </ButtonLink>
    <ButtonLink aria-label="Santiago's website" href="https://santi020k.com" shape="icon" variant="secondary" target="_blank" rel="noopener noreferrer">
      <Icon decorative name="globe" />
    </ButtonLink>
  </Stack>
)
`,
  Combobox: `import { Combobox } from '@santi020k/lumen-react'

export const Example = () => (
  <Combobox label="Framework" list="framework-options" options={['Astro', 'React', 'Web Components']} placeholder="Search frameworks" />
)
`,
  CoverImage: `import { CoverImage, Grid, Image } from '@santi020k/lumen-react'

export const Example = () => (
  <Grid minItemWidth="14rem">
    <CoverImage>
      <Image alt="Mountain landscape illustration" src="/comparison-before.svg" width={960} height={600} />
    </CoverImage>
    <CoverImage hover showBottomGradient>
      <Image alt="The landscape in warm light" src="/comparison-after.svg" width={960} height={600} />
    </CoverImage>
  </Grid>
)
`,
  Dialog: `'use client'

import { useState } from 'react'
import { Button, Dialog, Field, Input, Label } from '@santi020k/lumen-react'

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit profile</Button>
      <Dialog open={open} onOpenChange={setOpen} aria-labelledby="profile-title">
        <h2 id="profile-title">Edit profile</h2>
        <Field>
          <Label htmlFor="profile-name">Display name</Label>
          <Input id="profile-name" name="displayName" defaultValue="Santiago" />
        </Field>
        <Button onClick={() => setOpen(false)} variant="secondary">Close preview</Button>
      </Dialog>
    </>
  )
}
`,
  RevealGroup: `import { Card, RevealGroup } from '@santi020k/lumen-react'

export const Example = () => (
  <RevealGroup animation="slide-up" stagger={90}>
    <Card><strong>Plan</strong><p>Start with semantic structure.</p></Card>
    <Card><strong>Build</strong><p>Compose accessible primitives.</p></Card>
    <Card><strong>Ship</strong><p>Keep motion consistent.</p></Card>
  </RevealGroup>
)
`,
  ScrollReveal: `import { Card, ScrollReveal } from '@santi020k/lumen-react'

export const Example = () => (
  <ScrollReveal animation="slide-up" duration="slow" threshold={0.2}>
    <Card>
      <strong>Progressive by default</strong>
      <p>Content remains readable when motion is reduced.</p>
    </Card>
  </ScrollReveal>
)
`,
  ThemeToggle: `'use client'

import { ThemeToggle, useThemeToggle } from '@santi020k/lumen-react'

export function Example() {
  const { toggleTheme } = useThemeToggle()

  return <ThemeToggle onClick={toggleTheme} />
}
`,
  Toast: `'use client'

import { Button, ToastProvider, useToast } from '@santi020k/lumen-react'

function SaveButton() {
  const toast = useToast()

  return (
    <Button onClick={() => toast.create({ title: 'Preview saved', description: 'Example feedback; no data is persisted.', variant: 'success' })}>
      Show success toast
    </Button>
  )
}

export const Example = () => (
  <ToastProvider placement="bottom-right" maxCount={5}>
    <SaveButton />
  </ToastProvider>
)
`,

  ImageComparison: `import { Image, ImageComparison } from '@santi020k/lumen-react'

export const Example = () => (
  <ImageComparison
    label="Compare the landscape treatment"
    beforeLabel="Original"
    afterLabel="Color adjusted"
    ratio={1.6}
    defaultValue={50}
    before={<Image alt="Original landscape illustration" src="/comparison-before.svg" />}
    after={<Image alt="Color-adjusted landscape illustration" src="/comparison-after.svg" />}
  />
)
`,
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
  Image: `import { Image } from '@santi020k/lumen-react'

export const Example = () => (
  <Image
    alt="Lumen UI logo"
    height={80}
    src="/logo.svg"
    width={310}
  />
)
`
}

const compoundDialogElementsExample = `${elementsHeader}

<button type="button" data-ui-dialog-trigger="record-dialog">Edit record</button>
<lumen-dialog id="record-dialog" aria-labelledby="record-title">
  <lumen-dialog-header><lumen-dialog-title><h2 id="record-title">Edit record</h2></lumen-dialog-title></lumen-dialog-header>
  <lumen-dialog-body><label>Name <input name="name"></label></lumen-dialog-body>
  <lumen-dialog-footer><lumen-dialog-close><button type="button">Close preview</button></lumen-dialog-close></lumen-dialog-footer>
</lumen-dialog>
`

const compoundDescriptionsElementsExample = `${elementsHeader}

<lumen-descriptions role="group" aria-label="Record details">
  <lumen-description-item>
    <lumen-description-term id="record-status">Status</lumen-description-term>
    <lumen-description-detail aria-labelledby="record-status"><lumen-badge variant="success">Active</lumen-badge></lumen-description-detail>
  </lumen-description-item>
  <lumen-description-item>
    <lumen-description-term id="record-link">Related record</lumen-description-term>
    <lumen-description-detail aria-labelledby="record-link"><a href="/docs/components/descriptions">View record details</a></lumen-description-detail>
  </lumen-description-item>
</lumen-descriptions>
`

const elementsOverrides: Record<string, string> = {
  FunnelChart: `<lumen-funnel-chart
  id="example-funnel-chart"
  aria-label="Activation funnel"
  heading="Activation funnel"
  description="People in the August acquisition cohort"
></lumen-funnel-chart>

<!-- In a module processed by your bundler, after the chart markup. -->
<script type="module">
import { defineLumenElements, LumenFunnelChartElement } from '@santi020k/lumen-elements'

defineLumenElements(['FunnelChart'])

const chart = document.getElementById('example-funnel-chart')

if (chart instanceof LumenFunnelChartElement) {
  chart.data = [
    { id: 'visited', label: 'Visited', value: 600 },
    { id: 'signed-up', label: 'Signed up', value: 180 },
    { id: 'activated', label: 'Activated', value: 96 }
  ]
}
</script>
`,
  BoxPlot: `<lumen-box-plot
  id="example-box-plot"
  aria-label="Response-time distribution"
  heading="Response-time distribution"
  description="Precomputed statistics · milliseconds"
  domain-min="0" domain-max="200"
></lumen-box-plot>

<!-- In a module processed by your bundler, after the chart markup. -->
<script type="module">
import { defineLumenElements, LumenBoxPlotElement } from '@santi020k/lumen-elements'

defineLumenElements(['BoxPlot'])

const chart = document.getElementById('example-box-plot')

if (chart instanceof LumenBoxPlotElement) {
  chart.data = [
    { id: 'search', label: 'Search', min: 40, q1: 58, median: 72, q3: 92, max: 115, outliers: [140] },
    { id: 'checkout', label: 'Checkout', min: 65, q1: 80, median: 105, q3: 130, max: 160, outliers: [190] }
  ]
  chart.valueFormatter = value => String(value) + ' ms'
}
</script>
`,
  LollipopChart: `<lumen-lollipop-chart
  id="example-lollipop-chart"
  aria-label="Team scores, current quarter"
  heading="Team performance"
  description="Score out of 100 · highest first"
  domain-min="0" domain-max="100"
  value-label="Score"
></lumen-lollipop-chart>

<!-- In a module processed by your bundler, after the chart markup. -->
<script type="module">
import { defineLumenElements, LumenLollipopChartElement } from '@santi020k/lumen-elements'

defineLumenElements(['LollipopChart'])

const chart = document.getElementById('example-lollipop-chart')

if (chart instanceof LumenLollipopChartElement) {
  chart.data = [
    { id: 'engineering', label: 'Engineering', value: 91 },
    { id: 'design', label: 'Design', value: 88 },
    { id: 'support', label: 'Support', value: 74 }
  ]
}
</script>
`,
  DumbbellChart: `<lumen-dumbbell-chart
  id="example-dumbbell-chart"
  aria-label="Team scores, previous and current quarter"
  heading="Progress by team"
  description="Score out of 100 · previous to current quarter"
  domain-min="0" domain-max="100"
  reference-label="Previous" value-label="Current"
></lumen-dumbbell-chart>

<!-- In a module processed by your bundler, after the chart markup. -->
<script type="module">
import { defineLumenElements, LumenDumbbellChartElement } from '@santi020k/lumen-elements'

defineLumenElements(['DumbbellChart'])

const chart = document.getElementById('example-dumbbell-chart')

if (chart instanceof LumenDumbbellChartElement) {
  chart.data = [
    { id: 'design', label: 'Design', reference: 62, value: 88 },
    { id: 'engineering', label: 'Engineering', reference: 76, value: 91 },
    { id: 'support', label: 'Support', reference: 81, value: 74 }
  ]
}
</script>
`,
  BulletChart: `<lumen-bullet-chart
  id="example-bullet-chart"
  aria-label="Delivery performance, current quarter"
  heading="On-time delivery"
  description="Completed deliveries within the service window"
  domain-min="0" domain-max="100"
  value="86" target="95" value-label="Actual" target-label="Goal"
></lumen-bullet-chart>

<!-- In a module processed by your bundler, after the chart markup. -->
<script type="module">
import { defineLumenElements, LumenBulletChartElement } from '@santi020k/lumen-elements'

defineLumenElements(['BulletChart'])

const chart = document.getElementById('example-bullet-chart')

if (chart instanceof LumenBulletChartElement) {
  chart.ranges = [
    { end: 70, label: 'Developing' },
    { end: 90, label: 'Consistent' },
    { end: 100, label: 'Excellent' }
  ]
  chart.valueFormatter = value => String(value) + '%'
}
</script>
`,
  AttachmentList: `${elementsHeader}
<lumen-attachment-list aria-label="Files">
  <li><lumen-attachment><strong>Example file</strong><button type="button">Remove</button></lumen-attachment></li>
</lumen-attachment-list>`,
  AttachmentPreview: `${elementsHeader}
<lumen-attachment-preview aria-label="Logo attachment" content-type="image/svg+xml" error-label="Could not load the preview.">
  <div data-slot="attachment-preview-media"><img data-ui-attachment-preview-image src="/logo.svg" alt="Lumen logo"></div>
  <p data-slot="attachment-preview-fallback" data-ui-attachment-preview-message role="status"></p>
  <p>Example image attachment</p>
  <div data-slot="attachment-preview-actions"><a href="/logo.svg" download>Download</a></div>
</lumen-attachment-preview>`,
  Descriptions: compoundDescriptionsElementsExample,
  DescriptionItem: compoundDescriptionsElementsExample,
  DescriptionTerm: compoundDescriptionsElementsExample,
  DescriptionDetail: compoundDescriptionsElementsExample,

  DialogHeader: compoundDialogElementsExample,
  DialogTitle: compoundDialogElementsExample,
  DialogBody: compoundDialogElementsExample,
  DialogFooter: compoundDialogElementsExample,
  DialogClose: compoundDialogElementsExample,

  ChangeSummary: `<lumen-change-summary id="review" label="Review changes" summary="1 changed field"></lumen-change-summary>
<script type="module">
  import { defineLumenChangeSummary } from '@santi020k/lumen-elements/components/dashboard'
  defineLumenChangeSummary()
  document.getElementById('review').items = [
    { id: 'owner', label: 'Owner', before: 'Alice', after: 'Bob', changed: true }
  ]
</script>`,
  FilterBar: `${elementsHeader}
<lumen-filter-bar aria-label="Filters">
  <details open>
    <summary>Filters</summary>
    <div class="ui-filter-bar__controls">
      <lumen-search-field aria-label="Search records"></lumen-search-field>
    </div>
  </details>
  <div class="ui-filter-bar__active">
    <lumen-button aria-label="Remove status: Active">Status: Active ×</lumen-button>
  </div>
  <p role="status" aria-live="polite" aria-atomic="true">12 matching records</p>
</lumen-filter-bar>`,
  VirtualList: `<lumen-virtual-list id="records" mode="data" role="list" aria-label="Records"></lumen-virtual-list>
<script type="module">
  import { createLumenVirtualCollectionController } from '@santi020k/lumen-core'

  const root = document.getElementById('records')
  if (root) {
    const controller = createLumenVirtualCollectionController(root, {
      items: Array.from({ length: 10000 }, (_, id) => ({ id })),
      getKey: record => record.id,
      itemSize: 44,
      renderItem: record => {
        const row = document.createElement('div')
        row.textContent = \`Record \${record.id + 1}\`
        return row
      }
    })
    // Call controller.destroy() when removing this view.
  }
</script>`,

  Toast: `<lumen-button id="show-preview-toast">Show success toast</lumen-button>
<lumen-toast variant="success">
  <strong>Static feedback</strong>
  <p>This message remains readable without JavaScript.</p>
</lumen-toast>

<script type="module">
  import { defineLumenElements, LumenToast } from '@santi020k/lumen-elements'

  defineLumenElements()

  document.getElementById('show-preview-toast')?.addEventListener('click', () => {
    LumenToast.create({
      title: 'Preview saved',
      description: 'Example feedback; no data is persisted.',
      variant: 'success'
    })
  })
</script>
`,
  ImageComparison: `${elementsHeader}

<lumen-image-comparison
  label="Compare the landscape treatment"
  before-label="Original"
  after-label="Color adjusted"
  ratio="1.6"
  value="50"
>
  <img slot="before" alt="Original landscape illustration" src="/comparison-before.svg" width="960" height="600" />
  <img slot="after" alt="Color-adjusted landscape illustration" src="/comparison-after.svg" width="960" height="600" />
  <p>Illustrative color treatment with matching framing.</p>
</lumen-image-comparison>
`,
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

const reactHookByComponent: Record<string, string> = {
  KanbanBoard: 'useKanban',
  KanbanColumn: 'useKanban',
  RichTextEditor: 'useRichTextEditor',
  Schedule: 'useSchedule',
  ThemeBuilder: 'useThemeBuilder'
}

const getReactHookExample = (name: string): string | undefined => {
  const hookName = reactHookByComponent[name]
  const code = hookName ? reactHooksReference.find(hook => hook.name === hookName)?.code : undefined

  return code ? `'use client'\n\n${code}\n` : undefined
}

export const buildSnippets = (
  name: string,
  raw: string
): FrameworkSnippet[] => {
  const { body, frontmatter } = splitExample(raw)
  let reactBody = body

  if (name === 'DataTable') reactBody = '<DataTable columns={columns} rows={rows} />'
  else if (name === 'Tabs') reactBody = body.replaceAll('initialValue=', 'defaultValue=')
  else if (name === 'PhoneInput')
    reactBody = transformMarkup(body, (tag, start) => ({
      end: tag.end,
      text: tag.name === 'PhoneInput' && !tag.closing ?
        body.slice(start, tag.end).replaceAll('countryValue=', 'defaultCountryValue=').replaceAll(' value=', ' defaultValue=') :
        body.slice(start, tag.end)
    }))

  return [
    { code: toAstroSnippet(raw), label: 'Astro', lang: 'astro' },
    {
      code: reactOverrides[name] ?? getReactHookExample(name) ?? toReactSnippet(reactBody, frontmatter),
      label: 'React',
      lang: 'tsx'
    },
    {
      code: elementsOverrides[name] ?? (elementsDataCharts.has(name) ?
        toElementsDataChartSnippet(name, body, frontmatter) :
        toElementsSnippet(body)),
      label: 'Elements',
      lang: 'html'
    }
  ]
}
