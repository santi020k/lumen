import { expect, test } from "@playwright/test";

const adapters = [
  { label: "React", path: "/visual/react" },
  { label: "Elements", path: "/visual/elements" },
] as const;

for (const adapter of adapters) {
  test.describe(`${adapter.label} shared behavior contracts`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(adapter.path);
      await expect(
        page.locator(`[data-framework="${adapter.label.toLowerCase()}"]`),
      ).toBeVisible();

      if (adapter.label === "Elements") {
        await expect(
          page.locator('lumen-button[data-ready="true"]'),
        ).toBeVisible();
      }
    });

    test("updates progress state through the adapter event boundary", async ({
      page,
    }) => {
      const progress = page.getByRole("progressbar", {
        name: /release readiness/i,
      });
      const initialValue = Number(await progress.getAttribute("aria-valuenow"));

      await page.getByRole("button", { name: /advance/i }).click();

      await expect
        .poll(async () => Number(await progress.getAttribute("aria-valuenow")))
        .toBeGreaterThan(initialValue);
    });

    test("switches tabs with the shared keyboard contract", async ({
      page,
    }) => {
      const packages = page.getByRole("tab", { name: "Packages" });
      const notes = page.getByRole("tab", { name: "Notes" });

      await packages.focus();
      await packages.press("ArrowRight");

      await expect(notes).toBeFocused();
      await expect(notes).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel", { name: "Notes" })).toBeVisible();
    });

    test("navigates the calendar through its public next-month control", async ({
      page,
    }) => {
      const calendar = page
        .locator("[data-ui-calendar], lumen-calendar")
        .first();
      const initialMonth = await calendar.getAttribute(
        "data-ui-calendar-month",
      );

      await calendar.getByRole("button", { name: /next month/i }).click();

      await expect
        .poll(() => calendar.getAttribute("data-ui-calendar-month"))
        .not.toBe(initialMonth);
    });

    test("sorts a data table through its public column control", async ({
      page,
    }) => {
      const table = page
        .locator("[data-ui-datatable], lumen-data-table")
        .first();
      const packageHeader = table.getByRole("columnheader", {
        name: /package/i,
      });

      await packageHeader.getByRole("button").click();

      await expect(packageHeader).toHaveAttribute("aria-sort", "ascending");
    });

    test("filters and commits a combobox through the shared keyboard contract", async ({
      page,
    }) => {
      const input = page.getByRole("combobox", { name: "Framework selector" });
      const reactOption = page.getByRole("option", { name: "React" });

      await input.fill("rea");

      await expect(input).toHaveAttribute("aria-expanded", "true");
      await expect(reactOption).toBeVisible();

      await input.press("ArrowDown");

      await expect(reactOption).toBeFocused();

      await reactOption.press("Enter");

      await expect(input).toHaveValue("React");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).toBeFocused();
    });

    test("opens and closes a dialog through the adapter boundary", async ({
      page,
    }) => {
      const trigger = page.getByRole("button", {
        name: "Review release details",
      });

      await trigger.click();

      const dialog = page.getByRole("dialog", { name: "Release details" });

      await expect(dialog).toBeVisible();
      await dialog
        .getByRole("button", { name: "Close release details" })
        .click();
      await expect(dialog).toBeHidden();
    });
  });
}

for (const width of [320, 768, 769, 1440]) {
  for (const locale of ['en', 'es']) {
    test(`consumer records preserve data and actions at ${width}px in ${locale}`, async ({ page, browserName }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/consumer-recipes');
      await page.getByRole('combobox', { name: 'Language / Idioma' }).click();
      await page.getByRole('option', { name: locale === 'es' ? 'Español' : 'English', exact: true }).click();
      await expect(page.locator('main')).toHaveAttribute('lang', locale);
      const table = page.getByRole('table');
      await expect(table.getByRole('columnheader')).toHaveCount(5);
      await expect(table.getByRole('cell')).toHaveCount(10);
      const label = table.locator('.ui-table__label').first();
      if (width <= 768) await expect(label).toBeVisible();
      else await expect(label).toBeHidden();
      const overflow = await table.evaluate(element => element.scrollWidth > element.clientWidth + 1);
      expect(overflow).toBe(false);
      const region = page.getByRole('region');
      await region.focus();
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      const firstAction = table.getByRole('button').first();
      await expect(firstAction).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('status').filter({ hasText: 'example-1' })).toBeVisible();
      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
        await page.screenshot({ path: testInfo.outputPath(`records-${width}-${locale}-${theme}.png`), fullPage: true });
      }
      // Check switching across the exact breakpoint, not just separate initial renders.
      await page.setViewportSize({ width: width <= 768 ? 769 : 768, height: 900 });
      if (width <= 768) await expect(label).toBeHidden();
      else await expect(label).toBeVisible();
      await expect(table.getByRole('cell')).toHaveCount(10);
    });
  }
}

test('consumer amount entry preserves empty, invalid, maximum, and localized values', async ({ page }) => {
  await page.goto('/consumer-recipes');
  const input = page.getByRole('textbox', { name: 'Amount (COP)' });
  await input.fill('');
  await expect(input).toHaveValue('');
  await expect(page.locator('output')).toHaveText('');
  for (const value of ['1.2', '-1', '1e3', '1,000', '100000000001', '9007199254740993']) {
    await input.fill(value);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect.poll(() => input.evaluate(element => element instanceof HTMLInputElement && element.checkValidity())).toBe(false);
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
    await expect(page.locator('output')).toHaveText('');
  }
  await input.fill('100000000000');
  await expect(input).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('output')).toContainText('100,000,000,000');
  await page.locator('#recipe-language').selectOption('es');
  await expect(page.locator('output')).toContainText('100.000.000.000');
  await expect(page.getByRole('textbox', { name: 'Importe (COP)' })).toHaveValue('100000000000');
});
