'use client'

import type {
  ButtonLinkProps,
  ButtonProps,
  InputProps
} from '@santi020k/lumen-react'
import {
  Button,
  ButtonLink,
  Input
} from '@santi020k/lumen-react'

export const ProductButton = (props: ButtonProps) => (
  <Button data-slot="product-button" variant="secondary" {...props} />
)

export const ProductButtonLink = (props: ButtonLinkProps) => (
  <ButtonLink data-slot="product-button-link" variant="ghost" {...props} />
)

export const ProductInput = (props: InputProps) => (
  <Input data-slot="product-input" visualSize="sm" {...props} />
)
