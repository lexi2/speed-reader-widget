import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

function parseTime(text: string | null | undefined): number | null {
  if (!text || text === '—:—') return null;
  const parts = text.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

test('timer meta shows elapsed and remaining', async ({ page }) => {
  const times = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return {
      elapsed: root.querySelector('[data-meta="time-elapsed"]')?.textContent,
      remaining: root.querySelector('[data-meta="time-remaining"]')?.textContent,
    };
  });
  expect(times.elapsed).toMatch(/^\d+:\d{2}$/);
  expect(times.remaining).toMatch(/^\d+:\d{2}$/);
  expect(parseTime(times.remaining)).toBeGreaterThan(0);
});

test('remaining time decreases as words advance', async ({ page }) => {
  const before = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="time-remaining"]')?.textContent,
  );
  await reader(page).evaluate((el: Element) => {
    const btn = (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipForward"]');
    for (let i = 0; i < 3; i++) btn?.click();
  });
  const after = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="time-remaining"]')?.textContent,
  );

  const beforeSec = parseTime(before);
  const afterSec = parseTime(after);
  expect(beforeSec).not.toBeNull();
  expect(afterSec).not.toBeNull();
  expect(afterSec!).toBeLessThan(beforeSec!);
});

test('remaining time recomputes when WPM changes', async ({ page }) => {
  const before = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="time-remaining"]')?.textContent,
  );
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="faster"]')
      ?.click();
  });
  const after = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement).shadowRoot?.querySelector('[data-meta="time-remaining"]')?.textContent,
  );
  expect(parseTime(after)).toBeLessThan(parseTime(before)!);
});

test('empty state shows placeholder times', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<article',
      '<rsvp-reader text=""></rsvp-reader><article',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  const times = await page.locator('rsvp-reader').evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return {
      elapsed: root.querySelector('[data-meta="time-elapsed"]')?.textContent,
      remaining: root.querySelector('[data-meta="time-remaining"]')?.textContent,
    };
  });
  expect(times.elapsed).toBe('—:—');
  expect(times.remaining).toBe('—:—');
});
