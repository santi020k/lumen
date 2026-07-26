import { describe, expect, test } from 'vitest'

import { parseChangelog, renderChangelogInline } from './changelog'

describe('changelog', () => {
  test('parses releases and removes dependency-only entries', () => {
    const releases = parseChangelog(`# @santi020k/lumen

## 0.2.0

### Minor Changes

- [\`abc1234\`](https://github.com/santi020k/lumen/commit/abc1234) - Add a new primitive.

  Include the same contract in \`Astro\` and React.

### Patch Changes

- Fix focus behavior.

- Updated dependencies [[\`abc1234\`](https://github.com/santi020k/lumen/commit/abc1234)]:
  - @santi020k/lumen-core@0.2.0
`)

    expect(releases).toHaveLength(1)
    expect(releases[0]?.version).toBe('0.2.0')
    expect(releases[0]?.sections.map(section => section.title))
      .toEqual(['Minor Changes', 'Patch Changes'])
    expect(releases[0]?.sections[0]?.entries[0]?.paragraphs).toHaveLength(2)
    expect(releases[0]?.sections[1]?.entries).toHaveLength(1)
  })

  test('renders supported inline Markdown with safe external links', () => {
    const html = renderChangelogInline(
      '[`abc1234`](https://github.com/santi020k/lumen/commit/abc1234) - Use `<Button>`.'
    )

    expect(html).toContain('<a href="https://github.com/santi020k/lumen/commit/abc1234"')
    expect(html).toContain('<code>abc1234</code>')
    expect(html).toContain('Use <code>&lt;Button&gt;</code>.')
  })
})
