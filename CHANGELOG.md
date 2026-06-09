# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-06-09

### Added
- **Elapsed / remaining timer** in the meta line (`2:34 / 5:12` format), recomputing on WPM and idx changes.
- **Skip ±10 words** — Back / Forward toolbar buttons plus `Shift+ArrowLeft` / `Shift+ArrowRight` keyboard shortcuts.
- **Theming options** — `data-accent` with automatic on-accent contrast guard; `data-font="sans|serif|mono|dyslexic"` with lazy-loaded Atkinson Hyperlegible; documented CSS custom property overrides in README.
- **3-2-1 countdown** before playback starts; reader opens idle with a centred stage play button instead of auto-playing.
- **Stage play-again CTA** when an article finishes — circular play button in the word display area.
- **Toolbar redesign** — top bar (restart, theme, close), bottom bar (slower, back, play/pause, forward, faster) with persistent labels; segmented Dark / Light theme toggle.
- Playwright tests for timer, skip, theming, countdown, and expanded WCAG AA contrast checks (theme toggle and stage labels in light mode).

### Changed
- Slower / Faster icons simplified to minus / plus; skip icons use double chevrons.
- Light-mode muted colour darkened (`#52525b`) so secondary text meets WCAG AA on the stage surface.

### Deferred
- In-widget settings panel (Phase P.4) — pending free vs premium decision.

### Performance
- Bundle: ~10.4 KB gzipped (still within the 30 KB budget).

## [0.2.2] — 2026-06-01

### Fixed
- **Adjacent text nodes fused into single words at `<br>` and block boundaries.** Discovered on thegrazier.com.au: an article with `<p>...review."<br>"Concerned stakeholders...</p>` was being read as the token `review."Concerned`. Root cause is a long-standing `textContent` gotcha — it concatenates descendant text nodes without inserting any whitespace at element edges. The parser now injects a space text node after every `<br>` and at the end of every block-boundary element (`p`, `div`, `section`, `article`, `main`, `aside`, `header`, `footer`, `h1`–`h6`, `li`, `ul`, `ol`, `dl`, `dt`, `dd`, `blockquote`, `tr`, `td`, `th`, `figure`, `figcaption`, `hr`) before reading `textContent`. The tokenizer's existing `/\s+/g → ' '` step collapses any resulting double spaces.
- Four new regression tests in `parser-word-boundaries.spec.ts` cover `<br>`, adjacent block elements with no source whitespace, consecutive `<br>`s, and inline-element non-regression.

## [0.2.1] — 2026-06-01

### Fixed
- **Parser leaks textContent from custom elements (ad slots, embeds).** Discovered by deploying v0.2.0 to a real Ghost(Pro) site running Broadstreet ads — `<broadstreet-zone-container>` text (script source, internal IDs) was being read out by the widget. The parser's strip pass now removes any tag whose name contains a hyphen (which is the entire HTML custom-element namespace), plus `[hidden]`, `[aria-hidden="true"]`, and `[role="presentation"]` subtrees. Three regression tests pin the behaviour, including one that mirrors the exact production Broadstreet markup.
- **TriggerButton was passing `article.textContent` (a string) to the reader**, which bypassed the parser's strip pass entirely. It now passes the article element directly so the full extract pipeline runs. Same fix benefits the trigger-button itself (no longer leaks the "Read faster" label into the word stream).

### Added
- **`RsvpReader.getParsedWords()`** and **`RsvpReader.getStatus()`** public methods for analytics and tests. Returns a snapshot of the word list and current playback state respectively.

### Changed
- **`setText(source: string | Element)`** — `setText` now accepts a DOM element in addition to a string. The element path runs the full strip pipeline.
- Expanded the parser's strip list: `TEMPLATE`, `SLOT`, `KBD`, `SAMP`, `VAR`, `PICTURE`, `VIDEO`, `AUDIO`, `CANVAS`, `DIALOG`. Removed `FIGURE` from the strip list (kept `FIGCAPTION` only).

## [0.2.0] — 2026-06-01

### Added
- **Substack CMS adapter** — auto-detects Substack-hosted single posts via `substackcdn.com` asset links and `.single-post-container`. Wins precedence over WordPress despite both using `body.single-post`.
- **Jekyll / Hugo coverage** via the existing generic adapter, with a Jekyll-Minima-style fixture in the test matrix as a regression guard.
- **WordPress block-theme support** — detects Gutenberg `.wp-block-post-content` on FSE themes (Twenty Twenty-Three, Twenty Twenty-Four, etc.). Refuses Query Loop archive pages that render multiple post-content blocks.
- **Observability hook** — widget now emits `rsvp:error` `CustomEvent`s on `document` whenever it catches a recoverable internal error. Detail shape: `{ widget, version, context, error }`. Wire to Sentry / Rollbar / Bugsnag / a custom endpoint in five lines without bundling any specific reporter. Contexts: `parser`, `scheduler-tick`, `connectedCallback`, `auto-install`.
- **Offline-after-init verification** — Playwright test cuts the network mid-session and asserts (a) playback continues to advance, (b) controls remain responsive, (c) zero network requests fire post-cutover.
- **GitHub Actions CI** — type-check, build, bundle-size budget assertion (< 30 KB gzipped), full Playwright suite on every push and PR.
- **GitHub Pages demo** — landing page + Ghost / WordPress / generic CMS demo pages deployed automatically on every push to `main`.
- **CHANGELOG.md** (this file).

### Changed
- **Scheduler error handling** — async `setTimeout` callbacks are now wrapped; an error inside the tick reports through the observability hook and pauses playback, rather than silently looping on broken state.
- **WordPress adapter selectors** prioritised: `.wp-block-post-content` → `.entry-content` → premium-theme fallbacks → `<article>` last-ditch.
- **Adapter registry order** now `[ghost, substack, wordpress, generic]` so Substack-specific signals out-rank WordPress on pages that set both `body.single-post` and `substackcdn.com` links.

### Repositioned (not removed)
- **Service Worker offline support** moved from "core deferred work" to a paid premium add-on in `COMMERCIAL.md`. For the free tier, the HTTP cache + immutable-URL deployment pattern (documented in README) genuinely satisfies the PRD's "operate offline after initial load" requirement.

### Tests
- 28 → 41 Playwright tests. New suites: `offline.spec.ts`, `wordpress-adapter.spec.ts`, `substack-adapter.spec.ts`, `error-events.spec.ts`. Existing `auto-install.spec.ts` matrix extended to cover Substack, Jekyll, and WordPress block themes.

### Performance
- Bundle: 8.33 KB → 8.62 KB gzipped (still 28% of the 30 KB budget). Growth is from Substack adapter (~80 B), block-theme WordPress logic (~40 B), and the observability hook (~150 B).

## [0.1.0] — 2026-06-01

### Added
- Initial release.
- Vanilla TypeScript Web Component with Shadow DOM isolation.
- Single-script auto-install model: paste one `<script>` tag and the widget appears on every single-post page across Ghost, WordPress, and any site with semantic `<article>` markup.
- Core RSVP playback with adjustable WPM (100–1000), sentence/comma/long-word pause weighting, and ORP letter highlighting.
- Controls: play / pause, ±WPM, restart, exit, theme cycle.
- Themes: light / dark / auto with `prefers-color-scheme` integration and persistence via localStorage.
- Keyboard shortcuts: Space, ← / →, R, Esc — all with `aria-keyshortcuts`.
- Accessibility: WCAG AA contrast (automated check), throttled `aria-live` announcements at sentence boundaries (not word-by-word), `prefers-reduced-motion` support, full keyboard nav, focus-trap in overlay mode.
- Modes: `inline` (default) and `overlay` (focused modal with focus-trap and Esc-to-close).
- Per-page opt-out via `<meta name="rsvp-reader" content="off">`, `<html data-rsvp-reader="off">`, `body.no-rsvp-reader`, or `window.RSVP_READER_DISABLED = true`.
- Manual placement override via `<rsvp-reader text="...">` for site owners who need explicit control.
- Distributed under the [Functional Source License (FSL-1.1-MIT)](LICENSE) — source-available with commercial-license offering for resale, white-label, and managed-hosting use cases.

[0.3.0]: https://github.com/lexi2/speed-reader-widget/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/lexi2/speed-reader-widget/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/lexi2/speed-reader-widget/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/lexi2/speed-reader-widget/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lexi2/speed-reader-widget/releases/tag/v0.1.0
