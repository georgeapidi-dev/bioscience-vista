/* Student dashboard · Learnova */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  S.guard(app, { allowPending: true }).then(function (me) {
    if (!me.staff && me.profile.approved === false && me.cls) { app.innerHTML = S.pendingBox(me); return; }
    if (me.staff && !new URLSearchParams(location.search).get('student')) { location.href = '/staff/'; return; }
    return Promise.all([
      S.db.from('student_results').select('*').eq('student_id', me.user.id).order('recorded_at', { ascending: false }),
      S.db.from('learning_progress').select('*, lessons(title,url)').eq('student_id', me.user.id).order('updated_at', { ascending: false }),
      S.db.from('quizzes').select('id,title,due_at,opens_at,time_limit_minutes,max_attempts,category').eq('published', true),
      S.db.from('quiz_attempts').select('quiz_id,status,score,max_score,submitted_at').eq('student_id', me.user.id),
      S.db.rpc('my_todo').then(function (r) { return r; }, function () { return { data: [] }; })
    ]).then(function (x) { draw(me, x[0].data || [], x[1].data || [], x[2].data || [], x[3].data || [], x[4].data || []); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  var ICON = { lesson: '🧪', quiz: '📝', resource: '📄', sim: '🔬', link: '🔗', task: '✏️' };
  // Work the teacher set: open items first (overdue, then by due date), then done.
  function todoHtml(items) {
    if (!items.length) return '';
    var now = new Date(), open = items.filter(function (t) { return t.state !== 'done'; }), done = items.filter(function (t) { return t.state === 'done'; });
    var row = function (t) {
      var late = t.state !== 'done' && t.due_at && new Date(t.due_at) < now, soon = !late && t.state !== 'done' && t.due_at && (new Date(t.due_at) - now) < 2 * 864e5;
      var tick = t.state === 'done' ? '<span class="pill ok">✓ Done</span>' : t.kind === 'quiz' || t.kind === 'lesson' ? (t.state === 'started' ? '<span class="pill t">✎ Started</span>' : '') :
        '<button type="button" class="btn sm" data-done="' + t.id + '">✓ Mark as done</button>';
      return '<div class="todo' + (t.state === 'done' ? ' done' : '') + '" style="display:flex;gap:8px;align-items:flex-start;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><div>' + (ICON[t.kind] || '📌') + ' ' +
        (t.url ? '<a href="' + E(t.url) + '"' + (/^https?:/.test(t.url) && t.url.indexOf(location.origin) !== 0 ? ' target="_blank" rel="noopener"' : '') + '><b>' + E(t.title) + '</b></a>' : '<b>' + E(t.title) + '</b>') +
        (t.due_at ? ' <span class="small" style="color:' + (late ? '#b91c1c' : soon ? '#b45309' : 'var(--muted)') + '">' + (late ? '⚠ was due ' : 'due ') + E(S.when(t.due_at)) + '</span>' : '') +
        (t.instructions ? '<div class="small muted">' + E(t.instructions) + '</div>' : '') + '</div><div>' + tick + '</div></div>';
    };
    return open.map(row).join('') + (done.length ? '<details><summary class="small muted">Done (' + done.length + ')</summary>' + done.map(row).join('') + '</details>' : '');
  }
  function draw(me, res, prog, quizzes, att, tasks) {
    var first = (me.profile.full_name || 'there').split(' ')[0], got = 0, max = 0;
    res.forEach(function (r) { if (r.score != null && r.max_score) { got += +r.score; max += +r.max_score; } });
    var done = prog.filter(function (p) { return p.status === 'completed'; }).length;
    var setQ = {}; tasks.forEach(function (t) { if (t.kind === 'quiz') setQ[t.ref] = 1; });
    var todo = quizzes.filter(function (q) { var a = att.filter(function (t) { return t.quiz_id === q.id; }); return !setQ[q.id] && !a.some(function (t) { return t.status !== 'in_progress'; }) && (!q.due_at || new Date(q.due_at) > new Date()); });
    var openTasks = tasks.filter(function (t) { return t.state !== 'done'; }).length;
    var fb = res.filter(function (r) { return r.teacher_feedback || r.ai_feedback; });
    var h = '<div class="row2"><div><p class="label">My dashboard</p><h2>Hello, ' + E(first) + ' 👋</h2><p class="muted small">' + E(me.cls ? me.cls.name : 'No class yet') + ' · ' + E(me.user.email) + '</p></div>' +
      '<div class="cta"><a class="btn sm" href="/learn/">Learning centre</a><a class="btn sm" href="/quizzes/">Quiz centre</a><a class="btn sm" href="/exams/">Online exams</a><button class="btn sm" type="button" id="so">Log out</button></div></div>';
    if (!me.cls) h += '<form class="panel tint" id="jf"><h3>Join your class</h3><p class="small">Your account is not in a class yet, so lessons and quizzes are hidden. Type the class code from your teacher.</p><div class="row2"><input id="jc" placeholder="Class code" autocapitalize="characters" style="max-width:220px;text-transform:uppercase"><button class="btn main sm" type="submit">Join class</button></div><p class="msg" id="jm"></p></form>';
    h += '<div class="stats"><div class="stat"><span class="small muted">Overall score</span><b>' + (max ? Math.round(100 * got / max) + '%' : '–') + '</b></div>' +
      '<div class="stat"><span class="small muted">Lessons completed</span><b>' + done + ' / ' + prog.length + '</b></div>' +
      '<div class="stat"><span class="small muted">To do</span><b>' + (openTasks + todo.length) + '</b></div>' +
      '<div class="stat"><span class="small muted">Feedback received</span><b>' + fb.length + '</b></div></div>';
    h += '<div class="two"><section class="panel"><h3>📌 To do</h3>' + todoHtml(tasks) + (todo.length || !tasks.length ? (tasks.length ? '<p class="small muted" style="margin:10px 0 2px">Also open for your class:</p>' : '') : '') + (todo.length ? todo.map(function (q) { return '<p>' + ({ exam: '🧪', lesson: '📘' }[q.category] || '📝') + ' <a href="' + ({ exam: '/exams/', lesson: '/lesson/' }[q.category] || '/quizzes/') + '#' + q.id + '">' + E(q.title) + '</a>' + (q.due_at ? ' <span class="small muted">due ' + E(S.when(q.due_at)) + '</span>' : '') + '</p>'; }).join('') : (tasks.length ? '' : '<p class="muted">Nothing to do right now. Well done!</p>')) +
      prog.filter(function (p) { return p.status !== 'completed'; }).slice(0, 5).map(function (p) { return '<p>📘 <a href="' + E(p.lessons && p.lessons.url || '/learn/') + '">' + E(p.lessons ? p.lessons.title : 'Lesson') + '</a> <span class="small muted">' + p.percent + '% done</span></p>'; }).join('') + '</section>' +
      '<section class="panel"><h3>My progress</h3>' + (prog.length ? prog.slice(0, 8).map(function (p) { return '<div class="grp" style="gap:4px"><div class="row2"><span class="small">' + E(p.lessons ? p.lessons.title : '') + '</span><span class="small muted">' + p.percent + '%</span></div><div class="bar"><i style="width:' + p.percent + '%"></i></div></div>'; }).join('') : '<p class="muted">Open a lesson from the <a href="/learn/">Learning centre</a> to start.</p>') + '</section></div>';
    h += '<section class="grp"><h3 class="sec-h">My results and feedback</h3>' + (res.length ? res.map(function (r) { var pc = S.pct(+r.score, +r.max_score);
      return '<article class="task"><div class="top2"><b>' + E(r.title || 'Task') + '</b><span class="score">' + (r.score == null ? 'Being marked' : E(r.score) + ' / ' + E(r.max_score) + (pc != null ? ' (' + pc + '%)' : '')) + '</span></div>' +
        '<div class="bar"><i style="width:' + (pc || 0) + '%"></i></div><span class="small muted">' + E(S.when(r.recorded_at)) + '</span>' +
        (r.teacher_feedback ? '<div class="fb tch"><h4>Teacher feedback</h4>' + BV.md(r.teacher_feedback) + '</div>' : '') + (r.ai_feedback ? '<div class="fb ai"><h4>AI feedback</h4>' + BV.md(r.ai_feedback) + '</div>' : '') + '</article>'; }).join('') :
      '<p class="emptybox">No results yet. Results appear here when you finish lessons and quizzes.</p>') + '</section>';
    h += '<details class="panel"><summary><b>My profile</b></summary><form id="pf" class="grp" style="margin-top:10px"><label class="f">Full name<input id="pn" value="' + E(me.profile.full_name) + '"></label><button class="btn sm" type="submit">Save</button><p class="msg" id="pm"></p></form>' +
      '<p class="small muted">Marks from before accounts were switched on are still on <a href="/progress/">My learning (personal code)</a>.</p></details>';
    app.innerHTML = h;
    app.querySelector('#so').onclick = S.signOut;
    app.querySelectorAll('[data-done]').forEach(function (b) { b.onclick = function () {
      b.disabled = true; S.db.from('assignment_done').insert({ assignment_id: b.getAttribute('data-done'), student_id: me.user.id }).then(function (r) {
        if (r.error) { b.disabled = false; alert(S.nice(r.error)); return; }
        tasks.forEach(function (t) { if (t.id === b.getAttribute('data-done')) t.state = 'done'; }); draw(me, res, prog, quizzes, att, tasks); }); }; });
    var jf = app.querySelector('#jf'); if (jf) jf.onsubmit = function (e) { e.preventDefault(); var m = app.querySelector('#jm');
      S.db.rpc('join_class', { code: app.querySelector('#jc').value }).then(function (r) { if (r.error) { m.textContent = S.nice(r.error); return; } location.reload(); }); };
    app.querySelector('#pf').onsubmit = function (e) { e.preventDefault(); var m = app.querySelector('#pm');
      S.db.from('profiles').update({ full_name: app.querySelector('#pn').value.trim() }).eq('id', me.user.id).then(function (r) { m.className = r.error ? 'msg' : 'msg ok'; m.textContent = r.error ? S.nice(r.error) : 'Saved.'; }); };
  }
})();
