import { BoxPlot, BulletChart, CalendarHeatmap, DumbbellChart, FunnelChart, Heatmap, Histogram, LineChart, LollipopChart, PieChart, WaterfallChart } from '@santi020k/lumen-react'

import { chartDemoBins, chartDemoBoxPlots, chartDemoBulletRanges, chartDemoCalendar, chartDemoChannels, chartDemoComparisons, chartDemoFunnel, chartDemoHeatmap, chartDemoSeries, chartDemoWaterfall } from './chart-demo-data'

export const ReactChartDemo = () => (
  <div className="viz-chart-grid">
    <LineChart className="viz-main-chart" aria-label="React request volume" heading="Request volume" description="Requests and completions · 09:00–12:00" series={chartDemoSeries} xScale="linear" area markers="none" interactive syncGroup="visualization-demo" annotations={[{ id: 'target', label: 'Capacity target', value: 160 }]} />
    <LollipopChart aria-label="React team rankings" heading="Team performance" description="Current score · shared scale" data={chartDemoComparisons} domain={{ min: 0, max: 100 }} valueLabel="Score" />
    <DumbbellChart aria-label="React team comparison" heading="Progress by team" description="Previous quarter to current quarter" data={chartDemoComparisons} domain={{ min: 0, max: 100 }} referenceLabel="Previous" valueLabel="Current" />
    <BulletChart aria-label="React delivery performance" heading="On-time delivery" description="Actual performance against the service target" value={86} target={95} ranges={chartDemoBulletRanges} formatValue={value => `${value}%`} />
    <WaterfallChart aria-label="React balance changes" heading="Revenue movement" description="Opening balance to closing · USD, thousands" data={chartDemoWaterfall} valueLabel="USD, thousands" />
    <Histogram aria-label="React response times" heading="Response time" description="Distribution of requests · milliseconds" bins={chartDemoBins} tone="series-3" />
    <PieChart aria-label="React traffic sources" heading="Traffic sources" description="Share of acquisition by channel" series={chartDemoChannels} centerValue="48%" centerLabel="Organic" />
    <CalendarHeatmap aria-label="React daily contributions" heading="Daily contributions" description="August 2026 · missing days stay distinct from zero" startDate="2026-08-01" endDate="2026-08-28" data={chartDemoCalendar} />
    <FunnelChart aria-label="React signup stages" heading="Signup stages" description="Ordered observations · no derived conversion estimates" data={chartDemoFunnel} />
    <BoxPlot aria-label="React response time distributions" heading="Response time by region" description="Precomputed quartiles and outliers · milliseconds" data={chartDemoBoxPlots} />
    <Heatmap aria-label="React daily difference" heading="Activity patterns" description="Difference from baseline · every two hours" data={chartDemoHeatmap} colorScale="diverging" />
  </div>
)
