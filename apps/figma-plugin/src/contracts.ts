import astroPackage from '@santi020k/lumen-astro/package.json'

import type { ComponentName, DesignNode } from './model.js'

// Observed in the canonical library on 2026-10-04. Keys identify components even
// after instances are renamed; copied libraries need explicit remapping.
export const libraryFileKey = 'luQW2pTQ3jGGxSFPAAsfa9'
export const lumenVersion = astroPackage.version
export const componentKeys: Record<ComponentName, string[]> = {
  Button: [
    'd96c37321f9005806d7ebf4ecd489e2f9f4c8ec1',
    '320cb7e3e957bf5ef7055c2ba2e90f98f0fec628',
    'a8aa54cd3b7a5a9bcb089f420151d9946552c7cd',
    'f64094fa6dade116ba5e22ed7d59e3c39b5d3bfc',
    '46ced8c6004ff69bc6523a3a7fc02b5e8e2b8383',
    '5f2f08e6fd51af7d81de2bf7aa9fdf1990cd2025',
    '5058b6e78072e1692a97e1f49b9bb24777f89b01',
    '8206d187c529053d424043642c815ab83242aec0',
    '5e661717e5d8e08a578838c64140b09fc7445374',
    'bcabf24ba211392c730ad4f0e1ce3a95badd0680',
    'e7704b2bbdcf17ab845c4459b63a5b6f61d03dcb',
    'ee1d4581a6a83afcb47a198151fc4937fac8253d',
    '2474bb2aa0b8a3ea225c8a1f6fce663878270052',
    '9acb3179d787f56c26f302ebab684d8f8b7af553',
    '1ac6c3229748725a23081b6d14524f63f9e02752',
    '94202b171d37b16286b55d66dc724214ce33a130',
    '659d24fb141d5336c0a89b1fb50acf7da31d92dd',
    '867c79cb1de8c6bf32969e66494927f9d288d1eb',
    'ee47f5b0486fccc34082a911a26c56c1e6d8739c',
    'c7c8713a9901857ddb5694462c4de1ba5753b018',
    '91923a8e7caec9a55f739a03dd66d328f135011c',
    '3c03b8807d40fe3756b1cb46716576ca382f49ab',
    '8d4e4f587e4e19906190cafef3bd6c69d9bbe2fb',
    '322d06ef2aa6b8ee5cd1269e6fe6061bc381039a',
    '8d2eff253b992473f6c42e93f72ba7c28e37bd3c'
  ],
  Input: [
    '3a059f8b58b8d2f413a7c1961955f0558436fee5',
    '45b3a2a9f6d41e9fb649a00bf1d8fb1c4e270ef7',
    '1070a088767c55bef61ab09757785704a53d9319',
    '786147070f704ec8c5548d5cc8ae01ce59dd3f21'
  ],
  Field: ['e41a3db0c89b8caadcf6e380e3c572514825418d'],
  Card: ['1698fe402ec2e4bd1fb73b2bc600c05a9168eff4'],
  Tabs: [
    '1b6424705fbfc043aacee486c875e2e8ab4db5d6',
    '88a4a83e4262523c029c9e70311fd9e52ee198dc',
    '41d459ed3f7af097324c5576e98c8e5ea473d59c',
    'f806a9bab3b60ed292e2d6ce71dccb5a70468915'
  ],
  Dialog: ['aff971d57145266e8a99647a38b3902d45a9cc71']
}

export const isComponentName = (value: string): value is ComponentName => Object.hasOwn(componentKeys, value)

export const identifyComponent = (node: DesignNode): ComponentName | null => {
  if (!node.component || node.type !== 'INSTANCE') return null

  for (const name of Object.keys(componentKeys)) {
    if (!isComponentName(name)) continue

    const keys = componentKeys[name]
    const matchesSet = node.component.setKey && keys.includes(node.component.setKey)

    if (keys.includes(node.component.key) || matchesSet) return name
  }

  return null
}
