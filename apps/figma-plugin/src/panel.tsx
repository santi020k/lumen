import { useEffect, useState } from 'react'

import '@santi020k/lumen-react/styles.css'
import './styles.css'

import { Badge, Button, Card, CodeTabs, Stack } from '@santi020k/lumen-react'

import type { PluginBridge, PluginResult } from './model.js'

const download = (contents: string, name: string) => {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')

  anchor.href = url

  anchor.download = name

  anchor.click()

  URL.revokeObjectURL(url)
}

export const Panel = ({ bridge, preview }: { bridge: PluginBridge, preview: boolean }) => {
  const [selection, setSelection] = useState<string | null>(null)
  const [result, setResult] = useState<PluginResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Select one frame or component in Figma.')
  const [failed, setFailed] = useState(false)

  useEffect(() => bridge.subscribe(message => {
    setBusy(false)

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

  const findings = result ? result.findings : []
  const verified = findings.filter(finding => finding.status === 'verified').length
  const review = findings.filter(finding => finding.status !== 'verified')

  return (
    <main className="plugin-panel">
      <header className="plugin-header">
        <div className="plugin-wordmark">
          Lumen
          <Badge variant="outline">Beta</Badge>
        </div>
        <h1>
          From your canvas
          <br />
          to your components.
        </h1>
        <p>Inspect a Lumen design and prepare an Astro starter for your coding agent.</p>
      </header>
      {preview && <p className="preview-note">Local preview · Synthetic settings screen. No Figma file is connected.</p>}
      <Card className="selection-card">
        <p className="eyebrow">Selected design</p>
        <h2>{selection ?? 'Nothing selected'}</h2>
        <p className="selection-meta">Astro · 6 supported Lumen components</p>
        <Button
          disabled={!selection || busy}
          loading={busy}
          onClick={() => {
            setBusy(true)

            setFailed(false)

            setResult(null)

            setStatus('Inspecting component identities and design properties…')

            bridge.analyze()
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
          <section aria-labelledby="handoff-title">
            <h2 id="handoff-title">Take it into your project</h2>
            <p className="review-intro">Give the AI handoff to your coding agent. It contains the design context, starter, and checks to run.</p>
            <CodeTabs
              ariaLabel="Conversion output"
              className="conversion-code"
              items={[
                { value: 'astro', label: 'Astro starter', code: result.code, language: 'html' },
                { value: 'handoff', label: 'AI handoff', code: result.handoff, language: 'text' }
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
                  download(result.code, 'LumenSelection.astro')
                }}
                size="sm"
                variant="outline"
              >
                Save Astro starter
              </Button>
            </Stack>
          </section>
        </Stack>
      )}
      <footer className="plugin-footer">
        <p>Beta · Generated output needs review. Analysis stays in Figma; sharing the handoff is your choice.</p>
        <a href="https://santi020k.com" rel="noopener noreferrer" target="_blank">By santi020k</a>
      </footer>
    </main>
  )
}
