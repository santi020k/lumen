const renderers = new WeakMap<HTMLInputElement, () => void>()
const resetRoots = new WeakSet<Node>()

const isQueryRoot = (root: Node): root is Document | DocumentFragment | Element => (
  'querySelectorAll' in root && typeof root.querySelectorAll === 'function'
)

const bindResets = (input: HTMLInputElement): void => {
  const scope = input.getRootNode()

  if (!isQueryRoot(scope) || resetRoots.has(scope)) return

  resetRoots.add(scope)

  scope.addEventListener('reset', event => {
    queueMicrotask(() => {
      if (event.defaultPrevented) return

      for (const current of scope.querySelectorAll<HTMLInputElement>('[data-ui-file-upload-input]')) {
        if (current.isConnected && current.form === event.target) renderers.get(current)?.()
      }
    })
  }, { capture: true })
}

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

    renderers.set(input, renderFiles)

    bindResets(input)

    root.addEventListener('dragover', event => {
      if (input.matches(':disabled')) return

      event.preventDefault()

      root.dataset.state = 'drag-over'
    })

    root.addEventListener('dragleave', event => {
      if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return

      root.dataset.state = input.files?.length ? 'selected' : 'idle'
    })

    root.addEventListener('drop', event => {
      if (input.matches(':disabled')) return

      event.preventDefault()

      if (event.dataTransfer) {
        input.files = event.dataTransfer.files

        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    renderFiles()
  }
}
