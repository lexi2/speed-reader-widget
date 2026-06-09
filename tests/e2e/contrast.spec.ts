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

async function assertAaContrast(
  page: import('@playwright/test').Page,
  reader: import('@playwright/test').Locator,
  selector: string,
  theme: 'light' | 'dark',
): Promise<number> {
  await reader.evaluate((el: Element, t: string) => {
    el.setAttribute('theme', t);
  }, theme);
  await page.waitForTimeout(50);

  const colours = await reader.evaluate((el: Element, sel: string) => {
    const root = (el as HTMLElement).shadowRoot!;
    const node = root.querySelector(sel) as HTMLElement;
    if (!node) throw new Error(`Missing node: ${sel}`);
    const cs = getComputedStyle(node);
    let bg = cs.backgroundColor;
    if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
      bg = getComputedStyle(node.parentElement!).backgroundColor;
    }
    return { color: cs.color, background: bg };
  }, selector);

  const ratio = contrast(parseRgb(colours.color), parseRgb(colours.background));
  expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
  return ratio;
}

for (const theme of ['light', 'dark'] as const) {
  test(`primary button passes WCAG AA contrast in ${theme} theme`, async ({ page }) => {
    await page.goto('/ghost-post-fixture.html');
    await page.locator('button.rsvp-reader-trigger').click();
    const reader = page.locator('rsvp-reader[data-rsvp-auto]');
    await expect(reader).toBeAttached();

    await assertAaContrast(page, reader, 'button.btn--primary', theme);
  });
}

test('light mode: inactive theme toggle passes WCAG AA contrast', async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();

  await assertAaContrast(
    page,
    reader,
    '.theme-toggle__btn[aria-pressed="false"]',
    'light',
  );
});

test('light mode: stage play label passes WCAG AA contrast', async ({ page }) => {
  await page.goto('/ghost-post-fixture.html');
  await page.locator('button.rsvp-reader-trigger').click();
  const reader = page.locator('rsvp-reader[data-rsvp-auto]');
  await expect(reader).toBeAttached();

  await reader.evaluate((el: Element) => el.setAttribute('theme', 'light'));
  await page.waitForTimeout(50);

  const ratio = await reader.evaluate((el: Element) => {
    const root = (el as HTMLElement).shadowRoot!;
    const label = root.querySelector('[data-stage-play-label]') as HTMLElement;
    const stage = root.querySelector('.stage') as HTMLElement;
    if (!label || !stage) throw new Error('Missing stage play label');
    const labelCs = getComputedStyle(label);
    const stageCs = getComputedStyle(stage);
    const parse = (s: string) => {
      const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) throw new Error(`Cannot parse colour ${s}`);
      return [Number(m[1]), Number(m[2]), Number(m[3])];
    };
    const l1 = parse(labelCs.color);
    const l2 = parse(stageCs.backgroundColor);
    const relLuminance = (r: number, g: number, b: number) => {
      const toLin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    };
    const a = relLuminance(l1[0], l1[1], l1[2]);
    const b = relLuminance(l2[0], l2[1], l2[2]);
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  });

  expect(ratio).toBeGreaterThanOrEqual(AA_BODY);
});
