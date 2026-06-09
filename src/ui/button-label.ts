/** Sets the accessible name for icon-only buttons. */
export function setButtonLabel(btn: HTMLElement, label: string): void {
  btn.setAttribute('aria-label', label);
}
