import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/index.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

test('desktop fullscreen expands reader to viewport without browser fullscreen', async ({ page }) => {
  const fsBtn = reader(page).locator('[data-control="fullscreen"]');
  await expect(fsBtn).toBeVisible();

  await fsBtn.click();

  const info = await reader(page).evaluate((el: Element) => {
    const host = el as HTMLElement;
    const rect = host.getBoundingClientRect();
    return {
      expanded: host.hasAttribute('data-expanded'),
      browserFullscreen: document.fullscreenElement === host,
      width: rect.width,
      height: rect.height,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    };
  });

  expect(info.expanded).toBe(true);
  expect(info.browserFullscreen).toBe(false);
  expect(info.width).toBeGreaterThanOrEqual(info.viewportW - 2);
  expect(info.height).toBeGreaterThanOrEqual(info.viewportH - 2);

  await fsBtn.click();

  const collapsed = await reader(page).evaluate((el: Element) => ({
    expanded: (el as HTMLElement).hasAttribute('data-expanded'),
    browserFullscreen: document.fullscreenElement === el,
  }));
  expect(collapsed.expanded).toBe(false);
  expect(collapsed.browserFullscreen).toBe(false);
});

test('escape exits expanded mode before closing reader', async ({ page }) => {
  await reader(page).locator('[data-control="fullscreen"]').click();
  await expect(reader(page)).toHaveAttribute('data-expanded', '');

  await reader(page).press('Escape');
  await expect(reader(page)).not.toHaveAttribute('data-expanded', '');
  await expect(reader(page)).toBeVisible();
});
