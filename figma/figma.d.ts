declare module 'figma' {
  export interface FigmaInstanceSwap {
    type: string;
    executeTemplate(): { example: string };
  }

  export interface FigmaInstance {
    getString(name: string): string;

    getEnum(name: string, map: Record<string, string>): string;

    getBoolean(name: string): boolean;

    getInstanceSwap(name: string): FigmaInstanceSwap | undefined;
  }

  const figma: {
    selectedInstance: FigmaInstance;
    code(strings: TemplateStringsArray, ...values: unknown[]): unknown;
  };

  export default figma;
}
