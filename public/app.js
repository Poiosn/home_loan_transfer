// public/app.js — landing page logic: form validation, submit, UTM capture
(function () {
  // ── Capture UTM + click ids on first visit and persist for the session ──
  const urlParams = new URLSearchParams(location.search);
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  const tracking = {};
  trackingKeys.forEach(k => {
    const v = urlParams.get(k);
    if (v) sessionStorage.setItem('hoam_' + k, v);
    tracking[k] = sessionStorage.getItem('hoam_' + k) || '';
  });
  const referrer = document.referrer || '';

  // ── Sheet open/close ──
  const applyBtn = document.getElementById('applyBtn');
  const sheet = document.getElementById('sheet');
  const backdrop = document.getElementById('sheetBackdrop');
  const sheetBody = document.getElementById('sheetBody');
  const sheetSuccess = document.getElementById('sheetSuccess');

  const openSheet = () => {
    document.body.classList.add('sheet-open');
    setTimeout(() => document.getElementById('name').focus(), 350);
  };
  const resetSubmitBtn = () => {
    const btn = document.getElementById('submitBtn');
    const label = document.getElementById('submitLabel');
    const spin = document.getElementById('submitSpinner');
    btn.disabled = false;
    label.style.display = '';
    spin.style.display = 'none';
  };

  const closeSheet = () => {
    document.body.classList.remove('sheet-open');
    setTimeout(() => {
      sheetBody.style.display = '';
      sheetSuccess.style.display = 'none';
      document.getElementById('leadForm').reset();
      clearErrors();
      resetSubmitBtn();
    }, 350);
  };
  applyBtn.addEventListener('click', openSheet);
  backdrop.addEventListener('click', closeSheet);
  // Auto-close after success animation
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'doneBtn') closeSheet();
  });

  // ── Validation ──
  const nameEl = document.getElementById('name');
  const mobileEl = document.getElementById('mobile');
  const emailEl = document.getElementById('email');

  mobileEl.addEventListener('input', () => {
    mobileEl.value = mobileEl.value.replace(/\D/g, '').slice(0, 10);
  });

  const setErr = (id, msg) => {
    const el = document.getElementById(id + 'Err');
    el.textContent = msg || '';
    const wrap = document.getElementById(id).closest('.input-wrap');
    if (msg) wrap.classList.add('error'); else wrap.classList.remove('error');
  };
  const clearErrors = () => ['name', 'mobile', 'email'].forEach(k => setErr(k, ''));

  const validate = () => {
    let ok = true;
    if (nameEl.value.trim().length < 2) { setErr('name', 'Please enter your name'); ok = false; } else setErr('name', '');
    if (!/^[6-9]\d{9}$/.test(mobileEl.value)) { setErr('mobile', 'Enter a valid 10-digit mobile'); ok = false; } else setErr('mobile', '');
    const e = emailEl.value.trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr('email', 'Enter a valid email'); ok = false; } else setErr('email', '');
    return ok;
  };

  // ── Submit ──
  document.getElementById('leadForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const btn = document.getElementById('submitBtn');
    const label = document.getElementById('submitLabel');
    const spin = document.getElementById('submitSpinner');
    btn.disabled = true; label.style.display = 'none'; spin.style.display = '';

    const payload = {
      name: nameEl.value.trim(),
      mobile: mobileEl.value,
      email: emailEl.value.trim() || null,
      consent_terms: document.getElementById('agreeTerms').checked,
      consent_whatsapp: document.getElementById('agreeWA').checked,
      ...tracking,
      referrer,
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      // Success
      const first = (payload.name.split(' ')[0] || '').slice(0, 20);
      document.getElementById('successTitle').textContent = `Thanks${first ? ', ' + first : ''}.`;
      document.getElementById('refId').textContent = data.ref || ('HM' + data.id);
      sheetBody.style.display = 'none';
      sheetSuccess.style.display = 'block';
      resetSubmitBtn();

      // Optional: fire Meta Pixel Lead event if pixel is loaded
      if (typeof fbq === 'function') {
        try { fbq('track', 'Lead'); } catch {}
      }
    } catch (err) {
      alert('Sorry, something went wrong. Please try again.\n\n' + err.message);
      resetSubmitBtn();
    }
  });
})();
