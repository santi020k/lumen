'use client'

import { useState } from 'react'

import { Button, Card, MotionGroup, Stack, Typography, VisualEffect } from '@santi020k/lumen-react'

const features = ['Plan', 'Review', 'Ship'] as const
const descriptions = { Plan: 'Bring the next three tasks into focus.', Review: 'Compare a proposal before deciding.', Ship: 'Check the release evidence before publishing.' }

export const FeaturePreviewRecipe = () => {
  const [feature, setFeature] = useState<typeof features[number]>('Plan')

  return (
    <Stack gap="group">
      <Typography><h2>From idea to delivery</h2></Typography>
      <Stack direction="horizontal" gap="related" role="group" aria-label="Preview a workflow stage">
        {features.map(item => (
          <Button
            key={item}
            aria-pressed={feature === item}
            onClick={() => {
              setFeature(item)
            }}
          >
            {item}
          </Button>
        ))}
      </Stack>
      <MotionGroup>
        <Card key={feature} data-ui-motion-key={feature}>
          <VisualEffect variant="mesh">
            <Typography>
              <h3>{feature}</h3>
              <p>{descriptions[feature]}</p>
            </Typography>
          </VisualEffect>
        </Card>
      </MotionGroup>
      <span role="status">{`Previewing ${feature.toLowerCase()}.`}</span>
    </Stack>
  )
}
