import { existsSync, readdirSync, readFileSync } from 'node:fs'

import { expect, test } from 'vitest'

import { packageGroups, packageGuides } from './package-guides'

test('lists every public npm package once and groups it with a usage guide', () => {
  const packages = new URL('../../../../packages/', import.meta.url)
  const names = readdirSync(packages, { withFileTypes: true }).filter(entry => entry.isDirectory()).flatMap(entry => {
    const manifest = new URL(`${entry.name}/package.json`, packages)
    if (!existsSync(manifest)) return []
    const value: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
    if (typeof value !== 'object' || value === null || !('name' in value) || typeof value.name !== 'string') return []
    return 'private' in value && value.private === true ? [] : [value.name]
  })
  expect(packageGuides.map(pkg => pkg.packageName).sort()).toEqual(names.sort())
  const groups = new Set(packageGroups.map(group => group.id))
  for (const pkg of packageGuides) {
    expect(groups.has(pkg.group)).toBe(true)
    expect(pkg.href).toMatch(/^\/docs/)
  }
})
