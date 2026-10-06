/** Local recipe interactions. Applications own checkout, persistence, navigation, and authorization. */
const announce = (root: HTMLElement, text: string): void => {
  const status = root.querySelector<HTMLElement>('[data-block-status]')

  if (status) status.textContent = text
}

const dispatch = (root: HTMLElement, name: string, detail: Readonly<Record<string, string>>): boolean => (
  root.dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable: true, detail }))
)

const updateBilling = (root: HTMLElement, billing: string): void => {
  for (const button of root.querySelectorAll<HTMLElement>('[data-billing]')) button.setAttribute('aria-pressed', String(button.dataset.billing === billing))

  for (const amount of root.querySelectorAll<HTMLElement>('[data-monthly][data-annual]')) {
    const price = (billing === 'annual' ? amount.dataset.annual : amount.dataset.monthly) ?? '0'

    amount.textContent = `$${price} / ${billing === 'annual' ? 'year' : 'month'}`
  }
}

const bindPricingBlock = (root: HTMLElement): (() => void) => {
  let billing = 'monthly'

  const click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return

    const control = event.target.closest<HTMLElement>('[data-billing], [data-plan]')

    if (control?.closest('[data-product-block]') !== root) return

    if (control.dataset.billing) {
      billing = control.dataset.billing

      updateBilling(root, billing)
    } else if (control.dataset.plan) {
      dispatch(root, 'ui:plan-select', { billing, plan: control.dataset.plan })

      announce(root, `Selected ${control.dataset.plan}, ${billing}.`)
    }
  }

  root.addEventListener('click', click)

  return () => {
    root.removeEventListener('click', click)
  }
}

const bindFeatureBlock = (root: HTMLElement): (() => void) => {
  const click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return

    const button = event.target.closest<HTMLElement>('[data-feature]')

    if (button?.closest('[data-product-block]') !== root) return

    const feature = button.dataset.feature ?? 'plan'

    for (const control of root.querySelectorAll<HTMLElement>('[data-feature]')) control.setAttribute('aria-pressed', String(control.dataset.feature === feature))

    for (const panel of root.querySelectorAll<HTMLElement>('[data-feature-panel]')) panel.hidden = panel.dataset.featurePanel !== feature

    announce(root, `Previewing ${feature}.`)
  }

  root.addEventListener('click', click)

  return () => {
    root.removeEventListener('click', click)
  }
}

export const bindOnboardingBlock = (root: HTMLElement): (() => void) => {
  const form = root.querySelector('form')
  const input = root.querySelector<HTMLInputElement>('input[data-workspace-name], [data-workspace-name] input')

  if (!form || !input) return () => undefined

  let step = 0

  const updateValidity = (): void => {
    const next = root.querySelector<HTMLElement>('[data-onboarding-next]')
    const disabled = !input.value.trim()

    next?.toggleAttribute('disabled', disabled)

    next?.classList.toggle('ui-button--disabled', disabled)
  }

  input.addEventListener('input', updateValidity)

  updateValidity()

  const sync = (): void => {
    for (const panel of root.querySelectorAll<HTMLElement>('[data-onboarding-step]')) panel.hidden = Number(panel.dataset.onboardingStep) !== step

    const review = root.querySelector<HTMLElement>('[data-workspace-review]')

    if (review) review.textContent = input.value

    const back = root.querySelector<HTMLElement>('[data-onboarding-back]')

    if (back) back.hidden = step !== 1

    const next = root.querySelector<HTMLButtonElement>('[data-onboarding-next]')

    if (next) {
      next.hidden = step === 2

      next.textContent = step === 0 ? 'Continue' : 'Complete setup'
    }

    announce(root, `Step ${step + 1} of 3${step === 2 ? ': draft completed.' : '.'}`)

    root.querySelector<HTMLElement>(`[data-onboarding-step="${step}"] h3`)?.focus()
  }

  const submit = (event: SubmitEvent): void => {
    event.preventDefault()

    if (!input.value.trim() || !form.reportValidity() || step === 2) return

    if (step === 1 && !dispatch(root, 'ui:onboarding-complete', { workspace: input.value.trim() })) return

    step++

    sync()
  }

  const back = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return

    if (event.target.closest('lumen-button[data-onboarding-next]')) {
      form.requestSubmit()

      return
    }

    if (!event.target.closest('[data-onboarding-back], [data-onboarding-edit]')) return

    step = 0

    sync()
  }

  form.addEventListener('submit', submit)

  root.addEventListener('click', back)

  return () => {
    input.removeEventListener('input', updateValidity)

    form.removeEventListener('submit', submit)

    root.removeEventListener('click', back)
  }
}

const bindCommandBlock = (root: HTMLElement): (() => void) => {
  const click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return

    const command = event.target.closest<HTMLElement>('[data-workspace-command]')

    if (command?.closest('[data-product-block]') !== root || !command.dataset.workspaceCommand) return

    dispatch(root, 'ui:workspace-command', { command: command.dataset.workspaceCommand })

    announce(root, `Selected: ${command.textContent}`)
  }

  root.addEventListener('click', click)

  return () => {
    root.removeEventListener('click', click)
  }
}

const mountedBlocks = new WeakMap<HTMLElement, () => void>()

export const mountProductBlocks = (scope: ParentNode): (() => void) => {
  const cleanups: (() => void)[] = []

  for (const root of scope.querySelectorAll<HTMLElement>('[data-product-block]')) {
    if (mountedBlocks.has(root)) continue

    let binding: (() => void) | undefined

    switch (root.dataset.productBlock) {
      case 'pricing': binding = bindPricingBlock(root)

        break

      case 'feature': binding = bindFeatureBlock(root)

        break

      case 'onboarding': binding = bindOnboardingBlock(root)

        break

      case 'command': binding = bindCommandBlock(root)

        break
    }

    if (!binding) continue

    mountedBlocks.set(root, binding)

    const cleanup = binding

    cleanups.push(() => {
      cleanup()

      mountedBlocks.delete(root)
    })
  }

  return () => {
    for (const cleanup of cleanups) cleanup()
  }
}
