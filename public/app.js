/* local-support.jp – app.js */

document.addEventListener('DOMContentLoaded', function () {

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      if (item) item.classList.toggle('open');
    });
  });

  /* ── Smooth scroll ── */
  document.querySelectorAll('[data-scroll-to]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var sel = el.getAttribute('data-scroll-to');
      var target = sel && document.querySelector(sel);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── GA4 tracking ── */
  function track(name) {
    try {
      if (typeof gtag === 'function') {
        gtag('event', name, { event_category: 'cta' });
      }
      if (window.dataLayer) {
        window.dataLayer.push({ event: name });
      }
    } catch (err) { /* noop */ }
  }
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      track(el.getAttribute('data-track'));
    });
  });

  /* ── Multi-step QuoteFormFull ── */
  var fullForm = document.getElementById('quote-form-full');
  if (fullForm) {
    var steps = fullForm.querySelectorAll('.qf-step');
    var progressItems = document.querySelectorAll('.qf-progress-item');

    function showStep(n) {
      steps.forEach(function (step) {
        var s = Number(step.getAttribute('data-step'));
        step.classList.toggle('is-active', s === n);
      });
      progressItems.forEach(function (p) {
        var s = Number(p.getAttribute('data-step'));
        p.classList.toggle('is-current', s === n);
        p.classList.toggle('is-done', s < n);
      });
      // Scroll progress into view
      var progress = document.querySelector('.qf-progress');
      if (progress) progress.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateStep(n) {
      var step = fullForm.querySelector('.qf-step[data-step="' + n + '"]');
      if (!step) return true;
      var inputs = step.querySelectorAll('input, select, textarea');
      var ok = true;
      inputs.forEach(function (el) {
        if (!el.checkValidity()) {
          el.classList.add('is-invalid');
          if (ok) el.reportValidity();
          ok = false;
        } else {
          el.classList.remove('is-invalid');
        }
      });
      return ok;
    }

    fullForm.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = Number(btn.getAttribute('data-goto'));
        var current = Number(btn.closest('.qf-step').getAttribute('data-step'));
        if (target > current) {
          if (!validateStep(current)) return;
        }
        showStep(target);
      });
    });
  }

  /* ── UTM / referrer capture into hidden fields ── */
  (function attachTrackingFields() {
    var params = new URLSearchParams(window.location.search);
    var trackKeys = ['utm_source', 'utm_medium', 'utm_campaign'];
    var values = {};
    trackKeys.forEach(function (k) {
      var v = params.get(k);
      if (v) values[k] = v.slice(0, 120);
    });
    values.referrer = (document.referrer || '').slice(0, 200);
    values.landing_path = (window.location.pathname || '').slice(0, 200);
    document.querySelectorAll('form.qf').forEach(function (form) {
      Object.keys(values).forEach(function (key) {
        if (!values[key]) return;
        if (form.querySelector('input[name="' + key + '"]')) return;
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = values[key];
        form.appendChild(input);
      });
    });
  })();

  /* ── Form submission (compact + full) ── */
  document.querySelectorAll('form.qf').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var honey = form.querySelector('input[name="website"]');
      if (honey && honey.value) {
        return;
      }
      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
      }
      var redirect = form.getAttribute('data-redirect') || '/thanks/';
      var endpoint = form.getAttribute('action') || '/api/quote';

      fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
      }).then(function (resp) {
        return resp.json().catch(function () { return { ok: resp.ok }; });
      }).then(function (result) {
        if (!result || !result.ok) {
          throw new Error((result && result.error) || '送信に失敗しました');
        }
        track('quote_form_submit');
        try {
          var wrap = document.createElement('div');
          wrap.className = 'qf-success';
          wrap.innerHTML = '<p><strong>送信を受け付けました。</strong>確認ページに移動します...</p>';
          form.replaceWith(wrap);
        } catch (err) { /* noop */ }
        setTimeout(function () { window.location.href = redirect; }, 400);
      }).catch(function (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel || '送信する';
        }
        var existingErr = form.querySelector('.qf-error');
        if (existingErr) existingErr.remove();
        var errBox = document.createElement('div');
        errBox.className = 'qf-error';
        errBox.setAttribute('role', 'alert');
        errBox.textContent = '送信に失敗しました。時間をおいて再度お試しいただくか、別の方法でお問い合わせください。';
        form.appendChild(errBox);
      });
    });
  });

  /* ── Contact method toggle ── */
  (function initContactMethod() {
    document.querySelectorAll('form.qf').forEach(function (form) {
      var methodInputs = form.querySelectorAll('input[name="contact_method"]');
      if (!methodInputs.length) return;

      var emailRow = form.querySelector('.qf-contact-email');
      var telRow   = form.querySelector('.qf-contact-tel');
      var emailEl  = emailRow && emailRow.querySelector('input[name="email"]');
      var telEl    = telRow   && telRow.querySelector('input[name="tel"]');

      function applyMethod(method) {
        if (method === 'メール') {
          if (emailRow) { emailRow.hidden = false; if (emailEl) emailEl.required = true; }
          if (telRow)   { telRow.hidden   = true;  if (telEl)   { telEl.required = false; telEl.value = ''; } }
        } else if (method === '電話') {
          if (emailRow) { emailRow.hidden = true;  if (emailEl) { emailEl.required = false; emailEl.value = ''; } }
          if (telRow)   { telRow.hidden   = false; if (telEl)   telEl.required = true; }
        } else { // どちらでも
          if (emailRow) { emailRow.hidden = false; if (emailEl) emailEl.required = false; }
          if (telRow)   { telRow.hidden   = false; if (telEl)   telEl.required = false; }
        }
      }

      // JS有効時：初期状態は両方非表示
      if (emailRow) emailRow.hidden = true;
      if (telRow)   telRow.hidden   = true;

      methodInputs.forEach(function (input) {
        input.addEventListener('change', function () { applyMethod(this.value); });
      });
    });
  })();

  /* ── Cookie consent banner ── */
  var banner = document.getElementById('cookie-banner');
  if (banner) {
    var stored = null;
    try { stored = localStorage.getItem('ls_consent'); } catch (e) {}
    if (!stored) {
      banner.hidden = false;
    }
    banner.querySelectorAll('[data-consent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-consent');
        try { localStorage.setItem('ls_consent', value); } catch (e) {}
        if (typeof gtag === 'function') {
          gtag('consent', 'update', { analytics_storage: value });
        }
        banner.hidden = true;
      });
    });
  }

  /* ── Scroll depth tracking ── */
  (function initScrollDepth() {
    if (!('IntersectionObserver' in window)) return;
    var milestones = [25, 50, 75, 90];
    var fired = {};
    var docH = Math.max(document.body.scrollHeight, 1);
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden;';
    document.body.appendChild(sentinel);
    function checkDepth() {
      var scrolled = window.scrollY + window.innerHeight;
      docH = Math.max(document.body.scrollHeight, 1);
      var pct = Math.floor(scrolled / docH * 100);
      milestones.forEach(function (m) {
        if (!fired[m] && pct >= m) {
          fired[m] = true;
          track('scroll_depth_' + m);
        }
      });
    }
    window.addEventListener('scroll', checkDepth, { passive: true });
  })();

  /* ── Hide sticky CTA over footer ── */
  var stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta) {
    /* href="/audit/" + data-scroll-to="#contact" means:
       - on pages WITH #contact form → smooth-scroll handler intercepts
       - on pages WITHOUT → href takes over and navigates to /audit/
       so no JS rewrite is needed here. */
    var footer = document.querySelector('.sd-footer');
    if (footer && 'IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        stickyCta.style.opacity = entries[0].isIntersecting ? '0' : '1';
        stickyCta.style.pointerEvents = entries[0].isIntersecting ? 'none' : 'auto';
      }, { threshold: 0 });
      obs.observe(footer);
    }
  }
});
