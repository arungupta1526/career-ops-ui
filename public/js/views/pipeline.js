/* global Router, API, UI, I18n */
Router.register('pipeline', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const data = await API.get('/api/pipeline');
  const urls = data.urls || [];

  const list = c('div', { id: 'pipeline-list', className: 'card', style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
    urls.length === 0
      ? c('div', { className: 'empty', style: { border: 'none', padding: '20px' } }, t('pipe.empty'))
      : urls.map((u) => urlRow(u, refresh))
  );

  function urlRow(url, onChange) {
    return c('div', {
      className: 'flex-between',
      style: { padding: '12px 14px', border: '1px solid var(--slate)', borderRadius: 'var(--radius)' }
    }, [
      c('a', { href: url, target: '_blank', rel: 'noopener', style: { wordBreak: 'break-all', fontSize: '14px', flex: 1 } }, url),
      c('div', { className: 'flex gap-1' }, [
        c('button', { className: 'btn btn-ghost btn-sm', onClick: async () => {
          UI.toast(t('eval.evaluating'));
          Router.go('/evaluate?url=' + encodeURIComponent(url));
        }}, t('pipe.evaluateBtn')),
        c('button', { className: 'btn btn-ghost btn-sm', onClick: async () => {
          if (!confirm(t('pipe.confirmDel'))) return;
          await API.del('/api/pipeline?url=' + encodeURIComponent(url));
          UI.toast(t('pipe.deleted'));
          onChange();
        }}, '✕'),
      ]),
    ]);
  }

  async function refresh() {
    const fresh = await API.get('/api/pipeline');
    const urls = fresh.urls || [];
    list.innerHTML = '';
    if (urls.length === 0) {
      list.appendChild(c('div', { className: 'empty', style: { border: 'none', padding: '20px' } }, t('pipe.noResults')));
    } else {
      urls.forEach((u) => list.appendChild(urlRow(u, refresh)));
    }
  }

  const newUrl = c('input', { className: 'input', placeholder: t('pipe.placeholder') });

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('pipe.title')),
        c('p', { className: 'page-subtitle' }, t('pipe.subtitle')),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: () => Router.go('/scan') }, t('scan.title')),
      ]),
    ]),

    c('div', { className: 'card mb-3' }, [
      c('h3', { style: { marginTop: 0 } }, t('pipe.add')),
      c('div', { className: 'flex gap-3' }, [
        newUrl,
        c('button', { className: 'btn btn-primary', onClick: async () => {
          const u = newUrl.value.trim();
          if (!u) return UI.toast(t('pipe.enterUrl'), 'error');
          await API.post('/api/pipeline', { url: u });
          newUrl.value = '';
          UI.toast(t('pipe.added'), 'success');
          refresh();
        }}, '+ ' + t('common.add')),
      ]),
      c('p', { className: 'field-hint mt-3', style: { margin: '12px 0 0' } }, t('pipe.hint')),
    ]),

    list,
  ]);
});
