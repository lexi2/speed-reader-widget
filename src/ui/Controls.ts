import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { WPM_MAX, WPM_MIN, WPM_STEP } from '../core/types';
import type { Scheduler } from '../core/scheduler';
import { nextTheme } from '../theme/theme';
import { icons } from './icons';
import { t } from '../i18n';

interface ButtonSpec {
  key: 'play' | 'slower' | 'faster' | 'skipBack' | 'skipForward' | 'restart' | 'theme' | 'exit';
  ariaKey: string;
  ariaShortcut?: string;
  primary?: boolean;
  icon: keyof typeof icons;
}

const buttons: ButtonSpec[] = [
  { key: 'play', ariaKey: 'control.play', ariaShortcut: 'Space', primary: true, icon: 'play' },
  { key: 'slower', ariaKey: 'control.slower', ariaShortcut: 'ArrowLeft', icon: 'slower' },
  { key: 'faster', ariaKey: 'control.faster', ariaShortcut: 'ArrowRight', icon: 'faster' },
  { key: 'skipBack', ariaKey: 'control.skipBack', ariaShortcut: 'Shift+ArrowLeft', icon: 'skipBack' },
  { key: 'skipForward', ariaKey: 'control.skipForward', ariaShortcut: 'Shift+ArrowRight', icon: 'skipForward' },
  { key: 'restart', ariaKey: 'control.restart', ariaShortcut: 'R', icon: 'restart' },
  { key: 'theme', ariaKey: 'control.theme', icon: 'sun' },
  { key: 'exit', ariaKey: 'control.exit', ariaShortcut: 'Escape', icon: 'exit' },
];

export function mountControls(
  root: ShadowRoot,
  store: Store<ReaderState>,
  scheduler: Scheduler,
  onExit: () => void,
): () => void {
  const container = root.querySelector('.controls') as HTMLElement | null;
  if (!container) return () => {};

  const refs: Partial<Record<ButtonSpec['key'], HTMLButtonElement>> = {};

  for (const spec of buttons) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn' + (spec.primary ? ' btn--primary' : '');
    btn.setAttribute('data-control', spec.key);
    btn.setAttribute('aria-label', t(spec.ariaKey as Parameters<typeof t>[0]));
    if (spec.ariaShortcut) btn.setAttribute('aria-keyshortcuts', spec.ariaShortcut);
    btn.innerHTML = icons[spec.icon];
    container.appendChild(btn);
    refs[spec.key] = btn;
  }

  const onClick = (key: ButtonSpec['key']) => {
    const state = store.get();
    switch (key) {
      case 'play':
        scheduler.toggle();
        break;
      case 'slower':
        scheduler.setWpm(Math.max(WPM_MIN, state.wpm - WPM_STEP));
        break;
      case 'faster':
        scheduler.setWpm(Math.min(WPM_MAX, state.wpm + WPM_STEP));
        break;
      case 'skipBack':
        scheduler.seek(state.idx - 10);
        break;
      case 'skipForward':
        scheduler.seek(state.idx + 10);
        break;
      case 'restart':
        scheduler.restart();
        scheduler.play();
        break;
      case 'theme':
        store.set({ theme: nextTheme(state.theme) });
        break;
      case 'exit':
        onExit();
        break;
    }
  };

  const handlers: Array<{ btn: HTMLButtonElement; fn: (e: Event) => void }> = [];
  for (const spec of buttons) {
    const btn = refs[spec.key]!;
    const fn = () => onClick(spec.key);
    btn.addEventListener('click', fn);
    handlers.push({ btn, fn });
  }

  const renderPlayState = (state: ReaderState) => {
    const playBtn = refs.play!;
    const themeBtn = refs.theme!;
    const slower = refs.slower!;
    const faster = refs.faster!;

    const playing = state.status === 'playing';
    playBtn.innerHTML = playing ? icons.pause : icons.play;
    playBtn.setAttribute('aria-label', t(playing ? 'control.pause' : 'control.play'));
    playBtn.setAttribute('aria-pressed', String(playing));

    themeBtn.innerHTML = state.theme === 'dark' ? icons.moon : state.theme === 'light' ? icons.sun : icons.auto;

    slower.disabled = state.wpm <= WPM_MIN;
    faster.disabled = state.wpm >= WPM_MAX;
  };

  renderPlayState(store.get());
  const unsub = store.subscribe(renderPlayState);

  return () => {
    unsub();
    for (const { btn, fn } of handlers) btn.removeEventListener('click', fn);
    container.innerHTML = '';
  };
}
