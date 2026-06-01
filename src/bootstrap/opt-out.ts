export function isOptedOut(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.RSVP_READER_DISABLED === true) return true;

  const meta = document.querySelector('meta[name="rsvp-reader"]');
  if (meta?.getAttribute('content')?.trim().toLowerCase() === 'off') return true;

  if (document.documentElement.getAttribute('data-rsvp-reader') === 'off') return true;
  if (document.body?.classList.contains('no-rsvp-reader')) return true;

  return false;
}

export function existingReaderOnPage(): boolean {
  return Boolean(document.querySelector('rsvp-reader'));
}
