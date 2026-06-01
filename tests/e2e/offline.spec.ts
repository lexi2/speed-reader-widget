import { test, expect } from '@playwright/test';

/**
 * Offline-after-first-load proof:
 *
 * The PRD requires the widget to "operate offline after initial load". For an
 * embedded widget, this is satisfied when (1) the bundle is in the browser's
 * HTTP cache on subsequent visits (a deployment concern — see README's
 * Cache-Control section), and (2) the widget itself makes no further network
 * requests once the page has loaded and the article text is in the DOM.
 *
 * This test verifies (2): mount the reader online, drop the network, and
 * confirm playback continues to advance words with no further requests.
 */

test('widget keeps working after the network is cut post-init', async ({ page, context }) => {
  await page.goto('/ghost-post-fixture.html', { waitUntil: 'networkidle' });
  await page.locator('button.rsvp-reader-trigger').click();

  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();

  // Count requests that happen after we go offline. They should be zero.
  let requestsAfterOffline = 0;
  page.on('request', () => { requestsAfterOffline++; });

  await context.setOffline(true);

  // Track progress to prove playback genuinely advances offline
  const idxBefore = await reader.evaluate(
    (el: Element) =>
      Number(
        (el as HTMLElement).shadowRoot
          ?.querySelector('.progress')
          ?.getAttribute('aria-valuenow') ?? '0',
      ),
  );

  await page.waitForTimeout(800);

  const idxAfter = await reader.evaluate(
    (el: Element) =>
      Number(
        (el as HTMLElement).shadowRoot
          ?.querySelector('.progress')
          ?.getAttribute('aria-valuenow') ?? '0',
      ),
  );

  expect(idxAfter).toBeGreaterThan(idxBefore);
  expect(requestsAfterOffline).toBe(0);

  // Controls remain responsive offline
  await reader.evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="play"]')
      ?.click(),
  );
  const status = await reader.evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="status"]')?.textContent,
  );
  expect(status).toBe('Paused');

  await context.setOffline(false);
});
