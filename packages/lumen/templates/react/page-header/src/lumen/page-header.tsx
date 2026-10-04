import type { ReactNode } from 'react'

import { Badge, Breadcrumb, Link, Stack, Typography } from '@santi020k/lumen-react'

export interface PageHeaderRecipeProps {
  actions?: ReactNode
  actionsLabel?: string
  breadcrumbLabel?: string
  breadcrumbs?: readonly { href: string, label: string }[]
  description?: string
  headingId: string
  status?: string
  title: string
}

const emptyBreadcrumbs: NonNullable<PageHeaderRecipeProps['breadcrumbs']> = []

export const PageHeaderRecipe = ({ actions, actionsLabel = 'Page actions', breadcrumbLabel = 'Breadcrumb', breadcrumbs = emptyBreadcrumbs, description, headingId, status, title }: PageHeaderRecipeProps) => (
  <header aria-labelledby={headingId}>
    <Stack gap="group">
      {breadcrumbs.length > 0 && (
        <Breadcrumb aria-label={breadcrumbLabel}>
          <ol>
            {breadcrumbs.map(item => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
            <li aria-current="page">{title}</li>
          </ol>
        </Breadcrumb>
      )}
      <Stack direction="horizontal" align="start" justify="between" gap="group" wrap>
        <Stack gap="related" style={{ flex: '1 1 20rem', minWidth: 0, overflowWrap: 'anywhere' }}>
          <Typography>
            <h1 id={headingId}>{title}</h1>
            {description && <p>{description}</p>}
          </Typography>
          {status && <Badge variant="outline" style={{ alignSelf: 'flex-start' }}>{status}</Badge>}
        </Stack>
        {actions && <Stack direction="horizontal" align="center" gap="related" wrap role="group" aria-label={actionsLabel}>{actions}</Stack>}
      </Stack>
    </Stack>
  </header>
)
