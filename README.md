# speed-reader-widget

[![CI](https://github.com/lexi2/speed-reader-widget/actions/workflows/ci.yml/badge.svg)](https://github.com/lexi2/speed-reader-widget/actions/workflows/ci.yml)
[![Demo](https://img.shields.io/badge/demo-live-2546f0)](https://lexi2.github.io/speed-reader-widget/)
[![License: FSL-1.1-MIT](https://img.shields.io/badge/license-FSL--1.1--MIT-blue)](LICENSE)

An embeddable Rapid Serial Visual Presentation reader for any blog or article-based CMS. Reads articles one word at a time at a user-chosen speed.

**Live demo:** [lexi2.github.io/speed-reader-widget](https://lexi2.github.io/speed-reader-widget/)

## Embed (single-script auto-install)

Add one tag once to your theme's footer (Ghost: Code Injection → Site Footer; WordPress: `footer.php`; static sites: any `<script>` location). Every post automatically gets a "Read faster" button — no per-post markup required.

```html
<script
  src="https://your-cdn.example.com/rsvp-reader.iife.js"
  data-wpm="300"
  data-theme="auto"
  data-mode="inline"
  defer
></script>
```

### Configuration attributes

| Attribute | Default | Values |
|---|---|---|
| `data-wpm` | `300` | 100 – 1000 |
| `data-theme` | `auto` | `auto`, `light`, `dark` |
| `data-mode` | `inline` | `inline`, `overlay` |
| `data-source-selector` | _adapter default_ | Any CSS selector |
| `data-position` | `before` | `before`, `after` |
| `data-lang` | `en` | Locale code |

### Per-page opt-out

Any of these suppresses the widget on a specific page:
```html
<meta name="rsvp-reader" content="off">
<html data-rsvp-reader="off">
<body class="no-rsvp-reader">
<script>window.RSVP_READER_DISABLED = true;</script>
```

### Manual placement (override)

Drop a `<rsvp-reader>` element anywhere and auto-injection is skipped for that page:
```html
<rsvp-reader text="Lorem ipsum..." wpm="350" theme="dark" mode="overlay"></rsvp-reader>
```

## Theming

The widget exposes CSS custom properties at the `rsvp-reader` element. Site owners can override from outside the shadow root:

```css
rsvp-reader {
  --rsvp-accent: #8b5cf6;
  --rsvp-orp: #f97316;
}
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| Space | Play / pause |
| ← / → | Decrease / increase WPM by 25 |
| R | Restart |
| Esc | Exit |

## Development

```bash
npm install
npx playwright install chromium   # one-time

npm run dev      # dev server with the included fixtures
npm run build    # production build → dist/
npm run size     # gzip size of the IIFE bundle (target < 30 KB)
npm test         # Playwright e2e suite (26 tests)
npm run test:ui  # Playwright UI mode for debugging
```

Manual checks not covered by automation (screen reader, Reduce Motion, real CMS smoke tests) are in `tests/manual-test-plan.md`.

## Status

Current release: **v0.2.1** ([changelog](CHANGELOG.md)).

- v0.1: core RSVP, controls, theming, accessibility, single-script auto-install (Ghost + WordPress + generic).
- v0.2: Substack adapter, WordPress block-theme support, `rsvp:error` observability hook, offline-after-init verification, CI + GitHub Pages demo.
- v0.3 (planned): version-pin guarantees for major-version cuts; per-publication theming kit; analytics adapter.

## Observability

The widget emits `rsvp:error` `CustomEvent`s on `document` whenever it catches a recoverable error internally. Wire these to whichever error tracker your host site already uses — Sentry, Rollbar, Bugsnag, a custom endpoint — without adding bytes to the widget bundle.

```js
// Sentry example — drop into your existing site-wide Sentry init
document.addEventListener('rsvp:error', (e) => {
  const { widget, version, context, error } = e.detail;
  Sentry.captureException(error, {
    tags: { widget, version, context },
  });
});
```

Event detail shape:

```ts
{
  widget: 'rsvp-reader',
  version: '0.1.0',
  context: 'parser' | 'scheduler-tick' | 'connectedCallback' | 'auto-install',
  error: unknown,
}
```

This boundary contract is verified by an automated test (`tests/e2e/error-events.spec.ts`) so we don't break it accidentally.

## Hosting & offline behavior

The widget is designed to **work offline after first load**: once a visitor has the bundle in their browser cache, the widget runs without any network round-trip (the article text is already in the host page's DOM, and the widget itself never fetches anything else).

To make this real in production, host the JS at a **versioned URL** and serve it with immutable cache headers:

```
# Versioned URL — change the version segment when you ship a new release
https://your-cdn.example.com/v0.2.1/rsvp-reader.iife.js

# Recommended CDN response headers
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
Content-Type: application/javascript; charset=utf-8
```

### Hosting it for you

Three free, immutable, public paths are available out of the box once the package is on npm:

```html
<!-- unpkg, version-pinned -->
<script src="https://unpkg.com/speed-reader-widget@0.2.1" defer></script>

<!-- jsDelivr, version-pinned -->
<script src="https://cdn.jsdelivr.net/npm/speed-reader-widget@0.2.1" defer></script>

<!-- ESM via esm.sh -->
<script type="module" src="https://esm.sh/speed-reader-widget@0.2.1"></script>
```

`immutable` tells browsers they can keep the file forever without revalidation; site owners switch to a new version by pointing the `<script src>` at the new path. CDNs that work well for this: Cloudflare R2 + Cache Rules, AWS S3 + CloudFront, Bunny.net, Fastly, or even GitHub Pages for low-traffic free hosting.

**Verified by automated test:** `tests/e2e/offline.spec.ts` boots the widget, cuts the network, and asserts that (a) playback continues to advance, (b) controls remain responsive, and (c) zero network requests fire after the cutover.

For richer offline scenarios (PWA installs, cross-page article preloading, offline indicator UI), a Service Worker is available as a paid premium add-on — see [COMMERCIAL.md](COMMERCIAL.md).

## License

`speed-reader-widget` is distributed under the [Functional Source License (FSL-1.1-MIT)](LICENSE) — source-available, with a free-to-use grant for non-competing purposes. Each released version converts to MIT on its second anniversary.

In plain English:
- ✅ Read, study, modify the source freely.
- ✅ Embed the widget on a site you personally own (commercial or not) — this is "internal use" and is a Permitted Purpose.
- ❌ Bundle this widget in your own product and resell it, host it as a managed service to third parties, or otherwise build a competing offering on top of it without a commercial license.

For commercial licensing (multi-site, white-label, OEM, enterprise self-host), see [COMMERCIAL.md](COMMERCIAL.md) or email **alex@rosewarneconsulting.com.au**.
