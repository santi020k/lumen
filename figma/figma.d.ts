declare module 'figma' {
  export type FigmaResultSection =
    | { type: 'CODE', code: string }
    | { type: 'INSTANCE', guid: string, symbolId: string }
    | { type: 'ERROR', message: string, errorObject?: unknown }

  export interface FigmaInstanceSwap {
    type: string
    executeTemplate(): { example: FigmaResultSection[] }
  }

  export interface FigmaInstance {
    getString(name: string): string

    getEnum(name: string, map?: Record<string, string>): string

    getBoolean(name: string): boolean

    getInstanceSwap(name: string): FigmaInstanceSwap | undefined
  }

  export interface FigmaStatic {
    selectedInstance: FigmaInstance
    code: (strings: TemplateStringsArray, ...values: unknown[]) => FigmaResultSection[]
  }

  const figma: FigmaStatic

  export default figma
}
