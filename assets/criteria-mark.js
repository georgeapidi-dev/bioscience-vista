/* BioscienceVista: marking an MYP test or exam against criteria and strands (23 Nov 2026, roadmap phase 3; table attempt_criteria, migration 081).
   Shown under the questions in the marking screen. For each criterion the questions assess, it suggests a level 0–8 from the marks
   (using the teacher's MYP boundaries), and the teacher sets the best-fit level, ticks the strands shown and writes a comment.
   Strand and band wording here is BioscienceVista's own short summary, not the IB's published descriptors: use the subject guide for the full text.
   BVCM.panel(host, { db, attemptId, questions: [{id, criterion, marks}], detail: {qid: {got, max}}, maths, bounds: [8 MYP boundaries] })
   BVCM.studentView(host, { db, attemptId, maths }) shows the saved levels to the student. */
(function () {
  var M = window.BVCM = {};
  var SCI = {
    A: ['Knowing and understanding', ['explains scientific knowledge', 'applies knowledge to solve problems in familiar and unfamiliar situations', 'analyses and evaluates information to make judgements']],
    B: ['Inquiring and designing', ['explains a problem or question to be tested', 'states a testable hypothesis with scientific reasoning', 'explains how to manipulate variables and collect enough data', 'designs a complete, safe method']],
    C: ['Processing and evaluating', ['presents data in suitable forms', 'interprets data with scientific reasoning', 'evaluates the hypothesis against the results', 'evaluates the method', 'explains improvements or extensions']],
    D: ['Reflecting on the impacts of science', ['explains how science is applied to a problem or issue', 'discusses implications (moral, ethical, social, economic, political, cultural or environmental)', 'uses scientific language correctly', 'documents sources']]
  };
  var MATHS = {
    A: ['Knowing and understanding', ['selects appropriate mathematics', 'applies the mathematics correctly', 'solves problems correctly in a variety of contexts']],
    B: ['Investigating patterns', ['applies problem-solving techniques to find patterns', 'describes patterns as general rules', 'proves or verifies the general rules']],
    C: ['Communicating', ['uses mathematical language and notation', 'uses different forms of representation', 'moves between forms of representation', 'communicates a complete, coherent line of reasoning', 'organises information logically']],
    D: ['Applying mathematics in real-life contexts', ['identifies the relevant elements of a real-life situation', 'selects strategies to model it', 'applies the strategies to reach a solution', 'justifies the accuracy of the solution', 'justifies whether the solution makes sense']]
  };
  var BAND = [[0, 'Not reached: the work does not meet the 1–2 band.'], [2, 'Limited: some strands are attempted with major gaps or errors.'], [4, 'Adequate: most strands are attempted, with some errors or missing detail.'], [6, 'Substantial: all strands are addressed, mostly accurately and in detail.'], [8, 'Excellent: all strands are addressed fully, accurately and with insight.']];
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function band(l) { for (var i = 0; i < BAND.length; i++) if (l <= BAND[i][0]) return BAND[i][1]; return BAND[4][1]; }
  function crit(q) { var c = String(q.criterion || '').toUpperCase().replace(/[^ABCD]/g, ''); if (!c) { var m = String(q.section || '').match(/Criteri\w*\s+([ABCD])/); c = m ? m[1] : ''; } return c; }

  M.panel = function (host, o) {
    var C = o.maths ? MATHS : SCI, per = {};
    (o.questions || []).forEach(function (q) { crit(q).split('').forEach(function (L) { var d = (o.detail || {})[q.id] || {}, p = per[L] = per[L] || { g: 0, m: 0, n: 0 }; p.m += +q.marks || 0; p.g += +d.got || 0; p.n++; }); });
    var Ls = Object.keys(per).sort(); if (!Ls.length) { host.innerHTML = ''; return; }
    var B = o.bounds || [1, 13, 26, 38, 51, 63, 76, 88];
    function sug(L) { var p = per[L]; if (!p.m) return null; var pc = 100 * p.g / p.m, n = 0; B.forEach(function (b) { if (pc >= b) n++; }); return n; }
    o.db.from('attempt_criteria').select('criterion,level,strands,comment,updated_at').eq('attempt_id', o.attemptId).then(function (r) {
      var saved = {}, noTable = !!r.error; (r.data || []).forEach(function (x) { saved[x.criterion] = x; });
      host.innerHTML = '<section class="panel" style="border-left:6px solid #7c3aed"><h3 style="margin-top:0">🎯 MYP criteria: best-fit levels</h3><p class="small muted">Suggested levels come from the marks on each criterion\'s questions and your MYP boundaries. Set the final best-fit level, tick the strands this work shows, and add a comment. Strand wording is a short summary: see the subject guide for the full descriptors.</p>' +
        (noTable ? '<p class="small"><b>Saving criterion levels needs database update 081.</b></p>' : '') +
        Ls.map(function (L) { var s = saved[L] || {}, g = sug(L), lv = s.level != null ? s.level : g != null ? g : '', st = s.strands || {};
          return '<div class="cm" data-c="' + L + '" style="border-top:1px solid #e2e8f0;padding:10px 0"><div class="row2" style="align-items:center;flex-wrap:wrap;gap:8px"><b>Criterion ' + L + ': ' + E(C[L][0]) + '</b><span class="small muted">' + per[L].g + ' / ' + per[L].m + ' marks on ' + per[L].n + ' question' + (per[L].n > 1 ? 's' : '') + (g != null ? ' · suggested level ' + g : '') + '</span></div>' +
            '<label class="small" style="display:inline-flex;gap:6px;align-items:center;margin:6px 0">Level <select data-k="lv">' + ['<option value="">–</option>'].concat([0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<option' + (String(n) === String(lv) ? ' selected' : '') + '>' + n + '</option>'; })).join('') + '</select> <span data-band class="muted">' + (lv === '' ? '' : E(band(+lv))) + '</span></label>' +
            '<div class="small">' + C[L][1].map(function (t, i) { var k = ['i', 'ii', 'iii', 'iv', 'v'][i]; return '<label style="display:block;font-weight:400"><input type="checkbox" data-s="' + k + '"' + (st[k] ? ' checked' : '') + '> ' + k + '. ' + E(t) + '</label>'; }).join('') + '</div>' +
            '<label class="f small" style="margin-top:6px">Comment for criterion ' + L + '<textarea data-k="cm" rows="2" placeholder="What the student did well, and one next step">' + E(s.comment || '') + '</textarea></label></div>'; }).join('') +
        '<div class="acts"><button type="button" class="btn main sm" data-save' + (noTable ? ' disabled' : '') + '>Save criterion levels</button> <span class="small" data-msg></span></div></section>';
      host.querySelectorAll('select[data-k="lv"]').forEach(function (s) { s.onchange = function () { s.parentNode.querySelector('[data-band]').textContent = s.value === '' ? '' : band(+s.value); }; });
      var btn = host.querySelector('[data-save]'), msg = host.querySelector('[data-msg]');
      if (btn) btn.onclick = function () {
        var rows = [].slice.call(host.querySelectorAll('.cm')).map(function (d) { var v = d.querySelector('[data-k="lv"]').value, st = {};
          d.querySelectorAll('[data-s]').forEach(function (c) { if (c.checked) st[c.getAttribute('data-s')] = true; });
          return v === '' ? null : { attempt_id: o.attemptId, criterion: d.getAttribute('data-c'), level: +v, strands: st, comment: d.querySelector('[data-k="cm"]').value.trim() || null, updated_at: new Date().toISOString() }; }).filter(Boolean);
        if (!rows.length) { msg.textContent = 'Choose at least one level.'; return; }
        msg.textContent = 'Saving…';
        o.db.from('attempt_criteria').upsert(rows, { onConflict: 'attempt_id,criterion' }).then(function (x) { msg.textContent = x.error ? 'Could not save: ' + x.error.message : '✓ Saved. The student sees these levels when the result is released.'; });
      };
    });
  };

  M.studentView = function (host, o) {
    var C = o.maths ? MATHS : SCI;
    o.db.from('attempt_criteria').select('criterion,level,strands,comment').eq('attempt_id', o.attemptId).order('criterion').then(function (r) {
      var rows = r.data || []; if (r.error || !rows.length) return;
      host.innerHTML = '<section class="panel" style="border-left:6px solid #7c3aed"><h3 style="margin-top:0">🎯 Your MYP criterion levels</h3>' + rows.map(function (x) { var c = C[x.criterion] || ['', []], st = x.strands || {};
        return '<div style="border-top:1px solid #e2e8f0;padding:8px 0"><b>Criterion ' + E(x.criterion) + ': ' + E(c[0]) + ' · level ' + E(x.level) + ' of 8</b><div class="small muted">' + E(band(+x.level)) + '</div>' +
          (Object.keys(st).length ? '<div class="small">Shown in this work: ' + c[1].map(function (t, i) { var k = ['i', 'ii', 'iii', 'iv', 'v'][i]; return st[k] ? k + '. ' + E(t) : ''; }).filter(Boolean).join('; ') + '</div>' : '') +
          (x.comment ? '<p class="small" style="margin:4px 0 0"><b>Teacher:</b> ' + E(x.comment) + '</p>' : '') + '</div>'; }).join('') + '</section>';
    }, function () {});
  };
})();
