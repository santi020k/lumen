export type ComponentName = 'Button' | 'Card' | 'Dialog' | 'Field' | 'Input' | 'Tabs'

export interface DesignNode {
  id: string
  name: string
  type: string
  text: string | null
  component: { key: string, setKey: string | null, name: string } | null
  properties: Record<string, string | boolean>
  layout: { direction: string, gap: number, padding: number[], wrap: boolean } | null
  tokens: { name: string, field: string }[]
  unboundPaints: number
  children: DesignNode[]
}

export interface Finding {
  nodeId: string
  name: string
  status: 'verified' | 'inferred' | 'unsupported' | 'review'
  message: string
}

export interface Analysis {
  schemaVersion: 1
  status: 'beta'
  target: 'astro'
  lumenVersion: string
  selection: DesignNode
  findings: Finding[]
  code: string
  handoff: string
}

export type PluginMessage =
  | { type: 'selection', name: string | null } |
  { type: 'result', result: PluginResult } |
  { type: 'error', message: string }

export type PluginResult = Pick<Analysis, 'code' | 'handoff' | 'findings' | 'lumenVersion'> & { selectionName: string }

export interface PluginBridge {
  analyze: () => void
  subscribe: (listener: (message: PluginMessage) => void) => () => void
}

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const isFinding = (value: unknown): value is Finding => isRecord(value) &&
  typeof value.nodeId === 'string' && typeof value.name === 'string' &&
  typeof value.message === 'string' &&
  ['verified', 'inferred', 'unsupported', 'review'].includes(String(value.status))

const isResult = (value: unknown): value is PluginResult => isRecord(value) &&
  typeof value.code === 'string' && typeof value.handoff === 'string' &&
  typeof value.selectionName === 'string' && typeof value.lumenVersion === 'string' &&
  Array.isArray(value.findings) && value.findings.length <= 10_000 &&
  value.findings.every(isFinding)

export const isPluginMessage = (value: unknown): value is PluginMessage => {
  if (!isRecord(value)) return false

  if (value.type === 'selection') return value.name === null || typeof value.name === 'string'

  if (value.type === 'error') return typeof value.message === 'string'

  return value.type === 'result' && isResult(value.result)
}

export const resultMessage = (analysis: Analysis): PluginMessage => ({ type: 'result',
  result: {
    code: analysis.code,
    handoff: analysis.handoff,
    findings: analysis.findings,
    lumenVersion: analysis.lumenVersion,
    selectionName: analysis.selection.name
  } })
