import type { Locator } from '@playwright/test';

export const AA_BODY = 4.5;

/** Compute WCAG contrast inside the shadow root (canvas normalizes oklab from color-mix). */
export async function assertShadowContrast(
  reader: Locator,
  selector: string,
  theme?: 'light' | 'dark',
): Promise<number> {
  if (theme) {
    await reader.evaluate((el: Element, t: string) => {
      el.setAttribute('theme', t);
    }, theme);
  }

  return reader.evaluate((el: Element, sel: string) => {
    const root = (el as HTMLElement).shadowRoot!;
    const node = root.querySelector(sel) as HTMLElement | null;
    if (!node) throw new Error(`Missing node: ${sel}`);

    const cssColorToRgb = (color: string): number[] | null => {
      if (!color || color === 'transparent') return null;
      if (/rgba?\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color)) return null;
      if (/\/\s*0\s*\)/.test(color)) return null;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
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

    const contrastRatio = (fg: number[], bg: number[]) => {
      const l1 = relLuminance(fg[0], fg[1], fg[2]);
      const l2 = relLuminance(bg[0], bg[1], bg[2]);
      const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (a + 0.05) / (b + 0.05);
    };

    const cs = getComputedStyle(node);
    let bg = cs.backgroundColor;
    if (cssColorToRgb(bg) === null && node.parentElement) {
      bg = getComputedStyle(node.parentElement).backgroundColor;
    }
    const fg = cssColorToRgb(cs.color);
    const bgRgb = cssColorToRgb(bg);
    if (!fg || !bgRgb) throw new Error(`Cannot resolve colours: fg=${cs.color} bg=${bg}`);
    return contrastRatio(fg, bgRgb);
  }, selector);
}
