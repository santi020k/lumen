// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initThemeBuilders } from './runtime/features/theme-builder.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('standalone appearance controls initialize, update preview and export, and bind once', () => {
  document.body.innerHTML = `
    <div id="appearance-preview"></div>
    <div data-ui-theme-builder data-ui-theme-target="#appearance-preview">
      <select data-ui-theme-font-family><option value="sans">Sans</option><option value="serif">Serif</option></select>
      <select data-ui-theme-elevation><option value="default">Default</option><option value="flat">Flat</option></select>
      <textarea data-ui-theme-output></textarea>
    </div>`
  const root = document.querySelector<HTMLElement>('[data-ui-theme-builder]')
  const preview = document.querySelector<HTMLElement>('#appearance-preview')
  const font = document.querySelector<HTMLSelectElement>('[data-ui-theme-font-family]')
  const elevation = document.querySelector<HTMLSelectElement>('[data-ui-theme-elevation]')
  const output = document.querySelector<HTMLTextAreaElement>('[data-ui-theme-output]')
  if (!root || !preview || !font || !elevation || !output) throw new Error('Missing appearance fixture')

  initThemeBuilders(document)
  initThemeBuilders(document)
  expect(preview.style.getPropertyValue('--ui-font')).toBe('ui-sans-serif, system-ui, sans-serif')
  const originalShadow = preview.style.getPropertyValue('--ui-shadow-md')
  expect(originalShadow).not.toBe('none')

  const changed = vi.fn()
  root.addEventListener('ui:theme-change', changed)
  font.value = 'serif'
  font.dispatchEvent(new Event('input'))
  expect(changed).toHaveBeenCalledOnce()
  expect(preview.style.getPropertyValue('--ui-font')).toBe('ui-serif, Georgia, serif')
  expect(output.value).toContain('--ui-font: ui-serif, Georgia, serif;')

  elevation.value = 'flat'
  elevation.dispatchEvent(new Event('input'))
  expect(preview.style.getPropertyValue('--ui-shadow-md')).toBe('none')
  expect(output.value).toContain('--ui-shadow-md: none;')
  elevation.value = 'default'
  elevation.dispatchEvent(new Event('input'))
  expect(preview.style.getPropertyValue('--ui-shadow-md')).toBe(originalShadow)
})
