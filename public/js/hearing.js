(function(){
  const $ = (id) => document.getElementById(id);

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
    if (raw) data = JSON.parse(decodeURIComponent(escape(b64uDecode(raw))));
  } catch (e) { console.error('[hearing] parse error', e); }

  if (new URLSearchParams(location.search).get('reset') === '1') {
    if (data && data.id) { try { localStorage.removeItem('ls_hearing_' + data.id); } catch(e) {} }
    history.replaceState(null, '', location.pathname + location.hash);
  }

  if (!data || !data.id) {
    $('hr-empty').hidden = false;
    $('hr-main').hidden = true;
    return;
  }
  $('hr-empty').hidden = true;
  $('hr-main').hidden = false;
  renderView(data);
})();

function escapeHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// サービスに応じた質問セットを決める
function resolveQuestions(data) {
  const cfg = window.__HEARING_Q || { byService: {}, default: [] };
  const bySvc = cfg.byService || {};
  // 1) slug で一致
  if (data.serviceSlug && bySvc[data.serviceSlug]) return bySvc[data.serviceSlug];
  // 2) サービス名の部分一致で推定（手動発行URLで slug が無い場合の保険）
  const name = data.service || '';
  const guess = { 'pest-control':['害虫','防除','PCO'], 'jusuisou-seisou':['受水槽','貯水槽'], 'solar-cleaning':['太陽光','パネル','ソーラー'] };
  for (const slug in guess) {
    if (bySvc[slug] && guess[slug].some((kw) => name.indexOf(kw) >= 0)) return bySvc[slug];
  }
  // 3) フォールバック
  return cfg.default || [];
}

function renderQuestions(questions) {
  const html = questions.map((q) => {
    const reqMark = q.required ? '<span class="hr-req">必須</span>' : '<span class="hr-opt-mark">任意</span>';
    const legend = `<legend>${escapeHtml(q.label)} ${reqMark}</legend>`;
    let body = '';
    if (q.type === 'radio' || q.type === 'checkbox') {
      const multi = q.type === 'checkbox';
      const inputType = multi ? 'checkbox' : 'radio';
      const opts = (q.options || []).map((o) =>
        `<label class="hr-opt"><input type="${inputType}" name="${escapeHtml(q.key)}" value="${escapeHtml(o)}"${(q.required && !multi) ? ' required' : ''} /> <span>${escapeHtml(o)}</span></label>`
      ).join('');
      body = `<div class="hr-options${multi ? ' hr-options--multi' : ''}" data-key="${escapeHtml(q.key)}" data-required="${q.required ? '1':''}" data-multi="${multi ? '1':''}">${opts}</div>`;
    } else if (q.type === 'number') {
      const unit = q.unit ? `<span class="hr-unit">${escapeHtml(q.unit)}</span>` : '';
      body = `<div class="hr-inline"><input class="hr-input" type="number" inputmode="decimal" name="${escapeHtml(q.key)}" placeholder="${escapeHtml(q.placeholder||'')}"${q.required ? ' required' : ''} min="0" step="any" />${unit}</div>`;
    } else if (q.type === 'text') {
      body = `<input class="hr-input hr-input--wide" type="text" name="${escapeHtml(q.key)}" placeholder="${escapeHtml(q.placeholder||'')}"${q.required ? ' required' : ''} maxlength="120" />`;
    } else { // textarea
      body = `<textarea name="${escapeHtml(q.key)}" rows="4" maxlength="400" placeholder="${escapeHtml(q.placeholder||'')}"${q.required ? ' required' : ''}></textarea>`;
    }
    return `<fieldset class="hr-q">${legend}${body}</fieldset>`;
  }).join('');
  $q('hr-questions').innerHTML = html;
}

function $q(id){ return document.getElementById(id); }

function renderView(data) {
  const KEY = 'ls_hearing_' + data.id;
  $q('hr-h1').textContent = (data.service || '見積もり') + ' 事前ヒアリング';
  $q('hr-service').textContent = data.service || '—';
  $q('hr-facility').textContent = data.facilityType || '—';
  $q('hr-id').textContent = data.id;
  $q('hr-requester').textContent = (data.requester && data.requester.name) || '—';
  document.title = (data.service || 'ヒアリング') + '｜ロカサポ事前ヒアリング';

  const prior = load(KEY);
  if (prior && prior.submitted) {
    $q('hr-form').hidden = true;
    $q('hr-done').hidden = false;
    return;
  }

  const questions = resolveQuestions(data);
  window.__HR_QUESTIONS = questions;
  renderQuestions(questions);

  const saved = load(KEY);
  restore(saved);

  const form = $q('hr-form');
  form.addEventListener('change', () => { persist(KEY); updateHighlights(); });
  form.addEventListener('input', () => persist(KEY));
  updateHighlights();
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(data); });
}

function collectAnswers() {
  const form = document.getElementById('hr-form');
  const fd = new FormData(form);
  const questions = window.__HR_QUESTIONS || [];
  const out = [];
  questions.forEach((q) => {
    let value;
    if (q.type === 'checkbox') value = fd.getAll(q.key).join('、');
    else value = (fd.get(q.key) || '').toString().trim();
    if (value && q.type === 'number' && q.unit) value = value + q.unit;
    out.push({ key: q.key, label: q.label, value: value });
  });
  return out;
}

function validate() {
  const questions = window.__HR_QUESTIONS || [];
  const form = document.getElementById('hr-form');
  const fd = new FormData(form);
  for (const q of questions) {
    if (!q.required) continue;
    if (q.type === 'checkbox') {
      if (fd.getAll(q.key).length === 0) return `「${q.label}」を1つ以上選択してください`;
    } else {
      if (!(fd.get(q.key) || '').toString().trim()) return `「${q.label}」にご回答ください`;
    }
  }
  return null;
}

function restore(saved) {
  if (!saved || !saved.answers) return;
  const map = {};
  saved.answers.forEach((a) => { map[a.key] = a.raw != null ? a.raw : a.value; });
  const form = document.getElementById('hr-form');
  Object.keys(map).forEach((k) => {
    const v = map[k];
    const inputs = form.querySelectorAll('[name="'+CSS.escape(k)+'"]');
    if (!inputs.length) return;
    if (inputs[0].type === 'checkbox') {
      const vals = String(v).split('、');
      inputs.forEach((cb) => { if (vals.indexOf(cb.value) >= 0) cb.checked = true; });
    } else if (inputs[0].type === 'radio') {
      inputs.forEach((r) => { if (r.value === v) r.checked = true; });
    } else {
      inputs[0].value = v;
    }
  });
}

function updateHighlights() {
  document.querySelectorAll('.hr-opt').forEach((label) => {
    const inp = label.querySelector('input');
    label.classList.toggle('is-checked', inp && inp.checked);
  });
}

function load(key){ try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch(e){} return {}; }
function persist(key){ try { localStorage.setItem(key, JSON.stringify({ answers: collectAnswers() })); } catch(e){} }

async function submit(data) {
  const honey = document.querySelector('.hr-honeypot');
  if (honey && honey.value) return;
  const err = validate();
  if (err) { showError(err); return; }

  const ans = collectAnswers();
  const btn = document.getElementById('hr-submit');
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '送信中...';
  document.getElementById('hr-error').hidden = true;

  const payload = {
    request_id: data.id,
    service: data.service,
    service_slug: data.serviceSlug || '',
    facility_type: data.facilityType || '',
    prefecture: data.prefecture || '',
    requester_name: (data.requester && data.requester.name) || '',
    requester_email: (data.requester && data.requester.email) || '',
    requester_tel: (data.requester && data.requester.tel) || '',
    answers: ans.filter((a) => a.value !== ''),
  };

  try {
    const resp = await fetch('/api/hearing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await resp.json().catch(() => ({ ok: resp.ok }));
    if (!result.ok) throw new Error(result.error || '送信に失敗しました');
    try { localStorage.setItem('ls_hearing_' + data.id, JSON.stringify({ submitted: true, ts: Date.now() })); } catch(e) {}
    document.getElementById('hr-form').hidden = true;
    document.getElementById('hr-done').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    btn.disabled = false; btn.textContent = orig;
    showError(e.message || '送信中にエラーが発生しました。お手数ですが support@local-support.jp までご連絡ください');
  }
}

function showError(msg){ const el = document.getElementById('hr-error'); el.textContent = msg; el.hidden = false; }
