import {
  mkdir,
  writeFile
} from 'node:fs/promises'
import {
  dirname,
  join
} from 'node:path'

import {
  getLumenRegistryItem,
  type LumenRegistryItem
} from './registry.js'

interface LumenRecipeFile {
  path: string
  source: string
}

export interface LumenAddOptions {
  cwd?: string
  dryRun?: boolean
}

export interface LumenAddResult {
  dryRun: boolean
  files: string[]
  item: LumenRegistryItem
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

<ThemeBuilder class="lumen-recipe lumen-recipe--theme-builder">
  <header><h2>Brand theme</h2><Button data-ui-theme-export type="button">Export CSS</Button></header>
  <Card><Input aria-label="Theme name" placeholder="Acme light" /><ColorPicker aria-label="Brand color" value="#2563eb" /></Card>
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

Use @santi020k/lumen-astro for Astro apps, import @santi020k/lumen-astro/styles.css once, and mount UIPrimitives once for interactive primitives.
`
    }
  ]
}

const getFilesForItem = (item: LumenRegistryItem): LumenRecipeFile[] =>
  recipeFiles[item.name] ?? []

export const addLumenRegistryItem = async (
  name: string,
  options: LumenAddOptions = {}
): Promise<LumenAddResult> => {
  const item = getLumenRegistryItem(name)

  if (!item) {
    throw new Error(`Unknown Lumen registry item: ${name}`)
  }

  const files = getFilesForItem(item)
  const cwd = options.cwd ?? process.cwd()

  if (!files.length) {
    throw new Error(`Registry item cannot be installed yet: ${name}`)
  }

  for (const file of files) {
    const target = join(cwd, file.path)

    if (!options.dryRun) {
      await mkdir(dirname(target), { recursive: true })

      await writeFile(target, file.source, 'utf8')
    }
  }

  return {
    dryRun: Boolean(options.dryRun),
    files: files.map(file => file.path),
    item
  }
}
