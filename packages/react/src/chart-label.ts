import type { ReactNode } from 'react'

export const getChartPlotLabel = (
  label: string | undefined, heading: ReactNode, fallback: string
): string => label ?? (typeof heading === 'string' ? heading : fallback)
