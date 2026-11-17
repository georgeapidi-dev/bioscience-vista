/* Assessment centre · BioscienceVista: exam-style questions (/quizzes/) and examinations (/exams/). Marking is done on the server by submit_quiz. */
(function () {
  var T = window.BVT;
  var S = window.BVS, E = S.E, app = document.getElementById('app'), timer = null, beat = null, GUARD = null, TM = null, ME;
  var EXAM = app.getAttribute('data-mode') === 'exam', NOUN = EXAM ? 'examination' : 'question set', HOME = EXAM ? '/exams/' : '/quizzes/';
  S.guard(app).then(function (me) { ME = me; route(); window.addEventListener('hashchange', route); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function route() { clearInterval(timer); clearInterval(beat); if (TM) { TM.stop(); TM = null; } if (GUARD) GUARD.off(); var id = location.hash.slice(1); return id ? open(id) : list(); }
  var BACK = '#';   // practice sets (migration 039) lead back to Practice and revision
  function fail(r) { app.innerHTML = '<section class="panel"><p class="msg">' + E(S.nice(r.error || r)) + '</p><p><a href="' + BACK + '">← All ' + NOUN + 's</a></p></section>'; }

  // the sets for my classes; each says its subject (Biology, Chemistry or Physics) from migration 036 on, before it the subject is read from the topic and title
  function quizRows(withSubject) {
    return S.db.from('quizzes').select('id,title,instructions,time_limit_minutes,opens_at,due_at,max_attempts,published,show_results,topic_id,' + (withSubject ? 'subject,' : '') + ' topics(name), quiz_classes(class_id, published, classes(id,name,archived_at,site_slug,follows,programme))').in('published', (ME.roles || []).some(function (r) { return r === 'admin' || r === 'teacher'; }) ? [true] : [true, false]).eq('category', EXAM ? 'exam' : 'quiz').order('due_at', { ascending: true, nullsFirst: false });
  }
  function css() {
    if (document.getElementById('qc-css')) return; var st = document.createElement('style'); st.id = 'qc-css';
    st.textContent = '.qc-hero{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:center;padding:20px 22px;border-radius:20px;color:#fff;background:linear-gradient(120deg,#0d9488,#2563eb 55%,#7c3aed);box-shadow:0 10px 26px rgba(37,99,235,.22)}.qc-hero h2{margin:2px 0 4px;color:#fff}.qc-hero p{margin:0;opacity:.92}.qc-lab{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;font-weight:800;opacity:.85}' +
      '.qc-stats{display:flex;gap:10px}.qc-stats span{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:14px;padding:8px 14px;text-align:center;font-size:.85rem}.qc-stats b{display:block;font-size:1.5rem;line-height:1.1}' +
      '.qc-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}.qc-tabs a{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 10px;border-radius:14px;font-weight:800;text-decoration:none;color:#fff;box-shadow:0 4px 0 rgba(0,0,0,.14);transition:transform .12s}.qc-tabs a:hover{transform:translateY(-2px)}.qc-tabs a.on{outline:3px solid #0f172a;outline-offset:2px}' +
      '.qc-t1{background:linear-gradient(135deg,#f97316,#ef4444)}.qc-t2{background:linear-gradient(135deg,#8b5cf6,#6d28d9)}.qc-t3{background:linear-gradient(135deg,#10b981,#0d9488)}.qc-t4{background:linear-gradient(135deg,#0ea5e9,#2563eb)}.qc-t5{background:linear-gradient(135deg,#ec4899,#be185d)}' +
      '.qc-note{background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:10px 14px;font-size:.9rem}' +
      '.qc-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:10px 12px;margin:0 0 14px;position:sticky;top:0;z-index:5}' +
      '.qc-sel,.qc-find{display:flex;align-items:center;gap:6px;font-weight:700}.qc-sel select,.qc-find input{font:inherit;padding:8px 10px;border:2px solid #c7d2fe;border-radius:10px;background:#f8fafc;max-width:min(320px,70vw)}.qc-find{flex:1 1 200px}.qc-find input{width:100%}' +
      '.qc-chipsel,.qc-show{display:flex;flex-wrap:wrap;gap:6px}.qc-chipsel button,.qc-show button{font:inherit;font-weight:700;font-size:.88rem;padding:7px 12px;border-radius:999px;border:2px solid #c7d2fe;background:#eef2ff;color:#3730a3;cursor:pointer}.qc-chipsel button.on,.qc-show button.on{background:#4f46e5;border-color:#4f46e5;color:#fff}' +
      '.qc-cls{margin:18px 0 8px;font-size:1.15rem}.qc-h{display:flex;align-items:center;gap:8px;margin:14px 0 8px;font-size:1rem}.qc-h span{background:#e2e8f0;border-radius:999px;padding:1px 10px;font-size:.85rem}.qc-h.todo span{background:#fed7aa;color:#9a3412}.qc-h.done span{background:#bbf7d0;color:#166534}' +
      '.qc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}' +
      '.qc-card{display:flex;flex-direction:column;gap:8px;background:#fff;border:1px solid #e2e8f0;border-top:6px solid var(--qc);border-radius:16px;padding:12px 14px;box-shadow:0 2px 8px rgba(15,23,42,.06)}.qc-card[hidden]{display:none}' +
      '.qc-bio{--qc:#16a34a;--qcb:#f0fdf4}.qc-chem{--qc:#ea580c;--qcb:#fff7ed}.qc-phys{--qc:#2563eb;--qcb:#eff6ff}.qc-oth{--qc:#7c3aed;--qcb:#f5f3ff}' +
      '.qc-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.qc-head b{line-height:1.3}.qc-score{flex:none;background:#dcfce7;color:#166534;font-weight:800;border-radius:999px;padding:2px 10px;font-size:.85rem}.qc-score.wait{background:#fef3c7;color:#92400e}' +
      '.qc-chips{display:flex;flex-wrap:wrap;gap:5px}.qc-chips span{background:var(--qcb);color:#334155;border-radius:8px;padding:2px 8px;font-size:.8rem}' +
      '.qc-acts{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:auto}.qc-acts .btn.main{background:var(--qc);border-color:var(--qc)}.qc-more{flex:1 1 100%}.qc-more summary{cursor:pointer;font-size:.85rem;font-weight:700;color:#475569}.qc-more ul{margin:6px 0 0;padding-left:1.1em;font-size:.86rem}.qc-more ul ul{padding-left:1.1em;margin:4px 0}' +
      '.qc-part[hidden]{display:none}.qc-sel{white-space:nowrap}.qc-sel select{min-width:0}' +
      '@media(max-width:700px){.qc-tabs{display:flex;overflow-x:auto;scrollbar-width:thin;padding-bottom:6px}.qc-tabs a{flex:none;padding:9px 14px;font-size:.9rem;border-radius:999px}.qc-bar{position:static}.qc-hero{padding:16px}.qc-sel{flex:1 1 100%}.qc-sel select{flex:1}}';
    document.head.appendChild(st);
  }
  function list() {
    app.innerHTML = '<p class="muted">Loading the Assessment centre…</p>';
    Promise.all([
      quizRows(true).then(function (r) { return r.error ? quizRows(false) : r; }),
      S.db.from('quiz_attempts').select('id,quiz_id,status,score,max_score,submitted_at,released').eq('student_id', ME.user.id),
      EXAM ? Promise.resolve({ data: [] }) : S.db.from('lessons').select('id,title,url,topic_id,sort_order,published').order('sort_order').then(function (r) { return r; }, function () { return { data: [] }; }),
      EXAM ? Promise.resolve({ data: [] }) : S.db.from('topics').select('id,parent_id').then(function (r) { return r; }, function () { return { data: [] }; }),
      ME.staff ? Promise.resolve({ data: [] }) : S.db.from('material_requests').select('quiz_id,class_id,status').eq('student_id', ME.user.id).not('quiz_id', 'is', null).then(function (r) { return r.error ? { data: [] } : r; }, function () { return { data: [] }; })
    ]).then(function (x) {
      if (x[0].error) return fail(x[0]);
      // a set linked to my class but not opened for it yet: shown with a lock; the teacher opens it when I ask
      var myCls = {}; (ME.classes || []).forEach(function (c) { myCls[c.id] = 1; });
      var asked = {}; ((x[4] && x[4].data) || []).forEach(function (r) { asked[r.quiz_id] = r.status; });
      function lockOf(q) { if (ME.staff) return null; var links = (q.quiz_classes || []).filter(function (k) { return myCls[k.class_id]; });
        if (!links.length || links.some(function (k) { return k.published; })) return null; return links[0].class_id; }
      // each set of exam-style questions is shown with the interactive lessons of its topic (the topic itself and its subtopics)
      var parent = {}; ((x[3] && x[3].data) || []).forEach(function (t) { parent[t.id] = t.parent_id; });
      var LES = ((x[2] && x[2].data) || []).filter(function (l) { return l.published !== false && l.url; });
      function lessonsOf(q) { if (!q.topic_id) return ''; var ls = LES.filter(function (l) { return l.topic_id === q.topic_id || parent[l.topic_id] === q.topic_id; }); if (!ls.length) return '';
        var seen = {}; ls = ls.filter(function (l) { var k = l.url; if (seen[k]) return false; seen[k] = 1; return true; });
        return '<li>📘 <b>' + ls.length + ' interactive lesson' + (ls.length > 1 ? 's' : '') + '</b><ul>' + ls.map(function (l) { return '<li><a href="' + E(l.url) + '">' + E(String(l.title || '').split(':')[0]) + '</a></li>'; }).join('') + '</ul></li>'; }
      var qs = x[0].data || [], at = x[1].data || [], now = new Date();
      if (ME.staff) qs = qs.filter(function () { return true; });
      function subjOf(q) { return BV.subj.of(q.subject, q.topics && q.topics.name, q.title); }
      function card(q) {
        var mine = at.filter(function (a) { return a.quiz_id === q.id; }), done = mine.filter(function (a) { return a.status !== 'in_progress'; }), live = mine.filter(function (a) { return a.status === 'in_progress'; })[0];
        var open = (!q.opens_at || new Date(q.opens_at) <= now) && (!q.due_at || new Date(q.due_at) >= now), left = q.max_attempts - mine.length;
        var best = done.reduce(function (b, a) { var st = !q.show_results && !a.released ? 'held' : a.status; return a.score != null && (b == null || +a.score > b.score) ? { score: +a.score, max: +a.max_score, status: st } : b; }, null);
        var lockCls = lockOf(q);
        var btn = lockCls ? (asked[q.id] === 'pending' ? '<span class="pill">🔒 Requested · waiting for your teacher</span>' : '<span class="small muted">🔒 Opens when your teacher approves it</span> <button type="button" class="btn sm" data-reqq="' + q.id + '" data-cls="' + lockCls + '">' + (asked[q.id] === 'declined' ? 'Ask again' : 'Request') + '</button>') : live ? '<a class="btn main sm" href="#' + q.id + '">Continue</a>' : open && left > 0 ? '<a class="btn main sm" href="#' + q.id + '">' + (done.length ? 'Try again' : 'Start') + '</a>' : done.length ? '<a class="btn sm" href="#' + q.id + '">See my result</a>' : '<span class="pill">' + (q.opens_at && new Date(q.opens_at) > now ? 'Opens ' + E(S.when(q.opens_at)) : 'Closed') + '</span>';
        var sj = subjOf(q) || '', col = /bio/i.test(sj) ? 'bio' : /chem/i.test(sj) ? 'chem' : /phys/i.test(sj) ? 'phys' : 'oth';
        var more = (q.instructions ? '<li>ℹ️ ' + E(q.instructions) + '</li>' : '') + lessonsOf(q);
        var th = BV.theme(q.title);
        return '<article class="qc-card qc-' + col + '"' + (th ? ' style="--qc:' + th.c + ';--qcb:color-mix(in srgb,' + th.c + ' 10%,#fff)"' : '') + ' data-find="' + E((q.title + ' ' + (q.topics && q.topics.name || '')).toLowerCase()) + '"><div class="qc-head"><b>' + E(q.title) + '</b>' +
          (best ? '<span class="qc-score' + (best.status === 'held' || best.status === 'needs_marking' ? ' wait' : '') + '">' + (best.status === 'held' ? 'Waiting for your teacher' : best.status === 'needs_marking' ? 'Being marked' : best.score + ' / ' + best.max) + '</span>' : '') + '</div>' +
          '<div class="qc-chips">' + (th ? '<span style="background:' + th.c + ';color:#fff;font-weight:800">Theme ' + th.k + ' · ' + E(th.name) + '</span><span style="border:1.5px solid ' + th.c + ';color:' + th.c + ';font-weight:800;background:#fff">' + th.lv + ' · ' + E(th.level) + '</span>' : '') + [q.time_limit_minutes ? '⏱ ' + q.time_limit_minutes + ' min' : '⏱ No time limit', q.due_at ? '📅 Due ' + S.when(q.due_at) : '', '🔁 ' + q.max_attempts + ' attempt' + (q.max_attempts > 1 ? 's' : '')].filter(Boolean).map(function (t) { return '<span>' + E(t) + '</span>'; }).join('') + '</div>' +
          '<div class="qc-acts">' + btn + (ME.admin ? S.del('quiz', q.id, q.title) : '') + (more ? '<details class="qc-more"><summary>More</summary><ul>' + more + '</ul></details>' : '') + '</div></article>';
      }
      // each quiz sits under the class it is set for (a student sees only their own classes)
      var mine = {}; (ME.classes || []).forEach(function (c) { mine[c.id] = c.name; });
      var groups = {}, order = [];
      qs.forEach(function (q) {
        var cls = (q.quiz_classes || []).map(function (x) { return x.classes; }).filter(function (c) { return c && !c.archived_at && (ME.staff || mine[c.id]); });
        if (!cls.length) cls = [{ id: '_', name: ME.staff ? 'Not set for a class' : 'Set for you' }];
        cls.forEach(function (c) { if (!groups[c.id]) { groups[c.id] = { name: c.name, cls: c, qs: [] }; order.push(c.id); } groups[c.id].qs.push(q); });
      });
      order.sort(function (a, b) { return groups[a].name.localeCompare(groups[b].name); });
      var isDone = function (q) { return at.some(function (a) { return a.quiz_id === q.id && a.status !== 'in_progress'; }); };
      var pick = new URLSearchParams(location.search).get('class') || (order.length === 1 || (ME.staff && order.length > 3) ? order[0] : '');
      if (pick && !groups[pick]) pick = order[0] || '';
      css();
      var many = order.length > 4, nDo = qs.filter(function (q) { return !isDone(q); }).length;
      app.innerHTML = '<div class="qc-hero"><div><p class="qc-lab">Assessment centre</p><h2>' + (EXAM ? '🧪 Examinations' : '📝 Exam-style questions') + '</h2><p>' + (EXAM ? 'Timed examinations set by your teacher.' : 'Topic-by-topic practice questions, each with the interactive lessons it goes with.') + '</p></div>' +
        '<div class="qc-stats"><span><b>' + nDo + '</b> to do</span><span><b>' + (qs.length - nDo) + '</b> done</span></div></div>' +
        '<nav class="qc-tabs" aria-label="Assessment centre"><a class="qc-t1' + (EXAM ? '' : ' on') + '" href="/quizzes/"' + (EXAM ? '' : ' aria-current="page"') + '>📝 Exam-style questions</a><a class="qc-t2' + (EXAM ? ' on' : '') + '" href="/exams/"' + (EXAM ? ' aria-current="page"' : '') + '>🧪 Examinations</a><a class="qc-t3" href="/practice/">🃏 Practice &amp; revision</a><a class="qc-t4" href="/dashboard/">🏠 My dashboard</a>' + (ME.staff ? '<a class="qc-t5" href="/build/">🛠️ Assessment Studio</a>' : '') + '</nav>' +
        (ME.staff ? '<p class="qc-note">👀 Admin view: students only see the ' + NOUN + 's set for their own classes. Set them in the <a href="/staff/#quizzes">Teacher dashboard</a>.</p>' : '') +
        (!order.length && !ME.staff ? '<p class="panel tint">Join a class on <a href="/dashboard/">your dashboard</a> to see your ' + NOUN + 's.</p>' : '') +
        (order.length ? '<div class="qc-bar">' + (order.length > 1 ? (many ? '<label class="qc-sel">🏫 Class <select id="qc-cls"><option value="">All classes</option>' + order.map(function (g) { return '<option value="' + E(g) + '"' + (pick === g ? ' selected' : '') + '>' + E(groups[g].name) + ' (' + groups[g].qs.length + ')</option>'; }).join('') + '</select></label>'
            : '<div class="qc-chipsel" role="group" aria-label="Class"><button type="button" class="' + (pick ? '' : 'on') + '" data-g="">All classes</button>' + order.map(function (g) { return '<button type="button" class="' + (pick === g ? 'on' : '') + '" data-g="' + E(g) + '">' + E(groups[g].name) + ' (' + groups[g].qs.length + ')</button>'; }).join('') + '</div>') : '') +
          '<label class="qc-find">🔎 <input type="search" id="qc-find" placeholder="Find a topic…" aria-label="Find a topic"></label>' +
          '<div class="qc-show" role="group" aria-label="Show"><button type="button" class="on" data-show="all">All</button><button type="button" data-show="todo">To do</button><button type="button" data-show="done">Completed</button></div></div>' : '') +
        order.filter(function (g) { return !pick || g === pick; }).map(function (g) { var gq = groups[g].qs, todo = gq.filter(function (q) { return !isDone(q); }), past = gq.filter(isDone);
          var lists = function (qs2) { qs2 = qs2.slice().sort(function (a, b) { var x = BV.theme(a.title), y = BV.theme(b.title); return (x ? x.k : 'Z').localeCompare(y ? y.k : 'Z') || (x ? x.lv : 9) - (y ? y.lv : 9) || String(a.title).localeCompare(String(b.title), undefined, { numeric: true }); });
            var td = qs2.filter(function (q) { return !isDone(q); }), ps = qs2.filter(isDone);
            return '<div class="qc-part" data-part="todo"><h4 class="qc-h todo">To do <span>' + td.length + '</span></h4>' + (td.length ? '<div class="qc-grid">' + td.map(card).join('') + '</div>' : '<p class="emptybox">Nothing to do right now. 🎉</p>') + '</div>' +
              (ps.length ? '<div class="qc-part" data-part="done"><h4 class="qc-h done">Completed <span>' + ps.length + '</span></h4><div class="qc-grid">' + ps.map(card).join('') + '</div></div>' : ''); };
          // Grade 6 to 10 science: Biology, Chemistry and Physics are kept apart, one tab per subject
          return '<section class="grp qc-grp"><h3 class="qc-cls">🏫 ' + E(groups[g].name) + '</h3>' +
            (BV.subj.isMyp(groups[g].cls) ? BV.subj.split(gq, subjOf, lists) : lists(gq)) + '</section>'; }).join('');
      app.querySelectorAll('[data-reqq]').forEach(function (b) { b.onclick = function () { b.disabled = true;
        S.db.rpc('request_quiz', { qid: b.getAttribute('data-reqq'), cid: b.getAttribute('data-cls') }).then(function (r) { if (r.error) { b.disabled = false; alert(S.nice(r.error)); return; } list(); }); }; });
      function goCls(v) { var u = new URL(location.href); if (v) u.searchParams.set('class', v); else u.searchParams.delete('class'); history.replaceState(null, '', u); list(); }
      app.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { goCls(b.getAttribute('data-g')); }; });
      var sel = app.querySelector('#qc-cls'); if (sel) sel.onchange = function () { goCls(sel.value); };
      var show = 'all', fnd = app.querySelector('#qc-find');
      function filt() { var t = (fnd && fnd.value || '').trim().toLowerCase();
        app.querySelectorAll('.qc-part').forEach(function (p) { p.hidden = show !== 'all' && p.getAttribute('data-part') !== show; });
        app.querySelectorAll('.qc-card').forEach(function (c) { c.hidden = !!t && c.getAttribute('data-find').indexOf(t) < 0; }); }
      if (fnd) fnd.oninput = filt;
      app.querySelectorAll('[data-show]').forEach(function (b) { b.onclick = function () { show = b.getAttribute('data-show'); app.querySelectorAll('[data-show]').forEach(function (x) { x.classList.toggle('on', x === b); }); filt(); }; });
    });
  }

  function open(qid) {
    app.innerHTML = '<p class="muted">Opening ' + NOUN + '…</p>';
    Promise.all([
      S.db.from('quizzes').select('*').eq('id', qid).maybeSingle(),
      S.db.from('quiz_attempts').select('*').eq('quiz_id', qid).eq('student_id', ME.user.id).order('started_at', { ascending: false })
    ]).then(function (x) {
      var q = x[0].data, at = x[1].data || [];
      BACK = q && q.practice ? '/practice/#results' : '#';
      if (!q) {   // a quiz set for another class or level (e.g. the HL version for an SL student): go to the version set for this student
        if (ME.staff) return fail((EXAM ? 'Exam' : 'Quiz') + ' not found.');
        return S.db.from('quiz_attempts').select('quiz_id, quizzes!inner(id,category,published)').eq('student_id', ME.user.id).eq('status', 'in_progress').then(function (r) {
          var mine = (r.data || []).filter(function (a) { return a.quizzes && a.quizzes.published && a.quizzes.category === (EXAM ? 'exam' : 'quiz'); });
          if (mine.length === 1) { location.replace(HOME + '#' + mine[0].quiz_id); return; }
          app.innerHTML = '<section class="panel"><p class="msg">That ' + NOUN + ' is set for another class or level. Here are the ' + NOUN + 's set for you.</p></section>';
          setTimeout(function () { location.replace(HOME); }, 1800);
        });
      }
      var live = at.filter(function (a) { return a.status === 'in_progress'; })[0], done = at.filter(function (a) { return a.status !== 'in_progress'; });
      var canStart = at.length < q.max_attempts;
      if (rules(q).seb && inSEB()) {   // lockdown: inside Safe Exam Browser, check it is running the teacher's settings file
        if (ME.staff) return sebTeacher(q);
        app.innerHTML = '<p class="muted">Checking Safe Exam Browser…</p>';
        return sebPass(q.id).then(function (ok) { if (ok) go(); else sebBlocked(q); });
      }
      go();
      function go() {
      if (live) { if (rules(q).seb && !inSEB()) { app.innerHTML = '<section class="panel"><h2>' + E(q.title) + '</h2><p>This ' + NOUN + ' can only be continued in Safe Exam Browser.</p><div class="acts"><a class="btn main" href="' + E(sebLink()) + '">Open in Safe Exam Browser</a><a class="btn" href="' + BACK + '">Back</a></div></section>'; return; } return paper(q, live.id); }
      if (done.length && !(canStart && new URLSearchParams(location.search).get('again'))) return review(q, done[0], canStart);
      app.innerHTML = '<section class="panel"><p class="label">' + (EXAM ? 'Exam' : 'Quiz') + '</p><h2>' + E(q.title) + '</h2>' + (q.instructions ? '<p>' + E(q.instructions) + '</p>' : '') +
        (EXAM ? '<p class="panel tint small"><b>Exam conditions.</b> Work on your own. Once you start, the timer keeps running even if you close the page, and the exam is handed in automatically when time runs out.</p>' : '') + '<ul class="small"><li>' + (q.time_limit_minutes ? 'You have <b>' + q.time_limit_minutes + ' minutes</b>. The timer keeps running if you close the page.' : 'There is no time limit.') + '</li><li>Attempts allowed: ' + q.max_attempts + ' (used ' + at.length + ')</li><li>Your answers are saved as you go, so you can carry on if your device switches off. Press <b>Submit</b> when you finish.</li></ul>' +
        (ME.staff || ME.school ? '<p class="panel tint" style="margin:10px 0">👩‍🏫 <b>Teacher?</b> <a class="btn main sm" href="/teach/#quizzes/' + q.id + '/preview">👁 Open the questions (no timer)</a> <span class="small muted">Teacher preview: nothing is saved.</span></p>' : '') +
        '<div class="acts"><button class="btn main" id="go" type="button">' + (EXAM ? 'Start exam' : 'Start quiz') + '</button><a class="btn" href="' + BACK + '">Back</a></div><p class="msg" id="m"></p></section>';
      if (window.BVTimer) BVTimer.peek(S.db, 'quiz', q.id).then(function (t) {   // the time allowance (the teacher can change it for a class)
        var li = app.querySelector('ul.small li'); if (!t || !li) return;
        li.innerHTML = '⏱ You have <b>' + t.minutes + ' minute' + (t.minutes === 1 ? '' : 's') + '</b>. The timer starts when you press Start. ' +
          (EXAM ? 'It keeps running if you close the page, and the examination is handed in automatically when the time runs out.' : 'When the time is used up you can still finish: the extra time is recorded for your teacher.'); });
      var R = rules(q), ul = app.querySelector('ul.small');
      if (ul) ul.insertAdjacentHTML('beforeend', '<li><b>Stay on this page.</b> ' + (R.fullscreen && fsOK() ? 'The ' + NOUN + ' opens in full screen. ' : '') + 'Leaving the page, another tab or another window is recorded and your teacher can see it.' +
        (R.mode === 'autosubmit' ? ' If you leave ' + R.max + ' time' + (R.max > 1 ? 's' : '') + ', it is handed in automatically.' : '') + ' Copying and pasting are switched off.</li>');
      if (R.seb && !inSEB()) {
        app.querySelector('.acts').innerHTML = '<a class="btn main" href="' + E(sebLink()) + '">Open in Safe Exam Browser</a><a class="btn" href="https://safeexambrowser.org/download_en.html" target="_blank" rel="noopener">Download Safe Exam Browser</a><a class="btn" href="' + BACK + '">Back</a>';
        app.querySelector('#m').textContent = 'This ' + NOUN + ' can only be done in Safe Exam Browser. Install it (free), then press Open in Safe Exam Browser and sign in there.';
        return;
      }
      app.querySelector('#go').onclick = function () { this.disabled = true; if (R.fullscreen && fsOK()) goFull(); S.db.rpc('start_quiz', { qid: qid }).then(function (r) { if (r.error) { app.querySelector('#m').textContent = S.nice(r.error); return; } paper(q, r.data); }); };
      }
    });
  }

  /* ---------- Safe Exam Browser lockdown ---------- */
  // SEB 3.x gives each settings file a Config Key; the page can read a hash of it (tied to this page address) from SEB's JavaScript API.
  function sebKey() {
    return new Promise(function (res) {
      var X = window.SafeExamBrowser, t = setTimeout(function () { res(X && X.security && X.security.configKey || null); }, 2000);
      if (!X || !X.security) { clearTimeout(t); return res(null); }
      try { if (X.security.updateKeys) X.security.updateKeys(function () { clearTimeout(t); res(X.security.configKey || null); }); else { clearTimeout(t); res(X.security.configKey || null); } } catch (e) { clearTimeout(t); res(null); }
    });
  }
  function sebPass(qid) {
    return sebKey().then(function (k) { return S.db.rpc('seb_check', { qid: qid, key: k }); }).then(function (r) {
      if (r.error) return /seb_check|schema cache|PGRST202/i.test(r.error.message || '');   // before database update 012 there is nothing to check
      return r.data === true;
    }, function () { return false; });
  }
  function sebBlocked(q) {
    app.innerHTML = '<section class="panel"><p class="label">' + (EXAM ? 'Exam' : 'Quiz') + '</p><h2>' + E(q.title) + '</h2><p class="msg">This Safe Exam Browser is not set up for this ' + NOUN + '.</p>' +
      '<p>Close Safe Exam Browser, then open the ' + NOUN + ' again using the Safe Exam Browser file your teacher gave you. If it still does not open, ask your teacher.</p>' +
      '<div class="acts"><button class="btn main" type="button" id="again">Check again</button><a class="btn" href="/?seb=quit">Close Safe Exam Browser</a></div></section>';
    app.querySelector('#again').onclick = function () { open(q.id); };
  }
  function sebTeacher(q) {   // a teacher opening the exam inside SEB registers that setup, so only that settings file is accepted
    app.innerHTML = '<p class="muted">Reading Safe Exam Browser…</p>';
    sebKey().then(function (k) {
      var g = q.integrity || {}, keys = Array.isArray(g.seb_keys) ? g.seb_keys : [], has = k && keys.indexOf(k) >= 0;
      app.innerHTML = '<section class="panel"><p class="label">Teacher · Safe Exam Browser set-up</p><h2>' + E(q.title) + '</h2>' +
        (!k ? '<p class="msg">This Safe Exam Browser does not share its settings key. Use Safe Exam Browser 3 or newer, and open the exam with the settings file downloaded from BioscienceVista (it has "Use Browser Exam Key and Config Key" switched on).</p>' :
          '<p>You are signed in as a teacher inside Safe Exam Browser. ' + (has ? '<b>✓ This set-up is registered.</b> Students opening the exam with the same settings file will be let in.' :
            'Register this set-up so that students can only take the exam with <b>this same settings file</b>. Anyone using another file, or an ordinary browser, is kept out.') + '</p>' +
          '<p class="small muted">Set-ups registered for this exam: ' + keys.length + '. Register again whenever you download a new settings file (changing the settings changes the key). Students must open the exam the same way you did, with the same file.</p>') +
        '<div class="acts">' + (k && !has ? '<button class="btn main" type="button" id="reg">Register this set-up</button>' : '') + '<a class="btn" href="/?seb=quit">Close Safe Exam Browser</a></div><p class="msg" id="m" role="status"></p></section>';
      var b = app.querySelector('#reg');
      if (b) b.onclick = function () { b.disabled = true;
        var ng = Object.assign({}, g, { seb: true, seb_keys: keys.concat([k]).slice(-10) });
        S.db.from('quizzes').update({ integrity: ng }).eq('id', q.id).select('id').single().then(function (r) {
          if (r.error) { b.disabled = false; app.querySelector('#m').textContent = S.nice(r.error); return; }
          q.integrity = ng; sebTeacher(q);
        });
      };
    });
  }


  /* ---------- exam mode: full screen, every tab / window / app switch recorded, optional hand-in ---------- */
  function rules(q) { var g = q.integrity || {}, ex = q.category === 'exam' || EXAM;
    return { mode: g.mode || (ex ? 'autosubmit' : 'warn'), max: Math.max(1, +g.max || 3), fullscreen: g.fullscreen !== false, seb: !!g.seb }; }
  function inSEB() { return /SEB\//.test(navigator.userAgent) || !!window.SafeExamBrowser; }
  function fsOK() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !inSEB(); }
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function goFull() { var d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; try { var r = f && f.call(d); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
  function exitFull() { try { if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
  function sebLink() { return 'sebs://' + location.host + '/assets/biosciencevista-' + (EXAM ? 'exams' : 'quizzes') + '.seb'; }   // opens Safe Exam Browser on this page; the student signs in there
  function watch(q, attempt, f, prev, handIn) {
    var R = rules(q), needFs = R.fullscreen && fsOK(), away = false, since = 0, n = +(prev.away_count || 0), secs = +(prev.away_seconds || 0), done = false, offs = [];
    function on(t, ev, fn) { t.addEventListener(ev, fn, true); offs.push(function () { t.removeEventListener(ev, fn, true); }); }
    var note = document.createElement('div'); note.className = 'xwarn'; note.setAttribute('role', 'alert'); note.hidden = true; f.insertBefore(note, f.firstChild.nextSibling);
    var lock = document.createElement('div'); lock.className = 'xlock'; lock.hidden = true;
    lock.innerHTML = '<div><p class="label">' + (EXAM ? 'Exam' : 'Quiz') + ' mode</p><h2>The questions are hidden</h2><p>This ' + NOUN + ' must be done in full screen. Leaving full screen, another tab or another window is recorded and your teacher can see it.</p><button type="button" class="btn main">Return to full screen</button></div>';
    lock.querySelector('button').onclick = goFull; document.body.appendChild(lock);
    function send() { S.db.rpc('quiz_focus', { attempt: attempt, n: n, secs: Math.round(secs), away: away }).then(function () {}, function () {}); }
    function say(t) { note.textContent = t; note.hidden = false; }
    function leave() { if (away || done) return; away = true; since = Date.now(); n++; send(); }
    function present() { return !document.hidden && document.hasFocus() && (!needFs || isFull()); }
    function back() {
      if (!away || done || !present()) return; away = false; secs += (Date.now() - since) / 1000; send();
      if (R.mode === 'record') return;
      if (R.mode === 'autosubmit' && n >= R.max) { done = true; say('You left the ' + NOUN + ' ' + n + ' times, so it is being handed in now.'); handIn(); return; }
      say('⚠ You left the ' + NOUN + ' (' + n + (R.mode === 'autosubmit' ? ' of ' + R.max : '') + (n === 1 && R.mode !== 'autosubmit' ? ' time' : ' times') + '). Your teacher can see this.' +
        (R.mode === 'autosubmit' && R.max - n === 1 ? ' If you leave once more, it will be handed in automatically.' : ''));
    }
    function fsCheck() { if (!needFs) return; lock.hidden = isFull(); if (!isFull()) leave(); else back(); }
    on(document, 'visibilitychange', function () { if (document.hidden) leave(); else back(); });
    on(window, 'blur', function () { setTimeout(function () { if (!document.hasFocus()) leave(); }, 150); });
    on(window, 'focus', back);
    on(document, 'fullscreenchange', fsCheck); on(document, 'webkitfullscreenchange', fsCheck);
    ['copy', 'cut', 'paste', 'contextmenu', 'drop'].forEach(function (ev) { on(f, ev, function (e) { if (e.target.closest && e.target.closest('[data-pad]') && ev === 'contextmenu') return; e.preventDefault(); say('Copying and pasting are switched off in this ' + NOUN + '.'); }); });
    if (needFs && !isFull()) lock.hidden = false;   // e.g. after reloading the page: ask to go back into full screen (not counted)
    send();
    return { off: function () { done = true; offs.forEach(function (x) { x(); }); offs = []; if (lock.parentNode) lock.parentNode.removeChild(lock); exitFull(); GUARD = null; }, rules: R };
  }
  function key(a) { return 'bvq-' + a; }
  function paper(q, attempt) {
    S.db.rpc('quiz_paper', { attempt: attempt }).then(function (r) {
      if (r.error) return fail(r);
      var qs = r.data || [], local = {}; try { local = JSON.parse(localStorage.getItem(key(attempt)) || '{}'); } catch (e) {}
      // carry on from this device's copy, or else from answers saved on the server (e.g. a different device)
      S.db.from('quiz_attempts').select('*').eq('id', attempt).maybeSingle().then(function (a) { var row = a.data || {}; build(Object.keys(local).length ? local : (row.answers || {}), row); }, function () { build(local, {}); });
      function build(saved, row) {
      var secs = qs.length ? qs[0].seconds_left : null, MODE = {};
      app.innerHTML = '<form id="qf" class="grp"><div class="row2 sticky-top"><div><p class="label">' + E(q.title) + '</p><b id="cnt"></b></div>' + '<span class="timer" id="tm" role="timer" aria-live="off"></span></div>' +
        qs.map(function (x, i) {
          var name = 'q-' + x.question_id, opts = x.options || [], v = saved[x.question_id], md = T.parse(x.prompt).mode || (x.kind === 'short' && T.detect ? T.detect(T.text(x.prompt)) : ''), drawn = x.kind === 'short' && /^(graph|draw|annotate)$/.test(md), resp = x.kind === 'short' && /^(audio|video|file)$/.test(md), mt = x.meta || {};
          var secH = x.section && x.section !== (qs[i - 1] || {}).section && !/^(Question|Explore|Test|Explain|Challenge|Reflect)$/.test(x.section) ? '<h3 class="sec-h" style="margin:18px 0 6px">' + E(x.section) + '</h3>' : '';   /* examination sections (Assessment Studio) */   /* a question that asks only for a graph or a drawing gets the tool as its answer, even when no answer style was set */
          MODE[x.question_id] = md;
          if (x.kind === 'info') return secH + '<div class="q panel tint" data-info="' + x.question_id + '">' + T.rich(x.prompt) + (x.image_url ? T.fig(x.image_url, '', 420) : '') + '</div>';   /* a passage, diagram or data shared by the questions after it */
          return secH + '<fieldset class="q" data-id="' + x.question_id + '"><legend>' + ('label' in mt ? (mt.label ? '<b>' + E(mt.label) + '</b> ' : '') : /^\d+\s*(\([a-z]\)|\.\s)/i.test(x.prompt || '') ? '' : '<b>' + (i + 1) + '.</b> ') + T.rich(x.prompt, true) + ' <span class="pill">' + x.marks + ' mark' + (x.marks > 1 ? 's' : '') + '</span></legend>' +
            (x.image_url && md !== 'annotate' ? T.fig(x.image_url, 'Diagram for question ' + (i + 1)) : '') +
            (window.BVQT && BVQT.has(x.kind) ? '<div data-qt="' + x.question_id + '"></div>' : drawn ? '<div data-pad="' + x.question_id + '"></div>' : resp && T.responder ? '<div data-resp="' + x.question_id + '"></div>' :
             x.kind !== 'short' && md === 'dropdown' ? '<select class="qdrop" name="' + name + '"><option value="">Choose an answer…</option>' + opts.map(function (o, j) { return '<option value="' + j + '"' + (String(v) === String(j) ? ' selected' : '') + '>' + 'ABCDEFGH'.charAt(j) + '. ' + E(o) + '</option>'; }).join('') + '</select>' :
             x.kind === 'short' ? '<textarea name="' + name + '" rows="' + (x.marks >= 6 ? 12 : x.marks >= 3 ? 7 : 3) + '" placeholder="Type your answer' + (x.marks >= 3 ? ' (worth ' + x.marks + ' marks: give ' + x.marks + ' clear points)' : '') + '">' + E(T.splitAns ? T.splitAns(v).text : v || '') + '</textarea>' :
              opts.map(function (o, j) { return '<label class="opt"><input type="radio" name="' + name + '" value="' + j + '"' + (String(v) === String(j) ? ' checked' : '') + '> <b>' + 'ABCDEFGH'.charAt(j) + '.</b> ' + (T.opt ? T.opt(o) : E(o)) + '</label>'; }).join('')) + '</fieldset>';
        }).join('') + '<div class="acts"><button class="btn main" type="submit">Submit answers</button><a class="btn" href="' + BACK + '">Save and leave</a></div><p class="msg" id="m" role="alert"></p></form>';
      var f = app.querySelector('#qf'), pads = {}, QT = {};
      qs.forEach(function (x) {   // the ten automatically marked kinds (site_assets/qtypes.js): the answer is kept as a JSON string
        var hq = f.querySelector('[data-qt="' + x.question_id + '"]'); if (!hq) return; var sv = saved[x.question_id];
        QT[x.question_id] = sv == null ? '' : typeof sv === 'string' ? sv : JSON.stringify(sv);
        hq.appendChild(BVQT.student(x.kind, x.options, QT[x.question_id], function (val) { QT[x.question_id] = val; keep(); push(); })); });
      qs.forEach(function (x) {   // every written answer: ⌨️ symbols, ▦ table, 📈 graph and ✏️ drawing tools; a graph or drawing is handed in with the answer
        var ta = f.querySelector('textarea[name="q-' + x.question_id + '"]'); if (!ta || !T.answerTools) return;
        T.answerTools(ta, T.text(x.prompt), { pics: T.splitAns(saved[x.question_id]).pics, onchange: function () { keep(); push(); } }); });
      qs.forEach(function (x) { var h = f.querySelector('[data-pad="' + x.question_id + '"]'); if (h) pads[x.question_id] = T.pad(h, { mode: MODE[x.question_id] || T.parse(x.prompt).mode, x: T.parse(x.prompt).x, y: T.parse(x.prompt).y, image: x.image_url, value: saved[x.question_id], onchange: function () { keep(); push(); } }); });
      var resps = {}; qs.forEach(function (x) { var h = f.querySelector('[data-resp="' + x.question_id + '"]'); if (h) resps[x.question_id] = T.responder(h, { mode: MODE[x.question_id], value: saved[x.question_id], quiz: q.id, onchange: function () { keep(); push(true); } }); });
      function collect() { var g = {}; qs.forEach(function (x) {
        if (resps[x.question_id]) { var rv = resps[x.question_id].get(); if (rv) g[x.question_id] = rv; return; }
        if (QT[x.question_id] != null) { if (QT[x.question_id] !== '') g[x.question_id] = QT[x.question_id]; return; }
        if (pads[x.question_id]) { var d = pads[x.question_id].get(); if (d) g[x.question_id] = d; return; }
        var el = f.querySelector('select[name="q-' + x.question_id + '"]') || f.querySelector('[name="q-' + x.question_id + '"]' + (x.kind === 'short' ? '' : ':checked')); var val = el && x.kind === 'short' && T.answerValue ? T.answerValue(el) : el && el.value; if (el && val !== '') g[x.question_id] = x.kind === 'short' ? val : +val; }); return g; }
      var kt = null; function keep() { clearTimeout(kt); kt = setTimeout(function () { try { localStorage.setItem(key(attempt), JSON.stringify(collect())); } catch (e) {} count(); }, 400); }
      function count() { var c = app.querySelector('#cnt'); if (!c || sent) return; c.textContent = Object.keys(collect()).length + ' of ' + qs.filter(function (x) { return x.kind !== 'info'; }).length + ' answered'; }
      var pt = null, lastSent = null;   // teacher's live view: answers go to the server every few seconds, plus a heartbeat
      function push(now) { clearTimeout(pt); pt = setTimeout(function () { if (sent) return; var g = collect(), js = JSON.stringify(g);
        S.db.rpc('save_quiz_progress', { attempt: attempt, given: js === lastSent ? null : g }).then(function (r) { if (!r.error) lastSent = js; }, function () {}); }, now ? 0 : 3000); }
      clearInterval(beat); beat = setInterval(function () { push(true); }, 30000); push(true);
      f.addEventListener('change', function () { push(); });
      f.addEventListener('input', function () { push(); });
      var lv = f.querySelector('.acts a.btn'); if (lv) lv.addEventListener('click', function () { push(true); });
      f.addEventListener('change', keep);
      f.addEventListener('input', function () { try { localStorage.setItem(key(attempt), JSON.stringify(collect())); } catch (e) {} count(); }); count();
      var sent = false;
      GUARD = watch(q, attempt, f, row, function () { submit(true, 'left'); });
      function submit(auto, why) {
        if (sent) return; var g = collect(), miss = qs.filter(function (x) { return x.kind !== 'info'; }).length - Object.keys(g).length;
        if (!auto && miss && !confirmInline(miss)) return;
        sent = true; clearInterval(timer); clearInterval(beat); clearTimeout(pt); if (TM) { TM.stop(); TM = null; } if (GUARD) GUARD.off(); app.querySelector('#m').className = 'msg'; app.querySelector('#m').textContent = why === 'left' ? 'Handing in because you left the ' + NOUN + ' too many times…' : auto ? 'Time is up. Submitting…' : 'Submitting…';
        S.db.rpc('submit_quiz', { attempt: attempt, given: g }).then(function (res) {
          // AI suggestions for written answers the rules could not mark (hybrid / AI mode only; the server decides and never charges for objective questions)
          if (!res.error && (q.feedback_mode || 'hybrid') !== 'rule' && S.db.functions) { try { S.db.functions.invoke('ai-mark', { body: { attempt: attempt } }).then(function () {}, function () {}).then(function () { return S.db.functions.invoke('result-feedback', { body: { attempt: attempt } }); }).then(function () { return S.db.functions.invoke('analyse', { body: { attempt: attempt } }); }).then(function () {}, function () {}); } catch (e) {} }
          else if (!res.error && S.db.functions) { try { S.db.functions.invoke('result-feedback', { body: { attempt: attempt, mode: 'rule' } }).then(function () {}, function () {}); } catch (e) {} }
          if (res.error) { sent = false; app.querySelector('#m').textContent = S.nice(res.error); return; }
          try { localStorage.removeItem(key(attempt)); } catch (e) {}
          S.db.from('quiz_attempts').select('*').eq('id', attempt).maybeSingle().then(function (a) { review(q, a.data, false, res.data); });
        });
      }
      var warned = false;
      function confirmInline(miss) { if (warned) return true; warned = true; var m = app.querySelector('#m'); m.className = 'msg'; m.textContent = miss + ' question' + (miss > 1 ? 's are' : ' is') + ' not answered. Press Submit again to hand in anyway.'; return false; }
      f.onsubmit = function (e) { e.preventDefault(); submit(false); };
      // The timer starts by itself. Examinations are handed in at zero; exam-style sets only warn, and the extra time is recorded (site_assets/tasktimer.js).
      var tm = app.querySelector('#tm');
      if (window.BVTimer) {
        if (TM) TM.stop();
        TM = BVTimer.start({ db: S.db, kind: 'quiz', ref: q.id, mount: tm, auto: EXAM, attempt: attempt, fallbackSeconds: secs, noun: NOUN, onZero: function () { if (EXAM) submit(true); } });
      } else if (secs != null) {
        var end = Date.now() + secs * 1000;
        var tick = function () { var s = Math.max(0, Math.round((end - Date.now()) / 1000)); tm.textContent = '⏱ ' + Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); tm.classList.toggle('low', s < 60); if (!s && EXAM) submit(true); };
        tick(); timer = setInterval(tick, 1000);
      } else tm.hidden = true;
      }
    });
  }

  function review(q, a, canRetry, res) {
    if (!a) return list();
    var det = a.detail || [], hide = !q.show_results && !a.released;
    Promise.all([S.db.rpc('quiz_paper', { attempt: a.id }), hide ? Promise.resolve({ data: [] }) : S.db.from('attempt_feedback').select('question_id,source,rule,ai,teacher,reviewed').eq('attempt_id', a.id).then(function (f) { return f; }, function () { return { data: [] }; })]).then(function (rr) {
      var r = rr[0], fb = {}; ((rr[1] && rr[1].data) || []).forEach(function (f) { fb[f.question_id] = f; });
      var qs = r.data || [], by = {}; det.forEach(function (d) { by[d.question_id] = d; });
      var pc = S.pct(+a.score, +a.max_score);
      app.innerHTML = '<section class="panel tint"><p class="label">' + E(q.title) + '</p><h2>' + (hide ? 'Submitted ✓' : a.status === 'needs_marking' ? 'Submitted: ' + E(a.score) + ' / ' + E(a.max_score) + ' so far' : 'Your score: ' + E(a.score) + ' / ' + E(a.max_score) + (pc != null ? ' (' + pc + '%)' : '') + (T.levelPill ? T.levelPill(a.score, a.max_score, [q.title, q.topics && q.topics.name].concat((q.quiz_classes || []).map(function (c) { return c.classes ? c.classes.name + ' ' + (c.classes.programme || '') : ''; })).join(' | ')) : '')) + '</h2>' +
        (hide ? '<p>Your answers are saved. Your teacher will check them and release your mark; it will appear here and on your dashboard.</p>' : a.status === 'needs_marking' ? '<p>Your written answers will be marked by your teacher. Your total will update on your dashboard.</p>' : '') +
        '<div class="acts"><a class="btn sm" href="' + BACK + '">All ' + NOUN + 's</a><a class="btn sm" href="/dashboard/">My dashboard</a>' + (canRetry ? '<a class="btn main sm" href="?again=1#' + q.id + '">Try again</a>' : '') + (inSEB() ? '<a class="btn main sm" href="/?seb=quit">Close Safe Exam Browser</a>' : '') + '</div></section>' +
        (hide ? '' : qs.map(function (x, i) { var d = by[x.question_id] || {}, given = (a.answers || {})[x.question_id];
          var ok = d.got != null && +d.got === +d.max, part = d.got != null && +d.got > 0 && !ok;
          if (x.kind === 'info') return '<div class="q panel tint">' + T.rich(x.prompt) + (x.image_url ? T.fig(x.image_url, '', 360) : '') + '</div>';
          var mt = x.meta || {};
          return '<article class="q ' + (d.got == null ? '' : ok ? 'good' : part ? 'part' : 'bad') + '"><div>' + ('label' in mt ? (mt.label ? '<b>' + E(mt.label) + '</b> ' : '') : /^\d+\s*(\([a-z]\)|\.\s)/i.test(x.prompt || '') ? '' : '<b>' + (i + 1) + '.</b> ') + T.rich(x.prompt, true) + ' <span class="pill">' + (d.got == null ? 'to be marked' : E(d.got) + ' / ' + E(d.max)) + '</span></div>' +
            '<p class="small"><b>Your answer:</b> ' + (given == null || given === '' ? '<i>no answer</i>' : T.isPic(given) ? '<br><img class="hw" alt="Your drawing" src="' + E(given) + '" style="max-width:100%;border:1px solid var(--line);border-radius:8px">' : x.kind === 'short' ? (T.answerHtml ? T.answerHtml(given) : E(given)) : window.BVQT && BVQT.has(x.kind) ? E(BVQT.pretty(x.kind, x.options, given)) : 'ABCDEFGH'.charAt(given) + '. ' + E((x.options || [])[given])) + '</p>' +
            (fb[x.question_id] && T.feedback ? T.feedback(fb[x.question_id]) :   // structured feedback (rules, AI or teacher)
              (d.explanation ? '<p class="small fb ai">' + E(d.explanation) + '</p>' : '') + (d.comment ? '<div class="fb tch"><h4>Teacher comment</h4>' + E(d.comment) + '</div>' : '')) + '</article>'; }).join(''));
      window.scrollTo(0, 0);
    });
  }
})();
