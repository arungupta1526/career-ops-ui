/* global Router, API, UI */
Router.register('deep', async () => {
  const c = UI.el;
  const company = c('input', { className: 'input', placeholder: 'Например, Wheely' });
  const role = c('input', { className: 'input', placeholder: 'Senior Backend Engineer (опционально)' });
  const out = c('div');

  async function run() {
    if (!company.value.trim()) return UI.toast('Введите компанию', 'error');
    out.innerHTML = '<div class="loading">Генерация…</div>';
    try {
      const r = await API.post('/api/deep', {
        company: company.value.trim(),
        role: role.value.trim() || undefined,
      });
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'card' }, [
        c('p', null, r.message),
        c('pre', { className: 'console' }, r.prompt),
        c('div', { className: 'flex gap-3 mt-3' }, [
          c('button', { className: 'btn btn-primary', onClick: () => {
            navigator.clipboard.writeText(r.prompt);
            UI.toast('Промпт скопирован', 'success');
          }}, '⧉ Скопировать промпт'),
        ]),
      ]));
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, e.message));
    }
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'Deep research'),
        c('p', { className: 'page-subtitle' }, 'Брифинг компании: команда, культура, новости, переговорные позиции, smart questions.'),
      ]),
    ]),
    c('div', { className: 'card' }, [
      c('div', { className: 'row' }, [
        c('div', { className: 'field' }, [c('label', null, 'Компания'), company]),
        c('div', { className: 'field' }, [c('label', null, 'Роль'), role]),
      ]),
      c('button', { className: 'btn btn-primary', onClick: run }, '▶ Сгенерировать промпт'),
    ]),
    c('div', { className: 'mt-5' }, out),
  ]);
});
