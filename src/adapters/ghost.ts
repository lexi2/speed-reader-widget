import { type CmsAdapter, countWords, defaultInsertion, MIN_ARTICLE_WORDS } from './adapter.types';

export const ghostAdapter: CmsAdapter = {
  name: 'ghost',

  matches(): boolean {
    const meta = document.querySelector('meta[name="generator"]');
    if (meta?.getAttribute('content')?.startsWith('Ghost')) return true;
    if (document.body.classList.contains('post-template')) return true;
    if (document.body.classList.contains('gh-canvas')) return true;
    return false;
  },

  findArticle(): Element | null {
    // Ghost reliably uses body.post-template on single-post pages. Without it,
    // we treat the page as a homepage / archive and bail. (Don't rely on the
    // mere presence of <article>, which Ghost also renders on index pages.)
    const isSinglePost =
      document.body.classList.contains('post-template') ||
      document.body.classList.contains('gh-canvas');
    if (!isSinglePost) return null;

    const candidates = [
      '.gh-content',
      '.post-content',
      'article.gh-article',
      'article.post',
      'main article',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && countWords(el) >= MIN_ARTICLE_WORDS) return el;
    }
    return null;
  },

  insertionPoint: defaultInsertion,
};

