import { test, expect } from '@playwright/test';
import { startReading } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

test('mobile: bottom toolbar visible on load', async ({ page }) => {
  const visible = await reader(page).evaluate((el: Element) => {
    const toolbar = (el as HTMLElement).shadowRoot?.querySelector('.toolbar-bottom') as HTMLElement | null;
    return toolbar ? getComputedStyle(toolbar).display !== 'none' : false;
  });
  expect(visible).toBe(true);
});

test('mobile: toolbar stays visible during playback', async ({ page }) => {
  await startReading(page, reader(page));
  await page.waitForTimeout(500);

  const visible = await reader(page).evaluate((el: Element) => {
    const toolbar = (el as HTMLElement).shadowRoot?.querySelector('.toolbar-bottom') as HTMLElement | null;
    return toolbar ? getComputedStyle(toolbar).display !== 'none' : false;
  });
  expect(visible).toBe(true);
});
