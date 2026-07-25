export interface ChangelogEntry {
  paragraphs: string[]
}

export interface ChangelogSection {
  entries: ChangelogEntry[]
  title: string
}

export interface ChangelogRelease {
  sections: ChangelogSection[]
  version: string
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const renderCode = (value: string): string =>
  escapeHtml(value).replaceAll(/`([^`]+)`/g, '<code>$1</code>')

export const renderChangelogInline = (value: string): string => {
  const linkPattern = /\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g
  let cursor = 0
  let html = ''

  for (const match of value.matchAll(linkPattern)) {
    const index = match.index

    html += renderCode(value.slice(cursor, index))

    html += `<a href="${escapeHtml(match[2] ?? '')}" rel="noopener noreferrer" target="_blank">${renderCode(match[1] ?? '')}</a>`

    cursor = index + match[0].length
  }

  return html + renderCode(value.slice(cursor))
}

// The parser intentionally keeps the small Changesets heading-and-list state machine together.
// eslint-disable-next-line complexity
export const parseChangelog = (source: string): ChangelogRelease[] => {
  const releases: ChangelogRelease[] = []
  let release: ChangelogRelease | undefined
  let section: ChangelogSection | undefined
  let entryLines: string[] = []

  const flushEntry = () => {
    if (!section || entryLines.length === 0) return

    const content = entryLines
      .map(line => line.trim())
      .join('\n')
      .trim()

    entryLines = []

    if (!content || content.startsWith('Updated dependencies')) return

    const paragraphs = content
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.replaceAll(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean)
      .map(renderChangelogInline)

    section.entries.push({ paragraphs })
  }

  for (const line of source.split(/\r?\n/)) {
    const versionMatch = /^## (.+)$/.exec(line)
    const sectionMatch = /^### (.+)$/.exec(line)
    const entryMatch = /^- (.+)$/.exec(line)

    if (versionMatch) {
      flushEntry()

      release = { sections: [], version: versionMatch[1] ?? '' }

      releases.push(release)

      section = undefined

      continue
    }

    if (sectionMatch && release) {
      flushEntry()

      section = { entries: [], title: sectionMatch[1] ?? '' }

      release.sections.push(section)

      continue
    }

    if (entryMatch && section) {
      flushEntry()

      entryLines = [entryMatch[1] ?? '']

      continue
    }

    if (entryLines.length > 0) entryLines.push(line)
  }

  flushEntry()

  return releases
    .map(item => ({
      ...item,
      sections: item.sections.filter(itemSection => itemSection.entries.length > 0)
    }))
    .filter(item => item.sections.length > 0)
}
