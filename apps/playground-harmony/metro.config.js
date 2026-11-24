const path = require('node:path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { createHarmonyMetroConfig } = require('@react-native-oh/react-native-harmony/metro.config')
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const expoStatusBarShim = path.join(projectRoot, 'src', 'expo-status-bar.tsx')

const harmonyConfig = createHarmonyMetroConfig({
  reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony'
})

const resolveHarmonyRequest = harmonyConfig.resolver.resolveRequest

/**
 * The shared playground and the workspace adapter live outside this app, so Metro watches the
 * workspace and falls back to this app's dependencies. That fallback is how RNOH's redirects from
 * `react-native`, `react-native-svg`, `react-native-safe-area-context`, and the date picker reach
 * the HarmonyOS packages installed here.
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [path.join(projectRoot, 'node_modules')],
    resolveRequest: (context, moduleName, platform) => (
      moduleName === 'expo-status-bar' ?
        { filePath: expoStatusBarShim, type: 'sourceFile' } :
        resolveHarmonyRequest(context, moduleName, platform)
    )
  }
}

module.exports = mergeConfig(getDefaultConfig(projectRoot), harmonyConfig, config)
