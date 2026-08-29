import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lumen-consumer-packages-'))
const archiveDirectory = join(temporaryRoot, 'archives')
const consumerDirectory = join(temporaryRoot, 'consumer')

const packageDirectories = [
  { directory: 'lumen', name: '@santi020k/lumen' },
  { directory: 'core', name: '@santi020k/lumen-core' },
  { directory: 'astro', name: '@santi020k/lumen-astro' },
  { directory: 'react', name: '@santi020k/lumen-react' },
  { directory: 'react-hook-form', name: '@santi020k/lumen-react-hook-form' },
  { directory: 'elements', name: '@santi020k/lumen-elements' },
  { directory: 'icons-brand', name: '@santi020k/lumen-icons-brand' }
]

const requestedPackagesSource = process.env.LUMEN_RELEASE_PACKAGES

const requestedPackages = requestedPackagesSource
  ? new Set(JSON.parse(requestedPackagesSource))
  : undefined

const run = (
  command,
  args,
  cwd = repositoryRoot,
  environment = {}
) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...environment },
    stdio: 'pipe'
  })

  if (result.status !== 0) {
    process.stderr.write(result.stdout)

    process.stderr.write(result.stderr)

    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`)
  }

  return result.stdout
}

try {
  await Promise.all([
    mkdir(archiveDirectory, { recursive: true }),
    mkdir(join(consumerDirectory, 'src', 'app'), { recursive: true }),
    mkdir(join(consumerDirectory, 'src', 'pages'), { recursive: true })
  ])

  const publishedPackageSpecs = []

  for (const package_ of packageDirectories) {
    if (requestedPackages && !requestedPackages.has(package_.name)) {
      const manifest = JSON.parse(
        await readFile(join(repositoryRoot, 'packages', package_.directory, 'package.json'), 'utf8')
      )

      publishedPackageSpecs.push(`${package_.name}@${manifest.version}`)

      continue
    }

    run(
      'pnpm',
      ['pack', '--pack-destination', archiveDirectory],
      join(repositoryRoot, 'packages', package_.directory)
    )
  }

  const archives = (await readdir(archiveDirectory))
    .filter(name => name.endsWith('.tgz'))
    .map(name => join(archiveDirectory, name))

  const expectedArchiveCount = requestedPackages
    ? packageDirectories.filter(package_ => requestedPackages.has(package_.name)).length
    : packageDirectories.length

  assert.equal(archives.length, expectedArchiveCount)

  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify({ name: 'lumen-consumer-smoke', private: true, type: 'module' }, null, 2)}\n`
  )

  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
      ...archives,
      ...publishedPackageSpecs,
      '@hookform/resolvers@5.7.1',
      '@types/node@26.2.0',
      '@types/react@19.2.18',
      '@types/react-dom@19.2.5',
      'astro@7.1.3',
      'jsdom@29.1.1',
      'next@16.3.2',
      'react@19.2.8',
      'react-dom@19.2.8',
      'react-hook-form@7.76.1',
      'typescript@6.0.3',
      'yup@1.7.1',
      'zod@4.4.3'
    ],
    consumerDirectory
  )

  await writeFile(
    join(consumerDirectory, 'smoke.mjs'),
    `import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useForm } from 'react-hook-form'

import { lumen } from '@santi020k/lumen'
import { lumenComponentNames, renderLumenIconSvg } from '@santi020k/lumen-core'
import { registerLumenBrandIcons } from '@santi020k/lumen-icons-brand'
import { Badge, Card } from '@santi020k/lumen-react'
import { Badge as ServerBadge, Card as ServerCard } from '@santi020k/lumen-react/server'
import {
  getLumenManagedFieldState,
  LumenSelectController
} from '@santi020k/lumen-react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { zodResolver } from '@hookform/resolvers/zod'
import * as yup from 'yup'
import * as z from 'zod'

assert.equal(lumen.name, 'Lumen')
assert.ok(lumenComponentNames.includes('Card'))

registerLumenBrandIcons()

assert.match(renderLumenIconSvg('brand:github'), /brand-github/)

const html = renderToStaticMarkup(
  createElement(Card, null, createElement(Badge, null, 'Ready'))
)

assert.match(html, /ui-card/)
assert.match(html, /ui-badge/)
assert.equal(
  renderToStaticMarkup(createElement(ServerBadge, null, 'Server ready')),
  '<span class="ui-badge ui-badge--default" data-variant="default">Server ready</span>'
)
assert.match(
  renderToStaticMarkup(createElement(ServerCard, { as: 'article' }, 'Server card')),
  /<article class="ui-card"/
)

const HookFormFixture = () => {
  const { control } = useForm({ defaultValues: { role: 'engineer' } })

  return createElement(LumenSelectController, {
    control,
    name: 'role',
    options: [
      { label: 'Designer', value: 'designer' },
      { label: 'Engineer', value: 'engineer' }
    ]
  })
}

const hookFormHtml = renderToStaticMarkup(createElement(HookFormFixture))

assert.match(hookFormHtml, /name="role"/)
assert.ok(hookFormHtml.includes('<option value="engineer" selected="">Engineer</option>'))

const resolverOptions = {
  fields: {},
  names: ['role'],
  shouldUseNativeValidation: false
}
const zodResult = await zodResolver(z.object({
  role: z.string().trim().min(1, 'Choose a role with Zod')
}))({ role: '' }, undefined, resolverOptions)
const yupResult = await yupResolver(yup.object({
  role: yup.string().required('Choose a role with Yup')
}))({ role: '' }, undefined, resolverOptions)

assert.equal(getLumenManagedFieldState({
  error: zodResult.errors.role,
  invalid: Boolean(zodResult.errors.role)
}, 'role').errorMessage, 'Choose a role with Zod')
assert.equal(getLumenManagedFieldState({
  error: yupResult.errors.role,
  invalid: Boolean(yupResult.errors.role)
}, 'role').errorMessage, 'Choose a role with Yup')

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'https://example.test'
})

for (const key of [
  'AbortController',
  'CustomEvent',
  'Document',
  'Element',
  'Event',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLSelectElement',
  'HTMLTextAreaElement',
  'MutationObserver',
  'Node'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: dom.window[key]
  })
}

Object.defineProperties(globalThis, {
  customElements: { configurable: true, value: dom.window.customElements },
  document: { configurable: true, value: dom.window.document },
  localStorage: { configurable: true, value: dom.window.localStorage },
  window: { configurable: true, value: dom.window }
})

const { defineLumenElements } = await import('@santi020k/lumen-elements/define')
const { defineLumenBadge } = await import('@santi020k/lumen-elements/components/badge')
const { defineLumenButton } = await import('@santi020k/lumen-elements/components/button')
const { defineLumenCard } = await import('@santi020k/lumen-elements/components/card')
const { defineLumenCombobox } = await import('@santi020k/lumen-elements/components/combobox')
const { defineLumenFoundations } = await import('@santi020k/lumen-elements/components/foundations')

defineLumenElements(dom.window.customElements)

assert.ok(dom.window.customElements.get('lumen-card'))
assert.ok(dom.window.customElements.get('lumen-dialog'))

const selectedConstructors = new Map()
const selectedRegistry = {
  define: (name, constructor) => selectedConstructors.set(name, constructor),
  get: name => selectedConstructors.get(name)
}

defineLumenElements(['Card', 'Button'], selectedRegistry)

assert.deepEqual([...selectedConstructors.keys()], ['lumen-card', 'lumen-button'])
assert.equal(selectedRegistry.get('lumen-dialog'), undefined)

const granularConstructors = new Map()
const granularRegistry = {
  define: (name, constructor) => granularConstructors.set(name, constructor),
  get: name => granularConstructors.get(name)
}

defineLumenBadge(granularRegistry)
defineLumenButton(granularRegistry)
defineLumenCard(granularRegistry)
defineLumenCombobox(granularRegistry)

assert.deepEqual(
  [...granularConstructors.keys()],
  ['lumen-badge', 'lumen-button', 'lumen-card', 'lumen-combobox']
)

const foundationConstructors = new Map()
const foundationRegistry = {
  define: (name, constructor) => foundationConstructors.set(name, constructor),
  get: name => foundationConstructors.get(name)
}

defineLumenFoundations(foundationRegistry)

assert.ok(foundationConstructors.has('lumen-grid'))
assert.ok(foundationConstructors.has('lumen-visually-hidden'))
`
  )

  await writeFile(
    join(consumerDirectory, 'src', 'pages', 'index.astro'),
    `---
import { Badge, Card, CopyButton, RevealGroup, ScrollReveal, Stat } from '@santi020k/lumen-astro'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
import '@santi020k/lumen-astro/styles.css'
import '@santi020k/lumen-elements/styles.css'
---

<Card>
  <Badge>Ready</Badge>
  <CopyButton value="Packed copy value" />
  <RevealGroup as="ul"><ScrollReveal as="li"><Stat label="Checks" value="4" /></ScrollReveal></RevealGroup>
  <p>Packed Astro consumer</p>
</Card>

<UIPrimitives />

<lumen-card>
  <lumen-badge variant="success">Granular elements ready</lumen-badge>
  <lumen-button>Continue</lumen-button>
</lumen-card>

<lumen-grid columns="2">
  <lumen-card-content>Foundation bundle ready</lumen-card-content>
</lumen-grid>

<script>
  import { defineLumenBadge } from '@santi020k/lumen-elements/components/badge'
  import { defineLumenButton } from '@santi020k/lumen-elements/components/button'
  import { defineLumenCard } from '@santi020k/lumen-elements/components/card'
  import { defineLumenCombobox } from '@santi020k/lumen-elements/components/combobox'
  import { defineLumenFoundations } from '@santi020k/lumen-elements/components/foundations'

  defineLumenBadge()
  defineLumenButton()
  defineLumenCard()
  defineLumenCombobox()
  defineLumenFoundations()
</script>
`
  )

  await writeFile(
    join(consumerDirectory, 'src', 'app', 'layout.tsx'),
    `import '@santi020k/lumen-react/styles.css'

import type { ReactNode } from 'react'

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
`
  )

  await writeFile(
    join(consumerDirectory, 'src', 'app', 'client-panel.tsx'),
    `'use client'

import { useState } from 'react'

import { Button } from '@santi020k/lumen-react'

export function ClientPanel() {
  const [saved, setSaved] = useState(false)

  return (
    <Button onClick={() => setSaved(true)}>{saved ? 'Saved' : 'Save'}</Button>
  )
}
`
  )

  await writeFile(
    join(consumerDirectory, 'src', 'app', 'page.tsx'),
    `import { Card } from '@santi020k/lumen-react'
import { Badge, Skeleton } from '@santi020k/lumen-react/server'

import { ClientPanel } from './client-panel'

export default function Page() {
  return (
    <main>
      <Card>
        <Badge>Ready</Badge>
        <p>Packed React package imported by a Server Component.</p>
        <Skeleton aria-label="Server-rendered placeholder" />
        <ClientPanel />
      </Card>
    </main>
  )
}
`
  )

  run(process.execPath, ['smoke.mjs'], consumerDirectory)

  run(
    process.execPath,
    [join(consumerDirectory, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'],
    consumerDirectory
  )

  run(
    process.execPath,
    [join(consumerDirectory, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'],
    consumerDirectory,
    { NEXT_TELEMETRY_DISABLED: '1' }
  )

  await Promise.all([
    access(join(consumerDirectory, '.next', 'BUILD_ID')),
    access(join(consumerDirectory, 'dist', 'index.html')),
    access(join(consumerDirectory, 'node_modules', '@santi020k', 'lumen', 'styles.css')),
    access(join(consumerDirectory, 'node_modules', '@santi020k', 'lumen-elements', 'styles.css')),
    access(join(consumerDirectory, 'node_modules', '@santi020k', 'lumen-react', 'styles.css'))
  ])

  const astroHtml = await readFile(join(consumerDirectory, 'dist', 'index.html'), 'utf8')

  assert.match(astroHtml, /<lumen-card>/)

  assert.match(astroHtml, /Granular elements ready/)

  assert.match(astroHtml, /Foundation bundle ready/)

  process.stdout.write(
    'Packed Core, umbrella, React, React Hook Form, Elements, Astro, Next.js, and brand-icon packages passed clean-consumer smoke tests\n'
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
