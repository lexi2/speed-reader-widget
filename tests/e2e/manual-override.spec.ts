import { test, expect } from '@playwright/test';

test('manual <rsvp-reader> on page disables auto-injection', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<article',
      '<rsvp-reader text="One two three four five." wpm="200"></rsvp-reader><article',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('button.rsvp-reader-trigger')).toHaveCount(0);
  await expect(page.locator('rsvp-reader')).toHaveCount(1);
});
