import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, test } from 'vitest'

import {
  Badge as ClientBadge,
  Input as ClientInput,
  Progress as ClientProgress
} from './components.js'
import {
  Badge,
  Input,
  Label,
  Progress,
  Skeleton,
  Spinner,
  Textarea
} from './server.js'

describe('@santi020k/lumen-react/server', () => {
  test('shares implementations with the full client catalog', () => {
    expect(Badge).toBe(ClientBadge)
    expect(Input).toBe(ClientInput)
    expect(Progress).toBe(ClientProgress)
  })

  test('renders the stateless server-safe primitive set', () => {
    const html = renderToStaticMarkup(
      createElement(
        'section',
        null,
        createElement(Badge, { variant: 'success' }, 'Ready'),
        createElement(Label, { htmlFor: 'name' }, 'Name'),
        createElement(Input, { id: 'name', visualSize: 'sm' }),
        createElement(Textarea, { 'aria-label': 'Notes' }),
        createElement(Progress, { 'aria-label': 'Upload', value: 40 }),
        createElement(Skeleton, { 'aria-label': 'Loading preview' }),
        createElement(Spinner, { 'aria-label': 'Saving' })
      )
    )

    expect(html).toContain('ui-badge--success')
    expect(html).toContain('ui-input--sm')
    expect(html).toContain('ui-textarea')
    expect(html).toContain('aria-valuenow="40"')
    expect(html).toContain('style="width:40%"')
    expect(html).toContain('ui-skeleton')
    expect(html).toContain('role="status"')
  })
})
