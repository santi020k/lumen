import { Button, RevealGroup, ScrollReveal } from '@santi020k/lumen-react'

export const RevealRegressions = () => (
  <>
    <RevealGroup data-case="tall" threshold={0.8} style={{ minHeight: '10000px' }}>
      <p>Tall content remains readable.</p>
      <Button>Reach the tall group</Button>
    </RevealGroup>
    <ScrollReveal data-case="threshold" once={false} threshold={0.8} style={{ minHeight: '300px' }}>
      <p>Wait for the requested threshold.</p>
      <Button>Reach the threshold content</Button>
    </ScrollReveal>
    <RevealGroup data-case="resize" once={false} threshold={0.8} style={{ minHeight: '300px' }}>
      <p>Enlarged content remains readable.</p>
      <Button>Reach the enlarged group</Button>
    </RevealGroup>
  </>
)
