import { createSourceFile, type Node, ScriptKind, ScriptTarget, type SourceFile, SyntaxKind } from 'typescript'

const frontmatter = (source: string): { offset: number, source: string } => {
  if (!source.startsWith('---')) return { offset: 0, source: '' }

  const end = source.indexOf('\n---', 3)

  return { offset: 3, source: source.slice(3, end < 0 ? source.length : end) }
}

const parseRoot = (source: string, file: string): SourceFile | undefined => {
  const jsx = ['.tsx', '.jsx'].some(extension => file.endsWith(extension))

  try {
    return createSourceFile(file, source, ScriptTarget.Latest, false, jsx ? ScriptKind.TSX : ScriptKind.TS)
  } catch (error: unknown) {
    if (!(error instanceof RangeError)) throw error

    return undefined
  }
}

/** Use compiler grammar for regex/division; callers fail closed when the parser exceeds its nesting limit. */
export const scriptRegexRanges = (source: string, file: string): ReadonlyMap<number, number> | undefined => {
  if (['.html', '.htm', '.css', '.swift', '.kt', '.kts'].some(extension => file.endsWith(extension))) return new Map()

  const fragment = file.endsWith('.astro') ? frontmatter(source) : { offset: 0, source }
  const root = parseRoot(fragment.source, file)

  if (!root) return undefined

  const pending: Node[] = [root]
  const ranges = new Map<number, number>()

  while (pending.length > 0) {
    const node = pending.pop()

    if (!node) continue

    if (node.kind === SyntaxKind.RegularExpressionLiteral) {
      ranges.set(node.getStart(root) + fragment.offset, node.end + fragment.offset)
    }

    node.forEachChild(child => {
      pending.push(child)
    })
  }

  return ranges
}
