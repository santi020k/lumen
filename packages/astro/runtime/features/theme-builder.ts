import { coerceThemePreset, createThemeBuilderTokens, exportThemeBuilderCss, exportThemeDesignTokens, exportThemeFigmaVariables, type LumenThemeTokens, lumenTokenNames } from '@santi020k/lumen-core'

type ThemeBuilderExportFormat = 'css' | 'figma' | 'tokens'

type ThemeBuilderMode = 'generated' | 'manual'

type ThemeBuilderScheme = 'dark' | 'light'

const themeBuilderExportButtonLabels: Record<ThemeBuilderExportFormat, string> = {
  css: 'Copy CSS',
  figma: 'Copy Figma JSON',
  tokens: 'Copy token JSON'
}

const coerceThemeBuilderExportFormat = (value?: string | null): ThemeBuilderExportFormat => {
  if (value === 'figma' || value === 'tokens') return value

  return 'css'
}

const coerceThemeBuilderMode = (value?: string | null): ThemeBuilderMode => (
  value === 'manual' ? 'manual' : 'generated'
)

const coerceThemeBuilderScheme = (value?: string | null): ThemeBuilderScheme => (
  value === 'dark' ? 'dark' : 'light'
)

const getDefaultThemeBuilderScheme = (): ThemeBuilderScheme => (
  document.documentElement.dataset.theme?.includes('dark') ? 'dark' : 'light'
)

const normalizeThemeBuilderHue = (
  value: number | string | null | undefined,
  fallback = 0
): number => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return fallback

  return ((Math.round(parsed) % 360) + 360) % 360
}

const normalizeThemeBuilderHex = (value: string): string | null => {
  const hex = value.trim().replace(/^#/, '')

  if (/^[\da-f]{3}$/i.test(hex)) {
    let expanded = ''

    for (const character of hex) expanded += character + character

    return `#${expanded.toLowerCase()}`
  }

  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null
}

const setThemeBuilderHexValidity = (input: HTMLInputElement, isValid: boolean): void => {
  if (isValid) {
    input.removeAttribute('aria-invalid')

    return
  }

  input.setAttribute('aria-invalid', 'true')
}

const getThemeBuilderTarget = (root: HTMLElement): HTMLElement | null => {
  const selector = root.dataset.uiThemeTarget

  if (!selector) return document.documentElement

  try {
    return document.querySelector<HTMLElement>(selector)
  } catch {
    return null
  }
}

const getThemeBuilderButtonValue = (
  root: HTMLElement,
  buttons: HTMLButtonElement[],
  attribute: string,
  fallback: string
): string => {
  const activeButton = buttons.find(button => button.getAttribute('aria-selected') === 'true' ||
    button.getAttribute('aria-pressed') === 'true')

  return activeButton?.getAttribute(attribute) ?? root.getAttribute(attribute) ?? fallback
}

const setThemeBuilderPressedState = (
  buttons: HTMLButtonElement[],
  attribute: string,
  value: string
): void => {
  for (const button of buttons) {
    const isPressed = button.getAttribute(attribute) === value

    if (button.hasAttribute('aria-pressed')) {
      button.setAttribute('aria-pressed', String(isPressed))
    }

    button.classList.toggle('ui-button--secondary', isPressed)

    button.classList.toggle('ui-button--outline', !isPressed)
  }
}

const bindSyncedThemeBuilderHueInputs = (
  range: HTMLInputElement | null,
  number: HTMLInputElement | null,
  onChange: () => void
): void => {
  const sync = (source: HTMLInputElement, target: HTMLInputElement | null): void => {
    source.value = String(normalizeThemeBuilderHue(source.value))

    if (target) {
      target.value = source.value
    }

    onChange()
  }

  range?.addEventListener('input', () => {
    sync(range, number)
  })

  number?.addEventListener('input', () => {
    sync(number, range)
  })
}

const bindThemeBuilderHexInputs = (
  color: HTMLInputElement | null,
  text: HTMLInputElement | null,
  onChange: () => void
): void => {
  color?.addEventListener('input', () => {
    if (!text) {
      onChange()

      return
    }

    text.value = color.value

    setThemeBuilderHexValidity(text, true)

    onChange()
  })

  text?.addEventListener('change', () => {
    const normalized = normalizeThemeBuilderHex(text.value)

    setThemeBuilderHexValidity(text, Boolean(normalized))

    if (normalized) {
      if (color) color.value = normalized

      text.value = normalized
    }

    onChange()
  })

  text?.addEventListener('input', () => {
    const normalized = normalizeThemeBuilderHex(text.value)

    setThemeBuilderHexValidity(text, Boolean(normalized))

    if (normalized) {
      if (color) color.value = normalized

      onChange()
    }
  })
}

const getComputedThemeBuilderTokens = (target: HTMLElement): LumenThemeTokens => {
  const styles = getComputedStyle(target)
  const tokens: LumenThemeTokens = {}

  for (const token of lumenTokenNames) {
    const value = styles.getPropertyValue(`--${token}`).trim()

    if (value) {
      tokens[token] = value
    }
  }

  return tokens
}

const applyThemeBuilderTokens = (
  target: HTMLElement,
  tokens: LumenThemeTokens,
  scheme: ThemeBuilderScheme
): void => {
  target.style.colorScheme = scheme

  for (const token of lumenTokenNames) {
    target.style.setProperty(`--${token}`, tokens[token] ?? '')
  }
}

const buildThemeBuilderExport = (
  tokens: LumenThemeTokens,
  scheme: ThemeBuilderScheme,
  format: ThemeBuilderExportFormat
): string => {
  if (format === 'figma') {
    return JSON.stringify(exportThemeFigmaVariables(tokens, {
      collectionName: 'Lumen',
      modeName: scheme === 'dark' ? 'Dark' : 'Light'
    }), null, 2)
  }

  if (format === 'tokens') {
    return JSON.stringify(exportThemeDesignTokens(tokens), null, 2)
  }

  return exportThemeBuilderCss(tokens, scheme)
}

const firstThemeValue = (...values: (string | null | undefined)[]): string | null => (
  values.find(value => value !== undefined && value !== null) ?? null
)

const themeInputValue = (root: HTMLElement, selector: string): string | null => (
  root.querySelector<HTMLInputElement>(selector)?.value ?? null
)

const bindThemeBuilders = (root: HTMLElement): void => {
  if (root.dataset.uiThemeBuilderBound === 'true') return

  root.dataset.uiThemeBuilderBound = 'true'

  root.dataset.uiBound = 'true'

  const exportButton = root.querySelector<HTMLElement>('[data-ui-theme-export]')
  const output = root.querySelector<HTMLTextAreaElement | HTMLOutputElement>('[data-ui-theme-output]')
  const brandHue = root.querySelector<HTMLInputElement>('[data-ui-theme-brand-hue], [data-ui-theme-hue]')
  const brandHueNumber = root.querySelector<HTMLInputElement>('[data-ui-theme-brand-hue-number]')
  const accentHue = root.querySelector<HTMLInputElement>('[data-ui-theme-accent-hue]')
  const accentHueNumber = root.querySelector<HTMLInputElement>('[data-ui-theme-accent-hue-number]')
  const primaryColor = root.querySelector<HTMLInputElement>('[data-ui-theme-primary-color]')
  const primaryHex = root.querySelector<HTMLInputElement>('[data-ui-theme-primary-hex]')
  const secondaryColor = root.querySelector<HTMLInputElement>('[data-ui-theme-secondary-color]')
  const secondaryHex = root.querySelector<HTMLInputElement>('[data-ui-theme-secondary-hex]')
  const exportFormatButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ui-theme-export-format]')]
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ui-theme-mode]')]
  const schemeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ui-theme-scheme]')]
  const presetButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ui-theme-preset]')]
  const initialPreset = root.getAttribute('data-ui-theme-preset')
  let currentPreset = initialPreset === 'custom' ? null : initialPreset

  presetButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.getAttribute('data-ui-theme-preset') === (currentPreset ?? 'custom')))
  })

  setThemeBuilderPressedState(presetButtons, 'data-ui-theme-preset', currentPreset ?? 'custom')

  const hasTokenControls = [
    presetButtons.length,
    currentPreset,
    root.querySelector('[data-ui-theme-radius-scale], [data-ui-theme-spacing-scale], [data-ui-theme-border-width]'),
    brandHue,
    brandHueNumber,
    accentHue,
    accentHueNumber,
    primaryColor,
    primaryHex,
    secondaryColor,
    secondaryHex,
    root.hasAttribute('data-ui-theme-brand-hue'),
    root.hasAttribute('data-ui-theme-accent-hue'),
    root.hasAttribute('data-ui-theme-hue')
  ].some(Boolean)

  let currentExportValue = ''

  let currentFormat = coerceThemeBuilderExportFormat(
    getThemeBuilderButtonValue(
      root, exportFormatButtons, 'data-ui-theme-export-format', 'css'
    )
  )

  let currentScheme = coerceThemeBuilderScheme(
    getThemeBuilderButtonValue(
      root, schemeButtons, 'data-ui-theme-scheme', getDefaultThemeBuilderScheme()
    )
  )

  let currentTokens: LumenThemeTokens | null = null

  const updateExportButtonLabel = (): void => {
    if (!exportButton || exportFormatButtons.length === 0) return

    exportButton.replaceChildren(themeBuilderExportButtonLabels[currentFormat])
  }

  const writeExport = (tokens: LumenThemeTokens, scheme: ThemeBuilderScheme): void => {
    currentExportValue = buildThemeBuilderExport(tokens, scheme, currentFormat)

    if (output) {
      output.value = currentExportValue
    }

    updateExportButtonLabel()
  }

  const writeComputedExport = (): void => {
    const target = getThemeBuilderTarget(root) ?? document.documentElement

    currentTokens = getComputedThemeBuilderTokens(target)

    writeExport(currentTokens, currentScheme)
  }

  const readHues = () => {
    const hue = normalizeThemeBuilderHue(
      firstThemeValue(brandHue?.value, brandHueNumber?.value, root.getAttribute('data-ui-theme-brand-hue'), root.getAttribute('data-ui-theme-hue'))
    )

    const nextAccentHue = normalizeThemeBuilderHue(
      firstThemeValue(accentHue?.value, accentHueNumber?.value, root.getAttribute('data-ui-theme-accent-hue')), normalizeThemeBuilderHue(hue + 150)
    )

    return { hue, nextAccentHue }
  }

  const createTokens = () => {
    const { hue, nextAccentHue } = readHues()

    const mode = coerceThemeBuilderMode(
      getThemeBuilderButtonValue(
        root, modeButtons, 'data-ui-theme-mode', 'generated'
      )
    )

    const result = createThemeBuilderTokens({
      hue,
      accentHue: nextAccentHue,
      mode,
      scheme: currentScheme,
      primaryColor: firstThemeValue(primaryHex?.value, primaryColor?.value),
      secondaryColor: firstThemeValue(secondaryHex?.value, secondaryColor?.value),
      preset: currentPreset,
      radiusScale: themeInputValue(root, '[data-ui-theme-radius-scale]'),
      spacingScale: themeInputValue(root, '[data-ui-theme-spacing-scale]'),
      borderWidth: themeInputValue(root, '[data-ui-theme-border-width]')
    })

    return result
  }

  const update = (
    options: { apply?: boolean, dispatch?: boolean } = {}
  ): void => {
    const result = createTokens()
    const tokens = result.tokens

    currentTokens = tokens

    const target = getThemeBuilderTarget(root)

    if (options.apply !== false && target) {
      applyThemeBuilderTokens(target, tokens, currentScheme)
    }

    writeExport(tokens, currentScheme)

    if (options.dispatch === false) return

    root.dispatchEvent(new CustomEvent('ui:theme-change', {
      bubbles: true,
      detail: result
    }))
  }

  for (const input of root.querySelectorAll<HTMLInputElement>('[data-ui-theme-radius-scale], [data-ui-theme-spacing-scale], [data-ui-theme-border-width]')) {
    input.addEventListener('input', () => {
      update()
    })
  }

  bindSyncedThemeBuilderHueInputs(brandHue, brandHueNumber, update)

  bindSyncedThemeBuilderHueInputs(accentHue, accentHueNumber, update)

  bindThemeBuilderHexInputs(primaryColor, primaryHex, update)

  bindThemeBuilderHexInputs(secondaryColor, secondaryHex, update)

  exportFormatButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentFormat = coerceThemeBuilderExportFormat(button.getAttribute('data-ui-theme-export-format'))

      setThemeBuilderPressedState(exportFormatButtons, 'data-ui-theme-export-format', currentFormat)

      if (hasTokenControls) {
        update({ apply: false, dispatch: false })
      } else {
        writeComputedExport()
      }
    })
  })

  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const mode = coerceThemeBuilderMode(button.getAttribute('data-ui-theme-mode'))

      if (button.getAttribute('role') !== 'tab') {
        setThemeBuilderPressedState(modeButtons, 'data-ui-theme-mode', mode)
      }

      update()
    })

    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

      queueMicrotask(update)
    })
  })

  presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentPreset = button.getAttribute('data-ui-theme-preset') === 'custom' ? null : coerceThemePreset(button.getAttribute('data-ui-theme-preset'))

      setThemeBuilderPressedState(presetButtons, 'data-ui-theme-preset', currentPreset ?? 'custom')

      update()
    })
  })

  schemeButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentScheme = coerceThemeBuilderScheme(button.getAttribute('data-ui-theme-scheme'))

      setThemeBuilderPressedState(schemeButtons, 'data-ui-theme-scheme', currentScheme)

      update()
    })
  })

  const exportTheme = async (): Promise<void> => {
    if (hasTokenControls && !currentTokens) {
      update({ apply: false, dispatch: false })
    } else if (!hasTokenControls) {
      writeComputedExport()
    }

    const value = output?.value || currentExportValue

    if (typeof navigator.clipboard !== 'undefined') await navigator.clipboard.writeText(value).catch(() => null)

    root.dispatchEvent(new CustomEvent('ui:theme-export', {
      bubbles: true,
      detail: {
        css: currentFormat === 'css' ? value : undefined,
        format: currentFormat,
        tokens: currentTokens,
        value
      }
    }))
  }

  exportButton?.addEventListener('click', () => {
    void exportTheme()
  })

  if (hasTokenControls) {
    update({
      apply: Boolean(root.dataset.uiThemeTarget || root.hasAttribute('data-ui-theme-apply-on-init')),
      dispatch: false
    })
  } else if (output) {
    writeComputedExport()
  }
}

export const initThemeBuilders = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-theme-builder]')) bindThemeBuilders(root)
}
