import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

// This companion remains on v4 and must not drop existing React adapter peers
// when Changesets prepares the independently versioned v5 web packages.
export const checkLegacyHookFormConsumer = async ({ archives, temporaryRoot, run }) => {
  const archive = archives.find(path => basename(path).startsWith('santi020k-lumen-react-hook-form-'))

  if (!archive) return

  const directory = join(temporaryRoot, 'legacy-hook-form')

  await mkdir(directory)

  await writeFile(join(directory, 'package.json'), JSON.stringify({
    name: 'lumen-legacy-hook-form-smoke', private: true, type: 'module',
    // Match the workspace's supported React/renderer pair throughout the graph.
    overrides: { react: '19.2.3', 'react-dom': '19.2.3' }
  }))

  run('npm', [
    'install', '--ignore-scripts', '--strict-peer-deps', '--no-audit', '--no-fund',
    archive, '@santi020k/lumen-react@4.3.0', '@santi020k/lumen-core@4.4.0',
    'react@19.2.3', 'react-dom@19.2.3', 'react-hook-form@7.89.0', 'motion@14.6.0',
    '@types/node@26.6.4', '@types/react@19.2.18', '@types/react-dom@19.2.7', 'typescript@6.0.3'
  ], directory)

  await writeFile(join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      strict: true, module: 'NodeNext', moduleResolution: 'NodeNext',
      target: 'ES2022', jsx: 'react-jsx', outDir: 'dist', types: ['node']
    },
    include: ['fixture.tsx']
  }))

  await writeFile(join(directory, 'fixture.tsx'), `import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { useForm } from 'react-hook-form'
import {
  LumenAmountFieldController, LumenDatePickerController, LumenInputOTPController,
  LumenListBoxController, LumenSelectController
} from '@santi020k/lumen-react-hook-form'

const Fixture = () => {
  const { control } = useForm({ defaultValues: {
    amount: '1234.50', date: '2026-11-05', code: '123456', role: 'engineer', members: ['amina']
  } })
  return <form>
    <LumenAmountFieldController control={control} name="amount" locale="en-US" />
    <LumenDatePickerController control={control} name="date" />
    <LumenInputOTPController control={control} name="code" length={6} />
    <LumenSelectController control={control} name="role" options={[{ label: 'Engineer', value: 'engineer' }]} />
    <LumenListBoxController control={control} name="members" multiple options={[{ label: 'Amina', value: 'amina' }]} />
  </form>
}
const markup = renderToStaticMarkup(<Fixture />)
for (const name of ['amount', 'date', 'code', 'role', 'members']) assert.ok(markup.includes('name="' + name + '"'))
assert.ok(markup.includes('value="1234.50"'))
assert.ok(markup.includes('value="2026-11-05"'))
assert.ok(markup.includes('value="123456"'))
assert.ok(markup.includes('<option value="engineer" selected="">Engineer</option>'))
assert.ok(markup.includes('<option value="amina" selected="">Amina</option>'))
console.log('Packed React Hook Form retains v4 peer, type and rendered-value compatibility.')
`)

  run(process.execPath, [join(directory, 'node_modules/typescript/bin/tsc'), '--project', 'tsconfig.json'], directory)

  const output = run(process.execPath, ['dist/fixture.js'], directory)

  assert.match(output, /retains v4 peer, type and rendered-value compatibility/)

  process.stdout.write(output)
}
