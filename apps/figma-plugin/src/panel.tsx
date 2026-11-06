import { useEffect, useState } from 'react'

import '@santi020k/lumen-react/styles/foundation.css'
import '@santi020k/lumen-react/styles/components/badge.css'
import '@santi020k/lumen-react/styles/components/button.css'
import '@santi020k/lumen-react/styles/components/card.css'
import '@santi020k/lumen-react/styles/components/code-tabs.css'
import '@santi020k/lumen-react/styles/components/label.css'
import '@santi020k/lumen-react/styles/components/select.css'
import '@santi020k/lumen-react/styles/components/stack.css'
import './styles.css'

import { Badge, Button, Card, CodeTabs, Label, Select, Stack } from '@santi020k/lumen-react'

import { componentKeys } from './contracts.js'
import type { PluginBridge, PluginResult } from './model.js'
import type { ExportTarget } from './targets.js'
import { adapterVersion, appearancesFor, defaultTarget, isPlatform, isVersion, platforms, supportsAppearance, versions } from './targets.js'

const platformOptions = Object.entries(platforms).map(([value, { label }]) => ({ value, label }))

const download = (contents: string, name: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')

  anchor.href = url

  anchor.download = name

  anchor.click()

  URL.revokeObjectURL(url)
}

const ExportFiles = ({ result }: { result: PluginResult }) => {
  const output = platforms[result.target]

  return (
    <section aria-labelledby="handoff-title">
      <h2 id="handoff-title">Take it into your project</h2>
      <p className="review-intro">Give the AI handoff to your coding agent. It contains the design context, starter, and checks to run.</p>
      <CodeTabs
        ariaLabel="Conversion output"
        className="conversion-code"
        items={[
          { value: 'starter', label: `${output.label} starter`, code: result.code, language: output.language },
          { value: 'handoff', label: 'AI handoff', code: result.handoff, language: 'text' },
          { value: 'layout', label: result.target === 'astro' ? 'Astro layout' : `${output.label} setup`, code: result.layout, language: result.target === 'astro' ? 'html' : 'javascript' }
        ]}
      />
      <Stack className="download-actions" direction="horizontal" gap="sm" wrap>
        <Button
          onClick={() => {
            download(result.handoff, 'lumen-figma-handoff.md')
          }}
          size="sm"
        >
          Save AI handoff
        </Button>
        <Button
          onClick={() => {
            download(result.code, `LumenSelection.${output.extension}`)
          }}
          size="sm"
          variant="outline"
        >
          {`Save ${output.label} starter`}
        </Button>
        {result.target !== 'astro' && (
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
    </section>
  )
}

export const Panel = ({ bridge, preview }: { bridge: PluginBridge, preview: boolean }) => {
  const [target, setTarget] = useState(defaultTarget)
  const [selection, setSelection] = useState<string | null>(null)
  const [result, setResult] = useState<PluginResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Select one frame or component in Figma.')
  const [failed, setFailed] = useState(false)

  useEffect(() => bridge.subscribe(message => {
    if (message.type !== 'selection') setBusy(false)

    setFailed(message.type === 'error')

    if (message.type === 'selection') {
      setSelection(message.name)

      setResult(null)

      setStatus(message.name ? 'Ready to inspect this selection.' : 'Select one frame or component in Figma.')
    } else if (message.type === 'result') {
      setResult(message.result)

      setStatus('Analysis ready. Review the findings before using the starter.')
    } else {
      setResult(null)

      setStatus(message.message)
    }
  }), [bridge])

  const changeTarget = (next: ExportTarget) => {
    setTarget(next)

    setResult(null)

    setFailed(false)

    setStatus(selection ? 'Inspect the selection to export with these settings.' : 'Select one frame or component in Figma.')
  }

  const platform = target.platform ?? 'astro'
  const versionOptions = versions.map(value => ({ value, label: platform === 'astro' ? `Lumen Astro ${value}` : `Lumen ${value} · ${platforms[platform].label} ${adapterVersion(platform, value)}` }))
  const findings = result ? result.findings : []
  const verified = findings.filter(finding => finding.status === 'verified').length
  const review = findings.filter(finding => finding.status !== 'verified')

  return (
    <main className="plugin-panel">
      <header className="plugin-header">
        <h1>Lumen for Figma</h1>
        <p>Export the selected design to your framework with setup instructions and a handoff for your coding agent.</p>
      </header>
      {preview && <p className="preview-note">Local preview · Synthetic settings screen. No Figma file is connected.</p>}
      <Card className="selection-card">
        <p className="eyebrow">Selected design</p>
        <h2>{selection ?? 'Nothing selected'}</h2>
        <p className="selection-meta">
          {Object.keys(componentKeys).length}
          {' '}
          supported components
        </p>
        <div className="target-field">
          <Label htmlFor="lumen-platform" id="platform-label">Framework</Label>
          <Select
            aria-labelledby="platform-label"
            disabled={busy}
            id="lumen-platform"
            onValueChange={next => {
              if (isPlatform(next)) changeTarget({ ...target, platform: next })
            }}
            options={platformOptions}
            value={platform}
          />
        </div>
        <div className="target-field">
          <Label htmlFor="lumen-version" id="version-label">Target version</Label>
          <Select
            aria-labelledby="version-label"
            disabled={busy}
            id="lumen-version"
            onValueChange={version => {
              if (isVersion(version)) changeTarget({ ...target, version, appearance: supportsAppearance(version, target.appearance) ? target.appearance : 'project' })
            }}
            options={versionOptions}
            value={target.version}
          />
        </div>
        <div className="target-field">
          <Label htmlFor="lumen-appearance" id="appearance-label">Project appearance</Label>
          <Select
            aria-labelledby="appearance-label"
            disabled={busy}
            id="lumen-appearance"
            onValueChange={appearance => {
              if (supportsAppearance(target.version, appearance)) changeTarget({ ...target, appearance })
            }}
            options={appearancesFor(target.version)}
            value={target.appearance}
          />
        </div>
        <Button
          disabled={!selection || busy}
          loading={busy}
          onClick={() => {
            setBusy(true)

            setFailed(false)

            setResult(null)

            setStatus('Inspecting component identities and design properties…')

            bridge.analyze(target)
          }}
        >
          Inspect selection
        </Button>
      </Card>
      <p aria-live="polite" className={failed ? 'status status-error' : 'status'} role="status">{status}</p>
      {result && (
        <Stack gap="lg">
          <section aria-labelledby="findings-title">
            <div className="section-heading">
              <h2 id="findings-title">Design review</h2>
              <Badge variant="outline">
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
              items to review
            </p>
            {review.length > 0 && (
              <ul className="findings">
                {review.map(finding => (
                  <li key={`${finding.nodeId}-${finding.message}`}>
                    <strong>{finding.name}</strong>
                    <span>{finding.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <ExportFiles result={result} />
        </Stack>
      )}
      <footer className="plugin-footer">
        <p>Analysis runs locally. Review selected text before sharing the handoff.</p>
        <a href="https://santi020k.com" rel="noopener noreferrer" target="_blank">By santi020k</a>
      </footer>
    </main>
  )
}
