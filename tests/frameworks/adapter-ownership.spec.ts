import { expect, type Page, test } from '@playwright/test';

const openPage = async (page: Page) => {
  await page.goto('/visual/adapter-ownership');
  await expect(page.locator('main')).toHaveAttribute('data-elements-registered', 'true');
  await page.getByRole('button', { name: 'Mount late islands' }).click();
  await expect(page.locator('[data-ownership-island="late"]')).toBeVisible();
};

for (const prefix of ['early', 'late'] as const) {
  test(`${prefix} React islands keep React ownership after Elements registration`, async ({ page }) => {
    await openPage(page);
    const island = page.locator(`[data-ownership-island="${prefix}"]`);
    const trigger = island.getByRole('button', { name: `${prefix} due date` });

    await expect(trigger).toHaveAttribute('id', `${prefix}-due`);
    await expect(island.locator(`#${prefix}-due-native`)).toHaveCount(1);
    await expect(island.locator('[data-ui-bound]')).toHaveCount(0);

    await island.getByRole('button', { name: `${prefix} set March` }).click();
    await trigger.click();
    await expect(island.locator('[data-ui-date-picker-popover] [data-date="2024-03-12"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    const calendar = island.getByRole('grid').last();

    await calendar.locator('[data-date="2026-09-15"]').click();
    await expect(island.locator('[data-ownership-calendar-value]')).toHaveText('2026-09-15');

    await island.getByRole('textbox', { name: `${prefix} code` }).pressSequentially('12');
    await expect(island.locator('[data-ownership-code]')).toHaveText('12');
    await expect(island.locator('[data-ui-input-otp-char]')).toHaveText(['1', '2', '', '']);
    await island.getByRole('textbox', { name: `${prefix} code` }).fill('6543');
    await expect(island.locator('[data-ownership-code]')).toHaveText('6543');
    await island.getByRole('textbox', { name: `${prefix} code` }).fill('9876');
    await expect(island.locator('[data-ownership-code]')).toHaveText('9876');
    await expect(island.locator('[data-ui-input-otp-char]')).toHaveText(['9', '8', '7', '6']);
    await island.getByRole('textbox', { name: `${prefix} code` }).selectText();
    await page.keyboard.type('1234');
    await expect(island.locator('[data-ownership-code]')).toHaveText('1234');
  });
}
