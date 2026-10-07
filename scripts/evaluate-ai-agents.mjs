import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { chromium, expect } from '@playwright/test'
import ts from 'typescript'

import { verifyV4AgentScreen } from './lib/verify-v4-agent-screen.mjs'

const { build } = createRequire(new URL('../packages/elements/package.json', import.meta.url))('esbuild')
const root = resolve(import.meta.dirname, '..')
const providers = ['codex', 'claude']
const option = name => process.argv[process.argv.indexOf(name) + 1]
const provider = process.argv.includes('--provider') ? option('--provider') : undefined
const selected = provider ? [provider] : providers

assert.ok(selected.every(value => providers.includes(value)), 'Use --provider codex or claude.')

const cases = JSON.parse(await readFile(join(root, 'packages/mcp/evaluations/agent-cases.json'), 'utf8'))
const selectedCases = process.argv.includes('--case') ? cases.filter(value => option('--case').split(',').includes(value.id)) : cases

assert.ok(selectedCases.length > 0, 'No matching agent evaluation case.')

const output = process.argv.includes('--output') ? resolve(option('--output')) : await mkdtemp(join(tmpdir(), 'lumen-ai-evaluation-'))

await mkdir(output, { recursive: true })

const run = (command, args, cwd, logPath) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = ''
  let stderr = ''
  const timeout = setTimeout(() => child.kill('SIGTERM'), 600000)

  child.stdout.on('data', chunk => { stdout += chunk.toString() })

  child.stderr.on('data', chunk => { stderr += chunk.toString() })

  child.on('error', reject)

  child.on('close', async code => {
    clearTimeout(timeout)

    await writeFile(logPath, stdout)

    await writeFile(`${logPath}.stderr`, stderr)

    if (code !== 0) reject(new Error(`${command} exited ${code}; ${stderr.slice(-1500)}`))
    else resolve({ code, stderr })
  })
})

const copyTypes = async (packageName, directory, source) => {
  const target = join(directory, 'node_modules', ...packageName.split('/'))

  await mkdir(target, { recursive: true })

  await copyFile(join(source, 'package.json'), join(target, 'package.json'))

  await copyFile(join(source, 'README.md'), join(target, 'README.md'))

  await cp(join(source, 'dist'), join(target, 'dist'), { recursive: true, filter: (path) => !path.endsWith('.js') && !path.endsWith('.map') })
}

const setup = async (directory, scenario) => {
  await mkdir(directory, { recursive: true })

  assert.deepEqual(await readdir(directory), [], 'Use a fresh evidence directory for generation.')

  await cp(join(root, 'skills'), join(directory, '.agents/skills'), { recursive: true })

  await cp(join(root, 'skills'), join(directory, '.claude/skills'), { recursive: true })

  await writeFile(join(directory, 'AGENTS.md'), 'This is a synthetic local agent evaluation. Implement only the requested fixture files. Do not commit, install dependencies, access external services, or modify the harness and configuration. Preserve explicit user scope.\n')

  await writeFile(join(directory, 'CLAUDE.md'), 'Read AGENTS.md. Skills are in .claude/skills.\n')

  await copyTypes('@santi020k/lumen-react', directory, join(root, 'packages/react'))

  await copyTypes('@santi020k/lumen-elements', directory, join(root, 'packages/elements'))

  const version = scenario.kind === 'review' ? '3.0.1' : '4.0.0'

  await writeFile(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { '@santi020k/lumen-react': version, '@santi020k/lumen-elements': '4.0.0' } }, null, 2))

  if (scenario.kind === 'review') {
    const path = join(directory, 'node_modules/@santi020k/lumen-react/package.json')
    const olderPackage = option('--older-package')

    assert.ok(process.argv.includes('--older-package'), 'Review requires --older-package pointing to the published React 3.0.1 package.')

    await rm(join(directory, 'node_modules/@santi020k/lumen-react'), { recursive: true })

    await cp(resolve(olderPackage), join(directory, 'node_modules/@santi020k/lumen-react'), { recursive: true })

    const manifest = JSON.parse(await readFile(path, 'utf8'))

    assert.equal(manifest.version, version)

    await writeFile(join(directory, 'Screen.tsx'), "import { Button } from '@santi020k/lumen-react'\nexport default function Screen() { return <Button>Save</Button> }\n")
  }

  if (scenario.kind.startsWith('react')) await writeFile(join(directory, 'Screen.tsx'), 'export default function Screen() { return null }\n')

  if (scenario.kind === 'elements') {
    await writeFile(join(directory, 'Screen.html'), '<main></main>\n')

    await writeFile(join(directory, 'setup.ts'), 'export {}\n')
  }

  if (scenario.kind === 'migration') {
    await writeFile(join(directory, 'server.ts'), "// Preserve this example: @modelcontextprotocol/sdk/server/mcp.js\nimport { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js'\nimport { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'\nexport const server = new Server({ name: 'fixture', version: '1.0.0' })\nexport const transport = new StdioServerTransport()\n")

    await writeFile(join(directory, 'lumen-cli.mjs'), `import ${JSON.stringify(join(root, 'packages/lumen/dist/cli.js'))}\n`)

    await run(process.execPath, ['lumen-cli.mjs', 'migrate', 'v4', '--dry-run', '--json'], directory, join(directory, 'migration-preview.json'))
  }

  const mcp = { mcpServers: scenario.mcp ? { lumen: { command: process.execPath, args: [join(root, 'packages/mcp/bin/lumen-mcp.mjs')] } } : {} }

  await writeFile(join(directory, 'mcp-config.json'), JSON.stringify(mcp))
}

const invoke = async (name, directory, scenario) => {
  const connection = scenario.mcp ? 'The lumen MCP server is connected. Call lumen_get_meta and lumen_check_compatibility before using catalog contracts. ' : ''
  const prompt = `${connection}${scenario.prompt}\nOnly edit fixture output files. Do not modify package.json, node_modules, skills, AGENTS.md, CLAUDE.md, or MCP configuration. Do not use external network services. Report unresolved behavior honestly. No Git commits.\n`

  if (name === 'codex') {
    const config = scenario.mcp ? [
      '-c', `mcp_servers.lumen.command=${JSON.stringify(process.execPath)}`,
      '-c', `mcp_servers.lumen.args=${JSON.stringify([join(root, 'packages/mcp/bin/lumen-mcp.mjs')])}`
    ] : []

    return run('codex', ['exec', '--ignore-user-config', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'workspace-write', '--json', ...config, prompt], directory, join(directory, 'agent.jsonl'))
  }

  return run('claude', ['--print', '--no-session-persistence', '--strict-mcp-config', '--mcp-config', join(directory, 'mcp-config.json'), '--restricted', '--setting-sources', '', '--tools', 'Read,Write,Edit,Glob,Grep,Skill', '--permission-mode', 'acceptEdits', '--allowedTools', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Skill', 'mcp__lumen__*', '--output-format', 'stream-json', '--verbose', prompt], directory, join(directory, 'agent.jsonl'))
}

const typecheck = files => {
  const program = ts.createProgram(files, {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext, noEmit: true,
    paths: {
      '@santi020k/lumen-react': [join(root, 'packages/react/dist/index.d.ts')],
      '@santi020k/lumen-elements/define': [join(root, 'packages/elements/dist/define.d.ts')],
      '@modelcontextprotocol/server': [join(root, 'packages/mcp/node_modules/@modelcontextprotocol/server/dist/index.d.mts')],
      '@modelcontextprotocol/server/stdio': [join(root, 'packages/mcp/node_modules/@modelcontextprotocol/server/dist/stdio.d.mts')],
      react: [join(root, 'packages/react/node_modules/@types/react/index.d.ts')],
      'react/*': [join(root, 'packages/react/node_modules/@types/react/*.d.ts')]
    }, skipLibCheck: true, strict: true, target: ts.ScriptTarget.ES2022
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)

  assert.equal(diagnostics.length, 0, diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n'))
}

const verifyReview = async directory => {
  const report = JSON.parse(await readFile(join(directory, 'assessment.json'), 'utf8'))

  assert.deepEqual(report, { resolvedVersion: '3.0.1', catalogVersion: '4.0.0', mayUseCatalog: false, supportedComponent: false, contractSource: 'installed', proposedUpgrade: false })

  assert.ok((await readFile(join(directory, 'review.md'), 'utf8')).length > 100)
}

const verifyMigration = async directory => {
  const source = await readFile(join(directory, 'server.ts'), 'utf8')

  assert.ok(source.startsWith('// Preserve this example: @modelcontextprotocol/sdk/server/mcp.js'))

  const parsed = ts.createSourceFile('server.ts', source, ts.ScriptTarget.Latest, true)
  const imports = parsed.statements.filter(ts.isImportDeclaration).map(statement => statement.moduleSpecifier.text)

  assert.ok(imports.includes('@modelcontextprotocol/server'))

  assert.ok(imports.includes('@modelcontextprotocol/server/stdio'))

  const report = JSON.parse(await readFile(join(directory, 'migration-review.json'), 'utf8'))

  assert.equal(report.targetVersion, '4.0.0')

  assert.ok(report.dependencyUpdates.includes('@modelcontextprotocol/server'))

  assert.ok(Array.isArray(report.manualReview))

  typecheck([join(directory, 'server.ts')])
}

const serve = async directory => {
  const server = createServer(async (request, response) => {
    const routes = { '/app.js': 'app.js', '/app.css': 'app.css' }
    const path = routes[request.url] ?? 'index.html'

    try {
      const contentTypes = { 'app.js': 'text/javascript', 'app.css': 'text/css', 'index.html': 'text/html' }

      response.setHeader('Content-Type', contentTypes[path])

      response.end(await readFile(join(directory, path)))
    } catch { response.writeHead(404);

 response.end() }
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)

    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)

      resolve()
    })
  })

  const address = server.address()

  assert.ok(address && typeof address !== 'string')

  return { server, url: `http://127.0.0.1:${address.port}` }
}

const screenBody = async (directory, react) => {
  if (react) return '<div id="app"></div>'

  const body = await readFile(join(directory, 'Screen.html'), 'utf8')

  assert.ok(body.includes('<lumen-dialog'), 'Elements screen bypassed the public dialog behavior.')

  return body
}

const prepareScreen = async (directory, scenario) => {
  const react = scenario.kind.startsWith('react')
  const entry = react ? `import React from 'react'; import { createRoot } from 'react-dom/client'; import Screen from './Screen'; import ${JSON.stringify(join(root, 'packages/astro/styles/lumen.css'))}; createRoot(document.getElementById('app')).render(<Screen />);` : `import './setup'; import ${JSON.stringify(join(root, 'packages/astro/styles/lumen.css'))};`
  const entryPath = join(directory, react ? 'entry.tsx' : 'entry.ts')

  await writeFile(entryPath, entry)

  typecheck([join(directory, react ? 'Screen.tsx' : 'setup.ts')])

  const result = await build({
    entryPoints: [entryPath], outfile: join(directory, 'app.js'), bundle: true, format: 'esm', jsx: 'automatic', metafile: true,
    alias: {
      '@santi020k/lumen-react': join(root, 'packages/react/dist/index.js'),
      '@santi020k/lumen-elements': join(root, 'packages/elements/dist/index.js'),
      '@santi020k/lumen-elements/define': join(root, 'packages/elements/dist/define.js'),
      react: join(root, 'node_modules/react'),
      'react-dom': join(root, 'packages/react/node_modules/react-dom')
    }
  })

  assert.ok(Object.keys(result.metafile.inputs).some(path => path.includes(react ? 'packages/react/' : 'packages/elements/')), 'Generated screen does not use the public Lumen adapter.')

  const body = await screenBody(directory, react)


  await writeFile(join(directory, 'index.html'), `<!doctype html><html lang="${react ? 'en' : 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Agent evaluation</title><link rel="stylesheet" href="/app.css"></head><body>${body}<script type="module" src="/app.js"></script></body></html>`)

  return serve(directory)
}

const verifyScreen = async (directory, scenario) => {
  const react = scenario.kind.startsWith('react')
  const { server, url } = await prepareScreen(directory, scenario)
  const browser = await chromium.launch()

  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      const errors = []

      page.on('pageerror', error => errors.push(error.message))

      await page.goto(url)

      if (['react-content-flow', 'react-appearance-presets'].includes(scenario.kind)) {
        await verifyV4AgentScreen(page, scenario.kind, directory, root, width)

        assert.deepEqual(errors, [])

        await page.close()

        continue
      }

      const trigger = page.getByRole('button', { name: react ? 'Edit profile' : 'Editar perfil', exact: true })

      await trigger.click()

      const dialog = page.getByRole('dialog', { name: react ? 'Profile settings' : 'Preferencias del perfil' })

      await expect(dialog).toBeVisible()

      const field = dialog.getByRole('textbox', { name: react ? 'Display name' : 'Nombre', exact: true })

      await expect(field).toBeFocused()

      await expect(field).toHaveValue('Ada')

      await field.fill('Grace')

      await page.screenshot({ path: join(directory, `${width}.png`), fullPage: true })

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)

      assert.equal(overflow, false, `Horizontal overflow at ${width}px`)

      await page.addScriptTag({ path: join(root, 'packages/elements/node_modules/axe-core/axe.min.js') })

      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(value => ({ id: value.id, impact: value.impact })))

      assert.deepEqual(violations, [])

      await field.press('Escape')

      await expect(dialog).not.toBeVisible()

      await expect(trigger).toBeFocused()

      await trigger.click()

      await expect(field).toHaveValue('Grace')

      await dialog.getByRole('button', { name: react ? 'Cancel' : 'Cancelar', exact: true }).click()

      await expect(dialog).not.toBeVisible()

      await expect(trigger).toBeFocused()

      assert.deepEqual(errors, [])

      await page.close()
    }
  } finally {
    await browser.close()

    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

const verifyToolUse = async (directory, scenario) => {
  const transcript = await readFile(join(directory, 'agent.jsonl'), 'utf8')

  const calls = transcript.split('\n').filter(Boolean).flatMap(line => {
    const event = JSON.parse(line)
    const names = (event.message?.content ?? []).filter(part => part.type === 'tool_use').map(part => part.name)

    if (event.item?.type === 'mcp_tool_call') names.push(event.item.tool)

    return names
  })

  if (scenario.mcp) {
    assert.ok(calls.some(name => name.endsWith('lumen_check_compatibility')), 'Agent skipped MCP compatibility check.')

    if (scenario.kind === 'migration') assert.ok(calls.some(name => name.endsWith('lumen_get_migration')))
  } else assert.ok(calls.every(name => !name.includes('lumen_')), 'Disconnected case used MCP.')
}

const hashTree = async directory => {
  const digest = createHash('sha256')

  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
    digest.update(entry.name)

    if (entry.isDirectory()) digest.update(await hashTree(join(directory, entry.name)))
    else digest.update(await readFile(join(directory, entry.name)))
  }

  return digest.digest('hex')
}

const immutableState = async directory => {
  const files = ['package.json', 'AGENTS.md', 'CLAUDE.md', 'mcp-config.json']

  if ((await readdir(directory)).includes('migration-preview.json')) files.push('lumen-cli.mjs', 'migration-preview.json')

  const state = await Promise.all(files.map(file => readFile(join(directory, file), 'utf8')))

  return [...state, ...await Promise.all(['node_modules', '.agents', '.claude'].map(path => hashTree(join(directory, path))))]
}

const reports = []

for (const name of selected) {
  for (const scenario of selectedCases) {
    const directory = join(output, `${name}-${scenario.id}`)

    if (!process.argv.includes('--verify-only')) await setup(directory, scenario)

    const unchanged = await immutableState(directory)
    const reviewSource = scenario.kind === 'review' ? await readFile(join(directory, 'Screen.tsx'), 'utf8') : undefined

    process.stdout.write(`Starting ${name}/${scenario.id}\n`)

    const started = Date.now()

    try {
      if (!process.argv.includes('--verify-only')) await invoke(name, directory, scenario)

      await verifyToolUse(directory, scenario)

      assert.deepEqual(await immutableState(directory), unchanged, 'Agent changed protected configuration, dependencies, or skills.')

      if (scenario.kind === 'review') {
        assert.equal(await readFile(join(directory, 'Screen.tsx'), 'utf8'), reviewSource, 'Review changed application source.')

        await verifyReview(directory)
      } else if (scenario.kind === 'migration') await verifyMigration(directory)
      else await verifyScreen(directory, scenario)

      reports.push({ case: scenario.id, durationMs: Date.now() - started, provider: name, status: 'passed' })
    } catch (error) {
      reports.push({ case: scenario.id, diagnostic: error instanceof Error ? error.message : String(error), durationMs: Date.now() - started, provider: name, status: 'failed' })
    }

    await writeFile(join(output, 'results.json'), `${JSON.stringify(reports, null, 2)}\n`)

    process.stdout.write(`${name}/${scenario.id}: ${reports.at(-1).status}\n`)
  }
}

process.stdout.write(`Agent evidence: ${output}\n`)

if (reports.some(report => report.status !== 'passed')) process.exitCode = 1
