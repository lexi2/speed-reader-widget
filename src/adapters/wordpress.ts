import { type CmsAdapter, countWords, defaultInsertion, MIN_ARTICLE_WORDS } from './adapter.types';

/**
 * Recognises both classic (PHP theme + classic editor) and block (FSE theme +
 * Gutenberg) WordPress installs, plus the common third-party themes
 * (Astra, GeneratePress, OceanWP, Kadence) and the bundled Twenty Twenty-N
 * block themes.
 */
export const wordpressAdapter: CmsAdapter = {
  name: 'wordpress',

  matches(): boolean {
    const meta = document.querySelector('meta[name="generator"]');
    if (meta?.getAttribute('content')?.startsWith('WordPress')) return true;

    const cls = document.body.classList;
    if (
      cls.contains('single-post') ||
      cls.contains('single') ||
      cls.contains('wp-singular')
    ) return true;

    // Block themes don't always tag the body with `single-post`. Treat any
    // page that exposes the canonical Gutenberg post-content block as WP too.
    if (document.querySelector('.wp-block-post-content')) return true;

    return false;
  },

  findArticle(): Element | null {
    const cls = document.body.classList;
    const isSinglePost =
      cls.contains('single-post') ||
      cls.contains('single') ||
      cls.contains('wp-singular') ||
      // Block-theme single-post pages render exactly one post-content block
      document.querySelectorAll('.wp-block-post-content').length === 1;

    if (!isSinglePost) return null;
    // Archive / category pages can render multiple post-content blocks via a
    // Query Loop; refuse those.
    if (document.querySelectorAll('.wp-block-post-content').length > 1) return null;

    const candidates = [
      // Block editor / FSE themes
      '.wp-block-post-content',
      // Classic editor
      '.entry-content',
      // Common premium-theme wrappers
      'article.post .entry-content',
      'article.type-post .entry-content',
      // OceanWP, Kadence-style
      '#main article .entry-content',
      // Last-ditch fallbacks
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
