# RSVP Reader Widget — Architecture & Build Plan

## Context

The `speedRead/` repo is currently empty. We are building from scratch a Rapid Serial Visual Presentation (RSVP) reader widget per the supplied PRD. The widget displays article text one word at a time at a user-adjustable WPM, runs inside an article on a CMS page (WordPress, Ghost Pro, plain HTML), and must:

- Be **drop-in embeddable** via a single `<script>` tag plus a custom HTML tag.
- **Not conflict** with any host page CSS or JS.
- Stay under **30 KB gzipped** total.
- **Work offline** after first load.
- Hit **WCAG AA** with full keyboard nav, `aria-live`, contrast, and `prefers-reduced-motion` support.
- Have **no runtime dependencies** in the core bundle.

These constraints make the framework choice essentially forced: a **Vanilla TypeScript Web Component with Shadow DOM**, built by **Vite**, with a small **Service Worker** for offline. React would burn ~40 KB of the 30 KB budget on runtime alone and offers nothing the embed story needs. CSS is scoped automatically by Shadow DOM, eliminating the "must not conflict with host styles" risk for free.

Decisions locked in for this plan:
- **Embed model:** **Single-script auto-install.** Site owner adds one `<script src="https://cdn.example.com/rsvp-reader.js" defer></script>` to their Ghost theme (or WordPress equivalent) — typically the `default.hbs` / `footer.php`. The script self-detects single-post pages, locates the article body, and injects the "Read Faster" trigger above it. **Zero per-post markup required.** This matches how Disqus, ConvertKit, and similar embeds work, and is the only model that satisfies "show on all posts without anything added to individual posts".
- **Override path:** A site owner who wants explicit control can still drop `<rsvp-reader text="..." />` on a specific page; if any `<rsvp-reader>` element is found on the page, auto-injection is skipped and the explicit element wins. Cheap to support and avoids edge cases.
- **Framework:** Vanilla TS + Web Component + Shadow DOM. No React wrapper in v1. (Alternatives considered: Lit, Stencil, Preact, React-first, vanilla+wrapper — vanilla wins on the "broad embeddability + <30KB + zero host conflict" trifecta. Stencil is the documented upgrade path if multi-framework wrappers become a v2 requirement.)
- **Text source:** Auto-extracted from the detected article body. Explicit `text` attribute also supported on the manual `<rsvp-reader>` element for the override path.
- **Launch mode:** Attribute-controlled, `mode="inline" | "overlay"`. `inline` is the default for auto-injection (trigger button inline, widget opens inline below it); `overlay` opens a focused modal. Site owner can switch via `data-mode` on the script tag.
- **PR scope:** PR 1 ships the **end-to-end single-script embed**: core RSVP engine, controls, theming, a11y, auto-injection, trigger button, and one CMS adapter (Ghost). PR 2 adds Service Worker offline + WordPress/generic adapter polish + bundle-size CI.
- **Build:** Vite + TypeScript, single-file ESM + IIFE output.
- **i18n:** Strings centralised in one `i18n.ts` module so v1 ships en-US but locale swap is a one-line change. No full i18n framework.

---

## Proposed File / Component Structure

```
speedRead/
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Library build: ESM + IIFE, no externals, terser
├── .gitignore
├── README.md                      # Embed instructions for site owners (one <script> tag)
├── index.html                     # Dev harness — simulates a Ghost post page
├── public/
│   ├── ghost-post-fixture.html    # Realistic Ghost post DOM for manual QA
│   ├── wordpress-post-fixture.html
│   └── generic-article-fixture.html
├── src/
│   ├── index.ts                   # Entry: bootstraps auto-install, registers <rsvp-reader>
│   ├── bootstrap/
│   │   ├── auto-install.ts        # Runs on DOMContentLoaded; orchestrates detect → inject
│   │   ├── script-config.ts       # Reads data-* attrs from the host <script> tag
│   │   └── opt-out.ts             # Honors <meta name="rsvp-reader" content="off"> and body classes
│   ├── adapters/
│   │   ├── index.ts               # Adapter registry; picks first matching adapter
│   │   ├── ghost.ts               # Ghost CMS adapter (PR 1 primary target)
│   │   ├── wordpress.ts           # WordPress adapter (basic in PR 1, polished PR 2)
│   │   ├── generic.ts             # Fallback: <article>, <main>, schema.org Article
│   │   └── adapter.types.ts       # interface CmsAdapter { matches(): boolean; findArticle(): Element | null; insertionPoint(article): Element }
│   ├── component/
│   │   ├── RsvpReader.ts          # The HTMLElement subclass — lifecycle, attrs, shadow root
│   │   ├── template.ts            # Static HTML template string for the shadow root
│   │   └── styles.css             # Imported as raw string; scoped inside shadow root
│   ├── core/
│   │   ├── parser.ts              # Pure: DOM/string → string[] of words
│   │   ├── scheduler.ts           # Pure: WPM → tick interval; emits "advance" events
│   │   ├── state.ts               # Tiny event-emitter store (idx, wpm, theme, status)
│   │   └── types.ts               # Shared type definitions
│   ├── ui/
│   │   ├── WordDisplay.ts         # Reads state, renders current word w/ ORP highlight
│   │   ├── Controls.ts            # Play/Pause, ±WPM, Restart, Exit, Theme buttons
│   │   ├── TriggerButton.ts       # "Read Faster" CTA — built by auto-install, injected above article
│   │   ├── Overlay.ts             # Modal wrapper for mode="overlay" (focus-trap, inert, Esc)
│   │   └── icons.ts               # Inline SVG strings (no icon font dep)
│   ├── theme/
│   │   ├── theme.ts               # Apply/toggle light/dark/auto; reads prefers-color-scheme
│   │   └── tokens.css             # CSS custom properties (colors, spacing, fonts)
│   ├── a11y/
│   │   ├── keyboard.ts            # Key handler: Space=play/pause, ←/→=±WPM, R, Esc
│   │   └── live-region.ts         # aria-live="polite" announcement helper
│   ├── i18n.ts                    # { en: { play: "Play", ... } }; one export: t(key)
│   ├── offline/
│   │   └── sw.ts                  # Service Worker: cache-first (PR 2)
│   └── utils/
│       ├── debounce.ts
│       └── safe-storage.ts        # localStorage wrapper that no-ops in private mode
└── tests/
    └── manual-test-plan.md        # Step-by-step QA script across all three fixtures
```

### Responsibility of each major piece

| File / module | Responsibility | Talks to |
|---|---|---|
| `src/index.ts` | Entry point. Registers `<rsvp-reader>` as a custom element and triggers auto-install. The single file site owners reference via `<script src="...">`. | `bootstrap/auto-install`, `component/RsvpReader` |
| `bootstrap/auto-install.ts` | On `DOMContentLoaded`: (1) check opt-out; (2) check if `<rsvp-reader>` already exists on page — if so, skip auto-install; (3) iterate adapters, find first match; (4) call `adapter.findArticle()` — bail if null; (5) create `<rsvp-reader>` with detected text, append it to `adapter.insertionPoint()`. | `script-config`, `opt-out`, `adapters/index`, `component/RsvpReader` |
| `bootstrap/script-config.ts` | Reads configuration from the host `<script>` tag's `data-*` attributes: `data-wpm`, `data-theme`, `data-mode`, `data-source-selector`. Returns a typed `Config` object with defaults. | — |
| `bootstrap/opt-out.ts` | Returns `true` if any of: `<meta name="rsvp-reader" content="off">`, `<html data-rsvp-reader="off">`, body class `no-rsvp-reader`, or `window.RSVP_READER_DISABLED === true`. Lets site owners suppress per-page. | — |
| `adapters/adapter.types.ts` | `interface CmsAdapter { name: string; matches(): boolean; findArticle(): Element \| null; insertionPoint(article: Element): Element; }`. `matches` decides if this adapter applies; `findArticle` returns the article body element; `insertionPoint` returns where to place the trigger button (usually article itself, so trigger gets prepended). | — |
| `adapters/ghost.ts` | **Primary PR 1 target.** Matches: `<meta name="generator" content^="Ghost">` OR `body.post-template` OR `body.gh-canvas`. Finds article via `.gh-content`, `.post-content`, `article.gh-article`, in that order. Skips homepage/tag/archive pages (no `body.post-template`). | — |
| `adapters/wordpress.ts` | Matches: `<meta name="generator" content^="WordPress">` OR `body.single-post` OR `body.single`. Finds article via `.entry-content`, `article.post .post-content`, `<article>` inside `<main>`. Skips archive/category/home. | — |
| `adapters/generic.ts` | Always matches (fallback). Finds first of: `<main> article`, `<article>`, `[itemtype*="schema.org/Article"] [itemprop="articleBody"]`, `[role="main"]`. Requires the candidate to contain >100 words to avoid grabbing card teasers. | — |
| `adapters/index.ts` | Ordered registry: `[ghost, wordpress, generic]`. Iterates `matches()` calls; returns first hit. | All adapters |
| `component/RsvpReader.ts` | The custom element. Owns the shadow root, observes attributes (`text`, `source-selector`, `wpm`, `theme`), wires `core` + `ui` + `a11y` modules together, manages mount/unmount. **Thin orchestrator only — no business logic.** | All `core/`, `ui/`, `theme/`, `a11y/` modules |
| `component/template.ts` | Returns the static HTML scaffold inserted into the shadow root on connect. Plain template string. | — |
| `component/styles.css` | All visual styling. Imported as raw text and injected into the shadow root in a single `<style>` tag. Uses CSS custom properties from `theme/tokens.css`. | `theme/tokens.css` |
| `core/parser.ts` | **Pure function.** Accepts either a string or a DOM node. Strips `<script>`, `<style>`, `<code>`, `<pre>`, `<nav>`, `<aside>`. Collapses whitespace, splits on word boundaries, preserves sentence-end pauses by emitting empty entries (so the scheduler can pause longer at `.`, `?`, `!`). Returns `{ words: string[], wordCount: number }`. | — |
| `core/scheduler.ts` | Owns the timer loop. Given a WPM and a callback, ticks at `60000/wpm` ms. Exposes `play()`, `pause()`, `setWpm()`, `seek(idx)`. Reacts to `prefers-reduced-motion` by disabling transitions (not by slowing reading). | `state` |
| `core/state.ts` | Tiny pub/sub store. Single source of truth for `{ idx, wpm, status: 'idle'\|'playing'\|'paused'\|'done', theme }`. All UI subscribes. Avoids reactive-framework overhead while keeping render logic predictable. | — |
| `ui/WordDisplay.ts` | Subscribes to `state.idx`. Renders the current word with the **Optimal Recognition Point** letter highlighted (gives the eye a fixation anchor — small UX win for RSVP). Uses `aria-live="polite"` on a sibling live region; the visible word itself is `aria-hidden` to avoid screen-reader spam (see `a11y/live-region.ts`). | `state`, `a11y/live-region` |
| `ui/Controls.ts` | Renders the button row. Each button is a real `<button>` with `aria-label` from `i18n`. Touch-target ≥44×44px. Dispatches actions to `state`/`scheduler`. | `state`, `scheduler`, `theme`, `i18n` |
| `ui/TriggerButton.ts` | The "Read Faster" CTA. Built and inserted by `bootstrap/auto-install.ts` above the detected article body. Single button (not a custom element) — keeps the auto-injection path simple. On click, instantiates `<rsvp-reader>` either inline below itself or in an overlay, based on `data-mode`. | `RsvpReader`, `Overlay`, `i18n` |
| `ui/Overlay.ts` | Focused-modal wrapper for `mode="overlay"`. Handles focus-trap, sets `inert` on siblings of body, Esc to close, restores focus to the trigger on close. Backdrop respects `prefers-reduced-motion`. | — |
| `theme/theme.ts` | Resolves `theme` attribute: `light` / `dark` / `auto` (default). Listens to `prefers-color-scheme`. Toggles a `data-theme` attribute on the shadow root host. Persists the user's manual toggle in `safe-storage`. | `state`, `safe-storage` |
| `theme/tokens.css` | Defines `--rsvp-bg`, `--rsvp-fg`, `--rsvp-accent`, `--rsvp-orp-color`, font stack, spacing scale. Light + dark variants via `[data-theme="dark"]` selector. Host page can override any token from outside the shadow root by setting the var on `rsvp-reader { --rsvp-accent: ... }` — this is the documented theming API for site owners. | — |
| `a11y/keyboard.ts` | Single keyboard handler attached to the host element. Maps Space → play/pause, ←/→ → WPM ±25, R → restart, Esc → exit. Documented in the controls' `aria-keyshortcuts`. | `state`, `scheduler` |
| `a11y/live-region.ts` | Throttled announcer. RSVP at 300 WPM is 5 words/sec — announcing every word would flood AT. Instead, announce sentences as they complete, and announce state changes ("paused", "350 words per minute", "finished"). | — |
| `i18n.ts` | One default export `t(key, locale?)`. Bundle ships `en` only; alternate locales loaded by attribute (`lang="es"`) read at connect time. Tiny, no framework. | — |
| `offline/sw.ts` | Cache-first service worker scoped to the widget's asset path. Registered lazily after first successful render so it never blocks first paint. Versioned cache name so updates invalidate cleanly. | — |
| `utils/safe-storage.ts` | `get`/`set` wrappers that swallow `QuotaExceeded` / Safari private mode errors. Used by theme persistence and remembered WPM. | — |

### Why this split?

- **`core/` is pure and framework-free** — fully unit-testable, no DOM in `parser`/`scheduler`/`state`. If we ever do ship a React wrapper, it reuses `core/` verbatim.
- **`ui/` is presentation only**, subscribing to `state`. Easy to restyle or swap.
- **`component/RsvpReader.ts` is the only thing that touches custom-element lifecycle.** Keeps the Web Component plumbing in one place.
- **`a11y/` is a first-class folder, not scattered comments.** Reflects PRD's accessibility priority and makes audits easy.
- **`offline/` is isolated** so the SW can be removed or swapped (e.g., for a host-controlled SW) without touching widget code.

---

## Embed API

### Primary path — single-script auto-install (what 99% of site owners use)

In Ghost: add this once to `default.hbs` (or paste into Code Injection → Site Footer). In WordPress: add to the footer template once. Done — the widget now appears on every post automatically.

```html
<script
  src="https://cdn.example.com/rsvp-reader.js"
  data-wpm="300"
  data-theme="auto"
  data-mode="inline"
  defer
></script>
```

| `data-*` attribute | Default | Purpose |
|---|---|---|
| `data-wpm` | `300` | Initial reading speed |
| `data-theme` | `auto` | `light` \| `dark` \| `auto` |
| `data-mode` | `inline` | `inline` (renders below trigger) \| `overlay` (focused modal) |
| `data-source-selector` | _adapter-chosen_ | Override the auto-detected article selector |
| `data-position` | `before` | `before` \| `after` — where the trigger sits relative to the article |

### Per-page opt-out
Any one of these suppresses the widget on a specific page:
```html
<meta name="rsvp-reader" content="off">
<html data-rsvp-reader="off">
<body class="no-rsvp-reader">
```

### Override path — manual placement (rare, power users)
Drop a `<rsvp-reader>` element anywhere on a page. Its presence disables auto-injection for that page entirely.

```html
<rsvp-reader text="Lorem ipsum..." wpm="250" theme="dark" mode="overlay"></rsvp-reader>
```

All attributes are observed and reactive. `wpm` and `theme` re-render live; `text` re-parses and resets.

---

## Implementation Phases (incremental, each independently shippable)

PR 1 must demonstrate the **end-to-end single-script promise**: paste one tag into a Ghost theme, every post automatically gets a working RSVP reader. So auto-install, the Ghost adapter, and the trigger button are all in scope.

**Phase A — Scaffolding** (one commit)
- `package.json` (no runtime deps; devDeps: `vite`, `typescript`)
- `vite.config.ts` configured for library build, IIFE + ESM, no externals, single-file output
- `tsconfig.json` strict mode
- `index.html` dev harness simulating a Ghost post page
- `.gitignore`

**Phase B — Core engine** (pure modules, no DOM)
- `core/types.ts`, `core/state.ts`, `core/parser.ts`, `core/scheduler.ts`
- `i18n.ts` with `en` strings

**Phase C — Web Component shell + theme**
- `theme/tokens.css`, `theme/theme.ts`
- `component/styles.css`, `component/template.ts`, `component/RsvpReader.ts`
- `src/index.ts` registers the element
- Shadow DOM rendering a static word display + theme toggle works end-to-end

**Phase D — UI: word display + controls + overlay**
- `ui/icons.ts`, `ui/WordDisplay.ts`, `ui/Controls.ts`, `ui/Overlay.ts`
- Wire Play/Pause/±WPM/Restart/Exit to `scheduler` + `state`
- ORP highlighting
- Overlay mode with focus-trap, `inert`, Esc-to-close

**Phase E — Accessibility**
- `a11y/live-region.ts`, `a11y/keyboard.ts`
- `aria-live`, `aria-label`, `aria-keyshortcuts`, focus management, reduced-motion handling
- Manual screen-reader spot-check (VoiceOver)

**Phase F — Auto-install pipeline** (the "single embed" promise)
- `adapters/adapter.types.ts`, `adapters/ghost.ts`, `adapters/wordpress.ts` (basic), `adapters/generic.ts`, `adapters/index.ts`
- `bootstrap/script-config.ts`, `bootstrap/opt-out.ts`, `bootstrap/auto-install.ts`
- `ui/TriggerButton.ts`
- Wire into `src/index.ts` so registration + auto-install happen on script load

**Phase G — Fixtures + manual test pass**
- `public/ghost-post-fixture.html`, `wordpress-post-fixture.html`, `generic-article-fixture.html`
- Walk through `tests/manual-test-plan.md` against each fixture
- Verify on a real Ghost demo site if accessible (or local Ghost via Docker)

**Phase H — Out of scope for PR 1, queued for PR 2**
- `offline/sw.ts` (Service Worker registration + cache-first strategy)
- WordPress adapter polish (Gutenberg vs Classic vs custom themes)
- Bundle-size CI check (`vite build && gzip-size dist/rsvp-reader.iife.js`)
- Sentry error monitoring hook
- Additional CMS adapters (Substack, Medium-style)

---

## Verification

**Bundle size budget**
```bash
npm run build
gzip -c dist/rsvp-reader.iife.js | wc -c   # must be < 30720
```

**Manual functional test plan** (`tests/manual-test-plan.md`)

_Auto-install (the "single embed" path):_
1. Open `public/ghost-post-fixture.html` via `npm run dev`. **Without any `<rsvp-reader>` tag in the markup**, a "Read Faster" trigger should auto-appear above the article body.
2. Open the homepage variant of the fixture (no `body.post-template`) — trigger must NOT appear (we only inject on single-post pages).
3. Repeat (1) with `wordpress-post-fixture.html` and `generic-article-fixture.html` — trigger appears in each, using the right adapter.
4. Add `<meta name="rsvp-reader" content="off">` to a fixture — trigger disappears.
5. Manually drop `<rsvp-reader text="hello world" />` on a page that would normally auto-inject — only the manual element renders, no double-injection.

_Core reader behavior:_
6. Click the trigger → reader opens. Click Play — words advance at 300 WPM. Toggle Pause; verify it stops on the current word.
7. Hit ←/→ — WPM steps by 25, rate visibly changes mid-playback. No timer drift.
8. R restarts from word 0. Esc collapses the reader (or closes overlay in overlay mode).
9. Toggle theme — Shadow DOM swaps `data-theme`; host page unaffected. Reload preserves choice.
10. Set `data-theme="auto"` on the script tag and toggle OS dark mode — widget follows within one paint.
11. Article with `<script>`, `<pre>`, `<code>`, `<nav>`, `<aside>` — those are stripped, only prose is read.
12. Set host page CSS `* { color: red !important }` — widget text is unaffected (Shadow DOM isolation).

_Overlay mode:_
13. Set `data-mode="overlay"`. Click trigger → modal opens, focus moves into it, Tab cycles inside, Esc closes, focus returns to trigger.

**Accessibility**
- Tab through every control — visible focus ring on each, logical order.
- Space toggles play; ←/→/R/Esc work without mouse.
- VoiceOver: state changes announced ("paused", "300 words per minute", "finished"); the rapidly-changing word is NOT announced word-by-word.
- Run axe DevTools — zero violations on the open widget.
- macOS System Preferences → Reduce Motion ON — word transitions become instant cuts; reading rate unchanged.

**Cross-host smoke test**
- Drop the built `dist/rsvp-reader.iife.js` into a Ghost theme footer (Code Injection → Site Footer), a WordPress footer.php, and a plain HTML page. All three should auto-detect the article body on single-post pages and inject the trigger without any additional markup.
- Critical Ghost behavior: should appear on `/some-post-slug/` URLs, NOT on `/`, `/tag/foo/`, `/author/bar/`.

**Offline (Phase G)**
- Load page once online, register SW, then DevTools → Network → Offline → reload. Widget still functions on cached text.

---

## Confirmed decisions

- **Single-script auto-install** is the primary embed model. Adapter-driven detection picks the right article body per CMS.
- Ghost is the **first-class CMS target**. WordPress and generic adapters ship in PR 1 as basic support and get polished in PR 2.
- Vanilla Web Component only for v1 (Stencil queued as v2 upgrade path if multi-framework wrappers needed).
- `mode="inline" | "overlay"`, both supported, inline default.
- TriggerButton ships in PR 1 (required for auto-install demo). Service Worker still deferred to PR 2.

---

## Deferred operational tasks (to do when user has time)

These are user-driven follow-ups that need credentials or browser actions and can't be completed from this CLI session yet:

- [ ] **Authenticate `gh` CLI** so future GitHub operations are scriptable from here:
  `gh auth login --hostname github.com --git-protocol https --web`
- [ ] **Enable GitHub Pages** at https://github.com/lexi2/speed-reader-widget/settings/pages — set Source to **"GitHub Actions"**. After `gh` is authenticated this becomes:
  `gh api -X POST /repos/lexi2/speed-reader-widget/pages -f build_type=workflow`
- [ ] **Verify the first CI run** completed green:
  `gh run list --workflow=ci.yml --limit 1` then `gh run view <id> --log` if it failed.
- [ ] **Verify the Pages workflow** ran and the demo is live at https://lexi2.github.io/speed-reader-widget/
- [ ] **Fill in the repo About sidebar** in the browser: description, website URL (the Pages URL above), and topics: `rsvp speed-reading widget web-components ghost-cms wordpress accessibility typescript embeddable shadow-dom`.

---

## PR 2 — current phase

Started after PR 1 was merged + deployed. The PRD's Service Worker / offline requirement is the marquee remaining P0 item; tackling it first.

Realistic architectural constraint discovered after PR 1:
- A Service Worker must be served from the **host site's origin**, not the widget's CDN, because SW scope is determined by the URL it loads from.
- This means the SW is necessarily **opt-in** for site owners (they upload one extra file).
- For site owners who don't enable the SW, the widget still works "offline after initial load" via the browser's HTTP cache with appropriate Cache-Control headers + immutable filename hashing.

PR 2 phases (in priority order):
- **Phase I — Cache-first ground:** filename hashing on the IIFE bundle so it can be cached immutably; documented Cache-Control headers; verify offline-after-first-load via DevTools. ✅ shipped in v0.2.0
- **Phase J — Service Worker:** ship `dist/rsvp-reader-sw.js` as a separate artifact, document the host-side registration snippet, register only if a SW file is detected at a known path. Tests cover the registration-failure no-op case. ⏸ repositioned as paid premium add-on in COMMERCIAL.md
- **Phase K — WordPress adapter polish:** Gutenberg block detection (`.wp-block-post-content`), Classic editor (`.entry-content`), common premium themes (Astra, GeneratePress), block themes (Twenty Twenty-Five-style). Real-fixture tests. ✅ shipped in v0.2.0
- **Phase L — Sentry error reporting hook:** opt-in via `data-sentry-dsn` on the script tag; lazy-loaded so it doesn't bloat the base bundle. Adds 0 KB to the default bundle. ✅ shipped as the `rsvp:error` CustomEvent hook in v0.2.0
- **Phase M — Additional adapters:** Substack, Medium-style, Jekyll/Hugo defaults. ✅ shipped in v0.2.0

---

## PR 3 — in progress (v0.3.0)

Three feature requests captured at the end of the v0.2.2 session, in priority order:

### Phase N — Countdown / elapsed timer in the meta line ✅

**Goal:** Surface the time dimension of the reading session so users can decide whether to commit to a piece. Two numbers: time remaining (live, decreases as you read) and time elapsed (counts up while playing, pauses with the reader).

**Approach:**
- Calculation lives in `core/state.ts` — derive `secondsRemaining = (totalWords - idx) / wpm * 60` and `secondsElapsed` (incremented by the scheduler tick, or computed from `idx / wpm * 60` if we want pure derivation without state).
- Render in `ui/WordDisplay.ts` next to the existing `data-meta="wpm"` and `data-meta="status"` spans — add `data-meta="time-remaining"` and `data-meta="time-elapsed"`.
- Format: `2:34` for under an hour, `1:02:15` past that. Single tiny helper in `utils/format-time.ts`.
- Updates only need to fire on idx change AND on wpm change (the two inputs). Already covered by the existing store subscription pattern.
- **Edge cases:** show `—:—` when totalWords === 0 (empty state); show `0:00` when done; recompute on every wpm change (don't precompute total at start).
- **Accessibility:** the timer is decorative for the reading-flow user, but include it inside the `aria-live` announcer when status changes ("Paused at 2 minutes 34 seconds remaining") so screen-reader users get the same information at the same moments.

**Files:** `core/state.ts`, `core/types.ts`, `ui/WordDisplay.ts`, `component/styles.css`, `utils/format-time.ts` (new), `i18n.ts` (new keys), plus a Playwright test that asserts the displayed remaining time decreases at a rate consistent with the WPM.

**Bundle impact estimate:** ~250 B gzipped.

### Phase O — Skip ±10 words ✅

**Goal:** Let users recover from missing a word or skim past a known section without restarting. Maps to common audiobook / podcast UX.

**Approach:**
- Two new buttons in `ui/Controls.ts` — `<<<10` and `10>>>` — inserted between the existing slower/faster controls and Restart. Use SVG icons that match the existing icon weight from `ui/icons.ts`.
- Wire to `scheduler.seek(idx ± 10)` — scheduler already has `seek` and it clamps to bounds, so this is essentially a one-liner per button.
- **Keyboard shortcuts:** `Shift+ArrowRight` skip +10, `Shift+ArrowLeft` skip -10. Update `a11y/keyboard.ts` and the existing `aria-keyshortcuts` attributes. Leave plain ← / → as the WPM step controls (don't break the existing muscle memory).
- **Touch targets:** buttons still ≥44×44px; the controls row may need to wrap on narrow viewports — verify on mobile fixture sizes.
- **Live region:** announce "skipped 10 words" / "skipped back 10 words" so AT users know the jump happened, otherwise the displayed word changes silently to them.

**Files:** `ui/Controls.ts`, `ui/icons.ts`, `a11y/keyboard.ts`, `a11y/live-region.ts`, `i18n.ts`, plus Playwright tests asserting (a) the buttons exist, (b) clicking them moves idx by exactly ±10, (c) clamping at 0 and totalWords-1, (d) keyboard shortcuts work.

**Bundle impact estimate:** ~300 B gzipped.

### Phase P — Theming options (sub-features 1–3 ✅, sub-feature 4 deferred)

**Goal:** Let site owners (and end users, in the overlay) customize the visual treatment beyond the existing light/dark/auto axis. Touches both the public CSS-variable contract (already documented) and a small in-widget settings UI.

**Sub-features, smallest first:**

1. **CSS custom property overrides — documentation pass only.** The existing `--rsvp-accent`, `--rsvp-bg`, `--rsvp-fg`, `--rsvp-orp`, `--rsvp-focus` already work from outside the Shadow DOM. Document the full token list and a few worked examples (warm neutrals, high-contrast, brand-matched accent) in README. Zero code change.

2. **`data-accent` script-tag attribute** — site-owner-set accent colour without writing CSS. Pipes through `bootstrap/script-config.ts` into a `--rsvp-accent` inline style on the host element. Requires contrast validation: if the chosen accent against white drops below WCAG AA 4.5:1, swap text colour to `--rsvp-on-accent` automatically. Logic lives in `theme/theme.ts`; the contrast helper from `tests/e2e/contrast.spec.ts` can move into the source as a tiny shared utility.

3. **Font-family choice** — `data-font="sans" | "serif" | "mono" | "dyslexic"` on the script tag. The `dyslexic` value swaps in a self-hostable dyslexia-friendly font; "Lexie Readable" or "Atkinson Hyperlegible" (both freely licensed) are the candidates. Loaded via `@font-face` from the same Pages/CDN host that serves the widget — keeps the embed self-contained. Document the per-token override path for site owners who want their own brand font.

4. **In-widget settings panel** (optional, gated behind `data-settings="on"`) — a small popover triggered from the existing theme button (long-press / right-click / dedicated gear icon TBD). Lets end users pick: theme (light/dark/auto), font (4 options), accent (3–5 preset swatches), font size (S/M/L). Choices persist to localStorage via `utils/safe-storage.ts`. **Decide before building:** is this in the free tier or a premium feature? Probably free for the basic four (theme/font/accent/size) and premium for per-publication custom presets.

**Approach notes:**
- Persistence: already have `safe-storage.ts`. Use one composite key `rsvp-reader:prefs` storing `{ theme, font, accent, fontSize }` as JSON.
- Site-owner config wins over end-user prefs unless the site owner sets `data-allow-user-prefs="on"`. Default is to allow user prefs (consumer-friendly), and let publications who want strict brand consistency opt out.
- Bundle the dyslexic font as a separate WOFF2 file, loaded only when `data-font="dyslexic"` is set. Lazy `@font-face` injection from `theme/theme.ts`.

**Files:** `theme/theme.ts`, `theme/tokens.css`, `bootstrap/script-config.ts`, `core/types.ts`, `ui/SettingsPanel.ts` (new), `utils/safe-storage.ts`, `utils/contrast.ts` (new, extracted from the contrast test), `i18n.ts`, plus Playwright tests for: data-accent application, data-font swap, settings-panel open/select/persist, contrast guard kicking in when accent fails WCAG.

**Bundle impact estimate:** sub-feature 1 = 0 B, 2 = ~250 B, 3 = ~200 B + font file (loaded only when used), 4 = ~1.2 KB. Total in the worst case ~1.7 KB gzipped — still well inside the 30 KB budget (currently 8.95 KB).

**Open question to confirm before building Phase P sub-feature 4:** is the in-widget settings panel wanted in the free tier, or pulled into the premium "Theming kit" add-on in COMMERCIAL.md? Deferred pending decision.

---

### PR 3 cumulative budget impact (estimate)

| Phase | Bundle (gzipped) |
|---|---|
| Current (v0.2.2) | 8.95 KB |
| + N (timer) | ~9.20 KB |
| + O (skip ±10) | ~9.50 KB |
| + P sub-features 1–3 | ~9.95 KB |
| + P sub-feature 4 (settings panel) | ~11.15 KB |
| Budget | 30.00 KB |

All comfortably under budget. No premature optimization required.
