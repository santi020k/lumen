import { type Ref, useState } from 'react'

import { Badge, Button, Card, CodeTabs, Field, Label, ScrollArea, Select, Stack } from '@santi020k/lumen-react'
import { ArrowLeft, ArrowRight, CodeXml, Download, Icon, ListChecks } from '@santi020k/lumen-react/icons'

import type { PluginResult } from './model.js'
import { platforms } from './targets.js'

const setupTab = (result: PluginResult) => {
  const webModule = result.target === 'react' || result.target === 'elements'

  if (webModule) return { value: 'layout', label: 'Install', code: result.layout, language: 'javascript' }

  return { value: 'layout', label: result.target === 'astro' ? 'Layout' : 'Install', code: result.layout, language: result.target === 'astro' ? 'html' : 'text' }
}

const download = (contents: string, name: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')

  anchor.href = url

  anchor.download = name

  anchor.click()

  URL.revokeObjectURL(url)
}

interface StepProps {
  headingRef: Ref<HTMLHeadingElement>
  result: PluginResult
  onBack: () => void
}

const filters = { all: 'All notes', unsupported: 'Unsupported', review: 'Needs review', inferred: 'Inferred' } as const

type ReviewFilter = keyof typeof filters

export const DesignReview = ({ headingRef, result, onBack, onNext }: StepProps & { onNext: () => void }) => {
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const review = result.findings.filter(finding => finding.status !== 'verified')
  const verified = result.findings.length - review.length
  const visible = filter === 'all' ? review : review.filter(finding => finding.status === filter)

  const options = Object.entries(filters).map(([value, label]) => ({
    value,
    label: `${label} (${value === 'all' ? review.length : review.filter(finding => finding.status === value).length})`
  }))

  return (
    <Card
      aria-labelledby="findings-title"
      as="section"
      className="result-card"
    >
      <div className="section-heading">
        <h2 id="findings-title" ref={headingRef} tabIndex={-1}>
          <Icon icon={ListChecks} />
          Design review
        </h2>
        <Badge variant={verified > 0 ? 'success' : 'outline'}>
          {verified}
          {' '}
          verified
        </Badge>
      </div>
      <p className="review-intro">
        Lumen
        {' '}
        {result.lumenVersion}
        {' '}
        ·
        {' '}
        {review.length}
        {' '}
        {review.length === 1 ? 'item to review' : 'items to review'}
      </p>
      {review.length > 0 && (
        <Field className="review-filter">
          <Label htmlFor="finding-filter" id="finding-filter-label">Show findings</Label>
          <Select
            aria-labelledby="finding-filter-label"
            id="finding-filter"
            onValueChange={value => {
              if (value === 'all' || value === 'unsupported' || value === 'review' || value === 'inferred') setFilter(value)
            }}
            options={options}
            value={filter}
          />
        </Field>
      )}
      {review.length === 0 && <p className="review-intro">No additional review notes for this selection.</p>}
      {review.length > 0 && (
        <ScrollArea
          aria-label="Items to review"
          className="findings-scroll"
          key={filter}
          role="region"
          tabIndex={0}
        >
          <ul className="findings">
            {visible.map(finding => (
              <li data-status={finding.status} key={`${finding.nodeId}-${finding.message}`}>
                <div className="finding-title">
                  <strong>{finding.name}</strong>
                  <span>{finding.status}</span>
                </div>
                <span>{finding.message}</span>
              </li>
            ))}
          </ul>
          {visible.length === 0 && (
            <p className="review-intro">
              {`No ${filters[filter].toLowerCase()} findings in this selection.`}
            </p>
          )}
        </ScrollArea>
      )}
      {!result.code && <p className="review-intro">No starter is available for this selection. You can still export the setup and AI handoff.</p>}
      <div className="step-actions">
        <Button onClick={onBack} variant="outline">
          <Icon icon={ArrowLeft} />
          Back to setup
        </Button>
        <Button onClick={onNext}>
          Open handoff
          <Icon icon={ArrowRight} />
        </Button>
      </div>
    </Card>
  )
}

export const ProjectHandoff = ({ headingRef, result, onBack }: StepProps) => {
  const output = platforms[result.target]
  let setupFile = 'lumen-install.txt'

  if (result.target === 'react' || result.target === 'elements') setupFile = 'lumen-setup.js'

  if (result.target === 'astro') setupFile = 'LumenLayout.astro'

  return (
    <Card aria-labelledby="handoff-title" as="section" className="result-card">
      <div className="section-heading">
        <h2 id="handoff-title" ref={headingRef} tabIndex={-1}>
          <Icon icon={CodeXml} />
          Project handoff
        </h2>
        <Button onClick={onBack} size="sm" variant="ghost">
          <Icon icon={ArrowLeft} size="sm" />
          Back to review
        </Button>
      </div>
      <p className="review-intro">Copy the code or save your files. The AI handoff includes all design context and review notes.</p>
      <CodeTabs
        ariaLabel="Conversion output"
        className="conversion-code"
        items={[
          ...(result.code ? [{ value: 'starter', label: 'Starter', code: result.code, language: output.language }] : []),
          { value: 'handoff', label: 'AI handoff', code: result.handoff, language: 'text' },
          setupTab(result)
        ]}
      />
      <Stack className="handoff-actions" direction="horizontal" gap="sm" wrap>
        {result.code && (
          <Button
            onClick={() => {
              download(result.code, 'LumenSelection.' + output.extension)
            }}
            size="sm"
          >
            <Icon icon={Download} size="sm" />
            Save starter
          </Button>
        )}
        <Button
          onClick={() => {
            download(result.handoff, 'lumen-figma-handoff.md')
          }}
          size="sm"
          variant={result.code ? 'outline' : 'default'}
        >
          Save AI handoff
        </Button>
        <Button
          onClick={() => {
            download(result.layout, setupFile)
          }}
          size="sm"
          variant="ghost"
        >
          {result.target === 'astro' ? 'Save layout' : 'Save install file'}
        </Button>
      </Stack>
    </Card>
  )
}
