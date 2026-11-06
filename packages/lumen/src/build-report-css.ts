import { isAbsolute } from 'node:path'

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)
const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value)

export const cssModuleKey = (id: string): string => id.replaceAll('\\', '/')

const importDependencies = (messages: unknown): string[] => {
  if (!isUnknownArray(messages)) return []

  return messages.flatMap(message => {
    if (!isRecord(message) || message.type !== 'dependency' || message.plugin !== 'postcss-import' ||
      typeof message.file !== 'string' || !isAbsolute(message.file)) return []

    return [cssModuleKey(message.file)]
  })
}

export interface CssDependencyCollector {
  postcssPlugin: string
  OnceExit: (root: unknown, helpers: unknown) => void
}

/** Observe the existing compiler's import messages without reading or compiling CSS again. */
export const createCssDependencyCollector = (dependencies: Map<string, Set<string>>): CssDependencyCollector => ({
  postcssPlugin: 'lumen-css-provenance',
  OnceExit(_root: unknown, helpers: unknown) {
    if (!isRecord(helpers) || !isRecord(helpers.result)) return

    const result = helpers.result

    if (!isRecord(result.opts) || typeof result.opts.from !== 'string' || !isAbsolute(result.opts.from)) return

    dependencies.set(cssModuleKey(result.opts.from), new Set(importDependencies(result.messages)))
  }
})
