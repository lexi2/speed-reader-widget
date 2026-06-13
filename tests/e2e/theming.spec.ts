import { test, expect } from '@playwright/test';
import { accentNeedsDarkText, contrastRatio, parseHexColor } from '../../src/utils/contrast';

test('data-accent applies custom colour to host element', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<script type="module" src="/src/index.ts"',
      '<script type="module" src="/src/index.ts" data-accent="#8b5cf6"',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const accent = await page.locator('rsvp-reader[data-rsvp-auto]').evaluate((el: Element) =>
    getComputedStyle(el as HTMLElement).getPropertyValue('--rsvp-accent').trim(),
  );
  expect(accent).toBe('#8b5cf6');
});

test('light accent gets dark on-accent text for WCAG AA', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<script type="module" src="/src/index.ts"',
      '<script type="module" src="/src/index.ts" data-accent="#fde047"',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await reader.evaluate((el: Element) => el.setAttribute('theme', 'light'));
  await page.waitForTimeout(50);

  const onAccent = await reader.evaluate((el: Element) =>
    getComputedStyle(el as HTMLElement).getPropertyValue('--rsvp-on-accent').trim(),
  );
  expect(onAccent).toBe('#18181b');

  const colours = await reader.evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const btn = root.querySelector('button.btn--primary') as HTMLElement;
    const cs = getComputedStyle(btn);
    return { color: cs.color, background: cs.backgroundColor };
  });
  const parseRgb = (s: string) => {
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [];
  };
  expect(contrastRatio(parseRgb(colours.color), parseRgb(colours.background))).toBeGreaterThanOrEqual(4.5);
});

test('data-font sets host data-font attribute', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<script type="module" src="/src/index.ts"',
      '<script type="module" src="/src/index.ts" data-font="serif"',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  await expect(page.locator('rsvp-reader[data-rsvp-auto]')).toHaveAttribute('data-font', 'serif');
});

test('dyslexic font injects @font-face rule', async ({ page }) => {
  await page.route('**/ghost-post-fixture.html', async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace(
      '<script type="module" src="/src/index.ts"',
      '<script type="module" src="/src/index.ts" data-font="dyslexic"',
    );
    await route.fulfill({ response: res, body });
  });
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  await expect(page.locator('rsvp-reader[data-rsvp-auto]')).toHaveAttribute('data-font', 'dyslexic');
  const fontInfo = await page.locator('rsvp-reader[data-rsvp-auto]').evaluate((el: Element) => {
    const host = el as HTMLElement;
    const root = host.shadowRoot!;
    return {
      hasFontFace: !!root.querySelector('[data-rsvp-dyslexic-font]'),
      fontUrl: root.querySelector('[data-rsvp-dyslexic-font]')?.textContent ?? '',
      wordFont: getComputedStyle(root.querySelector('.word')!).fontFamily,
    };
  });
  expect(fontInfo.hasFontFace).toBe(true);
  expect(fontInfo.fontUrl).toContain('/fonts/atkinson-hyperlegible-latin.woff2');
  expect(fontInfo.wordFont.toLowerCase()).toContain('atkinson');
});

test('contrast helper flags low-contrast accents', () => {
  expect(accentNeedsDarkText('#fde047')).toBe(true);
  expect(accentNeedsDarkText('#04395E')).toBe(false);
  expect(parseHexColor('#fff')).toEqual([255, 255, 255]);
});
