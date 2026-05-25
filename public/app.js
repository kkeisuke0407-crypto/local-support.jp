/* 受水槽清掃ナビ – app.js */

document.addEventListener('DOMContentLoaded', function () {

  /* ── FAQ アコーディオン ── */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      item.classList.toggle('open');
    });
  });

  /* ── スムーズスクロール ── */
  document.querySelectorAll('[data-scroll-to]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var target = document.querySelector(el.getAttribute('data-scroll-to'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── GA4 トラッキング ── */
  function track(name) {
    if (typeof gtag === 'function') {
      gtag('event', name, { event_category: 'cta' });
    }
    if (window.dataLayer) {
      window.dataLayer.push({ event: name });
    }
  }

  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      track(el.getAttribute('data-track'));
    });
  });

  /* ── 問い合わせフォーム送信 ── */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      track('form_submit');
      var btn = form.querySelector('.form-submit');
      btn.textContent = '送信中...';
      btn.disabled = true;

      /* Google Forms に POST するか Netlify Forms に飛ばす実装に差し替える */
      var formData = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            form.innerHTML = '<div style="text-align:center;padding:32px 0;"><p style="font-size:1.1rem;font-weight:700;color:#059669;margin-bottom:8px;">お問い合わせを受け付けました</p><p style="font-size:.88rem;color:#6b7280;">営業時間内（平日9:00〜18:00）に担当者よりご連絡します。</p></div>';
          } else {
            btn.textContent = '無料で相談する';
            btn.disabled = false;
            alert('送信に失敗しました。お手数ですがお電話にてご連絡ください。');
          }
        })
        .catch(function () {
          btn.textContent = '無料で相談する';
          btn.disabled = false;
          alert('送信に失敗しました。お手数ですがお電話にてご連絡ください。');
        });
    });
  }

  /* ── ページ下部への到達で Sticky CTA を消す ── */
  var stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta) {
    var footer = document.querySelector('.sd-footer');
    var obs = new IntersectionObserver(function (entries) {
      stickyCta.style.opacity = entries[0].isIntersecting ? '0' : '1';
      stickyCta.style.pointerEvents = entries[0].isIntersecting ? 'none' : 'auto';
    }, { threshold: 0 });
    if (footer) obs.observe(footer);
  }
});
