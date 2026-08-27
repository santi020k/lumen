export interface LumenTabsChangeDetail {
  storageKey?: string | undefined
  value: string
}

export type LumenTabsChangeEvent = CustomEvent<LumenTabsChangeDetail>

export const scrollLumenTabIntoView = (tab: HTMLElement): void => {
  const scrollIntoView: unknown = Reflect.get(tab, 'scrollIntoView')

  if (typeof scrollIntoView !== 'function') return

  scrollIntoView.call(tab, { block: 'nearest', inline: 'nearest' })
}
