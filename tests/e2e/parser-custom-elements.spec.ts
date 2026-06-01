import { test, expect } from '@playwright/test';

/**
 * Regression: production Ghost site at thegrazier.com.au was leaking
 * Broadstreet ad-slot text (custom elements like <broadstreet-zone-container>)
 * into the reader's word stream — the user saw "xmlhttp" and similar
 * script-text artefacts mid-article.
 *
 * Fix: the parser now strips ANY tag containing a hyphen (i.e. all custom
 * elements per the HTML spec), plus hidden / presentational subtrees.
 */

test('custom elements (ad slots, embeds) are stripped from the word stream', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    // Inject the exact pattern observed on the production site
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      `<div class="gh-content">
        <p>BEFORE-AD-PROSE</p>
        <!--kg-card-begin: html-->
        <!-- Inline Article Ad Middle 1 -->
        <broadstreet-zone-container>
          <broadstreet-zone zone-id="185508" tracked="true" id="street-NEdu38YxCHxCHLra">
            xmlhttp request payload should not leak into the reader
            var xhr = new XMLHttpRequest()
          </broadstreet-zone>
        </broadstreet-zone-container>
        <!--kg-card-end: html-->
        <p>AFTER-AD-PROSE</p>
      `,
    );
    await route.fulfill({ response: res, body });
  });

  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();
  await page.waitForTimeout(50);

  const words = await reader.evaluate(
    (el: Element) => (el as unknown as { getParsedWords: () => string[] }).getParsedWords(),
  );
  const joined = words.join(' ');

  // Real prose on either side of the ad survives
  expect(joined).toContain('BEFORE-AD-PROSE');
  expect(joined).toContain('AFTER-AD-PROSE');

  // The ad slot's textContent is gone
  expect(joined.toLowerCase()).not.toContain('xmlhttp');
  expect(joined.toLowerCase()).not.toContain('broadstreet');
  expect(joined.toLowerCase()).not.toContain('xhr');
  expect(joined).not.toContain('zone-id');
});

test('hidden / aria-hidden / presentational subtrees are stripped', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      `<div class="gh-content">
        <p>VISIBLE-ONE</p>
        <div hidden><p>HIDDEN-ATTR-LEAK</p></div>
        <div aria-hidden="true"><p>ARIA-HIDDEN-LEAK</p></div>
        <div role="presentation"><p>PRESENTATION-LEAK</p></div>
        <p>VISIBLE-TWO</p>
      `,
    );
    await route.fulfill({ response: res, body });
  });

  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();
  await page.waitForTimeout(50);

  const words = await reader.evaluate(
    (el: Element) => (el as unknown as { getParsedWords: () => string[] }).getParsedWords(),
  );
  const joined = words.join(' ');

  expect(joined).toContain('VISIBLE-ONE');
  expect(joined).toContain('VISIBLE-TWO');
  expect(joined).not.toContain('HIDDEN-ATTR-LEAK');
  expect(joined).not.toContain('ARIA-HIDDEN-LEAK');
  expect(joined).not.toContain('PRESENTATION-LEAK');
});

test('regular inline prose (em, strong, a, span) is preserved', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      `<div class="gh-content">
        <p>Hello <em>emphasized</em> <strong>strong</strong> <a href="#">linked</a> <span>span-text</span> world.</p>
      `,
    );
    await route.fulfill({ response: res, body });
  });

  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();
  await page.waitForTimeout(50);

  const words = await reader.evaluate(
    (el: Element) => (el as unknown as { getParsedWords: () => string[] }).getParsedWords(),
  );
  const joined = words.join(' ');

  for (const expected of ['Hello', 'emphasized', 'strong', 'linked', 'span-text', 'world.']) {
    expect(joined).toContain(expected);
  }
});
