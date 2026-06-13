import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<script type="module" src="/src/index.ts"></script>',
      '<script type="module" src="/src/index.ts" data-rsvp-reader data-mode="overlay"></script>',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
});

test('overlay mode: clicking trigger opens a modal with backdrop', async ({ page }) => {
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();
  await expect(reader).toHaveAttribute('data-mode', 'overlay');
  const backdropVisible = await reader.evaluate((el: Element) =>
    !((el as HTMLElement).shadowRoot?.querySelector('.backdrop') as HTMLElement)?.hidden,
  );
  expect(backdropVisible).toBe(true);
});

test('overlay mode: Escape closes and restores focus to trigger', async ({ page }) => {
  await page.locator('button.rsvp-reader-trigger').click();
  await page.locator('rsvp-reader[data-rsvp-auto]').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('rsvp-reader[data-rsvp-auto]')).toHaveCount(0);
  const focusClass = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.className);
  expect(focusClass).toContain('rsvp-reader-trigger');
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('overlay mode uses immersive layout and hides toolbar labels', async ({ page }) => {
    await page.locator('button.rsvp-reader-trigger').click();
    const reader = page.locator('rsvp-reader[data-rsvp-auto]');
    await expect(reader).toHaveAttribute('data-mode', 'overlay');
    await expect(reader).toHaveAttribute('data-mobile-immersive', '');

    const layout = await reader.evaluate((el: Element) => {
      const host = el as HTMLElement;
      const root = host.shadowRoot!;
      const rootEl = root.querySelector('.root') as HTMLElement;
      const topLabel = root.querySelector('.toolbar-top .control-item__label') as HTMLElement;
      return {
        rootMaxWidth: getComputedStyle(rootEl).maxWidth,
        topLabelDisplay: getComputedStyle(topLabel).display,
      };
    });
    expect(layout.rootMaxWidth).toBe('none');
    expect(layout.topLabelDisplay).toBe('none');
  });
});
