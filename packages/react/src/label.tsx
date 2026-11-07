import type { ComponentPropsWithRef } from 'react'

import { composeClassName } from '@santi020k/lumen-core/tokens'

export type LabelProps = ComponentPropsWithRef<'label'>

export const Label = ({ className, ...props }: LabelProps) => (
  <label className={composeClassName('ui-label', className)} {...props} />
)
