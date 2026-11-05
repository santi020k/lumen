export type RenderedAuditBrowser = 'chromium' | 'firefox' | 'webkit'

export interface RenderedAuditViewport {
  width: number
  height: number
}

export interface RenderedAuditOptions {
  url: string
  cwd: string
  browser: RenderedAuditBrowser
  viewports: RenderedAuditViewport[]
  timeoutMs: number
  settleMs: number
  expectationsPath?: string
}

interface ParsedArguments {
  url?: string
  cwd: string
  browser: RenderedAuditBrowser
  viewports: RenderedAuditViewport[]
  timeoutMs: number
  settleMs: number
  expectationsPath?: string
}

export class RenderedAuditConfigurationError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)

    this.name = 'RenderedAuditConfigurationError'
  }
}

export const isLoopbackHttpUrl = (url: URL): boolean => {
  if (!['http:', 'https:'].includes(url.protocol)) return false

  if (url.username || url.password) return false

  if (url.hostname === 'localhost' || url.hostname === '[::1]') return true

  const octets = url.hostname.split('.')

  return octets.length === 4 && octets[0] === '127' &&
    octets.every(octet => Number.isInteger(Number(octet)) && Number(octet) >= 0 && Number(octet) <= 255)
}

export const parseLoopbackUrl = (value: string): URL => {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new RenderedAuditConfigurationError('invalid-url', 'Provide an absolute HTTP or HTTPS loopback URL.')
  }

  if (!isLoopbackHttpUrl(url)) {
    throw new RenderedAuditConfigurationError(
      'non-loopback-url',
      'Use localhost, a 127.x.x.x address, or [::1], without URL credentials.'
    )
  }

  return url
}

const requiredValue = (flag: string, value: string | undefined): string => {
  if (!value || value.startsWith('--')) {
    throw new RenderedAuditConfigurationError('missing-option-value', 'Missing value for ' + flag + '.')
  }

  return value
}

const integerOption = (value: string, flag: string, minimum: number, maximum: number): number => {
  const number = Number(value)

  if (!value.trim() || !Number.isInteger(number) || number < minimum || number > maximum) {
    throw new RenderedAuditConfigurationError('invalid-option-value', flag + ' requires an integer within its documented range.')
  }

  return number
}

const parseViewport = (value: string): RenderedAuditViewport => {
  if (!/^\d{3,4}x\d{3,4}$/.test(value)) {
    throw new RenderedAuditConfigurationError('invalid-viewport', 'Use --viewport WIDTHxHEIGHT, with each dimension from 200 to 4096.')
  }

  const [width, height] = value.split('x')

  if (!width || !height) throw new RenderedAuditConfigurationError('invalid-viewport', 'Missing viewport dimension.')

  return {
    width: integerOption(width, '--viewport width', 200, 4096),
    height: integerOption(height, '--viewport height', 200, 4096)
  }
}

const parseBrowser = (value: string): RenderedAuditBrowser => {
  if (value === 'chromium' || value === 'firefox' || value === 'webkit') return value

  throw new RenderedAuditConfigurationError('invalid-browser', 'Use chromium, firefox, or webkit.')
}

const applyOption = (options: ParsedArguments, flag: string, value: string | undefined): number => {
  switch (flag) {
    case '--json': return 1

    case '--cwd':
      options.cwd = requiredValue(flag, value)

      return 2

    case '--browser':
      options.browser = parseBrowser(requiredValue(flag, value))

      return 2

    case '--viewport':
      options.viewports.push(parseViewport(requiredValue(flag, value)))

      return 2

    case '--timeout-ms':
      options.timeoutMs = integerOption(requiredValue(flag, value), flag, 100, 60000)

      return 2

    case '--settle-ms':
      options.settleMs = integerOption(requiredValue(flag, value), flag, 0, 5000)

      return 2

    case '--asset-expectations':
      options.expectationsPath = requiredValue(flag, value)

      return 2

    default: return 0
  }
}

export const parseRenderedAuditArguments = (args: readonly string[], cwd: string): RenderedAuditOptions => {
  const options: ParsedArguments = {
    cwd,
    browser: 'chromium',
    viewports: [],
    timeoutMs: 10000,
    settleMs: 200
  }

  for (let index = 0; index < args.length;) {
    const value = args[index]

    if (!value) throw new RenderedAuditConfigurationError('invalid-argument', 'Empty audit argument.')

    const consumed = applyOption(options, value, args[index + 1])

    if (consumed) {
      index += consumed

      continue
    }

    if (value.startsWith('--') || options.url) {
      throw new RenderedAuditConfigurationError('unexpected-argument', 'Provide one URL and only documented audit-rendered options.')
    }

    options.url = value

    index += 1
  }

  if (!options.url) throw new RenderedAuditConfigurationError('missing-url', 'Provide the local URL to audit.')

  if (options.viewports.length > 8) throw new RenderedAuditConfigurationError('too-many-viewports', 'Use at most eight viewports.')

  const url = parseLoopbackUrl(options.url)

  return {
    ...options,
    url: url.href,
    viewports: options.viewports.length ?
      options.viewports :
      [{ width: 390, height: 844 }, { width: 1280, height: 900 }]
  }
}
