import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

const liveModules = import.meta.glob<{ default: AstroComponentFactory }>('../examples/*.astro', { eager: true })
const rawModules = import.meta.glob<string>('../examples/*.astro', { eager: true, import: 'default', query: '?raw' })
const glassLiveModules = import.meta.glob<{ default: AstroComponentFactory }>('../examples/glass/*.astro', {
  eager: true,
})
const glassRawModules = import.meta.glob<string>('../examples/glass/*.astro', {
  eager: true,
  import: 'default',
  query: '?raw',
})
const nameFromPath = (path: string) => path.split('/').pop()?.replace('.astro', '') ?? path
const toEntries = <Value>(modules: Record<string, Value>) =>
  Object.fromEntries(Object.entries(modules).map(([path, module]) => [nameFromPath(path), module]))

const exampleComponents = toEntries(
  Object.fromEntries(Object.entries(liveModules).map(([path, module]) => [path, module.default])),
)

const exampleSources = toEntries(rawModules)

const glassExampleComponents = toEntries(
  Object.fromEntries(Object.entries(glassLiveModules).map(([path, module]) => [path, module.default])),
)

const glassExampleSources = toEntries(glassRawModules)

export const getExample = (name: string) => {
  const component = exampleComponents[name]
  const source = exampleSources[name]

  if (!component || source === undefined) {
    throw new Error(`Missing example for component "${name}"`)
  }

  return { component, source }
}

export const getGlassExample = (name: string) => {
  const component = glassExampleComponents[name]
  const source = glassExampleSources[name]

  if (!component || source === undefined) {
    throw new Error(`Missing glass example for component "${name}"`)
  }

  return { component, source }
}
