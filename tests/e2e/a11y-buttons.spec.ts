import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/index.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

test('all reader buttons have accessible names', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });

  const unnamed = await reader(page).evaluate((el: Element) => {
    const nameOf = (btn: HTMLButtonElement) => {
      const aria = btn.getAttribute('aria-label')?.trim();
      if (aria) return aria;
      return btn.textContent?.trim() ?? '';
    };
    const root = (el as HTMLElement).shadowRoot!;
    const buttons = Array.from(root.querySelectorAll('button'));
    return buttons
      .map((btn) => ({ control: btn.getAttribute('data-control') ?? btn.className, name: nameOf(btn) }))
      .filter((b) => !b.name);
  });

  expect(unnamed).toEqual([]);
});

test('toolbar tooltips hidden when settings panel is open', async ({ page }) => {
  const settingsWrap = reader(page).locator('[data-control-wrap="settings"]');
  await settingsWrap.hover();
  await settingsWrap.locator('[data-control="settings"]').click();

  await expect(reader(page)).toHaveAttribute('data-settings-open', '');

  const labelHidden = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const label = root.querySelector('[data-control-wrap="settings"] .control-item__label') as HTMLElement;
    const cs = getComputedStyle(label);
    return cs.visibility === 'hidden' || Number(cs.opacity) === 0;
  });
  expect(labelHidden).toBe(true);
});

test('settings panel buttons show hover hints on desktop', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });

  const close = reader(page).locator('[data-settings-close]');
  await expect(close).toHaveClass(/btn--hint/);
  await close.hover();
  const closeHint = await close.evaluate((btn) => getComputedStyle(btn, '::after').content);
  expect(closeHint).toContain('Close settings panel');

  const sizeS = reader(page).locator('[data-font-size-pick="s"]');
  await sizeS.hover();
  const sizeHint = await sizeS.evaluate((btn) => getComputedStyle(btn, '::after').content);
  expect(sizeHint).toContain('Small');
});

test('desktop toolbar labels appear on hover', async ({ page }) => {
  const playWrap = reader(page).locator('[data-control-wrap="play"]');
  const label = playWrap.locator('.control-item__label');

  await expect(label).toBeHidden();

  await playWrap.hover();
  await expect(label).toBeVisible();
  await expect(label).toHaveText('Play reader');
});

test('play button hover hint updates when playing', async ({ page }) => {
  const playWrap = reader(page).locator('[data-control-wrap="play"]');
  await playWrap.locator('[data-control="play"]').click();
  await expect(reader(page).locator('.root')).toContainText('Playing', { timeout: 5000 });

  await playWrap.hover();
  await expect(playWrap.locator('.control-item__label')).toHaveText('Pause reader');
});
