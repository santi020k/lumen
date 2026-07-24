// url=https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9/Lumen-UI-Library?node-id=6-69
// source=packages/astro/components/Button.astro
// component=Button
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const variant = instance.getEnum('Variant', {
  Default: 'default',
  Destructive: 'destructive',
  Ghost: 'ghost',
  Link: 'link',
  Outline: 'outline',
  Secondary: 'secondary'
})
const size = instance.getEnum('Size', {
  Default: 'default',
  Icon: 'icon',
  Lg: 'lg',
  Sm: 'sm'
})
const loading = instance.getBoolean('Loading')
const disabled = instance.getBoolean('Disabled')
const icon = instance.getInstanceSwap('Icon')
let iconCode

if (icon && icon.type === 'INSTANCE') {
  iconCode = icon.executeTemplate().example
}

export default {
  example: figma.code`
    <Button
      variant="${variant}"
      size="${size}"
      ${loading ? 'loading' : ''}
      ${disabled ? 'disabled' : ''}
    >
      ${iconCode}${label}
    </Button>
  `,
  id: 'lumen-astro-button',
  imports: ['import { Button } from "@santi020k/lumen-astro"'],
  metadata: { nestable: true }
}
