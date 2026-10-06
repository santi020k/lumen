export const visualAdapterExamples = {
  motion: {
    astro: `---
import { Card, MotionGroup } from '@santi020k/lumen-astro'
const tasks = ['Plan', 'Review', 'Ship']
---
<MotionGroup duration="standard">
  {tasks.map(task => <Card data-ui-motion-key={task}>{task}</Card>)}
</MotionGroup>
<!-- Your client code owns adding, removing, and reordering these children. -->`,
    elements: `<lumen-motion-group duration="standard">
  <lumen-card data-ui-motion-key="plan">Plan</lumen-card>
  <lumen-card data-ui-motion-key="review">Review</lumen-card>
  <lumen-card data-ui-motion-key="ship">Ship</lumen-card>
</lumen-motion-group>
<!-- Your client code owns adding, removing, and reordering these children. -->`
  },
  effects: {
    astro: `---
import { VisualEffect } from '@santi020k/lumen-astro'
---
<VisualEffect variant="aurora" intensity={0.8}>
  <h2>Your next idea</h2>
  <p>Keep important content readable.</p>
</VisualEffect>`,
    elements: `<lumen-visual-effect variant="aurora" intensity="0.8">
  <h2>Your next idea</h2>
  <p>Keep important content readable.</p>
</lumen-visual-effect>`
  },
  charts: {
    astro: `---
import { ChartMotion, LineChart } from '@santi020k/lumen-astro'
const series = [{ id: 'progress', label: 'Progress', data: [
  { id: 'mon', x: 'Mon', y: 12 },
  { id: 'tue', x: 'Tue', y: 18 }
] }]
---
<ChartMotion>
  <LineChart heading="Progress" series={series} markers="all" interactive />
</ChartMotion>`,
    elements: `<lumen-chart-motion>
  <lumen-line-chart heading="Progress" markers="all" interactive
    series='[{"id":"progress","label":"Progress","data":[{"id":"mon","x":"Mon","y":12},{"id":"tue","x":"Tue","y":18}]}]'>
  </lumen-line-chart>
</lumen-chart-motion>
<!-- Update the chart series property from your application to animate changes. -->`
  },
  ai: {
    astro: `---
import { PromptComposer, StreamMessage } from '@santi020k/lumen-astro'
---
<PromptComposer value="Explain the workspace" />
<StreamMessage status="idle" statusLabel="Waiting for a prompt">
  Send a prompt to begin.
</StreamMessage>
<!-- Handle ui:prompt-submit in your client code; preventDefault() when handled.
     Or set action on PromptComposer to your application's POST endpoint. -->`,
    elements: `<lumen-prompt-composer value="Explain the workspace"></lumen-prompt-composer>
<lumen-stream-message status="idle" status-label="Waiting for a prompt">
  Send a prompt to begin.
</lumen-stream-message>
<!-- Handle ui:prompt-submit in your client code; preventDefault() when handled.
     Your application owns requests, response state, and cancellation. -->`
  }
} as const
