import { tickDelayMs } from './parser';
import type { Store } from './state';
import type { ReaderState } from './types';
import { reportError } from '../observability/errors';

export class Scheduler {
  private timer: number | null = null;

  constructor(private store: Store<ReaderState>) {}

  private get words(): string[] {
    return this.store.get().words;
  }

  setWords(words: string[]): void {
    this.pause();
    this.store.set({ idx: 0, totalWords: words.length, status: 'idle', words });
  }

  play(): void {
    const { status, totalWords } = this.store.get();
    if (status === 'playing' || status === 'countdown' || totalWords === 0) return;
    if (status === 'done') this.store.set({ idx: 0 });
    this.store.set({ status: 'playing' });
    this.scheduleNext();
  }

  pause(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.store.get().status === 'playing') {
      this.store.set({ status: 'paused' });
    }
  }

  toggle(): void {
    this.store.get().status === 'playing' ? this.pause() : this.play();
  }

  restart(): void {
    this.pause();
    this.store.set({ idx: 0, status: 'idle' });
  }

  setWpm(wpm: number): void {
    this.store.set({ wpm });
  }

  seek(idx: number): void {
    const { totalWords } = this.store.get();
    const clamped = Math.max(0, Math.min(idx, totalWords - 1));
    this.store.set({ idx: clamped });
  }

  destroy(): void {
    this.pause();
  }

  private scheduleNext(): void {
    const { idx, wpm } = this.store.get();
    const words = this.words;
    if (idx >= words.length) {
      this.store.set({ status: 'done' });
      return;
    }
    const word = words[idx];
    const baseMs = 60000 / Math.max(60, wpm);
    const delay = tickDelayMs(word, baseMs);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      try {
        const state = this.store.get();
        if (state.status !== 'playing') return;
        const nextIdx = state.idx + 1;
        if (nextIdx >= state.words.length) {
          this.store.set({ idx: state.idx, status: 'done' });
          return;
        }
        this.store.set({ idx: nextIdx });
        this.scheduleNext();
      } catch (err) {
        // An async error here would otherwise be invisible — surface it
        // and stop ticking instead of looping into a broken state.
        reportError(err, 'scheduler-tick');
        this.store.set({ status: 'paused' });
      }
    }, delay);
  }
}
