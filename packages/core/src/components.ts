export const lumenComponentNames = [
  'Accordion',
  'Alert',
  'AlertDialog',
  'Agenda',
  'AspectRatio',
  'Attachment',
  'Autocomplete',
  'Avatar',
  'BackToTop',
  'Badge',
  'BarChart',
  'Breadcrumb',
  'Bubble',
  'Button',
  'ButtonGroup',
  'Calendar',
  'Callout',
  'Card',
  'CardContent',
  'CardDescription',
  'CardFooter',
  'CardHeader',
  'CardTitle',
  'Carousel',
  'Chart',
  'Checkbox',
  'CheckboxGroup',
  'Collapsible',
  'Code',
  'CodeTabs',
  'Combobox',
  'Container',
  'Command',
  'ContextMenu',
  'ColorPicker',
  'DataTable',
  'DatePicker',
  'DateRangePicker',
  'Dialog',
  'Direction',
  'Drawer',
  'DropdownMenu',
  'Empty',
  'ErrorSummary',
  'Eyebrow',
  'Field',
  'FieldError',
  'FloatingBadge',
  'Form',
  'FormattedDate',
  'HoverCard',
  'Icon',
  'Image',
  'Input',
  'InputGroup',
  'InputOTP',
  'Item',
  'Kbd',
  'Label',
  'Link',
  'LineChart',
  'ListBox',
  'Marker',
  'Menubar',
  'Message',
  'MessageScroller',
  'NativeSelect',
  'NavigationMenu',
  'NumberField',
  'Pagination',
  'PasswordField',
  'PhoneInput',
  'PieChart',
  'Pill',
  'Popover',
  'Progress',
  'Prose',
  'RadioGroup',
  'Resizable',
  'RichTextEditor',
  'ScrollArea',
  'ScrollProgress',
  'Schedule',
  'SearchField',
  'Select',
  'Separator',
  'Sheet',
  'Sidebar',
  'Skeleton',
  'SkipLink',
  'Slider',
  'Sonner',
  'Sparkline',
  'Spinner',
  'Switch',
  'Table',
  'Tabs',
  'TagGroup',
  'Textarea',
  'ThemeBuilder',
  'ThemeToggle',
  'TimeField',
  'Toast',
  'Toggle',
  'ToggleGroup',
  'Tooltip',
  'Tree',
  'TreeGrid',
  'Typography',
  'VirtualList',
  'LanguageToggle',
  'Particles',
  'AnimatedNumber',
  'RevealGroup',
  'ScrollReveal',
  'Stat',
  'StatDescription',
  'StatIcon',
  'StatLabel',
  'StatTrend',
  'StatValue',
  'Stack',
  'Meter',
  'Note',
  'Rating',
  'Timeline',
  'AnimatedLogo',
  'AnimatedPortrait',
  'ButtonLink',
  'CoverImage',
  'GradientDivider',
  'Stepper',
  'FileUpload',
  'Tour',
  'Anchor',
  'Segmented',
  'Toolbar',
  'Descriptions',
  'Popconfirm',
  'Transfer',
  'Cascader',
  'TreeSelect',
  'Mentions',
  'QRCode',
  'Watermark',
  'Affix',
  'SpeedDial',
  'Grid',
  'VisuallyHidden'
] as const

export type LumenComponentName = typeof lumenComponentNames[number]

export interface LumenComponentBehavior {
  astro: 'none' | 'ui-primitives'
  elements: 'none' | 'registered-element'
  react: 'component' | 'hook' | 'none'
}

const astroEnhancedComponents = new Set<LumenComponentName>([
  'AlertDialog',
  'AnimatedNumber',
  'Calendar',
  'Carousel',
  'Code',
  'CodeTabs',
  'Combobox',
  'Command',
  'ContextMenu',
  'DataTable',
  'DateRangePicker',
  'Dialog',
  'Drawer',
  'DropdownMenu',
  'Form',
  'HoverCard',
  'InputOTP',
  'ListBox',
  'Menubar',
  'NavigationMenu',
  'PasswordField',
  'RadioGroup',
  'Resizable',
  'RevealGroup',
  'RichTextEditor',
  'Schedule',
  'ScrollProgress',
  'ScrollReveal',
  'Select',
  'Sheet',
  'Sonner',
  'Tabs',
  'TagGroup',
  'ThemeBuilder',
  'Toast',
  'Toggle',
  'ToggleGroup',
  'VirtualList'
])

const reactHookComponents = new Set<LumenComponentName>([
  'AlertDialog',
  'Calendar',
  'Carousel',
  'Combobox',
  'Command',
  'ContextMenu',
  'DataTable',
  'DateRangePicker',
  'Dialog',
  'Drawer',
  'DropdownMenu',
  'Form',
  'HoverCard',
  'InputOTP',
  'ListBox',
  'Menubar',
  'NavigationMenu',
  'PasswordField',
  'Popover',
  'Resizable',
  'RichTextEditor',
  'Schedule',
  'Select',
  'Sheet',
  'Tabs',
  'TagGroup',
  'ThemeBuilder',
  'Toast',
  'Tooltip',
  'VirtualList'
])

export const lumenComponentBehavior = Object.fromEntries(
  lumenComponentNames.map(name => [
    name,
    {
      astro: astroEnhancedComponents.has(name) ? 'ui-primitives' : 'none',
      elements: name === 'Form' ? 'none' : 'registered-element',
      react: reactHookComponents.has(name) ? 'hook' : 'component'
    }
  ])
) as Readonly<Record<LumenComponentName, LumenComponentBehavior>>

export interface LumenGlobalBehavior {
  astro: 'none' | 'ui-primitives'
  authoredBy: string
  description: string
  elements: 'none' | 'registered-element'
  name: 'form-validation' | 'toast-events'
  react: 'hook' | 'none'
}

export const lumenGlobalBehaviors = [
  {
    astro: 'ui-primitives',
    authoredBy: '[data-ui-form]',
    description: 'Constraint validation state, custom validation events, and field error synchronization.',
    elements: 'registered-element',
    name: 'form-validation',
    react: 'hook'
  },
  {
    astro: 'ui-primitives',
    authoredBy: 'ui:toast, ui:toast-update, ui:toast-dismiss',
    description: 'Document-level toast creation, update, action, and dismissal events.',
    elements: 'registered-element',
    name: 'toast-events',
    react: 'hook'
  }
] as const satisfies readonly LumenGlobalBehavior[]

export interface LumenStylingContract {
  customProperties: readonly `--ui-${string}`[]
  parts: readonly string[]
  rootSlot: string
  stability: 'stable'
}

export const lumenStylingContracts = {
  Button: {
    customProperties: [
      '--ui-button-font-size',
      '--ui-button-font-weight',
      '--ui-button-gap',
      '--ui-button-min-height',
      '--ui-button-padding',
      '--ui-button-radius'
    ],
    parts: [],
    rootSlot: 'button',
    stability: 'stable'
  },
  ButtonLink: { customProperties: [], parts: [], rootSlot: 'button-link', stability: 'stable' },
  Card: {
    customProperties: ['--ui-card-gap', '--ui-card-padding', '--ui-card-section-gap'],
    parts: ['card-header', 'card-title', 'card-description', 'card-content', 'card-footer'],
    rootSlot: 'card',
    stability: 'stable'
  },
  Code: {
    customProperties: [
      '--ui-code-bg',
      '--ui-code-border',
      '--ui-code-fg',
      '--ui-code-header-bg',
      '--ui-code-muted'
    ],
    parts: [],
    rootSlot: 'code',
    stability: 'stable'
  },
  CodeTabs: {
    customProperties: ['--ui-code-tabs-list-padding', '--ui-code-tabs-tab-padding'],
    parts: [],
    rootSlot: 'code-tabs',
    stability: 'stable'
  },
  Link: {
    customProperties: ['--ui-link-font-weight', '--ui-link-underline-offset'],
    parts: [],
    rootSlot: 'link',
    stability: 'stable'
  },
  NavigationMenu: {
    customProperties: ['--ui-navigation-menu-gap', '--ui-navigation-menu-item-padding'],
    parts: [],
    rootSlot: 'navigation-menu',
    stability: 'stable'
  },
  Sidebar: {
    customProperties: ['--ui-sidebar-gap', '--ui-sidebar-padding', '--ui-sidebar-width'],
    parts: [],
    rootSlot: 'sidebar',
    stability: 'stable'
  },
  Stat: {
    customProperties: ['--ui-stat-gap', '--ui-stat-padding'],
    parts: ['stat-label', 'stat-value', 'stat-description', 'stat-icon', 'stat-trend'],
    rootSlot: 'stat',
    stability: 'stable'
  },
  Table: {
    customProperties: ['--ui-table-cell-padding'],
    parts: [],
    rootSlot: 'table',
    stability: 'stable'
  },
  ThemeToggle: {
    customProperties: ['--ui-theme-toggle-size'],
    parts: [],
    rootSlot: 'theme-toggle',
    stability: 'stable'
  }
} as const satisfies Partial<Record<LumenComponentName, LumenStylingContract>>

export interface LumenPackageTarget {
  name: string
  packageName: string
  runtime: 'astro' | 'core' | 'elements' | 'icons' | 'react' | 'umbrella'
}

export const lumenPackages = [
  { name: 'Lumen', packageName: '@santi020k/lumen', runtime: 'umbrella' },
  { name: 'Lumen Core', packageName: '@santi020k/lumen-core', runtime: 'core' },
  { name: 'Lumen Astro', packageName: '@santi020k/lumen-astro', runtime: 'astro' },
  { name: 'Lumen React', packageName: '@santi020k/lumen-react', runtime: 'react' },
  {
    name: 'Lumen React Hook Form',
    packageName: '@santi020k/lumen-react-hook-form',
    runtime: 'react'
  },
  { name: 'Lumen Elements', packageName: '@santi020k/lumen-elements', runtime: 'elements' },
  {
    name: 'Lumen Brand Icons',
    packageName: '@santi020k/lumen-icons-brand',
    runtime: 'icons'
  }
] as const satisfies readonly LumenPackageTarget[]
