import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { isMobileViewport } from '../utils/mobile';

const HIDE_DELAY_MS = 3000;

export function mountToolbarVisibility(
  host: HTMLElement,
  root: ShadowRoot,
  store: Store<ReaderState>,
): () => void {
  const toolbar = root.querySelector('.toolbar-bottom') as HTMLElement | null;
  const stage = root.querySelector('.stage') as HTMLElement | null;
  if (!toolbar || !stage) return () => {};

  let hideTimer: number | null = null;
  let userToggledHidden = false;

  const clearHideTimer = () => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const setHidden = (hidden: boolean) => {
    toolbar.toggleAttribute('data-toolbar-hidden', hidden);
    stage.toggleAttribute('data-tap-hint', hidden);
    host.toggleAttribute('data-toolbar-compact', hidden && isMobileViewport());
  };

  const scheduleAutoHide = () => {
    clearHideTimer();
    if (!isMobileViewport()) return;

    const state = store.get();
    if (state.alwaysShowToolbar || state.settingsOpen || state.status !== 'playing') return;
    if (userToggledHidden) return;

    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      const current = store.get();
      if (current.status === 'playing' && !current.alwaysShowToolbar && !current.settingsOpen) {
        setHidden(true);
      }
    }, HIDE_DELAY_MS);
  };

  const showToolbar = () => {
    userToggledHidden = false;
    setHidden(false);
    scheduleAutoHide();
  };

  const onStageTap = (e: Event) => {
    if (!isMobileViewport()) return;
    const state = store.get();
    if (state.alwaysShowToolbar || state.settingsOpen) return;
    if (state.status !== 'playing' && state.status !== 'paused') return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [data-settings-panel]')) return;

    if (toolbar.hasAttribute('data-toolbar-hidden')) {
      showToolbar();
    } else {
      userToggledHidden = true;
      clearHideTimer();
      setHidden(true);
    }
  };

  const onToolbarInteract = () => {
    showToolbar();
  };

  const render = (state: ReaderState, prev: ReaderState) => {
    if (!isMobileViewport()) {
      clearHideTimer();
      userToggledHidden = false;
      setHidden(false);
      return;
    }

    if (state.alwaysShowToolbar || state.settingsOpen) {
      clearHideTimer();
      userToggledHidden = false;
      setHidden(false);
      return;
    }

    if (state.status !== 'playing' && state.status !== 'paused') {
      clearHideTimer();
      userToggledHidden = false;
      setHidden(false);
      return;
    }

    if (prev.status !== 'playing' && state.status === 'playing') {
      showToolbar();
      return;
    }

    if (prev.alwaysShowToolbar && !state.alwaysShowToolbar && state.status === 'playing') {
      scheduleAutoHide();
    }
  };

  stage.addEventListener('click', onStageTap);
  toolbar.addEventListener('pointerdown', onToolbarInteract);

  render(store.get(), store.get());
  const unsub = store.subscribe(render);

  return () => {
    unsub();
    clearHideTimer();
    stage.removeEventListener('click', onStageTap);
    toolbar.removeEventListener('pointerdown', onToolbarInteract);
    toolbar.removeAttribute('data-toolbar-hidden');
    stage.removeAttribute('data-tap-hint');
    host.removeAttribute('data-toolbar-compact');
  };
}
