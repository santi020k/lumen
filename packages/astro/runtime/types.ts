export interface LumenRuntimeDismissal {
  selector: string
  close: (root: HTMLElement, restoreFocus?: boolean) => void
  isOpen?: (root: HTMLElement) => boolean
}

export interface LumenRuntimeController {
  init: (scope: ParentNode) => void
  cleanup?: () => void
  outside?: LumenRuntimeDismissal
  escape?: LumenRuntimeDismissal
}

export interface LumenRuntimeFeature {
  name: string
  selector: string
  interactionRoot?: string
  load: () => Promise<LumenRuntimeController>
}
