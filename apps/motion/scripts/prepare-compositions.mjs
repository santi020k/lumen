import { cp, readFile, writeFile } from 'node:fs/promises'

import { JSDOM } from 'jsdom'
import postcss from 'postcss'

import { compositionMatchingSelector } from './composition-selectors.mjs'

// Each format is also a self-contained HyperFrames project for check and snapshot.
for (const format of ['portrait', 'square', 'landscape', 'outro/portrait', 'outro/square', 'outro/landscape']) {
  const html = new URL(`../dist/${format}/index.html`, import.meta.url)
  const dom = new JSDOM(await readFile(html, 'utf8'))
  const { document } = dom.window

  // Video has no hover/focus states or browser-clock CSS animation. Its paused GSAP
  // timeline owns motion; preserve Lumen's actual matching component and token rules.
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute('href')

    if (!href?.startsWith('/_astro/')) throw new Error(`Unexpected composition stylesheet: ${href}`)

    const css = postcss.parse(await readFile(new URL(`../dist${href}`, import.meta.url), 'utf8'))

    css.walkAtRules('keyframes', rule => {
      rule.remove()
    })

    css.walkRules(rule => {
      const matching = rule.selectors.filter(selector => {
        const matchingSelector = compositionMatchingSelector(selector)

        try {
          return document.querySelector(matchingSelector) !== null
        } catch (error) {
          throw new Error(`Cannot resolve composition selector: ${selector}`, { cause: error })
        }
      })

      if (matching.length === 0) rule.remove()
      else rule.selectors = matching
    })

    css.walkDecls(declaration => {
      if (declaration.prop.startsWith('animation') || declaration.prop.startsWith('transition')) declaration.remove()

      if (declaration.prop === '--ui-font-mono') declaration.value = 'monospace'
    })

    const style = document.createElement('style')

    style.textContent = css.toString()

    link.replaceWith(style)
  }

  await writeFile(html, dom.serialize())

  dom.window.close()

  for (const assets of ['assets', '_astro']) {
    await cp(new URL(`../dist/${assets}`, import.meta.url), new URL(`../dist/${format}/${assets}`, import.meta.url), { recursive: true })
  }
}
