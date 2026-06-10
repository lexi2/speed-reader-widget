import type { Locator, Page } from '@playwright/test';

function clickToolbarPlay(reader: Locator): Promise<void> {
  return reader.evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="play"]')
      ?.click();
  });
}

/** Wait until the rAF-driven countdown shows 3, 2, or 1 (WebKit CI can miss short fixed delays). */
export async function waitForCountdownVisible(page: Page, reader: Locator): Promise<string> {
  await clickToolbarPlay(reader);
  return page.waitForFunction(
    (el: Element) => {
      const root = (el as HTMLElement).shadowRoot;
      const countdown = root?.querySelector('[data-countdown]') as HTMLElement | null;
      const text = countdown?.textContent ?? '';
      if (!countdown || countdown.hidden) return null;
      return text === '3' || text === '2' || text === '1' ? text : null;
    },
    await reader.elementHandle(),
    { timeout: 10_000 },
  ).then((h) => h.jsonValue() as Promise<string>);
}

/** Click play and wait for the 3-2-1 countdown to finish. */
export async function startReading(page: Page, reader: Locator): Promise<void> {
  await clickToolbarPlay(reader);
  await page.waitForFunction(
    (el: Element) => {
      const root = (el as HTMLElement).shadowRoot;
      return root?.querySelector('[data-meta="status"]')?.textContent === 'Playing';
    },
    await reader.elementHandle(),
    { timeout: 15_000 },
  );
}
