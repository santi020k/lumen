import { defineConfig } from '@santi020k/eslint-config-basic'

export default defineConfig({
  projects: {
    'apps/docs': {
      tailwind: {
        entryPoint: 'src/styles/global.css',
        ignore: [
          '^(?:animated|changelog|component|components|docs|figma|framework|home|icons|lumen|mcp|primitive|skill|speed-dial|template|theme|ui)(?:-|$)',
          '^is-current$'
        ],
        noUnknownClasses: 'error'
      }
    },
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
