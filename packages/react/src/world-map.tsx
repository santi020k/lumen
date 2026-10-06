'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { composeClassName } from '@santi020k/lumen-core/tokens'
import {
  createLumenWorldMapSelectDetail,
  findLumenWorldMapCountry,
  LUMEN_WORLD_MAP_VIEW_BOX,
  type LumenWorldMapCountryGeometry,
  type LumenWorldMapMarker,
  type LumenWorldMapSelectDetail,
  type LumenWorldMapVariant,
  normalizeLumenWorldMapCountries,
  normalizeLumenWorldMapHighlightedCountries,
  normalizeLumenWorldMapMarkers,
  projectLumenWorldMapCoordinate,
  resolveLumenWorldMapCountryLabel
} from '@santi020k/lumen-core/world-map'
import {
  initLumenWorldMapZoom,
  type LumenWorldMapZoomLabels,
  lumenWorldMapZoomLabels
} from '@santi020k/lumen-core/world-map-zoom'

import { Button } from './components.js'

const ZoomControls = ({ enabled, labels }: { enabled: boolean, labels: LumenWorldMapZoomLabels }) => enabled && (
  <div className="ui-world-map__zoom-controls">
    <Button aria-label={labels.zoomOut} data-ui-world-map-zoom="out" disabled size="icon" variant="outline">−</Button>
    <output aria-label={labels.level} aria-live="polite" data-ui-world-map-zoom-status>100%</output>
    <Button aria-label={labels.zoomIn} data-ui-world-map-zoom="in" disabled size="icon" variant="outline">+</Button>
    <Button data-ui-world-map-zoom="fit" disabled size="sm" variant="outline">{labels.fit}</Button>
    <Button data-ui-world-map-zoom="reset" disabled size="sm" variant="outline">{labels.reset}</Button>
  </div>
)

const MapViewport = ({ children, label, zoomable }: { children: ReactNode, label: string, zoomable: boolean }) => (
  <div aria-label={label} className="ui-world-map__viewport" data-ui-world-map-viewport role="region" tabIndex={zoomable ? 0 : undefined}>
    {children}
  </div>
)

const SelectionOutline = ({ country }: { country: LumenWorldMapCountryGeometry | undefined }) => (
  <path aria-hidden="true" className="ui-world-map__selection" d={country?.path ?? ''} />
)

interface CountryPathProps {
  country: LumenWorldMapCountryGeometry
  highlightPatternId: string
  interactive: boolean
  isHighlighted: boolean
  isSelected: boolean
  label: string
  neutralPatternId: string
  onHoverChange: (countryId: string | undefined) => void
  onSelect: (countryId: string) => void
  variant: LumenWorldMapVariant
}

const CountryPath = ({
  country, highlightPatternId, interactive, isHighlighted, isSelected,
  label, neutralPatternId, onHoverChange, onSelect, variant
}: CountryPathProps) => (
  <path
    className={composeClassName(
      'ui-world-map__country',
      isHighlighted && 'ui-world-map__country--highlighted',
      isSelected && 'ui-world-map__country--selected'
    )}
    d={country.path}
    fill={variant === 'dotted' ? `url(#${isHighlighted ? highlightPatternId : neutralPatternId})` : undefined}
    fillRule="evenodd"
    onClick={() => {
      if (interactive) onSelect(country.id)
    }}
    onMouseEnter={() => {
      onHoverChange(country.id)
    }}
    onMouseLeave={() => {
      onHoverChange(undefined)
    }}
  >
    <title>{label}</title>
  </path>
)

interface MarkerPointProps {
  marker: LumenWorldMapMarker
}

const MarkerPoint = ({ marker }: MarkerPointProps) => {
  const { x, y } = projectLumenWorldMapCoordinate(marker.longitude, marker.latitude)

  return (
    <circle className="ui-world-map__marker" cx={x} cy={y} r={4}>
      <title>{marker.label}</title>
    </circle>
  )
}

interface MarkerLayerProps {
  markers: readonly LumenWorldMapMarker[]
}

const MarkerLayer = ({ markers }: MarkerLayerProps) => markers.length > 0 && (
  <g aria-hidden="true" className="ui-world-map__markers">
    {markers.map(marker => <MarkerPoint key={marker.id} marker={marker} />)}
  </g>
)

const MarkerList = ({ markers }: MarkerLayerProps) => markers.length > 0 && (
  <ul aria-label="Map markers" className="ui-sr-only">
    {markers.map(marker => <li key={marker.id}>{marker.label}</li>)}
  </ul>
)

interface DotPatternsProps {
  highlightPatternId: string
  neutralPatternId: string
}

const DotPatterns = ({ highlightPatternId, neutralPatternId }: DotPatternsProps) => (
  <defs>
    <pattern height={4} id={neutralPatternId} patternUnits="userSpaceOnUse" width={4}>
      <circle className={composeClassName('ui-world-map__dot', 'ui-world-map__dot--neutral')} cx={2} cy={2} r={1.1} />
    </pattern>
    <pattern height={4} id={highlightPatternId} patternUnits="userSpaceOnUse" width={4}>
      <circle className={composeClassName('ui-world-map__dot', 'ui-world-map__dot--highlight')} cx={2} cy={2} r={1.1} />
    </pattern>
  </defs>
)

const Inspection = ({ country, labels }: {
  country: LumenWorldMapCountryGeometry | undefined
  labels: Readonly<Record<string, string>> | undefined
}) => country && (
  <span className="ui-world-map__inspection">{resolveLumenWorldMapCountryLabel(country, labels)}</span>
)

const MapCaption = ({ caption }: { caption: string | undefined }) => caption && <figcaption>{caption}</figcaption>

interface SelectControlProps {
  countries: readonly LumenWorldMapCountryGeometry[]
  labelOverrides?: Readonly<Record<string, string>> | undefined
  listLabel: string
  onSelect: (countryId: string) => void
  selectedId: string | undefined
}

const SelectControl = ({ countries, labelOverrides, listLabel, onSelect, selectedId }: SelectControlProps) => (
  <label className="ui-world-map__select-label">
    <span>{listLabel}</span>
    <select
      className="ui-select ui-world-map__select"
      onChange={event => {
        onSelect(event.currentTarget.value)
      }}
      value={selectedId ?? ''}
    >
      <option value="">{listLabel}</option>
      {countries.map(country => (
        <option key={country.id} value={country.id}>
          {resolveLumenWorldMapCountryLabel(country, labelOverrides)}
        </option>
      ))}
    </select>
  </label>
)

interface HighlightedListProps {
  countries: readonly LumenWorldMapCountryGeometry[]
  highlightedIds: readonly string[]
  labelOverrides?: Readonly<Record<string, string>> | undefined
}

const HighlightedList = (
  { countries, highlightedIds, labelOverrides }: HighlightedListProps
) => highlightedIds.length > 0 && (
  <ul aria-label="Highlighted countries" className="ui-world-map__highlights">
    {highlightedIds.map(id => {
      const country = findLumenWorldMapCountry(countries, id)

      return country && <li key={id}>{resolveLumenWorldMapCountryLabel(country, labelOverrides)}</li>
    })}
  </ul>
)

interface MapHeadingProps {
  description?: string | undefined
  heading?: string | undefined
}

const MapHeading = ({ description, heading }: MapHeadingProps) => (heading || description) && (
  <header className="ui-world-map__heading">
    {heading && <h3>{heading}</h3>}
    {description && <p>{description}</p>}
  </header>
)

const isCurrentCountry = (
  country: LumenWorldMapCountryGeometry | undefined,
  id: string | undefined
): boolean => country?.id === id

export interface WorldMapProps extends Omit<ComponentPropsWithoutRef<'figure'>, 'label'> {
  initialView?: 'world' | 'highlighted'
  zoomable?: boolean
  zoomLabels?: Partial<LumenWorldMapZoomLabels>
  animated?: boolean
  caption?: string
  countries: readonly LumenWorldMapCountryGeometry[]
  defaultSelectedCountry?: string
  description?: string
  heading?: string
  highlightedCountries?: readonly string[]
  interactive?: boolean
  label: string
  labels?: Readonly<Record<string, string>>
  listLabel?: string
  markers?: readonly LumenWorldMapMarker[]
  onCountrySelect?: (detail: LumenWorldMapSelectDetail) => void
  onSelectedCountryChange?: (countryId: string) => void
  selectedCountry?: string
  variant?: LumenWorldMapVariant
}

export const WorldMap = ({
  animated = true,
  caption,
  className,
  countries: inputCountries,
  defaultSelectedCountry,
  description,
  heading,
  highlightedCountries,
  interactive = true,
  label,
  labels,
  listLabel = 'Choose a country',
  markers,
  onCountrySelect,
  onSelectedCountryChange,
  selectedCountry,
  variant = 'dotted',
  initialView,
  zoomable: zoomEnabled,
  zoomLabels,
  ...props
}: WorldMapProps) => {
  const zoomable = zoomEnabled !== false
  const rootRef = useRef<HTMLElement>(null)
  const zoomText = { ...lumenWorldMapZoomLabels, ...zoomLabels }

  useEffect(() => {
    const root = rootRef.current
    const abort = new AbortController()

    if (root) initLumenWorldMapZoom(root, abort.signal)

    return () => {
      abort.abort()
    }
  }, [zoomable, initialView])

  const countries = useMemo(() => normalizeLumenWorldMapCountries(inputCountries), [inputCountries])
  const instanceId = useId().replaceAll(':', '')
  const neutralPatternId = `${instanceId}-dot-neutral`
  const highlightPatternId = `${instanceId}-dot-highlight`
  const [internalSelectedId, setInternalSelectedId] = useState(defaultSelectedCountry)
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined)
  const selectedId = findLumenWorldMapCountry(countries, selectedCountry ?? internalSelectedId)?.id

  const highlightedIds = useMemo(
    () => normalizeLumenWorldMapHighlightedCountries(highlightedCountries, countries),
    [highlightedCountries, countries]
  )

  const highlightedSet = useMemo(() => new Set(highlightedIds), [highlightedIds])

  useEffect(() => {
    const button = rootRef.current?.querySelector<HTMLButtonElement>('[data-ui-world-map-zoom="fit"]')

    if (!button) return

    button.disabled = highlightedIds.length === 0

    button.classList.toggle('ui-button--disabled', button.disabled)
  }, [highlightedIds, zoomable])

  const normalizedMarkers = useMemo(() => normalizeLumenWorldMapMarkers(markers), [markers])
  const activeId = hoveredId ?? selectedId
  const activeCountry = findLumenWorldMapCountry(countries, activeId)
  const { height: viewBoxHeight, width: viewBoxWidth } = LUMEN_WORLD_MAP_VIEW_BOX

  const selectCountry = (countryId: string): void => {
    const country = findLumenWorldMapCountry(countries, countryId)

    if (isCurrentCountry(country, selectedId)) return

    if (selectedCountry === undefined) setInternalSelectedId(country?.id)

    onSelectedCountryChange?.(country?.id ?? '')

    if (country) onCountrySelect?.(createLumenWorldMapSelectDetail(country, highlightedSet, labels))
  }

  return (
    <figure
      {...props}
      ref={rootRef}
      className={composeClassName('ui-world-map', className)}
      data-initial-view={initialView}
      data-animated={animated}
      data-interactive={interactive}
      data-variant={variant}
    >
      <MapHeading description={description} heading={heading} />
      <ZoomControls enabled={zoomable} labels={zoomText} />
      <div className="ui-world-map__frame">
        <MapViewport label={`${zoomText.viewport}: ${label}`} zoomable={zoomable}>
          <svg
            aria-label={label}
            className="ui-world-map__plot"
            role="img"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          >
            {variant === 'dotted' && (
              <DotPatterns highlightPatternId={highlightPatternId} neutralPatternId={neutralPatternId} />
            )}
            <g aria-hidden="true" className="ui-world-map__countries">
              {countries.map(country => (
                <CountryPath
                  key={country.id}
                  country={country}
                  highlightPatternId={highlightPatternId}
                  interactive={interactive}
                  isHighlighted={highlightedSet.has(country.id)}
                  isSelected={selectedId === country.id}
                  label={resolveLumenWorldMapCountryLabel(country, labels)}
                  neutralPatternId={neutralPatternId}
                  onHoverChange={setHoveredId}
                  onSelect={selectCountry}
                  variant={variant}
                />
              ))}
            </g>
            <MarkerLayer markers={normalizedMarkers} />

            <SelectionOutline country={findLumenWorldMapCountry(countries, selectedId)} />
          </svg>
        </MapViewport>
        <Inspection country={activeCountry} labels={labels} />
      </div>
      {interactive && (
        <SelectControl
          countries={countries}
          labelOverrides={labels}
          listLabel={listLabel}
          onSelect={selectCountry}
          selectedId={selectedId}
        />
      )}
      <HighlightedList countries={countries} highlightedIds={highlightedIds} labelOverrides={labels} />
      <MarkerList markers={normalizedMarkers} />
      <MapCaption caption={caption} />
    </figure>
  )
}
