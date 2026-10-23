import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { isAbsolute, relative, resolve, sep } from 'node:path'

// ASN.1 identifiers in the Forge public API.
// cspell:words oids OCTETSTRING
const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value)
const dependencyGroups = ['dependencies', 'devDependencies', 'optionalDependencies']
const severityLevels = ['info', 'low', 'moderate', 'high', 'critical']
const sha256 = contents => createHash('sha256').update(contents).digest('hex')

const assertDependency = child => {
  assert.ok(isRecord(child) && typeof child.path === 'string' && typeof child.version === 'string', 'Invalid dependency inventory entry')
}

export const verifyPatchFiles = async (root, policies, configuration) => {
  assert.ok(isRecord(configuration), 'Missing pnpm patch configuration')

  for (const policy of policies) {
    const patchPath = resolve(root, policy.patch)

    assert.equal(configuration[`${policy.name}@${policy.version}`], patchPath, `Missing exact-version patch: ${policy.name}`)

    assert.equal(sha256(await readFile(patchPath)), policy.sha256, `Patch integrity failed: ${policy.name}`)
  }
}

const resolveDependency = async (parent, name) => {
  const require = createRequire(resolve(parent, 'package.json'))
  const searchPaths = require.resolve.paths(name)

  assert.ok(searchPaths, `Cannot resolve dependency: ${name}`)

  for (const searchPath of searchPaths) {
    try {
      return await realpath(resolve(searchPath, name))
    } catch (error) {
      if (!isRecord(error) || error.code !== 'ENOENT') throw error
    }
  }

  assert.fail(`Missing installed dependency: ${name}`)
}

export const collectPatchedInstances = async (root, projects, policies) => {
  assert.ok(Array.isArray(projects) && projects.length > 0, 'Missing pnpm dependency inventory')

  const rootPath = await realpath(root)
  const pending = [...projects]
  const instances = new Map(policies.map(policy => [policy.name, new Map()]))
  const patchedVersions = new Map(policies.map(policy => [policy.name, policy.version]))

  while (pending.length > 0) {
    const parent = pending.pop()

    assert.ok(isRecord(parent) && typeof parent.path === 'string', 'Invalid dependency inventory node')

    const parentPath = await realpath(parent.path)
    const relativePath = relative(rootPath, parentPath)

    assert.ok(relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath), 'Dependency escaped the workspace')

    for (const group of dependencyGroups) {
      if (parent[group] === undefined) continue

      assert.ok(isRecord(parent[group]), 'Invalid dependency inventory group')

      for (const [name, child] of Object.entries(parent[group])) {
        assertDependency(child)

        const childPath = await realpath(child.path)

        // Check actual resolution as well as pnpm's lockfile-derived inventory.
        assert.equal(await resolveDependency(parentPath, name), childPath, `Installed resolution differs from lockfile: ${name}`)

        // Other versions remain subject to the audit; only this exact version can receive a patch exception.
        if (child.version === patchedVersions.get(name)) instances.get(name).set(childPath, child.version)

        pending.push(child)
      }
    }
  }

  return instances
}

export const verifyInstalledPatch = async (policy, directory, version) => {
  assert.equal(version, policy.version, `Unapproved installed version: ${policy.name}`)

  const manifest = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'))

  assert.equal(manifest.name, policy.name, 'Installed package name mismatch')

  assert.equal(manifest.version, policy.version, 'Installed package version mismatch')

  for (const [file, hash] of Object.entries(policy.files)) {
    assert.equal(sha256(await readFile(resolve(directory, file))), hash, `Installed patch integrity failed: ${policy.name}/${file}`)
  }
}

export const verifyForgeBehavior = forge => {
  // Ephemeral synthetic keys only; no credentials or real signing material.
  const keys = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  const privateKey = forge.pki.privateKeyFromPem(keys.privateKey)
  const publicKey = forge.pki.publicKeyFromPem(keys.publicKey)
  const asn1 = forge.asn1
  const create = (type, constructed, value) => asn1.create(asn1.Class.UNIVERSAL, type, constructed, value)
  const digest = forge.md.sha256.create().update('Lumen synthetic security regression').digest().getBytes()

  for (const includeParameters of [true, false]) {
    const algorithm = [create(asn1.Type.OID, false, asn1.oidToDer(forge.pki.oids.sha256).getBytes())]

    if (includeParameters) algorithm.push(create(asn1.Type.NULL, false, ''))

    algorithm.push(create(asn1.Type.OCTETSTRING, false, 'unexpected child'))

    const info = create(asn1.Type.SEQUENCE, true, [
      create(asn1.Type.SEQUENCE, true, algorithm),
      create(asn1.Type.OCTETSTRING, false, digest)
    ])

    const signature = forge.pki.rsa.encrypt(asn1.toDer(info).getBytes(), privateKey, 0x01)

    assert.throws(() => publicKey.verify(digest, signature), /DigestInfo/u)
  }

  for (const algorithm of ['sha1', 'sha256', 'sha384', 'sha512']) {
    const message = forge.md[algorithm].create().update('Lumen valid signature')
    const signature = privateKey.sign(message)

    assert.equal(publicKey.verify(message.digest().getBytes(), signature), true)

    assert.equal(publicKey.verify('wrong digest', signature), false)
  }

  const certificate = forge.pki.createCertificate()

  certificate.publicKey = publicKey

  certificate.serialNumber = '01'

  certificate.setSubject([{ name: 'commonName', value: 'lumen-security.example.test' }])

  certificate.setIssuer(certificate.subject.attributes)

  certificate.sign(privateKey, forge.md.sha256.create())

  assert.equal(certificate.verify(certificate), true)
}

export const verifyBracesBehavior = braces => {
  for (const [open, close] of [['{', '}'], ['(', ')']]) {
    for (const operation of ['parse', 'compile', 'expand', 'stringify']) {
      assert.doesNotThrow(() => braces[operation](open.repeat(100) + 'a' + close.repeat(100)))

      assert.throws(() => braces[operation](open.repeat(101) + 'a' + close.repeat(101)), /exceeds max depth/u)

      assert.throws(() => braces[operation](open.repeat(4500) + 'a' + close.repeat(4500)), /exceeds max depth/u)
    }
  }

  for (const maxDepth of [Infinity, 1_000_000, 1.5]) {
    assert.throws(() => braces.parse('{'.repeat(101) + 'a' + '}'.repeat(101), { maxDepth }), /exceeds max depth/u)
  }

  assert.throws(() => braces.parse('{{a,b},c}', { maxDepth: 1.5 }), /exceeds max depth/u)

  assert.equal(braces.compile('src/**/*.{js,ts,tsx}'), 'src/**/*.(js|ts|tsx)')

  assert.deepEqual(braces.expand('a/{b,c}/d'), ['a/b/d', 'a/c/d'])

  assert.deepEqual(braces.expand('{01..05}'), ['01', '02', '03', '04', '05'])

  assert.deepEqual(braces.expand('{5..1}'), ['5', '4', '3', '2', '1'])

  assert.deepEqual(braces.expand('{a..e}'), ['a', 'b', 'c', 'd', 'e'])

  assert.equal(braces.stringify('foo/({a,b})'), 'foo/({a,b})')

  for (const operation of ['compile', 'expand', 'stringify']) {
    let nested = { type: 'text', value: 'a' }

    for (let depth = 0; depth < 102; depth++) nested = { type: 'paren', nodes: [nested] }

    assert.throws(() => braces[operation](nested), /exceeds max depth/u)
  }

  const cycle = { type: 'paren', nodes: [{ type: 'text', value: 'a' }] }

  cycle.parent = cycle

  assert.throws(() => braces.expand(cycle), /parent chain contains a cycle/u)
}

const verifyZodCoreBehavior = async core => {
  const string = new core.$ZodString({ type: 'string' })
  const maxLength = new core.$ZodCheckMaxLength({ check: 'max_length', maximum: 2 })
  const maxSize = new core.$ZodCheckMaxSize({ check: 'max_size', maximum: 2 })
  const entries = Array.from({ length: 10_000 }, (_, index) => [index, index])

  const cases = [
    [new core.$ZodArray({ type: 'array', element: string, checks: [maxLength] }), entries, ['a', 'b']],
    [new core.$ZodSet({ type: 'set', valueType: string, checks: [maxSize] }), new Set(entries), new Set(['a', 'b'])],
    [new core.$ZodMap({ type: 'map', keyType: string, valueType: string, checks: [maxSize] }), new Map(entries), new Map([['a', 'b']])]
  ]

  for (const [schema, oversized, valid] of cases) {
    for (const result of [core.safeParse(schema, oversized), await core.safeParseAsync(schema, oversized)]) {
      assert.equal(result.success, false)

      assert.deepEqual(result.error.issues.map(issue => issue.code), ['too_big'])
    }

    assert.equal(core.safeParse(schema, valid).success, true)

    assert.equal(core.safeParse(schema, null).error.issues[0].code, 'invalid_type')
  }
}

export const verifyZodBehavior = async zod => {
  if (zod.$ZodArray) return verifyZodCoreBehavior(zod)

  if (typeof zod.array(zod.string()).max !== 'function') {
    const schema = zod.array(zod.string()).check(zod.maxLength(2))

    assert.equal(zod.safeParse(schema, [1, 2, 3]).error.issues.length, 1)

    return verifyZodCoreBehavior(zod.core)
  }

  let parsed = 0
  let refined = 0

  const element = zod.preprocess(value => {
    parsed++

    return value
  }, zod.string())

  const oversized = Array.from({ length: 10_000 }, (_, index) => index)

  const bounded = zod.array(element).max(2, 'too many').refine(() => {
    refined++

    return true
  })

  const result = bounded.safeParse(oversized)

  assert.equal(result.success, false)

  assert.deepEqual(result.error.issues.map(issue => [issue.code, issue.message]), [['too_big', 'too many']])

  assert.equal((await bounded.safeParseAsync(oversized)).success, false)

  assert.equal(parsed, 0)

  assert.equal(refined, 0)

  for (const schema of [zod.array(element).length(2), zod.array(element).min(1).max(2)]) {
    const failure = schema.safeParse(oversized)

    assert.equal(failure.success, false)

    assert.equal(failure.error.issues.length, 1)

    assert.equal(failure.error.issues[0].code, 'too_big')

    assert.deepEqual(schema.parse(['a', 'b']), ['a', 'b'])
  }

  const nested = zod.object({ items: zod.array(zod.string()).max(2) }).safeParse({ items: oversized })

  assert.deepEqual(nested.error.issues.map(issue => issue.path), [['items']])

  assert.equal(zod.array(zod.string()).max(2).safeParse({ length: 10_000 }).error.issues[0].code, 'invalid_type')

  const values = new Set(oversized)
  const cappedSet = zod.set(element).max(2)

  parsed = 0

  assert.equal(cappedSet.safeParse(values).error.issues.length, 1)

  assert.equal((await cappedSet.safeParseAsync(values)).error.issues[0].code, 'too_big')

  assert.equal(parsed, 0)

  assert.deepEqual([...cappedSet.parse(new Set(['a', 'b']))], ['a', 'b'])

  assert.equal(zod.set(zod.string()).size(2).safeParse(values).error.issues.length, 1)

  assert.equal(zod.array(zod.number()).parse(oversized).length, oversized.length)

  assert.deepEqual(zod.preprocess(value => value.slice(0, 2), zod.array(zod.number()).max(2)).parse(oversized), [0, 1])

  const array = zod.array(zod.number())

  if (typeof array.overwrite === 'function') {
    assert.deepEqual(array.overwrite(value => value.slice(0, 2)).max(2).parse(oversized), [0, 1])
  }
}

const validateAdvisory = advisory => {
  assert.ok(isRecord(advisory) && severityLevels.includes(advisory.severity), 'Invalid audit advisory severity')

  assert.ok(typeof advisory.module_name === 'string' && typeof advisory.url === 'string', 'Invalid audit advisory identity')

  assert.ok(Array.isArray(advisory.findings) && advisory.findings.length > 0, 'Missing audit findings')

  for (const finding of advisory.findings) {
    assert.ok(isRecord(finding) && typeof finding.version === 'string', 'Invalid audit finding version')

    assert.ok(Array.isArray(finding.paths) && finding.paths.length > 0 && finding.paths.every(path => typeof path === 'string' && path.length > 0), 'Invalid audit finding paths')
  }
}

export const evaluateAudit = (report, status, verifiedPolicies) => {
  assert.ok(isRecord(report) && !('error' in report), 'Audit failed or returned an error')

  assert.ok(isRecord(report.advisories) && isRecord(report.metadata), 'Unrecognized audit report')

  assert.ok(isRecord(report.metadata.vulnerabilities), 'Missing audit vulnerability counts')

  assert.ok(status === 0 || status === 1, 'Audit command failed')

  const counts = Object.fromEntries(severityLevels.map(severity => [severity, 0]))
  const mitigated = []
  const blocking = []

  for (const advisory of Object.values(report.advisories)) {
    validateAdvisory(advisory)

    counts[advisory.severity]++

    const policy = verifiedPolicies.find(candidate => candidate.advisory === advisory.url && candidate.name === advisory.module_name)
    const patched = policy && advisory.findings.every(finding => finding.version === policy.version)

    if (patched) mitigated.push(advisory)
    else if (severityLevels.indexOf(advisory.severity) >= 2) blocking.push(advisory)
  }

  for (const severity of severityLevels) {
    assert.equal(report.metadata.vulnerabilities[severity], counts[severity], `Audit count mismatch: ${severity}`)
  }

  assert.equal(status, Object.keys(report.advisories).length > 0 ? 1 : 0, 'Audit exit status disagrees with report')

  return { blocking, mitigated }
}
