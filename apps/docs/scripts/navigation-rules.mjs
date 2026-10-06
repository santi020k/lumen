import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { JSDOM } from 'jsdom'

/** @typedef {import('@santi020k/og/audit').AuditedPage} AuditedPage */
/** @typedef {import('@santi020k/og/audit').AuditIssue} AuditIssue */
/** @typedef {{page: AuditedPage, ids: Set<string>, links: string[]}} NavigationDocument */

const normalizePath = pathname => pathname.replace(/\/$/u, '') || '/'
const previewSelector = '[data-playground-preview], .framework-example__preview, .template-preview, [data-component-preview]'
/** @param {AuditedPage} page @param {string} code @param {string} message @returns {AuditIssue} */
const issueFor = (page, code, message) => ({ code, file: page.file, message, route: page.route, severity: 'error' })

/** @param {string} directory @param {AuditedPage} page @returns {Promise<NavigationDocument>} */
const readNavigationDocument = async (directory, page) => {
  const document = JSDOM.fragment(await readFile(path.resolve(directory, page.file), 'utf8'))

  return {
    page,
    ids: new Set(Array.from(document.querySelectorAll('[id]'), element => element.id)),
    links: Array.from(document.querySelectorAll('nav a[href], .docs-site-footer a[href]'))
      .filter(anchor => !anchor.closest(previewSelector))
      .map(anchor => anchor.getAttribute('href') ?? '')
  }
}

/** @param {unknown} value @returns {value is {href: string}[]} */
const isSearchIndex = value => Array.isArray(value) && value.every(item => (
  item !== null && typeof item === 'object' && 'href' in item && typeof item.href === 'string'
))

/** @param {string} directory @returns {Promise<string[]>} */
const readSearchLinks = async directory => {
  /** @type {unknown} */
  const index = JSON.parse(await readFile(path.join(directory, 'docs-search.json'), 'utf8'))

  if (!isSearchIndex(index)) throw new Error('Search entries must have string destinations.')

  return index.map(item => item.href)
}

/** @param {string} directory @param {string} pathname @param {Map<string, boolean>} assets */
const isBuiltFile = async (directory, pathname, assets) => {
  if (assets.has(pathname)) return assets.get(pathname)

  const file = path.resolve(directory, `.${decodeURIComponent(pathname)}`)
  const insideBuild = file.startsWith(`${path.resolve(directory)}${path.sep}`)
  const exists = insideBuild && await stat(file).then(info => info.isFile(), () => false)

  assets.set(pathname, exists)

  return exists
}

/** @param {URL} destination @param {string} href @param {AuditedPage} page @param {NavigationDocument} target */
const checkFragment = (destination, href, page, target) => {
  if (!destination.hash || target.page.redirect) return undefined

  let id

  try {
    id = decodeURIComponent(destination.hash.slice(1))
  } catch {
    return issueFor(page, 'invalid-navigation-fragment', `Invalid encoded navigation fragment: ${href}`)
  }

  return target.ids.has(id) ?
    undefined :
    issueFor(page, 'missing-navigation-fragment', `Navigation fragment has no rendered target: ${href}`)
}

/**
 * @param {string} href
 * @param {AuditedPage} page
 * @param {{origin: string, directory: string, documents: Map<string, NavigationDocument>, assets: Map<string, boolean>}} context
 * @returns {Promise<AuditIssue | undefined>}
 */
const checkDestination = async (href, page, context) => {
  let destination

  try {
    destination = new URL(href, page.canonical ?? `${context.origin}${page.route}`)
  } catch {
    return issueFor(page, 'invalid-navigation-url', `Invalid navigation destination: ${href}`)
  }

  if (destination.origin !== context.origin) return undefined

  const target = context.documents.get(normalizePath(destination.pathname))

  if (!target) {
    try {
      return await isBuiltFile(context.directory, destination.pathname, context.assets) ?
        undefined :
        issueFor(page, 'missing-navigation-route', `Navigation destination has no built page or file: ${href}`)
    } catch {
      return issueFor(page, 'invalid-navigation-url', `Invalid encoded navigation path: ${href}`)
    }
  }

  return checkFragment(destination, href, page, target)
}

/**
 * Check rendered navigation and search destinations, including fragments and static downloads.
 * @type {import('@santi020k/og/audit').AuditSiteRule}
 */
export const auditNavigationDestinations = async ({ directory, pages, siteUrl }) => {
  const origin = new URL(siteUrl ?? 'https://lumen.santi020k.com').origin
  /** @type {Map<string, NavigationDocument>} */
  const documents = new Map()

  // Sequential reads yield between DOM parses, releasing temporary parser state on large sites.
  for (const page of pages) {
    documents.set(normalizePath(page.route), await readNavigationDocument(directory, page))
  }

  /** @type {AuditIssue[]} */
  const issues = []
  const sources = Array.from(documents.values())
  /** @type {AuditedPage} */
  const searchPage = { file: 'docs-search.json', route: '/docs-search.json', indexable: true, alternates: [], schemaTypes: [] }

  try {
    sources.push({ page: searchPage, ids: new Set(), links: await readSearchLinks(directory) })
  } catch {
    issues.push(issueFor(searchPage, 'invalid-search-index', 'Build a valid docs-search.json before auditing search destinations.'))
  }

  const context = { origin, directory, documents, assets: new Map() }

  for (const { page, links } of sources) {
    if (!page.indexable || page.redirect) continue

    for (const href of new Set(links)) {
      const issue = await checkDestination(href, page, context)

      if (issue) issues.push(issue)
    }
  }

  return issues
}
