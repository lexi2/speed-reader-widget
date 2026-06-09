/** Formats seconds as m:ss or h:mm:ss. Null renders the empty-state placeholder. */
export function formatTime(totalSeconds: number | null): string {
  if (totalSeconds === null) return '—:—';
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

/** Human-readable duration for screen-reader announcements. */
export function formatTimeAccessible(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m > 0) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (sec > 0 || parts.length === 0) parts.push(`${sec} second${sec === 1 ? '' : 's'}`);
  return parts.join(' ');
}
