'use client'

import { createElement, useEffect, useState } from 'react'

import { Alert, Button, Card, Progress, Skeleton, Spinner, Stack, Typography, VisuallyHidden } from '@santi020k/lumen-react'

export default function LoadingStatesPage() {
  const [elementsError, setElementsError] = useState(false)

  useEffect(() => {
    void import('@santi020k/lumen-elements/define').then(({ defineLumenElements }) => {
      defineLumenElements(['Button', 'Progress', 'Skeleton', 'Spinner'])

      return true
    }).catch(() => {
      setElementsError(true)
    })
  }, [])

  return (
    <Stack as="main" className="visual-host" gap="section">
      <Typography><h1>Loading states</h1></Typography>
      {elementsError && <Alert role="alert">Elements preview unavailable</Alert>}
      <Card data-loading-framework="react">
        <Typography><h2>React</h2></Typography>
        <Stack aria-busy role="status" gap="related" data-loading-group="react">
          <VisuallyHidden>Loading React dashboard</VisuallyHidden>
          <Stack direction="horizontal" gap="related" align="center">
            <Skeleton shape="circle" width={40} data-loading-shape="circle" />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Skeleton shape="text" width="40%" data-loading-shape="text" />
              <Skeleton height={8} width="80%" data-loading-shape="bar" />
            </Stack>
          </Stack>
          <Skeleton animation="pulse" height={48} data-loading-shape="pulse" />
        </Stack>
        <Stack direction="horizontal" gap="related" align="center">
          <Spinner aria-label="Saving React changes" data-loading-spinner="named" />
          <Spinner data-loading-spinner="decorative" />
          <Button loading>React save</Button>
        </Stack>
        <Skeleton animation="none" style={{ width: 96 }} data-loading-content="text">
          Placeholder content wraps across several lines
        </Skeleton>
        <Progress aria-label="React upload" max={Number.POSITIVE_INFINITY} value={40} />
      </Card>
      <Card data-loading-framework="elements">
        <Typography><h2>Elements</h2></Typography>
        <Stack aria-busy role="status" gap="related" data-loading-group="elements">
          <VisuallyHidden>Loading Elements dashboard</VisuallyHidden>
          {createElement('lumen-skeleton', { shape: 'circle', width: '40', 'data-loading-shape': 'circle' })}
          {createElement('lumen-skeleton', { shape: 'text', width: '40%', 'data-loading-shape': 'text' })}
          {createElement('lumen-skeleton', { height: '8', width: '80%', 'data-loading-shape': 'bar' })}
          {createElement('lumen-skeleton', { animation: 'pulse', height: '48', 'data-loading-shape': 'pulse' })}
        </Stack>
        <Stack direction="horizontal" gap="related" align="center">
          {createElement('lumen-spinner', { 'aria-label': 'Saving Elements changes', 'data-loading-spinner': 'named' })}
          {createElement('lumen-spinner', { 'data-loading-spinner': 'decorative' })}
          {createElement('lumen-button', { loading: '' }, 'Elements save')}
        </Stack>
        {createElement('lumen-skeleton', { animation: 'none', style: { width: 96 }, 'data-loading-content': 'text' }, 'Placeholder content wraps across several lines')}
        {createElement('lumen-progress', { 'aria-label': 'Elements upload', max: 'Infinity', value: '40' })}
      </Card>
    </Stack>
  )
}
