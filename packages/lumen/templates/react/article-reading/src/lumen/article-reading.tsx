'use client'

import type { MouseEvent, ReactNode } from 'react'

import '@santi020k/lumen-react/styles/components/anchor.css'
import '@santi020k/lumen-react/styles/components/collapsible.css'
import '@santi020k/lumen-react/styles/components/scroll-progress.css'
import '@santi020k/lumen-react/styles/components/skip-link.css'
import './article-reading.css'

import { Anchor } from '@santi020k/lumen-react/components/anchor'
import { Collapsible } from '@santi020k/lumen-react/components/collapsible'
import { ScrollProgress } from '@santi020k/lumen-react/components/scroll-progress'
import { SkipLink } from '@santi020k/lumen-react/components/skip-link'

export interface ArticleReadingProps {
  articleId: string
  chapters: readonly { id: string, label: string, depth?: 2 | 3 | 4 | 5 | 6 }[]
  children: ReactNode
  activationOffset?: number
  labels?: Partial<{ contents: string, progress: string, skip: string }>
}

const hasModifier = (event: MouseEvent<HTMLDetailsElement>) => (
  event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
)

export const ArticleReading = ({
  articleId, chapters, children, activationOffset = 96, labels
}: ArticleReadingProps) => {
  const copy = { contents: 'On this page', progress: 'Reading progress', skip: 'Skip to article text', ...labels }

  const items = chapters.map(({ id, label, depth }) => ({
    href: `#${encodeURIComponent(id)}`, label, depth: depth ?? 2
  }))

  const selectChapter = (event: MouseEvent<HTMLDetailsElement>) => {
    if (event.defaultPrevented || event.button !== 0 || hasModifier(event) ||
      !(event.target instanceof Element)) return

    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]')

    if (!link) return

    const disclosure = event.currentTarget

    window.setTimeout(() => {
      if (event.defaultPrevented || !disclosure.isConnected) return

      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)))

      if (!target || !disclosure.closest('.article-reading')?.contains(target)) return

      disclosure.open = false

      if (!target.hasAttribute('tabindex')) {
        target.tabIndex = -1

        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex')
        }, { once: true })
      }

      target.focus({ preventScroll: true })

      target.scrollIntoView({ block: 'start' })
    }, 0)
  }

  return (
    <div className="article-reading">
      <SkipLink href={`#${encodeURIComponent(articleId)}`}>{copy.skip}</SkipLink>
      {items.length > 0 && (
        <>
          <div className="chapter-rail">
            <Anchor activationOffset={activationOffset} aria-label={copy.contents} items={items} />
          </div>
          <Collapsible className="chapter-disclosure" onClick={selectChapter}>
            <summary>{copy.contents}</summary>
            <Anchor activationOffset={activationOffset} aria-label={copy.contents} items={items} />
          </Collapsible>
        </>
      )}
      <article id={articleId} className="article-text" tabIndex={-1}>
        <ScrollProgress className="article-progress" targetId={articleId} aria-label={copy.progress} />
        {children}
      </article>
    </div>
  )
}
