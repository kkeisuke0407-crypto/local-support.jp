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

  if (!data || !data.id) {
    $('hr-empty').hidden = false;
    $('hr-main').hidden = true;
    return;
  }
  $('hr-empty').hidden = true;
  $('hr-main').hidden = false;
  renderView(data);
})();

function renderView(data) {
  const $ = (id) => document.getElementById(id);
  const KEY = 'ls_hearing_' + data.id;
  const facility = data.facilityType || '';

  $('hr-h1').textContent = (data.service || '見積もり') + ' 事前ヒアリング';
  $('hr-service').textContent = data.service || '—';
  $('hr-facility').textContent = facility || '—';
  $('hr-id').textContent = data.id;
  $('hr-requester').textContent = (data.requester && data.requester.name) || '—';
  document.title = (data.service || 'ヒアリング') + '｜ロカサポ事前ヒアリング';

  const prior = load(KEY);
  if (prior && prior.submitted) {
    $('hr-form').hidden = true;
    $('hr-done').hidden = false;
    return;
  }

  const worktimeFacilities = ['食品工場・セントラルキッチン','スーパー・物販店','ホテル・旅館','病院・福祉施設','学校・保育施設'];
  const showWorktime = worktimeFacilities.some((f) => facility.indexOf(f) >= 0)
    || facility.indexOf('工場') >= 0 || facility.indexOf('倉庫') >= 0 || facility.indexOf('物流') >= 0;
  if (showWorktime) {
    const wt = $('hr-worktime-wrap');
    wt.hidden = false;
    wt.querySelectorAll('input').forEach((i) => i.required = true);
  }

  const csRadios = document.querySelectorAll('input[name="contract_status"]');
  csRadios.forEach((r) => r.addEventListener('change', () => {
    const isUsing = r.value.indexOf('利用中') >= 0 && r.checked;
    $('hr-cost-wrap').hidden = !isUsing;
    persist(KEY);
  }));

  const saved = load(KEY);
  restore(saved);
  if (saved.contract_status && saved.contract_status.indexOf('利用中') >= 0) $('hr-cost-wrap').hidden = false;

  $('hr-form').addEventListener('change', () => persist(KEY));
  $('hr-free').addEventListener('input', () => persist(KEY));
  $('hr-form').addEventListener('change', updateHighlights);
  updateHighlights();
  $('hr-form').addEventListener('submit', (e) => { e.preventDefault(); submit(data); });
}

function collectAnswers() {
  const form = document.getElementById('hr-form');
  const fd = new FormData(form);
  const single = (k) => fd.get(k) || '';
  return {
    floor_area: single('floor_area'),
    floors: single('floors'),
    areas: fd.getAll('areas'),
    frequency: single('frequency'),
    contract_status: single('contract_status'),
    current_cost: single('current_cost'),
    work_time: single('work_time'),
    occurrence: single('occurrence'),
    haccp: single('haccp'),
    building_age: single('building_age'),
    free_text: single('free_text'),
  };
}

function restore(saved) {
  Object.keys(saved).forEach((k) => {
    const v = saved[k];
    if (k === 'areas' && Array.isArray(v)) {
      v.forEach((val) => {
        const cb = document.querySelector('input[name="areas"][value="'+CSS.escape(val)+'"]');
        if (cb) cb.checked = true;
      });
    } else if (k === 'free_text') {
      const ta = document.getElementById('hr-free'); if (ta) ta.value = v;
    } else if (typeof v === 'string' && v) {
      const r = document.querySelector('input[name="'+k+'"][value="'+CSS.escape(v)+'"]');
      if (r) r.checked = true;
    }
  });
}

function load(key){ try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch(e){} return {}; }
function persist(key){ try { localStorage.setItem(key, JSON.stringify(collectAnswers())); } catch(e){} }

function updateHighlights() {
  document.querySelectorAll('.hr-opt').forEach((label) => {
    const inp = label.querySelector('input');
    label.classList.toggle('is-checked', inp && inp.checked);
  });
}

async function submit(data) {
  const $ = (id) => document.getElementById(id);
  const honey = document.querySelector('.hr-honeypot');
  if (honey && honey.value) return;
  const form = $('hr-form');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const ans = collectAnswers();
  if (ans.areas.length === 0) { showError('「管理したい場所」を1つ以上選択してください'); return; }

  const btn = $('hr-submit');
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '送信中...';
  $('hr-error').hidden = true;

  const payload = {
    request_id: data.id,
    service: data.service,
    facility_type: data.facilityType || '',
    prefecture: data.prefecture || '',
    requester_name: (data.requester && data.requester.name) || '',
    requester_email: (data.requester && data.requester.email) || '',
    requester_tel: (data.requester && data.requester.tel) || '',
    answers: ans,
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
    $('hr-form').hidden = true;
    $('hr-done').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    btn.disabled = false; btn.textContent = orig;
    showError(err.message || '送信中にエラーが発生しました。お手数ですが support@local-support.jp までご連絡ください');
  }
}

function showError(msg){ const el = document.getElementById('hr-error'); el.textContent = msg; el.hidden = false; }
