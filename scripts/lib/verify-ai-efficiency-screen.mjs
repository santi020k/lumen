import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { chromium, expect } from '@playwright/test'
import ts from 'typescript'

const root = new URL('../../', import.meta.url).pathname
const { build } = createRequire(new URL('../../packages/elements/package.json', import.meta.url))('esbuild')

export const verifyEfficiencyScreen = async (directory, scenario, mode) => {
  const source = join(directory, 'Screen.tsx')

  const program = ts.createProgram([source, join(directory, 'fixture-env.d.ts')], {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022,
    paths: {
      ...(mode === 'scratch' ? {} : { '@santi020k/lumen-react': [join(root, 'packages/react/dist/index.d.ts')] }),
      react: [join(root, 'packages/react/node_modules/@types/react/index.d.ts')],
      'react/*': [join(root, 'packages/react/node_modules/@types/react/*.d.ts')]
    }
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)

  assert.equal(diagnostics.length, 0, diagnostics.map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n'))

  const parsed = ts.createSourceFile(source, await readFile(source, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  const inspect = node => {
    assert.notEqual(node.kind, ts.SyntaxKind.AnyKeyword, 'Use precise types; any is not allowed.')

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      assert.ok(['react', './Screen.css', ...(mode === 'scratch' ? [] : ['@santi020k/lumen-react'])].includes(node.moduleSpecifier.text), 'Unexpected import outside the fixture contract.')
    }

    ts.forEachChild(node, inspect)
  }

  inspect(parsed)

  await writeFile(join(directory, 'entry.tsx'), `import React from 'react'; import { createRoot } from 'react-dom/client'; import Screen from './Screen'; import './Screen.css'; ${mode === 'scratch' ? '' : `import ${JSON.stringify(join(root, 'packages/astro/styles/lumen.css'))};`} createRoot(document.getElementById('app')).render(<Screen />);`)

  const bundle = await build({
    entryPoints: [join(directory, 'entry.tsx')], outfile: join(directory, 'app.js'), bundle: true,
    format: 'esm', jsx: 'automatic', metafile: true,
    alias: {
      '@santi020k/lumen-react': join(root, 'packages/react/dist/index.js'),
      react: join(root, 'node_modules/react'), 'react-dom': join(root, 'packages/react/node_modules/react-dom')
    }
  })

  assert.equal(Object.keys(bundle.metafile.inputs).some(path => path.includes('packages/react/dist/')), mode !== 'scratch', 'The implementation must use the assigned UI approach.')

  await writeFile(join(directory, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>UI efficiency fixture</title><link rel="stylesheet" href="/app.css"><style>body{margin:0;font-family:system-ui,sans-serif}*{box-sizing:border-box}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>')

  const server = createServer(async (request, response) => {
    const routes = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/app.css': ['app.css', 'text/css'] }
    const route = routes[request.url]

    if (!route) { response.writeHead(404);

 response.end();

 return }

    try {
      response.setHeader('Content-Type', route[1])

      response.end(await readFile(join(directory, route[0])))
    } catch { response.writeHead(404);

 response.end() }
  })

  await new Promise((resolve, reject) => { server.once('error', reject);

 server.listen(0, '127.0.0.1', resolve) })

  const address = server.address()

  assert.ok(address && typeof address !== 'string')

  const browser = await chromium.launch()

  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      const errors = []

      page.on('pageerror', error => errors.push(error.message))

      await page.goto(`http://127.0.0.1:${address.port}`)

      await expect(page.getByRole('heading', { level: 1, name: scenario.heading })).toBeVisible()

      const capture = async state => {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow.')

        await page.addScriptTag({ path: join(root, 'packages/elements/node_modules/axe-core/axe.min.js') })

        const violations = await page.evaluate(async () => (await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
        })).violations.map(value => ({ id: value.id, nodes: value.nodes.map(node => node.failureSummary) })))

        await page.screenshot({ path: join(directory, `${width}-${state}.png`), fullPage: true })

        assert.deepEqual(violations, [], 'Automated accessibility checks failed.')
      }

      await capture('initial')

      if (scenario.id === 'profile-dialog') {
        const trigger = page.getByRole('button', { name: 'Edit profile', exact: true })
        const dialog = page.getByRole('dialog', { name: 'Profile settings', exact: true })

        await trigger.focus()

        await trigger.press('Enter')

        const field = dialog.getByRole('textbox', { name: 'Display name', exact: true })

        await expect(field).toBeFocused()

        await expect(field).toHaveValue('Ada')

        await field.fill('Grace')

        for (let step = 0; step < 6; step += 1) {
          await page.keyboard.press('Tab')

          assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'Modal keyboard focus escaped.')
        }

        for (let step = 0; step < 6; step += 1) {
          await page.keyboard.press('Shift+Tab')

          assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'Reverse modal keyboard focus escaped.')
        }

        await capture('open')

        await field.press('Escape')

        await expect(dialog).toBeHidden()

        await expect(trigger).toBeFocused()

        await trigger.press('Enter')

        await expect(field).toHaveValue('Grace')

        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()

        await expect(dialog).toBeHidden()

        await expect(trigger).toBeFocused()
      } else {
        const email = page.getByRole('textbox', { name: 'Email address', exact: true })
        const details = page.getByText('Weekly summaries arrive on Monday.', { exact: true })
        const toggle = page.getByRole('button', { name: 'Show delivery details', exact: true })

        await expect(email).toHaveValue('ada@example.com')

        await expect(details).toBeHidden()

        await email.fill('grace@example.com')

        await toggle.focus()

        await toggle.press('Enter')

        await expect(details).toBeVisible()

        await capture('details')

        await toggle.press('Enter')

        await expect(details).toBeHidden()

        await expect(email).toHaveValue('grace@example.com')

        await page.getByRole('button', { name: 'Save preferences', exact: true }).click()

        await expect(page.getByRole('status')).toHaveText('Preferences saved for grace@example.com.')

        await capture('saved')
      }

      assert.deepEqual(errors, [], 'Browser runtime errors.')

      await page.close()
    }
  } finally {
    await browser.close()

    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}
