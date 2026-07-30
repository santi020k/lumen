'use client'

import {
  ProductButton,
  ProductButtonLink,
  ProductInput
} from './lumen-wrappers'

export const ClientPanel = () => (
  <section aria-label="Client wrapper boundary">
    <ProductInput aria-label="Project name" />
    <ProductButton type="button">Save</ProductButton>
    <ProductButtonLink href="/docs">Docs</ProductButtonLink>
  </section>
)
