const AA_BODY = 4.5;

function relLuminance(r: number, g: number, b: number): number {
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

export function contrastRatio(rgb1: number[], rgb2: number[]): number {
  const l1 = relLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = relLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

export function parseHexColor(hex: string): number[] | null {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
  const expanded = raw.length === 3
    ? raw.split('').map(c => c + c).join('')
    : raw;
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}

/** True when white text on the accent would fail WCAG AA (4.5:1). */
export function accentNeedsDarkText(accentHex: string): boolean {
  const rgb = parseHexColor(accentHex);
  if (!rgb) return false;
  return contrastRatio(rgb, [255, 255, 255]) < AA_BODY;
}
