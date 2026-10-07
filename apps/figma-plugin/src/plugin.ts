// cspell:words nodechange currentpagechange
import { collectSelection } from './collect.js'
import { analyzeSelection } from './convert.js'
import type { PluginMessage } from './model.js'
import { isRecord, resultMessage } from './model.js'

figma.showUI(__html__, { width: 480, height: 720, themeColors: true })

figma.root.setRelaunchData({ inspect: 'Inspect Lumen components and prepare an Astro AI handoff.' })

const send = (message: PluginMessage) => {
  figma.ui.postMessage(message)
}

let revision = 0
let busy = false

const selectionChanged = () => {
  revision += 1

  const selection = figma.currentPage.selection

  send({ type: 'selection', name: selection.length === 1 ? selection[0]?.name ?? null : null })
}

figma.on('selectionchange', selectionChanged)

let observedPage = figma.currentPage

observedPage.on('nodechange', selectionChanged)

figma.on('currentpagechange', () => {
  observedPage.off('nodechange', selectionChanged)

  observedPage = figma.currentPage

  observedPage.on('nodechange', selectionChanged)

  selectionChanged()
})

const inspect = async () => {
  const selection = figma.currentPage.selection
  const node = selection[0]

  if (selection.length !== 1 || !node) {
    send({ type: 'error', message: 'Select one frame or component to inspect.' })

    return
  }

  busy = true

  const startedAt = revision

  try {
    const snapshot = await collectSelection(node)

    if (revision !== startedAt || node.removed) {
      send({ type: 'error', message: 'The design changed during analysis. Inspect the selection again.' })

      return
    }

    send(resultMessage(analyzeSelection(snapshot)))
  } catch (error) {
    send({ type: 'error', message: error instanceof Error ? error.message : 'Could not inspect this selection. Try a smaller frame.' })
  } finally {
    busy = false
  }
}

figma.ui.onmessage = (message: unknown) => {
  if (!isRecord(message)) return

  if (message.type === 'ready') {
    selectionChanged()

    return
  }

  if (message.type !== 'analyze' || busy) return

  inspect().catch(() => {
    busy = false

    send({ type: 'error', message: 'Could not inspect this selection. Try a smaller frame.' })
  })
}
