import { readFile } from 'node:fs/promises'

import { lumenComponentNames } from '@santi020k/lumen-core'

import { describe, expect, test } from 'vitest'

/* cspell:ignore datatable */

const packageRoot = new URL('.', import.meta.url)

describe('@santi020k/lumen-astro package surface', () => {
  test('ships one Astro component file per shared component name', async () => {
    await expect(Promise.all(
      lumenComponentNames.map(componentName =>
        readFile(new URL(`./components/${componentName}.astro`, packageRoot), 'utf8')
      )
    )).resolves.toHaveLength(lumenComponentNames.length)
  })

  test('keeps runtime exports mirrored in TypeScript declarations', async () => {
    const [runtime, declarations] = await Promise.all([
      readFile(new URL('./index.ts', packageRoot), 'utf8'),
      readFile(new URL('./index.d.ts', packageRoot), 'utf8')
    ])

    expect(declarations).toBe(runtime)
  })

  test('documents every component export from the package index', async () => {
    const index = await readFile(new URL('./index.ts', packageRoot), 'utf8')

    for (const componentName of lumenComponentNames) {
      expect(index).toContain(`export { default as ${componentName} }`)
      expect(index).toContain(`./components/${componentName}.astro`)
    }
  })

  test('uses the public runtime and CSS files referenced by package exports', async () => {
    const packageJson = JSON.parse(await readFile(new URL('./package.json', packageRoot), 'utf8')) as {
      exports: Record<string, string | { import?: string }>
    }

    expect(packageJson.exports['./runtime']).toBe('./runtime/UIPrimitives.astro')
    expect(packageJson.exports['./styles.css']).toBe('./styles/lumen.css')

    await expect(readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8')).resolves.toContain('<script>')
    await expect(readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')).resolves.toContain('.ui-button')
  })

  test('ships glass styles for overlay and structural surfaces', async () => {
    const css = await readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')

    expect(css).toContain('.ui-dialog--glass')
    expect(css).toContain('.ui-alert--glass')
    expect(css).toContain('.ui-table-wrap--glass')
    expect(css).toContain('@supports not ((backdrop-filter: blur(1px))')
  })

  test('ships the code primitive markup and standalone styles', async () => {
    const [component, styles] = await Promise.all([
      readFile(new URL('./components/Code.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(component).toContain('code?: string')
    expect(component).toContain('renderLumenCodeHtml')
    expect(component).toContain("variant = 'inline'")
    expect(component).toContain('data-ui-code-copy')
    expect(component).toContain('Copy code to clipboard')
    expect(styles).toContain('.ui-code--inline')
    expect(styles).toContain('.ui-code--block')
    expect(styles).toContain('.ui-code__copy')
  })

  test('ships Select as a progressively enhanced listbox distinct from NativeSelect', async () => {
    const [select, nativeSelect, runtime, styles] = await Promise.all([
      readFile(new URL('./components/Select.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/NativeSelect.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(nativeSelect).toContain('<select class:list')
    expect(nativeSelect).not.toContain('data-ui-select-trigger')
    expect(select).toContain('data-ui-select-native')
    expect(select).toContain('data-ui-select-trigger')
    expect(select).toContain('role="listbox"')
    expect(select).toContain('data-ui-select-option')
    expect(runtime).toContain('const initSelects = (scope: ParentNode): void =>')
    expect(runtime).toContain("select.dispatchEvent(new Event('change', { bubbles: true }))")
    expect(styles).toContain('.ui-select__list')
  })

  test('keeps audited primitive semantics and examples documented', async () => {
    const [
      avatar,
      breadcrumbExample,
      combobox,
      comboboxExample,
      docs,
      dropdownMenu,
      nativeSelectExample,
      runtime
    ] = await Promise.all([
      readFile(new URL('./components/Avatar.astro', packageRoot), 'utf8'),
      readFile(new URL('../../apps/docs/src/examples/Breadcrumb.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/Combobox.astro', packageRoot), 'utf8'),
      readFile(new URL('../../apps/docs/src/examples/Combobox.astro', packageRoot), 'utf8'),
      readFile(new URL('../../apps/docs/src/data/docs.ts', packageRoot), 'utf8'),
      readFile(new URL('./components/DropdownMenu.astro', packageRoot), 'utf8'),
      readFile(new URL('../../apps/docs/src/examples/NativeSelect.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8')
    ])

    expect(avatar).toContain("Astro.slots.has('default')")
    expect(avatar).toContain("fallback ?? (!src && !hasDefaultSlot ? '?' : undefined)")
    expect(breadcrumbExample).toContain('<ol>')
    expect(breadcrumbExample).toContain('aria-current="page"')
    expect(combobox).toContain('type ComboboxOption = Option | string')
    expect(combobox).toContain('aria-disabled={option.disabled')
    expect(comboboxExample).toContain("value: 'web-components'")
    expect(docs).toContain('Use an ordered list inside the nav')
    expect(docs).toContain('data-ui-editor-command')
    expect(docs).toContain('bold | italic | underline')
    expect(dropdownMenu).toContain("interface Props extends HTMLAttributes<'div'>")
    expect(dropdownMenu).toContain('<div')
    expect(dropdownMenu).not.toContain('<menu')
    expect(nativeSelectExample).toContain('size="lg"')
    expect(nativeSelectExample).toContain('disabled')
    expect(runtime).toContain("trigger.setAttribute('aria-describedby'")
    expect(runtime).toContain("tip.id = `ui-tooltip-${crypto.randomUUID()}`")
    expect(runtime).toContain("item.getAttribute('aria-disabled') !== 'true'")
  })

  test('ships Resizable as an enhanced split panel with accessible handles', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/Resizable.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(component).toContain('data-ui-resizable')
    expect(component).toContain('data-ui-resizable-handle')
    expect(component).toContain('data-ui-resizable-default-sizes')
    expect(component).toContain('direction')
    expect(runtime).toContain('const initResizableGroups = (scope: ParentNode): void =>')
    expect(runtime).toContain("handle.setAttribute('role', 'separator')")
    expect(runtime).toContain("handle.addEventListener('pointerdown'")
    expect(runtime).toContain("event.key === 'Home'")
    expect(styles).toContain('.ui-resizable__handle')
    expect(styles).toContain('[data-ui-resizable-panel]')
  })

  test('ships InputOTP as a native input enhanced into segments', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/InputOTP.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(component).toContain('autocomplete')
    expect(component).toContain('data-ui-input-otp-native')
    expect(component).toContain('data-ui-input-otp-segment')
    expect(runtime).toContain('const initInputOtpFields = (scope: ParentNode): void =>')
    expect(runtime).toContain('const sanitizeOtpValue = (input: HTMLInputElement')
    expect(runtime).toContain("input.addEventListener('paste'")
    expect(runtime).toContain("input.dispatchEvent(new Event('change', { bubbles: true }))")
    expect(styles).toContain('.ui-input-otp__segments')
    expect(styles).toContain('.ui-input-otp__native[data-ui-enhanced="true"]')
  })

  test('ships Calendar as a form-backed ARIA grid with runtime month navigation', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/Calendar.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(component).toContain('value?: string')
    expect(component).toContain('month?: string')
    expect(component).toContain('min?: string')
    expect(component).toContain('max?: string')
    expect(component).toContain('name?: string')
    expect(component).toContain('data-ui-calendar-input')
    expect(component).toContain('data-ui-calendar-prev')
    expect(component).toContain('data-ui-calendar-next')
    expect(component).toContain('role="grid"')
    expect(component).toContain('role="gridcell"')
    expect(component).toContain('aria-selected={selectedIso === dateIso')
    expect(runtime).toContain('const initCalendars = (scope: ParentNode): void =>')
    expect(runtime).toContain("input.dispatchEvent(new Event('input', { bubbles: true }))")
    expect(runtime).toContain("input.dispatchEvent(new Event('change', { bubbles: true }))")
    expect(runtime).toContain("event.key !== 'PageDown'")
    expect(runtime).toContain('new Intl.DateTimeFormat(locale')
    expect(styles).toContain('.ui-calendar__nav')
    expect(styles).toContain('.ui-calendar td[aria-selected="true"]')
  })

  test('ships DataTable as a static table enhanced with sorting and selection', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/DataTable.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(component).toContain('columns?: DataTableColumn[]')
    expect(component).toContain('rows?: DataTableRow[]')
    expect(component).toContain('selectable?: boolean')
    expect(component).toContain('data-ui-datatable')
    expect(component).toContain('data-ui-datatable-sortable')
    expect(component).toContain('data-sort-value')
    expect(component).toContain('<slot />')
    expect(component).not.toContain('ui-data-table__sort')
    expect(runtime).toContain('const initDataTables = (scope: ParentNode): void =>')
    expect(runtime).toContain("header.setAttribute('aria-sort', 'none')")
    expect(runtime).toContain("root.dispatchEvent(new CustomEvent('ui-datatable-selectionchange'")
    expect(runtime).toContain("input.type = 'hidden'")
    expect(styles).toContain('.ui-data-table__sort')
    expect(styles).toContain('.ui-data-table tbody tr[data-state="selected"]')
  })

  test('keeps accessibility and sanitization guards in component sources', async () => {
    const [aspectRatio, avatar, field, runtime] = await Promise.all([
      readFile(new URL('./components/AspectRatio.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/Avatar.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/Field.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8')
    ])

    expect(aspectRatio).toContain('ratio?: number | string')
    expect(aspectRatio).toContain('Number.isFinite(ratio)')
    expect(avatar).toContain('fallbackText && <span')
    expect(field).toContain(`data-ui-field-${'described' + 'by'}={fieldDescribedBy}`)
    expect(runtime).toContain(`control.setAttribute('aria-${'described' + 'by'}'`)
  })

  test('enhances native form validation through Field error slots', async () => {
    const [runtime, styles] = await Promise.all([
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(runtime).toContain("form[data-ui-form]")
    expect(runtime).toContain("form.dispatchEvent(new CustomEvent('ui:validate'")
    expect(runtime).toContain("form.dispatchEvent(new CustomEvent('ui:invalid'")
    expect(runtime).toContain("form.dispatchEvent(new CustomEvent('ui:valid'")
    expect(runtime).toContain("'data-error-required'")
    expect(runtime).toContain("'data-error-pattern'")
    expect(runtime).toContain("'data-error-custom'")
    expect(runtime).toContain("control.setAttribute('aria-invalid', 'true')")
    expect(runtime).toContain('firstInvalid?.focus({ preventScroll: true })')
    expect(styles).toContain('.ui-field > [data-ui-field-error]')
  })

  test('ships mature toast runtime API, ARIA, and placement styles', async () => {
    const [toast, sonner, runtime, styles] = await Promise.all([
      readFile(new URL('./components/Toast.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/Sonner.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(toast).toContain('data-ui-toast')
    expect(toast).toContain("variant === 'destructive' ? 'alert' : 'status'")
    expect(sonner).toContain('placement?:')
    expect(sonner).toContain('maxCount?: number')
    expect(runtime).toContain('type ToastApi =')
    expect(runtime).toContain('create: createToast')
    expect(runtime).toContain('dismiss: dismissToastById')
    expect(runtime).toContain('update: updateToast')
    expect(runtime).toContain("document.addEventListener('ui:toast'")
    expect(runtime).toContain("document.addEventListener('ui:toast-update'")
    expect(runtime).toContain("document.addEventListener('ui:toast-dismiss'")
    expect(runtime).toContain("'ui:toast-action'")
    expect(runtime).toContain("toast.addEventListener('mouseenter', pause)")
    expect(runtime).toContain("event.key !== 'Escape'")
    expect(styles).toContain('.ui-sonner[data-placement^="top"]')
    expect(styles).toContain('.ui-sonner[data-placement$="center"]')
    expect(styles).toContain('.ui-toast__action')
  })
})
