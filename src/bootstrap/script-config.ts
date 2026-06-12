import type { RsvpConfig, ThemePreference, LaunchMode, FontPreference } from '../core/types';
import { DEFAULT_CONFIG, WPM_MAX, WPM_MIN } from '../core/types';

declare global {
  interface Window {
    RSVP_READER_DISABLED?: boolean;
  }
}

export function readScriptConfig(): RsvpConfig {
  const script = findOwnScriptTag();
  if (!script) return { ...DEFAULT_CONFIG };

  const wpmAttr = parseInt(script.dataset.wpm ?? '', 10);
  const wpm = Number.isFinite(wpmAttr)
    ? Math.max(WPM_MIN, Math.min(WPM_MAX, wpmAttr))
    : DEFAULT_CONFIG.wpm;

  const theme = isTheme(script.dataset.theme) ? script.dataset.theme : DEFAULT_CONFIG.theme;
  const mode = isMode(script.dataset.mode) ? script.dataset.mode : DEFAULT_CONFIG.mode;
  const sourceSelector = script.dataset.sourceSelector?.trim() || null;
  const position = script.dataset.position === 'after' ? 'after' : 'before';
  const lang = script.dataset.lang?.trim() || DEFAULT_CONFIG.lang;
  const accent = script.dataset.accent?.trim() || null;
  const font = isFont(script.dataset.font) ? script.dataset.font : DEFAULT_CONFIG.font;

  const zIndexAttr = parseInt(script.dataset.zIndex ?? '', 10);
  const zIndex = Number.isFinite(zIndexAttr) ? zIndexAttr : null;

  return { wpm, theme, mode, sourceSelector, position, lang, accent, font, zIndex };
}

function isFont(v: string | undefined): v is FontPreference {
  return v === 'sans' || v === 'serif' || v === 'mono' || v === 'dyslexic';
}

function findOwnScriptTag(): HTMLScriptElement | null {
  // The currently-executing script is referenced as document.currentScript at
  // top-level evaluation. After async/defer parsing, we fall back to scanning
  // for a script whose src ends with our filename.
  const current = document.currentScript as HTMLScriptElement | null;
  if (current && isOurScript(current)) return current;
  const all = document.querySelectorAll<HTMLScriptElement>('script[src]');
  for (const s of Array.from(all)) {
    if (isOurScript(s)) return s;
  }
  return null;
}

function isOurScript(s: HTMLScriptElement): boolean {
  const src = s.src || '';
  return /rsvp-reader(?:\.iife)?\.js(?:\?|$)/.test(src)
    || /\/src\/index\.ts(?:\?|$)/.test(src)
    || s.dataset.rsvpReader !== undefined;
}

function isTheme(v: string | undefined): v is ThemePreference {
  return v === 'light' || v === 'dark' || v === 'auto';
}

function isMode(v: string | undefined): v is LaunchMode {
  return v === 'inline' || v === 'overlay';
}
