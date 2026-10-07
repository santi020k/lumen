'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { Button, Card, Form, Input, Label, Stack, Stepper, Typography } from '@santi020k/lumen-react'

export const GuidedOnboardingRecipe = ({ onComplete }: { onComplete?: (workspace: string) => void }) => {
  const id = useId()
  const [step, setStep] = useState(0)
  const [workspace, setWorkspace] = useState('')
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) stepHeadingRef.current?.focus()

    mountedRef.current = true
  }, [step])

  const steps = [{ title: 'Workspace' }, { title: 'Review' }, { title: 'Ready' }]

  return (
    <Card>
      <Stack gap="group">
        <Typography>
          <h2>Prepare your workspace</h2>
          <p>This draft stays local until your application handles completion.</p>
        </Typography>
        <Stepper steps={steps} currentStep={step} />
        <Form
          enhance={false}
          onSubmit={event => {
            event.preventDefault()

            if (step === 0) setStep(1); else {
              onComplete?.(workspace.trim())

              setStep(2)
            }
          }}
        >
          <Stack gap="group">
            {step === 0 && (
              <Stack gap="related">
                <h3 ref={stepHeadingRef} tabIndex={-1}>Workspace</h3>
                <Label htmlFor={id}>Workspace name</Label>
                <Input
                  id={id}
                  required
                  maxLength={80}
                  value={workspace}
                  onChange={event => {
                    setWorkspace(event.currentTarget.value)
                  }}
                />
              </Stack>
            )}
            {step === 1 && (
              <Typography>
                <h3 ref={stepHeadingRef} tabIndex={-1}>Review your draft</h3>
                <p>{`Workspace: ${workspace}`}</p>
              </Typography>
            )}
            {step === 2 && (
              <Typography>
                <h3 ref={stepHeadingRef} tabIndex={-1}>Ready</h3>
                <p role="status">Workspace draft completed.</p>
              </Typography>
            )}
            <Stack direction="horizontal" gap="related">
              {step === 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStep(0)
                  }}
                >
                  Back
                </Button>
              )}
              {step < 2 && <Button type="submit" disabled={!workspace.trim()}>{step === 0 ? 'Continue' : 'Complete setup'}</Button>}
              {step === 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStep(0)
                  }}
                >
                  Edit draft
                </Button>
              )}
            </Stack>
          </Stack>
        </Form>
      </Stack>
    </Card>
  )
}
