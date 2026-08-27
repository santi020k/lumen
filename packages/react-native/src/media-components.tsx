import { type ReactElement, type Ref } from 'react'
import {
  type HostInstance,
  Image,
  type ImageProps,
  type ImageSourcePropType,
  type ImageStyle } from 'react-native'

import {
  resolveLumenImageAspectRatio,
  resolveLumenImageRadius
} from './media-recipes.js'
import { useLumenTheme } from './theme-context.js'

export type LumenImageFit = 'contain' | 'cover'
export type LumenImageRadius = 'full' | 'lg' | 'md' | 'none' | 'sm'

export interface LumenImageProps extends Omit<
  ImageProps,
  'accessibilityLabel' | 'accessible' | 'resizeMode' | 'source'
> {
  aspectRatio?: number
  decorative?: boolean
  fit?: LumenImageFit
  label?: string
  radius?: LumenImageRadius
  ref?: Ref<HostInstance>
  source: ImageSourcePropType
}

export const LumenImage = ({
  aspectRatio,
  decorative,
  fit = 'cover',
  label,
  radius = 'lg',
  ref,
  style,
  ...props
}: LumenImageProps): ReactElement => {
  const theme = useLumenTheme()
  const isDecorative = decorative ?? !label
  const safeAspectRatio = resolveLumenImageAspectRatio(aspectRatio)

  const imageStyle: ImageStyle = {
    ...(safeAspectRatio === undefined ? {} : { aspectRatio: safeAspectRatio }),
    borderRadius: resolveLumenImageRadius(theme.radii, radius),
    maxWidth: '100%',
    width: '100%'
  }

  return (
    <Image
      ref={ref}
      {...props}
      accessibilityElementsHidden={isDecorative}
      accessibilityLabel={isDecorative ? undefined : label}
      accessibilityRole={isDecorative ? undefined : 'image'}
      accessible={!isDecorative}
      importantForAccessibility={isDecorative ? 'no-hide-descendants' : 'yes'}
      resizeMode={fit}
      style={[imageStyle, style]}
    />
  )
}
