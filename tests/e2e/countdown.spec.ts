import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
});

const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

test('reader opens idle with stage play button and no auto-play', async ({ page }) => {
  const state = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const stageWrap = root.querySelector('[data-stage-play-wrap]') as HTMLElement | null;
    const toolbarPlayWrap = root.querySelector('[data-control-wrap="play"]') as HTMLElement | null;
    return {
      status: root.querySelector('[data-meta="status"]')?.textContent,
      wordHidden: (root.querySelector('.word') as HTMLElement)?.hidden,
      stagePlayVisible: stageWrap ? !stageWrap.hidden : false,
      stagePlayLabel: root.querySelector('[data-stage-play-label]')?.textContent,
      toolbarPlayVisible: toolbarPlayWrap ? !toolbarPlayWrap.hidden : false,
    };
  });
  expect(state.status).toBe('Ready');
  expect(state.wordHidden).toBe(true);
  expect(state.stagePlayVisible).toBe(true);
  expect(state.stagePlayLabel).toBe('Play');
  expect(state.toolbarPlayVisible).toBe(true);
});

test('play shows 3-2-1 countdown then displays words', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="stage-play"]')
      ?.click();
  });

  const during = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return {
      countdown: root.querySelector('[data-countdown]')?.textContent,
      countdownVisible: !(root.querySelector('[data-countdown]') as HTMLElement)?.hidden,
      wordHidden: (root.querySelector('.word') as HTMLElement)?.hidden,
    };
  });
  expect(during.countdownVisible).toBe(true);
  expect(['3', '2', '1']).toContain(during.countdown);
  expect(during.wordHidden).toBe(true);

  await page.waitForTimeout(3200);

  const after = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return {
      status: root.querySelector('[data-meta="status"]')?.textContent,
      countdownHidden: (root.querySelector('[data-countdown]') as HTMLElement)?.hidden,
      wordHidden: (root.querySelector('.word') as HTMLElement)?.hidden,
      hasWord: !!(root.querySelector('.word .orp')?.textContent?.length),
    };
  });
  expect(after.status).toBe('Playing');
  expect(after.countdownHidden).toBe(true);
  expect(after.wordHidden).toBe(false);
  expect(after.hasWord).toBe(true);
});
