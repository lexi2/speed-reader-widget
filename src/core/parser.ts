import type { ParsedText } from './types';

const STRIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE',
  'NAV', 'ASIDE', 'FOOTER', 'HEADER',
  'FIGURE', 'FIGCAPTION', 'IFRAME', 'OBJECT', 'EMBED',
  'FORM', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA',
]);

export function parse(source: string | Element): ParsedText {
  const raw = typeof source === 'string' ? source : extractText(source);
  const words = tokenize(raw);
  return { words, wordCount: words.filter(w => w.length > 0).length };
}

function extractText(root: Element): string {
  const clone = root.cloneNode(true) as Element;
  for (const tag of STRIP_TAGS) {
    for (const el of Array.from(clone.getElementsByTagName(tag))) {
      el.remove();
    }
  }
  return clone.textContent ?? '';
}

function tokenize(text: string): string[] {
  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

export function findOrpIndex(word: string): number {
  const stripped = word.replace(/[^\p{L}\p{N}]/gu, '');
  const len = stripped.length;
  if (len <= 1) return 0;
  if (len <= 3) return 1;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

export function tickDelayMs(word: string, baseMs: number): number {
  const last = word.charAt(word.length - 1);
  if (last === '.' || last === '!' || last === '?') return baseMs * 2.5;
  if (last === ',' || last === ';' || last === ':') return baseMs * 1.6;
  if (word.length > 8) return baseMs * 1.3;
  return baseMs;
}
