// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { createLumenAttachmentPreviewController, resolveLumenAttachmentPreviewState } from './attachments.js'

const controllers: ReturnType<typeof createLumenAttachmentPreviewController>[] = []
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy()
  document.body.replaceChildren()
})

const fixture = () => {
  const root = document.createElement('figure')
  root.setAttribute('data-ui-attachment-preview', '')
  root.innerHTML = '<div data-slot="attachment-preview-media"><img data-ui-attachment-preview-image src="/synthetic.png" alt="Example document"></div><p data-ui-attachment-preview-message role="status"></p>'
  document.body.append(root)
  const image = root.querySelector('img')
  if (!image) throw new Error('Fixture image missing')
  Object.defineProperty(image, 'complete', { configurable: true, value: false })
  const controller = createLumenAttachmentPreviewController(root)
  controllers.push(controller)
  return { root, image, controller }
}

test('resolves missing and unsupported files without interpreting documents as images', () => {
  expect(resolveLumenAttachmentPreviewState()).toBe('unavailable')
  expect(resolveLumenAttachmentPreviewState(' ')).toBe('unavailable')
  expect(resolveLumenAttachmentPreviewState('/file.pdf', 'application/pdf')).toBe('unavailable')
  expect(resolveLumenAttachmentPreviewState('blob:example', ' IMAGE/PNG ')).toBe('ready')
  expect(resolveLumenAttachmentPreviewState('/image.png', 'image/png', undefined, true)).toBe('error')
  expect(resolveLumenAttachmentPreviewState(undefined, undefined, 'loading')).toBe('loading')
})

test('announces safe localized failure once and restores preview after a source replacement', async () => {
  const { root, image } = fixture()
  root.setAttribute('error-label', 'No se pudo cargar la vista previa.')
  const states: unknown[] = []
  root.addEventListener('ui:attachment-preview-change', event => {
    if (event instanceof CustomEvent) states.push(event.detail)
  })
  image.dispatchEvent(new Event('error'))
  image.dispatchEvent(new Event('error'))
  expect(root.dataset.state).toBe('error')
  expect(root.querySelector('p')?.textContent).toBe('No se pudo cargar la vista previa.')
  expect(states).toEqual([{ state: 'error' }])
  expect(root.querySelector<HTMLElement>('[data-slot="attachment-preview-media"]')?.hidden).toBe(true)
  image.src = '/replacement.png'
  await Promise.resolve()
  expect(root.dataset.state).toBe('ready')
  expect(states).toEqual([{ state: 'error' }, { state: 'ready' }])
})

test('honors explicit loading and retry state without exposing a source in events', async () => {
  const { root, image } = fixture()
  root.setAttribute('state', 'loading')
  await Promise.resolve()
  expect(root.getAttribute('aria-busy')).toBe('true')
  image.dispatchEvent(new Event('error'))
  expect(root.dataset.state).toBe('loading')
  root.removeAttribute('state')
  await Promise.resolve()
  expect(root.dataset.state).toBe('error')
  root.setAttribute('retry-key', '1')
  await Promise.resolve()
  expect(root.dataset.state).toBe('ready')
  expect(root.getAttribute('aria-busy')).toBe('false')
})

test('isolates nested previews and follows newly inserted owned images', async () => {
  const { root, image } = fixture()
  const nested = document.createElement('figure')
  nested.setAttribute('data-ui-attachment-preview', '')
  nested.innerHTML = '<img data-ui-attachment-preview-image src="/nested.png">'
  root.prepend(nested)
  nested.querySelector('img')?.dispatchEvent(new Event('error'))
  expect(root.dataset.state).toBe('ready')
  const replacement = document.createElement('img')
  replacement.setAttribute('data-ui-attachment-preview-image', '')
  replacement.src = '/new.png'
  Object.defineProperty(replacement, 'complete', { configurable: true, value: false })
  image.replaceWith(replacement)
  await Promise.resolve()
  replacement.dispatchEvent(new Event('error'))
  expect(root.dataset.state).toBe('error')
})

test('recognizes cached failures and leaves no listeners or observers after destruction', async () => {
  const { root, image, controller } = fixture()
  controller.destroy()
  Object.defineProperty(image, 'complete', { configurable: true, value: true })
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 0 })
  const cached = createLumenAttachmentPreviewController(root)
  controllers.push(cached)
  expect(root.dataset.state).toBe('error')
  cached.destroy()
  root.setAttribute('state', 'loading')
  image.dispatchEvent(new Event('load'))
  cached.refresh()
  await Promise.resolve()
  expect(root.dataset.state).toBe('error')
})
