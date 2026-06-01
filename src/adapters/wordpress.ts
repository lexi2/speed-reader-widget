import { type CmsAdapter, countWords, defaultInsertion, MIN_ARTICLE_WORDS } from './adapter.types';

export const wordpressAdapter: CmsAdapter = {
  name: 'wordpress',

  matches(): boolean {
    const meta = document.querySelector('meta[name="generator"]');
    if (meta?.getAttribute('content')?.startsWith('WordPress')) return true;
    const cls = document.body.classList;
    return cls.contains('single-post') || cls.contains('single') || cls.contains('wp-singular');
  },

  findArticle(): Element | null {
    const cls = document.body.classList;
    const isSinglePost =
      cls.contains('single-post') || cls.contains('single') || cls.contains('wp-singular');
    if (!isSinglePost) return null;

    const candidates = [
      '.entry-content',
      'article.post .post-content',
      'article.type-post .entry-content',
      'main article',
      'article',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && countWords(el) >= MIN_ARTICLE_WORDS) return el;
    }
    return null;
  },

  insertionPoint: defaultInsertion,
};
