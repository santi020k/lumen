import {
  getLumenIcon,
  getRegisteredLumenIconNames,
  renderLumenIconSvg,
  resolveLumenIconName
} from '@santi020k/lumen-core'

import { describe, expect, test } from 'vitest'

import {
  lumenBrandIconNames,
  lumenBrandIcons,
  registerLumenBrandIcons
} from './index.js'

describe('Lumen brand icons', () => {
  test('ships the initial social brand set', () => {
    expect(lumenBrandIconNames).toEqual([
      'github',
      'linkedin',
      'medium',
      'whatsapp',
      'x'
    ])
    expect(lumenBrandIcons.github.style).toBe('fill')
  })

  test('registers namespaced icons with the shared renderer', () => {
    expect(resolveLumenIconName('brand:github')).toBeUndefined()

    registerLumenBrandIcons()

    expect(resolveLumenIconName('brand:GitHub')).toBe('brand:github')
    expect(getRegisteredLumenIconNames()).toContain('brand:linkedin')
    expect(getLumenIcon('brand:whatsapp')).toBe(lumenBrandIcons.whatsapp)

    const svg = renderLumenIconSvg('brand:x')

    expect(svg).toContain('class="ui-icon__svg brand-x"')
    expect(svg).toContain('fill="currentColor"')
    expect(svg).toContain('stroke="none"')
    expect(svg).toContain('viewBox="0 0 448 512"')
  })

  test('is safe to register repeatedly', () => {
    registerLumenBrandIcons()
    registerLumenBrandIcons()

    expect(resolveLumenIconName('brand:medium')).toBe('brand:medium')
  })
})
