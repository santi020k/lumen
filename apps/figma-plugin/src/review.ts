import designMap from '../../../registry/figma-design-map.json'

import type { DesignNode, Finding } from './model.js'

export const createReview = () => {
  const findings: Finding[] = []
  const seen = new Set<string>()

  const issue = (node: DesignNode, message: string, status: Finding['status'] = 'review') => {
    const key = JSON.stringify([node.id, status, message])

    if (seen.has(key)) return

    seen.add(key)

    if (findings.length >= 10_000) throw new Error('Too many findings to display. Inspect a smaller selection.')

    findings.push({ nodeId: node.id, name: node.name, status, message })
  }

  const text = (node: DesignNode, prop: string, fallback: string) => {
    const value = node.properties[prop]

    if (typeof value === 'string') return value

    issue(node, `Missing ${prop}; review the placeholder text.`)

    return fallback
  }

  const choice = (node: DesignNode, prop: string, values: string[], fallback: string) => {
    const value = node.properties[prop]

    if (typeof value === 'string' && values.includes(value.toLowerCase())) return value.toLowerCase()

    issue(node, `Unsupported or missing ${prop}; using ${fallback}.`)

    return fallback
  }

  const auditTokens = (node: DesignNode) => {
    if (node.unboundPaints > 0) issue(node, `${node.unboundPaints} visible paints have no variable binding. Review semantic colors.`)

    for (const token of node.tokens) {
      if (!Object.hasOwn(designMap.tokenMap, token.name)) issue(node, `Review variable ${token.name}; it has no shared color mapping.`)
    }

    node.children.forEach(auditTokens)
  }

  return { findings, issue, text, choice, auditTokens }
}
