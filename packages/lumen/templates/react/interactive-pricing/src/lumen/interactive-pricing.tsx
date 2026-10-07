'use client'

import { useState } from 'react'

import { Button, Card, Grid, Stack, Typography, VisualEffect } from '@santi020k/lumen-react'

export interface PlanSelection { billing: 'monthly' | 'annual', plan: 'starter' | 'team' }
export const InteractivePricingRecipe = ({ onSelect }: { onSelect?: (selection: PlanSelection) => void }) => {
  const [billing, setBilling] = useState<PlanSelection['billing']>('monthly')
  const [selected, setSelected] = useState('')
  const prices = { starter: { monthly: 10, annual: 96 }, team: { monthly: 24, annual: 240 } }

  return (
    <Stack gap="group" aria-label="Example pricing">
      <Typography>
        <h2>A plan for your next project</h2>
        <p>Illustrative prices. Connect selections to your own checkout.</p>
      </Typography>
      <Stack direction="horizontal" gap="related" role="group" aria-label="Billing period">
        <Button
          aria-pressed={billing === 'monthly'}
          onClick={() => {
            setBilling('monthly')
          }}
        >
          Monthly
        </Button>
        <Button
          aria-pressed={billing === 'annual'}
          onClick={() => {
            setBilling('annual')
          }}
        >
          Annual
        </Button>
      </Stack>
      <Grid columns="auto">
        {(['starter', 'team'] as const).map(plan => (
          <Card key={plan}>
            <VisualEffect variant={plan === 'team' ? 'mesh' : 'border'}>
              <Typography>
                <h3>{plan === 'starter' ? 'Starter' : 'Team'}</h3>
                <p>{`$${prices[plan][billing]} / ${billing === 'annual' ? 'year' : 'month'}`}</p>
              </Typography>
              <Button onClick={() => {
                setSelected(`${plan}, ${billing}`)

                onSelect?.({ plan, billing })
              }}
              >
                {`Choose ${plan}`}
              </Button>
            </VisualEffect>
          </Card>
        ))}
      </Grid>
      <span role="status">{selected ? `Selected ${selected}.` : 'Select a plan to compare billing.'}</span>
    </Stack>
  )
}
