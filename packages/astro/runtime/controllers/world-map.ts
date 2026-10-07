import type { LumenWorldMapSelectDetail } from '@santi020k/lumen-core'
import { initLumenWorldMapZoom } from '@santi020k/lumen-core/world-map-zoom'

interface WorldMapBinding {
  abort: AbortController
  group: SVGGElement
  select: HTMLSelectElement | null
}

const boundWorldMaps = new WeakMap<HTMLElement, WorldMapBinding>()

const findCountryPath = (group: SVGGElement, countryId: string): SVGPathElement | null => [...group.querySelectorAll<SVGPathElement>('[data-ui-world-map-country]')]
  .find(path => path.dataset.uiWorldMapCountry === countryId) ?? null

const closestCountryPath = (group: SVGGElement, target: EventTarget | null): SVGPathElement | null => {
  const ElementConstructor = group.ownerDocument.defaultView?.Element ?? Element

  if (!(target instanceof ElementConstructor)) return null

  return target.closest<SVGPathElement>('[data-ui-world-map-country]')
}

const readSelectDetail = (path: SVGPathElement): LumenWorldMapSelectDetail => ({
  countryId: path.dataset.uiWorldMapCountry ?? '',
  highlighted: path.classList.contains('ui-world-map__country--highlighted'),
  label: path.dataset.label ?? ''
})

const matchesBinding = (
  binding: WorldMapBinding | undefined,
  group: SVGGElement | null,
  select: HTMLSelectElement | null
): boolean => {
  if (!binding) return false

  return binding.group === group && binding.select === select
}

const isWorldMapRoot = (scope: ParentNode): scope is HTMLElement => (
  'namespaceURI' in scope && scope.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
  Element.prototype.matches.call(scope, '[data-ui-world-map]')
)

const createWorldMapRealm = (root: HTMLElement) => {
  const view = root.ownerDocument.defaultView
  const AbortConstructor = view?.AbortController ?? AbortController
  const EventConstructor = view?.CustomEvent ?? CustomEvent

  return { abort: new AbortConstructor(), EventConstructor }
}

const updateSelectionOutline = (root: HTMLElement, path: SVGPathElement | null): void => {
  root.querySelector('.ui-world-map__selection')?.setAttribute('d', path?.getAttribute('d') ?? '')
}

export const initWorldMapControllers = (scope: ParentNode): void => {
  const roots = [...scope.querySelectorAll<HTMLElement>('[data-ui-world-map]')]

  if (isWorldMapRoot(scope)) roots.unshift(scope)

  for (const root of roots) {
    const group = root.querySelector<SVGGElement>('.ui-world-map__countries')
    const select = root.querySelector<HTMLSelectElement>('[data-ui-world-map-select]')
    const previousBinding = boundWorldMaps.get(root)

    if (select) select.disabled = root.dataset.interactive === 'false'

    if (matchesBinding(previousBinding, group, select)) continue

    previousBinding?.abort.abort()

    boundWorldMaps.delete(root)

    if (!group) continue

    const { abort, EventConstructor } = createWorldMapRealm(root)
    const { signal } = abort

    initLumenWorldMapZoom(root, signal)

    boundWorldMaps.set(root, { abort, group, select })

    const showLabel = (path: SVGPathElement | null): void => {
      const inspection = root.querySelector<HTMLElement>('[data-ui-world-map-inspection]')

      if (inspection) {
        inspection.textContent = path?.dataset.label ?? ''

        inspection.hidden = !path
      }
    }

    const currentSelection = (): SVGPathElement | null => group.querySelector<SVGPathElement>('.ui-world-map__country--selected')

    const selectCountry = (countryId: string): void => {
      const previous = currentSelection()
      const next = countryId ? findCountryPath(group, countryId) : null

      if (previous === next) return

      previous?.classList.remove('ui-world-map__country--selected')

      next?.classList.add('ui-world-map__country--selected')

      if (select) select.value = next ? countryId : ''

      updateSelectionOutline(root, next)

      showLabel(next)

      if (next) {
        root.dispatchEvent(new EventConstructor<LumenWorldMapSelectDetail>('ui:world-map-select', {
          bubbles: true,
          detail: readSelectDetail(next)
        }))
      }
    }

    group.addEventListener('mouseover', event => {
      const path = closestCountryPath(group, event.target)

      if (path) showLabel(path)
    }, { signal })

    group.addEventListener('mouseleave', () => {
      showLabel(currentSelection())
    }, { signal })

    group.addEventListener('click', event => {
      if (root.dataset.interactive === 'false') return

      const path = closestCountryPath(group, event.target)

      if (path?.dataset.uiWorldMapCountry) selectCountry(path.dataset.uiWorldMapCountry)
    }, { signal })

    if (select && root.dataset.interactive !== 'false') {
      select.disabled = false

      select.addEventListener('change', () => {
        if (root.dataset.interactive === 'false') return

        selectCountry(select.value)
      }, { signal })
    }

    showLabel(currentSelection())
  }
}
