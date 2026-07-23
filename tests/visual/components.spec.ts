import { expect, type Page, test } from '@playwright/test'

/* cspell:ignore valuenow */

type Theme = 'dark' | 'light'

interface VisualScenario {
  name: string
  path: string
  prepare: (page: Page) => Promise<void>
}

/**
 * Screenshots each component docs page in light and dark themes.
 * Cascade regressions (like glass variants being overridden) show up here
 * even when unit tests pass.
 */
const componentSlugs = [
  'alert',
  'back-to-top',
  'badge',
  'button',
  'calendar',
  'callout',
  'card',
  'checkbox',
  'command',
  'context-menu',
  'data-table',
  'date-range-picker',
  'dialog',
  'dropdown-menu',
  'eyebrow',
  'field',
  'floating-badge',
  'formatted-date',
  'image',
  'input',
  'input-otp',
  'language-toggle',
  'link',
  'menubar',
  'particles',
  'pill',
  'popover',
  'prose',
  'resizable',
  'scroll-reveal',
  'select',
  'sidebar',
  'skip-link',
  'sonner',
  'stat',
  'switch',
  'table',
  'tabs',
  'toast',
  'tooltip',
  'tree',
  'tree-grid',
  'virtual-list'
]

const themes: Theme[] = ['light', 'dark']

const preparePage = async (page: Page, path: string, theme: Theme): Promise<void> => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.goto(path)

  await page.evaluate(themeName => {
    document.documentElement.dataset.theme = themeName
  }, theme)

  await expect(page.locator('main')).toBeVisible()
  await expect(page.getByText('An error occurred.', { exact: true })).toHaveCount(0)
}

const interactiveScenarios: VisualScenario[] = [
  {
    name: 'select-closed',
    path: '/docs/components/select',
    prepare: async page => {
      const select = page.locator('[data-ui-select]').first()
      const trigger = select.locator('[data-ui-select-trigger]')
      const listbox = select.locator('[data-ui-select-list]')

      await expect(trigger).toBeVisible()

      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(listbox).toHaveAttribute('data-state', 'open')

      await page.keyboard.press('Escape')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(listbox).toHaveAttribute('data-state', 'closed')
    }
  },
  {
    name: 'select-open',
    path: '/docs/components/select',
    prepare: async page => {
      const select = page.locator('[data-ui-select]').first()
      const trigger = select.locator('[data-ui-select-trigger]')
      const listbox = select.locator('[data-ui-select-list]')

      await expect(trigger).toBeVisible()

      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(listbox).toHaveAttribute('data-state', 'open')
      await expect(listbox).toBeVisible()
    }
  },
  {
    name: 'resizable-resized',
    path: '/docs/components/resizable',
    prepare: async page => {
      const resizable = page.locator('[data-ui-resizable]').first()
      const handle = resizable.locator('[data-ui-resizable-handle]').first()

      await expect(resizable).toHaveAttribute('data-ui-resizable-enhanced', 'true')
      await expect(handle).toHaveAttribute('aria-valuenow', '28')

      await handle.focus()
      await page.keyboard.press('ArrowRight')

      await expect(handle).toHaveAttribute('aria-valuenow', '30')
    }
  },
  {
    name: 'input-otp-empty',
    path: '/docs/components/input-otp',
    prepare: async page => {
      const otp = page.locator('[data-ui-input-otp]').first()
      const input = otp.locator('[data-ui-input-otp-native]')
      const segments = otp.locator('[data-ui-input-otp-segments]')

      await expect(input).toHaveAttribute('data-ui-enhanced', 'true')
      await expect(input).toHaveValue('')
      await expect(segments).toBeVisible()

      await input.focus()
      await expect(otp.locator('[data-ui-input-otp-segment]').first()).toHaveAttribute('data-active', 'true')
    }
  },
  {
    name: 'input-otp-filled',
    path: '/docs/components/input-otp',
    prepare: async page => {
      const otp = page.locator('[data-ui-input-otp]').first()
      const input = otp.locator('[data-ui-input-otp-native]')

      await expect(input).toHaveAttribute('data-ui-enhanced', 'true')

      await input.focus()
      await page.keyboard.type('123456')

      await expect(input).toHaveValue('123456')
      await expect(otp.locator('[data-ui-input-otp-char]').last()).toHaveText('6')
    }
  },
  {
    name: 'calendar-default',
    path: '/docs/components/calendar',
    prepare: async page => {
      const calendar = page.locator('[data-ui-calendar]').first()

      await expect(calendar).toHaveAttribute('data-ui-calendar-month', '2026-07')
      await expect(calendar.locator('[data-ui-calendar-label]')).toHaveText('July 2026')
      await expect(calendar.locator('[data-ui-calendar-grid]')).toBeVisible()
    }
  },
  {
    name: 'calendar-next-month',
    path: '/docs/components/calendar',
    prepare: async page => {
      const calendar = page.locator('[data-ui-calendar]').first()

      await expect(calendar).toHaveAttribute('data-ui-calendar-month', '2026-07')

      await calendar.locator('[data-ui-calendar-next]').click()

      await expect(calendar).toHaveAttribute('data-ui-calendar-month', '2026-08')
      await expect(calendar.locator('[data-ui-calendar-label]')).toHaveText('August 2026')
    }
  },
  {
    name: 'data-table-default',
    path: '/docs/components/data-table',
    prepare: async page => {
      const dataTable = page.locator('[data-ui-datatable]').first()

      await expect(dataTable).toHaveAttribute('data-ui-bound', 'true')
      await expect(dataTable.locator('tbody tr').first()).toContainText('@santi020k/lumen-astro')
      await expect(dataTable.locator('[data-ui-datatable-row-select]').first()).not.toBeChecked()
    }
  },
  {
    name: 'data-table-sorted',
    path: '/docs/components/data-table',
    prepare: async page => {
      const dataTable = page.locator('[data-ui-datatable]').first()
      const downloadsHeader = dataTable.locator('thead th').filter({ hasText: 'Downloads' })

      await expect(dataTable).toHaveAttribute('data-ui-bound', 'true')

      await downloadsHeader.locator('[data-ui-datatable-sort]').click()

      await expect(downloadsHeader).toHaveAttribute('aria-sort', 'ascending')
      await expect(dataTable.locator('tbody tr').first()).toContainText('@santi020k/lumen-elements')
    }
  },
  {
    name: 'data-table-row-selected',
    path: '/docs/components/data-table',
    prepare: async page => {
      const dataTable = page.locator('[data-ui-datatable]').first()
      const firstRow = dataTable.locator('tbody tr').first()

      await expect(dataTable).toHaveAttribute('data-ui-bound', 'true')

      await firstRow.locator('[data-ui-datatable-row-select]').check()

      await expect(firstRow).toHaveAttribute('aria-selected', 'true')
      await expect(page.locator('[data-selected-count]')).toHaveText('1')
    }
  },
  {
    name: 'toast-visible',
    path: '/docs/components/toast',
    prepare: async page => {
      await page.locator('[data-ex-toast-create]').click()

      const toast = page.locator('[data-ui-toast][data-state="open"]').filter({ hasText: 'Build complete' })

      await expect(toast).toBeVisible()
    }
  },
  {
    name: 'theme-playground-configured',
    path: '/docs/theme-playground',
    prepare: async page => {
      const playground = page.locator('.theme-playground')
      const darkScheme = playground.locator('[data-ui-theme-scheme="dark"]')
      const brandHue = playground.locator('[data-ui-theme-brand-hue-number]')
      const output = playground.locator('[data-ui-theme-output]')

      await expect(playground).toHaveAttribute('data-ui-theme-builder-bound', 'true')

      await darkScheme.click()
      await expect(darkScheme).toHaveAttribute('aria-pressed', 'true')

      await brandHue.fill('212')

      await expect(output).toHaveValue(/color-scheme: dark/)
      await expect(output).toHaveValue(/--brand: 212/)
    }
  },
  {
    name: 'docs-search-open',
    path: '/docs',
    prepare: async page => {
      const search = page.locator('[data-docs-search]').first()
      const input = search.locator('[data-docs-search-input]')
      const results = search.locator('[data-docs-search-results]')

      await input.click()
      await page.keyboard.type('select')

      await expect(input).toHaveAttribute('aria-expanded', 'true')
      await expect(results.locator('[role="option"]').first()).toBeVisible()
    }
  }
]

for (const theme of themes) {
  for (const slug of componentSlugs) {
    test(`${slug} page renders consistently (${theme})`, async ({ page }) => {
      await preparePage(page, `/docs/components/${slug}`, theme)

      await expect(page).toHaveScreenshot(`${slug}-${theme}.png`, {
        fullPage: true
      })
    })
  }
}

for (const theme of themes) {
  for (const scenario of interactiveScenarios) {
    test(`${scenario.name} state renders consistently (${theme})`, async ({ page }) => {
      await preparePage(page, scenario.path, theme)

      await scenario.prepare(page)

      await expect(page).toHaveScreenshot(`${scenario.name}-${theme}.png`, {
        fullPage: true
      })
    })
  }
}
