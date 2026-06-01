import { type CmsAdapter, countWords, defaultInsertion, MIN_ARTICLE_WORDS } from './adapter.types';

/**
 * Substack adapter — matches before the WordPress adapter because both use
 * `body.single-post`. Differentiates via substackcdn.com asset links plus
 * Substack-specific container classes.
 */
export const substackAdapter: CmsAdapter = {
  name: 'substack',

  matches(): boolean {
    if (document.querySelector('link[href*="substackcdn.com"]')) return true;
    if (document.querySelector('.single-post-container')) return true;
    if (document.querySelector('.available-content')) return true;
    return false;
  },

  findArticle(): Element | null {
    const isSinglePost =
      Boolean(document.querySelector('.single-post-container')) ||
      document.body.classList.contains('single-post');
    if (!isSinglePost) return null;

    const candidates = [
      '.available-content',
      '.single-post-container .body.markup',
      '.single-post-container article .body',
      'article .available-content',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && countWords(el) >= MIN_ARTICLE_WORDS) return el;
    }
    return null;
  },

  insertionPoint: defaultInsertion,
};
