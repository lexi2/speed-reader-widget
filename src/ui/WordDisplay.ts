import { findOrpIndex } from '../core/parser';
import { secondsElapsed, secondsRemaining, type Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { formatTime } from '../utils/format-time';

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

  if (!pre || !orp || !post) return () => {};

  const render = (state: ReaderState) => {
    const word = state.words[state.idx] ?? '';

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
      const labels: Record<ReaderState['status'], string> = {
        idle: 'Ready',
        playing: 'Playing',
        paused: 'Paused',
        done: 'Finished',
      };
      statusMeta.textContent = labels[state.status];
    }
  };

  render(store.get());
  return store.subscribe(render);
}
