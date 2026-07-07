import {
  createThemeFromHue,
  exportThemeCss
} from '@santi020k/lumen-core'
import {
  Button,
  Card,
  Input,
  ThemeBuilder
} from '@santi020k/lumen-react'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

export const ThemeBuilderRecipe = () => {
  const [hue, setHue] = useState(264)
  const tokens = useMemo(() => createThemeFromHue(hue), [hue])

  const previewStyle = useMemo(() => Object.fromEntries(
    Object.entries(tokens).map(([token, value]) => [`--${token}`, value])
  ) as CSSProperties, [tokens])

  const css = useMemo(() => exportThemeCss(tokens), [tokens])

  return (
    <ThemeBuilder className="lumen-recipe lumen-recipe--theme-builder">
      <header><h2>Brand theme</h2><Button type="button" onClick={() => navigator.clipboard.writeText(css)}>Copy CSS</Button></header>
      <Card id="lumen-theme-preview" style={previewStyle}>
        <span data-ui-swatch style={{ '--ui-swatch': 'hsl(var(--brand))' } as CSSProperties}></span>
        <span data-ui-swatch style={{ '--ui-swatch': 'hsl(var(--accent))' } as CSSProperties}></span>
      </Card>
      <Card>
        <Input
          aria-label="Brand hue"
          max="359"
          min="0"
          type="range"
          value={hue}
          onChange={(event) => { setHue(Number(event.currentTarget.value)); }}
        />
      </Card>
      <textarea aria-label="Theme CSS" readOnly value={css}></textarea>
    </ThemeBuilder>
  )
}
