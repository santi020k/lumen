import { type createLumenLineChartModel, getLumenChartCategoryLabel, type LumenChartLabels } from '@santi020k/lumen-core'

interface ChartInspectionProps {
  formatCategory?: (value: number | string) => string
  formatValue: (value: number) => string
  labels: Readonly<LumenChartLabels>
  model: ReturnType<typeof createLumenLineChartModel>
}

export const ChartInspection = ({ formatCategory, formatValue, labels, model }: ChartInspectionProps) => {
  const lookup = model.series.map(series => new Map(series.data.map(datum => [datum.x, datum])))

  return (
    <>
      <div className="ui-chart__inspection" data-ui-chart-inspection hidden>
        {model.categories.map((category, index) => (
          <div data-ui-chart-point={JSON.stringify(category)} data-ui-chart-position={model.positions[index]} hidden key={`${typeof category}:${category}`}>
            <strong>{getLumenChartCategoryLabel(model.series, category, formatCategory, 'detail')}</strong>
            {model.series.map((series, seriesIndex) => {
              const value = lookup[seriesIndex]?.get(category)?.y

              return (
                <span data-ui-chart-series-value={series.id} key={series.id}>
                  {series.label}
                  :
                  {' '}
                  {value === null || value === undefined || !Number.isFinite(value) ?
                    labels.notAvailable :
                    formatValue(value)}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <p aria-live="polite" aria-atomic="true" className="ui-sr-only" data-ui-chart-announcement />
    </>
  )
}
