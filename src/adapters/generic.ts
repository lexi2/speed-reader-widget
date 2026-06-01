import { type CmsAdapter, countWords, defaultInsertion, MIN_ARTICLE_WORDS } from './adapter.types';

export const genericAdapter: CmsAdapter = {
  name: 'generic',

  matches(): boolean {
    return true;
  },

  findArticle(): Element | null {
    const candidates = [
      '[itemtype*="schema.org/Article"] [itemprop="articleBody"]',
      'main article',
      'article',
      '[role="main"] article',
      '[role="main"]',
      'main',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && countWords(el) >= MIN_ARTICLE_WORDS) return el;
    }
    return null;
  },

  insertionPoint: defaultInsertion,
};
