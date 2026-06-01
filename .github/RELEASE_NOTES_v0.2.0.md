# v0.2.0 — Adapter expansion, observability, and CI

This release expands platform coverage, introduces a tracker-agnostic observability hook, and ships a continuously-deployed demo site.

## Highlights

- **New: Substack adapter** — auto-detects Substack-hosted single posts via `substackcdn.com` asset links and `.single-post-container`. Wins precedence over WordPress despite both using `body.single-post`.
- **New: WordPress block-theme support** — detects Gutenberg `.wp-block-post-content` on FSE themes; refuses Query Loop archive pages.
- **New: `rsvp:error` observability hook** — widget emits `CustomEvent`s on `document` for any caught internal error. Wire to Sentry / Rollbar / Bugsnag / a custom endpoint in five lines, no SDK bundled:

  ```js
  document.addEventListener('rsvp:error', (e) => {
    const { widget, version, context, error } = e.detail;
    Sentry.captureException(error, { tags: { widget, version, context } });
  });
  ```

- **New: Offline-after-init verification** — Playwright test cuts the network mid-session and asserts playback continues with zero post-cutover requests.
- **New: CI + GitHub Pages demo** — every push runs type-check, build, bundle-size budget assertion, and the full Playwright suite, and re-deploys https://lexi2.github.io/speed-reader-widget/

## Numbers

- **Tests:** 28 → 41
- **Bundle:** 8.33 KB → 8.62 KB gzipped (28% of the 30 KB budget)
- **Supported CMS platforms (verified by fixture tests):** Ghost, WordPress (classic + block themes), Substack, Jekyll, Hugo, generic schema.org Article markup

## Install

```html
<script src="https://unpkg.com/speed-reader-widget@0.2.0" defer></script>
```

See [README.md](https://github.com/lexi2/speed-reader-widget#readme) for full configuration options and per-page opt-out paths.

## Licensing

Source-available under the [Functional Source License (FSL-1.1-MIT)](https://github.com/lexi2/speed-reader-widget/blob/main/LICENSE). For commercial use (multi-site, white-label, OEM, enterprise self-host), see [COMMERCIAL.md](https://github.com/lexi2/speed-reader-widget/blob/main/COMMERCIAL.md).

Full changelog: https://github.com/lexi2/speed-reader-widget/blob/main/CHANGELOG.md
