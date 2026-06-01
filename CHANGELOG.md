# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/lexi2/speed-reader-widget/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lexi2/speed-reader-widget/releases/tag/v0.1.0
