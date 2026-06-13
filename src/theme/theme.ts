import type { FontPreference, FontSizePreference, ThemePreference } from '../core/types';
import { accentNeedsDarkText } from '../utils/contrast';

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
  if (font === 'dyslexic') ensureDyslexicFont(host);
}

export function applyFontSize(host: HTMLElement, size: FontSizePreference): void {
  if (size === 'm') {
    host.removeAttribute('data-font-size');
  } else {
    host.setAttribute('data-font-size', size);
  }
}

const DYSLEXIC_FONT_CSS = (url: string) => `
@font-face {
  font-family: "Atkinson Hyperlegible";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("${url}") format("woff2");
}`;

function ensureDyslexicFont(host: HTMLElement): void {
  const url = dyslexicFontUrl();
  const css = DYSLEXIC_FONT_CSS(url);

  if (!document.querySelector('[data-rsvp-dyslexic-font]')) {
    const docStyle = document.createElement('style');
    docStyle.setAttribute('data-rsvp-dyslexic-font', '');
    docStyle.textContent = css;
    document.head.appendChild(docStyle);
  }

  const root = host.shadowRoot;
  if (!root || root.querySelector('[data-rsvp-dyslexic-font]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-rsvp-dyslexic-font', '');
  style.textContent = css;
  root.insertBefore(style, root.firstChild);

  void document.fonts.load('400 1rem "Atkinson Hyperlegible"');
}

function dyslexicFontUrl(): string {
  const fontPath = '/fonts/atkinson-hyperlegible-latin.woff2';
  const base = widgetAssetBase();
  if (!base) return fontPath;

  try {
    const baseUrl = new URL(base, window.location.href);
    // Vite dev serves /src/index.ts but public assets live at /fonts/.
    if (/\/src$/i.test(baseUrl.pathname)) {
      return `${baseUrl.origin}${fontPath}`;
    }
    return new URL(`fonts/atkinson-hyperlegible-latin.woff2`, `${baseUrl.href}/`).href;
  } catch {
    return fontPath;
  }
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
