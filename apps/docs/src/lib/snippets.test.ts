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

    expect(react).toContain("from '@santi020k/lumen-react'")
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
})
