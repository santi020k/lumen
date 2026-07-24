// url=https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9/Lumen-UI-Library?node-id=14-22
// source=packages/astro/components/Field.astro
// component=Field
import figma from 'figma'

const instance = figma.selectedInstance
const label = instance.getString('Label')
const helperText = instance.getString('Helper text')
const showHelper = instance.getBoolean('Show helper')
const control = instance.getInstanceSwap('Control')
let controlCode

if (control && control.type === 'INSTANCE') {
  controlCode = control.executeTemplate().example
}

export default {
  example: figma.code`
    <Field>
      <Label>${label}</Label>
      ${controlCode}
      ${showHelper ? figma.code`<p>${helperText}</p>` : ''}
    </Field>
  `,
  id: 'lumen-astro-field',
  imports: [
    'import { Field, Label } from "@santi020k/lumen-astro"'
  ],
  metadata: { nestable: true }
}
