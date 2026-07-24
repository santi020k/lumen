import {
  lumenComponentNames,
  type LumenComponentName
} from '../packages/core/src/components.js'

export const componentNameToSlug = (name: LumenComponentName): string =>
  name
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()

/**
 * Sonner is the viewport used by Toast rather than a separately documented
 * primitive. Its public surface is exercised on the Toast component page.
 */
export const componentPageNames = lumenComponentNames.filter(name => name !== 'Sonner')

/**
 * Components whose Lumen runtime owns behavior beyond native HTML semantics.
 * Every entry must have an end-to-end behavior test, in addition to the
 * catalog-wide render, accessibility, and visual checks.
 */
export const runtimeBehaviorComponentNames = [
  'AlertDialog',
  'Anchor',
  'BackToTop',
  'Calendar',
  'Carousel',
  'Cascader',
  'Code',
  'Combobox',
  'Command',
  'ContextMenu',
  'DataTable',
  'DatePicker',
  'DateRangePicker',
  'Dialog',
  'Drawer',
  'DropdownMenu',
  'Field',
  'FileUpload',
  'HoverCard',
  'InputOTP',
  'Menubar',
  'Mentions',
  'NavigationMenu',
  'Popover',
  'Popconfirm',
  'RadioGroup',
  'Resizable',
  'RichTextEditor',
  'Schedule',
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
  'Sonner'
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
