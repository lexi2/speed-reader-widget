import { test, expect } from '@playwright/test';

/**
 * Targeted WCAG AA contrast assertion for the primary button.
 *
 * Regression guard for the dark-mode `.btn--primary` bug where white text on
 * #60a5fa background produced 2.54:1 — well below the AA threshold of 4.5:1.
 */

const AA_BODY = 4.5;

function relLuminance(r: number, g: number, b: number): number {
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrast(rgb1: number[], rgb2: number[]): number {
  const l1 = relLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = relLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

function parseRgb(s: string): number[] {
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`Cannot parse colour ${s}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

for (const theme of ['light', 'dark'] as const) {
  test(`primary button passes WCAG AA contrast in ${theme} theme`, async ({ page }) => {
    await page.goto('/ghost-post-fixture.html');
    await page.locator('button.rsvp-reader-trigger').click();
    const reader = page.locator('rsvp-reader[data-rsvp-auto]');
    await expect(reader).toBeAttached();

    await reader.evaluate((el: Element, t: string) => {
      el.setAttribute('theme', t);
    }, theme);
    await page.waitForTimeout(50);

    const colours = await reader.evaluate((el: Element) => {
      const root = (el as HTMLElement).shadowRoot!;
      const btn = root.querySelector('button.btn--primary') as HTMLElement;
      const cs = getComputedStyle(btn);
      return { color: cs.color, background: cs.backgroundColor };
    });

    const ratio = contrast(parseRgb(colours.color), parseRgb(colours.background));
    expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
  });
}
