/* Teacher dashboard · Learnova
   Everything here runs with the teacher's own login. Row Level Security decides what each teacher can read or change;
   no service-role key or admin password is ever used in the browser. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME, TOPICS = [], CLASSES = [];
  var TABS = [['overview', 'Overview'], ['work', 'Lesson work'], ['questions', '❓ Student questions'], ['labs', '🔬 Lab work'], ['approvals', 'Approvals'], ['classes', 'Classes'], ['students', 'Students & results'], ['quizzes', 'Quizzes & exams'], ['lessons', 'Lesson builder'], ['marking', 'Marking'], ['content', 'Content'], ['bookings', 'Bookings'], ['roles', 'People & roles'], ['activity', 'Activity']];
  var ADMIN_TABS = ['bookings', 'roles', 'activity'];

  S.guard(app, { staff: true }).then(function (me) { ME = me; return Promise.all([refs(), loadScript('/assets/quiz-import.js?v=' + (window.BV_VER || '5'))]); }).then(function () { window.addEventListener('hashchange', route); route(); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function loadScript(src) { return new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = src; x.onload = ok; x.onerror = function () { bad(new Error('Could not load ' + src)); }; document.head.appendChild(x); }); }
  var ARCHIVED = [];
  function refs() {
    return Promise.all([S.db.from('topics').select('id,name,code,programme,parent_id,sort_order, subjects(name,sort_order)').order('sort_order'), S.db.from('classes').select('*').order('name')])
      .then(function (x) { TOPICS = x[0].data || []; var all = (x[1].data || []).filter(function (c) { return c.owner_kind === 'main' && (ME.admin || c.teacher_id === ME.user.id); });   /* main-site classes only; your own classes are in My classes (/teach/) */ CLASSES = all.filter(function (c) { return !c.archived_at; }); ARCHIVED = all.filter(function (c) { return c.archived_at; }); });
  }
  function topicOpts(sel) {   // grouped by subject; subtopics indented under their main topic
    var subj = {}, order = [];
    TOPICS.forEach(function (t) { var n = t.subjects ? t.subjects.name : 'Other'; if (!subj[n]) { subj[n] = []; order.push(n); } subj[n].push(t); });
    var so = {}; TOPICS.forEach(function (t) { if (t.subjects) so[t.subjects.name] = t.subjects.sort_order; }); order.sort(function (a, b) { return (so[a] || 99) - (so[b] || 99); });
    return '<option value="">(none)</option>' + order.map(function (n) {
      var ts = subj[n], tops = ts.filter(function (t) { return !t.parent_id; }).sort(function (a, b) { return a.sort_order - b.sort_order; });
      var opt = function (t, pad) { return '<option value="' + t.id + '"' + (t.id === sel ? ' selected' : '') + '>' + pad + E(t.name) + '</option>'; };
      return '<optgroup label="' + E(n) + '">' + tops.map(function (t) { return opt(t, '') + ts.filter(function (c) { return c.parent_id === t.id; }).sort(function (a, b) { return a.sort_order - b.sort_order; }).map(function (c) { return opt(c, '\u00a0\u00a0\u00a0— '); }).join(''); }).join('') + '</optgroup>';
    }).join('');
  }
  function classOpts(sel, blank) { return (blank ? '<option value="">' + blank + '</option>' : '') + CLASSES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + E(c.name) + '</option>'; }).join(''); }
  function toast(m, bad) { if (BV.toast) BV.toast(m, bad); }
  function ok(r, msg) { if (r.error) { toast(S.nice(r.error), true); return false; } if (msg) toast(msg); return true; }
  function code6() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; var b = new Uint8Array(6); crypto.getRandomValues(b); for (var i = 0; i < 6; i++) s += a[b[i] % a.length]; return s; }
  function dt(v) { if (!v) return ''; var d = new Date(v); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function iso(v) { return v ? new Date(v).toISOString() : null; }

  function route() {
    clearInterval(LIVE);
    var h = location.hash.slice(1).split('/'), tab = h[0] || 'overview';
    if (ADMIN_TABS.indexOf(tab) >= 0 && !ME.admin) tab = 'overview';
    var head = '<div class="row2"><div><p class="label">Main site · courses and their classes</p><h2>' + E(ME.profile.full_name || ME.user.email) + (ME.admin ? ' <span class="pill">Admin</span>' : '') + '</h2></div><div class="cta">' + (ME.admin ? '<a class="btn main sm" href="/admin/">Admin: join requests, members, payments</a>' : '') + '<button class="btn sm" type="button" id="so">Log out</button></div></div>' +
      '<nav class="tabs" aria-label="Teacher sections">' + TABS.filter(function (t) { return ADMIN_TABS.indexOf(t[0]) < 0 || ME.admin; }).map(function (t) { return '<a href="#' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</a>'; }).join('') + '</nav><div id="pane"><p class="muted">Loading…</p></div>';
    app.innerHTML = head; app.querySelector('#so').onclick = S.signOut;
    var pane = app.querySelector('#pane');
    ({ overview: overview, work: lessonWork, questions: helpDesk, labs: labWork, approvals: approvals, activity: activity, lessons: lessons, classes: classes, students: students, quizzes: quizzes, marking: marking, content: content, roles: roles, bookings: bookings }[tab] || overview)(pane, h.slice(1));
  }

  /* ---------- lesson work: each student's completed interactive lesson, shown as a finished document ---------- */
  var LW = null;   // cache: {rows, steps, specs}
  function lwParse(line) {
    var head = (String(line).match(/^\[AUTO[^\]]*\]\s*/) || [''])[0], rest = String(line).slice(head.length), out = { answers: [], fb: {}, total: null, max: null, this: null };
    var t = head.match(/TOTAL=([\d.]+)\/([\d.]+)/), th = head.match(/THIS=([\d.]+)\/([\d.]+)/);
    if (t) { out.total = +t[1]; out.max = +t[2]; } if (th) out.this = [+th[1], +th[2]];
    rest.split(/\s*‖\s*/).forEach(function (seg) {
      if (/^Feedback:/.test(seg)) { seg.replace(/^Feedback:\s*/, '').split(/\s+\|\s+(?=Step \d+ \()/).forEach(function (f) { var m = f.match(/^Step (\d+) \(([\d.]+)\/([\d.]+)\):\s*(.*)$/); if (m) out.fb[m[1]] = { score: +m[2], max: +m[3], text: m[4] }; }); return; }
      seg = seg.trim(); if (/^[^:]{1,60}:$/.test(seg)) { out.answers.push([seg.slice(0, -1).trim(), '']); return; }
      var i = seg.indexOf(': '); out.answers.push(i > 0 && i < 60 ? [seg.slice(0, i).trim(), seg.slice(i + 2).trim()] : ['', seg]);
    });
    return out;
  }
  function lwLoad(force) {
    if (LW && !force) return Promise.resolve(LW);
    var all = [], page = function (from) { return S.db.from('lesson_work').select('*').order('saved_at', { ascending: false }).range(from, from + 999).then(function (r) { if (r.error) throw r.error; all = all.concat(r.data || []); return (r.data || []).length === 1000 && from < 4000 ? page(from + 1000) : all; }); };
    return Promise.all([page(0), fetch('/assets/lesson-steps.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      S.db.from('lesson_specs').select('lesson,title,spec').then(function (r) { var o = {}; (r.data || []).forEach(function (x) { o[x.lesson] = x; }); return o; }, function () { return {}; })])
      .then(function (x) { LW = { rows: x[0], steps: x[1], specs: x[2] }; return lwPlaces(); });
  }
  // Which class each piece of work belongs to: the student's real classes (enrolments, or their profile class),
  // preferring the class whose lesson list contains that lesson. Typed class names are not trusted.
  function lwPlaces() {
    var ids = CLASSES.map(function (c) { return c.id; });
    if (!ids.length) { LW.places = {}; return LW; }
    return Promise.all([
      S.db.from('enrolments').select('student_id,class_id').eq('status', 'approved').in('class_id', ids),
      S.db.from('profiles').select('id,class_id').in('class_id', ids),
      S.db.from('class_materials').select('class_id,path').in('class_id', ids),
      S.db.from('lessons').select('url,external_id')]).then(function (x) {
      var mem = {}, has = {}, url = {};
      (x[0].data || []).concat((x[1].data || []).map(function (r) { return { student_id: r.id, class_id: r.class_id }; })).forEach(function (r) {
        (mem[r.student_id] = mem[r.student_id] || []); if (mem[r.student_id].indexOf(r.class_id) < 0) mem[r.student_id].push(r.class_id); });
      (x[3].data || []).forEach(function (l) { if (l.external_id) url[l.external_id] = l.url; });
      (x[2].data || []).forEach(function (r) { has[r.class_id + '|' + r.path] = 1; });
      LW.places = { mem: mem, has: has, url: url };
      return LW;
    });
  }
  function lwClassesOf(g) {
    var P = LW.places || {}, mine = (P.mem || {})[g.sid] || [];
    if (!mine.length) return [];
    var u = (P.url || {})[g.lesson], fit = u ? mine.filter(function (cid) { return (P.has || {})[cid + '|' + u]; }) : [];
    return fit.length ? fit : mine;
  }
  function lwGroups(rows) {   // one group per student + class + lesson, keeping the latest save of each step
    var g = {}, order = [];
    rows.forEach(function (r) {
      var k = (r.student_id || ((r.student_name || '').trim().toLowerCase() + '|' + (r.class_name || '').trim().toLowerCase())) + '|' + r.lesson;
      if (!g[k]) { g[k] = { key: k, sid: r.student_id, student: r.student_name, cls: r.class_name || '', lesson: r.lesson, steps: {}, last: r.saved_at, latest: r }; order.push(k); }
      if (!g[k].steps[r.step]) g[k].steps[r.step] = r;
    });
    return order.map(function (k) { var x = g[k], p = lwParse(x.latest.answers); x.total = p.total; x.max = p.max; x.fb = p.fb; return x; });
  }
  function lwDoc(x) {
    var info = (LW.steps || {})[x.lesson] || { title: x.lesson, steps: {} }, spec = ((LW.specs || {})[x.lesson] || {}).spec || {}, models = spec.models || {};
    var nums = Object.keys(info.steps).length ? Object.keys(info.steps) : Object.keys(x.steps); nums = nums.map(Number).sort(function (a, b) { return a - b; });
    var done = Object.keys(x.steps).length, pc = x.max ? Math.round(100 * x.total / x.max) : null;
    var css = 'body{font:15px/1.55 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#0f172a;background:#f6f8fb;margin:0}.wrap{max-width:880px;margin:0 auto;padding:22px 18px 40px}' +
      'header{background:linear-gradient(135deg,#0f766e,#1d4ed8);color:#fff;border-radius:18px;padding:20px 22px;margin-bottom:16px}header h1{margin:.1em 0 .3em;font-size:1.5rem}header .meta{opacity:.92;font-size:.92rem}' +
      '.score{display:flex;align-items:center;gap:12px;margin-top:12px}.bar{flex:1;height:10px;border-radius:99px;background:rgba(255,255,255,.3);overflow:hidden}.bar i{display:block;height:100%;background:#fde68a}.score b{font-size:1.3rem}' +
      '.step{background:#fff;border:1px solid #dde3ea;border-radius:16px;padding:16px 18px;margin:12px 0}.step.miss{opacity:.6;border-style:dashed}.sh{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ph{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:#0f766e;font-weight:700}' +
      '.step h2{margin:.1em 0 .4em;font-size:1.12rem}.mk{white-space:nowrap;border-radius:99px;padding:4px 12px;font-weight:700;font-size:.9rem;background:#e2e8f0}.mk.full{background:#dcfce7;color:#166534}.mk.part{background:#fef3c7;color:#92400e}.mk.low{background:#fee2e2;color:#991b1b}' +
      '.qa{border-top:1px solid #eef2f6;padding:10px 0}.q{font-weight:600;margin-bottom:4px}.a{background:#f1f5f9;border-radius:10px;padding:8px 12px;white-space:pre-wrap}.a.blank{color:#94a3b8;font-style:italic}' +
      '.mdl{margin-top:6px;font-size:.9rem}.mdl summary{cursor:pointer;color:#166534}.mdl div{background:#f0fdf4;border-radius:10px;padding:8px 12px;margin-top:4px}.fb{background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:8px;padding:8px 12px;margin-top:10px;font-size:.92rem}' +
      '.tbl{display:flex;flex-wrap:wrap;gap:6px}.tbl span{background:#e0f2fe;border-radius:8px;padding:3px 9px}.foot{color:#64748b;font-size:.82rem;margin-top:20px}@media print{body{background:#fff}.step{break-inside:avoid}.mdl{display:none}header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
    var h = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + E(info.title) + ' · ' + E(x.student) + '</title><style>' + css + '</style></head><body><div class="wrap">' +
      '<header><div class="meta">Completed interactive lesson · Learnova</div><h1>' + E(info.title) + '</h1><div class="meta"><b>' + E(x.student) + '</b> · ' + E(x.cls) + ' · ' + done + ' of ' + nums.length + ' steps saved · last saved ' + E(new Date(x.last).toLocaleString()) + '</div>' +
      (pc != null ? '<div class="score"><b>' + x.total + ' / ' + x.max + '</b><div class="bar"><i style="width:' + pc + '%"></i></div><b>' + pc + '%</b></div>' : '') + '</header>';
    nums.forEach(function (n) {
      var st = info.steps[n] || { title: '', phase: 'Step ' + n, q: {} }, row = x.steps[n], fb = x.fb[n], mdl = {};
      (models[n] || []).forEach(function (m) { mdl[m[0]] = m[1]; });
      var cls = fb ? (fb.score >= fb.max ? 'full' : fb.score >= fb.max / 2 ? 'part' : 'low') : '';
      h += '<section class="step' + (row ? '' : ' miss') + '"><div class="sh"><div><div class="ph">' + E(st.phase || 'Step ' + n) + '</div><h2>' + E(st.title || 'Step ' + n) + '</h2></div>' +
        (fb ? '<span class="mk ' + cls + '">' + fb.score + ' / ' + fb.max + '</span>' : row ? '<span class="mk">not marked</span>' : '<span class="mk">not saved</span>') + '</div>';
      if (!row) { h += '<p class="a blank">The student has not saved this step yet.</p></section>'; return; }
      lwParse(row.answers).answers.forEach(function (qa) {
        var lab = qa[0], ans = qa[1], q = st.q[lab] || (lab ? lab : ''), blank = !ans || ans === '-';
        var body = lab === 'Table' && !blank ? '<div class="tbl">' + ans.split(/;\s*/).map(function (v) { return '<span>' + E(v) + '</span>'; }).join('') + '</div>' : E(blank ? (lab === 'Table' ? 'The choices in this table were not included in the saved work (the mark above includes them).' : 'No answer') : ans.replace(/ \/ /g, '\n'));
        h += '<div class="qa">' + (q ? '<div class="q">' + E(q) + '</div>' : '') + '<div class="a' + (blank ? ' blank' : '') + '">' + body + '</div>' +
          (mdl[lab] || mdl[q] ? '<details class="mdl"><summary>Model answer</summary><div>' + E(mdl[lab] || mdl[q]) + '</div></details>' : '') + '</div>';
      });
      if (fb && fb.text) h += '<div class="fb"><b>Feedback:</b> ' + E(fb.text) + '</div>';
      h += '</section>';
    });
    return h + '<p class="foot">Lesson by Learnova · biosciencevista.com · printed ' + E(new Date().toLocaleString()) + '</p></div></body></html>';
  }
  function lessonWork(p, args) {
    p.innerHTML = '<p class="muted">Loading students\' lessons…</p>';
    lwLoad(args && args[0] === 'refresh').then(function () {
      var groups = lwGroups(LW.rows), cname = {}, count = {}, NONE = '_none';
      CLASSES.forEach(function (c) { cname[c.id] = c.name; });
      groups.forEach(function (g) { g.cids = lwClassesOf(g); if (!g.cids.length) g.cids = [NONE]; g.cids.forEach(function (cid) { count[cid] = (count[cid] || 0) + 1; }); if (g.cids[0] !== NONE) g.cls = g.cids.map(function (cid) { return cname[cid]; }).join(', '); });
      var classes = CLASSES.filter(function (c) { return count[c.id]; }).map(function (c) { return [c.id, c.name + ' (' + count[c.id] + ')']; });
      if (count[NONE] && ME.admin) classes.push([NONE, 'Not in any of your classes (' + count[NONE] + ')']);
      var pick = (args && args[0] && args[0] !== 'refresh' && count[args[0]]) ? args[0] : (classes[0] || [''])[0];
      p.innerHTML = '<section class="panel"><div class="row2"><div><h3 style="margin:0">Lesson work</h3><p class="small muted" style="margin:.3em 0 0">Each card is one student\'s interactive lesson, put together from every step they saved.</p></div><a class="btn sm" href="#work/refresh">↻ Refresh</a></div>' +
        '<div class="row2" style="justify-content:flex-start;flex-wrap:wrap;margin-top:10px"><label class="f">Class<select id="lwc">' + (classes.length ? classes.map(function (c) { return '<option value="' + E(c[0]) + '"' + (c[0] === pick ? ' selected' : '') + '>' + E(c[1]) + '</option>'; }).join('') : '<option value="">No lesson work in your classes yet</option>') + '</select></label>' +
        '<label class="f" style="min-width:240px">Lesson<select id="lwl"></select></label>' +
        '<label class="f">Student<input id="lws" type="search" placeholder="Name"></label><span class="small muted" id="lwn"></span></div></section>' +
        '<div id="lwgrid" class="lwgrid"></div><div id="lwdoc"></div>' +
        '<style>.lwgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin:12px 0}.lwc{border:1px solid var(--line,#dde3ea);border-radius:14px;padding:12px 14px;background:var(--card,#fff);display:grid;gap:6px}' +
        '.lwc .t{font-weight:700}.lwc .s{font-size:.85rem;color:var(--muted,#64748b)}.lwc .bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden}.lwc .bar i{display:block;height:100%;background:#0f766e}.lwframe{width:100%;height:80vh;border:1px solid var(--line,#dde3ea);border-radius:14px;background:#fff}</style>';
      function lessonsFor(c) {   // the lesson list follows the chosen class
        var ls = []; groups.forEach(function (g) { if (g.cids.indexOf(c) >= 0 && ls.indexOf(g.lesson) < 0) ls.push(g.lesson); });
        ls.sort(function (a, b) { return ((LW.steps[a] || {}).title || a).localeCompare((LW.steps[b] || {}).title || b); });
        p.querySelector('#lwl').innerHTML = '<option value="">All lessons in this class</option>' + ls.map(function (l) { return '<option value="' + E(l) + '">' + E((LW.steps[l] || {}).title || l) + '</option>'; }).join('');
      }
      p.querySelector('#lwc').addEventListener('change', function () { lessonsFor(this.value); draw(); });
      lessonsFor(pick);
      function draw() {
        var c = p.querySelector('#lwc').value, l = p.querySelector('#lwl').value, q = p.querySelector('#lws').value.trim().toLowerCase();
        var list = c ? groups.filter(function (g) { return g.cids.indexOf(c) >= 0 && (!l || g.lesson === l) && (!q || (g.student || '').toLowerCase().indexOf(q) >= 0); }) : [];
        list.sort(function (a, b) { return ((LW.steps[a.lesson] || {}).title || a.lesson).localeCompare((LW.steps[b.lesson] || {}).title || b.lesson) || (a.student || '').localeCompare(b.student || ''); });
        p.querySelector('#lwn').textContent = list.length + ' lesson' + (list.length === 1 ? '' : 's') + (c ? ' in ' + (c === NONE ? 'no class' : cname[c]) : '');
        p.querySelector('#lwgrid').innerHTML = list.length ? list.slice(0, 300).map(function (g, i) {
          var info = LW.steps[g.lesson] || {}, nSteps = Object.keys(info.steps || {}).length || Object.keys(g.steps).length, done = Object.keys(g.steps).length, pc = g.max ? Math.round(100 * g.total / g.max) : null;
          return '<div class="lwc"><div class="t">' + E(g.student) + '</div><div class="s">' + E(g.cls) + '</div><div>' + E(info.title || g.lesson) + '</div>' +
            '<div class="s">' + done + ' of ' + nSteps + ' steps · ' + (pc != null ? '<b>' + g.total + ' / ' + g.max + '</b> (' + pc + '%)' : 'no marks yet') + ' · ' + E(S.when(g.last)) + '</div>' +
            (pc != null ? '<div class="bar"><i style="width:' + pc + '%"></i></div>' : '') +
            '<div class="acts"><button type="button" class="btn sm main" data-v="' + E(g.key) + '">📄 View completed lesson</button><button type="button" class="btn sm" data-d="' + E(g.key) + '" title="Download as an HTML file">⬇ HTML</button></div></div>';
        }).join('') : '<p class="emptybox">No lesson work matches.</p>';
        var byKey = {}; groups.forEach(function (g) { byKey[g.key] = g; });
        p.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { var g = byKey[b.getAttribute('data-v')], d = p.querySelector('#lwdoc'), html = lwDoc(g);
          d.innerHTML = '<section class="panel"><div class="row2"><h3 style="margin:0">' + E(g.student) + ' · ' + E((LW.steps[g.lesson] || {}).title || g.lesson) + '</h3><div class="acts"><button type="button" class="btn sm" id="lwopen">↗ Open in a new tab / print</button><button type="button" class="btn sm" id="lwdl">⬇ Download HTML</button><button type="button" class="btn sm" id="lwx">Close</button></div></div><iframe class="lwframe" title="Completed lesson"></iframe></section>';
          d.querySelector('iframe').srcdoc = html;
          d.querySelector('#lwx').onclick = function () { d.innerHTML = ''; };
          d.querySelector('#lwdl').onclick = function () { lwSave(g, html); };
          d.querySelector('#lwopen').onclick = function () { var w = window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank'); if (!w) toast('Allow pop-ups to open the lesson.', true); };
          d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
        p.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var g = byKey[b.getAttribute('data-d')]; lwSave(g, lwDoc(g)); }; });
      }
      ['#lwl', '#lws'].forEach(function (s) { p.querySelector(s).addEventListener('input', draw); });
      draw();
    }).catch(function (e) { p.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  }
  function lwSave(g, html) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = (g.student || 'student').replace(/[^\w]+/g, '-') + '_' + g.lesson + '.html'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  /* ---------- overview ---------- */
  function overview(p) {
    Promise.all([
      S.db.from('class_overview').select('*'),
      S.db.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('status', 'needs_marking'),
      S.db.from('student_results').select('title,score,max_score,recorded_at,student_id').order('recorded_at', { ascending: false }).limit(12),
      S.db.from('quizzes').select('id', { count: 'exact', head: true }).eq('published', true),
      S.db.from('pending_accounts').select('student_id', { count: 'exact', head: true }),
      ME.admin ? S.db.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'new') : Promise.resolve({ count: 0 })
    ]).then(function (x) {
      var nPend = x[4].count || 0;
      var st = (x[0].data || []).filter(function (s) { return s.student_id !== ME.user.id && s.class_id; }), names = {}; st.forEach(function (s) { names[s.student_id] = s.full_name; });
      var pcs = st.filter(function (s) { return s.percent != null; }), avg = pcs.length ? Math.round(pcs.reduce(function (a, s) { return a + +s.percent; }, 0) / pcs.length) : null;
      var waiting = st.filter(function (s) { return !s.approved; }).length;
      p.innerHTML = '<div class="stats"><div class="stat"><span class="small muted">Students</span><b>' + st.length + '</b></div><div class="stat"><span class="small muted">Classes</span><b>' + CLASSES.length + '</b></div>' +
        '<div class="stat"><span class="small muted">Class average</span><b>' + (avg == null ? '–' : avg + '%') + '</b></div><div class="stat"><span class="small muted">Answers to mark</span><b><a href="#marking">' + (x[1].count || 0) + '</a></b></div></div>' +
        (x[5] && x[5].count ? '<p class="panel tint"><b>' + x[5].count + ' new lesson booking' + (x[5].count > 1 ? 's' : '') + '.</b> <a class="btn main sm" href="#bookings">Reply to bookings</a></p>' : '') +
        (nPend ? '<p class="panel tint"><b>' + nPend + ' new account' + (nPend > 1 ? 's are' : ' is') + ' waiting for approval.</b> <a class="btn main sm" href="#approvals">Review and approve</a></p>' : '') +
        (!CLASSES.length ? '<p class="panel tint">Start by <a href="#classes">creating a class</a>. Each class gets a join code that students type when they register.</p>' : '') +
        '<div class="two"><section class="panel"><h3>Latest results</h3>' + ((x[2].data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Task</th><th>Score</th><th>When</th></tr>' + x[2].data.map(function (r) { return '<tr><td>' + E(names[r.student_id] || '–') + '</td><td>' + E(r.title) + '</td><td>' + (r.score == null ? '–' : E(r.score) + '/' + E(r.max_score)) + '</td><td class="small">' + E(S.when(r.recorded_at)) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted">No results yet.</p>') + '</section>' +
        '<section class="panel"><h3>Quick links</h3><p><a href="#quizzes/new">＋ New quiz</a></p><p><a href="#content">Add lessons, resources and simulations</a></p><p><a href="#classes">Class join codes</a></p><p><a href="/teacher/">Classic teacher console (Google Sheets)</a></p><p class="small muted">' + (x[3].count || 0) + ' published quizzes.</p></section></div>';
    });
  }

  /* ---------- classes ---------- */
  /* archive, restore or remove a class (admin). Lessons, quizzes, notes and simulations always stay. */
  function archivedPanel() {
    return '<section class="panel"><h3 style="margin:0">Archived classes</h3><p class="small muted">Archive a class when it ends or when you change school. Its students can no longer sign in to lessons or materials, and it disappears from your lists. ' +
      'All your lessons, quizzes, notes and simulations stay, ready for new classes. Students\' past results are kept. <b>Remove</b> deletes the class itself and takes its students out of it (they would need to join a class and be approved again).</p>' +
      (ARCHIVED.length ? '<div class="tablewrap"><table class="marks"><tr><th>Class</th><th>Programme</th><th>Archived</th><th></th></tr>' + ARCHIVED.map(function (c) {
        return '<tr><td>' + E(c.name) + '</td><td>' + E(c.programme || '') + '</td><td>' + E(S.when(c.archived_at)) + '</td><td><button type="button" class="btn sm" data-restore="' + c.id + '">↩ Restore</button> <button type="button" class="btn sm" data-rmold="' + c.id + '" style="--c:#b91c1c">Remove</button></td></tr>'; }).join('') + '</table></div>'
        : '<p class="emptybox">No archived classes.</p>') + '</section>';
  }
  function archive(p, id, on) {
    var c = CLASSES.concat(ARCHIVED).filter(function (x) { return x.id === id; })[0] || {};
    if (on && !confirm('Archive ' + (c.name || 'this class') + '?\n\nIts students lose access to lessons and materials until you restore it. Your lessons, quizzes, notes and simulations are kept.')) return;
    S.db.rpc('archive_class', { cid: id, archive: on }).then(function (r) { if (ok(r, on ? 'Class archived' : 'Class restored')) classes(p); });
  }
  function removeClass(p, id) {
    var c = CLASSES.concat(ARCHIVED).filter(function (x) { return x.id === id; })[0] || {};
    var typed = prompt('Remove ' + (c.name || 'this class') + ' permanently?\n\nThe class, its join code and its class links (to-do items, quiz settings for this class) are deleted. Its students are taken out of the class and need approval again. ' +
      'Your lessons, quizzes, notes, simulations and students\' past results are kept.\n\nThis cannot be undone. Type REMOVE to confirm.');
    if (typed !== 'REMOVE') return;
    S.db.rpc('remove_class', { cid: id }).then(function (r) { if (ok(r, 'Class removed' + (r.data ? ' · ' + r.data + ' student' + (r.data === 1 ? '' : 's') + ' taken out' : ''))) classes(p); });
  }
  function classes(p, args) {
    if (args && args[0]) return refs().then(function () { classPage(p, args[0], args[1]); });
    refs().then(function () {
      p.innerHTML = '<section class="panel"><h3>Class pages</h3><p class="small muted">Open a class to see its quizzes, exams and interactive lessons, and who has and has not submitted. The page updates itself while you watch.</p>' +
        (CLASSES.length ? '<div class="cgrid">' + CLASSES.map(function (c) { return '<a class="ccard" href="#classes/' + c.id + '"><b>' + E(c.name) + '</b><span class="small muted">' + E(c.programme || '') + '</span><span class="small" data-n="' + c.id + '">…</span></a>'; }).join('') + '</div>' : '<p class="emptybox">No classes yet.</p>') + '</section>' +
        '<form class="panel row2" id="nc"><input id="cn" placeholder="Class name, e.g. Grade 9 Science" required><input id="cp" placeholder="Programme, e.g. MYP 4" style="max-width:180px"><button class="btn main sm" type="submit">Create class</button></form>' +
        (CLASSES.length ? '<div class="tablewrap"><table class="marks"><tr><th>Class</th><th>Programme</th><th>Join code</th><th>Open for joining</th><th></th>' + (ME.admin ? '<th>Archive / remove</th>' : '') + '</tr>' + CLASSES.map(function (c) {
          return '<tr data-id="' + c.id + '"><td><input data-k="name" value="' + E(c.name) + '"></td><td><input data-k="programme" value="' + E(c.programme || '') + '"></td><td><b class="code">' + E(c.join_code) + '</b> <button type="button" class="btn sm" data-a="new">New code</button></td>' +
            '<td><input type="checkbox" data-k="active"' + (c.active ? ' checked' : '') + '></td><td><button type="button" class="btn sm" data-a="save">Save</button></td>' +
            (ME.admin ? '<td><button type="button" class="btn sm" data-a="arch">🗄 Archive</button> <button type="button" class="btn sm" data-a="rm" style="--c:#b91c1c">Remove</button></td>' : '') + '</tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No classes yet.</p>') +
        (ME.admin ? archivedPanel() : '') +
        '<p class="small muted">Give students the join code. They type it on the <a href="/register/">registration page</a>. Untick "Open for joining" to stop new sign-ups; make a new code if a code was shared too widely.</p>';
      S.db.from('profiles').select('class_id').in('class_id', CLASSES.map(function (c) { return c.id; })).then(function (r) {
        var n = {}; (r.data || []).forEach(function (x) { n[x.class_id] = (n[x.class_id] || 0) + 1; });
        p.querySelectorAll('[data-n]').forEach(function (el) { var k = n[el.getAttribute('data-n')] || 0; el.textContent = k + ' student' + (k === 1 ? '' : 's'); });
      });
      p.querySelector('#nc').onsubmit = function (e) { e.preventDefault();
        S.db.from('classes').insert({ name: p.querySelector('#cn').value.trim(), programme: p.querySelector('#cp').value.trim() || null, teacher_id: ME.user.id, join_code: code6() }).then(function (r) { if (ok(r, 'Class created')) classes(p); }); };
      p.querySelectorAll('tr[data-id]').forEach(function (tr) { var id = tr.getAttribute('data-id');
        tr.querySelector('[data-a=save]').onclick = function () { S.db.from('classes').update({ name: tr.querySelector('[data-k=name]').value.trim(), programme: tr.querySelector('[data-k=programme]').value.trim() || null, active: tr.querySelector('[data-k=active]').checked }).eq('id', id).then(function (r) { ok(r, 'Saved'); }); };
        tr.querySelector('[data-a=new]').onclick = function () { S.db.from('classes').update({ join_code: code6() }).eq('id', id).then(function (r) { if (ok(r, 'New code made')) classes(p); }); };
        var ar = tr.querySelector('[data-a=arch]'); if (ar) ar.onclick = function () { archive(p, id, true); };
        var rm = tr.querySelector('[data-a=rm]'); if (rm) rm.onclick = function () { removeClass(p, id); };
      });
      p.querySelectorAll('[data-restore]').forEach(function (b) { b.onclick = function () { archive(p, b.getAttribute('data-restore'), false); }; });
      p.querySelectorAll('[data-rmold]').forEach(function (b) { b.onclick = function () { removeClass(p, b.getAttribute('data-rmold')); }; });
    });
  }


  /* ---------- class pages: each class has its own page for quizzes, exams and interactive lessons ---------- */
  var LIVE = null;
  function ago(t) { if (!t) return ''; var s = Math.max(0, (Date.now() - new Date(t)) / 1000); return s < 45 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : S.when(t); }
  function mmss(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function sameProg(a, b) { a = (a || '').toLowerCase(); b = (b || '').toLowerCase(); return !!a && !!b && (a === b || (a.indexOf('ib dp') === 0 && b.indexOf('ib dp') === 0)); }
  function roster(cid) {
    return S.db.from('profiles').select('id,full_name,approved').eq('class_id', cid).order('full_name').then(function (r) {
      var list = (r.data || []).filter(function (x) { return x.id !== ME.user.id; }), ids = list.map(function (x) { return x.id; });
      if (!ids.length) return [];
      return S.db.from('user_roles').select('user_id,role').in('user_id', ids).in('role', ['teacher', 'admin']).then(function (q) {
        var staff = {}; (q.data || []).forEach(function (x) { staff[x.user_id] = 1; });
        return list.filter(function (x) { return !staff[x.id]; });
      });
    });
  }
  function bar(parts, total) {   // parts: [[count, colour, label]]
    return '<div class="sbar" role="img" aria-label="' + parts.map(function (x) { return x[0] + ' ' + x[2]; }).join(', ') + '">' + parts.map(function (x) { return x[0] ? '<span style="flex:' + x[0] + ';background:' + x[1] + '"></span>' : ''; }).join('') + (total ? '' : '<span style="flex:1;background:var(--line)"></span>') + '</div>';
  }
  function classPage(p, cid, sub) {
    var c = CLASSES.filter(function (x) { return x.id === cid; })[0];
    if (!c) { p.innerHTML = '<p class="emptybox">This class was not found, or it is not one of your classes. <a href="#classes">All classes</a></p>'; return; }
    sub = ['lessons', 'todo', 'analysis'].indexOf(sub) >= 0 ? sub : 'quizzes';
    var state = { filter: 'all', open: {}, lesson: null, live: true };
    try { state.lesson = sessionStorage.getItem('bv-cl-' + cid) || null; } catch (e) {}
    p.innerHTML = '<p class="small"><a href="#classes">← All classes</a></p><div class="row2"><div><p class="label">' + E(c.programme || 'Class') + '</p><h2 style="margin:0">' + E(c.name) + '</h2></div>' +
      '<div class="small muted" style="text-align:right">Join code <b class="code">' + E(c.join_code) + '</b><br><label class="chk" style="display:inline-flex"><input type="checkbox" id="lv" checked> Live: update every 15 seconds</label> <span id="stamp"></span></div></div>' +
      '<nav class="tabs" aria-label="Class sections"><a href="#classes/' + cid + '/quizzes" aria-selected="' + (sub === 'quizzes') + '">📝 Quizzes and exams</a><a href="#classes/' + cid + '/lessons" aria-selected="' + (sub === 'lessons') + '">🧪 Interactive lessons</a><a href="#classes/' + cid + '/todo" aria-selected="' + (sub === 'todo') + '">📌 To-do list</a><a href="#classes/' + cid + '/analysis" aria-selected="' + (sub === 'analysis') + '">📊 Analysis</a></nav>' +
      '<div id="cbody"><p class="muted">Loading…</p></div>';
    var body = p.querySelector('#cbody'), busy = false;
    function load() {
      if (busy) return; busy = true;
      (sub === 'lessons' ? lessonBoard : sub === 'todo' ? todoBoard : sub === 'analysis' ? analysisBoard : quizBoard)(body, c, state).then(function () { busy = false; var st = p.querySelector('#stamp'); if (st) st.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }, function (e) { busy = false;
        var miss = /class_(quiz|lesson)_board|class_todo|assign_work|class_analysis|schema cache|does not exist/i.test((e && (e.message || e.details)) || String(e));
        body.innerHTML = miss ? '<p class="emptybox">This part of the class page needs a database update (' + (sub === 'todo' ? 'migration 015' : sub === 'analysis' ? 'migration 016' : 'migration 011') + ') before it can show results. Run it once in the Supabase SQL editor, then reload this page.</p>' : '<p class="msg">' + E(S.nice(e)) + '</p>'; });
    }
    state.reload = load;
    p.querySelector('#lv').onchange = function () { state.live = this.checked; clearInterval(LIVE); if (state.live) { LIVE = setInterval(load, 15000); load(); } };
    clearInterval(LIVE); LIVE = setInterval(load, 15000); load();
  }
  /* ---------- to-do lists: work set for the whole class or for chosen students ---------- */
  var ICON = { lesson: '🧪', quiz: '📝', resource: '📄', sim: '🔬', link: '🔗', task: '✏️' };
  var PICK = null;   // lessons, quizzes, resources and simulations to choose from (loaded once)
  function pickLists() {
    if (PICK) return Promise.resolve(PICK);
    return Promise.all([S.db.from('lessons').select('id,title,url,external_id,topic_id').eq('published', true).order('sort_order'),
      S.db.from('quizzes').select('id,title,category,published, quiz_classes(class_id,published)').order('created_at', { ascending: false }),
      S.db.from('resources').select('id,title,url,topic_id').eq('published', true).order('sort_order'),
      S.db.from('simulations').select('id,title,url,topic_id').eq('published', true).order('sort_order')]).then(function (x) {
      PICK = { lesson: x[0].data || [], quiz: x[1].data || [], resource: x[2].data || [], sim: x[3].data || [] }; return PICK; });
  }
  function progOf(tid) { var tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; }); var t = tp[tid]; return t ? (t.programme || (tp[t.parent_id] || {}).programme || '') : ''; }
  // What a class teaches: programme (IB DP, MYP 1-5, IGCSE…) and subject, read from its course, programme and name.
  function classKey(c) {
    var t = ((c.course || '') + ' ' + (c.programme || '') + ' ' + (c.name || '')).toLowerCase(), k = { prog: '', subj: '' };
    var g = t.match(/\bgrade[- ]?(6|7|8|9|10)\b/), m = t.match(/\bmyp ?([1-5])\b/);
    if (m) k.prog = 'MYP ' + m[1]; else if (g) k.prog = 'MYP ' + (+g[1] - 5);
    else if (/\bigcse\b/.test(t)) k.prog = 'IGCSE'; else if (/\ba[ -]?level|\bas level/.test(t)) k.prog = 'A Level';
    else if (/\bib\b|\bdp ?\d?\b|diploma|\b(bio|chem|phys|ess)-(hl|sl)\b/.test(t)) k.prog = 'IB DP';
    k.subj = /math/.test(t) ? 'mathematics' : /\bess\b|environmental/.test(t) ? 'environmental' : /chem/.test(t) ? 'chemistry' : /phys/.test(t) ? 'physics' : /\bbio/.test(t) ? 'biology' : '';
    if (!k.prog && k.subj) k.prog = 'IB DP';   // "Chemistry", "PHYSICS": the site's subject classes are IB DP
    k.level = /\bhl\b|-hl\b|higher/.test(t) ? 'HL' : /\bsl\b|-sl\b|standard/.test(t) ? 'SL' : '';
    k.any = !k.prog;
    k.label = k.any ? '' : (k.prog === 'IB DP' && k.subj ? 'IB DP ' + k.subj.replace('environmental', 'ESS').replace(/^./, function (x) { return x.toUpperCase(); }) : k.prog);
    return k;
  }
  function topicKey(tid) {
    var tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; }); var t = tp[tid] || {}, p = tp[t.parent_id] || {};
    var subj = ((t.subjects || p.subjects || {}).name || '').toLowerCase();
    return { prog: t.programme || p.programme || '', subj: subj, sname: (t.subjects || p.subjects || {}).name || '' };
  }
  function guessKey(it) {   // simulations and links with no topic: read the subject from the title
    var t = (it.title || '') + ' ' + (it.url || '');
    if (/titration|acid|chromatograph|separating|mixture|enthalpy|redox/i.test(t)) return { prog: /chromatograph|separating|mixture/i.test(t) ? 'MYP 1' : 'IB DP', subj: 'chemistry' };
    if (/circuit|force|wave|motion|projectile/i.test(t)) return { prog: 'IB DP', subj: 'physics' };
    return { prog: 'IB DP', subj: 'biology', loose: true };
  }
  function keyFits(k, want) {
    if (k.loose && want.subj !== 'chemistry' && want.subj !== 'physics' && want.subj !== 'mathematics') return true;   // biology labs suit any biology or science class
    if (want.any) return true;
    if (!sameProg(k.prog, want.prog)) return false;
    return !want.subj || !k.subj || k.subj.indexOf(want.subj) >= 0 || (k.subj.indexOf('science') >= 0 && want.prog.indexOf('MYP') === 0);
  }
  function topicLabel(tid, foreign) {
    var tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; }); var t = tp[tid], p = t && tp[t.parent_id], k = topicKey(tid);
    var name = t ? (p ? p.name + ' › ' : '') + t.name : 'Other';
    return foreign ? ((k.sname || k.prog || 'Other') + ' · ' + name) : name;
  }
  function urlFor(kind, it) { return kind === 'quiz' ? ({ exam: '/exams/', lesson: '/lesson/' }[it.category] || '/quizzes/') + '#' + it.id : it.url || ''; }
  // The "Set work" form. kids: the class roster; pre: students ticked to start with (empty = whole class).
  var MATS = {};
  function classMats(cid) {
    if (MATS[cid]) return Promise.resolve(MATS[cid]);
    return S.db.from('class_materials').select('path,sort').eq('class_id', cid).order('sort').then(function (r) { MATS[cid] = (r.data || []).map(function (x) { return x.path; }); return MATS[cid]; });
  }
  function assignForm(host, c, kids, pre, done) {
    Promise.all([pickLists(), classMats(c.id)]).then(function (x) { return x[0]; }).then(function (L) {
      // Only this class's lessons by default (its programme and subject), grouped by topic; "other classes" is opt-in.
      // Only this class's materials: its own lessons (class_materials), quizzes and exams set for it, and notes,
      // files and simulations for its programme, subject and level (SL classes do not get HL-only items).
      var want = classKey(c), q = '', own = MATS[c.id] || [];
      var hlOnly = function (t) { return /\(HL\)|\bAHL\b|HL only/i.test(t || ''); };
      var levelOk = function (t) { return want.level !== 'SL' || !hlOnly(t); };
      var fits = function (it) {
        if (!levelOk(it.title)) return false;
        if (it.topic_id) return keyFits(topicKey(it.topic_id), want);
        return keyFits(guessKey(it), want);
      };
      var opts = function (kind) {
        var match = function (t) { return !q || (t || '').toLowerCase().indexOf(q) >= 0; };
        if (kind === 'quiz') {
          var qs = L.quiz.filter(function (x) { return match(x.title) && (x.quiz_classes || []).some(function (r) { return r.class_id === c.id; }); });
          return qs.map(function (x) { return '<option value="' + x.id + '">' + (x.category === 'exam' ? '🧪 Exam · ' : x.category === 'lesson' ? '📘 ' : '📝 ') + E(x.title) + ((x.quiz_classes || []).some(function (r) { return r.class_id === c.id && r.published; }) ? '' : ' (not published yet: setting it for the whole class publishes it)') + '</option>'; }).join('');
        }
        var list = (L[kind] || []).filter(function (it) {
          if (!match(it.title)) return false;
          if (kind === 'lesson' && own.length) return own.indexOf(it.url) >= 0;
          return want.any || fits(it);
        });
        if (kind === 'lesson' && own.length) list.sort(function (a, b) { return own.indexOf(a.url) - own.indexOf(b.url); });
        var groups = [], by = {};
        list.forEach(function (it) { var g = topicLabel(it.topic_id, false); if (!by[g]) { by[g] = []; groups.push(g); } by[g].push(it); });
        return groups.map(function (g) { return '<optgroup label="' + E(g) + '">' + by[g].map(function (it) { return '<option value="' + it.id + '">' + E(it.title) + '</option>'; }).join('') + '</optgroup>'; }).join('');
      };
      host.innerHTML = '<section class="panel tint"><h3 style="margin-top:0">📌 Set work' + (pre.length === 1 ? ' for ' + E((kids.filter(function (k) { return k.id === pre[0]; })[0] || {}).full_name || 'this student') : ' for ' + E(c.name)) + '</h3>' +
        '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start;align-items:flex-end">' +
        '<label class="f">What<select id="ak"><option value="lesson">🧪 Lesson (interactive or Learning centre)</option><option value="quiz">📝 Quiz or exam</option><option value="resource">📄 Notes or file</option><option value="sim">🔬 Simulation</option><option value="link">🔗 Web link</option><option value="task">✏️ Other task (book, homework…)</option></select></label>' +
        '<label class="f" id="aiw" style="min-width:280px;flex:1">Which <span class="small muted" id="aif"></span><input id="aq" type="search" placeholder="Search…" style="margin-bottom:6px"><select id="ai"></select></label><label class="f" id="auw" hidden style="flex:1">Link<input id="au" type="url" placeholder="https://"></label></div>' +
        '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start"><label class="f" style="flex:1;min-width:240px">Title<input id="at" maxlength="160"></label><label class="f">Due<input id="ad" type="datetime-local"></label></div>' +
        '<label class="f">Instructions for students (optional)<textarea id="ain" rows="2" placeholder="e.g. Finish steps 1–3 and correct your answers in your book."></textarea></label>' +
        '<fieldset style="border:1px solid var(--line);border-radius:10px;padding:8px 12px"><legend class="small"><b>Who</b></legend>' +
        '<label class="chk"><input type="radio" name="aw" value="all"' + (pre.length ? '' : ' checked') + '> The whole class (' + kids.length + ')</label> <label class="chk"><input type="radio" name="aw" value="some"' + (pre.length ? ' checked' : '') + '> Chosen students</label>' +
        '<div id="asl" style="columns:3 180px;margin-top:6px"' + (pre.length ? '' : ' hidden') + '>' + (kids.length ? kids.map(function (k) { return '<label class="chk small" style="display:flex"><input type="checkbox" value="' + k.id + '"' + (pre.indexOf(k.id) >= 0 ? ' checked' : '') + '> ' + E(k.full_name || '(no name)') + '</label>'; }).join('') : '<span class="small muted">No students in this class yet.</span>') +
        '<div class="small" style="column-span:all"><a href="#" id="aall">Tick all</a> · <a href="#" id="anone">Clear</a></div></div></fieldset>' +
        '<div class="acts"><button type="button" class="btn main sm" id="ago">📌 Add to the to-do list</button><button type="button" class="btn sm" id="ax">Cancel</button><span class="small" id="am"></span></div></section>';
      var $ = function (q) { return host.querySelector(q); };
      function fill() { var k = $('#ak').value, picks = ['lesson', 'quiz', 'resource', 'sim'].indexOf(k) >= 0;
        $('#aiw').hidden = !picks; $('#auw').hidden = k !== 'link';
        if (picks) { var o = opts(k), n = (o.match(/<option /g) || []).length;
          $('#ai').innerHTML = '<option value="">' + (n ? 'Choose… (' + n + ' for ' + E(c.name) + ')' : q ? 'Nothing matches your search' : k === 'quiz' ? 'No quizzes or exams set for this class yet' : 'Nothing for this class yet') + '</option>' + o;
          $('#aif').textContent = '· ' + c.name + (want.label ? ' (' + want.label + (want.level ? ' ' + want.level : '') + ')' : ''); } }
      $('#aq').oninput = function () { q = this.value.trim().toLowerCase(); fill(); };
      $('#ak').onchange = function () { fill(); $('#at').value = ''; };
      $('#ai').onchange = function () { var k = $('#ak').value, it = (L[k] || []).filter(function (x) { return x.id === $('#ai').value; })[0]; if (it) $('#at').value = it.title; };
      host.querySelectorAll('[name=aw]').forEach(function (r) { r.onchange = function () { $('#asl').hidden = host.querySelector('[name=aw]:checked').value !== 'some'; }; });
      $('#aall').onclick = function (e) { e.preventDefault(); host.querySelectorAll('#asl input').forEach(function (x) { x.checked = true; }); };
      $('#anone').onclick = function (e) { e.preventDefault(); host.querySelectorAll('#asl input').forEach(function (x) { x.checked = false; }); };
      $('#ax').onclick = function () { host.innerHTML = ''; };
      fill();
      $('#ago').onclick = function () {
        var k = $('#ak').value, it = (L[k] || []).filter(function (x) { return x.id === $('#ai').value; })[0], m = $('#am');
        var some = host.querySelector('[name=aw]:checked').value === 'some', who = Array.prototype.map.call(host.querySelectorAll('#asl input:checked'), function (x) { return x.value; });
        var title = $('#at').value.trim() || (it && it.title) || '';
        if (['lesson', 'quiz', 'resource', 'sim'].indexOf(k) >= 0 && !it) { m.textContent = 'Choose which ' + ({ lesson: 'lesson', quiz: 'quiz or exam', resource: 'file', sim: 'simulation' }[k]) + '.'; return; }
        if (k === 'link' && !/^https?:\/\//.test($('#au').value.trim())) { m.textContent = 'Paste the web address (starting https://).'; return; }
        if (!title) { m.textContent = 'Give the work a title.'; $('#at').focus(); return; }
        if (some && !who.length) { m.textContent = 'Tick at least one student, or choose the whole class.'; return; }
        var ref = !it ? null : k === 'lesson' ? (it.external_id || it.id) : it.id, url = k === 'link' ? $('#au').value.trim() : it ? urlFor(k, it) : null;
        $('#ago').disabled = true; m.textContent = 'Saving…';
        S.db.rpc('assign_work', { cls: c.id, title: title, kind: k, ref: ref, url: url, instructions: $('#ain').value.trim(), due: iso($('#ad').value), students: some ? who : null }).then(function (r) {
          $('#ago').disabled = false;
          if (r.error) { m.textContent = S.nice(r.error); return; }
          toast('Added to the to-do list of ' + (some ? who.length + ' student' + (who.length === 1 ? '' : 's') : 'everyone in ' + c.name) + (false ? '. This quiz is still a draft: publish it so students can open it.' : ''));
          host.innerHTML = ''; if (done) done();
        });
      };
    });
  }
  function todoBoard(body, c, state) {
    if (body.querySelector('#aform') && body.querySelector('#aform').innerHTML) return Promise.resolve();   // do not refresh while the teacher is filling in the form
    return Promise.all([roster(c.id), S.db.from('assignments').select('*').eq('class_id', c.id).order('created_at', { ascending: false }), S.db.rpc('class_todo', { cls: c.id }),
      S.db.from('assignment_students').select('assignment_id,student_id')]).then(function (x) {
      if (x[1].error) throw x[1].error; if (x[2].error) throw x[2].error;
      var kids = x[0], list = x[1].data || [], st = {}, names = {}; kids.forEach(function (k) { names[k.id] = k.full_name; });
      (x[2].data || []).forEach(function (r) { (st[r.assignment_id] = st[r.assignment_id] || {})[r.student_id] = r.state; });
      var progs = (c.content_programmes && c.content_programmes.length) ? c.content_programmes : null;
      var allProgs = []; TOPICS.forEach(function (t) { if (t.programme && allProgs.indexOf(t.programme) < 0) allProgs.push(t.programme); }); allProgs.sort();
      var html = '<div class="row2"><p class="small muted" style="margin:0">Work you set appears on each student\'s dashboard under <b>To do</b>. Lessons and quizzes tick themselves off when the student finishes; other work is ticked off by the student.</p><button type="button" class="btn main sm" id="anew">＋ Set work</button></div><div id="aform"></div>' +
        (list.length ? list.map(function (a) {
          var m = st[a.id] || {}, ids = Object.keys(m), nd = ids.filter(function (i) { return m[i] === 'done'; }).length, ns = ids.filter(function (i) { return m[i] === 'started'; }).length, nt = ids.length - nd - ns;
          var late = a.due_at && new Date(a.due_at) < new Date();
          var who = a.everyone ? 'Whole class' : ids.length + ' chosen student' + (ids.length === 1 ? '' : 's');
          var open = state.open['a' + a.id];
          return '<details class="panel" data-k="a' + a.id + '"' + (open ? ' open' : '') + '><summary><b>' + (ICON[a.kind] || '📌') + ' ' + E(a.title) + '</b> <span class="pill">' + E(who) + '</span>' +
            (a.due_at ? ' <span class="small ' + (late ? '' : 'muted') + '" style="' + (late ? 'color:#b91c1c' : '') + '">' + (late ? 'was due ' : 'due ') + E(S.when(a.due_at)) + '</span>' : '') +
            '<div class="small"><b style="color:var(--ok)">✓ ' + nd + ' done</b> · <b style="color:#b45309">✎ ' + ns + ' started</b> · <b style="color:#b91c1c">○ ' + nt + ' not started</b></div>' +
            bar([[nd, 'var(--ok)', 'done'], [ns, '#f59e0b', 'started'], [nt, '#fca5a5', 'not started']], ids.length) + '</summary>' +
            (a.instructions ? '<p class="small">' + E(a.instructions) + '</p>' : '') + (a.url ? '<p class="small"><a href="' + E(a.url) + '" target="_blank" rel="noopener">Open the work ↗</a></p>' : '') +
            '<div class="small">' + ['todo', 'started', 'done'].map(function (k) { var who2 = ids.filter(function (i) { return m[i] === k; }).map(function (i) { return E(names[i] || 'student'); });
              return who2.length ? '<p style="margin:3px 0"><b>' + { todo: '○ Not started', started: '✎ Started', done: '✓ Done' }[k] + ':</b> ' + who2.join(', ') + '</p>' : ''; }).join('') + '</div>' +
            '<div class="acts"><button type="button" class="btn sm" data-adel="' + a.id + '">Remove from the to-do list</button></div></details>';
        }).join('') : '<p class="emptybox">Nothing set yet. Use <b>＋ Set work</b> to add a lesson, quiz, file, simulation, link or task for the whole class or for chosen students.</p>') +
        '<section class="panel"><h3 style="margin-top:0">📚 Materials this class sees</h3><p class="small muted">Students in ' + E(c.name) + ' see only these programmes in the Learning centre and simulation library, plus anything you set for them.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' + allProgs.map(function (pg) { var on = progs ? progs.indexOf(pg) >= 0 : sameProg(pg, c.programme) || defaultProg(c.programme).indexOf(pg) >= 0;
          return '<label class="chk"><input type="checkbox" data-pg="' + E(pg) + '"' + (on ? ' checked' : '') + '> ' + E(pg) + '</label>'; }).join('') + '</div>' +
        '<div class="acts"><button type="button" class="btn sm" id="pgsave">Save</button></div></section>';
      body.innerHTML = html; wireFilters(body, state);
      body.querySelector('#anew').onclick = function () { assignForm(body.querySelector('#aform'), c, kids, [], function () { state.reload(); }); };
      body.querySelectorAll('[data-adel]').forEach(function (b) { b.onclick = function () {
        if (!confirm('Remove this work from every student\'s to-do list?')) return;
        S.db.from('assignments').delete().eq('id', b.getAttribute('data-adel')).then(function (r) { if (ok(r, 'Removed from the to-do list')) state.reload(); }); }; });
      body.querySelector('#pgsave').onclick = function () {
        var pick = Array.prototype.map.call(body.querySelectorAll('[data-pg]:checked'), function (x) { return x.getAttribute('data-pg'); });
        S.db.from('classes').update({ content_programmes: pick }).eq('id', c.id).then(function (r) { if (ok(r, 'Saved: ' + c.name + ' sees ' + (pick.join(', ') || 'only work you set'))) c.content_programmes = pick; }); };
    });
  }
  /* ---------- class analysis (Student Work Analysis Engine) ---------- */
  function analysisBoard(body, c, state) {
    if (body.getAttribute('data-ana') === c.id && !state.anaDirty) return Promise.resolve();   // no auto-refresh while reading or filtering
    state.anaDirty = false; state.af = state.af || { topic: '', ref: '', from: '', to: '' };
    var f = state.af, A = window.BVA;
    return Promise.all([S.db.rpc('class_analysis', { cls: c.id, p_from: iso(f.from), p_to: f.to ? new Date(new Date(f.to).getTime() + 864e5).toISOString() : null, p_topic: f.topic || null, p_ref: f.ref || null }),
      S.db.from('interventions').select('*').eq('class_id', c.id).order('at', { ascending: false }), S.db.from('analysis_settings').select('*').eq('teacher_id', ME.user.id).maybeSingle()]).then(function (x) {
      if (x[0].error) throw x[0].error;
      var d = x[0].data || {}, ivs = x[1].data || [], cfg = x[2].data || { thresholds: { secure: 85, developing: 70, practice: 50 }, min_items: 3, min_assessments: 2 }, th = cfg.thresholds;
      body.setAttribute('data-ana', c.id);
      body.innerHTML = '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start;align-items:flex-end;gap:8px">' +
        '<label class="f">Topic<select id="ft"><option value="">All topics</option>' + (d.all_topics || []).map(function (t) { return '<option' + (t === f.topic ? ' selected' : '') + '>' + E(t) + '</option>'; }).join('') + '</select></label>' +
        '<label class="f">Assessment<select id="fa"><option value="">All work</option>' + (d.assessments || []).map(function (a) { return '<option value="' + E(a.ref) + '"' + (a.ref === f.ref ? ' selected' : '') + '>' + E(a.title) + '</option>'; }).join('') + '</select></label>' +
        '<label class="f">From<input id="ff" type="date" value="' + E(f.from) + '"></label><label class="f">To<input id="fto" type="date" value="' + E(f.to) + '"></label>' +
        '<button type="button" class="btn sm" id="fx">Clear filters</button><button type="button" class="btn sm" id="crep">⬇ Class report</button></div>' +
        A.classHtml(d, { save: true, link: function (id) { return '#students/' + id; } }) +
        '<section class="panel"><h3 style="margin-top:0">🗂 My intervention plan</h3>' + (ivs.length ? ivs.map(function (v) {
          return '<div class="ba-sug"><b>' + E(v.title) + '</b> <span class="pill">' + E({ planned: 'Planned', done: 'Done', dropped: 'Dropped' }[v.status]) + '</span><div class="small"><b>Evidence:</b> ' + E(v.evidence || '') + '</div><div class="small"><b>Action:</b> ' + E(v.action || '') + '</div><div class="small muted">' + E(S.when(v.at)) + '</div>' +
            '<div class="acts">' + (v.status !== 'done' ? '<button type="button" class="btn sm" data-ivs="' + v.id + '" data-v="done">✓ Done</button>' : '') + (v.status === 'planned' ? '<button type="button" class="btn sm" data-ivs="' + v.id + '" data-v="dropped">Drop</button>' : '') + '</div></div>'; }).join('') :
          '<p class="small muted">Add teaching suggestions above to keep track of what you plan to do.</p>') + '</section>' +
        '<details class="panel"><summary><b>⚙ Mastery levels and evidence rules</b> <span class="small muted">(used for all your classes)</span></summary><div class="row2" style="flex-wrap:wrap;justify-content:flex-start;gap:8px;margin-top:8px">' +
        '<label class="f">Secure from %<input id="t1" type="number" min="1" max="100" value="' + th.secure + '" style="max-width:90px"></label><label class="f">Developing from %<input id="t2" type="number" min="1" max="100" value="' + th.developing + '" style="max-width:90px"></label>' +
        '<label class="f">Needs practice from %<input id="t3" type="number" min="1" max="100" value="' + th.practice + '" style="max-width:90px"></label><span class="small muted" style="align-self:center">Below that: requires intervention.</span></div>' +
        '<div class="row2" style="flex-wrap:wrap;justify-content:flex-start;gap:8px"><label class="f">Questions needed before a topic is labelled<input id="t4" type="number" min="1" max="50" value="' + cfg.min_items + '" style="max-width:90px"></label><label class="f">Pieces of work needed<input id="t5" type="number" min="1" max="20" value="' + cfg.min_assessments + '" style="max-width:90px"></label></div>' +
        '<div class="acts"><button type="button" class="btn sm main" id="tsave">Save levels</button></div></details>';
      var $ = function (q) { return body.querySelector(q); }, again = function () { state.anaDirty = true; body.removeAttribute('data-ana'); state.reload(); };
      $('#ft').onchange = function () { f.topic = this.value; again(); }; $('#fa').onchange = function () { f.ref = this.value; again(); };
      $('#ff').onchange = function () { f.from = this.value; again(); }; $('#fto').onchange = function () { f.to = this.value; again(); };
      $('#fx').onclick = function () { state.af = { topic: '', ref: '', from: '', to: '' }; again(); };
      $('#crep').onclick = function () {
        var filt = [f.topic && 'topic: ' + f.topic, f.ref && 'assessment: ' + ((d.assessments || []).filter(function (a) { return a.ref === f.ref; })[0] || {}).title, f.from && 'from ' + f.from, f.to && 'to ' + f.to].filter(Boolean).join(' · ');
        A.openDoc(A.reportDoc('Class analysis: ' + c.name, E(c.programme || '') + (filt ? ' · ' + E(filt) : '') + ' · ' + E(new Date().toLocaleDateString()), A.classHtml(d, {}) +
          (ivs.length ? '<h2>Intervention plan</h2>' + ivs.map(function (v) { return '<p><b>' + E(v.title) + '</b> (' + E(v.status) + ')<br><b>Evidence:</b> ' + E(v.evidence) + '<br><b>Action:</b> ' + E(v.action) + '</p>'; }).join('') : '') +
          '<h2>Teacher notes</h2><div class="note"></div>'), 'class-analysis-' + c.name.replace(/\W+/g, '-'));
      };
      body.querySelectorAll('[data-iv]').forEach(function (b) { b.onclick = function () { var g = d.suggestions[+b.getAttribute('data-iv')];
        S.db.from('interventions').insert({ class_id: c.id, title: g.title, evidence: g.evidence, action: g.action }).then(function (r) { if (ok(r, 'Added to your intervention plan')) again(); }); }; });
      body.querySelectorAll('[data-ivs]').forEach(function (b) { b.onclick = function () {
        S.db.from('interventions').update({ status: b.getAttribute('data-v') }).eq('id', b.getAttribute('data-ivs')).then(function (r) { if (ok(r)) again(); }); }; });
      $('#tsave').onclick = function () {
        var t = { secure: +$('#t1').value, developing: +$('#t2').value, practice: +$('#t3').value };
        if (!(t.secure > t.developing && t.developing > t.practice && t.practice > 0 && t.secure <= 100)) { toast('Each level must be lower than the one above it.', true); return; }
        S.db.from('analysis_settings').upsert({ teacher_id: ME.user.id, thresholds: t, min_items: +$('#t4').value || 3, min_assessments: +$('#t5').value || 2, updated_at: new Date().toISOString() }).then(function (r) { if (ok(r, 'Mastery levels saved')) again(); });
      };
    });
  }
  /* A student's learning profile, their analysed work and printable reports (teacher view) */
  function studentAnalysis(p, sid, pr) {
    var box = p.querySelector('#anbox'); if (!box || !window.BVA) return;
    var A = window.BVA;
    Promise.all([S.db.rpc('student_profile', { sid: sid }), S.db.from('submission_analysis').select('*').eq('student_id', sid).order('at', { ascending: false })]).then(function (x) {
      if (x[0].error) { box.innerHTML = '<p class="small muted">' + (/student_profile|schema cache/.test(x[0].error.message) ? 'The learning profile needs database update 016.' : E(S.nice(x[0].error))) + '</p>'; return; }
      var prof = x[0].data, subs = x[1].data || [];
      box.innerHTML = '<div class="row2"><h3 style="margin:0">📊 Learning profile</h3><div class="acts"><button type="button" class="btn sm" id="aip">🤖 AI summary</button><button type="button" class="btn sm main" id="prep">⬇ Profile report</button></div></div>' +
        A.profileHtml(prof, { staff: true }) +
        '<h5>Analysed work</h5>' + (subs.length ? subs.map(function (sa) { return '<details class="panel" data-sk="' + E(sa.sub_key) + '"><summary><b>' + E(sa.title) + '</b> <span class="small muted">' + E(S.when(sa.at)) + '</span> · ' + (sa.pct == null ? '–' : sa.pct + '%') + ' ' + A.pill(A.levelOf(sa.pct, (prof.settings || {}).thresholds)) + (sa.ai && !sa.ai.none ? ' <span class="pill">🤖</span>' : '') + '</summary><div class="sbody small muted">Loading…</div></details>'; }).join('') : '<p class="small muted">No analysed work yet.</p>') +
        '<h5>Add a comment for the student</h5><textarea id="acm" rows="2" placeholder="Shown to the student on their profile and in reports"></textarea><div class="acts"><button type="button" class="btn sm" id="acs">Save comment</button></div>';
      box.querySelectorAll('details[data-sk]').forEach(function (dd) { dd.ontoggle = function () { if (!dd.open || dd.getAttribute('data-l')) return; dd.setAttribute('data-l', 1);
        var sk = dd.getAttribute('data-sk'), sa = subs.filter(function (z) { return z.sub_key === sk; })[0];
        S.db.from('item_results').select('*').eq('sub_key', sk).order('id').then(function (r) {
          dd.querySelector('.sbody').className = 'sbody'; dd.querySelector('.sbody').innerHTML = A.submissionHtml(sa, r.data || [], { settings: prof.settings, open: true }) +
            '<div class="acts"><button type="button" class="btn sm" data-ai1>🤖 ' + (sa.ai && !sa.ai.none ? 'Redo' : 'Add') + ' AI analysis</button><button type="button" class="btn sm" data-rep1>⬇ Report for this work</button></div>';
          dd.querySelector('[data-rep1]').onclick = function () { A.openDoc(A.reportDoc('Assessment analysis: ' + sa.title, E(pr.full_name) + ' · ' + E((CLASSES.filter(function (k) { return k.id === pr.class_id; })[0] || {}).name || '') + ' · ' + E(S.when(sa.at)),
            A.submissionHtml(sa, r.data || [], { settings: prof.settings, open: true }) + commentsFor(prof, sk) + '<h2>Teacher comments</h2><div class="note"></div>'), 'analysis-' + (pr.full_name || 'student').replace(/\W+/g, '-')); };
          dd.querySelector('[data-ai1]').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Analysing…';
            var body = sk.indexOf('L:') === 0 ? { lesson: sa.ref, student: sid } : { attempt: sk };
            S.db.functions.invoke('analyse', { body: body }).then(function (res) { var dta = res.data; if (typeof dta === 'string') { try { dta = JSON.parse(dta); } catch (e) { dta = null; } }
              if (res.error || !dta || !dta.ok) { b.disabled = false; b.textContent = '🤖 Add AI analysis'; toast((dta && dta.error) || 'AI analysis is not available right now.', true); return; }
              toast(dta.ai ? 'AI analysis added' : 'Re-analysed (no written answers for AI to read)'); studentAnalysis(p, sid, pr); }); };
        }); }; });
      box.querySelector('#prep').onclick = function () {
        S.db.from('item_results').select('*').eq('student_id', sid).order('at').then(function (r) {
          var items = r.data || [], by = {}; items.forEach(function (i) { (by[i.sub_key] = by[i.sub_key] || []).push(i); });
          A.openDoc(A.reportDoc('Learning profile: ' + (pr.full_name || 'Student'), E((CLASSES.filter(function (k) { return k.id === pr.class_id; })[0] || {}).name || '') + ' · ' + subs.length + ' pieces of analysed work',
            '<h2>Overview and topic mastery</h2>' + A.profileHtml(prof, { staff: true }) + '<h2>Assessment history</h2>' +
            subs.slice().reverse().map(function (sa) { return '<h3 style="margin-bottom:2px">' + E(sa.title) + '</h3>' + A.submissionHtml(sa, by[sa.sub_key] || [], { settings: prof.settings, open: true }); }).join('') +
            '<h2>Teacher comments and intervention</h2><div class="note"></div>'), 'profile-' + (pr.full_name || 'student').replace(/\W+/g, '-'));
        });
      };
      box.querySelector('#aip').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Summarising…';
        S.db.functions.invoke('analyse', { body: { profile: sid } }).then(function (res) { var dta = res.data; if (typeof dta === 'string') { try { dta = JSON.parse(dta); } catch (e) { dta = null; } }
          if (res.error || !dta || !dta.ok) { b.disabled = false; b.textContent = '🤖 AI summary'; toast((dta && dta.error) || 'AI summary is not available right now.', true); return; }
          studentAnalysis(p, sid, pr); }); };
      box.querySelector('#acs').onclick = function () { var t = box.querySelector('#acm').value.trim(); if (!t) return;
        S.db.from('analysis_comments').insert({ student_id: sid, comment: t }).then(function (r) { if (ok(r, 'Comment saved')) studentAnalysis(p, sid, pr); }); };
    });
  }
  function commentsFor(prof, sk) { var cs = (prof.comments || []).filter(function (c) { return c.sub_key === sk || !c.sub_key; });
    return cs.length ? '<h2>Comments</h2>' + cs.map(function (c) { return '<p>' + E(c.comment) + ' <span class="small">(' + E(S.when(c.at)) + ')</span></p>'; }).join('') : ''; }
  function defaultProg(p) { p = (p || '').toLowerCase(); return /^grade 11/.test(p) ? ['IGCSE', 'AS Level'] : /^grade 12/.test(p) ? ['AS Level', 'A Level'] : []; }
  function filters(state) {
    return '<div class="row2" style="justify-content:flex-start"><span class="small muted">Show:</span>' + [['all', 'Everyone'], ['not', 'Not submitted'], ['done', 'Submitted']].map(function (f) {
      return '<button type="button" class="btn sm' + (state.filter === f[0] ? ' main' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>';
  }
  function wireFilters(host, state) {
    host.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { state.filter = b.getAttribute('data-f'); state.reload(); }; });
    host.querySelectorAll('details[data-k]').forEach(function (d) { d.ontoggle = function () { state.open[d.getAttribute('data-k')] = d.open; }; });
  }
  function quizBoard(body, c, state) {
    return Promise.all([roster(c.id),
      S.db.from('quiz_classes').select('published, quizzes(id,title,category,published,due_at,opens_at,time_limit_minutes,show_results,created_at, quiz_questions(question_id))').eq('class_id', c.id),
      S.db.rpc('class_quiz_board', { cls: c.id })]).then(function (x) {
      if (x[1].error) throw x[1].error; if (x[2].error) throw x[2].error;
      var kids = x[0], qs = (x[1].data || []).filter(function (r) { return r.quizzes; }).map(function (r) { return Object.assign({}, r.quizzes, { live: !!r.published }); }), by = {}, extra = {};
      qs.sort(function (a, b) { return (b.live - a.live) || (new Date(b.created_at) - new Date(a.created_at)); });
      (x[2].data || []).forEach(function (r) { (by[r.quiz_id] = by[r.quiz_id] || {})[r.student_id] = r; });
      if (!qs.length) { body.innerHTML = '<p class="emptybox">No quizzes or exams are linked to ' + E(c.name) + ' yet. In <a href="#quizzes">Quizzes and exams</a>, open a quiz and tick this class; then publish it here.</p>'; return; }
      if (!kids.length) { body.innerHTML = '<p class="emptybox">No students have joined ' + E(c.name) + ' yet. Give them the join code <b class="code">' + E(c.join_code) + '</b> to type on the registration page.</p>'; return; }
      var html = filters(state) + qs.map(function (q, qi) {
        var nq = (q.quiz_questions || []).length, rows = kids.map(function (k) {
          var a = (by[q.id] || {})[k.id], st = !a ? 'none' : a.status === 'in_progress' ? 'prog' : 'done';
          return { k: k, a: a, st: st };
        });
        var nDone = rows.filter(function (r) { return r.st === 'done'; }).length, nProg = rows.filter(function (r) { return r.st === 'prog'; }).length, nNone = rows.length - nDone - nProg;
        var notList = rows.filter(function (r) { return r.st !== 'done'; }).map(function (r) { return E(r.k.full_name || '(no name)'); });
        var show = rows.filter(function (r) { return state.filter === 'all' || (state.filter === 'done' ? r.st === 'done' : r.st !== 'done'); });
        var order = { prog: 0, none: 1, done: 2 }; show.sort(function (a, b) { return order[a.st] - order[b.st] || (a.k.full_name || '').localeCompare(b.k.full_name || ''); });
        var key = 'q' + q.id, open = state.open[key] != null ? state.open[key] : qi === 0;
        return '<details class="panel" data-k="' + key + '"' + (open ? ' open' : '') + '><summary><b>' + (q.category === 'exam' ? '🧪 ' : '📝 ') + E(q.title) + '</b> ' + (q.live ? '<span class="pill ok">Published for ' + E(c.name) + '</span>' : '<span class="pill">Not published: students in ' + E(c.name) + ' cannot see it</span>') +
          '<div class="small muted">' + [nq + ' questions', q.time_limit_minutes ? '⏱ ' + q.time_limit_minutes + ' min' : '', q.due_at ? 'Due ' + S.when(q.due_at) : ''].filter(Boolean).join(' · ') + '</div>' +
          '<div class="small"><b style="color:var(--ok)">✓ ' + nDone + ' submitted</b> · <b style="color:#b45309">✎ ' + nProg + ' working now</b> · <b style="color:#b91c1c">○ ' + nNone + ' not started</b> · of ' + rows.length + '</div>' +
          bar([[nDone, 'var(--ok)', 'submitted'], [nProg, '#f59e0b', 'working'], [nNone, '#fca5a5', 'not started']], rows.length) + '</summary>' +
          (notList.length ? '<p class="small"><b>Not submitted (' + notList.length + '):</b> ' + notList.join(', ') + '</p>' : '<p class="small"><b>Everyone has submitted.</b></p>') +
          '<div class="acts"><button type="button" class="btn sm' + (q.live ? '' : ' main') + '" data-pub="' + q.id + '" data-on="' + (q.live ? '0' : '1') + '">' + (q.live ? '⏸ Unpublish for this class' : '📢 Publish for ' + E(c.name)) + '</button><button type="button" class="btn sm" data-rep="' + q.id + '">⬇ Report (marks and feedback)</button><button type="button" class="btn sm" data-ms="' + q.id + '">📄 Mark scheme</button>' +
            (nDone ? '<button type="button" class="btn sm" data-remark="' + q.id + '" title="Re-mark every handed-in attempt with the current rules and refresh the feedback. Marks you confirmed are kept.">🔁 Re-mark and refresh feedback</button>' : '') + '</div>' +
          '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Status</th><th>Progress</th><th>Last active</th><th>Result</th></tr>' + show.map(function (r) {
            var a = r.a, idle = a && r.st === 'prog' && (Date.now() - new Date(a.last_seen)) > 180000, gone = a && r.st === 'prog' && a.away_now;
            var stat = r.st === 'done' ? '<span class="pill ok">✓ Submitted</span>' : r.st === 'prog' ? (gone ? '<span class="pill" style="background:#fee2e2;color:#b91c1c">🚩 Left the page now</span>' : idle ? '<span class="pill new">⚠ Idle</span>' : '<span class="pill t">✎ Working</span>') : '<span class="pill" style="color:#b91c1c">Not started</span>';
            var flag = a && a.away_count ? ' <span class="pill" style="background:#fee2e2;color:#b91c1c" title="Times the student left the page, and total time away">🚩 Left ' + a.away_count + '× · ' + mmss(a.away_seconds || 0) + '</span>' : '';
            var prog = !a ? '' : r.st === 'prog' ? a.answered + ' of ' + nq + ' answered' + (a.seconds_left != null ? ' · ⏱ ' + mmss(a.seconds_left) + ' left' : '') : 'Handed in ' + S.when(a.submitted_at);
            var res = !a || r.st !== 'done' ? '' : a.status === 'needs_marking' ? '<a class="btn sm" href="#marking/' + a.attempt_id + '">Mark</a>' : (a.score != null ? a.score + ' / ' + a.max_score : '') + (a.released || q.show_results ? '' : ' <span class="small muted">(not released)</span>');
            return '<tr><td><a href="#students/' + r.k.id + '">' + E(r.k.full_name || '(no name)') + '</a>' + (r.k.approved ? '' : ' <span class="pill new">not approved</span>') + '</td><td>' + stat + '</td><td class="small">' + prog + (a && a.attempts > 1 ? ' · attempt ' + a.attempts : '') + flag + '</td><td class="small">' + (a ? ago(r.st === 'done' ? a.submitted_at : a.last_seen) : '–') + '</td><td>' + res + '</td></tr>';
          }).join('') + '</table></div></details>';
      }).join('');
      body.innerHTML = html; wireFilters(body, state);
      wireMS(body);
      body.querySelectorAll('[data-remark]').forEach(function (b) { b.onclick = function () {
        var qid = b.getAttribute('data-remark'), qz = qs.filter(function (z) { return z.id === qid; })[0] || {};
        b.disabled = true; b.textContent = 'Re-marking…';
        S.db.rpc('remark_quiz', { qid: qid }).then(function (r) {
          if (r.error) { b.disabled = false; b.textContent = '🔁 Re-mark and refresh feedback'; toast(S.nice(r.error), true); return; }
          var d = r.data || {}, ai = (d.need_ai || []);
          var done = function (n) { b.disabled = false; b.textContent = '🔁 Re-mark and refresh feedback';
            toast('Re-marked ' + d.attempts + ' attempt' + (d.attempts === 1 ? '' : 's') + ': ' + d.changed + ' mark' + (d.changed === 1 ? '' : 's') + ' changed, feedback refreshed' + (n ? ', AI suggestions for ' + n + ' attempt' + (n === 1 ? '' : 's') : '') + '. Marks you confirmed were kept.'); state.reload(); };
          if (!ai.length || (qz.feedback_mode || 'hybrid') === 'rule' || !S.db.functions) return done(0);
          b.textContent = 'Getting AI suggestions…';
          var n = 0; ai.reduce(function (pr, aid) { return pr.then(function () { return S.db.functions.invoke('ai-mark', { body: { attempt: aid } }).then(function () { n++; }, function () {}); }); }, Promise.resolve()).then(function () { done(n); });
        });
      }; });
      body.querySelectorAll('[data-pub]').forEach(function (b) { b.onclick = function () {
        var on = b.getAttribute('data-on') === '1'; b.disabled = true;
        S.db.rpc('set_quiz_published', { qid: b.getAttribute('data-pub'), cid: c.id, on_off: on }).then(function (r) {
          b.disabled = false; if (r.error) return toast(S.nice(r.error));
          toast(on ? 'Published for ' + c.name + ': its students can open it now.' : 'Unpublished for ' + c.name + '.'); state.reload(); }); }; });
      body.querySelectorAll('[data-rep]').forEach(function (b) { b.onclick = function () { var qz = qs.filter(function (z) { return z.id === b.getAttribute('data-rep'); })[0];
        b.disabled = true; b.textContent = 'Making the report…';
        quizReport(qz, c, kids, by[qz.id] || {}).then(function () { b.disabled = false; b.textContent = '⬇ Report (marks and feedback)'; }, function (e) { b.disabled = false; b.textContent = '⬇ Report (marks and feedback)'; toast(S.nice(e), true); }); }; });
    });
  }
  /* Feedback on one saved lesson step (rules, AI or teacher), as the student sees it */
  function lfHtml(f) {
    var src = f.source === 'ai' ? '🤖 AI suggestion' : f.source === 'teacher' ? '👩‍🏫 Teacher' : '⚙ Re-marked by rules';
    var li = function (i, t) { return '<li>' + i + ' ' + E(t) + '</li>'; };
    return '<div class="small" style="margin-top:4px"><b>' + src + '</b> · ' + E(S.when(f.at)) + ' · students see this on the lesson page</div>' + (f.items || []).map(function (a) {
      return '<div style="border-left:4px solid ' + (a.mark >= a.max ? '#16a34a' : a.mark > 0 ? '#f59e0b' : '#dc2626') + ';padding:4px 10px;margin:4px 0;background:#fff"><b>' + E(a.q) + ' · ' + E(a.mark) + '/' + E(a.max) + (f.source === 'ai' ? ' suggested' + (a.confidence ? ' (' + E(a.confidence) + ' confidence)' : '') : '') + '</b><ul style="margin:2px 0;padding-left:0;list-style:none">' +
        (a.understood || []).map(function (t) { return li('✓', t); }).join('') + (a.missing || []).map(function (t) { return li('✗', t); }).join('') + (a.why || []).map(function (t) { return li('💡', t); }).join('') +
        (a.improve ? li('↗', a.improve) : '') + (a.next ? li('📚', a.next) : '') + '</ul></div>'; }).join('');
  }
  /* Printable mark scheme for a quiz or exam, built from the answers and mark scheme stored with each question */
  function wireMS(host) {
    host.querySelectorAll('[data-ms]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); var t = b.textContent; b.disabled = true; b.textContent = 'Making…';
      markScheme(b.getAttribute('data-ms')).then(function () { b.disabled = false; b.textContent = t; }, function (er) { b.disabled = false; b.textContent = t; toast(S.nice(er), true); }); }; });
  }
  function markScheme(qid) {
    return Promise.all([S.db.from('quizzes').select('title,category,instructions,time_limit_minutes').eq('id', qid).maybeSingle(), loadQuiz(qid)]).then(function (x) {
      var qz = x[0].data || { title: 'Quiz' }, qs = x[1].filter(function (q) { return q.kind !== 'info'; }), total = 0, n = 0;
      var L = 'ABCDEFGHIJ', md = function (t) { return BV.md ? BV.md(String(t || '')) : E(t); };
      var body = qs.map(function (q) {
        n++; total += q.marks || 0; var a = q.ans || {}, opts = q.options || [], h = '';
        var prompt = String(q.prompt || '').replace(/\[\[answer:[^\]]*\]\]/g, '_____');
        if ((q.kind === 'mcq' || q.kind === 'tf') && opts.length) {
          h += '<ol class="opts" type="A">' + opts.map(function (o, i) { var right = i === a.correct_option, fb = (a.option_feedback || [])[i];
            return '<li class="' + (right ? 'right' : '') + '">' + E(o) + (right ? ' <b>✓ correct</b>' : '') + (fb ? '<div class="why">' + E(fb) + '</div>' : '') + '</li>'; }).join('') + '</ol>';
          h += '<p class="ans"><b>Answer:</b> ' + (a.correct_option != null ? L[a.correct_option] + ' (' + E(opts[a.correct_option]) + ')' : '<i>not set</i>') + ' [1]</p>';
        }
        var pts = Array.isArray(a.points) ? a.points : [];
        if (pts.length) h += '<p class="ans"><b>Mark points</b> (one mark each unless shown):</p><ul>' + pts.map(function (p) {
          var any = (p.any || []).map(function (w) { return String(w).replace(/\s*\+\s*/g, ' + '); }).join(' / ');
          var t = p.text || p.point; return '<li>' + E(t || any) + (p.marks && p.marks > 1 ? ' [' + p.marks + ']' : ' [1]') + (any && t ? ' <span class="kw">key words: ' + E(any) + '</span>' : '') + '</li>'; }).join('') + '</ul>';
        if (a.mark_scheme) h += '<div class="ms"><b>Mark scheme</b>' + md(a.mark_scheme) + '</div>';
        if (a.model_answer) h += '<div class="model"><b>Model answer</b>' + md(a.model_answer) + '</div>';
        if (a.rubric) h += '<div class="ms"><b>Level descriptors</b>' + md(a.rubric) + '</div>';
        if (Array.isArray(a.accepted) && a.accepted.length) h += '<p class="small"><b>Also accept:</b> ' + E(a.accepted.join('; ')) + '</p>';
        var mis = Array.isArray(a.misconceptions) ? a.misconceptions : [];
        if (mis.length) h += '<p class="small"><b>Do not accept / common errors:</b></p><ul class="small">' + mis.map(function (m) { return '<li>' + (m.any ? '<i>' + E(m.any.slice(0, 4).join(' / ')) + '</i>: ' : '') + E(typeof m === 'string' ? m : (m.say || JSON.stringify(m))) + '</li>'; }).join('') + '</ul>';
        if (a.explanation && String(a.mark_scheme || '').indexOf(a.explanation) < 0) h += '<p class="small"><b>Why:</b> ' + E(a.explanation) + '</p>';
        if (!h) h = '<p class="ans"><i>No mark scheme entered for this question yet.</i></p>';
        return '<section class="q"><div class="qh"><b>Question ' + n + '</b><span>[' + (q.marks || 0) + ' mark' + (q.marks === 1 ? '' : 's') + ']</span></div><div class="prompt">' + md(prompt) + '</div>' +
          (q.image_url ? '<img src="' + E(q.image_url) + '" alt="">' : '') + h + '</section>';
      }).join('');
      var css = 'body{font:15px/1.5 Arial,Helvetica,sans-serif;color:#111;max-width:860px;margin:24px auto;padding:0 16px}h1{font-size:1.5em;margin:0}.meta{color:#555;margin:4px 0 18px}' +
        '.q{border:1px solid #ccc;border-radius:8px;padding:10px 14px;margin:12px 0;page-break-inside:avoid}.qh{display:flex;justify-content:space-between;border-bottom:1px solid #eee;margin-bottom:6px}' +
        '.prompt{color:#333}.prompt p{margin:4px 0}img{max-width:100%;max-height:320px;display:block;margin:6px 0}.opts li{margin:2px 0}.opts li.right{font-weight:600;color:#065f46}.why{font-weight:400;color:#555;font-size:.9em}' +
        '.ans{background:#ecfdf5;padding:4px 8px;border-radius:6px}.ms,.model{background:#f8fafc;border-left:4px solid #2563eb;padding:6px 10px;margin:6px 0}.model{border-left-color:#16a34a}.kw{color:#555;font-size:.88em}.small{font-size:.9em}' +
        '.bar{position:sticky;top:0;background:#fff;padding:8px 0;border-bottom:1px solid #ddd;margin-bottom:10px}@media print{.bar{display:none}}';
      var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mark scheme · ' + E(qz.title) + '</title><style>' + css + '</style></head><body>' +
        '<div class="bar"><button onclick="print()">🖨 Print or save as PDF</button></div><h1>Mark scheme: ' + E(qz.title) + '</h1>' +
        '<p class="meta">' + (qz.category === 'exam' ? 'Exam' : 'Quiz') + ' · ' + n + ' questions · ' + total + ' marks' + (qz.time_limit_minutes ? ' · ' + qz.time_limit_minutes + ' minutes' : '') + ' · Prepared by Learnova · Learnova · Confidential: for teachers</p>' + body + '</body></html>';
      var w = window.open('', '_blank');
      if (w) { w.document.open(); w.document.write(html); w.document.close(); }
      else { var a2 = document.createElement('a'); a2.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a2.download = 'mark-scheme-' + qz.title.replace(/[^\w]+/g, '-').slice(0, 60) + '.html'; a2.click(); }
    });
  }
  /* A self-contained HTML report for one quiz and one class: marks, answers and feedback, with where each piece of feedback came from */
  function quizReport(qz, c, kids, latest) {
    var ids = Object.keys(latest).map(function (k) { return latest[k].attempt_id; });
    return Promise.all([loadQuiz(qz.id), ids.length ? S.db.from('quiz_attempts').select('id,student_id,answers,detail,score,max_score,status,submitted_at,released,away_count,away_seconds').in('id', ids) : Promise.resolve({ data: [] }),
      ids.length ? S.db.from('attempt_feedback').select('*').in('attempt_id', ids).then(function (f) { return f; }, function () { return { data: [] }; }) : Promise.resolve({ data: [] })]).then(function (x) {
      var qs = x[0].filter(function (q) { return q.kind !== 'info'; }), at = {}, fb = {}, src = { rule: 0, ai: 0, teacher: 0 };
      (x[1].data || []).forEach(function (a) { at[a.student_id] = a; });
      ((x[2] && x[2].data) || []).forEach(function (f) { (fb[f.attempt_id] = fb[f.attempt_id] || {})[f.question_id] = f; src[f.source] = (src[f.source] || 0) + 1; });
      var T = window.BVT, h = function (v) { return E(v == null ? '' : v); }, lbl = { rule: '⚙️ Rule-based', ai: '🤖 AI', teacher: '🧑‍🏫 Teacher' };
      var done = kids.filter(function (k) { return at[k.id] && at[k.id].status !== 'in_progress'; }), mean = done.length ? Math.round(done.reduce(function (t, k) { return t + 100 * (+at[k.id].score || 0) / (+at[k.id].max_score || 1); }, 0) / done.length) : null;
      var rows = kids.map(function (k) { var a = at[k.id], st = !a ? 'Not started' : a.status === 'in_progress' ? 'Working' : a.status === 'needs_marking' ? 'Needs marking' : 'Marked';
        return '<tr><td>' + h(k.full_name) + '</td><td>' + st + '</td><td>' + (a && a.status !== 'in_progress' ? h(a.score) + ' / ' + h(a.max_score) : '–') + '</td><td>' + (a && a.away_count ? a.away_count + '×' : '') + '</td></tr>'; }).join('');
      var per = done.map(function (k) { var a = at[k.id], f = fb[a.id] || {}, det = {}; (a.detail || []).forEach(function (d) { det[d.question_id] = d; });
        return '<section class="stu"><h2>' + h(k.full_name) + ' <small>' + h(a.score) + ' / ' + h(a.max_score) + ' · handed in ' + h(S.when(a.submitted_at)) + (a.released ? ' · released' : '') + '</small></h2>' + qs.map(function (q, i) {
          var d = det[q.id] || {}, g = (a.answers || {})[q.id], row = f[q.id], ans = g == null || g === '' ? '<i>no answer</i>' : /^data:image/.test(g) ? '<img src="' + h(g) + '" alt="Drawing" style="max-width:320px">' : q.kind === 'short' ? '<span style="white-space:pre-wrap">' + h(g) + '</span>' : h('ABCDEFGH'.charAt(g) + '. ' + ((q.options || [])[g] || ''));
          return '<div class="q"><p><b>' + (i + 1) + '.</b> ' + h(String(q.prompt || '').replace(/\[\[answer:[^\]]*\]\]/g, '').slice(0, 400)) + ' <span class="pill">' + (d.got == null ? 'to be marked' : h(d.got) + ' / ' + h(d.max)) + '</span>' + (row ? ' <span class="src ' + row.source + '">' + lbl[row.source] + (row.reviewed ? ' · teacher-reviewed' : '') + '</span>' : '') + '</p>' +
            '<p class="ans"><b>Answer:</b> ' + ans + '</p>' + (row && T && T.feedback ? T.feedback(row) : d.comment ? '<p><b>Teacher comment:</b> ' + h(d.comment) + '</p>' : '') + '</div>'; }).join('') + '</section>'; }).join('');
      var css = 'body{font:15px/1.5 system-ui,Arial,sans-serif;max-width:960px;margin:24px auto;padding:0 16px;color:#1e293b}h1{margin:0}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#f1f5f9}' +
        '.stu{border-top:3px solid #e2e8f0;margin-top:24px;page-break-before:always}.stu small{color:#64748b;font-weight:400}.q{border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;margin:10px 0}.pill{background:#f1f5f9;border-radius:99px;padding:1px 8px;font-size:.8em}' +
        '.src{font-size:.8em;border-radius:99px;padding:1px 8px}.src.rule{background:#e0f2fe}.src.ai{background:#ede9fe}.src.teacher{background:#dcfce7}.ans{background:#f8fafc;padding:6px 8px;border-radius:6px}' +
        '.fbbox{display:grid;gap:6px}.fbp{border-left:4px solid #cbd5e1;padding:4px 10px}.fbp b{display:block}.fbp ul{margin:0;padding-left:20px}.fbp p{margin:2px 0}.fbp.good{border-color:#16a34a}.fbp.miss{border-color:#dc2626}.fbp.why{border-color:#2563eb}.fbp.imp{border-color:#d97706}.fbp.next{border-color:#7c3aed}.fbp.tc{border-color:#0f766e}.fbsrc{font-size:.8em;color:#64748b;margin:0}' +
        '@media print{.stu{page-break-before:always}}';
      var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + h(qz.title) + ' · ' + h(c.name) + '</title><style>' + css + '</style></head><body>' +
        '<p style="color:#64748b">Learnova · teacher report · ' + h(new Date().toLocaleString()) + '</p><h1>' + h(qz.title) + '</h1><p><b>' + h(c.name) + '</b> · ' + done.length + ' of ' + kids.length + ' handed in' + (mean != null ? ' · class average ' + mean + '%' : '') + '</p>' +
        '<p>Feedback sources: ⚙️ rule-based ' + src.rule + ' · 🤖 AI ' + src.ai + ' · 🧑‍🏫 teacher ' + src.teacher + '. AI marks are suggestions until a teacher confirms them.</p>' +
        '<table><tr><th>Student</th><th>Status</th><th>Mark</th><th>Left the page</th></tr>' + rows + '</table>' + per + '</body></html>';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      a.download = (qz.title + ' ' + c.name).replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 80) + '-report.html'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    });
  }
  function lessonBoard(body, c, state) {
    var since = new Date(Date.now() - 60 * 864e5).toISOString();
    return Promise.all([roster(c.id), S.db.rpc('class_lesson_board', { cls: c.id }), S.db.from('lessons').select('external_id,title,topic_id,sort_order').order('sort_order'),
      S.db.from('lesson_work').select('lesson,student_name,class_name,step,saved_at').is('student_id', null).gte('saved_at', since).order('saved_at', { ascending: false }).limit(1000)]).then(function (x) {
      if (x[1].error) throw x[1].error;
      var kids = x[0], board = x[1].data || [], lessons = x[2].data || [], tp = {}; TOPICS.forEach(function (t) { tp[t.id] = t; });
      var title = {}; lessons.forEach(function (l) { title[l.external_id] = l.title; });
      var last = {}; board.forEach(function (r) { if (!last[r.lesson] || r.last_saved > last[r.lesson]) last[r.lesson] = r.last_saved; });
      var active = Object.keys(last).sort(function (a, b) { return last[b] < last[a] ? -1 : 1; });
      var prog = lessons.filter(function (l) { var t = tp[l.topic_id], pr = t && (t.programme || (tp[t.parent_id] || {}).programme); return sameProg(pr, c.programme) && active.indexOf(l.external_id) < 0; });
      if (!state.lesson || (active.indexOf(state.lesson) < 0 && !prog.some(function (l) { return l.external_id === state.lesson; }))) state.lesson = active[0] || (prog[0] && prog[0].external_id) || null;
      if (!state.lesson) { body.innerHTML = '<p class="emptybox">No interactive lessons for ' + E(c.name) + ' yet. When students in this class save a step on a lesson page while signed in, the lesson appears here.</p>'; return; }
      var L = state.lesson, rows = {}; board.filter(function (r) { return r.lesson === L; }).forEach(function (r) { rows[r.student_id] = r; });
      var list = kids.map(function (k) { return { k: k, r: rows[k.id] }; });
      Object.keys(rows).forEach(function (sid) { if (!kids.some(function (k) { return k.id === sid; })) list.push({ k: { id: sid, full_name: rows[sid].student_name, approved: true, moved: true }, r: rows[sid] }); });
      list.forEach(function (x) { var st = x.r ? x.r.steps : []; x.st = !x.r ? 'none' : (st.indexOf(6) >= 0 || st.length >= 6) ? 'done' : 'prog'; });
      var nDone = list.filter(function (x) { return x.st === 'done'; }).length, nProg = list.filter(function (x) { return x.st === 'prog'; }).length, nNone = list.length - nDone - nProg;
      var notList = list.filter(function (x) { return x.st !== 'done'; }).map(function (x) { return E(x.k.full_name || '(no name)'); });
      var show = list.filter(function (x) { return state.filter === 'all' || (state.filter === 'done' ? x.st === 'done' : x.st !== 'done'); });
      var order = { prog: 0, none: 1, done: 2 }; show.sort(function (a, b) { return order[a.st] - order[b.st] || (a.k.full_name || '').localeCompare(b.k.full_name || ''); });
      var num = (c.name.match(/\d+/) || [''])[0], anon = (x[3].data || []).filter(function (w) { var cn = (w.class_name || '').toLowerCase(); return w.lesson === L && num && (cn.match(/\d+/) || [''])[0] === num; });
      var anonBy = {}; anon.forEach(function (w) { var k = w.student_name.trim().toLowerCase(); (anonBy[k] = anonBy[k] || { n: w.student_name, c: w.class_name, steps: {}, t: w.saved_at }).steps[w.step] = 1; });
      var chips = function (st) { var out = ''; for (var i = 1; i <= 6; i++) out += '<span class="stp' + (st.indexOf(i) >= 0 ? ' on' : '') + '" title="Step ' + i + (st.indexOf(i) >= 0 ? ' saved' : ' not saved') + '">' + i + '</span>'; return out; };
      body.innerHTML = '<div class="row2"><label class="small">Lesson <select id="lsel" style="max-width:520px">' +
          (active.length ? '<optgroup label="Lessons this class has worked on">' + active.map(function (id) { return '<option value="' + E(id) + '"' + (id === L ? ' selected' : '') + '>' + E(title[id] || id) + ' · ' + ago(last[id]) + '</option>'; }).join('') + '</optgroup>' : '') +
          (prog.length ? '<optgroup label="Other lessons for ' + E(c.programme || 'this class') + '">' + prog.map(function (l) { return '<option value="' + E(l.external_id) + '"' + (l.external_id === L ? ' selected' : '') + '>' + E(l.title) + '</option>'; }).join('') + '</optgroup>' : '') +
        '</select></label></div>' + filters(state) +
        '<section class="panel"><b>' + E(title[L] || L) + '</b><div class="small"><b style="color:var(--ok)">✓ ' + nDone + ' finished all six steps</b> · <b style="color:#b45309">✎ ' + nProg + ' part-way</b> · <b style="color:#b91c1c">○ ' + nNone + ' not started</b> · of ' + list.length + '</div>' +
        bar([[nDone, 'var(--ok)', 'finished'], [nProg, '#f59e0b', 'part-way'], [nNone, '#fca5a5', 'not started']], list.length) +
        (notList.length ? '<p class="small"><b>Not submitted (' + notList.length + '):</b> ' + notList.join(', ') + '</p>' : '<p class="small"><b>Everyone has finished.</b></p>') +
        (kids.length ? '' : '<p class="small muted">No students have joined this class yet (join code <b class="code">' + E(c.join_code) + '</b>).</p>') +
        '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Status</th><th>Steps saved</th><th>Marks so far</th><th>Last saved</th><th></th></tr>' + show.map(function (x) {
          var r = x.r, idle = r && x.st === 'prog' && (Date.now() - new Date(r.last_saved)) > 600000;
          var stat = x.st === 'done' ? '<span class="pill ok">✓ Finished</span>' : x.st === 'prog' ? (idle ? '<span class="pill new">⚠ No save for ' + ago(r.last_saved).replace(' ago', '') + '</span>' : '<span class="pill t">✎ Working</span>') : '<span class="pill" style="color:#b91c1c">Not started</span>';
          return '<tr><td>' + E(x.k.full_name || '(no name)') + (x.k.moved ? ' <span class="pill">now in another class</span>' : '') + '</td><td>' + stat + '</td><td>' + chips(r ? r.steps : []) + '</td><td>' + (r && r.total ? E(r.total.replace(/\s/g, '')) : '–') + '</td><td class="small">' + (r ? ago(r.last_saved) : '–') + '</td><td>' + (r ? '<button type="button" class="btn sm" data-w="' + x.k.id + '">View work</button>' : '') + '</td></tr>' +
            '<tr hidden data-wr="' + x.k.id + '"><td colspan="6"></td></tr>';
        }).join('') + '</table></div></section>' +
        (Object.keys(anonBy).length ? '<section class="panel tint"><b>Saved without signing in (' + Object.keys(anonBy).length + ')</b><p class="small muted">These students typed a class like "' + E(num) + '" but were not signed in, so their work is not linked to an account. Ask them to sign in before they save. Their work is still in <a href="#work">Lesson work</a>.</p><ul class="small">' +
          Object.keys(anonBy).map(function (k) { var a = anonBy[k]; return '<li><b>' + E(a.n) + '</b> (typed "' + E(a.c) + '") · steps ' + Object.keys(a.steps).sort().join(', ') + ' · ' + ago(a.t) + '</li>'; }).join('') + '</ul></section>' : '');
      body.querySelector('#lsel').onchange = function () { state.lesson = this.value; try { sessionStorage.setItem('bv-cl-' + c.id, state.lesson); } catch (e) {} state.reload(); };
      wireFilters(body, state);
      body.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () {
        var sid = b.getAttribute('data-w'), tr = body.querySelector('[data-wr="' + sid + '"]'); if (!tr.hidden) { tr.hidden = true; return; }
        tr.hidden = false; tr.firstChild.innerHTML = '<span class="muted">Loading…</span>';
        Promise.all([S.db.from('lesson_work').select('id,step,answers,saved_at').eq('student_id', sid).eq('lesson', L).order('saved_at'),
          S.db.from('lesson_feedback').select('work_id,step,source,items,at').eq('student_id', sid).eq('lesson', L).order('at', { ascending: false })]).then(function (x) {
          var fbs = x[1].data || [];
          tr.firstChild.innerHTML = (x[0].data || []).map(function (s) {
            var f = fbs.filter(function (z) { return z.work_id === s.id; })[0] || fbs.filter(function (z) { return z.step === s.step; })[0];
            var written = /\bQ?\d+[a-z()]*\s*:/i.test(s.answers.replace(/^\[AUTO[^\]]*\]/, ''));
            return '<div style="margin:6px 0;border-bottom:1px solid var(--line,#e2e8f0);padding-bottom:6px"><b>Step ' + s.step + '</b> <span class="small muted">' + E(S.when(s.saved_at)) + '</span><pre style="white-space:pre-wrap;margin:2px 0;font-size:.85em">' + E(s.answers) + '</pre>' +
              (written ? '<div class="acts"><button type="button" class="btn sm" data-lf="' + s.id + '" data-m="rule">🔁 Re-mark (rules)</button><button type="button" class="btn sm" data-lf="' + s.id + '" data-m="ai">🤖 AI feedback</button></div>' : '') +
              '<div data-lfo="' + s.id + '">' + (f ? lfHtml(f) : '') + '</div></div>'; }).join('') || '<span class="muted">Nothing saved.</span>';
          tr.querySelectorAll('[data-lf]').forEach(function (bb) { bb.onclick = function () {
            var wid = bb.getAttribute('data-lf'), m = bb.getAttribute('data-m'), out = tr.querySelector('[data-lfo="' + wid + '"]'), t = bb.textContent;
            bb.disabled = true; bb.textContent = m === 'ai' ? 'Asking AI…' : 'Re-marking…';
            S.db.functions.invoke('lesson-feedback', { body: { work_id: wid, mode: m } }).then(function (r) {
              bb.disabled = false; bb.textContent = t; var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
              if (r.error || !d || !d.ok) { toast((d && d.error) || 'Feedback is not available right now.', true); return; }
              out.innerHTML = lfHtml({ source: d.source, items: d.items, at: new Date().toISOString() }) + (d.note ? '<p class="small muted">' + E(d.note) + '</p>' : '');
            }, function () { bb.disabled = false; bb.textContent = t; toast('Feedback is not available right now.', true); });
          }; });
        });
      }; });
    });
  }

  /* ---------- students & results ---------- */
  function students(p, args) {
    if (args[0]) return student(p, args[0]);
    var cls = sessionStorage.getItem('bv-cls') || '';
    S.db.from('class_overview').select('*').order('full_name').then(function (r) {
      var all = (r.data || []).filter(function (s) { return s.student_id !== ME.user.id; });
      function draw() {
        var list = all.filter(function (s) { return !cls || s.class_id === cls || (cls === 'none' && !s.class_id); });
        p.innerHTML = '<div class="row2"><select id="cf" aria-label="Class">' + classOpts(cls, 'All my students') + '<option value="none"' + (cls === 'none' ? ' selected' : '') + '>Not in a class</option></select><button class="btn sm" type="button" id="csv">Download CSV</button></div>' +
          (list.length ? '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Class</th><th>Results</th><th>Average</th><th>Last activity</th><th>Access</th><th>Remove</th></tr>' + list.map(function (s) {
            return '<tr><td><a href="#students/' + s.student_id + '">' + E(s.full_name || '(no name)') + '</a></td><td>' + E(s.class_name || '–') + '</td><td>' + s.results + '</td><td>' + (s.percent == null ? '–' : s.percent + '%') + '</td><td class="small">' + E(S.when(s.last_result)) + '</td>' +
              '<td><button class="btn sm' + (s.approved ? '' : ' main') + '" type="button" data-ap="' + s.student_id + '" data-v="' + (!s.approved) + '">' + (s.approved ? 'Block' : '✓ Approve') + '</button></td>' +
              '<td>' + removeButtons(s.student_id, !!s.class_id) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No students here yet.</p>');
        p.querySelector('#cf').onchange = function () { cls = this.value; try { sessionStorage.setItem('bv-cls', cls); } catch (e) {} draw(); };
        p.querySelectorAll('[data-ap]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-v') === 'true';
          S.db.from('profiles').update({ approved: v }).eq('id', b.getAttribute('data-ap')).then(function (r) { if (ok(r, v ? 'Access allowed' : 'Access blocked')) { all.forEach(function (s) { if (s.student_id === b.getAttribute('data-ap')) s.approved = v; }); draw(); } }); }; });
        wireRemove(p, function () { students(p, []); });
        p.querySelector('#csv').onclick = function () { var rows = [['Student', 'Class', 'Results', 'Average %', 'Last activity']].concat(list.map(function (s) { return [s.full_name, s.class_name || '', s.results, s.percent == null ? '' : s.percent, s.last_result || '']; }));
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' })); a.download = 'students.csv'; a.click(); };
      }
      draw();
    });
  }
  function student(p, sid) {
    Promise.all([S.db.from('profiles').select('*').eq('id', sid).maybeSingle(), S.db.from('student_results').select('*').eq('student_id', sid).order('recorded_at', { ascending: false }),
      S.db.from('learning_progress').select('percent,status, lessons(title)').eq('student_id', sid)]).then(function (x) {
      var pr = x[0].data; if (!pr) { p.innerHTML = '<p class="msg">Student not found, or not in one of your classes.</p>'; return; }
      p.innerHTML = '<p><a href="#students">← All students</a></p><section class="panel"><div class="row2"><h3>' + E(pr.full_name) + '</h3><span class="pill">' + (pr.approved ? 'Active' : 'Blocked') + '</span></div>' +
        '<div class="row2"><label class="f">Name<input id="sn" value="' + E(pr.full_name) + '"></label><label class="f">Class<select id="sc">' + classOpts(pr.class_id, '(no class)') + '</select></label><label class="f">Student number<input id="snum" value="' + E(pr.student_number || '') + '"></label><button class="btn sm" id="ss" type="button">Save</button></div></section>' +
        '<section class="panel"><h3>Lesson progress</h3>' + ((x[2].data || []).length ? x[2].data.map(function (l) { return '<div class="row2"><span class="small">' + E(l.lessons ? l.lessons.title : '') + '</span><span class="small muted">' + l.percent + '%</span></div><div class="bar"><i style="width:' + l.percent + '%"></i></div>'; }).join('') : '<p class="muted">No lessons opened yet.</p>') + '</section>' +
        '<section class="panel"><div class="row2"><h3 style="margin:0">📌 To-do list</h3>' + (pr.class_id ? '<button type="button" class="btn sm main" id="stw">＋ Set work for ' + E((pr.full_name || 'this student').split(' ')[0]) + '</button>' : '') + '</div><div id="stform"></div><div id="stlist" class="small muted">' + (pr.class_id ? 'Loading…' : 'Put this student in a class first.') + '</div></section>' +
        '<section class="panel" id="anbox"><p class="muted">Loading learning profile…</p></section>' + '<section class="panel" id="labbox"><p class="muted">Loading lab work…</p></section>' +
        '<section class="panel" id="pbox"><p class="muted">Loading parents…</p></section>' +
        '<section class="grp"><h3 class="sec-h">Results and feedback</h3>' + ((x[1].data || []).length ? x[1].data.map(function (r) {
          return '<article class="task" data-r="' + r.id + '"><div class="top2"><b>' + E(r.title) + '</b><span class="small muted">' + E(S.when(r.recorded_at)) + '</span></div>' +
            '<div class="row2"><label class="f">Score<input type="number" step="0.5" data-k="score" value="' + E(r.score == null ? '' : r.score) + '" style="max-width:90px"></label><span>/ ' + E(r.max_score) + '</span></div>' +
            '<label class="f">Teacher feedback<textarea rows="3" data-k="teacher_feedback">' + E(r.teacher_feedback || '') + '</textarea></label>' + (r.ai_feedback ? '<div class="fb ai"><h4>Automatic feedback</h4>' + BV.md(r.ai_feedback) + '</div>' : '') +
            '<div class="acts"><button class="btn sm main" type="button" data-a="save">Save feedback</button><button class="btn sm" type="button" data-a="auto" title="Write the automatic feedback again from the marks on each question">🔁 Refresh automatic feedback</button>' + (r.attempt_id ? '<a class="btn sm" href="#marking/' + r.attempt_id + '">Open answers</a>' : '') + '</div></article>'; }).join('') : '<p class="emptybox">No results yet.</p>') + '</section>';
      parentsBox(p, sid); studentTodo(p, sid, pr); studentAnalysis(p, sid, pr); labList(p.querySelector('#labbox'), { sid: sid }, true);
      p.querySelector('#ss').onclick = function () { S.db.from('profiles').update({ full_name: p.querySelector('#sn').value.trim(), class_id: p.querySelector('#sc').value || null, student_number: p.querySelector('#snum').value.trim() || null }).eq('id', sid).then(function (r) { ok(r, 'Student saved'); }); };
      p.querySelectorAll('[data-r]').forEach(function (a) { a.querySelector('[data-a=auto]').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Writing feedback…';
        S.db.functions.invoke('result-feedback', { body: { result_id: a.getAttribute('data-r') } }).then(function (r) { var d = r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
          if (r.error || !d || !d.ok) { b.disabled = false; b.textContent = '🔁 Refresh automatic feedback'; toast((d && d.error) || 'Could not write feedback right now.', true); return; }
          toast('Feedback written'); student(p, sid); }); }; });
      p.querySelectorAll('[data-r]').forEach(function (a) { a.querySelector('[data-a=save]').onclick = function () { var sc = a.querySelector('[data-k=score]').value;
        S.db.from('student_results').update({ score: sc === '' ? null : +sc, teacher_feedback: a.querySelector('[data-k=teacher_feedback]').value.trim() || null, updated_at: new Date().toISOString() }).eq('id', a.getAttribute('data-r')).then(function (r) { ok(r, 'Feedback saved'); }); }; });
    });
  }

  function studentTodo(p, sid, pr) {
    if (!pr.class_id) return;
    var c = CLASSES.filter(function (x) { return x.id === pr.class_id; })[0] || { id: pr.class_id, name: 'their class', programme: '' };
    var listBox = p.querySelector('#stlist');
    function load() {
      S.db.rpc('class_todo', { cls: pr.class_id }).then(function (r) {
        if (r.error) { listBox.textContent = /class_todo|schema cache/.test(r.error.message) ? 'To-do lists need database update 015.' : S.nice(r.error); return; }
        var mine = (r.data || []).filter(function (x) { return x.student_id === sid; }), ids = mine.map(function (x) { return x.assignment_id; });
        if (!ids.length) { listBox.textContent = 'Nothing set yet.'; return; }
        S.db.from('assignments').select('id,title,kind,due_at,everyone').in('id', ids).order('created_at', { ascending: false }).then(function (a) {
          var stt = {}; mine.forEach(function (x) { stt[x.assignment_id] = x.state; });
          listBox.className = 'small'; listBox.innerHTML = (a.data || []).map(function (w) { return '<div>' + { done: '✓', started: '✎', todo: '○' }[stt[w.id]] + ' ' + (ICON[w.kind] || '') + ' ' + E(w.title) + (w.everyone ? ' <span class="muted">(whole class)</span>' : '') + (w.due_at ? ' <span class="muted">· due ' + E(S.when(w.due_at)) + '</span>' : '') + '</div>'; }).join('');
        });
      });
    }
    load();
    var b = p.querySelector('#stw'); if (b) b.onclick = function () { roster(pr.class_id).then(function (kids) { assignForm(p.querySelector('#stform'), c, kids, [sid], load); }); };
  }
  /* parents linked to this student: the private parent code, new codes, and removing a link */
  function parentsBox(p, sid) {
    var box = p.querySelector('#pbox'); if (!box) return;
    Promise.all([
      S.db.from('parent_links').select('parent_id, profiles!parent_id(full_name)').eq('student_id', sid),
      S.db.from('student_parent_codes').select('code').eq('student_id', sid).maybeSingle()
    ]).then(function (x) {
      if (x[0].error) throw x[0].error;
      var links = x[0].data || [], code = x[1].data && x[1].data.code;
      box.innerHTML = '<h3>Parents</h3>' +
        '<p class="small muted">A parent signs up with this code (Create a parent account) or adds it on their dashboard. They can see this student\'s marks, lesson progress and your feedback, and cannot change anything. Making a new code stops the old one working.</p>' +
        '<div class="row2"><span class="small">Parent code</span><b style="font-size:1.3rem;letter-spacing:.15em">' + E(code || '–') + '</b><button class="btn sm" type="button" id="pcr">New code</button></div>' +
        (links.length ? '<div class="tablewrap"><table class="marks"><tr><th>Linked parent</th><th></th></tr>' + links.map(function (l) {
          return '<tr><td>' + E(l.profiles ? l.profiles.full_name : 'Parent') + '</td><td><button class="btn sm" type="button" data-pu="' + E(l.parent_id) + '">Remove link</button></td></tr>';
        }).join('') + '</table></div>' : '<p class="muted">No parent linked yet.</p>');
      box.querySelector('#pcr').onclick = function () {
        if (!this.dataset.sure) { this.dataset.sure = 1; this.textContent = 'Click again to replace the code'; return; }
        S.db.rpc('reset_parent_code', { sid: sid }).then(function (r) { if (ok(r, 'New parent code made')) parentsBox(p, sid); });
      };
      box.querySelectorAll('[data-pu]').forEach(function (b) {
        b.onclick = function () {
          if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to remove'; return; }
          S.db.from('parent_links').delete().eq('parent_id', b.getAttribute('data-pu')).eq('student_id', sid).then(function (r) { if (ok(r, 'Link removed')) parentsBox(p, sid); });
        };
      });
    }).catch(function (e) { box.innerHTML = '<h3>Parents</h3><p class="msg">' + E(S.nice(e)) + '</p>'; });
  }

  /* ---------- quizzes ---------- */
  function quizzes(p, args) {
    if (args[0] === 'import') return quizImport(p);
    if (args[0] && args[1] === 'preview') return quizPreview(p, args[0]);
    if (args[0]) return quizEdit(p, args[0]);
    S.db.from('quizzes').select('id,title,published,due_at,show_results,category, quiz_classes(class_id), quiz_questions(question_id)').neq('category', 'lesson').order('created_at', { ascending: false }).then(function (r) {
      var cn = {}; CLASSES.forEach(function (c) { cn[c.id] = c.name; });
      p.innerHTML = '<div class="acts"><a class="btn main sm" href="#quizzes/import">⬆ Import from PDF or Word</a><a class="btn sm" href="#quizzes/new">＋ New quiz or exam</a></div>' +
        '<p class="small muted">📄 <b>Mark scheme</b> opens a printable mark scheme for that quiz or exam: correct answers, mark points, model answers and level descriptors. Use Print → Save as PDF to keep or share it.</p>' +
        ((r.data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Title</th><th>Type</th><th>Questions</th><th>Classes</th><th>Due</th><th>Results</th><th>Status</th><th></th></tr>' + r.data.map(function (q) {
          return '<tr><td><a href="#quizzes/' + q.id + '">' + E(q.title) + '</a></td><td>' + (q.category === 'exam' ? '🧪 Exam' : '📝 Quiz') + '</td><td>' + q.quiz_questions.length + '</td><td class="small">' + E(q.quiz_classes.map(function (c) { return cn[c.class_id] || '…'; }).join(', ') || '–') + '</td><td class="small">' + E(S.when(q.due_at) || '–') + '</td><td class="small">' + (q.show_results ? 'shown at once' : 'after you release') + '</td><td>' + (q.published ? '<span class="pill">Published</span>' : 'Draft') + '</td><td><a class="btn sm" href="#quizzes/' + q.id + '/preview">👁 Preview</a> <button type="button" class="btn sm" data-ms="' + q.id + '">📄 Mark scheme</button></td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No quizzes yet. Import a question paper or make one from scratch.</p>');
      wireMS(p);
    });
  }

  /* import a question paper (and its mark scheme) from PDF or Word */
  function quizImport(p) {
    var Q = window.BVQ, list = [];
    p.innerHTML = '<p><a href="#quizzes">← All quizzes</a></p><section class="panel grp"><h3>Import a question paper</h3>' +
      '<p class="small muted">Upload a PDF or Word (.docx) file. The questions are read in your browser and turned into an interactive quiz: lettered options become click-to-choose answers, everything else becomes a typed answer. You check and fix everything before saving. Files are not uploaded anywhere.</p>' +
      '<div class="row2"><label class="f" style="flex:1">Title<input id="it" placeholder="e.g. Grade 9 DNA test"></label><label class="f">Make it a<select id="ic"><option value="quiz">Quiz (Quiz centre)</option><option value="exam">Exam (Online exams page)</option></select></label></div>' +
      '<div class="two"><label class="f">Question paper (PDF or .docx)<input id="if" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label>' +
      '<label class="f">Mark scheme or rubric (optional, PDF or .docx)<input id="im" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label></div>' +
      '<details><summary class="small">No file? Paste the questions (and mark scheme) instead</summary><div class="two"><label class="f">Questions<textarea id="ip" rows="8" placeholder="1. Which base pairs with adenine?\nA. Guanine\nB. Thymine\nC. Uracil\nD. Cytosine\n2. (a) State the monomer of DNA. [1]"></textarea></label>' +
      '<label class="f">Mark scheme<textarea id="ips" rows="8" placeholder="1 B\n2 (a) nucleotide"></textarea></label></div></details>' +
      '<div class="acts"><button class="btn main sm" type="button" id="ir">Read questions</button></div><p class="msg" id="imsg" role="status"></p></section><div id="iout" class="grp"></div>';
    var msg = p.querySelector('#imsg'), out = p.querySelector('#iout');
    p.querySelector('#if').onchange = function () { var f = this.files[0]; if (f && !p.querySelector('#it').value) p.querySelector('#it').value = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '); };
    p.querySelector('#ir').onclick = function () {
      var f = p.querySelector('#if').files[0], m = p.querySelector('#im').files[0], pasted = p.querySelector('#ip').value.trim(), pastedMs = p.querySelector('#ips').value.trim();
      if (!f && !pasted) { msg.className = 'msg'; msg.textContent = 'Choose the question paper file first (or paste the questions).'; return; }
      msg.className = 'msg ok'; msg.textContent = 'Reading…';
      Promise.all([f ? Q.readFile(f) : Promise.resolve(pasted.split('\n')), m ? Q.readFile(m) : Promise.resolve(pastedMs ? pastedMs.split('\n') : null)]).then(function (x) {
        list = Q.parsePaper(x[0]);
        if (!list.length) throw new Error('No numbered questions were found. Questions should start with a number such as "1." or "Question 1". You can paste the text and fix the numbering.');
        var matched = x[1] ? Q.applyScheme(list, Q.parseScheme(x[1])) : 0;
        var mc = list.filter(function (q) { return q.kind !== 'short'; }).length;
        msg.className = 'msg ok'; msg.textContent = 'Found ' + list.length + ' questions (' + mc + ' multiple choice, ' + (list.length - mc) + ' written)' + (x[1] ? '; mark scheme matched ' + matched + ' of them' : '') + (list.filter(function (q) { return q.image; }).length ? '; ' + list.filter(function (q) { return q.image; }).length + ' with a picture from your file' : '') + '. Check them below (📷 adds a picture or diagram to any question), then save.';
        draw();
      }).catch(function (e) { msg.className = 'msg'; msg.textContent = S.nice(e); });
    };
    function sync() { list = [].map.call(out.querySelectorAll('.qe'), Q.readCard); }
    function draw() {
      var need = list.filter(function (q) { return q.kind !== 'short' && q.correct < 0; }).length, noScheme = list.filter(function (q) { return q.kind === 'short' && !q.scheme && !q.rubric; }).length;
      out.innerHTML = '<div class="row2 sticky-top"><b>' + list.length + ' questions · ' + list.reduce(function (a, q) { return a + q.marks; }, 0) + ' marks</b><div class="acts"><button class="btn sm" type="button" id="iadd">＋ Add a question</button><button class="btn main sm" type="button" id="isave">Save as a draft quiz</button></div></div>' +
        (need ? '<p class="panel tint small">⚠ ' + need + ' multiple-choice question' + (need > 1 ? 's need' : ' needs') + ' the correct answer ticked (A, B, C or D). Attach the mark scheme above to fill them in automatically.</p>' : '') +
        (noScheme ? '<p class="panel tint small">' + noScheme + ' written question' + (noScheme > 1 ? 's have' : ' has') + ' no mark scheme yet. Add marking points or a rubric for automatic marking, or leave blank and mark by hand.</p>' : '') +
        list.map(function (q, i) { return Q.card(q, i, { join: i > 0 }); }).join('');
      out.querySelectorAll('.qe').forEach(function (el) {
        Q.wireCard(el);
        el.querySelector('[data-act=del]').onclick = function () { sync(); list.splice(+el.dataset.i, 1); draw(); };
        var j = el.querySelector('[data-act=join]'); if (j) j.onclick = function () { sync(); var i = +el.dataset.i, a = list[i - 1], b = list[i]; a.prompt += '\n' + b.prompt; if (b.options.length) { a.options = a.options.concat(b.options); a.kind = a.kind === 'short' ? 'mcq' : a.kind; } a.scheme = [a.scheme, b.scheme].filter(Boolean).join('\n'); if (!a.image) a.image = b.image; list.splice(i, 1); draw(); };
      });
      out.querySelector('#iadd').onclick = function () { sync(); list.push({ ref: String(list.length + 1), kind: 'mcq', prompt: '', options: [], correct: -1, marks: 1, scheme: '', rubric: '', explanation: '', image: '' }); draw(); out.lastElementChild.scrollIntoView({ behavior: 'smooth' }); };
      out.querySelector('#isave').onclick = function () {
        sync(); var bad = list.map(Q.check).filter(Boolean)[0]; if (bad) { toast(bad, true); return; }
        var title = p.querySelector('#it').value.trim() || 'Imported quiz', btn = this; btn.disabled = true; btn.textContent = 'Saving…';
        S.db.from('quizzes').insert({ title: title, category: p.querySelector('#ic').value, show_results: false, published: false, max_attempts: 1, time_limit_minutes: p.querySelector('#ic').value === 'exam' ? 60 : null }).select('id').single().then(function (r) {
          if (r.error) throw r.error; var qid = r.data.id;
          return Q.save(S.db, list).then(function (ids) { return S.db.from('quiz_questions').insert(ids.map(function (id, k) { return { quiz_id: qid, question_id: id, position: k + 1 }; })); })
            .then(function (r2) { if (r2.error) throw r2.error; toast((p.querySelector('#ic').value === 'exam' ? 'Exam' : 'Quiz') + ' saved as a draft. Set the classes and time, then publish.'); location.hash = 'quizzes/' + qid; });
        }).catch(function (e) { btn.disabled = false; btn.textContent = 'Save as a draft quiz'; toast(S.nice(e), true); });
      };
    }
  }

  function quizEdit(p, id) {
    var Q = window.BVQ, isNew = id === 'new';
    Promise.all([isNew ? Promise.resolve({ data: { title: '', max_attempts: 1, show_results: false, published: false } }) : S.db.from('quizzes').select('*').eq('id', id).maybeSingle(),
      isNew ? Promise.resolve({ data: [] }) : S.db.from('quiz_classes').select('class_id').eq('quiz_id', id),
      isNew ? Promise.resolve({ data: [] }) : S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', id).order('position')]).then(function (x) {
      var q = x[0].data || {}, set = (x[1].data || []).map(function (c) { return c.class_id; }), qq = x[2].data || [];
      var lastN = 0, qs = qq.map(function (z, k) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
        var pm = /^(\d+)\s*(\([a-h]\)(?:\s*\([ivx]+\))?)/i.exec(o.prompt || ''), ref = pm ? pm[1] + pm[2].replace(/\s/g, '') : String(lastN + 1); lastN = pm ? +pm[1] : lastN + 1;
        return { id: o.id, ref: ref, kind: o.kind, prompt: o.prompt, options: o.options || [], correct: an.correct_option == null ? -1 : an.correct_option, marks: o.marks, scheme: an.mark_scheme || an.model_answer || '', rubric: an.rubric || '', explanation: an.explanation || '', image: o.image_url || '', fb: an }; });
      p.innerHTML = '<p><a href="#quizzes">← All quizzes and exams</a></p><form class="panel grp" id="qf"><h3>' + (isNew ? 'New quiz or exam' : 'Settings') + '</h3>' +
        '<div class="row2"><label class="f" style="flex:1">Title<input id="t" required value="' + E(q.title) + '"></label><label class="f">Type<select id="cat"><option value="quiz"' + (q.category !== 'exam' ? ' selected' : '') + '>Quiz (Quiz centre)</option><option value="exam"' + (q.category === 'exam' ? ' selected' : '') + '>Exam (Online exams page)</option></select></label></div><label class="f">Instructions<textarea id="ins" rows="2">' + E(q.instructions || '') + '</textarea></label>' +
        '<div class="row2"><label class="f">Topic<select id="tp">' + topicOpts(q.topic_id) + '</select></label><label class="f">Time limit (minutes, blank = none)<input id="tl" type="number" min="1" value="' + E(q.time_limit_minutes || '') + '"></label><label class="f">Attempts<input id="ma" type="number" min="1" value="' + E(q.max_attempts || 1) + '"></label></div>' +
        '<div class="row2"><label class="f">Opens<input id="op" type="datetime-local" value="' + dt(q.opens_at) + '"></label><label class="f">Due<input id="du" type="datetime-local" value="' + dt(q.due_at) + '"></label></div>' +
        '<fieldset><legend>Set for classes</legend>' + (CLASSES.length ? CLASSES.map(function (c) { return '<label class="chk"><input type="checkbox" name="cl" value="' + c.id + '"' + (set.indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + E(c.name) + '</label>'; }).join('') : '<p class="small">Create a class first.</p>') + '</fieldset>' +
        '<fieldset><legend>Results</legend><label class="chk"><input type="radio" name="sr" value="hold"' + (q.show_results ? '' : ' checked') + '> I check and release results (recommended for written answers)</label>' +
        '<label class="chk"><input type="radio" name="sr" value="show"' + (q.show_results ? ' checked' : '') + '> Show multiple-choice scores straight after submitting</label></fieldset>' +
        '<fieldset><legend>Marking and feedback</legend><label class="f">How written answers are marked and given feedback<select id="fm">' +
          [['hybrid', 'Hybrid (recommended): rules first, AI only when the rules cannot decide'], ['rule', 'Rules only: no AI (your mark scheme, keywords and explanations)'], ['ai', 'AI for every written answer (rules still mark multiple choice)']]
            .map(function (o) { return '<option value="' + o[0] + '"' + ((q.feedback_mode || 'hybrid') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
          '<p class="small muted">Multiple-choice and true/false questions are always marked by the rules, never by AI. AI marks are suggestions: you confirm them when marking. Everything still works if AI is unavailable. You can change the setting for single questions in each question\'s Feedback section.</p></fieldset>' +
        (function () { var g = q.integrity || {}, ex = q.category === 'exam', m = g.mode || (ex ? 'autosubmit' : 'warn');
          return '<fieldset><legend>Exam security</legend><p class="small muted">A website cannot fully stop students switching tabs or apps, but it can see every switch. Each one is recorded and shown on the class page and in marking.</p>' +
          '<div class="row2"><label class="f">When a student leaves the page<select id="xm">' + [['record', 'Just record it'], ['warn', 'Warn the student and record it'], ['autosubmit', 'Warn, then hand it in automatically']].map(function (o) { return '<option value="' + o[0] + '"' + (m === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
          '<label class="f">Hand in after this many switches<input id="xn" type="number" min="1" max="20" value="' + E(g.max || 3) + '"></label></div>' +
          '<label class="chk"><input type="checkbox" id="xf"' + (g.fullscreen === false ? '' : ' checked') + '> Full screen: questions are hidden whenever the student leaves full screen (computers; phones cannot do full screen)</label>' +
          '<label class="chk"><input type="checkbox" id="xs"' + (g.seb ? ' checked' : '') + '> Safe Exam Browser only (lockdown): it will not open in an ordinary browser. Students cannot switch to other apps, websites or screenshots until they hand in.</label>' +
          '<div class="xseb" style="display:grid;gap:8px;padding-left:26px">' +
          '<div class="row2"><label class="f">Quit password (only you can close Safe Exam Browser early; leave blank for none)<input id="xq" type="password" autocomplete="new-password" placeholder="' + (g.quit_hash ? 'Password set: type a new one to change it' : 'e.g. a word only you know') + '"></label>' +
          (g.quit_hash ? '<label class="chk"><input type="checkbox" id="xqc"> Remove the quit password</label>' : '') + '</div>' +
          '<label class="chk"><input type="checkbox" id="xb"' + (g.block_web === false ? '' : ' checked') + '> Block all other websites inside Safe Exam Browser</label>' +
          (isNew ? '<p class="small muted">Save first; then you can download the Safe Exam Browser file for this ' + (ex ? 'exam' : 'quiz') + '.</p>' :
            '<ol class="small" style="margin:0;padding-left:18px"><li>Save, then <button type="button" class="btn sm" id="xsf">⬇ Download the Safe Exam Browser file</button> and share it with the class (e.g. on Google Classroom). Students install <a href="https://safeexambrowser.org/download_en.html" target="_blank" rel="noopener">Safe Exam Browser</a> (free) and double-click the file.</li>' +
            '<li>Open the same file yourself, sign in, and press <b>Register this set-up</b>. From then on only that file is accepted. <span class="muted">Registered set-ups: ' + ((g.seb_keys || []).length) + '</span>' + ((g.seb_keys || []).length ? ' <button type="button" class="btn sm" id="xsr">Clear registered set-ups</button>' : '') + '</li>' +
            '<li>Try it on one student computer before the real exam.</li></ol>') + '</div></fieldset>'; })() +
        '<label class="chk"><input type="checkbox" id="pb"' + (q.published ? ' checked' : '') + '> Published (students in the chosen classes can see it)</label>' +
        '<div class="acts"><button class="btn main sm" type="submit">Save quiz</button>' + (isNew ? '' : '<a class="btn sm" href="#quizzes/' + id + '/preview">👁 Preview as a student</a><a class="btn sm" href="#marking">Marking</a><button class="btn sm" type="button" id="del">Delete quiz</button>') + '</div></form>' +
        (isNew ? '' : '<section class="panel grp" id="msbox"><h3>Mark scheme</h3><p class="small muted">Attach the mark scheme and the answers are filled in for you: the correct letter (A, B, C, D) for each multiple-choice question, and the marking points for written questions. Check the question numbers match, then press Save question changes.</p>' +
          '<div class="row2"><label class="f" style="flex:1">Mark scheme (PDF, Word or text)<input id="msf" type="file" accept=".pdf,.docx,.txt,.xlsx,.csv,application/pdf"></label><button class="btn main sm" type="button" id="msa">Apply mark scheme</button></div>' +
          '<details><summary class="small">No file? Paste it instead</summary><textarea id="msp" rows="6" placeholder="1 B\n2 D\n3 C\n4 (a) nucleotide\n4 (b) hydrogen bonds; complementary base pairing"></textarea></details><p class="msg" id="msm" role="status"></p></section>') +
        (isNew ? '<p class="small muted">Save the quiz first, then add questions.</p>' : '<section class="grp"><div class="row2"><h3 class="sec-h">Questions (' + qs.length + ', ' + qs.reduce(function (a, z) { return a + (z.marks || 0); }, 0) + ' marks)</h3><button class="btn main sm" type="button" id="qsave">Save question changes</button></div>' +
          '<div id="qlist" class="grp">' + qs.map(function (z, i) { return Q.card(z, i, { delLabel: 'Remove' }); }).join('') + '</div>' +
          '<div class="acts"><button class="btn sm" type="button" id="qadd">＋ Add a question</button></div></section>');
      var xsr = p.querySelector('#xsr');
      if (xsr) xsr.onclick = function () { var ng = Object.assign({}, q.integrity || {}, { seb_keys: [] });
        S.db.from('quizzes').update({ integrity: ng }).eq('id', id).then(function (r) { if (ok(r, 'Registered set-ups cleared. Open the new settings file in Safe Exam Browser and register it.')) { q.integrity = ng; xsr.remove(); } }); };
      var xsf = p.querySelector('#xsf');
      if (xsf) xsf.onclick = function () {   // a Safe Exam Browser settings file that opens this quiz or exam directly
        var url = location.origin + (p.querySelector('#cat').value === 'exam' ? '/exams/' : '/quizzes/') + '#' + id, gi = q.integrity || {};
        var hosts = ['biosciencevista.com', '*.biosciencevista.com', '*.supabase.co', 'commons.wikimedia.org', 'upload.wikimedia.org', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];
        var filt = gi.block_web === false ? '<key>URLFilterEnable</key><false/>' : '<key>URLFilterEnable</key><true/><key>URLFilterEnableContentFilter</key><false/><key>URLFilterRules</key><array>' +
          hosts.map(function (h) { return '<dict><key>active</key><true/><key>regex</key><false/><key>expression</key><string>' + h + '</string><key>action</key><integer>1</integer></dict>'; }).join('') + '</array>';
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>' +
          '<key>originatorVersion</key><string>Learnova</string><key>startURL</key><string>' + E(url) + '</string><key>sendBrowserExamKey</key><true/>' +
          (gi.quit_hash ? '<key>hashedQuitPassword</key><string>' + gi.quit_hash + '</string>' : '') +
          '<key>allowQuit</key><true/><key>quitURL</key><string>' + E(location.origin) + '/?seb=quit</string><key>quitURLConfirm</key><true/><key>browserViewMode</key><integer>1</integer>' +
          '<key>enableBrowserWindowToolbar</key><true/><key>browserWindowAllowReload</key><true/><key>newBrowserWindowByLinkPolicy</key><integer>1</integer><key>newBrowserWindowByScriptPolicy</key><integer>1</integer>' +
          '<key>allowDownUploads</key><false/><key>allowPreferencesWindow</key><false/><key>allowSpellCheck</key><false/><key>enableZoomPage</key><true/><key>enableZoomText</key><true/>' +
          '<key>allowedDisplaysMaxNumber</key><integer>1</integer><key>allowScreenSharing</key><false/><key>enablePrintScreen</key><false/>' + filt + '</dict></plist>\n';
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([xml], { type: 'application/seb' }));
        a.download = (p.querySelector('#t').value.trim() || 'exam').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 60) + '.seb'; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      };
      p.querySelector('#qf').onsubmit = function (e) { e.preventDefault();
        var row = { title: p.querySelector('#t').value.trim(), category: p.querySelector('#cat').value, instructions: p.querySelector('#ins').value.trim() || null, topic_id: p.querySelector('#tp').value || null, time_limit_minutes: +p.querySelector('#tl').value || null,
          max_attempts: Math.max(1, +p.querySelector('#ma').value || 1), opens_at: iso(p.querySelector('#op').value), due_at: iso(p.querySelector('#du').value), show_results: (p.querySelector('[name=sr]:checked') || {}).value === 'show', published: p.querySelector('#pb').checked,
          feedback_mode: p.querySelector('#fm').value,
          integrity: Object.assign({}, q.integrity || {}, { mode: p.querySelector('#xm').value, max: Math.max(1, +p.querySelector('#xn').value || 3), fullscreen: p.querySelector('#xf').checked, seb: p.querySelector('#xs').checked, block_web: p.querySelector('#xb').checked }) };
        var cls = [].map.call(p.querySelectorAll('[name=cl]:checked'), function (c) { return c.value; });
        if (row.published && !cls.length) { toast('Choose at least one class before publishing.', true); return; }
        if (row.published && !isNew && !qs.length) { toast('Add questions before publishing.', true); return; }
        var qpw = p.querySelector('#xq').value, qclr = p.querySelector('#xqc') && p.querySelector('#xqc').checked;
        if (qclr) delete row.integrity.quit_hash;
        var hashed = qpw ? crypto.subtle.digest('SHA-256', new TextEncoder().encode(qpw)).then(function (b) { row.integrity.quit_hash = Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }) : Promise.resolve();
        var put = function (rw) { return isNew ? S.db.from('quizzes').insert(rw).select('id').single() : S.db.from('quizzes').update(rw).eq('id', id).select('id').single(); };
        hashed.then(function () { return put(row); }).then(function (r) {   // before database update 012 there is no integrity column: save the rest and say so
          if (r.error && /feedback_mode/.test(r.error.message || '')) { delete row.feedback_mode; toast('The feedback setting needs database update 013; the other settings were saved.', true); return put(row); }
          if (r.error && /integrity/.test(r.error.message || '')) { delete row.integrity; toast('Exam security settings need database update 012; the other settings were saved.', true); return put(row); }
          return r;
        }).then(function (r) {
          if (!ok(r)) return; var qid = r.data.id;
          S.db.from('quiz_classes').delete().eq('quiz_id', qid).then(function () { return cls.length ? S.db.from('quiz_classes').insert(cls.map(function (c) { return { quiz_id: qid, class_id: c }; })) : { error: null }; })
            .then(function (r2) { if (ok(r2, 'Quiz saved')) { if (isNew) location.hash = 'quizzes/' + qid; else quizEdit(p, qid); } });
        }); };
      var del = p.querySelector('#del'); if (del) del.onclick = function () { if (del.dataset.sure) { S.db.from('quizzes').delete().eq('id', id).then(function (r) { if (ok(r, 'Quiz deleted')) location.hash = 'quizzes'; }); } else { del.dataset.sure = 1; del.textContent = 'Click again to delete (attempts are deleted too)'; } };
      if (isNew) return;
      var listEl = p.querySelector('#qlist'), removed = [];
      function wire(el) { Q.wireCard(el); el.querySelector('[data-act=del]').onclick = function () { if (el.dataset.id) removed.push(el.dataset.id); el.remove(); }; }
      listEl.querySelectorAll('.qe').forEach(wire);
      p.querySelector('#msa').onclick = function () {   // fill answers from an attached or pasted mark scheme
        var f = p.querySelector('#msf').files[0], pasted = p.querySelector('#msp').value.trim(), m = p.querySelector('#msm');
        if (!f && !pasted) { m.className = 'msg'; m.textContent = 'Choose the mark scheme file first, or paste it.'; return; }
        m.className = 'msg ok'; m.textContent = 'Reading the mark scheme…';
        (f ? Q.readFile(f) : Promise.resolve(pasted.split('\n'))).then(function (lines) {
          var cards = [].map.call(listEl.querySelectorAll('.qe'), Q.readCard);
          cards.forEach(function (c, k) { if (!c.ref) c.ref = String(k + 1); });
          var used = Q.applyScheme(cards, Q.parseScheme(lines)), mc = cards.filter(function (c) { return c.kind !== 'short' && c.kind !== 'info'; }), set = mc.filter(function (c) { return c.correct >= 0; }).length;
          listEl.innerHTML = cards.map(function (c, k) { return Q.card(c, k, { delLabel: 'Remove' }); }).join(''); listEl.querySelectorAll('.qe').forEach(wire);
          m.className = used ? 'msg ok' : 'msg'; m.textContent = used ? 'Matched ' + used + ' of ' + cards.length + ' questions. Multiple choice with an answer ticked: ' + set + ' of ' + mc.length + '. Check them, then press Save question changes.' : 'No question numbers in the mark scheme matched these questions. Check the Number box on each question (for example 1, 2, 3(a)).';
        }).catch(function (e) { m.className = 'msg'; m.textContent = S.nice(e); });
      };
      p.querySelector('#qadd').onclick = function () { var d = document.createElement('div'); d.innerHTML = Q.card({ kind: 'mcq', prompt: '', options: [], correct: -1, marks: 1 }, listEl.children.length); var el = d.firstChild; listEl.appendChild(el); wire(el); el.querySelector('[data-f=prompt]').focus(); };
      p.querySelector('#qsave').onclick = function () {
        var cards = [].map.call(listEl.querySelectorAll('.qe'), Q.readCard), bad = cards.map(Q.check).filter(Boolean)[0]; if (bad) { toast(bad, true); return; }
        var btn = this; btn.disabled = true; Q.fbError = null;
        Q.save(S.db, cards).then(function (ids) {
          return S.db.from('quiz_questions').delete().eq('quiz_id', id).then(function () { return S.db.from('quiz_questions').insert(ids.map(function (qid, k) { return { quiz_id: id, question_id: qid, position: k + 1 }; })); });
        }).then(function (r) { if (r.error) throw r.error; toast(Q.fbError ? 'Questions saved. ' + Q.fbError : 'Questions saved', !!Q.fbError); quizEdit(p, id); }).catch(function (e) { btn.disabled = false; toast(S.nice(e), true); });
      };
    });
  }

  /* ---------- teacher preview: the quiz or exam as students see it; nothing is saved ---------- */
  function quizPreview(p, id) {
    var Q = window.BVQ, L = 'ABCDEFGH';
    Promise.all([S.db.from('quizzes').select('*').eq('id', id).maybeSingle(), loadQuiz(id)]).then(function (x) {
      var q = x[0].data, qs = x[1]; if (!q) { p.innerHTML = '<p class="msg">Quiz not found.</p>'; return; }
      var exam = q.category === 'exam', total = qs.reduce(function (a, z) { return a + (z.marks || 0); }, 0);
      p.innerHTML = '<p><a href="#quizzes/' + id + '">← Back to editing</a></p>' +
        '<p class="panel tint small"><b>👁 Teacher preview.</b> This is what students see when they open this ' + (exam ? 'exam' : 'quiz') + '. Try it: nothing is saved and no marks are recorded. Press <b>Check my answers</b> to see how it would be marked.</p>' +
        '<section class="panel"><p class="label">' + (exam ? 'Exam' : 'Quiz') + '</p><h2>' + E(q.title) + '</h2>' + (q.instructions ? '<p>' + E(q.instructions) + '</p>' : '') +
        '<p class="small muted">' + [qs.length + ' questions', total + ' marks', q.time_limit_minutes ? '⏱ ' + q.time_limit_minutes + ' minutes' : 'No time limit', (q.max_attempts || 1) + ' attempt' + (q.max_attempts > 1 ? 's' : ''), q.published ? 'Published' : 'Draft: students cannot see it yet'].join(' · ') + '</p></section>' +
        (qs.length ? '' : '<p class="emptybox">No questions yet.</p>') +
        '<form id="pvf" class="grp">' + qs.map(function (z, i) {
          var name = 'pv-' + z.id, opts = z.options || [], md = BVT.parse(z.prompt).mode, drawn = z.kind === 'short' && /^(graph|draw|annotate)$/.test(md);
          return '<fieldset class="q" data-id="' + z.id + '"><legend>' + num(z.prompt, i) + BVT.rich(z.prompt, true) + ' <span class="pill">' + z.marks + ' mark' + (z.marks > 1 ? 's' : '') + '</span>' + (md ? ' <span class="pill">' + E(BVT.MODES[md]) + '</span>' : '') + '</legend>' +
            (z.image_url && md !== 'annotate' ? '<img src="' + E(z.image_url) + '" alt="" style="max-width:100%;max-height:420px;border-radius:8px">' : '') +
            (drawn ? '<div data-pad="' + z.id + '"></div>' :
             z.kind !== 'short' && md === 'dropdown' ? '<select class="qdrop" name="' + name + '"><option value="">Choose an answer…</option>' + opts.map(function (o, j) { return '<option value="' + j + '">' + L.charAt(j) + '. ' + E(o) + '</option>'; }).join('') + '</select>' :
             z.kind === 'short' ? '<textarea name="' + name + '" rows="' + (z.marks >= 6 ? 10 : z.marks >= 3 ? 6 : 3) + '" placeholder="Type an answer to test the marking"></textarea>'
              : opts.map(function (o, j) { return '<label class="opt"><input type="radio" name="' + name + '" value="' + j + '"> <b>' + L.charAt(j) + '.</b> ' + E(o) + '</label>'; }).join('')) +
            '<div class="pvres" hidden></div></fieldset>';
        }).join('') +
        '<div class="acts"><button class="btn main" type="submit">Check my answers</button><a class="btn" href="#quizzes/' + id + '">Back to editing</a></div><p class="msg ok" id="pvm" role="status"></p></form>';
      qs.forEach(function (z) { var h = p.querySelector('[data-pad="' + z.id + '"]'); if (h) { var pr = BVT.parse(z.prompt); BVT.pad(h, { mode: pr.mode, x: pr.x, y: pr.y, image: z.image_url }); } });
      p.querySelector('#pvf').onsubmit = function (e) {
        e.preventDefault(); var got = 0;
        qs.forEach(function (z) {
          var fs = p.querySelector('[data-id="' + z.id + '"]'), res = fs.querySelector('.pvres'), an = z.ans || {}, g = 0;
          if (z.kind === 'short') {
            var v = fs.querySelector('textarea') ? fs.querySelector('textarea').value : '', sc = an.mark_scheme || an.model_answer || '', s = Q.suggest(v, sc, z.marks); g = s.got || 0;
            res.innerHTML = '<p class="small"><b>Suggested mark: ' + (s.got == null ? '–' : s.got) + ' / ' + z.marks + '</b> (you confirm written marks in Marking)</p>' +
              (sc ? '<p class="small"><b>Mark scheme:</b><br>' + E(sc).replace(/\n/g, '<br>') + '</p>' : '<p class="small bad-t">No mark scheme for this question yet: it will be marked by hand.</p>');
          } else {
            var c = fs.querySelector('input:checked') || (fs.querySelector('select.qdrop') && fs.querySelector('select.qdrop').value !== '' ? fs.querySelector('select.qdrop') : null), right = an.correct_option; g = c && right != null && +c.value === +right ? z.marks : 0;
            res.innerHTML = right == null || right < 0 ? '<p class="small bad-t">No correct answer is ticked for this question yet.</p>'
              : '<p class="small ' + (g ? 'ok-t' : 'bad-t') + '"><b>' + (g ? '✓ Correct' : c ? '✗ Not correct' : 'Not answered') + '.</b> Answer: ' + L.charAt(right) + '. ' + E((z.options || [])[right] || '') + '</p>' + (an.explanation ? '<p class="small">' + E(an.explanation) + '</p>' : '');
          }
          got += g; res.hidden = false;
        });
        p.querySelector('#pvm').textContent = 'Preview score: ' + got + ' / ' + total + '. Nothing was saved.';
      };
    });
  }

  /* ---------- marking: automatic suggestions, teacher confirms and releases ---------- */
  function num(prompt, i) { return /^\d+\s*(\([a-z]\)|\.\s)/i.test(prompt || '') ? '' : '<b>' + (i + 1) + '.</b> '; }
  function loadQuiz(quizId) {
    return S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', quizId).order('position').then(function (r) {
      return (r.data || []).map(function (z) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {}; o.ans = an; return o; });
    });
  }
  function autoMarks(a, qs) {   // suggested marks for unmarked written answers
    var by = {}, out = []; (a.detail || []).forEach(function (d) { by[d.question_id] = d; });
    qs.forEach(function (q) { var d = by[q.id] || {}; if (q.kind !== 'short' || d.got != null) return;
      var ansv = (a.answers || {})[q.id] || ''; if (/^data:image\//.test(ansv) || q.marks === 0) return;
      var s = window.BVQ.suggest(ansv, q.ans.mark_scheme || q.ans.model_answer || '', q.marks); if (s.got != null) out.push({ qid: q.id, got: s.got }); });
    return out;
  }
  function marking(p, args) {
    if (args[0]) return markOne(p, args[0]);
    S.db.from('quiz_attempts').select('id,quiz_id,student_id,submitted_at,score,max_score,status,released, quizzes(title,show_results)').neq('status', 'in_progress').eq('released', false).order('submitted_at').then(function (r) {
      var rows = (r.data || []).filter(function (a) { return a.status === 'needs_marking' || (a.quizzes && !a.quizzes.show_results); });
      if (!rows.length) { p.innerHTML = '<p class="emptybox">Nothing to mark or release. 🎉</p>'; return; }
      S.db.from('profiles').select('id,full_name').in('id', rows.map(function (a) { return a.student_id; })).then(function (pr) { var n = {}; (pr.data || []).forEach(function (x) { n[x.id] = x.full_name; });
        var ready = rows.filter(function (a) { return a.status === 'marked'; });
        p.innerHTML = '<div class="row2"><p><b>' + rows.length + '</b> to check · ' + ready.length + ' fully marked</p><div class="acts"><button class="btn sm" type="button" id="auto">⚡ Auto-mark written answers</button>' +
          '<button class="btn main sm" type="button" id="relall"' + (ready.length ? '' : ' disabled') + '>✓ Release ' + ready.length + ' checked result' + (ready.length === 1 ? '' : 's') + '</button></div></div>' +
          '<p class="small muted">Auto-mark fills in suggested marks from your mark scheme. Nothing reaches students until you open each one, check it and release it (or use Release for those you have checked).</p>' +
          '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Quiz</th><th>Submitted</th><th>Marks so far</th><th>Status</th></tr>' + rows.map(function (a) {
            return '<tr><td><a href="#marking/' + a.id + '">' + E(n[a.student_id] || '–') + '</a></td><td>' + E(a.quizzes ? a.quizzes.title : '') + '</td><td class="small">' + E(S.when(a.submitted_at)) + '</td><td>' + E(a.score) + ' / ' + E(a.max_score) + '</td><td>' +
              (a.status === 'needs_marking' ? '<span class="pill">needs marks</span>' : '<span class="pill">ready to release</span>') + '</td></tr>'; }).join('') + '</table></div>';
        p.querySelector('#auto').onclick = function () {
          var btn = this, quizIds = rows.filter(function (a) { return a.status === 'needs_marking'; }).map(function (a) { return a.quiz_id; }).filter(function (v, i, s) { return s.indexOf(v) === i; }), done = 0; btn.disabled = true; btn.textContent = 'Marking…';
          Promise.all(quizIds.map(function (qid) { return loadQuiz(qid).then(function (qs) { return [qid, qs]; }); })).then(function (all) {
            var Qs = {}; all.forEach(function (x) { Qs[x[0]] = x[1]; });
            return S.db.from('quiz_attempts').select('id,quiz_id,answers,detail').in('id', rows.filter(function (a) { return a.status === 'needs_marking'; }).map(function (a) { return a.id; })).then(function (ar) {
              var jobs = []; (ar.data || []).forEach(function (a) { autoMarks(a, Qs[a.quiz_id] || []).forEach(function (m) { jobs.push({ attempt: a.id, qid: m.qid, marks_given: m.got, comment: null }); }); });
              return jobs.reduce(function (pr, j) { return pr.then(function () { return S.db.rpc('mark_answer', j).then(function () { done++; }); }); }, Promise.resolve());
            });
          }).then(function () { toast(done + ' written answer' + (done === 1 ? '' : 's') + ' marked automatically. Check them, then release.'); marking(p, []); });
        };
        p.querySelector('#relall').onclick = function () { var btn = this; btn.disabled = true;
          ready.reduce(function (pr, a) { return pr.then(function () { return S.db.rpc('release_attempt', { attempt: a.id }).then(function (x) { return S.db.functions.invoke('result-feedback', { body: { attempt: a.id } }).then(function () { return x; }, function () { return x; }); }); }); }, Promise.resolve()).then(function () { toast(ready.length + ' result' + (ready.length === 1 ? '' : 's') + ' released to students'); marking(p, []); }); };
      });
    });
  }
  function repeatsOf(a, q) {   // a student's repeats of a lesson step, labelled, never counted in the mark
    var reps = (a.repeats || []).filter(function (r) { return r.answers && r.answers[q.id] != null && r.answers[q.id] !== ''; });
    if (!reps.length) return '';
    return '<div class="fb rep"><h4>↻ Repeats (practice after seeing the answers, not marked)</h4>' + reps.map(function (r) { var g = r.answers[q.id];
      return '<div class="small"><b>Repeat ' + E(r.n) + '</b> · ' + E(S.when(r.at)) + ': ' + (/^data:image\//.test(g) ? '<img class="hw" alt="Handwritten repeat" src="' + E(g) + '">' : q.kind === 'short' ? '<span style="white-space:pre-wrap">' + E(g) + '</span>' : E((q.options || [])[g]) + (q.ans && String(g) === String(q.ans.correct_option) ? ' ✓' : ' ✗')) + '</div>'; }).join('') + '</div>';
  }
  function markOne(p, aid) {
    var Q = window.BVQ;
    S.db.from('quiz_attempts').select('*, quizzes(title,show_results)').eq('id', aid).maybeSingle().then(function (r) {
      var a = r.data; if (!a) { p.innerHTML = '<p class="msg">Attempt not found.</p>'; return; }
      Promise.all([loadQuiz(a.quiz_id), S.db.from('profiles').select('full_name').eq('id', a.student_id).maybeSingle(),
        S.db.from('attempt_feedback').select('*').eq('attempt_id', aid).then(function (f) { return f; }, function () { return { data: [] }; })]).then(function (x) {
        var qs = x[0], by = {}, FB = {}; (a.detail || []).forEach(function (d) { by[d.question_id] = d; }); ((x[2] && x[2].data) || []).forEach(function (f) { FB[f.question_id] = f; });
        var waitAI = Object.keys(FB).filter(function (k) { return FB[k].need_ai && !FB[k].ai && !FB[k].reviewed; }).length;
        var held = a.quizzes && !a.quizzes.show_results;
        p.innerHTML = '<p><a href="#marking">← Marking list</a></p><section class="panel row2"><div><h3>' + E(x[1].data ? x[1].data.full_name : '') + ' · ' + E(a.quizzes ? a.quizzes.title : '') + '</h3><p class="small muted">Submitted ' + E(S.when(a.submitted_at)) + '</p>' + (a.away_count ? '<p class="small" style="color:#b91c1c"><b>🚩 Left the page ' + a.away_count + ' time' + (a.away_count > 1 ? 's' : '') + '</b>, ' + Math.round((a.away_seconds || 0) / 60 * 10) / 10 + ' min away in total.</p>' : '') + '</div>' +
          '<div><b style="font-size:1.6rem" id="tot">' + E(a.score) + '</b> / ' + E(a.max_score) + ((a.repeats || []).length ? ' <span class="pill">↻ ' + a.repeats.length + ' repeat' + (a.repeats.length > 1 ? 's' : '') + '</span>' : '') + ' <span class="pill">' + (a.released ? 'released' : held ? 'not released yet' : 'student sees MCQ score') + '</span></div></section>' +
          qs.filter(function (q) { return q.kind !== 'info'; }).map(function (q, i) { var d = by[q.id] || {}, g = (a.answers || {})[q.id], an = q.ans || {}, written = q.kind === 'short';
            var pic = /^data:image\//.test(g || ''), sug = written ? (pic ? { got: null, hits: [] } : Q.suggest(g || '', an.mark_scheme || an.model_answer || '', q.marks)) : null, pts = written ? Q.points(an.mark_scheme || an.model_answer || '') : [], lv = written ? Q.levels(an.rubric) : [];
            var fr = FB[q.id], val = d.got != null ? d.got : fr && fr.ai && fr.ai.got != null ? fr.ai.got : fr && fr.rule && fr.rule.got != null ? fr.rule.got : sug && sug.got != null ? sug.got : '';
            return '<article class="q ' + (d.got == null ? '' : +d.got === +d.max ? 'good' : +d.got > 0 ? 'part' : 'bad') + '" data-q="' + q.id + '"><div>' + num(q.prompt, i) + BVT.rich(q.prompt, true) + ' <span class="pill">' + (q.marks ? q.marks + ' mark' + (q.marks > 1 ? 's' : '') : 'not graded') + '</span></div>' + (q.image_url && !pic ? '<img src="' + E(q.image_url) + '" alt="" style="max-width:320px;max-height:200px;border-radius:8px">' : '') +
              '<div class="fb"><h4>Student answer</h4>' + (g == null || g === '' ? '<i>no answer</i>' : pic ? '<img class="hw" alt="Student drawing or handwriting" src="' + E(g) + '" style="max-width:100%;border:1px solid var(--line);border-radius:8px">' : written ? '<p style="white-space:pre-wrap">' + E(g) + '</p>' : E((q.options || [])[g]) + (g === an.correct_option ? ' ✓' : ' ✗ (correct: ' + E((q.options || [])[an.correct_option]) + ')')) + '</div>' +
              (pts.length ? '<div class="small"><b>Mark scheme</b>' + pts.map(function (t, k) { return '<div>' + (pic ? '• ' : sug.hits[k] ? '<span class="ok-t">✓</span> ' : '<span class="bad-t">✗</span> ') + E(t) + '</div>'; }).join('') + (d.got == null && sug.got != null ? '<p class="muted">Suggested: ' + sug.got + ' / ' + q.marks + ' (check it)</p>' : '') + '</div>' : '') +
              (lv.length ? '<div class="small"><b>Rubric</b> (click a level)' + lv.map(function (l) { return '<div><button type="button" class="btn sm" data-lv="' + l.hi + '">' + (l.lo === l.hi ? l.lo : l.lo + '–' + l.hi) + '</button> ' + E(l.text) + '</div>'; }).join('') + '</div>' : '') +
              repeatsOf(a, q) + (fr && BVT.feedback ? BVT.feedback(fr, { staff: true }) : '') +
              '<div class="row2"><label class="f">Marks<input type="number" min="0" max="' + q.marks + '" step="0.5" data-k="m" value="' + E(val) + '" style="max-width:90px"></label><label class="f" style="flex:1">Comment for the student<input data-k="c" value="' + E(d.comment || '') + '"></label></div></article>'; }).join('') +
          '<div class="acts panel">' + (waitAI ? '<button class="btn sm" type="button" id="askai">🤖 Get AI suggestions (' + waitAI + ')</button>' : '') + '<button class="btn sm" type="button" id="savem">Save marks</button><button class="btn main sm" type="button" id="rel">✓ Confirm grade and release to student</button></div>';
        p.querySelectorAll('[data-lv]').forEach(function (b) { b.onclick = function () { b.closest('[data-q]').querySelector('[data-k=m]').value = b.getAttribute('data-lv'); }; });
        p.querySelectorAll('[data-useai]').forEach(function (b) { b.onclick = function () { b.closest('[data-q]').querySelector('[data-k=m]').value = b.getAttribute('data-useai'); toast('AI mark copied in: press Save marks to confirm it.'); }; });
        var ask = p.querySelector('#askai');
        if (ask) ask.onclick = function () { ask.disabled = true; ask.textContent = '🤖 Asking AI…';
          S.db.functions.invoke('ai-mark', { body: { attempt: aid } }).then(function (res) {
            var d = res && res.data; if (res.error || !d || d.ok === false) { toast((d && d.error) || 'AI marking is unavailable right now. You can mark these answers yourself.', true); ask.disabled = false; ask.textContent = '🤖 Try AI again'; return; }
            toast(d.marked ? 'AI suggestions added for ' + d.marked + ' answer' + (d.marked > 1 ? 's' : '') + '. Check each one.' : 'Nothing needed AI marking.'); markOne(p, aid);
          }, function () { toast('AI marking is unavailable right now. You can mark these answers yourself.', true); ask.disabled = false; });
        };
        function saveAll() {
          var jobs = [].map.call(p.querySelectorAll('[data-q]'), function (art) { var m = art.querySelector('[data-k=m]').value, d = by[art.getAttribute('data-q')] || {}, c = art.querySelector('[data-k=c]').value.trim();
            if (m === '' || (+m === +d.got && c === (d.comment || ''))) return null; return { attempt: aid, qid: art.getAttribute('data-q'), marks_given: +m, comment: c || null }; }).filter(Boolean);
          return jobs.reduce(function (pr, j) { return pr.then(function () { return S.db.rpc('mark_answer', j).then(function (res) { if (res.error) throw res.error; p.querySelector('#tot').textContent = res.data; }); }); }, Promise.resolve());
        }
        p.querySelector('#savem').onclick = function () { saveAll().then(function () { toast('Marks saved'); markOne(p, aid); }, function (e) { toast(S.nice(e), true); }); };
        p.querySelector('#rel').onclick = function () {
          var empty = [].filter.call(p.querySelectorAll('[data-k=m]'), function (i) { return i.value === ''; }).length; if (empty) { toast('Give a mark for every question first (' + empty + ' empty).', true); return; }
          saveAll().then(function () { return S.db.rpc('release_attempt', { attempt: aid }); }).then(function (res) { if (res.error) throw res.error; S.db.functions.invoke('result-feedback', { body: { attempt: aid } }).then(function () {}, function () {}); toast('Released: the student can now see ' + res.data + ' / ' + a.max_score); location.hash = 'marking'; })
            .catch(function (e) { toast(S.nice(e), true); });
        };
      });
    });
  }

  /* ---------- lesson builder: objectives or a file → interactive six-step lesson ---------- */
  function lessons(p, args) {
    if (args[0]) return lessonEdit(p, args[0], args[1]);
    S.db.from('quizzes').select('id,title,published,created_at, quiz_classes(class_id), quiz_questions(question_id)').eq('category', 'lesson').order('created_at', { ascending: false }).then(function (r) {
      var cn = {}; CLASSES.forEach(function (c) { cn[c.id] = c.name; });
      p.innerHTML = '<div class="acts"><a class="btn main sm" href="#lessons/new">✨ Create an interactive lesson</a></div>' +
        '<p class="small muted">Type your lesson objectives, upload any file (PDF, Word, PowerPoint, Excel, web page, text or pictures), or both. The site turns them into a six-step inquiry lesson (question, explore, test, explain, challenge, reflect) where students type or handwrite their answers. You can change everything before publishing.</p>' +
        ((r.data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Lesson</th><th>Items</th><th>Classes</th><th>Status</th><th></th></tr>' + r.data.map(function (q) {
          return '<tr><td><a href="#lessons/' + q.id + '">' + E(q.title) + '</a></td><td>' + q.quiz_questions.length + '</td><td class="small">' + E(q.quiz_classes.map(function (c) { return cn[c.class_id] || '…'; }).join(', ') || '–') + '</td><td>' + (q.published ? '<span class="pill">Published</span>' : 'Draft') + '</td>' +
            '<td><a class="small" href="/lesson/#' + q.id + '" target="_blank" rel="noopener">Preview ↗</a></td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No interactive lessons yet.</p>');
    });
  }
  function lessonEdit(p, id, topicId) {
    var Q = window.BVQ, isNew = id === 'new';
    if (isNew) {
      p.innerHTML = '<p><a href="#lessons">← All lessons</a></p><section class="panel grp"><h3>Create an interactive lesson</h3>' +
        '<label class="f">Lesson title<input id="lt" placeholder="e.g. Osmosis in plant cells"></label>' +
        '<label class="f">Lesson objectives, one per line<textarea id="lo" rows="4" placeholder="Define osmosis\nExplain why plant cells become turgid in water\nCompare osmosis and diffusion"></textarea></label>' +
        (topicId ? '<p class="small">This lesson will be filed under <b>' + E((TOPICS.filter(function (t) { return t.id === topicId; })[0] || {}).name || 'the chosen topic') + '</b> in the Learning centre.</p>' : '') +
        '<div class="two"><label class="f">Upload any file: worksheet, notes, slides, spreadsheet, web page or pictures (optional, you can choose several)<input id="lf" type="file" multiple></label>' +
        '<label class="f">Mark scheme (optional)<input id="lm" type="file" accept=".pdf,.docx,.dotx,.pptx,.ppsx,.xlsx,.csv,.tsv,.odt,.odp,.ods,.rtf,.txt,.md,.html,.htm,.doc,.ppt,.xls,image/*"></label></div>' +
        '<p class="small muted">Works with PDF, Word, PowerPoint, Excel or CSV, OpenDocument, RTF, web pages, text files and pictures. Text becomes the reading, slides become one card each with their picture, numbered questions become interactive questions, and pictures appear in the lesson. With objectives only, you get a complete lesson outline. You can change everything before publishing.</p>' +
        '<div class="acts"><button class="btn main sm" type="button" id="lb">Build the lesson</button></div><p class="msg" id="lmsg" role="status"></p></section>';
      p.querySelector('#lf').onchange = function () { var f = this.files[0]; if (f && !p.querySelector('#lt').value) p.querySelector('#lt').value = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); };
      p.querySelector('#lb').onclick = function () {
        var title = p.querySelector('#lt').value.trim(), obj = p.querySelector('#lo').value.trim(), fs = [].slice.call(p.querySelector('#lf').files), f = fs[0], m = p.querySelector('#lm').files[0], msg = p.querySelector('#lmsg');
        if (!obj && !f) { msg.className = 'msg'; msg.textContent = 'Type at least one objective or choose a file.'; return; }
        if (!title) { msg.className = 'msg'; msg.textContent = 'Give the lesson a title.'; return; }
        msg.className = 'msg ok'; msg.textContent = 'Reading ' + (fs.length > 1 ? fs.length + ' files' : 'your file') + ' and building the lesson…';
        Q.IMGS = [];
        var readAll = Promise.all(fs.map(function (x) { return Q.readFile(x).catch(function (e) { throw new Error(x.name + ': ' + S.nice(e)); }); })).then(function (all) {
          return all.length ? all.reduce(function (a, l, i) { return a.concat(all.length > 1 && !/^\*\*/.test(l[0] || '') ? ['**' + fs[i].name.replace(/\.[^.]+$/, '') + '**'] : [], l); }, []) : null; });
        Promise.all([readAll, m ? Q.readFile(m) : null]).then(function (x) {
          var items = Q.buildLesson(title, obj, x[0], x[1]);
          editor({ title: title, instructions: obj, published: false, topic_id: topicId || null }, items, []);
        }).catch(function (e) { msg.className = 'msg'; msg.textContent = S.nice(e); });
      };
      return;
    }
    Promise.all([S.db.from('quizzes').select('*').eq('id', id).maybeSingle(), S.db.from('quiz_classes').select('class_id').eq('quiz_id', id),
      S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', id).order('position')]).then(function (x) {
      var q = x[0].data; if (!q) { p.innerHTML = '<p class="msg">Lesson not found.</p>'; return; }
      var items = (x[2].data || []).map(function (z) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
        return { id: o.id, section: o.section || 'Explore', kind: o.kind, prompt: o.prompt, options: o.options || [], correct: an.correct_option == null ? -1 : an.correct_option, marks: o.marks, scheme: an.mark_scheme || '', rubric: an.rubric || '', explanation: an.explanation || '', image: o.image_url || '' }; });
      editor(q, items, (x[1].data || []).map(function (c) { return c.class_id; }));
    });

    function editor(meta, items, set) {
      var removed = [];
      p.innerHTML = '<p><a href="#lessons">← All lessons</a></p><form class="panel grp" id="lf2"><div class="row2"><h3>' + (meta.id ? 'Edit lesson' : 'Check your new lesson') + '</h3>' + (meta.id ? '<a class="btn sm" href="/lesson/#' + meta.id + '" target="_blank" rel="noopener">Preview as a student ↗</a>' : '') + '</div>' +
        '<label class="f">Title<input id="t" required value="' + E(meta.title) + '"></label><label class="f">Objectives (shown at the start of the lesson)<textarea id="ob" rows="3">' + E(meta.instructions || '') + '</textarea></label>' +
        '<div class="row2"><label class="f">Topic (shows it in the Learning centre)<select id="tp">' + topicOpts(meta.topic_id) + '</select></label><label class="f">Due (optional)<input id="du" type="datetime-local" value="' + dt(meta.due_at) + '"></label></div>' +
        '<fieldset><legend>Set for classes</legend>' + (CLASSES.length ? CLASSES.map(function (c) { return '<label class="chk"><input type="checkbox" name="cl" value="' + c.id + '"' + (set.indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + E(c.name) + '</label>'; }).join('') : '<p class="small">Create a class first.</p>') + '</fieldset>' +
        '<label class="chk"><input type="checkbox" id="pb"' + (meta.published ? ' checked' : '') + '> Published (students in the chosen classes can open it)</label>' +
        '<p class="small muted">Written answers are suggested a mark from your mark scheme and wait for you to check them in Marking before students see their result. 0-mark questions (like the reflection) are recorded but not graded.</p></form>' +
        '<div id="steps" class="grp"></div><div class="acts panel"><button class="btn main" type="button" id="ls">' + (meta.id ? 'Save lesson' : 'Save lesson') + '</button>' + (meta.id ? '<button class="btn sm" type="button" id="ldel">Delete lesson</button>' : '') + '</div>';
      var stepsEl = p.querySelector('#steps');
      function sync() { items = [].map.call(stepsEl.querySelectorAll('.qe'), Q.readCard); }
      function draw() {
        stepsEl.innerHTML = Q.STEPS.map(function (st, k) {
          var mine = items.map(function (q, i) { return [q, i]; }).filter(function (x) { return (x[0].section || 'Explore') === st; });
          return '<section class="grp step-ed" data-step="' + st + '"><h3 class="sec-h">' + (k + 1) + '. ' + st + ' <span class="small muted">' + mine.length + ' item' + (mine.length === 1 ? '' : 's') + '</span></h3>' +
            mine.map(function (x) { return Q.card(x[0], x[1], { lesson: true }); }).join('') +
            '<div class="acts"><button class="btn sm" type="button" data-add="info" data-st="' + st + '">＋ Reading, notes or video</button><button class="btn sm" type="button" data-add="short" data-st="' + st + '">＋ Written question</button><button class="btn sm" type="button" data-add="mcq" data-st="' + st + '">＋ Multiple choice</button></div></section>';
        }).join('');
        stepsEl.querySelectorAll('.qe').forEach(function (el) {
          Q.wireCard(el); var i = +el.dataset.i;
          el.querySelector('[data-f=section]').onchange = function () { sync(); draw(); };
          el.querySelector('[data-act=del]').onclick = function () { sync(); if (items[i].id) removed.push(items[i].id); items.splice(i, 1); draw(); };
          el.querySelector('[data-act=up]').onclick = function () { sync(); var j = i - 1; while (j >= 0 && items[j].section !== items[i].section) j--; if (j >= 0) { var t = items[j]; items[j] = items[i]; items[i] = t; } draw(); };
          el.querySelector('[data-act=down]').onclick = function () { sync(); var j = i + 1; while (j < items.length && items[j].section !== items[i].section) j++; if (j < items.length) { var t = items[j]; items[j] = items[i]; items[i] = t; } draw(); };
        });
        stepsEl.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () {
          sync(); var st = b.getAttribute('data-st'), kind = b.getAttribute('data-add'), last = -1;
          items.forEach(function (q, k) { if (q.section === st) last = k; });
          items.splice(last + 1, 0, { section: st, kind: kind, prompt: '', options: [], correct: -1, marks: kind === 'info' ? 0 : kind === 'mcq' ? 1 : 2, scheme: '', rubric: '', explanation: '', image: '' });
          draw(); var el = stepsEl.querySelector('[data-i="' + (last + 1) + '"] [data-f=prompt]'); if (el) el.focus(); }; });
      }
      draw();
      var del = p.querySelector('#ldel'); if (del) del.onclick = function () { if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = 'Click again to delete the lesson and its answers'; return; }
        S.db.from('lessons').delete().eq('external_id', 'IL-' + meta.id).then(function () { return S.db.from('quizzes').delete().eq('id', meta.id); }).then(function (r) { if (ok(r, 'Lesson deleted')) location.hash = 'lessons'; }); };
      p.querySelector('#ls').onclick = function () {
        sync(); var bad = items.map(Q.check).filter(Boolean)[0]; if (bad) { toast(bad, true); return; }
        var title = p.querySelector('#t').value.trim(); if (!title) { toast('Give the lesson a title.', true); return; }
        var cls = [].map.call(p.querySelectorAll('[name=cl]:checked'), function (c) { return c.value; }), pub = p.querySelector('#pb').checked;
        if (pub && !cls.length) { toast('Choose at least one class before publishing.', true); return; }
        var row = { title: title, instructions: p.querySelector('#ob').value.trim() || null, topic_id: p.querySelector('#tp').value || null, due_at: iso(p.querySelector('#du').value), published: pub, category: 'lesson', show_results: false, max_attempts: 1, time_limit_minutes: null };
        var btn = this; btn.disabled = true; btn.textContent = 'Saving…'; var qid;
        (meta.id ? S.db.from('quizzes').update(row).eq('id', meta.id).select('id').single() : S.db.from('quizzes').insert(row).select('id').single()).then(function (r) {
          if (r.error) throw r.error; qid = r.data.id;
          return Q.save(S.db, items);
        }).then(function (ids) {
          return S.db.from('quiz_questions').delete().eq('quiz_id', qid).then(function () { return S.db.from('quiz_questions').insert(ids.map(function (x, k) { return { quiz_id: qid, question_id: x, position: k + 1 }; })); });
        }).then(function (r) {
          if (r.error) throw r.error;
          return removed.length ? S.db.from('questions').delete().in('id', removed) : null;
        }).then(function () {
          return S.db.from('quiz_classes').delete().eq('quiz_id', qid).then(function () { return cls.length ? S.db.from('quiz_classes').insert(cls.map(function (c) { return { quiz_id: qid, class_id: c }; })) : { error: null }; });
        }).then(function (r) {
          if (r.error) throw r.error;
          // a matching entry in the Learning centre (and lesson progress) for students
          var marks = items.reduce(function (a, q) { return a + (q.marks || 0); }, 0);
          return S.db.from('lessons').upsert({ external_id: 'IL-' + qid, title: title, summary: (row.instructions || '').split('\n')[0] || 'Interactive lesson', url: '/lesson/#' + qid, topic_id: row.topic_id, max_marks: marks, published: pub }, { onConflict: 'external_id' });
        }).then(function (r) {
          if (r && r.error) throw r.error; toast('Lesson saved' + (pub ? ' and published' : ' as a draft')); location.hash = 'lessons/' + qid; if (meta.id) lessonEdit(p, qid);
        }).catch(function (e) { btn.disabled = false; btn.textContent = 'Save lesson'; toast(S.nice(e), true); });
      };
    }
  }

  /* ---------- content manager ---------- */
  var KINDS = ['file', 'folder', 'video', 'link', 'slides', 'worksheet', 'past paper'];
  var CONTENT = {
    topics: { label: 'Topics', order: 'sort_order', sel: '*, subjects(name)', show: function (r) { var par = TOPICS.filter(function (t) { return t.id === r.parent_id; })[0]; return (r.subjects ? r.subjects.name + ' · ' : '') + (par ? par.name + ' › ' : '') + r.name; },
      f: [['subject_id', 'Subject', 'subject'], ['parent_id', 'Main topic (choose one to make this a subtopic)', 'topic'], ['name', 'Topic or subtopic name', 'text'], ['programme', 'Programme (e.g. MYP 4, IB DP)', 'text'], ['code', 'Syllabus code', 'text'], ['summary', 'Summary', 'area'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] },
    lessons: { label: 'Lessons', order: 'sort_order', sel: '*, topics(name)', show: function (r) { return r.title + (r.topics ? ' · ' + r.topics.name : ''); },
      f: [['topic_id', 'Topic', 'topic'], ['title', 'Title', 'text'], ['summary', 'Summary', 'area'], ['url', 'Lesson address (e.g. /lessons/g9-dna-rna/)', 'text'], ['external_id', 'Lesson ID (must match the lesson page, e.g. G9-DNA-RNA)', 'text'], ['max_marks', 'Total marks', 'num'], ['minutes', 'Minutes', 'num'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] },
    resources: { label: 'Resources', order: 'sort_order', sel: '*, topics(name)', show: function (r) { return r.title + ' (' + r.kind + ')' + (r.topics ? ' · ' + r.topics.name : ''); },
      f: [['topic_id', 'Topic', 'topic'], ['title', 'Title', 'text'], ['kind', 'Type', 'kind'], ['url', 'Link', 'text'], ['download_url', 'Download link (optional)', 'text'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] },
    simulations: { label: 'Simulations', order: 'sort_order', sel: '*, topics(name)', show: function (r) { return r.title + (r.topics ? ' · ' + r.topics.name : ''); },
      f: [['topic_id', 'Topic', 'topic'], ['title', 'Title', 'text'], ['description', 'Description', 'area'], ['url', 'Address', 'text'], ['thumbnail_url', 'Picture address (optional)', 'text'], ['source', 'Source (e.g. PhET)', 'text'], ['is_internal', 'Made on this site', 'bool'], ['sort_order', 'Order', 'num'], ['published', 'Published', 'bool']] }
  };
  var SUBJ = null;
  function content(p, args) {
    var t = CONTENT[args[0]] ? args[0] : 'lessons', c = CONTENT[t];
    (SUBJ ? Promise.resolve() : S.db.from('subjects').select('id,name').order('sort_order').then(function (r) { SUBJ = r.data || []; })).then(function () {
      return S.db.from(t).select(c.sel).order(c.order);
    }).then(function (r) {
      var rows = r.data || [], q = '';
      function field(f, v) { var k = f[0], ty = f[2], lab = '<label class="f">' + E(f[1]);
        if (ty === 'bool') return '<label class="chk"><input type="checkbox" data-k="' + k + '"' + (v || v == null && k === 'published' ? ' checked' : '') + '> ' + E(f[1]) + '</label>';
        if (ty === 'area') return lab + '<textarea data-k="' + k + '" rows="2">' + E(v || '') + '</textarea></label>';
        if (ty === 'topic') return lab + '<select data-k="' + k + '">' + topicOpts(v) + '</select></label>';
        if (ty === 'subject') return lab + '<select data-k="' + k + '" required>' + SUBJ.map(function (s) { return '<option value="' + s.id + '"' + (s.id === v ? ' selected' : '') + '>' + E(s.name) + '</option>'; }).join('') + '</select></label>';
        if (ty === 'kind') return lab + '<select data-k="' + k + '">' + KINDS.map(function (s) { return '<option' + (s === v ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>';
        return lab + '<input data-k="' + k + '"' + (ty === 'num' ? ' type="number"' : '') + ' value="' + E(v == null ? '' : v) + '"></label>'; }
      function read(form) { var o = {}; c.f.forEach(function (f) { var el = form.querySelector('[data-k="' + f[0] + '"]'); o[f[0]] = f[2] === 'bool' ? el.checked : f[2] === 'num' ? (el.value === '' ? (f[0] === 'sort_order' ? 0 : null) : +el.value) : (el.value.trim() || null); }); return o; }
      function draw() {
        var list = rows.filter(function (x) { return !q || c.show(x).toLowerCase().indexOf(q) >= 0; });
        p.innerHTML = '<nav class="tabs">' + Object.keys(CONTENT).map(function (k) { return '<a href="#content/' + k + '" aria-selected="' + (k === t) + '">' + CONTENT[k].label + '</a>'; }).join('') + '</nav>' +
          '<details class="panel tint"' + (rows.length ? '' : ' open') + '><summary><b>＋ Add to ' + c.label.toLowerCase() + '</b></summary><form class="grp" id="nf" style="margin-top:10px">' + c.f.map(function (f) { return field(f, null); }).join('') + '<button class="btn main sm" type="submit">Add</button></form></details>' +
          '<input type="search" id="q" placeholder="Search ' + c.label.toLowerCase() + '" value="' + E(q) + '" aria-label="Search">' +
          (list.length ? list.map(function (x) { return '<details class="panel" data-id="' + x.id + '"><summary>' + (x.published === false ? '<span class="pill">Hidden</span> ' : '') + E(c.show(x)) + '</summary><form class="grp" style="margin-top:10px">' + c.f.map(function (f) { return field(f, x[f[0]]); }).join('') +
            '<div class="acts"><button class="btn main sm" type="submit">Save</button><button class="btn sm" type="button" data-a="del">Delete</button></div></form></details>'; }).join('') : '<p class="emptybox">Nothing here yet.</p>');
        p.querySelector('#nf').onsubmit = function (e) { e.preventDefault(); S.db.from(t).insert(read(this)).then(function (r2) { if (ok(r2, 'Added')) { if (t === 'topics') refs(); content(p, [t]); } }); };
        p.querySelectorAll('details[data-id]').forEach(function (d) { var id = d.getAttribute('data-id'), f = d.querySelector('form');
          f.onsubmit = function (e) { e.preventDefault(); S.db.from(t).update(read(f)).eq('id', id).then(function (r2) { if (ok(r2, 'Saved')) { if (t === 'topics') refs(); } }); };
          var b = f.querySelector('[data-a=del]'); b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to delete'; return; } S.db.from(t).delete().eq('id', id).then(function (r2) { if (ok(r2, 'Deleted')) content(p, [t]); }); }; });
        var qi = p.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); draw(); var n = p.querySelector('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      }
      draw();
    });
  }

  /* ---------- roles (admins only; RLS also enforces this on the server) ---------- */
  function roles(p) {
    Promise.all([S.db.from('profiles').select('id,full_name,class_id').order('full_name'), S.db.from('user_roles').select('user_id,role')]).then(function (x) {
      var rs = {}, q = ''; (x[1].data || []).forEach(function (r) { (rs[r.user_id] = rs[r.user_id] || []).push(r.role); });
      var people = x[0].data || [];
      function draw() {
        var list = people.filter(function (u) { return (q ? (u.full_name || '').toLowerCase().indexOf(q) >= 0 : (rs[u.id] || []).some(function (r) { return r !== 'student'; })); });
        p.innerHTML = '<p class="small muted">Staff are listed below. Search for a person to give them teacher or admin rights. Teachers see only students in classes they own; admins see everything.</p><input type="search" id="q" placeholder="Search people by name" value="' + E(q) + '" aria-label="Search people">' +
          '<div class="tablewrap"><table class="marks"><tr><th>Name</th><th>Roles</th><th>Teacher</th><th>Admin</th><th>Account</th></tr>' + list.map(function (u) { var r = rs[u.id] || [];
            return '<tr><td>' + E(u.full_name || '(no name)') + '</td><td class="small">' + E(r.join(', ')) + '</td>' + ['teacher', 'admin'].map(function (role) { var has = r.indexOf(role) >= 0;
              return '<td><button type="button" class="btn sm" data-u="' + u.id + '" data-r="' + role + '" data-h="' + has + '"' + (u.id === ME.user.id && role === 'admin' ? ' disabled title="You cannot remove your own admin rights"' : '') + '>' + (has ? 'Remove' : 'Give') + '</button></td>'; }).join('') +
              '<td>' + (u.id === ME.user.id ? '<span class="small muted">you</span>' : '<button type="button" class="btn sm" data-del="' + u.id + '">Delete account</button>') + '</td></tr>'; }).join('') + '</table></div>';
        p.querySelectorAll('[data-u]').forEach(function (b) { b.onclick = function () { var u = b.getAttribute('data-u'), role = b.getAttribute('data-r'), has = b.getAttribute('data-h') === 'true';
          (has ? S.db.from('user_roles').delete().eq('user_id', u).eq('role', role) : S.db.from('user_roles').insert({ user_id: u, role: role, granted_by: ME.user.id })).then(function (r) {
            if (!ok(r, has ? 'Role removed' : 'Role given')) return; rs[u] = rs[u] || []; if (has) rs[u] = rs[u].filter(function (z) { return z !== role; }); else rs[u].push(role); draw(); }); }; });
        wireRemove(p, function () { roles(p); });
        var qi = p.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); draw(); var n = p.querySelector('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      }
      draw();
    });
  }

  /* ---------- removing people ---------- */
  function removeButtons(id, inClass) {
    return (inClass ? '<button type="button" class="btn sm" data-out="' + id + '">Remove from class</button> ' : '') +
      (ME.admin ? '<button type="button" class="btn sm" data-del="' + id + '">Delete account</button>' : '');
  }
  function twice(b, label, fn) {   // first click asks, second click does it
    if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = label; b.classList.add('main'); setTimeout(function () { if (b.isConnected && b.dataset.sure) { delete b.dataset.sure; b.textContent = b.dataset.was; b.classList.remove('main'); } }, 5000); return; }
    b.disabled = true; fn();
  }
  function wireRemove(p, after) {
    p.querySelectorAll('[data-out]').forEach(function (b) { b.dataset.was = b.textContent; b.onclick = function () {
      twice(b, 'Click again to remove', function () { S.db.from('profiles').update({ class_id: null, approved: false }).eq('id', b.getAttribute('data-out')).then(function (r) { if (ok(r, 'Removed from class')) after(); else b.disabled = false; }); }); }; });
    p.querySelectorAll('[data-del]').forEach(function (b) { b.dataset.was = b.textContent; b.onclick = function () {
      twice(b, 'Click again: delete forever', function () { S.db.rpc('delete_account', { uid: b.getAttribute('data-del') }).then(function (r) { if (ok(r, 'Account deleted')) after(); else b.disabled = false; }); }); }; });
  }

  /* ---------- approvals: one click ---------- */
  function approvals(p) {
    Promise.all([S.db.from('pending_accounts').select('*').order('created_at'), S.db.rpc('account_emails')]).then(function (x) {
      var rows = x[0].data || [], em = {}; (x[1].data || []).forEach(function (u) { em[u.user_id] = u.email; });
      if (!rows.length) { p.innerHTML = '<p class="emptybox">Nobody is waiting for approval. New sign-ups appear here.</p>'; return; }
      p.innerHTML = '<div class="row2"><p><b>' + rows.length + '</b> waiting for approval</p><button class="btn main sm" type="button" id="all">✓ Approve all ' + rows.length + '</button></div>' +
        '<div class="tablewrap"><table class="marks"><tr><th>Name</th><th>Email</th><th>Class</th><th>Signed up</th><th></th></tr>' + rows.map(function (r) {
          return '<tr data-row="' + r.student_id + '"><td><b>' + E(r.full_name || '(no name)') + '</b></td><td class="small">' + E(em[r.student_id] || '') + '</td><td>' + E(r.class_name || 'no class') + '</td><td class="small">' + E(S.when(r.created_at)) + '</td>' +
            '<td><button class="btn main sm" type="button" data-ok="' + r.student_id + '"' + (r.class_id ? '' : ' disabled title="Not in a class yet"') + '>✓ Approve</button> ' + removeButtons(r.student_id, !!r.class_id) + '</td></tr>'; }).join('') + '</table></div>' +
        '<p class="small muted">Approve gives the person their lessons, quizzes and simulations straight away. "Remove from class" sends them back to the join-a-class screen; "Delete account" removes them completely.</p>';
      function approve(ids) { return S.db.from('profiles').update({ approved: true }).in('id', ids); }
      p.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { b.disabled = true; approve([b.getAttribute('data-ok')]).then(function (r) {
        if (!ok(r, 'Approved')) { b.disabled = false; return; } var tr = p.querySelector('[data-row="' + b.getAttribute('data-ok') + '"]'); tr.style.opacity = .5; b.textContent = '✓ Approved'; }); }; });
      p.querySelector('#all').onclick = function () { var ids = rows.filter(function (r) { return r.class_id; }).map(function (r) { return r.student_id; }); approve(ids).then(function (r) { if (ok(r, ids.length + ' approved')) approvals(p); }); };
      wireRemove(p, function () { approvals(p); });
    });
  }

  /* ---------- activity log (admins): visits, sign-ups and logins ---------- */
  function activity(p, args) {
    var kind = args[0] || 'all', since = new Date(Date.now() - 7 * 864e5).toISOString();
    var q = S.db.from('site_events').select('*').gte('at', since).order('at', { ascending: false }).limit(1000);
    Promise.all([q, S.db.from('profiles').select('id,full_name')]).then(function (x) {
      var ev = x[0].data || [], nm = {}; (x[1].data || []).forEach(function (u) { nm[u.id] = u.full_name; });
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var visits = ev.filter(function (e) { return e.kind === 'visit'; }), uniq = {}; visits.forEach(function (e) { uniq[e.visitor || e.id] = 1; });
      var pages = {}; visits.forEach(function (e) { pages[e.path] = (pages[e.path] || 0) + 1; });
      var top = Object.keys(pages).sort(function (a, b) { return pages[b] - pages[a]; }).slice(0, 8);
      var list = ev.filter(function (e) { return kind === 'all' || e.kind === kind; }).slice(0, 300);
      var label = { visit: '👁 Visit', signup: '🆕 Sign-up', login: '🔑 Login' };
      p.innerHTML = '<div class="stats"><div class="stat"><span class="small muted">Visits today</span><b>' + visits.filter(function (e) { return new Date(e.at) >= today; }).length + '</b></div>' +
        '<div class="stat"><span class="small muted">Visitors (7 days)</span><b>' + Object.keys(uniq).length + '</b></div>' +
        '<div class="stat"><span class="small muted">Sign-ups (7 days)</span><b>' + ev.filter(function (e) { return e.kind === 'signup'; }).length + '</b></div>' +
        '<div class="stat"><span class="small muted">Logins (7 days)</span><b>' + ev.filter(function (e) { return e.kind === 'login'; }).length + '</b></div></div>' +
        (top.length ? '<section class="panel"><h3>Most visited pages (7 days)</h3>' + top.map(function (k) { return '<div class="row2"><span class="small">' + E(k) + '</span><span class="small muted">' + pages[k] + '</span></div>'; }).join('') + '</section>' : '') +
        '<nav class="tabs">' + [['all', 'Everything'], ['signup', 'Sign-ups'], ['login', 'Logins'], ['visit', 'Visits']].map(function (t) { return '<a href="#activity/' + t[0] + '" aria-selected="' + (t[0] === kind) + '">' + t[1] + '</a>'; }).join('') + '</nav>' +
        (list.length ? '<div class="tablewrap"><table class="marks"><tr><th>When</th><th>What</th><th>Who</th><th>Page / class</th><th>Device</th><th>Came from</th></tr>' + list.map(function (e) {
          return '<tr><td class="small">' + E(S.when(e.at)) + '</td><td>' + (label[e.kind] || E(e.kind)) + '</td><td>' + (e.user_id ? E(nm[e.user_id] || 'account') : '<span class="muted">visitor</span>') + '</td><td class="small">' + E(e.path || '') + '</td><td class="small">' + E(e.kind === 'login' ? (/Mobi|Android|iPhone/i.test(e.device || '') ? 'phone' : 'computer') : (e.device || '')) + '</td><td class="small">' + E(e.referrer || '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">Nothing in the last 7 days yet.</p>') +
        '<p class="small muted">Visits record the page, time, device type and the site a visitor came from. No IP addresses are stored. Showing the last 7 days.</p>';
    });
  }



  /* ---------- virtual laboratory work (Simulations & Virtual Laboratories centre; table sim_attempts, migration 019) ---------- */
  var LABNAMES = { enzyme: 'Enzyme activity', osmosis: 'Osmosis', dna: 'DNA replication', heart: 'Heart and circulation', titration: 'Acid–base titration' };
  function labWork(p, args) {
    var cls = args[0] || '', which = args[1] || '';
    p.innerHTML = '<section class="panel"><div class="row2"><h3 style="margin:0">🔬 Lab work</h3><a class="btn sm" href="/simulations/" target="_blank">Open the Simulations centre</a></div>' +
      '<p class="small muted">Work students do in the virtual laboratories: their results tables, graphs, answers and marks. To set a lab for a class, use the class <b>📌 To-do list</b> and choose <b>🔬 Simulation</b>.</p>' +
      '<div class="row2" style="justify-content:flex-start;flex-wrap:wrap"><label class="f">Class<select id="lwc">' + classOpts(cls, 'All my classes') + '</select></label>' +
      '<label class="f">Laboratory<select id="lwl"><option value="">All laboratories</option>' + Object.keys(LABNAMES).map(function (k) { return '<option value="' + k + '"' + (k === which ? ' selected' : '') + '>' + E(LABNAMES[k]) + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="lwsum"></div><div id="lwlist"><p class="muted">Loading…</p></div></section>';
    var go = function () { location.hash = 'labs/' + p.querySelector('#lwc').value + '/' + p.querySelector('#lwl').value; };
    p.querySelector('#lwc').onchange = go; p.querySelector('#lwl').onchange = go;
    labList(p.querySelector('#lwlist'), { cls: cls || null, which: which || null }, false, p.querySelector('#lwsum'));
  }
  function labList(box, f, compact, sumBox) {
    S.db.rpc('sim_work', { cls: f.cls || null, which: f.which || null, sid: f.sid || null }).then(function (r) {
      if (r.error) { box.innerHTML = (compact ? '<h3>🔬 Lab work</h3>' : '') + '<p class="small muted">' + (/sim_work|does not exist/i.test(r.error.message) ? 'Lab work appears here once migration 019 has been run.' : E(S.nice(r.error))) + '</p>'; return; }
      var rows = r.data || [];
      if (sumBox) {
        var by = {}; rows.forEach(function (x) { var b = by[x.sim] = by[x.sim] || { n: 0, sub: 0, pc: [], st: {} }; b.n++; b.st[x.student_id] = 1; if (x.submitted_at) b.sub++; if (x.max_score) b.pc.push(100 * x.score / x.max_score); });
        sumBox.innerHTML = Object.keys(by).length ? '<div class="tablewrap"><table class="marks"><tr><th>Laboratory</th><th>Students</th><th>Handed in</th><th>Mean mark</th></tr>' + Object.keys(by).map(function (k) { var b = by[k], m = b.pc.length ? Math.round(b.pc.reduce(function (s, v) { return s + v; }, 0) / b.pc.length) : null;
          return '<tr><td>' + E(LABNAMES[k] || k) + '</td><td>' + Object.keys(b.st).length + '</td><td>' + b.sub + ' / ' + b.n + '</td><td>' + (m == null ? '—' : m + ' %') + '</td></tr>'; }).join('') + '</table></div>' : '';
      }
      box.innerHTML = (compact ? '<h3>🔬 Lab work</h3>' : '') + (rows.length ? '<div class="tablewrap"><table class="marks"><tr>' + (compact ? '' : '<th>Student</th><th>Class</th>') + '<th>Laboratory</th><th>Trials</th><th>Hints</th><th>Mark</th><th>Status</th><th></th></tr>' +
        rows.map(function (x) { return '<tr>' + (compact ? '' : '<td>' + E(x.student || '') + '</td><td>' + E(x.class_name || '') + '</td>') + '<td>' + E(x.sim_title || LABNAMES[x.sim] || x.sim) + '</td><td>' + x.trials + '</td><td>' + x.hints + '</td><td>' + (+x.score) + ' / ' + (+x.max_score) + '</td>' +
          '<td class="small">' + (x.submitted_at ? '✓ handed in ' + E(S.when(x.submitted_at)) : 'in progress · ' + E(S.when(x.updated_at))) + '</td><td><button type="button" class="btn sm" data-lw="' + x.id + '">View</button></td></tr>'; }).join('') + '</table></div>'
        : '<p class="small muted">No laboratory work yet.</p>') + '<div id="lwview"></div>';
      box.querySelectorAll('[data-lw]').forEach(function (b) { b.onclick = function () { labView(box.querySelector('#lwview'), b.getAttribute('data-lw'), rows.filter(function (x) { return x.id === b.getAttribute('data-lw'); })[0]); }; });
    });
  }
  function labDoc(a, who) {
    var rows = a.data || [], cols = rows.length ? Object.keys(rows[0]).filter(function (k) { return k[0] !== '_'; }) : [], ans = a.answers || {}, sc = a.scores || {};
    var vars = {}; (a.variables || []).forEach(function (v) { vars[v[1]] = (vars[v[1]] || 0) + 1; });
    return '<h2 style="margin-top:0">' + E(a.sim_title || a.sim) + '</h2><p class="small">' + E(who) + ' · started ' + E(new Date(a.started_at).toLocaleString()) + (a.submitted_at ? ' · handed in ' + E(new Date(a.submitted_at).toLocaleString()) : ' · not handed in yet') +
      ' · mark <b>' + (+a.score) + ' / ' + (+a.max_score) + '</b> · ' + a.trials + ' trials · ' + a.hints + ' hints</p>' +
      '<p class="small"><b>Controls changed:</b> ' + (Object.keys(vars).length ? Object.keys(vars).map(function (k) { return E(k) + ' (' + vars[k] + '×)'; }).join(', ') : 'none recorded') + '</p>' +
      '<h3>Hypothesis</h3><p style="white-space:pre-wrap">' + E(ans._hypothesis || '—') + '</p>' + (sc._hyp != null ? '<p class="small">Mark: ' + sc._hyp + '</p>' : '') +
      '<h3>Results</h3>' + (rows.length ? '<div class="tablewrap"><table class="marks"><tr><th>#</th>' + cols.map(function (c) { return '<th>' + E(c) + '</th>'; }).join('') + '</tr>' + rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td>' + cols.map(function (c) { var v = r[c]; return '<td>' + E(typeof v === 'number' ? +v.toFixed(3) : v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' : '<p class="small muted">No results recorded.</p>') +
      '<h3>Answers</h3>' + (Object.keys(ans).filter(function (k) { return k !== '_hypothesis'; }).map(function (k) { return '<p><b>' + E(k) + '</b> <span class="small">(' + (sc[k] == null ? 'not checked' : 'mark ' + sc[k]) + ')</span><br><span style="white-space:pre-wrap">' + E(ans[k] || '—') + '</span></p>'; }).join('') || '<p class="small muted">No answers yet.</p>');
  }
  function labView(box, id, meta) {
    box.innerHTML = '<p class="muted">Loading…</p>';
    S.db.from('sim_attempts').select('*').eq('id', id).maybeSingle().then(function (r) {
      if (r.error || !r.data) { box.innerHTML = '<p class="msg">Could not open this lab work.</p>'; return; }
      var a = r.data, who = (meta && meta.student) || 'Student';
      box.innerHTML = '<section class="panel tint">' + labDoc(a, who) + '<label class="f">Comment for the student<textarea id="lwcm" rows="3">' + E(a.teacher_comment || '') + '</textarea></label>' +
        '<div class="acts"><button type="button" class="btn sm main" id="lwsave">Save comment</button><button type="button" class="btn sm" id="lwrep">📄 HTML report</button><button type="button" class="btn sm" id="lwx">Close</button></div></section>';
      box.querySelector('#lwx').onclick = function () { box.innerHTML = ''; };
      box.querySelector('#lwsave').onclick = function () { S.db.from('sim_attempts').update({ teacher_comment: box.querySelector('#lwcm').value.trim() || null }).eq('id', id).then(function (x) { ok(x, 'Comment saved'); }); };
      box.querySelector('#lwrep').onclick = function () {
        var w = window.open('', '_blank'); if (!w) { toast('Allow pop-ups to open the report.', true); return; }
        w.document.write('<!doctype html><meta charset="utf-8"><title>' + E(a.sim_title || a.sim) + ' · ' + E(who) + '</title><style>body{font:15px/1.5 system-ui,Arial;max-width:900px;margin:24px auto;padding:0 16px}table{border-collapse:collapse;width:100%;font-size:.9em}td,th{border:1px solid #ccc;padding:4px 6px;text-align:center}.tablewrap{overflow-x:auto}</style>' +
          labDoc(a, who) + (a.teacher_comment ? '<h3>Teacher\'s comment</h3><p style="white-space:pre-wrap">' + E(a.teacher_comment) + '</p>' : '') + '<p style="color:#666;font-size:.85em">Learnova virtual laboratory report · Learnova · biosciencevista.com</p>');
        w.document.close();
      };
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- Science Help Desk: questions students send from /tutor/ (no AI) ---------- */
  var HD_NOTES = null;
  function hdWords(t) { return (String(t || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return w.length > 3; }); }
  function hdSuggest(q) {
    var qw = hdWords(q); if (!HD_NOTES || !qw.length) return [];
    return HD_NOTES.map(function (r) {
      var n = r.notes || {}, tt = hdWords(n.title + ' ' + (n.terms || []).map(function (x) { return x.term; }).join(' ')), bb = hdWords([n.intro, (n.points || []).join(' ')].join(' ')), sc = 0;
      qw.forEach(function (w) { if (tt.indexOf(w) >= 0) sc += 3; else if (bb.indexOf(w) >= 0) sc += 1; });
      return { r: r, sc: sc };
    }).filter(function (o) { return o.sc >= 3; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 3).map(function (o) { return o.r; });
  }
  function helpDesk(p, args) {
    var show = args[0] || 'open';
    p.innerHTML = '<p class="muted">Loading…</p>';
    Promise.all([S.db.rpc('help_inbox', { only_open: show === 'open' }), HD_NOTES ? null : S.db.from('lesson_notes').select('lesson,step,notes').limit(2000)]).then(function (x) {
      if (x[1] && x[1].data) HD_NOTES = x[1].data;
      var r = x[0];
      if (r.error) { p.innerHTML = '<section class="panel"><h3>Student questions</h3><p class="msg">' + E(S.nice(r.error)) + '</p><p class="small muted">If this says the function does not exist, migration 018 has not been run yet.</p></section>'; return; }
      var rows = r.data || [];
      p.innerHTML = '<section class="panel"><div class="row2"><h3>Student questions</h3><span class="small muted">From the <a href="/tutor/" target="_blank">Science Help Desk</a>. Students see your answer there.</span></div>' +
        '<nav class="tabs"><a href="#questions/open" aria-selected="' + (show === 'open') + '">Waiting for an answer</a><a href="#questions/all" aria-selected="' + (show === 'all') + '">All questions</a></nav>' +
        (rows.length ? rows.map(function (q) {
          var sug = q.status === 'open' ? hdSuggest(q.question + ' ' + (q.topic || '')) : [];
          return '<article class="bkcard ' + (q.status === 'open' ? 'new' : 'done') + '" data-id="' + q.id + '"><div class="row2"><span><b>' + E(q.student || 'Student') + '</b>' + (q.class_name ? ' · ' + E(q.class_name) : '') +
            (q.course ? ' · ' + E(q.course) : '') + (q.topic ? ' · ' + E(q.topic) : '') + '</span><span class="small muted">' + E(S.when ? S.when(q.created_at) : new Date(q.created_at).toLocaleString()) + '</span></div>' +
            '<p style="white-space:pre-wrap"><b>Question:</b> ' + E(q.question) + '</p>' +
            (sug.length ? '<p class="small muted">From your notes: ' + sug.map(function (n, i) { return '<button type="button" class="btn sm" data-sug="' + i + '">＋ ' + E((n.notes || {}).title || n.lesson) + '</button>'; }).join(' ') + '</p>' : '') +
            '<label class="f">Your answer<textarea class="hda" rows="4">' + E(q.answer || '') + '</textarea></label>' +
            '<label class="small"><input type="checkbox" class="hdf"' + (q.public_faq ? ' checked' : '') + '> Share this question and answer with all students (their name is not shown)</label>' +
            '<div class="cta"><button class="btn main sm" data-act="answer" type="button">' + (q.answer ? 'Update answer' : 'Send answer') + '</button>' +
            (q.status !== 'closed' ? '<button class="btn sm" data-act="close" type="button">Close without answer</button>' : '') + '<button class="btn sm" data-act="delete" type="button">Delete</button></div></article>';
        }).join('') : '<p class="emptybox">' + (show === 'open' ? 'No questions are waiting. 🎉' : 'No questions yet.') + '</p>') + '</section>';
      p.querySelectorAll('article[data-id]').forEach(function (card) {
        var q = rows.filter(function (x) { return x.id === card.getAttribute('data-id'); })[0], ta = card.querySelector('.hda');
        var sug = q.status === 'open' ? hdSuggest(q.question + ' ' + (q.topic || '')) : [];
        card.querySelectorAll('[data-sug]').forEach(function (b) { b.onclick = function () {
          var n = sug[+b.getAttribute('data-sug')].notes || {};
          var qw = hdWords(q.question + ' ' + (q.topic || '')), rel = function (x) { var w = hdWords(x); return qw.filter(function (v) { return w.indexOf(v) >= 0; }).length; };
          var pts = (n.points || []).map(function (x) { return [x, rel(x)]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3).filter(function (x, i) { return x[1] > 0 || i < 2; }).map(function (x) { return x[0]; });
          var t = (n.intro && rel(n.intro) ? n.intro + '\n' : '') + pts.map(function (x) { return '• ' + x; }).join('\n');
          ta.value = (ta.value.trim() ? ta.value.trim() + '\n\n' : '') + t; ta.focus(); }; });
        card.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () {
          var act = b.getAttribute('data-act');
          if (act === 'delete') { if (!confirm('Delete this question for good?')) return; S.db.from('help_questions').delete().eq('id', q.id).then(function (r) { if (ok(r, 'Question deleted')) helpDesk(p, args); }); return; }
          if (act === 'close') { S.db.from('help_questions').update({ status: 'closed' }).eq('id', q.id).then(function (r) { if (ok(r, 'Closed')) helpDesk(p, args); }); return; }
          var a = ta.value.trim(); if (!a) { toast('Write the answer first.', true); return; }
          S.db.from('help_questions').update({ answer: a.slice(0, 8000), public_faq: card.querySelector('.hdf').checked }).eq('id', q.id).then(function (r) { if (ok(r, 'Answer sent to the student')) helpDesk(p, args); });
        }; });
      });
    });
  }

  /* ---------- private lesson bookings (admin) ---------- */
  function bookings(p, args) {
    var show = args[0] || 'new', LBL = { new: 'New', confirmed: 'Confirmed', done: 'Completed', declined: 'Declined', cancelled: 'Cancelled' };
    var PLAN = { single: 'One lesson', weekly: 'Weekly lessons', exam_prep: 'Exam preparation' };
    var nice = function (v) { try { return new Date(v).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return v; } };
    S.db.from('bookings').select('*').order('created_at', { ascending: false }).limit(300).then(function (r) {
      if (!ok(r)) return;
      var all = r.data || [], cnt = {}; all.forEach(function (b) { cnt[b.status] = (cnt[b.status] || 0) + 1; });
      var list = all.filter(function (b) { return show === 'all' || b.status === show; });
      p.innerHTML = '<div class="row2"><p class="muted">Requests from the <a href="/book/" target="_blank">Book a lesson</a> page. Only admins can see them.</p></div>' +
        '<nav class="tabs">' + ['new', 'confirmed', 'done', 'declined', 'all'].map(function (k) { return '<a href="#bookings/' + k + '" aria-selected="' + (k === show) + '">' + (k === 'all' ? 'All' : LBL[k]) + ' (' + (k === 'all' ? all.length : cnt[k] || 0) + ')</a>'; }).join('') + '</nav>' +
        (list.length ? list.map(function (b) {
          var slots = (b.slots || []).map(function (s) { return s.at || s; });
          var phone = (b.phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^0/, '254');
          return '<article class="bkcard ' + b.status + '" data-id="' + b.id + '"><div class="row2"><span><b>' + E(b.subject) + '</b>' + (b.level ? ' · ' + E(b.level) : '') + ' <span class="pill">' + (b.mode === 'virtual' ? '💻 Virtual' : '🏫 Face to face') + '</span></span><span class="pill">' + E(LBL[b.status] || b.status) + '</span></div>' +
            '<div class="small"><b>' + E(b.contact_name) + '</b>' + (b.booker === 'parent' ? ' (parent of ' + E(b.student_name || 'student') + ')' : '') + ' · <a href="mailto:' + E(b.email) + '">' + E(b.email) + '</a>' + (b.phone ? ' · ' + E(b.phone) : '') + '</div>' +
            '<div class="small muted">' + E(PLAN[b.plan] || b.plan) + ' · ' + b.duration_min + ' min' + (b.location ? ' · ' + E(b.location) : '') + ' · sent ' + E(S.when(b.created_at)) + (b.timezone ? ' · their time zone ' + E(b.timezone) : '') + '</div>' +
            (b.message ? '<p class="small" style="white-space:pre-wrap">' + E(b.message) + '</p>' : '') +
            '<div class="two"><label class="f">Lesson time<select class="bslot">' + slots.map(function (s) { return '<option value="' + E(s) + '"' + (s === b.confirmed_slot ? ' selected' : '') + '>' + E(nice(s)) + '</option>'; }).join('') +
              '<option value="other"' + (b.confirmed_slot && slots.indexOf(b.confirmed_slot) < 0 ? ' selected' : '') + '>Another time…</option></select><input class="bother" type="datetime-local" value="' + (b.confirmed_slot && slots.indexOf(b.confirmed_slot) < 0 ? dt(b.confirmed_slot) : '') + '"' + (b.confirmed_slot && slots.indexOf(b.confirmed_slot) < 0 ? '' : ' hidden') + '></label>' +
            (b.mode === 'virtual' ? '<label class="f">Meeting link<input class="blink" type="url" placeholder="https://meet.google.com/…" value="' + E(b.meeting_link || '') + '"></label>' : '<span></span>') + '</div>' +
            '<label class="f">Private note (fee agreed, topics…)<textarea class="bnote" rows="2">' + E(b.teacher_note || '') + '</textarea></label>' +
            '<div class="cta"><button class="btn main sm" data-act="confirmed" type="button">Confirm</button><button class="btn sm" data-act="done" type="button">Mark completed</button><button class="btn sm" data-act="declined" type="button">Decline</button><button class="btn sm" data-act="save" type="button">Save note</button>' +
            '<a class="btn sm" data-reply="mail" href="#">✉ Email reply</a>' + (phone ? '<a class="btn sm" data-reply="wa" href="#" data-phone="' + E(phone) + '">WhatsApp</a>' : '') + '<button class="btn sm" data-act="delete" type="button">Delete</button></div></article>';
        }).join('') : '<p class="emptybox">No ' + (show === 'all' ? '' : (LBL[show] || '').toLowerCase() + ' ') + 'bookings.</p>');
      p.querySelectorAll('.bslot').forEach(function (sel) { sel.onchange = function () { sel.parentNode.querySelector('.bother').hidden = sel.value !== 'other'; }; });
      p.querySelectorAll('.bkcard').forEach(function (card) {
        var b = all.filter(function (x) { return x.id === card.getAttribute('data-id'); })[0];
        var slot = function () { var v = card.querySelector('.bslot').value; return v === 'other' ? iso(card.querySelector('.bother').value) : v; };
        var link = function () { var l = card.querySelector('.blink'); return l ? l.value.trim() : null; };
        var text = function (st) {
          var first = (b.booker === 'parent' ? b.contact_name : b.contact_name).split(' ')[0], when = slot() ? nice(slot()) : '';
          if (st === 'declined') return 'Dear ' + first + ',\n\nThank you for your request for ' + b.subject + ' lessons. Unfortunately I am not available at the times you suggested. Could you send me a few other times that suit you?\n\nBest wishes,\nLearnova';
          return 'Dear ' + first + ',\n\nThank you for booking ' + b.subject + ' lessons' + (b.student_name ? ' for ' + b.student_name : '') + '. I am happy to confirm your lesson on ' + when + ' (' + b.duration_min + ' minutes).\n\n' +
            (b.mode === 'virtual' ? 'Join here: ' + (link() || '[meeting link]') + '\n\n' : 'Venue: ' + (b.location || '[venue]') + '\n\n') + 'Fee: [fee]\n\nPlease reply if you need to change anything.\n\nBest wishes,\nLearnova';
        };
        card.querySelectorAll('[data-reply]').forEach(function (a) { a.onclick = function (e) { e.preventDefault();
          var st = b.status === 'declined' ? 'declined' : 'confirmed', t = text(st);
          if (a.getAttribute('data-reply') === 'mail') location.href = 'mailto:' + encodeURIComponent(b.email) + '?subject=' + encodeURIComponent((st === 'declined' ? 'Your lesson request: ' : 'Lesson confirmed: ') + b.subject) + '&body=' + encodeURIComponent(t);
          else window.open('https://wa.me/' + a.getAttribute('data-phone') + '?text=' + encodeURIComponent(t), '_blank', 'noopener'); }; });
        card.querySelectorAll('[data-act]').forEach(function (btn) { btn.onclick = function () {
          var act = btn.getAttribute('data-act'), note = card.querySelector('.bnote').value.trim() || null;
          if (act === 'delete') { if (!confirm('Delete this booking request for good?')) return; S.db.from('bookings').delete().eq('id', b.id).then(function (r) { if (ok(r, 'Booking deleted')) bookings(p, args); }); return; }
          var upd = { teacher_note: note, confirmed_slot: slot() || null, meeting_link: link() || null };
          if (act !== 'save') upd.status = act;
          if (act === 'confirmed' && !upd.confirmed_slot) { toast('Choose the lesson time first.', true); return; }
          S.db.from('bookings').update(upd).eq('id', b.id).then(function (r) {
            if (!ok(r, act === 'save' ? 'Saved' : 'Marked ' + (LBL[act] || act).toLowerCase() + (act === 'confirmed' ? ' — now send the reply' : ''))) return;
            if (act === 'confirmed' || act === 'declined') { b.status = act; b.confirmed_slot = upd.confirmed_slot; b.meeting_link = upd.meeting_link; card.className = 'bkcard ' + act; card.querySelector('.row2 > .pill:last-child').textContent = LBL[act]; var em = card.querySelector('[data-reply=mail]'); if (em) em.focus(); }
            else bookings(p, args);
          });
        }; });
      });
    });
  }
})();
