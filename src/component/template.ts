import tokensCss from '../theme/tokens.css?raw';
import componentCss from './styles.css?raw';

export function buildTemplate(): string {
  return `
<style>${tokensCss}${componentCss}</style>
<div class="backdrop" part="backdrop" hidden></div>
<div class="root" part="root" role="region" aria-label="Speed reader">
  <div class="root__body">
  <div class="toolbar-top" part="toolbar-top">
    <div class="toolbar-top__left" data-slot="top-left"></div>
    <div class="toolbar-top__right" data-slot="top-right"></div>
  </div>
  <div class="stage" part="stage">
    <div class="word__guide" aria-hidden="true"></div>
    <p class="stage-idle-hint" data-stage-idle-hint hidden></p>
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
  <div class="settings-panel" id="rsvp-settings-panel" data-settings-panel hidden role="dialog" aria-modal="false" aria-labelledby="rsvp-settings-title">
    <div class="settings-panel__header">
      <h2 class="settings-panel__title" id="rsvp-settings-title" data-settings-title>Settings</h2>
      <button type="button" class="btn settings-panel__close" data-settings-close aria-label="Close settings"></button>
    </div>
    <div class="settings-panel__section">
      <span class="settings-panel__label" data-i18n="settings.theme">Theme</span>
      <div class="settings-segmented" data-settings-theme role="group">
        <button type="button" class="settings-segmented__btn" data-theme-pick="light">Light</button>
        <button type="button" class="settings-segmented__btn" data-theme-pick="dark">Dark</button>
      </div>
    </div>
    <div class="settings-panel__section">
      <span class="settings-panel__label" data-i18n="settings.font">Font</span>
      <div class="settings-segmented settings-segmented--wrap" data-settings-font role="group">
        <button type="button" class="settings-segmented__btn" data-font-pick="sans">Sans</button>
        <button type="button" class="settings-segmented__btn" data-font-pick="serif">Serif</button>
        <button type="button" class="settings-segmented__btn" data-font-pick="mono">Mono</button>
        <button type="button" class="settings-segmented__btn" data-font-pick="dyslexic">Dyslexic</button>
      </div>
    </div>
    <div class="settings-panel__section">
      <span class="settings-panel__label" data-i18n="settings.fontSize">Text size</span>
      <div class="settings-segmented" data-settings-font-size role="group">
        <button type="button" class="settings-segmented__btn" data-font-size-pick="s">S</button>
        <button type="button" class="settings-segmented__btn" data-font-size-pick="m">M</button>
        <button type="button" class="settings-segmented__btn" data-font-size-pick="l">L</button>
      </div>
    </div>
  </div>
</div>
`.trim();
}
