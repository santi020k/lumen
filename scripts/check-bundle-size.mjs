import { checkBundleSize } from './lib/bundle-size.mjs'

// Catalog sizes are reported as the component surface grows. Focused modules and
// selective consumer bundles retain enforced limits; see CONTRIBUTING.md.
const measurements = [
  { file: 'packages/lumen/styles/world-map.css', gzip: 1_000, packageName: '@santi020k/lumen', raw: 3_000 },
  { file: 'packages/core/dist/world-map-data.generated.js', gzip: 85_000, packageName: '@santi020k/lumen-core', raw: 225_000 },
  { file: 'packages/elements/dist/components/world-map.js', gzip: 3_500, packageName: '@santi020k/lumen-elements', raw: 14_000 },
  { file: 'packages/core/dist/motion.js', gzip: 1_500, packageName: '@santi020k/lumen-core', raw: 4_500 },
  { file: 'packages/lumen/styles/motion.css', gzip: 650, packageName: '@santi020k/lumen', raw: 2_500 },
  { file: 'packages/elements/dist/consumer-behaviors.js', gzip: 1_000, packageName: '@santi020k/lumen-elements', raw: 3_000 },
  { file: 'packages/core/dist/chart-activation.js', gzip: 1_300, packageName: '@santi020k/lumen-core', raw: 4_500 },
  { file: 'packages/react/dist/chart-recipes.js', gzip: 700, packageName: '@santi020k/lumen-react', raw: 1_800 },
  { file: 'packages/elements/dist/chart-activation.js', gzip: 1_500, packageName: '@santi020k/lumen-elements', raw: 5_000 },
  { file: 'packages/core/dist/virtual-window.js', gzip: 2_200, packageName: '@santi020k/lumen-core', raw: 7_000 },
  { file: 'packages/core/dist/virtual-collection.js', gzip: 2_500, packageName: '@santi020k/lumen-core', raw: 9_000 },
  { file: 'packages/react/dist/virtual-list-data.js', gzip: 2_000, packageName: '@santi020k/lumen-react', raw: 6_000 },
  { file: 'packages/core/dist/phone-flags.generated.js', gzip: 205_000, packageName: '@santi020k/lumen-core', raw: 305_000 },

  { file: 'packages/react/dist/combobox.js', gzip: 2_500, packageName: '@santi020k/lumen-react', raw: 10_000 },
  { file: 'packages/core/dist/combobox.js', gzip: 2_400, packageName: '@santi020k/lumen-core', raw: 9_000 },
  { file: 'packages/core/dist/virtual-list.js', gzip: 2_200, packageName: '@santi020k/lumen-core', raw: 7_000 },
  { file: 'packages/react/dist/virtual-list.js', gzip: 1_000, packageName: '@santi020k/lumen-react', raw: 3_000 },
  { file: 'packages/react/dist/rich-text-editor.js', gzip: 2_500, packageName: '@santi020k/lumen-react', raw: 10_000 },
  { file: 'packages/react/dist/data-table.js', gzip: 3_100, packageName: '@santi020k/lumen-react', raw: 11_000 },
  { file: 'packages/react/dist/floating-panel.js', gzip: 2_100, packageName: '@santi020k/lumen-react', raw: 7_000 },
  { file: 'packages/react/dist/dashboard.js', gzip: 800, packageName: '@santi020k/lumen-react', raw: 2_000 },
  { file: 'packages/react/dist/change-summary.js', gzip: 550, packageName: '@santi020k/lumen-react', raw: 1_500 },
  { file: 'packages/elements/dist/chart-html.js', gzip: 4_300, packageName: '@santi020k/lumen-elements', raw: 20_000 },
  { file: 'packages/astro/runtime/controllers/data-table.ts', gzip: 1_450, packageName: '@santi020k/lumen-astro', raw: 4_500 },
  { file: 'packages/astro/runtime/UIPrimitives.astro', kind: 'catalog', packageName: '@santi020k/lumen-astro' },
  { file: 'packages/astro/runtime/controllers/motion.ts', gzip: 1_500, packageName: '@santi020k/lumen-astro', raw: 5_000 },
  { file: 'packages/astro/runtime/controllers/dialogs.ts', gzip: 2_000, packageName: '@santi020k/lumen-astro', raw: 6_000 },
  { file: 'packages/astro/runtime/controllers/document-navigation.ts', gzip: 1_500, packageName: '@santi020k/lumen-astro', raw: 5_000 },
  { file: 'packages/astro/runtime/controllers/file-upload.ts', gzip: 1_100, packageName: '@santi020k/lumen-astro', raw: 3_000 },
  { file: 'packages/astro/runtime/controllers/optional-media.ts', gzip: 500, packageName: '@santi020k/lumen-astro', raw: 1_000 },
  { file: 'packages/astro/runtime/controllers/comparison-reset.ts', gzip: 400, packageName: '@santi020k/lumen-astro', raw: 800 },
  { file: 'packages/astro/runtime/controllers/image-comparison.ts', gzip: 900, packageName: '@santi020k/lumen-astro', raw: 2_000 },
  { file: 'packages/lumen/styles.css', kind: 'catalog', packageName: '@santi020k/lumen' },
  { file: 'packages/react/dist/components.js', kind: 'catalog', packageName: '@santi020k/lumen-react' },
  {
    file: 'packages/react/dist/hooks.js',
    kind: 'catalog',
    packageName: '@santi020k/lumen-react',
    relatedFiles: ['packages/react/dist/toast-context.js', 'packages/react/dist/toast-provider.js', 'packages/react/dist/select-form.js']
  },
  { file: 'packages/elements/dist/define.js', kind: 'catalog', packageName: '@santi020k/lumen-elements' },
  {
    label: 'React ImageComparison consumer',
    contents: "export { ImageComparison } from '@santi020k/lumen-react/components/image-comparison'",
    resolveDirectory: 'packages/react',
    packageName: '@santi020k/lumen-react',
    raw: 5_500,
    gzip: 2_500
  },
  {
    label: 'Elements VirtualList consumer',
    contents: "import { defineLumenVirtualList } from '@santi020k/lumen-elements/components/virtual-list'; defineLumenVirtualList()",
    resolveDirectory: 'packages/elements',
    packageName: '@santi020k/lumen-elements',
    raw: 9_000,
    gzip: 3_500
  }
]

await checkBundleSize(measurements)
