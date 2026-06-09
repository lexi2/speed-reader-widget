import type { FontPreference, ThemePreference } from '../core/types';
import { accentNeedsDarkText } from '../utils/contrast';
import { safeStorage } from '../utils/safe-storage';

const STORAGE_KEY = 'rsvp-reader:theme';

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(host: HTMLElement, pref: ThemePreference): void {
  const resolved = resolveTheme(pref);
  host.setAttribute('data-theme', resolved);
}

export function watchSystemTheme(callback: (resolved: 'light' | 'dark') => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => callback(mq.matches ? 'dark' : 'light');
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

export function persistThemeChoice(pref: ThemePreference): void {
  safeStorage.set(STORAGE_KEY, pref);
}

export function readPersistedTheme(): ThemePreference | null {
  const v = safeStorage.get(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'auto' ? v : null;
}

export function nextTheme(current: ThemePreference): ThemePreference {
  if (current === 'auto') return 'light';
  if (current === 'light') return 'dark';
  return 'auto';
}

export function applyAccent(host: HTMLElement, accent: string | null): void {
  if (!accent) {
    host.style.removeProperty('--rsvp-accent');
    host.style.removeProperty('--rsvp-on-accent');
    return;
  }
  host.style.setProperty('--rsvp-accent', accent);
  host.style.setProperty(
    '--rsvp-on-accent',
    accentNeedsDarkText(accent) ? '#18181b' : '#ffffff',
  );
}

export function applyFont(host: HTMLElement, font: FontPreference): void {
  host.setAttribute('data-font', font);
  if (font === 'dyslexic') ensureDyslexicFont();
}

let dyslexicFontLoaded = false;
function ensureDyslexicFont(): void {
  if (dyslexicFontLoaded || document.querySelector('[data-rsvp-dyslexic-font]')) return;
  dyslexicFontLoaded = true;
  const base = widgetAssetBase();
  const url = `${base}/fonts/atkinson-hyperlegible-latin.woff2`;
  const style = document.createElement('style');
  style.setAttribute('data-rsvp-dyslexic-font', '');
  style.textContent = `
@font-face {
  font-family: "Atkinson Hyperlegible";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("${url}") format("woff2");
}`;
  document.head.appendChild(style);
}

function widgetAssetBase(): string {
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[src]');
  for (const s of Array.from(scripts)) {
    if (/rsvp-reader(?:\.iife)?\.js(?:\?|$)/.test(s.src)
      || /\/src\/index\.ts(?:\?|$)/.test(s.src)
      || s.dataset.rsvpReader !== undefined) {
      return s.src.replace(/\/[^/]*$/, '');
    }
  }
  return '';
}
