// url=https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9/Lumen-UI-Library?node-id=355-43
// source=packages/astro/components/Tabs.astro
// component=Tabs
import figma from 'figma'

const instance = figma.selectedInstance

const active = instance.getEnum('Active', {
  Details: 'details',
  Overview: 'overview',
  Settings: 'settings'
})

const overviewLabel = instance.getString('Overview label')
const detailsLabel = instance.getString('Details label')
const settingsLabel = instance.getString('Settings label')

export default {
  example: figma.code`
    <Tabs>
      <div role="tablist">
        <button role="tab" aria-selected="${active === 'overview'}">${overviewLabel}</button>
        <button role="tab" aria-selected="${active === 'details'}">${detailsLabel}</button>
        <button role="tab" aria-selected="${active === 'settings'}">${settingsLabel}</button>
      </div>
    </Tabs>
  `,
  id: 'lumen-astro-tabs',
  imports: ['import { Tabs } from "@santi020k/lumen-astro"'],
  metadata: { nestable: true }
}
