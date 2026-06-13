import { subscribeFields, type Store } from '../core/state';
import type { ReaderState } from '../core/types';
import { WPM_MAX, WPM_MIN } from '../core/types';
import type { Scheduler } from '../core/scheduler';
import { icons } from './icons';
import { setButtonLabel } from './button-label';
import { isMobileViewport } from '../utils/mobile';
import { dispatchReaderCommand } from './reader-commands';
import { t, type I18nKey } from '../i18n';

type ControlKey =
  | 'play' | 'slower' | 'faster' | 'skipBack' | 'skipForward'
  | 'restart' | 'exit' | 'settings' | 'fullscreen';
type Slot = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface ButtonSpec {
  key: ControlKey;
  slot: Slot;
  ariaKey: I18nKey;
  labelKey: I18nKey;
  ariaShortcut?: string;
  primary?: boolean;
  icon: keyof typeof icons;
}

const buttons: ButtonSpec[] = [
  { key: 'restart', slot: 'top-left', ariaKey: 'control.restart', labelKey: 'control.label.restart', ariaShortcut: 'R', icon: 'restart' },
  { key: 'fullscreen', slot: 'top-right', ariaKey: 'control.fullscreen', labelKey: 'control.label.fullscreen', icon: 'fullscreen' },
  { key: 'settings', slot: 'top-right', ariaKey: 'control.settings', labelKey: 'control.label.settings', icon: 'settings' },
  { key: 'exit', slot: 'top-right', ariaKey: 'control.exit', labelKey: 'control.label.exit', ariaShortcut: 'Escape', icon: 'exit' },
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

const controlCommands: Record<Exclude<ControlKey, 'settings'>, Parameters<typeof dispatchReaderCommand>[0]> = {
  play: 'togglePlayback',
  slower: 'wpmDown',
  faster: 'wpmUp',
  skipBack: 'seekBack',
  skipForward: 'seekForward',
  restart: 'restartAndPlay',
  fullscreen: 'fullscreenToggle',
  exit: 'exit',
};

export function mountControls(
  host: HTMLElement,
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
  const ctx = { store, scheduler, onExit };

  for (const spec of buttons) {
    const container = slots.get(spec.slot);
    if (!container) continue;
    refs[spec.key] = appendControl(container, spec);
  }

  const updateFullscreenVisibility = () => {
    if (refs.fullscreen) refs.fullscreen.wrap.hidden = isMobileViewport();
  };
  updateFullscreenVisibility();
  const settingsBtn = refs.settings?.btn;
  if (settingsBtn) {
    settingsBtn.setAttribute('aria-controls', 'rsvp-settings-panel');
    settingsBtn.setAttribute('aria-haspopup', 'dialog');
  }

  const handlers: Array<{ btn: HTMLButtonElement; fn: () => void }> = [];
  for (const spec of buttons) {
    if (spec.key === 'settings') continue;
    const ref = refs[spec.key];
    if (!ref) continue;
    const command = controlCommands[spec.key];
    const fn = () => {
      dispatchReaderCommand(command, ctx);
      if (spec.key === 'fullscreen') refs.fullscreen?.btn.blur();
    };
    ref.btn.addEventListener('click', fn);
    handlers.push({ btn: ref.btn, fn });
  }

  const renderPlayState = (state: ReaderState) => {
    const play = refs.play!;
    const slower = refs.slower!;
    const faster = refs.faster!;
    const settings = refs.settings!;
    const exit = refs.exit!;

    const playing = state.status === 'playing';
    const inCountdown = state.status === 'countdown';

    play.btn.innerHTML = playing ? icons.pause : icons.play;
    const playAria = playing ? 'control.pause' : 'control.play';
    const playLabel = playing ? 'control.label.pause' : 'control.label.play';
    setButtonLabel(play.btn, t(playAria));
    play.label.textContent = t(playLabel);
    play.btn.setAttribute('aria-pressed', String(playing));
    play.btn.disabled = inCountdown;

    settings.btn.setAttribute('aria-expanded', String(state.settingsOpen));
    settings.btn.disabled = inCountdown;
    settings.btn.innerHTML = icons.settings;
    setButtonLabel(settings.btn, t('control.settings'));
    settings.label.textContent = t('control.label.settings');

    exit.btn.disabled = inCountdown;

    if (refs.fullscreen) {
      const fs = refs.fullscreen;
      const expanded = state.expanded;
      fs.btn.disabled = inCountdown;
      fs.btn.innerHTML = expanded ? icons.fullscreenExit : icons.fullscreen;
      const fsKey = expanded ? 'control.exitFullscreen' : 'control.fullscreen';
      const fsLabelKey = expanded ? 'control.label.exitFullscreen' : 'control.label.fullscreen';
      setButtonLabel(fs.btn, t(fsKey));
      fs.label.textContent = t(fsLabelKey);
      fs.btn.setAttribute('aria-pressed', String(expanded));
      host.toggleAttribute('data-expanded', expanded);
    }

    const lockNav = inCountdown;
    slower.btn.disabled = lockNav || state.wpm <= WPM_MIN;
    faster.btn.disabled = lockNav || state.wpm >= WPM_MAX;
    refs.skipBack!.btn.disabled = lockNav;
    refs.skipForward!.btn.disabled = lockNav;
    refs.restart!.btn.disabled = lockNav;
  };

  const onResize = () => updateFullscreenVisibility();
  window.addEventListener('resize', onResize);

  renderPlayState(store.get());
  const unsub = subscribeFields(
    store,
    ['status', 'settingsOpen', 'expanded', 'wpm'],
    renderPlayState,
  );

  return () => {
    unsub();
    window.removeEventListener('resize', onResize);
    host.removeAttribute('data-expanded');
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
  label.setAttribute('aria-hidden', 'true');
  label.textContent = t(spec.labelKey);

  wrap.appendChild(btn);
  wrap.appendChild(label);
  container.appendChild(wrap);

  return { btn, wrap, label };
}
