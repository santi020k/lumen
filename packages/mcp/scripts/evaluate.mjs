import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

import { loadLumenData } from '../dist/data.js'
import { createLumenServer } from '../dist/server.js'

const searchCases = JSON.parse(
  await readFile(new URL('../evaluations/search-cases.json', import.meta.url), 'utf8')
)

const searchOnly = process.argv.includes('--search-only')
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
const client = new Client({ name: 'lumen-mcp-evaluation', version: '1.0.0' })
const server = createLumenServer()

await Promise.all([
  server.connect(serverTransport),
  client.connect(clientTransport)
])

let evaluatedContracts = 0

try {
  for (const searchCase of searchCases) {
    const result = await client.callTool({
      arguments: {
        framework: searchCase.framework,
        limit: searchCase.top,
        query: searchCase.query
      },
      name: 'lumen_search'
    })

    const results = result.structuredContent?.results

    assert.ok(Array.isArray(results), `No structured search results for "${searchCase.query}"`)

    const names = results.map((item) => item.name)

    for (const expected of searchCase.expectedInTop) {
      assert.ok(
        names.includes(expected),
        `"${searchCase.query}" expected ${expected} in top ${searchCase.top}; received ${names.join(', ')}`
      )
    }
  }

  if (!searchOnly) {
    const data = loadLumenData()

    const evaluateComponent = async (component) => {
      for (const framework of ['astro', 'react', 'elements']) {
        if (!Reflect.get(component.frameworks, framework)) continue

        const result = await client.callTool({
          arguments: { detail: 'usage', framework, name: component.name },
          name: 'lumen_get_component'
        })

        assert.equal(
          result.isError,
          false,
          `${component.name} returned an MCP error for ${framework}`
        )

        assert.equal(
          result.structuredContent?.found,
          true,
          `${component.name} was not found for ${framework}`
        )

        assert.match(
          String(result.content[0]?.text),
          /## Example/,
          `${component.name} omitted its ${framework} example`
        )

        evaluatedContracts += 1
      }
    }

    for (const component of data.components) {
      await evaluateComponent(component)
    }

    const diagnostics = await client.callTool({
      arguments: {},
      name: 'lumen_diagnose'
    })

    assert.equal(diagnostics.structuredContent?.status, 'healthy')

    const manifest = await client.callTool({
      arguments: {},
      name: 'lumen_get_catalog_manifest'
    })

    const unchanged = await client.callTool({
      arguments: {
        baseline: manifest.structuredContent?.manifest,
        baselineCatalogHash: manifest.structuredContent?.catalogHash
      },
      name: 'lumen_diff_catalog'
    })

    assert.equal(unchanged.structuredContent?.unchanged, true)

    for (const uri of [
      'lumen://meta',
      'lumen://catalog-manifest',
      'lumen://diagnostics',
      'lumen://rules'
    ]) {
      const resource = await client.readResource({ uri })

      assert.ok(resource.contents.length > 0, `${uri} returned no content`)
    }
  }

  process.stdout.write(
    `lumen-mcp: ${searchCases.length} search cases passed` +
    (searchOnly ? '\n' : `; ${evaluatedContracts} framework contracts passed end-to-end\n`)
  )
} finally {
  await client.close()

  if (server.isConnected()) await server.close()
}
