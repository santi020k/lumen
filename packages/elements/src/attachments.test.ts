import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
})

test('registers a list and enhances a localized image preview across disconnect and reconnect', async () => {
  const root = document.createElement('lumen-attachment-preview')
  root.setAttribute('error-label', 'No se pudo cargar.')
  root.innerHTML = '<div data-slot="attachment-preview-media"><img data-ui-attachment-preview-image src="/example.png" alt="Example"></div><p data-slot="attachment-preview-fallback" data-ui-attachment-preview-message role="status"></p><a href="/example.png" download>Download</a>'
  const image = root.querySelector('img')
  if (!image) throw new Error('Fixture image missing')
  Object.defineProperty(image, 'complete', { configurable: true, value: false })
  document.body.append(root)
  expect(root.getAttribute('role')).toBe('figure')
  image.dispatchEvent(new Event('error'))
  expect(root.dataset.state).toBe('error')
  expect(root.querySelector('p')?.textContent).toBe('No se pudo cargar.')
  expect(root.querySelector('a')?.getAttribute('href')).toBe('/example.png')
  root.remove()
  root.setAttribute('state', 'loading')
  await Promise.resolve()
  expect(root.dataset.state).toBe('error')
  document.body.append(root)
  expect(root.dataset.state).toBe('loading')
  expect(root.getAttribute('aria-busy')).toBe('true')
  const list = document.createElement('lumen-attachment-list')
  list.innerHTML = '<li>Example file</li>'
  document.body.append(list)
  expect(list.getAttribute('role')).toBe('list')
  expect(list.querySelector('li')?.textContent).toBe('Example file')
})
