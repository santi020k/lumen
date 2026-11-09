import {
  cp,
  mkdir,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getNativeComponentsForPlatform } from '../src/data/native-components.ts'

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

const docsByComponent = JSON.stringify(Object.fromEntries(
  getNativeComponentsForPlatform('react-native').map(component => [
    component.name.toLowerCase(),
    `/docs/react-native/components/${component.slug}`
  ])
)).replaceAll('<', '\\u003c')

const embeddedIndex = indexHtml
  .replace(
    '</title>',
    '</title>\n    <meta name="description" content="Interactive Lumen React Native component preview." />\n    <meta name="robots" content="noindex, nofollow" />'
  )
  .replace('<body>', `<body>
    <h1 hidden>Lumen React Native component preview</h1>
    <aside id="preview-docs-banner" aria-label="React Native preview documentation" hidden>
      <a href="/docs/react-native/playground">Read the React Native preview documentation</a>
    </aside>
    <style>
      body[data-standalone-preview] { display: flex; flex-direction: column; }
      body[data-standalone-preview] #root { height: auto; min-height: 0; }
      #preview-docs-banner { padding: 0.75rem 1rem; font: 1rem/1.5 system-ui; background: Canvas; color: CanvasText; }
      #preview-docs-banner a { display: inline-block; padding-block: 0.25rem; }
    </style>
    <script>
      if (window.self === window.top) {
        const docsByComponent = new Map(Object.entries(${docsByComponent}));
        const component = new URLSearchParams(window.location.search).get('component')?.trim().toLowerCase();
        const banner = document.getElementById('preview-docs-banner');
        const docsLink = banner.querySelector('a');
        const componentDocs = docsByComponent.get(component);
        if (componentDocs) docsLink.href = componentDocs;
        document.body.dataset.standalonePreview = '';
        banner.hidden = false;
      }
    </script>`)
  .replaceAll('href="/favicon.ico"', `href="${publicPath}/favicon.ico"`)
  .replaceAll('src="/_expo/', `src="${publicPath}/_expo/`)

await writeFile(resolve(targetRoot, 'index.html'), embeddedIndex)
