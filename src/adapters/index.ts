import { ghostAdapter } from './ghost';
import { wordpressAdapter } from './wordpress';
import { genericAdapter } from './generic';
import type { CmsAdapter } from './adapter.types';

export const adapters: CmsAdapter[] = [ghostAdapter, wordpressAdapter, genericAdapter];

export function pickAdapter(): CmsAdapter | null {
  for (const a of adapters) {
    try {
      if (a.matches()) return a;
    } catch {
      /* defensive: never let an adapter throw kill auto-install */
    }
  }
  return null;
}

export type { CmsAdapter } from './adapter.types';
