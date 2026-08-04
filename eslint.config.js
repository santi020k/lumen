import { defineConfig } from '@santi020k/eslint-config-basic'

export default defineConfig({
  projects: {
    'packages/lumen': {
      frameworks: {
        astro: true
      }
    }
  },
  tailwind: {
    noUnknownClasses: false
  }
}, {
  name: 'lumen/generated-next-types',
  files: ['apps/next-smoke/next-env.d.ts'],
  rules: {
    '@stylistic/quotes': 'off',
    '@stylistic/semi': 'off'
  }
})
