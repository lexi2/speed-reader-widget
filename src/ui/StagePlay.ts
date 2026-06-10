import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { t } from '../i18n';

/** Idle hint in the stage — play lives in the toolbar to avoid duplicate CTAs. */
export function mountStagePlay(
  root: ShadowRoot,
  store: Store<ReaderState>,
): () => void {
  const stage = root.querySelector('.stage') as HTMLElement | null;
  const hint = root.querySelector('[data-stage-idle-hint]') as HTMLElement | null;
  if (!stage || !hint) return () => {};

  const render = (state: ReaderState) => {
    const show = state.status === 'idle' && state.totalWords > 0;
    hint.hidden = !show;
    hint.textContent = t('stage.idleHint');
    stage.toggleAttribute('data-idle-cta', show);
  };

  render(store.get());
  const unsub = store.subscribe(render);

  return () => {
    unsub();
    stage.removeAttribute('data-idle-cta');
  };
}
