import {
  defineConfig,
  Extension,
} from '@santi020k/eslint-config-basic'

const docsRoot = `${import.meta.dirname}/apps/docs`

const docsCustomClassPatterns = [
  '^animated-logo-demo(?:$|__)',
  '^component-doc(?:$|-)',
  '^components(?:$|-)',
  '^docs-',
  '^figma(?:$|-)',
  '^framework-(?:example|page)(?:$|__)',
  '^home(?:$|-)',
  '^icons(?:$|-)',
  '^is-current$',
  '^lumen-logo',
  '^mcp(?:$|-)',
  '^primitive-showcase(?:$|__)',
  '^skill(?:$|-)',
  '^speed-dial-example(?:$|__)',
  '^theme(?:$|-)',
  '^ui-'
]

const config = await defineConfig({
  extensions: [Extension.Boundaries, Extension.Unicorn],
  ignores: [
    '**/CHANGELOG.md',
    '**/*.css',
    '**/*.d.ts',
    'packages/astro/components/**/*.astro',
    'packages/lumen/templates/**'
  ],
  tailwind: {
    noUnknownClasses: false
  },
  typescript: {
    untypedFiles: [
      'packages/lumen/templates/**/*.{ts,tsx}',
      'tests/a11y/**/*.ts',
      'tests/visual/**/*.ts'
    ]
  },
  workspacePrefixes: ['@santi020k']
}, {
  files: ['**/*.css'],
  languageOptions: {
    parserOptions: {
      project: false,
      projectService: false
    }
  },
  rules: {
    'better-tailwindcss/no-unknown-classes': 'off'
  },
})

const betterTailwindcssPlugin = config
  .find(({ plugins }) => plugins?.['better-tailwindcss'])
  ?.plugins?.['better-tailwindcss']

const disabledTailwindRules = Object.fromEntries(
  Object.keys(betterTailwindcssPlugin?.rules ?? {})
    .map(rule => [`better-tailwindcss/${rule}`, 'off'])
)

const stylisticPlugin = config
  .find(({ plugins }) => plugins?.['@stylistic'])
  ?.plugins?.['@stylistic']

const disabledStylisticRules = Object.fromEntries(
  Object.keys(stylisticPlugin?.rules ?? {})
    .map(rule => [`@stylistic/${rule}`, 'off'])
)

export default [
  ...config,
  {
    name: 'temporary-formatting-compatibility',
    rules: disabledStylisticRules
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: false
    },
    name: 'local-generated-runtime-directives'
  },
  {
    files: ['packages/mcp/**/*.{cjs,js,mjs,ts,tsx}'],
    name: 'mcp-established-formatting',
    rules: {
      ...disabledStylisticRules,
      'simple-import-sort/exports': 'off',
      'simple-import-sort/imports': 'off'
    }
  },
  {
    files: ['packages/react/src/**/*.{ts,tsx}'],
    name: 'react-compiler-adoption',
    rules: {
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off'
    }
  },
  {
    files: ['packages/astro/runtime/UIPrimitives.astro'],
    name: 'generated-runtime-types',
    rules: {
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['**/*.{astro,js,jsx,ts,tsx}'],
    name: 'local-tailwind-opt-in',
    plugins: {
      'better-tailwindcss': betterTailwindcssPlugin
    },
    rules: disabledTailwindRules
  },
  {
    files: ['apps/docs/**/*.astro'],
    plugins: {
      'better-tailwindcss': betterTailwindcssPlugin
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': ['error', {
        entryPoint: `${docsRoot}/src/styles/global.css`,
        ignore: docsCustomClassPatterns
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
    plugins: {
      'better-tailwindcss': betterTailwindcssPlugin
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': 'off'
    }
  },
  {
    files: ['**/*.astro', '**/*.astro/**'],
    name: 'astro-virtual-script-compatibility',
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'simple-import-sort/imports': 'off'
    }
  },
  {
    files: ['apps/docs/**/*.astro'],
    name: 'docs-established-correctness',
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off'
    }
  },
  {
    files: [
      'apps/next-smoke/**/*.{ts,tsx}',
      'packages/react/src/**/*.{ts,tsx}'
    ],
    name: 'established-import-order',
    rules: {
      'simple-import-sort/imports': 'off'
    }
  }
]
