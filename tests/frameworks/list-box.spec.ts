import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/visual/list-box');
});

test('ListBox exposes one tab stop per enabled list and none for the hidden native select', async ({ page }) => {
  await page.getByRole('button', { name: 'Before' }).focus();

  const stops: string[] = [];

  for (let index = 0; index < 3; index += 1) {
    await page.keyboard.press('Tab');
    stops.push(await page.evaluate(() => {
      const active = document.activeElement;

      if (!active) return 'none';

      return `${active.tagName.toLowerCase()}:${active.getAttribute('role') ?? ''}:${active.closest('[data-ui-list-box]') ? 'list-box' : 'outside'}`;
    }));
  }

  expect(stops).toEqual(['div:listbox:list-box', 'div:listbox:list-box', 'button::outside']);
});

test('the visible ListBox carries its label or aria-label and label clicks focus it', async ({ page }) => {
  const reviewer = page.getByRole('listbox', { name: 'Reviewer', exact: true });

  await expect(reviewer).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Backup reviewer' })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Locked reviewer' })).toHaveAttribute('aria-disabled', 'true');

  await page.getByText('Reviewer', { exact: true }).click();
  await expect(reviewer).toBeFocused();
});

test('keyboard navigation exposes the active option to assistive technology', async ({ page }) => {
  const reviewer = page.getByRole('listbox', { name: 'Reviewer', exact: true });

  await reviewer.focus();
  await page.keyboard.press('ArrowDown');

  const activeId = await reviewer.getAttribute('aria-activedescendant') ?? '';

  expect(activeId).not.toBe('');
  await expect(page.locator(`[id="${activeId}"]`)).toHaveText('Bruno');
});

test('an invalid required ListBox focuses and marks the visible list, then submits once chosen', async ({ page }) => {
  const reviewer = page.getByRole('listbox', { name: 'Reviewer', exact: true });

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(reviewer).toBeFocused();
  await expect(reviewer).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-list-box-submitted]')).toHaveText('');

  await reviewer.getByRole('option', { name: 'Chen' }).click();
  await expect(reviewer).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('[data-list-box-submitted]')).toHaveText('chen');
});

test('form reset restores uncontrolled ListBox selections', async ({ page }) => {
  const backup = page.getByRole('listbox', { name: 'Backup reviewer' });

  await backup.getByRole('option', { name: 'Chen' }).click();
  await expect(backup.getByRole('option', { name: 'Chen' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(backup.getByRole('option', { name: 'Bruno' })).toHaveAttribute('aria-selected', 'true');
  await expect(backup.getByRole('option', { name: 'Chen' })).toHaveAttribute('aria-selected', 'false');
});

test('consumer focus callbacks fire once per entry and exit for label, pointer, and keyboard focus', async ({ page }) => {
  const reviewer = page.getByRole('listbox', { name: 'Reviewer', exact: true });
  const log = page.locator('[data-list-box-focus-log]');

  await page.getByText('Reviewer', { exact: true }).click();
  await expect(reviewer).toBeFocused();
  await reviewer.getByRole('option', { name: 'Chen' }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(log).toHaveText('focus:reviewer blur:reviewer');

  await page.keyboard.press('Shift+Tab');
  await expect(reviewer).toBeFocused();
  await page.getByRole('button', { name: 'Before' }).click();
  await expect(log).toHaveText('focus:reviewer blur:reviewer focus:reviewer blur:reviewer');
});


test('external labels name and focus the visible ListBox while explicit names keep precedence', async ({ page }) => {
  const external = page.getByRole('listbox', { name: 'External reviewer', exact: true });

  await expect(external).toBeVisible();
  await page.getByText('External reviewer', { exact: true }).click();
  await expect(external).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(external).toHaveAttribute('aria-activedescendant', /.+/);
  await expect(page.getByRole('listbox', { name: 'Explicit reviewer name', exact: true })).toBeVisible();
});

test('React ListBox follows labels after adoption into another document', async ({ page }) => {
  await page.locator('#external-reviewer').evaluate(select => {
    const root = select.closest('[data-ui-list-box]');
    if (!root) throw new Error('Expected ListBox root');
    const frame = document.createElement('iframe');
    frame.title = 'Adopted ListBox';
    document.body.append(frame);
    const destination = frame.contentDocument;
    if (!destination) throw new Error('Expected frame document');
    const label = destination.createElement('label');
    label.htmlFor = select.id;
    label.id = 'destination-label';
    label.textContent = 'Destination reviewer';
    destination.body.append(label, root);
  });
  const frame = page.frameLocator('iframe[title="Adopted ListBox"]');
  const list = frame.getByRole('listbox');
  await expect(list).toHaveAccessibleName('Destination reviewer');
  await frame.locator('label').evaluate(label => {
    label.id = 'renamed-label';
    label.textContent = 'Renamed reviewer';
  });
  await expect(list).toHaveAttribute('aria-labelledby', 'renamed-label');
  await expect(list).toHaveAccessibleName('Renamed reviewer');
  await frame.locator('label').evaluate(label => { label.remove(); });
  await expect(list).not.toHaveAttribute('aria-labelledby');
});
