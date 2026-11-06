import { createRoot } from 'react-dom/client'

import type { PluginBridge } from './model.js'
import { Panel } from './panel.js'

export const mountPanel = (bridge: PluginBridge, preview = false) => {
  const root = document.getElementById('root')

  if (!root) throw new Error('The Lumen plugin root is missing.')

  const documentRoot = document.documentElement
  const system = window.matchMedia('(prefers-color-scheme: dark)')

  const syncTheme = () => {
    const classes = documentRoot.classList
    const dark = classes.contains('figma-dark') || (!classes.contains('figma-light') && system.matches)

    documentRoot.dataset.theme = dark ? 'dark' : 'light'
  }

  syncTheme()

  // Figma updates the root class when the editor theme changes while the plugin is open.
  new MutationObserver(syncTheme).observe(documentRoot, { attributes: true, attributeFilter: ['class'] })

  system.addEventListener('change', syncTheme)

  createRoot(root).render(<Panel bridge={bridge} preview={preview} />)
}
