/**
 * Markdown / data-file parsers for career-ops.
 * Pure functions — no I/O. Input: string. Output: structured object.
 * Heavily tested in tests/parsers.test.mjs.
 */

/**
 * Parse a markdown table (GFM). Returns { headers: string[], rows: string[][] }.
 * Empty input or no table → { headers: [], rows: [] }.
 */
export function parseMarkdownTable(text) {
  if (!text) return { headers: [], rows: [] };
  const lines = text.split('\n');
  let headers = [];
  const rows = [];
  let inTable = false;
  let separatorSeen = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|')) {
      if (inTable) break; // table ended
      continue;
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    if (!inTable) {
      headers = cells;
      inTable = true;
      continue;
    }

    if (!separatorSeen) {
      // separator row like |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        separatorSeen = true;
        continue;
      }
      // not a real table — abort
      return { headers: [], rows: [] };
    }

    rows.push(cells);
  }

  return { headers, rows };
}

/**
 * Parse applications.md → array of objects keyed by lowercased headers.
 * Adds .reportPath if a `[\d+](reports/...)` link is present in the Report cell.
 */
export function parseApplications(text) {
  const { headers, rows } = parseMarkdownTable(text);
  if (!headers.length) return [];
  const keys = headers.map((h) => h.replace(/^#/, 'num').toLowerCase().trim());

  return rows.map((cells) => {
    const obj = {};
    keys.forEach((k, i) => {
      obj[k] = cells[i] ?? '';
    });

    // Extract score number
    if (obj.score) {
      const m = obj.score.match(/([\d.]+)/);
      obj.scoreNum = m ? parseFloat(m[1]) : null;
    }

    // Extract report path
    if (obj.report) {
      const m = obj.report.match(/\(([^)]+)\)/);
      obj.reportPath = m ? m[1] : null;
    }

    obj.pdfReady = obj.pdf?.includes('✅') || false;
    return obj;
  });
}

/**
 * Parse pipeline.md → list of pending URLs.
 * URLs live inside the first ```code-fence``` block, one per line.
 */
export function parsePipeline(text) {
  if (!text) return [];
  const fenceMatch = text.match(/```([\s\S]*?)```/);
  const block = fenceMatch ? fenceMatch[1] : text;
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && (l.startsWith('http') || l.startsWith('local:')));
}

/**
 * Add a URL to pipeline.md content. Returns updated content.
 * Preserves existing fence; creates one if missing.
 */
export function addPipelineUrl(text, url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return text;
  const existing = parsePipeline(text);
  if (existing.includes(trimmed)) return text; // dedup

  const lines = [...existing, trimmed];
  const fenceContent = lines.join('\n');
  if (text && text.includes('```')) {
    return text.replace(/```[\s\S]*?```/, '```\n' + fenceContent + '\n```');
  }
  return (
    (text || '# Pipeline — Pending URLs\n\nDrop job URLs (one per line) here.\n\n') +
    '```\n' +
    fenceContent +
    '\n```\n'
  );
}

/**
 * Remove a URL from pipeline.md.
 */
export function removePipelineUrl(text, url) {
  const remaining = parsePipeline(text).filter((u) => u !== url);
  const fenceContent = remaining.join('\n');
  if (text.includes('```')) {
    return text.replace(/```[\s\S]*?```/, '```\n' + fenceContent + '\n```');
  }
  return text;
}

/**
 * Parse a report file's header (the first heading + bold metadata).
 * Returns { title, date, archetype, score, scoreNum, url, legitimacy, pdf }.
 */
export function parseReportHeader(text) {
  const out = {
    title: '',
    date: '',
    archetype: '',
    score: '',
    scoreNum: null,
    url: '',
    legitimacy: '',
    pdf: '',
  };
  if (!text) return out;

  const titleMatch = text.match(/^#\s+(.+)$/m);
  if (titleMatch) out.title = titleMatch[1].trim();

  const fields = {
    date: /\*\*Date:\*\*\s*(.+)/,
    archetype: /\*\*Archetype:\*\*\s*(.+)/,
    score: /\*\*Score:\*\*\s*(.+)/,
    url: /\*\*URL:\*\*\s*(.+)/,
    legitimacy: /\*\*Legitimacy:\*\*\s*(.+)/,
    pdf: /\*\*PDF:\*\*\s*(.+)/,
  };
  for (const [k, re] of Object.entries(fields)) {
    const m = text.match(re);
    if (m) out[k] = m[1].trim();
  }

  if (out.score) {
    const m = out.score.match(/([\d.]+)/);
    out.scoreNum = m ? parseFloat(m[1]) : null;
  }
  return out;
}

/**
 * Slug a string for filename use.
 */
export function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Today as YYYY-MM-DD.
 */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
