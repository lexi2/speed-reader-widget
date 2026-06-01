import { test, expect } from '@playwright/test';

/**
 * Regression: production Ghost post at thegrazier.com.au had two sentences
 * separated only by a <br> with no whitespace, e.g.
 *
 *   <p>...public review."<br>"Concerned stakeholders...</p>
 *
 * The reader displayed `review."Concerned` as one fused token because raw
 * textContent concatenates text nodes without inserting any whitespace at
 * element boundaries. The parser now injects a space at every block
 * boundary and after every <br>.
 */

test('<br> inside <p> creates a word boundary', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      '<div class="gh-content"><p>"...public review."<br>"Concerned stakeholders saying they only discovered the consultation was underway through a Google Alert."</p>',
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

  // The fused token must NOT appear
  expect(joined).not.toMatch(/review\."Concerned/);
  expect(joined).not.toMatch(/review\.Concerned/);

  // Both halves should be present as recognizable words
  expect(words.some(w => w.includes('review'))).toBe(true);
  expect(words.some(w => w.includes('Concerned'))).toBe(true);
});

test('adjacent block elements with no whitespace between them get a word boundary', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    // Note: no whitespace between </p> and <p>
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      '<div class="gh-content"><p>EndOfParaOne.</p><p>StartOfParaTwo.</p>',
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

  expect(words).toContain('EndOfParaOne.');
  expect(words).toContain('StartOfParaTwo.');
  // The fused token must NOT exist
  expect(words.find(w => w.includes('EndOfParaOne.StartOfParaTwo'))).toBeUndefined();
});

test('multiple consecutive <br>s produce only single-space separators', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      '<div class="gh-content"><p>Alpha<br><br><br>Bravo<br>Charlie</p>',
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

  // No empty entries from multiple consecutive <br>s (the tokenizer collapses
  // whitespace and filters empties)
  expect(words).not.toContain('');
  expect(words).toContain('Alpha');
  expect(words).toContain('Bravo');
  expect(words).toContain('Charlie');
});

test('inline elements still flow without artificial breaks', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      '<div class="gh-content"><p>This <em>emphasised</em> word should not be split.</p>',
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

  // Each word is a separate token
  expect(words).toContain('This');
  expect(words).toContain('emphasised');
  expect(words).toContain('word');
  // No fused tokens from inline boundaries
  expect(words.find(w => w === 'Thisemphasised')).toBeUndefined();
  expect(words.find(w => w === 'emphasisedword')).toBeUndefined();
});
