/* global window */
/**
 * Skill / level detection from job titles + snippets.
 * Pure functions exposed on window.Skills for the scan view.
 */
window.Skills = (function () {
  // Order matters slightly — longer/more-specific terms first to avoid bad matches
  // ("Tech Lead" must beat "Lead", "Golang" must beat "Go").
  const TECH_GROUPS = [
    {
      label: 'PHP',
      patterns: [/\bphp\b/i, /symfony/i, /laravel/i, /phalcon/i, /wordpress/i, /drupal/i, /yii\b/i],
    },
    { label: 'Symfony',  patterns: [/symfony/i] },
    { label: 'Laravel',  patterns: [/laravel/i] },
    { label: 'Go',       patterns: [/\bgo(?:lang)?\b/i, /\bgo backend\b/i, /go developer/i, /go engineer/i] },
    { label: 'Rust',     patterns: [/\brust\b/i] },
    { label: 'Node.js',  patterns: [/node\.js/i, /\bnode\b(?!.*ssh)/i, /nest\.?js/i] },
    { label: 'TypeScript', patterns: [/typescript/i, /\bts\b(?!.*ssh)/i] },
    { label: 'Python',   patterns: [/python/i, /django/i, /fastapi/i, /flask/i] },
    { label: 'Ruby',     patterns: [/\bruby\b/i, /rails/i] },
    { label: 'Java',     patterns: [/\bjava\b(?!script)/i, /\bspring\b/i, /kotlin/i] },
    { label: 'C#/.NET',  patterns: [/\bc#/i, /\.net/i, /dotnet/i] },
    { label: 'C++',      patterns: [/\bc\+\+/i] },

    // Domain
    { label: 'Backend',         patterns: [/backend/i, /back-?end/i, /server-side/i, /бэкенд/i, /бэк-энд/i] },
    { label: 'Frontend',        patterns: [/frontend/i, /front-?end/i, /\bui\b/i, /\bux\b/i] },
    { label: 'Fullstack',       patterns: [/full-?stack/i] },
    { label: 'Microservices',   patterns: [/microservic/i, /микросервис/i] },
    { label: 'High-load',       patterns: [/high[-\s]?load/i, /highload/i, /высоконагруж/i] },
    { label: 'Distributed',     patterns: [/distributed/i, /распределённ/i] },
    { label: 'DevOps / SRE',    patterns: [/devops/i, /\bsre\b/i, /reliability/i, /platform engineer/i, /infrastructure/i] },
    { label: 'Data',            patterns: [/\bdata\b/i, /\betl\b/i, /pipeline/i, /streaming/i, /kafka/i, /spark/i, /dbt\b/i] },
    { label: 'ML / AI',         patterns: [/\bml\b/i, /\bai\b/i, /machine learning/i, /llm/i, /deep learning/i, /gen[-\s]?ai/i] },
    { label: 'Mobile',          patterns: [/mobile/i, /\bios\b/i, /android/i] },
    { label: 'Security',        patterns: [/security/i, /\bsecops\b/i, /безопасность/i] },
    { label: 'Database',        patterns: [/postgres/i, /mysql/i, /clickhouse/i, /mongo/i, /redis/i, /database/i, /бд/i] },
    { label: 'Cloud',           patterns: [/\baws\b/i, /\bgcp\b/i, /azure/i, /kubernetes/i, /\bk8s\b/i, /docker/i] },
    { label: 'API',             patterns: [/\bapi\b/i, /rest\b/i, /graphql/i, /grpc/i] },
  ];

  const LEVEL_GROUPS = [
    { label: 'Lead / Tech Lead',
      patterns: [/tech\s*lead/i, /team\s*lead/i, /\blead\b/i, /техлид/i, /тимлид/i, /тим[-\s]?лид/i] },
    { label: 'Architect',
      patterns: [/architect/i, /архитектор/i] },
    { label: 'Manager',
      patterns: [/\bmanager\b/i, /head of/i, /director/i, /vp\s/i, /менеджер/i] },
    { label: 'Principal / Staff',
      patterns: [/principal/i, /\bstaff\b/i, /distinguished/i] },
    { label: 'Senior',
      patterns: [/\bsenior\b/i, /\bsr\.?\b/i, /старший/i, /\bsenior\+/i, /sr\s/i] },
    { label: 'Middle',
      patterns: [/\bmiddle\b/i, /\bmid\b/i] },
    { label: 'Junior',
      patterns: [/\bjunior\b/i, /\bjr\.?\b/i, /младший/i, /\bintern/i, /стажёр/i, /стажер/i] },
  ];

  function matchGroups(text, groups) {
    if (!text) return [];
    const out = new Set();
    for (const g of groups) {
      for (const re of g.patterns) {
        if (re.test(text)) {
          out.add(g.label);
          break;
        }
      }
    }
    return [...out];
  }

  function detectTech(row) {
    const haystack = `${row.title || ''} ${row.snippet || ''}`;
    return matchGroups(haystack, TECH_GROUPS);
  }
  function detectLevel(row) {
    const haystack = `${row.title || ''}`;
    return matchGroups(haystack, LEVEL_GROUPS);
  }

  /**
   * Compute facet counts for a list of rows: { tech: {label: count}, level: {…} }.
   * Used to render only the chips that actually have results.
   */
  function computeFacets(rows) {
    const tech = {};
    const level = {};
    for (const r of rows) {
      for (const t of detectTech(r)) tech[t] = (tech[t] || 0) + 1;
      for (const l of detectLevel(r)) level[l] = (level[l] || 0) + 1;
    }
    return { tech, level };
  }

  /**
   * Apply tech & level filters to a row.
   * Returns true if row matches ALL active filters (intersection).
   */
  function rowMatches(row, activeTech, activeLevel) {
    if (activeTech.size) {
      const t = detectTech(row);
      let any = false;
      for (const sel of activeTech) if (t.includes(sel)) { any = true; break; }
      if (!any) return false;
    }
    if (activeLevel.size) {
      const l = detectLevel(row);
      let any = false;
      for (const sel of activeLevel) if (l.includes(sel)) { any = true; break; }
      if (!any) return false;
    }
    return true;
  }

  return {
    detectTech, detectLevel, computeFacets, rowMatches,
    TECH_GROUPS, LEVEL_GROUPS,
  };
})();
