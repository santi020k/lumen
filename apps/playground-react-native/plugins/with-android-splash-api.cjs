const { join } = require('node:path')
/** @type {typeof import('expo/config-plugins')} */
const { AndroidConfig, withFinalizedMod, XML } = require('expo/config-plugins')
const splashName = 'Theme.App.SplashScreen'
const behaviorName = 'android:windowSplashScreenBehavior'

/**
 * @param {import('expo/config-plugins').AndroidConfig.Resources.ResourceXML} styles
 * @returns {{ base: import('expo/config-plugins').AndroidConfig.Resources.ResourceXML, api33?: import('expo/config-plugins').AndroidConfig.Resources.ResourceXML }}
 */
const qualifySplashStyles = styles => {
  const splash = styles.resources.style?.find(group => group.$.name === splashName)

  if (!splash) throw new Error('Expected the generated Expo splash style')

  if (!splash.item.some(item => item.$.name === behaviorName)) return { base: styles }

  return {
    api33: { resources: { $: styles.resources.$, style: [structuredClone(splash)] } },
    base: {
      ...styles,
      resources: {
        ...styles.resources,
        style: styles.resources.style?.map(group => group.$.name === splashName ?
          { ...group, item: group.item.filter(item => item.$.name !== behaviorName) } :
          group)
      }
    }
  }
}

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withAndroidSplashApi = config => withFinalizedMod(config, ['android', async mod => {
  const resources = join(mod.modRequest.platformProjectRoot, 'app/src/main/res')
  const basePath = join(resources, 'values/styles.xml')
  const qualifiedPath = join(resources, 'values-v33/lumen-splash-api.xml')
  const styles = await AndroidConfig.Resources.readResourcesXMLAsync({ path: basePath })
  const { base, api33 } = qualifySplashStyles(styles)

  if (api33) {
    await XML.writeXMLAsync({ path: qualifiedPath, xml: api33 })

    await XML.writeXMLAsync({ path: basePath, xml: base })
  }

  return mod
}])

module.exports = Object.assign(withAndroidSplashApi, { qualifySplashStyles })
