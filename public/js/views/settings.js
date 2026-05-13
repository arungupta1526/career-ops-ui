/* global Router, API, UI, I18n */
// Route is now `profile` (was `settings` until v1.10.0). The router
// aliases the old `settings` hash so existing bookmarks keep working.
Router.register('profile', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const data = await API.get('/api/profile');
  const profile = data.profile;

  if (!profile) {
    return c('div', null, [
      c('header', { className: 'page-header' }, [c('div', null, [c('h1', { className: 'page-title' }, t('set.title'))])]),
      c('div', { className: 'empty' }, t('set.notFound')),
    ]);
  }

  // G-009 (v1.15.0): consume the server-side summary which accepts both
  // legacy (candidate:{...}) and canonical (top-level full_name / location /
  // narrative.headline) schemas. Legacy wins when both shapes are present.
  // Falls back to the old in-place parsing on older servers.
  const summary = data.summary || (function legacyFallback() {
    const cand = profile.candidate || {};
    const targets = profile.target_roles || {};
    const target = profile.target || {};
    return {
      full_name: cand.full_name || profile.full_name || null,
      email:     cand.email     || profile.email     || null,
      linkedin:  cand.linkedin  || profile.linkedin  || null,
      location:  cand.location  || profile.location  || null,
      headline:  cand.headline  || profile.narrative?.headline || null,
      target_roles: target.roles || targets.primary || [],
      archetypes:   target.archetypes || [],
    };
  }());
  const archetypes = summary.archetypes || (profile.target_roles?.archetypes) || [];

  function info(k, v) {
    return c('div', { className: 'card' }, [
      c('div', { className: 'metric-label' }, k),
      c('div', { style: { fontSize: '17px', fontWeight: 600, marginTop: '6px' } },
        v || c('span', { style: { color: 'var(--foggy)', fontWeight: 400 } },
                       t('profile.missing', '— not set'))),
    ]);
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('set.title')),
        c('p', { className: 'page-subtitle' }, t('set.subtitle')),
      ]),
    ]),

    c('div', { className: 'card-row' }, [
      info(t('set.name'), summary.full_name),
      info(t('set.email'), summary.email),
      info(t('set.location'), summary.location),
      info('LinkedIn', summary.linkedin),
    ]),

    // G-009: surface the narrative.headline — used by cover-letter and
    // outreach generation but invisible to users before v1.15.0.
    summary.headline ? c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, t('profile.headline', 'Headline')),
      c('div', { className: 'card' }, [
        c('p', { style: { fontSize: '15px', lineHeight: '1.5', margin: 0 } }, summary.headline),
      ]),
    ]) : null,

    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, t('set.targetRoles')),
      c('div', { className: 'card' }, [
        c('div', { className: 'flex', style: { flexWrap: 'wrap', gap: '8px' } },
          (summary.target_roles || []).map((r) => c('span', { className: 'tag', style: { fontSize: '13px' } }, r))
        ),
      ]),
    ]),

    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, t('set.archetypes')),
      c('div', { className: 'card-row' },
        archetypes.map((a) => c('div', { className: 'card' }, [
          c('div', { style: { fontWeight: 700 } }, a.name),
          c('div', { className: 'flex gap-1 mt-3' }, [
            c('span', { className: 'tag' }, a.fit || ''),
            c('span', { className: 'tag' }, a.level || ''),
          ]),
          c('p', { style: { color: 'var(--foggy)', fontSize: '13.5px', marginTop: '8px' } }, a.notes || ''),
        ]))
      ),
    ]),

    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, t('set.rawYaml')),
      c('details', null, [
        c('summary', { style: { cursor: 'pointer', padding: '8px 0', color: 'var(--foggy)' } }, t('set.show')),
        c('pre', { className: 'console' }, data.raw || ''),
      ]),
    ]),
  ]);
});
