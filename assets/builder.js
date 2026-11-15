/* Learnova · Builder (/build/). One place to build exam-style question sets, examinations and interactive lessons.
   Layout: question list on the left, the question being edited in the middle, settings and a live student preview on the right.
   Saving always shows the whole item as a student will see it first ("preview before saving").
   Everything a teacher builds goes into "My assessments and lessons" and can be added to the teacher's own classes.
   Only the admin can put an item on the main site (quizzes.main_site, migration 038; the database refuses it for anyone else).
   Lessons open at once as live interactive lessons at /lesson/#id (six inquiry steps, read-aloud, timer, answers after each step).
   Question kinds: mcq, tf, short (written; also essay with a rubric, graph, drawing, label-the-picture), info, and the ten kinds in
   site_assets/qtypes.js (multi, match, order, classify, gaps, cloze, number, table, label, hotspot), which need migration 038. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), QT = window.BVQT, T = window.BVT;
  var ME, IS_ADMIN = false, HAS_MAIN = true, MYCLASSES = [], ST = null, SEL = 0;
  var STEPS = ['Question', 'Explore', 'Test', 'Explain', 'Challenge', 'Reflect'];
  var CAT = { quiz: ['📝', 'Exam-style questions', '#7c3aed'], exam: ['🎓', 'Examination', '#db2777'], lesson: ['🧪', 'Interactive lesson', '#0d9488'] };
  // the builder's kinds; several are the same database kind with an answer style
  var KINDS = [
    ['Choice', [['mcq', '🔘', 'Multiple choice'], ['tf', '✅', 'True or false'], ['multi', '☑️', 'Several correct answers'], ['match', '🔗', 'Match the pairs'], ['order', '🔢', 'Put in order'], ['classify', '🗂️', 'Sort into groups']]],
    ['Fill in', [['gaps', '✍️', 'Fill in the gaps'], ['cloze', '🔽', 'Drop-down in a sentence'], ['number', '🔟', 'Number with unit'], ['table', '▦', 'Complete a table']]],
    ['Written', [['short', '📝', 'Written answer'], ['essay', '📜', 'Extended answer with rubric'], ['graph', '📈', 'Draw a graph'], ['draw', '✏️', 'Draw a diagram'], ['annotate', '🖊️', 'Annotate a picture']]],
    ['Diagram', [['label', '🏷️', 'Label a diagram'], ['hotspot', '🎯', 'Click the correct part']]],
    ['Content', [['info', '📖', 'Text, picture or video']]]];
  var KN = {}; KINDS.forEach(function (g) { g[1].forEach(function (k) { KN[k[0]] = k; }); });
  var CSS = '.bd{display:grid;grid-template-columns:250px minmax(0,1fr) 360px;gap:14px;align-items:start}@media (max-width:1100px){.bd{grid-template-columns:1fr}}' +
    '.bd-col{background:var(--card,#fff);border:1px solid var(--line,#dde3ea);border-radius:16px;padding:12px;min-width:0}.bd-col h3{margin:2px 0 10px;font-size:1rem}' +
    '.bd-list{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;max-height:62vh;overflow-y:auto;overflow-x:hidden}.bd-it{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px;align-items:center;padding:8px;border-radius:12px;border:2px solid transparent;background:#f8fafc;font-size:.88rem;min-width:0}.bd-it>span:nth-child(2){min-width:0;overflow:hidden}' +
    '.bd-it[aria-current=true]{border-color:#4f46e5;background:#eef2ff}.bd-it:focus-visible{outline:3px solid #a5b4fc}.bd-it .n{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#4f46e5;color:#fff;font-weight:800;font-size:.8rem}.bd-it .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bd-it .m{color:#64748b;font-size:.78rem}' +
    '.bd-step{font:800 .72rem system-ui;letter-spacing:.06em;text-transform:uppercase;color:#0d9488;margin:8px 2px 0}' +
    '.bd-pal{display:grid;gap:6px}.bd-pal details{border:1px solid var(--line,#dde3ea);border-radius:12px;padding:6px 8px}.bd-pal summary{cursor:pointer;font-weight:700}.bd-pal button{all:unset;cursor:pointer;display:block;padding:5px 6px;border-radius:8px;font-size:.88rem}.bd-pal button:hover,.bd-pal button:focus-visible{background:#eef2ff}' +
    '.bd-f{display:grid;grid-template-columns:minmax(0,1fr);gap:4px;margin:0 0 10px;min-width:0}.bd-f>span{font-weight:700;font-size:.88rem}.bd-f input,.bd-f select,.bd-f textarea{font:inherit;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;width:100%;box-sizing:border-box;background:#fff;color:#172033}.bd-f textarea{min-height:90px}.bd-f small{color:#64748b}' +
    '.bd-row{display:flex;gap:10px;flex-wrap:wrap}.bd-row>.bd-f{flex:1;min-width:120px}.bd-opt{display:flex;gap:6px;align-items:center;margin:4px 0}.bd-opt input[type=text]{flex:1;font:inherit;padding:7px 9px;border:1px solid #cbd5e1;border-radius:10px}' +
    '.bd-x{all:unset;cursor:pointer;color:#b91c1c;font-weight:800;padding:0 6px}.bd-add{all:unset;cursor:pointer;color:#4338ca;font-weight:700}.bd-warn{background:#fffbeb;border-left:5px solid #f59e0b;border-radius:10px;padding:8px 10px;font-size:.88rem;color:#78350f}' +
    '.bd-pv{border:2px dashed #c7d2fe;border-radius:14px;padding:12px;background:linear-gradient(160deg,#f8fafc,#eef2ff)}.bd-pv .q{margin:0}.bd-pv label.opt{display:block;padding:7px 10px;border:1px solid #dde3ea;border-radius:10px;margin:5px 0;background:#fff}' +
    '.bd-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between;margin:0 0 12px}.bd-top h2{margin:0}' +
    '.bk-list{display:flex;flex-direction:column;gap:8px;margin:8px 0}.bk-card{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line,#e2e8f0);border-radius:14px;padding:10px 12px;background:var(--card,#fff);cursor:pointer}.bk-card:hover{border-color:#0ea5e9;box-shadow:0 4px 14px rgba(14,165,233,.12)}.bk-card:has(input:checked){border-color:#16a34a;background:#f0fdf4}.bk-card input{margin-top:4px;transform:scale(1.25)}.bk-body{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.bk-meta{font-size:.82rem;color:var(--muted,#64748b)}.bk-q p{margin:2px 0}' +
    '.bk-topics{border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:8px 12px;margin:8px 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:2px 12px}.bk-topics legend{font-weight:700}.bd-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2200;background:#14532d;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);max-width:92vw}' +
    '.bd-ov{position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.6);display:grid;place-items:start center;overflow:auto;padding:24px 12px}.bd-ov>div{background:var(--bg,#fff);color:inherit;border-radius:18px;max-width:860px;width:100%;padding:18px 20px;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '.bd-ov .q{border:1px solid var(--line,#dde3ea);border-radius:14px;padding:12px;margin:10px 0;background:var(--card,#fff)}.bd-ov .res{font-weight:800;margin:6px 0 0}.bd-ov .res.good{color:#15803d}.bd-ov .res.bad{color:#b91c1c}' +
    '.bd-lib{display:grid;gap:10px}.bd-card{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border:1px solid var(--line,#dde3ea);border-left:6px solid var(--k);border-radius:14px;padding:10px 12px;background:var(--card,#fff)}.bd-card h4{margin:0}.bd-card .acts{display:flex;gap:6px;flex-wrap:wrap}@media (max-width:640px){.bd-card{grid-template-columns:1fr}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var missing038 = function (e) { return /main_site|questions_kind_check|violates check constraint|answers_teacher|row-level security/.test(String(e && (e.message || e.details) || e)); };

  S.guard(app, { school: true, anyone: true }).then(function (m) {
    ME = m; IS_ADMIN = !!m.admin; window.BVM_UID = m.user.id;
    var teach = m.admin || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0;
    if (!teach) { app.innerHTML = '<section class="panel"><h2>🧰 Builder</h2><p>The builder is for teachers.</p><p><a class="btn main" href="/dashboard/">Go to my dashboard</a></p></section>'; return; }
    S.db.from('classes').select('id,name,teacher_id').eq('teacher_id', m.user.id).is('archived_at', null).order('name').then(function (r) { MYCLASSES = r.data || []; window.addEventListener('hashchange', route); route(); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function route() {
    var h = location.hash.replace(/^#/, '').split('/');
    if (h[0] === 'new') return start(CAT[h[1]] ? h[1] : 'quiz');
    if (h[0] === 'import') { start('exam', true); return importDialog(); }
    if (h[0] === 'edit' && /^[0-9a-f-]{36}$/.test(h[1] || '')) return load(h[1]);
    library();
  }

  /* ================================================================ My assessments and lessons */
  var FILTER = '';
  function library() {
    app.innerHTML = '<p class="muted">Loading your work…</p>';
    var cols = 'id,title,category,published,created_at,created_by,main_site, quiz_classes(class_id), quiz_questions(question_id)';
    var q = S.db.from('quizzes').select(cols).order('created_at', { ascending: false }); if (!IS_ADMIN) q = q.eq('created_by', ME.user.id);
    q.then(function (r) {
      if (r.error && /main_site/.test(r.error.message || '')) { HAS_MAIN = false; q = S.db.from('quizzes').select(cols.replace(',main_site', '')).order('created_at', { ascending: false }); if (!IS_ADMIN) q = q.eq('created_by', ME.user.id); return q; }
      return r; }).then(function (r) {
      var rows = (r.data || []).filter(function (x) { return CAT[x.category] && !(/^Practice: /.test(x.title || '') && !(x.quiz_classes || []).length && x.created_by !== ME.user.id); }), mine = rows.filter(function (x) { return x.created_by === ME.user.id; }), cn = {}; MYCLASSES.forEach(function (c) { cn[c.id] = c.name; });
      var shown = (IS_ADMIN && FILTER === 'main' ? rows.filter(function (x) { return x.main_site; }) : IS_ADMIN && FILTER === 'others' ? rows.filter(function (x) { return x.created_by !== ME.user.id; }) : mine).filter(function (x) { return !FILTER || FILTER === 'main' || FILTER === 'others' || x.category === FILTER; });
      app.innerHTML = '<div class="row2 cband" style="--k:#4f46e5"><div><p class="label">Builder</p><h2 style="margin:0">🧰 My assessments and lessons</h2></div></div>' +
        '<div class="qlinks" style="margin:12px 0"><a style="--k:#7c3aed" href="#new/quiz">📝 New exam-style questions</a><a style="--k:#db2777" href="#new/exam">🎓 New examination</a><a style="--k:#0d9488" href="#new/lesson">🧪 New interactive lesson</a><a style="--k:#ea580c" href="#import">📄 Import a question paper (PDF)</a><a style="--k:#0ea5e9" href="#" id="gentop">🎯 Generate from topics</a><a style="--k:#db2777" href="/practice/#mine">🃏 Revision questions</a></div>' +
        '<nav class="tabs" aria-label="Show">' + [['', 'All mine'], ['quiz', '📝 Question sets'], ['exam', '🎓 Examinations'], ['lesson', '🧪 Lessons']].concat(IS_ADMIN ? [['main', '🌐 On the main site'], ['others', '👥 Other teachers\' work']] : []).map(function (t) { return '<a href="#" data-f="' + t[0] + '" aria-selected="' + (FILTER === t[0]) + '">' + t[1] + '</a>'; }).join('') + '</nav>' +
        '<p class="small muted">' + (IS_ADMIN ? 'You are the admin: tick <b>On the main site</b> to make an item part of the main site, where every teacher can find it and add it to their classes.' : 'What you build stays in your library and in the classes you add it to. Only the admin can put it on the main site.') + '</p>' +
        '<div class="bd-lib">' + (shown.length ? shown.map(function (x) { var K = CAT[x.category];
          return '<article class="bd-card" style="--k:' + K[2] + '"><span style="font-size:1.6rem" aria-hidden="true">' + K[0] + '</span><div><h4>' + E(x.title) + '</h4><span class="small muted">' + K[1] + ' · ' + x.quiz_questions.length + ' item' + (x.quiz_questions.length === 1 ? '' : 's') +
            ' · ' + (x.quiz_classes.length ? 'in ' + E(x.quiz_classes.map(function (c) { return cn[c.class_id] || 'a class'; }).join(', ')) : 'not in a class yet') + (x.main_site ? ' · <b style="color:#4338ca">🌐 main site</b>' : '') + '</span></div>' +
            '<div class="acts">' + (x.created_by === ME.user.id || IS_ADMIN ? '<a class="btn sm main" href="#edit/' + x.id + '">✏️ Edit</a>' : '') + '<a class="btn sm" href="' + (x.category === 'lesson' ? '/lesson/#' : x.category === 'exam' ? '/exams/#' : '/quizzes/#') + x.id + '" target="_blank" rel="noopener">👁 Open ↗</a>' +
            (IS_ADMIN && HAS_MAIN ? '<label class="chk small"><input type="checkbox" data-main="' + x.id + '"' + (x.main_site ? ' checked' : '') + '> On the main site</label>' : '') + '</div></article>'; }).join('') :
          '<p class="emptybox">Nothing here yet. Use the buttons above to build your first ' + (FILTER === 'lesson' ? 'lesson' : FILTER === 'exam' ? 'examination' : 'question set or lesson') + '.</p>') + '</div>';
      app.querySelectorAll('[data-f]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); FILTER = a.getAttribute('data-f'); library(); }; });
      var gt = app.querySelector('#gentop'); if (gt) gt.onclick = function (e) { e.preventDefault(); generateDialog(); };
      app.querySelectorAll('[data-main]').forEach(function (c) { c.onchange = function () { var on = c.checked; S.db.from('quizzes').update({ main_site: on, published: on ? true : undefined }).eq('id', c.getAttribute('data-main')).then(function (r) { if (r.error) { c.checked = !on; c.parentNode.title = S.nice(r.error); c.parentNode.style.color = '#b91c1c'; } }); }; });
    });
  }

  /* ================================================================ the item being built */
  function newQ(kind, section) {
    var q = { id: null, kind: kind, prompt: '', marks: kind === 'info' ? 0 : kind === 'essay' ? 6 : 1, section: section || 'Explore', image: '', options: kind === 'tf' ? ['True', 'False'] : kind === 'mcq' ? ['', '', '', ''] : [], correct: kind === 'tf' ? 0 : -1,
      model: '', points: '', rubric: '', explanation: '', axes: 'x,y', media: [], crit: '', diff: '' };
    if (QT && QT.has(kind)) q.draft = QT.blank(kind);
    return q;
  }
  function start(cat, quiet) {
    ST = { id: null, cat: cat, title: '', instructions: '', subject: '', time: '', attempts: cat === 'lesson' ? 3 : cat === 'exam' ? 1 : 2, show: cat !== 'exam', main: false, classes: [], questions: [newQ(cat === 'lesson' ? 'info' : 'mcq', cat === 'lesson' ? 'Question' : 'Section A')], changed: false };
    SEL = 0; draw(); if (!quiet) genDialog();   // a new item starts with "Build it for me" (or a blank page)
  }
  function load(id) {
    app.innerHTML = '<p class="muted">Opening…</p>';
    Promise.all([S.db.from('quizzes').select('*').eq('id', id).maybeSingle(), S.db.from('quiz_classes').select('class_id').eq('quiz_id', id),
      S.db.from('quiz_questions').select('position, questions(*, question_answers(*))').eq('quiz_id', id).order('position')]).then(function (x) {
      var q = x[0].data; if (!q) { app.innerHTML = '<p class="msg">This item was not found, or it is not yours to edit.</p><p><a class="btn" href="#">Back to my library</a></p>'; return; }
      if (q.created_by !== ME.user.id && !IS_ADMIN) { app.innerHTML = '<p class="msg">Only the teacher who made this item can edit it.</p><p><a class="btn" href="#">Back to my library</a></p>'; return; }
      HAS_MAIN = 'main_site' in q;
      ST = { id: q.id, cat: CAT[q.category] ? q.category : 'quiz', title: q.title || '', instructions: q.instructions || '', subject: q.subject || '', time: q.time_limit_minutes || '', attempts: q.max_attempts || 1, show: !!q.show_results, main: !!q.main_site,
        classes: (x[1].data || []).map(function (c) { return c.class_id; }), questions: [], changed: false, removed: [] };
      ST.questions = (x[2].data || []).map(function (z) { return fromRow(z.questions || {}); });
      if (!ST.questions.length) ST.questions.push(newQ(ST.cat === 'lesson' ? 'info' : 'mcq', ST.cat === 'lesson' ? 'Question' : ''));
      SEL = 0; draw();
      var tu = null; try { tu = JSON.parse(sessionStorage.getItem('bv-topup') || 'null'); sessionStorage.removeItem('bv-topup'); } catch (e) {}
      if (tu && tu.id === ST.id && tu.n > 0) { GEN.count = tu.n; GEN.types = tu.types; if (tu.crit) GEN.criteria = [tu.crit]; GEN.objectives = 'Questions on: ' + tu.title; genDialog(true, 'The question bank had ' + tu.n + ' fewer questions than you asked for. Build the rest with ✨ AI on the same topics?'); }
    });
  }

  /* ================================================================ the three panels */
  function draw() {
    var K = CAT[ST.cat];
    app.innerHTML = '<div class="bd-top"><div><p class="label"><a href="#">← My assessments and lessons</a></p><h2>' + K[0] + ' ' + (ST.id ? 'Edit' : 'New') + ' ' + K[1].toLowerCase() + '</h2></div>' +
      '<div class="acts"><button class="btn" type="button" id="gen" style="background:linear-gradient(120deg,#7c3aed,#db2777);color:#fff;border-color:transparent">✨ Build it for me</button><button class="btn" type="button" id="bank" style="background:linear-gradient(120deg,#0ea5e9,#22c55e);color:#fff;border-color:transparent">📚 Question bank</button><button class="btn" type="button" id="imp" style="background:linear-gradient(120deg,#ea580c,#f59e0b);color:#fff;border-color:transparent">📄 Import paper</button><button class="btn" type="button" id="pvall">👁 Preview as a student</button><button class="btn main" type="button" id="save">💾 Preview and save</button></div></div>' +
      '<div class="bd"><aside class="bd-col" aria-label="Questions"><h3>Items <span class="small muted" id="tot"></span></h3><div class="bd-list" id="list"></div>' +
      '<h3 style="margin-top:14px">＋ Add</h3><div class="bd-pal">' + KINDS.map(function (g, gi) { return '<details' + (gi === 0 ? ' open' : '') + '><summary>' + g[0] + '</summary>' + g[1].map(function (k) { return '<button type="button" data-add="' + k[0] + '">' + k[1] + ' ' + k[2] + '</button>'; }).join('') + '</details>'; }).join('') + '</div></aside>' +
      '<section class="bd-col" aria-label="Edit the item" id="ed"></section>' +
      '<aside class="bd-col" aria-label="Settings and preview"><h3>⚙️ Settings</h3><div id="set"></div><h3 style="margin-top:14px">👁 What the student sees</h3><div class="bd-pv" id="pv"></div></aside></div>';
    app.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { var cur = ST.questions[SEL] || {}; ST.questions.splice(SEL + 1, 0, newQ(b.getAttribute('data-add'), cur.section || (ST.cat === 'lesson' ? 'Explore' : ''))); SEL++; ST.changed = true; list(); editor(); preview(); }; });
    app.querySelector('#pvall').onclick = function () { overlay(false); };
    app.querySelector('#gen').onclick = function () { genDialog(); }; app.querySelector('#imp').onclick = function () { importDialog(); }; app.querySelector('#bank').onclick = bankDialog;
    app.querySelector('#save').onclick = function () { overlay(true); };
    settings(); list(); editor(); preview();
  }
  function label(q) { var t = q.kind === 'info' ? (q.prompt || 'Text, picture or video') : (q.prompt || ''); t = T ? T.text(t) : t; return t.replace(/\s+/g, ' ').trim().slice(0, 60) || '(no question yet)'; }
  function list() {
    var box = app.querySelector('#list'), h = '', last = null, n = 0;
    ST.questions.forEach(function (q, i) {
      if (ST.cat === 'lesson' && q.section !== last) { last = q.section; h += '<p class="bd-step">' + E(q.section || 'Explore') + '</p>'; }
      if (q.kind !== 'info') n++;
      h += '<button type="button" class="bd-it" data-i="' + i + '" aria-current="' + (i === SEL) + '"><span class="n">' + (q.kind === 'info' ? 'i' : n) + '</span><span><span class="t">' + KN[q.kind][1] + ' ' + E(label(q)) + '</span><br><span class="m">' + (q.ai ? '<b style="color:#b45309">🔎 check me</b> · ' : '') + KN[q.kind][2] + (q.marks ? ' · ' + q.marks + ' mark' + (q.marks > 1 ? 's' : '') : '') + '</span></span><span aria-hidden="true">›</span></button>';
    });
    box.innerHTML = h;
    var total = ST.questions.reduce(function (a, q) { return a + (+q.marks || 0); }, 0); app.querySelector('#tot').textContent = '(' + ST.questions.length + ', ' + total + ' marks)';
    box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { SEL = +b.getAttribute('data-i'); if (ST.questions[SEL]) ST.questions[SEL].ai = false; list(); editor(); preview(); }; });
  }
  function touch() { ST.changed = true; clearTimeout(touch.t); touch.t = setTimeout(function () { list(); preview(); }, 250); }

  function pic(o) { return T && T.optPic ? T.optPic(o) : null; }
  function field(lab, html, hint) { return '<label class="bd-f"><span>' + lab + '</span>' + html + (hint ? '<small>' + hint + '</small>' : '') + '</label>'; }
  function settings() {
    var box = app.querySelector('#set'), K = CAT[ST.cat];
    box.innerHTML = field('Title', '<input id="s-t" value="' + E(ST.title) + '" placeholder="' + (ST.cat === 'lesson' ? 'e.g. Photosynthesis: how plants make food' : 'e.g. Grade 10 · Physics · Electromagnetism') + '">') +
      field('Instructions for students', '<textarea id="s-i" rows="2">' + E(ST.instructions) + '</textarea>') +
      '<div class="bd-row">' + field('Type', '<select id="s-c">' + Object.keys(CAT).map(function (c) { return '<option value="' + c + '"' + (ST.cat === c ? ' selected' : '') + '>' + CAT[c][0] + ' ' + CAT[c][1] + '</option>'; }).join('') + '</select>') +
      field('Subject (Grades 6 to 10)', '<select id="s-s"><option value="">Not Grade 6 to 10 science</option>' + ['Biology', 'Chemistry', 'Physics'].map(function (x) { return '<option' + (ST.subject === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>') + '</div>' +
      '<div class="bd-row">' + field('Time (minutes)', '<input id="s-m" type="number" min="1" max="600" value="' + E(ST.time) + '" placeholder="standard">', ST.cat === 'exam' ? 'Handed in at zero.' : 'Warns at zero; extra time is recorded.') + field('Attempts', '<input id="s-a" type="number" min="1" max="10" value="' + E(ST.attempts) + '">') + '</div>' +
      (ST.cat === 'lesson' ? '' : '<label class="chk"><input type="checkbox" id="s-r"' + (ST.show ? ' checked' : '') + '> Show scores straight after handing in (otherwise you release them)</label>') +
      '<fieldset style="margin-top:10px"><legend>Add to my classes</legend>' + (MYCLASSES.length ? MYCLASSES.map(function (c) { return '<label class="chk"><input type="checkbox" name="cl" value="' + c.id + '"' + (ST.classes.indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + E(c.name) + '</label>'; }).join('') : '<p class="small muted">You have no classes yet. It stays in your library until you add it to a class.</p>') + '</fieldset>' +
      (IS_ADMIN && HAS_MAIN ? '<label class="chk" style="margin-top:8px"><input type="checkbox" id="s-main"' + (ST.main ? ' checked' : '') + '> 🌐 On the main site (admin only): every teacher can find it and add it to their classes</label>' : '');
    var on = function (sel, fn) { var el = box.querySelector(sel); if (el) el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () { fn(el); ST.changed = true; }); };
    on('#s-t', function (el) { ST.title = el.value; }); on('#s-i', function (el) { ST.instructions = el.value; }); on('#s-s', function (el) { ST.subject = el.value; });
    on('#s-m', function (el) { ST.time = el.value; }); on('#s-a', function (el) { ST.attempts = el.value; }); on('#s-r', function (el) { ST.show = el.checked; }); on('#s-main', function (el) { ST.main = el.checked; });
    on('#s-c', function (el) { var was = ST.cat; ST.cat = el.value; if ((was === 'lesson') !== (ST.cat === 'lesson')) ST.questions.forEach(function (q) { q.section = ST.cat === 'lesson' ? (STEPS.indexOf(q.section) >= 0 ? q.section : 'Explore') : ''; }); draw(); });
    box.querySelectorAll('[name=cl]').forEach(function (c) { c.onchange = function () { ST.classes = [].map.call(box.querySelectorAll('[name=cl]:checked'), function (x) { return x.value; }); ST.changed = true; }; });
  }

  function editor() {
    var box = app.querySelector('#ed'), q = ST.questions[SEL]; if (!q) { box.innerHTML = '<p class="muted">Add an item from the list on the left.</p>'; return; }
    var K = KN[q.kind], auto = QT && QT.has(q.kind);
    var h = '<div class="bd-top"><h3 style="margin:0">' + K[1] + ' ' + K[2] + '</h3><div class="acts"><button type="button" class="btn sm" id="up" ' + (SEL ? '' : 'disabled') + ' aria-label="Move up">▲</button><button type="button" class="btn sm" id="dn" ' + (SEL < ST.questions.length - 1 ? '' : 'disabled') + ' aria-label="Move down">▼</button>' +
      '<button type="button" class="btn sm" id="dup">⧉ Copy</button><button type="button" class="btn sm" id="del" style="color:#b91c1c">🗑 Remove</button></div></div>';
    if (auto && !HAS_MAIN) h += '<p class="bd-warn">This kind of question can be built and previewed now. It can be saved once the database update for the new question types is run.</p>';
    h += '<div class="bd-row">' + (ST.cat === 'lesson' ? field('Lesson step', '<select id="e-sec">' + STEPS.map(function (s) { return '<option' + (q.section === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>') : field('Section (optional)', '<input id="e-sec" value="' + E(q.section || '') + '" placeholder="e.g. Section A or Criterion A">')) +
      (q.kind === 'info' ? '' : field('Marks', '<input id="e-mk" type="number" min="0" max="50" value="' + E(q.marks) + '">') +
        field('MYP criterion', '<select id="e-cr"><option value="">—</option>' + ['A', 'B', 'C', 'D'].map(function (c) { return '<option' + (q.crit === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>') +
        field('Difficulty', '<select id="e-df"><option value="">—</option>' + DIFF.map(function (d, i) { return '<option value="' + (i + 1) + '"' + (+q.diff === i + 1 ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select>')) + '</div>' +
      field(q.kind === 'info' ? 'Text (**bold**, a line starting with • for a list, a YouTube link on its own line shows the video)' : 'Question', '<textarea id="e-p" rows="' + (q.kind === 'info' ? 7 : 3) + '">' + E(q.prompt) + '</textarea>') +
      (q.kind === 'label' || q.kind === 'hotspot' ? '' : window.BVM ? '<div class="bd-f"><span>' + (q.kind === 'annotate' ? 'Picture students draw and write on' : 'Picture or diagram (optional)') + '</span><div id="e-img"></div></div>' : field('Picture (optional)', '<input id="e-img" type="url" value="' + E(q.image) + '" placeholder="https://… link to a picture">')) + (window.BVM ? '<div class="bd-f"><span>More pictures, video, sound, graphs from data and drawings (optional)</span><div id="e-media"></div></div>' : '');
    if (q.kind === 'mcq' || q.kind === 'tf') h += '<fieldset><legend>Choices: tick the correct one</legend><div id="e-opts"></div>' + (q.kind === 'mcq' ? '<button type="button" class="bd-add" id="e-oadd">＋ Add a choice</button>' : '') + '</fieldset>' + field('Why the answer is correct (shown in feedback)', '<textarea id="e-ex" rows="2">' + E(q.explanation) + '</textarea>');
    if (/^(short|essay|graph|draw|annotate)$/.test(q.kind)) {
      if (q.kind === 'graph') h += field('Axis labels (x, y)', '<input id="e-ax" value="' + E(q.axes) + '" placeholder="Time / s, Distance / m">');
      h += field('Model answer', '<textarea id="e-mo" rows="3">' + E(q.model) + '</textarea>', 'Students see it after they finish (lessons: after each step).') +
        field('Marking points, one per line', '<textarea id="e-pt" rows="4" placeholder="Releases carbon dioxide: carbon dioxide / CO2\nIt is a greenhouse gas: greenhouse">' + E(q.points) + '</textarea>', 'Write what earns the mark, then a colon and the words that show it, separated by /. Each line is one mark. Answers the rules cannot decide go to you to mark.');
      if (q.kind === 'essay') h += field('Rubric (levels and what each needs)', '<textarea id="e-ru" rows="5" placeholder="1–2: states one relevant point\n3–4: explains with an example\n5–6: evaluates with evidence and a conclusion">' + E(q.rubric) + '</textarea>', 'You mark extended answers with this rubric; the rules only suggest a mark.');
    }
    if (auto) h += '<fieldset><legend>Answer</legend><div id="e-auto"></div><div id="e-prob" class="small" style="color:#b45309;margin-top:6px"></div></fieldset>';
    box.innerHTML = h;
    var bind = function (sel, fn) { var el = box.querySelector(sel); if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { fn(el.value); touch(); }); };
    bind('#e-sec', function (v) { q.section = v; }); bind('#e-cr', function (v) { q.crit = v; }); bind('#e-df', function (v) { q.diff = v; }); bind('#e-mk', function (v) { q.marks = Math.max(0, +v || 0); }); bind('#e-p', function (v) { q.prompt = v; }); bind('input#e-img', function (v) { q.image = String(v || '').trim(); if (q.kind === 'label' || q.kind === 'hotspot') { q.draft.image = q.image; editor(); } });
    bind('#e-ex', function (v) { q.explanation = v; }); bind('#e-mo', function (v) { q.model = v; }); bind('#e-pt', function (v) { q.points = v; }); bind('#e-ru', function (v) { q.rubric = v; }); bind('#e-ax', function (v) { q.axes = v; });
    var opts = box.querySelector('#e-opts');
    if (opts) { var drawOpts = function () { opts.innerHTML = q.options.map(function (o, j) { return '<div class="bd-opt"><input type="radio" name="e-ok" value="' + j + '"' + (q.correct === j ? ' checked' : '') + ' aria-label="Choice ' + 'ABCDEFGH'.charAt(j) + ' is correct"><b>' + 'ABCDEFGH'.charAt(j) + '</b>' + (pic(o) ? '<img src="' + E(pic(o).src) + '" alt="" style="height:44px;max-width:80px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0">' : '') + '<input type="text" data-o="' + j + '" value="' + E(pic(o) ? pic(o).text : o) + '"' + (q.kind === 'tf' ? ' readonly' : '') + ' placeholder="' + (pic(o) ? 'Words under the picture (optional)' : '') + '" aria-label="Choice ' + 'ABCDEFGH'.charAt(j) + '">' +
        (q.kind === 'mcq' && window.BVM ? '<button type="button" class="bd-x" data-op="' + j + '" title="' + (pic(o) ? 'Change the picture' : 'Make this choice a picture') + '" aria-label="Picture for choice ' + 'ABCDEFGH'.charAt(j) + '">🖼</button>' + (pic(o) ? '<button type="button" class="bd-x" data-onp="' + j + '" title="Remove the picture" aria-label="Remove the picture from choice ' + 'ABCDEFGH'.charAt(j) + '">⊘</button>' : '') : '') +
        (q.kind === 'mcq' ? '<button type="button" class="bd-x" data-ox="' + j + '" aria-label="Remove choice ' + 'ABCDEFGH'.charAt(j) + '">✕</button>' : '') + '</div>'; }).join('');
        opts.querySelectorAll('[data-op]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-op'), cur = pic(q.options[j]); BVM.open.image(cur ? { t: 'image', src: cur.src, cap: cur.text } : null, ME.user.id, function (m) { q.options[j] = '[[img:' + m.src + ']] ' + (m.cap || (cur ? cur.text : '')); drawOpts(); touch(); }); }; });
        opts.querySelectorAll('[data-onp]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-onp'); q.options[j] = pic(q.options[j]).text; drawOpts(); touch(); }; });
        opts.querySelectorAll('[name=e-ok]').forEach(function (r) { r.onchange = function () { q.correct = +r.value; touch(); }; });
        opts.querySelectorAll('[data-o]').forEach(function (t) { t.oninput = function () { var j = +t.getAttribute('data-o'), pc = pic(q.options[j]); q.options[j] = pc ? '[[img:' + pc.src + ']] ' + t.value : t.value; touch(); }; });
        opts.querySelectorAll('[data-ox]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-ox'); q.options.splice(j, 1); if (q.correct === j) q.correct = -1; else if (q.correct > j) q.correct--; drawOpts(); touch(); }; }); };
      drawOpts(); var oa = box.querySelector('#e-oadd'); if (oa) oa.onclick = function () { if (q.options.length < 8) { q.options.push(''); drawOpts(); } }; }
    if (auto) { if ((q.kind === 'label' || q.kind === 'hotspot') && !q.draft.image) q.draft.image = q.image;
      var prob = function () { var p = QT.problems(q.kind, q.draft); box.querySelector('#e-prob').textContent = p.length ? '⚠ ' + p.join(' ') : ''; };
      box.querySelector('#e-auto').appendChild(QT.editor(q.kind, q.draft, function () { if (q.draft.image && (q.kind === 'label' || q.kind === 'hotspot')) q.image = q.draft.image; prob(); touch(); })); prob(); }
    if (window.BVM) BVM.editor(box.querySelector('#e-media'), q.media = q.media || [], function () { touch(); }, { uid: ME.user.id });
    var pfh = box.querySelector('div#e-img'); if (pfh && window.BVM) BVM.picField(pfh, { value: q.image || '', uid: ME.user.id, onChange: function (src) { q.image = src; touch(); } });
    if (window.BVT && BVT.keyboard) { var pta = box.querySelector('#e-p'); if (pta) BVT.writeBar(pta, { table: true }); }
    box.querySelector('#up').onclick = function () { move(-1); }; box.querySelector('#dn').onclick = function () { move(1); };
    box.querySelector('#dup').onclick = function () { var c = JSON.parse(JSON.stringify(q)); c.id = null; ST.questions.splice(SEL + 1, 0, c); SEL++; ST.changed = true; list(); editor(); preview(); };
    box.querySelector('#del').onclick = function () { if (q.id) (ST.removed = ST.removed || []).push(q.id); ST.questions.splice(SEL, 1); SEL = Math.max(0, SEL - 1); ST.changed = true; list(); editor(); preview(); };
  }
  function move(d) { var j = SEL + d; if (j < 0 || j >= ST.questions.length) return; var q = ST.questions.splice(SEL, 1)[0]; ST.questions.splice(j, 0, q); SEL = j; ST.changed = true; list(); editor(); preview(); }

  /* ================================================================ how the student sees an item */
  function rich(t) { return T && T.rich ? T.rich(t || '') : '<p>' + E(t || '').replace(/\n/g, '<br>') + '</p>'; }
  function promptOf(q) { if (!T) return q.prompt; var md = q.media || []; if (q.kind === 'graph') { var a = String(q.axes || '').split(','); return T.join(q.prompt, 'graph', (a[0] || 'x').trim(), (a[1] || 'y').trim(), md); } if (q.kind === 'draw' || q.kind === 'annotate') return T.join(q.prompt, q.kind, '', '', md); var pr = T.parse(q.prompt); return T.join(q.prompt, pr.mode, pr.x, pr.y, md); }
  function studentView(q, n, onAns) {
    var wrap = document.createElement('div'); wrap.className = 'q';
    if (q.kind === 'info') { wrap.innerHTML = (q.image ? '<img src="' + E(q.image) + '" alt="" style="max-width:100%;border-radius:10px">' : '') + rich(promptOf(q)); return wrap; }
    wrap.innerHTML = '<p>' + (/^\d+\s*(\([a-z]\)|\.\s)/i.test(q.prompt || '') ? '' : '<b>' + n + '.</b> ') + rich(T ? T.text(q.prompt) : q.prompt).replace(/^<p>|<\/p>$/g, '') + ' <span class="pill">' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + '</span></p>' + ((q.media || []).length && T.mediaHtml ? T.mediaHtml(q.media) : '') + (q.image && q.kind !== 'annotate' && q.kind !== 'label' && q.kind !== 'hotspot' ? '<img src="' + E(q.image) + '" alt="" style="max-width:100%;max-height:320px;border-radius:10px">' : '');
    if (q.kind === 'mcq' || q.kind === 'tf') { q.options.forEach(function (o, j) { var l = document.createElement('label'); l.className = 'opt'; l.innerHTML = '<input type="radio" name="pv' + n + Math.random().toString(36).slice(2, 6) + '" value="' + j + '"> ' + (o ? (T && T.opt ? T.opt(o) : E(o)) : '(empty choice)'); l.querySelector('input').onchange = function () { onAns(j); }; wrap.appendChild(l); }); }
    else if ((q.kind === 'label' || q.kind === 'hotspot') && !q.draft.image) { var no = document.createElement('p'); no.className = 'small muted'; no.textContent = '🖼 The picture appears here once you add it.'; wrap.appendChild(no); }
    else if (QT && QT.has(q.kind)) { var p = QT.pack(q.kind, q.draft); wrap.appendChild(QT.student(q.kind, p.options, '', onAns)); }
    else if (/^(graph|draw|annotate)$/.test(q.kind) && T && T.pad) { var hp = document.createElement('div'); wrap.appendChild(hp); var a = String(q.axes || '').split(','); try { T.pad(hp, { mode: q.kind, x: (a[0] || 'x').trim(), y: (a[1] || 'y').trim(), image: q.image, onchange: function () { onAns('drawn'); } }); } catch (e) {} }
    else { var ta = document.createElement('textarea'); ta.rows = q.kind === 'essay' ? 8 : q.marks >= 3 ? 5 : 3; ta.placeholder = 'Type your answer'; ta.style.cssText = 'width:100%;box-sizing:border-box;font:inherit;padding:8px;border-radius:10px;border:1px solid #cbd5e1'; ta.oninput = function () { onAns(ta.value); }; wrap.appendChild(ta); }
    return wrap;
  }
  function preview() {
    var box = app.querySelector('#pv'), q = ST.questions[SEL]; if (!box) return; box.innerHTML = ''; if (!q) return;
    var n = ST.questions.slice(0, SEL + 1).filter(function (x) { return x.kind !== 'info'; }).length;
    box.appendChild(studentView(q, n, function () {}));
  }
  function mark(q, a) {   // the same marking the server does for the automatic kinds; written answers are marked after handing in
    if (a == null || a === '') return { got: 0, max: q.marks, text: 'No answer.' };
    if (q.kind === 'mcq' || q.kind === 'tf') return { got: a === q.correct ? q.marks : 0, max: q.marks, text: a === q.correct ? 'Correct.' : 'The correct answer is ' + (q.options[q.correct] || '(no correct choice ticked!)') + '.' };
    if (QT && QT.has(q.kind)) { var p = QT.pack(q.kind, q.draft), s = QT.score(q.kind, p.options, p.accepted, a, q.marks); return { got: s.got, max: q.marks, text: (s.of > 1 ? s.hit + ' of ' + s.of + ' correct. ' : '') + (s.hit < s.of ? 'Correct answer: ' + p.model : 'Correct.') }; }
    return { got: null, max: q.marks, text: 'Written answers are marked by your marking points after handing in' + (q.model ? '. Model answer: ' + q.model : '.') };
  }
  function overlay(saving) {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Preview');
    var inner = document.createElement('div'), K = CAT[ST.cat], answers = {}, probs = check(); ov.appendChild(inner);
    inner.innerHTML = '<div class="bd-top"><div><p class="label">Preview: this is what a student sees</p><h2>' + K[0] + ' ' + E(ST.title || '(no title yet)') + '</h2></div><button class="btn" type="button" data-close>✕ Close</button></div>' + (ST.instructions ? '<p>' + E(ST.instructions) + '</p>' : '') +
      (ST.questions.some(function (q) { return q.ai; }) ? '<div class="bd-warn">🔎 ' + ST.questions.filter(function (q) { return q.ai; }).length + ' automatically built items have not been opened yet. You can save, but please check them first.</div>' : '') + (probs.length ? '<div class="bd-warn"><b>Fix these before saving:</b><ul>' + probs.map(function (p) { return '<li>' + E(p) + '</li>'; }).join('') + '</ul></div>' : '') + '<div id="ovq"></div>' +
      '<div class="acts" style="position:sticky;bottom:0;background:inherit;padding:10px 0"><button class="btn" type="button" id="ovchk">✔ Check my answers</button>' + (saving ? '<button class="btn main" type="button" id="ovsave"' + (probs.length ? ' disabled' : '') + '>💾 Looks right: save</button>' : '') + '<button class="btn" type="button" data-close>Back to editing</button><span class="msg" id="ovm" role="status"></span></div>';
    var qbox = inner.querySelector('#ovq'), n = 0, last = null;
    ST.questions.forEach(function (q, i) {
      if (ST.cat === 'lesson' && q.section !== last) { last = q.section; var hh = document.createElement('h3'); hh.textContent = (STEPS.indexOf(q.section) + 1) + '. ' + q.section; hh.style.color = '#0d9488'; qbox.appendChild(hh); }
      if (q.kind !== 'info') n++;
      var v = studentView(q, n, function (a) { answers[i] = a; }); v.setAttribute('data-i', i); qbox.appendChild(v); });
    inner.querySelector('#ovchk').onclick = function () { var got = 0, max = 0;
      qbox.querySelectorAll('[data-i]').forEach(function (el) { var i = +el.getAttribute('data-i'), q = ST.questions[i]; if (q.kind === 'info') return; var r = mark(q, answers[i]), old = el.querySelector('.res'); if (old) old.remove();
        var p = document.createElement('p'); p.className = 'res ' + (r.got == null ? '' : r.got === r.max ? 'good' : 'bad'); p.textContent = (r.got == null ? '✍ ' : r.got === r.max ? '✔ ' : '✘ ') + (r.got == null ? '' : r.got + ' / ' + r.max + ' · ') + r.text; el.appendChild(p); if (r.got != null) { got += r.got; max += r.max; } });
      inner.querySelector('#ovm').textContent = 'Automatic marks: ' + got + ' / ' + max + '.'; };
    inner.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { ov.remove(); }; });
    var sv = inner.querySelector('#ovsave'); if (sv) sv.onclick = function () { sv.disabled = true; inner.querySelector('#ovm').textContent = 'Saving…'; save().then(function (id) { ov.remove(); ST.changed = false; done(id); }, function (e) { sv.disabled = false; inner.querySelector('#ovm').textContent = missing038(e) ? 'Not saved: the new question types and teachers\' answer keys switch on when the database update for the builder is run. Ask the admin.' : 'Not saved: ' + S.nice(e); }); };
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); });
    document.body.appendChild(ov); inner.querySelector('[data-close]').focus();
  }
  function check() {
    var out = []; if (!ST.title.trim()) out.push('Give it a title (Settings).');
    if (!ST.questions.some(function (q) { return q.kind !== 'info'; })) out.push('Add at least one question.');
    ST.questions.forEach(function (q, i) { var n = 'Item ' + (i + 1) + ': ';
      if (q.kind !== 'info' && !String(q.prompt).trim() && !(QT && QT.has(q.kind) && /gaps|cloze|table/.test(q.kind))) out.push(n + 'type the question.');
      if (q.kind === 'info' && !String(q.prompt).trim() && !q.image) out.push(n + 'add text or a picture.');
      if (q.kind === 'mcq' && (q.options.filter(function (o) { return String(o).trim(); }).length < 2 || q.correct < 0 || !String(q.options[q.correct] || '').trim())) out.push(n + 'give at least two choices and tick the correct one.');
      if (q.kind === 'tf' && q.correct < 0) out.push(n + 'tick True or False.');
      if (q.kind === 'annotate' && !q.image) out.push(n + 'add the picture to annotate.');
      if (QT && QT.has(q.kind)) QT.problems(q.kind, q.draft).forEach(function (p) { out.push(n + p); });
      if (q.kind !== 'info' && !(+q.marks > 0)) out.push(n + 'give it at least 1 mark.'); });
    return out;
  }

  /* ================================================================ ✨ Build it for me
     The teacher uploads files and/or types objectives; the files are read in the browser (site_assets/quiz-import.js);
     the server function build-draft asks the AI in small steps (plan, then a few items at a time, then pictures);
     every item lands here marked "check me" for the teacher to read, edit, preview and save.
     If the AI cannot help, the lesson is laid out from the files by fixed rules instead (the old lesson maker). */
  var LEVELS = ['Grade 6 (MYP 1)', 'Grade 7 (MYP 2)', 'Grade 8 (MYP 3)', 'Grade 9 (MYP 4)', 'Grade 10 (MYP 5)', 'IGCSE Core', 'IGCSE Extended', 'AS Level', 'A Level', 'IB Diploma SL', 'IB Diploma HL'];
  var GEN_TYPES = [['mcq', 'Multiple choice'], ['tf', 'True or false'], ['multi', 'Several correct'], ['match', 'Match'], ['order', 'Put in order'], ['classify', 'Sort into groups'], ['gaps', 'Fill in the gaps'], ['cloze', 'Drop-down sentence'], ['number', 'Calculation'], ['table', 'Complete a table'], ['short', 'Written answer'], ['essay', 'Extended answer'], ['graph', 'Draw a graph'], ['draw', 'Draw a diagram']];
  var GEN = { level: '', files: [], objectives: '', count: 0, types: null, criteria: ['A', 'C', 'D'], pics: true, mode: 'replace' };
  try { GEN.level = localStorage.getItem('bv-gen-level') || ''; } catch (e) {}
  function blankItems() { return ST.questions.every(function (q) { return !String(q.prompt || '').trim() && !(q.draft && JSON.stringify(q.draft).replace(/["\[\]{}:,]|choices|ok|true|false|t|pairs|l|r|items|groups|g|text|value|tol|unit|cols|rows|image|spots|extra|x|y|ratio/g, '').trim()); }); }
  function genDialog(addMode, note) {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Build it for me');
    var K = CAT[ST.cat], lesson = ST.cat === 'lesson', myp = function () { return /MYP/.test(GEN.level); };
    if (!GEN.count) GEN.count = lesson ? 16 : ST.cat === 'exam' ? 20 : 10;
    var inner = document.createElement('div'); ov.appendChild(inner);
    inner.innerHTML = '<div class="bd-top"><div><p class="label">' + K[0] + ' ' + K[1] + '</p><h2>✨ Build it for me</h2></div><button class="btn" type="button" data-close>✕</button></div>' +
      (note ? '<p class="bd-warn">' + E(note) + '</p>' : '') + '<p>Upload your notes, slides, worksheet or past paper, or type the objectives, or both. ' + (lesson ? 'You get a complete six-step inquiry lesson (question, explore, test, explain, challenge, reflect) with reading text, real pictures and a mix of question types.' : 'You get a complete set of questions with answer keys, marking points and model answers.') + ' Every item is marked <b>check me</b> until you have opened it. Nothing is saved until you preview and save.</p>' +
      '<div class="bd-row">' + field('Title or topic', '<input id="g-t" value="' + E(ST.title) + '" placeholder="e.g. Photosynthesis">') + field('Level', '<select id="g-l"><option value="">Choose…</option>' + LEVELS.map(function (l) { return '<option' + (GEN.level === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>') + '</div>' +
      field('Objectives or what to cover (optional)', '<textarea id="g-o" rows="3" placeholder="One per line, e.g.\nDescribe how plants make glucose\nExplain how light intensity affects the rate of photosynthesis">' + E(GEN.objectives) + '</textarea>') +
      field('Files (optional): PDF, Word, PowerPoint, Excel, web page, text or pictures', '<input id="g-f" type="file" multiple accept=".pdf,.docx,.dotx,.pptx,.potx,.ppsx,.xlsx,.xlsm,.odt,.odp,.ods,.csv,.tsv,.html,.htm,.rtf,.txt,.md,image/*">', 'Pictures in your files are used in the lesson. The files stay on your device: only their text is sent to the AI.') +
      '<div class="bd-row">' + field(lesson ? 'Length' : 'Number of questions', lesson ? '<select id="g-n"><option value="12">Short (about 12 items, 40 min)</option><option value="16">Standard (about 16 items, 60 min)</option><option value="22">Long (about 22 items, 80 min)</option></select>' : '<input id="g-n" type="number" min="3" max="40" value="' + GEN.count + '">') +
        field('If the builder already has items', '<select id="g-m"><option value="replace">Replace them</option><option value="add">Add after them</option></select>') + '</div>' +
      '<details' + (lesson ? '' : ' open') + '><summary><b>Question types</b> <span class="small muted">(all ticked = a good mix)</span></summary><div class="bd-row" style="gap:4px 14px;margin:8px 0">' + GEN_TYPES.map(function (t) { return '<label class="chk"><input type="checkbox" name="g-ty" value="' + t[0] + '"' + (!GEN.types || GEN.types.indexOf(t[0]) >= 0 ? ' checked' : '') + '> ' + KN[t[0]][1] + ' ' + t[1] + '</label>'; }).join('') + '</div><p class="small muted">Labelling and click-the-picture questions need a picture you choose, so add those by hand.</p></details>' +
      '<div id="g-crit" style="margin:8px 0"><b>MYP criteria</b> ' + ['A', 'B', 'C', 'D'].map(function (c) { return '<label class="chk" style="display:inline-flex;margin-right:10px"><input type="checkbox" name="g-cr" value="' + c + '"' + (GEN.criteria.indexOf(c) >= 0 ? ' checked' : '') + '> ' + c + '</label>'; }).join('') + '</div>' +
      (lesson ? '<label class="chk"><input type="checkbox" id="g-p"' + (GEN.pics ? ' checked' : '') + '> Find real pictures (diagrams and photos from Wikimedia Commons, with their credits) where my files have none</label>' : '') +
      '<div id="g-run" hidden><h3>Building…</h3><ol id="g-steps" class="small" style="line-height:1.9"></ol><div style="height:10px;border-radius:6px;background:#e2e8f0;overflow:hidden"><i id="g-bar" style="display:block;height:100%;width:0;background:linear-gradient(90deg,#4f46e5,#0ea5e9);transition:width .4s"></i></div><p class="small muted">The free AI service answers a few requests a minute, so a full ' + (lesson ? 'lesson' : 'set') + ' takes a few minutes. You can leave this page open and do something else.</p></div>' +
      '<p class="msg" id="g-msg" role="status"></p>' +
      '<div class="acts"><button class="btn main" type="button" id="g-go">✨ Build</button><button class="btn" type="button" data-close>' + (ST.id || !blankItems() ? 'Cancel' : 'Start with a blank page') + '</button></div>';
    var $ = function (s) { return inner.querySelector(s); };
    if (lesson) $('#g-n').value = String(GEN.count);
    if (blankItems()) $('#g-m').closest('.bd-f').hidden = true; else if (addMode) $('#g-m').value = 'add';
    var showCrit = function () { $('#g-crit').hidden = !myp(); }; showCrit();
    $('#g-l').onchange = function () { GEN.level = this.value; try { localStorage.setItem('bv-gen-level', GEN.level); } catch (e) {} showCrit(); };
    var stop = false;
    inner.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { stop = true; ov.remove(); }; });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#g-run').hidden) ov.remove(); });
    $('#g-go').onclick = function () {
      GEN.objectives = $('#g-o').value; GEN.count = +$('#g-n').value || GEN.count; GEN.mode = $('#g-m').value; GEN.level = $('#g-l').value;
      GEN.types = [].map.call(inner.querySelectorAll('[name=g-ty]:checked'), function (c) { return c.value; }); if (GEN.types.length === GEN_TYPES.length) GEN.types = null;
      GEN.criteria = [].map.call(inner.querySelectorAll('[name=g-cr]:checked'), function (c) { return c.value; }); GEN.pics = lesson && $('#g-p').checked;
      var title = $('#g-t').value.trim(), files = [].slice.call($('#g-f').files || []);
      if (!title && !GEN.objectives.trim() && !files.length) { $('#g-msg').textContent = 'Give a title, some objectives or a file to build from.'; return; }
      if (!GEN.level) { $('#g-msg').textContent = 'Choose the level, so the language and questions suit your students.'; $('#g-l').focus(); return; }
      if (GEN.types && !GEN.types.length) { $('#g-msg').textContent = 'Tick at least one question type.'; return; }
      inner.querySelectorAll('input,select,textarea,#g-go').forEach(function (x) { x.disabled = true; }); $('#g-run').hidden = false; $('#g-msg').textContent = '';
      runBuild({ title: title, files: files, ui: { step: stepUI, bar: function (f) { $('#g-bar').style.width = Math.round(f * 100) + '%'; }, stopped: function () { return stop; } } }).then(function (res) {
        if (stop) return; ov.remove(); toastDone(res);
      }, function (e) {
        if (stop) return;
        $('#g-msg').innerHTML = '⚠ ' + E(e.message || e) + (e.fallback ? ' <button class="btn sm" type="button" id="g-rule">Lay it out from my files without AI</button>' : '');
        inner.querySelectorAll('input,select,textarea,#g-go').forEach(function (x) { x.disabled = false; });
        var rb = $('#g-rule'); if (rb) rb.onclick = function () { ruleBuild(title, e.lines || []); ov.remove(); };
      });
    };
    function stepUI(text, state) {   // state: '' running, 'ok', 'warn'
      var ol = $('#g-steps'), li = ol.lastElementChild; if (!li || li.dataset.done) { li = document.createElement('li'); ol.appendChild(li); }
      li.textContent = (state === 'ok' ? '✅ ' : state === 'warn' ? '⚠️ ' : '⏳ ') + text; if (state) li.dataset.done = 1;
    }
    document.body.appendChild(ov); $('#g-t').focus();
  }
  function call(body) {
    return S.db.functions.invoke('build-draft', { body: body }).then(function (res) {
      var d = res.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
      if ((!d || !d.ok) && res.error && res.error.context && res.error.context.json) return res.error.context.json().then(function (j) { throw Object.assign(new Error((j && j.error) || 'The AI could not be reached.'), { code: j && j.code }); }, function () { throw new Error('The AI could not be reached.'); });
      if (!d || !d.ok) throw Object.assign(new Error((d && d.error) || 'The AI could not be reached.'), { code: d && d.code });
      return d;
    });
  }
  function patient(body, ui, label) {   // the free AI allowance is per minute: wait and try again a few times
    var tries = 0;
    function go() { return call(body).catch(function (e) { if (ui.stopped()) throw e; if ((e.code === 'busy' || e.code === 'down' || !e.code) && tries++ < 3) { ui.step(label + ' (the AI is busy: waiting ' + (20 * tries) + ' seconds)', ''); return new Promise(function (r) { setTimeout(r, 20000 * tries); }).then(go); } throw e; }); }
    return go();
  }
  function readAll(files, ui) {
    var Q = window.BVQ; if (!files.length) return Promise.resolve({ text: '', lines: [], images: [] });
    if (!Q || !Q.readFile) return Promise.reject(new Error('The file reader did not load. Refresh the page and try again.'));
    Q.IMGS.length = 0; var lines = [], chain = Promise.resolve();
    files.forEach(function (f) { chain = chain.then(function () { ui.step('Reading ' + f.name, ''); return Q.readFile(f).then(function (ls) { lines = lines.concat(ls); ui.step('Read ' + f.name, 'ok'); }, function (e) { ui.step(f.name + ': ' + (e.message || e), 'warn'); }); }); });
    return chain.then(function () {
      var imgs = [], text = lines.map(function (l) { var m = /^\[\[img:(\d+)\]\]$/.exec(l); if (m) { if (Q.IMGS[+m[1]] && Q.IMGS[+m[1]].length > 9000) imgs.push(Q.IMGS[+m[1]]); /* tiny pictures are logos and icons */ return ''; } return l; }).filter(Boolean).join('\n');
      return { text: text, lines: lines, images: imgs };
    });
  }
  function fromAI(it) {   // an item written by the AI -> a builder item
    var q = newQ(it.kind, it.section || ''); q.ai = true; var cm = /criterion\s*([ABCD])\b/i.exec(it.focus || ''); if (cm) q.crit = cm[1].toUpperCase(); q.diff = it.kind === 'info' ? '' : it.kind === 'essay' || (it.marks || 1) >= 5 ? 3 : (it.marks || 1) >= 3 || /^(short|number|graph|draw|table)$/.test(it.kind) ? 2 : 1; q.section = ST.cat === 'lesson' ? (STEPS.indexOf(it.section) >= 0 ? it.section : 'Explore') : it.section || '';
    var pts = function (p) { return (p || []).map(function (x) { return x.text + (x.keywords && x.keywords.length ? ': ' + x.keywords.join(' / ') : ''); }).join('\n'); };
    var noComma = function (t) { return String(t || '').replace(/,/g, ' /'); };
    q.prompt = it.kind === 'info' ? it.text : it.prompt || ''; q.explanation = it.explanation || ''; q.marks = it.kind === 'info' ? 0 : it.marks || 1; q.imageQuery = it.image_query || '';
    if (it.kind === 'mcq') { var ord = it.options.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; }); q.options = ord.map(function (i) { return it.options[i]; }); q.correct = ord.indexOf(it.correct); }   /* the AI tends to put the answer first */
    else if (it.kind === 'tf') { q.options = ['True', 'False']; q.correct = it.answer ? 0 : 1; }
    else if (it.kind === 'multi') q.draft = { choices: it.choices.map(function (c) { return { t: c.text, ok: !!c.correct }; }) };
    else if (it.kind === 'match') q.draft = { pairs: it.pairs.map(function (p) { return { l: p[0], r: p[1] }; }) };
    else if (it.kind === 'order') q.draft = { items: it.items.slice() };
    else if (it.kind === 'classify') q.draft = { groups: it.groups.slice(), items: it.items.map(function (x) { return { t: x[0], g: +x[1] || 0 }; }) };
    else if (it.kind === 'gaps' || it.kind === 'cloze') q.draft = { text: it.text };
    else if (it.kind === 'number') { q.draft = { value: String(it.value), tol: it.tolerance ? String(it.tolerance) : '', unit: it.unit || '' }; q.model = it.model_answer || ''; }
    else if (it.kind === 'table') q.draft = { cols: it.columns.map(noComma).join(', '), rows: it.rows.map(function (r) { return r.map(function (c) { return /^\[[^\[\]]+\]$/.test(c) ? c : String(c).replace(/\|/g, '/'); }).join(' | '); }).join('\n') };
    else { q.model = it.model_answer || ''; q.points = pts(it.points); q.rubric = it.rubric || ''; if (it.kind === 'graph') q.axes = noComma(it.x || 'x') + ',' + noComma(it.y || 'y'); }
    if (QT && QT.has(q.kind) && QT.problems(q.kind, q.draft).length) return null;
    return q;
  }
  function runBuild(o) {
    var ui = o.ui, lesson = ST.cat === 'lesson', src, plan, made = [], total = 1;
    ui.step('Reading your files', '');
    return readAll(o.files, ui).then(function (r) {
      src = r; ui.step(o.files.length ? 'Files read: ' + Math.round(r.text.length / 1000) + ' thousand characters, ' + r.images.length + ' picture' + (r.images.length === 1 ? '' : 's') : 'No files: building from your title and objectives', 'ok');
      if (ui.stopped()) throw new Error('Stopped.');
      ui.step('Planning the ' + (lesson ? 'six steps' : 'sections'), ''); ui.bar(0.05);
      return patient({ mode: 'plan', kind: ST.cat, title: o.title, level: GEN.level, objectives: GEN.objectives, source: src.text, count: GEN.count, types: GEN.types || [], criteria: /MYP/.test(GEN.level) ? GEN.criteria : [] }, ui, 'Planning');
    }).then(function (d) {
      plan = d.plan; var n = 0; plan.sections.forEach(function (s) { n += s.items.length; }); total = n;
      ui.step('Plan ready: ' + plan.sections.length + (lesson ? ' steps, ' : ' sections, ') + n + ' items', 'ok');
      var batches = []; plan.sections.forEach(function (sec) { for (var i = 0; i < sec.items.length; i += 4) batches.push(sec.items.slice(i, i + 4).map(function (it) { return Object.assign({ section: sec.name }, it); })); });
      var chain = Promise.resolve(), k = 0;
      batches.forEach(function (b) { chain = chain.then(function () {
        if (ui.stopped()) throw new Error('Stopped.');
        k++; ui.step('Writing ' + (lesson ? b[0].section.toLowerCase() + ' items' : b[0].section) + ' (' + k + ' of ' + batches.length + ')', '');
        return patient({ mode: 'items', kind: ST.cat, title: plan.title || o.title, level: GEN.level, objectives: (plan.objectives || []).join('\n') || GEN.objectives, source: src.text, items: b, done: made.map(function (q) { return String(q.prompt).slice(0, 120); }) }, ui, 'Writing').then(function (r) {
          var good = 0; r.items.forEach(function (it, i) { var q = it && fromAI(Object.assign({ section: b[i].section, focus: b[i].focus }, it)); if (q) { made.push(q); good++; } });
          ui.step('Wrote ' + good + ' of ' + b.length + ' ' + (lesson ? b[0].section.toLowerCase() + ' items' : 'items in ' + b[0].section) + (good < b.length ? ' (the rest did not pass the quality checks and were left out)' : ''), good < b.length ? 'warn' : 'ok');
          ui.bar(0.1 + 0.7 * k / batches.length);
        }, function (e) { if (ui.stopped()) throw e; ui.step('A batch could not be written: ' + (e.message || e), 'warn'); });
      }); });
      return chain;
    }).then(function () {
      if (!made.some(function (q) { return q.kind !== 'info'; })) throw Object.assign(new Error('The AI could not build usable questions this time.'), { fallback: lesson, lines: src.lines });
      // lessons: the objectives open the lesson, pictures from the files go into the reading cards, then real pictures where none
      if (lesson) {
        var objs = plan.objectives || [], first = made.filter(function (q) { return q.kind === 'info' && q.section === 'Question'; })[0];
        if (objs.length) { var txt = 'By the end of this lesson you will be able to:\n' + objs.map(function (x) { return '• ' + x; }).join('\n'); if (first) first.prompt = first.prompt + '\n\n' + txt; else made.unshift(Object.assign(newQ('info', 'Question'), { prompt: '**' + (plan.title || o.title) + '**\n\n' + txt, ai: true })); }
        if (!made.some(function (q) { return q.section === 'Reflect'; })) { var rq = newQ('short', 'Reflect'); rq.prompt = 'Reflect: what is the most important idea you learned today, and what are you still unsure about? You can type, write by hand or draw.'; rq.marks = 1; rq.ai = true; made.push(rq); }
        var cards = made.filter(function (q) { return q.kind === 'info' && !q.image; }), order = ['Explore', 'Explain', 'Question', 'Challenge', 'Test', 'Reflect'];
        cards.sort(function (a, b) { return order.indexOf(a.section) - order.indexOf(b.section); });
        src.images.slice(0, 6).forEach(function (img, i) { if (cards[i]) cards[i].image = img; });
        var need = cards.filter(function (q) { return !q.image && q.imageQuery; }).slice(0, GEN.pics ? 3 : 0), chain = Promise.resolve(), j = 0;
        need.forEach(function (q) { chain = chain.then(function () {
          if (ui.stopped()) return; j++; ui.step('Finding a real picture (' + j + ' of ' + need.length + '): ' + q.imageQuery, '');
          return call({ mode: 'image', query: q.imageQuery, level: GEN.level, context: String(q.prompt).slice(0, 300) }).then(function (r) {
            if (r.image) { q.image = r.image.src; q.prompt += '\n\nPicture: ' + (r.image.caption || r.image.title) + ' Credit: ' + (r.image.artist || 'Wikimedia Commons') + ', ' + r.image.license + ', via Wikimedia Commons (' + r.image.page + ').'; ui.step('Picture found: ' + r.image.title, 'ok'); }
            else ui.step('No suitable picture found for "' + q.imageQuery + '"', 'warn');
            ui.bar(0.8 + 0.18 * j / need.length);
          }, function () { ui.step('No picture this time for "' + q.imageQuery + '"', 'warn'); });
        }); });
        return chain;
      }
    }).then(function () {
      if (ui.stopped()) throw new Error('Stopped.');
      lesson && made.sort(function (a, b) { return STEPS.indexOf(a.section) - STEPS.indexOf(b.section); });
      if (GEN.mode === 'add' && !blankItems()) ST.questions = ST.questions.concat(made); else { (ST.removed = ST.removed || []).push.apply(ST.removed, ST.questions.filter(function (q) { return q.id; }).map(function (q) { return q.id; })); ST.questions = made; }
      if (!ST.title.trim()) ST.title = plan.title || o.title;
      if (!ST.instructions.trim() && !lesson) ST.instructions = 'Answer every question. The marks for each question are shown in brackets.';
      if (/MYP|Grade/.test(GEN.level) && !ST.subject) { var t = (ST.title + ' ' + GEN.objectives).toLowerCase(); ST.subject = /cell|organ|plant|animal|gene|dna|ecolog|evolution|enzyme|photosynth|respirat|digest|blood|disease|species/.test(t) ? 'Biology' : /atom|bond|reaction|acid|salt|element|compound|mole|metal|organic|equilibri|electroly|periodic/.test(t) ? 'Chemistry' : /force|motion|energy|wave|electric|magnet|light|sound|pressure|heat|radioact|star|planet|circuit/.test(t) ? 'Physics' : ''; }
      ST.changed = true; SEL = 0; ui.bar(1); draw();
      return { n: made.length, ai: made.filter(function (q) { return q.ai; }).length, pics: made.filter(function (q) { return q.image; }).length, marks: made.reduce(function (a, q) { return a + (+q.marks || 0); }, 0) };
    }).catch(function (e) { if (!e.fallback && lesson && !made.length && src) { e.fallback = true; e.lines = src.lines; } throw e; });
  }
  function ruleBuild(title, lines) {   // no AI: lay the lesson out from the files by fixed rules (as the old lesson maker did)
    var Q = window.BVQ; if (!Q || !Q.buildLesson) return;
    var items = Q.buildLesson(title || ST.title || 'This lesson', GEN.objectives, lines.length ? lines : null, null);
    ST.questions = items.map(function (x) { var k = x.kind === 'mcq' || x.kind === 'tf' || x.kind === 'info' ? x.kind : 'short', q = newQ(k, x.section || 'Explore');
      q.prompt = x.prompt || ''; q.marks = k === 'info' ? 0 : x.marks || 1; q.image = x.image || ''; q.model = x.scheme || ''; q.explanation = x.explanation || ''; q.rubric = x.rubric || ''; q.ai = true;
      if (k === 'mcq' || k === 'tf') { q.options = (x.options || []).slice(); q.correct = x.correct == null ? -1 : x.correct; } return q; });
    if (!ST.title.trim()) ST.title = title; ST.changed = true; SEL = 0; draw();
    toastDone({ n: ST.questions.length, rule: true });
  }
  function toastDone(r) {
    var n = document.createElement('div'); n.className = 'bd-ov'; n.innerHTML = '<div role="status"><h2>✨ ' + (r.rule ? 'Laid out from your files' : 'Built') + '</h2><p>' + r.n + ' items' + (r.marks ? ', ' + r.marks + ' marks' : '') + (r.pics ? ', ' + r.pics + ' with pictures' : '') + '.</p>' +
      '<p>Each item is marked <b>🔎 check me</b> until you open it. Read every question, answer key and picture: ' + (r.rule ? 'the questions are general prompts and need your own wording and marking points.' : 'AI drafts can contain mistakes.') + ' Then press <b>Preview and save</b>.</p><div class="acts"><button class="btn main" type="button">Start checking</button></div></div>';
    n.querySelector('button').onclick = function () { n.remove(); }; document.body.appendChild(n); n.querySelector('button').focus();
  }

  /* ================================================================ 📚 Question bank
     Site courses: every question in the courses on the main site (and the teacher's own), searched and filtered, copied with answer keys (bank_search, bank_copy).
     By topic: a random choice from chosen topics (practice_topics, bank_pick).
     From outside: a question paper, worksheet or pasted text read in the browser (quiz-import.js).
     With AI: "Build it for me" adding after the current items. */
  var DIFF = ['Easier', 'Medium', 'Harder'];
  var BANKKINDS = [['', 'All types'], ['mcq', '🔘 Multiple choice'], ['tf', '✅ True or false'], ['multi', '☑️ Several correct'], ['match', '🔗 Match'], ['order', '🔢 Order'], ['classify', '🗂️ Sort'], ['gaps', '✍️ Gaps'], ['cloze', '🔽 Drop-down'], ['number', '🔟 Calculation'], ['table', '▦ Table'], ['short', '✏️ Written'], ['essay', '📄 Extended'], ['graph', '📈 Graph or drawing'], ['label', '🏷️ Label'], ['hotspot', '🎯 Click the part']];
  function fromRow(o) {   // a saved question (with its answer key) -> a builder item
    var an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
    var kind = o.kind, pr = T ? T.parse(o.prompt || '') : { text: o.prompt || '', mode: '', media: [] }, md = pr.mode;
    if (kind === 'short' && /^(graph|draw|annotate)$/.test(md)) kind = md; else if (kind === 'short' && an.rubric) kind = 'essay';
    if (!KN[kind]) kind = 'short';
    var out = { id: o.id, kind: kind, prompt: pr.text, media: pr.media || [], crit: o.criterion || '', diff: o.difficulty || '', marks: o.marks || 0, section: o.section || '', image: o.image_url || '', options: Array.isArray(o.options) ? o.options : [], correct: an.correct_option == null ? -1 : an.correct_option,
      model: an.model_answer || an.mark_scheme || '', rubric: an.rubric || '', explanation: an.explanation || '', axes: [pr.x || 'x', pr.y || 'y'].join(','), mode: md,
      points: (Array.isArray(an.points) ? an.points : []).map(function (p) { return (p.text || '') + ((p.any || []).length ? ': ' + p.any.join(' / ') : ''); }).join('\n') };
    if (QT && QT.has(kind)) out.draft = QT.unpack(kind, o.options, an.accepted);
    if (kind === 'short' && md === 'dropdown') out.prompt = T.join(pr.text, 'dropdown', '', '', []);
    return out;
  }
  function fromRule(x, section) {   // a question read from a file (quiz-import.js) -> a builder item
    var k = x.kind === 'mcq' || x.kind === 'tf' || x.kind === 'info' ? x.kind : 'short', q = newQ(k, section);
    q.prompt = x.prompt || ''; q.marks = k === 'info' ? 0 : x.marks || 1; q.image = x.image || ''; q.model = x.scheme || ''; q.explanation = x.explanation || ''; q.rubric = x.rubric || '';
    if (k === 'mcq' || k === 'tf') { q.options = (x.options || []).slice(); q.correct = x.correct == null ? -1 : x.correct; }
    (x.images || []).forEach(function (src) { if (src && src !== q.image) q.media.push({ t: 'image', src: src }); });
    if (k === 'short') {
      var txt = T ? T.text(q.prompt) : q.prompt, only = T && T.detect ? T.detect(txt) : '';
      if (only === 'graph') { q.kind = 'graph'; var ax = /\bgraph of (.+?) against (.+?)(?:[.,;:]|\s*\[|$)/i.exec(txt); q.axes = ax ? cap(ax[2]) + ',' + cap(ax[1]) : 'x,y'; }
      else if (only === 'draw') q.kind = q.image && /\b(label|annotate)\b/i.test(txt) ? 'annotate' : 'draw';
      else if (q.marks >= 6 && /\b(discuss|evaluate|to what extent|justify)\b/i.test(txt)) q.kind = 'essay';
      if (x.scheme) q.points = String(x.scheme).split(/\n|;\s*/).map(function (l) { return l.replace(/^[\-•*]\s*/, '').trim(); }).filter(function (l) { return l.length > 1 && !/^(accept|award|do not|allow|reject|OWTTE)\b/i.test(l); }).slice(0, 12).join('\n');
      if (q.kind === 'essay' && x.scheme) q.rubric = x.rubric || '';
    }
    return q;
  }
  function cap(t) { t = String(t || '').trim(); return t.charAt(0).toUpperCase() + t.slice(1); }

  /* ================================================================ 📄 Import a question paper (and its mark scheme)
     Like AssessPrep: the teacher drops the question paper and the mark scheme; the questions are found, the diagrams on each page are cut
     out automatically and placed with their questions, the answers come from the mark scheme, and each question gets its answer tool
     (graph, drawing, table, symbols). Everything is read in the teacher's browser; the pictures are uploaded when the item is saved. */
  function importDialog() {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Import a question paper');
    var inner = document.createElement('div'); ov.appendChild(inner);
    var files = { paper: null, scheme: null };
    inner.innerHTML = '<div class="bd-top"><div><p class="label">Import</p><h2>📄 Import a question paper</h2></div><button class="btn" type="button" data-close aria-label="Close">✕</button></div>' +
      '<p class="small muted" style="margin-top:0">Drop the question paper and its mark scheme. The questions are found and numbered, every diagram, graph and table on the pages is cut out and put with its question, the answers come from the mark scheme, and each question gets its answer tools (📈 graph, ✏️ drawing, ▦ table, ⌨️ symbols). You check everything before saving.</p>' +
      '<div class="bd-row"><div class="bd-f"><span>1 · Question paper</span><div class="bvm-drop" data-z="paper" tabindex="0" role="button" aria-label="Choose or drop the question paper"><b>📄 Drop the question paper here</b><span class="small muted">or click to choose · PDF, Word, PowerPoint or a photo</span><span class="small" data-zn="paper"></span><input type="file" hidden data-zf="paper" accept=".pdf,.docx,.pptx,.odt,.txt,.md,.html,.htm,.rtf,image/*"></div></div>' +
      '<div class="bd-f"><span>2 · Mark scheme (recommended)</span><div class="bvm-drop" data-z="scheme" tabindex="0" role="button" aria-label="Choose or drop the mark scheme"><b>✅ Drop the mark scheme here</b><span class="small muted">or click to choose · PDF, Word or text</span><span class="small" data-zn="scheme"></span><input type="file" hidden data-zf="scheme" accept=".pdf,.docx,.pptx,.odt,.txt,.md,.html,.htm,.rtf"></div></div></div>' +
      '<div class="bd-row">' + field('Title', '<input id="im-t" placeholder="Taken from the file name">') + field('Make it', '<select id="im-c"><option value="exam">🎓 an examination (timed, one attempt)</option><option value="quiz">📝 exam-style questions (practice)</option></select>') + '</div>' +
      '<details><summary class="small">…or paste the questions and mark scheme as text</summary><div class="bd-row"><label class="bd-f"><span>Questions</span><textarea id="im-p" rows="6" placeholder="1. Which base pairs with adenine?\nA. Guanine\nB. Thymine\n2. Explain why enzymes denature at high temperature. [3]"></textarea></label><label class="bd-f"><span>Mark scheme</span><textarea id="im-s" rows="6" placeholder="1 B\n2 active site changes shape; substrate no longer fits"></textarea></label></div></details>' +
      '<ol class="small" id="im-log" style="margin:8px 0;padding-left:20px"></ol><p class="msg" id="im-m" role="alert"></p>' +
      '<div class="acts"><button class="btn main" type="button" id="im-go">📄 Build the ' + (ST.cat === 'quiz' ? 'questions' : 'examination') + '</button><button class="btn" type="button" data-close>Cancel</button></div>';
    var close = function () { ov.remove(); }; inner.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = close; });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    inner.querySelector('#im-c').value = ST.cat === 'quiz' ? 'quiz' : 'exam';
    ['paper', 'scheme'].forEach(function (k) {
      var z = inner.querySelector('[data-z="' + k + '"]'), inp = inner.querySelector('[data-zf="' + k + '"]'), set = function (f) { if (!f) return; files[k] = f; inner.querySelector('[data-zn="' + k + '"]').textContent = '✓ ' + f.name; z.classList.add('on');
        if (k === 'paper' && !inner.querySelector('#im-t').value) inner.querySelector('#im-t').value = f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim(); };
      z.onclick = function (e) { if (e.target !== inp) inp.click(); }; z.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
      inp.onchange = function () { set(this.files[0]); };
      z.addEventListener('dragover', function (e) { e.preventDefault(); }); z.addEventListener('drop', function (e) { e.preventDefault(); set((e.dataTransfer.files || [])[0]); });
    });
    var log = function (t) { var li = document.createElement('li'); li.textContent = t; inner.querySelector('#im-log').appendChild(li); };
    inner.querySelector('#im-go').onclick = function () {
      var Q = window.BVQ, b = this, m = inner.querySelector('#im-m'), p = inner.querySelector('#im-p').value.trim(), ps = inner.querySelector('#im-s').value.trim();
      if (!Q) { m.textContent = 'The file reader did not load. Refresh the page.'; return; }
      if (!files.paper && !p) { m.textContent = 'Drop the question paper first (or paste the questions).'; return; }
      m.textContent = ''; inner.querySelector('#im-log').innerHTML = ''; b.disabled = true; b.textContent = 'Reading…'; Q.IMGS.length = 0;
      log('Reading the question paper and cutting out its diagrams…');
      (files.paper ? Q.readFile(files.paper) : Promise.resolve(p.split('\n'))).then(function (lines) {
        var pics = lines.filter(function (l) { return /^\[\[img:\d+\]\]$/.test(l); }).length;
        log('Question paper read: ' + lines.length + ' lines, ' + pics + ' diagram' + (pics === 1 ? '' : 's') + ' and picture' + (pics === 1 ? '' : 's') + ' found.');
        var found = Q.parsePaper(lines); if (!found.length) throw new Error('No numbered questions were found. Questions should start with a number such as "1." or "Question 1".');
        log(found.length + ' questions found (' + found.filter(function (q) { return q.kind !== 'short'; }).length + ' multiple choice, ' + found.filter(function (q) { return q.kind === 'short'; }).length + ' written).');
        if (!files.scheme && !ps) return { found: found, matched: 0 };
        log('Reading the mark scheme…');
        return (files.scheme ? Q.readFile(files.scheme) : Promise.resolve(ps.split('\n'))).then(function (sl) { var n = Q.applyScheme(found, Q.parseScheme(sl)); log('Mark scheme: answers found for ' + n + ' of ' + found.length + ' questions.'); return { found: found, matched: n }; });
      }).then(function (r) {
        var cat = inner.querySelector('#im-c').value, items = r.found.map(function (x) { return fromRule(x, ''); });
        items.forEach(function (q, i) { var x = r.found[i]; if (x.ref) q.prompt = (/^\d+$/.test(x.ref) ? x.ref + '. ' : x.ref + ' ') + q.prompt; });   // the paper's own numbering: 1., 2(a), 2(b)(i)
        var tools = { graph: 0, draw: 0, annotate: 0 }; items.forEach(function (q) { if (tools[q.kind] != null) tools[q.kind]++; });
        log('Answer tools: ' + tools.graph + ' graph, ' + (tools.draw + tools.annotate) + ' drawing; every written answer also has ⌨️ symbols, ▦ table, 📈 graph and ✏️ drawing tools.');
        if (ST.cat !== cat) { ST.cat = cat; ST.attempts = cat === 'exam' ? 1 : 2; ST.show = cat !== 'exam'; }
        ST.title = ST.title || inner.querySelector('#im-t').value.trim() || 'Imported paper';
        if (!ST.instructions) ST.instructions = 'Answer all questions. Use the tools under each answer box for graphs, tables, drawings and symbols.';
        var marks = items.reduce(function (a, q) { return a + (+q.marks || 0); }, 0);
        if (!ST.time && cat === 'exam') ST.time = Math.max(15, Math.round(marks * 1.2 / 5) * 5);
        addItems(items, 'from the question paper' + (r.matched ? ' with ' + r.matched + ' answers from the mark scheme' : ''));
        close();
      }).catch(function (e) { b.disabled = false; b.textContent = '📄 Try again'; m.textContent = '⚠ ' + (e.message || e); });
    };
    document.body.appendChild(ov); setTimeout(function () { inner.querySelector('[data-z="paper"]').focus(); }, 30);
  }
  function addItems(items, how) {
    var sec = ST.cat === 'lesson' ? 'Test' : '';
    items.forEach(function (q) { if (ST.cat === 'lesson') q.section = STEPS.indexOf(q.section) >= 0 ? q.section : sec; else if (STEPS.indexOf(q.section) >= 0) q.section = ''; q.ai = true; });
    if (blankItems()) { (ST.removed = ST.removed || []).push.apply(ST.removed, ST.questions.filter(function (q) { return q.id; }).map(function (q) { return q.id; })); ST.questions = items; SEL = 0; }
    else { ST.questions = ST.questions.concat(items); SEL = ST.questions.length - items.length; }
    ST.changed = true; draw();
    var n = document.createElement('div'); n.className = 'bd-toast'; n.setAttribute('role', 'status'); n.textContent = '✅ ' + items.length + ' question' + (items.length === 1 ? '' : 's') + ' added ' + how + '. Check each one (🔎), then preview and save.';
    document.body.appendChild(n); setTimeout(function () { n.remove(); }, 5000);
  }
  function copyIn(ids, how) {
    return S.db.rpc('bank_copy', { ids: ids }).then(function (r) {
      if (r.error) throw r.error;
      var nid = r.data || [];
      return S.db.from('questions').select('*, question_answers(*)').in('id', nid).then(function (x) {
        if (x.error) throw x.error;
        var by = {}; (x.data || []).forEach(function (o) { by[o.id] = o; });
        addItems(nid.map(function (id) { return by[id]; }).filter(Boolean).map(fromRow), how);
      });
    });
  }
  function bankDialog() {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Question bank');
    var inner = document.createElement('div'); inner.style.maxWidth = '980px'; ov.appendChild(inner);
    inner.innerHTML = '<div class="bd-top"><div><p class="label">Add questions</p><h2>📚 Question bank</h2></div><button class="btn" type="button" data-close>✕</button></div>' +
      '<nav class="tabs" role="tablist" aria-label="Where the questions come from"><a href="#" data-bt="site" aria-selected="true">🏫 Site courses</a><a href="#" data-bt="topic" aria-selected="false">🎯 Random by topic</a><a href="#" data-bt="out" aria-selected="false">📄 From a file or text</a><a href="#" data-bt="ai" aria-selected="false">✨ Write new with AI</a></nav><div id="bk"></div>';
    var box = inner.querySelector('#bk'), close = function () { ov.remove(); };
    inner.querySelector('[data-close]').onclick = close; ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    inner.querySelectorAll('[data-bt]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); inner.querySelectorAll('[data-bt]').forEach(function (b) { b.setAttribute('aria-selected', b === a); }); show(a.getAttribute('data-bt')); }; });
    function need039(e) { return /bank_|practice_|function .* does not exist|schema cache/i.test((e && e.message) || ''); }
    function fail(e) { return '<p class="msg">' + (need039(e) ? 'The question bank switches on when the admin runs the database update 039.' : E(S.nice(e))) + '</p>'; }
    function show(t) {
      if (t === 'ai') { close(); genDialog(true); return; }
      if (t === 'out') return outside();
      if (t === 'topic') return byTopic();
      site();
    }
    // ---- site courses
    var F = { term: '', crs: '', kind: '', crit: '', diff: '', mine: false, off: 0 }, picked = {}, cache = {};
    function site() {
      box.innerHTML = '<div class="bd-row" style="align-items:end"><label class="bd-f" style="flex:3"><span>Search</span><input id="b-q" type="search" value="' + E(F.term) + '" placeholder="e.g. enzymes, osmosis, half-life, titration"></label>' +
        '<label class="bd-f"><span>Course</span><select id="b-c"><option value="">All courses</option></select></label><label class="bd-f"><span>Type</span><select id="b-k">' + BANKKINDS.map(function (k) { return '<option value="' + k[0] + '"' + (F.kind === k[0] ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="bd-f"><span>Criterion</span>' + critSel('b-cr', F.crit) + '</label><label class="bd-f"><span>Difficulty</span>' + diffSel('b-d', F.diff) + '</label></div>' +
        '<label class="chk small"><input type="checkbox" id="b-m"' + (F.mine ? ' checked' : '') + '> Only questions I wrote</label><p class="small muted" id="b-n" role="status"></p><div id="b-r" class="bk-list"></div><div class="acts" style="position:sticky;bottom:-24px;background:var(--bg,#fff);padding:10px 0;border-top:1px solid var(--line,#e2e8f0)"><button class="btn main" type="button" id="b-add" disabled>＋ Add the chosen questions</button><button class="btn" type="button" id="b-more" hidden>Show more</button></div>';
      S.db.rpc('bank_courses').then(function (r) { var sel = box.querySelector('#b-c'); if (!sel) return; (r.data || []).forEach(function (c) { var o = document.createElement('option'); o.value = c.course; o.textContent = c.course + ' (' + c.n + ')'; if (c.course === F.crs) o.selected = true; sel.appendChild(o); }); });
      var timer, go = function () { F.term = box.querySelector('#b-q').value.trim(); F.crs = box.querySelector('#b-c').value; F.kind = box.querySelector('#b-k').value; F.crit = box.querySelector('#b-cr').value; F.diff = box.querySelector('#b-d').value; F.mine = box.querySelector('#b-m').checked; F.off = 0; run(false); };
      box.querySelector('#b-q').oninput = function () { clearTimeout(timer); timer = setTimeout(go, 350); };
      box.querySelector('#b-c').onchange = go; box.querySelector('#b-k').onchange = go; box.querySelector('#b-cr').onchange = go; box.querySelector('#b-d').onchange = go; box.querySelector('#b-m').onchange = go;
      box.querySelector('#b-more').onclick = function () { F.off += 30; run(true); };
      box.querySelector('#b-add').onclick = function () { var ids = Object.keys(picked), b = this; if (!ids.length) return; b.disabled = true; b.textContent = 'Copying…';
        copyIn(ids, 'from the question bank').then(function () { picked = {}; close(); }, function (e) { b.disabled = false; b.textContent = '＋ Add the chosen questions'; box.querySelector('#b-n').innerHTML = fail(e); }); };
      run(false);
    }
    function kindsOf(k) { return !k ? null : k === 'graph' ? ['graph', 'draw', 'annotate'] : [k]; }
    function run(more) {
      var res = box.querySelector('#b-r'), nn = box.querySelector('#b-n'); if (!more) res.innerHTML = '<p class="muted">Searching…</p>';
      S.db.rpc('bank_search', { term: F.term, crs: F.crs, kinds: kindsOf(F.kind), mine: F.mine, lim: 30, off: F.off, crit: F.crit, diff: F.diff ? +F.diff : null }).then(function (r) {
        if (!box.querySelector('#b-r')) return;
        if (r.error) { res.innerHTML = fail(r.error); return; }
        var rows = r.data || [], total = rows.length ? rows[0].total : 0; if (!more) res.innerHTML = '';
        nn.textContent = total ? total + ' question' + (total === 1 ? '' : 's') + ' found. Tick the ones you want.' : 'No questions found. Try other words or another course.';
        rows.forEach(function (o) { cache[o.id] = o; res.insertAdjacentHTML('beforeend', card(o)); });
        box.querySelector('#b-more').hidden = F.off + 30 >= total;
        res.querySelectorAll('input[data-pick]').forEach(function (c) { c.onchange = function () { if (c.checked) picked[c.value] = 1; else delete picked[c.value]; var n = Object.keys(picked).length, b = box.querySelector('#b-add'); b.disabled = !n; b.textContent = n ? '＋ Add ' + n + ' question' + (n === 1 ? '' : 's') : '＋ Add the chosen questions'; }; });
      });
    }
    function card(o) {
      var pr = T ? T.parse(o.prompt) : { text: o.prompt, mode: '' }, k = o.kind === 'short' && /^(graph|draw|annotate)$/.test(pr.mode) ? pr.mode : o.kind, kn = KN[k] || KN.short;
      var opts = Array.isArray(o.options) && o.options.length && (o.kind === 'mcq' || o.kind === 'tf') ? '<ol type="A" class="small" style="margin:4px 0 0 18px">' + o.options.slice(0, 6).map(function (x) { return '<li>' + E(String(x).slice(0, 120)) + '</li>'; }).join('') + '</ol>' : '';
      return '<label class="bk-card"><input type="checkbox" data-pick value="' + o.id + '"' + (picked[o.id] ? ' checked' : '') + '><span class="bk-body"><span class="bk-meta">' + kn[1] + ' ' + kn[2] + ' · ' + o.marks + ' mark' + (o.marks === 1 ? '' : 's') + ' · <b>' + E(o.course) + '</b>' + (o.topic ? ' · ' + E(o.topic) : '') + (o.criterion ? ' · Criterion ' + o.criterion : '') + (o.difficulty ? ' · ' + DIFF[o.difficulty - 1] : '') + (o.own ? ' · <span class="pill">mine</span>' : '') + '</span>' +
        '<span class="bk-q">' + rich(String(pr.text).slice(0, 700)) + '</span>' + (o.image_url ? '<img src="' + E(o.image_url) + '" alt="" loading="lazy" style="max-height:110px;max-width:220px;border-radius:8px">' : '') + opts + '<span class="bk-src small muted">From: ' + E(o.source || '') + '</span></span></label>';
    }
    // ---- random by topic
    function byTopic() {
      box.innerHTML = '<p class="muted">Loading the topics…</p>';
      S.db.rpc('practice_topics').then(function (r) {
        if (r.error) { box.innerHTML = fail(r.error); return; }
        box.innerHTML = topicPicker(r.data || [], 'bt') + '<div class="bd-row" style="align-items:end"><label class="bd-f"><span>How many questions</span><input id="t-n" type="number" min="1" max="60" value="10"></label><label class="bd-f"><span>Type</span><select id="t-k">' + BANKKINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label><label class="bd-f"><span>Criterion</span>' + critSel('t-cr', '') + '</label><label class="bd-f"><span>Difficulty</span>' + diffSel('t-d', '') + '</label></div>' +
          '<p class="msg" id="t-m" role="status"></p><div class="acts"><button class="btn main" type="button" id="t-go">🎲 Pick and add the questions</button></div>';
        wirePicker(box, 'bt');
        box.querySelector('#t-go').onclick = function () {
          var ids = chosenTopics(box, 'bt'), b = this, m = box.querySelector('#t-m'); if (!ids.length) { m.textContent = 'Tick at least one topic.'; return; }
          b.disabled = true; b.textContent = 'Picking…';
          S.db.rpc('bank_pick', { topic_ids: ids, n: +box.querySelector('#t-n').value || 10, kinds: kindsOf(box.querySelector('#t-k').value), crit: box.querySelector('#t-cr').value, diff: +box.querySelector('#t-d').value || null }).then(function (r) {
            if (r.error) throw r.error; if (!(r.data || []).length) throw new Error('No questions of that type in these topics. Choose another type or more topics.');
            return copyIn(r.data, 'from the chosen topics');
          }).then(close, function (e) { b.disabled = false; b.textContent = '🎲 Pick and add the questions'; m.innerHTML = fail(e); });
        };
      });
    }
    // ---- from a file or text
    function outside() {
      box.innerHTML = '<p class="small muted">Questions from a paper, worksheet, textbook or another website. Numbered questions are found automatically: lettered choices become multiple choice, the rest written answers. Add the mark scheme to fill in the answers.</p>' +
        '<div class="bd-row"><label class="bd-f"><span>Question paper or worksheet (PDF, Word, PowerPoint, text, picture)</span><input id="o-f" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.html,.htm,.rtf,.odt,image/*"></label><label class="bd-f"><span>Mark scheme (optional)</span><input id="o-s" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.html,.htm,.rtf,.odt"></label></div>' +
        '<details><summary class="small">…or paste the questions</summary><div class="bd-row"><label class="bd-f"><span>Questions</span><textarea id="o-p" rows="7" placeholder="1. Which base pairs with adenine?\nA. Guanine\nB. Thymine\nC. Uracil\nD. Cytosine\n2. Explain why enzymes denature at high temperature. [3]"></textarea></label><label class="bd-f"><span>Mark scheme</span><textarea id="o-ps" rows="7" placeholder="1 B\n2 active site changes shape; substrate no longer fits; bonds break"></textarea></label></div></details>' +
        '<p class="msg" id="o-m" role="status"></p><div class="acts"><button class="btn main" type="button" id="o-go">Read the questions</button></div><div id="o-r" class="bk-list"></div>';
      var found = [];
      box.querySelector('#o-go').onclick = function () {
        var Q = window.BVQ, f = box.querySelector('#o-f').files[0], sf = box.querySelector('#o-s').files[0], p = box.querySelector('#o-p').value.trim(), ps = box.querySelector('#o-ps').value.trim(), m = box.querySelector('#o-m');
        if (!Q) { m.textContent = 'The file reader did not load. Refresh the page.'; return; }
        if (!f && !p) { m.textContent = 'Choose a file or paste the questions.'; return; }
        m.textContent = 'Reading…'; Q.IMGS.length = 0;
        Promise.all([f ? Q.readFile(f) : Promise.resolve(p.split('\n')), sf ? Q.readFile(sf) : Promise.resolve(ps ? ps.split('\n') : null)]).then(function (x) {
          found = Q.parsePaper(x[0]); if (!found.length) throw new Error('No numbered questions were found. Questions should start with a number such as "1." or "Question 1".');
          var matched = x[1] ? Q.applyScheme(found, Q.parseScheme(x[1])) : 0;
          m.textContent = found.length + ' questions found' + (x[1] ? ', ' + matched + ' matched to the mark scheme' : '') + '. Untick any you do not want.';
          box.querySelector('#o-r').innerHTML = found.map(function (q, i) { return '<label class="bk-card"><input type="checkbox" data-o="' + i + '" checked><span class="bk-body"><span class="bk-meta">' + (q.kind === 'short' ? '✏️ Written' : q.kind === 'tf' ? '✅ True or false' : '🔘 Multiple choice') + ' · ' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + (q.scheme || q.correct >= 0 ? ' · answer found' : ' · <b style="color:#b45309">add the answer</b>') + '</span><span class="bk-q">' + rich(String(q.prompt).slice(0, 600)) + '</span>' + (q.image ? '<img src="' + E(q.image) + '" alt="" style="max-height:110px;border-radius:8px">' : '') + '</span></label>'; }).join('') +
            '<div class="acts"><button class="btn main" type="button" id="o-add">＋ Add the ticked questions</button></div>';
          box.querySelector('#o-add').onclick = function () { var items = found.filter(function (q, i) { var c = box.querySelector('[data-o="' + i + '"]'); return c && c.checked; }).map(function (q) { return fromRule(q, ''); }); if (!items.length) return; addItems(items, 'from your file'); close(); };
        }).catch(function (e) { m.textContent = '⚠ ' + (e.message || e); });
      };
    }
    document.body.appendChild(ov); site(); setTimeout(function () { var q = box.querySelector('#b-q'); if (q) q.focus(); }, 30);
  }
  // topics grouped by course and level, with a tick box each (also used by "Generate from topics")
  function topicPicker(rows, key) {
    var by = {}, order = []; rows.forEach(function (t) { var g = t.course + (t.level ? ' · ' + t.level : ''); if (!by[g]) { by[g] = []; order.push(g); } by[g].push(t); });
    if (!order.length) return '<p class="emptybox">No topics with questions yet.</p>';
    return '<label class="bd-f"><span>Course and level</span><select data-tg="' + key + '">' + order.map(function (g, i) { return '<option value="' + i + '">' + E(g) + ' (' + by[g].length + ' topics)</option>'; }).join('') + '</select></label>' +
      order.map(function (g, i) { return '<fieldset class="bk-topics" data-tset="' + key + '-' + i + '"' + (i ? ' hidden' : '') + '><legend>Topics <button type="button" class="btn sm" data-tall>Tick all</button></legend>' + by[g].map(function (t) { return '<label class="chk"><input type="checkbox" data-topic="' + key + '" value="' + t.topic_id + '"> ' + E(t.topic) + ' <span class="small muted">(' + t.n + ')</span></label>'; }).join('') + '</fieldset>'; }).join('');
  }
  function wirePicker(root, key) {
    var sel = root.querySelector('[data-tg="' + key + '"]'); if (!sel) return;
    sel.onchange = function () { root.querySelectorAll('[data-tset^="' + key + '-"]').forEach(function (f) { var on = f.getAttribute('data-tset') === key + '-' + sel.value; f.hidden = !on; if (!on) f.querySelectorAll('input').forEach(function (c) { c.checked = false; }); }); };
    root.querySelectorAll('[data-tall]').forEach(function (b) { b.onclick = function () { var cs = b.closest('fieldset').querySelectorAll('input'), all = [].every.call(cs, function (c) { return c.checked; }); cs.forEach(function (c) { c.checked = !all; }); b.textContent = all ? 'Tick all' : 'Untick all'; }; });
  }
  function chosenNames(root, key) { return [].map.call(root.querySelectorAll('[data-topic="' + key + '"]:checked'), function (c) { return c.parentNode.textContent.replace(/\(\d+\)\s*$/, '').trim(); }); }
  function critSel(id, v) { return '<select id="' + id + '"><option value="">Any</option>' + ['A', 'B', 'C', 'D'].map(function (c) { return '<option' + (v === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>'; }
  function diffSel(id, v) { return '<select id="' + id + '"><option value="">Any</option>' + DIFF.map(function (d, i) { return '<option value="' + (i + 1) + '"' + (String(v) === String(i + 1) ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select>'; }
  function chosenTopics(root, key) { return [].map.call(root.querySelectorAll('[data-topic="' + key + '"]:checked'), function (c) { return c.value; }); }
  // library: a whole new draft generated from topics (practice_make, teacher mode) and opened in the builder
  function generateDialog() {
    var ov = document.createElement('div'); ov.className = 'bd-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Generate from topics');
    var inner = document.createElement('div'); ov.appendChild(inner); inner.innerHTML = '<div class="bd-top"><div><p class="label">Question bank</p><h2>🎯 Generate questions from topics</h2></div><button class="btn" type="button" data-close>✕</button></div><div id="gt"><p class="muted">Loading the topics…</p></div>';
    inner.querySelector('[data-close]').onclick = function () { ov.remove(); }; document.body.appendChild(ov);
    var box = inner.querySelector('#gt');
    S.db.rpc('practice_topics').then(function (r) {
      if (r.error) { box.innerHTML = '<p class="msg">' + (/practice_|schema cache|does not exist/.test(r.error.message || '') ? 'This switches on when the admin runs the database update 039.' : E(S.nice(r.error))) + '</p>'; return; }
      box.innerHTML = '<p class="small muted">The questions are copied into a new draft in your library with their answer keys. Edit anything, then preview, save and set it for your classes.</p>' + topicPicker(r.data || [], 'gd') +
        '<div class="bd-row" style="align-items:end"><label class="bd-f" style="flex:2"><span>Title (optional)</span><input id="g2-t" placeholder="e.g. Cells and transport: revision questions"></label><label class="bd-f"><span>How many questions</span><input id="g2-n" type="number" min="3" max="40" value="12"></label><label class="bd-f"><span>Type</span><select id="g2-k">' + BANKKINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label><label class="bd-f"><span>Criterion</span>' + critSel('g2-cr', '') + '</label><label class="bd-f"><span>Difficulty</span>' + diffSel('g2-d', '') + '</label></div>' +
        '<label class="chk small"><input type="checkbox" id="g2-ai" checked> If the bank has too few questions, top up with ✨ new AI questions on the same topics (you check them before saving)</label>' +
        '<p class="msg" id="g2-m" role="status"></p><div class="acts"><button class="btn main" type="button" id="g2-go">🎲 Generate</button></div>';
      wirePicker(box, 'gd');
      box.querySelector('#g2-go').onclick = function () {
        var ids = chosenTopics(box, 'gd'), b = this, m = box.querySelector('#g2-m'); if (!ids.length) { m.textContent = 'Tick at least one topic.'; return; }
        var k = box.querySelector('#g2-k').value; b.disabled = true; b.textContent = 'Generating…';
        var want = +box.querySelector('#g2-n').value || 12, crit = box.querySelector('#g2-cr').value, diff = +box.querySelector('#g2-d').value || null, names = chosenNames(box, 'gd');
        S.db.rpc('practice_make', { topic_ids: ids, n: want, kinds: k === 'graph' ? ['short'] : k ? [k] : null, set_title: box.querySelector('#g2-t').value.trim() || null, crit: crit, diff: diff }).then(function (r) {
          if (r.error) throw r.error;
          return S.db.from('quiz_questions').select('question_id', { count: 'exact', head: true }).eq('quiz_id', r.data).then(function (c) {
            var got = c && c.count != null ? c.count : c && Array.isArray(c.data) ? c.data.length : want;
            if (got < want && box.querySelector('#g2-ai').checked) { try { sessionStorage.setItem('bv-topup', JSON.stringify({ id: r.data, n: want - got, title: names.join(', '), types: k ? [k === 'graph' ? 'graph' : k] : null, crit: crit })); } catch (e) {} }
            ov.remove(); location.hash = 'edit/' + r.data; });
        }).catch(function (e) { b.disabled = false; b.textContent = '🎲 Generate'; m.textContent = '⚠ ' + S.nice(e); });
      };
    });
  }

  /* ================================================================ saving */
  function points(text) { return String(text || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var i = l.indexOf(':'), t = i > 0 ? l.slice(0, i).trim() : l, w = i > 0 ? l.slice(i + 1).split('/').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean) : [t.toLowerCase()]; return { text: t, any: w, all: [], marks: 1 }; }); }
  function rowOf(q) {
    var dbKind = /^(essay|graph|draw|annotate)$/.test(q.kind) ? 'short' : q.kind, r = { kind: dbKind, prompt: promptOf(q), marks: q.kind === 'info' ? 0 : +q.marks || 0, section: q.section || null, image_url: q.image || null, options: [], criterion: q.kind === 'info' ? null : q.crit || null, difficulty: q.kind === 'info' ? null : +q.diff || null },
      a = { correct_option: null, model_answer: q.model || null, mark_scheme: q.model || null, explanation: q.explanation || null, rubric: q.rubric || null, points: null, accepted: null };
    if (q.kind === 'mcq' || q.kind === 'tf') { r.options = q.options.map(function (o) { return String(o).trim(); }).filter(function (o, j) { return o || j === q.correct; }); a.correct_option = q.correct; a.model_answer = r.options[q.correct] || null; a.mark_scheme = null; }
    else if (QT && QT.has(q.kind)) { var p = QT.pack(q.kind, q.draft); r.options = p.options; a.accepted = p.accepted; a.model_answer = p.model; a.mark_scheme = p.model; }
    else if (dbKind === 'short') { var pts = points(q.points); a.points = pts.length ? pts : null; }
    return { q: r, a: a };
  }
  function must(r) { if (r && r.error) throw r.error; return r; }
  /* pictures kept inside the page (pasted, dropped, read from a PDF, or kept when an upload was refused) are uploaded before saving;
     if an upload is refused the picture stays inside the question, so saving never fails because of a picture */
  function uploadPics() {
    if (!window.BVM || !BVM.persist) return Promise.resolve();
    var jobs = [], uid = ME.user.id, isData = function (v) { return /^data:image\//.test(String(v || '')); };
    ST.questions.forEach(function (q) {
      if (isData(q.image)) jobs.push(BVM.persist(q.image, uid).then(function (u) { q.image = u; }));
      (q.media || []).forEach(function (m) { if (isData(m.src)) jobs.push(BVM.persist(m.src, uid).then(function (u) { m.src = u; })); });
      if (q.draft && isData(q.draft.image)) jobs.push(BVM.persist(q.draft.image, uid).then(function (u) { q.draft.image = u; if (q.kind === 'label' || q.kind === 'hotspot') q.image = u; }));
      (q.options || []).forEach(function (o, j) { var m = /^\[\[img:(data:image\/[^\]]+)\]\]\s*([\s\S]*)$/.exec(String(o)); if (m) jobs.push(BVM.persist(m[1], uid).then(function (u) { q.options[j] = '[[img:' + u + ']] ' + m[2]; })); });
    });
    return Promise.all(jobs);
  }
  function save() { return uploadPics().then(saveRows); }
  function saveRows() {
    var row = { title: ST.title.trim(), category: ST.cat, instructions: ST.instructions.trim() || null, time_limit_minutes: +ST.time || null, max_attempts: Math.max(1, +ST.attempts || 1), show_results: ST.cat === 'lesson' ? true : !!ST.show, feedback_mode: 'hybrid' };
    if (ST.subject) row.subject = ST.subject; else if (ST.id) row.subject = null;
    if (IS_ADMIN && HAS_MAIN) { row.main_site = !!ST.main; row.published = !!ST.main; } else if (!ST.id) row.published = false;
    var qid = ST.id;
    return Promise.resolve(ST.id ? S.db.from('quizzes').update(row).eq('id', ST.id).select('id').single() : S.db.from('quizzes').insert(row).select('id').single()).then(must).then(function (r) {
      qid = r.data.id; ST.id = qid;
      var ids = [], chain = Promise.resolve();
      ST.questions.forEach(function (q, i) { chain = chain.then(function () { var x = rowOf(q);
        return Promise.resolve(q.id ? S.db.from('questions').update(x.q).eq('id', q.id).select('id').single() : S.db.from('questions').insert(x.q).select('id').single()).then(must).then(function (r2) {
          q.id = r2.data.id; ids[i] = q.id; x.a.question_id = q.id; return S.db.from('question_answers').upsert(x.a, { onConflict: 'question_id' }).then(must); }); }); });
      return chain.then(function () { return S.db.from('quiz_questions').delete().eq('quiz_id', qid).then(must); })
        .then(function () { return S.db.from('quiz_questions').insert(ids.map(function (id, k) { return { quiz_id: qid, question_id: id, position: k + 1 }; })).then(must); })
        .then(function () { var gone = (ST.removed || []).filter(function (id) { return ids.indexOf(id) < 0; }); ST.removed = []; return gone.length ? S.db.from('questions').delete().in('id', gone) : null; })
        .then(function () { return S.db.from('quiz_classes').select('class_id').eq('quiz_id', qid); })
        .then(function (r3) { var have = (r3.data || []).map(function (c) { return c.class_id; }), mine = MYCLASSES.map(function (c) { return c.id; }),
            add = ST.classes.filter(function (c) { return have.indexOf(c) < 0; }), drop = have.filter(function (c) { return mine.indexOf(c) >= 0 && ST.classes.indexOf(c) < 0; });
          return Promise.all([add.length ? S.db.from('quiz_classes').insert(add.map(function (c) { return { quiz_id: qid, class_id: c, published: true, published_at: new Date().toISOString(), published_by: ME.user.id }; })).then(must) : null,
            drop.length ? S.db.from('quiz_classes').delete().eq('quiz_id', qid).in('class_id', drop).then(must) : null]); })
        .then(function () {   // admin lessons on the main site also get an entry in the Learning centre (as the old lesson maker did)
          if (!(IS_ADMIN && ST.cat === 'lesson')) return qid;
          var marks = ST.questions.reduce(function (a, q) { return a + (q.kind === 'info' ? 0 : +q.marks || 0); }, 0);
          return S.db.from('lessons').upsert({ external_id: 'IL-' + qid, title: row.title, summary: (row.instructions || '').split('\n')[0] || 'Interactive lesson', url: '/lesson/#' + qid, max_marks: marks, published: HAS_MAIN ? !!ST.main : false }, { onConflict: 'external_id' }).then(function () { return qid; }, function () { return qid; });
        });
    });
  }
  function done(id) {
    var url = (ST.cat === 'lesson' ? '/lesson/#' : ST.cat === 'exam' ? '/exams/#' : '/quizzes/#') + id;
    location.hash = 'edit/' + id;
    var n = document.createElement('div'); n.className = 'bd-ov'; n.innerHTML = '<div role="status"><h2>✅ Saved</h2><p>"' + E(ST.title) + '" is in <b>My assessments and lessons</b>' + (ST.classes.length ? ' and in ' + ST.classes.length + ' of your classes' : '') + (ST.main ? ', and on the main site' : '') + '.</p>' +
      (ST.cat === 'lesson' ? '<p>It is already a live interactive lesson: six steps, read-aloud, the timer, and answers shown after each step.</p>' : '') +
      '<div class="acts"><a class="btn main" href="' + url + '" target="_blank" rel="noopener">👁 Open it ↗</a><a class="btn" href="#">My assessments and lessons</a><button class="btn" type="button" data-x>Keep editing</button></div></div>';
    n.querySelector('[data-x]').onclick = function () { n.remove(); }; n.querySelectorAll('a[href="#"]').forEach(function (a) { a.onclick = function () { n.remove(); }; });
    document.body.appendChild(n);
  }
  window.addEventListener('beforeunload', function (e) { if (ST && ST.changed) { e.preventDefault(); e.returnValue = ''; } });
})();
