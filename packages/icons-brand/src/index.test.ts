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
  test('ships the complete free brand catalog and the X convenience alias', () => {
    expect(lumenBrandIconNames.length).toBeGreaterThan(570)
    expect(lumenBrandIconNames).toEqual(expect.arrayContaining([
      'apple',
      'discord',
      'figma',
      'github',
      'linkedin',
      'medium',
      'whatsapp',
      'x',
      'x-twitter',
      'youtube'
    ]))
    expect(lumenBrandIcons.github?.style).toBe('fill')
    expect(lumenBrandIcons.x?.node).toEqual(lumenBrandIcons['x-twitter']?.node)
  })

  test('registers namespaced icons with the shared renderer', () => {
    expect(resolveLumenIconName('brand:github')).toBeUndefined()

    const registeredIcons = registerLumenBrandIcons()

    expect(registeredIcons?.github).toBe(lumenBrandIcons.github)

    expect(resolveLumenIconName('brand:github')).toBe('brand:github')
    expect(getRegisteredLumenIconNames()).toContain('brand:linkedin')
    expect(getLumenIcon('brand:whatsapp')).toBe(lumenBrandIcons.whatsapp)
    expect(getLumenIcon('brand:youtube')).toBe(lumenBrandIcons.youtube)

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
