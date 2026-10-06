import { mkdir } from 'node:fs/promises'

import { chromium, expect } from '@playwright/test'

const baseURL = process.env.LUMEN_REACT_NATIVE_URL ?? 'http://127.0.0.1:8081/'
const evidenceDirectory = process.env.LUMEN_MOTION_EVIDENCE
const browser = await chromium.launch()

try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { height: 900, width } })
    const url = new URL(baseURL)

    url.searchParams.set('destination', 'examples')

    url.searchParams.set('pattern', 'motion')

    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto(url.href)

    await expect(page.getByText('Demo effects are immediate.')).toBeVisible()

    await page.getByRole('button', { name: 'Expandable details' }).click()

    await expect(page.getByText('Content stays readable while its surrounding layout changes.')).toBeVisible()

    await page.getByRole('button', { name: 'Simulate save' }).click()

    await expect(page.getByText('Demonstration saved.')).toBeVisible()

    if (evidenceDirectory) {
      await mkdir(evidenceDirectory, { recursive: true })

      await page.screenshot({ fullPage: true, path: `${evidenceDirectory}/motion-${width}.png` })
    }

    await page.getByRole('button', { name: 'Open sheet' }).click()

    await expect(page.getByRole('button', { name: 'Close sheet' })).toBeVisible()

    await page.getByRole('button', { name: 'Close sheet' }).click()

    await expect(page.getByRole('button', { name: 'Close sheet' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Open sheet' }).click()

    await expect(page.getByRole('button', { name: 'Close sheet' })).toBeVisible()

    await page.getByRole('button', { name: 'Close sheet' }).click()

    await page.emulateMedia({ reducedMotion: 'no-preference' })

    await expect(page.getByText('Demo effects follow the system preference.')).toBeVisible()

    await page.getByRole('button', { name: 'Simulate save' }).click()

    await expect(page.getByText('Demonstration saved.')).toBeVisible()

    await page.getByRole('switch', { name: 'Reduce demo effects' }).click()

    await expect(page.getByText('Demo effects are immediate.')).toBeVisible()

    await page.close()
  }
} finally {
  await browser.close()
}
