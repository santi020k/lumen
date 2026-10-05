export const initFileUploadControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-file-upload]')) {
    if (root.dataset.uiBound === 'true') continue

    const input = root.querySelector<HTMLInputElement>('[data-ui-file-upload-input]')

    if (!input) continue

    root.dataset.uiBound = 'true'

    const files = root.querySelector<HTMLElement>('[data-ui-file-upload-files]')

    const renderFiles = (): void => {
      const selectedFiles = input.files ? [...input.files] : []

      root.dataset.state = selectedFiles.length > 0 ? 'selected' : 'idle'

      if (!files) return

      if (selectedFiles.length === 1) {
        files.textContent = selectedFiles[0]?.name ?? ''
      } else {
        files.textContent = selectedFiles.length > 1 ?
          (root.dataset.uiSelectedFilesLabel ?? '{count} files selected').replaceAll('{count}', String(selectedFiles.length)) :
          ''
      }
    }

    input.addEventListener('change', renderFiles)

    input.form?.addEventListener('reset', event => {
      queueMicrotask(() => {
        if (root.isConnected && !event.defaultPrevented) renderFiles()
      })
    })

    root.addEventListener('dragover', event => {
      if (input.disabled) return

      event.preventDefault()

      root.dataset.state = 'drag-over'
    })

    root.addEventListener('dragleave', event => {
      if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return

      root.dataset.state = input.files?.length ? 'selected' : 'idle'
    })

    root.addEventListener('drop', event => {
      if (input.disabled) return

      event.preventDefault()

      if (event.dataTransfer) {
        input.files = event.dataTransfer.files

        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    renderFiles()
  }
}
