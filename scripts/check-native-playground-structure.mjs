import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const repositoryRoot = resolve(import.meta.dirname, '..')

const sourcePaths = {
  android: join(
    repositoryRoot,
    'apps/playground-android/app/src/main/kotlin/com/santi020k/lumen/playground/compose/ReferenceApplication.kt'
  ),
  appleExamples: join(
    repositoryRoot,
    'apps/playground-apple/Sources/LumenApplePlayground/PlaygroundExamplesView.swift'
  ),
  appleSettings: join(
    repositoryRoot,
    'apps/playground-apple/Sources/LumenApplePlayground/PlaygroundSettingsView.swift'
  ),
  appleShell: join(
    repositoryRoot,
    'apps/playground-apple/Sources/LumenApplePlayground/PlaygroundShell.swift'
  ),
  reactNative: join(repositoryRoot, 'apps/playground-react-native/src/App.tsx'),
  reactNativeModel: join(repositoryRoot, 'apps/playground-react-native/src/playground-model.ts')
}

const destinationLabels = ['Home', 'Examples', 'Components', 'Settings']
const examplePatternLabels = ['Release', 'Health', 'Profile']

const settingsSectionLabels = [
  'Appearance',
  'Accessibility',
  'Runtime localization',
  'App and platform',
  'Privacy and resources'
]

const assertIncludes = (source, value, platform, contract) => {
  if (!source.includes(value)) {
    throw new Error(`${platform} playground is missing ${contract} value ${JSON.stringify(value)}.`)
  }
}

const assertOrdered = (source, values, platform, contract) => {
  let previousIndex = -1

  for (const value of values) {
    const index = source.indexOf(value, previousIndex + 1)

    if (index < 0) {
      throw new Error(`${platform} playground is missing ${contract} value ${JSON.stringify(value)}.`)
    }

    previousIndex = index
  }
}

export const checkNativePlaygroundStructure = sources => {
  assertOrdered(sources.reactNative, destinationLabels, 'React Native', 'destination')

  assertOrdered(sources.appleShell, destinationLabels.map(label => label.toLowerCase()), 'Apple', 'destination')

  assertOrdered(sources.android, destinationLabels, 'Android', 'destination')

  assertOrdered(sources.reactNative, examplePatternLabels, 'React Native', 'example pattern')

  assertOrdered(sources.appleExamples, examplePatternLabels.map(label => label.toLowerCase()), 'Apple', 'example pattern')

  assertOrdered(sources.android, examplePatternLabels, 'Android', 'example pattern')

  assertOrdered(sources.reactNative, settingsSectionLabels, 'React Native', 'settings section')

  assertOrdered(
    sources.appleSettings,
    ['appearanceSection', 'accessibilitySection', 'localizationSection', 'appSection', 'resourcesSection'],
    'Apple',
    'settings section'
  )

  for (const label of settingsSectionLabels) {
    assertIncludes(sources.appleSettings, label, 'Apple', 'settings section')
  }

  assertOrdered(sources.android, settingsSectionLabels, 'Android', 'settings section')

  assertIncludes(
    sources.reactNativeModel,
    './playground-catalog.generated',
    'React Native',
    'generated catalog import'
  )

  return {
    destinations: destinationLabels.length,
    examplePatterns: examplePatternLabels.length,
    settingsSections: settingsSectionLabels.length
  }
}

const isMainModule = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isMainModule) {
  const sources = Object.fromEntries(
    await Promise.all(
      Object.entries(sourcePaths).map(async ([name, path]) => [name, await readFile(path, 'utf8')])
    )
  )

  const result = checkNativePlaygroundStructure(sources)

  process.stdout.write(
    `Native playground structure matches: ${result.destinations} destinations, `
    + `${result.examplePatterns} example patterns, and ${result.settingsSections} settings sections.\n`
  )
}
