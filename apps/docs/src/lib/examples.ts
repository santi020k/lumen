import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

const liveModules = import.meta.glob<{ default: AstroComponentFactory }>('../examples/*.astro', { eager: true })
const rawModules = import.meta.glob<string>('../examples/*.astro', { eager: true, import: 'default', query: '?raw' })
const nameFromPath = (path: string) => path.split('/').pop()?.replace('.astro', '') ?? path

export const exampleComponents = Object.fromEntries(
  Object.entries(liveModules).map(([path, module]) => [nameFromPath(path), module.default])
)

export const exampleSources = Object.fromEntries(
  Object.entries(rawModules).map(([path, source]) => [nameFromPath(path), source])
)

export const getExample = (name: string) => {
  const component = exampleComponents[name]
  const source = exampleSources[name]

  if (!component || source === undefined) {
    throw new Error(`Missing example for component "${name}"`)
  }

  return { component, source }
}
