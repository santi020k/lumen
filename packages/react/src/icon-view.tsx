import type { ComponentPropsWithoutRef } from 'react'

import type { LumenIconData } from '@santi020k/lumen-core'

import { renderIconSvg } from './icon-svg.js'

type IconSize = 'default' | 'lg' | 'sm' | 'xl'

const iconSizeClass = (size: IconSize) => size === 'default' ? undefined : `ui-icon--${size}`

interface IconAccessibilityOptions {
  ariaHidden: boolean | 'false' | 'true' | undefined
  ariaLabel: string | undefined
  decorative: boolean | undefined
  label: string | undefined
  role: string | undefined
}

const getIconAccessibility = ({
  ariaHidden,
  ariaLabel,
  decorative,
  label,
  role
}: IconAccessibilityOptions) => {
  const accessibleLabel = label ?? ariaLabel
  const isDecorative = decorative ?? !accessibleLabel

  if (isDecorative) {
    return {
      ariaHidden: ariaHidden ?? true,
      ariaLabel: undefined,
      role
    }
  }

  return {
    ariaHidden,
    ariaLabel: accessibleLabel,
    role: role ?? 'img'
  }
}

export interface IconViewProps extends ComponentPropsWithoutRef<'span'> {
  decorative?: boolean
  icon?: LumenIconData | undefined
  label?: string
  size?: IconSize
}

export const IconView = ({
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  children,
  className,
  decorative,
  icon,
  label,
  role,
  size = 'default',
  ...props
}: IconViewProps) => {
  const accessibility = getIconAccessibility({ ariaHidden, ariaLabel, decorative, label, role })

  return (
    <span
      aria-hidden={accessibility.ariaHidden}
      aria-label={accessibility.ariaLabel}
      className={['ui-icon', iconSizeClass(size), className].filter(Boolean).join(' ')}
      role={accessibility.role}
      {...props}
    >
      {icon ?
        renderIconSvg(icon, `ui-icon__svg ${icon.source ?? 'lucide'}-${icon.name ?? 'icon'}`) :
        children}
    </span>
  )
}
