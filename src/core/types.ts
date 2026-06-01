export type ReaderStatus = 'idle' | 'playing' | 'paused' | 'done';
export type ThemePreference = 'light' | 'dark' | 'auto';
export type LaunchMode = 'inline' | 'overlay';

export interface ReaderState {
  idx: number;
  wpm: number;
  status: ReaderStatus;
  theme: ThemePreference;
  totalWords: number;
  words: string[];
}

export interface ParsedText {
  words: string[];
  wordCount: number;
}

export interface RsvpConfig {
  wpm: number;
  theme: ThemePreference;
  mode: LaunchMode;
  sourceSelector: string | null;
  position: 'before' | 'after';
  lang: string;
}

export const DEFAULT_CONFIG: RsvpConfig = {
  wpm: 300,
  theme: 'auto',
  mode: 'inline',
  sourceSelector: null,
  position: 'before',
  lang: 'en',
};

export const WPM_MIN = 100;
export const WPM_MAX = 1000;
export const WPM_STEP = 25;
