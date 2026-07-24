import { readFile } from 'node:fs/promises'

import { lumenComponentNames } from '@santi020k/lumen-core'

import { describe, expect, test } from 'vitest'

/* cspell:ignore datatable */

const packageRoot = new URL('.', import.meta.url)
const sharedStylesUrl = new URL('../lumen/styles.css', packageRoot)

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
    await expect(readFile(new URL('./styles/lumen.css', packageRoot), 'utf8'))
      .resolves.toContain('@import "@santi020k/lumen/styles.css"')
    await expect(readFile(sharedStylesUrl, 'utf8')).resolves.toContain('.ui-button')
  })

  test('keeps ButtonLink hover motion aligned with Button without client-side magnetic behavior', async () => {
    const buttonLink = await readFile(new URL('./components/ButtonLink.astro', packageRoot), 'utf8')

    expect(buttonLink).toContain("'ui-button ui-button--primary'")
    expect(buttonLink).not.toContain('data-magnetic')
    expect(buttonLink).not.toContain('mousemove')
    expect(buttonLink).not.toContain('<script>')
  })

  test('ships glass styles for overlay and structural surfaces', async () => {
    const css = await readFile(sharedStylesUrl, 'utf8')

    expect(css).toContain('.ui-dialog--glass')
    expect(css).toContain('.ui-alert--glass')
    expect(css).toContain('.ui-table-wrap--glass')
    expect(css).toContain('.ui-date-picker-field--glass .ui-date-picker__popover')
    expect(css).toContain('.ui-select-field--glass .ui-select__list')
    expect(css).toContain('@supports not ((backdrop-filter: blur(1px))')
  })

  test('ships the pill shell and count affix styles', async () => {
    const css = await readFile(sharedStylesUrl, 'utf8')

    expect(css).toMatch(/\.ui-pill\s*\{/)
    expect(css).toMatch(/\.ui-pill__count\s*\{/)
    expect(css).toContain('border-left: 1px solid hsl(var(--line))')
    expect(css).toContain('color: hsl(var(--ink-muted))')
  })

  test('aligns image and fallback avatars consistently in inline groups', async () => {
    const css = await readFile(sharedStylesUrl, 'utf8')

    expect(css).toMatch(/\.ui-avatar\s*\{[^}]*vertical-align: middle;/s)
  })

  test('gives breadcrumb links, separators, and the current page distinct states', async () => {
    const css = await readFile(sharedStylesUrl, 'utf8')

    expect(css).toMatch(/\.ui-breadcrumb li \+ li::before\s*\{/)
    expect(css).toMatch(/\.ui-breadcrumb a:hover\s*\{[^}]*hsl\(var\(--brand\)\)/s)
    expect(css).toMatch(/\.ui-breadcrumb a:focus-visible\s*\{[^}]*outline:/s)
    expect(css).toMatch(/\.ui-breadcrumb \[aria-current="page"\]\s*\{[^}]*hsl\(var\(--ink\)\)/s)
  })

  test('keeps icons from collapsing inside input groups', async () => {
    const css = await readFile(sharedStylesUrl, 'utf8')

    expect(css).toContain('.ui-input-group > :where(span, strong):not(.ui-icon)')
    expect(css).toMatch(/\.ui-input-group > \.ui-icon\s*\{[^}]*margin-inline-start: 0\.75rem;/s)
  })

  test('styles native meter tracks and values with shared color tokens', async () => {
    const css = await readFile(sharedStylesUrl, 'utf8')

    expect(css).toMatch(/\.ui-meter\s*\{[^}]*appearance: none/s)
    expect(css).toMatch(/\.ui-meter::-webkit-meter-bar\s*\{[^}]*hsl\(var\(--surface-strong\)\)/s)
    expect(css).toMatch(/\.ui-meter::-webkit-meter-optimum-value\s*\{[^}]*hsl\(var\(--brand-solid\)\)/s)
    expect(css).toMatch(/\.ui-meter::-moz-meter-bar\s*\{[^}]*hsl\(var\(--brand-solid\)\)/s)
    expect(css).not.toMatch(/\.ui-meter(?:\s|::)[^{]*\{[^}]*var\(--ui-(?:brand|surface-strong)\)/s)
  })

  test('ships the code primitive markup and standalone styles', async () => {
    const [component, styles] = await Promise.all([
      readFile(new URL('./components/Code.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(component).toContain('code?: string')
    expect(component).toContain('renderLumenCodeHtml')
    expect(component).toContain("variant = 'inline'")
    expect(component).toContain("wrap = false")
    expect(component).toContain("wrap && 'ui-code--wrap'")
    expect(component).toContain('data-ui-code-copy')
    expect(component).toContain('Copy code to clipboard')
    expect(styles).toContain('.ui-code--inline')
    expect(styles).toContain('.ui-code--block')
    expect(styles).toContain('.ui-code--wrap')
    expect(styles).toContain('.ui-code__copy')
  })

  test('styles native accordion disclosure affordances', async () => {
    const styles = await readFile(sharedStylesUrl, 'utf8')

    expect(styles).toContain('.ui-accordion summary::after')
    expect(styles).toContain('.ui-accordion details[open] > summary::after')
    expect(styles).toContain('.ui-accordion summary:focus-visible')
  })

  test('builds Watermark labels as repeatable masked text tiles', async () => {
    const [component, styles] = await Promise.all([
      readFile(new URL('./components/Watermark.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(component).toContain('encodeURIComponent(watermarkSvg)')
    expect(component).toContain('--ui-watermark-image')
    expect(styles).toContain('mask-image: var(--ui-watermark-image)')
    expect(styles).toContain('mask-repeat: repeat')
  })

  test('wraps arbitrary inline SVG logos with shared animation styles', async () => {
    const [component, styles] = await Promise.all([
      readFile(new URL('./components/AnimatedLogo.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(component).toContain("HTMLAttributes<'span'>")
    expect(component).toContain("animation?: 'reveal' | 'sequence'")
    expect(component).toContain('data-ui-animated-logo')
    expect(component).toContain('<slot />')
    expect(component).not.toContain('Santi020k')
    expect(styles).toContain('.ui-animated-logo > svg')
    expect(styles).toContain('--ui-animated-logo-duration')
    expect(styles).toContain('@keyframes ui-animated-logo-reveal')
    expect(styles).toContain('[data-ui-logo-draw]')
  })

  test('ships AnimatedPortrait structure and motion as standalone styles', async () => {
    const [component, styles] = await Promise.all([
      readFile(new URL('./components/AnimatedPortrait.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(component).toContain('ui-animated-portrait__orbit--outer')
    expect(component).toContain('ui-animated-portrait__badge--location')
    expect(component).toContain('ui-animated-portrait__badge--experience')
    expect(component).not.toContain('border-image:')
    expect(styles).toContain('.ui-animated-portrait__badge')
    expect(styles).toContain('backdrop-filter: blur(10px)')
    expect(styles).toContain('@keyframes ui-animated-portrait-spin')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  test('ships a consistent, reduced-motion-aware entrance and metric vocabulary', async () => {
    const [animatedNumber, revealGroup, runtime, scrollReveal, styles] = await Promise.all([
      readFile(new URL('./components/AnimatedNumber.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/RevealGroup.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/ScrollReveal.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(scrollReveal).toContain("duration?: 'fast' | 'standard' | 'slow'")
    expect(scrollReveal).toContain('once?: boolean')
    expect(scrollReveal).toContain('threshold?: number')
    expect(revealGroup).toContain('stagger?: number')
    expect(revealGroup).toContain('data-ui-reveal-group')
    expect(animatedNumber).toContain('data-ui-animated-number-output')
    expect(animatedNumber).toContain('class="ui-sr-only"')
    expect(runtime).toContain("'[data-ui-scroll-reveal], [data-ui-reveal-group]'")
    expect(runtime).toContain('const initAnimatedNumbers = (scope: ParentNode): void =>')
    expect(styles).toContain('.ui-motion-duration-fast')
    expect(styles).toContain('.ui-reveal-group.is-revealed > *')
    expect(styles).toContain('var(--ui-duration-slow) var(--ui-ease-emphasized)')
    expect(styles).not.toContain('transform 220ms cubic-bezier(0.32, 0.72, 0, 1)')
  })

  test('keeps Astro image optimization and dark artwork support', async () => {
    const [component, styles] = await Promise.all([
      readFile(new URL('./components/Image.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(component).toContain("Image as AstroImage")
    expect(component).toContain("from 'astro:assets'")
    expect(component).toContain("loading = 'lazy'")
    expect(component).toContain('invertOnDark')
    expect(component).toContain('<AstroImage')
    expect(styles).toContain('.ui-image--invert-dark')
  })

  test('keeps audited primitive semantics, runtime behavior, and standalone styles aligned', async () => {
    const [backToTop, component, languageToggle, particles, runtime, scrollReveal, styles] = await Promise.all([
      readFile(new URL('./components/BackToTop.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/ThemeToggle.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/LanguageToggle.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/Particles.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/ScrollReveal.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(backToTop).toContain('<button')
    expect(backToTop).toContain('data-ui-back-to-top')
    expect(component).toContain('<button')
    expect(component).toContain('type={type}')
    expect(component).toContain('data-ui-theme-toggle')
    expect(component).not.toContain('<lumen-theme-toggle')
    expect(languageToggle).toContain('<button')
    expect(languageToggle).not.toContain('<lumen-language-toggle')
    expect(particles).toContain('<div')
    expect(particles).not.toContain('<lumen-particles')
    expect(scrollReveal).toContain('<div')
    expect(scrollReveal).not.toContain('<lumen-scroll-reveal')
    expect(runtime).toContain('const initBackToTopButtons = (scope: ParentNode): void =>')
    expect(runtime).toContain('const initScrollReveals = (scope: ParentNode): void =>')
    expect(styles).toContain('.ui-particles')
    expect(styles).toContain('.ui-scroll-reveal.is-revealed')
    expect(styles).toContain('.ui-sr-only')
    expect(styles).toContain('[data-theme$="-dark"]')
  })

  test('ships Select as a progressively enhanced listbox distinct from NativeSelect', async () => {
    const [select, nativeSelect, runtime, styles] = await Promise.all([
      readFile(new URL('./components/Select.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/NativeSelect.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
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
    expect(docs).toContain('Runs formatting, block, alignment, history, link, list, or custom commands')
    expect(dropdownMenu).toContain("interface Props extends HTMLAttributes<'div'>")
    expect(dropdownMenu).toContain('<div')
    expect(dropdownMenu).not.toContain('<menu')
    expect(nativeSelectExample).toContain('size="lg"')
    expect(nativeSelectExample).toContain('disabled')
    expect(runtime).toContain(`trigger.setAttribute('aria-${'described' + 'by'}'`)
    expect(runtime).toContain("tip.id = `ui-tooltip-${crypto.randomUUID()}`")
    expect(runtime).toContain("item.getAttribute('aria-disabled') !== 'true'")
  })

  test('ships Resizable as an enhanced split panel with accessible handles', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/Resizable.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
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
      readFile(sharedStylesUrl, 'utf8')
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
      readFile(sharedStylesUrl, 'utf8')
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

  test('enhances DatePicker into a custom Calendar disclosure', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/DatePicker.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(component).toContain('data-ui-date-picker-native')
    expect(component).toContain('data-ui-date-picker-trigger')
    expect(component).toContain('data-ui-date-picker-popover')
    expect(component).toContain('<Calendar')
    expect(runtime).toContain('const initDatePickers = (scope: ParentNode): void =>')
    expect(runtime).toContain('initDatePickers(scope)')
    expect(runtime).toContain("native.dataset.uiEnhanced = 'true'")
    expect(runtime).toContain("native.dispatchEvent(new Event('change', { bubbles: true }))")
    expect(runtime).toContain('closeDatePicker(root, true)')
    expect(styles).toContain('.ui-date-picker__icon')
    expect(styles).toContain('.ui-date-picker__popover > .ui-calendar')
  })

  test('composes DateRangePicker from synchronized custom DatePickers', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/DateRangePicker.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
    ])

    expect(component).toContain('data-ui-date-range-picker')
    expect(runtime).toContain('const initDateRangePickers = (scope: ParentNode): void =>')
    expect(runtime).toContain("setAttribute('data-range-part', 'start')")
    expect(runtime).toContain("setAttribute('data-range-part', 'end')")
    expect(runtime).toContain('root.dataset.rangeState')
    expect(styles).toContain('.ui-date-range-picker::before')
    expect(styles).toContain('[data-range-part="start"]')
    expect(styles).toContain('@media (max-width: 40rem)')
  })

  test('ships DataTable as a static table enhanced with sorting and selection', async () => {
    const [component, runtime, styles] = await Promise.all([
      readFile(new URL('./components/DataTable.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(sharedStylesUrl, 'utf8')
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
    expect(runtime).toContain("root.dispatchEvent(new CustomEvent('ui:datatable-selection-change'")
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
      readFile(sharedStylesUrl, 'utf8')
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
      readFile(sharedStylesUrl, 'utf8')
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

  test('ships ThemeBuilder as a scoped token playground runtime', async () => {
    const [example, glassExample, runtime] = await Promise.all([
      readFile(new URL('../../apps/docs/src/examples/ThemeBuilder.astro', packageRoot), 'utf8'),
      readFile(new URL('../../apps/docs/src/examples/glass/ThemeBuilder.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8')
    ])

    expect(example).toContain('data-ui-theme-target')
    expect(example).toContain('data-ui-theme-brand-hue')
    expect(example).toContain('data-ui-theme-accent-hue')
    expect(glassExample).toContain('<ThemeBuilder data-ui-theme-target="#ex-glass-theme-preview" glass>')
    expect(glassExample).toContain('data-ui-theme-brand-hue')
    expect(glassExample).toContain('data-ui-theme-accent-hue')
    expect(glassExample).toContain('data-ui-theme-export')
    expect(runtime).toContain('data-ui-theme-primary-hex')
    expect(runtime).toContain('data-ui-theme-export-format')
    expect(runtime).toContain('exportThemeFigmaVariables')
    expect(runtime).toContain("'ui:theme-change'")
    expect(runtime).toContain("'ui:theme-export'")
  })
})
