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
  | 'control.settings'
  | 'control.fullscreen'
  | 'control.exitFullscreen'
  | 'control.closeSettings'
  | 'control.label.play'
  | 'control.label.pause'
  | 'control.label.slower'
  | 'control.label.faster'
  | 'control.label.back'
  | 'control.label.forward'
  | 'control.label.restart'
  | 'control.label.close'
  | 'control.label.exit'
  | 'control.label.dark'
  | 'control.label.light'
  | 'control.label.settings'
  | 'settings.title'
  | 'settings.theme'
  | 'settings.font'
  | 'settings.fontSize'
  | 'settings.font.sans'
  | 'settings.font.serif'
  | 'settings.font.mono'
  | 'settings.font.dyslexic'
  | 'settings.fontSize.s'
  | 'settings.fontSize.m'
  | 'settings.fontSize.l'
  | 'settings.alwaysShowToolbar'
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
  'control.theme': 'Theme',
  'control.label.play': 'Play',
  'control.label.pause': 'Pause',
  'control.label.slower': 'Slower',
  'control.label.faster': 'Faster',
  'control.label.back': 'Back',
  'control.label.forward': 'Forward',
  'control.label.restart': 'Restart',
  'control.label.close': 'Close',
  'control.label.exit': 'Exit',
  'control.label.dark': 'Dark Mode',
  'control.label.light': 'Light Mode',
  'control.settings': 'Settings',
  'control.fullscreen': 'Enter fullscreen',
  'control.exitFullscreen': 'Exit fullscreen',
  'control.closeSettings': 'Close settings',
  'control.label.settings': 'Settings',
  'control.label.fullscreen': 'Fullscreen',
  'control.label.closeSettings': 'Close',
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.font': 'Font',
  'settings.fontSize': 'Text size',
  'settings.font.sans': 'Sans',
  'settings.font.serif': 'Serif',
  'settings.font.mono': 'Mono',
  'settings.font.dyslexic': 'Dyslexic',
  'settings.fontSize.s': 'S',
  'settings.fontSize.m': 'M',
  'settings.fontSize.l': 'L',
  'settings.alwaysShowToolbar': 'Always show controls',
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
