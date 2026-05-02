/* global Router, API, UI */
Router.register('pipeline', async () => {
  const c = UI.el;
  const data = await API.get('/api/pipeline');
  const urls = data.urls || [];

  const list = c('div', { id: 'pipeline-list', className: 'card', style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
    urls.length === 0
      ? c('div', { className: 'empty', style: { border: 'none', padding: '20px' } }, 'Pipeline пуст. Добавьте URL ниже или запустите Scan.')
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
          UI.toast('Запускаю оценку…');
          Router.go('/evaluate?url=' + encodeURIComponent(url));
        }}, 'Оценить'),
        c('button', { className: 'btn btn-ghost btn-sm', onClick: async () => {
          if (!confirm('Удалить URL из pipeline?')) return;
          await API.del('/api/pipeline?url=' + encodeURIComponent(url));
          UI.toast('Удалено');
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
      list.appendChild(c('div', { className: 'empty', style: { border: 'none', padding: '20px' } },
        'Pipeline пуст.'));
    } else {
      urls.forEach((u) => list.appendChild(urlRow(u, refresh)));
    }
  }

  const newUrl = c('input', { className: 'input', placeholder: 'https://job-boards.greenhouse.io/...' });

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'Pipeline'),
        c('p', { className: 'page-subtitle' }, 'Очередь URL вакансий, ожидающих оценки.'),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: () => Router.go('/scan') }, 'Поиск вакансий'),
      ]),
    ]),

    c('div', { className: 'card mb-3' }, [
      c('h3', { style: { marginTop: 0 } }, 'Добавить URL'),
      c('div', { className: 'flex gap-3' }, [
        newUrl,
        c('button', { className: 'btn btn-primary', onClick: async () => {
          const u = newUrl.value.trim();
          if (!u) return UI.toast('Введите URL', 'error');
          await API.post('/api/pipeline', { url: u });
          newUrl.value = '';
          UI.toast('Добавлено в pipeline', 'success');
          refresh();
        }}, '+ Добавить'),
      ]),
      c('p', { className: 'field-hint mt-3', style: { margin: '12px 0 0' } },
        'URL сохраняется в data/pipeline.md. Из Claude Code можно запустить /career-ops pipeline для пакетной обработки.'),
    ]),

    list,
  ]);
});
