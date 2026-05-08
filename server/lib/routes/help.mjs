/**
 * Help-center route — serves the in-app Markdown user guide.
 *
 *   GET /api/help/:lang → { lang, markdown }
 *
 * Locales live in web-ui/docs/help/<lang>.md. Falls back to en.md when
 * the requested locale is missing. `:lang` is sanitized to
 * [a-zA-Z0-9_-]+ so path-traversal can't escape the help directory.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { WEB_UI_ROOT } from '../paths.mjs';

export function registerHelpRoutes(app) {
  app.get('/api/help/:lang', (req, res) => {
    const safeLang = req.params.lang.replace(/[^a-zA-Z0-9_-]/g, '');
    const helpDir = resolve(WEB_UI_ROOT, 'docs', 'help');
    const candidates = [`${safeLang}.md`, 'en.md'];
    for (const fname of candidates) {
      const full = resolve(helpDir, fname);
      if (existsSync(full)) {
        res.json({ lang: fname.replace(/\.md$/, ''), markdown: readFileSync(full, 'utf8') });
        return;
      }
    }
    res.status(404).json({ error: 'help docs not found' });
  });
}
