# Mobile UI overhaul and iOS countdown fix

Reduce mobile UI clutter with an immersive full-viewport layout, a settings panel (replacing the theme toggle), and fixes for the iOS Safari countdown bug.

## Status (updated after code-quality refactor)

| Task | Status |
|---|---|
| Fix countdown (iOS Safari) | done |
| Prefs infrastructure | done — single `rsvp-reader:prefs` blob via `appearance-sync.ts` |
| Settings panel | done — Light / Dark / Auto theme, font, font size |
| Mobile immersive layout | done — `presentation.ts` sets `data-mobile-immersive` |
| Overlay mode (focus trap, inert, backdrop) | done — consolidated in `presentation.ts` |
| Toolbar auto-hide (YouTube-style) | **deferred** — not implemented; `alwaysShowToolbar` removed from state |
| Optional Fullscreen API in settings | deferred |
| Mobile Playwright tests | done — `iphone` project in `playwright.config.ts` |

---

## Architecture (current)

Presentation is owned by **`src/ui/presentation.ts`** (replaces the former `immersive.ts` + `Overlay.ts` split):

- Portal sync via `portal.ts` (`needsPortal`, `syncReaderMount`)
- Backdrop visibility and dismiss
- Focus trap + page inert (all `body` children except `#rsvp-portal-root`)
- Mobile immersive attributes and resize listeners

UI chrome is mounted via **`src/component/mount-reader-chrome.ts`** from `RsvpReader.ts`.

Styles live under **`src/component/styles/`**:

- `layout.css` — host, stage, word display, meta, progress
- `toolbar.css` — toolbars, control items, desktop hover hints
- `settings.css` — settings panel and segmented controls
- `presentation.css` — overlay, mobile immersive, expanded, responsive

---

## 1. Fullscreen investigation (mobile)

**Finding:** The native Fullscreen API is unreliable for custom elements on iOS Safari. CSS immersive mode is the primary approach.

**Decision:** Both inline and overlay modes auto-enter CSS immersive on mobile (`pointer: coarse` or `max-width: 480px`). Desktop expanded mode uses CSS viewport expansion (`data-expanded`), not the browser Fullscreen API.

**Files:** `src/ui/presentation.ts`, `src/component/styles/presentation.css`.

---

## 2. Settings button (replaces theme toggle)

Gear button in `top-right` slot opens the settings panel. Theme cycling toggle removed.

**Files:** `src/ui/Controls.ts`, `src/ui/SettingsPanel.ts`, `src/ui/icons.ts`, `src/i18n.ts`.

---

## 3. Settings panel

Popover/sheet with segmented controls:

| Setting | Options | Wiring |
|---|---|---|
| Theme | Light / Dark / Auto | `store.set({ theme })` → `appearance-sync.ts` applies DOM + persists |
| Font | Sans / Serif / Mono / Dyslexic | `store.set({ font })` |
| Font size | S / M / L | `store.set({ fontSize })` |

**Persistence:** `src/utils/prefs.ts` — `{ theme, font, fontSize }` in `rsvp-reader:prefs`. Legacy `rsvp-reader:theme` key migrated on read.

---

## 4. Toolbar auto-hide (deferred)

Originally planned as `ToolbarVisibility.ts` with `alwaysShowToolbar` pref. **Not shipped.** The pref and state field were removed during the code-quality refactor. Mobile toolbar remains visible during playback (verified by `mobile-toolbar.spec.ts`).

Revisit as a separate feature if YouTube-style hide/show is still desired.

---

## 5. iOS Safari countdown bug

Fixes in place:

- Overlay countdown with absolute positioning and z-index
- Minimum 800ms per countdown step (including reduced motion)
- `requestAnimationFrame` time-based loop in `playback.ts`
- Single play entrypoint via `reader-commands.ts` / `requestPlayback()`
- Per-reader countdown cancel via `WeakMap` (not a global singleton)

---

## 6. Tests

| Test file | Coverage |
|---|---|
| `tests/e2e/countdown.spec.ts` | iPhone viewport; countdown visible; reduced-motion |
| `tests/e2e/settings.spec.ts` | Panel, font/theme/size prefs, persistence |
| `tests/e2e/mobile-toolbar.spec.ts` | Mobile toolbar visible on load and during playback |
| `playwright.config.ts` | `chromium` + `iphone` (WebKit) projects |

Run `npx playwright install` after clone (Chromium + WebKit).

---

## Implementation order (historical)

1. Countdown bug fix
2. Prefs + settings panel
3. Mobile immersive + overlay via `presentation.ts`
4. Code-quality refactor (presentation consolidation, prefs pipeline, reader commands)
5. Tests + WebKit project
