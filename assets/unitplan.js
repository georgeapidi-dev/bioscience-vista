/* BioscienceVista MYP unit planner (23 Nov 2026, roadmap phase 2). Teacher dashboard → Unit planner, and each class page.
   A plan per class and unit, filled in from the lessons already in that unit (/assets/unitplan.json: key and related concepts,
   global context, statement of inquiry, inquiry questions, ATL skills; /assets/criteria.json: MYP criteria per lesson).
   The teacher edits it and saves it (table unit_plans, migration 080). Print or save as PDF, or copy the text into ManageBac. */
(function () {
  var UP = window.BVUP = {}, DATA = null, CRIT = null;
  var KEYC = ['Aesthetics', 'Change', 'Communication', 'Communities', 'Connections', 'Creativity', 'Culture', 'Development', 'Form', 'Global interactions', 'Identity', 'Logic', 'Perspective', 'Relationships', 'Systems', 'Time, place and space'];
  var GC = ['Identities and relationships', 'Orientation in space and time', 'Personal and cultural expression', 'Scientific and technical innovation', 'Globalization and sustainability', 'Fairness and development'];
  var CN = { A: 'Knowing and understanding', B: 'Inquiring and designing', C: 'Processing and evaluating', D: 'Reflecting on the impacts of science' };
  var CNM = { A: 'Knowing and understanding', B: 'Investigating patterns', C: 'Communicating', D: 'Applying mathematics in real-life contexts' };
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }); }
  function load() { return DATA ? Promise.resolve() : Promise.all([get('/assets/unitplan.json'), get('/assets/criteria.json')]).then(function (x) { DATA = x[0] || {}; CRIT = x[1] || {}; }); }
  function top(arr, n) { var c = {}; arr.forEach(function (x) { if (x) c[x] = (c[x] || 0) + 1; }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, n || 1); }
  function uniq(arr) { var s = {}, o = []; arr.forEach(function (x) { x = String(x || '').trim(); if (x && !s[x.toLowerCase()]) { s[x.toLowerCase()] = 1; o.push(x); } }); return o; }

  /* the plan suggested by the lessons of a unit */
  function suggest(ls, maths) {
    var d = ls.map(function (l) { return DATA[l.lesson_id] || {}; });
    var crit = {}; ls.forEach(function (l) { var m = CRIT[l.lesson_id] || {}; Object.keys(m).forEach(function (k) { String(m[k]).split('').forEach(function (L) { crit[L] = 1; }); }); });
    return { key: top(d.map(function (x) { return x.k; }))[0] || '', related: top([].concat.apply([], d.map(function (x) { return x.r || []; })), 4).join(', '),
      gc: top(d.map(function (x) { return x.g; }))[0] || '', gcx: '', soi: (d.filter(function (x) { return x.s; })[0] || {}).s || '',
      qf: uniq(d.map(function (x) { return (x.q || {}).f; })).slice(0, 4).join('\n'), qc: uniq(d.map(function (x) { return (x.q || {}).c; })).slice(0, 4).join('\n'), qd: uniq(d.map(function (x) { return (x.q || {}).d; })).slice(0, 3).join('\n'),
      atl: uniq([].concat.apply([], d.map(function (x) { return x.a || []; }))).slice(0, 5).join('\n'), crit: Object.keys(crit).sort().join(''),
      summ: 'Exam-style questions for this unit on BioscienceVista' + (Object.keys(crit).length ? ' (criteria ' + Object.keys(crit).sort().join(', ') + ')' : '') + ', set from the class page with a due date.',
      notes: '', r1: '', r2: '', r3: '' };
  }

  /* ctx: { S, ME, classes, isMyp(c), only (class id), fixed } */
  UP.render = function (p, ctx) {
    var db = ctx.S.db, classes = (ctx.classes || []).slice().sort(function (a, b) { return (ctx.isMyp(b) ? 1 : 0) - (ctx.isMyp(a) ? 1 : 0); });
    var cid = ctx.only || ''; try { cid = cid || sessionStorage.getItem('bv-up-class') || ''; } catch (e) {}
    if (!classes.some(function (c) { return c.id === cid; })) cid = classes.length ? classes[0].id : '';
    if (!classes.length) { p.innerHTML = '<p class="emptybox">Create a class first; its units appear here.</p>'; return; }
    p.innerHTML = '<style>.up-u{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.up-c{border:1px solid #e2e8f0;border-left:6px solid var(--k,#0d9488);border-radius:12px;background:#fff;padding:10px 12px}' +
      '.up-c b{display:block}.up-c .small{margin:4px 0}.up-f label{display:block;margin:0 0 8px;font-weight:700;font-size:.86rem}.up-f input,.up-f select,.up-f textarea{width:100%;box-sizing:border-box;font:inherit;font-weight:400;margin-top:3px;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px}' +
      '.up-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media (max-width:760px){.up-g{grid-template-columns:1fr}}.up-cr label{display:inline-flex;gap:6px;align-items:center;margin-right:14px;font-weight:600}.up-cr input{width:auto}</style>' +
      '<section class="panel tint"><h3 style="margin-top:0">🗺 MYP unit planner</h3><p class="small">Each unit\'s plan starts filled in from its lessons: key and related concepts, global context, statement of inquiry, inquiry questions, ATL skills and the criteria assessed. Change anything, add dates and reflections, then save. Print it, save it as a PDF, or copy the text into ManageBac.</p>' +
      '<label class="f" style="max-width:340px' + (ctx.fixed ? ';display:none' : '') + '">Class<select id="upc">' + classes.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cid ? ' selected' : '') + '>' + E(c.name) + (ctx.isMyp(c) ? '' : ' (not MYP)') + '</option>'; }).join('') + '</select></label></section><div id="upb"><p class="muted">Loading units…</p></div>';
    var body = p.querySelector('#upb');
    p.querySelector('#upc').onchange = function () { cid = this.value; try { sessionStorage.setItem('bv-up-class', cid); } catch (e) {} list(); };
    list();

    function units() {
      return Promise.all([load(), db.from('class_materials').select('path,sort').eq('class_id', cid).order('sort'),
        db.from('unit_plans').select('id,unit,starts_on,ends_on,data,updated_at').eq('class_id', cid).then(function (r) { return r; }, function () { return { error: { message: 'missing' } }; })]).then(function (x) {
        var cm = x[1].data || [], paths = cm.map(function (r) { return r.path; }), so = {}; cm.forEach(function (r, i) { so[r.path] = r.sort == null ? i : r.sort; });
        var plans = {}, noTable = !!(x[2] && x[2].error); ((x[2] && x[2].data) || []).forEach(function (r) { plans[r.unit] = r; });
        if (!paths.length) return { U: [], plans: plans, noTable: noTable };
        var ch = []; for (var i = 0; i < paths.length; i += 150) ch.push(paths.slice(i, i + 150));
        return Promise.all(ch.map(function (c) { return db.from('materials').select('path,title,unit,lesson_id').in('path', c); })).then(function (rs) {
          var M = []; rs.forEach(function (r) { M = M.concat(r.data || []); });
          M.sort(function (a, b) { return so[a.path] - so[b.path]; });
          var U = [], at = {}; M.forEach(function (m) { if (!m.unit) return; if (!at[m.unit]) { at[m.unit] = { unit: m.unit, ls: [] }; U.push(at[m.unit]); } at[m.unit].ls.push(m); });
          return { U: U, plans: plans, noTable: noTable };
        });
      });
    }
    function list() {
      body.innerHTML = '<p class="muted">Loading units…</p>';
      units().then(function (r) {
        if (!r.U.length) { body.innerHTML = '<p class="emptybox">This class has no lessons yet. Add lessons to the class, and their units appear here.</p>'; return; }
        body.innerHTML = (r.noTable ? '<p class="panel tint small"><b>Saving plans needs database update 080.</b> You can still open, print and copy each plan.</p>' : '') +
          '<p class="small muted">' + r.U.length + ' units in the order you teach them. ' + Object.keys(r.plans).length + ' saved.</p><div class="up-u">' + r.U.map(function (u, i) { var pl = r.plans[u.unit];
            return '<div class="up-c" style="--k:' + (pl ? '#16a34a' : '#0d9488') + '"><b>' + E(u.unit.replace(/^MYP \d · /, '')) + '</b><div class="small muted">' + u.ls.length + ' lessons' + (pl && pl.starts_on ? ' · ' + E(pl.starts_on) + (pl.ends_on ? ' to ' + E(pl.ends_on) : '') : '') + (pl ? ' · saved' : '') + '</div><button type="button" class="btn sm main" data-u="' + i + '">' + (pl ? 'Open plan' : 'Plan this unit') + '</button></div>'; }).join('') + '</div>';
        body.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () { open(r.U[+b.getAttribute('data-u')], r.plans[r.U[+b.getAttribute('data-u')].unit], r.noTable); }; });
      }).catch(function (e) { body.innerHTML = '<p class="msg">' + E(e && e.message || e) + '</p>'; });
    }
    function open(u, saved, noTable) {
      var cls = classes.filter(function (c) { return c.id === cid; })[0] || {}, maths = /math/i.test([cls.subject, cls.course, cls.name].join(' ')), CNAMES = maths ? CNM : CN;
      var v = Object.assign(suggest(u.ls, maths), (saved && saved.data) || {}), st = (saved && saved.starts_on) || '', en = (saved && saved.ends_on) || '';
      var ta = function (k, label, rows, hint) { return '<label>' + label + (hint ? ' <span class="small muted" style="font-weight:400">' + hint + '</span>' : '') + '<textarea data-k="' + k + '" rows="' + (rows || 3) + '">' + E(v[k]) + '</textarea></label>'; };
      var sel = function (k, label, opts) { return '<label>' + label + '<select data-k="' + k + '">' + ['<option value=""></option>'].concat(opts.map(function (o) { return '<option' + (o === v[k] ? ' selected' : '') + '>' + E(o) + '</option>'; })).join('') + '</select></label>'; };
      body.innerHTML = '<p><button type="button" class="btn sm" id="upback">← All units</button></p><section class="panel up-f" id="upform"><h3 style="margin-top:0">' + E(u.unit) + '</h3><p class="small muted">' + E(cls.name || '') + ' · ' + u.ls.length + ' lessons. ' + (saved ? 'Saved ' + E(new Date(saved.updated_at).toLocaleString()) + '.' : 'Suggested from the lessons in this unit: check and edit, then save.') + '</p>' +
        '<div class="up-g"><label>Start date<input type="date" data-d="s" value="' + E(st) + '"></label><label>End date<input type="date" data-d="e" value="' + E(en) + '"></label></div>' +
        '<h4>Inquiry</h4><div class="up-g">' + sel('key', 'Key concept', KEYC) + '<label>Related concepts<input data-k="related" value="' + E(v.related) + '"></label>' + sel('gc', 'Global context', GC) + '<label>Exploration of the global context<input data-k="gcx" value="' + E(v.gcx) + '" placeholder="e.g. How scientific innovation changes health care"></label></div>' +
        ta('soi', 'Statement of inquiry', 2) + '<div class="up-g">' + ta('qf', 'Factual questions', 4, 'one per line') + ta('qc', 'Conceptual questions', 4, 'one per line') + '</div>' + ta('qd', 'Debatable questions', 3, 'one per line') +
        '<h4>Objectives and assessment</h4><div class="up-cr">' + 'ABCD'.split('').map(function (L) { return '<label><input type="checkbox" data-c="' + L + '"' + (String(v.crit).indexOf(L) >= 0 ? ' checked' : '') + '> ' + L + ': ' + E(CNAMES[L]) + '</label>'; }).join('') + '</div>' +
        ta('summ', 'Summative assessment', 3) + ta('atl', 'Approaches to learning (ATL) skills', 4, 'one per line') +
        '<h4>Learning experiences</h4><ol class="small">' + u.ls.map(function (l) { return '<li><a href="' + E(l.path) + '" target="_blank" rel="noopener">' + E(l.title) + '</a></li>'; }).join('') + '</ol>' + ta('notes', 'Teaching notes, differentiation and resources', 3) +
        '<h4>Reflection</h4>' + ta('r1', 'Before teaching the unit', 2) + ta('r2', 'During teaching', 2) + ta('r3', 'After teaching the unit', 2) +
        '<div class="acts"><button type="button" class="btn main sm" id="upsave"' + (noTable ? ' disabled title="Needs database update 080"' : '') + '>💾 Save plan</button> <button type="button" class="btn sm" id="upprint">🖨 Print or save as PDF</button> <button type="button" class="btn sm" id="upcopy">📋 Copy text for ManageBac</button> <button type="button" class="btn sm" id="upreset">↺ Fill again from the lessons</button> <span class="small" id="upmsg"></span></div></section>';
      var f = body.querySelector('#upform'), msg = f.querySelector('#upmsg');
      function val() { var o = {}; f.querySelectorAll('[data-k]').forEach(function (x) { o[x.getAttribute('data-k')] = x.value; }); o.crit = [].slice.call(f.querySelectorAll('[data-c]')).filter(function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-c'); }).join(''); return o; }
      function text() { var o = val(), L = function (t, x) { return x ? t + ':\n' + x + '\n\n' : ''; };
        return 'MYP unit plan: ' + u.unit + '\n' + (cls.name || '') + (f.querySelector('[data-d="s"]').value ? '\nDates: ' + f.querySelector('[data-d="s"]').value + ' to ' + f.querySelector('[data-d="e"]').value : '') + '\n\n' +
          L('Key concept', o.key) + L('Related concepts', o.related) + L('Global context', o.gc + (o.gcx ? ': ' + o.gcx : '')) + L('Statement of inquiry', o.soi) + L('Factual questions', o.qf) + L('Conceptual questions', o.qc) + L('Debatable questions', o.qd) +
          L('Objectives (criteria)', o.crit.split('').map(function (k) { return k + ': ' + CNAMES[k]; }).join('\n')) + L('Summative assessment', o.summ) + L('ATL skills', o.atl) +
          L('Learning experiences', u.ls.map(function (l, i) { return (i + 1) + '. ' + l.title; }).join('\n')) + L('Teaching notes', o.notes) + L('Reflection before', o.r1) + L('Reflection during', o.r2) + L('Reflection after', o.r3) + 'Prepared on BioscienceVista by ' + ((ctx.ME.profile && ctx.ME.profile.full_name) || 'the teacher');
      }
      body.querySelector('#upback').onclick = list;
      f.querySelector('#upreset').onclick = function () { if (confirm('Replace what is on screen with the suggestions from the lessons? Your saved plan stays saved until you press Save.')) open(u, null, noTable); };
      f.querySelector('#upcopy').onclick = function () { var t = text(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { msg.textContent = '✓ Copied. Paste it into the ManageBac unit planner.'; }, function () { var w = window.open('', '_blank'); if (w) { w.document.body.innerText = t; } }); };
      f.querySelector('#upprint').onclick = function () { var w = window.open('', '_blank'); if (!w) { msg.textContent = 'Allow pop-ups to print.'; return; }
        w.document.write('<!doctype html><meta charset="utf-8"><title>' + E(u.unit) + '</title><style>body{font:14px/1.45 system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px}h1{font-size:20px}pre{white-space:pre-wrap;font:inherit}</style><h1>MYP unit plan</h1><pre>' + E(text()) + '</pre><script>setTimeout(function(){print()},300)<\/script>'); w.document.close(); };
      f.querySelector('#upsave').onclick = function () {
        var s = f.querySelector('[data-d="s"]').value || null, e = f.querySelector('[data-d="e"]').value || null;
        if (s && e && e < s) { msg.textContent = 'The end date is before the start date.'; return; }
        msg.textContent = 'Saving…';
        db.from('unit_plans').upsert({ class_id: cid, teacher_id: ctx.ME.user.id, unit: u.unit, starts_on: s, ends_on: e, data: val(), updated_at: new Date().toISOString() }, { onConflict: 'class_id,unit' }).select('id,unit,starts_on,ends_on,data,updated_at').then(function (x) {
          if (x.error) { msg.textContent = 'Could not save: ' + x.error.message; return; }
          saved = (x.data || [])[0] || saved; msg.textContent = '✓ Saved.';
        });
      };
    }
  };
})();
