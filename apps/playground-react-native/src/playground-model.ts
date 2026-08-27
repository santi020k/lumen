export type AppDestination = 'components' | 'examples' | 'home' | 'settings'

export type ComponentCategory =
  | 'actions' |
  'data' |
  'feedback' |
  'forms' |
  'foundations' |
  'navigation'

interface ComponentCategoryDefinition {
  description: string
  label: string
  names: readonly string[]
  value: ComponentCategory
}

export const componentCategories: readonly ComponentCategoryDefinition[] = [
  {
    description: 'Theme, type, surfaces, icons, and visual treatments.',
    label: 'Foundations',
    names: [
      'Theme',
      'Text',
      'Surface',
      'Icon',
      'Icon button',
      'Graphic',
      'Backdrop',
      'Illustration',
      'Image'
    ],
    value: 'foundations'
  },
  {
    description: 'Buttons, chips, menus, and operating-system actions.',
    label: 'Actions',
    names: ['Button', 'Button group', 'Chip', 'Menu', 'Share button'],
    value: 'actions'
  },
  {
    description: 'Editable values, choices, validation, and date input.',
    label: 'Forms',
    names: [
      'Text field',
      'Textarea',
      'Field group',
      'Toggle',
      'Settings row',
      'Search field',
      'Date field',
      'Date range field',
      'Phone input',
      'Checkbox',
      'Radio group',
      'Segmented control',
      'Tabs',
      'Picker',
      'Slider'
    ],
    value: 'forms'
  },
  {
    description: 'Progress, alerts, loading, recovery, and transient status.',
    label: 'Feedback',
    names: [
      'Badge',
      'Divider',
      'Spinner',
      'Alert',
      'Toast',
      'Progress',
      'Refresh control',
      'Skeleton',
      'Empty state',
      'Error state',
      'Banner'
    ],
    value: 'feedback'
  },
  {
    description: 'Cards, charts, rows, metrics, disclosure, and identity.',
    label: 'Data',
    names: [
      'Card',
      'Sparkline',
      'Line chart',
      'Bar chart',
      'Pie chart',
      'Scatter chart',
      'Heatmap',
      'Range chart',
      'Combo chart',
      'Disclosure',
      'Avatar',
      'List row',
      'Stat',
      'Section header',
      'Status bar',
      'Gauge'
    ],
    value: 'data'
  },
  {
    description: 'Dialogs, sheets, destination bars, and accessories.',
    label: 'Navigation',
    names: [
      'Alert dialog',
      'Sheet',
      'Navigation bar',
      'Navigation accessory',
      'Collapsible navigation bar'
    ],
    value: 'navigation'
  }
] as const

export const componentNames = componentCategories.flatMap(category => category.names)

export const getComponentCategory = (name: string): ComponentCategory | undefined => (
  componentCategories.find(category => category.names.includes(name))?.value
)

export const getVisibleComponentNames = (
  query: string,
  category: ComponentCategory | 'all',
  embedded: boolean
): string[] => {
  const normalizedQuery = query.trim().toLowerCase()

  return componentNames.filter(name => {
    const matchesCategory = category === 'all' || getComponentCategory(name) === category

    const matchesQuery = embedded && normalizedQuery.length > 0 ?
      name.toLowerCase() === normalizedQuery :
      name.toLowerCase().includes(normalizedQuery)

    return matchesCategory && matchesQuery
  })
}

export const isAppDestination = (value: string): value is AppDestination => (
  value === 'components' || value === 'examples' || value === 'home' || value === 'settings'
)

export const isComponentCategory = (value: string): value is ComponentCategory => (
  componentCategories.some(category => category.value === value)
)
