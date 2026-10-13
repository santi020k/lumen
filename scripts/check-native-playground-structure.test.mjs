import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { checkNativePlaygroundStructure } from './check-native-playground-structure.mjs'

const joined = values => values.join('\n')

const validSources = {
  android: joined([
    'Home', 'Examples', 'Components', 'Settings',
    'Release', 'Health', 'Profile',
    'Appearance', 'Accessibility', 'Runtime localization', 'App and platform',
    'Privacy and resources'
  ]),
  appleExamples: joined(['release', 'health', 'profile']),
  appleSettings: joined([
    'appearanceSection', 'accessibilitySection', 'localizationSection', 'appSection',
    'resourcesSection',
    'Appearance', 'Accessibility', 'Runtime localization', 'App and platform',
    'Privacy and resources'
  ]),
  appleShell: joined(['home', 'examples', 'components', 'settings']),
  reactNative: joined([
    'Home', 'Examples', 'Components', 'Settings',
    'Release', 'Health', 'Profile',
    'Appearance', 'Accessibility', 'Runtime localization', 'App and platform',
    'Privacy and resources'
  ]),
  reactNativeModel: './playground-catalog.generated'
}

test('accepts the shared native playground structure', () => {
  assert.deepEqual(checkNativePlaygroundStructure(validSources), {
    destinations: 4,
    examplePatterns: 3,
    settingsSections: 5
  })
})

test('rejects a missing platform example pattern', () => {
  assert.throws(
    () => checkNativePlaygroundStructure({
      ...validSources,
      reactNative: validSources.reactNative.replace('Profile', '')
    }),
    /React Native playground is missing example pattern value "Profile"/u
  )
})

test('rejects a missing settings section', () => {
  assert.throws(
    () => checkNativePlaygroundStructure({
      ...validSources,
      android: validSources.android.replace('Runtime localization', '')
    }),
    /Android playground is missing settings section value "Runtime localization"/u
  )
})

test('rejects settings sections in a different order', () => {
  assert.throws(
    () => checkNativePlaygroundStructure({
      ...validSources,
      android: validSources.android
        .replace('Runtime localization', 'Temporary section')
        .replace('App and platform', 'Runtime localization')
        .replace('Temporary section', 'App and platform')
    }),
    /Android playground is missing settings section value "App and platform"/u
  )
})

test('native playground headers display their adapter release coordinates', async () => {
  const { release } = JSON.parse(await readFile(new URL('../registry/release-manifest.json', import.meta.url), 'utf8'))

  const sources = [
    ['../apps/playground-apple/Sources/LumenApplePlayground/PlaygroundCatalog.generated.swift', release.version],
    ['../apps/playground-react-native/src/playground-catalog.generated.ts', release.npm.packages['@santi020k/lumen-react-native'].version],
    ['../apps/playground-android/app/src/main/kotlin/com/santi020k/lumen/playground/compose/PlaygroundCatalog.generated.kt', release.compose.version]
  ]

  for (const [path, version] of sources) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')

    assert.match(source, new RegExp(`(?:lumenVersion|playgroundLumenVersion) = "${version.replaceAll('.', '\\.')}"`, 'u'), path)
  }
})
