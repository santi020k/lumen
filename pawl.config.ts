import { definePolicy } from '@santi020k/pawl'

// Biome's linter, formatter and assist includes bound this pilot to the two
// deployment artifact scripts. Existing repository-wide ESLint stays independent.
export default definePolicy({
  engine: 'biome',
  formatter: 'biome',
  detect: false,
  runtime: 'node',
  maxWarnings: 0,
  style: { indent: 2, lineWidth: 100, quotes: 'single', semicolons: false, trailingCommas: 'none', arrowParens: 'as-needed' }
})
