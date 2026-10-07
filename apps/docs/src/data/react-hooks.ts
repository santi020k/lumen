import { toSlug } from '../lib/routes.ts'

import { reactHooksReference } from './docs.ts'

export const reactHookGroups = [
  {
    id: 'overlays',
    title: 'Overlays and menus',
    description: 'Open a surface, manage focus, and return safely to the trigger.',
    names: ['useDialog', 'usePopover', 'useDropdownMenu', 'useContextMenu', 'useTooltip']
  },
  {
    id: 'selection',
    title: 'Selection and preferences',
    description: 'Connect selected values, language, and appearance to your application.',
    names: ['useTabs', 'useSelect', 'useLanguageToggle', 'useThemeToggle']
  },
  {
    id: 'forms',
    title: 'Forms and dates',
    description: 'Handle validation, calendar selection, date ranges, and one-time codes.',
    names: ['useFormValidation', 'useCalendar', 'useDateRangePicker', 'useInputOTP']
  },
  {
    id: 'workspace',
    title: 'Editors and workspaces',
    description: 'Compose editable content, schedules, boards, panes, and themes.',
    names: ['useRichTextEditor', 'useSchedule', 'useKanban', 'useResizable', 'useThemeBuilder']
  },
  {
    id: 'feedback',
    title: 'Feedback',
    description: 'Create, update, and dismiss notifications from React state.',
    names: ['useToast']
  }
] as const

const componentOverrides: Readonly<Record<string, string>> = {
  useFormValidation: 'Form',
  useKanban: 'KanbanBoard'
}

export const reactHookGuides = reactHooksReference.map(hook => {
  const group = reactHookGroups.find(entry => entry.names.some(name => name === hook.name))

  if (!group) throw new Error(`Missing documentation group for ${hook.name}`)

  const slug = toSlug(hook.name)
  const componentName = componentOverrides[hook.name] ?? hook.name.slice(3)

  return {
    ...hook,
    componentHref: `/docs/components/${toSlug(componentName)}`,
    componentName,
    groupId: group.id,
    groupTitle: group.title,
    metadataDescription: hook.description.replaceAll('<', '').replaceAll('>', ''),
    href: `/docs/frameworks/react/hooks/${slug}`,
    slug
  }
})
