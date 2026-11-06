import type { ComponentName } from './contracts.js'
import { componentKeys } from './contracts.js'
import type { DesignNode } from './model.js'

export const designNode = (overrides: Partial<DesignNode> = {}): DesignNode => ({
  id: 'fixture-root',
  name: 'Settings',
  type: 'FRAME',
  text: null,
  component: null,
  properties: {},
  layout: { direction: 'VERTICAL', gap: 24, padding: [24, 24, 24, 24], wrap: false },
  tokens: [],
  unboundPaints: 0,
  children: [],
  ...overrides
})

export const componentNode = (name: ComponentName, properties: DesignNode['properties'] = {}, children: DesignNode[] = []): DesignNode => {
  const key = componentKeys[name][0]

  if (!key) throw new Error(`Missing fixture identity for ${name}.`)

  return designNode({ id: `fixture-${name}`, name, type: 'INSTANCE', component: { key, setKey: null, name }, properties, children })
}

export const settingsFixture = designNode({ children: [
  componentNode('Card', { Title: 'Workspace settings', Body: 'Manage the details your team sees.' }),
  componentNode('Tabs', { Active: 'Overview', 'Overview label': 'Profile', 'Details label': 'Team', 'Settings label': 'Preferences' }),
  componentNode('Field', { Label: 'Workspace name', 'Helper text': 'Shown to everyone in your workspace.', 'Show helper': true }, [
    componentNode('Input', { Placeholder: 'Northstar studio', Size: 'Default' })
  ]),
  componentNode('Button', { Label: 'Save changes', Variant: 'Default', Size: 'Default', Loading: false, Disabled: false }),
  componentNode('Dialog', { Title: 'Archive workspace', Description: 'Review the archive action with your team.', 'Show content': true, 'Show actions': true, 'Cancel label': 'Cancel', 'Confirm label': 'Archive' })
] })

export const editorialFixture = componentNode('Stack', { Direction: 'Vertical', Gap: 'Lg' }, [
  componentNode('Badge', { Variant: 'Success' }, [designNode({ type: 'TEXT', name: 'Badge', text: 'Ready' })]),
  componentNode('Code', { Variant: 'Block', Wrap: 'On' }, [designNode({ type: 'TEXT', name: 'Line', text: 'pnpm install' })]),
  componentNode('Eyebrow', { Text: 'Field notes' }),
  componentNode('CardTitle', { Text: 'Release notes' }),
  componentNode('CardDescription', { Text: 'An editorial selection.' }),
  componentNode('Callout', { Title: 'Setup', Body: 'Choose your target.' }),
  componentNode('Note', { Label: 'Tip', 'Show Label': true, Body: 'Use the project palette.', Border: 'Right' }),
  componentNode('Prose', { Heading: 'Getting started', Paragraph: 'Install the adapter.', Subheading: 'Steps', List: '• Install\n• Verify', Link: 'Read more' }),
  componentNode('Timeline', Object.fromEntries([1, 2, 3].flatMap(i => [
    [`Event ${i} title`, `Release ${i}`], [`Event ${i} description`, 'Published'], [`Event ${i} time`, 'Today']
  ]))),
  componentNode('CodeTabs', {
    'Pnpm label': 'pnpm',
    'Npm label': 'npm',
    'Yarn label': 'yarn',
    'Pnpm code': 'pnpm install',
    'Npm code': 'npm install',
    'Yarn code': 'yarn install',
    Copy: true,
    Active: 'Npm',
    Wrap: 'On'
  }),
  componentNode('ThemeToggle'),
  componentNode('RevealGroup', { Once: false, Threshold: '0.25', Delay: '10 ms', Stagger: '40 ms', Animation: 'Slide up', Duration: 'Fast' }, [
    componentNode('ScrollReveal', { Animation: 'Scale' }, [componentNode('Kbd', { Text: 'Enter' })])
  ])
])
