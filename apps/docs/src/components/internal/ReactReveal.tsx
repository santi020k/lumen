import { Button, Card, CardFooter, RevealGroup, ScrollReveal } from '@santi020k/lumen-react'

export const ReactReveal = () => (
  <>
    {[false, true].map(once => {
      const mode = once ? 'once' : 'repeat'

      return (
        <section key={mode} aria-labelledby={`${mode}-heading`}>
          <h2 id={`${mode}-heading`}>{once ? 'One entrance' : 'Repeating entrances'}</h2>
          <ScrollReveal animation="slide-up" data-reveal-id={`${mode}-single`} once={once}>
            <Card>
              <h3>Single reveal</h3>
              <p>Content stays readable as the text grows and the viewport changes.</p>
              <CardFooter>
                <Button type="button">
                  Explore
                  {' '}
                  {mode}
                </Button>
              </CardFooter>
            </Card>
          </ScrollReveal>
          <RevealGroup data-reveal-id={`${mode}-group`} once={once}>
            {['Plan', 'Build', 'Review'].map(label => (
              <Card key={label}>
                <h3>{label}</h3>
                <p>Clear headings, flexible spacing, and keyboard access at every text size.</p>
                <CardFooter>
                  <Button type="button">
                    {label}
                    {' '}
                    {mode}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </RevealGroup>
        </section>
      )
    })}
    <div data-reveal-spacer aria-hidden="true" />
    <p id="end">End of the reveal examples.</p>
  </>
)
