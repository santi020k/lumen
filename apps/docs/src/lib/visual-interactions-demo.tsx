import type { CSSProperties } from 'react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { type LumenApprovalStatus, type LumenStreamStatus, type LumenVisualEffectVariant, lumenVisualEffectVariants, runLumenViewTransition } from '@santi020k/lumen-core'
import { ApprovalCard, Badge, BarChart, Button, Card, ChartMotion, CodeTabs, Collapsible, Field, Label, LineChart, MotionGroup, NumberField, PromptComposer, Select, SourceCitation, Stack, StreamMessage, Tabs, TabsList, TabsPanel, TabsTrigger, ToolActivity, Typography, VisualEffect } from '@santi020k/lumen-react'

import { CommandCenterRecipe } from '../../../../packages/lumen/templates/react/command-center/src/lumen/command-center'
import { FeaturePreviewRecipe } from '../../../../packages/lumen/templates/react/feature-preview/src/lumen/feature-preview'
import { GuidedOnboardingRecipe } from '../../../../packages/lumen/templates/react/guided-onboarding/src/lumen/guided-onboarding'
import { InteractivePricingRecipe } from '../../../../packages/lumen/templates/react/interactive-pricing/src/lumen/interactive-pricing'
import type { VisualGuideId } from '../data/visual-guide-sections'

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

const subscribeMotionPreference = (notify: () => void) => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')

  preference.addEventListener('change', notify)

  return () => {
    preference.removeEventListener('change', notify)
  }
}

const readMotionPreference = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const useReducedMotion = () => useSyncExternalStore(subscribeMotionPreference, readMotionPreference, () => false)

const EffectsWorkbench = () => {
  const [variant, setVariant] = useState<LumenVisualEffectVariant>('aurora')
  const [intensity, setIntensity] = useState(0.8)
  const [animated, setAnimated] = useState(false)
  const [started, setStarted] = useState(false)
  const [replay, setReplay] = useState(0)
  const [speed, setSpeed] = useState(4)
  const reducedMotion = useReducedMotion()

  const effectStyle: CSSProperties & { '--visual-effect-duration': string, '--visual-effect-play-state': string, '--ui-duration-slow': string } = {
    '--visual-effect-duration': `${speed}s`,
    '--visual-effect-play-state': animated ? 'running' : 'paused',
    '--ui-duration-slow': `${speed}s`
  }

  const canAnimate = variant === 'aurora' || variant === 'draw' || variant === 'depth'
  const animationLabel = animated ? 'Pause animation' : 'Enable animation'
  const staticHint = 'This treatment is static. Adjust its intensity or select aurora, draw, or depth to explore motion.'

  const effectHints: Record<LumenVisualEffectVariant, string> = {
    mesh: staticHint,
    spotlight: 'Move your pointer across the preview to move the light. Touch and reduced motion keep it static.',
    grain: staticHint,
    border: staticHint,
    depth: 'Enable animation, then scroll to see the depth treatment in browsers that support scroll timelines.',
    draw: 'Enable animation to draw the path. Use Replay effect to draw it again.',
    aurora: 'Enable animation to see the aurora move.'
  }

  const playbackHint = () => {
    if (reducedMotion) return 'Your system requests reduced motion. Both previews stay still; pointer tracking is also disabled.'

    if (!canAnimate || !started) return effectHints[variant]

    if (!animated) return 'Motion is paused. Enable to continue, or replay to start again.'

    if (variant === 'depth') return 'Scroll to move the depth effect. The comparison stays still.'

    return `Playing ${variant} · ${speed} second ${variant === 'draw' ? 'drawing. Replay to draw again.' : 'cycle. The comparison stays still.'}`
  }

  const previewHint = () => {
    if (!canAnimate) return effectHints[variant]

    if (reducedMotion) return 'Your system preference keeps this preview still.'

    if (animated) return 'Motion is playing. Pause to hold this frame.'

    if (started) return 'Motion is paused. Enable to continue from here.'

    return 'Enable or replay the effect to see it move.'
  }

  return (
    <Stack gap="group">
      <Card variant="muted" className="visual-control-panel">
        <Stack
          direction="horizontal"
          gap="group"
          wrap
          className="visual-controls visual-effects-controls"
        >
          <Field>
            <Label id="visual-effect-label" htmlFor="visual-effect">Effect</Label>
            <Select
              id="visual-effect"
              aria-labelledby="visual-effect-label"
              value={variant}
              options={[...lumenVisualEffectVariants]}
              onChange={event => {
                const next = lumenVisualEffectVariants.find(item => item === event.currentTarget.value)

                if (next) {
                  setVariant(next)

                  setAnimated(false)

                  setStarted(false)
                }
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
          <Field>
            <Label htmlFor="effect-speed">Cycle · seconds</Label>
            <NumberField
              id="effect-speed"
              min={2}
              max={12}
              step={1}
              value={speed}
              disabled={!canAnimate || variant === 'depth'}
              onChange={event => {
                const next = event.currentTarget.valueAsNumber

                if (Number.isFinite(next)) setSpeed(Math.max(2, Math.min(12, next)))
              }}
            />
          </Field>
          <Button
            aria-pressed={animated}
            disabled={!canAnimate}
            onClick={() => {
              setStarted(true)

              setAnimated(!animated)
            }}
            variant="secondary"
          >
            {canAnimate ? animationLabel : 'Static effect'}
          </Button>
          <Button
            variant="secondary"
            disabled={!canAnimate || variant === 'depth'}
            onClick={() => {
              setStarted(true)

              setAnimated(true)

              setReplay(current => current + 1)
            }}
          >
            Replay effect
          </Button>
        </Stack>
      </Card>
      <Typography>
        <p
          role="status"
          aria-label="Effect playback"
          className="visual-feedback"
        >
          {playbackHint()}
        </p>
      </Typography>
      <div className="visual-demo-grid">
        {[false, true].map(reduced => (
          <VisualEffect
            key={`${reduced}-${replay}`}
            className="visual-effect-preview"
            style={effectStyle}
            data-ui-motion={reduced ? 'reduce' : undefined}
            variant={variant}
            intensity={intensity}
            animated={started}
          >
            <Typography>
              <h3>{reduced ? 'Reduced motion' : 'Your system preference'}</h3>
              <p>{reduced ? 'A still comparison of the same treatment.' : previewHint()}</p>
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
            <Button
              disabled={items.length < 2}
              onClick={() => {
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
            <MotionGroup className="visual-motion-list" role="list" aria-label={reduced ? 'Tasks with reduced motion' : 'Animated tasks'}>{items.map(item => <Card key={item} data-ui-motion-key={item} role="listitem"><Typography>{item}</Typography></Card>)}</MotionGroup>
            {items.length === 0 && <Typography><p role="status">No tasks. Add an item to restart the comparison.</p></Typography>}
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
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(900)
  const reducedMotion = useReducedMotion()
  const style: TimingStyle = { '--ui-duration': `${duration}ms` }

  useEffect(() => {
    if (!playing || reducedMotion || loading) return

    const update = () => {
      if (!document.hidden) setValues(current => current.map(value => 52 - value))
    }

    const timer = window.setInterval(update, duration + 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [playing, duration, reducedMotion, loading])

  const series = [{ id: 'tasks', label: 'Completed tasks', data: values.map((y, x) => ({ id: `day-${x}`, x, y })) }]

  return (
    <Stack gap="group">
      <Typography>
        <p>
          Lines, filled areas, and bars animate when values change. The still comparison
          shows the destination immediately. Line charts share an inspection cursor.
        </p>
      </Typography>
      <Card variant="muted" className="visual-control-panel">
        <Stack
          direction="horizontal"
          gap="related"
          wrap
          className="visual-controls"
        >
          <Field>
            <Label htmlFor="chart-duration">Transition · milliseconds</Label>
            <NumberField
              id="chart-duration"
              min={0}
              max={2000}
              step={100}
              value={duration}
              onChange={event => {
                const next = event.currentTarget.valueAsNumber

                if (Number.isFinite(next)) setDuration(Math.max(0, Math.min(2000, next)))
              }}
            />
          </Field>
          <Button
            variant="secondary"
            aria-pressed={playing}
            disabled={values.length === 0 || (reducedMotion && !playing)}
            onClick={() => {
              if (!playing) setValues(current => current.map(value => 52 - value))

              setPlaying(current => !current)
            }}
          >
            {playing ? 'Pause charts' : 'Play charts'}
          </Button>
          <Button
            disabled={values.length === 0}
            onClick={() => {
              setValues(current => current.map(value => 52 - value))
            }}
          >
            Update values
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setValues(current => [...current, 12 + (current.length * 7) % 34])
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
            disabled={values.length === 0}
            onClick={() => {
              setPlaying(false)

              setValues([])
            }}
          >
            Empty
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPlaying(false)

              setValues([12, 18, 16, 24])

              setLoading(false)
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
        <Typography><p className="visual-feedback">{reducedMotion ? 'Your system requests reduced motion. Charts update immediately.' : `Transitions take ${duration} ms. ${playing ? 'Live playback is running.' : 'Update values or play the charts to see movement.'}`}</p></Typography>
        <div className="visual-demo-grid" style={style}>
          <ChartMotion><LineChart series={series} domain={{ min: 0, max: 52 }} heading="Progress" caption="Animated line · move the cursor or use arrow keys." interactive syncGroup="visual-demo" markers="all" /></ChartMotion>
          <ChartMotion data-ui-motion="reduce"><LineChart series={series} domain={{ min: 0, max: 52 }} heading="Compared progress" caption="Reduced motion · the same values update immediately." interactive syncGroup="visual-demo" markers="all" /></ChartMotion>
          <ChartMotion><LineChart series={series} domain={{ min: 0, max: 52 }} area heading="Area growth" caption="The filled area and line move together." interactive syncGroup="visual-demo" markers="all" /></ChartMotion>
          <ChartMotion><BarChart series={series} heading="Task distribution" caption="Bars resize smoothly as the values change." /></ChartMotion>
        </div>
        <CodeTabs ariaLabel="Chart animation usage" items={[{ value: 'react', label: 'React', language: 'tsx', code: `import type { CSSProperties } from 'react'\nimport { ChartMotion, LineChart, BarChart } from '@santi020k/lumen-react'\n\nconst timing: CSSProperties & { '--ui-duration': string } = { '--ui-duration': '${duration}ms' }\n\n<ChartMotion style={timing}>\n  <LineChart series={series} markers="all" />\n</ChartMotion>\n<ChartMotion style={timing}>\n  <BarChart series={series} />\n</ChartMotion>` }]} />
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
        disabled={decision === 'pending'}
        onClick={() => {
          setDecision('pending')
        }}
      >
        Reset proposal
      </Button>
    </Stack>
  )
}

const showVisualGuide = (section: VisualGuideId | undefined, id: VisualGuideId) => !section || section === id

export const VisualInteractionsDemo = ({ section }: { section?: VisualGuideId }) => (
  <Stack gap="section" className="visual-workbench">
    {showVisualGuide(section, 'motion') && (
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
    )}
    {showVisualGuide(section, 'effects') && (
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
    )}
    {showVisualGuide(section, 'charts') && (
      <section aria-labelledby="chart-workbench">
        <header className="visual-section-heading">
          <Badge variant="outline">03 · Data</Badge>
          <Typography>
            <h2 id="chart-workbench">Live chart continuity</h2>
            <p>Play line, area, and bar transitions. Compare an animated update with a still preview.</p>
          </Typography>
        </header>
        <ChartWorkbench />
      </section>
    )}
    {showVisualGuide(section, 'ai') && (
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
    )}
    {showVisualGuide(section, 'recipes') && (
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
    )}
  </Stack>
)
