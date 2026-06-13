import type { Scheduler } from '../core/scheduler';
import { subscribeFields, type Store } from '../core/state';
import type { FontPreference, FontSizePreference, ReaderState, ThemePreference } from '../core/types';
import { setButtonLabel, setHoverHint } from './button-label';
import { icons } from './icons';
import { cancelCountdown } from './playback';
import { t, type I18nKey } from '../i18n';

const THEME_PICKS: ThemePreference[] = ['light', 'dark', 'auto'];

const themeLabelKeys: Record<ThemePreference, I18nKey> = {
  light: 'control.label.light',
  dark: 'control.label.dark',
  auto: 'control.label.auto',
};

export function mountSettingsPanel(
  host: HTMLElement,
  root: ShadowRoot,
  store: Store<ReaderState>,
  scheduler: Scheduler,
): () => void {
  const trigger = root.querySelector('[data-control="settings"]') as HTMLButtonElement | null;
  const panel = root.querySelector('[data-settings-panel]') as HTMLElement | null;
  const closeBtn = panel?.querySelector('[data-settings-close]') as HTMLButtonElement | null;
  if (!trigger || !panel || !closeBtn) return () => {};

  closeBtn.innerHTML = icons.exit;
  setButtonLabel(closeBtn, t('control.closeSettings'), true);

  const themeGroup = panel.querySelector('[data-settings-theme]') as HTMLElement | null;
  const fontGroup = panel.querySelector('[data-settings-font]') as HTMLElement | null;
  const sizeGroup = panel.querySelector('[data-settings-font-size]') as HTMLElement | null;

  const title = panel.querySelector('[data-settings-title]');
  if (title) title.textContent = t('settings.title');

  for (const el of panel.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key as I18nKey);
  }

  for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-font-pick]')) {
    const font = btn.dataset.fontPick;
    if (font) {
      const label = t(`settings.font.${font}` as I18nKey);
      btn.textContent = label;
      setHoverHint(btn, label);
    }
  }
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-font-size-pick]')) {
    const size = btn.dataset.fontSizePick;
    if (size) {
      btn.textContent = t(`settings.fontSize.${size}` as I18nKey);
      setButtonLabel(btn, t(`settings.fontSize.aria.${size}` as I18nKey), true);
    }
  }
  for (const pick of THEME_PICKS) {
    const btn = themeGroup?.querySelector<HTMLButtonElement>(`[data-theme-pick="${pick}"]`);
    if (!btn) continue;
    const label = t(themeLabelKeys[pick]);
    btn.textContent = label;
    setHoverHint(btn, label);
  }

  const handlers: Array<{ el: Element; fn: EventListener }> = [];

  const addHandler = (el: Element, fn: EventListener) => {
    el.addEventListener('click', fn);
    handlers.push({ el, fn });
  };

  const pauseForSettings = () => {
    cancelCountdown(store);
    if (store.get().status === 'playing') scheduler.pause();
  };

  const setOpen = (open: boolean) => {
    if (open && !store.get().settingsOpen) pauseForSettings();
    store.set({ settingsOpen: open });
    if (open) {
      trigger.blur();
      closeBtn.focus();
    }
  };

  const onTriggerClick = () => setOpen(!store.get().settingsOpen);
  trigger.addEventListener('click', onTriggerClick);
  handlers.push({ el: trigger, fn: onTriggerClick as EventListener });

  const onCloseClick = () => setOpen(false);
  closeBtn.addEventListener('click', onCloseClick);
  handlers.push({ el: closeBtn, fn: onCloseClick as EventListener });

  if (themeGroup) {
    for (const pick of THEME_PICKS) {
      const btn = themeGroup.querySelector(`[data-theme-pick="${pick}"]`) as HTMLButtonElement | null;
      if (!btn) continue;
      const fn = () => store.set({ theme: pick });
      addHandler(btn, fn as EventListener);
    }
  }

  if (fontGroup) {
    for (const font of ['sans', 'serif', 'mono', 'dyslexic'] as FontPreference[]) {
      const btn = fontGroup.querySelector(`[data-font-pick="${font}"]`) as HTMLButtonElement | null;
      if (!btn) continue;
      const fn = () => store.set({ font });
      addHandler(btn, fn as EventListener);
    }
  }

  if (sizeGroup) {
    for (const size of ['s', 'm', 'l'] as FontSizePreference[]) {
      const btn = sizeGroup.querySelector(`[data-font-size-pick="${size}"]`) as HTMLButtonElement | null;
      if (!btn) continue;
      const fn = () => store.set({ fontSize: size });
      addHandler(btn, fn as EventListener);
    }
  }

  const render = (state: ReaderState) => {
    const open = state.settingsOpen;
    host.toggleAttribute('data-settings-open', open);
    panel.hidden = !open;
    panel.setAttribute('aria-modal', String(open));

    if (themeGroup) {
      for (const btn of themeGroup.querySelectorAll<HTMLButtonElement>('[data-theme-pick]')) {
        const pick = btn.dataset.themePick as ThemePreference;
        btn.setAttribute('aria-pressed', String(pick === state.theme));
      }
    }

    if (fontGroup) {
      for (const btn of fontGroup.querySelectorAll<HTMLButtonElement>('[data-font-pick]')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.fontPick === state.font));
      }
    }

    if (sizeGroup) {
      for (const btn of sizeGroup.querySelectorAll<HTMLButtonElement>('[data-font-size-pick]')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.fontSizePick === state.fontSize));
      }
    }

  };

  render(store.get());
  const unsub = subscribeFields(
    store,
    ['settingsOpen', 'theme', 'font', 'fontSize'],
    render,
  );

  return () => {
    unsub();
    host.removeAttribute('data-settings-open');
    trigger.removeEventListener('click', onTriggerClick);
    for (const { el, fn } of handlers) el.removeEventListener('click', fn);
  };
}
