'use client'

import { type ComponentPropsWithoutRef, type CSSProperties, useEffect, useRef } from 'react'

import {
  composeClassName, type LumenDeviceFrameColor, type LumenDeviceFrameDevice, type LumenDeviceFrameOrientation,
  type LumenDeviceFrameTone, observeLumenDeviceFrame, resolveLumenDeviceFrame, resolveLumenDeviceFrameColor
} from '@santi020k/lumen-core'

export interface DeviceFrameProps extends ComponentPropsWithoutRef<'div'> {
  device?: LumenDeviceFrameDevice
  orientation?: LumenDeviceFrameOrientation
  tone?: LumenDeviceFrameTone
  color?: LumenDeviceFrameColor
  screenWidth?: number
  screenHeight?: number
  scroll?: boolean
}

export const DeviceFrame = ({ device = 'laptop', orientation, tone = 'dark', color, screenWidth, screenHeight,
  scroll = true, className, children, style: consumerStyle, ...props }: DeviceFrameProps) => {
  const screenRef = useRef<HTMLDivElement>(null)
  const size = resolveLumenDeviceFrame(device, orientation, screenWidth, screenHeight)
  const resolvedColor = resolveLumenDeviceFrameColor(color)

  const frameStyle: CSSProperties & { '--ui-device-color'?: string } = {
    ...consumerStyle,
    ...(resolvedColor ? { '--ui-device-color': resolvedColor } : {})
  }

  useEffect(() => {
    if (screenRef.current) return observeLumenDeviceFrame(screenRef.current, size.width)
  }, [size.width])

  const style: CSSProperties & Record<'--ui-device-frame-width' | '--ui-device-frame-height', string> = {
    '--ui-device-frame-height': `${size.height}px`,
    '--ui-device-frame-width': `${size.width}px`,
    aspectRatio: `${size.width} / ${size.height}`
  }

  return (
    <div className={composeClassName('ui-device-frame', className)} data-device={device} data-tone={tone} data-orientation={orientation} style={frameStyle} {...props}>
      <div className="ui-device-frame__shell">
        <span className="ui-device-frame__hardware" aria-hidden="true">
          <span className="ui-device-frame__action" />
          <span className="ui-device-frame__volume-up" />
          <span className="ui-device-frame__volume-down" />
          <span className="ui-device-frame__power" />
          <span className="ui-device-frame__rail-left" />
          <span className="ui-device-frame__rail-right" />
        </span>
        <div className="ui-device-frame__glass">
          <span aria-hidden="true" className="ui-device-frame__camera" />
          <div className="ui-device-frame__screen" data-scroll={String(scroll)} ref={screenRef} style={style}>{children}</div>
        </div>
      </div>
      <span aria-hidden="true" className="ui-device-frame__base" />
    </div>
  )
}
