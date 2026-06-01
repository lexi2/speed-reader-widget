import { Scheduler } from '../core/scheduler';
import { createReaderStore, Store } from '../core/state';
import { parse } from '../core/parser';
import type { LaunchMode, ReaderState, ThemePreference } from '../core/types';
import { DEFAULT_CONFIG, WPM_MAX, WPM_MIN } from '../core/types';
import { buildTemplate } from './template';
import { applyTheme, persistThemeChoice, readPersistedTheme, watchSystemTheme } from '../theme/theme';
import { mountWordDisplay } from '../ui/WordDisplay';
import { mountControls } from '../ui/Controls';
import { mountOverlay } from '../ui/Overlay';
import { mountKeyboard } from '../a11y/keyboard';
import { mountLiveRegion } from '../a11y/live-region';
import { t, setLocale } from '../i18n';
import { reportError } from '../observability/errors';

const ATTR = {
  TEXT: 'text',
  SOURCE: 'source-selector',
  WPM: 'wpm',
  THEME: 'theme',
  MODE: 'mode',
  LANG: 'lang',
} as const;

export class RsvpReader extends HTMLElement {
  static get observedAttributes(): string[] {
    return [ATTR.TEXT, ATTR.SOURCE, ATTR.WPM, ATTR.THEME, ATTR.MODE, ATTR.LANG];
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

    const persistedTheme = readPersistedTheme();
    const themeAttr = (this.getAttribute(ATTR.THEME) as ThemePreference | null);
    const initialTheme: ThemePreference = persistedTheme ?? themeAttr ?? DEFAULT_CONFIG.theme;

    const wpm = clampWpm(parseInt(this.getAttribute(ATTR.WPM) ?? '', 10) || DEFAULT_CONFIG.wpm);

    this.store = createReaderStore({ wpm, theme: initialTheme });
    this.scheduler = new Scheduler(this.store);

    setLocale(this.getAttribute(ATTR.LANG) ?? DEFAULT_CONFIG.lang);

    applyTheme(this, initialTheme);
    this.setAttribute('data-mode', this.getAttribute(ATTR.MODE) ?? DEFAULT_CONFIG.mode);

    // System theme watcher only matters for 'auto'
    this.teardown.push(
      watchSystemTheme(() => {
        if (this.store.get().theme === 'auto') applyTheme(this, 'auto');
      }),
    );

    // Theme subscription
    this.teardown.push(
      this.store.subscribe((next, prev) => {
        if (next.theme !== prev.theme) {
          applyTheme(this, next.theme);
          persistThemeChoice(next.theme);
        }
      }),
    );

    // Mount UI pieces
    this.teardown.push(mountWordDisplay(this.root, this.store));
    this.teardown.push(mountControls(this.root, this.store, this.scheduler, () => this.exit()));
    this.teardown.push(mountLiveRegion(this.root, this.store));
    this.teardown.push(mountKeyboard(this, this.store, this.scheduler, () => this.exit()));

    if ((this.getAttribute(ATTR.MODE) ?? DEFAULT_CONFIG.mode) === 'overlay') {
      this.teardown.push(mountOverlay(this, this.root, () => this.exit()));
    }

    // Status + empty state rendering
    this.teardown.push(this.store.subscribe(() => this.renderStates()));

    this.loadTextFromAttributes();
  }

  disconnectedCallback(): void {
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
        break;
      }
      case ATTR.TEXT:
      case ATTR.SOURCE:
        this.loadTextFromAttributes();
        break;
      case ATTR.LANG:
        setLocale(newValue ?? DEFAULT_CONFIG.lang);
        break;
    }
  }

  /** Public API: imperatively set the text to read */
  setText(text: string): void {
    const parsed = parse(text);
    this.scheduler.setWords(parsed.words);
    this.renderStates();
  }

  /** Public API: start playback */
  play(): void { this.scheduler.play(); }

  /** Public API: pause playback */
  pause(): void { this.scheduler.pause(); }

  /** Public API: close / hide the reader */
  exit(): void {
    this.scheduler.pause();
    this.dispatchEvent(new CustomEvent('rsvp:exit', { bubbles: true, composed: true }));
    if (!this.hasAttribute('persistent')) this.remove();
  }

  private loadTextFromAttributes(): void {
    const explicit = this.getAttribute(ATTR.TEXT);
    if (explicit && explicit.trim()) {
      this.setText(explicit);
      return;
    }
    const selector = this.getAttribute(ATTR.SOURCE);
    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        const parsed = parse(el);
        this.scheduler.setWords(parsed.words);
        this.renderStates();
        return;
      }
    }
    // No text yet — leave empty state until setText() is called
    this.renderStates();
  }

  private renderStates(): void {
    const empty = this.root.querySelector('[data-state="empty"]') as HTMLElement | null;
    const done = this.root.querySelector('[data-state="done"]') as HTMLElement | null;
    const stage = this.root.querySelector('.stage') as HTMLElement | null;
    if (!empty || !done || !stage) return;

    const state = this.store.get();
    const isEmpty = state.totalWords === 0;
    const isDone = state.status === 'done';

    empty.hidden = !isEmpty;
    done.hidden = !isDone;
    stage.hidden = isEmpty || isDone;

    if (isEmpty) empty.textContent = t('state.empty');
    if (isDone) {
      done.innerHTML = '';
      const heading = document.createElement('strong');
      heading.textContent = t('state.done');
      const btn = document.createElement('button');
      btn.className = 'btn btn--primary';
      btn.type = 'button';
      btn.textContent = t('done.again');
      btn.addEventListener('click', () => {
        this.scheduler.restart();
        this.scheduler.play();
      });
      done.appendChild(heading);
      done.appendChild(btn);
    }
  }
}

function clampWpm(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_CONFIG.wpm;
  return Math.max(WPM_MIN, Math.min(WPM_MAX, n));
}

export function registerElement(): void {
  if (!customElements.get('rsvp-reader')) {
    customElements.define('rsvp-reader', RsvpReader);
  }
}
