import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { applyFont, applyFontSize, applyTheme } from '../theme/theme';
import { writePrefs } from '../utils/prefs';

/** Apply theme/font DOM updates and persist prefs when store appearance fields change. */
export function mountAppearanceSync(
  host: HTMLElement,
  store: Store<ReaderState>,
): () => void {
  return store.subscribe((next, prev) => {
    const patch: Parameters<typeof writePrefs>[0] = {};

    if (next.theme !== prev.theme) {
      applyTheme(host, next.theme);
      patch.theme = next.theme;
    }
    if (next.font !== prev.font) {
      applyFont(host, next.font);
      patch.font = next.font;
    }
    if (next.fontSize !== prev.fontSize) {
      applyFontSize(host, next.fontSize);
      patch.fontSize = next.fontSize;
    }

    if (Object.keys(patch).length > 0) writePrefs(patch);
  });
}
