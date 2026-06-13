import { Scheduler } from '../core/scheduler';
import { createReaderStore, Store } from '../core/state';
import { parse } from '../core/parser';
import type { FontPreference, LaunchMode, ReaderState, ThemePreference } from '../core/types';
import { DEFAULT_CONFIG, WPM_MAX, WPM_MIN } from '../core/types';
import { buildTemplate } from './template';
import { mountAppearanceSync } from './appearance-sync';
import { mountReaderChrome } from './mount-reader-chrome';
import {
  applyAccent,
  applyFont,
  applyFontSize,
  applyTheme,
  watchSystemTheme,
} from '../theme/theme';
import { readPrefs } from '../utils/prefs';
import { cancelCountdown } from '../ui/playback';
import { syncPresentation } from '../ui/presentation';
import { t, setLocale } from '../i18n';
import { reportError } from '../observability/errors';
import { clearPortalIfEmpty } from '../ui/portal';

const ATTR = {
  TEXT: 'text',
  SOURCE: 'source-selector',
  WPM: 'wpm',
  THEME: 'theme',
  MODE: 'mode',
  LANG: 'lang',
  ACCENT: 'accent',
  FONT: 'font',
  Z_INDEX: 'z-index',
} as const;

export class RsvpReader extends HTMLElement {
  static get observedAttributes(): string[] {
    return [ATTR.TEXT, ATTR.SOURCE, ATTR.WPM, ATTR.THEME, ATTR.MODE, ATTR.LANG, ATTR.ACCENT, ATTR.FONT];
  }

  private root!: ShadowRoot;
  private store!: Store<ReaderState>;
  private scheduler!: Scheduler;
  private teardown: Array<() => void> = [];
  private connected = false;

  connectedCallback(): void {
    if (this.connected) return;
    this.connected = true;

    try {
      this.mount();
    } catch (err) {
      reportError(err, 'connectedCallback');
    }
  }

  private mount(): void {
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = buildTemplate();

    const prefs = readPrefs();
    const themeAttr = (this.getAttribute(ATTR.THEME) as ThemePreference | null);
    const initialTheme: ThemePreference = prefs.theme ?? themeAttr ?? DEFAULT_CONFIG.theme;

    const fontAttr = (this.getAttribute(ATTR.FONT) as FontPreference | null) ?? DEFAULT_CONFIG.font;
    const initialFont: FontPreference = prefs.font ?? fontAttr;
    const initialFontSize = prefs.fontSize ?? 'm';

    const wpm = clampWpm(parseInt(this.getAttribute(ATTR.WPM) ?? '', 10) || DEFAULT_CONFIG.wpm);

    this.store = createReaderStore({
      wpm,
      theme: initialTheme,
      font: initialFont,
      fontSize: initialFontSize,
    });
    this.scheduler = new Scheduler(this.store);

    setLocale(this.getAttribute(ATTR.LANG) ?? DEFAULT_CONFIG.lang);

    applyTheme(this, initialTheme);
    applyAccent(this, this.getAttribute(ATTR.ACCENT));
    applyFont(this, initialFont);
    applyFontSize(this, initialFontSize);
    this.setAttribute('data-mode', this.getAttribute(ATTR.MODE) ?? DEFAULT_CONFIG.mode);
    applyZIndex(this);

    this.teardown.push(
      watchSystemTheme(() => {
        if (this.store.get().theme === 'auto') applyTheme(this, 'auto');
      }),
    );

    this.teardown.push(mountAppearanceSync(this, this.store));
    this.teardown.push(mountReaderChrome({
      host: this,
      root: this.root,
      store: this.store,
      scheduler: this.scheduler,
      onExit: () => this.exit(),
      renderStates: () => this.renderStates(),
    }));

    this.loadTextFromAttributes();
  }

  disconnectedCallback(): void {
    cancelCountdown(this.store);
    this.scheduler?.destroy();
    for (const fn of this.teardown) try { fn(); } catch { /* noop */ }
    this.teardown = [];
    this.connected = false;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.connected || oldValue === newValue) return;
    switch (name) {
      case ATTR.WPM: {
        const v = clampWpm(parseInt(newValue ?? '', 10) || DEFAULT_CONFIG.wpm);
        this.scheduler.setWpm(v);
        break;
      }
      case ATTR.THEME: {
        const v = (newValue as ThemePreference | null) ?? DEFAULT_CONFIG.theme;
        this.store.set({ theme: v });
        break;
      }
      case ATTR.MODE: {
        this.setAttribute('data-mode', (newValue as LaunchMode | null) ?? DEFAULT_CONFIG.mode);
        syncPresentation(this);
        break;
      }
      case ATTR.TEXT:
      case ATTR.SOURCE:
        this.loadTextFromAttributes();
        break;
      case ATTR.LANG:
        setLocale(newValue ?? DEFAULT_CONFIG.lang);
        break;
      case ATTR.ACCENT:
        applyAccent(this, newValue);
        break;
      case ATTR.FONT: {
        const v = (newValue as FontPreference | null) ?? DEFAULT_CONFIG.font;
        this.store.set({ font: v });
        break;
      }
    }
  }

  /** Public API: snapshot of the words currently loaded for playback. */
  getParsedWords(): readonly string[] {
    return this.store ? [...this.store.get().words] : [];
  }

  /** Public API: snapshot of reader state for analytics / debugging. */
  getStatus(): { idx: number; total: number; wpm: number; status: string } {
    if (!this.store) return { idx: 0, total: 0, wpm: 0, status: 'idle' };
    const s = this.store.get();
    return { idx: s.idx, total: s.totalWords, wpm: s.wpm, status: s.status };
  }

  /**
   * Public API: imperatively set the source to read. Accepts either a raw
   * string (already-cleaned prose) or a DOM Element to parse. When given an
   * Element, the parser runs its full strip pass — non-prose tags, custom
   * elements (ads / embeds), and hidden subtrees are all excluded.
   */
  setText(source: string | Element): void {
    const parsed = parse(source);
    this.scheduler.setWords(parsed.words);
    this.renderStates();
  }

  /** Public API: start playback */
  play(): void { this.scheduler.play(); }

  /** Public API: pause playback */
  pause(): void { this.scheduler.pause(); }

  /** Public API: close / hide the reader */
  exit(): void {
    cancelCountdown(this.store);
    this.store?.set({ settingsOpen: false, expanded: false });
    this.scheduler.pause();
    this.dispatchEvent(new CustomEvent('rsvp:exit', { bubbles: true, composed: true }));
    if (!this.hasAttribute('persistent')) {
      this.remove();
      clearPortalIfEmpty();
    }
  }

  private loadTextFromAttributes(): void {
    const explicit = this.getAttribute(ATTR.TEXT);
    if (explicit?.trim()) {
      this.setText(explicit);
      return;
    }
    const selector = this.getAttribute(ATTR.SOURCE);
    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        this.setText(el);
        return;
      }
    }
    this.renderStates();
  }

  private renderStates(): void {
    const empty = this.root.querySelector('[data-state="empty"]') as HTMLElement | null;
    const stage = this.root.querySelector('.stage') as HTMLElement | null;
    if (!empty || !stage) return;

    const state = this.store.get();
    const isEmpty = state.totalWords === 0;

    empty.hidden = !isEmpty;
    stage.hidden = isEmpty;

    if (isEmpty) empty.textContent = t('state.empty');
  }
}

function clampWpm(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_CONFIG.wpm;
  return Math.max(WPM_MIN, Math.min(WPM_MAX, n));
}

function applyZIndex(host: HTMLElement): void {
  const raw = host.getAttribute('z-index');
  if (!raw) return;
  const n = parseInt(raw, 10);
  if (Number.isFinite(n)) host.style.setProperty('--rsvp-z-index', String(n));
}

export function registerElement(): void {
  if (!customElements.get('rsvp-reader')) {
    customElements.define('rsvp-reader', RsvpReader);
  }
}
