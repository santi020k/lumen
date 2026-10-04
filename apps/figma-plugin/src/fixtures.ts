import { componentKeys } from './contracts.js'
import type { ComponentName, DesignNode } from './model.js'

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
