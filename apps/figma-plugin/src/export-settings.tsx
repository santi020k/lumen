import { Field, Label, RadioGroup, Select } from '@santi020k/lumen-react'

import type { ExportTarget, WebPlatform } from './targets.js'
import { adapterVersion, appearancesFor, defaultFor, isBrandMode, isNativeTarget, isPlatform, isVersion, isWebPlatform, nativeBaseline, platforms, supportsAppearance, versions } from './targets.js'

const platformOptions = Object.entries(platforms).map(([value, { label }]) => ({ value, label }))

const versionOptions = (platform: WebPlatform) => versions.map(value => ({
  value, label: platform === 'astro' ? `Lumen Astro ${value}` : `Lumen ${value} · ${platforms[platform].label} ${adapterVersion(platform, value)}`
}))

const brandModes = [
  { value: 'santi020k-light', label: 'Light' },
  { value: 'santi020k-dark', label: 'Dark' }
] as const

interface ExportSettingsProps {
  busy: boolean
  target: ExportTarget
  changeTarget: (next: ExportTarget) => void
}

export const ExportSettings = ({ busy, target, changeTarget }: ExportSettingsProps) => {
  const platform = target.platform ?? 'astro'

  return (
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
                  if (appearance === 'santi020k' && isBrandMode(target.appearance)) return

                  const next = appearance === 'santi020k' ? 'santi020k-light' : appearance

                  if (supportsAppearance(target.version, next)) changeTarget({ ...target, appearance: next })
                }}
                options={appearancesFor(target.version)}
                value={isBrandMode(target.appearance) ? 'santi020k' : target.appearance}
              />
            </Field>
            {isBrandMode(target.appearance) && (
              <RadioGroup className="starting-mode" disabled={busy}>
                <legend>Starting mode</legend>
                {brandModes.map(({ value, label }) => (
                  <Label key={value}>
                    <input
                      checked={target.appearance === value}
                      name="starting-mode"
                      onChange={() => {
                        changeTarget({ ...target, appearance: value })
                      }}
                      type="radio"
                      value={value}
                    />
                    {label}
                  </Label>
                ))}
              </RadioGroup>
            )}
          </>
        )}
    </div>
  )
}
