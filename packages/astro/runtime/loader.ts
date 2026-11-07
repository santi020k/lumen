import type { ToastApi } from './features/toast.js'
import { runtimeFeatures } from './features.js'
import { matchesScope } from './scope.js'
import type { LumenRuntimeController, LumenRuntimeDismissal, LumenRuntimeFeature } from './types.js'

const loaded = new Map<LumenRuntimeFeature, LumenRuntimeController>()
const pending = new Map<LumenRuntimeFeature, Promise<LumenRuntimeController>>()
let navigation = 0
let nextToastId = 0
let toastReady = false

const lumenWindow = window as Window & {
  LumenInitUiPrimitives?: (scope?: ParentNode) => Promise<void>
  LumenToast?: ToastApi
}

const reportError = (error: unknown): void => {
  document.dispatchEvent(new CustomEvent('ui:runtime-error', { detail: { error } }))

  window.setTimeout(() => {
    throw error
  })
}

const loadFeature = (feature: LumenRuntimeFeature): Promise<LumenRuntimeController> => {
  const current = pending.get(feature)

  if (current) return current

  const request = feature.load().then(controller => {
    loaded.set(feature, controller)

    return controller
  }).catch((error: unknown) => {
    pending.delete(feature)

    throw error
  })

  pending.set(feature, request)

  return request
}

interface FeatureRequest {
  feature: LumenRuntimeFeature
  scope: ParentNode
}

const initializeFeatures = async (requests: readonly FeatureRequest[]): Promise<void> => {
  const revision = navigation

  const results = await Promise.allSettled(requests.map(async ({ feature, scope }) => ({
    controller: await loadFeature(feature), name: feature.name, scope
  })))

  if (revision !== navigation) return

  const errors: unknown[] = []

  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(result.reason)

      continue
    }

    const { controller, name, scope } = result.value

    controller.init(scope)

    if (name === 'toast') toastReady = true
  }

  if (errors.length) throw new AggregateError(errors, 'Unable to load one or more Lumen controllers.')
}

/** Load only the behaviors needed by the current markup, in the established initialization order. */
export const initUiPrimitives = async (scope: ParentNode = document): Promise<void> => {
  const revision = navigation
  const features = runtimeFeatures.filter(feature => matchesScope(scope, feature.selector))

  await initializeFeatures(features.map(feature => ({ feature, scope })))

  if (revision === navigation) document.dispatchEvent(new CustomEvent('ui:ready', { detail: { scope } }))
}

const closeOutside = (event: MouseEvent): void => {
  if (!(event.target instanceof Node)) return

  for (const { outside } of loaded.values()) {
    if (!outside) continue

    for (const root of document.querySelectorAll<HTMLElement>(outside.selector)) {
      if (!root.contains(event.target)) outside.close(root)
    }
  }
}

const matchesDismissal = (target: HTMLElement, dismissal: LumenRuntimeDismissal | undefined): boolean => (
  dismissal !== undefined && target.matches(dismissal.selector) && dismissal.isOpen?.(target) !== false
)

const closeOnEscape = (event: KeyboardEvent): void => {
  if (event.defaultPrevented || event.isComposing || event.key !== 'Escape') return

  for (const target of event.composedPath()) {
    if (!(target instanceof HTMLElement)) continue

    for (const { escape } of loaded.values()) {
      if (!escape || !matchesDismissal(target, escape)) continue

      event.preventDefault()

      escape.close(target, true)

      return
    }
  }
}

const requestToast = async (perform: (api: ToastApi) => void): Promise<void> => {
  const feature = runtimeFeatures.find(candidate => candidate.name === 'toast')

  if (!feature) throw new Error('Lumen toast runtime is unavailable.')

  const revision = navigation
  const controller = await loadFeature(feature)

  if (revision !== navigation) return

  controller.init(document)

  toastReady = true

  const api = lumenWindow.LumenToast

  if (api) perform(api)
}

const createToastId = (): string => {
  let id = `ui-lazy-toast-${++nextToastId}`

  while (document.getElementById(id)) id = `ui-lazy-toast-${++nextToastId}`

  return id
}

const lazyToast: ToastApi = {
  create: detail => {
    const id = detail.id ?? createToastId()

    void requestToast(api => api.create({ ...detail, id })).catch(reportError)

    return id
  },
  dismiss: id => {
    void requestToast(api => {
      api.dismiss(id)
    }).catch(reportError)
  },
  update: (id, detail) => {
    void requestToast(api => {
      api.update(id, detail)
    }).catch(reportError)
  }
}

const loadToastForEvent = (event: Event): void => {
  if (toastReady) return

  const detail: unknown = event instanceof CustomEvent ? event.detail : undefined

  void requestToast(() => {
    document.dispatchEvent(new CustomEvent<unknown>(event.type, { detail }))
  }).catch(reportError)
}

const replayedEvents = new WeakSet<Event>()

const replayAfterLoad = (
  event: MouseEvent | KeyboardEvent,
  trigger: HTMLElement,
  requests: FeatureRequest[]
): void => {
  event.preventDefault()

  event.stopImmediatePropagation()

  const revision = navigation

  void initializeFeatures(requests).then(() => {
    if (revision === navigation && trigger.isConnected) {
      const replay = event instanceof KeyboardEvent ?
        new KeyboardEvent(event.type, event) :
        new MouseEvent(event.type, event)

      replayedEvents.add(replay)

      trigger.dispatchEvent(replay)
    }

    return undefined
  }).catch(reportError)
}

const prepareInteraction = (event: MouseEvent | KeyboardEvent, trigger: HTMLElement): void => {
  if (trigger.closest('[data-ui-owner]')) return

  const needed = runtimeFeatures.flatMap(feature => {
    const scope = (feature.interactionRoot && trigger.closest(feature.interactionRoot)) ||
      trigger.closest(feature.selector)

    return scope ? [{ feature, scope }] : []
  })

  if (!needed.length) return

  if (needed.every(({ feature }) => loaded.has(feature))) {
    for (const { feature, scope } of needed) loaded.get(feature)?.init(scope)

    return
  }

  replayAfterLoad(event, trigger, needed)
}

const bindBeforeClick = (event: MouseEvent): void => {
  if (event.defaultPrevented || replayedEvents.has(event) || event.button !== 0) return

  if (!(event.target instanceof Element)) return

  // Native inputs and links retain their browser fallback while enhancement loads.
  const trigger = event.target.closest<HTMLElement>('button, [role="tab"], [role="button"]')

  if (trigger) prepareInteraction(event, trigger)
}

const bindBeforeKey = (event: KeyboardEvent): void => {
  if (event.defaultPrevented || event.isComposing || replayedEvents.has(event)) return

  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return

  if (!(event.target instanceof HTMLElement)) return

  if (!event.target.matches('button, [role="tab"], [role="button"]')) return

  prepareInteraction(event, event.target)
}

export const installRuntime = (): void => {
  lumenWindow.LumenInitUiPrimitives = initUiPrimitives

  lumenWindow.LumenToast ??= lazyToast

  if (document.documentElement.dataset.uiPrimitivesGlobalBound !== 'true') {
    document.documentElement.dataset.uiPrimitivesGlobalBound = 'true'

    document.addEventListener('click', bindBeforeClick, true)

    document.addEventListener('keydown', bindBeforeKey, true)

    document.addEventListener('click', closeOutside)

    document.addEventListener('keydown', closeOnEscape)

    document.addEventListener('astro:before-swap', () => {
      navigation += 1

      for (const controller of loaded.values()) controller.cleanup?.()
    })

    for (const event of ['astro:page-load', 'astro:after-swap']) {
      document.addEventListener(event, () => {
        void initUiPrimitives().catch(reportError)
      })
    }

    for (const event of ['ui:toast', 'ui:toast-update', 'ui:toast-dismiss']) {
      document.addEventListener(event, loadToastForEvent)
    }
  }

  void initUiPrimitives().catch(reportError)
}
