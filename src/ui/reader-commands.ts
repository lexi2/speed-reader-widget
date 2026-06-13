import type { Scheduler } from '../core/scheduler';
import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { WPM_MAX, WPM_MIN, WPM_STEP } from '../core/types';
import { requestPlayback } from './playback';

export interface ReaderCommandContext {
  store: Store<ReaderState>;
  scheduler: Scheduler;
  onExit: () => void;
}

export type ReaderCommand =
  | 'togglePlayback'
  | 'wpmDown'
  | 'wpmUp'
  | 'seekBack'
  | 'seekForward'
  | 'restartAndPlay'
  | 'fullscreenToggle'
  | 'exit'
  | 'closeSettings'
  | 'closeExpanded';

export function dispatchReaderCommand(
  command: ReaderCommand,
  ctx: ReaderCommandContext,
): void {
  const { store, scheduler, onExit } = ctx;
  const state = store.get();

  switch (command) {
    case 'togglePlayback':
      requestPlayback(store, scheduler);
      break;
    case 'wpmDown':
      scheduler.setWpm(Math.max(WPM_MIN, state.wpm - WPM_STEP));
      break;
    case 'wpmUp':
      scheduler.setWpm(Math.min(WPM_MAX, state.wpm + WPM_STEP));
      break;
    case 'seekBack':
      scheduler.seek(state.idx - 10);
      break;
    case 'seekForward':
      scheduler.seek(state.idx + 10);
      break;
    case 'restartAndPlay':
      scheduler.restart();
      requestPlayback(store, scheduler);
      break;
    case 'fullscreenToggle':
      store.set({ expanded: !state.expanded });
      break;
    case 'exit':
      onExit();
      break;
    case 'closeSettings':
      store.set({ settingsOpen: false });
      break;
    case 'closeExpanded':
      store.set({ expanded: false });
      break;
    default: {
      const _exhaustive: never = command;
      return _exhaustive;
    }
  }
}
