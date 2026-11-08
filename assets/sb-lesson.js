/* Learnova · lesson link-up: when a student is signed in, each saved step is also recorded in their account.
   The lesson's own Google Form saving is untouched. Uses the public anon key only; the server checks who is signed in. */
(function () {
  var BV = window.BV || {};
  if (!BV.sbUrl || !BV.sbKey || !window.supabase || !window.fetch) return;
  var db = window.supabase.createClient(BV.sbUrl, BV.sbKey, { auth: { persistSession: true, autoRefreshToken: true } }), who = null;
  db.auth.getSession().then(function (r) {
    var s = r.data.session, b = document.createElement('div');
    b.setAttribute('role', 'status');
    if (s) {
      b.style.cssText = 'font:600 13px/1.4 system-ui,Arial,sans-serif;padding:6px 16px;background:#ecfdf5;color:#065f46;border-bottom:1px solid #a7f3d0';
      b.textContent = '✓ Logged in as ' + (s.user.email || 'student') + '. Your marks are saved to your Learnova dashboard.';
      db.from('profiles').select('approved').eq('id', s.user.id).maybeSingle().then(function (p) {
        if (p.data && p.data.approved === false) {
          b.style.background = '#fff7ed'; b.style.color = '#9a3412';
          b.textContent = 'Your account is waiting for your teacher to approve it. Your work still goes to your teacher; it will appear on your dashboard once you are approved.';
        } else who = s.user;
      });
      db.rpc('is_staff').then(function (t) {   // teachers: show model answers in every step
        if (t.data !== true) return;
        window.BV_TEACHER = true; document.dispatchEvent(new Event('bv-teacher'));
        b.style.background = '#f5f3ff'; b.style.color = '#5b21b6'; b.style.borderBottom = '1px solid #ddd6fe';
        b.textContent = '👩‍🏫 Teacher view: signed in as ' + (s.user.email || 'teacher') + '. Model answers are shown in every step; students see them after finishing each step.';
      }, function () {});
    } else {
      var here = encodeURIComponent(location.pathname + location.search);
      b.style.cssText = 'font:600 14px/1.5 system-ui,Arial,sans-serif;padding:8px 16px;background:#fff7ed;color:#9a3412;border-bottom:1px solid #fed7aa';
      b.innerHTML = 'Log in first so your marks reach your dashboard. <a href="/login/?next=' + here + '" style="color:#9a3412">Log in</a> · <a href="/register/?next=' + here + '" style="color:#9a3412">New? Create an account</a>';
    }
    document.body.insertBefore(b, document.body.firstChild);
  });
  try {
    var vid = localStorage.getItem('bv-vid'); if (!vid) { vid = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2); localStorage.setItem('bv-vid', vid); }
    db.rpc('log_visit', { page: location.pathname, ref: document.referrer && document.referrer.indexOf(location.origin) !== 0 ? document.referrer.split('?')[0] : null,
      dev: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'phone' : 'computer', vid: vid }).then(function () {}, function () {});
  } catch (e) {}
  function field(body, k) {
    try { if (body instanceof URLSearchParams || body instanceof FormData) return body.get(k); if (typeof body === 'string') return new URLSearchParams(body).get(k); } catch (e) {}
    return null;
  }
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var p = orig.apply(this, arguments);
    try {
      if (who && String(url).indexOf('/formResponse') >= 0 && opts && opts.body) {
        var lesson = field(opts.body, 'entry.278587299'), step = parseInt(field(opts.body, 'entry.221444120'), 10), ans = field(opts.body, 'entry.1787489026') || '';
        var m = /TOTAL=([\d.]+)\s*\/\s*([\d.]+)/.exec(ans);
        if (lesson && m) db.rpc('record_lesson_result', { lesson_ext_id: lesson, got: +m[1], out_of: +m[2], step: isNaN(step) ? null : step }).then(function (r) { if (r.error && window.console) console.warn('Learnova account:', r.error.message); });
      }
    } catch (e) {}
    return p;
  };
})();
