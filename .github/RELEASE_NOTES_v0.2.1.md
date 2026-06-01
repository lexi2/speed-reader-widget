# v0.2.1 — Hotfix: custom-element textContent leak

**Critical for anyone running v0.2.0 on a Ghost or WordPress site with ad-tech custom elements** (Broadstreet, GAM, Google Publisher Tag, etc.). The v0.2.0 parser was including custom-element textContent in the reader's word stream — leaking script source and ad-slot internals into mid-article playback.

## Fix

- Parser strip pass now removes any HTML element whose tag contains a hyphen (the entire custom-element namespace), plus `[hidden]`, `[aria-hidden="true"]`, and `[role="presentation"]` subtrees.
- `TriggerButton` now hands the article *element* to the reader (was passing `article.textContent` as a string, which bypassed the strip pass).
- New `setText(source: string | Element)` signature — element source runs the full strip pipeline.

## New public API

- `RsvpReader.getParsedWords()` — snapshot of currently-loaded words.
- `RsvpReader.getStatus()` — `{ idx, total, wpm, status }` for analytics.

## Numbers

- Tests: 41 → 44 (three new regression tests including the exact Broadstreet markup from the production Ghost site that surfaced the bug).
- Bundle: 8.62 KB → 8.80 KB gzipped.

## Upgrade

Anyone using a version-pinned CDN URL should bump from `@0.2.0` to `@0.2.1`. Anyone on the unversioned GitHub Pages URL gets the fix automatically on the next deploy.

---

# v0.2.0 — Adapter expansion, observability, and CI

This release expanded platform coverage, introduced a tracker-agnostic observability hook, and shipped a continuously-deployed demo site.

## Highlights

- **Substack adapter** — auto-detects Substack-hosted single posts via `substackcdn.com` asset links and `.single-post-container`.
- **WordPress block-theme support** — detects Gutenberg `.wp-block-post-content` on FSE themes; refuses Query Loop archive pages.
- **`rsvp:error` observability hook** — widget emits `CustomEvent`s on `document` for any caught internal error.
- **Offline-after-init verification** — Playwright test cuts the network mid-session and asserts playback continues with zero post-cutover requests.
- **CI + GitHub Pages demo** — every push runs type-check, build, bundle-size budget assertion, and the full Playwright suite, and re-deploys https://lexi2.github.io/speed-reader-widget/

## Install

```html
<script src="https://unpkg.com/speed-reader-widget@0.2.1" defer></script>
```

See [README.md](https://github.com/lexi2/speed-reader-widget#readme) for full configuration options and per-page opt-out paths.

## Licensing

Source-available under the [Functional Source License (FSL-1.1-MIT)](https://github.com/lexi2/speed-reader-widget/blob/main/LICENSE). For commercial use, see [COMMERCIAL.md](https://github.com/lexi2/speed-reader-widget/blob/main/COMMERCIAL.md).

Full changelog: https://github.com/lexi2/speed-reader-widget/blob/main/CHANGELOG.md
