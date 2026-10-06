import { initMediaSelectionControllers } from './media-selection.js'
import { initMediaViewportControllers } from './media-viewport.js'

export const initMediaWorkspaceControllers = (scope: ParentNode): void => {
  initMediaSelectionControllers(scope)

  initMediaViewportControllers(scope)
}
