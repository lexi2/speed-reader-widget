import { test, expect } from '@playwright/test';

const fixtures = [
  { name: 'ghost', url: '/ghost-post-fixture.html', articleSelector: '.gh-content' },
  { name: 'wordpress', url: '/wordpress-post-fixture.html', articleSelector: '.entry-content' },
  { name: 'generic', url: '/generic-article-fixture.html', articleSelector: '[itemprop="articleBody"]' },
  { name: 'dev-harness', url: '/', articleSelector: '.gh-content' },
];

for (const f of fixtures) {
  test(`${f.name}: trigger button auto-installs above the article`, async ({ page }) => {
    await page.goto(f.url);
    const trigger = page.locator('button.rsvp-reader-trigger');
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText(/read faster/i);

    const trigPos = await trigger.boundingBox();
    const article = await page.locator(f.articleSelector).first().boundingBox();
    expect(trigPos).not.toBeNull();
    expect(article).not.toBeNull();
    expect(trigPos!.y).toBeLessThan(article!.y + article!.height);
  });
}

test('homepage variant: trigger does NOT appear when not a single-post page', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text())
      .replace('class="post-template gh-canvas"', 'class="home-template"');
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('button.rsvp-reader-trigger')).toHaveCount(0);
});
