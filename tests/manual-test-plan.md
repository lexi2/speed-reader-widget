# Manual QA — items not covered by Playwright

The Playwright e2e suite (`npm test`) covers auto-install on all three CMS adapters, opt-out paths, manual override, single-post detection, the core reader controls (play, pause, ±WPM, restart, exit, theme), keyboard shortcuts, overlay mode, empty states, content stripping, and the 30 KB bundle-size budget.

The items below need a human because they involve assistive technology, OS-level settings, or real hosted CMS environments.

## 1. Screen reader announcements

Run with VoiceOver (macOS) or NVDA (Windows). Open `http://localhost:5173/ghost-post-fixture.html` and start the reader.

| Expected announcement | When |
|---|---|
| "Paused." | When you click Pause. |
| "350 words per minute" | When WPM changes. |
| Sentence text (not word-by-word) | At sentence boundaries during playback. |
| "Finished." | When the reader reaches the end. |

The visible word display should NOT be announced word-by-word — that would flood the screen reader at 300 WPM.

## 2. Reduce Motion

macOS → System Settings → Accessibility → Display → Reduce Motion: ON.

- Word transitions should be instant (no fade/transform animation).
- Backdrop blur in overlay mode should be disabled.
- Reading rate is unchanged — Reduce Motion only affects transitions, not playback speed.

## 3. Cross-host smoke test on real CMS sites

When a staging environment is available:

| Host | Procedure | Expectation |
|---|---|---|
| Ghost Pro | Site Code Injection → Footer → paste the embed script | Trigger appears on every `/<slug>/` URL, not on `/`, `/tag/*`, `/author/*`, `/page/*`. |
| WordPress | Add script to `footer.php` or via "Insert Headers and Footers" plugin | Trigger appears on single posts, not on archives or the homepage. |
| Plain HTML | Add to any page with `<main><article>` | Trigger appears. |

## 4. Visual a11y audit

With the reader open in light AND dark themes:

- Run axe DevTools — expect zero violations.
- Tab through every control — every button must have a visible focus ring (`outline: 2px solid var(--rsvp-focus)`).
- Color contrast: word text against the surface background must pass WCAG AA (4.5:1 for body text).

## 5. Performance smoke

- Open DevTools → Lighthouse → Performance, with a Ghost post fixture loaded → score ≥ 90 on Best Practices and Accessibility.
- Total Blocking Time from script load should be < 50ms.
