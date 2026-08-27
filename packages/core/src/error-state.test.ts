import { describe, expect, test } from 'vitest'

import {
  lumenErrorStateAnnouncements,
  lumenErrorStateKinds,
  lumenErrorStateLayouts
} from './error-state.js'

describe('error state contract', () => {
  test('publishes stable semantic options', () => {
    expect(lumenErrorStateKinds).toEqual(['error', 'offline'])
    expect(lumenErrorStateLayouts).toEqual(['compact', 'default', 'page'])
    expect(lumenErrorStateAnnouncements).toEqual(['assertive', 'off', 'polite'])
  })
})
