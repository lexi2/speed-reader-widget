import type { Locator, Page } from '@playwright/test';

/** Click play and wait for the 3-2-1 countdown to finish. */
export async function startReading(page: Page, reader: Locator): Promise<void> {
  await reader.evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const stagePlay = root.querySelector<HTMLButtonElement>('button[data-control="stage-play"]');
    const toolbarPlay = root.querySelector<HTMLButtonElement>('button[data-control="play"]');
    const btn = stagePlay && !stagePlay.hidden ? stagePlay : toolbarPlay;
    btn?.click();
  });
  await page.waitForTimeout(3500);
}
