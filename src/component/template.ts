import tokensCss from '../theme/tokens.css?raw';
import componentCss from './styles.css?raw';

export function buildTemplate(): string {
  return `
<style>${tokensCss}${componentCss}</style>
<div class="backdrop" part="backdrop" hidden></div>
<div class="root" part="root" role="region" aria-label="Speed reader">
  <div class="toolbar-top" part="toolbar-top">
    <div class="toolbar-top__left" data-slot="top-left"></div>
    <div class="toolbar-top__right" data-slot="top-right"></div>
  </div>
  <div class="stage" part="stage">
    <div class="word__guide" aria-hidden="true"></div>
    <div class="control-item control-item--stage" data-stage-play-wrap hidden>
      <button type="button" class="stage-play btn btn--primary" data-control="stage-play"></button>
      <span class="control-item__label" data-stage-play-label></span>
    </div>
    <div class="control-item control-item--stage control-item--stage-done" data-stage-done-wrap hidden>
      <button type="button" class="stage-play btn btn--primary" data-control="stage-done"></button>
      <span class="control-item__label" data-stage-done-label></span>
    </div>
    <div class="countdown" data-countdown hidden aria-live="assertive"></div>
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
  <div class="toolbar-bottom" part="controls" role="toolbar" aria-label="Reader controls">
    <div class="toolbar-bottom__left" data-slot="bottom-left"></div>
    <div class="toolbar-bottom__center" data-slot="bottom-center"></div>
    <div class="toolbar-bottom__right" data-slot="bottom-right"></div>
  </div>
  <div class="empty" data-state="empty" hidden></div>
  <div class="sr-only" data-live aria-live="polite" aria-atomic="true"></div>
</div>
`.trim();
}
