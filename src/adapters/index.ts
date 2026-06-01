import { ghostAdapter } from './ghost';
import { substackAdapter } from './substack';
import { wordpressAdapter } from './wordpress';
import { genericAdapter } from './generic';
import type { CmsAdapter } from './adapter.types';

// Order matters: Substack must run before WordPress because both set
// `body.single-post`. Generic is always last as the catch-all fallback.
export const adapters: CmsAdapter[] = [
  ghostAdapter,
  substackAdapter,
  wordpressAdapter,
  genericAdapter,
];

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
