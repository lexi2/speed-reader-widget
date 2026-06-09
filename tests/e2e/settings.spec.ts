import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

test('settings panel opens and changes theme', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });

  const panelVisible = await reader(page).evaluate((el: Element) => {
    const panel = (el as HTMLElement).shadowRoot?.querySelector('[data-settings-panel]') as HTMLElement | null;
    return panel ? !panel.hidden : false;
  });
  expect(panelVisible).toBe(true);

  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('[data-settings-theme] [data-theme-pick="dark"]')
      ?.click();
  });
  expect(await reader(page).getAttribute('data-theme')).toBe('dark');
});

test('settings persist font choice in localStorage', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-settings-font] [data-font-pick="mono"]')?.click();
  });

  expect(await reader(page).getAttribute('data-font')).toBe('mono');

  const prefs = await page.evaluate(() => localStorage.getItem('rsvp-reader:prefs'));
  expect(prefs).toContain('"font":"mono"');
});

test('settings font size applies data-font-size attribute', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-settings-font-size] [data-font-size-pick="l"]')?.click();
  });

  expect(await reader(page).getAttribute('data-font-size')).toBe('l');
});
