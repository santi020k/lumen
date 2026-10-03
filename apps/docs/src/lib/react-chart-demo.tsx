import { Grid, Heatmap, Histogram, LineChart, Stack, WaterfallChart } from '@santi020k/lumen-react'

import { chartDemoBins, chartDemoHeatmap, chartDemoSeries, chartDemoWaterfall } from './chart-demo-data'

export const ReactChartDemo = () => (
  <Stack>
    <LineChart aria-label="React request volume" heading="Request volume" series={chartDemoSeries} xScale="linear" interactive syncGroup="visualization-demo" annotations={[{ id: 'target', label: 'Target', value: 65 }]} />
    <Grid columns="auto" minItemWidth="34rem">
      <WaterfallChart aria-label="React balance changes" heading="Balance changes" data={chartDemoWaterfall} />
      <Histogram aria-label="React response times" heading="Response times" bins={chartDemoBins} />
      <Heatmap aria-label="React daily difference" heading="Daily difference" data={chartDemoHeatmap} colorScale="diverging" />
    </Grid>
  </Stack>
)
