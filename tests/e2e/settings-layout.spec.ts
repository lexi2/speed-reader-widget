import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

async function openSettings(page: import('@playwright/test').Page): Promise<void> {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });
}

test('mobile settings segmented controls span panel width', async ({ page }) => {
  await openSettings(page);

  const widths = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const body = root.querySelector('.settings-panel__body') as HTMLElement;
    const bodyWidth = body.clientWidth;
    const groups = Array.from(root.querySelectorAll<HTMLElement>('.settings-segmented'));
    return groups.map((group) => group.clientWidth / bodyWidth);
  });

  for (const ratio of widths) {
    expect(ratio).toBeGreaterThan(0.98);
  }
});

test('mobile settings panel fits without scrolling', async ({ page }) => {
  await openSettings(page);

  const fits = await reader(page).evaluate((el: Element) => {
    const panel = (el as HTMLElement).shadowRoot!.querySelector('[data-settings-panel]') as HTMLElement;
    return panel.scrollHeight <= panel.clientHeight + 2;
  });

  expect(fits).toBe(true);
});
