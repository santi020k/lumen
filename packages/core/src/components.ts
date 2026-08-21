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
  'CopyButton',
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
  'KanbanBoard',
  'KanbanColumn',
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
  astroRuntimeBypass?: string
  elements: 'none' | 'registered-element'
  react: 'component' | 'hook' | 'none'
}

export const lumenComponentBehavior = {
  Accordion: { astro: 'none', elements: 'registered-element', react: 'component' },
  Affix: { astro: 'none', elements: 'registered-element', react: 'component' },
  Agenda: { astro: 'none', elements: 'registered-element', react: 'component' },
  Alert: { astro: 'none', elements: 'registered-element', react: 'component' },
  AlertDialog: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Anchor: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  AnimatedLogo: { astro: 'none', elements: 'registered-element', react: 'component' },
  AnimatedNumber: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  AnimatedPortrait: { astro: 'none', elements: 'registered-element', react: 'component' },
  AspectRatio: { astro: 'none', elements: 'registered-element', react: 'component' },
  Attachment: { astro: 'none', elements: 'registered-element', react: 'component' },
  Autocomplete: { astro: 'none', elements: 'registered-element', react: 'component' },
  Avatar: { astro: 'none', elements: 'registered-element', react: 'component' },
  BackToTop: { astro: 'none', elements: 'registered-element', react: 'component' },
  Badge: { astro: 'none', elements: 'registered-element', react: 'component' },
  BarChart: { astro: 'none', elements: 'registered-element', react: 'component' },
  Breadcrumb: { astro: 'none', elements: 'registered-element', react: 'component' },
  Bubble: { astro: 'none', elements: 'registered-element', react: 'component' },
  Button: { astro: 'none', elements: 'registered-element', react: 'component' },
  ButtonGroup: { astro: 'none', elements: 'registered-element', react: 'component' },
  ButtonLink: { astro: 'none', elements: 'registered-element', react: 'component' },
  Calendar: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Callout: { astro: 'none', elements: 'registered-element', react: 'component' },
  Card: { astro: 'none', elements: 'registered-element', react: 'component' },
  CardContent: { astro: 'none', elements: 'registered-element', react: 'component' },
  CardDescription: { astro: 'none', elements: 'registered-element', react: 'component' },
  CardFooter: { astro: 'none', elements: 'registered-element', react: 'component' },
  CardHeader: { astro: 'none', elements: 'registered-element', react: 'component' },
  CardTitle: { astro: 'none', elements: 'registered-element', react: 'component' },
  Carousel: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Cascader: { astro: 'none', elements: 'registered-element', react: 'component' },
  Chart: { astro: 'none', elements: 'registered-element', react: 'component' },
  Checkbox: { astro: 'none', elements: 'registered-element', react: 'component' },
  CheckboxGroup: { astro: 'none', elements: 'registered-element', react: 'component' },
  Code: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  CodeTabs: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  Collapsible: { astro: 'none', elements: 'registered-element', react: 'component' },
  ColorPicker: { astro: 'none', elements: 'registered-element', react: 'component' },
  Combobox: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Command: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Container: { astro: 'none', elements: 'registered-element', react: 'component' },
  CopyButton: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  ContextMenu: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  CoverImage: { astro: 'none', elements: 'registered-element', react: 'component' },
  DataTable: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  DatePicker: { astro: 'none', elements: 'registered-element', react: 'component' },
  DateRangePicker: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Descriptions: { astro: 'none', elements: 'registered-element', react: 'component' },
  Dialog: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Direction: { astro: 'none', elements: 'registered-element', react: 'component' },
  Drawer: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  DropdownMenu: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Empty: { astro: 'none', elements: 'registered-element', react: 'component' },
  ErrorSummary: { astro: 'none', elements: 'registered-element', react: 'component' },
  Eyebrow: { astro: 'none', elements: 'registered-element', react: 'component' },
  Field: { astro: 'none', elements: 'registered-element', react: 'component' },
  FieldError: { astro: 'none', elements: 'registered-element', react: 'component' },
  FileUpload: { astro: 'none', elements: 'registered-element', react: 'component' },
  FloatingBadge: { astro: 'none', elements: 'registered-element', react: 'component' },
  Form: { astro: 'ui-primitives', elements: 'none', react: 'hook' },
  FormattedDate: { astro: 'none', elements: 'registered-element', react: 'component' },
  GradientDivider: { astro: 'none', elements: 'registered-element', react: 'component' },
  Grid: { astro: 'none', elements: 'registered-element', react: 'component' },
  HoverCard: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Icon: { astro: 'none', elements: 'registered-element', react: 'component' },
  Image: { astro: 'none', elements: 'registered-element', react: 'component' },
  Input: { astro: 'none', elements: 'registered-element', react: 'component' },
  InputGroup: { astro: 'none', elements: 'registered-element', react: 'component' },
  InputOTP: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Item: { astro: 'none', elements: 'registered-element', react: 'component' },
  KanbanBoard: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  KanbanColumn: { astro: 'none', elements: 'registered-element', react: 'component' },
  Kbd: { astro: 'none', elements: 'registered-element', react: 'component' },
  Label: { astro: 'none', elements: 'registered-element', react: 'component' },
  LanguageToggle: { astro: 'none', elements: 'registered-element', react: 'component' },
  LineChart: { astro: 'none', elements: 'registered-element', react: 'component' },
  Link: { astro: 'none', elements: 'registered-element', react: 'component' },
  ListBox: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Marker: { astro: 'none', elements: 'registered-element', react: 'component' },
  Mentions: { astro: 'none', elements: 'registered-element', react: 'component' },
  Menubar: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Message: { astro: 'none', elements: 'registered-element', react: 'component' },
  MessageScroller: { astro: 'none', elements: 'registered-element', react: 'component' },
  Meter: { astro: 'none', elements: 'registered-element', react: 'component' },
  NativeSelect: { astro: 'none', elements: 'registered-element', react: 'component' },
  NavigationMenu: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Note: { astro: 'none', elements: 'registered-element', react: 'component' },
  NumberField: { astro: 'none', elements: 'registered-element', react: 'component' },
  Pagination: { astro: 'none', elements: 'registered-element', react: 'component' },
  Particles: { astro: 'none', elements: 'registered-element', react: 'component' },
  PasswordField: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  PhoneInput: { astro: 'none', elements: 'registered-element', react: 'component' },
  PieChart: { astro: 'none', elements: 'registered-element', react: 'component' },
  Pill: { astro: 'none', elements: 'registered-element', react: 'component' },
  Popconfirm: { astro: 'none', elements: 'registered-element', react: 'component' },
  Popover: { astro: 'none', elements: 'registered-element', react: 'hook' },
  Progress: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  Prose: { astro: 'none', elements: 'registered-element', react: 'component' },
  QRCode: { astro: 'none', elements: 'registered-element', react: 'component' },
  RadioGroup: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  Rating: { astro: 'none', elements: 'registered-element', react: 'component' },
  Resizable: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  RevealGroup: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  RichTextEditor: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Schedule: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  ScrollArea: { astro: 'none', elements: 'registered-element', react: 'component' },
  ScrollProgress: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  ScrollReveal: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  SearchField: { astro: 'none', elements: 'registered-element', react: 'component' },
  Segmented: { astro: 'none', elements: 'registered-element', react: 'component' },
  Select: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Separator: { astro: 'none', elements: 'registered-element', react: 'component' },
  Sheet: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Sidebar: { astro: 'none', elements: 'registered-element', react: 'component' },
  Skeleton: { astro: 'none', elements: 'registered-element', react: 'component' },
  SkipLink: { astro: 'none', elements: 'registered-element', react: 'component' },
  Slider: { astro: 'none', elements: 'registered-element', react: 'component' },
  Sonner: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  Sparkline: { astro: 'none', elements: 'registered-element', react: 'component' },
  SpeedDial: { astro: 'none', elements: 'registered-element', react: 'component' },
  Spinner: { astro: 'none', elements: 'registered-element', react: 'component' },
  Stack: { astro: 'none', elements: 'registered-element', react: 'component' },
  Stat: { astro: 'none', elements: 'registered-element', react: 'component' },
  StatDescription: { astro: 'none', elements: 'registered-element', react: 'component' },
  StatIcon: { astro: 'none', elements: 'registered-element', react: 'component' },
  StatLabel: { astro: 'none', elements: 'registered-element', react: 'component' },
  StatTrend: { astro: 'none', elements: 'registered-element', react: 'component' },
  StatValue: { astro: 'none', elements: 'registered-element', react: 'component' },
  Stepper: { astro: 'none', elements: 'registered-element', react: 'component' },
  Switch: { astro: 'none', elements: 'registered-element', react: 'component' },
  Table: { astro: 'none', elements: 'registered-element', react: 'component' },
  Tabs: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  TagGroup: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Textarea: { astro: 'none', elements: 'registered-element', react: 'component' },
  ThemeBuilder: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  ThemeToggle: { astro: 'none', elements: 'registered-element', react: 'component' },
  TimeField: { astro: 'none', elements: 'registered-element', react: 'component' },
  Timeline: { astro: 'none', elements: 'registered-element', react: 'component' },
  Toast: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  Toggle: {
    astro: 'ui-primitives',
    astroRuntimeBypass: 'controlled',
    elements: 'registered-element',
    react: 'component'
  },
  ToggleGroup: { astro: 'ui-primitives', elements: 'registered-element', react: 'component' },
  Toolbar: { astro: 'none', elements: 'registered-element', react: 'component' },
  Tooltip: { astro: 'none', elements: 'registered-element', react: 'hook' },
  Tour: { astro: 'none', elements: 'registered-element', react: 'component' },
  Transfer: { astro: 'none', elements: 'registered-element', react: 'component' },
  Tree: { astro: 'none', elements: 'registered-element', react: 'component' },
  TreeGrid: { astro: 'none', elements: 'registered-element', react: 'component' },
  TreeSelect: { astro: 'none', elements: 'registered-element', react: 'component' },
  Typography: { astro: 'none', elements: 'registered-element', react: 'component' },
  VirtualList: { astro: 'ui-primitives', elements: 'registered-element', react: 'hook' },
  VisuallyHidden: { astro: 'none', elements: 'registered-element', react: 'component' },
  Watermark: { astro: 'none', elements: 'registered-element', react: 'component' }
} as const satisfies Readonly<Record<LumenComponentName, LumenComponentBehavior>>

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
  runtime: 'astro' |
    'compose' |
    'core' |
    'elements' |
    'icons' |
    'react' |
    'react-native' |
    'swift' |
    'tokens' |
    'umbrella'
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
    name: 'Lumen React Native',
    packageName: '@santi020k/lumen-react-native',
    runtime: 'react-native'
  },
  { name: 'Lumen Tokens', packageName: '@santi020k/lumen-tokens', runtime: 'tokens' },
  { name: 'Lumen SwiftUI', packageName: 'LumenUI', runtime: 'swift' },
  {
    name: 'Lumen Compose',
    packageName: 'com.santi020k:lumen-compose',
    runtime: 'compose'
  },
  {
    name: 'Lumen Brand Icons',
    packageName: '@santi020k/lumen-icons-brand',
    runtime: 'icons'
  }
] as const satisfies readonly LumenPackageTarget[]
