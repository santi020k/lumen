import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const coreSvgDiagnostic = 'CoreSVG has logged an error'

export const checkSwiftAssets = async ({ platform = process.platform } = {}) => {
  if (platform !== 'darwin') {
    process.stdout.write('Skipped Swift asset compilation outside macOS.\n')

    return
  }

  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'lumen-swift-assets-'))
  const outputDirectory = join(temporaryDirectory, 'output')

  try {
    await mkdir(outputDirectory)

    const catalogPath = resolve(
      'packages/swift/Sources/LumenUI/Resources/LumenIcons.xcassets'
    )

    const { stderr, stdout } = await execFileAsync('xcrun', [
      'actool',
      catalogPath,
      '--compile',
      outputDirectory,
      '--platform',
      'iphonesimulator',
      '--minimum-deployment-target',
      '16.0',
      '--target-device',
      'iphone',
      '--target-device',
      'ipad',
      '--output-format',
      'human-readable-text',
      '--warnings',
      '--errors'
    ], {
      env: { ...process.env, CORESVG_VERBOSE: '1' },
      maxBuffer: 10 * 1_024 * 1_024
    })

    const diagnostics = `${stdout}\n${stderr}`

    if (diagnostics.includes(coreSvgDiagnostic)) {
      throw new Error('Swift asset compilation reported a CoreSVG error.')
    }

    process.stdout.write('Compiled the Swift icon asset catalog without CoreSVG errors.\n')
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  await checkSwiftAssets()
}
