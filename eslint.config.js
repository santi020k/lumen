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

const docsRoot = `${import.meta.dirname}/apps/docs`

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
    'apps/next-smoke': {
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
      allowDefaultProject: [
        '*.js',
        '*.mjs',
        '*.cjs',
        '**/*.config.ts',
        '**/*.config.js',
        'tests/visual/components.spec.ts',
        'tests/**/*.ts'
      ],
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
  files: ['packages/lumen/templates/**/*.ts', 'packages/lumen/templates/**/*.tsx'],
  languageOptions: {
    parserOptions: {
      project: false,
      projectService: false
    }
  },
  ...tseslint.configs.disableTypeChecked
}, {
  files: ['tests/a11y/**/*.ts', 'tests/visual/**/*.ts'],
  languageOptions: {
    parserOptions: {
      project: false,
      projectService: false
    }
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
      'better-tailwindcss/no-unknown-classes': ['error', {
        entryPoint: `${docsRoot}/src/styles/global.css`,
        ignore: ['^docs-', '^lumen-logo', '^ui-']
      }]
    },
    settings: {
      'better-tailwindcss': {
        cwd: docsRoot,
        entryPoint: `${docsRoot}/src/styles/global.css`
      }
    }
  },
  {
    files: ['packages/lumen/templates/**/*.{astro,tsx}'],
    rules: {
      'better-tailwindcss/no-unknown-classes': 'off'
    }
  }
]
