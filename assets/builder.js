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
    '.bd-list{display:grid;gap:6px;max-height:62vh;overflow:auto}.bd-it{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;padding:8px;border-radius:12px;border:2px solid transparent;background:#f8fafc;font-size:.88rem}' +
    '.bd-it[aria-current=true]{border-color:#4f46e5;background:#eef2ff}.bd-it:focus-visible{outline:3px solid #a5b4fc}.bd-it .n{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#4f46e5;color:#fff;font-weight:800;font-size:.8rem}.bd-it .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bd-it .m{color:#64748b;font-size:.78rem}' +
    '.bd-step{font:800 .72rem system-ui;letter-spacing:.06em;text-transform:uppercase;color:#0d9488;margin:8px 2px 0}' +
    '.bd-pal{display:grid;gap:6px}.bd-pal details{border:1px solid var(--line,#dde3ea);border-radius:12px;padding:6px 8px}.bd-pal summary{cursor:pointer;font-weight:700}.bd-pal button{all:unset;cursor:pointer;display:block;padding:5px 6px;border-radius:8px;font-size:.88rem}.bd-pal button:hover,.bd-pal button:focus-visible{background:#eef2ff}' +
    '.bd-f{display:grid;gap:4px;margin:0 0 10px}.bd-f>span{font-weight:700;font-size:.88rem}.bd-f input,.bd-f select,.bd-f textarea{font:inherit;padding:8px 10px;border:1px solid #cbd5e1;border-radius:10px;width:100%;box-sizing:border-box;background:#fff;color:#172033}.bd-f textarea{min-height:90px}.bd-f small{color:#64748b}' +
    '.bd-row{display:flex;gap:10px;flex-wrap:wrap}.bd-row>.bd-f{flex:1;min-width:120px}.bd-opt{display:flex;gap:6px;align-items:center;margin:4px 0}.bd-opt input[type=text]{flex:1;font:inherit;padding:7px 9px;border:1px solid #cbd5e1;border-radius:10px}' +
    '.bd-x{all:unset;cursor:pointer;color:#b91c1c;font-weight:800;padding:0 6px}.bd-add{all:unset;cursor:pointer;color:#4338ca;font-weight:700}.bd-warn{background:#fffbeb;border-left:5px solid #f59e0b;border-radius:10px;padding:8px 10px;font-size:.88rem;color:#78350f}' +
    '.bd-pv{border:2px dashed #c7d2fe;border-radius:14px;padding:12px;background:linear-gradient(160deg,#f8fafc,#eef2ff)}.bd-pv .q{margin:0}.bd-pv label.opt{display:block;padding:7px 10px;border:1px solid #dde3ea;border-radius:10px;margin:5px 0;background:#fff}' +
    '.bd-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between;margin:0 0 12px}.bd-top h2{margin:0}' +
    '.bd-ov{position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.6);display:grid;place-items:start center;overflow:auto;padding:24px 12px}.bd-ov>div{background:var(--bg,#fff);color:inherit;border-radius:18px;max-width:860px;width:100%;padding:18px 20px;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '.bd-ov .q{border:1px solid var(--line,#dde3ea);border-radius:14px;padding:12px;margin:10px 0;background:var(--card,#fff)}.bd-ov .res{font-weight:800;margin:6px 0 0}.bd-ov .res.good{color:#15803d}.bd-ov .res.bad{color:#b91c1c}' +
    '.bd-lib{display:grid;gap:10px}.bd-card{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border:1px solid var(--line,#dde3ea);border-left:6px solid var(--k);border-radius:14px;padding:10px 12px;background:var(--card,#fff)}.bd-card h4{margin:0}.bd-card .acts{display:flex;gap:6px;flex-wrap:wrap}@media (max-width:640px){.bd-card{grid-template-columns:1fr}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var missing038 = function (e) { return /main_site|questions_kind_check|violates check constraint|answers_teacher|row-level security/.test(String(e && (e.message || e.details) || e)); };

  S.guard(app, { school: true, anyone: true }).then(function (m) {
    ME = m; IS_ADMIN = !!m.admin;
    var teach = m.admin || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0;
    if (!teach) { app.innerHTML = '<section class="panel"><h2>🧰 Builder</h2><p>The builder is for teachers.</p><p><a class="btn main" href="/dashboard/">Go to my dashboard</a></p></section>'; return; }
    S.db.from('classes').select('id,name,teacher_id').eq('teacher_id', m.user.id).is('archived_at', null).order('name').then(function (r) { MYCLASSES = r.data || []; window.addEventListener('hashchange', route); route(); });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function route() {
    var h = location.hash.replace(/^#/, '').split('/');
    if (h[0] === 'new') return start(CAT[h[1]] ? h[1] : 'quiz');
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
      var rows = (r.data || []).filter(function (x) { return CAT[x.category]; }), mine = rows.filter(function (x) { return x.created_by === ME.user.id; }), cn = {}; MYCLASSES.forEach(function (c) { cn[c.id] = c.name; });
      var shown = (IS_ADMIN && FILTER === 'main' ? rows.filter(function (x) { return x.main_site; }) : IS_ADMIN && FILTER === 'others' ? rows.filter(function (x) { return x.created_by !== ME.user.id; }) : mine).filter(function (x) { return !FILTER || FILTER === 'main' || FILTER === 'others' || x.category === FILTER; });
      app.innerHTML = '<div class="row2 cband" style="--k:#4f46e5"><div><p class="label">Builder</p><h2 style="margin:0">🧰 My assessments and lessons</h2></div></div>' +
        '<div class="qlinks" style="margin:12px 0"><a style="--k:#7c3aed" href="#new/quiz">📝 New exam-style questions</a><a style="--k:#db2777" href="#new/exam">🎓 New examination</a><a style="--k:#0d9488" href="#new/lesson">🧪 New interactive lesson</a></div>' +
        '<nav class="tabs" aria-label="Show">' + [['', 'All mine'], ['quiz', '📝 Question sets'], ['exam', '🎓 Examinations'], ['lesson', '🧪 Lessons']].concat(IS_ADMIN ? [['main', '🌐 On the main site'], ['others', '👥 Other teachers\' work']] : []).map(function (t) { return '<a href="#" data-f="' + t[0] + '" aria-selected="' + (FILTER === t[0]) + '">' + t[1] + '</a>'; }).join('') + '</nav>' +
        '<p class="small muted">' + (IS_ADMIN ? 'You are the admin: tick <b>On the main site</b> to make an item part of the main site, where every teacher can find it and add it to their classes.' : 'What you build stays in your library and in the classes you add it to. Only the admin can put it on the main site.') + '</p>' +
        '<div class="bd-lib">' + (shown.length ? shown.map(function (x) { var K = CAT[x.category];
          return '<article class="bd-card" style="--k:' + K[2] + '"><span style="font-size:1.6rem" aria-hidden="true">' + K[0] + '</span><div><h4>' + E(x.title) + '</h4><span class="small muted">' + K[1] + ' · ' + x.quiz_questions.length + ' item' + (x.quiz_questions.length === 1 ? '' : 's') +
            ' · ' + (x.quiz_classes.length ? 'in ' + E(x.quiz_classes.map(function (c) { return cn[c.class_id] || 'a class'; }).join(', ')) : 'not in a class yet') + (x.main_site ? ' · <b style="color:#4338ca">🌐 main site</b>' : '') + '</span></div>' +
            '<div class="acts">' + (x.created_by === ME.user.id || IS_ADMIN ? '<a class="btn sm main" href="#edit/' + x.id + '">✏️ Edit</a>' : '') + '<a class="btn sm" href="' + (x.category === 'lesson' ? '/lesson/#' : x.category === 'exam' ? '/exams/#' : '/quizzes/#') + x.id + '" target="_blank" rel="noopener">👁 Open ↗</a>' +
            (IS_ADMIN && HAS_MAIN ? '<label class="chk small"><input type="checkbox" data-main="' + x.id + '"' + (x.main_site ? ' checked' : '') + '> On the main site</label>' : '') + '</div></article>'; }).join('') :
          '<p class="emptybox">Nothing here yet. Use the buttons above to build your first ' + (FILTER === 'lesson' ? 'lesson' : FILTER === 'exam' ? 'examination' : 'question set or lesson') + '.</p>') + '</div>';
      app.querySelectorAll('[data-f]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); FILTER = a.getAttribute('data-f'); library(); }; });
      app.querySelectorAll('[data-main]').forEach(function (c) { c.onchange = function () { var on = c.checked; S.db.from('quizzes').update({ main_site: on, published: on ? true : undefined }).eq('id', c.getAttribute('data-main')).then(function (r) { if (r.error) { c.checked = !on; c.parentNode.title = S.nice(r.error); c.parentNode.style.color = '#b91c1c'; } }); }; });
    });
  }

  /* ================================================================ the item being built */
  function newQ(kind, section) {
    var q = { id: null, kind: kind, prompt: '', marks: kind === 'info' ? 0 : kind === 'essay' ? 6 : 1, section: section || 'Explore', image: '', options: kind === 'tf' ? ['True', 'False'] : kind === 'mcq' ? ['', '', '', ''] : [], correct: kind === 'tf' ? 0 : -1,
      model: '', points: '', rubric: '', explanation: '', axes: 'x,y' };
    if (QT && QT.has(kind)) q.draft = QT.blank(kind);
    return q;
  }
  function start(cat) {
    ST = { id: null, cat: cat, title: '', instructions: '', subject: '', time: '', attempts: cat === 'lesson' ? 3 : cat === 'exam' ? 1 : 2, show: cat !== 'exam', main: false, classes: [], questions: [newQ(cat === 'lesson' ? 'info' : 'mcq', cat === 'lesson' ? 'Question' : 'Section A')], changed: false };
    SEL = 0; draw();
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
      ST.questions = (x[2].data || []).map(function (z) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
        var kind = o.kind, pr = T ? T.parse(o.prompt || '') : { text: o.prompt || '', mode: '' }, md = pr.mode;
        if (kind === 'short' && /^(graph|draw|annotate)$/.test(md)) kind = md; else if (kind === 'short' && an.rubric) kind = 'essay';
        var out = { id: o.id, kind: kind, prompt: kind === 'short' && !md ? o.prompt || '' : pr.text, marks: o.marks || 0, section: o.section || '', image: o.image_url || '', options: Array.isArray(o.options) ? o.options : [], correct: an.correct_option == null ? -1 : an.correct_option,
          model: an.model_answer || an.mark_scheme || '', rubric: an.rubric || '', explanation: an.explanation || '', axes: [pr.x || 'x', pr.y || 'y'].join(','), mode: md,
          points: (Array.isArray(an.points) ? an.points : []).map(function (p) { return (p.text || '') + ((p.any || []).length ? ': ' + p.any.join(' / ') : ''); }).join('\n') };
        if (QT && QT.has(kind)) out.draft = QT.unpack(kind, o.options, an.accepted);
        if (kind === 'short' && md === 'dropdown') out.prompt = o.prompt;
        return out; });
      if (!ST.questions.length) ST.questions.push(newQ(ST.cat === 'lesson' ? 'info' : 'mcq', ST.cat === 'lesson' ? 'Question' : ''));
      SEL = 0; draw();
    });
  }

  /* ================================================================ the three panels */
  function draw() {
    var K = CAT[ST.cat];
    app.innerHTML = '<div class="bd-top"><div><p class="label"><a href="#">← My assessments and lessons</a></p><h2>' + K[0] + ' ' + (ST.id ? 'Edit' : 'New') + ' ' + K[1].toLowerCase() + '</h2></div>' +
      '<div class="acts"><button class="btn" type="button" id="pvall">👁 Preview as a student</button><button class="btn main" type="button" id="save">💾 Preview and save</button></div></div>' +
      '<div class="bd"><aside class="bd-col" aria-label="Questions"><h3>Items <span class="small muted" id="tot"></span></h3><div class="bd-list" id="list"></div>' +
      '<h3 style="margin-top:14px">＋ Add</h3><div class="bd-pal">' + KINDS.map(function (g, gi) { return '<details' + (gi === 0 ? ' open' : '') + '><summary>' + g[0] + '</summary>' + g[1].map(function (k) { return '<button type="button" data-add="' + k[0] + '">' + k[1] + ' ' + k[2] + '</button>'; }).join('') + '</details>'; }).join('') + '</div></aside>' +
      '<section class="bd-col" aria-label="Edit the item" id="ed"></section>' +
      '<aside class="bd-col" aria-label="Settings and preview"><h3>⚙️ Settings</h3><div id="set"></div><h3 style="margin-top:14px">👁 What the student sees</h3><div class="bd-pv" id="pv"></div></aside></div>';
    app.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { var cur = ST.questions[SEL] || {}; ST.questions.splice(SEL + 1, 0, newQ(b.getAttribute('data-add'), cur.section || (ST.cat === 'lesson' ? 'Explore' : ''))); SEL++; ST.changed = true; list(); editor(); preview(); }; });
    app.querySelector('#pvall').onclick = function () { overlay(false); };
    app.querySelector('#save').onclick = function () { overlay(true); };
    settings(); list(); editor(); preview();
  }
  function label(q) { var t = q.kind === 'info' ? (q.prompt || 'Text, picture or video') : (q.prompt || ''); t = T ? T.text(t) : t; return t.replace(/\s+/g, ' ').trim().slice(0, 60) || '(no question yet)'; }
  function list() {
    var box = app.querySelector('#list'), h = '', last = null, n = 0;
    ST.questions.forEach(function (q, i) {
      if (ST.cat === 'lesson' && q.section !== last) { last = q.section; h += '<p class="bd-step">' + E(q.section || 'Explore') + '</p>'; }
      if (q.kind !== 'info') n++;
      h += '<button type="button" class="bd-it" data-i="' + i + '" aria-current="' + (i === SEL) + '"><span class="n">' + (q.kind === 'info' ? 'i' : n) + '</span><span><span class="t">' + KN[q.kind][1] + ' ' + E(label(q)) + '</span><br><span class="m">' + KN[q.kind][2] + (q.marks ? ' · ' + q.marks + ' mark' + (q.marks > 1 ? 's' : '') : '') + '</span></span><span aria-hidden="true">›</span></button>';
    });
    box.innerHTML = h;
    var total = ST.questions.reduce(function (a, q) { return a + (+q.marks || 0); }, 0); app.querySelector('#tot').textContent = '(' + ST.questions.length + ', ' + total + ' marks)';
    box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { SEL = +b.getAttribute('data-i'); list(); editor(); preview(); }; });
  }
  function touch() { ST.changed = true; clearTimeout(touch.t); touch.t = setTimeout(function () { list(); preview(); }, 250); }

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
      (q.kind === 'info' ? '' : field('Marks', '<input id="e-mk" type="number" min="0" max="50" value="' + E(q.marks) + '">')) + '</div>' +
      field(q.kind === 'info' ? 'Text (**bold**, a line starting with • for a list, a YouTube link on its own line shows the video)' : 'Question', '<textarea id="e-p" rows="' + (q.kind === 'info' ? 7 : 3) + '">' + E(q.prompt) + '</textarea>') +
      (q.kind === 'label' || q.kind === 'hotspot' ? '' : field('Picture (optional)', '<input id="e-img" type="url" value="' + E(q.image) + '" placeholder="https://… link to a picture">', q.kind === 'annotate' ? 'Students draw and write on this picture.' : 'Use a picture you have the right to use (for example from Wikimedia Commons).'));
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
    bind('#e-sec', function (v) { q.section = v; }); bind('#e-mk', function (v) { q.marks = Math.max(0, +v || 0); }); bind('#e-p', function (v) { q.prompt = v; }); bind('#e-img', function (v) { q.image = v.trim(); if (q.kind === 'label' || q.kind === 'hotspot') { q.draft.image = q.image; editor(); } });
    bind('#e-ex', function (v) { q.explanation = v; }); bind('#e-mo', function (v) { q.model = v; }); bind('#e-pt', function (v) { q.points = v; }); bind('#e-ru', function (v) { q.rubric = v; }); bind('#e-ax', function (v) { q.axes = v; });
    var opts = box.querySelector('#e-opts');
    if (opts) { var drawOpts = function () { opts.innerHTML = q.options.map(function (o, j) { return '<div class="bd-opt"><input type="radio" name="e-ok" value="' + j + '"' + (q.correct === j ? ' checked' : '') + ' aria-label="Choice ' + 'ABCDEFGH'.charAt(j) + ' is correct"><b>' + 'ABCDEFGH'.charAt(j) + '</b><input type="text" data-o="' + j + '" value="' + E(o) + '"' + (q.kind === 'tf' ? ' readonly' : '') + ' aria-label="Choice ' + 'ABCDEFGH'.charAt(j) + '">' + (q.kind === 'mcq' ? '<button type="button" class="bd-x" data-ox="' + j + '" aria-label="Remove choice ' + 'ABCDEFGH'.charAt(j) + '">✕</button>' : '') + '</div>'; }).join('');
        opts.querySelectorAll('[name=e-ok]').forEach(function (r) { r.onchange = function () { q.correct = +r.value; touch(); }; });
        opts.querySelectorAll('[data-o]').forEach(function (t) { t.oninput = function () { q.options[+t.getAttribute('data-o')] = t.value; touch(); }; });
        opts.querySelectorAll('[data-ox]').forEach(function (b) { b.onclick = function () { var j = +b.getAttribute('data-ox'); q.options.splice(j, 1); if (q.correct === j) q.correct = -1; else if (q.correct > j) q.correct--; drawOpts(); touch(); }; }); };
      drawOpts(); var oa = box.querySelector('#e-oadd'); if (oa) oa.onclick = function () { if (q.options.length < 8) { q.options.push(''); drawOpts(); } }; }
    if (auto) { if ((q.kind === 'label' || q.kind === 'hotspot') && !q.draft.image) q.draft.image = q.image;
      var prob = function () { var p = QT.problems(q.kind, q.draft); box.querySelector('#e-prob').textContent = p.length ? '⚠ ' + p.join(' ') : ''; };
      box.querySelector('#e-auto').appendChild(QT.editor(q.kind, q.draft, function () { if (q.draft.image && (q.kind === 'label' || q.kind === 'hotspot')) q.image = q.draft.image; prob(); touch(); })); prob(); }
    box.querySelector('#up').onclick = function () { move(-1); }; box.querySelector('#dn').onclick = function () { move(1); };
    box.querySelector('#dup').onclick = function () { var c = JSON.parse(JSON.stringify(q)); c.id = null; ST.questions.splice(SEL + 1, 0, c); SEL++; ST.changed = true; list(); editor(); preview(); };
    box.querySelector('#del').onclick = function () { if (q.id) (ST.removed = ST.removed || []).push(q.id); ST.questions.splice(SEL, 1); SEL = Math.max(0, SEL - 1); ST.changed = true; list(); editor(); preview(); };
  }
  function move(d) { var j = SEL + d; if (j < 0 || j >= ST.questions.length) return; var q = ST.questions.splice(SEL, 1)[0]; ST.questions.splice(j, 0, q); SEL = j; ST.changed = true; list(); editor(); preview(); }

  /* ================================================================ how the student sees an item */
  function rich(t) { return T && T.rich ? T.rich(t || '') : '<p>' + E(t || '').replace(/\n/g, '<br>') + '</p>'; }
  function promptOf(q) { if (!T) return q.prompt; if (q.kind === 'graph') { var a = String(q.axes || '').split(','); return T.join(q.prompt, 'graph', (a[0] || 'x').trim(), (a[1] || 'y').trim()); } if (q.kind === 'draw' || q.kind === 'annotate') return T.join(q.prompt, q.kind); return q.prompt; }
  function studentView(q, n, onAns) {
    var wrap = document.createElement('div'); wrap.className = 'q';
    if (q.kind === 'info') { wrap.innerHTML = (q.image ? '<img src="' + E(q.image) + '" alt="" style="max-width:100%;border-radius:10px">' : '') + rich(q.prompt); return wrap; }
    wrap.innerHTML = '<p><b>' + n + '.</b> ' + rich(T ? T.text(q.prompt) : q.prompt).replace(/^<p>|<\/p>$/g, '') + ' <span class="pill">' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + '</span></p>' + (q.image && q.kind !== 'annotate' && q.kind !== 'label' && q.kind !== 'hotspot' ? '<img src="' + E(q.image) + '" alt="" style="max-width:100%;max-height:320px;border-radius:10px">' : '');
    if (q.kind === 'mcq' || q.kind === 'tf') { q.options.forEach(function (o, j) { var l = document.createElement('label'); l.className = 'opt'; l.innerHTML = '<input type="radio" name="pv' + n + Math.random().toString(36).slice(2, 6) + '" value="' + j + '"> ' + E(o || '(empty choice)'); l.querySelector('input').onchange = function () { onAns(j); }; wrap.appendChild(l); }); }
    else if ((q.kind === 'label' || q.kind === 'hotspot') && !q.draft.image) { var no = document.createElement('p'); no.className = 'small muted'; no.textContent = '🖼 The picture appears here once you add its link.'; wrap.appendChild(no); }
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
      (probs.length ? '<div class="bd-warn"><b>Fix these before saving:</b><ul>' + probs.map(function (p) { return '<li>' + E(p) + '</li>'; }).join('') + '</ul></div>' : '') + '<div id="ovq"></div>' +
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

  /* ================================================================ saving */
  function points(text) { return String(text || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var i = l.indexOf(':'), t = i > 0 ? l.slice(0, i).trim() : l, w = i > 0 ? l.slice(i + 1).split('/').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean) : [t.toLowerCase()]; return { text: t, any: w, all: [], marks: 1 }; }); }
  function rowOf(q) {
    var dbKind = /^(essay|graph|draw|annotate)$/.test(q.kind) ? 'short' : q.kind, r = { kind: dbKind, prompt: promptOf(q), marks: q.kind === 'info' ? 0 : +q.marks || 0, section: q.section || null, image_url: q.image || null, options: [] },
      a = { correct_option: null, model_answer: q.model || null, mark_scheme: q.model || null, explanation: q.explanation || null, rubric: q.rubric || null, points: null, accepted: null };
    if (q.kind === 'mcq' || q.kind === 'tf') { r.options = q.options.map(function (o) { return String(o).trim(); }).filter(function (o, j) { return o || j === q.correct; }); a.correct_option = q.correct; a.model_answer = r.options[q.correct] || null; a.mark_scheme = null; }
    else if (QT && QT.has(q.kind)) { var p = QT.pack(q.kind, q.draft); r.options = p.options; a.accepted = p.accepted; a.model_answer = p.model; a.mark_scheme = p.model; }
    else if (dbKind === 'short') { var pts = points(q.points); a.points = pts.length ? pts : null; }
    return { q: r, a: a };
  }
  function must(r) { if (r && r.error) throw r.error; return r; }
  function save() {
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
        .then(function () { return qid; });
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
