/* Learnova · teacher portal for teachers from other schools and private tutors.
   A teacher sees only their own classes and students. They add Learnova lessons and published quizzes to their classes;
   they cannot change anything on the main site (enforced by the database, migration 022). */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME, CLASSES = [], CUR = null, CAT = null;
  S.guard(app, { allowPending: true, school: true }).then(function (me) {
    ME = me;
    if (me.staff) { app.innerHTML = '<section class="panel"><h2>You are main-site staff</h2><p>Use the <a href="/staff/">Teacher dashboard</a> and the <a href="/admin/">Admin page</a>.</p></section>'; return; }
    if (!me.school) { app.innerHTML = '<section class="panel"><h2>Teachers only</h2><p>This page is for teacher accounts. <a href="/dashboard/">Go to your dashboard</a>.</p></section>'; return; }
    var a = me.access || {}, st = me.profile.teacher_status;
    var top = '<div class="row2"><div><p class="label">Teacher portal</p><h2>Hello, ' + E((me.profile.full_name || '').split(' ')[0] || 'teacher') + '</h2><p class="muted small">' + E(me.profile.school_name || 'Independent teacher') + ' · ' + E(me.user.email) + '</p></div>' +
      '<div class="cta"><a class="btn sm" href="/messages/">Messages</a><a class="btn sm" href="/premium/">Premium</a><button class="btn sm" type="button" id="so">Log out</button></div></div>';
    if (st !== 'approved' || me.roles.indexOf('school_teacher') < 0) { app.innerHTML = top + '<section class="panel tint"><h3>' + (st === 'rejected' ? 'Your teacher account was not approved' : '⏳ Waiting for approval') + '</h3><p>' + (st === 'rejected' ? 'Contact the Learnova admin through Messages if you think this is a mistake.' : 'The Learnova admin checks every new teacher account. You can buy premium now; your classes open as soon as you are approved.') + '</p></section>'; app.querySelector('#so').onclick = S.signOut; return; }
    if (!a.premium) { app.innerHTML = top + '<section class="panel tint"><h3>Premium is needed to run classes</h3><p>Your teacher account is approved. Get premium to create classes, add Learnova lessons and quizzes, and see your students\' results.</p><a class="btn main" href="/premium/">Get premium</a></section>'; app.querySelector('#so').onclick = S.signOut; return; }
    app.innerHTML = top + '<div id="tp"></div>'; app.querySelector('#so').onclick = S.signOut;
    load();
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function load(keep) {
    S.db.from('classes').select('*').eq('teacher_id', ME.user.id).order('created_at').then(function (r) {
      CLASSES = (r.data || []).filter(function (c) { return !c.archived_at; });
      if (!keep || !CLASSES.some(function (c) { return c.id === (CUR && CUR.id); })) CUR = CLASSES[0] || null;
      else CUR = CLASSES.filter(function (c) { return c.id === CUR.id; })[0];
      draw();
    });
  }
  function draw() {
    var tp = app.querySelector('#tp');
    tp.innerHTML = '<section class="panel grp"><div class="row2"><h3 style="margin:0">🏫 My classes</h3><button class="btn main sm" type="button" id="newc">＋ New class</button></div>' +
      (CLASSES.length ? '<div class="cta">' + CLASSES.map(function (c) { return '<button type="button" class="btn sm' + (CUR && c.id === CUR.id ? ' main' : '') + '" data-c="' + E(c.id) + '">' + E(c.name) + (c.active ? '' : ' (closed)') + '</button>'; }).join('') + '</div>' : '<p class="small">No classes yet. Create your first class.</p>') +
      '<div id="newbox"></div></section><div id="cbox"></div>';
    tp.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { CUR = CLASSES.filter(function (c) { return c.id === b.getAttribute('data-c'); })[0]; draw(); }; });
    tp.querySelector('#newc').onclick = function () { classForm(tp.querySelector('#newbox'), null); };
    if (CUR) classView(tp.querySelector('#cbox'));
  }
  function classForm(box, c) {
    box.innerHTML = '<form class="grp" id="cf" style="margin-top:10px"><label class="f">Class name (students search for it)<input id="cn" required maxlength="80" value="' + E(c ? c.name : '') + '" placeholder="e.g. Hill School DP1 Biology HL"></label>' +
      '<div class="two"><label class="f">Subject<input id="cs" maxlength="60" value="' + E(c && c.subject || '') + '" placeholder="e.g. IB Biology"></label><label class="f">Level<input id="cl" maxlength="40" value="' + E(c && c.level || '') + '" placeholder="e.g. HL"></label></div>' +
      '<label class="f">Short description (optional)<input id="cd" maxlength="160" value="' + E(c && c.description || '') + '"></label>' +
      '<label class="chk"><input type="checkbox" id="cli"' + (!c || c.listed ? ' checked' : '') + '> Students can find this class and ask to join</label>' +
      '<div class="cta"><button class="btn main sm" type="submit">' + (c ? 'Save' : 'Create class') + '</button>' + (c ? '<button class="btn sm" type="button" id="carch">' + (c.active ? 'Close class' : 'Reopen class') + '</button>' : '') + '</div><p class="msg" id="cm"></p></form>';
    box.querySelector('#cf').onsubmit = function (e) { e.preventDefault(); var m = box.querySelector('#cm');
      var row = { name: box.querySelector('#cn').value.trim(), subject: box.querySelector('#cs').value.trim() || null, level: box.querySelector('#cl').value.trim() || null, description: box.querySelector('#cd').value.trim() || null, listed: box.querySelector('#cli').checked };
      if (row.name.length < 3) { m.textContent = 'Give the class a name.'; return; }
      var q = c ? S.db.from('classes').update(row).eq('id', c.id) : S.db.from('classes').insert(Object.assign({ teacher_id: ME.user.id, programme: row.subject }, row));
      q.then(function (r) { if (r.error) { m.textContent = S.nice(r.error); return; } load(true); }); };
    var ar = box.querySelector('#carch'); if (ar) ar.onclick = function () { S.db.from('classes').update({ active: !c.active }).eq('id', c.id).then(function (r) { if (r.error) return alert(S.nice(r.error)); load(true); }); };
  }
  var TAB = 'students';
  function classView(box) {
    var c = CUR;
    box.innerHTML = '<section class="panel grp"><div class="row2"><div><h3 style="margin:0">' + E(c.name) + '</h3><p class="small muted">' + E([c.subject, c.level].filter(Boolean).join(' · ')) + (c.listed ? ' · students can find it under <b>' + E(c.school_name || ME.profile.school_name || 'your name') + '</b>' : ' · hidden from the join list') + '</p></div>' +
      '<button class="btn sm" type="button" id="edc">Edit</button></div><div id="edbox"></div>' +
      '<div class="cta" role="tablist">' + [['students', '👥 Students'], ['materials', '📘 Lessons'], ['quizzes', '📝 Quizzes'], ['results', '📊 Results']].map(function (t) { return '<button type="button" class="btn sm' + (TAB === t[0] ? ' main' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="tab"></div></section>';
    box.querySelector('#edc').onclick = function () { classForm(box.querySelector('#edbox'), c); };
    box.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { TAB = b.getAttribute('data-t'); classView(box); }; });
    ({ students: students, materials: materials, quizzes: quizzes, results: results })[TAB](box.querySelector('#tab'), c);
  }
  function names(ids) {
    if (!ids.length) return Promise.resolve({});
    return S.db.from('profiles').select('id,full_name').in('id', ids).then(function (r) { var o = {}; (r.data || []).forEach(function (p) { o[p.id] = p.full_name; }); return o; });
  }
  function students(t, c) {
    t.innerHTML = '<p class="small muted">Loading…</p>';
    S.db.from('enrolments').select('id,student_id,status,requested_at').eq('class_id', c.id).order('requested_at').then(function (r) {
      var en = r.data || [];
      return names(en.map(function (e) { return e.student_id; })).then(function (nm) {
        var wait = en.filter(function (e) { return e.status === 'pending'; }), ok = en.filter(function (e) { return e.status === 'approved'; }), held = en.filter(function (e) { return e.status === 'teacher_ok'; });
        t.innerHTML = '<h4>Requests to join (' + wait.length + ')</h4>' + (wait.length ? wait.map(function (e) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(nm[e.student_id] || 'Student') + '</b> <span class="small muted">asked ' + E(S.when(e.requested_at)) + '</span></span><span class="cta"><button class="btn main sm" data-ok="' + e.id + '">Approve</button><button class="btn sm" data-no="' + e.id + '">Decline</button></span></div>'; }).join('') : '<p class="small muted">No requests waiting. Tell students to sign up, press <b>Join a class</b>, choose <b>' + E(c.school_name || ME.profile.school_name || ME.profile.full_name) + '</b> and then <b>' + E(c.name) + '</b>.</p>') +
          (held.length ? '<h4>Waiting for Learnova to confirm (' + held.length + ')</h4><p class="small muted">You said yes. Learnova approves every student before they join a class.</p>' + held.map(function (e) { return '<p>' + E(nm[e.student_id] || 'Student') + '</p>'; }).join('') : '') +
          '<h4>Students in this class (' + ok.length + ')</h4>' + (ok.length ? ok.map(function (e) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>' + E(nm[e.student_id] || 'Student') + '</span><span class="cta"><a class="btn sm" href="/messages/">Message</a><button class="btn sm" data-no="' + e.id + '">Remove</button></span></div>'; }).join('') : '<p class="small muted">None yet.</p>') +
          '<p class="small muted">Students also need premium access to open the class materials.</p>';
        t.querySelectorAll('[data-ok],[data-no]').forEach(function (b) { b.onclick = function () { var ok2 = b.hasAttribute('data-ok'); if (!ok2 && !confirm('Remove or decline this student?')) return;
          S.db.rpc('decide_enrolment', { eid: b.getAttribute(ok2 ? 'data-ok' : 'data-no'), approve: ok2 }).then(function (x) { if (x.error) return alert(S.nice(x.error)); if (x.data === 'teacher_ok') alert('Sent to Learnova for final approval. The student joins as soon as it is confirmed.'); students(t, c); }); }; });
      });
    });
  }
  function materials(t, c) {
    t.innerHTML = '<p class="small muted">Loading…</p>';
    Promise.all([CAT ? Promise.resolve({ data: CAT }) : S.db.from('materials').select('*').order('sort'), S.db.from('class_materials').select('path,sort').eq('class_id', c.id)]).then(function (x) {
      CAT = x[0].data || []; var have = {}; (x[1].data || []).forEach(function (m) { have[m.path] = 1; });
      var subjects = []; CAT.forEach(function (m) { if (subjects.indexOf(m.subject) < 0) subjects.push(m.subject); });
      t.innerHTML = '<p class="small">Tick the Learnova lessons your students should see. They appear on your class page; students open them with their own account and their marks come to you under <b>Results</b>.</p>' +
        '<p class="small">Class page for students: <a href="/class/?id=' + E(c.id) + '">/class/?id=…</a> (also on their dashboard).</p>' +
        '<div class="two"><label class="f">Subject<select id="msub"><option value="">All subjects</option>' + subjects.map(function (s) { return '<option>' + E(s) + '</option>'; }).join('') + '</select></label><label class="f">Search<input id="mq" placeholder="topic or title"></label></div>' +
        '<label class="chk"><input type="checkbox" id="monly"> Show only lessons in this class (' + Object.keys(have).length + ')</label><div id="mlist"></div>';
      var list = function () {
        var sub = t.querySelector('#msub').value, q = t.querySelector('#mq').value.trim().toLowerCase(), only = t.querySelector('#monly').checked, last = '';
        var rows = CAT.filter(function (m) { return (!sub || m.subject === sub) && (!only || have[m.path]) && (!q || (m.title + ' ' + (m.unit || '')).toLowerCase().indexOf(q) >= 0); }).slice(0, 400);
        t.querySelector('#mlist').innerHTML = rows.map(function (m) { var u = m.subject + ' · ' + (m.unit || ''), hd = u !== last ? '<p class="label" style="margin-top:10px">' + E(u) + '</p>' : ''; last = u;
          return hd + '<label class="chk" style="display:flex;gap:8px"><input type="checkbox" data-p="' + E(m.path) + '"' + (have[m.path] ? ' checked' : '') + '><span>' + E(m.title) + (m.level === 'HL only' ? ' <span class="pill">HL</span>' : '') + ' <a class="small" href="' + E(m.path) + '" target="_blank" rel="noopener">preview</a></span></label>'; }).join('') || '<p class="small muted">Nothing matches.</p>';
        t.querySelectorAll('[data-p]').forEach(function (b) { b.onchange = function () { var p = b.getAttribute('data-p'); b.disabled = true;
          (b.checked ? S.db.from('class_materials').insert({ class_id: c.id, path: p, added_by: ME.user.id, sort: Object.keys(have).length }) : S.db.from('class_materials').delete().eq('class_id', c.id).eq('path', p)).then(function (r) {
            b.disabled = false; if (r.error) { b.checked = !b.checked; return alert(S.nice(r.error)); } if (b.checked) have[p] = 1; else delete have[p]; }); }; });
      };
      t.querySelector('#msub').onchange = list; t.querySelector('#mq').oninput = list; t.querySelector('#monly').onchange = list; list();
    });
  }
  function quizzes(t, c) {
    t.innerHTML = '<p class="small muted">Loading…</p>';
    Promise.all([S.db.from('quizzes').select('id,title,category,time_limit_minutes,max_attempts').eq('published', true).order('title'), S.db.from('quiz_classes').select('quiz_id').eq('class_id', c.id)]).then(function (x) {
      var all = x[0].data || [], set = {}; (x[1].data || []).forEach(function (q) { set[q.quiz_id] = 1; });
      t.innerHTML = '<p class="small">Tick a quiz to set it for this class. Students find it in the Quiz centre; it is marked automatically.</p><label class="f">Search<input id="qq" placeholder="quiz title"></label><div id="ql"></div>';
      var list = function () { var q = t.querySelector('#qq').value.trim().toLowerCase();
        t.querySelector('#ql').innerHTML = all.filter(function (z) { return !q || z.title.toLowerCase().indexOf(q) >= 0; }).slice(0, 300).map(function (z) {
          return '<label class="chk" style="display:flex;gap:8px"><input type="checkbox" data-q="' + E(z.id) + '"' + (set[z.id] ? ' checked' : '') + '><span>' + E(z.title) + ' <span class="small muted">' + E(z.category || 'quiz') + (z.time_limit_minutes ? ' · ' + z.time_limit_minutes + ' min' : '') + '</span></span></label>'; }).join('') || '<p class="small muted">No quizzes found.</p>';
        t.querySelectorAll('[data-q]').forEach(function (b) { b.onchange = function () { var id = b.getAttribute('data-q'); b.disabled = true;
          (b.checked ? S.db.from('quiz_classes').insert({ quiz_id: id, class_id: c.id }) : S.db.from('quiz_classes').delete().eq('quiz_id', id).eq('class_id', c.id)).then(function (r) {
            b.disabled = false; if (r.error) { b.checked = !b.checked; return alert(S.nice(r.error)); } if (b.checked) set[id] = 1; else delete set[id]; }); }; });
      };
      t.querySelector('#qq').oninput = list; list();
    });
  }
  function results(t, c) {
    t.innerHTML = '<p class="small muted">Loading…</p>';
    Promise.all([S.db.from('enrolments').select('student_id').eq('class_id', c.id).eq('status', 'approved'), S.db.from('quiz_classes').select('quiz_id, quizzes(title)').eq('class_id', c.id)]).then(function (x) {
      var ids = (x[0].data || []).map(function (e) { return e.student_id; }), qz = x[1].data || [];
      if (!ids.length) { t.innerHTML = '<p class="small muted">No students yet.</p>'; return; }
      if (!qz.length) { t.innerHTML = '<p class="small muted">Set a quiz for this class to see results here.</p>'; return; }
      return Promise.all([names(ids), S.db.from('quiz_attempts').select('quiz_id,student_id,status,score,max_score,submitted_at').in('student_id', ids).in('quiz_id', qz.map(function (q) { return q.quiz_id; }))]).then(function (y) {
        var nm = y[0], at = y[1].data || [];
        var best = function (s, q) { var a = at.filter(function (z) { return z.student_id === s && z.quiz_id === q && z.status !== 'in_progress'; }); if (!a.length) return '–';
          var b = a.reduce(function (m, z) { return (+z.score || 0) > (+m.score || 0) ? z : m; }); return b.score == null ? 'marking' : E(b.score) + '/' + E(b.max_score); };
        t.innerHTML = '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Student</th>' + qz.map(function (q) { return '<th>' + E(q.quizzes ? q.quizzes.title : 'Quiz') + '</th>'; }).join('') + '</tr></thead><tbody>' +
          ids.map(function (s) { return '<tr><td>' + E(nm[s] || 'Student') + '</td>' + qz.map(function (q) { return '<td>' + best(s, q.quiz_id) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      });
    });
  }
})();
