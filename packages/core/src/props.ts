export type LumenClassValue = boolean | null | string | undefined

export type LumenGlass = boolean | 'strong' | 'subtle'

export interface LumenAstroPropsResult {
  classList: LumenClassValue[]
  passthrough: Record<string, unknown>
}

export const resolveLumenAstroProps = (
  rest: Record<string, unknown>,
  classList: LumenClassValue[],
  classProp = '',
  className = ''
): LumenAstroPropsResult => ({
  classList: [...classList, classProp, className],
  passthrough: rest
})

export const resolveLumenGlass = (
  glass: LumenGlass = false
): LumenGlass => glass
