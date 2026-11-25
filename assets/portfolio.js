/* VistaEd student portfolio (23 Nov 2026, roadmap phase 4; table portfolio_items, migration 085).
   Students collect their best work across subjects: a lesson they completed, a quiz or exam result, a link (Google Doc,
   video, photos of a model) or a short written piece, each with a reflection and the ATL skill it shows. Teachers comment
   on items; parents read the items shared with them. Anyone who can see a portfolio can print it or save it as a PDF.
   BVPF.student(host, S, me)                     the student's own portfolio, with "Add to my portfolio"
   BVPF.view(host, S, { ids, names, teacher })   read (and, for teachers, comment on) the portfolios of these students */
(function () {
  var P = window.BVPF = {};
  var ATL = ['Thinking', 'Communication', 'Research', 'Self-management', 'Social'];
  var KIND = { lesson: '🧪 Lesson', quiz: '📝 Quiz or exam', link: '🔗 Link', text: '✍️ Written piece' };
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  P.CSS = '<style>.pf-it{border:1px solid #e2e8f0;border-left:6px solid #7c3aed;border-radius:12px;padding:10px 12px;margin:8px 0;background:#fff}.pf-it h4{margin:0 0 2px}.pf-meta{font-size:.78rem;color:#64748b}' +
    '.pf-r{margin:6px 0 0;font-size:.9rem}.pf-r b{color:#0f1f3d}.pf-tc{margin-top:8px;border-left:4px solid #0d9488;background:#f0fdfa;padding:6px 10px;border-radius:6px;font-size:.9rem}.pf-f label{display:block;margin:0 0 8px;font-weight:700;font-size:.86rem}' +
    '.pf-f input,.pf-f select,.pf-f textarea{width:100%;box-sizing:border-box;font:inherit;font-weight:400;margin-top:3px;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px}.pf-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media (max-width:700px){.pf-g{grid-template-columns:1fr}}</style>';
  function card(x, o) {
    o = o || {}; var ev = x.evidence || {}, url = x.kind === 'lesson' && /^\/[a-z0-9\/-]+$/i.test(x.ref || '') ? x.ref : safeUrl(x.kind === 'link' ? x.ref : '');
    return '<div class="pf-it" data-id="' + E(x.id) + '"><div class="pf-meta">' + E(KIND[x.kind] || x.kind) + (x.subject ? ' · ' + E(x.subject) : '') + (x.atl ? ' · ATL: ' + E(x.atl) : '') + ' · ' + E(new Date(x.created_at).toLocaleDateString()) + (o.mine ? (x.share_parents ? ' · 👪 shared with parents' : ' · 🔒 not shared with parents') : '') + '</div>' +
      '<h4>' + (url ? '<a href="' + E(url) + '" target="_blank" rel="noopener">' + E(x.title) + '</a>' : E(x.title)) + '</h4>' +
      (ev.pct != null ? '<div class="pf-meta">Result: ' + E(ev.score) + ' / ' + E(ev.max) + ' (' + E(ev.pct) + '%)</div>' : '') + (ev.steps ? '<div class="pf-meta">Steps saved: ' + E(ev.steps) + ' of 6</div>' : '') +
      (x.body ? '<div class="pf-r" style="white-space:pre-wrap">' + E(x.body) + '</div>' : '') +
      (x.why ? '<p class="pf-r"><b>Why I chose it:</b> ' + E(x.why) + '</p>' : '') + (x.shows ? '<p class="pf-r"><b>What it shows I can do:</b> ' + E(x.shows) + '</p>' : '') + (x.next_step ? '<p class="pf-r"><b>My next step:</b> ' + E(x.next_step) + '</p>' : '') +
      (x.teacher_comment ? '<div class="pf-tc"><b>Teacher:</b> ' + E(x.teacher_comment) + '</div>' : '') +
      (o.teacher ? '<div class="pf-f" style="margin-top:8px"><label>Your comment<textarea data-tc rows="2" maxlength="2000" placeholder="What this work shows, and one next step">' + E(x.teacher_comment || '') + '</textarea></label><button type="button" class="btn sm" data-tcs>Save comment</button> <span class="small" data-tm></span></div>' : '') +
      (o.mine ? '<div class="acts" style="margin-top:6px"><button type="button" class="btn sm" data-share>' + (x.share_parents ? 'Stop sharing with parents' : 'Share with parents') + '</button><button type="button" class="btn sm" data-del>Remove</button></div>' : '') + '</div>';
  }
  function printAll(items, who) {
    var w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print the portfolio.'); return; }
    w.document.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Portfolio · ' + E(who || '') + '</title><style>body{font:14px/1.5 system-ui,sans-serif;max-width:760px;margin:20px auto;padding:0 14px;color:#0f172a}a{color:#0f1f3d}' + P.CSS.replace(/<\/?style>/g, '') + '@media print{.noprint{display:none}.pf-it{page-break-inside:avoid}}</style></head><body><p class="noprint"><button onclick="print()">🖨 Print or save as PDF</button></p><h1>Portfolio' + (who ? ' · ' + E(who) : '') + '</h1><p class="pf-meta">VistaEd · ' + items.length + ' pieces of work · printed ' + new Date().toLocaleDateString() + '</p>' +
      items.map(function (x) { return card(x); }).join('') + '</body></html>'); w.document.close();
  }

  P.student = function (host, S, me) {
    var uid = me.user.id;
    function load() {
      S.db.from('portfolio_items').select('*').eq('student_id', uid).order('created_at', { ascending: false }).then(function (r) {
        if (r.error) { host.remove(); return; }
        var items = r.data || [];
        host.innerHTML = P.CSS + '<h3>🗂 My portfolio <span>' + items.length + '</span></h3><p class="small muted">Collect your best work from any subject and say what it shows. Your teachers can see it and comment; you choose what your parents see.</p>' +
          '<div class="acts"><button type="button" class="btn main sm" data-add>＋ Add to my portfolio</button>' + (items.length ? '<button type="button" class="btn sm" data-print>🖨 Print or save as PDF</button>' : '') + '</div><div data-form></div>' +
          (items.length ? items.map(function (x) { return card(x, { mine: true }); }).join('') : '<p class="small muted">Nothing here yet. Choose a lesson, a quiz result or a project you are proud of.</p>');
        host.querySelector('[data-add]').onclick = function () { form(host.querySelector('[data-form]')); };
        var pb = host.querySelector('[data-print]'); if (pb) pb.onclick = function () { printAll(items, (me.profile && me.profile.full_name) || ''); };
        host.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var id = b.closest('[data-id]').getAttribute('data-id'), x = items.filter(function (z) { return z.id === id; })[0]; S.db.from('portfolio_items').update({ share_parents: !x.share_parents }).eq('id', id).then(load); }; });
        host.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this piece from your portfolio? Your original work stays where it is.')) return; S.db.from('portfolio_items').delete().eq('id', b.closest('[data-id]').getAttribute('data-id')).then(load); }; });
      }, function () { host.remove(); });
    }
    function form(box) {
      box.innerHTML = '<p class="muted">Loading your work…</p>';
      Promise.all([S.db.from('lesson_work').select('lesson,step,saved_at').eq('student_id', uid).order('saved_at', { ascending: false }).limit(400),
        S.db.from('student_results').select('quiz_id,title,score,max_score,recorded_at').eq('student_id', uid).not('quiz_id', 'is', null).order('recorded_at', { ascending: false }).limit(100)]).then(function (x) {
        var L = {}, order = []; ((x[0] && x[0].data) || []).forEach(function (w) { if (!L[w.lesson]) { L[w.lesson] = { steps: {}, at: w.saved_at }; order.push(w.lesson); } L[w.lesson].steps[w.step] = 1; });
        var Q = ((x[1] && x[1].data) || []).filter(function (q) { return q.score != null && +q.max_score > 0; });
        return (order.length ? S.db.from('materials').select('lesson_id,path,title,subject').in('lesson_id', order.slice(0, 150)) : Promise.resolve({ data: [] })).then(function (m) {
          var M = {}; ((m && m.data) || []).forEach(function (r) { M[r.lesson_id] = r; });
          var lessons = order.filter(function (k) { return M[k]; }).slice(0, 80);
          box.innerHTML = '<section class="panel pf-f"><h4 style="margin-top:0">Add a piece of work</h4><div class="pf-g"><label>Type<select data-k="kind"><option value="lesson">🧪 A lesson I completed</option><option value="quiz">📝 A quiz or exam result</option><option value="link">🔗 A link (Google Doc, video, photos)</option><option value="text">✍️ A short written piece</option></select></label><label>Subject<input data-k="subject" maxlength="80" placeholder="e.g. Biology"></label></div>' +
            '<label data-w="lesson">Lesson<select data-k="lesson">' + (lessons.length ? lessons.map(function (k) { var r = M[k]; return '<option value="' + E(k) + '">' + E(r.title) + ' (' + Object.keys(L[k].steps).length + ' steps saved)</option>'; }).join('') : '<option value="">No saved lesson work yet</option>') + '</select></label>' +
            '<label data-w="quiz" hidden>Result<select data-k="quiz">' + (Q.length ? Q.map(function (q, i) { return '<option value="' + i + '">' + E(q.title) + ' · ' + E(q.score) + '/' + E(q.max_score) + '</option>'; }).join('') : '<option value="">No marked results yet</option>') + '</select></label>' +
            '<label data-w="link" hidden>Link (https://…)<input data-k="url" maxlength="500" placeholder="https://docs.google.com/…"></label><label data-w="link text" hidden>Title<input data-k="title" maxlength="200"></label>' +
            '<label data-w="text" hidden>Your piece of writing<textarea data-k="body" rows="5" maxlength="8000"></textarea></label>' +
            '<label>Why I chose it<textarea data-k="why" rows="2" maxlength="2000" placeholder="I am proud of this because…"></textarea></label><label>What it shows I can do<textarea data-k="shows" rows="2" maxlength="2000" placeholder="It shows I can…"></textarea></label><label>My next step<textarea data-k="next" rows="2" maxlength="2000" placeholder="Next time I will…"></textarea></label>' +
            '<div class="pf-g"><label>ATL skill it shows<select data-k="atl"><option value=""></option>' + ATL.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label><label style="display:flex;gap:6px;align-items:center;margin-top:24px"><input type="checkbox" data-k="share" checked style="width:auto"> Share with my parents</label></div>' +
            '<div class="acts"><button type="button" class="btn main sm" data-save>Save to my portfolio</button><button type="button" class="btn sm" data-cancel>Cancel</button> <span class="small" data-m></span></div></section>';
          var f = function (k) { return box.querySelector('[data-k="' + k + '"]'); }, kindSel = f('kind');
          function show() { box.querySelectorAll('[data-w]').forEach(function (el) { el.hidden = el.getAttribute('data-w').split(' ').indexOf(kindSel.value) < 0; }); }
          kindSel.onchange = show; show();
          box.querySelector('[data-cancel]').onclick = function () { box.innerHTML = ''; };
          box.querySelector('[data-save]').onclick = function () {
            var k = kindSel.value, m = box.querySelector('[data-m]'), row = { student_id: uid, kind: k, subject: f('subject').value.trim() || null, atl: f('atl').value || null, why: f('why').value.trim() || null, shows: f('shows').value.trim() || null, next_step: f('next').value.trim() || null, share_parents: f('share').checked, evidence: {} };
            if (k === 'lesson') { var id = f('lesson').value, r = M[id]; if (!r) { m.textContent = 'Choose a lesson.'; return; } row.title = r.title; row.ref = r.path; row.subject = row.subject || r.subject || null; row.evidence = { steps: Object.keys(L[id].steps).length, lesson: id }; }
            else if (k === 'quiz') { var q = Q[+f('quiz').value]; if (!q) { m.textContent = 'Choose a result.'; return; } row.title = q.title; row.ref = q.quiz_id; row.evidence = { score: +q.score, max: +q.max_score, pct: Math.round(100 * q.score / q.max_score) }; }
            else if (k === 'link') { var u = f('url').value.trim(); if (!safeUrl(u)) { m.textContent = 'Paste a full link starting with https://'; return; } row.ref = u; row.title = f('title').value.trim() || u.replace(/^https?:\/\//, '').slice(0, 80); }
            else { row.body = f('body').value.trim(); row.title = f('title').value.trim(); if (!row.title || !row.body) { m.textContent = 'Give it a title and write the piece.'; return; } }
            if (!row.why && !row.shows) { m.textContent = 'Add a reflection: why you chose it, or what it shows.'; return; }
            m.textContent = 'Saving…';
            S.db.from('portfolio_items').insert(row).then(function (x) { if (x.error) { m.textContent = 'Could not save: ' + x.error.message; return; } load(); });
          };
        });
      });
    }
    load();
  };

  P.view = function (host, S, o) {
    var ids = (o.ids || []).filter(Boolean); if (!ids.length) { host.remove(); return; }
    S.db.from('portfolio_items').select('*').in('student_id', ids).order('created_at', { ascending: false }).limit(500).then(function (r) {
      if (r.error) { if (o.teacher) host.innerHTML = '<p class="small muted">Portfolios need database update 085.</p>'; else host.remove(); return; }
      var by = {}; (r.data || []).forEach(function (x) { (by[x.student_id] = by[x.student_id] || []).push(x); });
      if (!o.teacher && !(r.data || []).length) { host.remove(); return; }
      host.innerHTML = P.CSS + '<h3>🗂 ' + (o.teacher ? 'Student portfolios' : 'Portfolio') + '</h3>' + (o.teacher ? '<p class="small muted">Work each student chose for their portfolio, with their reflections. Add a comment to any piece; the student sees it straight away.</p>' : '') +
        ids.map(function (sid) { var xs = by[sid] || []; if (!o.teacher && !xs.length) return '';
          return '<details class="panel" data-s="' + E(sid) + '"' + (ids.length === 1 ? ' open' : '') + '><summary><b>' + E((o.names || {})[sid] || 'Student') + '</b> · ' + xs.length + ' piece' + (xs.length === 1 ? '' : 's') + '</summary>' + (xs.length ? '<button type="button" class="btn sm" data-pr="' + E(sid) + '">🖨 Print</button>' + xs.map(function (x) { return card(x, { teacher: o.teacher }); }).join('') : '<p class="small muted">Nothing added yet.</p>') + '</details>'; }).join('');
      host.querySelectorAll('[data-pr]').forEach(function (b) { b.onclick = function () { var sid = b.getAttribute('data-pr'); printAll(by[sid] || [], (o.names || {})[sid]); }; });
      host.querySelectorAll('[data-tcs]').forEach(function (b) { b.onclick = function () { var it = b.closest('[data-id]'), m = it.querySelector('[data-tm]');
        S.db.from('portfolio_items').update({ teacher_comment: it.querySelector('[data-tc]').value.trim() || null }).eq('id', it.getAttribute('data-id')).then(function (x) { m.textContent = x.error ? 'Could not save: ' + x.error.message : '✓ Saved.'; }); }; });
    }, function () { host.remove(); });
  };
})();
