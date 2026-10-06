const loadComparison = async (scope: ParentNode): Promise<void> => {
  const { initImageComparisonControllers } = await import('./image-comparison.js')

  initImageComparisonControllers(scope)
}

const loadUpload = async (scope: ParentNode): Promise<void> => {
  const { initFileUploadControllers } = await import('./file-upload.js')

  initFileUploadControllers(scope)
}

const loadWorldMap = async (scope: ParentNode): Promise<void> => {
  const { initWorldMapControllers } = await import('./world-map.js')

  initWorldMapControllers(scope)
}

export const initOptionalMediaControllers = async (scope: ParentNode): Promise<void> => {
  const pending: Promise<void>[] = []

  if (scope.querySelector('[data-ui-image-comparison]')) pending.push(loadComparison(scope))

  if (scope.querySelector('[data-ui-file-upload]')) pending.push(loadUpload(scope))

  if (scope.querySelector('[data-ui-world-map]')) pending.push(loadWorldMap(scope))

  await Promise.all(pending)
}
