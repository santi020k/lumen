// url=https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9/Lumen-UI-Library?node-id=14-27
// source=packages/astro/components/Card.astro
// component=Card
import _figma from 'figma'

import type { FigmaStatic } from './types.ts'

const figma = _figma as unknown as FigmaStatic
const instance = figma.selectedInstance
const title = instance.getString('Title')
const body = instance.getString('Body')

export default {
  example: figma.code`
    <Card>
      <h3>${title}</h3>
      <p>${body}</p>
    </Card>
  `,
  id: 'lumen-astro-card',
  imports: ['import { Card } from "@santi020k/lumen-astro"'],
  metadata: { nestable: true }
}
