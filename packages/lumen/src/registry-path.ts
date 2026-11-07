const windowsDeviceNames = new Set([
  'aux',
  'con',
  'conin$',
  'conout$',
  'nul',
  'prn',
  ...Array.from('123456789¹²³', digit => 'com' + digit),
  ...Array.from('123456789¹²³', digit => 'lpt' + digit)
])

const isPortableSegment = (segment: string): boolean => {
  if (!segment || segment.endsWith('.') || segment.endsWith(' ')) return false

  const [stem] = segment.split('.', 1)

  return !windowsDeviceNames.has((stem ?? '').trimEnd().toLowerCase())
}

export const isSafeRegistryFilePath = (path: string): boolean => {
  // Reject drive prefixes, alternate data streams, device aliases and control characters on every host.
  if (/[<>:"|?*\\]/u.test(path)) return false

  for (const character of path) {
    if (character.charCodeAt(0) < 32) return false
  }

  return path.split('/').every(isPortableSegment)
}

export const assertSafeRegistryFilePath = (path: string): void => {
  if (!isSafeRegistryFilePath(path)) {
    throw new Error(`Unsafe Lumen registry file path: ${JSON.stringify(path)}`)
  }
}
