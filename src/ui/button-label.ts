const HINT_CLASS = 'btn--hint';

/** Sets the accessible name for icon-only buttons. */
export function setButtonLabel(btn: HTMLElement, label: string, hoverHint = false): void {
  btn.setAttribute('aria-label', label);
  if (hoverHint) setHoverHint(btn, label);
  else btn.classList.remove(HINT_CLASS);
}

/** Desktop hover tooltip via CSS (::after). Does not override visible button text for SR. */
export function setHoverHint(btn: HTMLElement, hint: string): void {
  btn.dataset.hint = hint;
  btn.classList.add(HINT_CLASS);
  btn.removeAttribute('title');
}
