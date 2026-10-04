import { expect, type Locator } from '@playwright/test'

export const verifyFocusNavigation = async (panel: Locator): Promise<void> => {
  await panel.evaluate(element => {
    element.insertAdjacentHTML('afterbegin', `
      <button id="focus-first">First available action</button>
      <div inert id="focus-inert"><button id="focus-restored">Temporarily unavailable action</button></div>
      <div hidden><button>Hidden action</button></div>
      <div style="visibility: hidden"><button>Invisible action</button></div>
      <button disabled tabindex="0">Disabled action</button>
      <fieldset disabled>
        <legend><button id="focus-legend">Available legend action</button></legend>
        <button tabindex="0">Disabled fieldset action</button>
      </fieldset>
    `)
    element.insertAdjacentHTML('beforeend', '<button id="focus-last">Last available action</button>')
  })
  const first = panel.locator('#focus-first')
  const last = panel.locator('#focus-last')
  for (const useVisibilityFallback of [false, true]) {
    if (useVisibilityFallback) {
      await panel.locator('button').evaluateAll(buttons => {
        for (const button of buttons) {
          Object.defineProperty(button, 'checkVisibility', { configurable: true, value: undefined })
        }
      })
    }
    await panel.locator('#focus-inert').evaluate(element => { element.setAttribute('inert', ''); })
    await first.focus()
    await first.press('ArrowDown')
    await expect(panel.locator('#focus-legend')).toBeFocused()
    await panel.locator('#focus-legend').press('End')
    await expect(last).toBeFocused()
    await last.press('Home')
    await expect(first).toBeFocused()
    await panel.locator('#focus-inert').evaluate(element => { element.removeAttribute('inert'); })
    await first.press('ArrowDown')
    await expect(panel.locator('#focus-restored')).toBeFocused()
  }
}
