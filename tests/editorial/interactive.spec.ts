import { expect, test } from '@playwright/test'

const chapterFragment = `#${encodeURIComponent('reference:settings')}`

test('article progress follows a chapter and stops at the article end', async ({ page }) => {
  await page.goto('/interactive/')
  const contents = page.getByRole('navigation', { name: 'On this page' })
  const progress = page.getByRole('progressbar', { name: 'Reading progress' })
  const configuration = contents.getByRole('link', { name: 'Settings reference' })

  await configuration.click()
  await expect(page).toHaveURL(url => url.hash === chapterFragment)
  await expect(configuration).toHaveAttribute('aria-current', 'location')
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
  await expect(progress).toBeInViewport()

  await page.locator('footer').scrollIntoViewIfNeeded()
  await expect(progress).toHaveAttribute('aria-valuenow', '100')
})

test('mobile contents, skip link, search link and original image work without scripts', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 600 } })
  try {
    const page = await context.newPage()
    await page.goto('/interactive/')
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    await page.locator('summary').filter({ hasText: 'On this page' }).click()
    await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Settings reference' }).click()
    await expect(page).toHaveURL(url => url.hash === chapterFragment)
    await expect(page.getByRole('link', { name: 'View larger image' })).toHaveAttribute('href', /inspection.*\.svg$/)
    await page.getByRole('link', { name: 'Search', exact: true }).click()
    await expect(page.locator('#guide')).toBeFocused()
    await page.getByRole('link', { name: 'Skip to article text' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#guide')).toBeFocused()
  } finally {
    await context.close()
  }
})

test('mobile chapter activation keeps the native fragment and focuses the heading', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/interactive/')
  await page.locator('html').evaluate(root => { root.style.fontSize = '200%' })
  const disclosure = page.locator('details').filter({ hasText: 'On this page' })
  await disclosure.getByText('On this page', { exact: true }).click()
  const link = disclosure.getByRole('link', { name: 'Settings reference' })
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(url => url.hash === chapterFragment)
  await expect(disclosure).not.toHaveAttribute('open')
  const heading = page.getByRole('heading', { name: 'Settings reference' })
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport()
  expect(await page.locator('html').evaluate(root => root.scrollWidth)).toBe(320)
})

test('search keeps native link navigation and recovers from empty, stale, and failed requests', async ({ page }) => {
  await page.goto('/interactive/')
  const trigger = page.getByRole('button', { name: 'Search', exact: true })
  await expect(trigger).toBeVisible()

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await page.getByRole('textbox', { name: 'Draft notes' }).focus()
  await page.keyboard.press('Control+k')
  await expect(dialog).toBeHidden()
  await trigger.focus()
  await page.keyboard.press('Control+k')
  const field = dialog.getByRole('searchbox', { name: 'Search query' })
  await expect(field).toBeFocused()
  await field.fill('nothing')
  await expect(dialog.getByText('No results found.').last()).toBeVisible()
  await field.fill('retry')
  await expect(dialog.getByRole('status')).toHaveText('Search could not be loaded.')
  await dialog.getByRole('button', { name: 'Retry search' }).click()
  await expect(dialog.getByRole('link')).toHaveCount(2)

  await field.fill('slow')
  await field.fill('quick')
  await expect(dialog.getByRole('link', { name: 'Settings reference' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-search-slow-settled', '')
  await expect(dialog.getByRole('status')).toHaveText('Results found: 2')
  await expect(dialog.getByRole('link', { name: 'Stale result' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog.getByRole('link', { name: 'Settings reference' })).toBeVisible()
  await field.press('ArrowUp')
  await expect(dialog.getByRole('link', { name: 'Settings reference' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(url => url.hash === chapterFragment)
  await expect(dialog).toBeHidden()
})

test('viewer defers the request, retries a failure, and supports keyboard zoom and dismissal', async ({ page }) => {
  let requests = 0
  await page.route(/inspection.*\.svg$/, route => {
    requests += 1
    return requests === 1 ? route.abort() : route.continue()
  })
  await page.goto('/interactive/')
  const trigger = page.getByRole('button', { name: 'View larger image' })
  await expect(trigger).toBeVisible()
  expect(requests).toBe(0)
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Integration diagram' })
  await expect(dialog.getByText('The image could not be loaded.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Retry' }).click()
  await expect(dialog.getByRole('img', { name: 'One circle in the center of a rectangle' })).toBeVisible()
  await expect(dialog.getByText('A simple integration diagram.')).toBeVisible()
  const zoom = dialog.getByRole('button', { name: 'Zoom in' })
  await zoom.focus()
  await page.keyboard.press('Enter')
  await expect(dialog.getByRole('status').filter({ hasText: /125%/ })).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})
