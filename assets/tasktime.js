/* BioscienceVista · Time on tasks (/time/?class=ID&n=NAME). For teachers.
   Shows, for one class, the time allowance of every task (interactive lessons, exam-style sets, examinations) and the time
   each student has spent on it. The teacher can change the allowance for the class; students see the new time the next
   time they open the task. Data comes from class_time_report() and is changed with set_task_time() (migration 037);
   both check on the server that the person teaches the class. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var QS = new URLSearchParams(location.search), CLS = /^[0-9a-f-]{36}$/.test(QS.get('class') || '') ? QS.get('class') : null, CNAME = (QS.get('n') || '').slice(0, 80);
  var me, DATA = null, VIEW = 'task', FILTER = { q: '', kind: '', seen: true }, OPEN = {};
  var CSS = '.tt-row{border:1px solid var(--line,#dde3ea);border-left:6px solid var(--k,#4f46e5);border-radius:14px;background:var(--card,#fff);padding:12px 14px;margin:10px 0}' +
    '.tt-top{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;justify-content:space-between}.tt-top h4{margin:0;font-size:1.02rem;overflow-wrap:anywhere}.tt-top h4 a{color:inherit}' +
    '.tt-set{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.tt-set input{width:74px;font:inherit;font-weight:700;padding:6px 8px;border:2px solid #c7d2fe;border-radius:10px;text-align:center}' +
    '.tt-meta{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 0}.tt-chip{font:600 .8rem system-ui;border-radius:999px;padding:3px 10px;background:#eef2ff;color:#3730a3}.tt-chip.g{background:#dcfce7;color:#166534}.tt-chip.a{background:#fef3c7;color:#92400e}.tt-chip.r{background:#fee2e2;color:#991b1b}.tt-chip.p{background:#fae8ff;color:#86198f}' +
    '.tt-st{display:grid;grid-template-columns:minmax(120px,30%) 1fr auto;gap:10px;align-items:center;padding:6px 0;border-top:1px dashed var(--line,#dde3ea);font-size:.93rem}.tt-st .b{height:14px;border-radius:8px;background:#e2e8f0;overflow:hidden}' +
    '.tt-st .b i{display:block;height:100%;background:#22c55e}.tt-st.over .b i{background:#ef4444}.tt-st.none{color:#64748b}.tt-st small{color:#64748b}' +
    '.tt-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0}.tt-tools input[type=search],.tt-tools select{font:inherit;padding:8px 10px;border:1px solid var(--line,#cbd5e1);border-radius:10px;min-width:150px}' +
    '.tt-more{all:unset;cursor:pointer;color:#4338ca;font-weight:700;font-size:.9rem}.tt-more:focus-visible{outline:3px solid #a5b4fc;border-radius:6px}@media (max-width:560px){.tt-st{grid-template-columns:1fr auto}.tt-st .b{grid-column:1 / -1;order:3}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var missing = function (e) { return /class_time_report|set_task_time|task_time|schema cache|does not exist|PGRST20/.test(String(e && (e.message || e.code) || e)); };
  var KIND = { lesson: ['🧪', 'Interactive lesson', '#0d9488'], quiz: ['📝', 'Exam-style questions', '#7c3aed'], exam: ['🎓', 'Examination', '#db2777'] };
  function dur(s) { s = Math.max(0, Math.round(s || 0)); if (s < 60) return s + ' s'; var m = Math.floor(s / 60); if (m < 60) return m + ' min' + (m < 10 && s % 60 ? ' ' + (s % 60) + ' s' : ''); return Math.floor(m / 60) + ' h ' + ('0' + m % 60).slice(-2) + ' min'; }
  function day(t) { if (!t) return ''; var d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
  function kindOf(t) { return t.kind === 'quiz' && t.group === 'Examinations' ? 'exam' : t.kind; }
  function allow(t) { return t.minutes || t.standard; }

  S.guard(app, { school: true, anyone: true }).then(function (m) {
    me = m; var teach = m.admin || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0;
    if (!teach) { app.innerHTML = '<section class="panel"><h2>⏱ Time on tasks</h2><p>This page is for teachers. Your own timer starts by itself when you open a lesson, a question set or an examination.</p><p><a class="btn main" href="/dashboard/">Go to my dashboard</a></p></section>'; return; }
    if (CLS) load(); else pick();
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function head(sub) {
    return '<div class="row2 cband" style="--k:#0ea5e9"><div><p class="label">Time on tasks</p><h2 style="margin:0">⏱ ' + E(sub) + '</h2></div>' + (CLS ? '<a class="btn sm" href="/time/">Choose another class</a>' : '') + '</div>';
  }
  function pick() {
    var q = S.db.from('classes').select('id,name,teacher_id').is('archived_at', null).order('name'); if (!me.admin) q = q.eq('teacher_id', me.user.id);
    q.then(function (r) { var cs = r.data || [], mine = cs.filter(function (c) { return c.teacher_id === me.user.id; }), rest = cs.filter(function (c) { return c.teacher_id !== me.user.id; });
      var btns = function (a) { return '<div class="cta" style="justify-content:flex-start">' + a.map(function (c) { return '<a class="btn" href="/time/?class=' + c.id + '&n=' + encodeURIComponent(c.name) + '">' + E(c.name) + '</a>'; }).join('') + '</div>'; };
      app.innerHTML = head('How long did each student spend?') + '<section class="panel"><h3>Choose a class</h3>' + (mine.length ? btns(mine) : '<p class="muted">You have no classes yet. Create one in My classes.</p>') +
        (rest.length ? '<details style="margin-top:12px"><summary>Other classes on the site (' + rest.length + ')</summary>' + btns(rest) + '</details>' : '') + '</section>' + how(); });
  }
  function how() {
    return '<section class="panel tint small"><b>How the timer works</b><ul><li>The timer starts by itself when a student opens a lesson, a set of exam-style questions or an examination.</li>' +
      '<li><b>Lessons and exam-style sets:</b> only the time with the page in view is counted. When the time is used up the student is told and can still finish; the extra time is shown here.</li>' +
      '<li><b>Examinations:</b> the clock runs from the start and the examination is handed in when the time runs out.</li>' +
      '<li>Change the time for your class in the box beside any task. Students get the new time the next time they open it.</li></ul></section>';
  }
  function notReady() { app.innerHTML = head(CNAME || 'Time on tasks') + '<section class="panel"><p>Timers and time records are being switched on and will be ready here shortly.</p></section>' + how(); }

  function load() {
    app.innerHTML = head(CNAME || 'Class') + '<p class="muted">Loading the times…</p>';
    S.db.rpc('class_time_report', { cid: CLS }).then(function (r) {
      if (r.error) { if (missing(r.error)) return notReady(); app.innerHTML = head(CNAME || 'Class') + '<p class="msg">' + E(S.nice(r.error)) + '</p>'; return; }
      DATA = r.data || { students: [], tasks: [], times: [] }; DATA.by = {};
      (DATA.times || []).forEach(function (t) { (DATA.by[t.k + '|' + t.r] = DATA.by[t.k + '|' + t.r] || {})[t.s] = t; });
      draw();
    }, function (e) { if (missing(e)) notReady(); else app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  }
  function rowsFor(t) { return DATA.by[t.kind + '|' + t.ref] || {}; }
  function draw() {
    var tasks = DATA.tasks || [], studs = DATA.students || [], times = DATA.times || [];
    var totalSec = times.reduce(function (a, t) { return a + (t.sec || 0); }, 0), opened = Object.keys(DATA.by).length, custom = tasks.filter(function (t) { return t.minutes; }).length;
    app.innerHTML = head(CNAME || 'Class') +
      '<div class="stats"><div class="stat"><span class="small muted">Students</span><b>' + studs.length + '</b></div><div class="stat"><span class="small muted">Tasks opened</span><b>' + opened + ' / ' + tasks.length + '</b></div>' +
      '<div class="stat"><span class="small muted">Time on tasks, whole class</span><b>' + dur(totalSec) + '</b></div><div class="stat"><span class="small muted">Times you changed</span><b>' + custom + '</b></div></div>' +
      '<nav class="tabs" aria-label="View"><a href="#" data-view="task" aria-selected="' + (VIEW === 'task') + '">📋 By task</a><a href="#" data-view="student" aria-selected="' + (VIEW === 'student') + '">👥 By student</a></nav>' +
      '<div id="tt-body"></div>' + how();
    app.querySelectorAll('[data-view]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); VIEW = a.getAttribute('data-view'); draw(); }; });
    if (VIEW === 'task') byTask(); else byStudent();
  }

  // ------------------------------------------------------------ by task
  function byTask() {
    var body = app.querySelector('#tt-body');
    body.innerHTML = '<div class="tt-tools"><input type="search" id="tq" placeholder="Find a task…" aria-label="Find a task" value="' + E(FILTER.q) + '">' +
      '<select id="tk" aria-label="Kind of task"><option value="">All kinds</option><option value="lesson">🧪 Interactive lessons</option><option value="quiz">📝 Exam-style questions</option><option value="exam">🎓 Examinations</option></select>' +
      '<label class="chk"><input type="checkbox" id="ts"' + (FILTER.seen ? ' checked' : '') + '> Only tasks students have opened or you have timed</label></div><div id="tt-list"></div>';
    body.querySelector('#tk').value = FILTER.kind;
    body.querySelector('#tq').oninput = function () { FILTER.q = this.value; list(); };
    body.querySelector('#tk').onchange = function () { FILTER.kind = this.value; list(); };
    body.querySelector('#ts').onchange = function () { FILTER.seen = this.checked; list(); };
    list();
  }
  function list() {
    var box = app.querySelector('#tt-list'), q = FILTER.q.trim().toLowerCase(), all = DATA.tasks || [];
    var show = all.filter(function (t) { return (!FILTER.kind || kindOf(t) === FILTER.kind) && (!q || (t.title + ' ' + (t.group || '')).toLowerCase().indexOf(q) >= 0) && (!FILTER.seen || t.minutes || Object.keys(rowsFor(t)).length); });
    if (!show.length) {
      box.innerHTML = '<p class="emptybox">' + (all.length && FILTER.seen && !q && !FILTER.kind ? 'No student has opened a task yet. Untick the box above to see every task and set its time.' : 'No task matches.') + '</p>'; return; }
    var more = show.length > 60; if (more) show = show.slice(0, 60);
    box.innerHTML = show.map(card).join('') + (more ? '<p class="small muted">Showing the first 60. Type in the search box to find a task.</p>' : '');
    box.querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () { save(b.getAttribute('data-save'), false); }; });
    box.querySelectorAll('[data-reset]').forEach(function (b) { b.onclick = function () { save(b.getAttribute('data-reset'), true); }; });
    box.querySelectorAll('[data-more]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-more'); OPEN[k] = !OPEN[k]; list(); }; });
    box.querySelectorAll('.tt-set input').forEach(function (i) { i.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); save(i.getAttribute('data-for'), false); } }; });
  }
  function card(t) {
    var key = t.kind + '|' + t.ref, K = KIND[kindOf(t)], rows = rowsFor(t), ids = Object.keys(rows), lim = allow(t) * 60;
    var secs = ids.map(function (i) { return rows[i].sec || 0; }), sum = secs.reduce(function (a, b) { return a + b; }, 0), over = secs.filter(function (s) { return s > lim; }).length;
    var h = '<article class="tt-row" style="--k:' + K[2] + '"><div class="tt-top"><div><h4>' + K[0] + ' <a href="' + E(t.url || '#') + '">' + E(t.title) + '</a></h4><span class="small muted">' + E(K[1] + (t.group && t.kind === 'lesson' ? ' · ' + t.group : '')) + '</span></div>' +
      '<div class="tt-set"><label class="small" for="m-' + E(key) + '">Time for this class</label><input id="m-' + E(key) + '" data-for="' + E(key) + '" type="number" min="1" max="600" step="1" inputmode="numeric" value="' + allow(t) + '"> <span class="small">min</span>' +
      '<button class="btn sm main" type="button" data-save="' + E(key) + '">Save</button>' + (t.minutes ? '<button class="btn sm" type="button" data-reset="' + E(key) + '" title="Go back to the standard time">Standard (' + t.standard + ')</button>' : '') + '</div></div>' +
      '<div class="tt-meta"><span class="tt-chip' + (t.minutes ? ' p' : '') + '">' + (t.minutes ? 'Your time: ' + t.minutes + ' min' : 'Standard time: ' + t.standard + ' min') + '</span>' +
      '<span class="tt-chip g">Opened by ' + ids.length + ' of ' + DATA.students.length + '</span>' + (ids.length ? '<span class="tt-chip">Average ' + dur(sum / ids.length) + '</span><span class="tt-chip">Longest ' + dur(Math.max.apply(null, secs)) + '</span>' : '') +
      (over ? '<span class="tt-chip r">' + over + ' over the time</span>' : '') + '<span class="msg small" id="s-' + E(key) + '" role="status"></span></div>';
    if (DATA.students.length) h += '<p style="margin:8px 0 0"><button class="tt-more" type="button" data-more="' + E(key) + '" aria-expanded="' + !!OPEN[key] + '">' + (OPEN[key] ? '▾ Hide the students' : '▸ Show each student') + '</button></p>';
    if (OPEN[key]) h += DATA.students.map(function (s) { return line(s.name, rows[s.id], lim); }).join('');
    return h + '</article>';
  }
  function line(name, r, lim) {
    if (!r) return '<div class="tt-st none"><span>' + E(name) + '</span><span class="b"></span><span>Not opened</span></div>';
    var over = r.sec > lim, pct = Math.min(100, Math.round(100 * r.sec / Math.max(lim, 1)));
    return '<div class="tt-st' + (over ? ' over' : '') + '"><span>' + E(name) + '</span><span class="b" title="' + pct + '% of the time"><i style="width:' + pct + '%"></i></span>' +
      '<span><b>' + dur(r.sec) + '</b>' + (over ? ' <span class="tt-chip r">+' + dur(r.sec - lim) + '</span>' : '') + (r.done === true ? ' <span class="tt-chip g">handed in</span>' : r.done === false ? ' <span class="tt-chip a">not handed in</span>' : '') +
      '<br><small>' + (r.est ? 'start to hand-in · ' : '') + 'opened ' + (r.n || 1) + '× · last ' + E(day(r.last)) + '</small></span></div>';
  }
  function save(key, reset) {
    var i = key.indexOf('|'), kind = key.slice(0, i), ref = key.slice(i + 1), t = (DATA.tasks || []).filter(function (x) { return x.kind === kind && x.ref === ref; })[0]; if (!t) return;
    var inp = document.getElementById('m-' + key), msg = document.getElementById('s-' + key), v = reset ? null : parseInt(inp.value, 10);
    if (!reset && !(v >= 1 && v <= 600)) { msg.textContent = 'Type a time from 1 to 600 minutes.'; inp.focus(); return; }
    msg.textContent = 'Saving…';
    S.db.rpc('set_task_time', { cid: CLS, k: kind, r: ref, mins: v }).then(function (r) {
      if (r.error) { msg.textContent = S.nice(r.error); return; }
      t.minutes = reset ? null : v; list(); var m2 = document.getElementById('s-' + key); if (m2) m2.textContent = reset ? 'Back to the standard time.' : 'Saved: ' + v + ' minutes for this class.';
    }, function (e) { msg.textContent = S.nice(e); });
  }

  // ------------------------------------------------------------ by student
  function byStudent() {
    var body = app.querySelector('#tt-body'), tasks = DATA.tasks || [], T = {}; tasks.forEach(function (t) { T[t.kind + '|' + t.ref] = t; });
    if (!DATA.students.length) { body.innerHTML = '<p class="emptybox">No students have joined this class yet.</p>'; return; }
    body.innerHTML = DATA.students.map(function (s) {
      var mine = (DATA.times || []).filter(function (x) { return x.s === s.id && T[x.k + '|' + x.r]; }).sort(function (a, b) { return String(b.last || '').localeCompare(String(a.last || '')); });
      var sum = mine.reduce(function (a, x) { return a + (x.sec || 0); }, 0), over = mine.filter(function (x) { return x.sec > allow(T[x.k + '|' + x.r]) * 60; }).length;
      return '<details class="tt-row" style="--k:#0ea5e9"><summary><b>' + E(s.name) + '</b> <span class="tt-chip g">' + mine.length + ' task' + (mine.length === 1 ? '' : 's') + ' opened</span> <span class="tt-chip">' + dur(sum) + ' in total</span>' + (over ? ' <span class="tt-chip r">' + over + ' over the time</span>' : '') + '</summary>' +
        (mine.length ? mine.map(function (x) { var t = T[x.k + '|' + x.r]; return line(KIND[kindOf(t)][0] + ' ' + t.title, x, allow(t) * 60); }).join('') : '<p class="small muted">Has not opened a task yet.</p>') + '</details>';
    }).join('');
  }
})();
