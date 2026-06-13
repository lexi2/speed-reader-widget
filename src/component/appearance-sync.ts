import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { applyFont, applyFontSize, applyTheme } from '../theme/theme';
import { writePrefs, type UserPrefs } from '../utils/prefs';

export function mountAppearanceSync(
  host: HTMLElement,
  store: Store<ReaderState>,
): () => void {
  return store.subscribe((next, prev) => {
    const patch: UserPrefs = {};

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
