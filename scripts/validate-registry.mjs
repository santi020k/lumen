import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import Ajv from 'ajv'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(await readFile(join(repoRoot, 'registry/lumen.registry.json'), 'utf8'))
const schema = JSON.parse(await readFile(join(repoRoot, 'registry/registry.schema.json'), 'utf8'))
const errors = []
const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

if (!validate(manifest)) {
  for (const error of validate.errors ?? []) {
    errors.push(`schema: ${error.instancePath || '/'} ${error.message}`)
  }
}

const components = manifest.components ?? []
const componentNames = new Set(components.map(component => component.name))

const checkFiles = (owner, files = []) => {
  for (const file of files) {
    if (typeof file !== 'string') continue

    if (!existsSync(join(repoRoot, file))) {
      errors.push(`${owner}: file does not exist in the repository: ${file}`)
    }
  }
}

for (const component of components) {
  checkFiles(`component ${component.name}`, component.files)

  for (const dependency of component.dependencies ?? []) {
    if (dependency !== 'styles' && dependency !== 'runtime' && !componentNames.has(dependency)) {
      errors.push(`component ${component.name}: unknown dependency: ${dependency}`)
    }
  }
}

for (const item of manifest.items ?? []) {
  checkFiles(`item ${item.name}`, item.files)

  for (const componentName of item.components ?? []) {
    if (!componentNames.has(componentName)) {
      errors.push(`item ${item.name}: unknown component: ${componentName}`)
    }
  }
}

if (errors.length > 0) {
  throw new Error(`registry/lumen.registry.json failed validation:\n${errors.map(error => `- ${error}`).join('\n')}\n`)
}

process.stdout.write(`registry/lumen.registry.json is valid (${components.length} components, ${manifest.items.length} items)\n`)
