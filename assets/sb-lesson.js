/* Learnova · lesson link-up: when a student is signed in, each saved step is also recorded in their account.
   The lesson's own Google Form saving is untouched. Uses the public anon key only; the server checks who is signed in. */
(function () {
  var BV = window.BV || {};
  if (!BV.sbUrl || !BV.sbKey || !window.supabase || !window.fetch) return;
  var db = window.supabase.createClient(BV.sbUrl, BV.sbKey, { auth: { persistSession: true, autoRefreshToken: true } }), who = null;
  window.BV_DB = db;   // shared with lesson-feedback.js
  db.auth.getSession().then(function (r) {
    var s = r.data.session, b = document.createElement('div');
    b.setAttribute('role', 'status');
    if (s) {
      b.style.cssText = 'font:600 13px/1.4 system-ui,Arial,sans-serif;padding:6px 16px;background:#ecfdf5;color:#065f46;border-bottom:1px solid #a7f3d0';
      b.textContent = '✓ Logged in as ' + (s.user.email || 'student') + '. Your marks are saved to your Learnova dashboard.';
      db.from('profiles').select('approved,full_name,class_id,classes(name)').eq('id', s.user.id).maybeSingle().then(function (p) {
        lockWho(p.data);
        if (p.data && p.data.approved === false) {
          b.style.background = '#fff7ed'; b.style.color = '#9a3412';
          b.textContent = 'Your account is waiting for your teacher to approve it. Your work still goes to your teacher; it will appear on your dashboard once you are approved.';
        } else { who = s.user; window.BV_STUDENT = s.user; document.dispatchEvent(new Event('bv-signed-in')); }
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
  // Signed-in students: name and class come from their account, so work is filed under the right class.
  function lockWho(pr) {
    if (!pr || !pr.full_name) return;
    var cls = pr.classes && pr.classes.name, set = function (id, v) { var el = document.getElementById(id); if (!el || !v) return;
      el.value = v; el.readOnly = true; el.title = 'Filled in from your Learnova account'; el.style.background = '#f1f5f9';
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('sname', pr.full_name); set('scls', cls);
    if (!cls) { var b = document.querySelector('[role=status]'); if (b) b.textContent += ' You are not in a class yet: ask your teacher for your class join code.'; }
  }
  function field(body, k) {
    try { if (body instanceof URLSearchParams || body instanceof FormData) return body.get(k); if (typeof body === 'string') return new URLSearchParams(body).get(k); } catch (e) {}
    return null;
  }
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    // Lesson steps saved to the site database: send them with the student's own sign-in, so the server files them under their account and class.
    if (String(url).indexOf('/rest/v1/lesson_work') >= 0 && opts && opts.method === 'POST') {
      var self = this;
      return db.auth.getSession().then(function (r) {
        var s = r.data && r.data.session, o = opts;
        if (s) { o = Object.assign({}, opts, { headers: Object.assign({}, opts.headers, { Authorization: 'Bearer ' + s.access_token }) }); }
        return orig.call(self, url, o).then(function (res) {
          try {
            var b = JSON.parse(opts.body), m = /TOTAL=([\d.]+)\s*\/\s*([\d.]+)/.exec(b.answers || '');
            if (s && res.ok && m) db.rpc('record_lesson_result', { lesson_ext_id: b.lesson, got: +m[1], out_of: +m[2], step: b.step || null }).then(function (x) {
              if (x.error) { if (window.console) console.warn('Learnova account:', x.error.message); return; }
              // whole-lesson feedback on the dashboard, updated from the marks on every question so far
              db.functions.invoke('result-feedback', { body: { lesson: b.lesson } }).then(function () {}, function () {});
              // question-by-question analysis and the learning profile (AI reads the written answers once the lesson is finished)
              db.functions.invoke('analyse', { body: { lesson: b.lesson, mode: (b.step || 0) >= 6 ? 'ai' : 'rule' } }).then(function () {}, function () {});
            });
          } catch (e) {}
          return res;
        });
      }, function () { return orig.call(self, url, opts); });
    }
    var p = orig.apply(this, arguments);
    try {
      // Older lessons save each step to a Google Form. Copy every step into the site database too (lesson_work),
      // so it appears in the teacher's Lesson work and, for signed-in students, on their dashboard.
      if (String(url).indexOf('/formResponse') >= 0 && opts && opts.body) {
        var lesson = field(opts.body, 'entry.278587299'), step = parseInt(field(opts.body, 'entry.221444120'), 10), ans = field(opts.body, 'entry.1787489026') || '';
        var nm = (field(opts.body, 'entry.1904342126') || '').trim(), cl = (field(opts.body, 'entry.386386694') || '').trim();
        if (lesson && ans && (nm || who)) {
          window.fetch(BV.sbUrl + '/rest/v1/lesson_work', { method: 'POST', headers: { 'apikey': BV.sbKey, 'Authorization': 'Bearer ' + BV.sbKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ lesson: lesson.slice(0, 60), student_name: (nm || (who && who.email) || 'Student').slice(0, 80), class_name: cl ? cl.slice(0, 80) : null, step: Math.max(1, Math.min(12, isNaN(step) ? 1 : step)), answers: ans.slice(0, 19900) }) })
            .then(function (r) { if (!r.ok && window.console) console.warn('Learnova: step not copied to the site database', r.status); }, function () {});
        }
      }
    } catch (e) {}
    return p;
  };
})();
