import { expect, test } from '@playwright/test'

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
