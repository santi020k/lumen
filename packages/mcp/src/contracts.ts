import * as z from 'zod'

const textSchema = z.string().trim()
const stringsSchema = z.array(textSchema)
const frameworkNameSchema = z.enum(['astro', 'react', 'elements'])
const platformNameSchema = z.enum(['react-native', 'swiftui', 'compose'])

const apiRowSchema = z.strictObject({
  defaultValue: textSchema, description: textSchema, name: textSchema, values: textSchema
})

const behaviorRowSchema = z.strictObject({
  defaultValue: textSchema, description: textSchema, name: textSchema, type: textSchema
})

const frameworkSchema = z.strictObject({
  attributes: stringsSchema.optional(),
  available: z.boolean(),
  behavior: z.strictObject({
    controller: z.array(behaviorRowSchema).optional(),
    description: textSchema.optional(),
    hook: textSchema.optional(),
    mode: z.enum(['adapter', 'built-in', 'hook', 'registration', 'runtime']),
    options: z.array(behaviorRowSchema).optional(),
    runtimeBypass: textSchema.optional(),
    setup: textSchema
  }).optional(),
  example: textSchema.optional(),
  importStatement: textSchema.optional(),
  language: z.enum(['astro', 'html', 'tsx']).optional(),
  packageName: textSchema,
  props: z.array(z.strictObject({ name: textSchema, optional: z.boolean(), type: textSchema })).optional(),
  propsExtends: textSchema.nullable().optional(),
  registration: textSchema.optional(),
  source: textSchema.optional(),
  styleImport: textSchema.optional(),
  tagName: textSchema.optional()
})

// Registry files are either paths or installable file descriptors.
const fileSchema = z.union([textSchema, z.strictObject({
  content: textSchema.optional(), path: textSchema, type: textSchema.optional()
})])

const webComponentSchema = z.strictObject({
  apiReference: z.array(z.strictObject({
    attribute: textSchema, defaultValue: textSchema, description: textSchema, values: textSchema
  })).optional(),
  category: textSchema,
  collections: stringsSchema,
  dependencies: stringsSchema,
  description: textSchema,
  files: z.array(fileSchema).optional(),
  framework: frameworkSchema,
  frameworks: z.array(frameworkNameSchema),
  guidance: z.strictObject({ distinction: textSchema.optional(), when: textSchema }).nullable(),
  kebab: textSchema,
  keyboardInteractions: z.array(z.strictObject({ action: textSchema, key: textSchema })).optional(),
  name: textSchema,
  recipes: stringsSchema,
  runtimeEvents: z.array(z.strictObject({
    detail: textSchema, name: textSchema, target: textSchema, when: textSchema
  })).optional()
})

const nativeComponentSchema = z.strictObject({
  accessibility: textSchema,
  category: textSchema,
  contract: textSchema,
  guidance: textSchema,
  id: textSchema,
  implementation: z.strictObject({
    api: z.array(apiRowSchema).optional(),
    example: textSchema.optional(),
    exportName: textSchema,
    importStatement: textSchema.optional(),
    install: textSchema.optional(),
    language: z.enum(['kotlin', 'swift', 'tsx']).optional(),
    maturity: z.enum(['Experimental', 'Supported']).optional(),
    packageName: textSchema,
    setup: textSchema.optional(),
    source: textSchema.optional(),
    sourceFile: textSchema.optional(),
    symbol: textSchema
  }),
  name: textSchema,
  platform: platformNameSchema,
  source: textSchema.optional(),
  platforms: z.array(platformNameSchema),
  summary: textSchema,
  tier: textSchema
})

const missingSchema = z.strictObject({ found: z.literal(false), message: textSchema })

export const componentOutputSchema = z.union([
  z.strictObject({ component: webComponentSchema, found: z.literal(true) }),
  missingSchema
])
export const nativeComponentOutputSchema = z.union([
  z.strictObject({ component: nativeComponentSchema, found: z.literal(true) }),
  missingSchema
])
export const recipeOutputSchema = z.union([
  z.strictObject({
    found: z.literal(true),
    recipe: z.strictObject({
      categories: stringsSchema,
      components: stringsSchema.optional(),
      description: textSchema,
      examples: z.strictObject({
        astro: textSchema.optional(), elements: textSchema.optional(), react: textSchema.optional()
      }),
      files: z.array(fileSchema).optional(),
      install: z.strictObject({ astro: textSchema, elements: textSchema, react: textSchema }),
      name: textSchema,
      type: textSchema
    })
  }),
  missingSchema
])

export const compatibilityOutputSchema = z.strictObject({
  checks: z.array(z.strictObject({
    catalogVersion: textSchema.nullable(),
    installedVersion: textSchema,
    packageName: textSchema,
    status: z.enum(['match', 'mismatch', 'unknown'])
  })),
  compatible: z.boolean(),
  guidance: textSchema
})
