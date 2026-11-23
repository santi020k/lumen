import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { addAriaStateAliases, buildDioxusCss, inlineImports } from './generate-dioxus-css.mjs'

test('checkbox and switch state rules gain aria-checked twins', () => {
  const css = addAriaStateAliases('.ui-checkbox:checked { color: red; }\n.ui-switch:checked::before { x: 1; }')

  assert.match(css, /\.ui-checkbox:checked,\n\.ui-checkbox\[aria-checked="true"\] \{/u)

  assert.match(css, /\.ui-switch\[aria-checked="true"\]::before/u)
})

test('aliases reach rules nested in at-rules and nested selectors', () => {
  const css = addAriaStateAliases('@layer a { @media (x) { .ui-field { .ui-checkbox:indeterminate { y: 1; } } } }')

  assert.match(css, /\.ui-checkbox\[aria-checked="mixed"\]/u)

  assert.match(css, /^@layer a \{/u)
})

test('untouched stylesheets report no change and keep unrelated rules verbatim', () => {
  assert.equal(addAriaStateAliases('.ui-button { color: red; }\n@media (x) { .a { b: c; } }'), null)

  const css = addAriaStateAliases('/* keep */ .a { b: c; }\n.ui-switch:checked { d: e; }')

  assert.match(css, /\.a \{ b: c; \}/u)
})

test('an alias is not added twice when the source already has it', () => {
  const css = addAriaStateAliases('.ui-switch:checked, .ui-switch[aria-checked="true"] { d: e; }')

  assert.equal(css, null)
})

test('long selector lists stay linear', () => {
  const selectors = Array.from({ length: 20_000 }, (_, index) => `.x${index}`).join(', ')
  const started = performance.now()
  const css = addAriaStateAliases(`${selectors}, .ui-checkbox:checked { a: b; }`)

  assert.ok(css.endsWith('.ui-checkbox[aria-checked="true"] { a: b; }'))

  assert.ok(performance.now() - started < 2000)
})

test('local imports are inlined and cycles or remote imports are rejected', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-dioxus-css-'))

  try {
    await writeFile(join(directory, 'a.css'), '@import "./b.css";\n.a { b: c; }')

    await writeFile(join(directory, 'b.css'), '.b { c: d; }')

    assert.equal(await inlineImports(join(directory, 'a.css')), '.b { c: d; }\n.a { b: c; }')

    await writeFile(join(directory, 'loop.css'), '@import "./loop.css";')

    await assert.rejects(inlineImports(join(directory, 'loop.css')), /Cyclic CSS import/u)

    await writeFile(join(directory, 'remote.css'), '@import "https://example.com/x.css";')

    await assert.rejects(inlineImports(join(directory, 'remote.css')), /Only local CSS imports/u)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test('the bundled stylesheet is self-contained and carries the button resets', async () => {
  const css = await buildDioxusCss()

  assert.doesNotMatch(css, /@import/u)

  assert.match(css, /button\.ui-checkbox,\nbutton\.ui-switch \{\n {2}padding: 0;/u)

  assert.match(css, /\.ui-checkbox\[aria-checked="mixed"\]/u)
})
