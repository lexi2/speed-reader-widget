import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { t } from '../i18n';

/**
 * Announces state changes through aria-live without flooding screen readers
 * with every word. The visible word display is aria-hidden; this region
 * announces only meaningful transitions and sentence completions.
 */
export function mountLiveRegion(root: ShadowRoot, store: Store<ReaderState>): () => void {
  const region = root.querySelector('[data-live]') as HTMLElement | null;
  if (!region) return () => {};

  let lastSentenceFlush = 0;
  let sentenceBuffer: string[] = [];

  const announce = (msg: string) => {
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = msg; });
  };

  const unsub = store.subscribe((next, prev) => {
    if (next.status !== prev.status) {
      if (next.status === 'paused') announce(t('state.paused'));
      else if (next.status === 'done') {
        if (sentenceBuffer.length) announce(sentenceBuffer.join(' '));
        else announce(t('state.done'));
        sentenceBuffer = [];
      }
    }

    if (next.wpm !== prev.wpm) {
      announce(t('state.wpm', { n: next.wpm }));
    }

    if (next.idx !== prev.idx && next.status === 'playing') {
      const word = next.words[next.idx];
      if (!word) return;
      sentenceBuffer.push(word);
      // Flush sentence at terminal punctuation, but no more than once every 2s
      const last = word.charAt(word.length - 1);
      if ((last === '.' || last === '!' || last === '?') && Date.now() - lastSentenceFlush > 2000) {
        lastSentenceFlush = Date.now();
        announce(sentenceBuffer.join(' '));
        sentenceBuffer = [];
      }
      // Cap buffer so we never hold the whole article
      if (sentenceBuffer.length > 40) sentenceBuffer = sentenceBuffer.slice(-40);
    }
  });

  return () => { unsub(); region.textContent = ''; };
}
