import { expect, test } from '@playwright/test'

test('adopted chart updates preserve action focus and retained viewport buttons remain usable', async ({ page }) => {
  await page.goto('/internal/elements-boundaries')
  await page.evaluate(() => Promise.all(['lumen-bar-chart', 'lumen-media-viewport'].map(name => customElements.whenDefined(name))))
  const result = await page.evaluate(() => {
    const required = <T,>(value: T | null, label: string): T => {
      if (value === null) throw new Error(`Missing ${label}`)

      return value
    }
    const chart = required(document.querySelector('lumen-bar-chart'), 'chart')
    const viewport = required(document.querySelector('lumen-media-viewport'), 'viewport')
    const iframe = document.createElement('iframe')

    iframe.title = 'Adopted controls'
    document.body.append(iframe)
    const destination = required(iframe.contentDocument, 'destination document')

    destination.body.append(destination.adoptNode(chart), destination.adoptNode(viewport))
    chart.setAttribute('datum-action-prefix', 'Open: ')
    const action = required(chart.querySelector('button'), 'chart action')
    const disclosure = required(chart.querySelector<HTMLDetailsElement>('[data-ui-chart-actions]'), 'action disclosure')

    disclosure.open = true
    action.focus()
    const initialFocusKey = destination.activeElement?.getAttribute('data-ui-chart-action-key')
    const key = action.getAttribute('data-ui-chart-action-key')

    chart.setAttribute('datum-action-prefix', 'Details: ')
    const focused = destination.activeElement
    const zoom = required(viewport.querySelector<HTMLButtonElement>('[data-ui-media-viewport-action="zoom-in"]'), 'zoom button')
    const fit = required(viewport.querySelector<HTMLButtonElement>('[data-ui-media-viewport-action="fit"]'), 'fit button')

    const retainedSourceWrapper = zoom instanceof Element

    zoom.click()
    const firstZoom = viewport.getAttribute('zoom')
    const child = destination.createElement('span')

    zoom.append(child)
    child.click()
    const secondZoom = viewport.getAttribute('zoom')

    fit.click()

    return {
      initialFocusKey, focusKey: focused?.getAttribute('data-ui-chart-action-key'), key,
      focusLabel: focused?.textContent, destinationCreated: !(focused instanceof Element),
      retainedSourceWrapper, firstZoom, secondZoom, fitZoom: viewport.getAttribute('zoom')
    }
  })

  expect(result.initialFocusKey).toBe(result.key)
  expect(result.focusKey).toBe(result.key)
  expect(result).toMatchObject({ focusLabel: expect.stringContaining('Details: '), destinationCreated: true, retainedSourceWrapper: true, firstZoom: '1.25', secondZoom: '1.5', fitZoom: '1' })
})

test('a real Elements upload reset clears native files and live feedback while cancellation preserves both', async ({ page }) => {
  await page.goto('/internal/elements-boundaries')
  await page.evaluate(() => customElements.whenDefined('lumen-file-upload'))
  const input = page.getByLabel('Upload files')
  const upload = page.locator('lumen-file-upload')
  const summary = upload.locator('[data-ui-file-upload-files]')
  const selected = { name: 'selected.txt', mimeType: 'text/plain', buffer: Buffer.from('Example') }

  await input.setInputFiles(selected)
  await expect(summary).toHaveText('selected.txt')
  await expect(upload).toHaveAttribute('data-state', 'selected')
  await page.getByRole('button', { name: 'Reset upload' }).click()
  await expect.poll(() => input.evaluate(element => element instanceof HTMLInputElement ? element.files?.length : undefined)).toBe(0)
  await expect(summary).toBeEmpty()
  await expect(upload).toHaveAttribute('data-state', 'idle')

  await input.setInputFiles(selected)
  await page.locator('#upload-form').evaluate(form => {
    form.addEventListener('reset', event => { event.preventDefault() }, { once: true })
  })
  await page.getByRole('button', { name: 'Reset upload' }).click()
  await expect(summary).toHaveText('selected.txt')
  await expect(upload).toHaveAttribute('data-state', 'selected')
  expect(await input.evaluate(element => element instanceof HTMLInputElement ? element.files?.length : undefined)).toBe(1)
})

test('adopted Elements maps inspect and select destination-created SVG countries', async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/internal/elements-boundaries')
  await page.evaluate(() => customElements.whenDefined('lumen-world-map'))
  const result = await page.locator('lumen-world-map').evaluate(map => {
    const iframe = document.createElement('iframe')

    iframe.title = 'Adopted map'
    document.body.append(iframe)
    const destination = iframe.contentDocument

    if (!destination) throw new Error('Missing destination document')

    destination.body.append(destination.adoptNode(map))
    const country = map.querySelector('[data-country="CO"]')
    const inspection = map.querySelector('.ui-world-map__inspection')

    if (!country || !inspection) throw new Error('Missing destination country')

    const selections: unknown[] = []

    map.addEventListener('ui:world-map-select', event => {
      if ('detail' in event) selections.push(event.detail)
    })
    country.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    const hovered = inspection.textContent

    country.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    return {
      destinationOwned: country.ownerDocument === destination,
      sourceRealmElement: country instanceof Element,
      hovered,
      selected: map.getAttribute('selected-country'),
      selections
    }
  })

  expect(result).toMatchObject({ destinationOwned: true, sourceRealmElement: false, hovered: 'Colombia', selected: 'CO', selections: [{ countryId: 'CO', label: 'Colombia' }] })
  expect(errors).toEqual([])
})
