// Public selective entrypoints supported by the adapters. Tests verify the published export paths.
// Components without a matching entry deliberately retain a labeled catalog fallback.
const reactEntries: Readonly<Record<string, string>> = {
  Anchor: 'anchor',
  AttachmentList: 'attachments',
  AttachmentPreview: 'attachments',
  BoxPlot: 'expanded-charts',
  BulletChart: 'bullet-chart',
  Button: 'button',
  Card: 'card',
  CalendarHeatmap: 'expanded-charts',
  Collapsible: 'collapsible',
  DataTable: 'data-table',
  DataTableSavedViews: 'data-table-saved-views',
  DataTableSortControls: 'data-table',
  DataTableView: 'data-table-view',
  DateRangeCalendar: 'date-range-calendar',
  DateRangeInput: 'date-range-input',
  DeviceFrame: 'device-frame',
  Input: 'input',
  Dialog: 'dialog',
  DialogBody: 'dialog',
  DialogClose: 'dialog',
  DialogFooter: 'dialog',
  DialogHeader: 'dialog',
  DialogTitle: 'dialog',
  DumbbellChart: 'comparison-chart',
  Empty: 'empty',
  FunnelChart: 'expanded-charts',
  Histogram: 'interval-charts',
  ImageComparison: 'image-comparison',
  Kbd: 'kbd',
  Label: 'label',
  Link: 'link',
  LollipopChart: 'comparison-chart',
  MediaFilmstrip: 'media-selection',
  MediaThumbnail: 'media-selection',
  MediaViewport: 'media-viewport',
  ScrollProgress: 'scroll-progress',
  SearchField: 'search-field',
  SkipLink: 'skip-link',
  VirtualList: 'virtual-list',
  WaterfallChart: 'interval-charts',
  WorldMap: 'world-map'
}

const elementsEntries: Readonly<Record<string, string>> = {
  Anchor: 'anchor',
  Badge: 'badge',
  Button: 'button',
  Card: 'card',
  CardContent: 'foundations',
  CardDescription: 'foundations',
  CardFooter: 'foundations',
  CardHeader: 'foundations',
  CardTitle: 'foundations',
  ChangeSummary: 'dashboard',
  Collapsible: 'collapsible',
  Combobox: 'combobox',
  Container: 'foundations',
  DeviceFrame: 'device-frame',
  Input: 'input',
  Dialog: 'dialog',
  DialogBody: 'dialog',
  DialogClose: 'dialog',
  DialogFooter: 'dialog',
  DialogHeader: 'dialog',
  DialogTitle: 'dialog',
  Direction: 'foundations',
  Empty: 'empty',
  FilterBar: 'dashboard',
  Grid: 'foundations',
  ImageComparison: 'image-comparison',
  Kbd: 'kbd',
  Label: 'label',
  Link: 'link',
  MediaFilmstrip: 'media-selection',
  MediaThumbnail: 'media-selection',
  MediaViewport: 'media-viewport',
  ScrollProgress: 'scroll-progress',
  SearchField: 'search-field',
  Separator: 'foundations',
  Skeleton: 'foundations',
  SkipLink: 'skip-link',
  Spinner: 'foundations',
  Stack: 'foundations',
  Timeline: 'timeline',
  Typography: 'foundations',
  VirtualList: 'virtual-list',
  VisuallyHidden: 'foundations',
  WorldMap: 'world-map'
}

export const componentDeliveryEntries = { react: reactEntries, elements: elementsEntries } as const

export const getComponentEntry = (name: string, target: 'elements' | 'react'): string | undefined => {
  const entry = componentDeliveryEntries[target][name]

  return entry ? `@santi020k/lumen-${target}/components/${entry}` : undefined
}

export const componentCssName = (name: string): string => name
  .replaceAll(/([a-z\d])([A-Z])/g, '$1-$2')
  .replaceAll(/([A-Z])([A-Z][a-z])/g, '$1-$2')
  .toLowerCase()
