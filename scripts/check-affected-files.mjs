import { spawnSync } from 'node:child_process'

const runGit = args => {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`)
  }

  return result.stdout
}

const refExists = ref =>
  spawnSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
    stdio: 'ignore'
  }).status === 0

const resolveBase = () => {
  const explicitBase = process.env.TURBO_SCM_BASE

  if (explicitBase) return explicitBase

  const candidates = process.env.GITHUB_BASE_REF
    ? [`origin/${process.env.GITHUB_BASE_REF}`, process.env.GITHUB_BASE_REF]
    : ['origin/main', 'main', 'HEAD^']

  const base = candidates.find(refExists)

  if (!base) {
    throw new Error(
      'Unable to resolve a comparison base. Set TURBO_SCM_BASE to the branch or commit to compare.'
    )
  }

  return base
}

const splitNullDelimited = value => value.split('\0').filter(Boolean)
// cspell:ignore ACMRT
const changedFileFilter = 'ACMRT'

const getAffectedFiles = () => {
  const base = resolveBase()
  const head = process.env.TURBO_SCM_HEAD || 'HEAD'

  const files = new Set(
    splitNullDelimited(
      runGit(['diff', '--name-only', `--diff-filter=${changedFileFilter}`, '-z', `${base}...${head}`])
    )
  )

  if (head === 'HEAD') {
    for (const file of splitNullDelimited(
      runGit(['diff', '--name-only', `--diff-filter=${changedFileFilter}`, '-z', 'HEAD'])
    )) {
      files.add(file)
    }

    for (const file of splitNullDelimited(
      runGit(['diff', '--cached', '--name-only', `--diff-filter=${changedFileFilter}`, '-z', 'HEAD'])
    )) {
      files.add(file)
    }

    for (const file of splitNullDelimited(
      runGit(['ls-files', '--others', '--exclude-standard', '-z'])
    )) {
      files.add(file)
    }
  }

  return [...files].sort()
}

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' })

  if (result.error) throw result.error

  if (result.status !== 0) process.exit(result.status ?? 1)
}

const files = getAffectedFiles()

if (files.length === 0) {
  console.log('No affected files require repository-level linting or spelling checks.')

  process.exit(0)
}

const repositoryFiles = files.filter(file => !/^(?:apps|packages)\//u.test(file))

if (repositoryFiles.length > 0) {
  run('pnpm', [
    'exec',
    'eslint',
    '--no-warn-ignored',
    '--max-warnings=0',
    ...repositoryFiles
  ])
}

run('pnpm', ['exec', 'cspell', '--no-must-find-files', ...files])
