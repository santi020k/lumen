import { createRoot } from 'react-dom/client'

import type { PluginBridge } from './model.js'
import { Panel } from './panel.js'

export const mountPanel = (bridge: PluginBridge, preview = false) => {
  const root = document.getElementById('root')

  if (!root) throw new Error('The Lumen plugin root is missing.')

  createRoot(root).render(<Panel bridge={bridge} preview={preview} />)
}
