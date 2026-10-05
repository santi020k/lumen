import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { verifyEfficiencyScreen } from './lib/verify-ai-efficiency-screen.mjs'

test('verifies public React UI with a CSS import, responsive states, keyboard paths, and status feedback', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-efficiency-verifier-'))

  try {
    const example = await readFile(new URL('../apps/docs/src/components/AiSettingsReact.tsx', import.meta.url), 'utf8')
    const component = example.replace('export default function NotificationPreferences()', 'function NotificationPreferences()')

    await writeFile(join(directory, 'package.json'), '{"type":"module"}')

    await writeFile(join(directory, 'fixture-env.d.ts'), "declare module '*.css' { const stylesheet: string; export default stylesheet }\n")

    await writeFile(join(directory, 'Screen.css'), 'main { max-width:48rem; margin:auto; padding:1rem; }')

    await writeFile(join(directory, 'Screen.tsx'), `import './Screen.css'\n${component}\nexport default function Screen() { return <main><h1>Notification settings</h1><NotificationPreferences /></main> }`)

    const scenario = { id: 'notification-settings', heading: 'Notification settings' }

    await verifyEfficiencyScreen(directory, scenario, 'docs')

    await assert.rejects(verifyEfficiencyScreen(directory, scenario, 'scratch'), /Cannot find module|Unexpected import/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('verifies workspace filters without losing preference edits and rejects broken combined filtering', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-workspace-verifier-'))

  try {
    const example = await readFile(new URL('../apps/docs/src/components/AiSettingsReact.tsx', import.meta.url), 'utf8')
    const component = example.replace('export default function NotificationPreferences()', 'function NotificationPreferences()')

    const source = `${component}
      import { NativeSelect } from '@santi020k/lumen-react'
      function Members() {
        const [search, setSearch] = useState('')
        const [role, setRole] = useState('All')
        const members = [{ name: 'Ada', role: 'Owner' }, { name: 'Grace', role: 'Editor' }, { name: 'Lin', role: 'Viewer' }]
        const shown = members.filter(member => member.name.toLowerCase().includes(search.toLowerCase()) && (role === 'All' || member.role === role))
        return <section><h2>Team members</h2><Label htmlFor="members-search">Search members</Label><Input id="members-search" value={search} onChange={event => setSearch(event.target.value)} /><Label htmlFor="members-role">Role filter</Label><NativeSelect id="members-role" value={role} onChange={event => setRole(event.target.value)}>{['All', 'Owner', 'Editor', 'Viewer'].map(value => <option key={value}>{value}</option>)}</NativeSelect><ul aria-label="Team members">{shown.map(member => <li key={member.name}>{member.name}: {member.role}</li>)}</ul>{shown.length === 0 && <p>No results</p>}</section>
      }
      export default function Screen() { return <main><h1>Workspace settings</h1><NotificationPreferences /><Members /></main> }
    `

    await writeFile(join(directory, 'package.json'), '{"type":"module"}')

    await writeFile(join(directory, 'fixture-env.d.ts'), "declare module '*.css' { const stylesheet: string; export default stylesheet }\n")

    await writeFile(join(directory, 'Screen.css'), 'main { max-width:48rem; margin:auto; padding:1rem; }')

    await writeFile(join(directory, 'Screen.tsx'), source)

    const scenario = { id: 'workspace-settings', heading: 'Workspace settings', framework: 'react' }

    await verifyEfficiencyScreen(directory, scenario, 'docs')

    await writeFile(join(directory, 'Screen.tsx'), source.replace("role === 'All' || member.role === role", "true"))

    await assert.rejects(verifyEfficiencyScreen(directory, scenario, 'docs'), /count|Count|expect/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('verifies actual Elements controls in the React host and rejects native-only substitutions', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-elements-efficiency-verifier-'))

  try {
    const source = `import { createElement, useState, type FormEvent } from 'react'
      export default function Screen() {
        const [email, setEmail] = useState('ada@example.com')
        const [details, setDetails] = useState(false)
        const [saved, setSaved] = useState<string | null>(null)
        const input = createElement('lumen-input', { 'aria-label': 'Email address', type: 'email', value: email, onInput: (event: FormEvent<HTMLElement>) => { const next: unknown = Reflect.get(event.currentTarget, 'value'); if (typeof next === 'string') setEmail(next) } })
        return <main><h1>Notification settings</h1>{input}{createElement('lumen-button', { type: 'button', onClick: () => setDetails(!details), 'aria-expanded': details }, 'Show delivery details')}{createElement('lumen-button', { type: 'button', onClick: () => setSaved(email) }, 'Save preferences')}<p hidden={!details}>Weekly summaries arrive on Monday.</p>{saved !== null && <p role="status">Preferences saved for {saved}.</p>}</main>
      }`

    await writeFile(join(directory, 'package.json'), '{"type":"module"}')

    await writeFile(join(directory, 'fixture-env.d.ts'), "declare module '*.css' { const stylesheet: string; export default stylesheet }\n")

    await writeFile(join(directory, 'Screen.css'), 'main { max-width:48rem; margin:auto; padding:1rem; }')

    await writeFile(join(directory, 'Screen.tsx'), source)

    const scenario = { id: 'elements-notification-settings', heading: 'Notification settings', framework: 'elements' }

    await verifyEfficiencyScreen(directory, scenario, 'docs')

    await writeFile(join(directory, 'Screen.tsx'), source.replaceAll("'lumen-input'", "'input'").replaceAll("'lumen-button'", "'button'"))

    await assert.rejects(verifyEfficiencyScreen(directory, scenario, 'docs'), /count|Count|expect/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
