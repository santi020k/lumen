import { createThemeBuilderTokens } from '@santi020k/lumen-core'

const controlIds = [
  'theme-primary-hex',
  'theme-secondary-hex',
  'theme-brand-hue',
  'theme-accent-hue',
  'theme-state',
  'theme-radius-scale',
  'theme-spacing-scale',
  'theme-border-width',
  'theme-font-family',
  'theme-elevation',
  'theme-density'
]

const choiceAttributes = ['data-ui-theme-preset', 'data-ui-theme-mode', 'data-ui-theme-scheme']

const controlValue = (root: HTMLElement, selector: string): string | null => (
  root.querySelector<HTMLInputElement | HTMLSelectElement>(selector)?.value ?? null
)

const selectedChoice = (root: HTMLElement, attribute: string): string | null => (
  root.querySelector(`[${attribute}][aria-pressed="true"], [${attribute}][aria-selected="true"]`)?.getAttribute(attribute) ?? null
)

const updateComparison = (workbench: HTMLElement): void => {
  const panel = document.querySelector<HTMLElement>('[data-theme-comparison]')

  if (!panel) return

  const scheme = selectedChoice(workbench, 'data-ui-theme-scheme') === 'dark' ? 'light' : 'dark'
  const preset = selectedChoice(workbench, 'data-ui-theme-preset')

  const { tokens } = createThemeBuilderTokens({
    scheme,
    preset: preset === 'custom' ? null : preset,
    mode: selectedChoice(workbench, 'data-ui-theme-mode'),
    hue: controlValue(workbench, '#theme-brand-hue'),
    accentHue: controlValue(workbench, '#theme-accent-hue'),
    primaryColor: controlValue(workbench, '#theme-primary-hex'),
    secondaryColor: controlValue(workbench, '#theme-secondary-hex'),
    radiusScale: controlValue(workbench, '#theme-radius-scale'),
    spacingScale: controlValue(workbench, '#theme-spacing-scale'),
    borderWidth: controlValue(workbench, '#theme-border-width'),
    fontFamily: controlValue(workbench, '#theme-font-family'),
    elevation: controlValue(workbench, '#theme-elevation')
  })

  for (const [name, token] of Object.entries(tokens)) panel.style.setProperty(`--${name}`, token)

  panel.style.colorScheme = scheme

  panel.dataset.lumenScheme = scheme
}

const restoreChoices = (workbench: HTMLElement, params: URLSearchParams): void => {
  for (const attribute of choiceAttributes) {
    const value = params.get(attribute)

    if (!value) continue

    const buttons = Array.from(workbench.querySelectorAll<HTMLButtonElement>(`[${attribute}]`))

    buttons.find(button => button.getAttribute(attribute) === value)?.click()
  }
}

const restoreNumber = (input: HTMLInputElement, value: string): void => {
  const number = Number(value)

  if (Number.isFinite(number) && number >= Number(input.min) && number <= Number(input.max)) input.value = value
}

const restoreControlValue = (input: HTMLElement | null, value: string): void => {
  if (input instanceof HTMLSelectElement) {
    if (Array.from(input.options).some(option => option.value === value)) input.value = value
  }

  if (!(input instanceof HTMLInputElement)) return

  if (input.type === 'number' || input.type === 'range') restoreNumber(input, value)
  else if (/^#[\da-f]{6}$/i.test(value)) input.value = value
}

const restoreControls = (params: URLSearchParams): void => {
  for (const id of controlIds) {
    const value = params.get(id)

    if (value === null) continue

    const input = document.getElementById(id)

    restoreControlValue(input, value)

    input?.dispatchEvent(new Event('input', { bubbles: true }))

    input?.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

const bindDensity = (workbench: HTMLElement): void => {
  const preview = document.querySelector<HTMLElement>('#theme-playground-preview')
  const density = workbench.querySelector<HTMLSelectElement>('[data-theme-density]')

  const syncDensity = () => {
    if (preview && density) preview.dataset.uiDensity = density.value
  }

  density?.addEventListener('change', syncDensity)

  syncDensity()
}

const bindSampleState = (): void => {
  const state = document.querySelector<HTMLSelectElement>('[data-theme-state]')
  const sample = document.querySelector<HTMLInputElement>('#theme-state-field')

  const syncState = () => {
    if (!sample || !state) return

    sample.disabled = state.value === 'disabled'

    sample.readOnly = state.value === 'readonly'

    sample.setAttribute('aria-invalid', String(state.value === 'invalid'))

    const message = document.querySelector('[data-theme-state-message]')

    if (message) message.textContent = state.value === 'invalid' ? 'Enter a workspace name.' : 'Choose a recognizable name.'
  }

  state?.addEventListener('change', syncState)

  syncState()
}

const bindInspector = (): void => {
  const preview = document.querySelector<HTMLElement>('#theme-playground-preview')

  preview?.addEventListener('focusin', event => {
    if (!(event.target instanceof HTMLElement)) return

    const inspector = document.querySelector('[data-theme-inspector]')

    if (inspector) inspector.textContent = `${event.target.tagName.toLowerCase()}: --surface, --ink, --line, --brand; typography: --ui-font. Use the component styling contract for its stable parts.`
  })
}

const collectControlValues = (values: URLSearchParams): void => {
  for (const id of controlIds) {
    const input = document.getElementById(id)

    if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) values.set(id, input.value)
  }
}

const collectChoiceValues = (workbench: HTMLElement, values: URLSearchParams): void => {
  for (const attribute of choiceAttributes) {
    const value = selectedChoice(workbench, attribute)

    if (value) values.set(attribute, value)
  }
}

const shareStatus = (workbench: HTMLElement, message: string): void => {
  const status = workbench.querySelector('[data-theme-share-status]')

  if (status) status.textContent = message
}

const copyWorkbenchLink = (workbench: HTMLElement): void => {
  const next = new URL(location.href)
  const values = new URLSearchParams()

  collectControlValues(values)

  collectChoiceValues(workbench, values)

  next.hash = values.toString()

  Promise.resolve().then(() => navigator.clipboard.writeText(next.href)).then(() => {
    shareStatus(workbench, 'Workbench link copied.')

    return undefined
  }).catch(() => {
    shareStatus(workbench, 'Clipboard unavailable. Copy the link from your address bar.')

    history.replaceState(null, '', next)
  })
}

export const initializeAppearanceWorkbench = (): void => {
  const workbench = document.querySelector<HTMLElement>('[data-theme-playground]')

  if (!workbench || workbench.dataset.appearanceBound === 'true') return

  workbench.dataset.appearanceBound = 'true'

  workbench.addEventListener('ui:theme-change', () => {
    updateComparison(workbench)
  })

  updateComparison(workbench)

  const params = new URLSearchParams(location.hash.slice(1))

  restoreChoices(workbench, params)

  restoreControls(params)

  bindDensity(workbench)

  bindSampleState()

  bindInspector()

  workbench.querySelector('[data-theme-share]')?.addEventListener('click', () => {
    copyWorkbenchLink(workbench)
  })
}
