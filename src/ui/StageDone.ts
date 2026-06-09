import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import type { Scheduler } from '../core/scheduler';
import { icons } from './icons';
import { setButtonLabel } from './button-label';
import { requestPlayback } from './playback';
import { t } from '../i18n';

/** Play-again CTA centred in the stage when reading is finished. */
export function mountStageDone(
  root: ShadowRoot,
  store: Store<ReaderState>,
  scheduler: Scheduler,
): () => void {
  const stage = root.querySelector('.stage') as HTMLElement | null;
  const wrap = root.querySelector('[data-stage-done-wrap]') as HTMLElement | null;
  const btn = root.querySelector('[data-control="stage-done"]') as HTMLButtonElement | null;
  const label = root.querySelector('[data-stage-done-label]') as HTMLElement | null;
  if (!stage || !wrap || !btn || !label) return () => {};

  btn.innerHTML = icons.play;
  setButtonLabel(btn, t('done.again'));
  label.textContent = t('done.again');

  const onClick = () => {
    scheduler.restart();
    requestPlayback(store, scheduler);
  };
  btn.addEventListener('click', onClick);

  const render = (state: ReaderState) => {
    const show = state.status === 'done';
    wrap.hidden = !show;
    stage.toggleAttribute('data-done-cta', show);
  };

  render(store.get());
  const unsub = store.subscribe(render);

  return () => {
    unsub();
    btn.removeEventListener('click', onClick);
    stage.removeAttribute('data-done-cta');
  };
}
