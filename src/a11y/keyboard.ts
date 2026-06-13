import type { Scheduler } from '../core/scheduler';
import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { dispatchReaderCommand } from '../ui/reader-commands';

export function mountKeyboard(
  host: HTMLElement,
  store: Store<ReaderState>,
  scheduler: Scheduler,
  onExit: () => void,
): () => void {
  if (!host.hasAttribute('tabindex')) host.setAttribute('tabindex', '0');

  const ctx = { store, scheduler, onExit };

  const handler = (e: KeyboardEvent) => {
    if (isTextInputTarget(e.target)) return;

    switch (e.key) {
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        dispatchReaderCommand('togglePlayback', ctx);
        break;
      case 'ArrowRight':
        e.preventDefault();
        dispatchReaderCommand(e.shiftKey ? 'seekForward' : 'wpmUp', ctx);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        dispatchReaderCommand(e.shiftKey ? 'seekBack' : 'wpmDown', ctx);
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        dispatchReaderCommand('restartAndPlay', ctx);
        break;
      case 'Escape':
        e.preventDefault();
        if (store.get().settingsOpen) {
          dispatchReaderCommand('closeSettings', ctx);
        } else if (store.get().expanded) {
          dispatchReaderCommand('closeExpanded', ctx);
        } else {
          dispatchReaderCommand('exit', ctx);
        }
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
