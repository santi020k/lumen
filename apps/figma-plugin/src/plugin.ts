// cspell:words nodechange currentpagechange
import manifest from '../manifest.json'

import { collectSelection } from './collect.js'
import { analyzeSelection } from './convert.js'
import type { PluginMessage } from './model.js'
import { isRecord, resultMessage } from './model.js'
import type { ExportTarget } from './targets.js'
import { readTarget } from './targets.js'

figma.showUI(__html__, { width: 480, height: 720, themeColors: true })

const registration: { id?: string, name: string } = manifest

if (registration.id && registration.id === figma.pluginId) {
  figma.root.setRelaunchData({ inspect: 'Inspect Lumen components and export a web or native starter.' })
}

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

const inspect = async (target: ExportTarget) => {
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

    send(resultMessage(analyzeSelection(snapshot, target)))
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

  const target = readTarget(message.platform, message.version, message.appearance)

  if (!target) {
    send({ type: 'error', message: 'Choose a supported platform, adapter version and appearance.' })

    return
  }

  inspect(target).catch(() => {
    busy = false

    send({ type: 'error', message: 'Could not inspect this selection. Try a smaller frame.' })
  })
}
