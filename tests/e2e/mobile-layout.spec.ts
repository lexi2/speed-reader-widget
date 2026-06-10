import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

test('mobile reader uses most of the viewport height', async ({ page }) => {
  const layout = await reader(page).evaluate((el: Element) => {
    const host = el as HTMLElement;
    const root = host.shadowRoot!.querySelector('.root') as HTMLElement;
    const hostRect = host.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    return {
      hostHeightRatio: rootRect.height / hostRect.height,
      viewportHeightRatio: rootRect.height / window.innerHeight,
    };
  });

  expect(layout.hostHeightRatio).toBeGreaterThan(0.9);
  expect(layout.viewportHeightRatio).toBeGreaterThan(0.85);
});

test('mobile settings panel fits without scrolling', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });

  const fits = await reader(page).evaluate((el: Element) => {
    const panel = (el as HTMLElement).shadowRoot!.querySelector('[data-settings-panel]') as HTMLElement;
    return panel.scrollHeight <= panel.clientHeight + 2;
  });

  expect(fits).toBe(true);
});
