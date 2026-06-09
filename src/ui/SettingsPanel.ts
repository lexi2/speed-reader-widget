import type { Store } from '../core/state';
import type { FontPreference, FontSizePreference, ReaderState } from '../core/types';
import { applyFont, applyFontSize, persistThemeChoice, resolveTheme } from '../theme/theme';
import { setButtonLabel } from './button-label';
import { icons } from './icons';
import { t } from '../i18n';

type ThemePick = 'light' | 'dark';

export function mountSettingsPanel(
  host: HTMLElement,
  root: ShadowRoot,
  store: Store<ReaderState>,
): () => void {
  const trigger = root.querySelector('[data-control="settings"]') as HTMLButtonElement | null;
  const panel = root.querySelector('[data-settings-panel]') as HTMLElement | null;
  const closeBtn = panel?.querySelector('[data-settings-close]') as HTMLButtonElement | null;
  if (!trigger || !panel || !closeBtn) return () => {};

  closeBtn.innerHTML = icons.exit;
  setButtonLabel(closeBtn, t('control.closeSettings'));

  const themeGroup = panel.querySelector('[data-settings-theme]') as HTMLElement | null;
  const fontGroup = panel.querySelector('[data-settings-font]') as HTMLElement | null;
  const sizeGroup = panel.querySelector('[data-settings-font-size]') as HTMLElement | null;
  const toolbarToggle = panel.querySelector('[data-settings-toolbar-toggle]') as HTMLInputElement | null;

  const title = panel.querySelector('[data-settings-title]');
  if (title) title.textContent = t('settings.title');

  for (const el of panel.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key as Parameters<typeof t>[0]);
  }

  for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-font-pick]')) {
    const font = btn.dataset.fontPick;
    if (font) btn.textContent = t(`settings.font.${font}` as Parameters<typeof t>[0]);
  }
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-font-size-pick]')) {
    const size = btn.dataset.fontSizePick;
    if (size) btn.textContent = t(`settings.fontSize.${size}` as Parameters<typeof t>[0]);
  }
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-theme-pick]')) {
    const pick = btn.dataset.themePick;
    if (pick === 'light') btn.textContent = t('control.label.light');
    if (pick === 'dark') btn.textContent = t('control.label.dark');
  }

  const handlers: Array<{ el: Element; fn: EventListener }> = [];

  const addHandler = (el: Element, fn: EventListener) => {
    el.addEventListener('click', fn);
    handlers.push({ el, fn });
  };

  const setOpen = (open: boolean) => {
    store.set({ settingsOpen: open });
  };

  const onTriggerClick = () => setOpen(!store.get().settingsOpen);
  trigger.addEventListener('click', onTriggerClick);
  handlers.push({ el: trigger, fn: onTriggerClick as EventListener });

  const onCloseClick = () => setOpen(false);
  closeBtn.addEventListener('click', onCloseClick);
  handlers.push({ el: closeBtn, fn: onCloseClick as EventListener });

  if (themeGroup) {
    for (const pick of ['light', 'dark'] as ThemePick[]) {
      const btn = themeGroup.querySelector(`[data-theme-pick="${pick}"]`) as HTMLButtonElement | null;
      if (!btn) continue;
      const fn = () => {
        store.set({ theme: pick });
        persistThemeChoice(pick);
      };
      addHandler(btn, fn as EventListener);
    }
  }

  if (fontGroup) {
    for (const font of ['sans', 'serif', 'mono', 'dyslexic'] as FontPreference[]) {
      const btn = fontGroup.querySelector(`[data-font-pick="${font}"]`) as HTMLButtonElement | null;
      if (!btn) continue;
      const fn = () => {
        store.set({ font });
        applyFont(host, font);
      };
      addHandler(btn, fn as EventListener);
    }
  }

  if (sizeGroup) {
    for (const size of ['s', 'm', 'l'] as FontSizePreference[]) {
      const btn = sizeGroup.querySelector(`[data-font-size-pick="${size}"]`) as HTMLButtonElement | null;
      if (!btn) continue;
      const fn = () => {
        store.set({ fontSize: size });
        applyFontSize(host, size);
      };
      addHandler(btn, fn as EventListener);
    }
  }

  if (toolbarToggle) {
    toolbarToggle.addEventListener('change', () => {
      store.set({ alwaysShowToolbar: toolbarToggle.checked });
    });
  }

  const render = (state: ReaderState) => {
    const open = state.settingsOpen;
    host.toggleAttribute('data-settings-open', open);
    panel.hidden = !open;

    if (themeGroup) {
      const active = state.theme === 'light' || state.theme === 'dark'
        ? state.theme
        : resolveTheme(state.theme);
      for (const btn of themeGroup.querySelectorAll<HTMLButtonElement>('[data-theme-pick]')) {
        const pick = btn.dataset.themePick as ThemePick;
        btn.setAttribute('aria-pressed', String(pick === active));
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

    if (toolbarToggle) toolbarToggle.checked = state.alwaysShowToolbar;
  };

  render(store.get());
  const unsub = store.subscribe(render);

  return () => {
    unsub();
    host.removeAttribute('data-settings-open');
    trigger.removeEventListener('click', onTriggerClick);
    for (const { el, fn } of handlers) el.removeEventListener('click', fn);
    if (toolbarToggle) toolbarToggle.replaceWith(toolbarToggle.cloneNode(true));
  };
}
