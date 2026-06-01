export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: number | null = null;
  return (...args: A) => {
    if (timer !== null) clearTimeout(timer);
    timer = window.setTimeout(() => { timer = null; fn(...args); }, ms);
  };
}
