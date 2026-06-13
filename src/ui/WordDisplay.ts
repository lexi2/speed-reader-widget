import { findOrpIndex } from '../core/parser';
import { secondsElapsed, secondsRemaining, subscribeFields, type Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { formatTime } from '../utils/format-time';
import { t, type I18nKey } from '../i18n';

export function mountWordDisplay(root: ShadowRoot, store: Store<ReaderState>): () => void {
  const pre = root.querySelector('.word .pre') as HTMLElement | null;
  const orp = root.querySelector('.word .orp') as HTMLElement | null;
  const post = root.querySelector('.word .post') as HTMLElement | null;
  const bar = root.querySelector('[data-progress-bar]') as HTMLElement | null;
  const progress = root.querySelector('.progress') as HTMLElement | null;
  const wpmMeta = root.querySelector('[data-meta="wpm"]') as HTMLElement | null;
  const statusMeta = root.querySelector('[data-meta="status"]') as HTMLElement | null;
  const timeElapsedMeta = root.querySelector('[data-meta="time-elapsed"]') as HTMLElement | null;
  const timeRemainingMeta = root.querySelector('[data-meta="time-remaining"]') as HTMLElement | null;
  const countdownEl = root.querySelector('[data-countdown]') as HTMLElement | null;
  const wordEl = root.querySelector('.word') as HTMLElement | null;

  if (!pre || !orp || !post) return () => {};

  const render = (state: ReaderState) => {
    const showWords = state.status === 'playing' || state.status === 'paused';

    if (countdownEl && wordEl) {
      if (state.status === 'countdown' && state.countdown !== null) {
        countdownEl.hidden = false;
        countdownEl.textContent = String(state.countdown);
        wordEl.hidden = true;
      } else {
        countdownEl.hidden = true;
        countdownEl.textContent = '';
        wordEl.hidden = !showWords;
      }
    }

    const word = showWords ? (state.words[state.idx] ?? '') : '';

    if (word) {
      const orpIdx = findOrpIndex(word);
      pre.textContent = word.slice(0, orpIdx);
      orp.textContent = word.charAt(orpIdx);
      post.textContent = word.slice(orpIdx + 1);
    } else {
      pre.textContent = orp.textContent = post.textContent = '';
    }

    if (bar && progress) {
      const pct = state.totalWords > 0
        ? Math.min(100, Math.round(((state.idx + 1) / state.totalWords) * 100))
        : 0;
      bar.style.width = `${pct}%`;
      progress.setAttribute('aria-valuenow', String(pct));
    }
    if (wpmMeta) wpmMeta.textContent = `${state.wpm} wpm`;
    if (timeElapsedMeta) timeElapsedMeta.textContent = formatTime(secondsElapsed(state));
    if (timeRemainingMeta) timeRemainingMeta.textContent = formatTime(secondsRemaining(state));
    if (statusMeta) {
      const statusKeys: Record<ReaderState['status'], I18nKey> = {
        idle: 'state.status.idle',
        countdown: 'state.status.countdown',
        playing: 'state.status.playing',
        paused: 'state.status.paused',
        done: 'state.status.done',
      };
      statusMeta.textContent = t(statusKeys[state.status]);
    }
  };

  render(store.get());
  return subscribeFields(
    store,
    ['idx', 'status', 'countdown', 'wpm', 'totalWords', 'words'],
    render,
  );
}
