// cspell:words xhigh
import assert from 'node:assert/strict'
import { execFileSync,spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { hasComponentLookup, readCodexUsage, summarizeEfficiency } from './lib/ai-efficiency-metrics.mjs'
import { verifyEfficiencyScreen } from './lib/verify-ai-efficiency-screen.mjs'

const root = resolve(import.meta.dirname, '..')

const { values } = parseArgs({ options: {
  model: { type: 'string' }, effort: { type: 'string' }, output: { type: 'string' },
  repetitions: { type: 'string', default: '3' }, 'verify-only': { type: 'boolean', default: false }
} })

assert.ok(values.output, 'Pass --output with a new directory outside the repository.')

const output = resolve(values.output)
const relativeOutput = relative(root, output)

assert.ok(relativeOutput === '..' || relativeOutput.startsWith('../') || isAbsolute(relativeOutput), 'Keep synthetic fixtures and transcripts outside the repository.')

const modes = ['scratch', 'docs', 'skill-mcp']

const scenarios = [
  {
    id: 'profile-dialog', heading: 'Profile',
    prompt: 'Build a profile settings screen with the main h1 Profile. The Edit profile button opens a modal dialog named Profile settings. Its Display name text field initially contains Ada and receives focus on opening. Editing the field persists across closing and reopening. Escape and the Cancel button both close the dialog and return focus to Edit profile. Trap keyboard focus while the modal is open.'
  },
  {
    id: 'notification-settings', heading: 'Notification settings',
    prompt: 'Build a settings screen with the main h1 Notification settings. The Email address field initially contains ada@example.com. Show delivery details toggles the initially hidden text Weekly summaries arrive on Monday. without clearing edited input. Save preferences displays a status region containing Preferences saved for <email>. using the current field value. This is an in-memory demo, with no network or persistence across page reloads.'
  }
]

const hash = text => createHash('sha256').update(text).digest('hex')

const protectedHash = async directory => {
  const entries = await readdir(directory, { withFileTypes: true })
  const chunks = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (['Screen.tsx', 'Screen.css', 'evidence', 'entry.tsx', 'app.js', 'app.css', 'index.html',
      '390-initial.png', '390-open.png', '390-details.png', '390-saved.png',
      '1440-initial.png', '1440-open.png', '1440-details.png', '1440-saved.png'].includes(entry.name)) continue

    chunks.push(entry.name, entry.isDirectory() ? await protectedHash(join(directory, entry.name)) : hash(await readFile(join(directory, entry.name))))
  }

  return hash(chunks.join('\n'))
}

const invoke = (args, directory, attempt) => new Promise((resolve, reject) => {
  const child = spawn('codex', args, { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
  let stdout = ''
  let stderr = ''
  let timedOut = false
  let killTimer

  const timer = setTimeout(() => {
    timedOut = true

    child.kill('SIGTERM')

    killTimer = setTimeout(() => child.kill('SIGKILL'), 5000)
  }, 600000)

  child.stdout.on('data', chunk => { stdout += chunk.toString() })

  child.stderr.on('data', chunk => { stderr += chunk.toString() })

  child.once('error', error => { clearTimeout(timer);

 reject(error) })

  child.once('close', async code => {
    clearTimeout(timer)

    clearTimeout(killTimer)

    try {
      await writeFile(join(directory, 'evidence', `attempt-${attempt}.jsonl`), stdout)

      await writeFile(join(directory, 'evidence', `attempt-${attempt}.stderr`), stderr)

      resolve({ transcript: stdout, code, timedOut })
    } catch (error) { reject(error) }
  })
})

const setup = async (directory, mode) => {
  await mkdir(join(directory, 'evidence'), { recursive: true })

  await writeFile(join(directory, 'Screen.tsx'), 'export default function Screen() { return null }\n')

  await writeFile(join(directory, 'Screen.css'), '')

  await writeFile(join(directory, 'fixture-env.d.ts'), "declare module '*.css' { const stylesheet: string; export default stylesheet }\n")

  await writeFile(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { react: '19.2.3', ...(mode === 'scratch' ? {} : { '@santi020k/lumen-react': '4.0.0' }) } }, null, 2))

  await writeFile(join(directory, 'AGENTS.md'), 'Synthetic local UI evaluation. Edit only Screen.tsx and Screen.css. Read only this fixture and the connected Lumen MCP tools when available. Do not access other folders, external services, user configuration, or other skills. Do not install dependencies, run commands outside this folder, commit, or modify harness files. Use accurate types without any, unsafe casts, non-null assertions, or suppressions. The host will compile and verify the output.\n')

  if (mode !== 'scratch') {
    const target = join(directory, 'node_modules/@santi020k/lumen-react')

    await mkdir(target, { recursive: true })

    for (const name of ['README.md', 'package.json']) await cp(join(root, 'packages/react', name), join(target, name))

    await cp(join(root, 'packages/react/dist'), join(target, 'dist'), { recursive: true, filter: path => !path.endsWith('.js') && !path.endsWith('.map') })
  }

  if (mode === 'skill-mcp') await cp(join(root, 'skills/lumen-ui'), join(directory, '.agents/skills/lumen-ui'), { recursive: true })
}

const approachFor = mode => mode === 'scratch' ? 'Use native HTML controls and your own CSS in React. No component library is available.' :
    `Use public Lumen React primitives and the existing stylesheet, which the host loads once. ${mode === 'docs' ? 'Read the installed package README and declaration files. No MCP or agent skill is available.' : 'Read .agents/skills/lumen-ui/SKILL.md and use the local Lumen MCP catalog for the relevant React usage contracts.'}`

const configurationFor = mode => mode === 'skill-mcp' ? ['-c', `mcp_servers.lumen.command=${JSON.stringify(process.execPath)}`, '-c', `mcp_servers.lumen.args=${JSON.stringify([join(root, 'packages/mcp/bin/lumen-mcp.mjs')])}`] : []

const evaluateRun = async (scenario, mode, repetition) => {
  const directory = join(output, `${scenario.id}-${mode}-${repetition}`)

  await setup(directory, mode)

  const protectedBefore = await protectedHash(directory)
  const approach = approachFor(mode)
  const basePrompt = `${scenario.prompt}\n${approach}\nExport a default React component from Screen.tsx; put extra CSS in Screen.css. Use a readable light interface, a centered content area no wider than 48rem, sufficient spacing and contrast, visible keyboard focus, meaningful labels, and no horizontal overflow at 390px and 1440px. Use only synthetic data. The host supplies React, bundles the screen and checks types, keyboard behavior, state preservation, runtime errors and WCAG axe checks. Edit only these two files. Do not run the host checks or inspect other folders.\n`
  const run = { case: scenario.id, mode, repetition, status: 'failed', durationMs: 0, usage: null, attempts: [] }
  let feedback = ''
  const started = Date.now()

  process.stdout.write(`Starting ${scenario.id}/${mode}/${repetition}\n`)

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const config = configurationFor(mode)
    const prompt = `${basePrompt}${feedback ? `\nThe previous attempt failed independent checks. Repair the existing output: ${feedback}\n` : ''}`

    await writeFile(join(directory, 'evidence', `prompt-${attempt}.txt`), prompt)

    const result = await invoke(['exec', '--ignore-user-config', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'workspace-write', '--json', '--model', values.model, '-c', `model_reasoning_effort=${JSON.stringify(values.effort)}`, ...config, prompt], directory, attempt)
    const observation = { attempt, usage: null, diagnostic: null }

    try {
      observation.usage = readCodexUsage(result.transcript)

      assert.equal(result.code, 0, result.timedOut ? 'Agent invocation timed out.' : 'Agent invocation failed; inspect local evidence.')

      assert.equal(await protectedHash(directory), protectedBefore, 'Agent changed protected fixture files.')

      if (mode === 'skill-mcp') assert.ok(hasComponentLookup(result.transcript), 'Skill/MCP arm did not retrieve a component contract.')

      await verifyEfficiencyScreen(directory, scenario, mode)

      run.status = 'passed'
    } catch (error) {
      feedback = error instanceof Error ? error.message : String(error)

      observation.diagnostic = feedback
    }

    run.attempts.push(observation)

    if (run.status === 'passed' || observation.usage === null) break
  }

  run.durationMs = Date.now() - started

  if (run.attempts.every(attempt => attempt.usage !== null)) {
    run.usage = Object.fromEntries(['inputTokens', 'cachedInputTokens', 'outputTokens', 'totalTokens', 'toolCalls'].map(key => [key, run.attempts.reduce((total, attempt) => total + attempt.usage[key], 0)]))
  }

  return run
}

if (values['verify-only']) {
  const report = JSON.parse(await readFile(join(output, 'results.json'), 'utf8'))

  for (const run of report.runs) {
    const scenario = scenarios.find(item => item.id === run.case)

    assert.ok(scenario && modes.includes(run.mode), 'Unknown saved case.')

    await verifyEfficiencyScreen(join(output, `${run.case}-${run.mode}-${run.repetition}`), scenario, run.mode)
  }

  process.stdout.write('Saved outputs passed current verification; no new generation or token measurement.\n')
} else {
  assert.ok(values.model && values.effort, 'Pin --model and --effort explicitly for a reproducible comparison.')

  assert.ok(['low', 'medium', 'high', 'xhigh', 'max', 'ultra'].includes(values.effort), 'Unsupported reasoning effort.')

  const repetitions = Number(values.repetitions)

  assert.ok(Number.isSafeInteger(repetitions) && repetitions >= 1 && repetitions <= 10, 'Use 1–10 repetitions; publish at least three.')

  await mkdir(output, { recursive: true })

  assert.deepEqual(await readdir(output), [], 'Use a fresh output directory; never overwrite earlier runs.')

  const report = {
    schemaVersion: 1, createdAt: new Date().toISOString(),
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    cli: execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim(),
    model: values.model, effort: values.effort, repetitions, maxAttempts: 2,
    hashes: {
      harness: hash(await readFile(import.meta.filename)),
      verifier: hash(await readFile(join(root, 'scripts/lib/verify-ai-efficiency-screen.mjs'))),
      metrics: hash(await readFile(join(root, 'scripts/lib/ai-efficiency-metrics.mjs'))),
      stylesheet: hash(await readFile(join(root, 'packages/lumen/styles.css'))),
      react: hash(await readFile(join(root, 'packages/react/dist/index.js'))),
      catalog: hash(await readFile(join(root, 'packages/mcp/data/lumen-data.json'))),
      skill: await protectedHash(join(root, 'skills/lumen-ui'))
    },
    scenarios, runs: [], summary: []
  }

  await mkdir(join(output, 'harness'))

  for (const file of ['scripts/evaluate-ai-efficiency.mjs', 'scripts/lib/verify-ai-efficiency-screen.mjs', 'scripts/lib/ai-efficiency-metrics.mjs', 'packages/lumen/styles.css']) {
    await cp(join(root, file), join(output, 'harness', file.split('/').at(-1)))
  }

  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    for (const [index, scenario] of scenarios.entries()) {
      const offset = (repetition - 1 + index) % modes.length
      const orderedModes = [...modes.slice(offset), ...modes.slice(0, offset)]

      for (const mode of orderedModes) {
        const run = await evaluateRun(scenario, mode, repetition)

        report.runs.push(run)

        report.summary = summarizeEfficiency(report.runs)

        await writeFile(join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)

        process.stdout.write(`${scenario.id}/${mode}/${repetition}: ${run.status}, ${run.usage?.totalTokens ?? 'unavailable'} tokens\n`)
      }
    }
  }

  process.stdout.write(`Local evidence: ${output}\n`)

  if (report.runs.some(run => run.status !== 'passed')) process.exitCode = 1
}
