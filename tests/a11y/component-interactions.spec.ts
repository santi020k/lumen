/* eslint-disable playwright/no-standalone-expect -- behaviorTest is a typed wrapper around Playwright's test function. */

import { expect, type Page, test } from '@playwright/test'

import type { LumenComponentName } from '../../packages/core/src/components.js'

import { runtimeBehaviorComponentNames } from './component-coverage.js'

const openPreview = async (page: Page, slug: string) => {
  await page.goto(`/docs/components/${slug}`)
  await expect(page.locator('.component-doc-preview')).toBeVisible()
}

type BehaviorTestBody = (fixtures: { page: Page }) => Promise<void>

const registeredBehaviorComponents = new Set<LumenComponentName>()
const behaviorTest = (
  components: readonly LumenComponentName[],
  title: string,
  body: BehaviorTestBody
) => {
  for (const component of components) {
    if (registeredBehaviorComponents.has(component)) {
      throw new Error(`${component} has more than one primary behavior scenario.`)
    }

    registeredBehaviorComponents.add(component)
  }

  test(title, body)
}

behaviorTest(['Combobox'], 'Combobox filters and commits a keyboard selection', async ({ page }) => {
  await openPreview(page, 'combobox')

  const input = page.locator('.component-doc-preview [role="combobox"]')

  await input.fill('rea')
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await input.press('ArrowDown')
  await input.press('Enter')

  await expect(input).toHaveValue('react')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
})

behaviorTest(['Carousel'], 'Carousel controls move between pages of slides', async ({ page }) => {
  await openPreview(page, 'carousel')

  const preview = page.locator('.component-doc-preview')
  const viewport = preview.locator('[data-ui-carousel-viewport]')

  await expect(viewport).toHaveJSProperty('scrollLeft', 0)
  await preview.getByRole('button', { name: 'Next' }).click()

  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)

  await preview.getByRole('button', { name: 'Previous' }).click()

  await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBe(0)
})

behaviorTest(['Cascader'], 'Cascader keeps parent-first columns, switches branches, and reopens after selection', async ({ page }) => {
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

behaviorTest(['SpeedDial'], 'SpeedDial supports trigger, menu, and dismissal keyboard behavior', async ({ page }) => {
  await openPreview(page, 'speed-dial')

  const preview = page.locator('.component-doc-preview')
  const root = preview.locator('[data-ui-speed-dial]')
  const trigger = preview.getByRole('button', { name: 'Create new' })
  const firstAction = preview.getByRole('menuitem', { name: 'New document' })
  const lastAction = preview.getByRole('menuitem', { name: 'Upload media' })

  await expect(root).toHaveAttribute('data-state', 'open')
  await trigger.click()
  await expect(root).toHaveAttribute('data-state', 'closed')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await trigger.press('ArrowDown')
  await expect(root).toHaveAttribute('data-state', 'open')
  await expect(firstAction).toBeFocused()

  await firstAction.press('End')
  await expect(lastAction).toBeFocused()
  await lastAction.press('Escape')
  await expect(root).toHaveAttribute('data-state', 'closed')
  await expect(trigger).toBeFocused()
})

behaviorTest(['ContextMenu'], 'ContextMenu opens from the keyboard and closes with Escape', async ({ page }) => {
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

behaviorTest(['DropdownMenu'], 'DropdownMenu restores its closed state after Escape', async ({ page }) => {
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

behaviorTest(['Field'], 'Field reports invalid and valid form states', async ({ page }) => {
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

const rovingNavigationScenario = (slug: string, role: 'link' | 'menuitem'): BehaviorTestBody =>
  async ({ page }) => {
    await openPreview(page, slug)

    const items = page.locator(`.component-doc-preview [role="${role}"], .component-doc-preview a`)
    const first = items.nth(0)
    const second = items.nth(1)

    await first.focus()
    await first.press('ArrowRight')

    await expect(second).toBeFocused()
  }

behaviorTest(
  ['Menubar'],
  'Menubar supports horizontal keyboard navigation',
  rovingNavigationScenario('menubar', 'menuitem')
)

behaviorTest(
  ['NavigationMenu'],
  'NavigationMenu supports horizontal keyboard navigation',
  rovingNavigationScenario('navigation-menu', 'link')
)

behaviorTest(['RadioGroup'], 'RadioGroup changes selection with arrow keys', async ({ page }) => {
  await openPreview(page, 'radio-group')

  const light = page.locator('.component-doc-preview input[value="light"]')
  const dark = page.locator('.component-doc-preview input[value="dark"]')

  await expect(dark).toBeChecked()
  await dark.focus()
  await dark.press('ArrowLeft')

  await expect(light).toBeChecked()
})

behaviorTest(['RichTextEditor'], 'RichTextEditor applies a toolbar command to selected content', async ({ page }) => {
  await openPreview(page, 'rich-text-editor')

  const preview = page.locator('.component-doc-preview')
  const editor = preview.locator('[contenteditable="true"]')
  const bold = preview.getByRole('button', { name: 'Bold' })

  await editor.focus()
  await page.keyboard.press('ControlOrMeta+A')
  await bold.click()

  await expect(editor.locator('b, strong')).not.toHaveCount(0)
})

behaviorTest(['Schedule'], 'Schedule moves an event between slots', async ({ page }) => {
  await openPreview(page, 'schedule')

  const planning = page.locator('#schedule-planning')
  const friday = page.locator('[data-ui-schedule-slot="friday"]')

  await planning.dragTo(friday)

  await expect(friday.locator('#schedule-planning')).toHaveCount(1)
})

behaviorTest(['Toast', 'Sonner'], 'Toast creates a live notification in the Sonner viewport', async ({ page }) => {
  await openPreview(page, 'toast')

  await page.locator('.component-doc-preview [data-ex-toast="success"]').click()

  const toast = page.locator('[data-ui-toast][data-state="open"]')

  await expect(toast).toContainText('Published')
  await expect(toast).toContainText('The latest version is now live.')
})

behaviorTest(['Tour'], 'Tour opens from its linked trigger and closes from its action', async ({ page }) => {
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

behaviorTest(['Tabs'], 'Tabs switches panels with arrow keys', async ({ page }) => {
  await openPreview(page, 'tabs')

  const preview = page.locator('.component-doc-preview')
  const astroTab = preview.getByRole('tab', { name: 'Astro' })
  const reactTab = preview.getByRole('tab', { name: 'React' })

  await astroTab.focus()
  await astroTab.press('ArrowRight')

  await expect(reactTab).toHaveAttribute('aria-selected', 'true')
  await expect(preview.getByRole('tabpanel', { name: 'React' })).toBeVisible()
})

behaviorTest(['TagGroup'], 'TagGroup removes a selected tag', async ({ page }) => {
  await openPreview(page, 'tag-group')

  const preview = page.locator('.component-doc-preview')

  await preview.getByRole('button', { name: 'Remove Astro' }).click()

  await expect(preview.getByText('Astro', { exact: true })).toHaveCount(0)
  await expect(preview.getByRole('listitem').filter({ hasText: 'Accessible' })).toBeVisible()
})

behaviorTest(['ToggleGroup'], 'ToggleGroup moves focus and pressed state with arrow keys', async ({ page }) => {
  await openPreview(page, 'toggle-group')

  const day = page.getByRole('button', { name: 'Day' })
  const week = page.getByRole('button', { name: 'Week' })

  await day.focus()
  await day.press('ArrowRight')

  await expect(week).toBeFocused()
  await expect(week).toHaveAttribute('aria-pressed', 'true')
})

behaviorTest(['VirtualList'], 'VirtualList updates its rendered window while scrolling', async ({ page }) => {
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

const dialogScenario = (
  slug: string,
  openLabel: string,
  closeLabel: string
): BehaviorTestBody => async ({ page }) => {
  await openPreview(page, slug)

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.getByRole('button', { name: openLabel })
  const dialog = preview.locator('dialog')

  await expect(dialog).toBeHidden()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')

  await dialog.getByRole('button', { name: closeLabel }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
}

behaviorTest(
  ['AlertDialog'],
  'AlertDialog opens, closes, and restores trigger focus',
  dialogScenario('alert-dialog', 'Delete project', 'Cancel')
)

behaviorTest(
  ['Dialog'],
  'Dialog opens, closes, and restores trigger focus',
  dialogScenario('dialog', 'Edit profile', 'Cancel')
)

behaviorTest(
  ['Drawer'],
  'Drawer opens, closes, and restores trigger focus',
  dialogScenario('drawer', 'Open filters', 'Close')
)

behaviorTest(
  ['Sheet'],
  'Sheet opens, closes, and restores trigger focus',
  dialogScenario('sheet', 'Open details', 'Close')
)

behaviorTest(['Popover'], 'Popover toggles and dismisses with Escape', async ({ page }) => {
  await openPreview(page, 'popover')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.getByRole('button', { name: 'Invite teammates' })
  const panel = preview.locator('[data-ui-popover] > div').last()

  await expect(panel).toBeHidden()
  await trigger.click()
  await expect(panel).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

behaviorTest(['Popconfirm'], 'Popconfirm opens its confirmation dialog and dismisses with Escape', async ({ page }) => {
  await openPreview(page, 'popconfirm')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.locator('[data-ui-popconfirm] [data-ui-trigger]')
  const panel = preview.getByRole('dialog')

  await expect(panel).toBeHidden()
  await trigger.getByRole('button', { name: 'Delete' }).click()
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Cancel' }).focus()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

behaviorTest(['HoverCard'], 'HoverCard opens for keyboard focus and closes on Escape', async ({ page }) => {
  await openPreview(page, 'hover-card')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.getByRole('button', { name: 'Preview maintainer' })
  const panel = preview.locator('[data-ui-hover-card] > div').last()

  await trigger.focus()
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

behaviorTest(['Tooltip'], 'Tooltip opens for keyboard focus and closes on Escape', async ({ page }) => {
  await openPreview(page, 'tooltip')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.getByRole('button', { name: 'Save changes' })
  const tooltip = preview.getByRole('tooltip')

  await expect(tooltip).toBeHidden()
  await trigger.focus()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tooltip).toBeHidden()
})

behaviorTest(['Toggle'], 'Toggle updates its authoritative pressed state', async ({ page }) => {
  await openPreview(page, 'toggle')

  const toggle = page.locator('.component-doc-preview [data-ui-toggle]').filter({ hasText: 'Pin project' })

  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
})

behaviorTest(['Code'], 'Code copies its block content and announces success', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.resolve() }
    })
  })
  await openPreview(page, 'code')

  const copy = page.locator('.component-doc-preview [data-ui-code-copy]').first()

  await expect(copy).toHaveAttribute('aria-label', 'Copy code to clipboard')
  await copy.click()
  await expect(copy).toHaveAttribute('aria-label', 'Code copied!')
  await expect(page.getByText('Code copied to clipboard', { exact: true })).toBeAttached()
})

behaviorTest(['Command'], 'Command filters actions from its search input', async ({ page }) => {
  await openPreview(page, 'command')

  const preview = page.locator('.component-doc-preview')
  const input = preview.getByRole('searchbox', { name: 'Command search' })
  const items = preview.locator('[data-ui-command-item]')

  await expect(items).toHaveCount(3)
  await input.fill('theme')
  await expect(preview.getByText('Toggle theme', { exact: true })).toBeVisible()
  await expect(preview.getByText('Open documentation', { exact: true })).toBeHidden()
  await expect(preview.getByText('Create component', { exact: true })).toBeHidden()
})

behaviorTest(['Select'], 'Select commits a keyboard option to its native form control', async ({ page }) => {
  await openPreview(page, 'select')

  const select = page.locator('.component-doc-preview [data-ui-select]').first()
  const trigger = select.locator('[data-ui-select-trigger]')
  const native = select.locator('[data-ui-select-native]')

  await trigger.focus()
  await trigger.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  await expect(native).toHaveValue('react')
  await expect(trigger).toContainText('React')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

behaviorTest(['Resizable'], 'Resizable changes pane sizes from the keyboard', async ({ page }) => {
  await openPreview(page, 'resizable')

  const root = page.locator('.component-doc-preview [data-ui-resizable]')
  const handle = root.locator('[data-ui-resizable-handle]').first()

  await expect(root).toHaveAttribute('data-ui-resizable-enhanced', 'true')
  await expect(handle).toHaveAttribute('aria-valuenow', '28')
  await handle.focus()
  await handle.press('ArrowRight')
  await expect(handle).toHaveAttribute('aria-valuenow', '30')
})

behaviorTest(['InputOTP'], 'InputOTP synchronizes typed digits with its visual segments', async ({ page }) => {
  await openPreview(page, 'input-otp')

  const root = page.locator('.component-doc-preview [data-ui-input-otp]')
  const input = root.locator('[data-ui-input-otp-native]')

  await input.fill('')
  await input.focus()
  await page.keyboard.type('654321')

  await expect(input).toHaveValue('654321')
  await expect(root.locator('[data-ui-input-otp-char]')).toHaveText(['6', '5', '4', '3', '2', '1'])
})

behaviorTest(['DataTable'], 'DataTable sorts records and reports row selection', async ({ page }) => {
  await openPreview(page, 'data-table')

  const preview = page.locator('.component-doc-preview')
  const table = preview.locator('[data-ui-datatable]')
  const downloads = table.locator('thead th').filter({ hasText: 'Downloads' })
  const firstRow = table.locator('tbody tr').first()

  await downloads.locator('[data-ui-datatable-sort]').click()
  await expect(downloads).toHaveAttribute('aria-sort', 'ascending')
  await expect(firstRow).toContainText('@santi020k/lumen-elements')

  await firstRow.locator('[data-ui-datatable-row-select]').check()
  await expect(firstRow).toHaveAttribute('aria-selected', 'true')
  await expect(preview.locator('[data-selected-count]')).toHaveText('1')
})

behaviorTest(['Calendar'], 'Calendar navigates months and commits a selected day', async ({ page }) => {
  await openPreview(page, 'calendar')

  const calendar = page.locator('.component-doc-preview [data-ui-calendar]').first()
  const input = calendar.locator('[data-ui-calendar-input]')

  await expect(calendar).toHaveAttribute('data-ui-calendar-month', '2026-07')
  await calendar.locator('[data-ui-calendar-next]').click()
  await expect(calendar).toHaveAttribute('data-ui-calendar-month', '2026-08')

  const day = calendar.locator('[data-ui-calendar-day]:not([aria-disabled="true"])').filter({ hasText: /^15$/ })

  await day.click()
  await expect(input).toHaveValue('2026-08-15')
})

behaviorTest(['DatePicker'], 'DatePicker opens its calendar and commits a date', async ({ page }) => {
  await openPreview(page, 'date-picker')

  const picker = page.locator('.component-doc-preview [data-ui-date-picker]').first()
  const trigger = picker.locator('[data-ui-date-picker-trigger]')
  const native = picker.locator('[data-ui-date-picker-native]')
  const popover = picker.locator('[data-ui-date-picker-popover]')

  await trigger.click()
  await expect(popover).toBeVisible()

  const day = popover.locator('[data-ui-calendar-day]:not([aria-disabled="true"])').filter({ hasText: /^15$/ }).first()

  await day.click()
  await expect(native).not.toHaveValue('')
  await expect(popover).toBeHidden()
  await expect(trigger).toBeFocused()
})

behaviorTest(['DateRangePicker'], 'DateRangePicker keeps start and end constraints synchronized', async ({ page }) => {
  await openPreview(page, 'date-range-picker')

  const root = page.locator('.component-doc-preview [data-ui-date-range-picker]')
  const inputs = root.locator('[data-ui-date-picker-native]')
  const start = inputs.nth(0)
  const end = inputs.nth(1)

  await expect(root).toHaveAttribute('data-range-state', 'complete')
  await expect(end).toHaveAttribute('min', '2026-07-06')
  await expect(start).toHaveAttribute('max', '2026-07-10')

  await start.evaluate((element: HTMLInputElement) => {
    element.value = '2026-07-12'
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })

  await expect(end).toHaveValue('2026-07-12')
  await expect(end).toHaveAttribute('min', '2026-07-12')
})

const treeKeyboardScenario = (slug: 'tree' | 'tree-grid', itemRole: 'row' | 'treeitem'): BehaviorTestBody =>
  async ({ page }) => {
    await openPreview(page, slug)

    const collection = page.locator(`.component-doc-preview [role="${slug === 'tree' ? 'tree' : 'treegrid'}"]`)
    const items = collection.getByRole(itemRole)
    const first = items.nth(slug === 'tree-grid' ? 1 : 0)
    const second = items.nth(slug === 'tree-grid' ? 2 : 1)

    await expect(collection).toHaveAttribute('data-ui-bound', 'true')
    await first.focus()
    await first.press('ArrowDown')
    await expect(second).toBeFocused()
    await first.focus()
    await first.press('ArrowLeft')
    await expect(first).toHaveAttribute('aria-expanded', 'false')
  }

behaviorTest(
  ['Tree'],
  'Tree supports roving focus and branch collapse',
  treeKeyboardScenario('tree', 'treeitem')
)

behaviorTest(
  ['TreeGrid'],
  'TreeGrid supports roving focus and branch collapse',
  treeKeyboardScenario('tree-grid', 'row')
)

behaviorTest(['ThemeBuilder'], 'ThemeBuilder updates its exported CSS when token controls change', async ({ page }) => {
  await openPreview(page, 'theme-builder')

  const builder = page.locator('.component-doc-preview [data-ui-theme-builder]')
  const hue = builder.locator('[data-ui-theme-brand-hue]')
  const output = builder.locator('[data-ui-theme-output]')

  await expect(builder).toHaveAttribute('data-ui-theme-builder-bound', 'true')
  await hue.fill('212')
  await expect(output).toHaveValue(/--brand: 212/)
})

behaviorTest(['ThemeToggle'], 'ThemeToggle changes and persists the site-wide theme', async ({ page }) => {
  await page.addInitScript(() => {
    if (window.localStorage.getItem('lumen-theme') === null) {
      window.localStorage.setItem('lumen-theme', 'santi020k-dark')
    }
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPreview(page, 'theme-toggle')

  const toggle = page.locator('.component-doc-preview [data-ui-theme-toggle]')

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-dark')
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
})

behaviorTest(['FileUpload'], 'FileUpload reports selected files and updates its state', async ({ page }) => {
  await openPreview(page, 'file-upload')

  const root = page.locator('.component-doc-preview [data-ui-file-upload]')
  const input = root.locator('[data-ui-file-upload-input]')

  await input.setInputFiles({
    buffer: Buffer.from('image'),
    mimeType: 'image/png',
    name: 'avatar.png'
  })

  await expect(root).toHaveAttribute('data-state', 'selected')
  await expect(root.locator('[data-ui-file-upload-files]')).toHaveText('avatar.png')
})

behaviorTest(['Anchor'], 'Anchor initializes section tracking for in-page links', async ({ page }) => {
  await openPreview(page, 'anchor')

  const anchor = page.locator('.component-doc-preview [data-ui-anchor]')

  await expect(anchor).toHaveAttribute('data-ui-bound', 'true')
  await expect(anchor.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '#section-1')
  await expect(anchor.getByRole('link', { name: 'Introduction' })).toHaveAttribute('data-active', 'true')
})

behaviorTest(['Transfer'], 'Transfer moves checked items between collections', async ({ page }) => {
  await openPreview(page, 'transfer')

  const root = page.locator('.component-doc-preview [data-ui-transfer]')
  const source = root.locator('[data-ui-transfer-list][data-side="source"]')
  const target = root.locator('[data-ui-transfer-list][data-side="target"]')

  await source.getByRole('checkbox', { name: 'Item 1' }).check()
  await root.getByRole('button', { name: 'Move to Target' }).click()

  await expect(source.getByText('Item 1', { exact: true })).toHaveCount(0)
  await expect(target.getByText('Item 1', { exact: true })).toBeVisible()
})

behaviorTest(['Mentions'], 'Mentions filters suggestions and inserts the selected value', async ({ page }) => {
  await openPreview(page, 'mentions')

  const root = page.locator('.component-doc-preview [data-ui-mentions]')
  const input = root.locator('[data-ui-mentions-input]')
  const list = root.locator('[data-ui-mentions-list]')

  await input.fill('Hello @al')
  await expect(list).toBeVisible()
  await expect(root.getByRole('option', { name: 'alice' })).toBeVisible()
  await expect(root.getByRole('option', { name: 'bob' })).toBeHidden()
  await root.getByRole('option', { name: 'alice' }).dispatchEvent('mousedown')
  await expect(input).toHaveValue('Hello @alice ')
  await expect(list).toBeHidden()
})

behaviorTest(['TreeSelect'], 'TreeSelect commits a node and closes its disclosure', async ({ page }) => {
  await openPreview(page, 'tree-select')

  const root = page.locator('.component-doc-preview [data-ui-tree-select]')
  const trigger = root.locator('[data-ui-trigger]')
  const panel = root.locator('[data-ui-panel]')

  await trigger.click()
  await expect(panel).toBeVisible()
  await root.getByRole('treeitem', { name: 'Child' }).click()
  await expect(trigger).toContainText('Child')
  await expect(panel).toBeHidden()
})

behaviorTest(['BackToTop'], 'BackToTop scrolls the document to the beginning', async ({ page }) => {
  await openPreview(page, 'back-to-top')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'Back to top' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

behaviorTest(['ScrollReveal'], 'ScrollReveal becomes visible when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPreview(page, 'scroll-reveal')

  const reveal = page.locator('.component-doc-preview [data-ui-scroll-reveal]')

  await expect(reveal).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
  await expect(reveal).toHaveClass(/is-revealed/)
})

behaviorTest(['Toolbar'], 'Toolbar provides roving keyboard focus to its controls', async ({ page }) => {
  await openPreview(page, 'toolbar')

  const toolbar = page.locator('.component-doc-preview [data-ui-toolbar]')
  const buttons = toolbar.getByRole('button')

  await buttons.first().focus()
  await buttons.first().press('ArrowRight')
  await expect(buttons.nth(1)).toBeFocused()
})

test('runtime behavior registry is completely represented', () => {
  expect([...registeredBehaviorComponents].sort())
    .toEqual([...runtimeBehaviorComponentNames].sort())
})
