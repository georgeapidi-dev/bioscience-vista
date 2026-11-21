/* My learning journey · BioscienceVista · by BioscienceVista (Student Learning Centre brief)
   One timeline of everything a student has done, newest first, built only from their own records:
   lessons (learning_progress), assessments (quiz_attempts), labs (sim_attempts), set work ticked off (assignment_done),
   projects (research_projects, pp_projects, innovation_projects), feedback (student_results, lab comments, answer comments),
   AI tutor chats (tutor_sessions) and help questions (help_questions). Nothing here is written to the database. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), DAY = 864e5;
  var K = {   // type: icon, label, colour
    lesson: ['📘', 'Lessons', '#2563eb'], assess: ['📝', 'Assessments', '#ea580c'], lab: ['🔬', 'Labs', '#0d9488'], work: ['📌', 'Set work', '#4f46e5'],
    project: ['📁', 'Projects', '#9333ea'], feedback: ['💬', 'Feedback', '#e11d48'], tutor: ['🤖', 'Tutor and help', '#0284c7'], goal: ['🎯', 'Goals', '#16a34a']
  };
  var CSS = '.jy-hero{padding:22px 24px;border-radius:22px;color:#fff;background:linear-gradient(125deg,#4f46e5,#9333ea 50%,#e11d48);margin:8px 0 14px}.jy-hero h1{margin:2px 0 6px;color:#fff}.jy-hero p{margin:0;color:#fff;max-width:70ch}.jy-eye{font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#fde68a}' +
    '.jy-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.jy-stats span{background:rgba(255,255,255,.17);border:1px solid rgba(255,255,255,.35);border-radius:14px;padding:6px 12px;font-size:.88rem}.jy-stats b{font-size:1.2rem;margin-right:4px}' +
    '.jy-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:10px 12px;margin:0 0 14px;position:sticky;top:0;z-index:5}' +
    '.jy-bar button{font:inherit;font-size:.86rem;font-weight:700;padding:6px 12px;border-radius:999px;border:2px solid color-mix(in srgb,var(--c,#4f46e5) 35%,#fff);background:color-mix(in srgb,var(--c,#4f46e5) 10%,#fff);color:color-mix(in srgb,var(--c,#4f46e5) 80%,#0f172a);cursor:pointer}.jy-bar button.on{background:var(--c,#4f46e5);border-color:var(--c,#4f46e5);color:#fff}' +
    '.jy-bar select{font:inherit;padding:6px 10px;border-radius:10px;border:2px solid #c7d2fe;margin-left:auto;width:auto;max-width:100%}' +
    '.jy-m{margin:18px 0 6px;font-size:1.15rem}.jy-m span{font-size:.85rem;font-weight:600;color:#64748b;margin-left:6px}' +
    '.jy-day{display:grid;grid-template-columns:92px minmax(0,1fr);gap:12px;margin:0 0 4px}.jy-dl{font-weight:800;color:#334155;padding-top:10px;font-size:.9rem}.jy-dl small{display:block;font-weight:600;color:#64748b}' +
    '.jy-ev{position:relative;border-left:3px solid #e2e8f0;padding:0 0 0 18px}.jy-i{position:relative;display:flex;gap:10px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;background:#fff;border:1px solid #e2e8f0;border-left:5px solid var(--c);border-radius:12px;padding:9px 12px;margin:8px 0}' +
    '.jy-i::before{content:"";position:absolute;left:-29px;top:14px;width:14px;height:14px;border-radius:50%;background:var(--c);border:3px solid #fff;box-shadow:0 0 0 2px var(--c)}.jy-i>div{min-width:0;flex:1 1 240px}.jy-i b{overflow-wrap:anywhere}.jy-i .small{color:#64748b;font-size:.85rem;overflow-wrap:anywhere}.jy-t{font-size:.78rem;font-weight:800;color:var(--c);text-transform:uppercase;letter-spacing:.05em}.jy-i[hidden],.jy-day[hidden],.jy-m[hidden]{display:none}' +
    '.jy-q{font-style:italic;color:#334155;margin-top:3px}.jy-empty{background:#fff;border:1px dashed #cbd5e1;border-radius:14px;padding:18px;text-align:center}' +
    '@media(max-width:600px){.jy-day{grid-template-columns:1fr;gap:0}.jy-dl{padding-top:4px}.jy-ev{margin-left:6px}.jy-bar{position:static}.jy-bar select{margin-left:0}}';

  S.guard(app).then(function (me) {
    if (!document.getElementById('jy-css')) { var st = document.createElement('style'); st.id = 'jy-css'; st.textContent = CSS; document.head.appendChild(st); }
    app.innerHTML = '<section class="jy-hero"><span class="jy-eye">My learning journey</span><h1>🚀 My learning journey</h1><p>Loading everything you have done…</p></section>';
    var uid = me.user.id, since = new Date(Date.now() - 400 * DAY).toISOString();
    var q = function (p) { return p.then(function (r) { return r && !r.error ? r : { data: [] }; }, function () { return { data: [] }; }); };
    Promise.all([
      q(S.db.from('learning_progress').select('lesson_id,status,percent,updated_at, lessons(title,url)').eq('student_id', uid).gte('updated_at', since)),
      q(S.db.from('quiz_attempts').select('id,quiz_id,status,score,max_score,submitted_at,released, quizzes(title,category,show_results), attempt_feedback(teacher)').eq('student_id', uid).not('submitted_at', 'is', null).gte('submitted_at', since)),
      q(S.db.from('sim_attempts').select('id,sim,sim_title,trials,score,max_score,teacher_comment,started_at,submitted_at,updated_at').eq('student_id', uid).gte('updated_at', since)),
      q(S.db.from('assignment_done').select('assignment_id,done_at').eq('student_id', uid).gte('done_at', since)),
      q(S.db.rpc('my_todo')),
      q(S.db.from('student_results').select('id,title,score,max_score,teacher_feedback,quiz_id,updated_at,recorded_at').eq('student_id', uid).not('teacher_feedback', 'is', null)),
      q(S.db.from('research_projects').select('id,kind,title,stage,status,created_at,updated_at').eq('student_id', uid)),
      q(S.db.from('pp_projects').select('id,title,stage,status,created_at,updated_at').eq('student_id', uid)),
      q(S.db.from('innovation_projects').select('id,title,stage,status,created_at,updated_at').eq('owner_id', uid)),
      q(S.db.from('tutor_sessions').select('id,mode,topic,title,created_at,updated_at').eq('user_id', uid).gte('updated_at', since)),
      q(S.db.from('help_questions').select('id,topic,question,answer,status,created_at,answered_at').eq('student_id', uid).gte('created_at', since)),
      q(S.db.from('learner_preferences').select('goals').eq('user_id', uid).maybeSingle())
    ]).then(function (x) { draw(me, x); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function nice(t) { return String(t || '').replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }); }
  function cut(t, n) { t = String(t || '').replace(/[#*_>`]/g, '').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; }

  function draw(me, x) {
    var EV = [], add = function (type, at, title, detail, href, extra) { if (!at) return; var t = new Date(at).getTime(); if (isNaN(t)) return; EV.push({ type: type, t: t, title: title, detail: detail || '', href: href || '', extra: extra || '' }); };
    var n = { lessons: 0, assess: 0, labs: 0, fb: 0 };
    (x[0].data || []).forEach(function (p) { var l = p.lessons || {}, done = p.status === 'completed' || p.percent >= 100; if (done) n.lessons++;
      add('lesson', p.updated_at, (done ? 'Completed ' : 'Worked on ') + (l.title || 'a lesson'), done ? 'Lesson finished' : 'Reached ' + (p.percent || 0) + '%', l.url); });
    (x[1].data || []).forEach(function (a) { var qz = a.quizzes || {}, show = a.released || qz.show_results, exam = qz.category === 'exam'; n.assess++;
      var res = a.status === 'needs_marking' ? 'Waiting for your teacher to mark' : !show ? 'Marked: your teacher will release the result' : a.score != null ? 'Result ' + a.score + ' / ' + a.max_score + (a.max_score ? ' · ' + Math.round(100 * a.score / a.max_score) + '%' : '') : '';
      add('assess', a.submitted_at, 'Handed in ' + (exam ? 'examination' : 'assessment') + ': ' + (qz.title || 'Assessment'), res, (exam ? '/exams/#' : '/quizzes/#') + a.quiz_id)
      var cm = show ? (a.attempt_feedback || []).map(function (f) { return f.teacher; }).filter(function (t) { return t && t.comment && String(t.comment).trim(); }) : [];
      if (cm.length) { n.fb++; add('feedback', cm.map(function (t) { return t.at || ''; }).sort().pop() || a.submitted_at, 'Teacher comments on ' + (qz.title || 'your assessment'), cm.length + ' comment' + (cm.length > 1 ? 's' : '') + ' on your answers', (exam ? '/exams/#' : '/quizzes/#') + a.quiz_id, '<div class="jy-q">“' + E(cut(cm[0].comment, 200)) + '”</div>'); } });
    (x[2].data || []).forEach(function (a) { var href = /^sim:/.test(a.sim) ? '/simulations/play/?s=' + a.sim.slice(4) : '/simulations/' + a.sim + '/';
      if (a.started_at) add('lab', a.started_at, 'Started the ' + (a.sim_title || 'lab'), '', href);
      if (a.submitted_at) { n.labs++; add('lab', a.submitted_at, 'Handed in the ' + (a.sim_title || 'lab'), (a.trials || 0) + ' trials recorded' + (a.max_score ? ' · analysis ' + Math.round(100 * a.score / a.max_score) + '%' : ''), href); }
      else if (!a.started_at) add('lab', a.updated_at, 'Worked on the ' + (a.sim_title || 'lab'), (a.trials || 0) + ' trials recorded', href);
      if (a.teacher_comment) { n.fb++; add('feedback', a.updated_at, 'Teacher comment on the ' + (a.sim_title || 'lab'), '', '/lab-results/', '<div class="jy-q">“' + E(cut(a.teacher_comment, 240)) + '”</div>'); } });
    var TT = {}; (x[4].data || []).forEach(function (t) { TT[t.id] = t; });
    (x[3].data || []).forEach(function (d) { var t = TT[d.assignment_id]; add('work', d.done_at, 'Finished set work: ' + (t ? t.title : 'work from your teacher'), t && t.due_at ? (new Date(d.done_at) <= new Date(t.due_at) ? 'On time' : 'After the deadline') : '', t && t.url); });
    (x[5].data || []).forEach(function (r) { n.fb++; add('feedback', r.updated_at || r.recorded_at, 'Feedback on ' + (r.title || 'your work'), r.max_score ? r.score + ' / ' + r.max_score : '', r.quiz_id ? '/quizzes/#' + r.quiz_id : '/dashboard/#db-res', '<div class="jy-q">“' + E(cut(r.teacher_feedback, 240)) + '”</div>'); });
    var proj = function (rows, label, href) { rows.forEach(function (p) {
      add('project', p.created_at, 'Started ' + label + (p.title ? ': ' + p.title : ''), '', href);
      if (p.updated_at && new Date(p.updated_at) - new Date(p.created_at) > DAY) add('project', p.updated_at, 'Worked on ' + label + (p.title ? ': ' + p.title : ''), [p.stage ? 'Stage: ' + nice(p.stage) : '', p.status ? nice(p.status) : ''].filter(Boolean).join(' · '), href); }); };
    var isEE = function (p) { return String(p.kind || '').toUpperCase() === 'EE'; };
    proj((x[6].data || []).filter(isEE), 'your extended essay', '/research/');
    proj((x[6].data || []).filter(function (p) { return !isEE(p); }), 'your internal assessment', '/research/');
    proj(x[7].data || [], 'your Personal Project', '/personal-project/');
    proj(x[8].data || [], 'an Innovation challenge', '/innovation/');
    (x[9].data || []).forEach(function (s) { add('tutor', s.updated_at, 'AI tutor: ' + cut(s.title || s.topic || 'a chat', 90), [s.topic ? 'Topic: ' + s.topic : '', nice(s.mode)].filter(Boolean).join(' · '), '/tutor/'); });
    (x[10].data || []).forEach(function (h) { add('tutor', h.created_at, 'Asked for help' + (h.topic ? ' on ' + h.topic : ''), '', '/tutor/', '<div class="jy-q">' + E(cut(h.question, 200)) + '</div>');
      if (h.answered_at) n.fb++;
      if (h.answered_at) add('feedback', h.answered_at, 'Your teacher answered your question' + (h.topic ? ' on ' + h.topic : ''), '', '/tutor/', h.answer ? '<div class="jy-q">“' + E(cut(h.answer, 240)) + '”</div>' : ''); });
    ((x[11].data && x[11].data.goals) || []).forEach(function (g) { var at = g.done_at || g.done && g.at || g.created_at || g.at; if (at) add('goal', at, (g.done ? 'Reached goal: ' : 'Set goal: ') + cut(g.text, 120), '', '/dashboard/#lx'); });

    EV.sort(function (a, b) { return b.t - a.t; });
    var hero = '<section class="jy-hero"><span class="jy-eye">My learning journey</span><h1>🚀 My learning journey</h1><p>Everything you have done in the last year, newest first: lessons, assessments, labs, set work, projects, feedback and questions. Use it to see how far you have come and to tell your teacher or parents what you have been working on.</p>' +
      '<div class="jy-stats">' + [[n.lessons, 'lesson', 'lessons', 'completed'], [n.assess, 'assessment', 'assessments', 'handed in'], [n.labs, 'lab', 'labs', 'handed in'], [n.fb, 'piece of feedback', 'pieces of feedback', '']].map(function (z) { return '<span><b>' + z[0] + '</b>' + (z[0] === 1 ? z[1] : z[2]) + (z[3] ? ' ' + z[3] : '') + '</span>'; }).join('') + '</div></section>';
    if (!EV.length) { app.innerHTML = hero + '<p class="jy-empty">Your journey starts with your first lesson. <a class="btn sm main" href="/learn/">📚 Open the Learning centre</a></p>'; return; }
    var used = {}; EV.forEach(function (e) { used[e.type] = (used[e.type] || 0) + 1; });
    var bar = '<div class="jy-bar" role="group" aria-label="Show"><button type="button" class="on" data-f="all">All · ' + EV.length + '</button>' + Object.keys(K).filter(function (k) { return used[k]; }).map(function (k) { return '<button type="button" data-f="' + k + '" style="--c:' + K[k][2] + '">' + K[k][0] + ' ' + K[k][1] + ' · ' + used[k] + '</button>'; }).join('') +
      '<label class="sr-only" for="jy-r">Period</label><select id="jy-r"><option value="30">Last 30 days</option><option value="90" selected>Last 3 months</option><option value="400">Last year</option></select></div>';
    var month = null, day = null, out = '';
    EV.forEach(function (e) {
      var d = new Date(e.t), mk = d.getFullYear() + '-' + d.getMonth(), dk = d.toDateString();
      if (mk !== month) { if (day) out += '</div></div>'; day = null; month = mk; out += '<h2 class="jy-m" data-m="' + mk + '">' + d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</h2>'; }
      if (dk !== day) { if (day) out += '</div></div>'; day = dk; out += '<div class="jy-day" data-t="' + e.t + '"><div class="jy-dl">' + d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + '<small>' + d.toLocaleDateString(undefined, { weekday: 'long' }) + '</small></div><div class="jy-ev">'; }
      var k = K[e.type];
      out += '<div class="jy-i" data-k="' + e.type + '" data-t="' + e.t + '" style="--c:' + k[2] + '"><div><span class="jy-t">' + k[0] + ' ' + k[1] + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + '</span><br><b>' + E(e.title) + '</b>' + (e.detail ? '<div class="small">' + E(e.detail) + '</div>' : '') + e.extra + '</div>' +
        (e.href ? '<a class="btn sm" href="' + E(e.href) + '">Open</a>' : '') + '</div>';
    });
    if (day) out += '</div></div>';
    app.innerHTML = hero + bar + '<div id="jy-list">' + out + '</div><p class="jy-empty" id="jy-none" hidden>Nothing of this kind in this period. Try a longer period or "All".</p>';
    var f = 'all', sel = app.querySelector('#jy-r');
    function filt() {
      var from = Date.now() - (+sel.value) * DAY, any = false;
      app.querySelectorAll('.jy-i').forEach(function (i) { i.hidden = (f !== 'all' && i.getAttribute('data-k') !== f) || +i.getAttribute('data-t') < from; if (!i.hidden) any = true; });
      app.querySelectorAll('.jy-day').forEach(function (d) { d.hidden = !d.querySelector('.jy-i:not([hidden])'); });
      app.querySelectorAll('.jy-m').forEach(function (m) { var el = m.nextElementSibling, show = false; while (el && !el.classList.contains('jy-m')) { if (!el.hidden) show = true; el = el.nextElementSibling; } m.hidden = !show; });
      app.querySelector('#jy-none').hidden = any;
    }
    app.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); app.querySelectorAll('[data-f]').forEach(function (y) { y.classList.toggle('on', y === b); }); filt(); }; });
    sel.onchange = filt;
    if (EV[EV.length - 1].t > Date.now() - 90 * DAY || EV.filter(function (e) { return e.t > Date.now() - 90 * DAY; }).length < 3) sel.value = '400';
    filt();
  }
})();
