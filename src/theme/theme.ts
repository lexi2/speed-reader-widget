import type { ThemePreference } from '../core/types';
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
