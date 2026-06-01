import { pickAdapter } from '../adapters';
import { defaultInsertion } from '../adapters/adapter.types';
import { existingReaderOnPage, isOptedOut } from './opt-out';
import { readScriptConfig } from './script-config';
import { buildTrigger } from '../ui/TriggerButton';
import { setLocale } from '../i18n';
import { reportError } from '../observability/errors';

let installed = false;

export function autoInstall(): void {
  if (installed) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInstall, { once: true });
    return;
  }

  installed = true;

  try {
    if (isOptedOut()) return;
    if (existingReaderOnPage()) return;

    const config = readScriptConfig();
    setLocale(config.lang);

    const adapter = pickAdapter();
    if (!adapter) return;

    const article = adapter.findArticle();
    if (!article) return;

    const insertion = adapter.insertionPoint
      ? adapter.insertionPoint(article)
      : defaultInsertion(article);

    buildTrigger(article, config, insertion);
  } catch (err) {
    reportError(err, 'auto-install');
  }
}
