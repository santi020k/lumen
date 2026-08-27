export const lumenErrorStateKinds = ['error', 'offline'] as const

export type LumenErrorStateKind = typeof lumenErrorStateKinds[number]

export const lumenErrorStateLayouts = ['compact', 'default', 'page'] as const

export type LumenErrorStateLayout = typeof lumenErrorStateLayouts[number]

export const lumenErrorStateAnnouncements = ['assertive', 'off', 'polite'] as const

export type LumenErrorStateAnnouncement = typeof lumenErrorStateAnnouncements[number]

export interface LumenErrorStateContent {
  description?: string
  kind?: LumenErrorStateKind
  reference?: string
  title: string
}
