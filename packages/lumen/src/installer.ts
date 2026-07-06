import {
  access,
  mkdir,
  readFile,
  writeFile
} from 'node:fs/promises'
import {
  dirname,
  join
} from 'node:path'

import {
  getLumenRegistryItem,
  type LumenRegistry,
  type LumenRegistryEntry,
  type LumenRegistryFile,
} from './registry.js'

interface LumenRecipeFile {
  path: string
  source: string
}

export interface LumenAddOptions {
  conflict?: 'error' | 'merge' | 'overwrite' | 'skip'
  cwd?: string
  dryRun?: boolean
  force?: boolean
  merge?: (conflict: LumenMergeConflict) => string
  registry?: LumenRegistry
  target?: LumenAddTarget
}

export type LumenAddTarget = 'astro' | 'elements' | 'react'

export interface LumenMergeConflict {
  existing: string
  incoming: string
  path: string
}

export interface LumenAddResult {
  added: string[]
  dryRun: boolean
  files: string[]
  item: LumenRegistryEntry
  merged: string[]
  skipped: string[]
}

const recipeFiles: Record<string, LumenRecipeFile[]> = {
  'advanced-fields': [
    {
      path: 'src/lumen/advanced-fields.astro',
      source: `---
import {
  Autocomplete,
  ColorPicker,
  DatePicker,
  DateRangePicker,
  NumberField,
  SearchField,
  TagGroup,
  TimeField
} from '@santi020k/lumen-astro'
---

<form class="lumen-recipe lumen-recipe--advanced-fields">
  <SearchField name="q" placeholder="Search records" />
  <Autocomplete list="assignees" placeholder="Assign to..." />
  <datalist id="assignees">
    <option value="Design" />
    <option value="Engineering" />
    <option value="Operations" />
  </datalist>
  <NumberField aria-label="Seats" min="1" value="3" />
  <TimeField aria-label="Start time" value="09:30" />
  <DateRangePicker>
    <DatePicker aria-label="Start date" />
    <DatePicker aria-label="End date" />
  </DateRangePicker>
  <ColorPicker aria-label="Brand color" value="#2563eb" />
  <TagGroup aria-label="Selected filters">
    <span data-ui-tag role="listitem">Active <button data-ui-tag-remove type="button">Remove</button></span>
  </TagGroup>
</form>
`
    }
  ],
  scheduler: [
    {
      path: 'src/lumen/scheduler.astro',
      source: `---
import {
  Agenda,
  Calendar,
  DatePicker,
  Schedule
} from '@santi020k/lumen-astro'
---

<section class="lumen-recipe lumen-recipe--scheduler">
  <Calendar aria-label="Choose schedule date" />
  <DatePicker aria-label="Jump to date" />
  <Schedule>
    <header><h2>Launch week</h2></header>
    <div data-ui-schedule-grid>
      <section data-ui-schedule-slot="monday">
        <article id="schedule-planning" data-ui-draggable="true" data-ui-schedule-event>Planning</article>
      </section>
      <section data-ui-schedule-slot="friday">
        <article id="schedule-ship" data-ui-draggable="true" data-ui-schedule-event>Ship</article>
      </section>
    </div>
  </Schedule>
  <Agenda>
    <ol>
      <li><strong>Design review</strong><span>10:00</span></li>
      <li><strong>Release notes</strong><span>14:30</span></li>
    </ol>
  </Agenda>
</section>
`
    }
  ],
  'data-collections': [
    {
      path: 'src/lumen/data-collections.astro',
      source: `---
import {
  Command,
  DataTable,
  Pagination,
  Tree,
  TreeGrid,
  VirtualList
} from '@santi020k/lumen-astro'
---

<section class="lumen-recipe lumen-recipe--data-collections">
  <Command>
    <input type="search" placeholder="Filter records" />
    <button data-ui-command-item type="button">Open docs</button>
  </Command>
  <DataTable>
    <table>
      <thead><tr><th>Name</th><th>Status</th></tr></thead>
      <tbody><tr><td>Docs</td><td>Ready</td></tr></tbody>
    </table>
  </DataTable>
  <Tree aria-label="Files">
    <div role="treeitem" aria-expanded="true">src</div>
    <div role="treeitem">index.ts</div>
  </Tree>
  <TreeGrid aria-label="Project status">
    <div role="row"><span role="gridcell">Docs</span><span role="gridcell">Ready</span></div>
  </TreeGrid>
  <VirtualList data-ui-item-size="44" style="--ui-list-height: 12rem">
    <div>Row 1</div>
    <div>Row 2</div>
    <div>Row 3</div>
  </VirtualList>
  <Pagination><a href="?page=1">Previous</a><a href="?page=2">Next</a></Pagination>
</section>
`
    }
  ],
  'theme-builder': [
    {
      path: 'src/lumen/theme-builder.astro',
      source: `---
import {
  Button,
  Card,
  ColorPicker,
  Input,
  ThemeBuilder
} from '@santi020k/lumen-astro'
---

<ThemeBuilder class="lumen-recipe lumen-recipe--theme-builder" data-ui-theme-target="#lumen-theme-preview">
  <header><h2>Brand theme</h2><Button data-ui-theme-export type="button">Copy CSS</Button></header>
  <Card id="lumen-theme-preview" style="display: flex; gap: 0.5rem;">
    <span data-ui-swatch style="--ui-swatch:hsl(var(--brand))"></span>
    <span data-ui-swatch style="--ui-swatch:hsl(var(--accent))"></span>
  </Card>
  <Card>
    <Button aria-pressed="true" data-ui-theme-mode="generated" type="button" variant="secondary">Generated</Button>
    <Button aria-pressed="false" data-ui-theme-mode="manual" type="button" variant="outline">Manual</Button>
    <Input aria-label="Brand hue" data-ui-theme-brand-hue max="359" min="0" type="range" value="264" />
    <ColorPicker aria-label="Manual brand color" data-ui-theme-primary-color value="#6f20f0" />
    <Input aria-label="Manual brand hex" data-ui-theme-primary-hex value="#6f20f0" />
  </Card>
  <textarea data-ui-theme-output aria-label="Theme CSS"></textarea>
</ThemeBuilder>
`
    }
  ],
  'rich-text-editor': [
    {
      path: 'src/lumen/rich-text-editor.astro',
      source: `---
import {
  Button,
  ButtonGroup,
  RichTextEditor,
  Textarea,
  ToggleGroup
} from '@santi020k/lumen-astro'
---

<RichTextEditor class="lumen-recipe lumen-recipe--rich-text-editor">
  <div role="toolbar" aria-label="Editor toolbar">
    <ButtonGroup>
      <Button data-ui-editor-command="bold" type="button">Bold</Button>
      <Button data-ui-editor-command="italic" type="button">Italic</Button>
    </ButtonGroup>
    <ToggleGroup><button data-ui-editor-command="insertUnorderedList" type="button">List</button></ToggleGroup>
  </div>
  <div contenteditable="true">Draft release notes...</div>
  <Textarea name="fallback" placeholder="Plain text fallback" />
</RichTextEditor>
`
    }
  ],
  'ai-docs': [
    {
      path: 'llms.txt',
      source: `# Lumen UI

Use @santi020k/lumen-astro for Astro apps, import @santi020k/lumen-astro/styles.css once, and mount UIPrimitives once in the root layout for interactive primitives. Do not place UIPrimitives next to every component instance.
`
    }
  ]
}

const elementsRecipeHeader = `<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>`

const reactRecipeFiles: Record<string, LumenRecipeFile[]> = {
  'advanced-fields': [{
    path: 'src/lumen/advanced-fields.tsx',
    source: `import {
  Autocomplete,
  ColorPicker,
  DatePicker,
  DateRangePicker,
  NumberField,
  SearchField,
  TagGroup,
  TimeField
} from '@santi020k/lumen-react'

export const AdvancedFieldsRecipe = () => (
  <form className="lumen-recipe lumen-recipe--advanced-fields">
    <SearchField name="q" placeholder="Search records" />
    <Autocomplete list="assignees" placeholder="Assign to..." />
    <datalist id="assignees">
      <option value="Design" />
      <option value="Engineering" />
      <option value="Operations" />
    </datalist>
    <NumberField aria-label="Seats" min="1" defaultValue="3" />
    <TimeField aria-label="Start time" defaultValue="09:30" />
    <DateRangePicker>
      <DatePicker aria-label="Start date" />
      <DatePicker aria-label="End date" />
    </DateRangePicker>
    <ColorPicker aria-label="Brand color" defaultValue="#2563eb" />
    <TagGroup aria-label="Selected filters">
      <span data-ui-tag role="listitem">Active <button data-ui-tag-remove type="button">Remove</button></span>
    </TagGroup>
  </form>
)
`
  }],
  'data-collections': [{
    path: 'src/lumen/data-collections.tsx',
    source: `import type { CSSProperties } from 'react'

import {
  Command,
  DataTable,
  Pagination,
  Tree,
  TreeGrid,
  VirtualList
} from '@santi020k/lumen-react'

const virtualListStyle = { '--ui-list-height': '12rem' } as CSSProperties

export const DataCollectionsRecipe = () => (
  <section className="lumen-recipe lumen-recipe--data-collections">
    <Command>
      <input type="search" placeholder="Filter records" />
      <button data-ui-command-item type="button">Open docs</button>
    </Command>
    <DataTable>
      <table>
        <thead><tr><th>Name</th><th>Status</th></tr></thead>
        <tbody><tr><td>Docs</td><td>Ready</td></tr></tbody>
      </table>
    </DataTable>
    <Tree aria-label="Files">
      <div role="treeitem" aria-expanded="true">src</div>
      <div role="treeitem">index.ts</div>
    </Tree>
    <TreeGrid aria-label="Project status">
      <div role="row"><span role="gridcell">Docs</span><span role="gridcell">Ready</span></div>
    </TreeGrid>
    <VirtualList data-ui-item-size="44" style={virtualListStyle}>
      <div>Row 1</div>
      <div>Row 2</div>
      <div>Row 3</div>
    </VirtualList>
    <Pagination><a href="?page=1">Previous</a><a href="?page=2">Next</a></Pagination>
  </section>
)
`
  }],
  'rich-text-editor': [{
    path: 'src/lumen/rich-text-editor.tsx',
    source: `import {
  Button,
  ButtonGroup,
  RichTextEditor,
  Textarea,
  ToggleGroup
} from '@santi020k/lumen-react'

export const RichTextEditorRecipe = () => (
  <RichTextEditor className="lumen-recipe lumen-recipe--rich-text-editor">
    <div role="toolbar" aria-label="Editor toolbar">
      <ButtonGroup>
        <Button data-ui-editor-command="bold" type="button">Bold</Button>
        <Button data-ui-editor-command="italic" type="button">Italic</Button>
      </ButtonGroup>
      <ToggleGroup><button data-ui-editor-command="insertUnorderedList" type="button">List</button></ToggleGroup>
    </div>
    <div contentEditable suppressContentEditableWarning>Draft release notes...</div>
    <Textarea name="fallback" placeholder="Plain text fallback" />
  </RichTextEditor>
)
`
  }],
  scheduler: [{
    path: 'src/lumen/scheduler.tsx',
    source: `import {
  Agenda,
  Calendar,
  DatePicker,
  Schedule
} from '@santi020k/lumen-react'

export const SchedulerRecipe = () => (
  <section className="lumen-recipe lumen-recipe--scheduler">
    <Calendar aria-label="Choose schedule date" />
    <DatePicker aria-label="Jump to date" />
    <Schedule>
      <header><h2>Launch week</h2></header>
      <div data-ui-schedule-grid>
        <section data-ui-schedule-slot="monday">
          <article id="schedule-planning" data-ui-draggable="true" data-ui-schedule-event>Planning</article>
        </section>
        <section data-ui-schedule-slot="friday">
          <article id="schedule-ship" data-ui-draggable="true" data-ui-schedule-event>Ship</article>
        </section>
      </div>
    </Schedule>
    <Agenda>
      <ol>
        <li><strong>Design review</strong><span>10:00</span></li>
        <li><strong>Release notes</strong><span>14:30</span></li>
      </ol>
    </Agenda>
  </section>
)
`
  }],
  'theme-builder': [{
    path: 'src/lumen/theme-builder.tsx',
    source: `import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

import {
  createThemeFromHue,
  exportThemeCss
} from '@santi020k/lumen-core'
import {
  Button,
  Card,
  Input,
  ThemeBuilder
} from '@santi020k/lumen-react'

export const ThemeBuilderRecipe = () => {
  const [hue, setHue] = useState(264)
  const tokens = useMemo(() => createThemeFromHue(hue), [hue])
  const previewStyle = useMemo(() => Object.fromEntries(
    Object.entries(tokens).map(([token, value]) => [\`--\${token}\`, value])
  ) as CSSProperties, [tokens])
  const css = useMemo(() => exportThemeCss(tokens), [tokens])

  return (
    <ThemeBuilder className="lumen-recipe lumen-recipe--theme-builder">
      <header><h2>Brand theme</h2><Button type="button" onClick={() => navigator.clipboard?.writeText(css)}>Copy CSS</Button></header>
      <Card id="lumen-theme-preview" style={previewStyle}>
        <span data-ui-swatch style={{ '--ui-swatch': 'hsl(var(--brand))' } as CSSProperties}></span>
        <span data-ui-swatch style={{ '--ui-swatch': 'hsl(var(--accent))' } as CSSProperties}></span>
      </Card>
      <Card>
        <Input
          aria-label="Brand hue"
          max="359"
          min="0"
          type="range"
          value={hue}
          onChange={(event) => { setHue(Number(event.currentTarget.value)); }}
        />
      </Card>
      <textarea aria-label="Theme CSS" readOnly value={css}></textarea>
    </ThemeBuilder>
  )
}
`
  }]
}

const elementsRecipeFiles: Record<string, LumenRecipeFile[]> = {
  'advanced-fields': [{
    path: 'src/lumen/advanced-fields.html',
    source: `${elementsRecipeHeader}

<form class="lumen-recipe lumen-recipe--advanced-fields">
  <lumen-search-field name="q" placeholder="Search records"></lumen-search-field>
  <lumen-autocomplete list="assignees" placeholder="Assign to..."></lumen-autocomplete>
  <datalist id="assignees">
    <option value="Design"></option>
    <option value="Engineering"></option>
    <option value="Operations"></option>
  </datalist>
  <lumen-number-field aria-label="Seats" min="1" value="3"></lumen-number-field>
  <lumen-time-field aria-label="Start time" value="09:30"></lumen-time-field>
  <lumen-date-range-picker>
    <lumen-date-picker aria-label="Start date"></lumen-date-picker>
    <lumen-date-picker aria-label="End date"></lumen-date-picker>
  </lumen-date-range-picker>
  <lumen-color-picker aria-label="Brand color" value="#2563eb"></lumen-color-picker>
  <lumen-tag-group aria-label="Selected filters">
    <span data-ui-tag role="listitem">Active <button data-ui-tag-remove type="button">Remove</button></span>
  </lumen-tag-group>
</form>
`
  }],
  'data-collections': [{
    path: 'src/lumen/data-collections.html',
    source: `${elementsRecipeHeader}

<section class="lumen-recipe lumen-recipe--data-collections">
  <lumen-command>
    <input type="search" placeholder="Filter records" />
    <button data-ui-command-item type="button">Open docs</button>
  </lumen-command>
  <lumen-data-table>
    <table>
      <thead><tr><th>Name</th><th>Status</th></tr></thead>
      <tbody><tr><td>Docs</td><td>Ready</td></tr></tbody>
    </table>
  </lumen-data-table>
  <lumen-tree aria-label="Files">
    <div role="treeitem" aria-expanded="true">src</div>
    <div role="treeitem">index.ts</div>
  </lumen-tree>
  <lumen-tree-grid aria-label="Project status">
    <div role="row"><span role="gridcell">Docs</span><span role="gridcell">Ready</span></div>
  </lumen-tree-grid>
  <lumen-virtual-list data-ui-item-size="44" style="--ui-list-height: 12rem">
    <div>Row 1</div>
    <div>Row 2</div>
    <div>Row 3</div>
  </lumen-virtual-list>
  <lumen-pagination><a href="?page=1">Previous</a><a href="?page=2">Next</a></lumen-pagination>
</section>
`
  }],
  'rich-text-editor': [{
    path: 'src/lumen/rich-text-editor.html',
    source: `${elementsRecipeHeader}

<lumen-rich-text-editor class="lumen-recipe lumen-recipe--rich-text-editor">
  <div role="toolbar" aria-label="Editor toolbar">
    <lumen-button-group>
      <lumen-button data-ui-editor-command="bold" type="button">Bold</lumen-button>
      <lumen-button data-ui-editor-command="italic" type="button">Italic</lumen-button>
    </lumen-button-group>
    <lumen-toggle-group><button data-ui-editor-command="insertUnorderedList" type="button">List</button></lumen-toggle-group>
  </div>
  <div contenteditable="true">Draft release notes...</div>
  <lumen-textarea name="fallback" placeholder="Plain text fallback"></lumen-textarea>
</lumen-rich-text-editor>
`
  }],
  scheduler: [{
    path: 'src/lumen/scheduler.html',
    source: `${elementsRecipeHeader}

<section class="lumen-recipe lumen-recipe--scheduler">
  <lumen-calendar aria-label="Choose schedule date"></lumen-calendar>
  <lumen-date-picker aria-label="Jump to date"></lumen-date-picker>
  <lumen-schedule>
    <header><h2>Launch week</h2></header>
    <div data-ui-schedule-grid>
      <section data-ui-schedule-slot="monday">
        <article id="schedule-planning" data-ui-draggable="true" data-ui-schedule-event>Planning</article>
      </section>
      <section data-ui-schedule-slot="friday">
        <article id="schedule-ship" data-ui-draggable="true" data-ui-schedule-event>Ship</article>
      </section>
    </div>
  </lumen-schedule>
  <lumen-agenda>
    <ol>
      <li><strong>Design review</strong><span>10:00</span></li>
      <li><strong>Release notes</strong><span>14:30</span></li>
    </ol>
  </lumen-agenda>
</section>
`
  }],
  'theme-builder': [{
    path: 'src/lumen/theme-builder.html',
    source: `${elementsRecipeHeader}

<script type="module">
  const root = document.querySelector('[data-lumen-theme-builder-recipe]')
  const hueInput = root?.querySelector('[data-ui-theme-brand-hue]')
  const preview = root?.querySelector('#lumen-theme-preview')
  const output = root?.querySelector('[data-ui-theme-output]')
  const exportButton = root?.querySelector('[data-ui-theme-export]')
  const tokenNames = ['canvas', 'surface', 'surface-muted', 'surface-strong', 'line', 'ink', 'ink-soft', 'ink-muted', 'brand', 'brand-solid', 'brand-soft', 'accent', 'success', 'warning', 'danger']
  const createTheme = hue => ({
    accent: \`\${(hue + 150) % 360} 70% 40%\`,
    brand: \`\${hue} 85% 53%\`,
    'brand-soft': \`\${hue} 90% 96%\`,
    'brand-solid': \`\${hue} 85% 45%\`,
    canvas: \`\${hue} 20% 99%\`,
    danger: '0 84% 60%',
    ink: \`\${hue} 40% 11%\`,
    'ink-muted': \`\${hue} 10% 48%\`,
    'ink-soft': \`\${hue} 14% 32%\`,
    line: \`\${hue} 14% 86%\`,
    success: '142 71% 36%',
    surface: \`\${hue} 20% 100%\`,
    'surface-muted': \`\${hue} 16% 96%\`,
    'surface-strong': \`\${hue} 14% 91%\`,
    warning: '38 92% 50%'
  })
  const update = () => {
    const hue = Number(hueInput?.value ?? 264)
    const tokens = createTheme(Number.isFinite(hue) ? hue : 264)

    for (const [token, value] of Object.entries(tokens)) {
      preview?.style.setProperty(\`--\${token}\`, value)
    }

    if (output) {
      output.value = \`:root {\\n\${tokenNames.map(token => \`  --\${token}: \${tokens[token]};\`).join('\\n')}\\n}\`
    }
  }

  hueInput?.addEventListener('input', update)
  exportButton?.addEventListener('click', () => navigator.clipboard?.writeText(output?.value ?? ''))
  update()
</script>

<lumen-theme-builder class="lumen-recipe lumen-recipe--theme-builder" data-lumen-theme-builder-recipe>
  <header><h2>Brand theme</h2><lumen-button data-ui-theme-export type="button">Copy CSS</lumen-button></header>
  <lumen-card id="lumen-theme-preview" style="display: flex; gap: 0.5rem;">
    <span data-ui-swatch style="--ui-swatch:hsl(var(--brand))"></span>
    <span data-ui-swatch style="--ui-swatch:hsl(var(--accent))"></span>
  </lumen-card>
  <lumen-card>
    <input class="ui-input" aria-label="Brand hue" data-ui-theme-brand-hue max="359" min="0" type="range" value="264" />
  </lumen-card>
  <textarea data-ui-theme-output aria-label="Theme CSS"></textarea>
</lumen-theme-builder>
`
  }]
}

const recipeFilesByTarget: Record<LumenAddTarget, Record<string, LumenRecipeFile[]>> = {
  astro: recipeFiles,
  elements: elementsRecipeFiles,
  react: reactRecipeFiles
}

const toKebabCase = (name: string) => name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const toCamelCase = (value: string): string =>
  value.replaceAll(/-([a-z])/g, (_match, character: string) => character.toUpperCase())

const createAstroComponentFile = (name: string): LumenRecipeFile => ({
  path: `src/lumen/${toKebabCase(name)}.astro`,
  source: `---
import { ${name} as Lumen${name} } from '@santi020k/lumen-astro'

const props = Astro.props
---

<Lumen${name} {...props}>
  <slot />
</Lumen${name}>
`
})

const createReactComponentFile = (name: string): LumenRecipeFile => ({
  path: `src/lumen/${toKebabCase(name)}.tsx`,
  source: `import type { ComponentPropsWithoutRef } from 'react'

import { ${name} as Lumen${name} } from '@santi020k/lumen-react'

export type ${name}Props = ComponentPropsWithoutRef<typeof Lumen${name}>

export const ${name} = (props: ${name}Props) => <Lumen${name} {...props} />
`
})

const createElementsComponentFile = (name: string): LumenRecipeFile => {
  const tagName = `lumen-${toKebabCase(name)}`
  const variableName = `${toCamelCase(toKebabCase(name))}TagName`

  return {
    path: `src/lumen/${toKebabCase(name)}.ts`,
    source: `import {
  defineLumenElements,
  Lumen${name}Element
} from '@santi020k/lumen-elements'

defineLumenElements()

export { Lumen${name}Element }

export const ${variableName} = '${tagName}' as const

declare global {
  interface HTMLElementTagNameMap {
    '${tagName}': InstanceType<typeof Lumen${name}Element>
  }
}
`
  }
}

const createComponentFile = (
  name: string,
  target: LumenAddTarget
): LumenRecipeFile => {
  if (target === 'react') return createReactComponentFile(name)

  if (target === 'elements') return createElementsComponentFile(name)

  return createAstroComponentFile(name)
}

const getFilesForItem = (
  item: LumenRegistryEntry,
  target: LumenAddTarget
): LumenRecipeFile[] => {
  if (item.type === 'component') return [createComponentFile(item.name, target)]

  const targetRecipeFiles = recipeFilesByTarget[target][item.name]

  if (targetRecipeFiles) {
    return targetRecipeFiles
  }

  const inlineFiles = item.files
    ?.filter((file): file is LumenRegistryFile => typeof file !== 'string')
    .map(file => ({
      path: file.path,
      source: file.source
    })) ?? []

  if (inlineFiles.length > 0) return inlineFiles

  if (item.type === 'recipe') {
    throw new Error(`Registry recipe "${item.name}" does not have ${target} starter files yet.`)
  }

  return []
}

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

const mergeFileSource = ({
  existing,
  incoming,
  path
}: LumenMergeConflict): string => {
  if (existing.includes(incoming.trim())) return existing

  return `${existing.trimEnd()}\n\n/* Lumen merge: ${path} */\n${incoming}`
}

const getConflictMode = (options: LumenAddOptions) =>
  options.force ? 'overwrite' : options.conflict ?? 'skip'

const getInstallSource = async (
  file: LumenRecipeFile,
  target: string,
  exists: boolean,
  options: LumenAddOptions,
  conflict: NonNullable<LumenAddOptions['conflict']>
) => {
  if (!exists || conflict !== 'merge') return file.source

  return (options.merge ?? mergeFileSource)({
    existing: await readFile(target, 'utf8'),
    incoming: file.source,
    path: file.path
  })
}

const writeInstallFile = async (
  target: string,
  source: string,
  dryRun: boolean | undefined
) => {
  if (dryRun) return

  await mkdir(dirname(target), { recursive: true })

  await writeFile(target, source, 'utf8')
}

type InstallFileOutcome = 'added' | 'merged' | 'skipped'

const installRegistryFile = async (
  file: LumenRecipeFile,
  cwd: string,
  options: LumenAddOptions,
  conflict: NonNullable<LumenAddOptions['conflict']>
): Promise<InstallFileOutcome> => {
  const target = join(cwd, file.path)
  const exists = await fileExists(target)

  if (exists && conflict === 'error') {
    throw new Error(`Refusing to overwrite existing file: ${file.path}`)
  }

  if (exists && conflict === 'skip') return 'skipped'

  const source = await getInstallSource(file, target, exists, options, conflict)

  await writeInstallFile(target, source, options.dryRun)

  return exists && conflict === 'merge' ? 'merged' : 'added'
}

export const addLumenRegistryItem = async (
  name: string,
  options: LumenAddOptions = {}
): Promise<LumenAddResult> => {
  const item = getLumenRegistryItem(name, options.registry)

  if (!item) {
    throw new Error(`Unknown Lumen registry item: ${name}`)
  }

  const files = getFilesForItem(item, options.target ?? 'astro')
  const cwd = options.cwd ?? process.cwd()

  if (!files.length) {
    throw new Error(`Registry item cannot be installed yet: ${name}`)
  }

  const added: string[] = []
  const conflict = getConflictMode(options)
  const merged: string[] = []
  const skipped: string[] = []

  for (const file of files) {
    const outcome = await installRegistryFile(file, cwd, options, conflict)

    if (outcome === 'skipped') {
      skipped.push(file.path)

      continue
    }

    if (outcome === 'merged') {
      merged.push(file.path)
    } else {
      added.push(file.path)
    }
  }

  return {
    added,
    dryRun: Boolean(options.dryRun),
    files: files.map(file => file.path),
    item,
    merged,
    skipped
  }
}
