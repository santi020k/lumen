import { useRef, useState } from 'react'

import { inspectLumenTheme, lumenSemanticColorTokenNames } from '@santi020k/lumen-core'
import { Button, Card, Stack } from '@santi020k/lumen-react'

const palette = (dark: boolean) => Object.fromEntries(lumenSemanticColorTokenNames.map(token => {
  const foreground = token.startsWith('ink') || ['brand-solid', 'danger'].includes(token)

  return [`--${token}`, foreground !== dark ? '0 0% 0%' : '0 0% 100%']
}))

export const ConsumerThemeAuditDemo = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState('Run the audit after the CSS mappings are applied.')

  return (
    <Card>
      <h2>Inspect resolved theme scopes</h2>
      <p>These synthetic palettes demonstrate complete mappings and inherited CSS variable resolution.</p>
      <div ref={rootRef}>
        <Card data-theme-audit-scope="light" style={palette(false)}>
          <p>Light scope</p>
          <Stack data-theme-audit-scope="nested" style={Object.fromEntries([['--scope-ink', '0 0% 0%'], ['--ink', 'var(--scope-ink)']])}>
            <p>Nested inherited scope</p>
          </Stack>
        </Card>
        <Card data-theme-audit-scope="dark" style={palette(true)}><p>Dark scope</p></Card>
      </div>
      <Button onClick={() => {
        const scopes = rootRef.current?.querySelectorAll<HTMLElement>('[data-theme-audit-scope]')

        if (!scopes) return

        setResult(Array.from(scopes, scope => {
          const audit = inspectLumenTheme(scope)

          return `${scope.dataset.themeAuditScope ?? 'scope'}: ${audit.healthy ? 'passed' : audit.findings.map(item => item.message).join(' ')}`
        }).join('\n'))
      }}
      >
        Audit resolved scopes
      </Button>
      <output aria-live="polite" data-theme-audit-result style={{ whiteSpace: 'pre-wrap' }}>{result}</output>
    </Card>
  )
}
