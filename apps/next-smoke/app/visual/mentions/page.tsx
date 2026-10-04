'use client'

import { createElement, useEffect } from 'react'

import { Button, Container, Input, Mentions, Stack, Typography } from '@santi020k/lumen-react'

export default function MentionsKeyboardFixture() {
  useEffect(() => {
    const register = async () => {
      const { defineLumenElements } = await import('@santi020k/lumen-elements/define')

      defineLumenElements()
    }

    void register()
  }, [])

  return (
    <Container as="main">
      <Typography><h1>Mentions keyboard navigation</h1></Typography>
      <Stack>
        <Button>Before React mentions</Button>
        <Mentions label="React mentions" options={['alice', 'bob']} />
        <Input aria-label="After React mentions" />
        <Button>Before Elements mentions</Button>
        {createElement('lumen-mentions', { label: 'Elements mentions' }, createElement('textarea', { 'data-ui-mentions-input': true }), createElement('ul', { 'data-ui-mentions-list': true, hidden: true }, ...['alice', 'bob'].map(value => createElement('li', { key: value, role: 'presentation' }, createElement('button', { 'data-ui-mentions-option': true, 'data-value': value, role: 'option', type: 'button' }, value)))))}
        <Input aria-label="After Elements mentions" />
      </Stack>
    </Container>
  )
}
