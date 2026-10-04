// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'

import { afterEach, expect, test } from 'vitest'

import { AttachmentList, AttachmentPreview, type AttachmentPreviewProps } from './attachments.js'

const roots: Root[] = []
afterEach(() => {
  act(() => {
    for (const root of roots.splice(0)) root.unmount()
  })
  document.body.replaceChildren()
})
const fixture = async (props: AttachmentPreviewProps) => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  await act(async () => {
    root.render(createElement(AttachmentPreview, props))
    await Promise.resolve()
  })
  return { container, root }
}

test('unsupported files show localized fallback and independent actions without requesting an image', () => {
  document.body.innerHTML = renderToStaticMarkup(createElement(AttachmentPreview, {
    src: '/example.pdf',
    contentType: 'application/pdf',
    alt: 'Example PDF',
    labels: { unavailable: 'Vista previa no disponible.' },
    actions: createElement('a', { href: '/example.pdf', download: true }, 'Descargar'),
    caption: 'Documento de ejemplo'
  }))
  expect(document.querySelector('img')).toBeNull()
  expect(document.querySelector('[role="status"]')?.textContent).toBe('Vista previa no disponible.')
  expect(document.querySelector('a')?.getAttribute('download')).toBe('')
  expect(document.querySelector('figcaption')?.textContent).toBe('Documento de ejemplo')
})

test('image failures, retry keys and source changes update accessible state and callback once', async () => {
  const states: string[] = []
  const props: AttachmentPreviewProps = { alt: 'Example', src: '/example.png', onStateChange: state => states.push(state) }
  const { container, root } = await fixture(props)
  await act(async () => {
    container.querySelector('img')?.dispatchEvent(new Event('error'))
    await Promise.resolve()
  })
  expect(container.querySelector('figure')?.dataset.state).toBe('error')
  expect(states).toEqual(['error'])
  await act(async () => {
    root.render(createElement(AttachmentPreview, { ...props, retryKey: 1 }))
    await Promise.resolve()
  })
  expect(container.querySelector('figure')?.dataset.state).toBe('ready')
  expect(states).toEqual(['error', 'ready'])
  await act(async () => {
    container.querySelector('img')?.dispatchEvent(new Event('error'))
    await Promise.resolve()
  })
  await act(async () => {
    root.render(createElement(AttachmentPreview, { ...props, src: '/replacement.png' }))
    await Promise.resolve()
  })
  expect(container.querySelector('figure')?.dataset.state).toBe('ready')
  expect(states).toEqual(['error', 'ready', 'error', 'ready'])
})

test('explicit loading is busy and list preserves native list semantics', async () => {
  const { container } = await fixture({ alt: 'Example', state: 'loading', labels: { loading: 'Cargando…' } })
  expect(container.querySelector('figure')?.getAttribute('aria-busy')).toBe('true')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Cargando…')
  document.body.innerHTML = renderToStaticMarkup(createElement(AttachmentList, { 'aria-label': 'Files' }, createElement('li', null, 'Example file')))
  expect(document.querySelector('ul')?.getAttribute('aria-label')).toBe('Files')
  expect(document.querySelector('ul > li')?.textContent).toBe('Example file')
})
