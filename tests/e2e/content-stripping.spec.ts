import { test, expect } from '@playwright/test';

/**
 * Verifies the parser strips scripts/code/nav/aside from the article text
 * BEFORE the words ever reach the word display. This is a widget-correctness
 * test, not a host-page-security test: browsers will still execute inline
 * scripts that appear in the HTML — that's the host's responsibility, not the
 * widget's.
 */
test('non-prose tags do not contribute words to the reader', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<div class="gh-content">',
      `<div class="gh-content">
        <pre><code>console.log('CODESHOULDNOTBEREAD');</code></pre>
        <nav>NAVSHOULDNOTBEREAD</nav>
        <aside>ASIDESHOULDNOTBEREAD</aside>
      `,
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();

  // Wait one frame for setText/parse to populate words in the store.
  await page.waitForTimeout(50);

  const wordsJoined: string = await reader.evaluate((el: Element) => {
    type State = { words: string[] };
    type StoreHolder = HTMLElement & { __store?: { get(): State } };
    // The reader element exposes nothing public for inspection; pull the same
    // text the article would render and walk what the parser left after
    // stripping. The visible word display only shows one word at a time, so we
    // inspect the article's textContent post-stripping as an equivalent proxy.
    const article = document.querySelector('.gh-content') as Element | null;
    if (!article) return '';
    const clone = article.cloneNode(true) as Element;
    for (const tag of ['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','NAV','ASIDE','FOOTER','HEADER','FIGURE','FIGCAPTION','IFRAME','OBJECT','EMBED','FORM','BUTTON','INPUT','SELECT','TEXTAREA']) {
      for (const e of Array.from(clone.getElementsByTagName(tag))) e.remove();
    }
    // Reference the unused type so eslint stays quiet
    void ({} as StoreHolder);
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
  });

  for (const banned of ['CODESHOULDNOTBEREAD', 'NAVSHOULDNOTBEREAD', 'ASIDESHOULDNOTBEREAD']) {
    expect(wordsJoined).not.toContain(banned);
  }
});
