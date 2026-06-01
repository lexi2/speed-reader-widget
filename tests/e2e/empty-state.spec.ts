import { test, expect } from '@playwright/test';

test('article under the minimum word threshold: trigger does NOT appear', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      /<div class="gh-content">[\s\S]*?<\/div>/,
      '<div class="gh-content"><p>Too short.</p></div>',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('button.rsvp-reader-trigger')).toHaveCount(0);
});

test('manual rsvp-reader with empty text shows empty state', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<article',
      '<rsvp-reader text=""></rsvp-reader><article',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  const reader = page.locator('rsvp-reader');
  await expect(reader).toBeAttached();
  const emptyHidden = await reader.evaluate((el: Element) =>
    ((el as HTMLElement).shadowRoot?.querySelector('[data-state="empty"]') as HTMLElement)?.hidden,
  );
  expect(emptyHidden).toBe(false);
});
