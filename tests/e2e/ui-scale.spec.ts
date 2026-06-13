import { test, expect } from '@playwright/test';

const reader = (page: import('@playwright/test').Page) =>
  page.locator('rsvp-reader[data-rsvp-auto]');

async function openReader(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('button.rsvp-reader-trigger').click();
  await expect(reader(page)).toBeAttached();
}

test('meta text stays readable when page html font-size is 62.5%', async ({ page }) => {
  await page.addStyleTag({ content: 'html { font-size: 62.5%; }' });
  await page.goto('/ghost-post-fixture.html');
  await openReader(page);

  const metaSize = await reader(page).evaluate((el: Element) => {
    const meta = (el as HTMLElement).shadowRoot!.querySelector('.meta') as HTMLElement;
    return parseFloat(getComputedStyle(meta).fontSize);
  });

  expect(metaSize).toBeGreaterThanOrEqual(14);
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('meta text is at least 15px on small-root pages', async ({ page }) => {
    await page.addStyleTag({ content: 'html { font-size: 62.5%; }' });
    await page.goto('/ghost-post-fixture.html');
    await openReader(page);

    const metaSize = await reader(page).evaluate((el: Element) => {
      const meta = (el as HTMLElement).shadowRoot!.querySelector('.meta') as HTMLElement;
      return parseFloat(getComputedStyle(meta).fontSize);
    });

    expect(metaSize).toBeGreaterThanOrEqual(15);
  });

  test('stage height is capped to leave room for chrome text', async ({ page }) => {
    await page.goto('/ghost-post-fixture.html');
    await openReader(page);

    const stageHeight = await reader(page).evaluate((el: Element) => {
      const stage = (el as HTMLElement).shadowRoot!.querySelector('.stage') as HTMLElement;
      return stage.getBoundingClientRect().height;
    });

    expect(stageHeight).toBeLessThan(280);
  });
});
