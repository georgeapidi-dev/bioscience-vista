/* IB Biology teaching plan · BioscienceVista · by George Apidi (22 Nov 2026)
   Every topic split into lessons that fit the IB guide's recommended hours (SL 110 h, HL 180 h).
   Students: their pathway (SL or HL, from their class), topics in syllabus order, each lesson's duration,
   completed and remaining hours, topic-quiz scores, topics to revise, and SL and HL progress kept apart.
   Teachers: the whole plan by theme, a class's completion and quiz averages, practicals and skills, and lesson
   durations they can adjust (saved on this device) with a warning when a topic or the course goes over the IB hours.
   Data: /assets/ib-bio-plan.json (built by lessongen/ibdeep/hours.py), lessons, learning_progress, quizzes, quiz_attempts. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var PAGES = { '/ib-chemistry-plan/': 'chem', '/ib-physics-plan/': 'phys', '/ib-ess-plan/': 'ess', '/ib-maths-aa-plan/': 'maa', '/ib-maths-ai-plan/': 'mai' };
  var SUBJ = PAGES[location.pathname.replace(/\/?$/, '/')] || 'bio';
  var KEY = 'bv-ibplan-mins' + (SUBJ === 'bio' ? '' : '-' + SUBJ), SHOWHL = 'bv-ibplan-showhl' + (SUBJ === 'bio' ? '' : '-' + SUBJ);
  var NAME = 'IB Biology';
  function hh(h) { return hm(Math.round(h * 60)); }
  function themeTitle(plan, th) { var p = plan.theme_prefix === undefined ? 'Theme ' : plan.theme_prefix, n = plan.themes[th]; return p + th + (n ? ': ' + n : ''); }
  var CSS = '.ip-hero{margin:8px 0 16px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#0F766E,#0369A1 55%,#4338CA)}.ip-hero h1{margin:4px 0 6px;color:#fff}.ip-hero p{margin:0;color:#fff;max-width:75ch}.ip-hero .vx-eye{color:#FEF3C7}' +
    '.ip-card{background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:16px;margin:0 0 14px}.ip-card h3{margin:0 0 8px}' +
    '.ip-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:0 0 14px}.ip-sum div{border-radius:14px;padding:12px;background:#F0F9FF;border:1px solid #BAE6FD}.ip-sum b{display:block;font-size:1.45rem}.ip-sum span{font-size:.85rem;color:#475569}' +
    '.ip-bar{height:10px;border-radius:99px;background:#E2E8F0;overflow:hidden;min-width:80px}.ip-bar i{display:block;height:100%;background:linear-gradient(90deg,#14B8A6,#0284C7)}' +
    '.ip-theme{margin:18px 0 6px;font-size:1.1rem}.ip-t{border:1px solid #E2E8F0;border-radius:14px;margin:0 0 8px;background:#fff}.ip-t>summary{cursor:pointer;list-style:none;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 14px}' +
    '.ip-t>summary::-webkit-details-marker{display:none}.ip-t .in{padding:0 14px 12px}.ip-l{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:7px 0;border-top:1px dashed #E2E8F0}' +
    '.ip-pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.75rem;font-weight:700;background:#E0F2FE;color:#075985;margin-left:4px}.ip-pill.hl{background:#FDE68A;color:#78350F}.ip-pill.rev{background:#FECACA;color:#991B1B}.ip-pill.ok{background:#BBF7D0;color:#166534}' +
    '.ip-m{color:#64748b;font-size:.86rem}.ip-warn{background:#FEF2F2;border:2px solid #FCA5A5;color:#7F1D1D;border-radius:12px;padding:10px 12px;margin:0 0 10px}.ip-in{width:70px;font:inherit;padding:3px 6px;border:1px solid #CBD5E1;border-radius:8px}' +
    '.ip-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}.ip-tabs button{font:inherit;font-weight:700;padding:7px 13px;border-radius:999px;border:2px solid #BAE6FD;background:#F0F9FF;color:#075985;cursor:pointer}.ip-tabs button.on{background:#0369A1;border-color:#0369A1;color:#fff}' +
    '.ip-tbl{width:100%;border-collapse:collapse;font-size:.9rem}.ip-tbl th,.ip-tbl td{padding:6px 8px;border-bottom:1px solid #F1F5F9;text-align:left}.ip-tbl th{background:#F8FAFC}' +
    '@media(max-width:640px){.ip-t>summary{grid-template-columns:1fr auto}.ip-t>summary .ip-bar{grid-column:1/-1;grid-row:2}.ip-l{grid-template-columns:1fr auto}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var q = function (p) { return p.then(function (r) { return r; }, function () { return { data: [] }; }); };
  function hm(min) { var h = Math.floor(min / 60), m = min % 60; return (h ? h + ' h' : '') + (m ? (h ? ' ' : '') + m + ' min' : (h ? '' : '0 min')); }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function bar(p) { return '<span class="ip-bar" title="' + p + '%"><i style="width:' + Math.min(100, p) + '%"></i></span>'; }
  function edits() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveEdits(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  var CODES = null;
  function codeOf(title) { if (CODES) { for (var i = 0; i < CODES.length; i++) if ((title || '').indexOf(CODES[i].p) === 0) return CODES[i].c; return null; } var m = /^([A-D][1-4]\.\d)\b/.exec(title || ''); return m ? m[1] : null; }

  S.guard(app, { anyone: true, allowPending: true, school: true }).then(function (me) {
    var teacher = me.staff || me.school || (me.roles || []).indexOf('teacher') >= 0;
    return Promise.all([
      fetch('/assets/ib-' + SUBJ + '-plan.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }),
      S.all(function () { return S.db.from('lessons').select('id,url,external_id').like('url', '/%-lesson%/'); }),
      S.all(function () { return S.db.from('quizzes').select('id,title'); })
    ]).then(function (x) {
      var plan = x[0], LID = {}, URL = {}; if (plan.name) { NAME = plan.name; document.title = NAME + ' teaching plan · BioscienceVista'; }
      if (SUBJ !== 'bio') CODES = plan.topics.map(function (t) { return { c: t.code, p: t.code + ' ' + t.name + ' · Topic quiz' }; });
      (x[1].data || []).forEach(function (l) { URL[l.url] = l.id; });
      plan.topics.forEach(function (t) { t.lessons.forEach(function (l) { l.lid = URL['/' + l.path + '/'] || null; l.base = l.minutes; if (l.lid) LID[l.lid] = l; }); t.practicals.forEach(function (p) { p.lid = URL['/' + p.path + '/'] || null; }); });
      var QZ = {}; (x[2].data || []).forEach(function (z) { var c = codeOf(z.title); if (c) QZ[z.id] = c; });
      var ctx = { me: me, plan: plan, LID: LID, QZ: QZ };
      applyEdits(plan);
      if (teacher) teacherView(ctx); else studentView(ctx);
    });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<section class="panel"><h2>The plan could not load</h2><p class="muted">Please refresh the page.</p></section>'; });

  function applyEdits(plan) { var ed = edits(); plan.topics.forEach(function (t) { t.lessons.forEach(function (l) { l.minutes = ed[l.id] ? +ed[l.id] : l.base; }); }); }
  function lessonsFor(t, hl) { return t.lessons.filter(function (l) { return hl || l.level !== 'HL'; }); }
  function guideMin(t, hl) { return Math.round((hl ? t.hl_hours : t.sl_hours) * 60); }

  /* progress: lesson id → { status, percent } ; quiz scores: topic code → [pct, …] */
  function topicStats(t, hl, prog, qs) {
    var ls = lessonsFor(t, hl), tot = 0, done = 0, pc = 0;
    ls.forEach(function (l) { tot += l.minutes; var p = l.lid && prog[l.lid]; if (p && (p.status === 'completed' || p.percent >= 100)) done += l.minutes; pc += p ? Math.min(100, p.percent || 0) : 0; });
    var sc = qs[t.code] || [], avg = sc.length ? Math.round(sc.reduce(function (a, b) { return a + b; }, 0) / sc.length) : null;
    var started = ls.some(function (l) { return l.lid && prog[l.lid]; });
    return { n: ls.length, tot: tot, done: done, left: tot - done, avgPc: ls.length ? Math.round(pc / ls.length) : 0, quiz: avg, revise: (avg !== null && avg < 50) || (started && ls.some(function (l) { var p = l.lid && prog[l.lid]; return p && p.status !== 'completed' && (p.percent || 0) < 50; }) && avg !== null && avg < 65) };
  }

  /* ---------- student ---------- */
  function studentView(c) {
    var me = c.me, cls = (me.classes || []).concat(me.cls ? [me.cls] : []), isC = function (lv) { var n = c.plan.class_names ? c.plan.class_names[lv] : 'IB Biology ' + lv, id = c.plan.classes ? c.plan.classes[lv] : 'bio-' + lv.toLowerCase(); return cls.some(function (k) { var nm = k.name || ''; return nm === n || nm.indexOf(n + ' ') === 0 || k.slug === id || k.site_slug === id; }); }, hlClass = isC('HL'), slClass = isC('SL');
    var path = hlClass ? 'HL' : slClass ? 'SL' : null, showHL = path === 'HL';
    if (path === 'SL') { try { showHL = localStorage.getItem(SHOWHL) === '1'; } catch (e) {} }
    var pick = null; try { pick = localStorage.getItem('bv-ibplan-path'); } catch (e) {}
    if (!path) { path = pick === 'HL' ? 'HL' : 'SL'; showHL = path === 'HL'; }
    Promise.all([q(S.db.from('learning_progress').select('lesson_id,status,percent').eq('student_id', me.user.id)),
      q(S.all(function () { return S.db.from('quiz_attempts').select('quiz_id,score,max_score,status').eq('student_id', me.user.id).neq('status', 'in_progress'); }))]).then(function (y) {
      var prog = {}; (y[0].data || []).forEach(function (p) { prog[p.lesson_id] = p; });
      var qs = {}; (y[1].data || []).forEach(function (a) { var k = c.QZ[a.quiz_id]; if (k && a.max_score) (qs[k] = qs[k] || []).push(Math.round(100 * a.score / a.max_score)); });
      draw();
      function draw() {
        var plan = c.plan, hlView = showHL || path === 'HL';
        var sum = { SL: { tot: 0, done: 0 }, HL: { tot: 0, done: 0 } }, rev = [];
        plan.topics.forEach(function (t) { ['SL', 'HL'].forEach(function (lv) { if (lv === 'SL' && t.hl_only) return; var s = topicStats(t, lv === 'HL', prog, qs); sum[lv].tot += s.tot; sum[lv].done += s.done; }); var s2 = topicStats(t, path === 'HL', prog, qs); if (s2.revise && !(t.hl_only && path === 'SL')) rev.push(t); });
        var mine = sum[path], h = '<section class="ip-hero"><p class="vx-eye">' + E(NAME) + ' · ' + (path === 'HL' ? 'Higher Level' : 'Standard Level') + ' pathway</p><h1>📅 My ' + E(NAME) + ' plan</h1><p>Every topic, in syllabus order, split into lessons that fit the IB recommended hours (' + plan.totals[path] + ' h at ' + path + '). Tick off lessons as you finish them; your SL and HL progress are counted separately.</p></section>';
        if (!slClass && !hlClass) h += '<div class="ip-card"><b>Which course are you taking?</b> <span class="ip-m">You are not in an ' + E(NAME) + ' class, so choose your pathway.</span><div class="ip-tabs" style="margin-top:8px"><button type="button" data-path="SL" class="' + (path === 'SL' ? 'on' : '') + '">Standard Level</button><button type="button" data-path="HL" class="' + (path === 'HL' ? 'on' : '') + '">Higher Level</button></div></div>';
        h += '<div class="ip-sum"><div><b>' + pct(mine.done, mine.tot) + '%</b><span>Overall ' + path + ' progress</span></div><div><b>' + hm(mine.done) + '</b><span>Completed</span></div><div><b>' + hm(mine.tot - mine.done) + '</b><span>Remaining</span></div>' +
          '<div><b>' + pct(sum.SL.done, sum.SL.tot) + '%</b><span>SL content done</span></div>' + (path === 'HL' || showHL ? '<div><b>' + pct(sum.HL.done, sum.HL.tot) + '%</b><span>Full HL content done</span></div>' : '') + '<div><b>' + rev.length + '</b><span>Topics to revise</span></div></div>';
        if (path === 'SL') h += '<label class="ip-m" style="display:block;margin:0 0 10px"><input type="checkbox" id="ip-showhl"' + (showHL ? ' checked' : '') + '> Also show Higher Level (HL only) lessons, marked <span class="ip-pill hl">HL</span>. They do not count towards your SL progress.</label>';
        if (rev.length) h += '<div class="ip-card"><h3>🔁 Topics to revise</h3><p class="ip-m">Topic-quiz average under 50%, or lessons left under half done with a quiz average under 65%.</p>' + rev.map(function (t) { return '<a class="ip-pill rev" href="#t-' + E(t.code) + '">' + E(t.code + ' ' + t.name) + '</a>'; }).join(' ') + '</div>';
        var th = null;
        plan.topics.forEach(function (t) {
          if (t.hl_only && !hlView) return;
          if (t.theme !== th) { th = t.theme; h += '<h2 class="ip-theme">' + E(themeTitle(plan, th)) + '</h2>'; }
          var s = topicStats(t, path === 'HL', prog, qs), shown = lessonsFor(t, hlView);
          h += '<details class="ip-t" id="t-' + E(t.code) + '"><summary><span><b>' + E(t.code + ' ' + t.name) + '</b>' + (t.hl_only ? '<span class="ip-pill hl">HL only</span>' : '') + (s.revise ? '<span class="ip-pill rev">Revise</span>' : '') +
            '<br><span class="ip-m">' + s.n + ' lesson' + (s.n === 1 ? '' : 's') + ' · ' + hm(s.tot) + ' · ' + hm(s.done) + ' done, ' + hm(s.left) + ' left' + (s.quiz !== null ? ' · quizzes ' + s.quiz + '%' : '') + '</span></span>' + bar(pct(s.done, s.tot)) + '<span class="ip-m">' + pct(s.done, s.tot) + '%</span></summary><div class="in">' +
            '<p class="ip-m">IB hours: SL ' + hh(t.sl_hours) + (t.ahl_hours ? ' · additional HL ' + hh(t.ahl_hours) + ' (HL total ' + hh(t.hl_hours) + ')' : '') + '</p>' +
            shown.map(function (l) { var p = l.lid && prog[l.lid], d = p && (p.status === 'completed' || p.percent >= 100);
              return '<div class="ip-l"><span><a href="/' + E(l.path) + '/"><b>L' + l.n + ' · ' + E(l.title) + '</b></a>' + (l.level === 'HL' ? '<span class="ip-pill hl">HL</span>' : '<span class="ip-pill">SL &amp; HL</span>') + '<br><span class="ip-m">' + E(l.range) + ' · ' + E(l.hour) + (l.minutes > 75 ? ' · taught over 2 sessions' : '') + '</span></span><span class="ip-m">' + l.minutes + ' min</span><span>' + (d ? '<span class="ip-pill ok">Done ✓</span>' : p ? '<span class="ip-pill">' + (p.percent || 0) + '%</span>' : '<span class="ip-m">Not started</span>') + '</span></div>'; }).join('') +
            (t.practicals.length ? '<p class="ip-m" style="margin-top:8px">🧪 Practical: ' + t.practicals.map(function (p) { return '<a href="/' + E(p.path) + '/">' + E(p.title) + '</a>'; }).join(', ') + '</p>' : '') + '</div></details>';
        });
        h += '<p class="ip-m">' + E(plan.source) + '</p>';
        app.innerHTML = h;
        var cb = document.getElementById('ip-showhl'); if (cb) cb.onchange = function () { showHL = cb.checked; try { localStorage.setItem(SHOWHL, showHL ? '1' : '0'); } catch (e) {} draw(); };
        app.querySelectorAll('[data-path]').forEach(function (b) { b.onclick = function () { path = b.getAttribute('data-path'); showHL = path === 'HL'; try { localStorage.setItem('bv-ibplan-path', path); } catch (e) {} draw(); }; });
      }
    });
  }

  /* ---------- teacher ---------- */
  function teacherView(c) {
    var plan = c.plan, level = 'HL', cid = null, CLS = [], prog = {}, qs = {}, nStu = 0;
    q(S.db.from('classes').select('id,name,site_slug,owner_kind,archived_at').ilike('name', '%' + NAME + '%')).then(function (r) {
      CLS = (r.data || []).filter(function (k) { return !k.archived_at; });
      draw();
    });
    function loadClass() {
      prog = {}; qs = {}; nStu = 0;
      if (!cid) { draw(); return; }
      app.querySelector('#ip-status') && (app.querySelector('#ip-status').textContent = 'Loading class results…');
      Promise.all([q(S.db.from('enrolments').select('student_id').eq('class_id', cid).eq('status', 'approved')), q(S.db.from('profiles').select('id').eq('class_id', cid))]).then(function (y) {
        var ids = {}; (y[0].data || []).forEach(function (e) { ids[e.student_id] = 1; }); (y[1].data || []).forEach(function (p) { ids[p.id] = 1; }); ids = Object.keys(ids); nStu = ids.length;
        if (!ids.length) { draw(); return; }
        Promise.all([q(S.all(function () { return S.db.from('learning_progress').select('student_id,lesson_id,status,percent').in('student_id', ids); })),
          q(S.all(function () { return S.db.from('quiz_attempts').select('student_id,quiz_id,score,max_score,status').in('student_id', ids).neq('status', 'in_progress'); }))]).then(function (z) {
          (z[0].data || []).forEach(function (p) { if (!c.LID[p.lesson_id]) return; var o = prog[p.lesson_id] = prog[p.lesson_id] || { done: 0, pc: 0 }; if (p.status === 'completed' || p.percent >= 100) o.done++; o.pc += Math.min(100, p.percent || 0); });
          (z[1].data || []).forEach(function (a) { var k = c.QZ[a.quiz_id]; if (k && a.max_score) (qs[k] = qs[k] || []).push(Math.round(100 * a.score / a.max_score)); });
          draw();
        });
      });
    }
    function draw() {
      var hl = level === 'HL', ed = edits(), total = 0, over = [], g = plan.totals[level] * 60;
      plan.topics.forEach(function (t) { if (t.hl_only && !hl) return; var m = lessonsFor(t, hl).reduce(function (a, l) { return a + l.minutes; }, 0); total += m; if (m > guideMin(t, hl)) over.push(t.code + ' (' + hm(m) + ' planned, IB ' + hm(guideMin(t, hl)) + ')'); });
      var h = '<section class="ip-hero"><p class="vx-eye">Teacher planning view</p><h1>📅 ' + E(NAME) + ' teaching plan</h1><p>Each topic split into lessons that fit the IB guide\'s recommended hours: SL ' + plan.totals.SL + ' h and HL ' + plan.totals.HL + ' h of syllabus content' + (plan.totals.experimental ? ' (plus ' + plan.totals.experimental.SL + ' h / ' + plan.totals.experimental.HL + ' h for the experimental programme)' : '') + '. Change any lesson\'s minutes; you are warned if a topic or the course goes over the IB hours.</p></section>';
      h += '<div class="ip-card"><div class="ip-tabs"><button type="button" data-lv="SL" class="' + (!hl ? 'on' : '') + '">Standard Level</button><button type="button" data-lv="HL" class="' + (hl ? 'on' : '') + '">Higher Level</button></div>' +
        '<label>Class results: <select id="ip-cls"><option value="">No class (plan only)</option>' + CLS.map(function (k) { return '<option value="' + E(k.id) + '"' + (k.id === cid ? ' selected' : '') + '>' + E(k.name) + '</option>'; }).join('') + '</select></label> <span id="ip-status" class="ip-m">' + (cid ? nStu + ' student' + (nStu === 1 ? '' : 's') : '') + '</span></div>';
      if (total > g || over.length) h += '<div class="ip-warn"><b>⚠ Over the IB recommendation.</b> ' + (total > g ? 'The ' + level + ' course is planned at ' + hm(total) + ', more than the IB ' + plan.totals[level] + ' h. ' : '') + (over.length ? 'Topics over their hours: ' + E(over.join('; ')) + '.' : '') + '</div>';
      var nL = 0, comp = 0, cnt = 0; plan.topics.forEach(function (t) { if (t.hl_only && !hl) return; lessonsFor(t, hl).forEach(function (l) { nL++; var p = l.lid && prog[l.lid]; if (nStu) { comp += p ? p.done : 0; cnt += nStu; } }); });
      h += '<div class="ip-sum"><div><b>' + hm(total) + '</b><span>Planned (' + level + ')</span></div><div><b>' + plan.totals[level] + ' h</b><span>IB recommendation</span></div><div><b>' + nL + '</b><span>Lessons</span></div><div><b>' + plan.topics.filter(function (t) { return hl || !t.hl_only; }).length + '</b><span>Topics</span></div>' + (nStu ? '<div><b>' + pct(comp, cnt) + '%</b><span>Class lesson completion</span></div>' : '') + '</div>';
      if (plan.differences && plan.differences.length) h += '<p class="ip-m">Hours checked against the IB guide: ' + plan.differences.map(function (d) { return E(d.topic + ': guide says ' + d.guide + ', so ' + d.used + ' is used'); }).join('; ') + '.</p>';
      if (Object.keys(ed).length) h += '<p class="ip-m">You changed ' + Object.keys(ed).length + ' lesson duration(s) on this device. <button type="button" class="btn sm" id="ip-reset">Reset to the plan</button></p>';
      var th = null;
      plan.topics.forEach(function (t) {
        if (t.hl_only && !hl) return;
        if (t.theme !== th) { th = t.theme; var tm = 0; plan.topics.forEach(function (u) { if (u.theme === th && (hl || !u.hl_only)) tm += guideMin(u, hl); }); h += '<h2 class="ip-theme">' + E(themeTitle(plan, th)) + ' <span class="ip-m">· IB ' + hm(tm) + '</span></h2>'; }
        var ls = lessonsFor(t, hl), m = ls.reduce(function (a, l) { return a + l.minutes; }, 0), gm = guideMin(t, hl), sc = qs[t.code] || [], avg = sc.length ? Math.round(sc.reduce(function (a, b) { return a + b; }, 0) / sc.length) : null;
        var cd = 0; ls.forEach(function (l) { var p = l.lid && prog[l.lid]; cd += p ? p.done : 0; }); var cpc = nStu ? pct(cd, nStu * ls.length) : 0;
        h += '<details class="ip-t"><summary><span><b>' + E(t.code + ' ' + t.name) + '</b>' + (t.hl_only ? '<span class="ip-pill hl">HL only</span>' : '') + (m > gm ? '<span class="ip-pill rev">Over by ' + hm(m - gm) + '</span>' : '') + (avg !== null && avg < 50 ? '<span class="ip-pill rev">Quiz avg ' + avg + '%</span>' : '') +
          '<br><span class="ip-m">IB: SL ' + hh(t.sl_hours) + (t.ahl_hours ? ' + AHL ' + hh(t.ahl_hours) + ' = ' + hh(t.hl_hours) : '') + ' · planned ' + hm(m) + ' in ' + ls.length + ' lesson' + (ls.length === 1 ? '' : 's') + (avg !== null ? ' · quiz avg ' + avg + '% (' + sc.length + ')' : '') + '</span></span>' + (nStu ? bar(cpc) + '<span class="ip-m">' + cpc + '% done</span>' : '<span></span><span></span>') + '</summary><div class="in">' +
          '<table class="ip-tbl"><thead><tr><th>Lesson</th><th>Level</th><th>Understandings</th><th>Minutes</th>' + (nStu ? '<th>Completed</th>' : '') + '</tr></thead><tbody>' +
          ls.map(function (l) { var p = l.lid && prog[l.lid];
            return '<tr><td><a href="/' + E(l.path) + '/">L' + l.n + ' · ' + E(l.title) + '</a><br><span class="ip-m">' + E(l.hour) + (l.minutes > 75 ? ' · 2 sessions' : '') + '</span></td><td>' + (l.level === 'HL' ? '<span class="ip-pill hl">HL only</span>' : 'SL &amp; HL') + '</td><td class="ip-m">' + E(l.range) + '</td>' +
              '<td><input class="ip-in" type="number" min="15" max="300" step="5" data-min="' + E(l.id) + '" value="' + l.minutes + '" aria-label="Minutes for lesson ' + l.n + '">' + (l.minutes !== l.base ? '<br><span class="ip-m">plan ' + l.base + '</span>' : '') + '</td>' + (nStu ? '<td>' + (p ? p.done : 0) + '/' + nStu + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table>' +
          (t.skills.length ? '<p class="ip-m"><b>Application of skills:</b> ' + t.skills.map(function (s) { return E(s.code + ' ' + s.text) + (s.level === 'HL' ? ' (HL)' : ''); }).join('; ') + '</p>' : '') +
          (t.practicals.length ? '<p class="ip-m"><b>🧪 Practicals:</b> ' + t.practicals.map(function (p) { return '<a href="/' + E(p.path) + '/">' + E(p.title) + '</a>'; }).join(', ') + '</p>' : '') + '</div></details>';
      });
      h += '<p class="ip-m">' + E(plan.source) + ' Duration changes are saved in this browser only.</p>';
      var open = {}; app.querySelectorAll('details.ip-t[open] b').forEach(function (b) { open[b.textContent] = 1; });
      app.innerHTML = h;
      app.querySelectorAll('details.ip-t').forEach(function (d) { var b = d.querySelector('b'); if (b && open[b.textContent]) d.open = true; });
      app.querySelectorAll('[data-lv]').forEach(function (b) { b.onclick = function () { level = b.getAttribute('data-lv'); draw(); }; });
      var sel = document.getElementById('ip-cls'); sel.onchange = function () { cid = sel.value || null; var k = CLS.filter(function (x) { return x.id === cid; })[0]; if (k) level = /SL/.test(k.name) ? 'SL' : 'HL'; loadClass(); };
      var rs = document.getElementById('ip-reset'); if (rs) rs.onclick = function () { saveEdits({}); applyEdits(plan); draw(); };
      app.querySelectorAll('[data-min]').forEach(function (inp) { inp.onchange = function () { var v = Math.round(+inp.value / 5) * 5; if (!(v >= 15 && v <= 300)) { inp.value = ''; return; } var o = edits(), id = inp.getAttribute('data-min'), l = null;
        plan.topics.forEach(function (t) { t.lessons.forEach(function (x) { if (x.id === id) l = x; }); }); if (!l) return; if (v === l.base) delete o[id]; else o[id] = v; saveEdits(o); applyEdits(plan); draw(); }; });
    }
  }
})();
