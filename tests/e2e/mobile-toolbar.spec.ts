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
    return toolbar ? !toolbar.hasAttribute('data-toolbar-hidden') : false;
  });
  expect(visible).toBe(true);
});

test('mobile: toolbar auto-hides during playback', async ({ page }) => {
  await startReading(page, reader(page));
  await page.waitForTimeout(3500);

  const hidden = await reader(page).evaluate((el: Element) => {
    const toolbar = (el as HTMLElement).shadowRoot?.querySelector('.toolbar-bottom') as HTMLElement | null;
    return toolbar?.hasAttribute('data-toolbar-hidden') ?? false;
  });
  expect(hidden).toBe(true);
});

test('mobile: stage tap toggles toolbar visibility', async ({ page }) => {
  await startReading(page, reader(page));
  await page.waitForTimeout(3500);

  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot?.querySelector('.stage')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  const visible = await reader(page).evaluate((el: Element) => {
    const toolbar = (el as HTMLElement).shadowRoot?.querySelector('.toolbar-bottom') as HTMLElement | null;
    return toolbar ? !toolbar.hasAttribute('data-toolbar-hidden') : false;
  });
  expect(visible).toBe(true);
});

test('mobile: always show toolbar pref prevents auto-hide', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('rsvp-reader:prefs', JSON.stringify({ alwaysShowToolbar: true }));
  });
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();

  await startReading(page, reader(page));
  await page.waitForTimeout(3500);

  const hidden = await reader(page).evaluate((el: Element) => {
    const toolbar = (el as HTMLElement).shadowRoot?.querySelector('.toolbar-bottom') as HTMLElement | null;
    return toolbar?.hasAttribute('data-toolbar-hidden') ?? false;
  });
  expect(hidden).toBe(false);
});
