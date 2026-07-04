import type { ReactElement } from 'react'
import { describe, expect, test } from 'vitest'

import {
  Alert,
  type AlertProps,
  Button,
  type ButtonProps,
  Card,
  type CardProps,
  Code,
  Dialog,
  type DialogProps,
  Input,
  type InputProps,
  lumenComponentNames,
  Table,
  type TableProps
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

  test('supports glass on structural surfaces', () => {
    const alert = Alert({ className: 'custom-alert', glass: true }) as ReactElement<AlertProps>
    const table = Table({ className: 'custom-table', glass: true }) as ReactElement<TableProps>

    expect(alert.props.className).toBe('ui-alert ui-alert--glass custom-alert')
    expect(table.props.className).toBe('ui-table-wrap ui-table-wrap--glass custom-table')
  })

  test('renders inline and block code primitives', () => {
    const inlineCode = Code({ children: 'const answer = 42', className: 'custom-code' }) as ReactElement
    const blockCode = Code({
      children: 'console.log(answer)',
      copy: true,
      label: 'Example',
      language: 'ts',
      theme: 'santi020k',
      variant: 'block'
    }) as ReactElement
    const inlineProps = inlineCode.props as Record<string, unknown>
    const blockProps = blockCode.props as Record<string, unknown>
    const blockChildren = blockProps.children as ReactElement[]
    const header = blockChildren[0] as ReactElement<Record<string, unknown>>
    const headerProps = header.props
    const headerChildren = headerProps.children as ReactElement[]
    const copyButton = headerChildren[2] as ReactElement<Record<string, unknown>>
    const copyButtonProps = copyButton.props

    expect(inlineCode.type).toBe('code')
    expect(inlineProps.className).toBe('ui-code ui-code--inline custom-code')
    expect(inlineProps['data-code-theme']).toBe('auto')

    expect(blockCode.type).toBe('figure')
    expect(blockProps.className).toBe('ui-code ui-code--block')
    expect(blockProps['data-code-theme']).toBe('santi020k')
    expect(blockProps['data-language']).toBe('ts')
    expect(blockProps['data-ui-code']).toBe(true)
    expect(header.type).toBe('figcaption')
    expect(copyButtonProps['data-ui-code-copy']).toBe(true)
  })

  test('defaults inputs to text fields', () => {
    const input = Input({ className: 'custom-input' }) as ReactElement<InputProps>

    expect(input.props.className).toBe('ui-input custom-input')
    expect(input.props.type).toBe('text')
  })
})
