/* eslint-disable @eslint-react/no-unnecessary-use-prefix -- The mock dispatcher mirrors React's internal hook method names. */
import type { ReactElement } from 'react'
import * as React from 'react'

import { describe, expect, test, vi } from 'vitest'

import * as LumenReact from './index.js'
import {
  Accordion,
  type AccordionProps,
  Alert,
  type AlertProps,
  AnimatedNumber,
  Button,
  type ButtonProps,
  Calendar,
  Card,
  type CardProps,
  Code,
  DataTable,
  DatePicker,
  DateRangePicker,
  Dialog,
  type DialogProps,
  DropdownMenu,
  Empty,
  type EmptyProps,
  Field,
  type FieldProps,
  Input,
  InputOTP,
  type InputProps,
  KanbanBoard,
  type KanbanBoardProps,
  KanbanColumn,
  type KanbanColumnProps,
  lumenComponentNames,
  Popover,
  Resizable,
  RevealGroup,
  ScrollProgress,
  ScrollReveal,
  Select,
  Stat,
  type StatProps,
  Table,
  type TableProps,
  ToastProvider,
  useCalendar,
  useContextMenu,
  useDateRangePicker,
  useDialog,
  useDropdownMenu,
  useFormValidation,
  useInputOTP,
  useKanban,
  useLanguageToggle,
  usePopover,
  useResizable,
  useRichTextEditor,
  useSchedule,
  useSelect,
  useTabs,
  useThemeBuilder,
  useToast,
  useTooltip,
  VirtualList,
  Watermark
} from './index.js'

interface ReactInternals {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: {
    H: unknown
  }
}

const renderComponent = (
  component: unknown,
  props: Record<string, unknown> = {},
  ref: unknown = null
): unknown => (component as (componentProps: Record<string, unknown>) => unknown)({
  ...props,
  ...(ref ? { ref } : {})
})

const withHookDispatcher = <Value>(callback: () => Value): Value => {
  const internals = (React as unknown as ReactInternals)
    .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
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

      states[index] ??=
        typeof initialValue === 'function' ?
          (initialValue as () => unknown)() :
          initialValue

      return [
        states[index],
        (nextValue: unknown) => {
          states[index] =
            typeof nextValue === 'function' ?
              (nextValue as (previous: unknown) => unknown)(states[index]) :
              nextValue
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
  test('exports one React component for every shared catalog name', () => {
    for (const componentName of lumenComponentNames) {
      expect(LumenReact[componentName]).toBeTypeOf('function')
    }
  })

  test('renders every catalog component with its documented defaults', () => {
    for (const componentName of lumenComponentNames) {
      const component = LumenReact[componentName] as unknown

      expect(() => withHookDispatcher(() => renderComponent(component))).not.toThrow()
    }
  })

  test('exports shared metadata', () => {
    expect(lumenComponentNames).toContain('Button')
    expect(LumenReact.DropdownMenuItem).toBeTypeOf('function')
    expect(LumenReact.DropdownMenuSeparator).toBeTypeOf('function')
  })

  test('cycles controlled language options through the React hook contract', () => {
    const changes: string[] = []
    const language = withHookDispatcher(() => useLanguageToggle({
      locales: [
        { label: 'English', value: 'en' },
        { label: 'Español', value: 'es' }
      ],
      onValueChange: value => {
        changes.push(value)
      },
      value: 'en'
    }))

    language.selectNext()

    expect(language.currentLocale.label).toBe('English')
    expect(language.nextLocale.label).toBe('Español')
    expect(changes).toEqual(['es'])
  })

  test('exposes the shared motion vocabulary on React primitives', () => {
    const scrollReveal = withHookDispatcher(() => ScrollReveal({
      animation: 'slide-up',
      delay: 60,
      duration: 'slow',
      once: false,
      threshold: 0.25
    })) as ReactElement<{
      className?: string
      style?: React.CSSProperties
      'data-ui-reveal-once'?: string
      'data-ui-reveal-threshold'?: number
    }>
    const revealGroup = withHookDispatcher(() => RevealGroup({
      children: 'Steps',
      stagger: 90
    })) as ReactElement<{ className?: string, style?: React.CSSProperties }>
    const animatedNumber = withHookDispatcher(() => AnimatedNumber({
      decimals: 1,
      suffix: '%',
      value: 99.8
    })) as ReactElement<{
      className?: string
      children: ReactElement<{ children: string }>[]
    }>

    expect(scrollReveal.props.className).toContain('ui-motion-duration-slow')
    expect(scrollReveal.props['data-ui-reveal-once']).toBe('false')
    expect(scrollReveal.props['data-ui-reveal-threshold']).toBe(0.25)
    expect(scrollReveal.props.style).toMatchObject({
      '--ui-reveal-delay': '60ms'
    })
    expect(revealGroup.props.className).toContain('ui-reveal-group-slide-up')
    expect(revealGroup.props.style).toMatchObject({
      '--ui-reveal-stagger': '90ms'
    })
    expect(animatedNumber.props.className).toContain('ui-animated-number')
    expect(animatedNumber.props.children[1]?.props.children).toBe('99.8%')
  })

  test('renders an accessible document scroll progress primitive', () => {
    const progress = withHookDispatcher(() => ScrollProgress({
      'aria-label': 'Article progress',
      position: 'bottom'
    })) as ReactElement<{
      'aria-label': string
      'aria-valuenow': number
      className: string
      role: string
    }>

    expect(progress.props['aria-label']).toBe('Article progress')
    expect(progress.props['aria-valuenow']).toBe(0)
    expect(progress.props.className).toBe(
      'ui-scroll-progress ui-scroll-progress--bottom'
    )
    expect(progress.props.role).toBe('progressbar')
  })

  test('applies default button classes and type', () => {
    const button = renderComponent(Button, {
      children: 'Save'
    }) as ReactElement<ButtonProps>

    expect(button.props.className).toBe(
      'ui-button ui-button--default ui-button--default-size'
    )
    expect(button.props.type).toBe('button')
  })

  test('composes Button through one child and forwards its ref', () => {
    const ref = React.createRef<HTMLButtonElement>()
    const child = React.createElement(
      'a', { className: 'product-link', href: '/projects' }, 'Projects'
    )
    const slottedButton = renderComponent(
      Button, {
        asChild: true,
        children: child,
        variant: 'secondary'
      }, ref
    ) as ReactElement<Record<string, unknown>>
    const nativeButton = renderComponent(
      Button, { children: 'Save' }, ref
    ) as ReactElement<Record<string, unknown>>

    expect(slottedButton.type).toBe('a')
    expect(slottedButton.props.className).toBe(
      'ui-button ui-button--secondary ui-button--default-size product-link'
    )
    expect(slottedButton.props.href).toBe('/projects')
    expect(slottedButton.props.ref).toBe(ref)
    expect(nativeButton.props.ref).toBe(ref)
  })

  test('supports the flush accordion variant', () => {
    const accordion = Accordion({
      children: 'Frequently asked questions',
      className: 'custom-accordion',
      variant: 'flush'
    }) as ReactElement<AccordionProps & { 'data-variant': string }>

    expect(accordion.props.className).toBe(
      'ui-accordion ui-accordion--flush custom-accordion'
    )
    expect(accordion.props['data-variant']).toBe('flush')
  })

  test('supports polymorphic cards and glass surfaces', () => {
    const card = Card({
      as: 'section',
      className: 'custom-card',
      glass: true,
      variant: 'interactive'
    }) as ReactElement<CardProps<'section'> & { uiClassName: string }>

    expect(card.props.as).toBe('section')
    expect(card.props.className).toBe(
      'ui-card--interactive ui-card--glass custom-card'
    )
    expect(card.props['data-variant']).toBe('interactive')
    expect(card.props.uiClassName).toBe('ui-card')
  })

  test('renders Kanban layout and compact empty states', () => {
    const board = KanbanBoard({ 'aria-label': 'Delivery board' }) as ReactElement<
      KanbanBoardProps & { 'data-ui-kanban': boolean }
    >
    const column = KanbanColumn({ value: 'planned' }) as ReactElement<
      KanbanColumnProps & { 'data-ui-kanban-column': string }
    >
    const empty = Empty({ variant: 'compact' }) as ReactElement<EmptyProps>

    expect(board.props.className).toBe('ui-kanban-board ui-kanban')
    expect(board.props['data-ui-kanban']).toBe(true)
    expect(board.props.tabIndex).toBe(0)
    expect(column.props.className).toBe('ui-kanban__column')
    expect(column.props['data-ui-kanban-column']).toBe('planned')
    expect(empty.props.className).toBe('ui-empty ui-empty--compact')
  })

  test('supports a semantic root element and visual variant for stats', () => {
    const stat = Stat({
      as: 'article',
      children: 'Compared with last month',
      className: 'custom-stat',
      label: 'Revenue',
      value: '$42k',
      variant: 'accent'
    }) as ReactElement<
      StatProps<'article'> & { 'data-variant': string, uiClassName: string }
    >

    expect(stat.props.as).toBe('article')
    expect(stat.props.className).toBe('ui-stat--accent custom-stat')
    expect(stat.props['data-variant']).toBe('accent')
    expect(stat.props.uiClassName).toBe('ui-stat')
  })

  test('supports glass overlay surfaces', () => {
    const dialog = withHookDispatcher(
      () => Dialog({
        className: 'custom-dialog',
        glass: true,
        layout: 'fullscreen'
      }) as ReactElement<DialogProps & { 'data-layout': string }>
    )

    expect(dialog.props.className).toBe(
      'ui-dialog ui-dialog--fullscreen ui-dialog--glass custom-dialog'
    )
    expect(dialog.props['data-layout']).toBe('fullscreen')
    expect(dialog.props['data-surface']).toBe('glass')
  })

  test('supports glass on structural surfaces', () => {
    const alert = Alert({
      className: 'custom-alert',
      glass: true
    }) as ReactElement<AlertProps>
    const table = Table({
      className: 'custom-table',
      glass: true
    }) as ReactElement<TableProps>

    expect(alert.props.className).toBe('ui-alert ui-alert--glass custom-alert')
    expect(table.props.className).toBe(
      'ui-table-wrap ui-table-wrap--glass custom-table'
    )
  })

  test('renders inline and block code primitives', () => {
    const inlineCode = Code({
      children: 'const answer = 42',
      className: 'custom-code'
    }) as ReactElement
    const blockCode = Code({
      code: `
        const answer = "42";
      `,
      copy: true,
      label: 'Example',
      language: 'ts',
      theme: 'santi020k',
      variant: 'block',
      wrap: true
    }) as ReactElement
    const inlineProps = inlineCode.props as Record<string, unknown>
    const blockProps = blockCode.props as Record<string, unknown>
    const blockChildren = blockProps.children as ReactElement[]
    const header = blockChildren[0] as ReactElement<Record<string, unknown>>
    const headerProps = header.props
    const headerChildren = headerProps.children as ReactElement[]
    const copyButton = headerChildren[2] as ReactElement<
      Record<string, unknown>
    >
    const copyButtonProps = copyButton.props
    const pre = blockChildren[1] as ReactElement<Record<string, unknown>>
    const codeElement = pre.props.children as ReactElement<
      Record<string, unknown>
    >
    const tokenChildren = codeElement.props.children as (
      ReactElement<Record<string, unknown>> | string
    )[]
    const keyword = tokenChildren[0] as ReactElement<Record<string, unknown>>
    const stringToken = tokenChildren[6] as ReactElement<
      Record<string, unknown>
    >

    expect(inlineCode.type).toBe('code')
    expect(inlineProps.className).toBe('ui-code ui-code--inline custom-code')
    expect(inlineProps['data-code-theme']).toBe('auto')

    expect(blockCode.type).toBe('figure')
    expect(blockProps.className).toBe('ui-code ui-code--block ui-code--wrap')
    expect(blockProps['data-code-theme']).toBe('santi020k')
    expect(blockProps['data-language']).toBe('ts')
    expect(blockProps['data-ui-code']).toBe(true)
    expect(header.type).toBe('figcaption')
    expect(copyButtonProps['data-ui-code-copy']).toBe(true)
    expect(keyword.props.className).toBe('ui-code__token--keyword')
    expect(stringToken.props.className).toBe('ui-code__token--string')
  })

  test('renders a repeatable watermark tile from its content and layout props', () => {
    const watermark = Watermark({
      children: 'Protected content',
      content: 'Draft & review',
      gap: 144,
      rotate: -30
    }) as ReactElement
    const props = watermark.props as Record<string, unknown>
    const style = props.style as Record<string, string>

    expect(style['--ui-watermark-gap']).toBe('144px')
    expect(style['--ui-watermark-image']).toContain('data:image/svg+xml')
    const watermarkImage = decodeURIComponent(
      style['--ui-watermark-image'] ?? ''
    )

    expect(watermarkImage).toContain('Draft &amp; review')
    expect(watermarkImage).toContain('rotate(-30 72 72)')
    expect(watermarkImage).toContain(
      'font-family="Montserrat, Avenir Next, Segoe UI, sans-serif"'
    )
  })

  test('defaults inputs to text fields', () => {
    const ref = React.createRef<HTMLInputElement>()
    const input = renderComponent(
      Input, {
        className: 'custom-input',
        size: 32
      }, ref
    ) as ReactElement<InputProps & { ref?: React.Ref<HTMLInputElement> }>

    expect(input.props.className).toBe('ui-input custom-input')
    expect(input.props.ref).toBe(ref)
    expect(input.props.size).toBe(32)
    expect(input.props.type).toBe('text')
  })

  test('renders calendar grid and hidden input', () => {
    const calendar = withHookDispatcher(
      () => Calendar({
        month: '2026-07',
        name: 'delivery',
        value: '2026-07-10'
      }) as ReactElement
    )
    const calendarProps = calendar.props as Record<string, unknown>
    const children = calendarProps.children as ReactElement<
      Record<string, unknown>
    >[]
    const input = children[0]
    const header = children[1]
    const table = children[2]
    const label = (
      header?.props.children as ReactElement<Record<string, unknown>>[]
    )[1]
    const body = (
      table?.props.children as ReactElement<Record<string, unknown>>[]
    )[1]
    const firstRow = (
      body?.props.children as ReactElement<Record<string, unknown>>[]
    )[0]
    const firstDay = (
      firstRow?.props.children as ReactElement<Record<string, unknown>>[]
    )[0]

    expect(calendarProps.className).toBe('ui-calendar')
    expect(calendarProps['data-ui-calendar']).toBe(true)
    expect(input?.props.name).toBe('delivery')
    expect(input?.props.value).toBe('2026-07-10')
    expect(label?.props.children).toBe('July 2026')
    expect(table?.props.role).toBe('grid')
    expect(firstDay?.props['data-date']).toBe('2026-06-29')
  })

  test('renders DatePicker as a custom Calendar disclosure', () => {
    const picker = withHookDispatcher(
      () => DatePicker({
        'aria-label': 'Launch date',
        defaultValue: '2026-07-24',
        glass: 'subtle'
      }) as ReactElement
    )
    const rootProps = picker.props as Record<string, unknown>
    const children = rootProps.children as ReactElement<
      Record<string, unknown>
    >[]
    const native = children[0]
    const control = children[1]
    const controlChildren = control?.props.children as ReactElement<
      Record<string, unknown>
    >[]
    const trigger = controlChildren[0]
    const popover = controlChildren[1]
    const calendar = popover?.props.children as ReactElement

    expect(rootProps['data-ui-date-picker']).toBe(true)
    expect(rootProps.className).toBe(
      'ui-date-picker-field ui-date-picker-field--glass ui-glass-subtle'
    )
    expect(rootProps['data-ui-glass-track']).toBe(true)
    expect(native?.props.type).toBe('date')
    expect(native?.props['data-ui-enhanced']).toBe('true')
    expect(native?.props.tabIndex).toBe(-1)
    expect(trigger?.props['aria-label']).toBe('Launch date')
    expect(trigger?.props['aria-expanded']).toBe(false)
    expect(popover?.props.hidden).toBe(true)
    expect(calendar.type).toBe(Calendar)
  })

  test('renders Select glass intensity on its enhanced field wrapper', () => {
    const select = withHookDispatcher(
      () => Select({
        glass: 'strong',
        options: ['Astro', 'React'],
        placeholder: 'Choose a framework'
      }) as ReactElement
    )
    const rootProps = select.props as Record<string, unknown>

    expect(rootProps.className).toBe(
      'ui-select-field ui-select-field--glass ui-glass-strong'
    )
    expect(rootProps['data-ui-glass-track']).toBe(true)
  })

  test('renders DateRangePicker as a synchronized custom range control', () => {
    const range = withHookDispatcher(
      () => DateRangePicker({
        children: 'Range'
      }) as ReactElement
    )
    const rangeProps = range.props as Record<string, unknown>

    expect(rangeProps.className).toBe('ui-date-range-picker')
    expect(rangeProps['data-ui-date-range-picker']).toBe(true)
    expect(rangeProps.onInput).toBeTypeOf('function')
  })

  test('exposes calendar selection helpers', () => {
    const changes: string[] = []
    const calendar = withHookDispatcher(() => useCalendar({
      month: '2026-07',
      onValueChange: value => {
        changes.push(value)
      }
    }))

    calendar.selectDate('2026-07-15')

    expect(calendar.month).toBe('2026-07')
    expect(changes).toEqual(['2026-07-15'])
    expect(calendar.previousProps['data-ui-calendar-prev']).toBe(true)
    expect(calendar.nextProps['data-ui-calendar-next']).toBe(true)
  })

  test('renders input OTP as native input plus visual segments', () => {
    const otp = withHookDispatcher(
      () => InputOTP({
        defaultValue: '12a3',
        length: 4,
        name: 'code'
      }) as ReactElement
    )
    const otpProps = otp.props as Record<string, unknown>
    const children = otpProps.children as ReactElement<
      Record<string, unknown>
    >[]
    const nativeInput = children[0]
    const segmentsRoot = children[1]
    const segments = segmentsRoot?.props.children as ReactElement<
      Record<string, unknown>
    >[]
    const firstSegment = segments[0]
    const firstChar = firstSegment?.props.children as ReactElement<
      Record<string, unknown>
    >

    expect(otp.type).toBe('div')
    expect(otpProps.className).toBe('ui-input-otp-field')
    expect(otpProps['data-ui-input-otp']).toBe(true)
    expect(nativeInput?.props.className).toBe(
      'ui-input-otp ui-input-otp__native'
    )
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
      onValueChange: value => {
        changes.push(value)
      }
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

  test('sanitizes input OTP setValue and exposes native input props', () => {
    const changes: string[] = []
    const otp = withHookDispatcher(() => useInputOTP({
      invalid: true,
      length: 4,
      onValueChange: value => {
        changes.push(value)
      }
    }))
    const inputProps = otp.getInputProps()

    expect(inputProps.autoComplete).toBe('one-time-code')
    expect(inputProps.maxLength).toBe(4)
    expect(inputProps.className).toBe('ui-input-otp ui-input-otp__native')
    expect(inputProps['data-ui-input-otp-native']).toBe(true)
    expect(inputProps['aria-invalid']).toBe(true)

    expect(otp.setValue('12ab99')).toBe('1299')
    expect(changes).toEqual(['1299'])
  })

  test('renders input OTP segment characters with placeholder padding', () => {
    const otp = withHookDispatcher(() => useInputOTP({ defaultValue: '12', length: 4 }))

    expect(otp.segmentIndexes).toEqual([0, 1, 2, 3])
    expect(otp.getSegmentChar(0)).toBe('1')
    expect(otp.getSegmentChar(1)).toBe('2')
    expect(otp.getSegmentChar(2)).toBe(' ')
  })

  test('exposes form validation and field contracts', () => {
    const field = Field({
      children: 'Email',
      controlId: 'email',
      describedBy: 'email-hint'
    }) as ReactElement<FieldProps>
    const fieldProps = field.props as FieldProps &
      Record<`data-${string}`, unknown>
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
      onRangeChange: detail => {
        changes.push(detail)
      }
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
    const documentDescriptor = Object.getOwnPropertyDescriptor(
      globalThis, 'document'
    )
    const execCommand = vi.fn(() => true)
    const commands: string[] = []

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { execCommand }
    })

    try {
      const editor = withHookDispatcher(() => useRichTextEditor({
        onCommand: detail => {
          commands.push(detail.command)
        }
      }))
      const commandProps = editor.getCommandProps('bold', {
        'data-ui-editor-value': 'strong'
      })
      const editableProps = editor.getEditableProps()

      expect(editor.rootProps['data-ui-rich-text-editor']).toBe(true)
      expect(commandProps['data-ui-editor-command']).toBe('bold')
      expect(commandProps.type).toBe('button')
      expect(editableProps['data-ui-rich-text-editable']).toBe(true)
      expect(editableProps.role).toBe('textbox')

      commandProps.onClick?.({
        currentTarget: {
          closest: vi.fn(() => null),
          dataset: { uiEditorValue: 'strong' }
        }
      } as unknown as Parameters<NonNullable<typeof commandProps.onClick>>[0])

      expect(execCommand).toHaveBeenCalledWith('bold', false, 'strong')
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
      onChange: detail => {
        changes.push(detail)
      }
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

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'text/plain', 'schedule-planning'
    )
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

  test('emits controlled Kanban move requests without moving items', () => {
    const changes: unknown[] = []
    const kanban = withHookDispatcher(() => useKanban({
      onMoveRequest: detail => changes.push(detail)
    }))
    const accepted = kanban.requestMove({
      fromColumn: 'inbox',
      input: 'keyboard',
      itemId: 'feedback-1',
      toColumn: 'planned'
    })

    expect(accepted).toBe(true)
    expect(changes).toEqual([{
      fromColumn: 'inbox',
      input: 'keyboard',
      itemId: 'feedback-1',
      toColumn: 'planned'
    }])
    expect(kanban.rootRef.current).toBeNull()
  })

  test('clears Kanban pointer state when a drag is canceled', () => {
    const changes: unknown[] = []
    const kanban = withHookDispatcher(() => useKanban({
      onMoveRequest: detail => changes.push(detail)
    }))
    const column = {
      dataset: { state: 'drop-target', uiKanbanColumn: 'inbox' }
    } as unknown as HTMLElement
    const item = {
      closest: vi.fn(() => column),
      dataset: { state: 'dragging', uiKanbanItem: 'feedback-1' }
    } as unknown as HTMLElement
    const root = {
      dataset: {},
      querySelectorAll: vi.fn((selector: string) => selector === '[data-ui-kanban-item]' ?
        [item] :
        [column])
    } as unknown as HTMLElement
    const handle = {
      closest: vi.fn(() => root)
    } as unknown as HTMLButtonElement
    const handleProps = kanban.getHandleProps('feedback-1')

    handleProps.onPointerDown?.({
      clientX: 12,
      clientY: 18,
      currentTarget: handle,
      pointerId: 7,
      pointerType: 'touch'
    } as Parameters<NonNullable<typeof handleProps.onPointerDown>>[0])
    handleProps.onPointerCancel?.({
      currentTarget: handle,
      pointerId: 7
    } as Parameters<NonNullable<typeof handleProps.onPointerCancel>>[0])

    expect(item.dataset.state).toBeUndefined()
    expect(column.dataset.state).toBeUndefined()

    handleProps.onPointerUp?.({
      clientX: 40,
      clientY: 18,
      currentTarget: handle,
      pointerId: 7
    } as Parameters<NonNullable<typeof handleProps.onPointerUp>>[0])

    expect(changes).toEqual([])
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
    const tableChildren = renderedTable.props.children as ReactElement<
      Record<string, unknown>
    >[]
    const [thead, tbody] = tableChildren

    if (!thead || !tbody)
      throw new Error('Expected DataTable to render table sections.')

    const headerRow = thead.props.children as ReactElement<
      Record<string, unknown>
    >
    const headers = headerRow.props.children as ReactElement<
      Record<string, unknown>
    >[]
    const rows = tbody.props.children as ReactElement<
      Record<string, unknown>
    >[]
    const firstRowCells = rows[0]?.props.children as ReactElement<
      Record<string, unknown>
    >[]
    const virtualList = VirtualList({
      itemSize: 48,
      overscan: 2
    }) as ReactElement<Record<string, unknown>>

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
    const resizable = withHookDispatcher(
      () => Resizable({
        children: [
          React.createElement('aside', { key: 'nav' }, 'Navigation'),
          React.createElement('main', { key: 'main' }, 'Editor')
        ],
        defaultSizes: [25, 75]
      }) as ReactElement
    )
    const resizableProps = resizable.props as Record<string, unknown>
    const children = resizableProps.children as ReactElement<
      Record<string, unknown>
    >[]
    const firstFragmentChildren = children[0]?.props.children as ReactElement<
      Record<string, unknown>
    >[]
    const firstPane = firstFragmentChildren[0]
    const firstHandle = firstFragmentChildren[1]

    expect(resizableProps.className).toBe('ui-resizable')
    expect(resizableProps['data-ui-resizable']).toBe(true)
    expect(firstPane?.props['data-ui-resizable-panel']).toBe(true)
    expect(
      (firstPane?.props.style as Record<string, string>)['--ui-resizable-size']
    ).toBe('25%')
    expect(firstHandle?.props.className).toBe('ui-resizable__handle')
    expect(firstHandle?.props.role).toBe('separator')
    expect(firstHandle?.props['aria-orientation']).toBe('vertical')
  })

  test('exposes resizable keyboard sizing props', () => {
    const changes: number[][] = []
    const resizable = withHookDispatcher(() => useResizable({
      defaultSizes: [30, 70],
      onSizesChange: sizes => {
        changes.push(sizes)
      },
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

  test('resizes with keyboard steps, bounds, and double-click reset', () => {
    const changes: number[][] = []
    const resizable = withHookDispatcher(() => useResizable({
      defaultSizes: [30, 70],
      onSizesChange: sizes => {
        changes.push(sizes)
      },
      panelCount: 2
    }))
    const handle = resizable.getHandleProps(0)
    const key = (init: { key: string, shiftKey?: boolean }): void => {
      handle.onKeyDown?.({
        preventDefault: vi.fn(),
        shiftKey: false,
        ...init
      } as unknown as Parameters<NonNullable<typeof handle.onKeyDown>>[0])
    }

    key({ key: 'ArrowLeft' })
    expect(changes.at(-1)).toEqual([28, 72])

    key({ key: 'ArrowRight', shiftKey: true })
    expect(changes.at(-1)).toEqual([40, 60])

    key({ key: 'Home' })
    expect(changes.at(-1)).toEqual([12, 88])

    key({ key: 'End' })
    expect(changes.at(-1)).toEqual([88, 12])

    handle.onDoubleClick?.(
      {} as Parameters<NonNullable<typeof handle.onDoubleClick>>[0]
    )
    expect(changes.at(-1)).toEqual([30, 70])

    expect(handle['aria-valuemin']).toBe(12)
    expect(handle['aria-valuemax']).toBe(88)
    expect(handle['aria-valuenow']).toBe(30)
    expect(
      (resizable.getPanelProps(0).style as Record<string, string>)[
        '--ui-resizable-size'
      ]
    ).toBe('30%')
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
      onOpenChange: open => {
        changes.push(open)
      }
    }))

    expect(contextMenu.triggerProps['data-ui-context-menu-trigger']).toBe(
      'actions-menu'
    )
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
    } as unknown as Parameters<
      NonNullable<typeof contextMenu.triggerProps.onContextMenu>
    >[0])

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
    expect(theme.tokens['glass-bg']).toBeTypeOf('string')
    expect(theme.tokens['glass-shadow']).toBeTypeOf('string')
    expect(
      theme.previewStyle['--brand' as keyof typeof theme.previewStyle]
    ).toBe('260 88% 60%')
    expect(theme.exportValue).toContain('color-scheme: dark;')
    expect(theme.exportValue).toContain('--glass-bg:')
    expect(theme.hueProps['data-ui-theme-brand-hue']).toBe(true)
    expect(theme.accentHueProps['data-ui-theme-accent-hue']).toBe(true)
    expect(theme.outputProps.value).toContain('--brand: 260 88% 60%;')
    expect(manualMode['data-ui-theme-mode']).toBe('manual')
    expect(manualMode['aria-pressed']).toBe(false)
    expect(figmaFormat['data-ui-theme-export-format']).toBe('figma')
  })

  test('exposes theme builder scheme, hue, and color control props', () => {
    const schemes: string[] = []
    const hues: number[] = []
    const theme = withHookDispatcher(() => useThemeBuilder({
      defaultHue: 260,
      defaultScheme: 'dark',
      onHueChange: value => {
        hues.push(value)
      },
      onSchemeChange: value => {
        schemes.push(value)
      }
    }))

    expect(theme.getSchemeProps('dark')['aria-pressed']).toBe(true)
    expect(theme.getSchemeProps('light')['aria-pressed']).toBe(false)
    expect(theme.getSchemeProps('dark')['data-ui-theme-scheme']).toBe('dark')
    expect(theme.hueProps.min).toBe(0)
    expect(theme.hueProps.max).toBe(359)
    expect(theme.hueProps.type).toBe('range')
    expect(theme.hueProps.value).toBe(260)
    expect(theme.primaryColorProps.type).toBe('color')
    expect(theme.secondaryColorProps.type).toBe('color')
    expect(theme.exportButtonProps.type).toBe('button')
    expect(theme.outputProps.readOnly).toBe(true)

    theme
      .getSchemeProps('light')
      .onClick?.(
        {} as Parameters<
          NonNullable<ReturnType<typeof theme.getSchemeProps>['onClick']>
        >[0]
      )
    expect(schemes).toEqual(['light'])

    theme.hueProps.onChange?.({
      currentTarget: { value: '120' }
    } as unknown as Parameters<NonNullable<typeof theme.hueProps.onChange>>[0])
    expect(hues).toEqual([120])
  })

  test('exposes tooltip escape-dismissable aria state', () => {
    const tooltip = withHookDispatcher(() => useTooltip({ defaultOpen: true }))

    expect(tooltip.rootProps['data-ui-tooltip']).toBe(true)
    expect(tooltip.rootProps['aria-describedby']).toMatch(/^ui-tooltip-/)
    expect(tooltip.tooltipProps.role).toBe('tooltip')
    expect(tooltip.tooltipProps.hidden).toBe(false)
  })

  test('exposes toast provider controller api', () => {
    const provider = withHookDispatcher(
      () => ToastProvider({ maxCount: 2, placement: 'top-right' }) as ReactElement<{
        value: {
          create: (detail: { title: string }) => string
          dismiss: (id?: string) => void
          update: (id: string, detail: { title: string }) => void
        }
      }>
    )
    const id = provider.props.value.create({ title: 'Saved' })

    expect(id).toMatch(/^ui-toast-/)
    expect(provider.props.value.update).toBeTypeOf('function')
    expect(provider.props.value.dismiss).toBeTypeOf('function')
  })

  test('exposes modal dialog aria contracts and open toggles', () => {
    const changes: boolean[] = []
    const dialog = withHookDispatcher(() => useDialog({
      onOpenChange: open => {
        changes.push(open)
      }
    }))

    expect(dialog.dialogProps.role).toBe('dialog')
    expect(dialog.dialogProps['aria-modal']).toBe(true)
    expect(dialog.dialogProps['data-ui-dialog']).toBe(true)
    expect(dialog.dialogProps['data-ui-alert-dialog']).toBeUndefined()
    expect(dialog.triggerProps['aria-haspopup']).toBe('dialog')
    expect(dialog.triggerProps.type).toBe('button')
    expect(dialog.closeProps.type).toBe('button')

    dialog.triggerProps.onClick?.(
      {} as Parameters<NonNullable<typeof dialog.triggerProps.onClick>>[0]
    )
    dialog.closeProps.onClick?.(
      {} as Parameters<NonNullable<typeof dialog.closeProps.onClick>>[0]
    )

    expect(changes).toEqual([true, false])
  })

  test('closes non-alert dialogs on backdrop click but keeps alerts modal', () => {
    const alertChanges: boolean[] = []
    const alert = withHookDispatcher(() => useDialog({
      alert: true,
      onOpenChange: open => {
        alertChanges.push(open)
      }
    }))

    expect(alert.dialogProps.role).toBe('alertdialog')
    expect(alert.dialogProps['data-ui-alert-dialog']).toBe(true)
    expect(alert.dialogProps['data-ui-dialog']).toBeUndefined()

    alert.dialogProps.onClick?.({
      target: null
    } as unknown as Parameters<
      NonNullable<typeof alert.dialogProps.onClick>
    >[0])

    expect(alertChanges).toEqual([])

    const dialogChanges: boolean[] = []
    const dialog = withHookDispatcher(() => useDialog({
      onOpenChange: open => {
        dialogChanges.push(open)
      }
    }))

    dialog.dialogProps.onClick?.({
      target: null
    } as unknown as Parameters<
      NonNullable<typeof dialog.dialogProps.onClick>
    >[0])

    expect(dialogChanges).toEqual([false])
  })

  test('requires a toast provider ancestor', () => {
    expect(() => withHookDispatcher(() => useToast())).toThrow(
      'useToast must be used inside a ToastProvider.'
    )
  })

  test('activates tabs through trigger clicks', () => {
    const changes: string[] = []
    const tabs = withHookDispatcher(() => useTabs({
      defaultValue: 'overview',
      onValueChange: value => {
        changes.push(value)
      }
    }))
    const settings = tabs.getTriggerProps('settings')

    settings.onClick?.(
      {} as Parameters<NonNullable<typeof settings.onClick>>[0]
    )

    expect(changes).toEqual(['settings'])
  })

  test('selects enabled options and ignores disabled ones', () => {
    const changes: string[] = []
    const select = withHookDispatcher(() => useSelect({
      onValueChange: value => {
        changes.push(value)
      },
      options: [
        'Alpha',
        { label: 'Beta', value: 'beta' },
        { disabled: true, label: 'Gamma', value: 'gamma' }
      ]
    }))
    const beta = select.getOptionProps({ label: 'Beta', value: 'beta' })
    const gamma = select.getOptionProps({
      disabled: true,
      label: 'Gamma',
      value: 'gamma'
    })

    expect(gamma['aria-disabled']).toBe('true')
    expect(gamma.disabled).toBe(true)

    gamma.onClick?.({} as Parameters<NonNullable<typeof gamma.onClick>>[0])
    expect(changes).toEqual([])

    beta.onClick?.({} as Parameters<NonNullable<typeof beta.onClick>>[0])
    expect(changes).toEqual(['beta'])
  })

  test('falls back to the default select trigger label', () => {
    const empty = withHookDispatcher(() => useSelect())
    const placeholder = withHookDispatcher(() => useSelect({ placeholder: 'Choose' }))

    expect(empty.triggerText).toBe('Select an option')
    expect(empty.rootProps['data-placeholder']).toBe('true')
    expect(placeholder.triggerText).toBe('Choose')
  })

  test('syncs the native select change back to state', () => {
    const changes: string[] = []
    const select = withHookDispatcher(() => useSelect({
      onValueChange: value => {
        changes.push(value)
      },
      options: ['Alpha', 'Beta']
    }))

    select.nativeSelectProps.onChange?.({
      currentTarget: { value: 'Beta' }
    } as unknown as Parameters<
      NonNullable<typeof select.nativeSelectProps.onChange>
    >[0])

    expect(changes).toEqual(['Beta'])
  })

  test('toggles disclosure open state through the trigger', () => {
    const changes: boolean[] = []
    const popover = withHookDispatcher(() => usePopover({
      onOpenChange: open => {
        changes.push(open)
      }
    }))

    popover.triggerProps.onClick?.(
      {} as Parameters<NonNullable<typeof popover.triggerProps.onClick>>[0]
    )

    expect(changes).toEqual([true])
  })

  test('closes an open disclosure panel on Escape', () => {
    const changes: boolean[] = []
    const dropdown = withHookDispatcher(() => useDropdownMenu({
      defaultOpen: true,
      onOpenChange: open => {
        changes.push(open)
      }
    }))

    dropdown.panelProps.onKeyDown?.({
      key: 'Escape',
      preventDefault: vi.fn()
    } as unknown as Parameters<
      NonNullable<typeof dropdown.panelProps.onKeyDown>
    >[0])

    expect(changes).toEqual([false])
  })

  test('dismisses tooltips on mouse leave and Escape', () => {
    const changes: boolean[] = []
    const tooltip = withHookDispatcher(() => useTooltip({
      defaultOpen: true,
      onOpenChange: open => {
        changes.push(open)
      }
    }))

    tooltip.rootProps.onMouseLeave?.(
      {} as Parameters<NonNullable<typeof tooltip.rootProps.onMouseLeave>>[0]
    )
    tooltip.rootProps.onKeyDown?.({
      key: 'Escape'
    } as Parameters<NonNullable<typeof tooltip.rootProps.onKeyDown>>[0])

    expect(changes).toEqual([false, false])
  })

  test('opens tooltips after the scheduled focus delay', () => {
    vi.useFakeTimers()

    try {
      const changes: boolean[] = []
      const tooltip = withHookDispatcher(() => useTooltip({
        delay: 0,
        onOpenChange: open => {
          changes.push(open)
        }
      }))

      tooltip.rootProps.onFocus?.(
        {} as Parameters<NonNullable<typeof tooltip.rootProps.onFocus>>[0]
      )

      expect(changes).toEqual([])

      vi.advanceTimersByTime(0)

      expect(changes).toEqual([true])
    } finally {
      vi.useRealTimers()
    }
  })

  test('reflects field validity onto controls', () => {
    const validation = withHookDispatcher(() => useFormValidation())
    const control = {
      closest: () => null,
      dataset: {} as Record<string, string>,
      removeAttribute: vi.fn(),
      setAttribute: vi.fn()
    }

    validation.setFieldValidity(
      control as unknown as Parameters<typeof validation.setFieldValidity>[0], true, 'Required'
    )

    expect(control.setAttribute).toHaveBeenCalledWith('aria-invalid', 'true')
    expect(control.dataset.uiValidationInvalid).toBe('true')

    validation.setFieldValidity(
      control as unknown as Parameters<typeof validation.setFieldValidity>[0], false
    )

    expect(control.removeAttribute).toHaveBeenCalledWith('aria-invalid')
    expect(control.dataset.uiValidationInvalid).toBeUndefined()
  })

  test('treats detached controls as valid', () => {
    const validation = withHookDispatcher(() => useFormValidation())
    const control = {
      form: null,
      validity: { valid: true },
      value: ''
    }

    expect(
      validation.validateControl(
        control as unknown as Parameters<typeof validation.validateControl>[0]
      )
    ).toBe(true)
  })

  test('builds a six-week calendar grid with weekday and month labels', () => {
    const calendar = withHookDispatcher(() => useCalendar({
      month: '2026-07',
      name: 'delivery',
      value: '2026-07-10'
    }))

    expect(calendar.month).toBe('2026-07')
    expect(calendar.weekdays).toHaveLength(7)
    expect(calendar.weeks).toHaveLength(6)
    expect(calendar.weeks.every(week => week.length === 7)).toBe(true)
    expect(calendar.label).toContain('2026')
    expect(calendar.inputProps.name).toBe('delivery')
    expect(calendar.inputProps.type).toBe('hidden')
    expect(calendar.inputProps.value).toBe('2026-07-10')
    expect(calendar.previousProps.disabled).toBe(false)
    expect(calendar.nextProps.disabled).toBe(false)
  })

  test('clamps calendar selection to the max boundary and disables forward navigation', () => {
    const changes: string[] = []
    const calendar = withHookDispatcher(() => useCalendar({
      max: '2026-07-15',
      month: '2026-07',
      onValueChange: value => {
        changes.push(value)
      }
    }))

    calendar.selectDate('2026-07-20')

    expect(changes).toEqual(['2026-07-15'])
    expect(calendar.nextProps.disabled).toBe(true)
  })

  test('ignores calendar selection while disabled', () => {
    const changes: string[] = []
    const calendar = withHookDispatcher(() => useCalendar({
      disabled: true,
      month: '2026-07',
      onValueChange: value => {
        changes.push(value)
      }
    }))

    calendar.selectDate('2026-07-10')

    expect(changes).toEqual([])
    expect(calendar.rootProps['data-disabled']).toBe('true')
  })

  test('exposes calendar day cell props and click selection', () => {
    const changes: string[] = []
    const calendar = withHookDispatcher(() => useCalendar({
      month: '2026-07',
      onValueChange: value => {
        changes.push(value)
      }
    }))
    const firstOfMonth = calendar.weeks
      .flat()
      .find(day => day.date === '2026-07-01')

    if (!firstOfMonth)
      throw new Error('Expected 2026-07-01 in the calendar grid.')

    const dayProps = calendar.getDayProps(firstOfMonth)

    expect(dayProps.role).toBe('gridcell')
    expect(dayProps['data-date']).toBe('2026-07-01')
    expect(dayProps['data-ui-calendar-day']).toBe(true)

    dayProps.onClick?.(
      {} as Parameters<NonNullable<typeof dayProps.onClick>>[0]
    )

    expect(changes).toEqual(['2026-07-01'])
  })

  test('composes popover and dropdown surfaces over disclosure hooks', () => {
    const popover = withHookDispatcher(
      () => Popover({ glass: true }) as ReactElement<{ children: ReactElement }>
    )
    const dropdown = withHookDispatcher(
      () => DropdownMenu({ glass: true }) as ReactElement<{
        children: ReactElement
      }>
    )
    const popoverProps = popover.props.children.props as Record<
      string,
      unknown
    >
    const dropdownRoot = dropdown.props.children
    const dropdownProps = dropdownRoot.props as Record<string, unknown>

    expect(popoverProps.className).toBe('ui-popover ui-popover--glass')
    expect(popoverProps['data-surface']).toBe('glass')
    expect(popoverProps['data-ui-popover']).toBe(true)
    expect(dropdownRoot.type).toBe('menu')
    expect(dropdownProps.className).toBe('ui-menu ui-menu--glass')
    expect(dropdownProps['data-surface']).toBe('glass')
    expect(dropdownProps['data-ui-dropdown-menu']).toBe(true)
  })
})
