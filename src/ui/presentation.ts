import type { LaunchMode } from '../core/types';
import { isMobileViewport } from '../utils/mobile';
import { needsPortal, PORTAL_ID, syncReaderMount } from './portal';

const presentationSync = new WeakMap<HTMLElement, () => void>();

export function syncPresentation(host: HTMLElement): void {
  presentationSync.get(host)?.();
}

function isModalPresentation(host: HTMLElement): boolean {
  const mode = (host.getAttribute('data-mode') as LaunchMode | null) ?? 'inline';
  return needsPortal(mode);
}

function getFocusables(root: ShadowRoot): HTMLElement[] {
  const sel = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel));
}

export function mountPresentation(
  host: HTMLElement,
  root: ShadowRoot,
  onExit: () => void,
): () => void {
  const backdrop = root.querySelector('.backdrop') as HTMLElement | null;
  if (!backdrop) return () => {};

  let modalActive = false;
  let focusRestoreTarget: HTMLElement | null = null;
  let inertSiblings: Array<{ el: HTMLElement; prev: boolean }> = [];

  const clearInert = () => {
    for (const { el, prev } of inertSiblings) el.inert = prev;
    inertSiblings = [];
  };

  const applyInert = () => {
    clearInert();
    for (const child of Array.from(document.body.children)) {
      if (child.id === PORTAL_ID) continue;
      const el = child as HTMLElement;
      inertSiblings.push({ el, prev: el.inert });
      el.inert = true;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusables = getFocusables(root);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = root.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const enterModal = () => {
    if (modalActive) return;
    modalActive = true;
    focusRestoreTarget = document.activeElement as HTMLElement | null;
    applyInert();
    host.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => getFocusables(root)[0]?.focus());
  };

  const leaveModal = () => {
    if (!modalActive) return;
    modalActive = false;
    clearInert();
    host.removeEventListener('keydown', onKeyDown);
  };

  const sync = () => {
    syncReaderMount(host);
    const modal = isModalPresentation(host);

    host.toggleAttribute('data-mobile-immersive', modal && isMobileViewport());
    backdrop.hidden = !modal;

    if (modal) enterModal();
    else leaveModal();
  };

  const onBackdropClick = () => {
    if (isModalPresentation(host)) onExit();
  };

  backdrop.addEventListener('click', onBackdropClick);
  presentationSync.set(host, sync);
  sync();

  const mqNarrow = window.matchMedia('(max-width: 480px)');
  const mqCoarse = window.matchMedia('(pointer: coarse)');
  mqNarrow.addEventListener('change', sync);
  mqCoarse.addEventListener('change', sync);
  window.addEventListener('resize', sync);

  return () => {
    presentationSync.delete(host);
    mqNarrow.removeEventListener('change', sync);
    mqCoarse.removeEventListener('change', sync);
    window.removeEventListener('resize', sync);
    backdrop.removeEventListener('click', onBackdropClick);
    leaveModal();
    host.removeAttribute('data-mobile-immersive');
    backdrop.hidden = true;
    focusRestoreTarget?.focus?.();
  };
}
