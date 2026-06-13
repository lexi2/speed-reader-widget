import type { Scheduler } from '../core/scheduler';
import { subscribeFields, type Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { mountKeyboard } from '../a11y/keyboard';
import { mountLiveRegion } from '../a11y/live-region';
import { mountControls } from '../ui/Controls';
import { mountPresentation } from '../ui/presentation';
import { mountSettingsPanel } from '../ui/SettingsPanel';
import { mountStageDone } from '../ui/StageDone';
import { mountStagePlay } from '../ui/StagePlay';
import { mountWordDisplay } from '../ui/WordDisplay';

export interface ReaderChromeContext {
  host: HTMLElement;
  root: ShadowRoot;
  store: Store<ReaderState>;
  scheduler: Scheduler;
  onExit: () => void;
  renderStates: () => void;
}

export function mountReaderChrome(ctx: ReaderChromeContext): () => void {
  const { host, root, store, scheduler, onExit, renderStates } = ctx;
  const teardown: Array<() => void> = [];

  teardown.push(mountPresentation(host, root, onExit));
  teardown.push(mountWordDisplay(root, store));
  teardown.push(mountStagePlay(root, store));
  teardown.push(mountStageDone(root, store, scheduler));
  teardown.push(mountControls(host, root, store, scheduler, onExit));
  teardown.push(mountSettingsPanel(host, root, store, scheduler));
  teardown.push(mountLiveRegion(root, store));
  teardown.push(mountKeyboard(host, store, scheduler, onExit));
  teardown.push(subscribeFields(store, ['totalWords'], renderStates));

  return () => {
    for (const fn of teardown) fn();
  };
}
