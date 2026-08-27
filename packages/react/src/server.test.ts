import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, test } from 'vitest'

import {
  Badge as ClientBadge,
  Card as ClientCard,
  Grid as ClientGrid,
  Input as ClientInput,
  Progress as ClientProgress,
  Stack as ClientStack
} from './components.js'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  Direction,
  Grid,
  Input,
  Label,
  Progress,
  Separator,
  Skeleton,
  Spinner,
  Stack,
  Textarea,
  Typography,
  VisuallyHidden
} from './server.js'

describe('@santi020k/lumen-react/server', () => {
  test('shares implementations with the full client catalog', () => {
    expect(Badge).toBe(ClientBadge)
    expect(Card).toBe(ClientCard)
    expect(Grid).toBe(ClientGrid)
    expect(Input).toBe(ClientInput)
    expect(Progress).toBe(ClientProgress)
    expect(Stack).toBe(ClientStack)
  })

  test('renders the stateless server-safe primitive set', () => {
    const html = renderToStaticMarkup(
      createElement(
        'section',
        null,
        createElement(Badge, { variant: 'success' }, 'Ready'),
        createElement(
          Card,
          { as: 'article', glass: 'strong', variant: 'interactive' },
          createElement(
            CardHeader,
            null,
            createElement(CardTitle, null, 'Server-safe card'),
            createElement(CardDescription, null, 'No client boundary')
          ),
          createElement(CardContent, null, 'Content'),
          createElement(CardFooter, null, 'Footer')
        ),
        createElement(
          Container,
          { size: 'sm' },
          createElement(
            Grid,
            { columns: 2, gap: 'sm', minItemWidth: '10rem' },
            createElement(Stack, { direction: 'horizontal' }, 'Stack')
          )
        ),
        createElement(Direction, { dir: 'rtl' }, 'RTL'),
        createElement(Label, { htmlFor: 'name' }, 'Name'),
        createElement(Input, { id: 'name', visualSize: 'sm' }),
        createElement(Textarea, { 'aria-label': 'Notes' }),
        createElement(Progress, { 'aria-label': 'Upload', value: 40 }),
        createElement(Skeleton, { 'aria-label': 'Loading preview' }),
        createElement(Spinner, { 'aria-label': 'Saving' }),
        createElement(Separator, { orientation: 'vertical' }),
        createElement(Typography, null, 'Body'),
        createElement(VisuallyHidden, { focusable: true }, 'Skip target')
      )
    )

    expect(html).toContain('ui-badge--success')
    expect(html).toContain('ui-card--interactive')
    expect(html).toContain('ui-glass-strong')
    expect(html).toContain('data-slot="card-title"')
    expect(html).toContain('ui-container--sm')
    expect(html).toContain('ui-grid--columns-2')
    expect(html).toContain('--ui-grid-min:10rem')
    expect(html).toContain('ui-stack--horizontal')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('ui-input--sm')
    expect(html).toContain('ui-textarea')
    expect(html).toContain('aria-valuenow="40"')
    expect(html).toContain('style="width:40%"')
    expect(html).toContain('ui-skeleton')
    expect(html).toContain('role="status"')
    expect(html).toContain('ui-separator--vertical')
    expect(html).toContain('ui-typography')
    expect(html).toContain('ui-visually-hidden--focusable')
  })
})
