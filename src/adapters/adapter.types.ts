export interface CmsAdapter {
  /** Human-readable adapter name; useful for debugging */
  name: string;
  /** Does this adapter apply to the current page? */
  matches(): boolean;
  /** Locate the article body element on this page, or null if not a single-post page */
  findArticle(): Element | null;
  /** Where to insert the trigger button (default: above the article body) */
  insertionPoint?(article: Element): { parent: Element; before: Element | null };
}

export function defaultInsertion(article: Element): { parent: Element; before: Element | null } {
  return { parent: article, before: article.firstChild as Element | null };
}

export function countWords(el: Element): number {
  const text = (el.textContent ?? '').trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export const MIN_ARTICLE_WORDS = 60;
