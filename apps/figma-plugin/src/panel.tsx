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

import { componentKeys } from './contracts.js'
import { DesignReview, ProjectHandoff } from './export-result.js'
import { ExportSettings } from './export-settings.js'
import type { PluginBridge, PluginResult } from './model.js'
import { nativeComponents } from './native-design.js'
import { SelectionArt } from './selection-art.js'
import type { ExportTarget } from './targets.js'
import { defaultTarget, isWebPlatform, platforms } from './targets.js'

const stages = ['Setup', 'Review', 'Handoff']

type InspectorStep = { page: 'setup', result: PluginResult | null } | { page: 'review' | 'handoff', result: PluginResult }

const initialStep: InspectorStep = { page: 'setup', result: null }
const stepIndex = { setup: 0, review: 1, handoff: 2 }

interface SelectionSummaryProps {
  step: InspectorStep
  selection: string | null
  target: ExportTarget
}

const SelectionSummary = ({ step, selection, target }: SelectionSummaryProps) => {
  if (step.page !== 'setup') {
    return (
      <div className="result-context">
        <Icon icon={Frame} size="sm" />
        <strong>{selection ?? step.result.selectionName}</strong>
        <span>{platforms[step.result.target].label}</span>
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
          {isWebPlatform(platform) ? Object.keys(componentKeys).length : nativeComponents.length}
          {' supported components for '}
          {platforms[platform].label}
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
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousPageRef = useRef(step.page)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Select one frame or component in Figma.')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (previousPageRef.current !== step.page) headingRef.current?.focus()

    previousPageRef.current = step.page
  }, [step.page])

  useEffect(() => bridge.subscribe(message => {
    if (message.type !== 'selection') setBusy(false)

    setFailed(message.type === 'error')

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
          <h2 id="settings-title" ref={headingRef} tabIndex={-1}>
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
      {step.page === 'review' && (
        <DesignReview
          headingRef={headingRef}
          onBack={() => {
            setStep({ page: 'setup', result: step.result })
          }}
          onNext={() => {
            setStep({ page: 'handoff', result: step.result })
          }}
          result={step.result}
        />
      )}
      {step.page === 'handoff' && (
        <ProjectHandoff
          headingRef={headingRef}
          onBack={() => {
            setStep({ page: 'review', result: step.result })
          }}
          result={step.result}
        />
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
