'use client'

import { type ComponentPropsWithoutRef, type CSSProperties, useEffect, useRef } from 'react'

import {
  composeClassName, type LumenDeviceFrameDevice, type LumenDeviceFrameOrientation,
  type LumenDeviceFrameTone, observeLumenDeviceFrame, resolveLumenDeviceFrame
} from '@santi020k/lumen-core'

export interface DeviceFrameProps extends ComponentPropsWithoutRef<'div'> {
  device?: LumenDeviceFrameDevice
  orientation?: LumenDeviceFrameOrientation
  tone?: LumenDeviceFrameTone
  screenWidth?: number
  screenHeight?: number
  scroll?: boolean
}

export const DeviceFrame = ({ device = 'laptop', orientation, tone = 'dark', screenWidth, screenHeight,
  scroll = true, className, children, ...props }: DeviceFrameProps) => {
  const screenRef = useRef<HTMLDivElement>(null)
  const size = resolveLumenDeviceFrame(device, orientation, screenWidth, screenHeight)

  useEffect(() => {
    if (screenRef.current) return observeLumenDeviceFrame(screenRef.current, size.width)
  }, [size.width])

  const style: CSSProperties & Record<'--ui-device-frame-width' | '--ui-device-frame-height', string> = {
    '--ui-device-frame-height': `${size.height}px`,
    '--ui-device-frame-width': `${size.width}px`,
    aspectRatio: `${size.width} / ${size.height}`
  }

  return (
    <div className={composeClassName('ui-device-frame', className)} data-device={device} data-tone={tone} {...props}>
      <div className="ui-device-frame__shell">
        <div className="ui-device-frame__glass">
          <span aria-hidden="true" className="ui-device-frame__camera" />
          <div className="ui-device-frame__screen" data-scroll={String(scroll)} ref={screenRef} style={style}>{children}</div>
        </div>
      </div>
      <span aria-hidden="true" className="ui-device-frame__base" />
    </div>
  )
}
