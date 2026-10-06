import type { ReactNode } from 'react'

import { Badge, Card, Descriptions, type DescriptionsProps, FormattedDate, Grid, Stack, Timeline, TimelineItem } from '@santi020k/lumen-react'

export interface RecordWorkspaceEvent {
  id: string
  dateTime: string
  dateLabel: string
  title: string
  description: ReactNode
  stateLabel?: string
  /** Authored link or action connecting a correction to its original event. */
  related?: ReactNode
}

export interface RecordWorkspaceRecipeProps {
  title: string
  headingId: string
  status: ReactNode
  actions?: ReactNode
  facts: NonNullable<DescriptionsProps['items']>
  children?: ReactNode
  events: readonly RecordWorkspaceEvent[]
  historyLabel: string
  emptyHistoryLabel: string
  /** Supply ErrorState for failures or loading feedback instead of claiming empty history. */
  historyFeedback?: ReactNode
}

/** Generic record composition. Balances, event order and correction semantics remain host-owned. */
export const RecordWorkspaceRecipe = ({
  title, headingId, status, actions, facts, children, events, historyLabel, emptyHistoryLabel, historyFeedback
}: RecordWorkspaceRecipeProps) => (
  <section aria-labelledby={headingId}>
    <Stack gap="group">
      <Stack direction="horizontal" wrap gap="related">
        <h2 id={headingId}>{title}</h2>
        {status}
        {actions}
      </Stack>
      <Grid minItemWidth="18rem" gap="group">
        <Card>
          <Descriptions items={facts} />
          {children}
        </Card>
        <Card>
          <h3>{historyLabel}</h3>
          {historyFeedback ?? (events.length === 0 ?
            <p>{emptyHistoryLabel}</p> :
            (
              <Timeline aria-label={historyLabel}>
                {events.map(event => (
                  <TimelineItem key={event.id}>
                    <FormattedDate dateTime={event.dateTime}>{event.dateLabel}</FormattedDate>
                    <h4>{event.title}</h4>
                    {event.stateLabel && <Badge variant="outline">{event.stateLabel}</Badge>}
                    <div>{event.description}</div>
                    {event.related}
                  </TimelineItem>
                ))}
              </Timeline>
            ))}
        </Card>
      </Grid>
    </Stack>
  </section>
)
