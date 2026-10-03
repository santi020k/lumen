import { describe, expect, test } from 'vitest'

import { buildSnippets } from './snippets'

const example = `---
import { Button, Field, Input, Label } from '@santi020k/lumen-astro'
---

<Field class="signup-field">
  <Label for="email">Email</Label>
  <Input id="email" value="hello@example.com" />
  <Button disabled>Save</Button>
</Field>`

describe('framework snippets', () => {
  test('builds Astro, React, and Elements usage from one canonical example', () => {
    const snippets = buildSnippets('Field', example)

    expect(snippets.map(snippet => snippet.label)).toEqual(['Astro', 'React', 'Elements'])
    expect(snippets.map(snippet => snippet.lang)).toEqual(['astro', 'tsx', 'html'])
  })

  test('translates native and framework-specific attributes for React', () => {
    const react = buildSnippets('Field', example)[1]?.code

    expect(react).toContain('from \'@santi020k/lumen-react\'')
    expect(react).toContain('className="signup-field"')
    expect(react).toContain('htmlFor="email"')
    expect(react).toContain('defaultValue="hello@example.com"')
    expect(react).not.toContain('@santi020k/lumen-astro')
  })

  test('translates catalog components to registered custom element tags', () => {
    const elements = buildSnippets('Field', example)[2]?.code

    expect(elements).toContain('defineLumenElements()')
    expect(elements).toContain('<lumen-field class="signup-field">')
    expect(elements).toContain('<lumen-label for="email">')
    expect(elements).toContain('<lumen-input id="email" value="hello@example.com"></lumen-input>')
    expect(elements).toContain('<lumen-button disabled>Save</lumen-button>')
  })

  test('keeps Form as a native Elements submission boundary', () => {
    const formExample = `---
import { Button, Form } from '@santi020k/lumen-astro'
---

<Form><Button type="submit">Save changes</Button></Form>`
    const elements = buildSnippets('Form', formExample)[2]?.code

    expect(elements).toContain('<form data-ui-form>')
    expect(elements).toContain('<lumen-button type="submit">Save changes</lumen-button>')
    expect(elements).not.toContain('<lumen-form')
  })

  test('preserves acronym boundaries and converts property names for Elements', () => {
    const elements = buildSnippets('Field', `
<QRCode value="https://example.com" size={160} />
<Input defaultValue="Ready" ariaLabel="Name" />
<Button data-label="defaultValue={example}">Save</Button>`)[2]?.code

    expect(elements).toContain('<lumen-qr-code value="https://example.com" size="160"></lumen-qr-code>')
    expect(elements).toContain('<lumen-input value="Ready" aria-label="Name"></lumen-input>')
    expect(elements).toContain('data-label="defaultValue={example}"')
  })

  test('keeps nested Form boundaries native without changing their content', () => {
    const elements = buildSnippets('Field', `
<Form method="post"><Field><Input name="email" /><Button type="submit">Join</Button></Field></Form>`)[2]?.code

    expect(elements).toContain('<form data-ui-form method="post"><lumen-field>')
    expect(elements).toContain('<lumen-input name="email"></lumen-input>')
    expect(elements).toContain('</lumen-button></lumen-field></form>')
    expect(elements).not.toContain('lumen-form')
  })

  test('removes embedded Astro scripts and styles while preserving surrounding markup', () => {
    const raw = `<Button title="Keep <script> as text">Before</Button>
<script data-label="1 > 0">document.querySelector('button')</script>
<style data-label="1 > 0">button { color: red; }</style>
<Button>After</Button>`
    const [astro, react, elements] = buildSnippets('Button', raw)

    expect(astro?.code).toContain('<style data-label="1 > 0">')
    expect(react?.code).toContain('title="Keep <script> as text"')
    expect(react?.code).toContain('<Button>After</Button>')
    expect(react?.code).not.toContain('document.querySelector')
    expect(react?.code).not.toContain('color: red')
    expect(elements?.code).toContain('<lumen-button>After</lumen-button>')
    expect(elements?.code).not.toContain('document.querySelector')
    expect(elements?.code).not.toContain('color: red')
  })

  test('keeps expression values intact when they require a framework-specific example', () => {
    const quoted = JSON.stringify('escaped"quote')
    const source = `<Button label={{ message: "} >", nested: { count: 2 } }}>Save</Button>
<Input value={getValue(/* } */ ${quoted})} />`
    const elements = buildSnippets('Button', source)[2]?.code

    expect(elements).toContain('label={{ message: "} >", nested: { count: 2 } }}')
    expect(elements).toContain('<lumen-input')
    expect(elements).toContain('value={getValue(')
    expect(elements).toContain('</lumen-input>')
  })

  test('preserves comments without treating their tag examples as live markup', () => {
    const elements = buildSnippets('Button', `<!-- <script>Example</script> -->
<Button>Continue</Button>`)[2]?.code

    expect(elements).toContain('<!-- <script>Example</script> -->')
    expect(elements).toContain('<lumen-button>Continue</lumen-button>')
  })

  test('terminates for long unfinished expressions and embedded blocks', () => {
    const malformed = `<Input value={${'{'.repeat(20_000)}"} >"`
    const scripts = `<Button>Before</Button><script>${'</scripture>'.repeat(20_000)}`

    expect(buildSnippets('Input', malformed)[2]?.code).toContain(malformed)
    expect(buildSnippets('Button', scripts)[1]?.code).toContain('<Button>Before</Button>')
    expect(buildSnippets('Button', scripts)[2]?.code).not.toContain('</scripture>')
  })

  test('uses framework-native ErrorState recovery composition', () => {
    const example = `---
import { Button, ErrorState } from '@santi020k/lumen-astro'
---
<ErrorState title="Could not load projects"><Button slot="actions">Try again</Button></ErrorState>`
    const snippets = buildSnippets('ErrorState', example)
    const react = snippets[1]?.code
    const elements = snippets[2]?.code

    expect(react).toContain('actions={(')
    expect(react).not.toContain('slot="actions"')
    expect(elements).toContain('aria-labelledby="projects-error-title"')
    expect(elements).toContain('data-slot="error-state-actions"')
    expect(elements).not.toContain('title="Could not load projects"')
  })

  test('uses the canonical vector logo dimensions in framework examples', () => {
    const snippets = buildSnippets('Image', '<img src="/logo.svg" alt="Lumen UI logo" />')
    const react = snippets[1]?.code
    const elements = snippets[2]?.code

    expect(react).toContain('src="/logo.svg"')
    expect(react).toContain('width={310}')
    expect(react).not.toContain('invertOnDark')
    expect(elements).toContain('src="/logo.svg"')
    expect(elements).toContain('width="310"')
    expect(elements).not.toContain('ui-image--invert-dark')
    expect(elements).not.toContain('/logo.avif')
    expect(elements).not.toContain('/logo.webp')
  })
})
