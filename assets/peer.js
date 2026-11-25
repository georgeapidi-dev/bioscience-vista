/* VistaEd peer assessment (23 Nov 2026, roadmap phase 3; table peer_reviews and its functions, migration 082).
   Students: "🤝 Peer reviews" on the quizzes page lists classmates' scripts to review (written answers only, no names) and the
   feedback classmates gave on their own released work. For each answer: what went well, even better if, and an optional mark.
   Teachers: BVPEER.forAttempt(host, db, attemptId) shows the reviews of one script in the marking screen.
   Peer marks are suggestions only: they never change the real mark. */
(function () {
  var P = window.BVPEER = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var T = function () { return window.BVT || {}; };
  function rich(p) { var t = T(); return t.rich ? t.rich(p, true) : E(p); }
  function ans(v) { var t = T(); if (v == null || v === '') return '<i>No answer</i>'; if (typeof v === 'string' && /^data:image\//.test(v)) return '<img alt="Drawing" src="' + E(v) + '" style="max-width:100%;border:1px solid #e2e8f0;border-radius:8px">'; try { return t.answerHtml ? t.answerHtml(v) : E(typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { return E(String(v)); } }
  var CSS = '<style>.pr-it{border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin:8px 0;background:#fff}.pr-a{background:#f8fafc;border-left:4px solid #94a3b8;border-radius:8px;padding:8px 10px;margin:6px 0}' +
    '.pr-g{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media (max-width:700px){.pr-g{grid-template-columns:1fr}}.pr-g textarea{width:100%;box-sizing:border-box}.pr-fb{border-left:4px solid #0d9488;padding:4px 10px;margin:6px 0}</style>';

  P.studentBox = function (host, S) {
    Promise.all([S.db.rpc('my_peer_reviews'), S.db.rpc('my_peer_feedback')]).then(function (x) {
      if (x[0].error) { host.remove(); return; }
      var todo = x[0].data || [], fb = (x[1] && x[1].data) || [];
      if (!todo.length && !fb.length) { host.remove(); return; }
      var open = todo.filter(function (r) { return r.status === 'open'; });
      host.innerHTML = CSS + '<h3>🤝 Peer reviews' + (open.length ? ' <span>' + open.length + ' to do</span>' : '') + '</h3><p class="small muted">Read a classmate\'s answers (no names are shown) and help them improve. Be kind, specific and helpful. Your suggestions do not change anyone\'s mark.</p>' +
        todo.map(function (r, i) { return '<div class="pr-it"><b>' + E(r.quiz_title) + '</b> <span class="small muted">· script ' + (i + 1) + '</span> ' + (r.status === 'submitted' ? '<span class="pill ok">✓ Sent</span>' : '<span class="pill new">To do</span>') + ' <button type="button" class="btn sm' + (r.status === 'open' ? ' main' : '') + '" data-rv="' + E(r.id) + '">' + (r.status === 'open' ? 'Review' : 'Edit') + '</button><div data-f="' + E(r.id) + '"></div></div>'; }).join('') +
        (fb.length ? '<h3 style="margin-top:14px">💬 Feedback from classmates</h3>' + fb.map(function (f) { return '<div class="pr-it"><b>' + E(f.quiz_title) + '</b>' + Object.keys(f.given || {}).map(function (k, j) { var g = f.given[k] || {}; if (!g.www && !g.ebi) return ''; return '<div class="pr-fb"><div class="small muted">Answer ' + (j + 1) + '</div>' + (g.www ? '<div>✅ <b>What went well:</b> ' + E(g.www) + '</div>' : '') + (g.ebi ? '<div>🔧 <b>Even better if:</b> ' + E(g.ebi) + '</div>' : '') + '</div>'; }).join('') + '</div>'; }).join('') : '');
      host.querySelectorAll('[data-rv]').forEach(function (b) { b.onclick = function () { var r = todo.filter(function (z) { return z.id === b.getAttribute('data-rv'); })[0]; form(host.querySelector('[data-f="' + r.id + '"]'), r); b.hidden = true; }; });
    }, function () { host.remove(); });

    function form(box, r) {
      var items = r.items || [], g = r.given || {};
      if (!items.length) { box.innerHTML = '<p class="small muted">This test has no written answers to review.</p>'; return; }
      box.innerHTML = items.map(function (it, j) { var v = g[it.qid] || {};
        return '<div style="border-top:1px solid #e2e8f0;padding:8px 0" data-q="' + E(it.qid) + '"><div class="small"><b>Question ' + (j + 1) + '</b> (' + E(it.marks) + ' mark' + (it.marks > 1 ? 's' : '') + '): ' + rich(it.prompt) + '</div><div class="pr-a">' + ans(it.answer) + '</div>' +
          '<div class="pr-g"><label class="small">✅ What went well<textarea data-k="www" rows="2" maxlength="600" placeholder="One thing that is correct or clearly explained">' + E(v.www || '') + '</textarea></label><label class="small">🔧 Even better if<textarea data-k="ebi" rows="2" maxlength="600" placeholder="One change that would earn more marks">' + E(v.ebi || '') + '</textarea></label></div>' +
          '<label class="small">Suggested mark <input type="number" data-k="mk" min="0" max="' + E(it.marks) + '" step="0.5" value="' + E(v.mk != null ? v.mk : '') + '" style="width:5em"> / ' + E(it.marks) + '</label></div>'; }).join('') +
        '<div class="acts"><button type="button" class="btn main sm" data-send>Send my review</button> <span class="small" data-m></span></div>';
      box.querySelector('[data-send]').onclick = function () {
        var out = {}, empty = 0, bad = false;
        box.querySelectorAll('[data-q]').forEach(function (d) { var it = items.filter(function (z) { return z.qid === d.getAttribute('data-q'); })[0], www = d.querySelector('[data-k=www]').value.trim(), ebi = d.querySelector('[data-k=ebi]').value.trim(), mk = d.querySelector('[data-k=mk]').value;
          if (!www && !ebi) empty++; if (mk !== '' && (+mk < 0 || +mk > +it.marks)) bad = true;
          out[d.getAttribute('data-q')] = { www: www, ebi: ebi, mk: mk === '' ? null : +mk }; });
        var m = box.querySelector('[data-m]');
        if (bad) { m.textContent = 'A suggested mark is outside the marks for that question.'; return; }
        if (empty === items.length) { m.textContent = 'Write at least one comment before sending.'; return; }
        m.textContent = 'Sending…';
        S.db.rpc('submit_peer_review', { rid: r.id, given: out }).then(function (x) { m.textContent = x.error ? 'Could not send: ' + x.error.message : '✓ Sent. Thank you for helping your classmate.'; if (!x.error) r.status = 'submitted', r.given = out; });
      };
    }
  };

  P.forAttempt = function (host, db, attemptId) {
    db.from('peer_reviews').select('status,given,submitted_at').eq('attempt_id', attemptId).then(function (r) {
      var rows = (r.data || []).filter(function (x) { return x.status === 'submitted'; }); if (r.error || !(r.data || []).length) return;
      host.innerHTML = CSS + '<details class="panel"><summary><b>🤝 Classmates\' reviews</b> · ' + rows.length + ' of ' + r.data.length + ' sent</summary>' + (rows.length ? rows.map(function (x, i) {
        return '<div class="pr-it"><div class="small muted">Review ' + (i + 1) + '</div>' + Object.keys(x.given || {}).map(function (k, j) { var g = x.given[k] || {}; return '<div class="pr-fb"><div class="small muted">Answer ' + (j + 1) + (g.mk != null ? ' · suggested ' + E(g.mk) : '') + '</div>' + (g.www ? '<div>✅ ' + E(g.www) + '</div>' : '') + (g.ebi ? '<div>🔧 ' + E(g.ebi) + '</div>' : '') + '</div>'; }).join('') + '</div>'; }).join('') : '<p class="small muted">No reviews sent yet.</p>') + '</details>';
    }, function () {});
  };
})();
