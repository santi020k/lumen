import { describe, expect, test } from 'vitest'

import {
  lumenIllustrationNames,
  lumenIllustrations,
  renderLumenIllustrationSvg
} from './illustrations.generated.js'

describe('generated illustration catalog', () => {
  test('contains each supported semantic scene', () => {
    expect(lumenIllustrationNames).toEqual(['empty', 'success', 'error', 'offline'])
    expect(Object.keys(lumenIllustrations)).toEqual(lumenIllustrationNames)
  })

  test.each(lumenIllustrationNames)('renders %s as safe internal SVG markup', name => {
    const svg = renderLumenIllustrationSvg(name)

    expect(svg).toMatch(/^<svg aria-hidden="true"/)
    expect(svg).toContain('class="ui-illustration__wash"')
    expect(svg).not.toContain('<script')
    expect(svg).toMatch(/<\/(?:svg)>$/)
  })
})
