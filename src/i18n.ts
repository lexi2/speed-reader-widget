type StringKey =
  | 'trigger.label'
  | 'control.play'
  | 'control.pause'
  | 'control.faster'
  | 'control.slower'
  | 'control.skipBack'
  | 'control.skipForward'
  | 'control.restart'
  | 'control.exit'
  | 'control.theme'
  | 'state.paused'
  | 'state.pausedWithTime'
  | 'state.done'
  | 'state.empty'
  | 'state.wpm'
  | 'state.skippedForward'
  | 'state.skippedBack'
  | 'aria.word'
  | 'aria.progress'
  | 'overlay.title'
  | 'done.again';

type Locale = Record<StringKey, string>;

const en: Locale = {
  'trigger.label': 'Read faster',
  'control.play': 'Play',
  'control.pause': 'Pause',
  'control.faster': 'Faster',
  'control.slower': 'Slower',
  'control.skipBack': 'Skip back 10 words',
  'control.skipForward': 'Skip forward 10 words',
  'control.restart': 'Restart',
  'control.exit': 'Exit',
  'control.theme': 'Toggle theme',
  'state.paused': 'Paused.',
  'state.pausedWithTime': 'Paused at {time} remaining.',
  'state.done': 'Finished.',
  'state.empty': "Sorry — couldn't find any readable text on this page.",
  'state.wpm': '{n} words per minute',
  'state.skippedForward': 'Skipped forward 10 words.',
  'state.skippedBack': 'Skipped back 10 words.',
  'aria.word': 'Current word',
  'aria.progress': 'Reading progress',
  'overlay.title': 'Speed reader',
  'done.again': 'Read again',
};

const locales: Record<string, Locale> = { en };
let active: Locale = en;

export function setLocale(lang: string): void {
  active = locales[lang] ?? en;
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const raw = active[key] ?? en[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
