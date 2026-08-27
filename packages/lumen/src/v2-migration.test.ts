import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { migrateLumenV2, migrateLumenV2Source } from './v2-migration.js'

const readMigrationFixture = async (
  framework: 'astro' | 'elements',
  name: 'expected' | 'source'
): Promise<string> => readFile(
  new URL(
    `./fixtures/v2-migration/${framework}/${name}.${framework === 'astro' ? 'astro' : 'html'}`,
    import.meta.url
  ),
  'utf8'
)

describe('Lumen v2 migration', () => {
  test('splits UIPrimitives from mixed Astro imports and preserves aliases', () => {
    const result = migrateLumenV2Source(
      `---
import { Button, UIPrimitives as Runtime, Input as TextInput } from '@santi020k/lumen-astro'
---
<TextInput size="sm" />
<Button>Save</Button>
<Runtime />
`,
      'src/layout.astro'
    )

    expect(result.source).toContain(
      'import { Button, Input as TextInput } from \'@santi020k/lumen-astro\''
    )
    expect(result.source).toContain(
      'import Runtime from \'@santi020k/lumen-astro/runtime\''
    )
    expect(result.source).toContain('<TextInput visualSize="sm" />')
    expect(result.changes.map(change => change.kind)).toEqual([
      'astro-runtime-subpath',
      'visual-size-alias-removal'
    ])
    expect(result.manualReview).toEqual([])
  })

  test('migrates standalone UIPrimitives imports and is idempotent', () => {
    const source = `---
import { UIPrimitives } from "@santi020k/lumen-astro";
---
<UIPrimitives />
`
    const first = migrateLumenV2Source(source, 'src/layout.astro')
    const second = migrateLumenV2Source(first.source, 'src/layout.astro')

    expect(first.source).toContain(
      'import UIPrimitives from "@santi020k/lumen-astro/runtime";'
    )
    expect(first.source).not.toContain('import { UIPrimitives }')
    expect(second).toEqual({
      changes: [],
      manualReview: [],
      source: first.source
    })
  })

  test('rewrites only Lumen Astro component aliases and Elements visual aliases', () => {
    const result = migrateLumenV2Source(
      `---
import { Input as LumenInput, NativeSelect } from '@santi020k/lumen-astro'
import Input from './Input.astro'
---
<LumenInput size='default' />
<NativeSelect size="lg" />
<Input size="sm" />
<lumen-input size="sm"></lumen-input>
<lumen-native-select size=lg></lumen-native-select>
`,
      'src/form.astro'
    )

    expect(result.source).toContain('<LumenInput visualSize=\'default\' />')
    expect(result.source).toContain('<NativeSelect visualSize="lg" />')
    expect(result.source).toContain('<Input size="sm" />')
    expect(result.source).toContain('<lumen-input visual-size="sm">')
    expect(result.source).toContain('<lumen-native-select visual-size=lg>')
    expect(result.changes).toHaveLength(4)
  })

  test('preserves numeric native sizes and reports dynamic or ambiguous values', () => {
    const result = migrateLumenV2Source(
      `---
import { Input, NativeSelect } from '@santi020k/lumen-astro'
const fieldSize = 'sm'
---
<Input size="24" />
<NativeSelect size={12} />
<Input size={fieldSize} />
<NativeSelect {size} />
<Input size="sm" visualSize="lg" />
<lumen-input size="wide"></lumen-input>
`,
      'src/form.astro'
    )

    expect(result.source).toContain('<Input size="24" />')
    expect(result.source).toContain('<NativeSelect size={12} />')
    expect(result.source).toContain('<Input size={fieldSize} />')
    expect(result.source).toContain('<NativeSelect {size} />')
    expect(result.source).toContain('<Input size="sm" visualSize="lg" />')
    expect(result.changes).toEqual([])
    expect(result.manualReview).toHaveLength(4)
    expect(
      result.manualReview.every(
        finding => finding.kind === 'visual-size-alias-removal'
      )
    ).toBe(true)
  })

  test('reports conflicting runtime imports without changing the root import', () => {
    const source = `---
import ExistingRuntime from '@santi020k/lumen-astro/runtime'
import { Button, UIPrimitives as Runtime } from '@santi020k/lumen-astro'
---
`
    const result = migrateLumenV2Source(source, 'src/layout.astro')

    expect(result.source).toBe(source)
    expect(result.changes).toEqual([])
    expect(result.manualReview).toEqual([
      expect.objectContaining({ kind: 'astro-runtime-subpath' })
    ])
  })

  test('leaves commented and type-only runtime imports for manual review', () => {
    const commented = `---
import { Button /* keep this comment */, UIPrimitives } from '@santi020k/lumen-astro'
---
`
    const typeOnly = `---
import { type UIPrimitives } from '@santi020k/lumen-astro'
---
`

    expect(
      migrateLumenV2Source(commented, 'src/commented.astro')
    ).toMatchObject({
      changes: [],
      manualReview: [
        expect.objectContaining({ kind: 'astro-runtime-subpath' })
      ],
      source: commented
    })
    expect(migrateLumenV2Source(typeOnly, 'src/types.astro')).toMatchObject({
      changes: [],
      manualReview: [
        expect.objectContaining({ kind: 'astro-runtime-subpath' })
      ],
      source: typeOnly
    })
  })

  test('does not rewrite examples in Astro frontmatter or HTML comments', () => {
    const result = migrateLumenV2Source(
      `---
import { Input } from '@santi020k/lumen-astro'
const example = '<Input size="sm" />'
---
<!-- <Input size="sm" /> -->
<Input size="lg" />
`,
      'src/form.astro'
    )

    expect(result.source).toContain('const example = \'<Input size="sm" />\'')
    expect(result.source).toContain('<!-- <Input size="sm" /> -->')
    expect(result.source).toContain('<Input visualSize="lg" />')
    expect(result.changes).toHaveLength(1)
  })

  test('does not treat TypeScript strings as Astro imports or Elements markup', () => {
    const source = `const fixture = \`<lumen-input size="sm"></lumen-input>\`
const importExample = "import { UIPrimitives } from '@santi020k/lumen-astro'"
const sonnerExample = "import { Sonner } from '@santi020k/lumen-react'"
`

    expect(migrateLumenV2Source(source, 'src/fixture.ts')).toEqual({
      changes: [],
      manualReview: [],
      source
    })
  })

  test('migrates Astro and React Sonner imports without changing local component names', () => {
    const astro = migrateLumenV2Source(
      `---
import { Sonner, type SonnerProps, Toast } from '@santi020k/lumen-astro'
---
<Sonner placement="top-right" maxCount={5}>
  <Toast>Saved</Toast>
</Sonner>
`,
      'src/layout.astro'
    )
    const react = migrateLumenV2Source(
      `import {
  Sonner as Notifications,
  type SonnerProps,
  Toast
} from '@santi020k/lumen-react'

export const App = (props: SonnerProps) => <Notifications {...props}><Toast>Saved</Toast></Notifications>
`,
      'src/app.tsx'
    )

    expect(astro.source).toContain(
      'import { Toast, ToastViewport as Sonner, type ToastViewportProps as SonnerProps } from \'@santi020k/lumen-astro\''
    )
    expect(astro.source).toContain(
      '<Sonner placement="top-right" maxCount={5}>'
    )
    expect(react.source).toContain('ToastViewport as Notifications')
    expect(react.source).toContain('type ToastViewportProps as SonnerProps')
    expect(react.source).toContain('<Notifications {...props}>')
    expect(
      [...astro.changes, ...react.changes].every(
        change => change.kind === 'sonner-alias-removal'
      )
    ).toBe(true)
    expect(migrateLumenV2Source(react.source, 'src/app.tsx')).toEqual({
      changes: [],
      manualReview: [],
      source: react.source
    })
  })

  test('renames Sonner custom elements while preserving viewport configuration and children', () => {
    const result = migrateLumenV2Source(
      `<lumen-sonner data-placement="top-right" data-ui-toast-max="5">
  <lumen-toast>Saved</lumen-toast>
</lumen-sonner>
<!-- <lumen-sonner></lumen-sonner> -->
<script>const example = '<lumen-sonner></lumen-sonner>'</script>
`,
      'index.html'
    )

    expect(result.source).toContain(
      '<lumen-toast-viewport data-placement="top-right" data-ui-toast-max="5">'
    )
    expect(result.source).toContain('</lumen-toast-viewport>')
    expect(result.source).toContain('<!-- <lumen-sonner></lumen-sonner> -->')
    expect(result.source).toContain(
      'const example = \'<lumen-sonner></lumen-sonner>\''
    )
    expect(result.changes).toHaveLength(2)
    expect(result.manualReview).toEqual([])
  })

  test('reports commented Sonner imports for manual review', () => {
    const source = `---
import { Sonner /* configured viewport */ } from '@santi020k/lumen-astro'
---
`
    const result = migrateLumenV2Source(source, 'src/layout.astro')

    expect(result.source).toBe(source)
    expect(result.changes).toEqual([])
    expect(result.manualReview).toEqual([
      expect.objectContaining({ kind: 'sonner-alias-removal' })
    ])
  })

  test('moves React Native datetime exports to the optional subpath and is idempotent', () => {
    const source = `import {
  Button,
  LumenDateField as DateField,
  type LumenDateRangeValue
} from '@santi020k/lumen-react-native'

export const value: LumenDateRangeValue = { start: undefined, end: undefined }
void Button
void DateField
`
    const first = migrateLumenV2Source(source, 'src/app.tsx')
    const second = migrateLumenV2Source(first.source, 'src/app.tsx')

    expect(first.source).toContain(
      'import { Button } from \'@santi020k/lumen-react-native\''
    )
    expect(first.source).toContain(
      'import { LumenDateField as DateField, type LumenDateRangeValue } from \'@santi020k/lumen-react-native/datetime\''
    )
    expect(first.changes).toHaveLength(2)
    expect(
      first.changes.every(
        change => change.kind === 'react-native-datetime-subpath'
      )
    ).toBe(true)
    expect(first.manualReview).toEqual([])
    expect(second).toEqual({
      changes: [],
      manualReview: [],
      source: first.source
    })
  })

  test('preserves type-only React Native datetime imports', () => {
    const result = migrateLumenV2Source(
      'import type { LumenDateFieldProps, LumenDateRangeValue } from \'@santi020k/lumen-react-native\';\n',
      'src/types.ts'
    )

    expect(result.source).toBe(
      'import type { LumenDateFieldProps, LumenDateRangeValue } from \'@santi020k/lumen-react-native/datetime\';\n'
    )
    expect(result.changes).toHaveLength(2)
    expect(result.manualReview).toEqual([])
  })

  test('reports an existing React Native datetime subpath import for manual review', () => {
    const source = `import { LumenDateField } from '@santi020k/lumen-react-native/datetime'
import { Button, LumenDateRangeField } from '@santi020k/lumen-react-native'
`
    const result = migrateLumenV2Source(source, 'src/app.tsx')

    expect(result.source).toBe(source)
    expect(result.changes).toEqual([])
    expect(result.manualReview).toEqual([
      expect.objectContaining({ kind: 'react-native-datetime-subpath' })
    ])
  })

  test('discovers nested sources, defaults to dry-run, and applies only when requested', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-v2-migration-'))
    const nestedFile = join(root, 'src', 'nested', 'form.astro')
    const ignoredFile = join(root, 'node_modules', 'fixture', 'form.astro')
    const source = `---
import { Input } from '@santi020k/lumen-astro'
---
<Input size="sm" />
`

    try {
      await mkdir(join(root, 'src', 'nested'), { recursive: true })
      await mkdir(join(root, 'node_modules', 'fixture'), { recursive: true })
      await writeFile(nestedFile, source)
      await writeFile(ignoredFile, source)

      const dryRun = await migrateLumenV2({ cwd: root })

      expect(dryRun.applied).toBe(false)
      expect(dryRun.filesScanned).toBe(1)
      expect(dryRun.changedFiles).toEqual(['src/nested/form.astro'])
      await expect(readFile(nestedFile, 'utf8')).resolves.toBe(source)

      const applied = await migrateLumenV2({ apply: true, cwd: root })

      expect(applied.applied).toBe(true)
      await expect(readFile(nestedFile, 'utf8')).resolves.toContain(
        '<Input visualSize="sm" />'
      )
      await expect(readFile(ignoredFile, 'utf8')).resolves.toBe(source)

      const repeated = await migrateLumenV2({ apply: true, cwd: root })

      expect(repeated.changedFiles).toEqual([])
      expect(repeated.changes).toEqual([])
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('migrates production-shaped Astro and Elements fixtures exactly on repeated runs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-v2-fixtures-'))
    const astroFile = join(root, 'src', 'layouts', 'AccountSettings.astro')
    const elementsFile = join(root, 'public', 'account-settings.html')
    const [astroSource, astroExpected, elementsSource, elementsExpected] =
      await Promise.all([
        readMigrationFixture('astro', 'source'),
        readMigrationFixture('astro', 'expected'),
        readMigrationFixture('elements', 'source'),
        readMigrationFixture('elements', 'expected')
      ])

    try {
      await mkdir(join(root, 'src', 'layouts'), { recursive: true })
      await mkdir(join(root, 'public'), { recursive: true })
      await writeFile(astroFile, astroSource)
      await writeFile(elementsFile, elementsSource)

      const dryRun = await migrateLumenV2({ cwd: root })

      expect(dryRun).toMatchObject({
        applied: false,
        changedFiles: [
          'public/account-settings.html',
          'src/layouts/AccountSettings.astro'
        ],
        filesScanned: 2,
        manualReview: []
      })
      await expect(readFile(astroFile, 'utf8')).resolves.toBe(astroSource)
      await expect(readFile(elementsFile, 'utf8')).resolves.toBe(
        elementsSource
      )

      const applied = await migrateLumenV2({ apply: true, cwd: root })

      expect(applied.changedFiles).toEqual(dryRun.changedFiles)
      expect(applied.changes).toHaveLength(dryRun.changes.length)
      await expect(readFile(astroFile, 'utf8')).resolves.toBe(astroExpected)
      await expect(readFile(elementsFile, 'utf8')).resolves.toBe(
        elementsExpected
      )

      const repeated = await migrateLumenV2({ apply: true, cwd: root })

      expect(repeated).toMatchObject({
        applied: true,
        changedFiles: [],
        changes: [],
        filesScanned: 2,
        manualReview: []
      })
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
