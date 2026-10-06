# WorldMap

WorldMap is a reusable SVG visualization for travel, coverage, or geographic storytelling. The
consumer owns country selection, labels, destination metadata, and navigation. Lumen provides the
map appearance and accessible interaction; it does not fetch data, track visitors, or infer visits.

```astro
---
import { UIPrimitives, WorldMap } from '@santi020k/lumen-astro'
import { lumenWorldMapCountries } from '@santi020k/lumen-core/world-map-data'
---

<WorldMap
  countries={lumenWorldMapCountries}
  label="Countries I have visited"
  highlightedCountries={['CO', 'JP', 'PT']}
  markers={[{ id: 'tokyo', label: 'Tokyo', latitude: 35.68, longitude: 139.69 }]}
/>
<UIPrimitives />
```

Import the world dataset explicitly. It is never included by the core, Astro, React, or Elements
root exports. The component has no mapping dependency and makes no runtime network requests.
Custom `countries` can supply a subset or alternative SVG geometry using the documented 1000 × 400
equirectangular projection. See [map data provenance](../maps/README.md) for the dataset, license,
coordinate bounds, generator, and territory conventions. Small countries remain selectable through
the native chooser even when their shapes are too small to tap comfortably.

Zoom controls are enabled by default: zoom from 100% to 800% in 50% steps, zoom out, or reset.
Drag an enlarged map with a mouse or pen to pan without changing the country selection.
The focused viewport supports native keyboard scrolling; touch and trackpad scrolling also let you
explore an enlarged map. Controls preserve the center while changing scale and stop at both limits.
Set `zoomable={false}` (Elements: `zoomable="false"`) to hide the controls. Localize their accessible
names with `zoomLabels={{ zoomIn: 'Acercar', zoomOut: 'Alejar', reset: 'Restablecer', level: 'Zoom',
viewport: 'Mapa' }}` or Elements `zoom-labels` JSON. Country selection remains independent of zoom.

Use `variant="solid"` for filled country silhouettes; `dotted` is the default. Set `interactive={false}`
for a display-only map, and `animated={false}` to stop entrance and marker animations. Reduced-motion
preferences always disable animation. Highlighted country names remain visible without JavaScript
in Astro, and markers have a screen-reader list outside the SVG image. The Astro chooser becomes
available when `UIPrimitives` enhances the page.

Customize colors on the map or an ancestor:

```css
.travel-map {
  --ui-world-map-land: #c5c9cf;
  --ui-world-map-highlight: #167d61;
  --ui-world-map-marker: #d34f27;
  --ui-world-map-surface: #f7faf9;
}
```

Map styling is loaded automatically by the normal Lumen stylesheet and can also be imported from
`@santi020k/lumen/styles/world-map.css` alongside the foundation styles. Defaults follow Lumen's semantic theme tokens. `labels={{ CO: 'Colombia', JP: '日本' }}` overrides
country names. Localize `label`, `listLabel`, optional figure copy, and marker labels in the consumer.
Country codes are trimmed, uppercased, and deduplicated; unknown highlighted codes are dropped.
Markers require unique IDs, nonempty labels, and finite coordinates within longitude −180…180 and
the visible latitude band −60…84. Invalid markers are dropped. Antarctica is excluded.

React uses the same props, plus `onCountrySelect(detail)` and controlled `selectedCountry` or
uncontrolled `defaultSelectedCountry`. Import `WorldMap` from `@santi020k/lumen-react` or its granular
`components/world-map` export. Import the dataset separately from core as above.

Astro and Elements emit a bubbling `ui:world-map-select` event when a different country is selected:
`{ countryId, highlighted, label }`. The consumer decides whether to open a travel entry or update
other UI. Hover labels are decorative; the labeled native select provides the keyboard path.

For Web Components, register only the map when desired:

```ts
import {
  defineLumenWorldMap,
  LumenWorldMapElement
} from '@santi020k/lumen-elements/components/world-map'
import { lumenWorldMapCountries } from '@santi020k/lumen-core/world-map-data'
import '@santi020k/lumen-elements/styles.css'

defineLumenWorldMap()
const map = document.querySelector('lumen-world-map')
if (map instanceof LumenWorldMapElement) {
  map.countries = lumenWorldMapCountries
  map.highlightedCountries = ['CO', 'JP', 'PT']
}
```

```html
<lumen-world-map label="Countries I have visited" variant="dotted"></lumen-world-map>
```

Elements supports `countries`, `highlightedCountries`, `markers`, and `labels` properties, or JSON
attributes (`countries`, `highlighted-countries`, `markers`, `labels`). Prefer properties for large
geometry. Use `selectedCountry` or `selected-country`, `list-label`, `variant`, `interactive="false"`,
and `animated="false"`. Malformed JSON becomes an empty collection. Assign properties after
registration. Content inside the element is replaced by its renderer; put headings and captions
outside it and provide an authored fallback for JavaScript-disabled pages.
