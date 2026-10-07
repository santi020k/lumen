import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import { collectPatchedInstances, evaluateAudit, verifyBracesBehavior, verifyForgeBehavior, verifyInstalledPatch, verifyPatchFiles } from './security-patches.mjs'

const root = resolve(import.meta.dirname, '..')
const policies = JSON.parse(await readFile(resolve(root, 'registry/security-patches.json'), 'utf8'))
const behaviorChecks = { braces: verifyBracesBehavior, 'node-forge': verifyForgeBehavior }

const runPnpm = arguments_ => {
  const result = spawnSync('pnpm', arguments_, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000
  })

  if (result.error) throw result.error

  assert.equal(result.signal, null, 'pnpm command was interrupted')

  return result
}

const readPnpmJson = arguments_ => {
  const result = runPnpm(arguments_)

  assert.equal(result.status, 0, `pnpm ${arguments_[0]} failed`)

  return JSON.parse(result.stdout)
}

try {
  await verifyPatchFiles(root, policies, readPnpmJson(['config', 'get', 'patchedDependencies', '--json']))

  const inventory = readPnpmJson(['list', '--recursive', ...policies.map(policy => policy.name), '--depth', 'Infinity', '--json'])
  const instances = await collectPatchedInstances(root, inventory, policies)

  for (const policy of policies) {
    const installed = instances.get(policy.name)
    const verifyBehavior = behaviorChecks[policy.name]

    assert.ok(installed && installed.size > 0 && verifyBehavior, `Missing patch verification: ${policy.name}`)

    for (const [directory, version] of installed) {
      await verifyInstalledPatch(policy, directory, version)

      const require = createRequire(resolve(directory, 'package.json'))

      verifyBehavior(require(directory))
    }

    console.log(`Verified ${policy.name}@${policy.version}: patch, installed resolution, ${installed.size} instance(s), and behavior.`)
  }

  const audit = runPnpm(['audit', '--prod', '--json'])
  const result = evaluateAudit(JSON.parse(audit.stdout), audit.status, policies)

  for (const advisory of result.mitigated) console.log(`Patched finding: ${advisory.module_name} — ${advisory.url}`)

  for (const advisory of result.blocking) console.error(`BLOCKED: ${advisory.severity} ${advisory.module_name} — ${advisory.url}`)

  if (result.blocking.length > 0) throw new Error(`${result.blocking.length} unmitigated moderate-or-higher security finding(s)`)

  console.log('Production dependency security checks passed.')
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Security verification failed')

  process.exitCode = 1
}
