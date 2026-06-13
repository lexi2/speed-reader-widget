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

test('settings dyslexic font loads Atkinson Hyperlegible in shadow DOM', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-settings-font] [data-font-pick="dyslexic"]')?.click();
  });

  expect(await reader(page).getAttribute('data-font')).toBe('dyslexic');

  const fontInfo = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return {
      hasFontFace: !!root.querySelector('[data-rsvp-dyslexic-font]'),
      wordFont: getComputedStyle(root.querySelector('.word')!).fontFamily,
    };
  });
  expect(fontInfo.hasFontFace).toBe(true);
  expect(fontInfo.wordFont.toLowerCase()).toContain('atkinson');

  const renderInfo = await reader(page).evaluate(async (el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const word = root.querySelector('.word') as HTMLElement;
    const cs = getComputedStyle(word);
    const measure = (family: string, weight: string) => {
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.font = `${weight} 48px ${family}`;
      return ctx.measureText('Reading').width;
    };
    const dysStack = '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif';
    const sansStack = 'ui-sans-serif, system-ui, sans-serif';
    await document.fonts.load('400 48px "Atkinson Hyperlegible"');
    const wordWidth = measure(dysStack, cs.fontWeight);
    const sansWidth = measure(sansStack, '500');
    return {
      fontWeight: cs.fontWeight,
      rendersAtkinson: wordWidth !== sansWidth,
    };
  });
  expect(renderInfo.fontWeight).toBe('400');
  expect(renderInfo.rendersAtkinson).toBe(true);
});

test('settings panel covers the reader card', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });

  const layout = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const card = root.querySelector('.root') as HTMLElement;
    const panel = root.querySelector('[data-settings-panel]') as HTMLElement;
    const cardRect = card.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const tol = 2;
    return {
      widthMatch: Math.abs(cardRect.width - panelRect.width) <= tol,
      heightMatch: Math.abs(cardRect.height - panelRect.height) <= tol,
      topMatch: Math.abs(cardRect.top - panelRect.top) <= tol,
      leftMatch: Math.abs(cardRect.left - panelRect.left) <= tol,
    };
  });

  expect(layout.widthMatch).toBe(true);
  expect(layout.heightMatch).toBe(true);
  expect(layout.topMatch).toBe(true);
  expect(layout.leftMatch).toBe(true);
});

test('settings pauses playback and requires play to resume', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('[data-control="play"]')?.click();
  });
  await expect(reader(page).locator('.root')).toContainText('Playing', { timeout: 5000 });

  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });

  await expect(reader(page).locator('.root')).toContainText('Paused');

  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('[data-settings-close]')?.click();
  });

  await expect(reader(page).locator('.root')).toContainText('Paused');

  const statusAfterClose = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return root.querySelector('[data-meta="status"]')?.textContent?.trim();
  });
  expect(statusAfterClose).toBe('Paused');

  await page.waitForTimeout(800);
  const statusAfterWait = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return root.querySelector('[data-meta="status"]')?.textContent?.trim();
  });
  expect(statusAfterWait).toBe('Paused');
});

test('settings font size applies data-font-size attribute', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-settings-font-size] [data-font-size-pick="l"]')?.click();
  });

  expect(await reader(page).getAttribute('data-font-size')).toBe('l');
});

test('settings font size buttons show full word labels', async ({ page }) => {
  await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    root.querySelector<HTMLButtonElement>('button[data-control="settings"]')?.click();
  });

  const labels = await reader(page).evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    return Array.from(root.querySelectorAll<HTMLButtonElement>('[data-font-size-pick]'))
      .map((btn) => btn.textContent?.trim() ?? '');
  });

  expect(labels).toEqual(['Small', 'Medium', 'Large']);
});
