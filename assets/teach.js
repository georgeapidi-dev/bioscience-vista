/* Learnova · teacher portal for teachers from other schools and private tutors.
   A teacher sees only their own classes and students. They add Learnova lessons and published quizzes to their classes;
   they cannot change anything on the main site (enforced by the database, migration 022). */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME, CLASSES = [], HELP = [], CUR = null, CAT = null, COURSES = null;
  S.guard(app, { allowPending: true, school: true }).then(function (me) {
    ME = me;
    var boss = !!me.admin;   // the site admin teaches here like any teacher (own classes, separate from the main site)
    if (!me.school && !boss) { app.innerHTML = '<section class="panel"><h2>Teachers only</h2><p>This page is for teacher accounts. <a href="/dashboard/">Go to your dashboard</a>.</p></section>'; return; }
    var a = me.access || {}, st = me.profile.teacher_status;
    var top = '<div class="row2"><div><p class="label">' + (boss ? 'My classes' : 'Teacher portal') + '</p><h2>Hello, ' + E((me.profile.full_name || '').split(' ')[0] || 'teacher') + '</h2><p class="muted small">🏫 <b id="myschool">' + E(me.profile.school_name || 'No school set') + '</b> <button type="button" class="btn sm" id="chs">Change school</button> · ' + E(me.user.email) + '</p></div>' +
      '<div class="cta"><a class="btn sm" href="/messages/">Messages</a><a class="btn sm" href="/premium/">Premium</a><button class="btn sm" type="button" id="so">Log out</button></div></div>';
    if (!boss && (st !== 'approved' || me.roles.indexOf('school_teacher') < 0)) { app.innerHTML = top + '<section class="panel tint"><h3>' + (st === 'rejected' ? 'Your teacher account was not approved' : '⏳ Waiting for approval') + '</h3><p>' + (st === 'rejected' ? 'Contact the Learnova admin through Messages if you think this is a mistake.' : 'The Learnova admin checks every new teacher account. You can buy premium now; your classes open as soon as you are approved.') + '</p></section>'; app.querySelector('#so').onclick = S.signOut; return; }
    if (!boss && !a.premium) { app.innerHTML = top + '<section class="panel tint"><h3>Premium is needed to run classes</h3><p>Your teacher account is approved. Get premium to create classes, add Learnova lessons and quizzes, and see your students\' results.</p><a class="btn main" href="/premium/">Get premium</a></section>'; app.querySelector('#so').onclick = S.signOut; return; }
    app.innerHTML = top + '<div id="tp"></div>'; app.querySelector('#so').onclick = S.signOut;
    app.querySelector('#chs').onclick = changeSchool;
    load(); if (!boss) review();
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  // one shared list of schools, so every teacher at a school appears under the same name
  function changeSchool() {
    S.db.from('schools').select('name').order('name').then(function (r) {
      var box = document.createElement('div'); box.className = 'panel tint grp';
      box.innerHTML = '<label class="f">Your school (choose from the list, or type a new one)<input id="scn" list="scl" maxlength="120" value="' + E(ME.profile.school_name || '') + '"><datalist id="scl">' + (r.data || []).map(function (x) { return '<option value="' + E(x.name) + '">'; }).join('') + '</datalist></label>' +
        '<div class="cta"><button class="btn main sm" id="scs">Save</button><button class="btn sm" id="scx">Cancel</button></div><p class="msg" id="scm"></p>';
      app.querySelector('#tp').before(box);
      box.querySelector('#scx').onclick = function () { box.remove(); };
      box.querySelector('#scs').onclick = function () { S.db.rpc('set_my_school', { nm: box.querySelector('#scn').value }).then(function (x) {
        if (x.error) { box.querySelector('#scm').textContent = S.nice(x.error); return; } ME.profile.school_name = x.data; app.querySelector('#myschool').textContent = x.data; box.remove(); load(true); }); };
    });
  }
  function review() {
    var sec = document.createElement('section'); sec.className = 'panel'; app.appendChild(sec);
    S.db.from('reviews').select('rating,body,status').eq('user_id', ME.user.id).maybeSingle().then(function (r) {
      var mine = r.data;
      sec.innerHTML = '<h3>⭐ Review Learnova</h3><p class="small muted">' + (mine ? 'Your review is ' + (mine.status === 'approved' ? 'published' : 'waiting for approval') + '. You can change it.' : 'Tell other teachers how Learnova helps your classes. Reviews appear on the home page after a check.') + '</p>' +
        '<form id="rvf" class="grp"><select id="rvs">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (mine && mine.rating === n ? ' selected' : '') + '>' + '★'.repeat(n) + '</option>'; }).join('') + '</select>' +
        '<textarea id="rvt" maxlength="600" rows="3" placeholder="What works well for you and your students?">' + E(mine ? mine.body : '') + '</textarea><label class="chk"><input type="checkbox" id="rvn" checked> Show my full name</label><button class="btn main sm">Send review</button><p class="msg" id="rvm"></p></form>';
      sec.querySelector('#rvf').onsubmit = function (e) { e.preventDefault(); var m = sec.querySelector('#rvm');
        S.db.rpc('submit_review', { stars: +sec.querySelector('#rvs').value, words: sec.querySelector('#rvt').value, show_full_name: sec.querySelector('#rvn').checked }).then(function (x) {
          if (x.error) { m.textContent = S.nice(x.error); return; } m.className = 'msg ok'; m.textContent = 'Thank you! It will appear after a quick check.'; }); };
    });
  }
  function courses() { return COURSES ? Promise.resolve(COURSES) : S.db.rpc('course_list').then(function (r) { COURSES = r.data || []; return COURSES; }); }
  function load(keep) {
    Promise.all([S.db.from('classes').select('*').eq('teacher_id', ME.user.id).neq('owner_kind', 'main').order('created_at'), S.db.rpc('my_cotaught')]).then(function (x) {
      var r = x[0]; HELP = (x[1].data || []).map(function (c) { c.ro = true; return c; });
      CLASSES = (r.data || []).filter(function (c) { return !c.archived_at; });
      var all = CLASSES.concat(HELP);
      if (!keep || !all.some(function (c) { return c.id === (CUR && CUR.id); })) CUR = all[0] || null;
      else CUR = all.filter(function (c) { return c.id === CUR.id; })[0];
      draw();
    });
  }
  function draw() {
    var tp = app.querySelector('#tp');
    tp.innerHTML = '<section class="panel grp"><div class="row2"><h3 style="margin:0">🏫 My classes</h3><button class="btn main sm" type="button" id="newc">＋ New class</button></div>' +
      (CLASSES.length ? '<div class="cta">' + CLASSES.map(function (c) { return '<button type="button" class="btn sm' + (CUR && c.id === CUR.id ? ' main' : '') + '" data-c="' + E(c.id) + '">' + E(c.name) + (c.active ? '' : ' (closed)') + '</button>'; }).join('') + '</div>' : '<p class="small">No classes yet. Create your first class.</p>') +
      (HELP.length ? '<p class="label" style="margin-top:10px">Classes I help with (view only)</p><div class="cta">' + HELP.map(function (c) { return '<button type="button" class="btn sm' + (CUR && c.id === CUR.id ? ' main' : '') + '" data-c="' + E(c.id) + '">🤝 ' + E(c.name) + '</button>'; }).join('') + '</div>' : '') +
      '<div id="newbox"></div></section><div id="cbox"></div>';
    tp.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { CUR = CLASSES.concat(HELP).filter(function (c) { return c.id === b.getAttribute('data-c'); })[0]; TAB = 'students'; draw(); }; });
    tp.querySelector('#newc').onclick = function () { classForm(tp.querySelector('#newbox'), null); };
    if (CUR) classView(tp.querySelector('#cbox'));
  }
  function classForm(box, c) { courses().then(function (cs) { classForm2(box, c, cs); }); }
  function classForm2(box, c, cs) {
    box.innerHTML = '<form class="grp" id="cf" style="margin-top:10px"><label class="f">What do you teach in this class?<select id="cc" required><option value="">Choose the course…</option>' +
      cs.map(function (k) { return '<option value="' + E(k.slug) + '"' + (c && c.course === k.slug ? ' selected' : '') + '>' + E(k.name) + ' (' + k.lessons + ' lessons' + (k.quizzes ? ', ' + k.quizzes + ' quizzes' : '') + ')</option>'; }).join('') + '</select></label>' +
      '<p class="small muted">The course\'s Learnova lessons and quizzes are added to the class automatically. You can untick any you don\'t need on the Lessons and Quizzes tabs.</p>' +
      '<label class="f">Class name (students search for it)<input id="cn" required maxlength="80" value="' + E(c ? c.name : '') + '" placeholder="e.g. DP1 Biology HL 2026"></label>' +
      '<label class="f">Short description (optional)<input id="cd" maxlength="160" value="' + E(c && c.description || '') + '"></label>' +
      '<label class="chk"><input type="checkbox" id="cli"' + (!c || c.listed ? ' checked' : '') + '> Students can find this class and ask to join</label>' +
      '<div class="cta"><button class="btn main sm" type="submit">' + (c ? 'Save' : 'Create class') + '</button>' + (c ? '<button class="btn sm" type="button" id="carch">' + (c.active ? 'Close class' : 'Reopen class') + '</button>' : '') + '</div><p class="msg" id="cm"></p></form>';
    box.querySelector('#cf').onsubmit = function (e) { e.preventDefault(); var m = box.querySelector('#cm'), course = box.querySelector('#cc').value;
      var row = { name: box.querySelector('#cn').value.trim(), description: box.querySelector('#cd').value.trim() || null, listed: box.querySelector('#cli').checked };
      if (!course) { m.textContent = 'Choose the course you teach.'; return; }
      if (row.name.length < 3) { m.textContent = 'Give the class a name.'; return; }
      m.className = 'msg'; m.textContent = 'Saving…';
      if (!c) return S.db.rpc('create_school_class', { nm: row.name, course_slug: course, descr: row.description, is_listed: row.listed }).then(function (r) {
        if (r.error) { m.textContent = S.nice(r.error); return; } CUR = { id: r.data }; TAB = 'materials'; load(true); });
      S.db.from('classes').update(row).eq('id', c.id).then(function (r) { if (r.error) { m.textContent = S.nice(r.error); return; }
        return S.db.rpc('set_class_course', { cid: c.id, course_slug: course }).then(function (x) { if (x.error) { m.textContent = S.nice(x.error); return; } load(true); }); }); };
    var ar = box.querySelector('#carch'); if (ar) ar.onclick = function () { S.db.from('classes').update({ active: !c.active }).eq('id', c.id).then(function (r) { if (r.error) return alert(S.nice(r.error)); load(true); }); };
  }
  var TAB = 'students';
  function classView(box) {
    var c = CUR;
    var tabs = [['students', '👥 Students'], ['materials', '📘 Lessons'], ['quizzes', '📝 Quizzes'], ['results', '📊 Results']];
    if (!c.ro) tabs.push(['team', '🤝 Co-teachers']);
    box.innerHTML = '<section class="panel grp"><div class="row2"><div><h3 style="margin:0">' + E(c.name) + (c.ro ? ' <span class="pill">view only</span>' : '') + '</h3><p class="small muted">' + E([c.subject, c.level].filter(Boolean).join(' · ')) +
      (c.ro ? ' · class teacher: ' + E(c.owner || 'another teacher') : c.listed ? ' · students find it under <b>' + E(c.school_name || ME.profile.school_name || 'your name') + '</b>' : ' · hidden from the join list') + '</p></div>' +
      (c.ro ? '' : '<span class="cta"><button class="btn sm" type="button" id="sync" title="Add any new Learnova lessons and quizzes for this course">⟳ Add new course lessons</button><button class="btn sm" type="button" id="edc">Edit</button></span>') + '</div><div id="edbox"></div>' +
      '<div class="cta" role="tablist">' + tabs.map(function (t) { return '<button type="button" class="btn sm' + (TAB === t[0] ? ' main' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="tab"></div></section>';
    if (!c.ro) {
      box.querySelector('#edc').onclick = function () { classForm(box.querySelector('#edbox'), c); };
      box.querySelector('#sync').onclick = function () { var b = this; b.disabled = true; S.db.rpc('set_class_course', { cid: c.id, course_slug: null }).then(function (x) { b.disabled = false; if (x.error) return alert(S.nice(x.error));
        alert(c.course ? 'Added ' + x.data.lessons + ' new lessons and ' + x.data.quizzes + ' new quizzes.' : 'Choose the course first: press Edit.'); CAT = null; classView(box); }); };
    }
    box.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { TAB = b.getAttribute('data-t'); classView(box); }; });
    ({ students: students, materials: materials, quizzes: quizzes, results: results, team: team })[TAB](box.querySelector('#tab'), c);
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
        if (c.ro) { t.innerHTML = '<h4>Students in this class (' + ok.length + ')</h4>' + (ok.length ? ok.map(function (e) { return '<p>' + E(nm[e.student_id] || 'Student') + '</p>'; }).join('') : '<p class="small muted">None yet.</p>'); return; }
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
      if (c.ro) { var last0 = ''; t.innerHTML = '<p class="small muted">Lessons in this class (view only).</p>' + (CAT.filter(function (m) { return have[m.path]; }).map(function (m) { var u = m.subject + ' · ' + (m.unit || ''), hd = u !== last0 ? '<p class="label" style="margin-top:10px">' + E(u) + '</p>' : ''; last0 = u;
        return hd + '<p>📘 <a href="' + E(m.path) + '" target="_blank" rel="noopener">' + E(m.title) + '</a></p>'; }).join('') || '<p class="small muted">No lessons yet.</p>'); return; }
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
    Promise.all([S.db.from('quizzes').select('id,title,category,time_limit_minutes,max_attempts').eq('published', true).order('title'),
      S.db.from('quiz_classes').select('quiz_id,published, quizzes(id,title,category,time_limit_minutes,max_attempts)').eq('class_id', c.id)]).then(function (x) {
      var cat = x[0].data || [], links = x[1].data || [], set = {}, byId = {};
      links.forEach(function (r) { set[r.quiz_id] = r.published ? 'live' : 'wait'; if (r.quizzes) byId[r.quiz_id] = r.quizzes; });
      cat.forEach(function (z) { byId[z.id] = byId[z.id] || z; });
      var all = Object.keys(byId).map(function (k) { return byId[k]; }).sort(function (a, b) { return (set[b.id] ? 1 : 0) - (set[a.id] ? 1 : 0) || a.title.localeCompare(b.title); });
      if (c.ro) { t.innerHTML = '<p class="small muted">Quizzes for this class (view only).</p>' + (all.filter(function (z) { return set[z.id]; }).map(function (z) { return '<p>📝 ' + E(z.title) + ' <span class="small muted">' + (set[z.id] === 'live' ? 'published' : 'not published yet') + '</span></p>'; }).join('') || '<p class="small muted">No quizzes yet.</p>'); return; }
      var nWait = all.filter(function (z) { return set[z.id] === 'wait'; }).length;
      t.innerHTML = '<p class="small">Quizzes for your course are already linked to this class. Students see a quiz only after you press <b>Publish</b>. ' +
        (nWait ? '<b>' + nWait + ' quiz' + (nWait === 1 ? '' : 'zes') + ' waiting for you to publish.</b>' : '') + '</p><label class="f">Search<input id="qq" placeholder="quiz title"></label><div id="ql"></div>';
      var list = function () { var q = t.querySelector('#qq').value.trim().toLowerCase();
        t.querySelector('#ql').innerHTML = all.filter(function (z) { return !q || z.title.toLowerCase().indexOf(q) >= 0; }).slice(0, 300).map(function (z) {
          var st = set[z.id];
          return '<div class="row2" style="justify-content:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><span style="flex:1">📝 ' + E(z.title) + ' <span class="small muted">' + E(z.category || 'quiz') + (z.time_limit_minutes ? ' · ' + z.time_limit_minutes + ' min' : '') + '</span>' +
            (st === 'live' ? ' <span class="pill ok">Published</span>' : st === 'wait' ? ' <span class="pill">Not published</span>' : '') + '</span>' +
            (st === 'live' ? '<button type="button" class="btn sm" data-p="' + E(z.id) + '" data-on="0">⏸ Unpublish</button>' : '<button type="button" class="btn sm main" data-p="' + E(z.id) + '" data-on="1">📢 Publish</button>') +
            (st ? '<button type="button" class="btn sm" data-rm="' + E(z.id) + '" title="Remove from this class">✕</button>' : '') + '</div>'; }).join('') || '<p class="small muted">No quizzes found.</p>';
        t.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-p'), on = b.getAttribute('data-on') === '1'; b.disabled = true;
          S.db.rpc('set_quiz_published', { qid: id, cid: c.id, on_off: on }).then(function (r) { b.disabled = false; if (r.error) return alert(S.nice(r.error)); set[id] = on ? 'live' : 'wait'; list(); }); }; });
        t.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-rm'); b.disabled = true;
          S.db.from('quiz_classes').delete().eq('quiz_id', id).eq('class_id', c.id).then(function (r) { b.disabled = false; if (r.error) return alert(S.nice(r.error)); delete set[id]; list(); }); }; });
      };
      t.querySelector('#qq').oninput = list; list();
    });
  }

  // colleagues who can view this class (they cannot change anything)
  function team(t, c) {
    t.innerHTML = '<p class="small muted">Loading…</p>';
    S.db.rpc('class_coteachers', { cid: c.id }).then(function (r) {
      var rows = r.data || [];
      t.innerHTML = '<p class="small">Add a colleague who also teaches this class. They can <b>see</b> the class, its students, lessons, quizzes and results, but cannot add or remove anything. They need an approved Learnova teacher account with premium.</p>' +
        (rows.length ? rows.map(function (x) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>🤝 <b>' + E(x.full_name || 'Teacher') + '</b> <span class="small muted">' + E(x.school || '') + '</span></span><button class="btn sm" data-rm="' + E(x.teacher_id) + '">Remove</button></div>'; }).join('') : '<p class="small muted">No co-teachers yet.</p>') +
        '<form id="cof" class="row2" style="margin-top:10px"><input id="coe" type="email" required placeholder="Colleague\'s email (their Learnova teacher account)" style="flex:1"><button class="btn main sm" type="submit">Add co-teacher</button></form><p class="msg" id="com"></p>';
      t.querySelector('#cof').onsubmit = function (e) { e.preventDefault(); var m = t.querySelector('#com');
        S.db.rpc('add_coteacher', { cid: c.id, teacher_email: t.querySelector('#coe').value }).then(function (x) { if (x.error) { m.textContent = S.nice(x.error); return; } team(t, c); }); };
      t.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this co-teacher?')) return;
        S.db.rpc('remove_coteacher', { cid: c.id, tid: b.getAttribute('data-rm') }).then(function (x) { if (x.error) return alert(S.nice(x.error)); team(t, c); }); }; });
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
