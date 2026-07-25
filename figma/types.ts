export interface FigmaInstanceSwap {
  type: string
  executeTemplate(): { example: string }
}

export interface FigmaInstance {
  getString(name: string): string

  getEnum(name: string, map?: Record<string, string>): string

  getBoolean(name: string): boolean

  getInstanceSwap(name: string): FigmaInstanceSwap | undefined
}

export interface FigmaStatic {
  selectedInstance: FigmaInstance
  code: (strings: TemplateStringsArray, ...values: unknown[]) => string
}
