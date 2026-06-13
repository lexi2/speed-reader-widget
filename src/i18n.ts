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
  | 'control.label.fullscreen'
  | 'control.label.exitFullscreen'
  | 'control.label.closeSettings'
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
  | 'settings.fontSize.aria.s'
  | 'settings.fontSize.aria.m'
  | 'settings.fontSize.aria.l'
  | 'state.paused'
  | 'state.pausedWithTime'
  | 'state.done'
  | 'state.empty'
  | 'state.wpm'
  | 'state.skippedForward'
  | 'state.skippedBack'
  | 'state.status.idle'
  | 'state.status.countdown'
  | 'state.status.playing'
  | 'state.status.paused'
  | 'state.status.done'
  | 'aria.word'
  | 'aria.progress'
  | 'overlay.title'
  | 'stage.idleHint'
  | 'done.again';

type Locale = Record<StringKey, string>;

const en: Locale = {
  'trigger.label': 'Read faster',
  'control.play': 'Play reader',
  'control.pause': 'Pause reader',
  'control.faster': 'Increase speed by 25 WPM',
  'control.slower': 'Decrease speed by 25 WPM',
  'control.skipBack': 'Go back 10 words',
  'control.skipForward': 'Go forward 10 words',
  'control.restart': 'Restart article',
  'control.exit': 'Close screen reader',
  'control.theme': 'Theme',
  'control.label.play': 'Play reader',
  'control.label.pause': 'Pause reader',
  'control.label.slower': 'Decrease speed by 25 WPM',
  'control.label.faster': 'Increase speed by 25 WPM',
  'control.label.back': 'Go back 10 words',
  'control.label.forward': 'Go forward 10 words',
  'control.label.restart': 'Restart article',
  'control.label.close': 'Close',
  'control.label.exit': 'Close screen reader',
  'control.label.dark': 'Dark Mode',
  'control.label.light': 'Light Mode',
  'control.settings': 'Open settings panel',
  'control.fullscreen': 'Expand to fullscreen',
  'control.exitFullscreen': 'Collapse fullscreen',
  'control.closeSettings': 'Close settings panel',
  'control.label.settings': 'Open settings panel',
  'control.label.fullscreen': 'Expand to fullscreen',
  'control.label.exitFullscreen': 'Collapse fullscreen',
  'control.label.closeSettings': 'Close settings panel',
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
  'settings.fontSize.aria.s': 'Small text size',
  'settings.fontSize.aria.m': 'Medium text size',
  'settings.fontSize.aria.l': 'Large text size',
  'state.paused': 'Paused.',
  'state.pausedWithTime': 'Paused at {time} remaining.',
  'state.done': 'Finished.',
  'state.empty': "Sorry — couldn't find any readable text on this page.",
  'state.wpm': '{n} words per minute',
  'state.skippedForward': 'Skipped forward 10 words.',
  'state.skippedBack': 'Skipped back 10 words.',
  'state.status.idle': 'Ready',
  'state.status.countdown': 'Starting',
  'state.status.playing': 'Playing',
  'state.status.paused': 'Paused',
  'state.status.done': 'Finished',
  'aria.word': 'Current word',
  'aria.progress': 'Reading progress',
  'overlay.title': 'Speed reader',
  'stage.idleHint': 'Press Play below when you\'re ready',
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
