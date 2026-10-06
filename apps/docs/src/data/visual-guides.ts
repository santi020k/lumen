import type { VisualGuideId } from './visual-guide-sections'

export const visualGuides = [
  {
    id: 'motion',
    label: 'Motion',
    title: 'Keep changes easy to follow.',
    description: 'Animate list changes, transitions, and feedback while preserving focus and stable item identities.',
    components: ['MotionGroup', 'Tabs', 'Collapsible'],
    useCase: 'Use motion to explain a change: reordered tasks, a new result, or a selected view. Keep routine updates short.',
    notes: ['Give every direct child a unique, stable data-ui-motion-key. React keys and DOM motion keys serve different purposes; use both.', 'Your application owns the list order and render. Missing or duplicate identities skip ambiguous animation.', 'System reduced motion wins. Add data-ui-motion="reduce" to a subtree for an immediate comparison.', 'View transitions need one unique view-transition-name per surface. Await asynchronous rendering inside runLumenViewTransition.'],
    next: 'effects',
    code: `import { useState } from 'react'
import { Button, Card, MotionGroup } from '@santi020k/lumen-react'

export function TaskList() {
  const [tasks, setTasks] = useState(['Plan', 'Review', 'Ship'])
  return <>
    <Button onClick={() => setTasks(current => [...current].reverse())}>
      Reverse order
    </Button>
    <MotionGroup duration="standard">
      {tasks.map(task => <Card key={task} data-ui-motion-key={task}>{task}</Card>)}
    </MotionGroup>
  </>
}`
  },
  {
    id: 'effects',
    label: 'Effects',
    title: 'Give a surface a little character.',
    description: 'Explore seven token-based treatments, tune their intensity, and compare animated and reduced-motion previews.',
    components: ['VisualEffect'],
    useCase: 'Apply an effect to a featured card or a short hero. Keep long reading surfaces calm and text readable.',
    notes: ['VisualEffect defaults to static. Enable continuing animation deliberately and provide a pause control.', 'Aurora loops; draw animates an SVG path with pathLength="1"; depth follows scrolling when native scroll timelines are supported.', 'Mesh, grain, and border are static treatments. Spotlight follows a pointer and skips touch and reduced motion.', 'The demo amplifies aurora movement locally. Package defaults are more subtle; cycle timing and replay controls belong to the application.'],
    next: 'charts',
    code: `import { useState } from 'react'
import { Button, VisualEffect } from '@santi020k/lumen-react'

export function FeaturedCard() {
  const [animated, setAnimated] = useState(false)
  return <>
    <Button aria-pressed={animated} onClick={() => setAnimated(value => !value)}>
      {animated ? 'Stop animation' : 'Enable animation'}
    </Button>
    <VisualEffect variant="aurora" intensity={0.8} animated={animated}>
      <h2>Your next idea</h2>
      <p>Keep important content readable.</p>
    </VisualEffect>
  </>
}`
  },
  {
    id: 'charts',
    label: 'Chart animation',
    title: 'Let the data keep its place.',
    description: 'Animate line, area, and bar updates. Inspect linked charts and try loading, empty, and reduced-motion states.',
    components: ['ChartMotion', 'LineChart', 'BarChart'],
    useCase: 'Show how values changed without replacing the whole chart. Keep IDs stable and let accessible data update immediately.',
    notes: ['Wrap a LineChart or BarChart in ChartMotion. Filled line areas are supported too.', 'Keep series IDs and datum IDs stable across refreshes. Duplicate identities skip ambiguous animation.', 'Tables, summaries, and inspection values update immediately. Animation should never delay access to the latest data.', 'Use interactive and syncGroup for linked inspection. Keep transport, playback, loading, and refresh state in your application.', 'Path interpolation depends on browser support; immediate rendering remains usable. Avoid animating thousands of marks at once.'],
    next: 'ai',
    code: `import { useState } from 'react'
import { Button, ChartMotion, LineChart } from '@santi020k/lumen-react'

export function ProgressChart() {
  const [values, setValues] = useState([12, 18, 16, 24])
  const series = [{ id: 'progress', label: 'Progress', data: values.map((y, x) => ({
    id: String(x), x, y
  })) }]
  return <>
    <Button onClick={() => setValues(current => current.map(value => 52 - value))}>
      Update values
    </Button>
    <ChartMotion>
      <LineChart heading="Progress" series={series} markers="all" interactive />
    </ChartMotion>
  </>
}`
  },
  {
    id: 'ai',
    label: 'AI interfaces',
    title: 'Make every AI state understandable.',
    description: 'Compose prompts, response status, citations, tool activity, and decisions. Try the complete local simulation.',
    components: ['PromptComposer', 'StreamMessage', 'SourceCitation', 'ToolActivity', 'ApprovalCard'],
    useCase: 'Use these primitives to present an application-owned AI workflow with clear send, stop, retry, and decision states.',
    notes: ['Lumen never contacts a model. Your application owns requests, streaming, cancellation, persistence, and server authorization.', 'PromptComposer validates input and exposes onPromptSubmit({ text }) and onStop in React. Astro and Elements emit ui:prompt-submit and ui:prompt-stop.', 'Keep streamed tokens outside live regions. Supply a concise statusLabel to StreamMessage and compose retry controls when needed.', 'ApprovalCard reports a decision; it does not execute a change or grant permission. Validate every operation on the server.', 'Treat response Markdown as untrusted input. Use safe rendering and meaningful source labels.'],
    next: 'recipes',
    code: `import { useState } from 'react'
import { PromptComposer, StreamMessage } from '@santi020k/lumen-react'

// A local example. Replace the handler with your application request.
export function PromptPreview() {
  const [response, setResponse] = useState('')
  return <>
    <PromptComposer onPromptSubmit={({ text }) => {
      setResponse('Received: ' + text)
    }} />
    <StreamMessage status={response ? 'complete' : 'idle'}
      statusLabel={response ? 'Response ready' : 'Waiting for a prompt'}>
      {response || 'Send a prompt to begin.'}
    </StreamMessage>
  </>
}`
  },
  {
    id: 'recipes',
    label: 'Product recipes',
    title: 'Start with an interaction that works.',
    description: 'Install pricing, feature previews, onboarding, or command search. Adapt their state and callbacks to your product.',
    components: ['MotionGroup', 'VisualEffect', 'PromptComposer'],
    useCase: 'Choose a recipe when you need a complete starting point. Install its source, then connect application behavior.',
    notes: ['All four recipes support Astro, React, and Elements. The preview uses fictional local state.', 'Pricing requests a plan selection; your application owns checkout. Onboarding preserves a draft; your application owns saving it.', 'Command search supports Arrow keys, Home, End, Enter, and Escape. Preserve this keyboard path when adapting commands.', 'Astro recipes clean up before a view swap. Elements recipe modules require a bundler.', 'Installed recipe files are yours to edit. Keep component imports public and reuse semantic tokens.'],
    next: 'motion',
    code: `lumen add interactive-pricing --target react
lumen add feature-preview --target react
lumen add guided-onboarding --target react
lumen add command-center --target react`
  }
] as const

export const visualGuideHref = (id: VisualGuideId) => `/docs/visual-playground/${id}`
