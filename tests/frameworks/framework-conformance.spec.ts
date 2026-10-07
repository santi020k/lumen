// cspell:words teléfono
import { expect, test } from "@playwright/test";

import { verifyFocusNavigation } from '../a11y/focus-navigation.js';

test('React disclosure navigation skips unavailable controls and restores newly available actions', async ({ page }) => {
  await page.goto('/dashboard-recipes');
  await page.getByRole('button', { name: 'Open record actions' }).click();
  await verifyFocusNavigation(page.getByRole('region', { name: 'Record actions' }));
});

test('Elements disclosure navigation skips unavailable controls and restores newly available actions', async ({ page }) => {
  await page.goto('/visual/elements');
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-popover');
    const root = document.createElement('lumen-popover');
    root.innerHTML = '<button data-ui-trigger aria-controls="focus-panel">Focus navigation</button><div id="focus-panel" hidden></div>';
    document.body.prepend(root);
  });
  await page.getByRole('button', { name: 'Focus navigation', exact: true }).click();
  await verifyFocusNavigation(page.locator('#focus-panel'));
});

const adapters = [
  { label: "React", path: "/visual/react" },
  { label: "Elements", path: "/visual/elements" },
] as const;

test('React workflow observes native reset-button defaults and final cancellation', async ({ page }) => {
  await page.goto('/visual/forms');
  const input = page.getByRole('textbox', { name: 'Workflow value' });
  const dirty = page.getByRole('status', { name: 'Workflow dirty' });
  await input.fill('Draft');
  await expect(dirty).toHaveText('Draft changed');
  await page.getByRole('button', { name: 'Reset workflow', exact: true }).click();
  await expect(input).toHaveValue('Saved');
  await expect(dirty).toHaveText('Draft saved');
  await input.fill('Keep draft');
  await page.getByRole('button', { name: 'Cancel reset', exact: true }).click();
  await page.getByRole('button', { name: 'Reset workflow', exact: true }).click();
  await expect(input).toHaveValue('Keep draft');
  await expect(dirty).toHaveText('Draft changed');
});

test('Elements buttons honor ancestor cancellation after native keyboard dispatch', async ({ page }) => {
  await page.goto('/visual/elements');
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-button');
    const fixture = document.createElement('div');
    fixture.id = 'keyboard-button-fixture';
    fixture.dataset.clicks = '0';
    fixture.innerHTML = '<lumen-button>Keyboard action</lumen-button>';
    fixture.addEventListener('click', () => { fixture.dataset.clicks = String(Number(fixture.dataset.clicks) + 1); });
    fixture.addEventListener('keydown', event => { if (fixture.dataset.cancel === 'Enter' && event.key === 'Enter') event.preventDefault(); });
    fixture.addEventListener('keyup', event => { if (fixture.dataset.cancel === 'Space' && event.key === ' ') event.preventDefault(); });
    document.body.prepend(fixture);
  });
  const fixture = page.locator('#keyboard-button-fixture');
  const button = fixture.getByRole('button', { name: 'Keyboard action', exact: true });
  await button.focus();
  await fixture.evaluate(element => { element.setAttribute('data-cancel', 'Enter'); });
  await page.keyboard.press('Enter');
  await page.evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
  await expect(fixture).toHaveAttribute('data-clicks', '0');
  await fixture.evaluate(element => { element.setAttribute('data-cancel', 'Space'); });
  await page.keyboard.press('Space');
  await page.evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
  await expect(fixture).toHaveAttribute('data-clicks', '0');
  await fixture.evaluate(element => { element.removeAttribute('data-cancel'); });
  await page.keyboard.press('Enter');
  await expect(fixture).toHaveAttribute('data-clicks', '1');
  await page.keyboard.press('Space');
  await expect(fixture).toHaveAttribute('data-clicks', '2');
});

test('Elements ContextMenu enters the last or first item from container focus', async ({ page }) => {
  await page.goto('/visual/elements');
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-context-menu');
    const fixture = document.createElement('div');
    fixture.innerHTML = '<button data-ui-context-menu-trigger="container-focus-menu">Open actions</button><lumen-context-menu id="container-focus-menu" tabindex="-1"><button role="menuitem" type="button">First action</button><button role="menuitem" type="button">Last action</button></lumen-context-menu>';
    document.body.prepend(fixture);
  });
  const trigger = page.getByRole('button', { name: 'Open actions', exact: true });
  const menu = page.locator('#container-focus-menu');
  await trigger.focus();
  await trigger.press('Shift+F10');
  await expect(menu).toBeVisible();
  await menu.focus();
  await menu.press('ArrowUp');
  await expect(menu.getByRole('menuitem', { name: 'Last action', exact: true })).toBeFocused();
  await menu.focus();
  await menu.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'First action', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const framework of ['React', 'Elements']) {
  test(`${framework} Mentions keeps suggestions out of the Tab sequence without losing selection`, async ({ page }) => {
    await page.goto('/visual/mentions');
    const input = page.getByRole('combobox', { name: `${framework} mentions`, exact: true });
    await input.fill('@');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await input.press('Tab');
    await expect(page.getByRole('textbox', { name: `After ${framework} mentions`, exact: true })).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Shift+Tab');
    await expect(input).toBeFocused();
    await input.fill('@a');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await input.press('Enter');
    await expect(input).toHaveValue('@alice ');
    await input.fill('@b');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await page.locator(framework === 'React' ? '[data-ui-mentions]' : 'lumen-mentions').getByRole('option', { name: 'bob', exact: true }).click();
    await expect(input).toHaveValue('@bob ');
  });
}

test('Elements Combobox restores native form state without a stale active option', async ({ page }) => {
  await page.goto('/visual/elements');
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-combobox');
    const form = document.createElement('form');
    form.setAttribute('aria-label', 'Combobox reset fixture');
    form.innerHTML = '<lumen-combobox><label>Reset framework<input role="combobox" value="Astro"></label><div role="listbox"><button type="button" role="option" data-value="Astro">Astro</button><button type="button" role="option" data-value="React">React</button></div></lumen-combobox>';
    document.body.prepend(form);
  });
  const form = page.getByRole('form', { name: 'Combobox reset fixture' });
  const input = form.getByRole('combobox', { name: 'Reset framework' });
  await input.fill('rea');
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await form.evaluate(element => {
    if (!(element instanceof HTMLFormElement)) throw new Error('Expected form');
    element.reset();
  });
  await expect(input).toHaveValue('Astro');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await input.press('ArrowDown');
  await expect(form.getByRole('option', { name: 'Astro', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(form.getByRole('option', { name: 'React', exact: true })).toBeHidden();
});

test.describe('React native form boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visual/forms');
    await expect(page.getByRole('heading', { name: 'Native form behavior' })).toBeVisible();
  });

  test('accepted native form reset restores defaults and closes unnamed range drafts', async ({ page }, testInfo) => {
    const framework = page.getByRole('combobox', { name: 'Framework' });
    const country = page.getByRole('combobox', { name: 'Contact country' });
    const phone = page.getByLabel('Contact phone');
    const initialPhone = await phone.inputValue();
    await framework.fill('React');
    await country.selectOption('US');
    await page.getByRole('button', { name: /Period/ }).click();
    const range = page.getByRole('button', { name: /Period/ });
    await expect(range).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('form', { name: 'Editable fields' }).evaluate(element => {
      if (!(element instanceof HTMLFormElement)) throw new Error('Expected form');
      element.reset();
    });
    await expect(framework).toHaveValue('Astro');
    await expect(country).toHaveValue('CO');
    await expect(phone).toHaveValue(initialPhone);
    await expect(range).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Native changes: 0', { exact: true })).toBeVisible();
    await page.getByRole('heading', { name: 'Native form behavior' }).click();
    await page.screenshot({ path: testInfo.outputPath('form-reset.png'), fullPage: true });
  });

  test('cancelled native form reset preserves values and an open unnamed range draft', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel reset', exact: true }).click();
    const framework = page.getByRole('combobox', { name: 'Framework' });
    const country = page.getByRole('combobox', { name: 'Contact country' });
    await framework.fill('React');
    await country.selectOption('US');
    const range = page.getByRole('button', { name: /Period/ });
    await range.click();
    await page.getByRole('form', { name: 'Editable fields' }).evaluate(element => {
      if (!(element instanceof HTMLFormElement)) throw new Error('Expected form');
      element.reset();
    });
    await expect(framework).toHaveValue('React');
    await expect(country).toHaveValue('US');
    await expect(range).toHaveAttribute('aria-expanded', 'true');
  });

  test('calendar selection emits each public callback once and updates form data', async ({ page }) => {
    await page.getByRole('button', { name: 'Appointment' }).click();
    await page.locator('[data-ui-date-picker] [data-date="2026-09-11"]').click();
    await expect(page.getByText('Native changes: 1', { exact: true })).toBeVisible();
    await expect(page.getByText('Value changes: 1', { exact: true })).toBeVisible();
    const selected = await page.getByRole('form', { name: 'Editable fields' }).evaluate(element => {
      if (!(element instanceof HTMLFormElement)) throw new Error('Expected form');
      return new FormData(element).get('appointment');
    });
    expect(selected).toBe('2026-09-11');
  });
});

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
    const filterSummary = page.locator('.ui-filter-bar summary');
    await filterSummary.focus();
    await filterSummary.press('Enter');
    await expect(page.getByRole('searchbox', { name: 'Search clients' })).toBeHidden();
    await filterSummary.press('Enter');
    await expect(page.getByRole('searchbox', { name: 'Search clients' })).toBeVisible();
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
    await expect(trigger).toBeFocused();
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

test('Elements scalar controls retain form events, defaults, and disabled state after relocation', async ({ page }) => {
  await page.goto('/visual/elements');
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-input');
    const form = document.createElement('form');
    form.id = 'scalar-contract';
    form.innerHTML = '<fieldset><lumen-input id="scalar-email" name="email" type="email" value="first@example.com"></lumen-input><lumen-checkbox id="scalar-check" checked name="updates" value="yes"></lumen-checkbox></fieldset>';
    document.body.prepend(form);
    const host = form.querySelector('lumen-input');
    if (!host) throw new Error('Expected scalar input');
    host.addEventListener('input', event => {
      host.setAttribute('data-event-target', event.target === host ? 'host' : 'child');
      host.setAttribute('data-event-count', String(Number(host.getAttribute('data-event-count') ?? 0) + 1));
    });
    host.remove();
    host.setAttribute('form', form.id);
    document.body.append(host);
  });
  const host = page.locator('#scalar-email');
  await host.locator('input').fill('updated@example.com');
  await expect(host).toHaveAttribute('data-event-target', 'host');
  await expect(host).toHaveAttribute('data-event-count', '1');
  const submitted = await page.locator('#scalar-contract').evaluate(form => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected form');
    return new FormData(form).get('email');
  });
  expect(submitted).toBe('updated@example.com');
  const checkbox = page.locator('#scalar-check');
  await checkbox.evaluate(element => { Reflect.set(element, 'checked', false); });
  await page.locator('#scalar-contract').evaluate(form => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected form');
    form.addEventListener('reset', event => { event.preventDefault(); }, { once: true });
    form.reset();
  });
  await expect(checkbox.locator('input')).not.toBeChecked();
  await page.locator('#scalar-contract').evaluate(form => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected form');
    form.reset();
  });
  await expect(checkbox.locator('input')).toBeChecked();
  await expect(host.locator('input')).toHaveValue('first@example.com');
  await expect(host).toHaveAttribute('data-event-count', '1');
  await page.locator('#scalar-contract fieldset').evaluate(element => {
    if (!(element instanceof HTMLFieldSetElement)) throw new Error('Expected fieldset');
    element.disabled = true;
  });
  await checkbox.evaluate(element => { element.setAttribute('aria-label', 'Updates'); });
  await expect(checkbox.locator('input')).toBeDisabled();
  expect(await checkbox.locator('input').evaluate(element => {
    if (!(element instanceof HTMLInputElement)) throw new Error('Expected input');
    return element.disabled;
  })).toBe(true);
});

test('Elements native multiple select submits and resets every selected option', async ({ page }) => {
  await page.goto('/visual/elements');
  await page.evaluate(async () => {
    await customElements.whenDefined('lumen-native-select');
    const form = document.createElement('form');
    form.id = 'multiple-contract';
    form.innerHTML = '<lumen-native-select name="roles" multiple><option selected value="editor">Editor</option><option selected value="reviewer">Reviewer</option><option value="viewer">Viewer</option></lumen-native-select>';
    document.body.prepend(form);
  });
  const values = () => page.locator('#multiple-contract').evaluate(form => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected form');
    return new FormData(form).getAll('roles');
  });
  expect(await values()).toEqual(['editor', 'reviewer']);
  await page.locator('#multiple-contract select').selectOption(['viewer', 'reviewer']);
  expect(await values()).toEqual(['reviewer', 'viewer']);
  await page.locator('#multiple-contract').evaluate(form => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected form');
    form.reset();
  });
  expect(await values()).toEqual(['editor', 'reviewer']);
});

test('visualSize renders equivalent form densities and preserves keyboard selection', async ({ page }, testInfo) => {
  await page.goto('/visual/control-sizes');
  await expect(page.getByRole('heading', { name: 'Visual form sizes' })).toBeVisible();
  const heights: number[] = [];
  for (const visualSize of ['sm', 'default', 'lg']) {
    const group = page.locator(`[data-visual-size="${visualSize}"]`);
    const react = group.getByRole('combobox', { name: `React estado ${visualSize}` });
    const elements = group.getByRole('combobox', { name: `Elements estado ${visualSize}` });
    await expect(elements).toBeVisible();
    const fallback = group.locator('lumen-select select');
    await expect(fallback).toHaveCSS('opacity', '0');
    await expect(fallback).toHaveCSS('position', 'absolute');
    await expect(fallback).toHaveCSS('pointer-events', 'none');
    await expect(fallback).toHaveAttribute('tabindex', '-1');
    const reactBox = await react.boundingBox();
    const elementsBox = await elements.boundingBox();
    if (!reactBox || !elementsBox) throw new Error('Expected rendered select bounds');
    expect(elementsBox.height).toBeCloseTo(reactBox.height, 0);
    heights.push(reactBox.height);
    await react.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(react).toContainText('Pendiente');
    const reactPhone = group.getByRole('textbox', { name: `React teléfono ${visualSize}` });
    const elementsPhone = group.getByRole('textbox', { name: `Elements teléfono ${visualSize}` });
    const reactPhoneBox = await reactPhone.boundingBox();
    const elementsPhoneBox = await elementsPhone.boundingBox();
    if (!reactPhoneBox || !elementsPhoneBox) throw new Error('Expected rendered phone bounds');
    expect(elementsPhoneBox.height).toBeCloseTo(reactPhoneBox.height, 0);
  }
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('visual-form-sizes.png'), fullPage: true });
});
