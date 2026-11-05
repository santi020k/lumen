import '@santi020k/lumen-elements/styles/components/anchor.css'
import '@santi020k/lumen-elements/styles/components/collapsible.css'
import '@santi020k/lumen-elements/styles/components/scroll-progress.css'
import '@santi020k/lumen-elements/styles/components/skip-link.css'
import './article-reading.css'

import { defineLumenAnchor } from '@santi020k/lumen-elements/components/anchor'
import { defineLumenCollapsible } from '@santi020k/lumen-elements/components/collapsible'
import { defineLumenScrollProgress } from '@santi020k/lumen-elements/components/scroll-progress'
import { defineLumenSkipLink } from '@santi020k/lumen-elements/components/skip-link'

defineLumenAnchor()

defineLumenCollapsible()

defineLumenScrollProgress()

defineLumenSkipLink()

const decodeFragment = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

class LumenRecipeArticleReading extends HTMLElement {
  private generation = 0

  connectedCallback() {
    this.generation += 1
  }

  disconnectedCallback() {
    this.generation += 1
  }

  constructor() {
    super()

    this.addEventListener('click', event => {
      if (!(event.target instanceof Element) || event.button !== 0 ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

      const link = event.target.closest<HTMLAnchorElement>('.chapter-disclosure a[href^="#"]')

      if (!link) return

      const disclosure = link.closest('details')
      const destinationId = link.hash.slice(1)

      if (!disclosure || !destinationId) return

      const generation = this.generation

      window.setTimeout(() => {
        if (event.defaultPrevented || !this.isConnected || generation !== this.generation) return

        // The recipe generated this encoded fragment from a caller-owned heading ID.
        const heading = document.getElementById(decodeFragment(destinationId))

        if (!heading || !this.contains(heading)) return

        disclosure.open = false

        if (!heading.hasAttribute('tabindex')) {
          heading.setAttribute('tabindex', '-1')

          heading.addEventListener('blur', () => {
            heading.removeAttribute('tabindex')
          }, { once: true })
        }

        heading.focus({ preventScroll: true })

        heading.scrollIntoView({ block: 'start' })
      }, 0)
    })
  }
}

if (!customElements.get('lumen-recipe-elements-article-reading')) {
  customElements.define('lumen-recipe-elements-article-reading', LumenRecipeArticleReading)
}
