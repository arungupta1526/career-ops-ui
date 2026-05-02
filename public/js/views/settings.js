/* global Router, API, UI */
Router.register('settings', async () => {
  const c = UI.el;
  const data = await API.get('/api/profile');
  const profile = data.profile;

  if (!profile) {
    return c('div', null, [
      c('header', { className: 'page-header' }, [c('div', null, [c('h1', { className: 'page-title' }, 'Профиль')])]),
      c('div', { className: 'empty' }, 'config/profile.yml не найден.'),
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
        c('h1', { className: 'page-title' }, 'Профиль'),
        c('p', { className: 'page-subtitle' }, 'Read-only. Редактируйте config/profile.yml в проекте.'),
      ]),
    ]),

    c('div', { className: 'card-row' }, [
      info('Имя', cand.full_name),
      info('Email', cand.email),
      info('Локация', cand.location),
      info('LinkedIn', cand.linkedin),
    ]),

    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, 'Целевые роли'),
      c('div', { className: 'card' }, [
        c('div', { className: 'flex', style: { flexWrap: 'wrap', gap: '8px' } },
          (targets.primary || []).map((r) => c('span', { className: 'tag', style: { fontSize: '13px' } }, r))
        ),
      ]),
    ]),

    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, 'Архетипы'),
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
      c('h2', { className: 'section-title' }, 'YAML (raw)'),
      c('details', null, [
        c('summary', { style: { cursor: 'pointer', padding: '8px 0', color: 'var(--foggy)' } }, 'Показать'),
        c('pre', { className: 'console' }, data.raw || ''),
      ]),
    ]),
  ]);
});
