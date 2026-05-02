/* global window */
window.API = (function () {
  let connectionLost = false;

  function setConnectionState(lost, reason) {
    if (lost === connectionLost) return;
    connectionLost = lost;
    const banner = document.getElementById('conn-banner');
    if (!banner) return;
    if (lost) {
      banner.hidden = false;
      const baseMsg = (window.I18n && window.I18n.t)
        ? window.I18n.t('conn.down', 'Server is not responding.')
        : 'Server is not responding.';
      banner.querySelector('.conn-msg').textContent =
        baseMsg + ' (' + (reason || 'fetch failed') + ') · bash web-ui/bin/start.sh';
    } else {
      banner.hidden = true;
    }
  }
  // Periodic ping to detect server recovery
  setInterval(async () => {
    if (!connectionLost) return;
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      if (r.ok) {
        setConnectionState(false);
        if (window.UI) UI.toast((window.I18n && I18n.t('conn.recovered', 'Connection restored')) || 'Connection restored', 'success');
      }
    } catch {}
  }, 3000);

  async function call(method, path, body) {
    const opts = { method, headers: { Accept: 'application/json' } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(path, opts);
    } catch (netErr) {
      setConnectionState(true, netErr.message || 'network error');
      const err = new Error('Network error: ' + (netErr.message || 'Failed to fetch'));
      err.network = true;
      throw err;
    }
    setConnectionState(false);

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = new Error(data.error || res.statusText || ('HTTP ' + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b),
    put: (p, b) => call('PUT', p, b),
    patch: (p, b) => call('PATCH', p, b),
    del: (p) => call('DELETE', p),

    // text helpers
    async getText(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(res.statusText);
      return res.text();
    },

    // SSE wrapper
    stream(path, onEvent) {
      const es = new EventSource(path);
      ['start', 'log', 'done', 'error'].forEach((ev) => {
        es.addEventListener(ev, (e) => {
          let data;
          try { data = JSON.parse(e.data); } catch { data = e.data; }
          onEvent(ev, data);
          if (ev === 'done' || ev === 'error') es.close();
        });
      });
      es.onerror = () => {
        onEvent('error', { message: 'connection lost' });
        es.close();
      };
      return es;
    },
  };
})();

window.UI = (function () {
  let toastTimer;
  function toast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 3500);
  }
  function modal(title, html) {
    document.getElementById('modal-title').textContent = title;
    const body = document.getElementById('modal-body');
    if (typeof html === 'string') body.innerHTML = html;
    else { body.innerHTML = ''; body.appendChild(html); }
    document.getElementById('modal').hidden = false;
  }
  function closeModal() { document.getElementById('modal').hidden = true; }
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') e.className = v;
      else if (k === 'style') Object.assign(e.style, v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') e.innerHTML = v;
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    if (children) {
      for (const c of [].concat(children)) {
        if (c == null || c === false) continue;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return e;
  }
  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  /**
   * Tiny markdown→HTML renderer (no deps). Handles headings, bold, italic,
   * inline code, code blocks, lists, links, tables, blockquotes, hr.
   * Good enough for our reports.
   */
  function md(src) {
    if (!src) return '';
    let s = src.replace(/\r\n/g, '\n');
    // code fences
    s = s.replace(/```([a-z]*)\n([\s\S]*?)```/gi, (_, lang, code) =>
      `<pre><code>${escapeHtml(code)}</code></pre>`);
    // tables (simple)
    s = s.replace(/((?:^\|.*\|\n)+)/gm, (block) => {
      const rows = block.trim().split('\n').map((r) =>
        r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      );
      if (rows.length < 2 || !rows[1].every((c) => /^:?-+:?$/.test(c))) return block;
      const head = rows[0];
      const body = rows.slice(2);
      return (
        '<table><thead><tr>' +
        head.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>'
      );
    });
    // headings
    s = s.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
         .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
         .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
         .replace(/^### (.+)$/gm, '<h3>$1</h3>')
         .replace(/^## (.+)$/gm, '<h2>$1</h2>')
         .replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // hr
    s = s.replace(/^---+$/gm, '<hr/>');
    // blockquote
    s = s.replace(/(^> .+(?:\n> .+)*)/gm, (block) => {
      return '<blockquote>' + block.split('\n').map((l) => l.replace(/^> ?/, '')).join('<br/>') + '</blockquote>';
    });
    // lists
    s = s.replace(/(^(?:- |\* ).+(?:\n(?:- |\* ).+)*)/gm, (block) => {
      const items = block.split('\n').map((l) => l.replace(/^[-*] /, ''));
      return '<ul>' + items.map((i) => `<li>${inline(i)}</li>`).join('') + '</ul>';
    });
    // paragraphs
    s = s.split('\n\n').map((p) => {
      if (/^<(h\d|ul|ol|table|pre|blockquote|hr)/i.test(p.trim())) return p;
      if (!p.trim()) return '';
      return '<p>' + inline(p.replace(/\n/g, '<br/>')) + '</p>';
    }).join('\n');
    return s;

    function inline(text) {
      return text
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[\s])\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }
  }

  return { toast, modal, closeModal, el, escapeHtml, md };
})();
