import type { ReaderState } from './types';

type Listener<T> = (state: T, prev: T) => void;

export class Store<T extends object> {
  private state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.state = initial;
  }

  get(): Readonly<T> {
    return this.state;
  }

  set(partial: Partial<T>): void {
    const prev = this.state;
    const next = { ...prev, ...partial };
    if (shallowEqual(prev, next)) return;
    this.state = next;
    for (const listener of this.listeners) listener(next, prev);
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function shallowEqual<T extends object>(a: T, b: T): boolean {
  for (const key in a) if (a[key] !== b[key]) return false;
  for (const key in b) if (a[key] !== b[key]) return false;
  return true;
}

export function createReaderStore(initial: Partial<ReaderState> = {}): Store<ReaderState> {
  return new Store<ReaderState>({
    idx: 0,
    wpm: 300,
    status: 'idle',
    countdown: null,
    theme: 'auto',
    totalWords: 0,
    words: [],
    ...initial,
  });
}

/** Seconds left at current WPM (recomputed on every idx/wpm change). */
export function secondsRemaining(state: ReaderState): number | null {
  if (state.totalWords === 0) return null;
  if (state.status === 'done') return 0;
  const wordsLeft = state.totalWords - state.idx;
  return (wordsLeft / state.wpm) * 60;
}

/** Seconds elapsed for words completed before the current index. */
export function secondsElapsed(state: ReaderState): number | null {
  if (state.totalWords === 0) return null;
  return (state.idx / state.wpm) * 60;
}
