import { test, expect } from '@playwright/test';
import { startReading } from './helpers';

const LONG_WORD = 'pneumonoultramicroscopicsilicovolcanoconiosis';

const reader = (page: import('@playwright/test').Page) =>
  page.locator('rsvp-reader[data-rsvp-auto]');

async function openReaderWithWord(page: import('@playwright/test').Page, text: string): Promise<void> {
  await page.goto('/ghost-post-fixture.html');
  await page.evaluate((word) => {
    document.querySelector('rsvp-reader[data-rsvp-auto]')?.remove();
    document.querySelector('button.rsvp-reader-trigger')?.remove();
    const el = document.createElement('rsvp-reader');
    el.setAttribute('data-rsvp-auto', '');
    el.setAttribute('text', word);
    el.setAttribute('wpm', '600');
    document.body.prepend(el);
  }, text);
  await expect(reader(page)).toBeAttached();
}

async function setFontSize(
  page: import('@playwright/test').Page,
  size: 's' | 'm' | 'l',
): Promise<void> {
  await reader(page).evaluate((el: Element, pick) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
    root.querySelector<HTMLButtonElement>(`[data-settings-font-size] [data-font-size-pick="${pick}"]`)?.click();
    root.querySelector<HTMLButtonElement>('[data-settings-close]')?.click();
  }, size);
}

async function measureWordFontSize(page: import('@playwright/test').Page): Promise<number> {
  return reader(page).evaluate((el: Element) => {
    const word = (el as HTMLElement).shadowRoot!.querySelector('.word') as HTMLElement;
    return parseFloat(getComputedStyle(word).fontSize);
  });
}

async function wordFitsStage(page: import('@playwright/test').Page): Promise<boolean> {
  return reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const stage = root.querySelector('.stage') as HTMLElement;
    const word = root.querySelector('.word') as HTMLElement;
    const stageWidth = stage.getBoundingClientRect().width;
    const wordWidth = word.getBoundingClientRect().width;
    return wordWidth <= stageWidth - 8;
  });
}

async function pauseReader(page: import('@playwright/test').Page): Promise<void> {
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement & { pause(): void }).pause();
  });
}

test('font size settings change stage word size by at least 3px', async ({ page }) => {
  await openReaderWithWord(page, 'always always always');
  await startReading(page, reader(page));
  await pauseReader(page);

  await setFontSize(page, 's');
  const small = await measureWordFontSize(page);

  await setFontSize(page, 'm');
  const medium = await measureWordFontSize(page);

  await setFontSize(page, 'l');
  const large = await measureWordFontSize(page);

  expect(medium - small).toBeGreaterThanOrEqual(3);
  expect(large - medium).toBeGreaterThanOrEqual(3);
  expect(small).toBe(38);
  expect(medium).toBe(44);
  expect(large).toBe(50);
});

test('long word fits within staging area at medium size', async ({ page }) => {
  await openReaderWithWord(page, `${LONG_WORD} ${LONG_WORD}`);
  await startReading(page, reader(page));
  await pauseReader(page);

  expect(await wordFitsStage(page)).toBe(true);
});

test('long word fits within staging area at large size', async ({ page }) => {
  await openReaderWithWord(page, `${LONG_WORD} ${LONG_WORD}`);
  await startReading(page, reader(page));
  await setFontSize(page, 'l');
  await pauseReader(page);

  expect(await wordFitsStage(page)).toBe(true);
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('long word fits within staging area at large size', async ({ page }) => {
    await openReaderWithWord(page, `${LONG_WORD} ${LONG_WORD}`);
    await startReading(page, reader(page));
    await setFontSize(page, 'l');
    await pauseReader(page);

    expect(await wordFitsStage(page)).toBe(true);
  });
});
