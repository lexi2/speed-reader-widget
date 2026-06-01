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
    theme: 'auto',
    totalWords: 0,
    words: [],
    ...initial,
  });
}
