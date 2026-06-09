import type { FontPreference, FontSizePreference, ThemePreference } from '../core/types';
import { safeStorage } from './safe-storage';

const PREFS_KEY = 'rsvp-reader:prefs';

export interface UserPrefs {
  theme?: ThemePreference;
  font?: FontPreference;
  fontSize?: FontSizePreference;
  alwaysShowToolbar?: boolean;
}

export function readPrefs(): UserPrefs {
  const raw = safeStorage.get(PREFS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as UserPrefs;
    return {
      theme: validTheme(parsed.theme) ? parsed.theme : undefined,
      font: validFont(parsed.font) ? parsed.font : undefined,
      fontSize: validFontSize(parsed.fontSize) ? parsed.fontSize : undefined,
      alwaysShowToolbar: typeof parsed.alwaysShowToolbar === 'boolean'
        ? parsed.alwaysShowToolbar
        : undefined,
    };
  } catch {
    return {};
  }
}

export function writePrefs(partial: UserPrefs): void {
  const current = readPrefs();
  const next = { ...current, ...partial };
  safeStorage.set(PREFS_KEY, JSON.stringify(next));
}

function validTheme(v: unknown): v is ThemePreference {
  return v === 'light' || v === 'dark' || v === 'auto';
}

function validFont(v: unknown): v is FontPreference {
  return v === 'sans' || v === 'serif' || v === 'mono' || v === 'dyslexic';
}

function validFontSize(v: unknown): v is FontSizePreference {
  return v === 's' || v === 'm' || v === 'l';
}
