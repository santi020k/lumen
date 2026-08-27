import {
  isValidElement,
  type ReactElement,
  type ReactNode
} from 'react'

import { describe, expect, test, vi } from 'vitest'

import {
  LumenBarChart,
  LumenComboChart,
  LumenHeatmap,
  LumenPieChart,
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
  summary?: string
}

interface ChartDataOutputProps {
  includeSize?: boolean
  onSelect?: unknown
  rows?: readonly { id: string, label: string }[]
  selectedSeriesId?: string
  selectedX?: number | string
  series?: readonly { data: readonly { id?: string, x?: number | string }[] }[]
}

type Props = Record<string, unknown>

const isReactNodeList = (value: ReactNode): value is ReactNode[] => Array.isArray(value)
const propsOf = (element: ReactElement | undefined): Props => (element?.props ?? {}) as Props
const descendantsOf = (node: ReactNode): ReactElement[] => {
  if (Array.isArray(node)) return node.flatMap(descendantsOf)
  if (!isValidElement(node)) return []

  const element = node as ReactElement

  return [element, ...descendantsOf(propsOf(element).children as ReactNode)]
}

const dataOutputElement = (element: ReactElement<ChartFrameOutputProps>): ReactElement<ChartDataOutputProps> => {
  if (!isReactNodeList(element.props.children)) {
    throw new Error('Expected chart frame children')
  }

  const children = element.props.children
  const candidate = children.at(-1)

  if (!isValidElement<ChartDataOutputProps>(candidate)) {
    throw new Error('Expected chart fallback data output')
  }

  return candidate
}

const dataOutput = (element: ReactElement<ChartFrameOutputProps>): ChartDataOutputProps => (
  dataOutputElement(element).props
)

const isChartDataRenderer = (
  value: unknown
): value is (props: ChartDataOutputProps) => ReactNode => typeof value === 'function'

const renderDataOutput = (element: ReactElement<ChartFrameOutputProps>): ReactNode => {
  const output = dataOutputElement(element)
  if (!isChartDataRenderer(output.type)) throw new Error('Expected chart fallback component')

  return output.type(output.props)
}

describe('Lumen React Native chart components', () => {
  test.each([
    ['scatter', LumenScatterChart],
    ['combo', LumenComboChart]
  ] as const)('keeps controlled %s selection on fallback controls', (_name, Chart) => {
    const onSelectionChange = vi.fn()
    const x = _name === 'scatter' ? 8 : 'August'
    const element = Chart({
      label: 'Quality',
      onSelectionChange,
      selectedSeriesId: 'quality',
      selectedX: x,
      series: [{
        data: [{ x, y: 98 }],
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
    expect(fallback.selectedX).toBe(x)
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

  test('omits unavailable heatmap cells from native SVG marks', () => {
    const heatmap = LumenHeatmap({
      data: [
        { value: 8, x: 'Monday', y: 'Morning' },
        { value: null, x: 'Tuesday', y: 'Morning' },
        { value: Number.POSITIVE_INFINITY, x: 'Wednesday', y: 'Morning' }
      ],
      label: 'Activity'
    }) as ReactElement<ChartFrameOutputProps>
    const cells = descendantsOf(heatmap)
      .filter(element => propsOf(element).fillOpacity !== undefined)

    expect(cells).toHaveLength(1)
  })

  test('shows the native heatmap empty state when every cell is unavailable', () => {
    const heatmap = LumenHeatmap({
      data: [
        { value: null, x: 'Monday', y: 'Morning' },
        { value: Number.POSITIVE_INFINITY, x: 'Tuesday', y: 'Morning' }
      ],
      label: 'Activity'
    }) as ReactElement<ChartFrameOutputProps>

    const descendants = descendantsOf(heatmap)

    expect(heatmap.props.summary).toBe('0 available heatmap cells.')
    expect(descendants.some(element => (
      propsOf(element).children === 'No chart data available.'
    ))).toBe(true)
    expect(descendants.filter(element => propsOf(element).fillOpacity !== undefined))
      .toHaveLength(0)
  })

  test('summarizes only rendered pie slices', () => {
    const pie = LumenPieChart({
      label: 'Share',
      series: {
        data: [{ x: 'Available', y: 8 }, { x: 'Zero', y: 0 }, { x: 'Negative', y: -2 }],
        id: 'share',
        label: 'Share'
      }
    }) as ReactElement<ChartFrameOutputProps>

    expect(pie.props.summary).toContain('1 point')
    expect(pie.props.summary).toContain('8 to 8')
    expect(dataOutput(pie).series?.[0]?.data.map(datum => datum.x)).toEqual(['Available'])
  })

  test('exposes scatter bubble sizes and omits points with invalid coordinates', () => {
    const scatter = LumenScatterChart({
      label: 'Quality',
      series: [{
        data: [
          { id: 'valid', size: 64, x: 1, y: 98 },
          { id: 'negative-size', size: -64, x: 2, y: 96 },
          { id: 'invalid', size: 36, x: 'January', y: 95 }
        ],
        id: 'quality',
        label: 'Quality'
      }]
    }) as ReactElement<ChartFrameOutputProps>
    const fallback = dataOutput(scatter)

    expect(scatter.props.summary).toContain('2 points')
    expect(fallback.includeSize).toBe(true)
    expect(fallback.series?.[0]?.data.map(datum => datum.id)).toEqual(['valid', 'negative-size'])
    expect(descendantsOf(renderDataOutput(scatter)).some(element => (
      propsOf(element).children === '2, Quality: 96, Size: Not available'
    ))).toBe(true)
  })

  test('shows empty states for invalid scatter coordinates and unavailable ranges', () => {
    const scatter = LumenScatterChart({
      label: 'Quality',
      series: [{ data: [{ x: 'January', y: 95 }], id: 'quality', label: 'Quality' }]
    }) as ReactElement<ChartFrameOutputProps>
    const range = LumenRangeChart({
      data: [{ high: 18, low: null, x: 'Monday' }],
      label: 'Forecast'
    }) as ReactElement<ChartFrameOutputProps>

    expect(scatter.props.summary).toBe('No chart data available.')
    expect(range.props.summary).toBe('No chart data available.')
    for (const chart of [scatter, range]) {
      expect(descendantsOf(chart).some(element => (
        propsOf(element).children === 'No chart data available.'
      ))).toBe(true)
    }
  })

  test('omits non-finite native bar marks', () => {
    const bars = LumenBarChart({
      label: 'Quality',
      series: [{
        data: [
          { x: 'Finite', y: 98 },
          { x: 'NaN', y: Number.NaN },
          { x: 'Infinite', y: Number.POSITIVE_INFINITY }
        ],
        id: 'quality',
        label: 'Quality'
      }]
    }) as ReactElement<ChartFrameOutputProps>

    expect(descendantsOf(bars).filter(element => propsOf(element).rx === 4)).toHaveLength(1)
  })

  test('keeps repeated native scatter coordinates as distinct marks', () => {
    const scatter = LumenScatterChart({
      label: 'Quality',
      series: [{
        data: [{ x: 1, y: 95 }, { x: 1, y: 98 }],
        id: 'quality',
        label: 'Quality'
      }]
    }) as ReactElement<ChartFrameOutputProps>
    const keys = descendantsOf(scatter)
      .filter(element => propsOf(element).r !== undefined)
      .map(element => element.key)

    expect(new Set(keys).size).toBe(2)
  })

  test('aligns native combo line points with bar category centers', () => {
    const data = [
      { x: 'Mon', y: 4 },
      { x: 'Tue', y: 8 },
      { x: 'Wed', y: 6 }
    ]
    const combo = LumenComboChart({
      label: 'Activity',
      series: [
        { data, id: 'bars', label: 'Bars', mark: 'bar' },
        { data, id: 'line', label: 'Line', mark: 'line' }
      ]
    }) as ReactElement<ChartFrameOutputProps>
    const descendants = descendantsOf(combo)
    const categoryCenters = descendants
      .filter(element => propsOf(element).rx === 4)
      .map(element => {
        const transform = String(propsOf(element).transform)
        const x = Number(/translate\(([-\d.]+)/u.exec(transform)?.[1])

        return Number((x + Number(propsOf(element).width) / 2).toFixed(3))
      })
    const line = descendants.find(element => propsOf(element).fill === 'none')
    const lineXCoordinates = [...String(propsOf(line).d).matchAll(/[LM]\s+(-?\d+(?:\.\d+)?)/gu)]
      .map(match => Number(match[1]))

    expect(categoryCenters).toHaveLength(3)
    expect(lineXCoordinates).toEqual(categoryCenters)
  })
})
