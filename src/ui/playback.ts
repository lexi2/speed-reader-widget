import type { Scheduler } from '../core/scheduler';
import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';

let activeCancel: (() => void) | null = null;

const STEP_MS = 800;

/** Start from idle with a 3-2-1 countdown, or toggle play/pause mid-session. */
export function requestPlayback(
  store: Store<ReaderState>,
  scheduler: Scheduler,
): void {
  const state = store.get();
  if (state.settingsOpen || state.status === 'countdown') return;
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
  let stepStart = 0;
  let rafId: number | null = null;
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    if (store.get().status === 'countdown') {
      store.set({ status: 'idle', countdown: null });
    }
  };

  const loop = (now: number) => {
    if (cancelled) return;
    if (stepIdx >= steps.length) {
      store.set({ status: 'idle', countdown: null });
      onComplete();
      return;
    }
    if (stepStart === 0) {
      stepStart = now;
      store.set({ status: 'countdown', countdown: steps[stepIdx] });
    }
    if (now - stepStart >= STEP_MS) {
      stepIdx++;
      stepStart = 0;
    }
    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);
  return cancel;
}
