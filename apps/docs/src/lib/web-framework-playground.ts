import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { ReactWebFrameworkPreview } from './react-web-framework-preview'

const mountedRoots = new WeakMap<HTMLElement, Root>()

export const mountReactWebPlayground = (container: HTMLElement): void => {
  const existingRoot = mountedRoots.get(container)
  const root = existingRoot ?? createRoot(container)

  if (!existingRoot) mountedRoots.set(container, root)

  root.render(createElement(ReactWebFrameworkPreview))
}
