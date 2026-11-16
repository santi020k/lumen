import { constants, type Stats } from 'node:fs'
import { open } from 'node:fs/promises'

export interface GuardedFileSnapshot {
  content: string
  stats: Stats
}

export class GuardedFilePreWriteError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)

    this.name = 'GuardedFilePreWriteError'
  }
}

const assertRegularFile = (details: Stats, label: string): void => {
  if (!details.isFile()) {
    throw new GuardedFilePreWriteError(`Expected a regular file at: ${label}`)
  }
}

const assertRegularSingleLink = (details: Stats, label: string): void => {
  assertRegularFile(details, label)

  if (details.nlink !== 1) {
    throw new GuardedFilePreWriteError(`Refusing to modify a hard-linked file: ${label}`)
  }
}

const sameFileIdentity = (expected: Stats, actual: Stats): boolean => (
  expected.dev === actual.dev &&
  expected.ino === actual.ino &&
  expected.ctimeMs === actual.ctimeMs
)

const writeAllAtZeroAndTruncate = async (
  handle: Awaited<ReturnType<typeof open>>,
  content: string,
  label: string
): Promise<Stats> => {
  const bytes = Buffer.from(content, 'utf8')
  let offset = 0

  while (offset < bytes.length) {
    const { bytesWritten } = await handle.write(bytes, offset, bytes.length - offset, offset)

    if (bytesWritten === 0) {
      throw new Error(`Incomplete write to file: ${label}`)
    }

    offset += bytesWritten
  }

  await handle.truncate(bytes.length)

  return handle.stat()
}

export const readGuardedRegularFile = async (
  path: string,
  label = path
): Promise<GuardedFileSnapshot> => {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)

  try {
    const stats = await handle.stat()

    assertRegularFile(stats, label)

    const content = await handle.readFile('utf8')

    return { content, stats }
  } finally {
    await handle.close()
  }
}

export const createGuardedNewFile = async (
  path: string,
  content: string,
  label = path
): Promise<GuardedFileSnapshot> => {
  const handle = await open(
    path,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    0o666
  )

  try {
    const stats = await handle.stat()

    assertRegularSingleLink(stats, label)

    const updatedStats = await writeAllAtZeroAndTruncate(handle, content, label)

    return { content, stats: updatedStats }
  } finally {
    await handle.close()
  }
}

export const writeGuardedExistingFile = async (
  path: string,
  nextContent: string,
  expected: GuardedFileSnapshot,
  label = path,
  changedMessage = `File changed during migration: ${label}`
): Promise<GuardedFileSnapshot> => {
  let handle: Awaited<ReturnType<typeof open>>

  try {
    handle = await open(path, constants.O_RDWR | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  } catch (error) {
    throw new GuardedFilePreWriteError(error instanceof Error ? error.message : String(error), { cause: error })
  }

  try {
    const details = await handle.stat()

    assertRegularSingleLink(details, label)

    if (!sameFileIdentity(expected.stats, details)) {
      throw new GuardedFilePreWriteError(changedMessage)
    }

    // readFile advances the descriptor offset to EOF; writeAllAtZeroAndTruncate writes explicitly at 0.
    const current = await handle.readFile('utf8')

    if (current !== expected.content) {
      throw new GuardedFilePreWriteError(changedMessage)
    }

    const updatedStats = await writeAllAtZeroAndTruncate(handle, nextContent, label)

    return { content: nextContent, stats: updatedStats }
  } finally {
    await handle.close()
  }
}
