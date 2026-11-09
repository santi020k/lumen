import { expect, test } from '@playwright/test'

const demoPath = '/docs/react-native/demos/text'
const docsPath = '/docs/react-native/components/text'
const rawPath = '/native-previews/react-native-live/index.html?embed=true&component=Text'

test('the component demo is a searchable destination with a documentation link', async ({ page }) => {
  const response = await page.goto(demoPath)

  expect(response?.ok()).toBe(true)
  await expect(page.getByRole('heading', { level: 1, name: 'Text React Native demo' })).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index\b/u)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://lumen.santi020k.com${demoPath}`)
  await expect(page.getByRole('link', { name: 'Read Text documentation' })).toHaveAttribute('href', docsPath)

  const banner = page.frameLocator('iframe[title="Text interactive preview"]').locator('#preview-docs-banner')
  await expect(banner).toBeAttached()
  await expect(banner).toBeHidden()
})

test('a raw preview opened directly links to the matching component documentation', async ({ page }) => {
  const response = await page.goto(rawPath)

  expect(response?.ok()).toBe(true)
  await expect(page.getByRole('complementary', { name: 'React Native preview documentation' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Read the React Native preview documentation' })).toHaveAttribute('href', docsPath)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^noindex\b/u)
})
