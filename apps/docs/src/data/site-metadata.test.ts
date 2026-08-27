import { describe, expect, test } from 'vitest'

import { componentDocs } from './docs'
import { documentedComponentCount, primaryPageMetadata } from './site-metadata'

describe('primary page metadata', () => {
  test('uses the documented public catalog count', () => {
    expect(documentedComponentCount).toBe(componentDocs.length)
    expect(primaryPageMetadata.home.description).toContain(
      `${documentedComponentCount} accessible primitives`
    )
  })

  test('keeps primary routes unique and absolute', () => {
    const paths = Object.values(primaryPageMetadata).map(metadata => metadata.pathname)

    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every(pathname => pathname.startsWith('/'))).toBe(true)
  })
})
