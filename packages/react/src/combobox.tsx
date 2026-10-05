'use client'

import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { composeClassName } from '@santi020k/lumen-core'

const emptyOptions: string[] = []
const isOptions = (value: unknown): value is string[] => Array.isArray(value) && Array.from(value).every(option => typeof option === 'string')

const ignoresComboboxKeyboard = (
  event: KeyboardEvent,
  composing: boolean
): boolean => event.defaultPrevented || event.nativeEvent.isComposing || composing ||
  event.altKey || event.ctrlKey || event.metaKey

const comboboxActiveId = (
  list: string,
  expanded: boolean,
  index: number
): string | undefined => expanded && index >= 0 ? `${list}-option-${index}` : undefined

const comboboxIsExpanded = (
  open: boolean,
  disabled?: boolean,
  readOnly?: boolean
): boolean => open && !disabled && !readOnly

export interface ComboboxProps extends ComponentPropsWithoutRef<'input'> {
  label?: ReactNode
  list: string
  options?: string[]
  wrapperClassName?: string
}

export const Combobox = ({
  className,
  defaultValue,
  disabled,
  readOnly,
  form,
  id,
  label,
  list,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  options: rawOptions = emptyOptions,
  type = 'text',
  value: valueProp,
  wrapperClassName,
  ...props
}: ComboboxProps) => {
  const options = isOptions(rawOptions) ? rawOptions : emptyOptions
  const inputId = id ?? `${list}-input`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeValue, setActiveValue] = useState<string>()
  const composingRef = useRef(false)
  const [value, setValue] = useState(() => String(defaultValue ?? ''))
  const renderedValue = valueProp ?? value
  const query = String(renderedValue).trim().toLowerCase()

  const visibleOptions = useMemo(
    () => options.filter(
      option => !query || option.toLowerCase().includes(query)
    ), [options, query]
  )

  const activeIndex = activeValue === undefined ? -1 : visibleOptions.indexOf(activeValue)
  const expanded = comboboxIsExpanded(open, disabled, readOnly)
  const activeId = comboboxActiveId(list, expanded, activeIndex)

  const close = (): void => {
    setOpen(false)

    setActiveValue(undefined)
  }

  const selectOption = (option: string): void => {
    const input = rootRef.current?.querySelector('input')

    if (!input || disabled || readOnly) return

    // Use the native setter so React's change event observes the selected value.
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')

    descriptor?.set?.call(input, option)

    input.dispatchEvent(new Event('input', { bubbles: true }))

    if (valueProp === undefined) setValue(option)

    input.focus({ preventScroll: true })

    close()
  }

  const navigate = (key: string): void => {
    setOpen(true)

    const index = expanded ? activeIndex : -1
    let next = (index + 1) % visibleOptions.length

    if (key === 'ArrowUp') {
      next = index < 0 ? visibleOptions.length - 1 : (index - 1 + visibleOptions.length) % visibleOptions.length
    }

    setActiveValue(visibleOptions[next])
  }

  const commitActive = (event: KeyboardEvent<HTMLInputElement>): void => {
    const option = visibleOptions[activeIndex]

    if (!expanded || option === undefined) return

    event.preventDefault()

    selectOption(option)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    onKeyDown?.(event)

    if (ignoresComboboxKeyboard(event, composingRef.current) || disabled || readOnly) return

    switch (event.key) {
      case 'Escape':
        if (!expanded) return

        event.preventDefault()

        close()

        break

      case 'ArrowDown':
        event.preventDefault()

        navigate(event.key)

        break

      case 'ArrowUp':
        event.preventDefault()

        navigate(event.key)

        break

      case 'Enter':
        commitActive(event)

        break
    }
  }

  useEffect(() => {
    const option = activeId ? rootRef.current?.ownerDocument.getElementById(activeId) : null

    if (typeof option?.scrollIntoView === 'function') option.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  useEffect(() => {
    const input = rootRef.current?.querySelector('input')
    const owner = input?.form
    let active = true
    let resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

    const reset = (event: Event) => {
      globalThis.clearTimeout(resetTimer)

      resetTimer = globalThis.setTimeout(() => {
        if (!active || event.defaultPrevented || !input?.isConnected) return

        if (valueProp === undefined) setValue(String(defaultValue ?? ''))

        setOpen(false)

        setActiveValue(undefined)
      })
    }

    owner?.addEventListener('reset', reset)

    return () => {
      active = false

      globalThis.clearTimeout(resetTimer)

      owner?.removeEventListener('reset', reset)
    }
  }, [defaultValue, form, valueProp])

  return (
    <div
      className={composeClassName('ui-combobox', wrapperClassName)}
      data-ui-combobox
      onBlur={event => {
        const nextTarget = event.relatedTarget

        if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
          close()
        }
      }}
      ref={rootRef}
    >
      {label && (
        <label className="ui-label" htmlFor={inputId} id={`${inputId}-label`}>
          {label}
        </label>
      )}
      <input
        {...props}
        aria-autocomplete="list"
        aria-controls={list}
        aria-expanded={expanded}
        aria-activedescendant={activeId}
        className={composeClassName('ui-input', className)}
        id={inputId}
        disabled={disabled}
        form={form}
        readOnly={readOnly}
        role="combobox"
        type={type}
        value={renderedValue}
        onBlur={onBlur}
        onChange={event => {
          if (valueProp === undefined) {
            setValue(event.currentTarget.value)
          }

          setActiveValue(undefined)

          setOpen(true)

          onChange?.(event)
        }}
        onFocus={event => {
          if (!disabled && !readOnly) setOpen(true)

          onFocus?.(event)
        }}
        onKeyDown={handleKeyDown}
        onCompositionStart={event => {
          composingRef.current = true

          props.onCompositionStart?.(event)
        }}
        onCompositionEnd={event => {
          composingRef.current = false

          props.onCompositionEnd?.(event)
        }}
      />
      <div
        className="ui-combobox__list"
        hidden={!expanded}
        id={list}
        role="listbox"
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby'] ?? (label ? `${inputId}-label` : undefined)}
      >
        {visibleOptions.map((option, index) => (
          <button
            id={`${list}-option-${index}`}
            aria-selected={activeId === `${list}-option-${index}`}
            data-ui-combobox-option
            data-value={option}
            key={option}
            role="option"
            tabIndex={-1}
            type="button"
            onClick={() => {
              selectOption(option)
            }}
            onMouseDown={event => {
              event.preventDefault()
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
