// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { renderLumenIllustrationSvg } from '@santi020k/lumen-core'
import { expect, test } from 'vitest'

import { Illustration } from './components.js'

test.each([
  ['Astro and Elements', () => renderLumenIllustrationSvg('error')],
  ['React', () => renderToStaticMarkup(createElement(Illustration, { variant: 'error' }))]
] as const)('%s draws both diagonals of the error symbol', (_adapter, render) => {
  const root = document.createElement('div')

  root.innerHTML = render()

  const diagonals = [...root.querySelectorAll('line')].map(line => [
    line.getAttribute('x1'),
    line.getAttribute('y1'),
    line.getAttribute('x2'),
    line.getAttribute('y2')
  ])

  expect(diagonals).toEqual([['49', '49', '71', '71'], ['71', '49', '49', '71']])
})
