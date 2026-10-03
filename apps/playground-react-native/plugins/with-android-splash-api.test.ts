import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type AndroidConfig, compileModsAsync } from 'expo/config-plugins'
import { describe, expect, test } from 'vitest'

import withAndroidSplashApi, { qualifySplashStyles } from './with-android-splash-api.cjs'

describe('Android splash API resources', () => {
  test('retains the complete splash style on API 33 and common items on older Android versions', () => {
    const styles: AndroidConfig.Resources.ResourceXML = {
      resources: {
        $: { 'xmlns:tools': 'http://schemas.android.com/tools' },
        color: [{ $: { name: 'custom_color' }, _: '#123456' }],
        style: [
          { $: { name: 'AppTheme', parent: 'Theme.AppCompat' }, item: [] },
          {
            $: { name: 'Theme.App.SplashScreen', parent: 'Theme.SplashScreen' },
            item: [
              { $: { name: 'postSplashScreenTheme' }, _: '@style/AppTheme' },
              { $: { name: 'windowSplashScreenAnimatedIcon' }, _: '@drawable/custom_splash' },
              { $: { name: 'android:windowSplashScreenBehavior' }, _: 'icon_preferred' }
            ]
          }
        ]
      }
    }
    const before = structuredClone(styles)
    const { base, api33 } = qualifySplashStyles(styles)

    expect(styles).toEqual(before)
    expect(base.resources.$).toEqual(styles.resources.$)
    expect(base.resources.color).toEqual(styles.resources.color)
    expect(base.resources.style?.[0]).toEqual(styles.resources.style?.[0])
    expect(base.resources.style?.[1]?.item.map(item => item.$.name)).toEqual([
      'postSplashScreenTheme', 'windowSplashScreenAnimatedIcon'
    ])
    expect(api33?.resources.style).toEqual([styles.resources.style?.[1]])
    expect(api33?.resources.$).toEqual(styles.resources.$)
    expect(qualifySplashStyles(base)).toEqual({ base })
  })

  test('leaves already-correct styles intact and rejects a missing splash contract', () => {
    const styles: AndroidConfig.Resources.ResourceXML = {
      resources: { style: [{ $: { name: 'Theme.App.SplashScreen', parent: 'Theme.SplashScreen' }, item: [] }] }
    }

    expect(qualifySplashStyles(styles)).toEqual({ base: styles })
    expect(() => qualifySplashStyles({ resources: {} })).toThrow('Expected the generated Expo splash style')
  })

  test('generates qualified native XML and preserves it on repeated plugin application', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'lumen-splash-api-'))
    const basePath = join(projectRoot, 'android/app/src/main/res/values/styles.xml')
    const qualifiedPath = join(projectRoot, 'android/app/src/main/res/values-v33/lumen-splash-api.xml')

    try {
      await mkdir(join(projectRoot, 'android/app/src/main/res/values'), { recursive: true })

      await writeFile(basePath, '<resources><style name="Theme.App.SplashScreen" parent="Theme.SplashScreen"><item name="postSplashScreenTheme">@style/AppTheme</item><item name="android:windowSplashScreenBehavior">icon_preferred</item></style></resources>')

      const apply = () => compileModsAsync(withAndroidSplashApi({ name: 'Splash fixture', slug: 'splash-fixture' }), {
        platforms: ['android'], projectRoot
      })

      await apply()

      const base = await readFile(basePath, 'utf8')
      const qualified = await readFile(qualifiedPath, 'utf8')

      expect(base).not.toContain('android:windowSplashScreenBehavior')
      expect(base).toContain('postSplashScreenTheme')
      expect(qualified).toContain('android:windowSplashScreenBehavior')
      expect(qualified).toContain('postSplashScreenTheme')

      await apply()

      expect(await readFile(basePath, 'utf8')).toBe(base)
      expect(await readFile(qualifiedPath, 'utf8')).toBe(qualified)
    } finally {
      await rm(projectRoot, { force: true, recursive: true })
    }
  })
})
