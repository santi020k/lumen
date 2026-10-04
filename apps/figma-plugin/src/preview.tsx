import { analyzeSelection } from './convert.js'
import { settingsFixture } from './fixtures.js'
import type { PluginMessage } from './model.js'
import { resultMessage } from './model.js'
import { mountPanel } from './mount.js'

let receive: ((message: PluginMessage) => void) | undefined

mountPanel({
  analyze: () => receive?.(resultMessage(analyzeSelection(settingsFixture))),
  subscribe: listener => {
    receive = listener

    listener({ type: 'selection', name: 'Workspace settings' })

    return () => {
      receive = undefined
    }
  }
}, true)
