import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { createPublicEfficiencyReport } from './lib/ai-efficiency-report.mjs'

const { values } = parseArgs({ options: { input: { type: 'string' }, output: { type: 'string' } } })

assert.ok(values.input && values.output, 'Pass --input results.json and --output for the sanitized report.')

assert.notEqual(resolve(values.input), resolve(values.output), 'Preserve the original evidence.')

const report = createPublicEfficiencyReport(JSON.parse(await readFile(resolve(values.input), 'utf8')))

await writeFile(resolve(values.output), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' })

process.stdout.write(`Wrote ${report.runs.length} recorded outcomes without local transcripts or diagnostics.\n`)
