import {
  defineConfig,
  Extension,
  Format,
  Preset,
  Runtime,
  Testing,
  Tool
} from '@santi020k/eslint-config-basic'

import tseslint from 'typescript-eslint'

const config = await defineConfig({
  autoFrameworks: false,
  detection: { libraries: false },
  detectRootDir: import.meta.dirname,
  extensions: [Extension.Boundaries, Extension.Unicorn],
  formats: [Format.Jsonc, Format.Markdown, Format.Yaml],
  frameworks: { astro: true, react: true },
  ignores: ['**/CHANGELOG.md', '**/*.css', '**/*.d.ts', 'packages/astro/components/**/*.astro'],
  preset: Preset.Monorepo,
  projects: {
    'apps/docs': {
      preset: Preset.App
    },
    'packages/astro': {
      preset: Preset.Library
    },
    'packages/core': {
      preset: Preset.Library,
      runtime: Runtime.Node
    },
    'packages/elements': {
      preset: Preset.Library
    },
    'packages/lumen': {
      preset: Preset.Library,
      runtime: Runtime.Node
    },
    'packages/react': {
      preset: Preset.Library
    }
  },
  testing: [Testing.Vitest],
  tools: [Tool.Pnpm, Tool.Cspell, Tool.GithubActions],
  tsconfigRootDir: import.meta.dirname,
  typescript: {
    projectService: {
      allowDefaultProject: ['*.js', '*.mjs', '*.cjs', '**/*.config.ts', '**/*.config.js'],
      defaultProject: 'tsconfig.eslint.json'
    }
  },
  workspacePrefixes: ['@santi020k']
}, {
  files: ['**/*.astro', '**/*.css'],
  languageOptions: {
    parserOptions: {
      project: false,
      projectService: false
    }
  },
  rules: {
    'better-tailwindcss/no-unknown-classes': 'off'
  },
  ...tseslint.configs.disableTypeChecked
}, {
  files: ['**/*.config.ts', '**/*.config.js', '**/*.config.mjs'],
  languageOptions: {
    parserOptions: {
      projectService: false
    }
  },
  ...tseslint.configs.disableTypeChecked
})

export default [
  ...config,
  {
    files: ['apps/docs/**/*.astro'],
    rules: {
      'better-tailwindcss/no-unknown-classes': ['error', { ignore: ['^ui-'] }]
    }
  }
]
