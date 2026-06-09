import { test, expect } from '@playwright/test';
import { startReading } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

test('reader mounts with shadow DOM after click', async ({ page }) => {
  await expect(reader(page)).toBeAttached();
  const wpm = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="wpm"]')?.textContent,
  );
  expect(wpm).toMatch(/300 wpm/);
});

test('empty-state message is not visible when words are loaded', async ({ page }) => {
  // Wait a frame for setText to populate the store
  await page.waitForTimeout(100);
  const emptyVisible = await reader(page).evaluate((el: Element) => {
    const node = (el as HTMLElement).shadowRoot?.querySelector('[data-state="empty"]') as HTMLElement | null;
    if (!node) return false;
    const style = node.ownerDocument!.defaultView!.getComputedStyle(node);
    return style.display !== 'none' && !node.hidden;
  });
  expect(emptyVisible).toBe(false);
});

test('play -> pause via UI button', async ({ page }) => {
  await startReading(page, reader(page));
  await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="play"]')
      ?.click(),
  );
  const status = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="status"]')?.textContent,
  );
  expect(status).toBe('Paused');
});

test('faster button increases WPM by 25', async ({ page }) => {
  await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="faster"]')
      ?.click(),
  );
  const wpm = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="wpm"]')?.textContent,
  );
  expect(wpm).toMatch(/325 wpm/);
});

test('slower button decreases WPM by 25', async ({ page }) => {
  await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="slower"]')
      ?.click(),
  );
  const wpm = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="wpm"]')?.textContent,
  );
  expect(wpm).toMatch(/275 wpm/);
});

test('exit button removes the reader and returns focus to trigger', async ({ page }) => {
  await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="exit"]')
      ?.click(),
  );
  await expect(reader(page)).toHaveCount(0);
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedTag).toBe('BUTTON');
});

test('keyboard: ArrowRight bumps WPM', async ({ page }) => {
  await reader(page).focus();
  await page.keyboard.press('ArrowRight');
  const wpm = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="wpm"]')?.textContent,
  );
  expect(wpm).toMatch(/325 wpm/);
});

test('keyboard: Space toggles play/pause', async ({ page }) => {
  await reader(page).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(3200);
  const status1 = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="status"]')?.textContent,
  );
  expect(status1).toBe('Playing');
  await page.keyboard.press('Space');
  const status2 = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="status"]')?.textContent,
  );
  expect(status2).toBe('Paused');
});

test('keyboard: Escape exits the reader', async ({ page }) => {
  await reader(page).focus();
  await page.keyboard.press('Escape');
  await expect(reader(page)).toHaveCount(0);
});

test('theme toggle switches between dark and light', async ({ page }) => {
  await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-theme-pick="light"]')
      ?.click(),
  );
  expect(await reader(page).getAttribute('data-theme')).toBe('light');
  await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-theme-pick="dark"]')
      ?.click(),
  );
  expect(await reader(page).getAttribute('data-theme')).toBe('dark');
});

test('progress bar advances as words consume', async ({ page }) => {
  await startReading(page, reader(page));
  // Make it tick fast so we can observe progression quickly.
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot;
    const fasterBtn = root?.querySelector<HTMLButtonElement>('button[data-control="faster"]');
    for (let i = 0; i < 20; i++) fasterBtn?.click(); // bump toward max
  });
  await page.waitForTimeout(800);
  const aria = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('.progress')?.getAttribute('aria-valuenow'),
  );
  expect(Number(aria)).toBeGreaterThan(0);
});
