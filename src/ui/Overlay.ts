/**
 * Overlay mode: when mode="overlay", wrap the reader in a modal pattern.
 * - Show backdrop
 * - Focus-trap inside the reader
 * - Esc closes
 * - Restore focus to the previously focused element on close
 */
export function mountOverlay(
  host: HTMLElement,
  root: ShadowRoot,
  onExit: () => void,
): () => void {
  const backdrop = root.querySelector('.backdrop') as HTMLElement | null;
  if (!backdrop) return () => {};
  backdrop.hidden = false;

  const previouslyFocused = document.activeElement as HTMLElement | null;

  const onBackdropClick = () => onExit();
  backdrop.addEventListener('click', onBackdropClick);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
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
    }
  };
  host.addEventListener('keydown', onKeyDown);

  // Set inert on siblings to prevent screen reader / focus reaching them
  const siblings: Array<{ el: Element; prev: boolean }> = [];
  for (const child of Array.from(document.body.children)) {
    if (child === host || child.contains(host)) continue;
    const el = child as HTMLElement;
    siblings.push({ el, prev: el.inert });
    el.inert = true;
  }

  // Move focus into the dialog
  requestAnimationFrame(() => {
    const focusables = getFocusables(root);
    focusables[0]?.focus();
  });

  return () => {
    backdrop.removeEventListener('click', onBackdropClick);
    host.removeEventListener('keydown', onKeyDown);
    for (const { el, prev } of siblings) (el as HTMLElement).inert = prev;
    previouslyFocused?.focus?.();
  };
}

function getFocusables(root: ShadowRoot): HTMLElement[] {
  const sel = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel));
}
