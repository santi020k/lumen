import { bindLumenMediaViewport, normalizeLumenMediaViewport, syncLumenMediaViewport } from '@santi020k/lumen-core'

const bindings = new WeakMap<HTMLElement, { document: Document, cleanup: () => void }>()

export const initMediaViewportControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-media-viewport]')) {
    const previous = bindings.get(root)

    if (previous?.document === root.ownerDocument) continue

    previous?.cleanup()

    const maxZoom = () => Number(root.dataset.maxZoom ?? 4)
    const disabled = () => root.dataset.disabled === 'true'

    const getValue = () => normalizeLumenMediaViewport({
      zoom: Number(root.dataset.zoom ?? 1), x: Number(root.dataset.panX ?? 0), y: Number(root.dataset.panY ?? 0)
    }, maxZoom())

    const sync = () => {
      syncLumenMediaViewport(root, getValue(), maxZoom(), disabled(), root.dataset.locale)
    }

    const cleanup = bindLumenMediaViewport(root, {
      disabled,
      getValue,
      maxZoom,
      onValueChange: value => {
        root.dataset.zoom = String(value.zoom)

        root.dataset.panX = String(value.x)

        root.dataset.panY = String(value.y)

        sync()

        root.dispatchEvent(new CustomEvent('ui:media-viewport-change', { bubbles: true, detail: value }))
      }
    })

    const observer = new MutationObserver(sync)

    observer.observe(root, { attributes: true, attributeFilter: ['data-disabled', 'data-max-zoom', 'data-zoom', 'data-pan-x', 'data-pan-y', 'data-locale'] })

    bindings.set(root, { document: root.ownerDocument,
      cleanup: () => {
        cleanup()

        observer.disconnect()
      } })

    sync()
  }
}
