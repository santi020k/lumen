const swiftKeywords = new Set(['import', 'repeat', 'subscript'])

export const swiftCaseIdentifier = value => {
  const identifier = value.replaceAll(/-([a-z0-9])/g, (_, character) => character.toUpperCase())

  return swiftKeywords.has(identifier) ? `\`${identifier}\`` : identifier
}
