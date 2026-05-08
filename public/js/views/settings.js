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

  const cand = profile.candidate || {};
  const targets = profile.target_roles || {};

  function info(k, v) {
    return c('div', { className: 'card' }, [
      c('div', { className: 'metric-label' }, k),
      c('div', { style: { fontSize: '17px', fontWeight: 600, marginTop: '6px' } }, v || '—'),
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
      info(t('set.name'), cand.full_name),
      info(t('set.email'), cand.email),
      info(t('set.location'), cand.location),
      info('LinkedIn', cand.linkedin),
    ]),

    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, t('set.targetRoles')),
      c('div', { className: 'card' }, [
        c('div', { className: 'flex', style: { flexWrap: 'wrap', gap: '8px' } },
          (targets.primary || []).map((r) => c('span', { className: 'tag', style: { fontSize: '13px' } }, r))
        ),
      ]),
    ]),

    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, t('set.archetypes')),
      c('div', { className: 'card-row' },
        (targets.archetypes || []).map((a) => c('div', { className: 'card' }, [
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
