export interface IconEntry {
  name: string
  svg: string
  terms: string
}

export const iconPageSize = 48

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isBoundedString = (value: unknown, maximum: number): value is string => (
  typeof value === 'string' && value.length > 0 && value.length <= maximum
)

export const parseIconEntries = (value: unknown): IconEntry[] => {
  if (!Array.isArray(value) || value.length > 4000) throw new Error('Invalid icon catalog.')

  const names = new Set<string>()

  return value.map((entry: unknown) => {
    if (!isRecord(entry)) throw new Error('Invalid icon entry.')

    const { name, terms, svg } = entry

    if (!isBoundedString(name, 100) || !isBoundedString(terms, 1000) ||
      !isBoundedString(svg, 100000) || names.has(name)) throw new Error('Invalid icon entry.')

    names.add(name)

    return { name, svg, terms }
  })
}

export const filterIconEntries = (entries: readonly IconEntry[], raw: string): IconEntry[] => {
  const query = raw.trim().toLowerCase()

  return entries.filter(entry => entry.terms.toLowerCase().includes(query))
}

// Only inert SVG geometry from the generated catalog may enter the document.
export const createCatalogSvg = (source: string): SVGSVGElement => {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml')
  const root = parsed.documentElement
  const tags = new Set(['svg', 'g', 'path', 'circle', 'rect', 'polyline', 'polygon', 'line', 'ellipse'])
  const attributes = new Set(['key', 'aria-hidden', 'focusable', 'class', 'xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'fill-rule', 'clip-rule', 'transform'])

  if (root.localName !== 'svg') throw new Error('Invalid icon SVG.')

  for (const element of [root, ...root.querySelectorAll('*')]) {
    if (element.namespaceURI !== 'http://www.w3.org/2000/svg' || !tags.has(element.localName)) {
      throw new Error('Invalid icon SVG element.')
    }

    for (const attribute of element.attributes) {
      if (!attributes.has(attribute.name) || attribute.value.toLowerCase().includes('url(')) {
        throw new Error('Invalid icon SVG attribute.')
      }
    }
  }

  const imported = document.importNode(root, true)

  if (!(imported instanceof SVGSVGElement)) throw new Error('Invalid icon SVG root.')

  return imported
}
