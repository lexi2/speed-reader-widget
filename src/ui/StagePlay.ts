import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import type { Scheduler } from '../core/scheduler';
import { icons } from './icons';
import { setButtonLabel } from './button-label';
import { requestPlayback } from './playback';
import { t } from '../i18n';

/** Prominent play CTA centred in the stage while the reader is idle. */
export function mountStagePlay(
  root: ShadowRoot,
  store: Store<ReaderState>,
  scheduler: Scheduler,
): () => void {
  const stage = root.querySelector('.stage') as HTMLElement | null;
  const wrap = root.querySelector('[data-stage-play-wrap]') as HTMLElement | null;
  const btn = root.querySelector('[data-control="stage-play"]') as HTMLButtonElement | null;
  const label = root.querySelector('[data-stage-play-label]') as HTMLElement | null;
  if (!stage || !wrap || !btn || !label) return () => {};

  btn.innerHTML = icons.play;
  setButtonLabel(btn, t('control.play'));
  label.textContent = t('control.label.play');
  btn.setAttribute('aria-keyshortcuts', 'Space');

  const onClick = () => requestPlayback(store, scheduler);
  btn.addEventListener('click', onClick);

  const render = (state: ReaderState) => {
    const show = state.status === 'idle' && state.totalWords > 0;
    wrap.hidden = !show;
    stage.toggleAttribute('data-idle-cta', show);
  };

  render(store.get());
  const unsub = store.subscribe(render);

  return () => {
    unsub();
    btn.removeEventListener('click', onClick);
    stage.removeAttribute('data-idle-cta');
  };
}
