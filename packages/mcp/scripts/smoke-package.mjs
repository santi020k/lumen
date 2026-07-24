import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lumen-mcp-package-smoke-'))
const archiveDirectory = join(temporaryRoot, 'archive')
const consumerDirectory = join(temporaryRoot, 'consumer')

const run = (command, args, cwd) => {
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
}

try {
  await Promise.all([
    mkdir(archiveDirectory, { recursive: true }),
    mkdir(consumerDirectory, { recursive: true })
  ])

  run('pnpm', ['pack', '--pack-destination', archiveDirectory], packageRoot)

  const archiveName = (await readdir(archiveDirectory))
    .find((name) => name.endsWith('.tgz'))

  assert.ok(archiveName, 'pnpm pack did not create a package archive')

  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumerDirectory,
      join(archiveDirectory, archiveName)
    ],
    consumerDirectory
  )

  const executable = join(
    consumerDirectory,
    'node_modules',
    '@santi020k',
    'lumen-mcp',
    'bin',
    'lumen-mcp.mjs'
  )

  const client = new Client({ name: 'lumen-package-smoke', version: '1.0.0' })

  const transport = new StdioClientTransport({
    args: [executable],
    command: process.execPath,
    cwd: consumerDirectory,
    stderr: 'pipe'
  })

  let stderr = ''

  transport.stderr?.on('data', (chunk) => {
    stderr += String(chunk)
  })

  try {
    await client.connect(transport)

    const [tools, meta, search, dialog] = await Promise.all([
      client.listTools(),
      client.callTool({ arguments: {}, name: 'lumen_get_meta' }),
      client.callTool({
        arguments: { framework: 'react', query: 'admin dashboard' },
        name: 'lumen_search'
      }),
      client.callTool({
        arguments: { detail: 'usage', framework: 'react', name: 'Dialog' },
        name: 'lumen_get_component'
      })
    ])

    assert.equal(stderr, '')

    assert.ok(tools.tools.some((tool) => tool.name === 'lumen_get_meta'))

    assert.match(String(meta.structuredContent?.meta?.catalogHash), /^[a-f0-9]{64}$/)

    assert.ok(Number(search.structuredContent?.total) > 0)

    assert.match(String(dialog.content[0]?.text), /useDialog/)

    assert.match(String(dialog.content[0]?.text), /triggerProps/)
  } finally {
    await client.close()
  }

  process.stdout.write('lumen-mcp: packed package passed external stdio smoke test\n')
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}
