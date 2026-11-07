/* Teacher dashboard · BioScience Vista
   Everything here runs with the teacher's own login. Row Level Security decides what each teacher can read or change;
   no service-role key or admin password is ever used in the browser. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME, TOPICS = [], CLASSES = [];
  var TABS = [['overview', 'Overview'], ['approvals', 'Approvals'], ['classes', 'Classes'], ['students', 'Students & results'], ['quizzes', 'Quizzes & exams'], ['lessons', 'Lesson builder'], ['marking', 'Marking'], ['content', 'Content'], ['roles', 'People & roles'], ['activity', 'Activity']];
  var ADMIN_TABS = ['roles', 'activity'];

  S.guard(app, { staff: true }).then(function (me) { ME = me; return Promise.all([refs(), loadScript('/assets/quiz-import.js?v=' + (window.BV_VER || '5'))]); }).then(function () { window.addEventListener('hashchange', route); route(); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function loadScript(src) { return new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = src; x.onload = ok; x.onerror = function () { bad(new Error('Could not load ' + src)); }; document.head.appendChild(x); }); }
  function refs() {
    return Promise.all([S.db.from('topics').select('id,name,code,programme,parent_id,sort_order, subjects(name,sort_order)').order('sort_order'), S.db.from('classes').select('*').order('name')])
      .then(function (x) { TOPICS = x[0].data || []; CLASSES = (x[1].data || []).filter(function (c) { return ME.admin || c.teacher_id === ME.user.id; }); });
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
    var h = location.hash.slice(1).split('/'), tab = h[0] || 'overview';
    if (ADMIN_TABS.indexOf(tab) >= 0 && !ME.admin) tab = 'overview';
    var head = '<div class="row2"><div><p class="label">Teacher dashboard</p><h2>' + E(ME.profile.full_name || ME.user.email) + (ME.admin ? ' <span class="pill">Admin</span>' : '') + '</h2></div><button class="btn sm" type="button" id="so">Log out</button></div>' +
      '<nav class="tabs" aria-label="Teacher sections">' + TABS.filter(function (t) { return ADMIN_TABS.indexOf(t[0]) < 0 || ME.admin; }).map(function (t) { return '<a href="#' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</a>'; }).join('') + '</nav><div id="pane"><p class="muted">Loading…</p></div>';
    app.innerHTML = head; app.querySelector('#so').onclick = S.signOut;
    var pane = app.querySelector('#pane');
    ({ overview: overview, approvals: approvals, activity: activity, lessons: lessons, classes: classes, students: students, quizzes: quizzes, marking: marking, content: content, roles: roles }[tab] || overview)(pane, h.slice(1));
  }

  /* ---------- overview ---------- */
  function overview(p) {
    Promise.all([
      S.db.from('class_overview').select('*'),
      S.db.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('status', 'needs_marking'),
      S.db.from('student_results').select('title,score,max_score,recorded_at,student_id').order('recorded_at', { ascending: false }).limit(12),
      S.db.from('quizzes').select('id', { count: 'exact', head: true }).eq('published', true),
      S.db.from('pending_accounts').select('student_id', { count: 'exact', head: true })
    ]).then(function (x) {
      var nPend = x[4].count || 0;
      var st = (x[0].data || []).filter(function (s) { return s.student_id !== ME.user.id && s.class_id; }), names = {}; st.forEach(function (s) { names[s.student_id] = s.full_name; });
      var pcs = st.filter(function (s) { return s.percent != null; }), avg = pcs.length ? Math.round(pcs.reduce(function (a, s) { return a + +s.percent; }, 0) / pcs.length) : null;
      var waiting = st.filter(function (s) { return !s.approved; }).length;
      p.innerHTML = '<div class="stats"><div class="stat"><span class="small muted">Students</span><b>' + st.length + '</b></div><div class="stat"><span class="small muted">Classes</span><b>' + CLASSES.length + '</b></div>' +
        '<div class="stat"><span class="small muted">Class average</span><b>' + (avg == null ? '–' : avg + '%') + '</b></div><div class="stat"><span class="small muted">Answers to mark</span><b><a href="#marking">' + (x[1].count || 0) + '</a></b></div></div>' +
        (nPend ? '<p class="panel tint"><b>' + nPend + ' new account' + (nPend > 1 ? 's are' : ' is') + ' waiting for approval.</b> <a class="btn main sm" href="#approvals">Review and approve</a></p>' : '') +
        (!CLASSES.length ? '<p class="panel tint">Start by <a href="#classes">creating a class</a>. Each class gets a join code that students type when they register.</p>' : '') +
        '<div class="two"><section class="panel"><h3>Latest results</h3>' + ((x[2].data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Task</th><th>Score</th><th>When</th></tr>' + x[2].data.map(function (r) { return '<tr><td>' + E(names[r.student_id] || '–') + '</td><td>' + E(r.title) + '</td><td>' + (r.score == null ? '–' : E(r.score) + '/' + E(r.max_score)) + '</td><td class="small">' + E(S.when(r.recorded_at)) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted">No results yet.</p>') + '</section>' +
        '<section class="panel"><h3>Quick links</h3><p><a href="#quizzes/new">＋ New quiz</a></p><p><a href="#content">Add lessons, resources and simulations</a></p><p><a href="#classes">Class join codes</a></p><p><a href="/teacher/">Classic teacher console (Google Sheets)</a></p><p class="small muted">' + (x[3].count || 0) + ' published quizzes.</p></section></div>';
    });
  }

  /* ---------- classes ---------- */
  function classes(p) {
    refs().then(function () {
      p.innerHTML = '<form class="panel row2" id="nc"><input id="cn" placeholder="Class name, e.g. Grade 9 Science" required><input id="cp" placeholder="Programme, e.g. MYP 4" style="max-width:180px"><button class="btn main sm" type="submit">Create class</button></form>' +
        (CLASSES.length ? '<div class="tablewrap"><table class="marks"><tr><th>Class</th><th>Programme</th><th>Join code</th><th>Open for joining</th><th></th></tr>' + CLASSES.map(function (c) {
          return '<tr data-id="' + c.id + '"><td><input data-k="name" value="' + E(c.name) + '"></td><td><input data-k="programme" value="' + E(c.programme || '') + '"></td><td><b class="code">' + E(c.join_code) + '</b> <button type="button" class="btn sm" data-a="new">New code</button></td>' +
            '<td><input type="checkbox" data-k="active"' + (c.active ? ' checked' : '') + '></td><td><button type="button" class="btn sm" data-a="save">Save</button></td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No classes yet.</p>') +
        '<p class="small muted">Give students the join code. They type it on the <a href="/register/">registration page</a>. Untick "Open for joining" to stop new sign-ups; make a new code if a code was shared too widely.</p>';
      p.querySelector('#nc').onsubmit = function (e) { e.preventDefault();
        S.db.from('classes').insert({ name: p.querySelector('#cn').value.trim(), programme: p.querySelector('#cp').value.trim() || null, teacher_id: ME.user.id, join_code: code6() }).then(function (r) { if (ok(r, 'Class created')) classes(p); }); };
      p.querySelectorAll('tr[data-id]').forEach(function (tr) { var id = tr.getAttribute('data-id');
        tr.querySelector('[data-a=save]').onclick = function () { S.db.from('classes').update({ name: tr.querySelector('[data-k=name]').value.trim(), programme: tr.querySelector('[data-k=programme]').value.trim() || null, active: tr.querySelector('[data-k=active]').checked }).eq('id', id).then(function (r) { ok(r, 'Saved'); }); };
        tr.querySelector('[data-a=new]').onclick = function () { S.db.from('classes').update({ join_code: code6() }).eq('id', id).then(function (r) { if (ok(r, 'New code made')) classes(p); }); };
      });
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
        '<section class="grp"><h3 class="sec-h">Results and feedback</h3>' + ((x[1].data || []).length ? x[1].data.map(function (r) {
          return '<article class="task" data-r="' + r.id + '"><div class="top2"><b>' + E(r.title) + '</b><span class="small muted">' + E(S.when(r.recorded_at)) + '</span></div>' +
            '<div class="row2"><label class="f">Score<input type="number" step="0.5" data-k="score" value="' + E(r.score == null ? '' : r.score) + '" style="max-width:90px"></label><span>/ ' + E(r.max_score) + '</span></div>' +
            '<label class="f">Teacher feedback<textarea rows="3" data-k="teacher_feedback">' + E(r.teacher_feedback || '') + '</textarea></label>' + (r.ai_feedback ? '<div class="fb ai"><h4>AI feedback</h4>' + BV.md(r.ai_feedback) + '</div>' : '') +
            '<div class="acts"><button class="btn sm main" type="button" data-a="save">Save feedback</button>' + (r.attempt_id ? '<a class="btn sm" href="#marking/' + r.attempt_id + '">Open answers</a>' : '') + '</div></article>'; }).join('') : '<p class="emptybox">No results yet.</p>') + '</section>';
      p.querySelector('#ss').onclick = function () { S.db.from('profiles').update({ full_name: p.querySelector('#sn').value.trim(), class_id: p.querySelector('#sc').value || null, student_number: p.querySelector('#snum').value.trim() || null }).eq('id', sid).then(function (r) { ok(r, 'Student saved'); }); };
      p.querySelectorAll('[data-r]').forEach(function (a) { a.querySelector('[data-a=save]').onclick = function () { var sc = a.querySelector('[data-k=score]').value;
        S.db.from('student_results').update({ score: sc === '' ? null : +sc, teacher_feedback: a.querySelector('[data-k=teacher_feedback]').value.trim() || null, updated_at: new Date().toISOString() }).eq('id', a.getAttribute('data-r')).then(function (r) { ok(r, 'Feedback saved'); }); }; });
    });
  }

  /* ---------- quizzes ---------- */
  function quizzes(p, args) {
    if (args[0] === 'import') return quizImport(p);
    if (args[0]) return quizEdit(p, args[0]);
    S.db.from('quizzes').select('id,title,published,due_at,show_results,category, quiz_classes(class_id), quiz_questions(question_id)').neq('category', 'lesson').order('created_at', { ascending: false }).then(function (r) {
      var cn = {}; CLASSES.forEach(function (c) { cn[c.id] = c.name; });
      p.innerHTML = '<div class="acts"><a class="btn main sm" href="#quizzes/import">⬆ Import from PDF or Word</a><a class="btn sm" href="#quizzes/new">＋ New quiz or exam</a></div>' +
        ((r.data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Title</th><th>Type</th><th>Questions</th><th>Classes</th><th>Due</th><th>Results</th><th>Status</th></tr>' + r.data.map(function (q) {
          return '<tr><td><a href="#quizzes/' + q.id + '">' + E(q.title) + '</a></td><td>' + (q.category === 'exam' ? '🧪 Exam' : '📝 Quiz') + '</td><td>' + q.quiz_questions.length + '</td><td class="small">' + E(q.quiz_classes.map(function (c) { return cn[c.class_id] || '…'; }).join(', ') || '–') + '</td><td class="small">' + E(S.when(q.due_at) || '–') + '</td><td class="small">' + (q.show_results ? 'shown at once' : 'after you release') + '</td><td>' + (q.published ? '<span class="pill">Published</span>' : 'Draft') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No quizzes yet. Import a question paper or make one from scratch.</p>');
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
        msg.className = 'msg ok'; msg.textContent = 'Found ' + list.length + ' questions (' + mc + ' multiple choice, ' + (list.length - mc) + ' written)' + (x[1] ? '; mark scheme matched ' + matched + ' of them' : '') + '. Check them below, then save.';
        draw();
      }).catch(function (e) { msg.className = 'msg'; msg.textContent = S.nice(e); });
    };
    function sync() { list = [].map.call(out.querySelectorAll('.qe'), Q.readCard); }
    function draw() {
      var need = list.filter(function (q) { return q.kind !== 'short' && q.correct < 0; }).length, noScheme = list.filter(function (q) { return q.kind === 'short' && !q.scheme && !q.rubric; }).length;
      out.innerHTML = '<div class="row2 sticky-top"><b>' + list.length + ' questions · ' + list.reduce(function (a, q) { return a + q.marks; }, 0) + ' marks</b><div class="acts"><button class="btn sm" type="button" id="iadd">＋ Add a question</button><button class="btn main sm" type="button" id="isave">Save as a draft quiz</button></div></div>' +
        (need ? '<p class="panel tint small">⚠ ' + need + ' multiple-choice question' + (need > 1 ? 's need' : ' needs') + ' the correct option marked with *.</p>' : '') +
        (noScheme ? '<p class="panel tint small">' + noScheme + ' written question' + (noScheme > 1 ? 's have' : ' has') + ' no mark scheme yet. Add marking points or a rubric for automatic marking, or leave blank and mark by hand.</p>' : '') +
        list.map(function (q, i) { return Q.card(q, i, { join: i > 0 }); }).join('');
      out.querySelectorAll('.qe').forEach(function (el) {
        Q.wireCard(el);
        el.querySelector('[data-act=del]').onclick = function () { sync(); list.splice(+el.dataset.i, 1); draw(); };
        var j = el.querySelector('[data-act=join]'); if (j) j.onclick = function () { sync(); var i = +el.dataset.i, a = list[i - 1], b = list[i]; a.prompt += '\n' + b.prompt; if (b.options.length) { a.options = a.options.concat(b.options); a.kind = a.kind === 'short' ? 'mcq' : a.kind; } a.scheme = [a.scheme, b.scheme].filter(Boolean).join('\n'); list.splice(i, 1); draw(); };
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
      var qs = qq.map(function (z, k) { var o = z.questions || {}, an = o.question_answers || {}; if (Array.isArray(an)) an = an[0] || {};
        return { id: o.id, ref: '', kind: o.kind, prompt: o.prompt, options: o.options || [], correct: an.correct_option == null ? -1 : an.correct_option, marks: o.marks, scheme: an.mark_scheme || an.model_answer || '', rubric: an.rubric || '', explanation: an.explanation || '', image: o.image_url || '' }; });
      p.innerHTML = '<p><a href="#quizzes">← All quizzes and exams</a></p><form class="panel grp" id="qf"><h3>' + (isNew ? 'New quiz or exam' : 'Settings') + '</h3>' +
        '<div class="row2"><label class="f" style="flex:1">Title<input id="t" required value="' + E(q.title) + '"></label><label class="f">Type<select id="cat"><option value="quiz"' + (q.category !== 'exam' ? ' selected' : '') + '>Quiz (Quiz centre)</option><option value="exam"' + (q.category === 'exam' ? ' selected' : '') + '>Exam (Online exams page)</option></select></label></div><label class="f">Instructions<textarea id="ins" rows="2">' + E(q.instructions || '') + '</textarea></label>' +
        '<div class="row2"><label class="f">Topic<select id="tp">' + topicOpts(q.topic_id) + '</select></label><label class="f">Time limit (minutes, blank = none)<input id="tl" type="number" min="1" value="' + E(q.time_limit_minutes || '') + '"></label><label class="f">Attempts<input id="ma" type="number" min="1" value="' + E(q.max_attempts || 1) + '"></label></div>' +
        '<div class="row2"><label class="f">Opens<input id="op" type="datetime-local" value="' + dt(q.opens_at) + '"></label><label class="f">Due<input id="du" type="datetime-local" value="' + dt(q.due_at) + '"></label></div>' +
        '<fieldset><legend>Set for classes</legend>' + (CLASSES.length ? CLASSES.map(function (c) { return '<label class="chk"><input type="checkbox" name="cl" value="' + c.id + '"' + (set.indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + E(c.name) + '</label>'; }).join('') : '<p class="small">Create a class first.</p>') + '</fieldset>' +
        '<fieldset><legend>Results</legend><label class="chk"><input type="radio" name="sr" value="hold"' + (q.show_results ? '' : ' checked') + '> I check and release results (recommended for written answers)</label>' +
        '<label class="chk"><input type="radio" name="sr" value="show"' + (q.show_results ? ' checked' : '') + '> Show multiple-choice scores straight after submitting</label></fieldset>' +
        '<label class="chk"><input type="checkbox" id="pb"' + (q.published ? ' checked' : '') + '> Published (students in the chosen classes can see it)</label>' +
        '<div class="acts"><button class="btn main sm" type="submit">Save quiz</button>' + (isNew ? '' : '<a class="btn sm" href="#marking">Marking</a><button class="btn sm" type="button" id="del">Delete quiz</button>') + '</div></form>' +
        (isNew ? '<p class="small muted">Save the quiz first, then add questions.</p>' : '<section class="grp"><div class="row2"><h3 class="sec-h">Questions (' + qs.length + ', ' + qs.reduce(function (a, z) { return a + (z.marks || 0); }, 0) + ' marks)</h3><button class="btn main sm" type="button" id="qsave">Save question changes</button></div>' +
          '<div id="qlist" class="grp">' + qs.map(function (z, i) { return Q.card(z, i, { delLabel: 'Remove' }); }).join('') + '</div>' +
          '<div class="acts"><button class="btn sm" type="button" id="qadd">＋ Add a question</button></div></section>');
      p.querySelector('#qf').onsubmit = function (e) { e.preventDefault();
        var row = { title: p.querySelector('#t').value.trim(), category: p.querySelector('#cat').value, instructions: p.querySelector('#ins').value.trim() || null, topic_id: p.querySelector('#tp').value || null, time_limit_minutes: +p.querySelector('#tl').value || null,
          max_attempts: Math.max(1, +p.querySelector('#ma').value || 1), opens_at: iso(p.querySelector('#op').value), due_at: iso(p.querySelector('#du').value), show_results: (p.querySelector('[name=sr]:checked') || {}).value === 'show', published: p.querySelector('#pb').checked };
        var cls = [].map.call(p.querySelectorAll('[name=cl]:checked'), function (c) { return c.value; });
        if (row.published && !cls.length) { toast('Choose at least one class before publishing.', true); return; }
        if (row.published && !isNew && !qs.length) { toast('Add questions before publishing.', true); return; }
        (isNew ? S.db.from('quizzes').insert(row).select('id').single() : S.db.from('quizzes').update(row).eq('id', id).select('id').single()).then(function (r) {
          if (!ok(r)) return; var qid = r.data.id;
          S.db.from('quiz_classes').delete().eq('quiz_id', qid).then(function () { return cls.length ? S.db.from('quiz_classes').insert(cls.map(function (c) { return { quiz_id: qid, class_id: c }; })) : { error: null }; })
            .then(function (r2) { if (ok(r2, 'Quiz saved')) { if (isNew) location.hash = 'quizzes/' + qid; else quizEdit(p, qid); } });
        }); };
      var del = p.querySelector('#del'); if (del) del.onclick = function () { if (del.dataset.sure) { S.db.from('quizzes').delete().eq('id', id).then(function (r) { if (ok(r, 'Quiz deleted')) location.hash = 'quizzes'; }); } else { del.dataset.sure = 1; del.textContent = 'Click again to delete (attempts are deleted too)'; } };
      if (isNew) return;
      var listEl = p.querySelector('#qlist'), removed = [];
      function wire(el) { Q.wireCard(el); el.querySelector('[data-act=del]').onclick = function () { if (el.dataset.id) removed.push(el.dataset.id); el.remove(); }; }
      listEl.querySelectorAll('.qe').forEach(wire);
      p.querySelector('#qadd').onclick = function () { var d = document.createElement('div'); d.innerHTML = Q.card({ kind: 'mcq', prompt: '', options: [], correct: -1, marks: 1 }, listEl.children.length); var el = d.firstChild; listEl.appendChild(el); wire(el); el.querySelector('[data-f=prompt]').focus(); };
      p.querySelector('#qsave').onclick = function () {
        var cards = [].map.call(listEl.querySelectorAll('.qe'), Q.readCard), bad = cards.map(Q.check).filter(Boolean)[0]; if (bad) { toast(bad, true); return; }
        var btn = this; btn.disabled = true;
        Q.save(S.db, cards).then(function (ids) {
          return S.db.from('quiz_questions').delete().eq('quiz_id', id).then(function () { return S.db.from('quiz_questions').insert(ids.map(function (qid, k) { return { quiz_id: id, question_id: qid, position: k + 1 }; })); });
        }).then(function (r) { if (r.error) throw r.error; toast('Questions saved'); quizEdit(p, id); }).catch(function (e) { btn.disabled = false; toast(S.nice(e), true); });
      };
    });
  }

  /* ---------- marking: automatic suggestions, teacher confirms and releases ---------- */
  function num(prompt, i) { return /^\d+\s*\([a-z]\)/i.test(prompt || '') ? '' : '<b>' + (i + 1) + '.</b> '; }
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
          ready.reduce(function (pr, a) { return pr.then(function () { return S.db.rpc('release_attempt', { attempt: a.id }); }); }, Promise.resolve()).then(function () { toast(ready.length + ' result' + (ready.length === 1 ? '' : 's') + ' released to students'); marking(p, []); }); };
      });
    });
  }
  function markOne(p, aid) {
    var Q = window.BVQ;
    S.db.from('quiz_attempts').select('*, quizzes(title,show_results)').eq('id', aid).maybeSingle().then(function (r) {
      var a = r.data; if (!a) { p.innerHTML = '<p class="msg">Attempt not found.</p>'; return; }
      Promise.all([loadQuiz(a.quiz_id), S.db.from('profiles').select('full_name').eq('id', a.student_id).maybeSingle()]).then(function (x) {
        var qs = x[0], by = {}; (a.detail || []).forEach(function (d) { by[d.question_id] = d; });
        var held = a.quizzes && !a.quizzes.show_results;
        p.innerHTML = '<p><a href="#marking">← Marking list</a></p><section class="panel row2"><div><h3>' + E(x[1].data ? x[1].data.full_name : '') + ' · ' + E(a.quizzes ? a.quizzes.title : '') + '</h3><p class="small muted">Submitted ' + E(S.when(a.submitted_at)) + '</p></div>' +
          '<div><b style="font-size:1.6rem" id="tot">' + E(a.score) + '</b> / ' + E(a.max_score) + ' <span class="pill">' + (a.released ? 'released' : held ? 'not released yet' : 'student sees MCQ score') + '</span></div></section>' +
          qs.filter(function (q) { return q.kind !== 'info'; }).map(function (q, i) { var d = by[q.id] || {}, g = (a.answers || {})[q.id], an = q.ans || {}, written = q.kind === 'short';
            var pic = /^data:image\//.test(g || ''), sug = written ? (pic ? { got: null, hits: [] } : Q.suggest(g || '', an.mark_scheme || an.model_answer || '', q.marks)) : null, pts = written ? Q.points(an.mark_scheme || an.model_answer || '') : [], lv = written ? Q.levels(an.rubric) : [];
            var val = d.got != null ? d.got : sug && sug.got != null ? sug.got : '';
            return '<article class="q ' + (d.got == null ? '' : +d.got === +d.max ? 'good' : +d.got > 0 ? 'part' : 'bad') + '" data-q="' + q.id + '"><p>' + num(q.prompt, i) + E(q.prompt) + ' <span class="pill">' + (q.marks ? q.marks + ' mark' + (q.marks > 1 ? 's' : '') : 'not graded') + '</span></p>' +
              '<div class="fb"><h4>Student answer</h4>' + (g == null || g === '' ? '<i>no answer</i>' : pic ? '<img class="hw" alt="Handwritten answer" src="' + E(g) + '">' : written ? '<p style="white-space:pre-wrap">' + E(g) + '</p>' : E((q.options || [])[g]) + (g === an.correct_option ? ' ✓' : ' ✗ (correct: ' + E((q.options || [])[an.correct_option]) + ')')) + '</div>' +
              (pts.length ? '<div class="small"><b>Mark scheme</b>' + pts.map(function (t, k) { return '<div>' + (pic ? '• ' : sug.hits[k] ? '<span class="ok-t">✓</span> ' : '<span class="bad-t">✗</span> ') + E(t) + '</div>'; }).join('') + (d.got == null && sug.got != null ? '<p class="muted">Suggested: ' + sug.got + ' / ' + q.marks + ' (check it)</p>' : '') + '</div>' : '') +
              (lv.length ? '<div class="small"><b>Rubric</b> (click a level)' + lv.map(function (l) { return '<div><button type="button" class="btn sm" data-lv="' + l.hi + '">' + (l.lo === l.hi ? l.lo : l.lo + '–' + l.hi) + '</button> ' + E(l.text) + '</div>'; }).join('') + '</div>' : '') +
              '<div class="row2"><label class="f">Marks<input type="number" min="0" max="' + q.marks + '" step="0.5" data-k="m" value="' + E(val) + '" style="max-width:90px"></label><label class="f" style="flex:1">Comment for the student<input data-k="c" value="' + E(d.comment || '') + '"></label></div></article>'; }).join('') +
          '<div class="acts panel"><button class="btn sm" type="button" id="savem">Save marks</button><button class="btn main sm" type="button" id="rel">✓ Confirm grade and release to student</button></div>';
        p.querySelectorAll('[data-lv]').forEach(function (b) { b.onclick = function () { b.closest('[data-q]').querySelector('[data-k=m]').value = b.getAttribute('data-lv'); }; });
        function saveAll() {
          var jobs = [].map.call(p.querySelectorAll('[data-q]'), function (art) { var m = art.querySelector('[data-k=m]').value, d = by[art.getAttribute('data-q')] || {}, c = art.querySelector('[data-k=c]').value.trim();
            if (m === '' || (+m === +d.got && c === (d.comment || ''))) return null; return { attempt: aid, qid: art.getAttribute('data-q'), marks_given: +m, comment: c || null }; }).filter(Boolean);
          return jobs.reduce(function (pr, j) { return pr.then(function () { return S.db.rpc('mark_answer', j).then(function (res) { if (res.error) throw res.error; p.querySelector('#tot').textContent = res.data; }); }); }, Promise.resolve());
        }
        p.querySelector('#savem').onclick = function () { saveAll().then(function () { toast('Marks saved'); markOne(p, aid); }, function (e) { toast(S.nice(e), true); }); };
        p.querySelector('#rel').onclick = function () {
          var empty = [].filter.call(p.querySelectorAll('[data-k=m]'), function (i) { return i.value === ''; }).length; if (empty) { toast('Give a mark for every question first (' + empty + ' empty).', true); return; }
          saveAll().then(function () { return S.db.rpc('release_attempt', { attempt: aid }); }).then(function (res) { if (res.error) throw res.error; toast('Released: the student can now see ' + res.data + ' / ' + a.max_score); location.hash = 'marking'; })
            .catch(function (e) { toast(S.nice(e), true); });
        };
      });
    });
  }

  /* ---------- lesson builder: objectives or a file → interactive six-step lesson ---------- */
  function lessons(p, args) {
    if (args[0]) return lessonEdit(p, args[0]);
    S.db.from('quizzes').select('id,title,published,created_at, quiz_classes(class_id), quiz_questions(question_id)').eq('category', 'lesson').order('created_at', { ascending: false }).then(function (r) {
      var cn = {}; CLASSES.forEach(function (c) { cn[c.id] = c.name; });
      p.innerHTML = '<div class="acts"><a class="btn main sm" href="#lessons/new">✨ Create an interactive lesson</a></div>' +
        '<p class="small muted">Type your lesson objectives, upload a worksheet or notes (PDF or Word), or both. The site turns them into a six-step inquiry lesson (question, explore, test, explain, challenge, reflect) where students type or handwrite their answers. You can change everything before publishing.</p>' +
        ((r.data || []).length ? '<div class="tablewrap"><table class="marks"><tr><th>Lesson</th><th>Items</th><th>Classes</th><th>Status</th><th></th></tr>' + r.data.map(function (q) {
          return '<tr><td><a href="#lessons/' + q.id + '">' + E(q.title) + '</a></td><td>' + q.quiz_questions.length + '</td><td class="small">' + E(q.quiz_classes.map(function (c) { return cn[c.class_id] || '…'; }).join(', ') || '–') + '</td><td>' + (q.published ? '<span class="pill">Published</span>' : 'Draft') + '</td>' +
            '<td><a class="small" href="/lesson/#' + q.id + '" target="_blank" rel="noopener">Preview ↗</a></td></tr>'; }).join('') + '</table></div>' : '<p class="emptybox">No interactive lessons yet.</p>');
    });
  }
  function lessonEdit(p, id) {
    var Q = window.BVQ, isNew = id === 'new';
    if (isNew) {
      p.innerHTML = '<p><a href="#lessons">← All lessons</a></p><section class="panel grp"><h3>Create an interactive lesson</h3>' +
        '<label class="f">Lesson title<input id="lt" placeholder="e.g. Osmosis in plant cells"></label>' +
        '<label class="f">Lesson objectives, one per line<textarea id="lo" rows="4" placeholder="Define osmosis\nExplain why plant cells become turgid in water\nCompare osmosis and diffusion"></textarea></label>' +
        '<div class="two"><label class="f">Worksheet, notes or lesson plan (optional, PDF or .docx)<input id="lf" type="file" accept=".pdf,.docx,.txt"></label>' +
        '<label class="f">Mark scheme (optional, PDF or .docx)<input id="lm" type="file" accept=".pdf,.docx,.txt"></label></div>' +
        '<p class="small muted">With objectives only, you get a complete lesson outline with questions for each objective; add your notes, pictures and video links in the Explore step. With a file, its text becomes the reading and its questions become interactive.</p>' +
        '<div class="acts"><button class="btn main sm" type="button" id="lb">Build the lesson</button></div><p class="msg" id="lmsg" role="status"></p></section>';
      p.querySelector('#lf').onchange = function () { var f = this.files[0]; if (f && !p.querySelector('#lt').value) p.querySelector('#lt').value = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '); };
      p.querySelector('#lb').onclick = function () {
        var title = p.querySelector('#lt').value.trim(), obj = p.querySelector('#lo').value.trim(), f = p.querySelector('#lf').files[0], m = p.querySelector('#lm').files[0], msg = p.querySelector('#lmsg');
        if (!obj && !f) { msg.className = 'msg'; msg.textContent = 'Type at least one objective or choose a file.'; return; }
        if (!title) { msg.className = 'msg'; msg.textContent = 'Give the lesson a title.'; return; }
        msg.className = 'msg ok'; msg.textContent = 'Building…';
        Promise.all([f ? Q.readFile(f) : null, m ? Q.readFile(m) : null]).then(function (x) {
          var items = Q.buildLesson(title, obj, x[0], x[1]);
          editor({ title: title, instructions: obj, published: false }, items, []);
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
})();
