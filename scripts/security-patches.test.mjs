import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

import { collectPatchedInstances, evaluateAudit, verifyBracesBehavior, verifyForgeBehavior, verifyInstalledPatch, verifyPatchFiles } from './security-patches.mjs'

const root = resolve(import.meta.dirname, '..')
const policies = JSON.parse(await readFile(resolve(root, 'registry/security-patches.json'), 'utf8'))
const hash = contents => createHash('sha256').update(contents).digest('hex')

const createFixture = async context => {
  const directory = await mkdtemp(resolve(tmpdir(), 'lumen-security-'))

  context.after(() => rm(directory, { recursive: true, force: true }))

  const packageDirectory = resolve(directory, 'node_modules/braces')

  const policy = {
    name: 'braces',
    version: '3.0.3',
    patch: 'braces.patch',
    sha256: hash('reviewed patch'),
    files: { 'index.js': hash('patched implementation') }
  }

  await mkdir(packageDirectory, { recursive: true })

  await writeFile(resolve(packageDirectory, 'package.json'), JSON.stringify({ name: policy.name, version: policy.version }))

  await writeFile(resolve(packageDirectory, 'index.js'), 'patched implementation')

  await writeFile(resolve(directory, policy.patch), 'reviewed patch')

  const configuration = { 'braces@3.0.3': resolve(directory, policy.patch) }
  const child = { path: packageDirectory, version: policy.version }
  const project = { path: directory, dependencies: { braces: child } }

  return { child, configuration, directory, packageDirectory, policy, project }
}

test('patch acceptance requires exact pnpm configuration and reviewed patch bytes', async context => {
  const fixture = await createFixture(context)
  const { configuration, directory, policy } = fixture

  await verifyPatchFiles(directory, [policy], configuration)

  await assert.rejects(verifyPatchFiles(directory, [policy], {}), /Missing exact-version patch/u)

  await writeFile(resolve(directory, policy.patch), 'different patch')

  await assert.rejects(verifyPatchFiles(directory, [policy], configuration), /Patch integrity failed/u)
})

test('every installed instance requires the exact package version and patched runtime bytes', async context => {
  const { packageDirectory, policy } = await createFixture(context)

  await verifyInstalledPatch(policy, packageDirectory, policy.version)

  await assert.rejects(verifyInstalledPatch(policy, packageDirectory, '3.0.2'), /Unapproved installed version/u)

  await writeFile(resolve(packageDirectory, 'index.js'), 'original vulnerable implementation')

  await assert.rejects(verifyInstalledPatch(policy, packageDirectory, policy.version), /Installed patch integrity failed/u)
})

test('inventory traverses repeated parents and catches an additional unpatched instance', async context => {
  const { directory, packageDirectory, policy, project } = await createFixture(context)
  const secondParent = resolve(directory, 'consumer')
  const secondPackage = resolve(secondParent, 'node_modules/braces')

  await mkdir(secondPackage, { recursive: true })

  await writeFile(resolve(secondPackage, 'package.json'), JSON.stringify({ name: policy.name, version: policy.version }))

  await writeFile(resolve(secondPackage, 'index.js'), 'unpatched second instance')

  const secondProject = { path: secondParent, dependencies: { braces: { path: secondPackage, version: policy.version } } }
  const instances = await collectPatchedInstances(directory, [project, secondProject, { path: directory }], [policy])
  const installed = instances.get(policy.name)

  assert.equal(installed.size, 2)

  await verifyInstalledPatch(policy, packageDirectory, policy.version)

  await assert.rejects(verifyInstalledPatch(policy, secondPackage, installed.get(await realpath(secondPackage))), /Installed patch integrity failed/u)
})

test('inventory rejects stale installed dependency links even when a patched copy exists', async context => {
  const { child, directory, packageDirectory, policy, project } = await createFixture(context)
  const alternate = resolve(directory, 'alternate')

  await mkdir(alternate)

  child.path = alternate

  await assert.rejects(collectPatchedInstances(directory, [project], [policy]), /Installed resolution differs/u)

  await rm(packageDirectory, { recursive: true })

  await symlink(alternate, packageDirectory, 'dir')

  const instances = await collectPatchedInstances(directory, [project], [policy])

  assert.equal(instances.get(policy.name).size, 1)
})

test('missing or invalid inventory cannot grant an exception', async context => {
  const { directory, policy } = await createFixture(context)

  await assert.rejects(collectPatchedInstances(directory, [], [policy]), /Missing pnpm dependency inventory/u)

  await assert.rejects(collectPatchedInstances(directory, [{ path: directory, dependencies: [] }], [policy]), /Invalid dependency inventory group/u)
})

const reportFor = advisories => {
  const vulnerabilities = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 }

  for (const advisory of advisories) vulnerabilities[advisory.severity]++

  return { advisories: Object.fromEntries(advisories.map((advisory, index) => [index, advisory])), metadata: { vulnerabilities } }
}

const advisoryFor = (policy, overrides = {}) => ({
  module_name: policy.name,
  url: policy.advisory,
  severity: 'high',
  findings: [{ version: policy.version, paths: [`app>${policy.name}`] }],
  ...overrides
})

test('only verified exact advisory, package and version pairs are mitigated', () => {
  const advisories = policies.map(policy => advisoryFor(policy))
  const result = evaluateAudit(reportFor(advisories), 1, policies)

  assert.equal(result.mitigated.length, 2)

  assert.equal(result.blocking.length, 0)

  assert.equal(evaluateAudit(reportFor(advisories), 1, []).blocking.length, 2)

  for (const overrides of [
    { url: 'https://github.com/advisories/new-advisory' },
    { module_name: 'other-package' },
    { findings: [{ version: '0.0.1', paths: ['app>old-version'] }] },
    { findings: [{ version: policies[0].version, paths: ['app>patched'] }, { version: '0.0.1', paths: ['app>unpatched'] }] }
  ]) {
    const changed = advisoryFor(policies[0], overrides)

    assert.equal(evaluateAudit(reportFor([changed]), 1, policies).blocking.length, 1)
  }
})

test('cache and new moderate-or-higher findings remain blocking', () => {
  for (const severity of ['moderate', 'high', 'critical']) {
    const cache = advisoryFor(policies[0], { module_name: 'http-cache-semantics', url: 'https://github.com/advisories/GHSA-ch52-4w7c-c8xp', severity })

    assert.equal(evaluateAudit(reportFor([cache]), 1, policies).blocking.length, 1)
  }

  const low = advisoryFor(policies[0], { module_name: 'other-package', severity: 'low' })

  assert.equal(evaluateAudit(reportFor([low]), 1, policies).blocking.length, 0)

  assert.equal(evaluateAudit(reportFor([]), 0, policies).blocking.length, 0)
})

test('network errors, malformed reports, missing findings and inconsistent counts fail closed', () => {
  for (const report of [null, {}, { error: { code: 'network' } }, { advisories: {}, metadata: {} }]) {
    assert.throws(() => evaluateAudit(report, 1, policies))
  }

  for (const overrides of [{ severity: 'unknown' }, { findings: [] }, { findings: [{ version: '1.4.0', paths: [] }] }]) {
    assert.throws(() => evaluateAudit(reportFor([advisoryFor(policies[0], overrides)]), 1, policies))
  }

  const report = reportFor([advisoryFor(policies[0])])

  assert.throws(() => evaluateAudit(report, 0, policies), /exit status/u)

  assert.throws(() => evaluateAudit(reportFor([]), 1, policies), /exit status/u)

  assert.throws(() => evaluateAudit(report, 2, policies), /command failed/u)

  report.metadata.vulnerabilities.high = 2

  assert.throws(() => evaluateAudit(report, 1, policies), /count mismatch/u)
})

test('installed patch regressions preserve signatures, certificates, globs and ranges', async () => {
  const inventory = spawnSync('pnpm', ['list', '--recursive', ...policies.map(policy => policy.name), '--depth', 'Infinity', '--json'], { cwd: root, encoding: 'utf8' })

  assert.equal(inventory.status, 0)

  const instances = await collectPatchedInstances(root, JSON.parse(inventory.stdout), policies)
  const checks = { braces: verifyBracesBehavior, 'node-forge': verifyForgeBehavior }

  for (const policy of policies) {
    const installed = instances.get(policy.name)

    assert.ok(installed.size > 0)

    for (const [directory, version] of installed) {
      await verifyInstalledPatch(policy, directory, version)

      const require = createRequire(resolve(directory, 'package.json'))

      checks[policy.name](require(directory))
    }
  }
})
