import tokensCss from '../theme/tokens.css?raw';
import componentCss from './styles.css?raw';

export function buildTemplate(): string {
  return `
<style>${tokensCss}${componentCss}</style>
<div class="backdrop" part="backdrop" hidden></div>
<div class="root" part="root" role="region" aria-label="Speed reader">
  <div class="stage" part="stage">
    <div class="word__guide" aria-hidden="true"></div>
    <div class="word" part="word" aria-hidden="true">
      <span class="pre"></span><span class="orp"></span><span class="post"></span>
    </div>
  </div>
  <div class="meta" part="meta">
    <span class="meta__status" data-meta="status"></span>
    <span class="meta__time" data-meta="time">
      <span data-meta="time-elapsed"></span>
      <span class="meta__time-sep" aria-hidden="true">/</span>
      <span data-meta="time-remaining"></span>
    </span>
    <span class="meta__wpm" data-meta="wpm"></span>
  </div>
  <div class="progress" part="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Reading progress">
    <div class="progress__bar" data-progress-bar></div>
  </div>
  <div class="controls" part="controls" role="toolbar" aria-label="Reader controls"></div>
  <div class="empty" data-state="empty" hidden></div>
  <div class="done" data-state="done" hidden></div>
  <div class="sr-only" data-live aria-live="polite" aria-atomic="true"></div>
</div>
`.trim();
}
