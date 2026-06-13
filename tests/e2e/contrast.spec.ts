import { test, expect } from '@playwright/test';
import { AA_BODY, assertShadowContrast } from './color-utils';

/**
 * Targeted WCAG AA contrast assertion for the primary button.
 *
 * Regression guard for the dark-mode `.btn--primary` bug where white text on
 * #60a5fa background produced 2.54:1 — well below the AA threshold of 4.5:1.
 */

for (const theme of ['light', 'dark'] as const) {
  test(`primary button passes WCAG AA contrast in ${theme} theme`, async ({ page }) => {
    await page.goto('/ghost-post-fixture.html');
    await page.locator('button.rsvp-reader-trigger').click();
    const reader = page.locator('rsvp-reader[data-rsvp-auto]');
    await expect(reader).toBeAttached();

    const ratio = await assertShadowContrast(page.locator('rsvp-reader[data-rsvp-auto]'), 'button.btn--primary', theme);
    expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
  });
}

test('light mode: inactive settings theme segment passes WCAG AA contrast', async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();

  await reader.evaluate((el: Element) => {
    (el as HTMLElement).shadowRoot
      ?.querySelector<HTMLButtonElement>('button[data-control="settings"]')
      ?.click();
  });

  const ratio = await assertShadowContrast(
    reader,
    '[data-settings-theme] .settings-segmented__btn[aria-pressed="false"]',
    'light',
  );
  expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
});

test('light mode: stage idle hint passes WCAG AA contrast', async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();

  await reader.evaluate((el: Element) => el.setAttribute('theme', 'light'));

  const ratio = await reader.evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const label = root.querySelector('[data-stage-idle-hint]') as HTMLElement;
    const stage = root.querySelector('.stage') as HTMLElement;
    if (!label || !stage) throw new Error('Missing stage idle hint');

    const cssColorToRgb = (color: string): number[] | null => {
      if (!color || color === 'transparent') return null;
      if (/rgba?\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color)) return null;
      if (/\/\s*0\s*\)/.test(color)) return null;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      const normalized = ctx.fillStyle;
      if (!normalized.startsWith('#')) {
        const m = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) throw new Error(`Cannot parse colour ${color}`);
        return [Number(m[1]), Number(m[2]), Number(m[3])];
      }
      const n = parseInt(normalized.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    const relLuminance = (r: number, g: number, b: number) => {
      const toLin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    };

    const labelCs = getComputedStyle(label);
    const stageCs = getComputedStyle(stage);
    const fg = cssColorToRgb(labelCs.color);
    const bg = cssColorToRgb(stageCs.backgroundColor);
    if (!fg || !bg) throw new Error('Cannot resolve stage idle hint colours');
    const l1 = relLuminance(fg[0], fg[1], fg[2]);
    const l2 = relLuminance(bg[0], bg[1], bg[2]);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  });

  expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} mode: toolbar button hover passes WCAG AA contrast`, async ({ page }) => {
    await page.goto('/ghost-post-fixture.html');
    await page.locator('button.rsvp-reader-trigger').click();
    const reader = page.locator('rsvp-reader[data-rsvp-auto]');
    await expect(reader).toBeAttached();

    await reader.evaluate((el: Element, t: string) => {
      el.setAttribute('theme', t);
    }, theme);

    await reader.locator('[data-control="settings"]').hover();

    const ratio = await assertShadowContrast(reader, '[data-control="settings"]');
    expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
  });
}
