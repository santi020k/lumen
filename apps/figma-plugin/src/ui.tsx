import { isPluginMessage, isRecord } from './model.js'
import { mountPanel } from './mount.js'

mountPanel({
  analyze: () => {
    parent.postMessage({ pluginMessage: { type: 'analyze' } }, '*')
  },
  subscribe: listener => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.source !== parent || !isRecord(event.data)) return

      if (isPluginMessage(event.data.pluginMessage)) listener(event.data.pluginMessage)
    }

    window.addEventListener('message', receive)

    parent.postMessage({ pluginMessage: { type: 'ready' } }, '*')

    return () => {
      window.removeEventListener('message', receive)
    }
  }
})
