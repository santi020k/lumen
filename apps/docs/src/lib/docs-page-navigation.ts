export interface DocsPageNavigationItem {
  id: string
  label: string
}

export interface DocsPageSection extends DocsPageNavigationItem {
  target: HTMLElement
}

const excludedSections = [
  '[data-docs-toc-ignore]',
  '[data-docs-page-navigation]',
  '[data-playground-preview]',
  '[data-chart-demo]',
  '.docs-preview',
  '.component-doc-preview',
  '.framework-example',
  '.ui-chart',
  'figure',
  'nav',
  'aside',
  'dialog',
  '[role="dialog"]',
  '[role="tabpanel"]',
  '[data-ui-collapsible]',
  '[hidden]',
  '[aria-hidden="true"]'
].join(',')

export const normalizePageNavigation = (
  items: readonly DocsPageNavigationItem[]
): DocsPageNavigationItem[] => {
  const ids = new Set<string>()

  return items.flatMap(item => {
    const id = item.id.trim()
    const label = item.label.trim().replaceAll(/\s+/g, ' ')

    if (!id || !label || ids.has(id)) return []

    ids.add(id)

    return [{ id, label }]
  })
}

const ensureSectionId = (target: HTMLElement, label: string): string => {
  const document = target.ownerDocument

  if (target.id && document.getElementById(target.id) === target) return target.id

  const slug = label.toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
    .replaceAll(/^-|-$/g, '')

  const base = `section-${slug || 'guide'}`
  let id = base
  let suffix = 2

  while (document.getElementById(id)) {
    id = `${base}-${suffix}`

    suffix += 1
  }

  target.id = id

  return id
}

/** Only documentation headings belong in the page outline, never live example content. */
export const collectDocsPageSections = (root: HTMLElement): DocsPageSection[] => {
  const sections: DocsPageSection[] = []

  for (const heading of root.querySelectorAll<HTMLHeadingElement>('h2')) {
    if (heading.closest(excludedSections)) continue

    const label = (heading.dataset.docsTocLabel ?? heading.textContent)
      .trim()
      .replaceAll(/\s+/g, ' ')

    if (!label) continue

    // Reuse a section's public anchor when its first heading is this one.
    const section = heading.closest<HTMLElement>('section[id]')
    const target = section?.querySelector('h2') === heading ? section : heading
    const id = ensureSectionId(target, label)

    if (sections.some(item => item.id === id)) continue

    sections.push({ id, label, target })
  }

  return sections
}

export const getActivePageSection = (
  sections: readonly { id: string, top: number }[],
  offset: number
): string | undefined => {
  let active = sections[0]?.id

  for (const section of sections) {
    if (section.top > offset) break

    active = section.id
  }

  return active
}
