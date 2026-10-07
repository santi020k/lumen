import { expect, type Page, test } from '@playwright/test'

import type { LumenComponentName } from '../../packages/core/src/components.js'

import { verifyAstroChartActivation } from './chart-activation.js'
import { runtimeBehaviorComponentNames } from './component-coverage.js'
import { verifyFocusNavigation } from './focus-navigation.js'

const openPreview = async (page: Page, slug: string) => {
  await page.goto(`/docs/components/${slug}`)
  await expect(page.locator('.component-doc-preview')).toBeVisible()
}

type BehaviorTestBody = (fixtures: { page: Page }) => Promise<void>

test('Popover navigates available controls and restores newly available actions', async ({ page }) => {
  await openPreview(page, 'popover')
  const preview = page.locator('.component-doc-preview')
  await preview.getByRole('button', { name: 'Invite teammates' }).click()
  await verifyFocusNavigation(preview.locator('[data-ui-popover] > div').last())
})

const registeredBehaviorComponents = new Set<LumenComponentName>()

test('Dialog opens with native autofocus and dismisses only genuine backdrop presses', async ({ page }) => {
  await openPreview(page, 'dialog')
  const preview = page.locator('.component-doc-preview')
  const dialog = preview.locator('dialog')
  const trigger = preview.getByRole('button', { name: 'Edit profile' })
  await expect(dialog).toHaveAttribute('data-ui-bound', 'true')
  await dialog.evaluate(element => {
    const input = document.createElement('input')
    input.autofocus = true
    input.setAttribute('aria-label', 'Autofocus field')
    element.append(input)
  })
  await trigger.evaluate(element => {
    element.removeAttribute('id')
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined })
  })
  await trigger.click()
  await expect(dialog.getByRole('textbox', { name: 'Autofocus field' })).toBeFocused()
  // Backdrop coordinates must use the settled opening-transition geometry.
  await dialog.evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished))
  })
  const bounds = await dialog.boundingBox()
  if (!bounds) throw new Error('Expected an open dialog')
  await page.mouse.click(bounds.x + 4, bounds.y + 4)
  await expect(dialog).toBeVisible()
  await page.mouse.move(bounds.x + 4, bounds.y + 4)
  await page.mouse.down()
  await page.mouse.move(bounds.x - 8, bounds.y - 8)
  await page.mouse.up()
  await expect(dialog).toBeVisible()
  await page.mouse.click(bounds.x - 8, bounds.y - 8)
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('Tabs switches panels while skipping disabled tabs on arrow and End keys', async ({ page }) => {
  await openPreview(page, 'tabs')
  const tabs = page.locator('.component-doc-preview [data-ui-tabs]').first()
  const triggers = tabs.getByRole('tab')
  const count = await triggers.count()
  expect(count).toBeGreaterThanOrEqual(3)
  await triggers.nth(1).evaluate(element => {
    element.setAttribute('disabled', '')
  })
  await triggers.first().focus()
  await triggers.first().press('ArrowRight')
  await expect(triggers.nth(2)).toBeFocused()
  await expect(triggers.nth(1)).toHaveAttribute('aria-selected', 'false')
  await triggers.nth(count - 1).evaluate(element => {
    element.setAttribute('disabled', '')
  })
  await triggers.first().focus()
  await triggers.first().press('End')
  await expect(triggers.nth(count > 3 ? count - 2 : 0)).toBeFocused()
})

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
  await menu.evaluate(element => { element.setAttribute('tabindex', '-1'); })
  await menu.focus()
  await menu.press('ArrowUp')
  await expect(menu.getByRole('menuitem').last()).toBeFocused()
  await menu.focus()
  await menu.press('ArrowDown')
  await expect(menu.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
})

behaviorTest(['DropdownMenu'], 'DropdownMenu closes from Escape and nested menu-item artwork', async ({ page }) => {
  await openPreview(page, 'dropdown-menu')

  const trigger = page.locator('.component-doc-preview [data-ui-trigger]')
  const menu = page.locator('.component-doc-preview [role="menu"]')

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toBeHidden()

  await trigger.click()

  const firstItem = menu.getByRole('menuitem').first()

  await firstItem.evaluate(item => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

    svg.setAttribute('height', '16')
    svg.setAttribute('viewBox', '0 0 16 16')
    svg.setAttribute('width', '16')
    path.setAttribute('d', 'M2 8h12')
    svg.append(path)
    item.prepend(svg)
  })
  await firstItem.locator('path').evaluate(path => {
    path.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

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
  'NavigationMenu preserves ordinary link Tab order',
  async ({ page }) => {
    await openPreview(page, 'navigation-menu')

    const links = page.locator('.component-doc-preview a')

    await links.first().focus()
    await page.keyboard.press('Tab')
    await expect(links.nth(1)).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(links.first()).toBeFocused()
  }
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

behaviorTest(['Toast', 'ToastViewport'], 'Toast creates a live notification in the toast viewport', async ({ page }) => {
  await openPreview(page, 'toast')

  await page.locator('.component-doc-preview [data-ex-toast="success"]').click()

  const toast = page.locator('[data-ui-toast][data-state="open"]')

  await expect(toast).toContainText('Published')
  await expect(toast).toContainText('The latest version is now live.')
})

const invokeLumenInitUiPrimitives = (page: Page): Promise<void> => page.evaluate(() => {
  (window as Window & { LumenInitUiPrimitives?: (scope?: ParentNode) => void }).LumenInitUiPrimitives?.()
})

test('Toast binds static markup added after the initial runtime pass without duplicating per-toast dismissal', async ({ page }) => {
  await openPreview(page, 'toast')

  const preview = page.locator('.component-doc-preview')
  const existingToast = preview.locator('[data-ui-toast]').first()

  await expect(existingToast).toHaveAttribute('data-ui-bound', 'true')

  await preview.evaluate(root => {
    const toast = document.createElement('aside')

    toast.id = 'late-static-toast'
    toast.dataset.uiToast = ''
    toast.setAttribute('role', 'status')
    toast.textContent = 'Late static toast'
    root.append(toast)
  })

  const lateToast = page.locator('#late-static-toast')

  await expect(lateToast).not.toHaveAttribute('data-ui-bound', 'true')

  // The once-only document API guard must not block binding markup discovered on a later pass.
  await invokeLumenInitUiPrimitives(page)

  await expect(lateToast).toHaveAttribute('data-ui-bound', 'true')

  await lateToast.evaluate(element => {
    let removeCalls = 0

    Object.defineProperty(element, 'remove', {
      value: () => { removeCalls += 1 }
    })

    Object.defineProperty(element, 'removeCalls', {
      get: () => removeCalls
    })
  })

  // Repeated initialization after client navigation must not rebind an already-bound toast.
  await invokeLumenInitUiPrimitives(page)
  await invokeLumenInitUiPrimitives(page)

  await lateToast.evaluate(element => {
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }))
  })

  await expect(lateToast).toHaveAttribute('data-state', 'closed')
  await expect.poll(() => lateToast.evaluate(element => {
    const calls: unknown = Reflect.get(element, 'removeCalls')
    if (typeof calls !== 'number') throw new Error('Expected dismissal count')
    return calls
  })).toBe(1)
})

test('Toast ignores canceled and composing Escape keydown events', async ({ page }) => {
  await openPreview(page, 'toast')

  const toast = page.locator('.component-doc-preview [data-ui-toast]').first()

  await expect(toast).toHaveAttribute('data-ui-bound', 'true')

  await toast.evaluate(element => {
    element.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      isComposing: true,
      key: 'Escape'
    }))
  })

  await expect(toast).not.toHaveAttribute('data-state', 'closed')

  await page.evaluate(() => {
    document.addEventListener('keydown', event => { event.preventDefault() }, { capture: true, once: true })
  })

  await toast.evaluate(element => {
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }))
  })

  await expect(toast).not.toHaveAttribute('data-state', 'closed')

  await toast.evaluate(element => {
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }))
  })

  await expect(toast).toHaveAttribute('data-state', 'closed')
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
  await page.setViewportSize({ height: 720, width: 320 })
  await openPreview(page, 'tabs')

  const preview = page.locator('.component-doc-preview')
  const astroTab = preview.getByRole('tab', { name: 'Astro' })
  const reactTab = preview.getByRole('tab', { exact: true, name: 'React' })
  const composeTab = preview.getByRole('tab', { name: 'Compose' })
  const tabList = preview.getByRole('tablist', { name: 'Package targets' })

  await astroTab.focus()
  await astroTab.press('ArrowRight')

  await expect(reactTab).toHaveAttribute('aria-selected', 'true')
  await expect(preview.getByRole('tabpanel', { exact: true, name: 'React' })).toBeVisible()

  await reactTab.press('End')

  await expect(composeTab).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => tabList.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await expect.poll(async () => {
    const listBox = await tabList.boundingBox()
    const tabBox = await composeTab.boundingBox()

    if (!listBox || !tabBox) return false

    return tabBox.x >= listBox.x && tabBox.x + tabBox.width <= listBox.x + listBox.width + 1
  }).toBe(true)
})

behaviorTest(['CodeTabs'], 'CodeTabs switches examples and restores the persisted selection', async ({ page }) => {
  await openPreview(page, 'code-tabs')

  const preview = page.locator('.component-doc-preview')
  const pnpmTab = preview.getByRole('tab', { name: 'pnpm', exact: true })
  const npmTab = preview.getByRole('tab', { name: 'npm', exact: true })

  await pnpmTab.focus()
  await pnpmTab.press('ArrowRight')

  await expect(npmTab).toBeFocused()
  await expect(npmTab).toHaveAttribute('aria-selected', 'true')
  await expect(preview.getByRole('tabpanel', { name: 'npm', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(
    () => window.localStorage.getItem('preferred-package-manager')
  )).toBe('npm')

  await page.reload()

  await expect(
    page.locator('.component-doc-preview').getByRole('tab', { name: 'npm', exact: true })
  ).toHaveAttribute('aria-selected', 'true')
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

  const list = page.locator('.component-doc-preview [data-ui-virtual-list-mode="mounted"]')
  const initialStart = await list.getAttribute('data-ui-range-start')

  await list.evaluate(element => {
    element.scrollTop = element.scrollHeight
    element.dispatchEvent(new Event('scroll', { bubbles: true }))
  })

  await expect(list).not.toHaveAttribute('data-ui-range-start', initialStart ?? '0')
  await expect(list.locator(':scope > :not([data-ui-virtual-list-spacer]):not([hidden])')).not.toHaveCount(200)
  await expect(list.locator(':scope > :not([data-ui-virtual-list-spacer]):not([hidden])').last()).toHaveText('Deployment #1')
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
  const root = preview.locator('[data-ui-hover-card]')
  const panel = root.locator(':scope > div').last()

  await expect(trigger).toHaveAttribute('data-ui-bound', 'true')
  await trigger.focus()
  await expect(panel).toBeVisible()
  await root.dispatchEvent('mouseleave')
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await trigger.evaluate(element => { element.blur() })
  await trigger.focus()
  await expect(panel).toBeVisible()
  await panel.evaluate(element => {
    const action = document.createElement('button')
    action.textContent = 'View maintainer'
    element.append(action)
  })
  await panel.getByRole('button', { name: 'View maintainer' }).focus()
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(panel).toBeHidden()
  await trigger.evaluate(element => { element.blur() })
  await trigger.focus()
  await expect(panel).toBeVisible()
  await trigger.evaluate(element => { element.blur() })
  await expect(panel).toBeHidden()
})

test('HoverCard retains keyboard focus when adopted into another document', async ({ page }) => {
  await openPreview(page, 'hover-card')
  const root = page.locator('.component-doc-preview [data-ui-hover-card]')

  await expect(root.getByRole('button', { name: 'Preview maintainer' })).toHaveAttribute('data-ui-bound', 'true')
  const result = await root.evaluate(element => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const destination = iframe.contentDocument
    if (!destination) throw new Error('Missing destination document')
    const trigger = element.querySelector<HTMLButtonElement>('button')
    const panel = element.querySelector<HTMLElement>(':scope > div:last-child')
    if (!trigger || !panel) throw new Error('Missing HoverCard controls')
    const originalAction = document.createElement('button')
    originalAction.textContent = 'Original action'
    panel.append(originalAction)
    destination.body.append(destination.adoptNode(element))
    const action = destination.createElement('button')
    action.textContent = 'Destination action'
    panel.append(action)
    trigger.focus()
    originalAction.focus()
    action.focus()
    originalAction.focus()
    return { hidden: panel.hidden, focused: destination.activeElement === originalAction }
  })

  expect(result).toEqual({ hidden: false, focused: true })
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
  await expect(copy).toHaveAttribute('aria-label', 'Code copied to clipboard')
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
  await expect(root.locator('[data-ui-input-otp-char]')).toHaveText(['6', '5', '4', '3', '2', '1', '\u00a0', '\u00a0'])
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

test('DataTable requests server sorting from the displayed header state', async ({ page }) => {
  await openPreview(page, 'data-table')
  const header = page.locator('.component-doc-preview thead th').filter({ hasText: 'Downloads' })
  const result = await header.evaluate(element => {
    const root = element.closest('[data-ui-datatable]')
    const button = element.querySelector('[data-ui-datatable-sort]')

    if (!(root instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) {
      throw new Error('Missing data table controls')
    }
    root.dataset.uiDatatableSortMode = 'manual'
    element.setAttribute('aria-sort', 'ascending')
    const rows = () => [...root.querySelectorAll('tbody tr')].map(row => row.textContent)
    const before = rows()
    const events: unknown[] = []

    root.addEventListener('ui:data-table-sort-change', event => {
      if (event instanceof CustomEvent) {
        const detail: unknown = event.detail

        events.push(detail)
      }
    })
    button.click()

    return { before, after: rows(), events, direction: element.getAttribute('aria-sort') }
  })

  expect(result.after).toEqual(result.before)
  expect(result.direction).toBe('descending')
  expect(result.events).toEqual([expect.objectContaining({ direction: 'descending' })])
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
  await root.evaluate(element => {
    const form = document.createElement('form')
    const reset = document.createElement('button')

    element.before(form)
    form.append(element)
    reset.type = 'reset'
    reset.textContent = 'Reset upload'
    form.append(reset)
    form.addEventListener('reset', event => { event.preventDefault() }, { once: true })
  })
  const reset = page.getByRole('button', { name: 'Reset upload' })

  await reset.click()
  await expect(root.locator('[data-ui-file-upload-files]')).toHaveText('avatar.png')
  await reset.click()
  await expect(root).toHaveAttribute('data-state', 'idle')
  await expect(root.locator('[data-ui-file-upload-files]')).toBeEmpty()
  expect(await input.evaluate(element => element instanceof HTMLInputElement && element.files?.length)).toBe(0)
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
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await expect(root.getByRole('option', { name: 'alice' })).toBeVisible()
  await expect(root.getByRole('option', { name: 'bob' })).toBeHidden()
  await input.press('Enter')
  await expect(input).toHaveValue('Hello @alice ')
  await expect(list).toBeHidden()
  await expect(input).toHaveAttribute('aria-expanded', 'false')
})

test('Mentions keeps option buttons out of the tab sequence while keyboard and pointer selection still work', async ({ page }) => {
  await openPreview(page, 'mentions')
  await page.clock.install()

  const root = page.locator('.component-doc-preview [data-ui-mentions]')
  const input = root.locator('[data-ui-mentions-input]')
  const list = root.locator('[data-ui-mentions-list]')
  const aliceOption = root.getByRole('option', { name: 'alice' })

  await root.evaluate(element => {
    const nextField = document.createElement('input')

    nextField.type = 'text'
    nextField.setAttribute('aria-label', 'Next field')
    element.insertAdjacentElement('afterend', nextField)
  })

  const nextField = page.getByRole('textbox', { name: 'Next field' })

  await input.fill('Hello @al')
  await expect(list).toBeVisible()
  await expect(aliceOption).toHaveAttribute('tabindex', '-1')

  await input.focus()
  await page.keyboard.press('Tab')
  await expect(nextField).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect(input).toBeFocused()

  await input.fill('Hello @al')
  await page.clock.runFor(150)
  await expect(list).toBeVisible()
  await input.press('Enter')
  await expect(input).toHaveValue('Hello @alice ')
  await expect(list).toBeHidden()

  await input.fill('Hello @al')
  await expect(list).toBeVisible()
  await aliceOption.click()
  await expect(input).toHaveValue('Hello @alice ')
  await expect(list).toBeHidden()
  await input.fill('Hello @al')
  await expect(list).toBeVisible()
  await nextField.focus()
  await page.clock.runFor(150)
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

  await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); })
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

behaviorTest(['AnimatedNumber'], 'AnimatedNumber settles on its accessible value with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPreview(page, 'animated-number')

  const number = page.locator('.component-doc-preview [data-ui-animated-number]').first()
  const output = number.locator('[data-ui-animated-number-output]')
  const accessibleValue = number.locator('.ui-sr-only')

  await expect(number).toHaveAttribute('data-ui-bound', 'true')
  await expect(output).toHaveText(await accessibleValue.textContent() ?? '')
})

behaviorTest(['CopyButton'], 'CopyButton copies its target and exposes completion state', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await openPreview(page, 'copy-button')

  const button = page.locator('.component-doc-preview [data-ui-copy-button]').first()

  const successEvent = page.evaluate(() => new Promise<string>(resolve => {
    document.querySelector('[data-ui-copy-button]')?.addEventListener('ui:copy-success', event => {
      resolve((event as CustomEvent<{ value: string }>).detail.value)
    }, { once: true })
  }))

  await button.click()

  expect(await successEvent).toContain('Join the Lumen workspace')
  await expect(button).toHaveAttribute('data-state', 'copied')
  await expect(button).toHaveAttribute('aria-label', 'Copied to clipboard')
  await expect(button.locator('[data-slot="copy-idle"]')).toBeHidden()
  await expect(button.locator('[data-slot="copy-copied"]')).toBeVisible()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Join the Lumen workspace')
})

behaviorTest(['Form'], 'Form blocks invalid submission and focuses the first invalid control', async ({ page }) => {
  await openPreview(page, 'form')

  const preview = page.locator('.component-doc-preview')
  const form = preview.locator('[data-ui-form]')
  const name = preview.getByLabel('Workspace name')

  await preview.getByRole('button', { name: 'Save workspace' }).click()

  await expect(form).toHaveAttribute('data-ui-form-bound', 'true')
  await expect(form).toHaveAttribute('data-status', 'error')
  await expect(name).toBeFocused()
})

behaviorTest(['KanbanBoard'], 'KanbanBoard requests keyboard movement between columns', async ({ page }) => {
  await openPreview(page, 'kanban-board')

  const preview = page.locator('.component-doc-preview')
  const board = preview.locator('[data-ui-kanban]')
  const handle = preview.getByRole('button', { name: 'Move Release notes' })

  await expect(board).toHaveAttribute('data-ui-kanban-bound', 'true')
  await handle.focus()
  await handle.press('ArrowRight')

  await expect(board.locator('[data-ui-kanban-live]'))
    .toHaveText('Move requested to In progress.')
})

behaviorTest(['LanguageToggle'], 'LanguageToggle changes and persists the active locale', async ({ page }) => {
  await openPreview(page, 'language-toggle')

  const toggle = page.locator('.component-doc-preview [data-ui-language-toggle]')

  await expect(toggle).toHaveAttribute('data-ui-bound', 'true')
  await expect(toggle).toHaveAttribute('data-ui-language-value', 'en')
  await toggle.click()

  await expect(toggle).toHaveAttribute('data-ui-language-value', 'es')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('site-language'))).toBe('es')
})

behaviorTest(['ListBox'], 'ListBox exposes and commits its enhanced multiple selection', async ({ page }) => {
  await openPreview(page, 'list-box')

  const preview = page.locator('.component-doc-preview')
  const root = preview.locator('[data-ui-list-box]')
  const native = root.locator('[data-ui-list-box-native]')
  const luca = root.locator('[data-ui-list-box-option][data-value="luca"]')

  await expect(root).toHaveAttribute('data-ui-list-box-bound', 'true')
  await expect(native).toHaveAttribute('data-ui-list-box-enhanced', 'true')
  await luca.click()

  await expect(luca).toHaveAttribute('aria-selected', 'true')
  await expect(native.locator('option[value="luca"]')).toHaveJSProperty('selected', true)
})

behaviorTest(['PasswordField'], 'PasswordField toggles visibility and restores input focus', async ({ page }) => {
  await openPreview(page, 'password-field')

  const preview = page.locator('.component-doc-preview')
  const input = preview.getByRole('textbox', { name: 'Password' })
  const toggle = preview.locator('[data-ui-password-toggle]')

  await expect(input).toHaveAttribute('type', 'password')
  await toggle.click()

  await expect(input).toHaveAttribute('type', 'text')
  await expect(input).toBeFocused()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
})

behaviorTest(['Progress'], 'Progress synchronizes its visual and ARIA values from runtime events', async ({ page }) => {
  await openPreview(page, 'progress')

  const progress = page.locator('.component-doc-preview [data-ui-progress]').first()

  await expect(progress).toHaveAttribute('data-ui-progress-bound', 'true')
  await progress.evaluate(element => {
    element.dispatchEvent(new CustomEvent('ui:progress-change', {
      detail: { max: 80, value: 40 }
    }))
  })

  await expect(progress).toHaveAttribute('aria-valuemax', '80')
  await expect(progress).toHaveAttribute('aria-valuenow', '40')
  await expect(progress.locator('[data-slot="progress-indicator"]')).toHaveAttribute('style', 'width: 50%;')
})

behaviorTest(['RevealGroup'], 'RevealGroup reveals all children immediately with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPreview(page, 'reveal-group')

  const group = page.locator('.component-doc-preview [data-ui-reveal-group]')

  await expect(group).toHaveJSProperty('tagName', 'UL')
  await expect(group).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
  await expect(group).toHaveClass(/is-revealed/)
  await expect(group.locator(':scope > *').nth(2)).toHaveCSS('--ui-reveal-index', '2')
})

behaviorTest(['ScrollProgress'], 'ScrollProgress tracks document reading position', async ({ page }) => {
  await openPreview(page, 'scroll-progress')

  const progress = page.locator('.component-doc-preview [data-ui-scroll-progress]')

  await expect(page.locator('html')).toHaveAttribute('data-ui-scroll-progress-bound', 'true')
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight)
  })

  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow')))
    .toBeGreaterThan(0)
})

test('runtime behavior registry is completely represented', () => {
  expect([...registeredBehaviorComponents].sort())
    .toEqual([...runtimeBehaviorComponentNames].sort())
})

test('Tabs switches regression fixture preserves localized and accessible SSR contracts', async ({ page }) => {
  await page.goto('/internal/interaction-regressions')
  await expect(page.getByRole('heading', { name: 'Interaction regression fixture' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Alex Smith' })).toBeVisible()
  const toggle = page.getByRole('button', { name: 'Mostrar' })
  await expect(toggle).toHaveText('Mostrar')
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Ocultar' })).toHaveText('Ocultar')
  await expect(page.locator('[role="treeitem"]').nth(1)).toHaveAttribute('aria-level', '2')
  expect(await page.locator('[role="listbox"] > li').evaluateAll(items => items.every(item => item.getAttribute('role') === 'presentation'))).toBe(true)
  const form = page.locator('#external-form')
  await expect(form).toHaveAttribute('data-ui-form-bound', 'true')
  await page.getByRole('button', { name: 'Submit external field' }).click()
  await expect(form).toHaveAttribute('data-status', 'error')
  await expect(page.getByLabel('External field')).toHaveAttribute('aria-invalid', 'true')
  const summaryLink = form.locator('[data-ui-error-summary] a[href="#external-field"]')
  await summaryLink.evaluate(link => {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icon.setAttribute('width', '20')
    icon.setAttribute('height', '20')
    icon.setAttribute('aria-hidden', 'true')
    link.append(icon)
  })
  await summaryLink.locator('svg').click()
  await expect(page.getByLabel('External field')).toBeFocused()
  await page.evaluate(() => {
    document.querySelector('#external-form')?.addEventListener('ui:valid', () => {
      document.querySelector('#external-form')?.setAttribute('data-regression-valid', 'true')
    }, { once: true })
  })
  await page.getByLabel('External field').fill('Corrected value')
  await page.getByLabel('External field').press('Tab')
  await expect(page.getByLabel('External field')).not.toHaveAttribute('aria-invalid')
  await expect(page.locator('#external-error')).toBeHidden()
  await expect(form).toHaveAttribute('data-regression-valid', 'true')
})

test('Tooltip opens when randomUUID is unavailable and generates distinct IDs', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined })
  })
  await page.goto('/internal/interaction-regressions')
  const first = page.getByRole('button', { name: 'First tooltip' })
  const second = page.getByRole('button', { name: 'Second tooltip' })
  await expect(first).toHaveAttribute('aria-describedby', /ui-tooltip-/)
  const firstId = await first.getAttribute('aria-describedby')
  const secondId = await second.getAttribute('aria-describedby')
  expect(firstId).not.toBe(secondId)
  await first.focus()
  await expect(page.getByRole('tooltip', { name: 'First help' })).toBeVisible()
  await expect(page.locator('#external-form')).toHaveAttribute('data-ui-form-bound', 'true')
})

behaviorTest(
  ['BarChart', 'LineChart', 'PieChart', 'ScatterChart', 'ComboChart', 'Heatmap', 'RangeChart'],
  'Chart datum actions preserve identity across pointer and keyboard activation',
  async ({ page }) => { await verifyAstroChartActivation(page) }
)

behaviorTest(
  ['DialogClose'],
  'Dialog opens a long compound task with reachable actions and restored focus',
  async ({ page }) => {
    await page.goto('/internal/dashboard-dialog')
    const opener = page.getByRole('button', { name: 'Edit record', exact: true })
    await opener.click()
    const dialog = page.getByRole('dialog', { name: 'Edit a long record' })
    await expect(dialog).toBeVisible()
    const body = dialog.locator('[data-slot="dialog-body"]')
    const dimensions = await body.evaluate(element => ({
      visible: element.clientHeight,
      content: element.scrollHeight
    }))
    expect(dimensions.content).toBeGreaterThan(dimensions.visible)
    await page.getByLabel('Record field 20', { exact: true }).focus()
    await expect(page.getByLabel('Record field 20', { exact: true })).toBeInViewport()
    await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeInViewport()
    const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true })
    await cancel.focus()
    await page.keyboard.press('Enter')
    await expect(dialog).not.toBeVisible()
    await expect(opener).toBeFocused()
    await opener.click()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(opener).toBeFocused()
  }
)

behaviorTest(['AttachmentPreview'], 'Attachment previews retain actions through image failure and replacement', async ({ page }) => {
  await openPreview(page, 'attachment-preview')
  const preview = page.locator('.component-doc-preview [data-ui-attachment-preview]').first()
  const image = preview.locator('img')
  await expect(preview).toHaveAttribute('data-state', 'ready')
  await image.evaluate(element => {
    element.setAttribute('src', '/missing-synthetic-attachment.png')
  })
  await expect(preview).toHaveAttribute('data-state', 'error')
  await expect(preview.getByRole('status')).toHaveText('Could not load the preview.')
  await expect(preview.getByRole('button', { name: 'Replace' })).toBeEnabled()
  await preview.getByRole('button', { name: 'Replace' }).focus()
  await expect(preview.getByRole('button', { name: 'Replace' })).toBeFocused()
  await image.evaluate(element => {
    element.setAttribute('src', '/logo.svg')
  })
  await expect(preview).toHaveAttribute('data-state', 'ready')
  await expect(preview.getByRole('status')).toBeHidden()
})

test('PhoneInput keeps external editable and readonly form submission and reset complete', async ({ page }) => {
  await page.goto('/internal/interaction-regressions')
  const country = page.locator('#external-phone').locator('..').locator('select')
  const readonlyCountry = page.locator('#readonly-external-phone').locator('..').locator('select')
  await expect(country).toHaveAttribute('form', 'phone-owner')
  await expect(readonlyCountry).toHaveAttribute('form', 'readonly-phone-owner')
  await country.selectOption('CO')
  await page.locator('#external-phone').fill('999')
  const submitted = await page.evaluate(() => {
    const owner = document.getElementById('phone-owner')
    const readonlyOwner = document.getElementById('readonly-phone-owner')
    if (!(owner instanceof HTMLFormElement) || !(readonlyOwner instanceof HTMLFormElement))
      throw new Error('Expected external phone forms')
    return {
      editable: Object.fromEntries(new FormData(owner)),
      readonly: Object.fromEntries(new FormData(readonlyOwner))
    }
  })
  expect(submitted).toEqual({
    editable: { 'phone-country': 'CO', 'external-phone': '999' },
    readonly: { 'readonly-country': 'US', 'readonly-phone': '5550123' }
  })
  await page.getByRole('button', { name: 'Reset external phone' }).click()
  await expect(country).toHaveValue('US')
  await expect(page.locator('#external-phone')).toHaveValue('5550123')
})

test('PhoneInput synchronizes enhanced metadata after a real reset-button click', async ({ page }) => {
  await openPreview(page, 'phone-input')
  const root = page.locator('#ex-phone').locator('..')
  const input = root.locator('.ui-phone-input__number')
  const country = root.locator('select')
  const code = root.locator('[data-ui-phone-code]')

  await expect(code).toHaveText('+57')
  await root.evaluate(element => {
    const form = document.createElement('form')
    const reset = document.createElement('button')

    element.before(form)
    form.append(element)
    reset.type = 'reset'
    reset.textContent = 'Reset enhanced phone'
    form.append(reset)
    form.addEventListener('reset', event => { event.preventDefault() }, { once: true })
  })
  await input.fill('+1 212 555 0123')
  await expect(country).toHaveValue('US')
  await expect(code).toHaveText('+1')
  const reset = page.getByRole('button', { name: 'Reset enhanced phone' })

  await reset.click()
  await expect(code).toHaveText('+1')
  await reset.click()
  await expect(country).toHaveValue('CO')
  await expect(code).toHaveText('+57')
  await expect(input).toHaveValue('')
  await expect(root).toHaveAttribute('data-e164', '')
})


test('enhanced forms retain validation when adopted and reinitialized in another document', async ({ page }) => {
  await page.goto('/internal/interaction-regressions')
  await expect(page.locator('#external-form')).toHaveAttribute('data-ui-form-bound', 'true')
  await page.getByRole('button', { name: 'Submit external field' }).click()
  const result = await page.evaluate(() => {
    const init = (window as Window & { LumenInitUiPrimitives?: (scope?: ParentNode) => void }).LumenInitUiPrimitives
    const form = document.querySelector<HTMLFormElement>('#external-form')
    const control = document.querySelector<HTMLInputElement>('#external-field')
    const field = control?.closest<HTMLElement>('[data-ui-field], .ui-field')
    const error = document.querySelector<HTMLElement>('#external-error')
    if (!init || !form || !control || !field || !error) throw new Error('Missing form adoption fixture')
    let valid = 0
    let invalid = 0
    form.addEventListener('ui:valid', () => { valid += 1 })
    form.addEventListener('ui:invalid', () => { invalid += 1 })
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const destination = frame.contentDocument
    if (!destination) throw new Error('Missing adoption document')
    destination.body.append(destination.adoptNode(form), destination.adoptNode(field))
    init(destination)
    init(destination)
    control.value = 'Corrected'
    control.focus()
    control.blur()
    const corrected = control.getAttribute('aria-invalid') === null && error.hidden
    control.value = ''
    control.focus()
    control.blur()
    const rejected = control.getAttribute('aria-invalid') === 'true' && !error.hidden
    document.body.append(document.adoptNode(form), document.adoptNode(field))
    init(document)
    control.value = 'Returned'
    control.focus()
    control.blur()
    return { corrected, rejected, valid, invalid, returned: control.getAttribute('aria-invalid') === null }
  })
  expect(result).toEqual({ corrected: true, rejected: true, valid: 2, invalid: 1, returned: true })
})


test('iframe-origin enhanced forms validate after adoption into the host document', async ({ page }) => {
  await page.goto('/internal/interaction-regressions')
  await expect(page.locator('#external-form')).toHaveAttribute('data-ui-form-bound', 'true')
  const result = await page.evaluate(() => {
    const init = (window as Window & { LumenInitUiPrimitives?: (scope?: ParentNode) => void }).LumenInitUiPrimitives
    const createFixture = () => {
      const sourceForm = document.querySelector<HTMLFormElement>('#external-form')
      const sourceField = document.querySelector<HTMLInputElement>('#external-field')?.closest<HTMLElement>('[data-ui-field], .ui-field')
      if (!sourceForm || !sourceField) throw new Error('Missing reverse-adoption fixture')
      const frame = document.createElement('iframe')
      document.body.append(frame)
      const source = frame.contentDocument
      if (!source) throw new Error('Missing source document')
      source.body.innerHTML = sourceForm.outerHTML + sourceField.outerHTML
      sourceForm.remove()
      sourceField.remove()
      const form = source.querySelector<HTMLFormElement>('#external-form')
      const control = source.querySelector<HTMLInputElement>('#external-field')
      const field = control?.closest<HTMLElement>('[data-ui-field], .ui-field')
      const error = source.querySelector<HTMLElement>('#external-error')
      if (!form || !control || !field || !error) throw new Error('Missing source form controls')
      return { source, form, control, field, error }
    }
    const { source, form, control, field, error } = createFixture()
    if (!init) throw new Error('Missing form initializer')
    delete form.dataset.uiFormBound
    init(source)
    document.body.append(document.adoptNode(form), document.adoptNode(field))
    init(document)
    init(document)
    let invalid = 0
    let valid = 0
    form.addEventListener('ui:invalid', () => { invalid += 1 })
    form.addEventListener('ui:valid', () => { valid += 1 })
    form.requestSubmit()
    const rejected = control.getAttribute('aria-invalid') === 'true' && !error.hidden
    control.value = 'Corrected'
    control.focus()
    control.blur()
    return { foreignPrototype: !(control instanceof HTMLInputElement), rejected, corrected: control.getAttribute('aria-invalid') === null && error.hidden, invalid, valid }
  })
  expect(result).toEqual({ foreignPrototype: true, rejected: true, corrected: true, invalid: 1, valid: 1 })
})
