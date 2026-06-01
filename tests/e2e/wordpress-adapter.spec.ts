import { test, expect } from '@playwright/test';

/**
 * WordPress adapter coverage:
 *  - Classic editor + classic theme (single-post body class)
 *  - Block editor / FSE theme (.wp-block-post-content)
 *  - Refusal on Query Loop archive pages (multiple .wp-block-post-content)
 */

test('block-theme fixture: trigger auto-installs above .wp-block-post-content', async ({ page }) => {
  await page.goto('/wordpress-block-theme-fixture.html');
  const trigger = page.locator('button.rsvp-reader-trigger');
  await expect(trigger).toBeVisible();

  const trigBox = await trigger.boundingBox();
  const article = await page.locator('.wp-block-post-content').boundingBox();
  expect(trigBox).not.toBeNull();
  expect(article).not.toBeNull();
  expect(trigBox!.y).toBeLessThan(article!.y + article!.height);
});

test('query-loop archive (multiple post-content blocks): trigger does NOT appear', async ({ page }) => {
  // Simulate an archive page that renders 3 post-content previews via Query Loop.
  await page.route('**/wordpress-block-theme-fixture.html', async (route) => {
    const res = await route.fetch();
    const original = await res.text();
    const extra = `
      <article class="wp-block-post"><div class="wp-block-post-content"><p>Another short preview.</p></div></article>
      <article class="wp-block-post"><div class="wp-block-post-content"><p>And another.</p></div></article>
    `;
    const body = original.replace('</main>', `${extra}</main>`);
    await route.fulfill({ response: res, body });
  });
  await page.goto('/wordpress-block-theme-fixture.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('button.rsvp-reader-trigger')).toHaveCount(0);
});

test('classic editor fixture still works (regression check on the existing path)', async ({ page }) => {
  await page.goto('/wordpress-post-fixture.html');
  await expect(page.locator('button.rsvp-reader-trigger')).toBeVisible();
});
