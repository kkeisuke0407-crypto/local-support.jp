(function(){
  const $ = (id) => document.getElementById(id);
  const main = $('qr-main');
  const empty = $('qr-empty');

  function b64uDecode(s) {
    const b64 = s.replace(/-/g,'+').replace(/_/g,'/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    return atob(b64 + pad);
  }

  let data = null;
  try {
    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : '';
    const params = new URLSearchParams(hash);
    const raw = params.get('data');
    if (raw) {
      const json = decodeURIComponent(escape(b64uDecode(raw)));
      data = JSON.parse(json);
    }
  } catch (e) {
    console.error('[quote-result] hash parse error', e);
  }

  if (!data || !data.id || !Array.isArray(data.vendors) || data.vendors.length === 0) {
    empty.hidden = false;
    main.hidden = true;
    return;
  }

  empty.hidden = true;
  main.hidden = false;
  renderView(data);
})();

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderView(data) {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'ls_quote_result_' + data.id;

  $('qr-h1').textContent = (data.service || '見積もり') + 'の業者比較';
  $('qr-service').textContent = data.service || '見積もり依頼';
  $('qr-count').textContent = data.vendors.length;
  $('qr-id').textContent = data.id;
  $('qr-requester').textContent = (data.requester && data.requester.name) || '—';
  $('qr-prefecture').textContent = data.prefecture || '—';
  $('qr-expires').textContent = data.expiresAt || '—';
  document.title = (data.service || '業者比較') + '｜ロカサポ業者比較ページ';

  const priorState = loadSelection(STORAGE_KEY);
  if (priorState && priorState.submitted) {
    $('qr-vendor-list').hidden = true;
    $('qr-selected-bar').hidden = true;
    $('qr-form').hidden = true;
    $('qr-done').hidden = false;
    return;
  }

  const listEl = $('qr-vendor-list');
  listEl.innerHTML = data.vendors.map((v, i) => {
    const vid = escapeHtml(v.id || ('v' + (i+1)));
    const creds = (v.credentials || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('');
    const highlights = (v.highlights || []).map((h) => `<span class="qr-tag">${escapeHtml(h)}</span>`).join('');
    return `
      <div class="qr-vendor-card" data-vendor-id="${vid}">
        <label class="qr-vendor-label">
          <input type="checkbox" class="qr-vendor-check" data-vendor-id="${vid}" />
          <div class="qr-vendor-body">
            <div class="qr-vendor-head">
              <h2>${escapeHtml(v.name || ('業者 ' + (i+1)))}</h2>
              <div class="qr-vendor-prices">
                ${v.estimatedPrice ? `<div class="qr-price-line"><span>概算見積</span><strong>${escapeHtml(v.estimatedPrice)}</strong></div>` : ''}
                ${v.annualPrice ? `<div class="qr-price-line qr-price-line--sub"><span>年額換算</span><strong>${escapeHtml(v.annualPrice)}</strong></div>` : ''}
              </div>
            </div>
            ${v.proposal ? `<p class="qr-vendor-proposal">${escapeHtml(v.proposal)}</p>` : ''}
            ${highlights ? `<div class="qr-vendor-tags">${highlights}</div>` : ''}
            ${creds ? `<ul class="qr-vendor-creds">${creds}</ul>` : ''}
            <dl class="qr-vendor-facts">
              ${v.experience ? `<div><dt>実績</dt><dd>${escapeHtml(v.experience)}</dd></div>` : ''}
              ${v.haccp ? `<div><dt>HACCP対応</dt><dd>${escapeHtml(v.haccp)}</dd></div>` : ''}
              ${v.responseTime ? `<div><dt>対応スピード</dt><dd>${escapeHtml(v.responseTime)}</dd></div>` : ''}
            </dl>
            <div class="qr-vendor-pick-state"><span class="qr-pick-off">この業者を選ぶ</span><span class="qr-pick-on">✓ 選択中</span></div>
          </div>
        </label>
      </div>`;
  }).join('');

  const saved = loadSelection(STORAGE_KEY);
  saved.selected.forEach((vid) => {
    const cb = listEl.querySelector(`.qr-vendor-check[data-vendor-id="${vid}"]`);
    if (cb) cb.checked = true;
  });
  if (saved.message) $('qr-message').value = saved.message;
  if (saved.agree) $('qr-agree').checked = true;
  updateState();

  listEl.addEventListener('change', (e) => {
    const target = e.target;
    if (target && target.classList.contains('qr-vendor-check')) {
      const selected = getSelectedIds();
      if (selected.length > 3) {
        target.checked = false;
        alert('選択できるのは最大3社までです。');
        return;
      }
      persistSelection(STORAGE_KEY);
      updateState();
    }
  });

  $('qr-message').addEventListener('input', () => persistSelection(STORAGE_KEY));
  $('qr-agree').addEventListener('change', () => { persistSelection(STORAGE_KEY); updateState(); });

  $('qr-clear-btn').addEventListener('click', () => {
    listEl.querySelectorAll('.qr-vendor-check').forEach((cb) => cb.checked = false);
    $('qr-message').value = '';
    $('qr-agree').checked = false;
    persistSelection(STORAGE_KEY);
    updateState();
  });

  $('qr-form').addEventListener('submit', (e) => {
    e.preventDefault();
    submitSelection(data);
  });
}

function getSelectedIds() {
  return Array.from(document.querySelectorAll('.qr-vendor-check:checked')).map((cb) => cb.dataset.vendorId);
}

function loadSelection(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return { selected: [], message: '', agree: false };
}

function persistSelection(key) {
  const state = {
    selected: getSelectedIds(),
    message: document.getElementById('qr-message').value,
    agree: document.getElementById('qr-agree').checked,
    ts: Date.now(),
  };
  try { localStorage.setItem(key, JSON.stringify(state)); } catch(e) {}
}

function updateState() {
  const count = getSelectedIds().length;
  document.getElementById('qr-selected-count').textContent = count;
  document.getElementById('qr-clear-btn').hidden = count === 0;
  const agree = document.getElementById('qr-agree').checked;
  document.getElementById('qr-submit-btn').disabled = !(count >= 1 && agree);
  document.querySelectorAll('.qr-vendor-card').forEach((card) => {
    const cb = card.querySelector('.qr-vendor-check');
    card.classList.toggle('is-picked', cb && cb.checked);
  });
}

async function submitSelection(data) {
  const $ = (id) => document.getElementById(id);
  const honey = document.querySelector('.qr-honeypot');
  if (honey && honey.value) return;

  const selectedIds = getSelectedIds();
  if (selectedIds.length < 1 || selectedIds.length > 3) {
    showError('1〜3社を選択してください');
    return;
  }
  const selected = data.vendors.filter((v) => selectedIds.includes(v.id));

  const btn = $('qr-submit-btn');
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = '送信中...';
  $('qr-error').hidden = true;

  const payload = {
    request_id: data.id,
    service: data.service,
    prefecture: data.prefecture,
    requester_name: (data.requester && data.requester.name) || '',
    requester_email: (data.requester && data.requester.email) || '',
    requester_tel: (data.requester && data.requester.tel) || '',
    message: $('qr-message').value,
    selected_vendors: selected.map((v) => ({ id: v.id, name: v.name, estimatedPrice: v.estimatedPrice || '' })),
    all_vendor_ids: data.vendors.map((v) => v.id),
  };

  try {
    const resp = await fetch('/api/select-vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await resp.json().catch(() => ({ ok: resp.ok }));
    if (!result.ok) throw new Error(result.error || '送信に失敗しました');

    try { localStorage.setItem('ls_quote_result_' + data.id, JSON.stringify({ submitted: true, ts: Date.now() })); } catch(e) {}
    document.getElementById('qr-form').hidden = true;
    document.getElementById('qr-vendor-list').hidden = true;
    document.getElementById('qr-selected-bar').hidden = true;
    document.getElementById('qr-done').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    btn.disabled = false;
    btn.textContent = originalLabel;
    showError(err.message || '送信中にエラーが発生しました。お手数ですが support@local-support.jp までご連絡ください');
  }
}

function showError(msg) {
  const el = document.getElementById('qr-error');
  el.textContent = msg;
  el.hidden = false;
}
