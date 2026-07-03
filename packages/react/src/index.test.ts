import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'

import {
  Button,
  type ButtonProps,
  Card,
  type CardProps,
  Dialog,
  type DialogProps,
  Input,
  type InputProps,
  lumenComponentNames
} from './index.js'

describe('@santi020k/lumen-react', () => {
  test('exports shared metadata', () => {
    expect(lumenComponentNames).toContain('Button')
  })

  test('applies default button classes and type', () => {
    const button = Button({ children: 'Save' }) as ReactElement<ButtonProps>

    expect(button.props.className).toBe('ui-button ui-button--default ui-button--default-size')
    expect(button.props.type).toBe('button')
  })

  test('supports polymorphic cards and glass surfaces', () => {
    const card = Card({ as: 'section', className: 'custom-card', glass: true, variant: 'interactive' }) as ReactElement<
      CardProps<'section'> & { uiClassName: string }
    >

    expect(card.props.as).toBe('section')
    expect(card.props.className).toBe('ui-card--interactive ui-card--glass custom-card')
    expect(card.props['data-variant']).toBe('interactive')
    expect(card.props.uiClassName).toBe('ui-card')
  })

  test('supports glass overlay surfaces', () => {
    const dialog = Dialog({ className: 'custom-dialog', glass: true }) as ReactElement<DialogProps>

    expect(dialog.props.className).toBe('ui-dialog ui-dialog--glass custom-dialog')
    expect(dialog.props['data-surface']).toBe('glass')
  })

  test('defaults inputs to text fields', () => {
    const input = Input({ className: 'custom-input' }) as ReactElement<InputProps>

    expect(input.props.className).toBe('ui-input custom-input')
    expect(input.props.type).toBe('text')
  })
})
