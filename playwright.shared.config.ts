import { availableParallelism } from 'node:os'

const hostedRunnerWorkers = 4
const localWorkers = 2

/**
 * Resolves the worker count shared by every parallel Playwright suite.
 *
 * `LUMEN_PLAYWRIGHT_WORKERS` overrides the default. CI otherwise uses the four cores of a
 * standard hosted runner, capped by the cores the host exposes; local runs keep two workers.
 */
export const resolvePlaywrightWorkers = (
  env: Readonly<Record<string, string | undefined>> = process.env,
  cores: number = availableParallelism()
): number => {
  const requested = env.LUMEN_PLAYWRIGHT_WORKERS

  if (requested !== undefined && requested !== '') {
    if (!/^[1-9]\d{0,2}$/u.test(requested)) {
      throw new Error(`LUMEN_PLAYWRIGHT_WORKERS must be a positive integer, received: ${requested}`)
    }

    return Number(requested)
  }

  return env.CI ? Math.max(1, Math.min(hostedRunnerWorkers, cores)) : localWorkers
}

export const playwrightWorkers = resolvePlaywrightWorkers()
