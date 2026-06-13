import type { LaunchMode } from '../core/types';
import { isMobileViewport } from '../utils/mobile';

export const PORTAL_ID = 'rsvp-portal-root';
const DEFAULT_Z_INDEX = '2147483647';

const anchors = new WeakMap<HTMLElement, HTMLElement>();

export function setReaderAnchor(reader: HTMLElement, anchor: HTMLElement): void {
  anchors.set(reader, anchor);
}

/** Dedicated body mount point so the reader escapes article stacking contexts. */
export function getPortalRoot(): HTMLElement {
  let root = document.getElementById(PORTAL_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = PORTAL_ID;
    root.setAttribute('data-rsvp-portal', '');
    document.body.appendChild(root);
  }
  return root;
}

function syncPortalZIndex(portal: HTMLElement, reader: HTMLElement): void {
  portal.style.position = 'relative';
  const z = getComputedStyle(reader).getPropertyValue('--rsvp-z-index').trim() || DEFAULT_Z_INDEX;
  portal.style.zIndex = z;
}

export function mountReaderToBody(reader: HTMLElement): void {
  const portal = getPortalRoot();
  portal.appendChild(reader);
  syncPortalZIndex(portal, reader);
}

export function mountReaderInline(reader: HTMLElement, anchor: HTMLElement): void {
  setReaderAnchor(reader, anchor);
  anchor.insertAdjacentElement('afterend', reader);
}

export function restoreInlineIfAnchored(reader: HTMLElement): void {
  const anchor = anchors.get(reader);
  if (!anchor?.isConnected) return;
  if (reader.parentElement?.id === PORTAL_ID) {
    anchor.insertAdjacentElement('afterend', reader);
    clearPortalIfEmpty();
  }
}

export function clearPortalIfEmpty(): void {
  const portal = document.getElementById(PORTAL_ID);
  if (portal && portal.childElementCount === 0) {
    portal.style.removeProperty('position');
    portal.style.removeProperty('z-index');
  }
}

export function needsPortal(mode: LaunchMode): boolean {
  return mode === 'overlay' || isMobileViewport();
}

export function shouldUsePortal(host: HTMLElement): boolean {
  const mode = (host.getAttribute('data-mode') as LaunchMode | null) ?? 'inline';
  return needsPortal(mode);
}

export function syncReaderMount(host: HTMLElement): void {
  if (shouldUsePortal(host)) {
    if (host.parentElement?.id !== PORTAL_ID) mountReaderToBody(host);
  } else {
    restoreInlineIfAnchored(host);
  }
}
