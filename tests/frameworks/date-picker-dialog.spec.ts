import { expect, type Locator, type Page, test } from '@playwright/test';

const centerIsVisible = async (target: Locator): Promise<boolean> => {
  const box = await target.boundingBox();

  if (!box) return false;

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  return target.evaluate((element, point) => {
    const hit = element.ownerDocument.elementFromPoint(point.x, point.y);

    return hit !== null && element.contains(hit);
  }, { x, y });
};

const openPicker = async (page: Page, dir: 'ltr' | 'rtl') => {
  await page.goto('/visual/date-picker-dialog');
  await page.getByRole('button', { name: `Open ${dir} form` }).click();

  const dialog = page.getByRole('dialog', { name: `${dir} form` });
  const trigger = dialog.getByRole('button', { name: `${dir} due date` });

  await expect(dialog).toBeVisible();
  await trigger.click();

  const popover = dialog.locator('[data-ui-date-picker-popover]');

  await expect(popover).toBeVisible();
  await expect(popover).toHaveCSS('opacity', '1');

  return { dialog, popover, trigger };
};

for (const dir of ['ltr', 'rtl'] as const) {
  test(`${dir} DatePicker calendar escapes a short scrolling modal dialog`, async ({ page }, testInfo) => {
    const { popover } = await openPicker(page, dir);
    const day = popover.locator('[data-date="2026-09-11"]');
    const viewport = page.viewportSize();
    const bounds = await popover.boundingBox();

    await expect.poll(() => centerIsVisible(day)).toBe(true);
    expect(bounds).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (bounds && viewport) {
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.width).toBeLessThanOrEqual(Math.min(336, viewport.width - 32) + 1);
      expect(bounds.width).toBeGreaterThan(200);
    }

    const colors: string[] = [];
    for (const theme of ['light', 'dark'] as const) {
      await page.locator('html').evaluate((element, value) => {
        element.setAttribute('data-theme', value);
      }, theme);
      const inheritedColor = await popover.evaluate(element => getComputedStyle(element.parentElement ?? element).color);
      await expect(popover).toHaveCSS('color', inheritedColor);
      colors.push(inheritedColor);
      await page.screenshot({ path: testInfo.outputPath(`date-dialog-${dir}-${theme}.png`) });
    }
    expect(colors[0]).not.toBe(colors[1]);

    await day.click();
    await expect(page.locator(`[data-picker-dialog="${dir}"] [data-picker-dialog-value]`)).toHaveText('2026-09-11');
    await expect(popover).toBeHidden();
  });

  test(`${dir} calendar follows its trigger through dialog scroll and viewport resize`, async ({ page }) => {
    const { dialog, popover, trigger } = await openPicker(page, dir);
    const gap = async () => {
      const [anchor, panel] = await Promise.all([trigger.boundingBox(), popover.boundingBox()]);

      return anchor && panel ? Math.round(panel.y - (anchor.y + anchor.height)) : Number.NaN;
    };

    try {
      await expect.poll(gap).toBe(6);
    } catch (error) {
      await test.info().attach('floating-geometry', {
        contentType: 'application/json',
        body: JSON.stringify(await popover.evaluate(element => {
          const trigger = element.parentElement?.querySelector('[data-ui-date-picker-trigger]');
          const dialog = element.closest('dialog');
          const anchor = trigger?.getBoundingClientRect();
          const panel = element.getBoundingClientRect();
          return {
            anchor: anchor ? { top: anchor.top, bottom: anchor.bottom, left: anchor.left, right: anchor.right } : null,
            panel: { top: panel.top, bottom: panel.bottom, left: panel.left, right: panel.right },
            style: element.getAttribute('style'),
            transform: getComputedStyle(element).transform,
            viewport: { width: innerWidth, height: innerHeight, offsetTop: visualViewport?.offsetTop, scale: visualViewport?.scale },
            dialogTransform: dialog ? getComputedStyle(dialog).transform : null
          };
        }))
      });
      throw error;
    }
    await dialog.evaluate(element => {
      element.scrollTop = 12;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect.poll(gap).toBe(6);

    const viewport = page.viewportSize();

    if (viewport) await page.setViewportSize({ width: viewport.width - 40, height: viewport.height });

    await expect(popover).toBeVisible();
    await expect.poll(() => centerIsVisible(popover.locator('[data-date="2026-09-11"]'))).toBe(true);
  });

  test(`${dir} outside presses close the calendar without leaving it in the top layer`, async ({ page }) => {
    const { dialog, popover, trigger } = await openPicker(page, dir);

    // The dialog's padding stays outside the calendar even when the text is covered.
    await dialog.click({ position: { x: 4, y: 4 } });
    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(':popover-open')).toHaveCount(0);
  });

  test(`${dir} calendar realigns after its containing dialog finishes moving`, async ({ page }) => {
    const { dialog, popover, trigger } = await openPicker(page, dir);
    await dialog.evaluate(async element => {
      await Promise.allSettled(element.getAnimations().map(animation => animation.finished));
      element.style.transition = 'transform 100ms linear';
      element.style.transform = 'translate(-50%, calc(-50% - 24px))';
      await Promise.allSettled(element.getAnimations().map(animation => animation.finished));
    });
    await expect.poll(async () => {
      const [anchor, panel] = await Promise.all([trigger.boundingBox(), popover.boundingBox()]);
      return anchor && panel ? Math.round(panel.y - anchor.y - anchor.height) : Number.NaN;
    }).toBe(6);
  });

  test(`${dir} a constrained viewport keeps the last calendar row reachable`, async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('Expected test viewport');
    await page.setViewportSize({ width: viewport.width, height: 400 });
    const { popover } = await openPicker(page, dir);
    const day = popover.locator('[data-date="2026-10-11"]');
    await day.scrollIntoViewIfNeeded();
    await expect.poll(() => centerIsVisible(day)).toBe(true);
    await day.click();
    await expect(page.locator(`[data-picker-dialog="${dir}"] [data-picker-dialog-value]`)).toHaveText('2026-10-11');
    await expect(popover).toBeHidden();
  });

  test(`${dir} Escape closes the calendar before the dialog and cleans up the top layer`, async ({ page }) => {
    const { dialog, popover, trigger } = await openPicker(page, dir);

    await expect(popover.locator('[data-date="2026-09-10"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    await expect(dialog).toBeVisible();
    await expect(page.locator(':popover-open')).toHaveCount(0);
    await expect(popover).not.toHaveAttribute('popover');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test(`${dir} closing the dialog with the calendar open leaves no open popover`, async ({ page }) => {
    const { dialog, popover } = await openPicker(page, dir);
    const trigger = page.locator(`#${dir}-dialog-due`);

    await dialog.evaluate(element => {
      if (element instanceof HTMLDialogElement) element.close();
    });
    await expect(dialog).toBeHidden();
    await expect(page.locator(':popover-open')).toHaveCount(0);
    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: `Open ${dir} form` })).toBeVisible();
  });
}
