import { cp, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { auditSite } from '@santi020k/og/audit'

/**
 * Preserve the audited Astro tree, while packaging HTML for Pages URLs without trailing slashes.
 * @param {{source: string, destination: string}} options
 */
export const prepareCloudflarePages = async ({ source, destination }) => {
  const sourceRoot = path.resolve(source)
  const destinationRoot = path.resolve(destination)

  if (sourceRoot === destinationRoot || destinationRoot.startsWith(`${sourceRoot}${path.sep}`) || sourceRoot.startsWith(`${destinationRoot}${path.sep}`)) {
    throw new Error('The Cloudflare artifact and Astro output must be separate directories.')
  }

  const { pages } = await auditSite({ directory: sourceRoot })

  const moves = pages.flatMap(page => {
    const relative = path.relative(sourceRoot, page.file).split(path.sep).join('/')

    // Embedded Expo output has its own asset and routing contract.
    if (relative.startsWith('native-previews/')) return []

    const target = relative.endsWith('/index.html') ? `${relative.slice(0, -11)}.html` : relative
    const servingPath = target === 'index.html' ? '/' : `/${target.slice(0, -5)}`

    if (page.indexable && !page.redirect && (!page.canonical || new URL(page.canonical).pathname !== servingPath)) {
      throw new Error(`Canonical URL does not match the Cloudflare serving path for ${relative}: ${servingPath}`)
    }

    return relative === target ? [] : [{ relative, target }]
  })

  await rm(destinationRoot, { force: true, recursive: true })

  await cp(sourceRoot, destinationRoot, { recursive: true })

  for (const { relative, target } of moves) {
    await rename(path.join(destinationRoot, relative), path.join(destinationRoot, target))
  }

  return moves.length
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const docsRoot = fileURLToPath(new URL('../', import.meta.url))

  const moved = await prepareCloudflarePages({
    source: path.resolve(docsRoot, process.env.LUMEN_DOCS_OUT_DIR ?? 'dist'),
    destination: path.join(docsRoot, 'cloudflare/dist')
  })

  console.log(`Prepared Cloudflare Pages artifact: ${moved} HTML routes now serve without trailing slashes.`)
}
