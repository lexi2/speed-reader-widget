export function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 480px)').matches
    || window.matchMedia('(pointer: coarse)').matches;
}
