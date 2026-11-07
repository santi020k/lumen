import { useEffect, useRef, useState } from 'react'

import '@santi020k/lumen-react/styles/foundation.css'
import '@santi020k/lumen-react/styles/components/badge.css'
import '@santi020k/lumen-react/styles/components/button.css'
import '@santi020k/lumen-react/styles/components/card.css'
import '@santi020k/lumen-react/styles/components/code-tabs.css'
import '@santi020k/lumen-react/styles/components/label.css'
import '@santi020k/lumen-react/styles/components/select.css'
import '@santi020k/lumen-react/styles/components/stack.css'
import '@santi020k/lumen-react/styles/components/eyebrow.css'
import '@santi020k/lumen-react/styles/components/field.css'
import '@santi020k/lumen-react/styles/components/icon.css'
import '@santi020k/lumen-react/styles/components/image.css'
import '@santi020k/lumen-react/styles/components/link.css'
import '@santi020k/lumen-react/styles/components/scroll-area.css'
import '@santi020k/lumen-react/styles/components/radio-group.css'
import '@santi020k/lumen-react/styles/components/stepper.css'
import './styles.css'

import { Button, Card, Eyebrow, Image, Link, Stepper } from '@santi020k/lumen-react'
import { ArrowRight, ArrowUpRight, CircleAlert, Frame, Icon, Info, ScanSearch, SlidersHorizontal } from '@santi020k/lumen-react/icons'

import pluginIcon from '../community/assets/icon.png'

import { DesignReview, ProjectHandoff } from './export-result.js'
import { ExportSettings } from './export-settings.js'
import type { PluginBridge, PluginResult } from './model.js'
import { SelectionArt } from './selection-art.js'
import type { ExportTarget } from './targets.js'
import { appearancesFor, defaultTarget, isBrandMode, isNativeTarget, platforms } from './targets.js'

const stages = ['Setup', 'Review', 'Handoff']

type InspectorStep = { page: 'setup', result: PluginResult | null } | { page: 'review' | 'handoff', result: PluginResult }

const initialStep: InspectorStep = { page: 'setup', result: null }
const stepIndex = { setup: 0, review: 1, handoff: 2 }

interface SelectionSummaryProps {
  step: InspectorStep
  selection: string | null
  target: ExportTarget
}

const appearanceName = (target: ExportTarget) => {
  if (isBrandMode(target.appearance)) return `santi020k ${target.appearance === 'santi020k-dark' ? 'Dark' : 'Light'}`

  if (isNativeTarget(target)) return 'Project appearance'

  return appearancesFor(target.version).find(option => option.value === target.appearance)?.label
}

const SelectionSummary = ({ step, selection, target }: SelectionSummaryProps) => {
  if (step.page !== 'setup') {
    return (
      <div className="result-context">
        <Icon icon={Frame} size="sm" />
        <strong>{selection ?? step.result.selectionName}</strong>
        <span className="context-details">
          {platforms[step.result.target].label}
          {' · '}
          {step.result.lumenVersion}
          {' · '}
          {appearanceName(target)}
        </span>
      </div>
    )
  }

  const platform = target.platform ?? 'astro'

  return (
    <Card
      aria-labelledby="selection-title"
      as="section"
      className="selection-card"
      data-theme="dark"
    >
      <div className="selection-copy">
        <Eyebrow>
          <Icon icon={Frame} size="sm" />
          Selected design
        </Eyebrow>
        <h2 id="selection-title">{selection ?? 'Nothing selected'}</h2>
        <p>
          {selection ? `Ready to inspect for ${platforms[platform].label}.` : 'Select one frame or component to begin.'}
        </p>
      </div>
      <SelectionArt />
    </Card>
  )
}

export const Panel = ({ bridge, preview }: { bridge: PluginBridge, preview: boolean }) => {
  const [target, setTarget] = useState<ExportTarget>(defaultTarget)
  const [selection, setSelection] = useState<string | null>(null)
  const [step, setStep] = useState<InspectorStep>(initialStep)
  const [handoffVisited, setHandoffVisited] = useState(false)
  const setupHeadingRef = useRef<HTMLHeadingElement>(null)
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
  const handoffHeadingRef = useRef<HTMLHeadingElement>(null)
  const { result } = step
  const previousPageRef = useRef(step.page)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Select one frame or component in Figma.')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (previousPageRef.current !== step.page) {
      const heading = { setup: setupHeadingRef, review: reviewHeadingRef, handoff: handoffHeadingRef }[step.page]

      heading.current?.focus()
    }

    previousPageRef.current = step.page
  }, [step.page])

  useEffect(() => bridge.subscribe(message => {
    if (message.type !== 'selection') setBusy(false)

    setFailed(message.type === 'error')

    setHandoffVisited(false)

    if (message.type === 'selection') {
      setSelection(message.name)

      setStep(initialStep)

      setStatus(message.name ? 'Ready to inspect this selection.' : 'Select one frame or component in Figma.')
    } else if (message.type === 'result') {
      setStep({ page: 'review', result: message.result })

      setStatus(message.result.code ? 'Analysis ready. Review the findings before using the starter.' : 'No supported components in this selection. Review the handoff for details.')
    } else {
      setStep(initialStep)

      setStatus(message.message)
    }
  }), [bridge])

  const changeTarget = (next: ExportTarget) => {
    setTarget(next)

    setHandoffVisited(false)

    setStep(initialStep)

    setFailed(false)

    setStatus(selection ? 'Inspect the selection to export with these settings.' : 'Select one frame or component in Figma.')
  }

  const inspect = () => {
    if (step.result) {
      setStep({ page: 'review', result: step.result })

      return
    }

    setBusy(true)

    setFailed(false)

    setStatus('Inspecting component identities and design properties…')

    bridge.analyze(target)
  }

  const action = step.result ? { icon: ArrowRight, label: 'View design review' } : { icon: ScanSearch, label: 'Inspect selection' }

  return (
    <main className="plugin-panel">
      <header className="plugin-header">
        <Image alt="" height={36} loading="eager" radius="none" src={pluginIcon} width={36} />
        <h1>
          Lumen
          {' '}
          <span>for Figma</span>
        </h1>
        <span className="offline-label">Runs locally</span>
      </header>
      <SelectionSummary selection={selection} step={step} target={target} />
      <Stepper aria-label="Export progress" className="flow-steps" currentStep={stepIndex[step.page]} steps={stages} />
      {step.page === 'setup' && (
        <Card
          aria-labelledby="settings-title"
          as="section"
          className="settings-card"
        >
          <h2 id="settings-title" ref={setupHeadingRef} tabIndex={-1}>
            <Icon icon={SlidersHorizontal} />
            Export settings
          </h2>
          <ExportSettings busy={busy} changeTarget={changeTarget} target={target} />
          <Button
            disabled={!selection || busy}
            loading={busy}
            onClick={inspect}
          >
            <Icon icon={action.icon} />
            {action.label}
          </Button>
          <p className="status" data-error={failed} role="status">
            <Icon icon={failed ? CircleAlert : Info} size="sm" />
            {status}
          </p>
        </Card>
      )}
      {result && (
        <>
          <div hidden={step.page !== 'review'}>
            <DesignReview
              headingRef={reviewHeadingRef}
              onBack={() => {
                setStep({ page: 'setup', result })
              }}
              onNext={() => {
                setHandoffVisited(true)

                setStep({ page: 'handoff', result })
              }}
              result={result}
            />
          </div>
          {handoffVisited && (
            <div hidden={step.page !== 'handoff'}>
              <ProjectHandoff
                headingRef={handoffHeadingRef}
                onBack={() => {
                  setStep({ page: 'review', result })
                }}
                result={result}
              />
            </div>
          )}
        </>
      )}
      <footer className="plugin-footer">
        {preview && <p className="preview-note">Local preview · Synthetic settings screen. No Figma file is connected.</p>}
        <div className="footer-row">
          <p>Review design text before sharing a handoff.</p>
          <Link href="https://santi020k.com" newTab>
            By santi020k
            <Icon icon={ArrowUpRight} size="sm" />
          </Link>
        </div>
      </footer>
    </main>
  )
}
