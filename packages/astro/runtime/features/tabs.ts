import { getLumenDirectionalKey, type LumenTabsChangeDetail, scrollLumenTabIntoView } from '@santi020k/lumen-core'

import { refreshScrollCues } from '../controllers/scroll-cue.js'
import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

interface TabsContext {
  root: HTMLElement
  tabs: HTMLElement[]
  panels: HTMLElement[]
  tabList: HTMLElement | null | undefined
  orientation: 'horizontal' | 'vertical'
}

type TabSource = 'initial' | 'local' | 'sync'

let uiTabsCount = 0
let tabLayoutFrame = 0
const synchronizedTabs = new WeakMap<HTMLElement, (value: string) => void>()
const isEnabledTab = (tab: HTMLElement): boolean => !tab.matches(':disabled, [aria-disabled="true"]')

const settleTabLayout = (root: HTMLElement): void => {
  if (!root.querySelector('[data-ui-scroll-cue]')) return

  const viewport = root.ownerDocument.documentElement

  viewport.setAttribute('data-ui-tabs-layout', '')

  cancelAnimationFrame(tabLayoutFrame)

  tabLayoutFrame = requestAnimationFrame(() => {
    tabLayoutFrame = requestAnimationFrame(() => {
      viewport.removeAttribute('data-ui-tabs-layout')

      tabLayoutFrame = 0
    })
  })
}

const associatePanels = ({ root, tabs, panels }: TabsContext): void => {
  root.id ||= `ui-tabs-${++uiTabsCount}`

  for (const [index, tab] of tabs.entries()) {
    const matchingPanel = panels.find(candidate => (
      candidate.dataset.value && candidate.dataset.value === tab.dataset.value
    ))

    const panel = matchingPanel ?? panels[index]
    const value = tab.dataset.value ?? panel?.dataset.value ?? String(index)

    tab.dataset.value = value

    if (!panel) continue

    panel.dataset.value = value

    tab.id ||= `${root.id}-tab-${index + 1}`

    panel.id ||= `${root.id}-panel-${index + 1}`

    tab.setAttribute('aria-controls', panel.id)

    panel.setAttribute('aria-labelledby', tab.id)
  }
}

const readContext = (root: HTMLElement): TabsContext => {
  const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')]
    .filter(tab => tab.closest('[data-ui-tabs]') === root)

  const panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
    .filter(panel => panel.closest('[data-ui-tabs]') === root)

  const tabList = tabs[0]?.closest<HTMLElement>('[role="tablist"]')
  const orientation = tabList?.getAttribute('aria-orientation') === 'vertical' ? 'vertical' : 'horizontal'

  return { root, tabs, panels, tabList, orientation }
}

const selectPanels = ({ tabs, panels }: TabsContext, tab: HTMLElement): void => {
  for (const [index, item] of tabs.entries()) {
    const selected = item === tab
    const panelId = item.getAttribute('aria-controls')
    const panel = panelId ? panels.find(candidate => candidate.id === panelId) : panels[index]

    item.setAttribute('aria-selected', String(selected))

    item.tabIndex = selected ? 0 : -1

    if (panel) panel.hidden = !selected
  }
}

const fitsClippingAncestors = (bounds: DOMRect, tabList: HTMLElement): boolean => {
  for (let ancestor = tabList.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor)
    const box = ancestor.getBoundingClientRect()
    const left = box.left + ancestor.clientLeft
    const top = box.top + ancestor.clientTop

    if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) {
      if (bounds.left < left || bounds.right > left + ancestor.clientWidth) return false
    }

    if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowY)) {
      if (bounds.top < top || bounds.bottom > top + ancestor.clientHeight) return false
    }
  }

  return true
}

const isFullyVisible = (tab: HTMLElement, context: TabsContext): boolean => {
  const { tabList, root } = context

  if (!tabList) return false

  const bounds = tab.getBoundingClientRect()
  const listBounds = tabList.getBoundingClientRect()
  const viewport = root.ownerDocument.documentElement
  const topInset = Number.parseFloat(getComputedStyle(viewport).scrollPaddingTop) || 0

  const fitsList = bounds.top >= Math.max(topInset, listBounds.top) &&
    bounds.bottom <= Math.min(viewport.clientHeight, listBounds.bottom) &&
    bounds.left >= Math.max(0, listBounds.left) &&
    bounds.right <= Math.min(viewport.clientWidth, listBounds.right)

  return fitsList && fitsClippingAncestors(bounds, tabList)
}

const syncSelection = (root: HTMLElement, value: string): void => {
  const { storageKey } = root.dataset

  if (!storageKey) return

  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // Private browsing can deny storage while in-page synchronization remains available.
  }

  for (const otherRoot of root.ownerDocument.querySelectorAll<HTMLElement>('[data-ui-tabs][data-storage-key]')) {
    if (otherRoot === root || otherRoot.dataset.storageKey !== storageKey || otherRoot.dataset.value === value) continue

    synchronizedTabs.get(otherRoot)?.(value)
  }
}

const storedSelection = (root: HTMLElement): string | null => {
  if (!root.dataset.storageKey) return null

  try {
    return localStorage.getItem(root.dataset.storageKey)
  } catch {
    return null
  }
}

const createActivation = (context: TabsContext) => (tab: HTMLElement, source: TabSource = 'local'): void => {
  if (!isEnabledTab(tab)) return

  const { root } = context
  const value = tab.dataset.value ?? ''
  const wasSelected = tab.getAttribute('aria-selected') === 'true'

  if (source === 'local' && !wasSelected) settleTabLayout(root)

  selectPanels(context, tab)

  root.dataset.value = value

  refreshScrollCues(root)

  if (source === 'initial' || wasSelected) return

  if (source === 'local') {
    syncSelection(root, value)

    if (!isFullyVisible(tab, context)) scrollLumenTabIntoView(tab)
  }

  root.dispatchEvent(new CustomEvent<LumenTabsChangeDetail>('ui:tabs-change', {
    bubbles: true,
    detail: { storageKey: root.dataset.storageKey, value }
  }))
}

const bindKeyboard = (context: TabsContext, activate: ReturnType<typeof createActivation>): void => {
  for (const tab of context.tabs) {
    tab.addEventListener('click', () => {
      activate(tab)
    })

    tab.addEventListener('keydown', event => {
      const vertical = context.orientation === 'vertical'
      const keys = vertical ? ['ArrowUp', 'ArrowDown', 'Home', 'End'] : ['ArrowLeft', 'ArrowRight', 'Home', 'End']

      if (!keys.includes(event.key)) return

      event.preventDefault()

      const enabled = context.tabs.filter(isEnabledTab)
      const nextTab = enabled[getLoopedIndex(event.key, Math.max(0, enabled.indexOf(tab)), enabled.length, vertical ? ['ArrowDown'] : [getLumenDirectionalKey(tab, 'ArrowRight')])]

      if (!nextTab) return

      activate(nextTab)

      nextTab.focus({ preventScroll: true })
    })
  }
}

const bindTabs = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const context = readContext(root)

  if (!context.tabs.length || !context.panels.length) return

  root.dataset.uiBound = 'true'

  associatePanels(context)

  const activate = createActivation(context)

  synchronizedTabs.set(root, value => {
    const tab = context.tabs.find(candidate => candidate.dataset.value === value && isEnabledTab(candidate))

    if (tab) activate(tab, 'sync')
  })

  const storedValue = storedSelection(root)
  const enabled = context.tabs.filter(isEnabledTab)

  const selected = enabled.find(tab => tab.dataset.value === storedValue) ??
    enabled.find(tab => tab.dataset.value === root.dataset.initialValue) ??
    enabled.find(tab => tab.getAttribute('aria-selected') === 'true') ?? enabled[0]

  if (selected) activate(selected, 'initial')

  bindKeyboard(context, activate)
}

export const initTabs = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-tabs]')) bindTabs(root)
}

export const clearTabLayout = (): void => {
  cancelAnimationFrame(tabLayoutFrame)

  tabLayoutFrame = 0

  document.documentElement.removeAttribute('data-ui-tabs-layout')
}
