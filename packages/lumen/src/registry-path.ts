import { isAbsolute } from 'node:path'

const windowsAbsolutePath = /^[A-Za-z]:[\\/]/

export const isSafeRegistryFilePath = (path: string): boolean => {
  if (!path || path.includes('\0') || path.includes('\\')) return false

  if (isAbsolute(path) || windowsAbsolutePath.test(path)) return false

  const segments = path.split('/')

  return segments.every(segment => segment !== '' && segment !== '.' && segment !== '..')
}

export const assertSafeRegistryFilePath = (path: string): void => {
  if (!isSafeRegistryFilePath(path)) {
    throw new Error(`Unsafe Lumen registry file path: ${JSON.stringify(path)}`)
  }
}
