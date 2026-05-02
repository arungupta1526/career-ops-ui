/* global Router, API, UI */
Router.register('evaluate', async () => {
  const c = UI.el;
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const prefillUrl = params.get('url') || '';

  const jdInput = c('textarea', {
    className: 'textarea',
    rows: 16,
    placeholder: 'Вставьте полный текст вакансии (responsibilities, requirements, qualifications, about the role…)',
  });
  const saveJd = c('input', { type: 'checkbox', id: 'save-jd' });
  const out = c('div', { id: 'eval-out' });

  if (prefillUrl) {
    jdInput.value = `URL: ${prefillUrl}\n\n[Вставьте здесь полный текст JD]`;
  }

  async function run() {
    const jd = jdInput.value.trim();
    if (jd.length < 50) {
      UI.toast('JD слишком короткий (min 50 chars)', 'error');
      return;
    }
    out.innerHTML = '<div class="loading">Оценка…</div>';
    try {
      const r = await API.post('/api/evaluate', { jd, save: saveJd.checked });
      renderResult(r);
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, 'Ошибка: ' + e.message));
    }
  }

  function renderResult(r) {
    out.innerHTML = '';
    if (r.mode === 'manual') {
      out.appendChild(c('div', { className: 'card' }, [
        c('div', { className: 'badge badge-warn mb-3' }, 'Manual mode (нет GEMINI_API_KEY)'),
        c('p', null, r.message),
        c('p', { className: 'field-hint' }, 'Скопируйте промпт ниже и вставьте в Claude Code или другой LLM.'),
        c('pre', { className: 'console' }, r.prompt),
        c('div', { className: 'flex gap-3 mt-3' }, [
          c('button', { className: 'btn btn-primary', onClick: () => {
            navigator.clipboard.writeText(r.prompt);
            UI.toast('Промпт скопирован', 'success');
          }}, '⧉ Скопировать промпт'),
        ]),
      ]));
    } else {
      const cls = r.code === 0 ? 'badge-ok' : 'badge-bad';
      out.appendChild(c('div', { className: 'card' }, [
        c('div', { className: 'flex-between mb-3' }, [
          c('div', { className: 'flex gap-3' }, [
            c('div', { className: 'badge ' + cls }, 'Gemini · exit ' + r.code),
            r.saved && c('div', { className: 'badge badge-info' }, 'Сохранено: ' + r.saved),
          ]),
        ]),
        r.stdout && c('div', { className: 'md', html: UI.md(r.stdout) }),
        r.stderr && c('details', null, [
          c('summary', null, 'stderr'),
          c('pre', { className: 'console' }, r.stderr),
        ]),
      ]));
    }
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'Оценить вакансию'),
        c('p', { className: 'page-subtitle' }, 'Полный А–G анализ: Role, CV match, Risks, Comp, Strategy, Verdict, Legitimacy.'),
      ]),
    ]),

    c('div', { className: 'card' }, [
      c('div', { className: 'field' }, [
        c('label', null, 'Job Description'),
        jdInput,
      ]),
      c('label', { className: 'flex', style: { gap: '8px', userSelect: 'none' } }, [
        saveJd, c('span', null, 'Сохранить JD в jds/'),
      ]),
      c('div', { className: 'flex gap-3 mt-3' }, [
        c('button', { className: 'btn btn-primary', onClick: run }, '▶ Оценить'),
        c('button', { className: 'btn btn-ghost', onClick: () => { jdInput.value = ''; out.innerHTML = ''; } }, 'Очистить'),
      ]),
    ]),

    c('div', { className: 'mt-5' }, out),
  ]);
});
