import {
  type LumenComponentName,
  lumenComponentNames} from '../../packages/core/src/components.js'

export const componentNameToSlug = (name: LumenComponentName): string =>
  name
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()

export const componentPageNames = lumenComponentNames

/**
 * Components whose Lumen runtime owns behavior beyond native HTML semantics.
 * Every entry must have an end-to-end behavior test, in addition to the
 * catalog-wide render, accessibility, and visual checks.
 */
export const runtimeBehaviorComponentNames = [
  'AlertDialog',
  'Anchor',
  'AnimatedNumber',
  'BackToTop',
  'Calendar',
  'Carousel',
  'Cascader',
  'Code',
  'CodeTabs',
  'Combobox',
  'Command',
  'ContextMenu',
  'CopyButton',
  'DataTable',
  'DatePicker',
  'DateRangePicker',
  'Dialog',
  'Drawer',
  'DropdownMenu',
  'Field',
  'FileUpload',
  'Form',
  'HoverCard',
  'InputOTP',
  'KanbanBoard',
  'LanguageToggle',
  'ListBox',
  'Menubar',
  'Mentions',
  'NavigationMenu',
  'Popover',
  'Popconfirm',
  'PasswordField',
  'Progress',
  'RadioGroup',
  'Resizable',
  'RevealGroup',
  'RichTextEditor',
  'Schedule',
  'ScrollProgress',
  'ScrollReveal',
  'Select',
  'Sheet',
  'SpeedDial',
  'Tabs',
  'TagGroup',
  'ThemeBuilder',
  'ThemeToggle',
  'Toast',
  'Toggle',
  'ToggleGroup',
  'Toolbar',
  'Tooltip',
  'Tour',
  'Transfer',
  'Tree',
  'TreeGrid',
  'TreeSelect',
  'VirtualList',
  'ToastViewport'
] as const satisfies readonly LumenComponentName[]

const runtimeNameSet = new Set<string>(runtimeBehaviorComponentNames)

if (runtimeNameSet.size !== runtimeBehaviorComponentNames.length) {
  throw new Error('Runtime behavior component coverage contains duplicate names.')
}

for (const name of runtimeBehaviorComponentNames) {
  if (!(lumenComponentNames as readonly string[]).includes(name)) {
    throw new Error(`Runtime behavior coverage references unknown component ${name}.`)
  }
}
