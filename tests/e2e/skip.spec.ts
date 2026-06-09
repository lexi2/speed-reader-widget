import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

const getIdx = (page: import('@playwright/test').Page) =>
  reader(page).evaluate((el: Element) => (el as HTMLElement & { getStatus(): { idx: number } }).getStatus().idx);

test('skip forward and back buttons exist', async ({ page }) => {
  const buttons = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return {
      forward: !!root.querySelector('button[data-control="skipForward"]'),
      back: !!root.querySelector('button[data-control="skipBack"]'),
    };
  });
  expect(buttons.forward).toBe(true);
  expect(buttons.back).toBe(true);
});

test('skip forward moves idx by 10', async ({ page }) => {
  const before = await getIdx(page);
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipForward"]')
      ?.click();
  });
  expect(await getIdx(page)).toBe(before + 10);
});

test('skip back moves idx by 10', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipForward"]')
      ?.click();
  });
  const before = await getIdx(page);
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipBack"]')
      ?.click();
  });
  expect(await getIdx(page)).toBe(before - 10);
});

test('skip forward clamps at last word', async ({ page }) => {
  const total = await reader(page).evaluate((el: Element) =>
    (el as HTMLElement & { getStatus(): { total: number } }).getStatus().total,
  );
  await reader(page).evaluate((el: Element) => {
    const btn = (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipForward"]');
    for (let i = 0; i < 200; i++) btn?.click();
  });
  expect(await getIdx(page)).toBe(total - 1);
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipForward"]')
      ?.click();
  });
  expect(await getIdx(page)).toBe(total - 1);
});

test('skip back clamps at first word', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipForward"]')
      ?.click();
  });
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipBack"]')
      ?.click();
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="skipBack"]')
      ?.click();
  });
  expect(await getIdx(page)).toBe(0);
});

test('keyboard Shift+ArrowRight skips forward', async ({ page }) => {
  const before = await getIdx(page);
  await reader(page).focus();
  await page.keyboard.press('Shift+ArrowRight');
  expect(await getIdx(page)).toBe(before + 10);
});

test('keyboard Shift+ArrowLeft skips back', async ({ page }) => {
  await reader(page).focus();
  await page.keyboard.press('Shift+ArrowRight');
  const before = await getIdx(page);
  await page.keyboard.press('Shift+ArrowLeft');
  expect(await getIdx(page)).toBe(before - 10);
});
