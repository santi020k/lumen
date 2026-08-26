import {
  cp,
  mkdir,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(scriptDirectory, '..')
const sourceRoot = resolve(docsRoot, '..', 'playground-react-native', 'dist')
const targetRoot = resolve(docsRoot, 'public', 'native-previews', 'react-native-live')
const publicPath = '/native-previews/react-native-live'
const sourceIndex = resolve(sourceRoot, 'index.html')
let indexHtml

try {
  indexHtml = await readFile(sourceIndex, 'utf8')
} catch (error) {
  throw new Error(
    'The React Native web playground must be built before the docs. ' +
    'Run `pnpm --filter @santi020k/lumen-playground-react-native run build`.',
    { cause: error }
  )
}

await rm(targetRoot, { force: true, recursive: true })

await mkdir(targetRoot, { recursive: true })

await cp(sourceRoot, targetRoot, { recursive: true })

const embeddedIndex = indexHtml
  .replace(
    '</title>',
    '</title>\n    <meta name="description" content="Interactive Lumen React Native component preview." />\n    <meta name="robots" content="noindex, nofollow" />'
  )
  .replace('<body>', '<body>\n    <h1 hidden>Lumen React Native component preview</h1>')
  .replaceAll('href="/favicon.ico"', `href="${publicPath}/favicon.ico"`)
  .replaceAll('src="/_expo/', `src="${publicPath}/_expo/`)

await writeFile(resolve(targetRoot, 'index.html'), embeddedIndex)
