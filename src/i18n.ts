type StringKey =
  | 'trigger.label'
  | 'control.play'
  | 'control.pause'
  | 'control.faster'
  | 'control.slower'
  | 'control.restart'
  | 'control.exit'
  | 'control.theme'
  | 'state.paused'
  | 'state.done'
  | 'state.empty'
  | 'state.wpm'
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
  'control.restart': 'Restart',
  'control.exit': 'Exit',
  'control.theme': 'Toggle theme',
  'state.paused': 'Paused.',
  'state.done': 'Finished.',
  'state.empty': "Sorry — couldn't find any readable text on this page.",
  'state.wpm': '{n} words per minute',
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
