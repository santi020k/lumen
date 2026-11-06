import type { DesignNode } from './model.js'
import { presentationName } from './presentations.js'

// Observed in the canonical library on 2026-10-04. Keys identify components even
// after instances are renamed; copied libraries need explicit remapping.
export const libraryFileKey = 'luQW2pTQ3jGGxSFPAAsfa9'
export const componentKeys = {
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
  Dialog: ['aff971d57145266e8a99647a38b3902d45a9cc71'],
  // Additional canonical components and variants inspected on 2026-11-06.
  Badge: [
    'd415469948b8af796be2d463e52f863ff7c8d3f1',
    '619bb7ca82b4a9d50f435247c240dd8ecdca2ed7',
    'd8e19c5c5bf7f8d2f6832e8b99f2964f88f2fd93',
    '4dc1a1c133182411fd7b81ecad8797b8776df798',
    '478ef33833ac351782601d100718987ad98c0ef4',
    '68f2c196889869ce1a64083cbac69645bb489215',
    '71785942eef12c47d63d81c408472d315e07ad33'
  ],
  Code: [
    '497f687bae75a3d9606888f8bf81bf4fe7b61695',
    'b61b10c85e2da34014ba8b46788f515b4876b639',
    'a121954dcc764990d2ffbad6371770bc71008c61',
    'ad9efc85c2ac80134892c5f2f59d196211d093e5'
  ],
  CardTitle: ['990d6e6180fdfa79d55253d27df74290cf4b6b55'],
  CardDescription: ['603e37ee295ecb003cebd6d28cc7c272b095cea3'],
  CodeTabs: [
    '787f2b4c892dbe7b391fae0978cbfa5e1d3d4e62',
    '4db2b4a684a703a7992a43b0c3e0a4c82c594c05',
    '306999f1ccaadad23b40d78bbe658ff5f477dc83',
    '6df12ffd0fd549fc6739bb03cc6cefdd4e4382a1',
    'a44836a54b0cf5cf053441a4d2b601abc9eb2cfb',
    '0e151f25f2c8021f2042d193aa08b04f9f9c3dc8',
    '22b961b9fba27217551fe32e9682ff97b8a35aa3'
  ],
  Prose: ['9a943edaa0fc1bd9a787850e6440f246b3e491b0'],
  Timeline: ['53fdba95f21488d2e865baa1f1ec45313a1367ec'],
  Callout: ['947176e036bc7718f2c355dd60d187b45327c20d'],
  Note: [
    '344907ef7c6a3968a8b326bf1acc2b16f248c3f6',
    'e6386414bbd04cbba213edc2a3f84283ae420e54',
    '24a60d06b68c7e3ed6230b96afe1fe4a5edc824c',
    '8bcdc2c9a6a595885389a61a7e7c099529af630f'
  ],
  Stack: [
    'cd48bfb9177c716c57face71c58de922e118ab0b',
    'b8fc8376d8c785e0f9a893ce68aab8e8df14e031',
    '855e4e1d35f1cf47c02e6478f827fc74a306ffc9',
    'dda94978f3b3e1a44741ed22c939862e1db743d6',
    'b1dea5fa7a37a36539c94e73f813a1f20a5e72be',
    '03166a62956895f41b7a3fd89a056289c2e4ffa1',
    '2a546df36e05be2bb4f0af40f55b92700ced0118',
    '7d1947c765bf3ebe49cafe033c132aaa065445f1',
    '5f941d5ec7de93f83d866ac3d45bce9ebb451fa4',
    'f12d32fb81545b6703ac15ffebd929212f4a73b1',
    'ce30ac392bd7db8bd6f98f3b25561a7086466016'
  ],
  Kbd: ['ef0dce017e67ed72968e01739cc1bfb7b911ab17'],
  ThemeToggle: [
    '2cb2f1d550477b0ec8166b338669075b447a5edd',
    '988aceae790f014f8b7d2db854f02fc3f56b1125',
    '5d7af89830776458fc8f33e7b97e66bb5368e8cf',
    '041ff8211a09341bc3dbdf1ff47a783585a08c6e',
    '0fd96fa70cac54ff0a5a3158643103b253012185'
  ],
  ScrollReveal: [
    '4821adb189bfd2bbc54d4427c6d1aebd2f35cd48',
    'cdd7b61ba6a3b04e035e7359582c04e7cb07649a',
    '73937e4e78fa010ae2290cd0eca015fcb723647d',
    '2c957fb73390450f15823549fd2dd0a02c0087a4',
    '6781b275c8d162dbeb08a309ca5d18ad93668c18',
    'bed6ac420465a9eb678bfef9ace82e740cbb1ffe',
    'e7a9e93d544bdd50de1af1082e5a5782f2b37f45'
  ],
  RevealGroup: [
    '2aeaabf5b2f8ab857bc1d1fa4dce1892680ae1e8',
    '251ee430588d0e557bc9069b610c7e76652d306c',
    '141e89066587aead3c788efa8e17e19ada9158d9',
    '7d33b7793f1b258f9ca45487b1c3d72193c9db18',
    'fa5313395f7e36d43cdc360aaa45845332a6b701',
    '06d83e20ace6bf68215db9fdd8628d6b7b8fa530',
    '463323e5b9b61255149902eedcac1d996addc6de',
    '751e17e55911a0aec6a726ca6463aabb027f3313',
    'a2af5cd9f0b3d59e1fe131becd23cf90b56f8ae4',
    'a1d1588dbf32380644fb8f7e0ec230d06d3405c3',
    '71a32d5c47173053c68801070ac9b9305b8ff02f',
    '7383b8d00b6d0860dc422efa63ac25a3a95b50dc',
    'fc7fcbb1c734ed1a3cf13b268fa8d983fa71d9a1',
    '87b0ad349d96945edca9d5186fdbbc25f967b112',
    'a6ba885341fc7d3be6e297cd961916298b058a05',
    '70d48b241a2af4b9166919c99d5ac89ae921b498',
    '628318566eaebdbb6929e98f83f582d38ce5de4e',
    'c57e9afe40508fba9773a6a75bc3206b134cf185',
    '8627f92b04ca8c653faf122b440d7de10c4eb408'
  ],
  Eyebrow: ['2af89c37f14a96aed277fab3b9fdbaf3a9264dd1']
}

export type ComponentName = keyof typeof componentKeys

export const isComponentName = (value: string): value is ComponentName => Object.hasOwn(componentKeys, value)

const originalComponent = (node: DesignNode): ComponentName | null => {
  if (!node.component) return null

  for (const name of Object.keys(componentKeys)) {
    if (!isComponentName(name)) continue

    const keys = componentKeys[name]
    const matchesSet = node.component.setKey && keys.includes(node.component.setKey)

    if (keys.includes(node.component.key) || matchesSet) return name
  }

  return null
}

export const identifyComponent = (node: DesignNode): ComponentName | null => {
  const presentation = presentationName(node)

  if (!presentation) return originalComponent(node)

  const [content] = node.children

  return node.children.length === 1 && content && originalComponent(content) === presentation ? presentation : null
}

export const withPresentationContent = (node: DesignNode): DesignNode => {
  const [content] = node.children

  if (!content || !presentationName(node) || !identifyComponent(node)) return node

  return { ...node, properties: { ...content.properties, ...node.properties } }
}
