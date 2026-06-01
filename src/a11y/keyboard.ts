import type { Scheduler } from '../core/scheduler';
import type { Store } from '../core/state';
import { WPM_MAX, WPM_MIN, WPM_STEP } from '../core/types';
import type { ReaderState } from '../core/types';

export function mountKeyboard(
  host: HTMLElement,
  store: Store<ReaderState>,
  scheduler: Scheduler,
  onExit: () => void,
): () => void {
  // Make the host focusable so keyboard handlers fire when nothing else holds focus.
  if (!host.hasAttribute('tabindex')) host.setAttribute('tabindex', '0');

  const handler = (e: KeyboardEvent) => {
    if (isTextInputTarget(e.target)) return;

    switch (e.key) {
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        scheduler.toggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        scheduler.setWpm(Math.min(WPM_MAX, store.get().wpm + WPM_STEP));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        scheduler.setWpm(Math.max(WPM_MIN, store.get().wpm - WPM_STEP));
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        scheduler.restart();
        scheduler.play();
        break;
      case 'Escape':
        e.preventDefault();
        onExit();
        break;
    }
  };

  host.addEventListener('keydown', handler);
  return () => host.removeEventListener('keydown', handler);
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}
