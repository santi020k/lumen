import type { Ref } from 'react'

import { Badge, Button, Card, CodeTabs, ScrollArea, Stack } from '@santi020k/lumen-react'
import { ArrowLeft, ArrowRight, CodeXml, Icon, ListChecks } from '@santi020k/lumen-react/icons'

import type { PluginResult } from './model.js'
import { isWebPlatform, platforms } from './targets.js'

const setupTab = (result: PluginResult) => {
  const webModule = result.target === 'react' || result.target === 'elements'

  if (webModule) return { value: 'layout', label: 'Setup', code: result.layout, language: 'javascript' }

  return { value: 'layout', label: result.target === 'astro' ? 'Layout' : 'Setup', code: result.layout, language: result.target === 'astro' ? 'html' : 'text' }
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

export const DesignReview = ({ headingRef, result, onBack, onNext }: StepProps & { onNext: () => void }) => {
  const review = result.findings.filter(finding => finding.status !== 'verified')
  const verified = result.findings.length - review.length

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
        <ScrollArea
          aria-label="Items to review"
          className="findings-scroll"
          role="region"
          tabIndex={0}
        >
          <ul className="findings">
            {review.map(finding => (
              <li key={`${finding.nodeId}-${finding.message}`}>
                <div className="finding-title">
                  <strong>{finding.name}</strong>
                  <span>{finding.status}</span>
                </div>
                <span>{finding.message}</span>
              </li>
            ))}
          </ul>
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
      <p className="review-intro">Copy a tab or save a file. The AI handoff includes design context and review notes.</p>
      <CodeTabs
        ariaLabel="Conversion output"
        className="conversion-code"
        items={[
          ...(result.code ? [{ value: 'starter', label: 'Starter', code: result.code, language: output.language }] : []),
          { value: 'handoff', label: 'AI handoff', code: result.handoff, language: 'text' },
          setupTab(result)
        ]}
      />
      <Stack direction="horizontal" gap="sm" wrap>
        <Button
          onClick={() => {
            download(result.handoff, 'lumen-figma-handoff.md')
          }}
          size="sm"
        >
          Save AI handoff
        </Button>
        {result.code && (
          <Button
            onClick={() => {
              download(result.code, 'LumenSelection.' + output.extension)
            }}
            size="sm"
            variant="outline"
          >
            Save
            {' '}
            {output.label}
            {' '}
            starter
          </Button>
        )}
        {isWebPlatform(result.target) && result.target !== 'astro' && (
          <Button
            onClick={() => {
              download(result.layout, 'lumen-setup.js')
            }}
            size="sm"
            variant="outline"
          >
            Save app setup
          </Button>
        )}
      </Stack>
    </Card>
  )
}
