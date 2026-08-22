export interface LumenLocaleOption {
  label: string
  value: string
}

const lumenDefaultLocale: LumenLocaleOption = { label: 'English', value: 'en' }

export const lumenDefaultLocales: readonly LumenLocaleOption[] = [
  lumenDefaultLocale,
  { label: 'Español', value: 'es' }
]

export const normalizeLumenLocales = (
  locales: readonly LumenLocaleOption[] | undefined
): readonly LumenLocaleOption[] => {
  if (!locales?.length) return lumenDefaultLocales

  const normalized: LumenLocaleOption[] = []
  const values = new Set<string>()

  for (const locale of locales) {
    const label = locale.label.trim()
    const value = locale.value.trim()

    if (!label || !value || values.has(value)) continue

    normalized.push({ label, value })

    values.add(value)
  }

  return normalized.length > 0 ? normalized : lumenDefaultLocales
}

export const getLumenLocalePair = (
  locales: readonly LumenLocaleOption[],
  value: string | undefined
): { current: LumenLocaleOption, next: LumenLocaleOption } => {
  const currentIndex = Math.max(0, locales.findIndex(locale => locale.value === value))
  const current = locales[currentIndex] ?? lumenDefaultLocale
  const next = locales[(currentIndex + 1) % locales.length] ?? current

  return { current, next }
}

export const formatLumenLanguageLabel = (
  template: string,
  current: LumenLocaleOption,
  next: LumenLocaleOption
): string => template
  .replaceAll('{current}', current.label)
  .replaceAll('{next}', next.label)
