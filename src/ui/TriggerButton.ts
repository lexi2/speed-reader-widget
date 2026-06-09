import { icons } from './icons';
import { t } from '../i18n';
import type { RsvpConfig } from '../core/types';
import type { RsvpReader } from '../component/RsvpReader';

/**
 * Builds the "Read faster" call-to-action and inserts it above the article.
 * On click, instantiates an <rsvp-reader> either inline or as overlay.
 */
export function buildTrigger(
  article: Element,
  config: RsvpConfig,
  insertion: { parent: Element; before: Element | null },
): HTMLButtonElement {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'rsvp-reader-trigger';
  trigger.setAttribute('data-rsvp-trigger', '');
  trigger.setAttribute('aria-label', t('trigger.label'));
  trigger.innerHTML = `${icons.play}<span>${escapeHtml(t('trigger.label'))}</span>`;

  injectTriggerStyles();

  trigger.addEventListener('click', () => openReader(article, trigger, config));

  if (config.position === 'after') {
    insertion.parent.appendChild(trigger);
  } else {
    insertion.parent.insertBefore(trigger, insertion.before);
  }

  return trigger;
}

function openReader(article: Element, trigger: HTMLButtonElement, config: RsvpConfig): void {
  const existing = document.querySelector('rsvp-reader[data-rsvp-auto]');
  if (existing) {
    existing.remove();
    return;
  }

  const reader = document.createElement('rsvp-reader') as RsvpReader;
  reader.setAttribute('data-rsvp-auto', '');
  reader.setAttribute('wpm', String(config.wpm));
  reader.setAttribute('theme', config.theme);
  reader.setAttribute('mode', config.mode);
  reader.setAttribute('lang', config.lang);
  if (config.accent) reader.setAttribute('accent', config.accent);
  if (config.font !== 'sans') reader.setAttribute('font', config.font);

  if (config.mode === 'overlay') {
    document.body.appendChild(reader);
  } else {
    trigger.insertAdjacentElement('afterend', reader);
  }

  // Hand off the article *element* (not its textContent) so the parser can
  // run its full strip pass — buttons, custom elements (ad slots), hidden
  // subtrees, scripts, etc. Calling setText with the string textContent
  // would smuggle all of that straight into the word stream.
  requestAnimationFrame(() => {
    if (typeof reader.setText === 'function') {
      reader.setText(article);
    } else {
      reader.setAttribute('source-selector', getSelector(article));
    }
  });

  reader.addEventListener('rsvp:exit', () => trigger.focus(), { once: true });
}

function getSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  // Best-effort selector for the auto-detected article
  const tag = el.tagName.toLowerCase();
  const cls = Array.from(el.classList).slice(0, 2).map(c => `.${c}`).join('');
  return `${tag}${cls}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

let stylesInjected = false;
function injectTriggerStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-rsvp-trigger-style', '');
  style.textContent = `
.rsvp-reader-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.5rem;
  padding: 0.625rem 1rem;
  font: 500 0.95rem/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: white;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 120ms ease, transform 120ms ease;
  min-height: 44px;
}
.rsvp-reader-trigger:hover { filter: brightness(1.08); }
.rsvp-reader-trigger:active { transform: scale(0.98); }
.rsvp-reader-trigger:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.rsvp-reader-trigger svg { width: 16px; height: 16px; }
@media (prefers-color-scheme: dark) {
  .rsvp-reader-trigger { background: #60a5fa; border-color: #60a5fa; color: #0a0a0b; }
}
@media (prefers-reduced-motion: reduce) {
  .rsvp-reader-trigger { transition: none; }
}
`;
  document.head.appendChild(style);
}
