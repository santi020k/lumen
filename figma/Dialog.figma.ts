// url=https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9/Lumen-UI-Library?node-id=45-12
// source=packages/astro/components/Dialog.astro
// component=Dialog
import _figma from 'figma'

import type { FigmaStatic } from './types.ts'

const figma = _figma as unknown as FigmaStatic
const instance = figma.selectedInstance
const title = instance.getString('Title')
const description = instance.getString('Description')
const cancelLabel = instance.getString('Cancel label')
const confirmLabel = instance.getString('Confirm label')
const showContent = instance.getBoolean('Show content')
const showActions = instance.getBoolean('Show actions')

export default {
  example: figma.code`
    <Dialog>
      <h2>${title}</h2>
      ${showContent ? figma.code`<p>${description}</p>` : ''}
      ${showActions
        ? figma.code`
          <div>
            <Button variant="outline">${cancelLabel}</Button>
            <Button>${confirmLabel}</Button>
          </div>
        `
        : ''}
    </Dialog>
  `,
  id: 'lumen-astro-dialog',
  imports: [
    'import { Button, Dialog } from "@santi020k/lumen-astro"'
  ],
  metadata: { nestable: true }
}
