import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

// Xcode emits a .swiftmodule directory; SwiftPM emits a file inside Modules.
export const findSwiftModuleSearchPath = (root, moduleName) => {
  const matches = []

  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)

      if (entry.name === `${moduleName}.swiftmodule`) matches.push(path)
      else if (entry.isDirectory()) visit(path)
    }
  }

  visit(root)

  assert.equal(matches.length, 1, `Expected one ${moduleName}.swiftmodule in ${root}`)

  return dirname(matches[0])
}

export const readSwiftApiProducts = (manifest, moduleName, platforms) => {
  assert.ok(manifest && typeof manifest === 'object', 'Invalid Swift API products manifest')

  const products = manifest[moduleName]

  assert.ok(products && typeof products === 'object', `Missing ${moduleName} products`)

  assert.deepEqual(Object.keys(products).sort(), [...platforms].sort(), `${moduleName} products must cover every supported platform`)

  for (const platform of platforms) {
    assert.ok(typeof products[platform] === 'string' && products[platform].length > 0, `Missing ${platform} products path`)
  }

  return products
}
