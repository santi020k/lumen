import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { build } from 'esbuild'

const plugin = fileURLToPath(new URL('../', import.meta.url))
const repo = join(plugin, '../..')
const mode = process.argv[2]

assert.ok(['react-native', 'compose', 'apple'].includes(mode), 'Choose react-native, compose or apple.')

const temp = await mkdtemp(join(tmpdir(), 'lumen-figma-consumer-'))
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: 'inherit' })

// Only copy tracked app sources. Keep builds, signing configuration and user edits outside the fixture.
const copyApp = async name => {
  const paths = execFileSync('git', ['ls-files', '-z', '--', 'apps/' + name], { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean)

  assert.ok(paths.length)

  for (const path of paths) {
    const dest = join(temp, path)

    await mkdir(dirname(dest), { recursive: true })

    await copyFile(join(repo, path), dest)
  }

  await symlink(join(repo, 'packages'), join(temp, 'packages'), 'dir')

  return join(temp, 'apps', name)
}

try {
  const generator = join(temp, 'generator.mjs')

  await build({
    stdin: { contents: 'export { analyzeSelection } from \'./src/convert\'; export { defaultFor } from \'./src/targets\'; export { nativeFixture, designNode } from \'./src/fixtures\'', resolveDir: plugin },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: generator
  })

  const { analyzeSelection, defaultFor, nativeFixture, designNode } = await import(pathToFileURL(generator).href)

  const code = target => {
    const selection = target === 'compose' ?
      {
        ...nativeFixture, children: [...nativeFixture.children, designNode({ type: 'TEXT', text: '界'.repeat(24_000) })]
      } :
      nativeFixture

    const result = analyzeSelection(selection, defaultFor(target))

    assert.ok(result.code.includes('LumenSelection') && result.code.includes('Save changes'))

    return result.code
  }

  if (mode === 'react-native') {
    const app = join(repo, 'apps/playground-react-native')
    const fixture = await mkdtemp(join(app, 'src/figma-consumer-'))

    try {
      await writeFile(join(fixture, 'LumenSelection.tsx'), code('react-native'))

      await writeFile(join(fixture, 'entry.tsx'), `import { registerRootComponent } from 'expo'
import { LumenProvider } from '@santi020k/lumen-react-native/foundations'
import { LumenSelection } from './LumenSelection'
registerRootComponent(() => <LumenProvider><LumenSelection /></LumenProvider>)
`)

      run('pnpm', ['run', 'typecheck'], app)

      for (const os of ['ios', 'android']) {
        run('pnpm', ['exec', 'expo', 'export:embed', '--platform', os, '--entry-file', join(fixture, 'entry.tsx'), '--dev', 'false', '--max-workers', '2', '--bundle-output', join(temp, os + '.bundle')], app)
      }
    } finally {
      await rm(fixture, { recursive: true, force: true })
    }
  } else if (mode === 'compose') {
    const app = await copyApp('playground-android')
    const path = join(app, 'app/src/main/kotlin/com/santi020k/lumen/playground/compose')
    const packageLine = 'package com.santi020k.lumen.playground.compose\n\n'

    await writeFile(join(path, 'LumenSelection.kt'), packageLine + code('compose'))

    await writeFile(join(path, 'FigmaExportActivity.kt'), packageLine + `import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.santi020k.lumen.LumenTheme

class FigmaExportActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { LumenTheme { LumenSelection() } }
    }
}
`)

    const manifest = join(app, 'app/src/main/AndroidManifest.xml')
    const parts = (await readFile(manifest, 'utf8')).split('android:name=".MainActivity"')

    assert.equal(parts.length, 2, 'Review the Android launcher activity.')

    await writeFile(manifest, parts.join('android:name=".FigmaExportActivity"'))

    run(join(repo, 'packages/compose/gradlew'), ['-p', app, ':app:assembleDebug'], app)
  } else {
    const app = await copyApp('playground-apple')

    await copyFile(join(repo, 'Package.swift'), join(temp, 'Package.swift'))

    const source = join(app, 'Sources/LumenApplePlayground/LumenApplePlaygroundApp.swift')
    const original = await readFile(source, 'utf8')
    const parts = original.split('            PlaygroundRootView()')

    assert.equal(parts.length, 2, 'Review the Apple playground entry point.')

    const appSource = parts.join('            LumenSelection()')

    for (const [target, scheme, destination] of [
      ['swiftui-ios', 'LumenApplePlayground', 'generic/platform=iOS Simulator'],
      ['swiftui-macos', 'LumenMacPlayground', 'platform=macOS']
    ]) {
      await writeFile(source, appSource + '\n' + code(target))

      run('xcodebuild', ['-project', 'LumenApplePlayground.xcodeproj', '-scheme', scheme, '-destination', destination, '-derivedDataPath', join(temp, 'DerivedData'), 'CODE_SIGNING_ALLOWED=NO', 'build'], app)
    }
  }

  console.log('Generated native selection passed in the ' + mode + ' playground.')
} finally {
  await rm(temp, { recursive: true, force: true })
}
