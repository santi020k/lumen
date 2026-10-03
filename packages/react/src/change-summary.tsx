import type { ComponentPropsWithRef } from 'react'

import { composeClassName, type LumenChangeSummaryItem } from '@santi020k/lumen-core'

export interface ChangeSummaryProps extends ComponentPropsWithRef<'section'> {
  items?: readonly LumenChangeSummaryItem[]
  label?: string
  beforeLabel?: string
  afterLabel?: string
  changedLabel?: string
  unchangedLabel?: string
  /** Localized count text, supplied by the host. */
  summary?: string
}

const noChanges: readonly LumenChangeSummaryItem[] = []

export const ChangeSummary = ({
  items = noChanges, label = 'Changes', beforeLabel = 'Before', afterLabel = 'After', changedLabel = 'Changed',
  unchangedLabel = 'Unchanged', summary, className, children, ...props
}: ChangeSummaryProps) => (
  <section className={composeClassName('ui-change-summary', className)} aria-label={label} {...props}>
    <h3 className="ui-change-summary__heading">{label}</h3>
    {summary && <p className="ui-change-summary__summary">{summary}</p>}
    <dl className="ui-change-summary__list">
      {items.map(item => (
        <div className="ui-change-summary__item" data-changed={item.changed} key={item.id}>
          <dt>
            {item.label}
            <span className="ui-change-summary__state">{item.changed ? changedLabel : unchangedLabel}</span>
          </dt>
          <dd>
            <span className="ui-change-summary__value-label">{beforeLabel}</span>
            {item.before}
          </dd>
          <dd>
            <span className="ui-change-summary__value-label">{afterLabel}</span>
            {item.after}
          </dd>
        </div>
      ))}
    </dl>
    {children}
  </section>
)
