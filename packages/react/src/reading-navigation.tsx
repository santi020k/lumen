'use client'

import type { ComponentPropsWithoutRef, ReactNode  } from 'react'
import { useEffect, useRef  } from 'react'

import { decodeLumenAnchorFragment, getLumenActiveAnchorIndex, getLumenScrollProgress  } from '@santi020k/lumen-core/anchor'
import { composeClassName } from '@santi020k/lumen-core/tokens'

export interface ScrollProgressProps extends ComponentPropsWithoutRef<'div'> {
  position?: 'bottom' | 'top'
  targetId?: string
}

export const ScrollProgress = ({
  'aria-label': ariaLabel = 'Reading progress',
  className,
  position = 'top',
  targetId,
  ...props
}: ScrollProgressProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    const view = root.ownerDocument.defaultView

    if (!view) return

    let frame = 0

    const update = () => {
      frame = 0

      const scrollingElement =
        root.ownerDocument.scrollingElement ?? root.ownerDocument.documentElement

      const percentage = getLumenScrollProgress(
        scrollingElement, targetId ? root.ownerDocument.getElementById(targetId) : null
      ) * 100

      const bar = root.querySelector<HTMLElement>('.ui-scroll-progress__bar')

      root.setAttribute('aria-valuenow', `${Math.round(percentage)}`)

      if (bar) bar.style.transform = `scaleX(${percentage / 100})`
    }

    const scheduleUpdate = () => {
      if (frame) return

      frame = view.requestAnimationFrame(update)
    }

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleUpdate) : undefined
    const target = targetId ? root.ownerDocument.getElementById(targetId) : null

    observer?.observe(root.ownerDocument.documentElement)

    if (target) observer?.observe(target)

    scheduleUpdate()

    view.addEventListener('resize', scheduleUpdate, { passive: true })

    view.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      observer?.disconnect()

      if (frame) view.cancelAnimationFrame(frame)

      view.removeEventListener('resize', scheduleUpdate)

      view.removeEventListener('scroll', scheduleUpdate)
    }
  }, [targetId])

  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={0}
      className={composeClassName(
        'ui-scroll-progress', position === 'bottom' && 'ui-scroll-progress--bottom', className
      )}
      data-position={position}
      data-ui-scroll-progress
      data-ui-scroll-progress-target={targetId}
      ref={rootRef}
      role="progressbar"
      {...props}
    >
      <span className="ui-scroll-progress__bar" />
    </div>
  )
}

export interface AnchorLink {
  description?: ReactNode
  depth?: 1 | 2 | 3 | 4 | 5 | 6
  href: string
  index?: ReactNode
  label: ReactNode
}

export interface AnchorProps extends ComponentPropsWithoutRef<'nav'> {
  activationOffset?: number
  items?: AnchorLink[]
}

const emptyAnchorLinks: AnchorLink[] = []

const createAnchorRef = () => {
  let cleanup: (() => void) | undefined

  return (root: HTMLElement | null) => {
    cleanup?.()

    cleanup = undefined

    if (!root) return

    const links = [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]

    const targets = links.flatMap(link => {
      const id = decodeLumenAnchorFragment(link.getAttribute('href')?.slice(1) ?? '')
      const target = id ? document.getElementById(id) : null

      return target ? [{ link, target }] : []
    })

    if (!targets.length) return

    const headings = targets.map(({ target }) => target)
    const abortController = new AbortController()
    let frame = 0

    const setActive = (active: HTMLAnchorElement) => {
      for (const link of links) {
        const isActive = link === active

        link.dataset.active = String(isActive)

        if (isActive) {
          link.setAttribute('aria-current', 'location')
        } else {
          link.removeAttribute('aria-current')
        }
      }
    }

    const update = () => {
      frame = 0

      const index = getLumenActiveAnchorIndex(headings, Number(root.dataset.uiAnchorOffset))
      const active = targets[index]?.link

      if (active) setActive(active)
    }

    const requestUpdate = () => {
      if (frame) return

      frame = requestAnimationFrame(update)
    }

    for (const { link } of targets) {
      link.addEventListener('click', () => {
        setActive(link)
      }, {
        signal: abortController.signal
      })
    }

    window.addEventListener('resize', requestUpdate, {
      passive: true,
      signal: abortController.signal
    })

    window.addEventListener('scroll', requestUpdate, {
      passive: true,
      signal: abortController.signal
    })

    update()

    cleanup = () => {
      abortController.abort()

      if (frame) cancelAnimationFrame(frame)
    }
  }
}

export const Anchor = ({
  'aria-label': ariaLabel = 'On this page',
  activationOffset = 96,
  children,
  className,
  items = emptyAnchorLinks,
  ...props
}: AnchorProps) => {
  const anchorRef = createAnchorRef()

  return (
    <nav
      aria-label={ariaLabel}
      className={composeClassName('ui-anchor', className)}
      data-ui-anchor
      data-ui-anchor-offset={Math.max(0, activationOffset)}
      ref={anchorRef}
      {...props}
    >
      {items.length > 0 && (
        <ol>
          {items.map((item, index) => (
            <li key={item.href}>
              <a
                aria-current={index === 0 ? 'location' : undefined}
                data-active={index === 0 ? 'true' : 'false'}
                data-depth={item.depth}
                href={item.href}
              >
                {item.index !== undefined && (
                  <span className="ui-anchor__index">{item.index}</span>
                )}
                <span className="ui-anchor__content">
                  <span className="ui-anchor__label">{item.label}</span>
                  {item.description && (
                    <span className="ui-anchor__description">{item.description}</span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
      {children}
    </nav>
  )
}
