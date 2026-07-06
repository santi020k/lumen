import type { ReactElement } from 'react'
import * as React from 'react'
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
  type TableProps,
  ToastProvider,
  useDropdownMenu,
  usePopover,
  useSelect,
  useTabs,
  useTooltip
} from './index.js'

interface ReactInternals {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: {
    H: unknown
  }
}

const withHookDispatcher = <Value,>(callback: () => Value): Value => {
  const internals = (React as unknown as ReactInternals).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
  const previousDispatcher = internals.H
  const states: unknown[] = []
  const refs: { current: unknown }[] = []
  let stateIndex = 0
  let refIndex = 0
  let idIndex = 0

  internals.H = {
    useCallback: (value: unknown) => value,
    useContext: (context: { _currentValue?: unknown }) => context._currentValue,
    useEffect: () => {},
    useId: () => `test-${++idIndex}`,
    useMemo: (factory: () => unknown) => factory(),
    useRef: (initialValue: unknown) => {
      const index = refIndex++
      refs[index] ??= { current: initialValue }

      return refs[index]
    },
    useState: (initialValue: unknown) => {
      const index = stateIndex++

      states[index] ??= typeof initialValue === 'function'
        ? (initialValue as () => unknown)()
        : initialValue

      return [
        states[index],
        (nextValue: unknown) => {
          states[index] = typeof nextValue === 'function'
            ? (nextValue as (previous: unknown) => unknown)(states[index])
            : nextValue
        }
      ]
    }
  }

  try {
    return callback()
  } finally {
    internals.H = previousDispatcher
  }
}

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
    const dialog = withHookDispatcher(() => Dialog({ className: 'custom-dialog', glass: true }) as ReactElement<DialogProps>)

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
      code: `
        const answer = "42";
      `,
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
    const pre = blockChildren[1] as ReactElement<Record<string, unknown>>
    const codeElement = pre.props.children as ReactElement<Record<string, unknown>>
    const tokenChildren = codeElement.props.children as (ReactElement<Record<string, unknown>> | string)[]
    const keyword = tokenChildren[0] as ReactElement<Record<string, unknown>>
    const stringToken = tokenChildren[6] as ReactElement<Record<string, unknown>>

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
    expect(keyword.props.className).toBe('ui-code__token--keyword')
    expect(stringToken.props.className).toBe('ui-code__token--string')
  })

  test('defaults inputs to text fields', () => {
    const input = Input({ className: 'custom-input' }) as ReactElement<InputProps>

    expect(input.props.className).toBe('ui-input custom-input')
    expect(input.props.type).toBe('text')
  })

  test('exposes disclosure semantics for popovers and dropdown menus', () => {
    const popover = withHookDispatcher(() => usePopover({ defaultOpen: true }))
    const dropdown = withHookDispatcher(() => useDropdownMenu({ defaultOpen: false }))

    expect(popover.triggerProps['aria-haspopup']).toBe('menu')
    expect(popover.triggerProps['aria-expanded']).toBe(true)
    expect(popover.panelProps.hidden).toBe(false)
    expect(popover.panelProps['data-state']).toBe('open')

    expect(dropdown.triggerProps['aria-haspopup']).toBe('menu')
    expect(dropdown.triggerProps['aria-expanded']).toBe(false)
    expect(dropdown.panelProps.hidden).toBe(true)
    expect(dropdown.panelProps['data-state']).toBe('closed')
  })

  test('exposes tabs roving aria state', () => {
    const tabs = withHookDispatcher(() => useTabs({ defaultValue: 'overview' }))
    const overview = tabs.getTriggerProps('overview')
    const settings = tabs.getTriggerProps('settings')
    const panel = tabs.getPanelProps('overview')

    expect(tabs.rootProps['data-ui-tabs']).toBe(true)
    expect(tabs.listProps.role).toBe('tablist')
    expect(overview['aria-selected']).toBe(true)
    expect(overview.tabIndex).toBe(0)
    expect(settings['aria-selected']).toBe(false)
    expect(settings.tabIndex).toBe(-1)
    expect(panel.role).toBe('tabpanel')
    expect(panel.hidden).toBe(false)
  })

  test('exposes select listbox state and option selection', () => {
    const select = withHookDispatcher(() => useSelect({
      defaultValue: 'beta',
      options: ['Alpha', { label: 'Beta', value: 'beta' }],
      placeholder: 'Pick one',
      required: true
    }))
    const option = select.getOptionProps({ label: 'Beta', value: 'beta' })

    expect(select.rootProps['data-ui-select']).toBe(true)
    expect(select.rootProps['data-placeholder']).toBe('false')
    expect(select.triggerProps.role).toBe('combobox')
    expect(select.triggerProps['aria-haspopup']).toBe('listbox')
    expect(select.triggerProps['aria-required']).toBe(true)
    expect(select.triggerText).toBe('Beta')
    expect(select.listProps.role).toBe('listbox')
    expect(option.role).toBe('option')
    expect(option['aria-selected']).toBe(true)
  })

  test('exposes tooltip escape-dismissable aria state', () => {
    const tooltip = withHookDispatcher(() => useTooltip({ defaultOpen: true }))

    expect(tooltip.rootProps['data-ui-tooltip']).toBe(true)
    expect(tooltip.rootProps['aria-describedby']).toMatch(/^ui-tooltip-/)
    expect(tooltip.tooltipProps.role).toBe('tooltip')
    expect(tooltip.tooltipProps.hidden).toBe(false)
  })

  test('exposes toast provider controller api', () => {
    const provider = withHookDispatcher(() => ToastProvider({ maxCount: 2, placement: 'top-right' }) as ReactElement<{
      value: {
        create: (detail: { title: string }) => string
        dismiss: (id?: string) => void
        update: (id: string, detail: { title: string }) => void
      }
    }>)
    const id = provider.props.value.create({ title: 'Saved' })

    expect(id).toMatch(/^ui-toast-/)
    expect(provider.props.value.update).toBeTypeOf('function')
    expect(provider.props.value.dismiss).toBeTypeOf('function')
  })
})
