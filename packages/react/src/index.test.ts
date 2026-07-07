/* eslint-disable @eslint-react/no-unnecessary-use-prefix -- The mock dispatcher mirrors React's internal hook method names. */
import type { ReactElement } from 'react'
import * as React from 'react'
import { describe, expect, test, vi } from 'vitest'

import {
  Alert,
  type AlertProps,
  Button,
  type ButtonProps,
  Calendar,
  Card,
  type CardProps,
  Code,
  DataTable,
  Dialog,
  type DialogProps,
  Field,
  type FieldProps,
  Input,
  InputOTP,
  type InputProps,
  lumenComponentNames,
  Resizable,
  Table,
  type TableProps,
  ToastProvider,
  useCalendar,
  useContextMenu,
  useDateRangePicker,
  useDropdownMenu,
  useFormValidation,
  useInputOTP,
  usePopover,
  useResizable,
  useRichTextEditor,
  useSchedule,
  useSelect,
  useTabs,
  useThemeBuilder,
  useTooltip,
  VirtualList
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
    useEffect: () => null,
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

const makeDateRangeInput = (value: string): HTMLInputElement => {
  const input: {
    closest: (selector: string) => HTMLElement | null
    max: string | undefined
    min: string | undefined
    removeAttribute: (name: string) => void
    value: string
  } = {
    closest: vi.fn(() => null),
    max: '',
    min: '',
    removeAttribute: vi.fn((name: string) => {
      if (name === 'max') input.max = undefined
      if (name === 'min') input.min = undefined
    }),
    value
  }

  return input as unknown as HTMLInputElement
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

  test('renders calendar grid and hidden input', () => {
    const calendar = withHookDispatcher(() => Calendar({
      month: '2026-07',
      name: 'delivery',
      value: '2026-07-10'
    }) as ReactElement)
    const calendarProps = calendar.props as Record<string, unknown>
    const children = calendarProps.children as ReactElement<Record<string, unknown>>[]
    const input = children[0]
    const header = children[1]
    const table = children[2]
    const label = (header?.props.children as ReactElement<Record<string, unknown>>[])[1]
    const body = (table?.props.children as ReactElement<Record<string, unknown>>[])[1]
    const firstRow = (body?.props.children as ReactElement<Record<string, unknown>>[])[0]
    const firstDay = (firstRow?.props.children as ReactElement<Record<string, unknown>>[])[0]

    expect(calendarProps.className).toBe('ui-calendar')
    expect(calendarProps['data-ui-calendar']).toBe(true)
    expect(input?.props.name).toBe('delivery')
    expect(input?.props.value).toBe('2026-07-10')
    expect(label?.props.children).toBe('July 2026')
    expect(table?.props.role).toBe('grid')
    expect(firstDay?.props['data-date']).toBe('2026-06-29')
  })

  test('exposes calendar selection helpers', () => {
    const changes: string[] = []
    const calendar = withHookDispatcher(() => useCalendar({
      month: '2026-07',
      onValueChange: value => { changes.push(value); }
    }))

    calendar.selectDate('2026-07-15')

    expect(calendar.month).toBe('2026-07')
    expect(changes).toEqual(['2026-07-15'])
    expect(calendar.previousProps['data-ui-calendar-prev']).toBe(true)
    expect(calendar.nextProps['data-ui-calendar-next']).toBe(true)
  })

  test('renders input OTP as native input plus visual segments', () => {
    const otp = withHookDispatcher(() => InputOTP({
      defaultValue: '12a3',
      length: 4,
      name: 'code'
    }) as ReactElement)
    const otpProps = otp.props as Record<string, unknown>
    const children = otpProps.children as ReactElement<Record<string, unknown>>[]
    const nativeInput = children[0]
    const segmentsRoot = children[1]
    const segments = segmentsRoot?.props.children as ReactElement<Record<string, unknown>>[]
    const firstSegment = segments[0]
    const firstChar = firstSegment?.props.children as ReactElement<Record<string, unknown>>

    expect(otp.type).toBe('div')
    expect(otpProps.className).toBe('ui-input-otp-field')
    expect(otpProps['data-ui-input-otp']).toBe(true)
    expect(nativeInput?.props.className).toBe('ui-input-otp ui-input-otp__native')
    expect(nativeInput?.props['data-ui-input-otp-native']).toBe(true)
    expect(nativeInput?.props.name).toBe('code')
    expect(nativeInput?.props.value).toBe('123')
    expect(segmentsRoot?.props.className).toBe('ui-input-otp__segments')
    expect(segments).toHaveLength(4)
    expect(firstSegment?.props['data-ui-input-otp-segment']).toBe(true)
    expect(firstChar.props['data-ui-input-otp-char']).toBe(true)
    expect(firstChar.props.children).toBe('1')
  })

  test('exposes input OTP sanitizing props', () => {
    const changes: string[] = []
    const otp = withHookDispatcher(() => useInputOTP({
      length: 4,
      onValueChange: value => { changes.push(value); }
    }))
    const input = {
      selectionStart: 6,
      value: '12ab34'
    } as HTMLInputElement
    const inputProps = otp.getInputProps()
    const segmentProps = otp.getSegmentProps(2)

    inputProps.onInput?.({
      currentTarget: input
    } as unknown as Parameters<NonNullable<typeof inputProps.onInput>>[0])

    expect(input.value).toBe('1234')
    expect(changes).toEqual(['1234'])
    expect(segmentProps['data-index']).toBe(2)
    expect(segmentProps['data-ui-input-otp-segment']).toBe(true)
  })

  test('exposes form validation and field contracts', () => {
    const field = Field({
      children: 'Email',
      controlId: 'email',
      describedBy: 'email-hint'
    }) as ReactElement<FieldProps>
    const fieldProps = field.props as FieldProps & Record<`data-${string}`, unknown>
    const validation = withHookDispatcher(() => useFormValidation())

    expect(fieldProps.className).toBe('ui-field')
    expect(fieldProps['data-ui-field']).toBe(true)
    expect(fieldProps['data-ui-field-control']).toBe('email')
    expect(fieldProps['data-ui-field-describedby']).toBe('email-hint')
    expect(validation.formProps['data-ui-form']).toBe(true)
    expect(validation.formProps.noValidate).toBe(true)
    expect(validation.validateForm).toBeTypeOf('function')
    expect(validation.validateControl).toBeTypeOf('function')
  })

  test('exposes date range picker syncing props', () => {
    const changes: unknown[] = []
    const picker = withHookDispatcher(() => useDateRangePicker({
      onRangeChange: detail => { changes.push(detail); }
    }))
    const start = makeDateRangeInput('2026-07-10')
    const end = makeDateRangeInput('2026-07-08')
    const startProps = picker.getStartProps()
    const endProps = picker.getEndProps()

    expect(picker.rootProps['data-ui-date-range-picker']).toBe(true)
    expect(startProps.type).toBe('date')
    expect(endProps.type).toBe('date')

    startProps.onChange?.({
      currentTarget: start
    } as unknown as Parameters<NonNullable<typeof startProps.onChange>>[0])
    endProps.onChange?.({
      currentTarget: end
    } as unknown as Parameters<NonNullable<typeof endProps.onChange>>[0])

    expect(end.min).toBe('2026-07-10')
    expect(end.value).toBe('2026-07-10')
    expect(changes.at(-1)).toEqual({ end: '2026-07-10', start: '2026-07-10' })
  })

  test('exposes rich text command props and events', () => {
    const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document')
    const execCommand = vi.fn(() => true)
    const commands: string[] = []

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { execCommand }
    })

    try {
      const editor = withHookDispatcher(() => useRichTextEditor({
        onCommand: detail => { commands.push(detail.command); }
      }))
      const commandProps = editor.getCommandProps('bold')

      expect(editor.rootProps['data-ui-rich-text-editor']).toBe(true)
      expect(commandProps['data-ui-editor-command']).toBe('bold')
      expect(commandProps.type).toBe('button')

      commandProps.onClick?.({
        currentTarget: { closest: vi.fn(() => null) }
      } as unknown as Parameters<NonNullable<typeof commandProps.onClick>>[0])

      expect(execCommand).toHaveBeenCalledWith('bold')
      expect(commands).toEqual(['bold'])
    } finally {
      if (documentDescriptor) {
        Object.defineProperty(globalThis, 'document', documentDescriptor)
      } else {
        delete (globalThis as { document?: Document }).document
      }
    }
  })

  test('exposes schedule drag and drop props', () => {
    const changes: unknown[] = []
    const schedule = withHookDispatcher(() => useSchedule({
      onChange: detail => { changes.push(detail); }
    }))
    const root = {
      dataset: {},
      dispatchEvent: vi.fn()
    } as unknown as HTMLElement
    const scheduleEvent = {
      closest: vi.fn(() => root),
      id: 'schedule-planning',
      textContent: 'Planning'
    } as unknown as HTMLElement
    const slot = {
      closest: vi.fn(() => root),
      dataset: {}
    } as unknown as HTMLElement
    const transferData: Record<string, string> = {}
    const dataTransfer = {
      getData: vi.fn((type: string) => transferData[type] ?? ''),
      setData: vi.fn((type: string, value: string) => {
        transferData[type] = value
      })
    }
    const eventProps = schedule.getEventProps('schedule-planning')
    const slotProps = schedule.getSlotProps('friday')

    expect(schedule.rootProps['data-ui-schedule']).toBe(true)
    expect(eventProps['data-ui-schedule-event']).toBe(true)
    expect(eventProps['data-ui-draggable']).toBe(true)
    expect(eventProps.draggable).toBe(true)
    expect(eventProps.id).toBe('schedule-planning')
    expect(slotProps['data-ui-schedule-slot']).toBe('friday')

    eventProps.onDragStart?.({
      currentTarget: scheduleEvent,
      dataTransfer
    } as unknown as Parameters<NonNullable<typeof eventProps.onDragStart>>[0])

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'schedule-planning')
    expect(root.dataset.uiDragging).toBe('true')

    eventProps.onDragEnd?.({
      currentTarget: scheduleEvent
    } as Parameters<NonNullable<typeof eventProps.onDragEnd>>[0])

    expect(root.dataset.uiDragging).toBeUndefined()

    slotProps.onDragOver?.({
      currentTarget: slot,
      preventDefault: vi.fn()
    } as unknown as Parameters<NonNullable<typeof slotProps.onDragOver>>[0])

    expect(slot.dataset.state).toBe('drag-over')

    slotProps.onDrop?.({
      currentTarget: slot,
      dataTransfer,
      preventDefault: vi.fn()
    } as unknown as Parameters<NonNullable<typeof slotProps.onDrop>>[0])

    expect(slot.dataset.state).toBeUndefined()
    expect(changes).toEqual([{ eventId: 'schedule-planning', slot: 'friday' }])
  })

  test('renders data display runtime contracts', () => {
    const table = DataTable({
      columns: [
        { key: 'name', sortable: true },
        { key: 'count', sort: 'number', sortable: true }
      ],
      name: 'rows',
      rows: [
        { count: { sortValue: 2, value: '2' }, id: 'beta', name: 'Beta' },
        { count: { sortValue: 1, value: '1' }, id: 'alpha', name: 'Alpha' }
      ],
      selectable: true
    }) as ReactElement
    const tableProps = table.props as Record<string, unknown> & {
      children: ReactElement<Record<string, unknown>>
    }
    const renderedTable = tableProps.children
    const tableChildren = renderedTable.props.children as ReactElement<Record<string, unknown>>[]
    const [thead, tbody] = tableChildren

    if (!thead || !tbody) throw new Error('Expected DataTable to render table sections.')

    const headerRow = thead.props.children as ReactElement<Record<string, unknown>>
    const headers = headerRow.props.children as ReactElement<Record<string, unknown>>[]
    const rows = tbody.props.children as ReactElement<Record<string, unknown>>[]
    const firstRowCells = rows[0]?.props.children as ReactElement<Record<string, unknown>>[]
    const virtualList = VirtualList({ itemSize: 48, overscan: 2 }) as ReactElement<Record<string, unknown>>

    expect(tableProps['data-ui-datatable']).toBe(true)
    expect(tableProps['data-ui-datatable-name']).toBe('rows')
    expect(tableProps['data-ui-datatable-selectable']).toBe('true')
    expect(headers[0]?.props['data-ui-datatable-sortable']).toBe('true')
    expect(headers[1]?.props['data-ui-datatable-sort-type']).toBe('number')
    expect(rows[0]?.props['data-value']).toBe('beta')
    expect(firstRowCells[1]?.props['data-sort-value']).toBe('2')
    expect(virtualList.props['data-ui-virtual-list']).toBe(true)
    expect(virtualList.props['data-ui-item-size']).toBe(48)
    expect(virtualList.props['data-ui-overscan']).toBe(2)
  })

  test('renders resizable panes with separator handles', () => {
    const resizable = withHookDispatcher(() => Resizable({
      children: [
        React.createElement('aside', { key: 'nav' }, 'Navigation'),
        React.createElement('main', { key: 'main' }, 'Editor')
      ],
      defaultSizes: [25, 75]
    }) as ReactElement)
    const resizableProps = resizable.props as Record<string, unknown>
    const children = resizableProps.children as ReactElement<Record<string, unknown>>[]
    const firstFragmentChildren = children[0]?.props.children as ReactElement<Record<string, unknown>>[]
    const firstPane = firstFragmentChildren[0]
    const firstHandle = firstFragmentChildren[1]

    expect(resizableProps.className).toBe('ui-resizable')
    expect(resizableProps['data-ui-resizable']).toBe(true)
    expect(firstPane?.props['data-ui-resizable-panel']).toBe(true)
    expect((firstPane?.props.style as Record<string, string>)['--ui-resizable-size']).toBe('25%')
    expect(firstHandle?.props.className).toBe('ui-resizable__handle')
    expect(firstHandle?.props.role).toBe('separator')
    expect(firstHandle?.props['aria-orientation']).toBe('vertical')
  })

  test('exposes resizable keyboard sizing props', () => {
    const changes: number[][] = []
    const resizable = withHookDispatcher(() => useResizable({
      defaultSizes: [30, 70],
      onSizesChange: sizes => { changes.push(sizes); },
      panelCount: 2
    }))
    const handleProps = resizable.getHandleProps(0)
    const preventDefault = vi.fn()

    handleProps.onKeyDown?.({
      key: 'ArrowRight',
      preventDefault,
      shiftKey: false
    } as unknown as Parameters<NonNullable<typeof handleProps.onKeyDown>>[0])

    expect(preventDefault).toHaveBeenCalled()
    expect(changes.at(-1)).toEqual([32, 68])
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

  test('exposes context menu trigger and menu props', () => {
    const changes: boolean[] = []
    const contextMenu = withHookDispatcher(() => useContextMenu({
      id: 'actions-menu',
      onOpenChange: open => { changes.push(open); }
    }))

    expect(contextMenu.triggerProps['data-ui-context-menu-trigger']).toBe('actions-menu')
    expect(contextMenu.triggerProps['aria-haspopup']).toBe('menu')
    expect(contextMenu.menuProps['data-ui-context-menu']).toBe(true)
    expect(contextMenu.menuProps.role).toBe('menu')
    expect(contextMenu.menuProps.hidden).toBe(true)
    expect(contextMenu.menuProps['data-state']).toBe('closed')

    contextMenu.triggerProps.onContextMenu?.({
      clientX: 24,
      clientY: 32,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      },
      preventDefault: vi.fn()
    } as unknown as Parameters<NonNullable<typeof contextMenu.triggerProps.onContextMenu>>[0])

    expect(changes).toEqual([true])
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

  test('exposes theme builder tokens and control props', () => {
    const theme = withHookDispatcher(() => useThemeBuilder({
      defaultAccentHue: 140,
      defaultHue: 260,
      defaultScheme: 'dark'
    }))
    const manualMode = theme.getModeProps('manual')
    const figmaFormat = theme.getExportFormatProps('figma')

    expect(theme.rootProps['data-ui-theme-builder']).toBe(true)
    expect(theme.hue).toBe(260)
    expect(theme.accentHue).toBe(140)
    expect(theme.tokens.brand).toBe('260 88% 60%')
    expect(theme.previewStyle['--brand' as keyof typeof theme.previewStyle]).toBe('260 88% 60%')
    expect(theme.exportValue).toContain('color-scheme: dark;')
    expect(theme.hueProps['data-ui-theme-brand-hue']).toBe(true)
    expect(theme.accentHueProps['data-ui-theme-accent-hue']).toBe(true)
    expect(theme.outputProps.value).toContain('--brand: 260 88% 60%;')
    expect(manualMode['data-ui-theme-mode']).toBe('manual')
    expect(manualMode['aria-pressed']).toBe(false)
    expect(figmaFormat['data-ui-theme-export-format']).toBe('figma')
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
