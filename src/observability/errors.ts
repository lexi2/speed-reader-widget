/**
 * Error observability hook.
 *
 * The widget emits `rsvp:error` CustomEvents on `document` whenever something
 * recoverable goes wrong. Hosts wire these to Sentry / Rollbar / Bugsnag /
 * their own endpoint with a few lines of code. We deliberately do NOT bundle
 * a specific error reporter so the base bundle stays small and customers can
 * use whatever they already have configured site-wide.
 *
 * Detail shape:
 *   { error: unknown, context: string, version: string, widget: 'rsvp-reader' }
 */

const WIDGET_VERSION = '0.3.0';

export interface RsvpErrorDetail {
  widget: 'rsvp-reader';
  version: string;
  context: string;
  error: unknown;
}

export function reportError(error: unknown, context: string): void {
  // Always log so a developer sees it in the console
  if (typeof console !== 'undefined') {
    console.warn(`[rsvp-reader:${context}]`, error);
  }
  if (typeof document === 'undefined') return;
  try {
    const detail: RsvpErrorDetail = {
      widget: 'rsvp-reader',
      version: WIDGET_VERSION,
      context,
      error,
    };
    document.dispatchEvent(new CustomEvent('rsvp:error', { detail, bubbles: false }));
  } catch {
    /* never let error reporting itself throw */
  }
}

/**
 * Wraps a synchronous function so any thrown error is reported and the
 * original return value (or a fallback) is yielded.
 */
export function guard<T>(context: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (err) {
    reportError(err, context);
    return fallback;
  }
}
