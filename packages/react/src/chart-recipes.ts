export const formatReactChartTableValue = (
  value: number | null | undefined,
  formatValue: (value: number) => string,
  notAvailable = 'Not available'
): string => value === null || value === undefined || !Number.isFinite(value) ?
  notAvailable :
  formatValue(value)
