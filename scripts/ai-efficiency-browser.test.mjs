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
