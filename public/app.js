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

  /* ── Form submission (compact + full) ──
     TODO: バックエンド未接続。送信時は /thanks/ にリダイレクトするだけ。
     後でAPIエンドポイントを実装したらここを差し替える。
  */
  document.querySelectorAll('form.qf').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      track('quote_form_submit');
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';
      }
      var redirect = form.getAttribute('data-redirect') || '/thanks/';
      // Show inline success briefly, then redirect
      try {
        var wrap = document.createElement('div');
        wrap.className = 'qf-success';
        wrap.innerHTML = '<p><strong>送信を受け付けました。</strong>確認ページに移動します...</p>';
        form.replaceWith(wrap);
      } catch (err) { /* noop */ }
      setTimeout(function () {
        window.location.href = redirect;
      }, 400);
    });
  });

  /* ── Hide sticky CTA over footer ── */
  var stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta) {
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
