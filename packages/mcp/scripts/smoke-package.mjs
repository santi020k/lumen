import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lumen-mcp-package-smoke-'))
const archiveDirectory = join(temporaryRoot, 'archive')
const consumerDirectory = join(temporaryRoot, 'consumer')
let httpChild

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
    .find(name => name.endsWith('.tgz'))

  assert.ok(archiveName, 'pnpm pack did not create a package archive')

  run(
    'npm', [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumerDirectory,
      join(archiveDirectory, archiveName)
    ], consumerDirectory
  )

  const executable = join(
    consumerDirectory, 'node_modules', '@santi020k', 'lumen-mcp', 'bin', 'lumen-mcp.mjs'
  )

  const httpExecutable = join(
    consumerDirectory, 'node_modules', '@santi020k', 'lumen-mcp', 'bin', 'lumen-mcp-http.mjs'
  )

  await access(httpExecutable)

  const client = new Client({ name: 'lumen-package-smoke', version: '1.0.0' })

  const transport = new StdioClientTransport({
    args: [executable],
    command: process.execPath,
    cwd: consumerDirectory,
    stderr: 'pipe'
  })

  let stderr = ''

  transport.stderr?.on('data', chunk => {
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

    assert.ok(tools.tools.some(tool => tool.name === 'lumen_get_meta'))

    assert.ok(tools.tools.some(tool => tool.name === 'lumen_diagnose'))

    assert.match(String(meta.structuredContent?.meta?.catalogHash), /^[a-f0-9]{64}$/)

    assert.ok(Number(search.structuredContent?.total) > 0)

    assert.match(String(dialog.content[0]?.text), /useDialog/)

    assert.match(String(dialog.content[0]?.text), /triggerProps/)
  } finally {
    await client.close()
  }

  httpChild = spawn(process.execPath, [httpExecutable], {
    cwd: consumerDirectory,
    env: {
      ...process.env,
      LUMEN_MCP_PORT: '0'
    },
    stdio: ['ignore', 'ignore', 'pipe']
  })

  const httpUrl = await new Promise((resolve, reject) => {
    let output = ''

    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for packed HTTP server.\n${output}`))
    }, 5000)

    httpChild.stderr.on('data', chunk => {
      output += String(chunk)

      const match = output.match(/listening at (http:\/\/\S+)/)

      if (!match) return

      clearTimeout(timeout)

      resolve(new URL(match[1]))
    })

    httpChild.once('exit', code => {
      clearTimeout(timeout)

      reject(new Error(`Packed HTTP server exited with status ${code}.\n${output}`))
    })
  })

  const httpClient = new Client({ name: 'lumen-http-package-smoke', version: '1.0.0' })
  const httpTransport = new StreamableHTTPClientTransport(httpUrl)

  try {
    await httpClient.connect(httpTransport)

    const [httpTools, health] = await Promise.all([
      httpClient.listTools(),
      fetch(new URL('/health', httpUrl))
    ])

    assert.ok(httpTools.tools.some(tool => tool.name === 'lumen_diagnose'))

    assert.deepEqual(await health.json(), { status: 'ok' })
  } finally {
    await httpClient.close()
  }

  process.stdout.write('lumen-mcp: packed package passed external stdio smoke test\n')

  process.stdout.write('lumen-mcp: packed package passed external Streamable HTTP smoke test\n')
} finally {
  httpChild?.kill()

  await rm(temporaryRoot, { force: true, recursive: true })
}
