import type { Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { WPM_MAX, WPM_MIN, WPM_STEP } from '../core/types';
import type { Scheduler } from '../core/scheduler';
import { resolveTheme } from '../theme/theme';
import { icons } from './icons';
import { setButtonLabel } from './button-label';
import { requestPlayback } from './playback';
import { t } from '../i18n';

type ControlKey = 'play' | 'slower' | 'faster' | 'skipBack' | 'skipForward' | 'restart' | 'exit';
type Slot = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface ButtonSpec {
  key: ControlKey;
  slot: Slot;
  ariaKey: Parameters<typeof t>[0];
  labelKey: Parameters<typeof t>[0];
  ariaShortcut?: string;
  primary?: boolean;
  icon: keyof typeof icons;
}

const buttons: ButtonSpec[] = [
  { key: 'restart', slot: 'top-left', ariaKey: 'control.restart', labelKey: 'control.label.restart', ariaShortcut: 'R', icon: 'restart' },
  { key: 'exit', slot: 'top-right', ariaKey: 'control.exit', labelKey: 'control.label.close', ariaShortcut: 'Escape', icon: 'exit' },
  { key: 'slower', slot: 'bottom-left', ariaKey: 'control.slower', labelKey: 'control.label.slower', ariaShortcut: 'ArrowLeft', icon: 'slower' },
  { key: 'skipBack', slot: 'bottom-left', ariaKey: 'control.skipBack', labelKey: 'control.label.back', ariaShortcut: 'Shift+ArrowLeft', icon: 'skipBack' },
  { key: 'play', slot: 'bottom-center', ariaKey: 'control.play', labelKey: 'control.label.play', ariaShortcut: 'Space', primary: true, icon: 'play' },
  { key: 'skipForward', slot: 'bottom-right', ariaKey: 'control.skipForward', labelKey: 'control.label.forward', ariaShortcut: 'Shift+ArrowRight', icon: 'skipForward' },
  { key: 'faster', slot: 'bottom-right', ariaKey: 'control.faster', labelKey: 'control.label.faster', ariaShortcut: 'ArrowRight', icon: 'faster' },
];

interface ControlRefs {
  btn: HTMLButtonElement;
  wrap: HTMLElement;
  label: HTMLElement;
}

export function mountControls(
  root: ShadowRoot,
  store: Store<ReaderState>,
  scheduler: Scheduler,
  onExit: () => void,
): () => void {
  const slots = new Map<Slot, HTMLElement>();
  for (const el of root.querySelectorAll<HTMLElement>('[data-slot]')) {
    slots.set(el.dataset.slot as Slot, el);
  }
  if (slots.size === 0) return () => {};

  const refs: Partial<Record<ControlKey, ControlRefs>> = {};
  const themeToggle = mountThemeToggle(slots.get('top-right')!, store);

  for (const spec of buttons) {
    const container = slots.get(spec.slot);
    if (!container) continue;
    refs[spec.key] = appendControl(container, spec);
  }

  const onClick = (key: ControlKey) => {
    const state = store.get();
    switch (key) {
      case 'play':
        requestPlayback(store, scheduler);
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
      case 'exit':
        onExit();
        break;
    }
  };

  const handlers: Array<{ btn: HTMLButtonElement; fn: () => void }> = [];
  for (const spec of buttons) {
    const ref = refs[spec.key];
    if (!ref) continue;
    const fn = () => onClick(spec.key);
    ref.btn.addEventListener('click', fn);
    handlers.push({ btn: ref.btn, fn });
  }

  const renderPlayState = (state: ReaderState) => {
    const play = refs.play!;
    const slower = refs.slower!;
    const faster = refs.faster!;

    const playing = state.status === 'playing';
    const inCountdown = state.status === 'countdown';

    play.btn.innerHTML = playing ? icons.pause : icons.play;
    const playAria = playing ? 'control.pause' : 'control.play';
    const playLabel = playing ? 'control.label.pause' : 'control.label.play';
    setButtonLabel(play.btn, t(playAria));
    play.label.textContent = t(playLabel);
    play.btn.setAttribute('aria-pressed', String(playing));
    play.btn.disabled = inCountdown;

    themeToggle.render(state);

    const lockNav = inCountdown;
    slower.btn.disabled = lockNav || state.wpm <= WPM_MIN;
    faster.btn.disabled = lockNav || state.wpm >= WPM_MAX;
    refs.skipBack!.btn.disabled = lockNav;
    refs.skipForward!.btn.disabled = lockNav;
    refs.restart!.btn.disabled = lockNav;
    themeToggle.setDisabled(lockNav);
  };

  renderPlayState(store.get());
  const unsub = store.subscribe(renderPlayState);

  return () => {
    unsub();
    themeToggle.destroy();
    for (const { btn, fn } of handlers) btn.removeEventListener('click', fn);
    for (const el of slots.values()) el.innerHTML = '';
  };
}

function appendControl(container: HTMLElement, spec: ButtonSpec): ControlRefs {
  const wrap = document.createElement('div');
  wrap.className = 'control-item' + (spec.primary ? ' control-item--primary' : '');
  wrap.dataset.controlWrap = spec.key;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn' + (spec.primary ? ' btn--primary' : '');
  btn.setAttribute('data-control', spec.key);
  setButtonLabel(btn, t(spec.ariaKey));
  if (spec.ariaShortcut) btn.setAttribute('aria-keyshortcuts', spec.ariaShortcut);
  btn.innerHTML = icons[spec.icon];

  const label = document.createElement('span');
  label.className = 'control-item__label';
  label.textContent = t(spec.labelKey);

  wrap.appendChild(btn);
  wrap.appendChild(label);
  container.appendChild(wrap);

  return { btn, wrap, label };
}

function mountThemeToggle(
  container: HTMLElement,
  store: Store<ReaderState>,
): {
  render: (state: ReaderState) => void;
  setDisabled: (disabled: boolean) => void;
  destroy: () => void;
} {
  const group = document.createElement('div');
  group.className = 'theme-toggle';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', t('control.theme'));

  const darkBtn = document.createElement('button');
  darkBtn.type = 'button';
  darkBtn.className = 'theme-toggle__btn';
  darkBtn.dataset.themePick = 'dark';
  darkBtn.innerHTML = `${icons.moon}<span>${t('control.label.dark')}</span>`;

  const lightBtn = document.createElement('button');
  lightBtn.type = 'button';
  lightBtn.className = 'theme-toggle__btn';
  lightBtn.dataset.themePick = 'light';
  lightBtn.innerHTML = `${icons.sun}<span>${t('control.label.light')}</span>`;

  group.append(darkBtn, lightBtn);
  container.insertBefore(group, container.firstChild);

  const pickDark = () => store.set({ theme: 'dark' });
  const pickLight = () => store.set({ theme: 'light' });
  darkBtn.addEventListener('click', pickDark);
  lightBtn.addEventListener('click', pickLight);

  return {
    render(state) {
      const active = state.theme === 'light' || state.theme === 'dark'
        ? state.theme
        : resolveTheme(state.theme);
      const isDark = active === 'dark';
      darkBtn.setAttribute('aria-pressed', String(isDark));
      lightBtn.setAttribute('aria-pressed', String(!isDark));
    },
    setDisabled(disabled) {
      darkBtn.disabled = disabled;
      lightBtn.disabled = disabled;
    },
    destroy() {
      darkBtn.removeEventListener('click', pickDark);
      lightBtn.removeEventListener('click', pickLight);
      group.remove();
    },
  };
}
