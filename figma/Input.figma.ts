// url=https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9/Lumen-UI-Library?node-id=14-21
// source=packages/astro/components/Input.astro
// component=Input
import figma from 'figma'

const instance = figma.selectedInstance
const placeholder = instance.getString('Placeholder')

const size = instance.getEnum('Size', {
  Default: 'default',
  Lg: 'lg',
  Sm: 'sm'
})

export default {
  example: figma.code`<Input placeholder="${placeholder}" size="${size}" />`,
  id: 'lumen-astro-input',
  imports: ['import { Input } from "@santi020k/lumen-astro"'],
  metadata: { nestable: true }
}
