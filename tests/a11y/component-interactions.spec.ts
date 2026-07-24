import { expect, type Page, test } from '@playwright/test'

const openPreview = async (page: Page, slug: string) => {
  await page.goto(`/docs/components/${slug}`)
  await expect(page.locator('.component-doc-preview')).toBeVisible()
}

test('Combobox filters and commits a keyboard selection', async ({ page }) => {
  await openPreview(page, 'combobox')

  const input = page.locator('.component-doc-preview [role="combobox"]')

  await input.fill('rea')
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await input.press('ArrowDown')
  await input.press('Enter')

  await expect(input).toHaveValue('react')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
})

test('Carousel controls move between pages of slides', async ({ page }) => {
  await openPreview(page, 'carousel')

  const preview = page.locator('.component-doc-preview')
  const viewport = preview.locator('[data-ui-carousel-viewport]')

  await expect(viewport).toHaveJSProperty('scrollLeft', 0)
  await preview.getByRole('button', { name: 'Next' }).click()

  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)

  await preview.getByRole('button', { name: 'Previous' }).click()

  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBe(0)
})

test('Cascader keeps parent-first columns, switches branches, and reopens after selection', async ({ page }) => {
  await openPreview(page, 'cascader')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.locator('[data-ui-cascader] [data-ui-trigger]')
  const panel = preview.locator('[data-ui-cascader] [data-ui-panel]')
  const visibleColumns = panel.locator('.ui-cascader__column:visible')

  await expect(panel).toBeHidden()
  await trigger.click()
  await expect(panel).toBeVisible()
  await expect(visibleColumns).toHaveCount(1)
  await expect(visibleColumns.nth(0).getByRole('option')).toContainText(['Category A', 'Category B'])

  const categoryA = preview.getByRole('option', { name: 'Category A' })
  const categoryB = preview.getByRole('option', { name: 'Category B' })

  await categoryA.focus()
  await categoryA.press('ArrowDown')
  await expect(categoryB).toBeFocused()
  await categoryB.press('Home')
  await expect(categoryA).toBeFocused()
  await categoryA.press('ArrowRight')
  await expect(preview.getByRole('option', { name: 'Item A1' })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(categoryA).toBeFocused()
  await expect(visibleColumns).toHaveCount(1)

  await categoryA.click()
  await expect(visibleColumns).toHaveCount(2)
  await expect(visibleColumns.nth(0)).toContainText('Category A')
  await expect(visibleColumns.nth(1).getByRole('option')).toHaveText(['Item A1', 'Item A2'])

  await categoryB.click()
  await expect(visibleColumns).toHaveCount(2)
  await expect(visibleColumns.nth(1).getByRole('option')).toHaveText(['Item B1'])

  await categoryA.click()
  await preview.getByRole('option', { name: 'Item A1' }).click()

  await expect(trigger).toContainText('Item A1')
  await expect(panel).toBeHidden()

  await trigger.click()
  await expect(panel).toBeVisible()
  await expect(visibleColumns).toHaveCount(2)
  await expect(visibleColumns.nth(0)).toContainText('Category A')
  await expect(visibleColumns.nth(1)).toContainText('Item A1')
})

test('ContextMenu opens from the keyboard and closes with Escape', async ({ page }) => {
  await openPreview(page, 'context-menu')

  const trigger = page.locator('.component-doc-preview [data-ui-context-menu-trigger]')
  const menu = page.locator('.component-doc-preview [role="menu"]')

  await trigger.focus()
  await trigger.press('Shift+F10')
  await expect(menu).toBeVisible()
  await expect(menu).toHaveAttribute('data-state', 'open')
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
})

test('DropdownMenu restores its closed state after Escape', async ({ page }) => {
  await openPreview(page, 'dropdown-menu')

  const trigger = page.locator('.component-doc-preview [data-ui-trigger]')
  const menu = page.locator('.component-doc-preview [role="menu"]')

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toBeHidden()
})

test('Field reports invalid and valid form states', async ({ page }) => {
  await openPreview(page, 'field')

  const preview = page.locator('.component-doc-preview')
  const status = preview.locator('[data-ex-form-status]')

  await preview.getByRole('button', { name: 'Request access' }).click()
  await expect(status).toHaveText('Resolve the highlighted fields.')

  await preview.getByLabel('Email').fill('team@example.com')
  await preview.getByLabel('Workspace slug').fill('lumen-team')
  await preview.getByLabel('Invite code').fill('LUMEN-2026')
  await preview.getByRole('button', { name: 'Request access' }).click()

  await expect(status).toHaveText('Form is ready to submit.')
})

for (const [slug, role] of [
  ['menubar', 'menuitem'],
  ['navigation-menu', 'link']
] as const) {
  test(`${slug} supports horizontal keyboard navigation`, async ({ page }) => {
    await openPreview(page, slug)

    const items = page.locator(`.component-doc-preview [role="${role}"], .component-doc-preview a`)
    const first = items.nth(0)
    const second = items.nth(1)

    await first.focus()
    await first.press('ArrowRight')

    await expect(second).toBeFocused()
  })
}

test('RadioGroup changes selection with arrow keys', async ({ page }) => {
  await openPreview(page, 'radio-group')

  const light = page.locator('.component-doc-preview input[value="light"]')
  const dark = page.locator('.component-doc-preview input[value="dark"]')

  await expect(dark).toBeChecked()
  await dark.focus()
  await dark.press('ArrowLeft')

  await expect(light).toBeChecked()
})

test('RichTextEditor applies a toolbar command to selected content', async ({ page }) => {
  await openPreview(page, 'rich-text-editor')

  const preview = page.locator('.component-doc-preview')
  const editor = preview.locator('[contenteditable="true"]')
  const bold = preview.getByRole('button', { name: 'Bold' })

  await editor.focus()
  await page.keyboard.press('ControlOrMeta+A')
  await bold.click()

  await expect(editor.locator('b, strong')).not.toHaveCount(0)
})

test('Schedule moves an event between slots', async ({ page }) => {
  await openPreview(page, 'schedule')

  const planning = page.locator('#schedule-planning')
  const friday = page.locator('[data-ui-schedule-slot="friday"]')

  await planning.dragTo(friday)

  await expect(friday.locator('#schedule-planning')).toHaveCount(1)
})

test('Toast creates a live notification', async ({ page }) => {
  await openPreview(page, 'toast')

  await page.locator('.component-doc-preview [data-ex-toast="success"]').click()

  const toast = page.locator('[data-ui-toast][data-state="open"]')

  await expect(toast).toContainText('Published')
  await expect(toast).toContainText('The latest version is now live.')
})

test('Tour opens from its linked trigger and closes from its action', async ({ page }) => {
  await openPreview(page, 'tour')

  const preview = page.locator('.component-doc-preview')
  const tour = preview.locator('[data-ui-tour]')

  await expect(tour).toBeHidden()
  await preview.getByRole('button', { name: 'Start guided tour' }).click()
  await expect(tour).toBeVisible()
  await expect(tour.getByRole('dialog')).toContainText('Click this button to get started.')

  await tour.getByRole('button', { name: 'Done' }).click()
  await expect(tour).toBeHidden()
})

test('Tabs switches panels with arrow keys', async ({ page }) => {
  await openPreview(page, 'tabs')

  const preview = page.locator('.component-doc-preview')
  const astroTab = preview.getByRole('tab', { name: 'Astro' })
  const reactTab = preview.getByRole('tab', { name: 'React' })

  await astroTab.focus()
  await astroTab.press('ArrowRight')

  await expect(reactTab).toHaveAttribute('aria-selected', 'true')
  await expect(preview.getByRole('tabpanel', { name: 'React' })).toBeVisible()
})

test('TagGroup removes a selected tag', async ({ page }) => {
  await openPreview(page, 'tag-group')

  const preview = page.locator('.component-doc-preview')

  await preview.getByRole('button', { name: 'Remove Astro' }).click()

  await expect(preview.getByText('Astro', { exact: true })).toHaveCount(0)
  await expect(preview.getByRole('listitem').filter({ hasText: 'Accessible' })).toBeVisible()
})

test('ToggleGroup moves focus and pressed state with arrow keys', async ({ page }) => {
  await openPreview(page, 'toggle-group')

  const day = page.getByRole('button', { name: 'Day' })
  const week = page.getByRole('button', { name: 'Week' })

  await day.focus()
  await day.press('ArrowRight')

  await expect(week).toBeFocused()
  await expect(week).toHaveAttribute('aria-pressed', 'true')
})

test('VirtualList updates its rendered window while scrolling', async ({ page }) => {
  await openPreview(page, 'virtual-list')

  const list = page.locator('.component-doc-preview [data-ui-virtual-list]')
  const initialStart = await list.getAttribute('data-ui-range-start')

  await list.evaluate(element => {
    element.scrollTop = element.scrollHeight
    element.dispatchEvent(new Event('scroll', { bubbles: true }))
  })

  await expect(list).not.toHaveAttribute('data-ui-range-start', initialStart ?? '0')
  await expect(list.locator('[data-ui-virtual-list-item]')).not.toHaveCount(200)
})
