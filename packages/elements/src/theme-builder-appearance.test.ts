import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { LumenThemeBuilderElement } from './define.js'

beforeAll(() => {
  if (!customElements.get('lumen-theme-builder')) customElements.define('lumen-theme-builder', LumenThemeBuilderElement)
})

afterEach(() => {
  document.body.replaceChildren()
})

test('appearance controls update live and reconnect without duplicate listeners', () => {
  document.body.innerHTML = `
    <div id="appearance-preview"></div>
    <lumen-theme-builder data-ui-theme-target="#appearance-preview">
      <select data-ui-theme-font-family><option value="sans">Sans</option><option value="mono">Mono</option></select>
      <select data-ui-theme-elevation><option value="default">Default</option><option value="flat">Flat</option></select>
      <textarea data-ui-theme-output></textarea>
    </lumen-theme-builder>`
  const root = document.querySelector<HTMLElement>('lumen-theme-builder')
  const preview = document.querySelector<HTMLElement>('#appearance-preview')
  const font = document.querySelector<HTMLSelectElement>('[data-ui-theme-font-family]')
  const elevation = document.querySelector<HTMLSelectElement>('[data-ui-theme-elevation]')
  const output = document.querySelector<HTMLTextAreaElement>('[data-ui-theme-output]')
  if (!root || !preview || !font || !elevation || !output) throw new Error('Missing appearance fixture')

  expect(preview.style.getPropertyValue('--ui-font')).toBe('ui-sans-serif, system-ui, sans-serif')
  const originalShadow = preview.style.getPropertyValue('--ui-shadow-md')
  font.value = 'mono'
  font.dispatchEvent(new Event('input'))
  expect(output.value).toContain('--ui-font: ui-monospace, monospace;')
  elevation.value = 'flat'
  elevation.dispatchEvent(new Event('input'))
  expect(preview.style.getPropertyValue('--ui-shadow-md')).toBe('none')

  root.remove()
  document.body.append(root)
  const changed = vi.fn()
  root.addEventListener('ui:theme-change', changed)
  elevation.value = 'default'
  elevation.dispatchEvent(new Event('input'))
  expect(changed).toHaveBeenCalledOnce()
  expect(preview.style.getPropertyValue('--ui-shadow-md')).toBe(originalShadow)
  expect(preview.style.getPropertyValue('--ui-font')).toBe('ui-monospace, monospace')
})
