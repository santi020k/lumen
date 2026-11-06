import { isPluginMessage, isRecord } from './model.js'
import { mountPanel } from './mount.js'

mountPanel({
  analyze: target => {
    parent.postMessage({ pluginMessage: { type: 'analyze', ...target } }, '*')
  },
  subscribe: listener => {
    const receive = (event: MessageEvent<unknown>) => {
      // Desktop sends from the editor through a nested sandbox iframe.
      const fromEditor = event.source === window.top && event.origin === 'https://www.figma.com'

      if ((event.source !== parent && !fromEditor) || !isRecord(event.data)) return

      if (isPluginMessage(event.data.pluginMessage)) listener(event.data.pluginMessage)
    }

    window.addEventListener('message', receive)

    parent.postMessage({ pluginMessage: { type: 'ready' } }, '*')

    return () => {
      window.removeEventListener('message', receive)
    }
  }
})
