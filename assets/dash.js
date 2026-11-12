/* Student dashboard · Learnova */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  S.guard(app, { allowPending: true }).then(function (me) {
    if (me.staff && !new URLSearchParams(location.search).get('student')) { location.href = '/staff/'; return; }
    if (!me.ok) { app.innerHTML = '<div class="row2"><div><p class="label">My dashboard</p><h2>Hello, ' + E((me.profile.full_name || 'there').split(' ')[0]) + ' 👋</h2><p class="muted small">' + E(me.user.email) + '</p></div><div class="cta"><button class="btn sm" type="button" id="so">Log out</button></div></div><div id="mycl"></div>';
      app.querySelector('#so').onclick = S.signOut; classesPanel(me, app.querySelector('#mycl')); return; }
    return Promise.all([
      S.db.from('student_results').select('*').eq('student_id', me.user.id).order('recorded_at', { ascending: false }),
      S.db.from('learning_progress').select('*, lessons(title,url)').eq('student_id', me.user.id).order('updated_at', { ascending: false }),
      S.db.from('quizzes').select('id,title,due_at,opens_at,time_limit_minutes,max_attempts,category').eq('published', true),
      S.db.from('quiz_attempts').select('quiz_id,status,score,max_score,submitted_at').eq('student_id', me.user.id),
      S.db.rpc('my_todo').then(function (r) { return r; }, function () { return { data: [] }; })
    ]).then(function (x) { draw(me, x[0].data || [], x[1].data || [], x[2].data || [], x[3].data || [], x[4].data || []); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  // My classes, joining a class (school or teacher first, then the class; no codes) and premium access
  function classesPanel(me, box) {
    var a = me.access || {}, mine = a.classes || [];
    var link = function (c) { return c.slug ? '/' + c.slug + '/' : '/class/?id=' + c.id; };
    var st = { approved: '<span class="pill ok">✓ Approved</span>', pending: '<span class="pill t">⏳ Waiting for the teacher</span>', teacher_ok: '<span class="pill t">⏳ Teacher said yes · waiting for Learnova</span>', rejected: '<span class="pill">Not accepted</span>' };
    var prem = a.premium ? '<p class="small"><span class="pill ok">⭐ Premium</span> ' + (a.free ? 'Free access given by the admin.' : a.until ? 'Until ' + E(new Date(a.until).toLocaleDateString()) + '. <a href="/premium/">Extend</a>' : '') + '</p>'
      : '<p class="small"><b>Premium access is needed</b> to open class lessons, quizzes and simulations. <a class="btn main sm" href="/premium/">Get premium</a></p>';
    box.innerHTML = '<section class="panel tint grp"><div class="row2"><h3 style="margin:0">🏫 My classes</h3><button type="button" class="btn sm" id="addc">＋ Join a class</button></div>' + prem +
      (mine.length ? mine.map(function (c) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>' + (c.status === 'approved' ? '<a href="' + E(link(c)) + '"><b>' + E(c.name) + '</b></a>' : '<b>' + E(c.name) + '</b>') + ' ' + (st[c.status] || '') + '</span>' +
        '<button type="button" class="btn sm" data-leave="' + E(c.id) + '" title="Leave this class">Leave</button></div>'; }).join('') : '<p class="small">You have not joined a class yet. Press <b>Join a class</b>.</p>') +
      '<div id="joinbox"></div></section>';
    box.querySelectorAll('[data-leave]').forEach(function (b) { b.onclick = function () { if (!confirm('Leave this class? You can ask to join again later.')) return;
      S.db.rpc('leave_class', { cid: b.getAttribute('data-leave') }).then(function (r) { if (r.error) return alert(S.nice(r.error)); location.reload(); }); }; });
    box.querySelector('#addc').onclick = function () {
      var jb = box.querySelector('#joinbox'); jb.innerHTML = '<p class="small muted">Loading classes…</p>';
      S.db.rpc('class_directory').then(function (r) {
        if (r.error) { jb.innerHTML = '<p class="msg">' + E(S.nice(r.error)) + '</p>'; return; }
        var list = r.data || [], schools = [];
        list.forEach(function (c) { if (schools.indexOf(c.school) < 0) schools.push(c.school); });
        jb.innerHTML = '<p class="small" style="margin-top:10px">No school or teacher? Choose <b>Learnova · Independent learners</b>: you are in straight away and learn at your own pace with instant feedback.</p><div class="grp"><label class="f">1. Your school or teacher<select id="jsch"><option value="">Choose…</option>' + schools.map(function (s) { return '<option>' + E(s) + '</option>'; }).join('') + '</select></label>' +
          '<label class="f">Or search by class name<input id="jq" placeholder="e.g. Biology HL"></label><div id="jlist"></div><p class="msg" id="jm" role="alert"></p></div>';
        var draw = function () {
          var sch = jb.querySelector('#jsch').value, q = jb.querySelector('#jq').value.trim().toLowerCase();
          var show = list.filter(function (c) { return (!sch || c.school === sch) && (!q || (c.name + ' ' + (c.subject || '') + ' ' + c.school).toLowerCase().indexOf(q) >= 0); });
          jb.querySelector('#jlist').innerHTML = (sch || q) ? (show.length ? '<p class="small"><b>2. Choose your class</b></p>' + show.map(function (c) {
            return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(c.name) + '</b> <span class="small muted">' + E(c.school) + (c.description ? ' · ' + E(c.description) : '') + '</span></span>' +
              (c.my_status ? (st[c.my_status] || '') : '<button type="button" class="btn main sm" data-join="' + E(c.id) + '">Ask to join</button>') + '</div>'; }).join('') : '<p class="small muted">No class matches. Check the name with your teacher.</p>') : '';
          jb.querySelectorAll('[data-join]').forEach(function (b) { b.onclick = function () { b.disabled = true; var m = jb.querySelector('#jm');
            S.db.rpc('request_join', { cid: b.getAttribute('data-join') }).then(function (x) { if (x.error) { b.disabled = false; m.textContent = S.nice(x.error); return; }
              m.className = 'msg ok'; m.textContent = x.data === 'approved' ? 'You are in. Your lessons are ready.' : 'Request sent. Your teacher will approve it soon.'; setTimeout(function () { location.reload(); }, 1200); }); }; });
        };
        jb.querySelector('#jsch').onchange = draw; jb.querySelector('#jq').oninput = draw;
      });
    };
  }
  // Personalised next steps: lessons started but not finished, then the next lessons in each of my classes, in course order
  function learningPlan(me, prog) {
    var box = app.querySelector('#plan'); if (!box) return;
    var ids = (me.classes || []).map(function (c) { return c.id; }); if (!ids.length) { box.remove(); return; }
    S.db.from('class_materials').select('class_id,path,sort,materials(title,unit)').in('class_id', ids).order('sort').then(function (r) {
      var mats = r.data || [], byPath = {}, seen = {};
      prog.forEach(function (p) { var u = p.lessons && p.lessons.url; if (u) { var k = u.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, ''); if (k.slice(-1) !== '/') k += '/'; byPath[k] = p; } });
      var going = [], next = [];
      mats.forEach(function (m) { if (seen[m.path]) return; seen[m.path] = 1; var p = byPath[m.path];
        if (p && p.status !== 'completed') going.push({ m: m, p: p }); else if (!p) next.push({ m: m }); });
      var perClass = {}; next = next.filter(function (x) { perClass[x.m.class_id] = (perClass[x.m.class_id] || 0) + 1; return perClass[x.m.class_id] <= 3; });
      var total = Object.keys(seen).length, done = Object.keys(seen).filter(function (k) { return byPath[k] && byPath[k].status === 'completed'; }).length;
      var row = function (x, tag) { var t = x.m.materials || {}; return '<p>📘 <a href="' + E(x.m.path) + '">' + E(t.title || x.m.path) + '</a> <span class="small muted">' + E(t.unit || '') + (tag ? ' · ' + tag : '') + '</span></p>'; };
      box.innerHTML = '<h3>🧭 My learning plan</h3><p class="small muted">Chosen for you from your classes and your progress. Each lesson gives instant feedback on every step; your learning profile below shows what to practise.</p>' +
        '<div class="bar"><i style="width:' + (total ? Math.round(100 * done / total) : 0) + '%"></i></div><p class="small">' + done + ' of ' + total + ' lessons in your classes completed</p>' +
        (going.length ? '<h4>Finish what you started</h4>' + going.slice(0, 4).map(function (x) { return row(x, x.p.percent + '% done'); }).join('') : '') +
        (next.length ? '<h4>Up next</h4>' + next.slice(0, 6).map(function (x) { return row(x); }).join('') : (going.length ? '' : '<p>You have finished every lesson in your classes. Try the <a href="/quizzes/">quizzes</a> to test yourself.</p>')) +
        '<p class="small"><a href="/tutor/">Stuck? Ask the Science Help Desk</a> · <a href="/messages/">Message your teacher</a></p>';
    }, function () { box.remove(); });
  }
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
  // The student's own learning profile and the analysis of each piece of work (Student Work Analysis Engine)
  var PROF = null;
  function myProfile(me) {
    var box = app.querySelector('#anbox'), A = window.BVA; if (!box || !A) return;
    var go = PROF ? Promise.resolve(PROF) : Promise.all([S.db.rpc('student_profile'), S.db.from('submission_analysis').select('*').eq('student_id', me.user.id).order('at', { ascending: false })]).then(function (x) { if (x[0].error) throw x[0].error; PROF = [x[0].data, x[1].data || []]; return PROF; });
    go.then(function (z) {
      var prof = z[0], subs = z[1];
      box.innerHTML = '<div class="row2"><h3 style="margin:0">📊 My learning profile</h3>' + (prof.overall && prof.overall.items ? '<button type="button" class="btn sm" id="aip">📝 Summarise my learning</button>' : '') + '</div>' +
        '<p class="small muted">Built from the marks on every question you have handed in. It shows what you understand well, what to practise and where to find help.</p>' + A.profileHtml(prof, {}) +
        (subs.length ? '<h4>My analysed work</h4>' + subs.map(function (sa) { return '<details class="panel" data-sk="' + E(sa.sub_key) + '"><summary><b>' + E(sa.title) + '</b> <span class="small muted">' + E(S.when(sa.at)) + '</span> · ' + (sa.pct == null ? '–' : sa.pct + '%') + '</summary><div class="sbody small muted">Loading…</div></details>'; }).join('') : '');
      box.querySelectorAll('details[data-sk]').forEach(function (dd) { dd.ontoggle = function () { if (!dd.open || dd.getAttribute('data-l')) return; dd.setAttribute('data-l', 1);
        var sk = dd.getAttribute('data-sk'), sa = subs.filter(function (q) { return q.sub_key === sk; })[0];
        S.db.from('item_results').select('*').eq('sub_key', sk).order('id').then(function (r) { var b = dd.querySelector('.sbody'); b.className = 'sbody'; b.innerHTML = A.submissionHtml(sa, r.data || [], { settings: prof.settings, open: true }); }); }; });
      var b = box.querySelector('#aip'); if (b) b.onclick = function () { b.disabled = true; b.textContent = 'Summarising…';
        S.db.functions.invoke('analyse', { body: { profile: me.user.id } }).then(function (res) { var d = res.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
          if (res.error || !d || !d.ok) { b.disabled = false; b.textContent = '📝 Summarise my learning'; alert('Not available right now. Your profile above is still up to date.'); return; }
          PROF = null; myProfile(me); }); };
    }).catch(function (e) { box.innerHTML = '<h3>📊 My learning profile</h3><p class="small muted">' + (/student_profile|schema cache/.test(String(e && e.message)) ? 'Your learning profile will appear here soon.' : E(S.nice(e))) + '</p>'; });
  }
  function draw(me, res, prog, quizzes, att, tasks) {
    var first = (me.profile.full_name || 'there').split(' ')[0], got = 0, max = 0;
    res.forEach(function (r) { if (r.score != null && r.max_score) { got += +r.score; max += +r.max_score; } });
    var done = prog.filter(function (p) { return p.status === 'completed'; }).length;
    var setQ = {}; tasks.forEach(function (t) { if (t.kind === 'quiz') setQ[t.ref] = 1; });
    var todo = quizzes.filter(function (q) { var a = att.filter(function (t) { return t.quiz_id === q.id; }); return !setQ[q.id] && !a.some(function (t) { return t.status !== 'in_progress'; }) && (!q.due_at || new Date(q.due_at) > new Date()); });
    var openTasks = tasks.filter(function (t) { return t.state !== 'done'; }).length;
    var fb = res.filter(function (r) { return r.teacher_feedback || r.ai_feedback; });
    var h = '<div class="row2"><div><p class="label">My dashboard</p><h2>Hello, ' + E(first) + ' 👋</h2><p class="muted small">' + E(me.classes.map(function (c) { return c.name; }).join(', ') || 'No class yet') + ' · ' + E(me.user.email) + '</p></div>' +
      '<div class="cta"><a class="btn sm" href="/learn/">Learning centre</a><a class="btn sm" href="/quizzes/">Quiz centre</a><a class="btn sm" href="/exams/">Online exams</a><button class="btn sm" type="button" id="so">Log out</button></div></div>';
    h += '<div id="mycl"></div>';
    h += '<div class="stats"><div class="stat"><span class="small muted">Overall score</span><b>' + (max ? Math.round(100 * got / max) + '%' : '–') + '</b></div>' +
      '<div class="stat"><span class="small muted">Lessons completed</span><b>' + done + ' / ' + prog.length + '</b></div>' +
      '<div class="stat"><span class="small muted">To do</span><b>' + (openTasks + todo.length) + '</b></div>' +
      '<div class="stat"><span class="small muted">Feedback received</span><b>' + fb.length + '</b></div></div>';
    h += '<div class="two"><section class="panel"><h3>📌 To do</h3>' + todoHtml(tasks) + (todo.length || !tasks.length ? (tasks.length ? '<p class="small muted" style="margin:10px 0 2px">Also open for your class:</p>' : '') : '') + (todo.length ? todo.map(function (q) { return '<p>' + ({ exam: '🧪', lesson: '📘' }[q.category] || '📝') + ' <a href="' + ({ exam: '/exams/', lesson: '/lesson/' }[q.category] || '/quizzes/') + '#' + q.id + '">' + E(q.title) + '</a>' + (q.due_at ? ' <span class="small muted">due ' + E(S.when(q.due_at)) + '</span>' : '') + '</p>'; }).join('') : (tasks.length ? '' : '<p class="muted">Nothing to do right now. Well done!</p>')) +
      prog.filter(function (p) { return p.status !== 'completed'; }).slice(0, 5).map(function (p) { return '<p>📘 <a href="' + E(p.lessons && p.lessons.url || '/learn/') + '">' + E(p.lessons ? p.lessons.title : 'Lesson') + '</a> <span class="small muted">' + p.percent + '% done</span></p>'; }).join('') + '</section>' +
      '<section class="panel"><h3>My progress</h3>' + (prog.length ? prog.slice(0, 8).map(function (p) { return '<div class="grp" style="gap:4px"><div class="row2"><span class="small">' + E(p.lessons ? p.lessons.title : '') + '</span><span class="small muted">' + p.percent + '%</span></div><div class="bar"><i style="width:' + p.percent + '%"></i></div></div>'; }).join('') : '<p class="muted">Open a lesson from the <a href="/learn/">Learning centre</a> to start.</p>') + '</section></div>';
    h += '<section class="panel" id="plan"><h3>🧭 My learning plan</h3><p class="small muted">Loading…</p></section>';
    h += '<section class="panel" id="anbox"><h3>📊 My learning profile</h3><p class="muted small">Loading…</p></section>';
    h += '<section class="grp"><h3 class="sec-h">My results and feedback</h3>' + (res.length ? res.map(function (r) { var pc = S.pct(+r.score, +r.max_score);
      return '<article class="task"><div class="top2"><b>' + E(r.title || 'Task') + '</b><span class="score">' + (r.score == null ? 'Being marked' : E(r.score) + ' / ' + E(r.max_score) + (pc != null ? ' (' + pc + '%)' : '')) + '</span></div>' +
        '<div class="bar"><i style="width:' + (pc || 0) + '%"></i></div><span class="small muted">' + E(S.when(r.recorded_at)) + '</span>' +
        (r.teacher_feedback ? '<div class="fb tch"><h4>Teacher feedback</h4>' + BV.md(r.teacher_feedback) + '</div>' : '') + (r.ai_feedback ? '<div class="fb ai"><h4>Feedback</h4>' + BV.md(String(r.ai_feedback).replace(/_🤖 Automatic AI feedback from your marks on each question\./, '_📝 Feedback from your marks on each question.').replace(/_⚙ Automatic feedback from your marks on each question\._/, '_📝 Feedback from your marks on each question._')) + '</div>' : '') + '</article>'; }).join('') :
      '<p class="emptybox">No results yet. Results appear here when you finish lessons and quizzes.</p>') + '</section>';
    h += '<details class="panel"><summary><b>My profile</b></summary><form id="pf" class="grp" style="margin-top:10px"><label class="f">Full name<input id="pn" value="' + E(me.profile.full_name) + '"></label><button class="btn sm" type="submit">Save</button><p class="msg" id="pm"></p></form>' +
      '<p class="small muted">Marks from before accounts were switched on are still on <a href="/progress/">My learning (personal code)</a>.</p></details>';
    app.innerHTML = h;
    app.querySelector('#so').onclick = S.signOut;
    myProfile(me);
    app.querySelectorAll('[data-done]').forEach(function (b) { b.onclick = function () {
      b.disabled = true; S.db.from('assignment_done').insert({ assignment_id: b.getAttribute('data-done'), student_id: me.user.id }).then(function (r) {
        if (r.error) { b.disabled = false; alert(S.nice(r.error)); return; }
        tasks.forEach(function (t) { if (t.id === b.getAttribute('data-done')) t.state = 'done'; }); draw(me, res, prog, quizzes, att, tasks); }); }; });
    classesPanel(me, app.querySelector('#mycl'));
    learningPlan(me, prog);
    app.querySelector('#pf').onsubmit = function (e) { e.preventDefault(); var m = app.querySelector('#pm');
      S.db.from('profiles').update({ full_name: app.querySelector('#pn').value.trim() }).eq('id', me.user.id).then(function (r) { m.className = r.error ? 'msg' : 'msg ok'; m.textContent = r.error ? S.nice(r.error) : 'Saved.'; }); };
  }
})();
