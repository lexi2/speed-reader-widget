import type { Locator, Page } from '@playwright/test';

/** Click play and wait for the 3-2-1 countdown to finish. */
export async function startReading(page: Page, reader: Locator): Promise<void> {
  await reader.evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="play"]')
      ?.click();
  });
  await page.waitForTimeout(3500);
}
