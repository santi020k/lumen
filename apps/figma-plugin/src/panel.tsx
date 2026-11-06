import { useEffect, useState } from 'react'

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
import './styles.css'

import { Button, Card, Eyebrow, Field, Image, Label, Link, Select } from '@santi020k/lumen-react'
import { ArrowUpRight, CircleAlert, Frame, Icon, Info, ScanSearch, SlidersHorizontal } from '@santi020k/lumen-react/icons'

import pluginIcon from '../community/assets/icon.png'

import { componentKeys } from './contracts.js'
import { ExportResult } from './export-result.js'
import type { PluginBridge, PluginResult } from './model.js'
import { nativeComponents } from './native-design.js'
import { SelectionArt } from './selection-art.js'
import type { ExportTarget, WebPlatform } from './targets.js'
import { adapterVersion, appearancesFor, defaultFor, defaultTarget, isNativeTarget, isPlatform, isVersion, isWebPlatform, nativeBaseline, platforms, supportsAppearance, versions } from './targets.js'

const platformOptions = Object.entries(platforms).map(([value, { label }]) => ({ value, label }))

const versionOptions = (platform: WebPlatform) => versions.map(value => ({
  value, label: platform === 'astro' ? `Lumen Astro ${value}` : `Lumen ${value} · ${platforms[platform].label} ${adapterVersion(platform, value)}`
}))

export const Panel = ({ bridge, preview }: { bridge: PluginBridge, preview: boolean }) => {
  const [target, setTarget] = useState<ExportTarget>(defaultTarget)
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

      setStatus(message.result.code ? 'Analysis ready. Review the findings before using the starter.' : 'No supported components in this selection. Review the handoff for details.')
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

  return (
    <main className="plugin-panel">
      <header className="plugin-header">
        <Image alt="" height={36} loading="eager" radius="none" src={pluginIcon} width={36} />
        <h1>
          Lumen
          <span>for Figma</span>
        </h1>
        <span className="offline-label">Runs locally</span>
      </header>
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
      <Card
        aria-labelledby="settings-title"
        as="section"
        className="settings-card"
      >
        <h2 id="settings-title">
          <Icon icon={SlidersHorizontal} />
          Export settings
        </h2>
        <div className="settings-fields" data-platform={platform}>
          <Field className="platform-field">
            <Label htmlFor="lumen-platform" id="platform-label">Export target</Label>
            <Select
              aria-labelledby="platform-label"
              disabled={busy}
              id="lumen-platform"
              onValueChange={value => {
                if (!isPlatform(value)) return

                const next = isWebPlatform(value) && !isNativeTarget(target) ?
                  { ...target, platform: value } :
                  defaultFor(value)

                changeTarget(next)
              }}
              options={platformOptions}
              value={platform}
            />
          </Field>
          {isNativeTarget(target) ?
            (
              <div className="native-version">
                <strong>Supported adapter version</strong>
                <p>
                  {target.version}
                  {' · '}
                  {nativeBaseline[target.platform]}
                  {' · Uses project appearance'}
                </p>
              </div>
            ) :
            (
              <>
                <Field>
                  <Label htmlFor="lumen-version" id="version-label">Target version</Label>
                  <Select
                    aria-labelledby="version-label"
                    disabled={busy}
                    id="lumen-version"
                    onValueChange={version => {
                      if (isVersion(version)) changeTarget({ ...target, version, appearance: supportsAppearance(version, target.appearance) ? target.appearance : 'project' })
                    }}
                    options={versionOptions(target.platform ?? 'astro')}
                    value={target.version}
                  />
                </Field>
                <Field>
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
                </Field>
              </>
            )}
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
          <Icon icon={ScanSearch} />
          Inspect selection
        </Button>
        <p className="status" data-error={failed} role="status">
          <Icon icon={failed ? CircleAlert : Info} size="sm" />
          {status}
        </p>
      </Card>
      {result && <ExportResult result={result} />}
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
