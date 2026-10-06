import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const destination = new URL('../public/assets/', import.meta.url)

await mkdir(destination, { recursive: true })

await Promise.all([
  copyFile(require.resolve('gsap/dist/gsap.min.js'), new URL('gsap.min.js', destination)),
  ...['logo.svg', 'fonts/Montserrat-Variable.ttf', 'fonts/OFL.txt'].map(async source => {
    const filename = source.split('/').at(-1)

    if (!filename) throw new Error(`Missing asset filename: ${source}`)

    await copyFile(new URL(`../../docs/public/${source}`, import.meta.url), new URL(filename, destination))
  })
])
