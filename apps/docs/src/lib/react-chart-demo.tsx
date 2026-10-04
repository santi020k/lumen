import { BulletChart, DumbbellChart, Heatmap, Histogram, LineChart, LollipopChart, PieChart, WaterfallChart } from '@santi020k/lumen-react'

import { chartDemoBins, chartDemoBulletRanges, chartDemoChannels, chartDemoComparisons, chartDemoHeatmap, chartDemoSeries, chartDemoWaterfall } from './chart-demo-data'

export const ReactChartDemo = () => (
  <div className="viz-chart-grid">
    <LineChart className="viz-main-chart" aria-label="React request volume" heading="Request volume" description="Requests and completions · 09:00–12:00" series={chartDemoSeries} xScale="linear" area markers="none" interactive syncGroup="visualization-demo" annotations={[{ id: 'target', label: 'Capacity target', value: 160 }]} />
    <LollipopChart aria-label="React team rankings" heading="Team performance" description="Current score · shared scale" data={chartDemoComparisons} domain={{ min: 0, max: 100 }} valueLabel="Score" />
    <DumbbellChart aria-label="React team comparison" heading="Progress by team" description="Previous quarter to current quarter" data={chartDemoComparisons} domain={{ min: 0, max: 100 }} referenceLabel="Previous" valueLabel="Current" />
    <BulletChart aria-label="React delivery performance" heading="On-time delivery" description="Actual performance against the service target" value={86} target={95} ranges={chartDemoBulletRanges} formatValue={value => `${value}%`} />
    <WaterfallChart aria-label="React balance changes" heading="Revenue movement" description="Opening balance to closing · USD, thousands" data={chartDemoWaterfall} valueLabel="USD, thousands" />
    <Histogram aria-label="React response times" heading="Response time" description="Distribution of requests · milliseconds" bins={chartDemoBins} tone="series-3" />
    <PieChart aria-label="React traffic sources" heading="Traffic sources" description="Share of acquisition by channel" series={chartDemoChannels} centerValue="48%" centerLabel="Organic" />
    <Heatmap aria-label="React daily difference" heading="Activity patterns" description="Difference from baseline · every two hours" data={chartDemoHeatmap} colorScale="diverging" />
  </div>
)
