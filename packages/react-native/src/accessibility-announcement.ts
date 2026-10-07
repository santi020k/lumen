import { useEffect, useRef } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'

import type { LumenErrorStateAnnouncement } from './structured-recipes.js'

/** Android and web use live regions; iOS requires an explicit announcement. */
export const useLumenAccessibilityAnnouncement = (
  message: string,
  announcement: LumenErrorStateAnnouncement
): void => {
  const previousRef = useRef<{ message: string, announcement: LumenErrorStateAnnouncement } | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'ios' || announcement === 'off' || !message.trim()) {
      previousRef.current = null

      return
    }

    if (previousRef.current?.message === message && previousRef.current.announcement === announcement) return

    previousRef.current = { announcement, message }

    AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: announcement === 'polite' })
  }, [announcement, message])
}
