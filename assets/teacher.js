/* Teacher console · BioScience Vista · by George Apidi */
(function () {
  var app = document.getElementById('app'), E = BV.esc, D = null, tab = 'marks', cur = 0, showCodes = false;
  var key = function () { return BV.store('bv-tk'); };
  var T = function (action, data) { return BV.api(action, Object.assign({ key: key() }, data || {})); };
  var PAGES = [['home', 'Home: announcements'], ['myp', 'MYP Science'], ['ib', 'IB Diploma Biology'], ['a-level', 'AS & A Level'], ['igcse', 'IGCSE'], ['chemistry', 'Chemistry'], ['simulations', 'Simulations']];

  function login(msg) {
    app.innerHTML = '<form class="form narrow" id="tf"><h2>Teacher sign in</h2><label class="f">Teacher key<input id="tk" type="password" autocomplete="current-password" required></label><button class="btn main" type="submit">Open</button><p class="msg" id="tm">' + E(msg || '') + '</p></form>';
    app.querySelector('#tf').onsubmit = function (e) { e.preventDefault(); BV.store('bv-tk', app.querySelector('#tk').value.trim()); load(); };
  }
  function load() {
    if (!key()) return login();
    app.innerHTML = '<p class="muted">Loading…</p>';
    T('teacher').then(function (d) { if (!d.ok) { BV.store('bv-tk', null); return login(d.error); } D = d; draw(); });
  }
  var TABS = [['marks', 'Marks & feedback'], ['students', 'Students'], ['messages', 'Messages'], ['questions', 'Questions'], ['exams', 'Exams'], ['forum', 'Forum'], ['site', 'Edit site'], ['settings', 'Settings']];
  function draw() {
    app.innerHTML = '<div class="row2"><div><p class="label">Teacher console</p><h2>Welcome, ' + E(D.teacherName) + '</h2></div><div class="cta"><button class="btn sm" id="rf" type="button">Refresh</button><button class="btn sm" id="out" type="button">Sign out</button></div></div>' +
      '<div class="tabs" role="tablist">' + TABS.map(function (t) { return '<button role="tab" aria-selected="' + (tab === t[0]) + '" data-t="' + t[0] + '">' + t[1] + (t[0] === 'questions' && D.newQuestions ? '<span class="n">' + D.newQuestions + '</span>' : '') + '</button>'; }).join('') + '</div><div id="pane" class="grp"></div>';
    app.querySelector('#rf').onclick = load; app.querySelector('#out').onclick = function () { BV.store('bv-tk', null); location.reload(); };
    app.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-t'); draw(); }; });
    ({ marks: marks, students: students, messages: messages, questions: questions, exams: exams, forum: forum, site: site, settings: settings })[tab](app.querySelector('#pane'));
  }
  function drawer(html) { var d = document.createElement('div'); d.className = 'drawer'; d.innerHTML = '<div role="dialog" aria-modal="true"><div class="row2"><span></span><button class="btn sm" type="button" data-x>Close</button></div>' + html + '</div>';
    d.addEventListener('click', function (e) { if (e.target === d || e.target.hasAttribute('data-x')) d.remove(); }); document.body.appendChild(d); return d.firstChild; }
  function clsTabs(onpick) { return '<div class="tabs">' + D.classes.map(function (c, i) { return '<button type="button" aria-selected="' + (i === cur) + '" data-c="' + i + '">' + E(c.cls) + ' (' + c.rows.length + ')</button>'; }).join('') + '</div>'; }
  function bindCls(p, fn) { p.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { cur = +b.getAttribute('data-c'); fn(p); }; }); }

  /* ---- marks ---- */
  function marks(p) {
    var C = D.classes[cur], h = clsTabs();
    if (!C.rows.length) { p.innerHTML = h + '<p class="emptybox">No students in ' + E(C.cls) + ' yet. Add them in the Students tab.</p>'; return bindCls(p, marks); }
    var done = 0, cells = 0, tot = 0, tmax = 0; C.rows.forEach(function (r) { r.marks.forEach(function (s, i) { cells++; if (s != null) { done++; tot += s; tmax += C.tasks[i].max; } }); });
    h += '<div class="stats"><div class="stat"><span class="small muted">Students</span><b>' + C.rows.length + '</b></div><div class="stat"><span class="small muted">Tasks set</span><b>' + C.tasks.length + '</b></div><div class="stat"><span class="small muted">Work completed</span><b>' + (cells ? Math.round(100 * done / cells) : 0) + '%</b></div><div class="stat"><span class="small muted">Average score</span><b>' + (tmax ? Math.round(100 * tot / tmax) + '%' : '–') + '</b></div></div>';
    h += '<div class="row2"><p class="small muted">Click a mark to see the student\'s answers, generate AI feedback and write your own feedback. ✎ = feedback given.</p><div class="cta"><button class="btn sm" type="button" id="codes">' + (showCodes ? 'Hide' : 'Show') + ' codes</button><button class="btn sm" type="button" id="csv">Download CSV</button></div></div>';
    h += '<div class="tablewrap"><table class="marks"><thead><tr><th>Student</th>' + (showCodes ? '<th>Code</th>' : '') + C.tasks.map(function (t) { return '<th title="' + E(t.id) + '">' + E(BV.title(t.id)) + '<br>/ ' + t.max + '</th>'; }).join('') + '<th>Overall</th></tr></thead><tbody>' +
      C.rows.map(function (r, ri) { var g = 0, mx = 0; r.marks.forEach(function (s, i) { if (s != null) { g += s; mx += C.tasks[i].max; } });
        return '<tr><td>' + E(r.name) + '</td>' + (showCodes ? '<td>' + E(r.code || '–') + '</td>' : '') + r.marks.map(function (s, i) { var t = C.tasks[i], fb = (r.feedback || []).indexOf(t.id) >= 0 ? ' ✎' : '';
          if (s == null) return '<td class="nd">Not done</td>'; var q = s / t.max; return '<td class="' + (q >= .7 ? 'hi' : q >= .5 ? 'mid' : 'lo') + '"><button type="button" data-r="' + ri + '" data-i="' + i + '">' + s + fb + '</button></td>'; }).join('') +
          '<td><b>' + (mx ? Math.round(100 * g / mx) + '%' : '–') + '</b></td></tr>'; }).join('') + '</tbody><tfoot><tr><td>Class average</td>' + (showCodes ? '<td></td>' : '') +
      C.tasks.map(function (t, i) { var a = C.rows.map(function (r) { return r.marks[i]; }).filter(function (x) { return x != null; }); return '<td>' + (a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length * 10) / 10 : '–') + '<br><span class="small muted">' + a.length + '/' + C.rows.length + ' done</span></td>'; }).join('') + '<td></td></tr></tfoot></table></div>';
    if (C.unmatched && C.unmatched.length) h += '<section class="panel"><h3>Names not on the class list</h3><p class="small muted">These names submitted work but don\'t match a student. Link them in the Students tab.</p><p>' + C.unmatched.map(function (u) { return E(u.name); }).join(', ') + '</p></section>';
    p.innerHTML = h; bindCls(p, marks);
    p.querySelector('#codes').onclick = function () { showCodes = !showCodes; marks(p); };
    p.querySelector('#csv').onclick = function () { var L = [['Student', 'Code'].concat(C.tasks.map(function (t) { return BV.title(t.id) + ' (/' + t.max + ')'; }))]; C.rows.forEach(function (r) { L.push([r.name, r.code || ''].concat(r.marks.map(function (s) { return s == null ? 'Not done' : s; }))); });
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([L.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' })); a.download = C.cls.replace(/\s+/g, '-') + '-marks.csv'; a.click(); };
    p.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { feedback(C, C.rows[+b.getAttribute('data-r')], C.tasks[+b.getAttribute('data-i')], +b.getAttribute('data-i')); }; });
  }
  function feedback(C, r, t, i) {
    var dv = drawer('<p class="label">' + E(C.cls) + '</p><h2>' + E(r.name) + '</h2><p><b>' + E(BV.title(t.id)) + '</b> · ' + r.marks[i] + ' / ' + t.max + '</p><div id="ans" class="grp"><p class="muted">Loading answers…</p></div>' +
      '<div class="fb ai" id="aib"><h4>AI feedback</h4><div id="aitext" class="muted small">None yet.</div><div class="acts"><button type="button" id="gen"' + (D.settings.aiOn ? '' : ' disabled title="Add your Claude key in Settings"') + '>Generate with AI</button></div></div>' +
      '<label class="f">Your feedback to ' + E(r.name.split(' ')[0]) + '<textarea id="tfb" placeholder="Write feedback the student will see on My learning"></textarea></label><div class="cta"><button class="btn main" type="button" id="sv">Save feedback</button><button class="btn" type="button" id="useai">Use AI text as my feedback</button></div><p class="msg" id="fm"></p>');
    T('answers', { name: r.name, cls: C.cls, aliases: r.aliases || [], task: t.id }).then(function (x) {
      dv.querySelector('#ans').innerHTML = x.ok && x.answers.length ? x.answers.map(function (a) { return '<div class="item"><span class="meta">' + E(a.when) + (a.step ? ' · step ' + E(a.step) : '') + '</span><div class="small" style="white-space:pre-wrap">' + E(a.answers).replace(/ ‖ /g, '\n') + '</div></div>'; }).join('') : '<p class="muted">No answer text found.</p>';
    });
    dv.querySelector('#gen').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Thinking…';
      T('aiFeedbackFor', { name: r.name, cls: C.cls, task: t.id, title: BV.title(t.id) }).then(function (x) { b.disabled = false; b.textContent = 'Regenerate'; if (!x.ok) return BV.toast(x.error); dv.querySelector('#aitext').innerHTML = BV.md(x.feedback); dv.querySelector('#aitext').dataset.raw = x.feedback; }); };
    dv.querySelector('#useai').onclick = function () { var raw = dv.querySelector('#aitext').dataset.raw; if (raw) dv.querySelector('#tfb').value = raw; };
    dv.querySelector('#sv').onclick = function () { var m = dv.querySelector('#fm'); m.className = 'msg'; m.textContent = 'Saving…';
      T('saveFeedback', { name: r.name, cls: C.cls, task: t.id, text: dv.querySelector('#tfb').value }).then(function (x) { if (!x.ok) { m.textContent = x.error; return; } m.className = 'msg ok'; m.textContent = 'Saved. ' + r.name.split(' ')[0] + ' will see it on My learning.'; r.feedback = (r.feedback || []).concat(t.id); }); };
  }

  /* ---- students ---- */
  function students(p) {
    var C = D.classes[cur];
    var h = clsTabs() + '<form class="form" id="addf"><h3>Add a student to ' + E(C.cls) + '</h3><div class="two"><label class="f">Full name (as they type it)<input id="an" required></label><label class="f">Email (optional)<input id="ae" type="email"></label></div><button class="btn main" type="submit">Add student</button><p class="msg" id="am"></p></form>';
    h += '<div class="tablewrap"><table class="marks"><thead><tr><th>Name</th><th>Code</th><th>Email</th><th>Also typed as</th><th>Actions</th></tr></thead><tbody>' + C.rows.map(function (r, i) {
      return '<tr><td>' + E(r.name) + '</td><td>' + E(r.code) + '</td><td>' + E(r.email || '–') + '</td><td class="small">' + E((r.aliases || []).join(', ') || '–') + '</td><td><div class="acts" style="justify-content:center;margin:0"><button type="button" data-e="' + i + '">Edit</button><button type="button" data-n="' + i + '">New code</button><button type="button" data-d="' + i + '">Remove</button></div></td></tr>'; }).join('') + '</tbody></table></div>';
    if (C.unmatched && C.unmatched.length) h += '<section class="panel"><h3>Submitted under another name</h3>' + C.unmatched.map(function (u, i) { return '<div class="row2"><span>' + E(u.name) + '</span><div class="acts"><select data-ls="' + i + '"><option value="">Link to student…</option>' + C.rows.map(function (r) { return '<option value="' + r.row + '">' + E(r.name) + '</option>'; }).join('') + '</select><button type="button" data-ln="' + i + '">Link</button><button type="button" data-an="' + i + '">Add as new student</button></div></div>'; }).join('') + '</section>';
    h += '<div class="two"><form class="form" id="clf"><h3>Add a class</h3><label class="f">Class name<input id="cn" placeholder="e.g. Grade 7 or MYP 2" required></label><button class="btn" type="submit">Add class</button><p class="msg" id="cm"></p></form>' +
      '<form class="form" id="arf"><h3>Moving school or new year</h3><p class="small muted">Copies all class lists, marks, feedback, messages, questions and forum posts into hidden Archive tabs in your tracker, then empties them so you can start fresh. Nothing is deleted from the archive.</p><label class="f">Archive label<input id="al" placeholder="e.g. Aga Khan 2026"></label><label class="f">Type ARCHIVE to confirm<input id="ac"></label><button class="btn" type="submit">Archive and start fresh</button><p class="msg" id="arm"></p></form></div>';
    p.innerHTML = h; bindCls(p, students);
    p.querySelector('#addf').onsubmit = function (e) { e.preventDefault(); var m = p.querySelector('#am'); m.textContent = 'Adding…';
      T('addStudent', { name: p.querySelector('#an').value, cls: C.cls, email: p.querySelector('#ae').value }).then(function (x) { if (!x.ok) { m.textContent = x.error; return; } BV.toast('Added. Personal code: ' + x.code); load(); }); };
    p.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { var r = C.rows[+b.getAttribute('data-e')];
      var dv = drawer('<h2>Edit student</h2><label class="f">Name<input id="en" value="' + E(r.name) + '"></label><label class="f">Class<select id="ec">' + D.classList.map(function (c) { return '<option' + (c === C.cls ? ' selected' : '') + '>' + E(c) + '</option>'; }).join('') + '</select></label><label class="f">Email<input id="ee" type="email" value="' + E(r.email || '') + '"></label><p class="small muted">Renaming keeps the old name under "Also typed as", so earlier marks still count.</p><button class="btn main" id="es" type="button">Save</button><p class="msg" id="em"></p>');
      dv.querySelector('#es').onclick = function () { T('editStudent', { row: r.row, name: dv.querySelector('#en').value, cls: dv.querySelector('#ec').value, email: dv.querySelector('#ee').value }).then(function (x) { if (!x.ok) { dv.querySelector('#em').textContent = x.error; return; } document.querySelector('.drawer').remove(); load(); }); }; }; });
    p.querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { var r = C.rows[+b.getAttribute('data-n')]; if (!confirm('Give ' + r.name + ' a new code? The old one stops working.')) return; T('newCode', { row: r.row }).then(function (x) { BV.toast(x.ok ? 'New code: ' + x.code : x.error); load(); }); }; });
    p.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var r = C.rows[+b.getAttribute('data-d')]; if (!confirm('Remove ' + r.name + ' from ' + C.cls + '? Their submitted work stays in your tracker.')) return; T('removeStudent', { row: r.row }).then(function (x) { BV.toast(x.ok ? 'Removed.' : x.error); load(); }); }; });
    p.querySelectorAll('[data-ln]').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-ln'), row = p.querySelector('[data-ls="' + i + '"]').value; if (!row) return BV.toast('Choose a student first.'); T('linkName', { row: row, alias: C.unmatched[i].name }).then(function (x) { BV.toast(x.ok ? 'Linked.' : x.error); load(); }); }; });
    p.querySelectorAll('[data-an]').forEach(function (b) { b.onclick = function () { var u = C.unmatched[+b.getAttribute('data-an')]; T('addStudent', { name: u.name, cls: C.cls }).then(function (x) { BV.toast(x.ok ? 'Added. Code: ' + x.code : x.error); load(); }); }; });
    p.querySelector('#clf').onsubmit = function (e) { e.preventDefault(); T('addClass', { cls: p.querySelector('#cn').value }).then(function (x) { if (!x.ok) { p.querySelector('#cm').textContent = x.error; return; } BV.toast('Class added.'); load(); }); };
    p.querySelector('#arf').onsubmit = function (e) { e.preventDefault(); if (!confirm('Archive everything and start fresh?')) return; var m = p.querySelector('#arm'); m.textContent = 'Archiving…';
      T('archive', { label: p.querySelector('#al').value, confirm: p.querySelector('#ac').value }).then(function (x) { if (!x.ok) { m.textContent = x.error; return; } BV.toast('Archived as ' + x.archived + '.'); load(); }); };
  }

  /* ---- messages ---- */
  function messages(p) {
    var opts = '<option>All classes</option>' + D.classList.map(function (c) { return '<option>' + E(c) + '</option>'; }).join('') + '<option value="__pick">Choose students…</option>';
    p.innerHTML = '<form class="form" id="mf"><h3>Send a message</h3><label class="f">To<select id="mto">' + opts + '</select></label><div id="pick" hidden class="grp"></div>' +
      '<label class="f">Subject<input id="ms" required maxlength="150"></label><label class="f">Message<textarea id="mm" required></textarea></label>' +
      '<label class="chk"><input type="checkbox" id="mem" checked> Also send by email from your Gmail (to students with an email address)</label><p class="small muted" id="quota"></p>' +
      '<button class="btn main" type="submit">Send</button><p class="msg" id="mmsg"></p></form><h3>Sent messages</h3><div id="hist" class="grp"><p class="muted">Loading…</p></div>';
    T('emailQuota').then(function (x) { if (x.ok) p.querySelector('#quota').textContent = 'Google lets you send ' + x.left + ' more emails today.'; });
    var sel = p.querySelector('#mto'), pick = p.querySelector('#pick');
    sel.onchange = function () { pick.hidden = sel.value !== '__pick'; if (!pick.hidden && !pick.innerHTML) pick.innerHTML = D.classes.filter(function (c) { return c.rows.length; }).map(function (c) { return '<details open><summary><b>' + E(c.cls) + '</b></summary><div class="chips">' + c.rows.map(function (r) { return '<label class="chk"><input type="checkbox" value="' + E(r.name + ' (' + c.cls + ')') + '"> ' + E(r.name) + (r.email ? '' : ' <span class="small muted">(no email)</span>') + '</label>'; }).join('') + '</div></details>'; }).join(''); };
    p.querySelector('#mf').onsubmit = function (e) { e.preventDefault(); var m = p.querySelector('#mmsg'); m.className = 'msg'; m.textContent = 'Sending…';
      var to = sel.value === '__pick' ? [].map.call(pick.querySelectorAll('input:checked'), function (i) { return i.value; }) : sel.value;
      if (Array.isArray(to) && !to.length) { m.textContent = 'Choose at least one student.'; return; }
      T('sendMessage', { to: to, subject: p.querySelector('#ms').value, message: p.querySelector('#mm').value, email: p.querySelector('#mem').checked }).then(function (x) {
        if (!x.ok) { m.textContent = x.error; return; } m.className = 'msg ok'; m.textContent = 'Sent to ' + x.recipients + ' students on the site' + (x.emailed ? ', ' + x.emailed + ' by email' : '') + '.' + (x.noEmail && x.noEmail.length ? ' No email address for: ' + x.noEmail.join(', ') + '.' : ''); hist(); }); };
    function hist() { T('messages').then(function (x) { p.querySelector('#hist').innerHTML = x.ok && x.messages.length ? x.messages.map(function (m) { return '<article class="item"><span class="meta">' + E(BV.when(m.Date)) + ' · to ' + E(m.To) + (+m.Emailed ? ' · emailed ' + m.Emailed : '') + '</span><b>' + E(m.Subject) + '</b><div class="small">' + BV.md(m.Message) + '</div></article>'; }).join('') : '<p class="muted">No messages yet.</p>'; }); }
    hist();
  }

  /* ---- questions ---- */
  function questions(p) {
    p.innerHTML = '<p class="muted">Loading…</p>';
    T('questions').then(function (x) {
      if (!x.ok) { p.innerHTML = '<p class="msg">' + E(x.error) + '</p>'; return; }
      p.innerHTML = x.questions.length ? x.questions.map(function (q, i) {
        return '<article class="item"><span class="meta">' + E(q.Student) + ' · ' + E(q.Class) + ' · ' + E(BV.when(q.Date)) + ' · <span class="pill ' + (q.Status === 'Answered' ? 'ok' : 'new') + '">' + E(q.Status || 'New') + '</span></span><b>' + E(q.Question) + '</b>' +
          (q['AI answer'] ? '<div class="fb ai"><h4>AI helper said</h4>' + BV.md(q['AI answer']) + '</div>' : '') + (q['Teacher reply'] ? '<div class="fb tch"><h4>Your reply</h4>' + BV.md(q['Teacher reply']) + '</div>' : '') +
          '<details' + (q.Status === 'Answered' ? '' : ' open') + '><summary>' + (q['Teacher reply'] ? 'Edit reply' : 'Reply') + '</summary><textarea data-q="' + i + '">' + E(q['Teacher reply'] || '') + '</textarea><label class="chk"><input type="checkbox" data-em="' + i + '" checked> Email the reply too</label><div class="acts"><button type="button" data-s="' + i + '">Send reply</button></div></details></article>';
      }).join('') : '<p class="emptybox">No questions yet.</p>';
      p.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { var i = b.getAttribute('data-s'), q = x.questions[+i]; b.disabled = true;
        T('reply', { id: q.ID, text: p.querySelector('[data-q="' + i + '"]').value, email: p.querySelector('[data-em="' + i + '"]').checked }).then(function (r) { BV.toast(r.ok ? 'Reply sent' + (r.emailed ? ' and emailed.' : '.') : r.error); D.newQuestions = Math.max(0, D.newQuestions - 1); questions(p); }); }; });
    });
  }

  /* ---- exams ---- */
  function exams(p) {
    p.innerHTML = '<div class="row2"><h3>Assessments</h3><button class="btn main sm" type="button" id="nx">+ New assessment</button></div><div id="xl" class="grp"><p class="muted">Loading…</p></div>';
    p.querySelector('#nx').onclick = function () { editExam({ title: '', classes: [], questions: [], status: 'Draft', showResults: true, minutes: 30 }); };
    T('exams').then(function (x) {
      var L = p.querySelector('#xl'); if (!x.ok) { L.innerHTML = '<p class="msg">' + E(x.error) + '</p>'; return; }
      L.innerHTML = x.exams.length ? x.exams.map(function (e, i) { return '<article class="item"><div class="row2"><b>' + E(e.title) + '</b><span class="pill ' + (e.status === 'Published' ? 'ok' : '') + '">' + E(e.status) + '</span></div><span class="meta">' + E(e.classes.join(', ') || 'No class') + ' · ' + e.count + ' questions · ' + e.max + ' marks' + (e.minutes ? ' · ' + e.minutes + ' min' : '') + (e.due ? ' · due ' + E(BV.when(e.due)) : '') + '</span><div class="acts"><button type="button" data-ed="' + i + '">Edit</button><button type="button" data-rs="' + i + '">Results</button><button type="button" data-dl="' + i + '">Delete</button></div></article>'; }).join('') : '<p class="emptybox">No assessments yet. Create one, or let the AI generator write questions for you.</p>';
      L.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { editExam(x.exams[+b.getAttribute('data-ed')]); }; });
      L.querySelectorAll('[data-rs]').forEach(function (b) { b.onclick = function () { results(x.exams[+b.getAttribute('data-rs')]); }; });
      L.querySelectorAll('[data-dl]').forEach(function (b) { b.onclick = function () { var e = x.exams[+b.getAttribute('data-dl')]; if (confirm('Delete "' + e.title + '"? Results already submitted stay in your tracker.')) T('deleteExam', { id: e.id }).then(function () { exams(p); }); }; });
    });
    function local(iso) { if (!iso) return ''; var d = new Date(iso); if (isNaN(d)) return ''; d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
    function editExam(e) {
      var Q = JSON.parse(JSON.stringify(e.questions || []));
      var dv = drawer('<h2>' + (e.id ? 'Edit' : 'New') + ' assessment</h2><label class="f">Title<input id="xt" value="' + E(e.title) + '"></label>' +
        '<fieldset class="q"><legend class="small muted">Assign to classes</legend><div class="chips">' + D.classList.map(function (c) { return '<label class="chk"><input type="checkbox" value="' + E(c) + '"' + (e.classes.indexOf(c) >= 0 ? ' checked' : '') + '> ' + E(c) + '</label>'; }).join('') + '</div></fieldset>' +
        '<div class="two"><label class="f">Opens<input type="datetime-local" id="xo" value="' + local(e.opens) + '"></label><label class="f">Due<input type="datetime-local" id="xd" value="' + local(e.due) + '"></label></div>' +
        '<div class="two"><label class="f">Time limit (minutes, 0 = none)<input type="number" min="0" id="xm" value="' + (e.minutes || 0) + '"></label><label class="chk" style="align-self:end"><input type="checkbox" id="xr"' + (e.showResults ? ' checked' : '') + '> Show students their score and feedback after submitting</label></div>' +
        '<details class="panel tint"' + (Q.length ? '' : ' open') + '><summary><b>✨ Generate questions with AI</b></summary><div class="grp" style="margin-top:10px"><label class="f">Topic<input id="gt" placeholder="e.g. Enzymes: active site, denaturation and factors affecting rate"></label>' +
        '<div class="two"><label class="f">Level<input id="gl" placeholder="e.g. IB DP Biology SL, MYP 3, IGCSE Extended"></label><label class="f">Number of questions<input id="gn" type="number" min="1" max="25" value="8"></label></div>' +
        '<div class="two"><label class="f">Difficulty<select id="gd"><option>mixed</option><option>easy</option><option>medium</option><option>hard</option></select></label><div class="chips" style="align-self:end"><label class="chk"><input type="checkbox" value="mcq" checked class="gty"> Multiple choice</label><label class="chk"><input type="checkbox" value="short" checked class="gty"> Short answer</label><label class="chk"><input type="checkbox" value="tf" class="gty"> True/false</label></div></div>' +
        '<label class="f">Extra instructions (optional)<input id="gx" placeholder="e.g. include one data-analysis question"></label><button class="btn" type="button" id="gen"' + (D.settings.aiOn ? '' : ' disabled') + '>Generate and add</button>' + (D.settings.aiOn ? '' : '<p class="small muted">Add your Claude key in Settings to use the generator.</p>') + '<p class="msg" id="gm"></p></div></details>' +
        '<div id="qs" class="grp"></div><button class="btn sm" type="button" id="addq">+ Add a question</button>' +
        '<div class="cta"><button class="btn main" type="button" data-save="Published">Save and publish</button><button class="btn" type="button" data-save="Draft">Save as draft</button></div><p class="msg" id="sm"></p>');
      function qhtml(q, i) {
        var opt = q.type !== 'short';
        return '<div class="q" data-qi="' + i + '"><div class="row2"><b>Question ' + (i + 1) + '</b><div class="acts" style="margin:0"><select data-f="type"><option value="mcq"' + (q.type === 'mcq' ? ' selected' : '') + '>Multiple choice</option><option value="tf"' + (q.type === 'tf' ? ' selected' : '') + '>True/false</option><option value="short"' + (q.type === 'short' ? ' selected' : '') + '>Short answer</option></select><button type="button" data-up>↑</button><button type="button" data-rm>Remove</button></div></div>' +
          '<textarea data-f="q" rows="2">' + E(q.q) + '</textarea>' +
          (opt ? '<label class="f">Options (one per line; tick the right answer)<div class="grp">' + (q.options.length ? q.options : ['', '', '', '']).map(function (o, j) { return '<label class="chk"><input type="radio" name="ans' + i + '" value="' + j + '"' + (String(q.answer) === String(j) ? ' checked' : '') + '><input data-o="' + j + '" value="' + E(o) + '"></label>'; }).join('') + '</div></label>'
            : '<label class="f">Model answer / mark scheme (used for AI marking)<textarea data-f="scheme" rows="3">' + E(q.scheme || q.answer || '') + '</textarea></label>') +
          '<label class="f" style="max-width:140px">Marks<input type="number" min="1" data-f="marks" value="' + (q.marks || 1) + '"></label></div>';
      }
      function read() { dv.querySelectorAll('[data-qi]').forEach(function (el) { var i = +el.getAttribute('data-qi'), q = Q[i]; q.type = el.querySelector('[data-f="type"]').value; q.q = el.querySelector('[data-f="q"]').value; q.marks = +el.querySelector('[data-f="marks"]').value || 1;
        if (el.querySelector('[data-o]')) { q.options = [].map.call(el.querySelectorAll('[data-o]'), function (o) { return o.value; }).filter(function (o, j, a) { return o.trim() || j < 2; }); var c = el.querySelector('input[type=radio]:checked'); q.answer = c ? +c.value : q.answer; }
        if (el.querySelector('[data-f="scheme"]')) { q.scheme = el.querySelector('[data-f="scheme"]').value; q.answer = q.scheme; } }); }
      function render() { dv.querySelector('#qs').innerHTML = Q.map(qhtml).join('') || '<p class="muted">No questions yet.</p>';
        dv.querySelectorAll('[data-qi]').forEach(function (el) { var i = +el.getAttribute('data-qi');
          el.querySelector('[data-rm]').onclick = function () { read(); Q.splice(i, 1); render(); };
          el.querySelector('[data-up]').onclick = function () { read(); if (i) { var t = Q[i]; Q[i] = Q[i - 1]; Q[i - 1] = t; } render(); };
          el.querySelector('[data-f="type"]').onchange = function () { read(); var q = Q[i]; if (q.type === 'tf') { q.options = ['True', 'False']; } else if (q.type === 'mcq' && q.options.length < 3) q.options = ['', '', '', '']; render(); }; }); }
      render();
      dv.querySelector('#addq').onclick = function () { read(); Q.push({ type: 'mcq', q: '', options: ['', '', '', ''], answer: 0, marks: 1 }); render(); };
      dv.querySelector('#gen').onclick = function () { var m = dv.querySelector('#gm'), b = this; read(); b.disabled = true; m.className = 'msg'; m.textContent = 'Writing questions… this can take 20–40 seconds.';
        T('genQuestions', { topic: dv.querySelector('#gt').value, level: dv.querySelector('#gl').value, count: dv.querySelector('#gn').value, difficulty: dv.querySelector('#gd').value, notes: dv.querySelector('#gx').value, types: [].map.call(dv.querySelectorAll('.gty:checked'), function (c) { return c.value; }) })
          .then(function (x) { b.disabled = false; if (!x.ok) { m.textContent = x.error; return; } Q = Q.concat(x.questions); render(); m.className = 'msg ok'; m.textContent = 'Added ' + x.questions.length + ' questions. Check and edit them before publishing.'; }); };
      dv.querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () { read(); var m = dv.querySelector('#sm'); m.className = 'msg';
        var cls = [].map.call(dv.querySelectorAll('fieldset input:checked'), function (c) { return c.value; }), st = b.getAttribute('data-save');
        if (st === 'Published' && (!cls.length || !Q.length)) { m.textContent = 'Choose at least one class and add questions before publishing.'; return; }
        var iso = function (v) { return v ? new Date(v).toISOString() : ''; };
        m.textContent = 'Saving…';
        T('saveExam', { exam: { id: e.id, title: dv.querySelector('#xt').value, classes: cls, opens: iso(dv.querySelector('#xo').value), due: iso(dv.querySelector('#xd').value), minutes: +dv.querySelector('#xm').value, showResults: dv.querySelector('#xr').checked, status: st, questions: Q } })
          .then(function (x) { if (!x.ok) { m.textContent = x.error; return; } document.querySelector('.drawer').remove(); BV.toast(st === 'Published' ? 'Published to ' + cls.join(', ') + '.' : 'Saved as draft.'); exams(p); }); }; });
    }
    function results(e) {
      var dv = drawer('<h2>' + E(e.title) + '</h2><div id="rr"><p class="muted">Loading…</p></div>');
      T('examResults', { id: e.id }).then(function (x) {
        if (!x.ok) { dv.querySelector('#rr').innerHTML = '<p class="msg">' + E(x.error) + '</p>'; return; }
        var R = x.results, Q = x.exam.questions;
        dv.querySelector('#rr').innerHTML = R.length ? '<div class="tablewrap"><table class="marks"><thead><tr><th>Student</th><th>Class</th><th>Score</th><th>Status</th><th></th></tr></thead><tbody>' + R.map(function (r, i) { return '<tr><td>' + E(r.student) + '</td><td>' + E(r.cls) + '</td><td>' + (r.score == null ? '–' : r.score + ' / ' + r.max) + '</td><td>' + E(r.status) + '</td><td><button type="button" data-v="' + i + '">Review</button></td></tr>'; }).join('') + '</tbody></table></div><div id="rv" class="grp"></div>' : '<p class="emptybox">No one has started this yet.</p>';
        dv.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { var r = R[+b.getAttribute('data-v')];
          dv.querySelector('#rv').innerHTML = '<h3>' + E(r.student) + '</h3>' + Q.map(function (q, i) { var d = r.detail[i] || {}; var ans = (q.type === 'short') ? E(d.a || '') : E(q.options[d.a] != null ? q.options[d.a] : '(no answer)') + (d.correct != null ? ' · correct: ' + E(q.options[d.correct]) : '');
            return '<div class="q"><b>Q' + (i + 1) + '. ' + E(q.q) + '</b><div class="small" style="white-space:pre-wrap">' + ans + '</div>' + (d.comment ? '<div class="fb ' + (d.ai ? 'ai' : 'tch') + '"><h4>' + (d.ai ? 'AI marker' : 'Comment') + '</h4>' + E(d.comment) + '</div>' : '') +
              (q.type === 'short' ? '<div class="row2"><label class="f" style="max-width:150px">Marks / ' + (d.max || q.marks) + '<input type="number" min="0" max="' + (d.max || q.marks) + '" data-mk="' + i + '" value="' + (d.got == null ? '' : d.got) + '"></label><label class="f" style="flex:1">Comment<input data-cm="' + i + '" value="' + E(d.comment || '') + '"></label><button class="btn sm" type="button" data-sv="' + i + '">Save</button></div>' : '<p class="small">' + (d.got || 0) + ' / ' + (d.max || q.marks) + '</p>') + '</div>'; }).join('');
          dv.querySelectorAll('[data-sv]').forEach(function (s) { s.onclick = function () { var i = s.getAttribute('data-sv'); T('markAnswer', { result: r.id, q: +i, marks: dv.querySelector('[data-mk="' + i + '"]').value, comment: dv.querySelector('[data-cm="' + i + '"]').value }).then(function (y) { BV.toast(y.ok ? 'Saved. Total now ' + y.score : y.error); }); }; }); }; });
      });
    }
  }

  /* ---- forum moderation ---- */
  function forum(p, board) {
    p.innerHTML = '<p class="muted">Loading…</p>';
    T('forumAll', { board: board }).then(function (x) {
      if (!x.ok) { p.innerHTML = '<p class="msg">' + E(x.error) + '</p>'; return; }
      p.innerHTML = '<div class="tabs">' + x.boards.map(function (b) { return '<button type="button" aria-selected="' + (b === x.board) + '" data-b="' + E(b) + '">' + E(b) + '</button>'; }).join('') + '</div>' +
        '<form class="form" id="tp"><h3>Post to ' + E(x.board) + ' as teacher</h3><input id="tpt" placeholder="Title" required><textarea id="tpm" placeholder="Message" required></textarea><button class="btn main" type="submit">Post</button></form>' +
        (x.threads.length ? x.threads.map(function (t) { return '<article class="item"' + (t.hidden ? ' style="opacity:.55"' : '') + '><span class="meta">' + E(t.author) + ' · ' + E(t.cls || 'Teacher') + ' · ' + E(BV.when(t.date)) + ' · ' + t.replies + ' replies' + (t.hidden ? ' · hidden' : '') + '</span><b>' + E(t.title) + '</b><span class="small muted">' + E(t.preview) + '</span><div class="acts"><button type="button" data-o="' + E(t.id) + '">Open</button><button type="button" data-h="' + E(t.id) + '" data-hv="' + (t.hidden ? '' : '1') + '">' + (t.hidden ? 'Show' : 'Hide') + '</button><button type="button" data-del="' + E(t.id) + '">Delete</button></div></article>'; }).join('') : '<p class="emptybox">No discussions in this board yet.</p>');
      p.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () { forum(p, b.getAttribute('data-b')); }; });
      p.querySelector('#tp').onsubmit = function (e) { e.preventDefault(); T('postT', { board: x.board, title: p.querySelector('#tpt').value, message: p.querySelector('#tpm').value }).then(function (r) { BV.toast(r.ok ? 'Posted.' : r.error); forum(p, x.board); }); };
      p.querySelectorAll('[data-h]').forEach(function (b) { b.onclick = function () { T('hidePost', { id: b.getAttribute('data-h'), hidden: !!b.getAttribute('data-hv') }).then(function () { forum(p, x.board); }); }; });
      p.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (confirm('Delete this discussion and all its replies? This cannot be undone.')) T('deletePost', { id: b.getAttribute('data-del') }).then(function () { forum(p, x.board); }); }; });
      p.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { T('threadT', { id: b.getAttribute('data-o') }).then(function (t) {
        var dv = drawer('<h2>' + E(t.title) + '</h2>' + t.posts.map(function (q) { return '<article class="item"' + (q.hidden ? ' style="opacity:.55"' : '') + '><span class="meta">' + E(q.author) + ' · ' + E(q.cls || 'Teacher') + ' · ' + E(BV.when(q.date)) + '</span><div>' + BV.md(q.message) + '</div><div class="acts"><button type="button" data-ph="' + E(q.id) + '" data-pv="' + (q.hidden ? '' : '1') + '">' + (q.hidden ? 'Show' : 'Hide') + '</button></div></article>'; }).join('') +
          '<form class="form" id="tr"><textarea id="trm" placeholder="Reply as teacher" required></textarea><button class="btn main" type="submit">Reply</button></form>');
        dv.querySelectorAll('[data-ph]').forEach(function (h) { h.onclick = function () { T('hidePost', { id: h.getAttribute('data-ph'), hidden: !!h.getAttribute('data-pv') }).then(function () { document.querySelector('.drawer').remove(); b.click(); }); }; });
        dv.querySelector('#tr').onsubmit = function (e) { e.preventDefault(); T('postT', { thread: t.id, message: dv.querySelector('#trm').value }).then(function () { document.querySelector('.drawer').remove(); b.click(); }); };
      }); }; });
    });
  }

  /* ---- site editor ---- */
  function site(p, pg) {
    pg = pg || 'home';
    p.innerHTML = '<div class="row2"><label class="f" style="max-width:320px">Page<select id="pg">' + PAGES.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === pg ? ' selected' : '') + '>' + E(x[1]) + '</option>'; }).join('') + '</select></label><a class="btn sm" id="view" target="_blank" href="/' + (pg === 'home' ? '' : pg + '/') + '">View page ↗</a></div><div id="ed" class="grp"><p class="muted">Loading…</p></div>';
    p.querySelector('#pg').onchange = function () { site(p, this.value); };
    BV.api('content', { page: pg }).then(function (x) {
      var C = x.ok ? x : { intro: { title: '', desc: '' }, sections: [] }; C.intro = C.intro || { title: '', desc: '' };
      var ed = p.querySelector('#ed');
      function itemH(it, si, ii) { return '<div class="card" data-si="' + si + '" data-ii="' + ii + '"><input data-k="title" placeholder="Title" value="' + E(it.title) + '"><input data-k="desc" placeholder="Short description" value="' + E(it.desc) + '"><input data-k="link" placeholder="Link (Google Drive, website or /lesson-address/)" value="' + E(it.link) + '"><input data-k="dl" placeholder="Download link (optional, filled automatically for Drive files)" value="' + E(it.dl || '') + '">' +
        '<div class="acts"><label class="chk"><input type="checkbox" data-k="locked"' + (it.locked ? ' checked' : '') + '> Needs class password</label><label class="btn sm" style="cursor:pointer">Upload file<input type="file" data-up hidden></label><button type="button" data-mv="-1">↑</button><button type="button" data-mv="1">↓</button><button type="button" data-del>Delete</button></div><span class="small muted" data-st></span></div>'; }
      function render() {
        ed.innerHTML = '<section class="panel"><h3>' + (pg === 'home' ? 'Announcements box' : 'Page heading') + '</h3><input id="it" placeholder="Title" value="' + E(C.intro.title) + '"><textarea id="id" rows="2" placeholder="Description">' + E(C.intro.desc) + '</textarea></section>' +
          C.sections.map(function (s, si) { return '<section class="panel" data-sec="' + si + '"><div class="row2"><input data-sn="' + si + '" value="' + E(s.name) + '" style="max-width:420px;font-weight:700"><div class="acts"><button type="button" data-smv="-1" data-s="' + si + '">↑</button><button type="button" data-smv="1" data-s="' + si + '">↓</button><button type="button" data-sdel="' + si + '">Delete section</button></div></div><div class="res">' + s.items.map(function (it, ii) { return itemH(it, si, ii); }).join('') + '</div><button class="btn sm" type="button" data-add="' + si + '">+ Add ' + (pg === 'home' ? 'announcement' : 'resource') + '</button></section>'; }).join('') +
          '<div class="cta"><button class="btn sm" type="button" id="adds">+ Add section</button></div><div class="cta"><button class="btn main" type="button" id="pub">Save and publish</button></div><p class="msg" id="pm"></p><p class="small muted">Changes go live as soon as you save. Uploaded files are stored in your Google Drive folder "BioScience Vista uploads" and shared as view-only links.</p>';
        bind();
      }
      function read() {
        C.intro = { title: ed.querySelector('#it').value, desc: ed.querySelector('#id').value };
        ed.querySelectorAll('[data-sn]').forEach(function (i) { C.sections[+i.getAttribute('data-sn')].name = i.value; });
        ed.querySelectorAll('.card[data-si]').forEach(function (c) { var it = C.sections[+c.getAttribute('data-si')].items[+c.getAttribute('data-ii')];
          c.querySelectorAll('[data-k]').forEach(function (i) { it[i.getAttribute('data-k')] = i.type === 'checkbox' ? i.checked : i.value; }); });
      }
      function bind() {
        ed.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { read(); C.sections[+b.getAttribute('data-add')].items.push({ title: '', desc: '', link: '', dl: '' }); render(); }; });
        ed.querySelector('#adds').onclick = function () { read(); C.sections.push({ name: 'New section', items: [] }); render(); };
        ed.querySelectorAll('[data-sdel]').forEach(function (b) { b.onclick = function () { if (!confirm('Delete this section and its resources?')) return; read(); C.sections.splice(+b.getAttribute('data-sdel'), 1); render(); }; });
        ed.querySelectorAll('[data-smv]').forEach(function (b) { b.onclick = function () { read(); var i = +b.getAttribute('data-s'), j = i + +b.getAttribute('data-smv'); if (j < 0 || j >= C.sections.length) return; var t = C.sections[i]; C.sections[i] = C.sections[j]; C.sections[j] = t; render(); }; });
        ed.querySelectorAll('.card[data-si]').forEach(function (c) { var si = +c.getAttribute('data-si'), ii = +c.getAttribute('data-ii'), arr = function () { return C.sections[si].items; };
          c.querySelector('[data-del]').onclick = function () { read(); arr().splice(ii, 1); render(); };
          c.querySelectorAll('[data-mv]').forEach(function (b) { b.onclick = function () { read(); var j = ii + +b.getAttribute('data-mv'), a = arr(); if (j < 0 || j >= a.length) return; var t = a[ii]; a[ii] = a[j]; a[j] = t; render(); }; });
          c.querySelector('[data-up]').onchange = function () { var f = this.files[0], st = c.querySelector('[data-st]'); if (!f) return;
            if (f.size > 35 * 1024 * 1024) { st.textContent = 'This file is over 35 MB. Upload it to Google Drive yourself and paste its link.'; return; }
            st.textContent = 'Uploading ' + f.name + '…'; var rd = new FileReader();
            rd.onload = function () { T('upload', { name: f.name, mime: f.type, data: String(rd.result).split(',')[1] }).then(function (x) { if (!x.ok) { st.textContent = x.error; return; } read(); var it = arr()[ii]; it.link = x.link; it.dl = x.dl; if (!it.title) it.title = f.name.replace(/\.[^.]+$/, ''); render(); BV.toast('Uploaded. Remember to Save and publish.'); }); };
            rd.readAsDataURL(f); }; });
        ed.querySelector('#pub').onclick = function () { read(); var m = ed.querySelector('#pm'); m.className = 'msg'; m.textContent = 'Publishing…';
          T('saveContent', { page: pg, data: { intro: C.intro, sections: C.sections.map(function (s) { return { name: s.name, items: s.items.filter(function (i) { return i.title; }) }; }) } })
            .then(function (x) { if (!x.ok) { m.textContent = x.error; return; } m.className = 'msg ok'; m.textContent = 'Published. The page now shows your changes.'; }); };
      }
      render();
    });
  }

  /* ---- settings ---- */
  function settings(p) {
    p.innerHTML = '<form class="form narrow" id="sf"><h3>AI feedback and exam generator (Claude)</h3><p class="small">Status: <b>' + (D.settings.aiOn ? 'switched on' : 'not set up') + '</b> · model ' + E(D.settings.model) + '</p>' +
      '<p class="small muted">Create an API key at console.anthropic.com (Settings → API keys) and paste it here. It is stored privately in your Google script and is never shown to students. Usage is billed to your Anthropic account; each student can make up to 15 AI requests a day.</p>' +
      '<label class="f">Claude API key<input id="ak" type="password" placeholder="sk-ant-…" autocomplete="off"></label><label class="f">Model<input id="am" value="' + E(D.settings.model) + '"></label>' +
      '<div class="cta"><button class="btn main" type="submit">Save</button><button class="btn" type="button" id="tst">Test AI</button>' + (D.settings.aiOn ? '<button class="btn" type="button" id="off">Switch AI off</button>' : '') + '</div><p class="msg" id="sm"></p></form>' +
      '<section class="panel"><h3>Your links</h3><p>Live website: <a href="https://biosciencevista.com" target="_blank">biosciencevista.com</a></p><p>Teacher console: <a href="/teacher/">biosciencevista.com/teacher</a></p><p>Students sign in at <a href="/progress/">biosciencevista.com/progress</a></p><p class="small muted">Your teacher key is set in the Google script (TEACHER_KEY). Lesson pages use the class password.</p></section>';
    var m = p.querySelector('#sm');
    p.querySelector('#sf').onsubmit = function (e) { e.preventDefault(); m.className = 'msg'; m.textContent = 'Saving…'; var k = p.querySelector('#ak').value.trim();
      T('settings', { aiKey: k || undefined, model: p.querySelector('#am').value }).then(function (x) { if (!x.ok) { m.textContent = x.error; return; } D.settings.aiOn = x.aiOn; D.settings.model = x.model; m.className = 'msg ok'; m.textContent = 'Saved.' + (x.aiOn ? ' AI is on.' : ''); }); };
    p.querySelector('#tst').onclick = function () { m.className = 'msg'; m.textContent = 'Testing…'; T('settings', { testAi: true }).then(function (x) { if (!x.ok) { m.textContent = x.error; return; } m.className = 'msg ok'; m.textContent = 'AI is working (replied: ' + x.test + ').'; }); };
    var off = p.querySelector('#off'); if (off) off.onclick = function () { T('settings', { clearAi: true }).then(function () { D.settings.aiOn = false; settings(p); }); };
  }

  load();
})();
