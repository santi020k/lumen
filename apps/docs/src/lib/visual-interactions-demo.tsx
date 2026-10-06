import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

import { type LumenApprovalStatus, type LumenStreamStatus, type LumenVisualEffectVariant, lumenVisualEffectVariants, runLumenViewTransition } from '@santi020k/lumen-core'
import { ApprovalCard, Badge, Button, Card, ChartMotion, CodeTabs, Collapsible, Field, Label, LineChart, MotionGroup, NumberField, PromptComposer, Select, SourceCitation, Stack, StreamMessage, Tabs, TabsList, TabsPanel, TabsTrigger, ToolActivity, Typography, VisualEffect } from '@santi020k/lumen-react'

import { CommandCenterRecipe } from '../../../../packages/lumen/templates/react/command-center/src/lumen/command-center'
import { FeaturePreviewRecipe } from '../../../../packages/lumen/templates/react/feature-preview/src/lumen/feature-preview'
import { GuidedOnboardingRecipe } from '../../../../packages/lumen/templates/react/guided-onboarding/src/lumen/guided-onboarding'
import { InteractivePricingRecipe } from '../../../../packages/lumen/templates/react/interactive-pricing/src/lumen/interactive-pricing'

const initialItems = ['Research', 'Prototype', 'Review']
const reply = 'This is a local demonstration. Your application controls the model, requests, streaming, and authorization.'

type TimingStyle = CSSProperties & { '--ui-duration': string }

const effectCode = (variant: LumenVisualEffectVariant, intensity: number, animated: boolean) => [
  {
    value: 'astro',
    label: 'Astro',
    language: 'astro',
    code: `---\nimport { VisualEffect } from '@santi020k/lumen-astro'\n---\n<VisualEffect variant="${variant}" intensity={${intensity}} animated={${animated}}>\n  <p>Your content</p>\n</VisualEffect>`
  },
  {
    value: 'react',
    label: 'React',
    language: 'tsx',
    code: `import { VisualEffect } from '@santi020k/lumen-react'\n\n<VisualEffect variant="${variant}" intensity={${intensity}} animated={${animated}}>\n  <p>Your content</p>\n</VisualEffect>`
  },
  {
    value: 'elements',
    label: 'Elements',
    language: 'html',
    code: `<script type="module">\n  import { defineLumenElements } from '@santi020k/lumen-elements'\n  defineLumenElements(['VisualEffect'])\n</script>\n<lumen-visual-effect variant="${variant}" intensity="${intensity}"${animated ? ' animated' : ''}>\n  <p>Your content</p>\n</lumen-visual-effect>`
  }
]

const EffectsWorkbench = () => {
  const [variant, setVariant] = useState<LumenVisualEffectVariant>('mesh')
  const [intensity, setIntensity] = useState(0.5)
  const [animated, setAnimated] = useState(false)

  return (
    <Stack gap="group">
      <Card variant="muted" className="visual-control-panel">
        <Stack
          direction="horizontal"
          gap="group"
          wrap
          className="visual-controls"
        >
          <Field>
            <Label htmlFor="visual-effect">Effect</Label>
            <Select
              id="visual-effect"
              value={variant}
              options={[...lumenVisualEffectVariants]}
              onChange={event => {
                const next = lumenVisualEffectVariants.find(item => item === event.currentTarget.value)

                if (next) setVariant(next)
              }}
            />
          </Field>
          <Field>
            <Label htmlFor="effect-intensity">Intensity</Label>
            <NumberField
              id="effect-intensity"
              min={0}
              max={1}
              step={0.05}
              value={intensity}
              onChange={event => {
                const next = event.currentTarget.valueAsNumber

                if (Number.isFinite(next)) setIntensity(Math.max(0, Math.min(1, next)))
              }}
            />
          </Field>
          <Button
            aria-pressed={animated}
            onClick={() => {
              setAnimated(!animated)
            }}
            variant="secondary"
          >
            {animated ? 'Pause animation' : 'Enable animation'}
          </Button>
        </Stack>
      </Card>
      <div className="visual-demo-grid">
        {[false, true].map(reduced => (
          <VisualEffect key={String(reduced)} data-ui-motion={reduced ? 'reduce' : undefined} variant={variant} intensity={intensity} animated={animated}>
            <Typography>
              <h3>{reduced ? 'Reduced motion' : 'Your system preference'}</h3>
              <p>Semantic colors keep the content readable.</p>
            </Typography>
            {variant === 'draw' && <svg aria-hidden="true" viewBox="0 0 100 40"><path d="M5 30L30 10L55 25L95 5" fill="none" pathLength="1" stroke="currentColor" strokeWidth="2" /></svg>}
          </VisualEffect>
        ))}
      </div>
      <CodeTabs ariaLabel="Visual effect usage" items={effectCode(variant, intensity, animated)} />
    </Stack>
  )
}

const MotionWorkbench = () => {
  const [duration, setDuration] = useState(240)
  const [items, setItems] = useState(initialItems)
  const [expanded, setExpanded] = useState(false)
  const committedRef = useRef<(() => void)[]>([])

  useEffect(() => {
    for (const resolve of committedRef.current.splice(0)) resolve()
  }, [expanded])

  useEffect(() => () => {
    for (const resolve of committedRef.current.splice(0)) resolve()
  }, [])

  const nextIdRef = useRef(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saving) return

    const timer = window.setTimeout(() => {
      setSaving(false)

      setSaved(true)
    }, 700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [saving])

  const saveStatus = saving ? 'Saving locally…' : 'Try pending and success feedback.'
  const style: TimingStyle = { '--ui-duration': `${duration}ms` }

  return (
    <Stack gap="group" style={style}>
      <Card variant="muted" className="visual-control-panel">
        <Stack
          direction="horizontal"
          gap="group"
          wrap
          className="visual-controls"
        >
          <Field>
            <Label htmlFor="motion-duration">Duration · milliseconds</Label>
            <NumberField
              id="motion-duration"
              min={0}
              max={1000}
              step={40}
              value={duration}
              onChange={event => {
                const next = event.currentTarget.valueAsNumber

                if (Number.isFinite(next)) setDuration(Math.max(0, Math.min(1000, next)))
              }}
            />
          </Field>
          <Stack direction="horizontal" gap="related" wrap>
            <Button onClick={() => {
              setItems(current => [...current].reverse())
            }}
            >
              Reverse order
            </Button>
            <Button
              onClick={() => {
                setItems(current => [...current, `New task ${nextIdRef.current++}`])
              }}
              variant="secondary"
            >
              Add item
            </Button>
            <Button
              onClick={() => {
                setItems(current => current.slice(0, -1))
              }}
              disabled={items.length === 0}
              variant="secondary"
            >
              Remove last
            </Button>
          </Stack>
        </Stack>
      </Card>
      <div className="visual-demo-grid">
        {[false, true].map(reduced => (
          <Card variant="muted" className="visual-comparison" key={String(reduced)} data-ui-motion={reduced ? 'reduce' : undefined}>
            <Typography><h3>{reduced ? 'Reduced motion' : 'Your system preference'}</h3></Typography>
            <p>{reduced ? 'The same updates, with immediate transitions.' : 'Reorder the tasks to follow their movement.'}</p>
            <MotionGroup className="visual-motion-list">{items.map(item => <Card key={item} data-ui-motion-key={item}><Button variant="ghost">{item}</Button></Card>)}</MotionGroup>
          </Card>
        ))}
      </div>
      <div className="visual-example-grid">
        <Card style={{ viewTransitionName: 'lumen-workspace-preview' }}>
          <Typography>
            <h3>{expanded ? 'Workspace details' : 'Workspace overview'}</h3>
            <p>{expanded ? 'The same named surface stays recognizable across the update.' : 'Open the details to try a native View Transition.'}</p>
          </Typography>
          <Button onClick={() => {
            void runLumenViewTransition(document, () => new Promise<void>(resolve => {
              committedRef.current.push(resolve)

              setExpanded(current => !current)
            }))
          }}
          >
            Change view
          </Button>
        </Card>
        <Card>
          <Typography><h3>Selection and feedback</h3></Typography>
          <Tabs indicator defaultValue="overview">
            <TabsList aria-label="Workspace sections">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsPanel value="overview"><Typography>Your project summary.</Typography></TabsPanel>
            <TabsPanel value="activity"><Typography>Your recent changes.</Typography></TabsPanel>
          </Tabs>
          <Collapsible>
            <summary>Disclosure resizing</summary>
            <Typography>
              Browsers that support interpolate-size animate the content height.
              Other browsers open it immediately.
            </Typography>
          </Collapsible>
          <Stack direction="horizontal" gap="related" wrap>
            <Button
              loading={saving}
              onClick={() => {
                setSaved(false)

                setSaving(true)
              }}
            >
              Save demonstration
            </Button>
            <span role="status" className="visual-feedback">{saved ? 'Saved for this demonstration.' : saveStatus}</span>
          </Stack>
        </Card>
      </div>
    </Stack>
  )
}

const ChartWorkbench = () => {
  const [values, setValues] = useState([12, 18, 16, 24])
  const [loading, setLoading] = useState(false)
  const series = [{ id: 'tasks', label: 'Completed tasks', data: values.map((y, x) => ({ id: `day-${x}`, x, y })) }]

  return (
    <Stack gap="group">
      <Typography>
        <p>
          Both charts share a cursor. Values in the data table update immediately;
          SVG marks move between their stable identities.
        </p>
      </Typography>
      <Card variant="muted" className="visual-control-panel">
        <Stack direction="horizontal" gap="related" wrap>
          <Button onClick={() => {
            setValues(current => current.map((value, index) => value + (index % 2 === 0 ? 3 : -2)))
          }}
          >
            Update values
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setValues(current => [...current, 20 + current.length])
            }}
          >
            Append point
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(!loading)
            }}
          >
            {loading ? 'Finish loading' : 'Show loading'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setValues([])
            }}
          >
            Empty
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setValues([12, 18, 16, 24])
            }}
          >
            Reset
          </Button>
        </Stack>
      </Card>
      <div aria-busy={loading}>
        <MotionGroup>
          <span
            key={loading ? 'loading' : 'ready'}
            data-ui-motion-key={loading ? 'loading' : 'ready'}
            role="status"
            className="visual-feedback"
          >
            {loading ? 'Loading the demonstration data…' : 'Demonstration data ready.'}
          </span>
        </MotionGroup>
        <div className="visual-demo-grid">{['Progress', 'Compared progress'].map(heading => <ChartMotion key={heading}><LineChart series={series} heading={heading} interactive syncGroup="visual-demo" markers="all" domain={{ min: 0, max: 60 }} /></ChartMotion>)}</div>
      </div>
    </Stack>
  )
}

const AiWorkbench = () => {
  const [status, setStatus] = useState<LumenStreamStatus>('idle')
  const [text, setText] = useState('')
  const [decision, setDecision] = useState<LumenApprovalStatus>('pending')

  useEffect(() => {
    if (status !== 'streaming') return

    let count = 0

    const timer = window.setInterval(() => {
      count = Math.min(reply.length, count + 8)

      setText(reply.slice(0, count))

      if (count === reply.length) setStatus('complete')
    }, 80)

    return () => {
      window.clearInterval(timer)
    }
  }, [status])

  const start = () => {
    setText('')

    setStatus('streaming')
  }

  return (
    <Stack gap="group">
      <Typography><p>Local simulation. Nothing is sent to an AI service.</p></Typography>
      <PromptComposer
        pending={status === 'streaming'}
        onPromptSubmit={start}
        onStop={() => {
          setStatus('canceled')
        }}
        defaultValue="Explain the proposed workspace update"
      />
      <StreamMessage status={status} statusLabel={status === 'streaming' ? 'Writing the demonstration response' : `Response ${status}`} actions={status === 'canceled' ? <Button onClick={start}>Retry</Button> : undefined} sources={<SourceCitation href="/docs/web" label="Lumen web guide" />}>
        {text || 'Send a prompt to preview a response.'}
      </StreamMessage>
      <ToolActivity label="Inspect project structure" status={status === 'streaming' ? 'running' : 'success'} statusLabel={status === 'streaming' ? 'Inspecting the synthetic fixture' : 'Fixture inspected'}><Typography>Three fictional tasks are available. No files are read.</Typography></ToolActivity>
      <ApprovalCard
        label="Apply a proposed workspace change"
        requestId="demo-request"
        status={decision}
        statusLabel={decision === 'pending' ? 'Waiting for your decision' : `Decision: ${decision}`}
        onResponse={({ response }) => {
          setDecision(response === 'approve' ? 'approved' : 'rejected')
        }}
      >
        <Typography>The decision updates this preview only.</Typography>
      </ApprovalCard>
      <Button
        variant="secondary"
        onClick={() => {
          setDecision('pending')
        }}
      >
        Reset proposal
      </Button>
    </Stack>
  )
}

export const VisualInteractionsDemo = () => (
  <Stack gap="section" className="visual-workbench">
    <section aria-labelledby="motion-workbench">
      <header className="visual-section-heading">
        <Badge variant="outline">01 · Motion</Badge>
        <Typography>
          <h2 id="motion-workbench">Coordinated motion</h2>
          <p>
            Reorder, add, or remove a task. Compare the animation with an immediate update,
            then try transitions and feedback.
          </p>
        </Typography>
      </header>
      <MotionWorkbench />
    </section>
    <section aria-labelledby="effects-workbench">
      <header className="visual-section-heading">
        <Badge variant="outline">02 · Effects</Badge>
        <Typography>
          <h2 id="effects-workbench">Visual effects</h2>
          <p>Choose a treatment and adjust its intensity. Animation starts only when you enable it.</p>
        </Typography>
      </header>
      <EffectsWorkbench />
    </section>
    <section aria-labelledby="chart-workbench">
      <header className="visual-section-heading">
        <Badge variant="outline">03 · Data</Badge>
        <Typography>
          <h2 id="chart-workbench">Live chart continuity</h2>
          <p>Update values without losing your place. Both charts share an inspection cursor.</p>
        </Typography>
      </header>
      <ChartWorkbench />
    </section>
    <section aria-labelledby="ai-workbench">
      <header className="visual-section-heading">
        <Badge variant="outline">04 · AI</Badge>
        <Typography>
          <h2 id="ai-workbench">AI surfaces</h2>
          <p>Try a prompt, streaming response, and approval flow. This simulation stays in your browser.</p>
        </Typography>
      </header>
      <AiWorkbench />
    </section>
    <section aria-labelledby="product-blocks-workbench">
      <header className="visual-section-heading">
        <Badge variant="outline">05 · Recipes</Badge>
        <Typography>
          <h2 id="product-blocks-workbench">Installable product blocks</h2>
          <p>Explore complete interactions built from public Lumen components, ready to adapt to your project.</p>
        </Typography>
      </header>
      <Stack gap="section">
        <InteractivePricingRecipe />
        <FeaturePreviewRecipe />
        <GuidedOnboardingRecipe />
        <CommandCenterRecipe />
      </Stack>
    </section>
  </Stack>
)
