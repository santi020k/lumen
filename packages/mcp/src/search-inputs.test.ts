import { expect, test } from 'vitest'

import { search } from './tools.js'

test.each(['constructor', 'toString', '__proto__'])('search handles inherited dictionary names: %s', query => {
  expect(() => search({ query })).not.toThrow()
})
