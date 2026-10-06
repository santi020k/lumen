import { spawnSync } from 'node:child_process'

for (const format of ['portrait', 'square', 'landscape']) {
  const result = spawnSync('pnpm', ['exec', 'hyperframes', 'render', 'dist', '--composition', `outro/${format}/index.html`, '--output', `renders/lumen-brand-ending-${format}.mp4`, '--fps', '30', '--quality', 'delivery'], {
    env: { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1' },
    stdio: 'inherit'
  })

  if (result.error) throw result.error

  if (result.status !== 0) process.exit(result.status ?? 1)
}
