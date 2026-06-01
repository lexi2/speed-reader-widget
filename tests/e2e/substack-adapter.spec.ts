import { test, expect } from '@playwright/test';

/**
 * Substack adapter:
 *  - Detects via substackcdn.com link and/or .single-post-container
 *  - Finds article body via .available-content
 *  - Wins over WordPress despite both setting body.single-post
 */

test('substack fixture: trigger auto-installs above .available-content', async ({ page }) => {
  await page.goto('/substack-post-fixture.html');
  const trigger = page.locator('button.rsvp-reader-trigger');
  await expect(trigger).toBeVisible();

  const trigBox = await trigger.boundingBox();
  const article = await page.locator('.available-content').boundingBox();
  expect(trigBox).not.toBeNull();
  expect(article).not.toBeNull();
  expect(trigBox!.y).toBeLessThan(article!.y + article!.height);
});

test('adapter precedence: substack wins over wordpress on body.single-post pages', async ({ page }) => {
  // Both adapters match body.single-post; the substack-specific signals
  // (.single-post-container + substackcdn.com link) must promote the
  // substack adapter ahead of wordpress in the registry.
  await page.goto('/substack-post-fixture.html');
  const articleParent = await page.evaluate(() => {
    const trigger = document.querySelector('button.rsvp-reader-trigger');
    return trigger?.nextElementSibling?.classList.contains('available-content') ||
           trigger?.parentElement?.classList.contains('available-content') ||
           Boolean(trigger?.closest('.available-content'));
  });
  expect(articleParent).toBe(true);
});

test('substack without single-post markers: no trigger (treats as archive)', async ({ page }) => {
  await page.route('**/substack-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text())
      .replace('class="single-post"', 'class="archive"')
      .replace('<div class="single-post-container">', '<div class="archive-container">');
    await route.fulfill({ response: res, body });
  });
  await page.goto('/substack-post-fixture.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('button.rsvp-reader-trigger')).toHaveCount(0);
});
