import { expect, test } from '@playwright/test'

test('Elements submit buttons preserve native validation, overrides and external form ownership', async ({ page }) => {
  await page.goto('/visual/elements')
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-button')

    const fixture = document.createElement('div')

    fixture.innerHTML = `<form id="button-review-form" data-submits="0" data-invalid="0">
      <input aria-label="Review title" name="title" required>
      <input name="requestSubmit" type="hidden" value="shadowed">
    </form>
    <lumen-button form="button-review-form" type="submit" name="intent" value="draft"
      formaction="/save-review" formenctype="multipart/form-data" formmethod="post" formtarget="review-target">
      Save review draft
    </lumen-button>`

    const form = fixture.querySelector('form')

    if (!form) throw new Error('Missing form fixture')

    form.addEventListener('invalid', () => {
      form.dataset.invalid = String(Number(form.dataset.invalid) + 1)
    }, true)
    form.addEventListener('submit', event => {
      event.preventDefault()

      const submitter = event.submitter

      if (!(submitter instanceof HTMLButtonElement)) throw new Error('Missing native submitter')

      const intent = new FormData(form, submitter).get('intent')

      if (typeof intent !== 'string') throw new Error('Missing submitter value')

      form.dataset.submits = String(Number(form.dataset.submits) + 1)
      form.dataset.intent = intent
      form.dataset.action = submitter.formAction
      form.dataset.encoding = submitter.formEnctype
      form.dataset.method = submitter.formMethod
      form.dataset.target = submitter.formTarget
      form.dataset.skipValidation = String(submitter.formNoValidate)
    })
    document.body.prepend(fixture)
  })

  const form = page.locator('#button-review-form')
  const button = page.getByRole('button', { name: 'Save review draft', exact: true })

  await button.click()
  await expect(form).toHaveAttribute('data-invalid', '1')
  await expect(form).toHaveAttribute('data-submits', '0')
  // Move focus away from the invalid field so native validation UI cannot consume the next click.
  await button.focus()
  await button.evaluate(element => {
    element.setAttribute('formnovalidate', '')
  })
  await button.click()
  await expect(form).toHaveAttribute('data-submits', '1')
  await expect(form).toHaveAttribute('data-invalid', '1')
  await expect(form).toHaveAttribute('data-intent', 'draft')
  await expect(form).toHaveAttribute('data-action', new URL('/save-review', page.url()).href)
  await expect(form).toHaveAttribute('data-encoding', 'multipart/form-data')
  await expect(form).toHaveAttribute('data-method', 'post')
  await expect(form).toHaveAttribute('data-target', 'review-target')
  await expect(form).toHaveAttribute('data-skip-validation', 'true')

  await button.evaluate(element => {
    element.removeAttribute('formnovalidate')
  })
  await page.getByRole('textbox', { name: 'Review title', exact: true }).fill('Saved draft')
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(form).toHaveAttribute('data-submits', '2')
  await page.keyboard.press('Space')
  await expect(form).toHaveAttribute('data-submits', '3')
  await expect(form).toHaveAttribute('data-skip-validation', 'false')
})

test('Elements native dialogs preserve interior clicks and dismiss only backdrop presses', async ({ page }) => {
  await page.goto('/visual/elements')
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-dialog')

    const owner = document.createElement('lumen-dialog')

    owner.id = 'padding-review-owner'
    owner.innerHTML = '<dialog id="padding-review-dialog" style="width:320px;height:180px;padding:30px"><input aria-label="Editing review" value="Unsaved work"></dialog>'
    document.body.prepend(owner)

    const hasShowAction = (element: HTMLElement): element is HTMLElement & { show: () => void } => (
      'show' in element && typeof element.show === 'function'
    )

    if (!hasShowAction(owner)) throw new Error('Missing dialog show action')

    owner.show()
  })

  const dialog = page.locator('#padding-review-dialog')
  const bounds = await dialog.boundingBox()

  if (!bounds) throw new Error('Missing open dialog bounds')

  const inside = { x: bounds.x + 10, y: bounds.y + 10 }
  const outside = { x: bounds.x + bounds.width / 2, y: bounds.y - 10 }

  await page.mouse.click(inside.x, inside.y)
  await expect(dialog).toBeVisible()
  await page.mouse.move(inside.x, inside.y)
  await page.mouse.down()
  await page.mouse.move(outside.x, outside.y)
  await page.mouse.up()
  await expect(dialog).toBeVisible()
  await page.mouse.click(outside.x, outside.y)
  await expect(dialog).not.toBeVisible()
})
