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

    test("mirrors tabs and calendar arrows under inherited RTL", async ({ page }) => {
      await page.locator('main[data-framework]').evaluate(element => { element.setAttribute('dir', 'rtl'); });
      const first = page.getByRole('tab', { name: 'Packages' });
      const second = page.getByRole('tab', { name: 'Notes' });

      await first.focus();
      await first.press('ArrowLeft');
      await expect(second).toBeFocused();
      await second.press('ArrowRight');
      await expect(first).toBeFocused();

      const calendar = page.locator('[data-ui-calendar], lumen-calendar').first();
      const day = calendar.locator('[data-ui-calendar-day]:not([aria-disabled="true"])').filter({ hasText: /^15$/ });

      await day.focus();
      await day.press('ArrowLeft');
      await expect(calendar.locator('[data-ui-calendar-day]:focus')).toHaveText('16');
    });

    if (adapter.label === 'React') {
      test('data collection retains focused rows with bounded rendering', async ({ page, browserName }) => {
        const list = page.getByRole('list', { name: 'Large records' });

        await expect(list).toHaveAttribute('data-ui-range-start', '0');
        expect(await list.getByRole('listitem').count()).toBeLessThan(15);
        const first = list.getByRole('button', { name: 'Record 1', exact: true });

        await first.focus();
        // WebKit's default Tab mode skips buttons; Option+Tab includes all controls.
        const forward = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

        for (let index = 0; index < 12; index += 1) {
          await page.keyboard.press(forward);
          await expect(list.getByRole('button', { name: `Record ${index + 2}`, exact: true })).toBeFocused();
          await expect(list.getByRole('button', { name: `Record ${index + 2}`, exact: true })).toBeInViewport();
        }
        const focused = list.getByRole('button', { name: 'Record 13', exact: true });

        await expect(focused).toBeFocused();
        await list.evaluate(element => { element.scrollTop = element.scrollHeight; });
        await expect(focused).toBeFocused();
        expect(await list.getByRole('listitem').count()).toBeLessThan(18);
        await expect(list.getByRole('button', { name: 'Record 10000', exact: true })).toBeAttached();
      });
    }

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

      await expect(input).toBeFocused();
      await expect(reactOption).toHaveAttribute("aria-selected", "true");

      await input.press("Enter");

      await expect(input).toHaveValue("React");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).toBeFocused();
    });

    test('keeps text editing and composition in the Combobox input', async ({ page }) => {
      const input = page.getByRole('combobox', { name: 'Framework selector' })

      await input.fill('rea')
      await input.press('ArrowDown')
      await expect(input).toBeFocused()
      await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
      await expect(input).toHaveValue('rea')
      await expect(input).toHaveAttribute('aria-expanded', 'true')
      await input.press('Backspace')
      await expect(input).toHaveValue('re')
      await expect(input).not.toHaveAttribute('aria-activedescendant')
      await input.press('End')
      await expect(input).toBeFocused()
      await input.press('Escape')
      await expect(input).toHaveAttribute('aria-expanded', 'false')
    })

    test('dismisses the Combobox before its native dialog', async ({ page }) => {
      const input = page.getByRole('combobox', { name: 'Framework selector' })

      await input.evaluate(element => {
        const root = element.closest('[data-ui-combobox]')

        if (!root) throw new Error('Expected Combobox root')
        const dialog = document.createElement('dialog')

        dialog.setAttribute('aria-label', 'Nested control fixture')
        root.before(dialog)
        dialog.append(root)
        dialog.showModal()
      })
      const dialog = page.getByRole('dialog', { name: 'Nested control fixture' })

      await input.fill('rea')
      await input.press('Escape')
      await expect(dialog).toBeVisible()
      await expect(input).toHaveAttribute('aria-expanded', 'false')
      await input.press('Escape')
      await expect(dialog).not.toBeVisible()
    })

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

for (const width of [320, 1440]) {
  test(`dashboard filtering, details, and popup placement at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/dashboard-recipes');
    await page.getByRole('searchbox', { name: 'Search clients' }).fill('studio');
    await expect(page.getByRole('status').filter({ hasText: '1 matching record' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove Search: studio' }).click();
    await expect(page.getByRole('searchbox', { name: 'Search clients' })).toHaveValue('');
    await page.getByRole('button', { name: /Expand record/ }).first().click();
    await expect(page.getByText(/Record details for/)).toBeVisible();
    await page.getByRole('combobox', { name: 'Sort by' }).selectOption('balance');
    await expect(page.getByText(/Record details for/)).toBeVisible();
    const trigger = page.getByRole('button', { name: 'Open record actions' });
    await trigger.click();
    const panel = page.getByRole('region', { name: 'Record actions' });
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) throw new Error('Expected visible popup bounds');
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true });
  });
}
