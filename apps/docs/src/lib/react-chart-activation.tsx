import { useState } from 'react'

import type { LumenChartDatumActivationDetail, LumenChartSeries } from '@santi020k/lumen-core'
import { BarChart, Button, ComboChart, Heatmap, LineChart, PieChart, RangeChart, ScatterChart, Stack } from '@santi020k/lumen-react'

const initialSeries: readonly LumenChartSeries[] = [{ id: 'received',
  label: 'Cobros',
  data: [
    { id: 'zero', x: '2026-10-01', xLabel: 'Oct 1', y: 0 },
    { id: 'positive', x: '2026-10-02', xLabel: 'Oct 2', y: 20 },
    { id: 'missing', x: '2026-10-03', y: null }
  ] }]

const labels = { exploreData: 'Explorar datos del gráfico', formatDatumAction: (context: string) => `Abrir detalles: ${context}` }
const seriesData = (series: readonly LumenChartSeries[]) => series[0]?.data ?? []

export const ReactChartActivationDemo = () => {
  const [result, setResult] = useState<LumenChartDatumActivationDetail | null>(null)
  const [count, setCount] = useState(0)
  const [series, setSeries] = useState(initialSeries)
  const [prevented, setPrevented] = useState(false)

  const activate = (detail: LumenChartDatumActivationDetail) => {
    setResult(detail)

    setCount(previous => previous + 1)
  }

  const common = { onDatumActivate: activate, showTable: false, labels }
  const pie = series[0]
  const data = seriesData(series)

  return (
    <Stack gap="section" data-react-chart-demo>
      <p role="status" data-react-activation-result data-count={count} style={{ overflowWrap: 'anywhere' }}>{result ? JSON.stringify(result) : 'Sin selección'}</p>
      <Button onClick={() => {
        setSeries(previous => previous.map(item => ({ ...item, data: item.data.map(datum => ({ ...datum, y: datum.id === 'positive' ? 40 : datum.y })) })))
      }}
      >
        Actualizar valores
      </Button>
      <Button onClick={() => {
        setPrevented(value => !value)
      }}
      >
        Alternar acciones
      </Button>
      <BarChart
        data-react-chart-example="bar"
        aria-label="React Bar"
        {...common}
        series={series}
        onClick={event => {
          if (prevented) event.preventDefault()
        }}
      />
      <LineChart data-react-chart-example="line" aria-label="React Line" {...common} series={series} markers="none" />
      {pie && <PieChart data-react-chart-example="pie" aria-label="React Pie" {...common} series={pie} />}
      <ScatterChart data-react-chart-example="scatter" aria-label="React Scatter" {...common} series={[{ id: 'received', label: 'Cobros', data: data.map((datum, index) => ({ ...datum, x: index })) }]} />
      <ComboChart
        data-react-chart-example="combo"
        aria-label="React Combo"
        {...common}
        series={[
          { id: 'received', label: 'Cobros', data: data, mark: 'bar' },
          { id: 'forecast', label: 'Proyección', data: data, mark: 'line' }
        ]}
      />
      <Heatmap data-react-chart-example="heatmap" aria-label="React Heatmap" {...common} data={data.map(datum => ({ ...(datum.id === undefined ? {} : { id: datum.id }), value: datum.y, x: datum.x, y: 'October' }))} />
      <RangeChart
        data-react-chart-example="range"
        aria-label="React Range"
        {...common}
        data={[
          { id: 'zero', low: 0, high: 0, x: '2026-10-01' }, { id: 'positive', low: 10, high: 20, x: '2026-10-02' }, { id: 'missing', low: null, high: null, x: '2026-10-03' }
        ]}
      />
    </Stack>
  )
}
