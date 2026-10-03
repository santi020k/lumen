// @vitest-environment jsdom
import { expect, test } from 'vitest'

import { getLumenDirectionalKey } from './direction.js'

test('uses inherited direction and responds to direction changes', () => {
  const root = document.createElement('div')
  const button = document.createElement('button')

  root.dir = 'rtl'
  root.append(button)
  document.body.append(root)
  expect(getLumenDirectionalKey(button, 'ArrowLeft')).toBe('ArrowRight')
  expect(getLumenDirectionalKey(button, 'ArrowRight')).toBe('ArrowLeft')
  expect(getLumenDirectionalKey(button, 'ArrowDown')).toBe('ArrowDown')
  expect(getLumenDirectionalKey(button, 'Home')).toBe('Home')
  root.dir = 'ltr'
  expect(getLumenDirectionalKey(button, 'ArrowRight')).toBe('ArrowRight')
  button.style.direction = 'rtl'
  expect(getLumenDirectionalKey(button, 'ArrowRight')).toBe('ArrowLeft')
  root.remove()
})
