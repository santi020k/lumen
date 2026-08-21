import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lumen-consumer-packages-'))
const archiveDirectory = join(temporaryRoot, 'archives')
const consumerDirectory = join(temporaryRoot, 'consumer')

const packageDirectories = [
  'lumen',
  'core',
  'astro',
  'react',
  'react-hook-form',
  'elements',
  'icons-brand'
]

const run = (command, args, cwd = repositoryRoot) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
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
    mkdir(join(consumerDirectory, 'src', 'pages'), { recursive: true })
  ])

  for (const packageDirectory of packageDirectories) {
    run(
      'pnpm',
      ['pack', '--pack-destination', archiveDirectory],
      join(repositoryRoot, 'packages', packageDirectory)
    )
  }

  const archives = (await readdir(archiveDirectory))
    .filter(name => name.endsWith('.tgz'))
    .map(name => join(archiveDirectory, name))

  assert.equal(archives.length, packageDirectories.length)

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
      '@hookform/resolvers@5.7.1',
      'astro@7.1.3',
      'jsdom@29.1.1',
      'react@19.2.8',
      'react-dom@19.2.8',
      'react-hook-form@7.76.1',
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

defineLumenElements(dom.window.customElements)

assert.ok(dom.window.customElements.get('lumen-card'))
assert.ok(dom.window.customElements.get('lumen-dialog'))
`
  )

  await writeFile(
    join(consumerDirectory, 'src', 'pages', 'index.astro'),
    `---
import { Badge, Card } from '@santi020k/lumen-astro'
import '@santi020k/lumen-astro/styles.css'
---

<Card>
  <Badge>Ready</Badge>
  <p>Packed Astro consumer</p>
</Card>
`
  )

  run(process.execPath, ['smoke.mjs'], consumerDirectory)

  run(
    process.execPath,
    [join(consumerDirectory, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'],
    consumerDirectory
  )

  await Promise.all([
    access(join(consumerDirectory, 'dist', 'index.html')),
    access(join(consumerDirectory, 'node_modules', '@santi020k', 'lumen', 'styles.css')),
    access(join(consumerDirectory, 'node_modules', '@santi020k', 'lumen-elements', 'styles.css')),
    access(join(consumerDirectory, 'node_modules', '@santi020k', 'lumen-react', 'styles.css'))
  ])

  process.stdout.write(
    'Packed Core, umbrella, React, React Hook Form, Elements, Astro, and brand-icon packages passed clean-consumer smoke tests\n'
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
