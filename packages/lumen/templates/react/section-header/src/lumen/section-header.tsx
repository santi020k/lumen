import type { ReactNode } from 'react'

import { Badge, Stack, Typography } from '@santi020k/lumen-react'

export interface SectionHeaderRecipeProps {
  actions?: ReactNode
  actionsLabel?: string
  count?: string
  description?: string
  headingId: string
  level?: 2 | 3 | 4 | 5 | 6
  title: string
}

export const SectionHeaderRecipe = ({ actions, actionsLabel = 'Section actions', count, description, headingId, level = 2, title }: SectionHeaderRecipeProps) => {
  const headings = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const
  const Heading = headings[level]

  return (
    <header aria-labelledby={headingId}>
      <Stack direction="horizontal" align="start" justify="between" gap="group" wrap>
        <Stack gap="related" style={{ flex: '1 1 20rem', minWidth: 0, overflowWrap: 'anywhere' }}>
          <Stack direction="horizontal" align="center" gap="related" wrap>
            <Typography><Heading id={headingId}>{title}</Heading></Typography>
            {count !== undefined && <Badge variant="secondary">{count}</Badge>}
          </Stack>
          {description && <Typography><p>{description}</p></Typography>}
        </Stack>
        {actions && <Stack direction="horizontal" align="center" gap="related" wrap role="group" aria-label={actionsLabel}>{actions}</Stack>}
      </Stack>
    </header>
  )
}
