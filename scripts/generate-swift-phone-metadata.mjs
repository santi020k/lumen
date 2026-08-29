import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

const outputPath = resolve(
  repositoryRoot,
  'packages/swift/Sources/LumenUI/Resources/LumenPhoneMetadata.json'
)

const check = process.argv.includes('--check')

const requireFromCore = createRequire(
  resolve(repositoryRoot, 'packages/core/package.json')
)

const metadataPath = requireFromCore.resolve('libphonenumber-js/metadata.max.json')
const metadataPackagePath = requireFromCore.resolve('libphonenumber-js/package.json')
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
const metadataPackage = JSON.parse(await readFile(metadataPackagePath, 'utf8'))

const defaultCountryForCallingCode = Object.fromEntries(
  Object.entries(metadata.country_calling_codes).map(([callingCode, regions]) => [
    callingCode,
    regions[0]
  ])
)

const inheritedValue = (countryData, callingCode, index) => {
  if (countryData[index]) return countryData[index]

  const defaultRegion = defaultCountryForCallingCode[callingCode]

  return metadata.countries[defaultRegion]?.[index] || null
}

const countries = Object.entries(metadata.countries).map(([regionCode, countryData]) => {
  const callingCode = countryData[0]
  const formats = inheritedValue(countryData, callingCode, 4) || []
  const sharedNationalPrefixFormattingRule = inheritedValue(countryData, callingCode, 6)
  const types = countryData[11] || []

  return {
    callingCode,
    formats: formats.map(format => ({
      leadingDigits: format[2] || [],
      nationalPrefixFormattingRule: format[3] || sharedNationalPrefixFormattingRule || null,
      pattern: format[0],
      template: format[1]
    })),
    leadingDigits: countryData[10] || null,
    nationalPattern: countryData[2],
    nationalPrefixForParsing: countryData[7] || countryData[5] || null,
    nationalPrefixTransformRule: countryData[8] || null,
    possibleLengths: countryData[3],
    regionCode,
    typePatterns: types
      .filter(type => Array.isArray(type) && type[0])
      .map(type => type[0])
  }
})

const document = `${JSON.stringify({
  callingCodeRegions: metadata.country_calling_codes,
  countries,
  metadataVersion: metadata.version,
  sourceVersion: metadataPackage.version
})}\n`

if (check) {
  const current = await readFile(outputPath, 'utf8').catch(() => '')

  if (current !== document) {
    throw new Error('Swift phone metadata is stale. Run pnpm run generate:swift-phone-metadata.')
  }
} else {
  await writeFile(outputPath, document)
}
