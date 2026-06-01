import { test, expect } from '@playwright/test';

const optOuts = [
  { label: 'meta tag', injection: `<meta name="rsvp-reader" content="off">`, target: 'head' },
  { label: 'html attribute', injection: '', target: 'html', attr: { name: 'data-rsvp-reader', value: 'off' } },
  { label: 'body class', injection: '', target: 'body', cls: 'no-rsvp-reader' },
  { label: 'window flag', injection: `<script>window.RSVP_READER_DISABLED = true;</script>`, target: 'head' },
];

for (const o of optOuts) {
  test(`opt-out via ${o.label} suppresses the trigger`, async ({ page }) => {
    await page.route('**/ghost-post-fixture.html', async (route) => {
      const res = await route.fetch();
      let body = await res.text();
      if (o.injection) {
        body = body.replace('</head>', `${o.injection}</head>`);
      }
      if (o.target === 'html' && o.attr) {
        body = body.replace('<html lang="en">', `<html lang="en" ${o.attr.name}="${o.attr.value}">`);
      }
      if (o.target === 'body' && o.cls) {
        body = body.replace('post-template gh-canvas', `post-template gh-canvas ${o.cls}`);
      }
      await route.fulfill({ response: res, body });
    });
    await page.goto('/ghost-post-fixture.html');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button.rsvp-reader-trigger')).toHaveCount(0);
  });
}
