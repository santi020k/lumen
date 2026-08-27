export const formatReactChartTableValue = (
  value: number | null | undefined,
  formatValue: (value: number) => string
): string => value === null || value === undefined || !Number.isFinite(value) ?
  'Not available' :
  formatValue(value)
