import {
  createLumenWorldMapSelectDetail,
  findLumenWorldMapCountry,
  type LumenWorldMapCountryGeometry,
  type LumenWorldMapMarker,
  normalizeLumenWorldMapCountries,
  normalizeLumenWorldMapHighlightedCountries,
  normalizeLumenWorldMapMarkers,
  projectLumenWorldMapCoordinate,
  resolveLumenWorldMapCountryLabel
} from '@santi020k/lumen-core/world-map'

import { defineLumenElement, type LumenCustomElementRegistry, LumenElement, type LumenElementConfig } from '../element-base.js'

export const lumenWorldMapElementConfig = {
  baseClassName: 'ui-world-map',
  observedAttributes: ['animated', 'countries', 'highlighted-countries', 'interactive', 'label', 'labels', 'list-label', 'markers', 'selected-country', 'variant'],
  tagName: 'lumen-world-map'
} as const satisfies LumenElementConfig

const readJson = (value: string | null): unknown => {
  try {
    return value === null ? undefined : JSON.parse(value)
  } catch {
    return undefined
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const parseLabels = (value: unknown): Readonly<Record<string, string>> => {
  if (!isRecord(value)) return {}

  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}

const svgNode = <K extends keyof SVGElementTagNameMap>(
  document: Document, tag: K, attributes: Readonly<Record<string, string>>
): SVGElementTagNameMap[K] => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag)

  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value)

  return node
}

const appendPatterns = (plot: SVGSVGElement, instanceId: string): void => {
  const defs = svgNode(plot.ownerDocument, 'defs', {})

  for (const state of ['neutral', 'highlight']) {
    const pattern = svgNode(plot.ownerDocument, 'pattern', {
      height: '4', id: `${instanceId}-${state}`, patternUnits: 'userSpaceOnUse', width: '4'
    })

    pattern.append(svgNode(plot.ownerDocument, 'circle', {
      class: `ui-world-map__dot ui-world-map__dot--${state}`, cx: '2', cy: '2', r: '1.1'
    }))

    defs.append(pattern)
  }

  plot.append(defs)
}

/** Load geometry explicitly through .countries; the adapter never fetches data or imports the world dataset. */
export class LumenWorldMapElement extends LumenElement {
  static override config = lumenWorldMapElementConfig

  private countryData: readonly LumenWorldMapCountryGeometry[] | undefined
  private highlightedData: readonly string[] | undefined
  private markerData: readonly LumenWorldMapMarker[] | undefined
  private labelData: Readonly<Record<string, string>> | undefined
  private abortController: AbortController | undefined
  private instanceId = `ui-world-map-${crypto.randomUUID()}`

  get countries(): readonly LumenWorldMapCountryGeometry[] {
    return this.countryData ?? normalizeLumenWorldMapCountries(readJson(this.getAttribute('countries')))
  }

  set countries(value: readonly LumenWorldMapCountryGeometry[]) {
    this.countryData = normalizeLumenWorldMapCountries(value)

    this.render()
  }

  get highlightedCountries(): readonly string[] {
    return normalizeLumenWorldMapHighlightedCountries(
      this.highlightedData ?? readJson(this.getAttribute('highlighted-countries')), this.countries
    )
  }

  set highlightedCountries(value: readonly string[]) {
    this.highlightedData = value

    this.render()
  }

  get markers(): readonly LumenWorldMapMarker[] {
    return normalizeLumenWorldMapMarkers(this.markerData ?? readJson(this.getAttribute('markers')))
  }

  set markers(value: readonly LumenWorldMapMarker[]) {
    this.markerData = value

    this.render()
  }

  get labels(): Readonly<Record<string, string>> {
    return this.labelData ?? parseLabels(readJson(this.getAttribute('labels')))
  }

  set labels(value: Readonly<Record<string, string>>) {
    this.labelData = parseLabels(value)

    this.render()
  }

  get selectedCountry(): string {
    return findLumenWorldMapCountry(this.countries, this.getAttribute('selected-country'))?.id ?? ''
  }

  set selectedCountry(value: string) {
    this.setAttribute('selected-country', value)
  }

  override connectedCallback(): void {
    super.connectedCallback()

    this.render()
  }

  override disconnectedCallback(): void {
    this.abortController?.abort()
  }

  adoptedCallback(): void {
    this.render()
  }

  override attributeChangedCallback(name: string): void {
    super.attributeChangedCallback()

    if (name === 'countries') this.countryData = undefined

    if (name === 'highlighted-countries') this.highlightedData = undefined

    if (name === 'markers') this.markerData = undefined

    if (name === 'labels') this.labelData = undefined

    if (name === 'selected-country') {
      this.updateSelection()

      return
    }

    this.render()
  }

  private updateSelection(): void {
    const id = this.selectedCountry
    const country = findLumenWorldMapCountry(this.countries, id)
    const select = this.querySelector('select')
    const inspection = this.querySelector<HTMLElement>('.ui-world-map__inspection')

    if (select) select.value = id

    if (inspection) {
      inspection.textContent = country ? resolveLumenWorldMapCountryLabel(country, this.labels) : ''

      inspection.hidden = !country
    }

    for (const path of this.querySelectorAll<SVGPathElement>('[data-country]')) {
      path.classList.toggle('ui-world-map__country--selected', path.dataset.country === id)
    }
  }

  private render(): void {
    if (!this.isConnected) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.dataset.animated = String(this.getAttribute('animated') !== 'false')

    this.dataset.interactive = String(this.getAttribute('interactive') !== 'false')

    this.dataset.variant = this.getAttribute('variant') === 'solid' ? 'solid' : 'dotted'

    const frame = this.ownerDocument.createElement('div')

    const plot = svgNode(this.ownerDocument, 'svg', {
      'aria-label': this.getAttribute('label') || 'World map', class: 'ui-world-map__plot', role: 'img', viewBox: '0 0 1000 400'
    })

    const group = svgNode(this.ownerDocument, 'g', { 'aria-hidden': 'true', class: 'ui-world-map__countries' })

    frame.className = 'ui-world-map__frame'

    if (this.dataset.variant === 'dotted') appendPatterns(plot, this.instanceId)

    for (const country of this.countries) group.append(this.countryPath(country))

    plot.append(group)

    const markerList = this.appendMarkers(plot)
    const inspection = this.ownerDocument.createElement('span')

    inspection.className = 'ui-world-map__inspection'

    frame.append(plot, inspection, markerList)

    this.replaceChildren(frame, this.highlightList())

    this.bindPointer(group, inspection)

    if (this.dataset.interactive === 'true') this.appendChooser()
  }

  private countryPath(country: LumenWorldMapCountryGeometry): SVGPathElement {
    const highlighted = this.highlightedCountries.includes(country.id)

    const path = svgNode(this.ownerDocument, 'path', {
      class: 'ui-world-map__country', d: country.path, 'data-country': country.id, 'fill-rule': 'evenodd'
    })

    path.classList.toggle('ui-world-map__country--highlighted', highlighted)

    path.classList.toggle('ui-world-map__country--selected', this.selectedCountry === country.id)

    if (this.dataset.variant === 'dotted') path.setAttribute('fill', `url(#${this.instanceId}-${highlighted ? 'highlight' : 'neutral'})`)

    const title = svgNode(this.ownerDocument, 'title', {})

    title.textContent = resolveLumenWorldMapCountryLabel(country, this.labels)

    path.append(title)

    return path
  }

  private highlightList(): HTMLUListElement {
    const list = this.ownerDocument.createElement('ul')

    list.className = 'ui-world-map__highlights'

    list.ariaLabel = 'Highlighted countries'

    for (const id of this.highlightedCountries) {
      const country = findLumenWorldMapCountry(this.countries, id)
      const item = this.ownerDocument.createElement('li')

      if (country) item.textContent = resolveLumenWorldMapCountryLabel(country, this.labels)

      list.append(item)
    }

    return list
  }

  private appendMarkers(plot: SVGSVGElement): HTMLUListElement {
    const group = svgNode(this.ownerDocument, 'g', { 'aria-hidden': 'true', class: 'ui-world-map__markers' })
    const list = this.ownerDocument.createElement('ul')

    list.className = 'ui-sr-only'

    list.ariaLabel = 'Map markers'

    for (const marker of this.markers) {
      const { x, y } = projectLumenWorldMapCoordinate(marker.longitude, marker.latitude)
      const point = svgNode(this.ownerDocument, 'circle', { class: 'ui-world-map__marker', cx: String(x), cy: String(y), r: '4' })
      const title = svgNode(this.ownerDocument, 'title', {})
      const item = this.ownerDocument.createElement('li')

      title.textContent = marker.label

      item.textContent = marker.label

      point.append(title)

      group.append(point)

      list.append(item)
    }

    plot.append(group)

    // The list is placed outside the role=img subtree, whose descendants are presentational.
    return list
  }

  private bindPointer(group: SVGGElement, inspection: HTMLSpanElement): void {
    const showCountry = (id: string | undefined): void => {
      const country = findLumenWorldMapCountry(this.countries, id)

      inspection.textContent = country ? resolveLumenWorldMapCountryLabel(country, this.labels) : ''

      inspection.hidden = !country
    }

    const readCountry = (target: EventTarget | null): string | undefined => target instanceof Element ?
      target.closest<SVGPathElement>('[data-country]')?.dataset.country :
      undefined

    const signal = this.abortController?.signal

    if (!signal) return

    showCountry(this.selectedCountry)

    group.addEventListener('mouseover', event => {
      showCountry(readCountry(event.target))
    }, { signal })

    group.addEventListener('mouseleave', () => {
      showCountry(this.selectedCountry)
    }, { signal })

    group.addEventListener('click', event => {
      if (this.dataset.interactive === 'true') this.selectCountry(readCountry(event.target) ?? '')
    }, { signal })
  }

  private appendChooser(): void {
    const signal = this.abortController?.signal

    if (!signal) return

    const label = this.ownerDocument.createElement('label')
    const text = this.ownerDocument.createElement('span')
    const select = this.ownerDocument.createElement('select')
    const listLabel = this.getAttribute('list-label') ?? 'Choose a country'

    label.className = 'ui-world-map__select-label'

    select.className = 'ui-select ui-world-map__select'

    text.textContent = listLabel

    const placeholder = this.ownerDocument.createElement('option')

    placeholder.value = ''

    placeholder.textContent = listLabel

    select.append(placeholder)

    for (const country of this.countries) {
      const option = this.ownerDocument.createElement('option')

      option.value = country.id

      option.textContent = resolveLumenWorldMapCountryLabel(country, this.labels)

      select.append(option)
    }

    select.value = this.selectedCountry

    select.addEventListener('change', () => {
      this.selectCountry(select.value)
    }, { signal })

    label.append(text, select)

    this.append(label)
  }

  private selectCountry(id: string): void {
    const country = findLumenWorldMapCountry(this.countries, id)

    if (this.selectedCountry === (country?.id ?? '')) return

    this.selectedCountry = country?.id ?? ''

    if (country) {
      this.dispatchEvent(new CustomEvent('ui:world-map-select', {
        bubbles: true,
        detail: createLumenWorldMapSelectDetail(country, new Set(this.highlightedCountries), this.labels)
      }))
    }
  }
}

export const defineLumenWorldMap = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenWorldMapElementConfig, LumenWorldMapElement, registry)
}
