'use client'

import { useEffect } from 'react'

/** Browser contracts must wait for hydration before editing server-rendered controls. */
export const useFixtureReady = () => {
  useEffect(() => {
    document.documentElement.dataset.fixtureReady = 'true'

    return () => {
      delete document.documentElement.dataset.fixtureReady
    }
  }, [])
}
