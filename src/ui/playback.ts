import type { Scheduler } from '../core/scheduler';
import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';

let activeCancel: (() => void) | null = null;

/** Start from idle with a 3-2-1 countdown, or toggle play/pause mid-session. */
export function requestPlayback(
  store: Store<ReaderState>,
  scheduler: Scheduler,
): void {
  const state = store.get();
  if (state.status === 'countdown') return;
  if (state.status === 'idle') {
    cancelCountdown();
    activeCancel = runCountdown(store, () => {
      activeCancel = null;
      scheduler.play();
    });
    return;
  }
  scheduler.toggle();
}

export function cancelCountdown(): void {
  activeCancel?.();
  activeCancel = null;
}

function runCountdown(
  store: Store<ReaderState>,
  onComplete: () => void,
): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const steps = reduced ? [1] : [3, 2, 1];
  let stepIdx = 0;
  let timer: number | null = null;

  const cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (store.get().status === 'countdown') {
      store.set({ status: 'idle', countdown: null });
    }
  };

  const tick = () => {
    if (stepIdx >= steps.length) {
      store.set({ status: 'idle', countdown: null });
      onComplete();
      return;
    }
    store.set({ status: 'countdown', countdown: steps[stepIdx++] });
    timer = window.setTimeout(tick, reduced ? 200 : 1000);
  };

  tick();
  return cancel;
}
