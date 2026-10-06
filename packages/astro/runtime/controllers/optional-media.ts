export const initOptionalMediaControllers = async (scope: ParentNode): Promise<void> => {
  const pending: Promise<void>[] = []

  if (scope.querySelector('[data-ui-media-thumbnail], [data-ui-media-viewport]')) pending.push(import('./media-workspace.js').then(module => {
    module.initMediaWorkspaceControllers(scope)

    return undefined
  }))

  if (scope.querySelector('[data-ui-image-comparison]')) pending.push(import('./image-comparison.js').then(module => {
    module.initImageComparisonControllers(scope)

    return undefined
  }))

  if (scope.querySelector('[data-ui-file-upload]')) pending.push(import('./file-upload.js').then(module => {
    module.initFileUploadControllers(scope)

    return undefined
  }))

  if (scope.querySelector('[data-ui-world-map]')) pending.push(import('./world-map.js').then(module => {
    module.initWorldMapControllers(scope)

    return undefined
  }))

  await Promise.all(pending)
}
