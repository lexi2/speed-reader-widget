import type { ParsedText } from './types';
import { reportError } from '../observability/errors';

const STRIP_TAGS = new Set([
  // Programmatic / non-prose
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SLOT',
  // Code blocks — not meant to be read at WPM
  'CODE', 'PRE', 'KBD', 'SAMP', 'VAR',
  // Page chrome
  'NAV', 'ASIDE', 'FOOTER', 'HEADER',
  // Captions / media
  'FIGCAPTION', 'PICTURE', 'VIDEO', 'AUDIO', 'CANVAS',
  // Embedded foreign content
  'IFRAME', 'OBJECT', 'EMBED',
  // Forms / interaction
  'FORM', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'DIALOG',
]);

// Anything with these attributes is excluded from the article text.
// Stripping is structural (no innerHTML / no innerText readback) so we can
// safely walk the cloned tree without triggering any custom-element upgrades.
const HIDDEN_ATTR_SELECTOR =
  '[hidden], [aria-hidden="true"], [role="presentation"], [role="none"]';

// Elements whose end-of-content marks a word boundary. Without this,
// `<p>One</p><p>Two</p>` produces textContent="OneTwo" (no space), and
// `<p>review.<br>Concerned</p>` produces "review.Concerned". We append a
// single space inside each of these before reading textContent so adjacent
// chunks can't fuse.
const BLOCK_BOUNDARY_TAGS =
  'p, div, section, article, main, aside, header, footer, ' +
  'h1, h2, h3, h4, h5, h6, li, ul, ol, dl, dt, dd, ' +
  'blockquote, tr, td, th, figure, figcaption, hr';

export function parse(source: string | Element): ParsedText {
  try {
    const raw = typeof source === 'string' ? source : extractText(source);
    const words = tokenize(raw);
    return { words, wordCount: words.filter(w => w.length > 0).length };
  } catch (err) {
    reportError(err, 'parser');
    return { words: [], wordCount: 0 };
  }
}

/**
 * Pulls plain prose from an article element. Strips:
 *   1. Programmatic / non-prose / chrome tags (STRIP_TAGS)
 *   2. ALL custom elements — any tag name containing a hyphen.
 *      Custom elements are black boxes: ad slots, embeds, third-party widgets.
 *      Their textContent often leaks the loader script source, internal IDs,
 *      or other garbage that the host page can't predict. Stripping them
 *      structurally is the only safe default.
 *   3. Hidden / presentational subtrees (HIDDEN_ATTR_SELECTOR)
 *
 * This is allowlist-equivalent for unknown territory while still letting
 * well-formed prose containers (article, section, div, p, h1-h6, etc.) pass
 * through.
 */
function extractText(root: Element): string {
  const clone = root.cloneNode(true) as Element;

  // 1. Known non-prose tags
  for (const tag of STRIP_TAGS) {
    for (const el of Array.from(clone.getElementsByTagName(tag))) {
      el.remove();
    }
  }

  // 2. Custom elements (any tag with a hyphen)
  for (const el of Array.from(clone.querySelectorAll('*'))) {
    if (el.tagName.includes('-')) el.remove();
  }

  // 3. Hidden / presentational
  for (const el of Array.from(clone.querySelectorAll(HIDDEN_ATTR_SELECTOR))) {
    el.remove();
  }

  // 4. Inject word-boundary whitespace at block edges and after every <br>
  //    so textContent doesn't fuse adjacent chunks ("review.Concerned").
  const doc = clone.ownerDocument ?? document;
  for (const br of Array.from(clone.querySelectorAll('br'))) {
    br.parentNode?.insertBefore(doc.createTextNode(' '), br.nextSibling);
  }
  for (const block of Array.from(clone.querySelectorAll(BLOCK_BOUNDARY_TAGS))) {
    block.appendChild(doc.createTextNode(' '));
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
