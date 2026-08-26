import {
  isValidElement,
  type ReactElement,
  type ReactNode
} from 'react'

import { describe, expect, test, vi } from 'vitest'

import {
  LumenComboChart,
  LumenHeatmap,
  LumenRangeChart,
  LumenScatterChart
} from './chart-components.js'

vi.mock('react-native-svg', () => ({
  Circle: () => null,
  Line: () => null,
  Path: () => null,
  Rect: () => null,
  Svg: () => null
}))

vi.mock('react-native', () => ({
  Pressable: () => null,
  ScrollView: () => null,
  Text: () => null,
  View: () => null
}))

vi.mock('./theme-context.js', () => ({
  useLumenTheme: () => ({
    chartColors: {
      sequentialHigh: '#2463eb',
      series1: '#2463eb',
      series2: '#854dff',
      series3: '#06a77d',
      series4: '#d97706',
      series5: '#dc2626',
      series6: '#0891b2',
      series7: '#9333ea',
      series8: '#64748b'
    },
    colors: {
      accent: '#854dff',
      brand: '#2463eb',
      brandSoft: '#dbeafe',
      danger: '#dc2626',
      ink: '#111827',
      inkMuted: '#6b7280',
      inkSoft: '#374151',
      line: '#d1d5db',
      success: '#06a77d',
      surface: '#ffffff',
      surfaceMuted: '#f3f4f6',
      warning: '#d97706'
    },
    fontSizes: { lg: 18, sm: 14 },
    radii: { lg: 16, sm: 8 },
    spacing: { lg: 16, md: 12, sm: 8, xs: 4 }
  })
}))

interface ChartFrameOutputProps {
  children: ReactNode
  onSelectionChange?: unknown
  selectedSeriesId?: unknown
  selectedX?: unknown
}

interface ChartDataOutputProps {
  onSelect?: unknown
  rows?: readonly { id: string, label: string }[]
  selectedSeriesId?: string
  selectedX?: number | string
}

const isReactNodeList = (value: ReactNode): value is ReactNode[] => Array.isArray(value)

const dataOutput = (element: ReactElement<ChartFrameOutputProps>): ChartDataOutputProps => {
  if (!isReactNodeList(element.props.children)) {
    throw new Error('Expected chart frame children')
  }

  const children = element.props.children
  const candidate = children.at(-1)

  if (!isValidElement<ChartDataOutputProps>(candidate)) {
    throw new Error('Expected chart fallback data output')
  }

  return candidate.props
}

describe('Lumen React Native chart components', () => {
  test.each([
    ['scatter', LumenScatterChart],
    ['combo', LumenComboChart]
  ] as const)('keeps controlled %s selection on fallback controls', (_name, Chart) => {
    const onSelectionChange = vi.fn()
    const element = Chart({
      label: 'Quality',
      onSelectionChange,
      selectedSeriesId: 'quality',
      selectedX: 'August',
      series: [{
        data: [{ x: 'August', y: 98 }],
        id: 'quality',
        label: 'Quality',
        mark: 'line'
      }]
    }) as ReactElement<ChartFrameOutputProps>
    const fallback = dataOutput(element)

    expect(element.props.onSelectionChange).toBeUndefined()
    expect(element.props.selectedSeriesId).toBeUndefined()
    expect(element.props.selectedX).toBeUndefined()
    expect(fallback.onSelect).toBe(onSelectionChange)
    expect(fallback.selectedSeriesId).toBe('quality')
    expect(fallback.selectedX).toBe('August')
  })

  test('exposes missing heatmap and range values through readable rows', () => {
    const heatmap = LumenHeatmap({
      data: [{ value: null, x: 'Monday', y: 'Morning' }],
      label: 'Activity'
    }) as ReactElement<ChartFrameOutputProps>
    const range = LumenRangeChart({
      data: [{ high: 18, low: null, x: 'Monday' }],
      label: 'Forecast'
    }) as ReactElement<ChartFrameOutputProps>

    expect(dataOutput(heatmap).rows?.[0]?.label).toBe('Monday, Morning: Not available')
    expect(dataOutput(range).rows?.[0]?.label).toBe('Monday: Not available to 18')
  })
})
