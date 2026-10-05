const loadComparison = async (scope: ParentNode): Promise<void> => {
  const { initImageComparisonControllers } = await import('./image-comparison.js')

  initImageComparisonControllers(scope)
}

const loadUpload = async (scope: ParentNode): Promise<void> => {
  const { initFileUploadControllers } = await import('./file-upload.js')

  initFileUploadControllers(scope)
}

/** Load independent media behavior only when its public component exists. */
export const initOptionalMediaControllers = async (scope: ParentNode): Promise<void> => {
  const pending: Promise<void>[] = []

  if (scope.querySelector('[data-ui-image-comparison]')) pending.push(loadComparison(scope))

  if (scope.querySelector('[data-ui-file-upload]')) pending.push(loadUpload(scope))

  await Promise.all(pending)
}
