import type { ReactElement } from 'react'

import {
  type LumenIconGraphic,
  LumenStaticIcon,
  LumenStaticIconButton,
  type LumenStaticIconButtonProps,
  type LumenStaticIconProps
} from './icon-primitives.js'
import { getLumenIconGraphic, type LumenIconName } from './icons.generated.js'

export {
  LumenBadge,
  type LumenBadgeProps,
  LumenButton,
  type LumenButtonIntent,
  type LumenButtonProps,
  type LumenControlSize,
  LumenDivider,
  type LumenDividerProps,
  type LumenIconSize,
  LumenSpinner,
  type LumenSpinnerProps,
  LumenSurface,
  type LumenSurfacePadding,
  type LumenSurfaceProps,
  type LumenSurfaceRadius,
  type LumenSurfaceTone,
  LumenText,
  LumenTextField,
  type LumenTextFieldProps,
  type LumenTextProps,
  type LumenTextTone,
  type LumenTextVariant } from './foundation-primitives.js'
export type { LumenIconGraphic, LumenIconGraphicProps } from './icon-primitives.js'

type LumenIconSourceProps =
  { icon: LumenIconGraphic, name?: never } |
  { icon?: never, name: LumenIconName }

export type LumenIconProps = Omit<LumenStaticIconProps, 'icon'> & LumenIconSourceProps
export type LumenIconButtonProps = Omit<LumenStaticIconButtonProps, 'icon'> & LumenIconSourceProps

const resolveIconGraphic = (
  icon: LumenIconGraphic | undefined,
  name: LumenIconName | undefined
): LumenIconGraphic => {
  if (name) return getLumenIconGraphic(name)

  if (icon) return icon

  throw new Error('Lumen icons require either a shared name or a custom graphic component.')
}

export const LumenIcon = ({ icon, name, ...props }: LumenIconProps): ReactElement => (
  <LumenStaticIcon {...props} icon={resolveIconGraphic(icon, name)} />
)

export const LumenIconButton = ({ icon, name, ...props }: LumenIconButtonProps): ReactElement => (
  <LumenStaticIconButton {...props} icon={resolveIconGraphic(icon, name)} />
)
