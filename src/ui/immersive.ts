import { isMobileViewport } from '../utils/mobile';

/** Mobile: centered overlay card with backdrop (inline mode). Overlay mode uses mountOverlay. */
export function mountImmersive(
  host: HTMLElement,
  root: ShadowRoot,
  onExit: () => void,
): () => void {
  const backdrop = root.querySelector('.backdrop') as HTMLElement | null;
  const isOverlayMode = () => host.getAttribute('data-mode') === 'overlay';

  const onBackdropClick = () => {
    if (!isMobileViewport() || isOverlayMode()) return;
    onExit();
  };

  if (backdrop) backdrop.addEventListener('click', onBackdropClick);

  const update = () => {
    const mobile = isMobileViewport();
    host.toggleAttribute('data-mobile-immersive', mobile);
    if (backdrop && !isOverlayMode()) {
      backdrop.hidden = !mobile;
    }
  };

  update();
  const mqNarrow = window.matchMedia('(max-width: 480px)');
  const mqCoarse = window.matchMedia('(pointer: coarse)');
  mqNarrow.addEventListener('change', update);
  mqCoarse.addEventListener('change', update);
  window.addEventListener('resize', update);

  return () => {
    mqNarrow.removeEventListener('change', update);
    mqCoarse.removeEventListener('change', update);
    window.removeEventListener('resize', update);
    backdrop?.removeEventListener('click', onBackdropClick);
    host.removeAttribute('data-mobile-immersive');
    if (backdrop && !isOverlayMode()) backdrop.hidden = true;
  };
}
