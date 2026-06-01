import { test, expect } from '@playwright/test';

/**
 * The widget emits `rsvp:error` events on document for any error caught
 * inside its boundaries. This is the hook customers wire to Sentry / Rollbar
 * / a custom endpoint without us bundling any of those.
 */

test('rsvp:error fires when the parser fails on a hostile source element', async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');

  await page.evaluate(() => {
    (window as unknown as { __errors: any[] }).__errors = [];
    document.addEventListener('rsvp:error', (e: Event) => {
      (window as unknown as { __errors: any[] }).__errors.push((e as CustomEvent).detail);
    });

    // Force the parser's cloneNode call to throw by patching this specific
    // element's own cloneNode (own props win over prototype lookups).
    const article = document.querySelector('.gh-content') as Element & { cloneNode: () => Element };
    article.cloneNode = () => { throw new Error('forced-clone-failure'); };

    // Mount a manual reader pointed at the hostile element
    const r = document.createElement('rsvp-reader');
    r.setAttribute('source-selector', '.gh-content');
    document.body.appendChild(r);
  });

  await page.waitForTimeout(150);

  const errors = await page.evaluate(() => (window as unknown as { __errors: any[] }).__errors);
  expect(errors.length).toBeGreaterThan(0);

  const first = errors[0];
  expect(first.widget).toBe('rsvp-reader');
  expect(typeof first.version).toBe('string');
  expect(first.context).toBe('parser');
  expect(String(first.error)).toContain('forced-clone-failure');
});

test('rsvp:error contains the widget version and a context tag', async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');

  const detail = await page.evaluate(async () => {
    return await new Promise<any>((resolve) => {
      document.addEventListener(
        'rsvp:error',
        (e: Event) => resolve((e as CustomEvent).detail),
        { once: true },
      );

      const article = document.querySelector('.gh-content') as Element & { cloneNode: () => Element };
      article.cloneNode = () => { throw new Error('expected'); };
      const r = document.createElement('rsvp-reader');
      r.setAttribute('source-selector', '.gh-content');
      document.body.appendChild(r);
    });
  });

  expect(detail.widget).toBe('rsvp-reader');
  expect(detail.version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(['parser', 'connectedCallback', 'scheduler-tick', 'auto-install']).toContain(detail.context);
});
