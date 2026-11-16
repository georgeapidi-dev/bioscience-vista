/* Student dashboard · BioscienceVista */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  /* Admin only: /dashboard/?as=<student id> shows that student's dashboard as they see it, view only.
     The database already lets the admin read a student's results (can_view_student); buttons that would act for the student are switched off. */
  var VIEW = null;
  S.guard(app, { allowPending: true }).then(function (me0) {
    /* Teachers and the admin: /dashboard/?preview=<class id> shows the dashboard a student of that class sees, view only (nothing is saved for a student). */
    var pv = new URLSearchParams(location.search).get('preview');
    if (pv && (me0.staff || me0.school || (me0.roles || []).indexOf('teacher') >= 0)) return S.db.from('classes').select('id,name,programme,level,subject').eq('id', pv).maybeSingle().then(function (r) {
      var c = r.data; if (!c) throw new Error('That class was not found, or it is not one of yours.');
      var from = new URLSearchParams(location.search).get('from') === 'staff' ? '/staff/' : '/teach/';
      VIEW = { id: me0.user.id, name: 'a student in ' + c.name };
      var bar = document.createElement('div'); bar.className = 'panel tint row2'; bar.id = 'viewbar'; bar.setAttribute('role', 'status');
      bar.innerHTML = '<span>🎒 <b>Student preview.</b> This is the dashboard a student in <b>' + E(c.name) + '</b> sees. It is view only: nothing you click here is saved as a student.</span><span class="cta"><span class="small" id="viewmsg"></span><a class="btn sm" href="' + from + '">↩ Back to the ' + (from === '/staff/' ? 'admin' : 'teacher') + ' view</a></span>';
      app.before(bar);
      var block = '[data-done],[data-join],[data-leave],[data-retry],#addc,#joinbox,#pf,#rvf,#aip,#so';
      ['click', 'submit'].forEach(function (ev) { app.addEventListener(ev, function (e) { var t = e.target && e.target.closest ? e.target.closest(block) : null; if (!t) return; e.preventDefault(); e.stopPropagation(); bar.querySelector('#viewmsg').textContent = 'Not available in the student preview.'; }, true); });
      var cls = [{ id: c.id, name: c.name, programme: c.programme, status: 'approved' }];
      return { user: { id: me0.user.id, email: '' }, profile: { full_name: 'Student preview', approved: true, class_id: c.id }, roles: ['student'], staff: false, admin: false, ok: true, view: true, preview: true, access: { premium: true, classes: cls }, classes: cls };
    });
    var asId = new URLSearchParams(location.search).get('as');
    if (!asId || !me0.admin) return me0;
    return Promise.all([S.db.from('profiles').select('*').eq('id', asId).maybeSingle(),
      S.db.from('enrolments').select('class_id,status,classes(id,name,programme)').eq('student_id', asId)]).then(function (x) {
      var p = x[0].data; if (!p) throw new Error('This student was not found.');
      var cls = (x[1].data || []).filter(function (e) { return e.classes; }).map(function (e) { return { id: e.classes.id, name: e.classes.name, programme: e.classes.programme, status: e.status }; });
      var more = p.class_id && !cls.some(function (c) { return c.id === p.class_id; }) ? S.db.from('classes').select('id,name,programme').eq('id', p.class_id).maybeSingle() : Promise.resolve({});
      return more.then(function (m) {
        if (m && m.data) cls.push({ id: m.data.id, name: m.data.name, programme: m.data.programme, status: 'approved' });
        VIEW = { id: asId, name: p.full_name || 'Student' };
        var bar = document.createElement('div'); bar.className = 'panel tint row2'; bar.id = 'viewbar'; bar.setAttribute('role', 'status');
        bar.innerHTML = '<span>👁 <b>Admin view.</b> This is <b>' + E(VIEW.name) + '</b>\'s dashboard as they see it. It is view only: nothing here changes their work. Their to-do list is not shown in this view.</span><span class="cta"><span class="small" id="viewmsg"></span><a class="btn sm" href="/admin/#members">← Back to Admin</a></span>';
        app.before(bar);
        var block = '[data-done],[data-join],[data-leave],[data-retry],#addc,#joinbox,#pf,#rvf,#aip,#so';
        ['click', 'submit'].forEach(function (ev) { app.addEventListener(ev, function (e) { var t = e.target && e.target.closest ? e.target.closest(block) : null; if (!t) return; e.preventDefault(); e.stopPropagation(); bar.querySelector('#viewmsg').textContent = 'View only: that button works for the student, not here.'; }, true); });
        return { user: { id: asId, email: p.email || '' }, profile: p, roles: ['student'], staff: false, admin: false, ok: true, view: true, access: { premium: true, classes: cls }, classes: cls.filter(function (c) { return c.status === 'approved'; }) };
      });
    });
  }).then(function (me) {
    var md = (me.user && me.user.user_metadata) || {}, tried = false; try { tried = sessionStorage.getItem('bv-courses-tried') === '1'; } catch (e) {}
    if (!me.view && !me.staff && md.learner === 'independent' && md.courses && md.courses.length && !md.courses_applied && !tried) {
      var SELF = { 'grade-6': '8088c43e-df14-450b-96bf-be2a3d22ddc3', 'grade-7': 'ffae26ae-0729-45ff-a74d-d00a6a175c5d', 'grade-8': '0a9ddb8d-fd87-4d87-a8a6-af930adeda5e', 'grade-9': 'd3035007-4aff-4e81-897b-98fee264c440', 'grade-10': '555803ba-f054-47e5-88c0-9f7e8bf7b980',
        'bio-sl': 'def0764f-1b4b-4677-986a-7951a3a8bcc8', 'bio-hl': '4a8bc687-91c0-4a7f-bf50-4e6cd7c4c005', 'chem-sl': 'afcd66af-408f-414b-957f-fc5714573943', 'chem-hl': 'df1516ec-1dae-42ab-821c-d5d0bf01a884', 'phys-sl': '8e63926a-5ba1-4d5b-8888-7e2ec7693830', 'phys-hl': 'f233a3aa-de4e-4c49-a62f-9bff3c895343',
        'ess-sl': '0d843ca5-1e56-4b69-8c6e-493a60460f28', 'ess-hl': '8e664688-9126-436e-9a3d-76ce1591b904', 'maths-aa-sl': '65e0e834-5b20-47da-a599-2c55fdc9ecb1', 'maths-aa-hl': '95523f71-74cd-44fb-a91c-631622f5baa8', 'maths-ai-sl': '0db2a462-8905-4fbe-b88c-b46c66adf9b6', 'maths-ai-hl': '47038381-beac-45de-964c-12f7ef764d08',
        'igcse-bio': '2374096e-b1db-4d43-bf80-312ad2975e00', 'igcse-chem': 'ae72a63f-16ab-4d7a-b508-5a832f5a0f13', 'alevel-bio': '22a62d37-9d0d-48ae-b7fa-e51fcc99a49b', 'alevel-chem': '13524323-f56c-499d-972c-8f9bc07cc4b1',
        'alevel-chem-as': 'aa2a9b6f-86a1-5fef-b41e-371a38acef7e', 'alevel-chem-a2': '3d0c6bd5-8c86-51eb-94d1-2f7da875f738', 'alevel-bio-as': 'e7e33efc-aa0d-5519-b6f0-377eac0cce72', 'alevel-bio-a2': '6cfe1147-4e25-5140-8e86-2ccf5a0dc64d',
        'igcse-bio-core': 'b4412ae4-623a-5b9a-b674-32f76f0dd6de', 'igcse-bio-ext': 'a3cd0f9d-9bad-53ec-810f-020824fa6223', 'igcse-chem-core': '6f614fa4-f4aa-5761-9d01-ac8826f8cf6d', 'igcse-chem-ext': '7e4e0f52-a837-54da-b5de-2a176f39fdb7',
        'igcse-phys-core': '8a64f0db-8603-5b2a-bd21-eff2a432859c', 'igcse-phys-ext': 'f8485b9d-0142-590f-a1fd-09b4529f107a' };   // Independent learners class of each course
      try { sessionStorage.setItem('bv-courses-tried', '1'); } catch (e) {}
      app.innerHTML = '<p class="muted">Setting up your courses…</p>';
      return md.courses.filter(function (c) { return SELF[c]; }).reduce(function (p, c) { return p.then(function () { return S.db.rpc('request_join', { cid: SELF[c] }).then(function (x) {
          var base = c.replace(/-(as|a2|core|ext)$/, ''); if (x && x.error && base !== c && SELF[base]) return S.db.rpc('request_join', { cid: SELF[base] }).then(function () {}, function () {});   // a level class that is not open yet: the whole-course class
        }, function () {}); }); }, Promise.resolve())
        .then(function () { return S.db.auth.updateUser({ data: { courses_applied: true } }); }).then(function () { location.reload(); }, function () { location.reload(); });
    }
    if (me.staff && !new URLSearchParams(location.search).get('student')) { location.href = '/staff/'; return; }
    if (!me.ok) { app.innerHTML = '<div class="row2"><div><p class="label">My dashboard</p><h2>Hello, ' + E((me.profile.full_name || 'there').split(' ')[0]) + ' 👋</h2><p class="muted small">' + E(me.user.email) + '</p></div><div class="cta"><button class="btn sm" type="button" id="so">Log out</button></div></div><div id="mycl"></div>';
      app.querySelector('#so').onclick = S.signOut; classesPanel(me, app.querySelector('#mycl')); return; }
    return Promise.all([
      S.db.from('student_results').select('*').eq('student_id', me.user.id).order('recorded_at', { ascending: false }),
      S.db.from('learning_progress').select('*, lessons(title,url)').eq('student_id', me.user.id).order('updated_at', { ascending: false }),
      me.view ? S.db.from('quizzes').select('id,title,due_at,opens_at,time_limit_minutes,max_attempts,category,quiz_classes(class_id)').eq('published', true).then(function (r) { var ids = me.classes.map(function (c) { return c.id; });
          return { data: (r.data || []).filter(function (q) { return (q.quiz_classes || []).some(function (k) { return ids.indexOf(k.class_id) >= 0; }); }) }; })   // the admin can read every quiz, so keep only those set for this student's classes
        : (function (q) { return (me.roles || []).some(function (r) { return r === 'admin' || r === 'teacher'; }) ? q.eq('published', true) : q; })(S.db.from('quizzes').select('id,title,due_at,opens_at,time_limit_minutes,max_attempts,category')),   // students: quizzes published for their classes (per class, migration 025)
      S.db.from('quiz_attempts').select('quiz_id,status,score,max_score,submitted_at').eq('student_id', me.user.id),
      me.view ? Promise.resolve({ data: [] }) : S.db.rpc('my_todo').then(function (r) { return r; }, function () { return { data: [] }; })
    ]).then(function (x) {
      // Grade 6 to 10 science: every result, lesson and question set is shown under its own subject (Biology, Chemistry or Physics).
      // The subject comes from the set itself (migration 036) or from the topic the lesson or set belongs to.
      if (!(me.classes || []).some(BV.subj.isMyp)) return draw(me, x[0].data || [], x[1].data || [], x[2].data || [], x[3].data || [], x[4].data || []);
      var res = x[0].data || [], prog = x[1].data || [];
      return S.subjectLookup(res.map(function (r) { return r.lesson_id; }).concat(prog.map(function (p) { return p.lesson_id; })), res.map(function (r) { return r.quiz_id; }).concat((x[2].data || []).map(function (q) { return q.id; }))).then(function (look) {
        SUBJ = look;
        draw(me, res, prog, x[2].data || [], x[3].data || [], x[4].data || []);
      });
    });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  // My classes, joining a class (school or teacher first, then the class; no codes) and premium access
  /* Missed and unfinished tasks (migration 037). The same list is sent once as a message; here it stays until the task is done. */
  function reminders(box) {
    if (!box) return;
    S.db.rpc('my_reminders').then(function (r) {
      var items = !r.error && Array.isArray(r.data) ? r.data : []; if (!items.length) return;
      var missed = items.filter(function (t) { return t.reason === 'missed'; }).length, open = items.length - missed;
      box.innerHTML = '<section class="panel" role="status" style="border-left:6px solid #f59e0b;background:linear-gradient(120deg,#fffbeb,#fff7ed);color:#431407"><h3 style="margin-top:0">⏰ Reminder: ' +
        [missed ? missed + ' missed task' + (missed === 1 ? '' : 's') : '', open ? open + ' task' + (open === 1 ? '' : 's') + ' not finished' : ''].filter(Boolean).join(' and ') + '</h3>' +
        items.slice(0, 8).map(function (t) {
          return '<p style="margin:6px 0">' + (t.reason === 'missed' ? '<span class="pill" style="background:#fee2e2;color:#991b1b">Missed</span> ' : '<span class="pill" style="background:#fef3c7;color:#92400e">Not finished</span> ') +
            (t.url ? '<a href="' + E(t.url) + '"><b>' + E(t.title) + '</b></a>' : '<b>' + E(t.title) + '</b>') + (t.due_at ? ' <span class="small">was due ' + E(S.when(t.due_at)) + '</span>' : '') +
            (t.url ? ' <a class="btn sm main" href="' + E(t.url) + '" style="margin-left:6px">' + (t.reason === 'missed' ? 'Do it now' : 'Carry on') + '</a>' : '') + '</p>'; }).join('') +
        (items.length > 8 ? '<p class="small">and ' + (items.length - 8) + ' more.</p>' : '') + '<p class="small" style="margin-bottom:0">Your work so far is saved. Each task has a timer that starts when you open it.</p></section>';
    }, function () {});
  }
  function classesPanel(me, box) {
    var a = me.access || {}, mine = a.classes || [];
    var link = function (c) { return c.slug ? '/' + c.slug + '/' : '/class/?id=' + c.id; };
    var st = { approved: '<span class="pill ok">✓ Approved</span>', pending: '<span class="pill t">⏳ Waiting for the teacher</span>', teacher_ok: '<span class="pill t">⏳ Teacher said yes · waiting for BioscienceVista</span>', rejected: '<span class="pill">Not accepted</span>' };
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
        var list = r.data || [], schools = [], joined = false;
        list.forEach(function (c) { if (schools.indexOf(c.school) < 0) schools.push(c.school); });
        var IND = function (n) { return /Independent learners/.test(n); };
        schools.sort(function (x, y) { return (IND(y) - IND(x)) || x.localeCompare(y); });   // Independent learners first, then the teachers by school
        /* the course of a class, by the name on the course list (class_directory gives it after migration 034; before that subject and level) */
        var course = function (c) { var sj = c.subject || '', lv = c.level || ''; return sj ? (lv && sj.indexOf(lv) < 0 ? sj + ' ' + lv : sj) : c.name; };
        jb.innerHTML = '<p class="small" style="margin-top:10px">Learning on your own? Choose <b>BioscienceVista · Independent learners</b>: you are in straight away and can join <b>more than one course</b>. In a teacher\'s class? Choose your teacher, then your course.</p>' +
          '<div class="grp"><label class="f">1. Your teacher<select id="jsch"><option value="">Choose…</option>' + schools.map(function (s) { return '<option>' + E(s) + '</option>'; }).join('') + '</select></label>' +
          '<label class="f">Or search by course, teacher or class name<input id="jq" placeholder="e.g. Biology HL"></label><div id="jlist"></div><p class="msg" id="jm" role="alert"></p></div>';
        var draw = function () {
          var sch = jb.querySelector('#jsch').value, q = jb.querySelector('#jq').value.trim().toLowerCase();
          var show = list.filter(function (c) { return (!sch || c.school === sch) && (!q || (c.name + ' ' + course(c) + ' ' + c.school).toLowerCase().indexOf(q) >= 0); });
          jb.querySelector('#jlist').innerHTML = (sch || q) ? (show.length ? '<p class="small"><b>2. Choose your course</b> ' + (sch && IND(sch) ? '(you can join more than one)' : sch ? 'from the courses this teacher offers' : '') + '</p>' + show.map(function (c) {
            var k = course(c), same = k === c.name || c.name.indexOf(k + ' · Independent') === 0;
            return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(k) + '</b> <span class="small muted">' + (same ? '' : E(c.name) + ' · ') + E(c.school) + (c.description && !IND(c.school) ? ' · ' + E(c.description) : '') + '</span></span>' +
              (c.my_status ? (st[c.my_status] || '') : '<button type="button" class="btn main sm" data-join="' + E(c.id) + '">' + (IND(c.school) ? 'Join' : 'Ask to join') + '</button>') + '</div>'; }).join('') +
              (joined ? '<p style="margin-top:10px"><button type="button" class="btn main sm" id="jdone">Done</button></p>' : '') : '<p class="small muted">Nothing matches. Check the name with your teacher.</p>') : '';
          var dn = jb.querySelector('#jdone'); if (dn) dn.onclick = function () { location.reload(); };
          jb.querySelectorAll('[data-join]').forEach(function (b) { b.onclick = function () { b.disabled = true; var m = jb.querySelector('#jm'), id = b.getAttribute('data-join');
            S.db.rpc('request_join', { cid: id }).then(function (x) { if (x.error) { b.disabled = false; m.className = 'msg'; m.textContent = S.nice(x.error); return; }
              list.forEach(function (c) { if (c.id === id) c.my_status = x.data === 'approved' ? 'approved' : (x.data || 'pending'); }); joined = true;
              m.className = 'msg ok'; m.textContent = x.data === 'approved' ? 'You are in. Choose another course if you wish, then press Done.' : 'Request sent. Your teacher will approve it soon. Press Done when you have finished.'; draw(); }); }; });
        };
        jb.querySelector('#jsch').onchange = draw; jb.querySelector('#jq').oninput = draw;
      });
    };
  }
  // Personalised next steps: lessons started but not finished, then the next lessons in each of my classes, in course order
  // every lesson the student has worked on: mark, answers and Try again
  function myLessons(me) {
    var box = app.querySelector('#mylessons'); if (!box) return;
    S.db.rpc('my_lessons').then(function (r) {
      var rows = r.data || [];
      if (!rows.length) { box.innerHTML = '<h3>📘 My interactive lessons</h3><p class="small muted">Lessons you work on appear here with your marks and answers.</p>'; return; }
      var ind = rows[0].independent;
      box.innerHTML = '<h3>📘 My interactive lessons</h3><p class="small muted">' + (ind ? 'As an independent learner, your best mark counts each time you try again.' : 'Your first attempt is the mark your teacher records. You can try again to practise; your new marks show as practice marks.') + '</p>' +
        rows.map(function (l, i) {
          var mark = l.score != null ? E(+l.score) + ' / ' + E(+l.max_score) + (window.BVT && BVT.levelPill ? BVT.levelPill(l.score, l.max_score, (l.url || '').replace(/^\//, '/') ) : '') : '–', more = l.attempts > 1 ? ' · ' + (ind ? 'best' : 'practice') + ': ' + E(+(ind ? l.best_score : l.last_score)) + ' · attempt ' + l.attempts : '';
          return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row2"><span><a href="' + E(l.url) + '"><b>' + E(l.title) + '</b></a><br><span class="small">' + (l.status === 'completed' ? '✓ Finished' : '◐ ' + l.percent + '% done') + ' · <b>Mark: ' + mark + '</b>' + more + '</span></span>' +
            '<span class="cta"><button type="button" class="btn sm" data-ans="' + i + '">My answers</button>' + (l.status === 'completed' ? '<button type="button" class="btn main sm" data-retry="' + i + '">↻ Try again</button>' : '<a class="btn main sm" href="' + E(l.url) + '">Continue</a>') + '</span></div><div id="ans' + i + '" hidden></div></div>';
        }).join('');
      box.querySelectorAll('[data-ans]').forEach(function (b) { b.onclick = function () { var l = rows[+b.getAttribute('data-ans')], el = box.querySelector('#ans' + b.getAttribute('data-ans'));
        if (!el.hidden) { el.hidden = true; return; } el.hidden = false; el.innerHTML = '<p class="small muted">Loading…</p>';
        S.db.from('lesson_work').select('step,answers,saved_at').eq('lesson', l.external_id).eq('student_id', me.user.id).order('saved_at').then(function (x) {
          var last = {}; (x.data || []).forEach(function (w) { last[w.step] = w; });
          el.innerHTML = Object.keys(last).sort(function (a, b) { return a - b; }).map(function (n) {
            var parts = String(last[n].answers || '').replace(/^\[AUTO[^\]]*\]\s*/, '').split(/\s*‖\s*/).filter(function (p) { return p.indexOf(':') > 0 && !/^(Feedback|Table|Format|Confidence|TOTAL|THIS)/i.test(p); });
            var m = /THIS=([\d.]+)\s*\/\s*([\d.]+)/.exec(last[n].answers || '');
            return '<details class="grp"><summary><b>Step ' + E(n) + '</b>' + (m ? ' · ' + E(m[1]) + ' / ' + E(m[2]) : '') + '</summary>' + parts.map(function (p) { var k = p.indexOf(':'); return '<p class="small"><b>' + E(p.slice(0, k)) + ':</b> ' + E(p.slice(k + 1)) + '</p>'; }).join('') + '</details>';
          }).join('') || '<p class="small muted">No saved answers on record.</p>';
        }); }; });
      box.querySelectorAll('[data-retry]').forEach(function (b) { b.onclick = function () { var l = rows[+b.getAttribute('data-retry')];
        if (!confirm(ind ? 'Start this lesson again? Your best mark will count.' : 'Start this lesson again for practice? Your first mark stays on your record.')) return;
        b.disabled = true; S.db.rpc('begin_retry', { lesson_ext_id: l.external_id }).then(function () { location.href = l.url + (l.url.indexOf('?') < 0 ? '?' : '&') + 'retry=1&lid=' + encodeURIComponent(l.external_id); }); }; });
    });
  }
  // a review of BioscienceVista, shown on the home page once the admin approves it
  function reviewBox(me) {
    var sec = document.createElement('section'); sec.className = 'panel'; sec.id = 'review';
    var plan = app.querySelector('#plan'); if (!plan) return; plan.after(sec);
    S.db.from('reviews').select('rating,body,status').eq('user_id', me.user.id).maybeSingle().then(function (r) {
      var mine = r.data;
      sec.innerHTML = '<h3>⭐ Review BioscienceVista</h3>' + (mine ? '<p class="small">Your review is <b>' + E(mine.status === 'approved' ? 'published' : mine.status === 'hidden' ? 'not shown' : 'waiting for approval') + '</b>. You can change it below.</p>' : '<p class="small muted">Tell other students and teachers what helps you most. Reviews appear on the home page after a check.</p>') +
        '<form id="rvf" class="grp"><div class="cta" role="radiogroup" aria-label="Stars">' + [1, 2, 3, 4, 5].map(function (n) { return '<label class="chk"><input type="radio" name="st" value="' + n + '"' + ((mine ? mine.rating : 5) === n ? ' checked' : '') + '> ' + '★'.repeat(n) + '</label>'; }).join('') + '</div>' +
        '<textarea id="rvt" maxlength="600" rows="3" placeholder="What do you like about the lessons, quizzes or labs?">' + E(mine ? mine.body : '') + '</textarea>' +
        '<label class="chk"><input type="checkbox" id="rvn"> Show my full name (otherwise only my first name)</label><button class="btn main sm" type="submit">Send review</button><p class="msg" id="rvm"></p></form>';
      sec.querySelector('#rvf').onsubmit = function (e) { e.preventDefault(); var m = sec.querySelector('#rvm'), st = sec.querySelector('input[name=st]:checked');
        S.db.rpc('submit_review', { stars: st ? +st.value : 5, words: sec.querySelector('#rvt').value, show_full_name: sec.querySelector('#rvn').checked }).then(function (x) {
          if (x.error) { m.className = 'msg'; m.textContent = /check/.test(x.error.message) ? 'Please write at least a sentence (10 characters).' : S.nice(x.error); return; }
          m.className = 'msg ok'; m.textContent = 'Thank you! Your review will appear after a quick check.'; }); };
    });
  }
  // Revise next: the student's weakest topics from their own marked answers, each with a lesson, a simulation and a quiz that fit
  function reviseNext(me, prog) {
    var box = app.querySelector('#revise'); if (!box) return;
    S.db.from('item_results').select('topic_id,topic,skill,got,max,state').eq('student_id', me.user.id).limit(3000).then(function (r) {
      var T = {}; (r.data || []).forEach(function (x) { if (x.got == null || !x.max || !x.topic) return;
        var t = T[x.topic] || (T[x.topic] = { name: x.topic, id: x.topic_id, got: 0, max: 0, n: 0, skills: {} }); t.got += +x.got; t.max += +x.max; t.n++; if (x.topic_id) t.id = x.topic_id;
        var k = x.skill || 'other', sk = t.skills[k] || (t.skills[k] = { got: 0, max: 0 }); sk.got += +x.got; sk.max += +x.max; });
      var all = Object.keys(T).map(function (k) { var t = T[k]; t.pct = Math.round(100 * t.got / t.max); return t; }).filter(function (t) { return t.n >= 2 && t.max >= 3; });
      if (!all.length) { box.innerHTML = '<h3>🎯 Revise next</h3><p class="small muted">Finish a quiz or an interactive lesson and your personal revision list will appear here.</p>'; return; }
      var weak = all.filter(function (t) { return t.pct < 80; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 3);
      if (!weak.length) { var best = all.sort(function (a, b) { return b.pct - a.pct; })[0];
        box.innerHTML = '<h3>🎯 Revise next</h3><p>🌟 You are at 80% or more in every topic you have been marked on. Strongest: <b>' + E(best.name) + '</b> (' + best.pct + '%). Try the next lesson in your learning plan, or a challenge quiz.</p>'; return; }
      var ids = weak.map(function (t) { return t.id; }).filter(Boolean), done = {}; prog.forEach(function (p) { if (p.status === 'completed') done[p.lesson_id] = 1; });
      var none = Promise.resolve({ data: [] });
      Promise.all([ids.length ? S.db.from('lessons').select('id,title,url,topic_id,sort_order').in('topic_id', ids).eq('published', true).order('sort_order').limit(60) : none,
                   ids.length ? S.db.from('simulations').select('title,url,topic_id').in('topic_id', ids).eq('published', true).limit(20) : none,
                   ids.length ? S.db.from('quizzes').select('id,title,topic_id').in('topic_id', ids).limit(30) : none]).then(function (x) {
        var L = x[0].data || [], SI = x[1].data || [], Q = x[2].data || [];
        var skillName = { recall: 'recalling facts', explanation: 'explaining', calculation: 'calculation', skills: 'practical and data skills' };
        box.innerHTML = '<h3>🎯 Revise next</h3><p class="small muted">Your ' + (weak.length === 1 ? 'topic' : weak.length + ' topics') + ' with the most marks still to gain, from your own marked answers. Only you and your teacher see this.</p><div class="grp">' + weak.map(function (t) {
          var ls = L.filter(function (l) { return l.topic_id === t.id; }).sort(function (a, b) { return (done[a.id] ? 1 : 0) - (done[b.id] ? 1 : 0); }).slice(0, 2), si = SI.filter(function (s2) { return s2.topic_id === t.id; })[0], qz = Q.filter(function (q) { return q.topic_id === t.id; })[0];
          var ws = Object.keys(t.skills).map(function (k) { var v = t.skills[k]; return { k: k, pct: v.max ? 100 * v.got / v.max : 100, max: v.max }; }).filter(function (v) { return v.max >= 2; }).sort(function (a, b) { return a.pct - b.pct; })[0];
          var links = ls.map(function (l) { return '<a class="btn sm" href="' + E(l.url) + '">' + (done[l.id] ? '↻ Revisit: ' : '📘 ') + E(l.title) + '</a>'; }).join('') + (si ? '<a class="btn sm" href="' + E(si.url) + '">🧪 ' + E(si.title) + '</a>' : '') + (qz ? '<a class="btn sm" href="/quizzes/#' + qz.id + '">📝 Practise: ' + E(qz.title) + '</a>' : '');
          return '<div class="item"><span class="meta">' + t.pct + '% so far · ' + Math.round(t.max - t.got) + ' mark' + (Math.round(t.max - t.got) === 1 ? '' : 's') + ' to gain</span><b>' + E(t.name) + '</b>' +
            '<div style="height:8px;border-radius:99px;background:#fce7f3;overflow:hidden;margin:4px 0"><i style="display:block;height:100%;width:' + t.pct + '%;background:#db2777"></i></div>' +
            (ws && ws.pct < 80 ? '<span class="small">Focus on <b>' + E(skillName[ws.k] || ws.k) + '</b> questions in this topic.</span>' : '') +
            '<span class="cta" style="justify-content:flex-start;margin-top:6px">' + (links || '<a class="btn sm" href="/learn/">Open the Learning centre</a>') + '</span></div>'; }).join('') + '</div>';
      });
    }, function () { box.remove(); });
  }
  function learningPlan(me, prog) {
    var box = app.querySelector('#plan'); if (!box) return;
    var ids = (me.classes || []).map(function (c) { return c.id; }); if (!ids.length) { box.remove(); return; }
    S.db.from('class_materials').select('class_id,path,sort,materials(title,unit,subject)').in('class_id', ids).order('sort').then(function (r) {
      var mats = r.data || [], byPath = {}, seen = {};
      prog.forEach(function (p) { var u = p.lessons && p.lessons.url; if (u) { var k = u.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, ''); if (k.slice(-1) !== '/') k += '/'; byPath[k] = p; } });
      var going = [], next = [];
      mats.forEach(function (m) { if (seen[m.path]) return; seen[m.path] = 1; var p = byPath[m.path];
        if (p && p.status !== 'completed') going.push({ m: m, p: p }); else if (!p) next.push({ m: m }); });
      // Grade 6 to 10 science: the next lessons are chosen per subject (Biology, Chemistry, Physics), so the plan never runs one subject into another
      var sj = function (x) { var t = x.m.materials || {}; return /^MYP /.test(t.subject || '') ? BV.subj.of(t.subject, t.unit) : ''; };
      var perClass = {}; next = next.filter(function (x) { var k = x.m.class_id + '|' + sj(x); perClass[k] = (perClass[k] || 0) + 1; return perClass[k] <= (sj(x) ? 2 : 3); });
      var total = Object.keys(seen).length, done = Object.keys(seen).filter(function (k) { return byPath[k] && byPath[k].status === 'completed'; }).length;
      var row = function (x, tag) { var t = x.m.materials || {}; return '<p>📘 <a href="' + E(x.m.path) + '">' + E(t.title || x.m.path) + '</a> <span class="small muted">' + E(t.unit || '') + (tag ? ' · ' + tag : '') + '</span></p>'; };
      var rows = function (list, tagOf, max) { return BV.subj.split(list, sj, function (part, name) { return part.slice(0, name ? 3 : max).map(function (x) { return row(x, tagOf && tagOf(x)); }).join(''); }); };
      box.innerHTML = '<h3>🧭 My learning plan</h3><p class="small muted">Chosen for you from your classes and your progress. Each lesson gives instant feedback on every step; your learning profile below shows what to practise.</p>' +
        '<div class="bar"><i style="width:' + (total ? Math.round(100 * done / total) : 0) + '%"></i></div><p class="small">' + done + ' of ' + total + ' lessons in your classes completed</p>' +
        (going.length ? '<h4>Finish what you started</h4>' + rows(going, function (x) { return x.p.percent + '% done'; }, 4) : '') +
        (next.length ? '<h4>Up next</h4>' + rows(next, null, 6) : (going.length ? '' : '<p>You have finished every lesson in your classes. Try the <a href="/quizzes/">quizzes</a> to test yourself.</p>')) +
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
        (t.due_at ? ' <span class="small" style="color:' + (late ? '#c2410c' : soon ? '#b45309' : 'var(--muted)') + '">' + (late ? '⚠ was due ' : 'due ') + E(S.when(t.due_at)) + '</span>' : '') +
        (t.instructions ? '<div class="small muted">' + E(t.instructions) + '</div>' : '') + '</div><div>' + tick + '</div></div>';
    };
    return open.map(row).join('') + (done.length ? '<details><summary class="small muted">Done (' + done.length + ')</summary>' + done.map(row).join('') + '</details>' : '');
  }
  // The student's own learning profile and the analysis of each piece of work (Student Work Analysis Engine)
  var PROF = null;
  function myProfile(me) {
    var box = app.querySelector('#anbox'), A = window.BVA; if (!box || !A) return;
    var go = PROF ? Promise.resolve(PROF) : Promise.all([VIEW ? S.db.rpc('student_profile', { sid: VIEW.id }) : S.db.rpc('student_profile'), S.db.from('submission_analysis').select('*').eq('student_id', me.user.id).order('at', { ascending: false })]).then(function (x) { if (x[0].error) throw x[0].error; PROF = [x[0].data, x[1].data || []]; return PROF; });
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
  // when a teacher is writing on the class whiteboard right now, say so at the top of the dashboard
  var bwOn = false;
  /* announcements from the student's teachers and from BioscienceVista (table announcements, migration 044) */
  function news(me) {
    var box = document.getElementById('bv-news'); if (!box) return;
    var ids = (me.classes || []).map(function (c) { return c.id; }).filter(Boolean);
    var f = 'class_id.is.null' + (ids.length ? ',class_id.in.(' + ids.join(',') + ')' : '');
    S.db.from('announcements').select('id,class_id,title,body,link,pinned,created_at,expires_at').or(f).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(12).then(function (r) {
      if (r.error) return;   // before migration 044 the box simply stays empty
      var now = Date.now(), cn = {}; (me.classes || []).forEach(function (c) { cn[c.id] = c.name; });
      var rows = (r.data || []).filter(function (a) { return !a.expires_at || new Date(a.expires_at).getTime() >= now; }).slice(0, 6);
      if (!rows.length) { box.innerHTML = ''; return; }
      box.innerHTML = '<section class="panel" style="border-left:6px solid #ea580c"><h3 style="margin-top:0">📣 Announcements</h3>' + rows.map(function (a) {
        return '<div style="margin:8px 0"><b>' + (a.pinned ? '📌 ' : '') + E(a.title) + '</b> <span class="small muted">' + E(a.class_id ? cn[a.class_id] || 'Your class' : 'BioscienceVista') + ' · ' + E(new Date(a.created_at).toLocaleDateString()) + '</span>' +
          (a.body ? '<div style="white-space:pre-wrap">' + E(a.body) + '</div>' : '') + (a.link ? '<div><a href="' + E(a.link) + '">Open →</a></div>' : '') + '</div>'; }).join('') + '</section>';
    }, function () {});
  }
  function boardWatch(me) {
    if (bwOn || !S.db.channel || !(me.classes || []).length) return; bwOn = true;
    me.classes.forEach(function (c) {
      var ch = S.db.channel('board-class-' + c.id, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'page' }, function () { var el = document.getElementById('wblive'); if (!el) return;
          el.innerHTML = '<a class="panel" href="/board/?class=' + encodeURIComponent(c.id) + '" style="display:flex;gap:12px;align-items:center;text-decoration:none;border:2px solid #0d9488;background:#f0fdfa;margin:10px 0"><span style="font-size:2rem">🟢</span><span><b>Your teacher is writing on the board now</b><br><span class="small">' + E(c.name) + ' · tap to watch live</span></span></a>'; })
        .on('broadcast', { event: 'end' }, function () { var el = document.getElementById('wblive'); if (el) el.innerHTML = ''; })
        .subscribe(function (st) { if (st === 'SUBSCRIBED') ch.send({ type: 'broadcast', event: 'hello', payload: {} }); });
    });
  }
  var SUBJ = null;   // set for students in a Grade 6 to 10 science class: works out the subject of a lesson or question set
  function stag(kind, id, title) { if (!SUBJ) return ''; var n = SUBJ[kind](id, title); return n ? BV.subj.tag(n) + ' ' : ''; }
  function draw(me, res, prog, quizzes, att, tasks) {
    var first = (me.profile.full_name || 'there').split(' ')[0], got = 0, max = 0;
    res.forEach(function (r) { if (r.score != null && r.max_score) { got += +r.score; max += +r.max_score; } });
    var done = prog.filter(function (p) { return p.status === 'completed'; }).length;
    var setQ = {}; tasks.forEach(function (t) { if (t.kind === 'quiz') setQ[t.ref] = 1; });
    var todo = quizzes.filter(function (q) { var a = att.filter(function (t) { return t.quiz_id === q.id; }); return !setQ[q.id] && !a.some(function (t) { return t.status !== 'in_progress'; }) && (!q.due_at || new Date(q.due_at) > new Date()); });
    var openTasks = tasks.filter(function (t) { return t.state !== 'done'; }).length;
    var fb = res.filter(function (r) { return r.teacher_feedback || r.ai_feedback; });
    var h = '<div class="row2"><div><p class="label">My dashboard</p><h2>Hello, ' + E(first) + ' 👋</h2><p class="muted small">' + E(me.classes.map(function (c) { return c.name; }).join(', ') || 'No class yet') + ' · ' + E(me.user.email) + '</p></div>' +
      '<button class="btn sm" type="button" id="so">Log out</button></div>' +
      '<style>.dq{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:12px 0}.dq>div{border-radius:16px;padding:10px 12px;color:#fff;box-shadow:0 4px 12px rgba(15,23,42,.12)}.dq h4{margin:0 0 6px;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;opacity:.9}.dq a{display:block;color:#fff;font-weight:800;text-decoration:none;padding:3px 0}.dq a:hover{text-decoration:underline}</style>' +
      '<div class="dq"><div style="background:linear-gradient(135deg,#2563eb,#0ea5e9)"><h4>Learn</h4><a href="/learn/">📘 Learning centre</a><a href="/library/">🔬 Virtual labs</a><a href="/games/">🎮 Games</a></div>' +
      '<div style="background:linear-gradient(135deg,#f97316,#ef4444)"><h4>Assessments</h4><a href="/quizzes/">📝 Exam-style questions</a><a href="/exams/">🧪 Examinations</a><a href="/practice/">🎯 Practice and revision</a></div>' +
      '<div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)"><h4>Live with my teacher</h4><a href="/live/">🎥 Live lessons</a><a href="/check/" title="Answer the question your teacher sends during a lesson">⚡ Live Check</a><a href="/board/">🖊 Whiteboard</a></div></div>';
    h += '<div id="wblive"></div><div id="bv-news"></div><div id="remind"></div><div id="mycl"></div>';
    h += '<div class="stats"><div class="stat"><span class="small muted">Overall score</span><b>' + (max ? Math.round(100 * got / max) + '%' : '–') + '</b></div>' +
      '<div class="stat"><span class="small muted">Lessons completed</span><b>' + done + ' / ' + prog.length + '</b></div>' +
      '<div class="stat"><span class="small muted">To do</span><b>' + (openTasks + todo.length) + '</b></div>' +
      '<div class="stat"><span class="small muted">Feedback received</span><b>' + fb.length + '</b></div></div>';
    // To do (16 Nov 2026): what the teacher set for the class, kept apart from my own to-do list; inside each, interactive lessons, examinations and exam-style questions are separate
    var CAT = {}; quizzes.forEach(function (q) { CAT[q.id] = q.category; });
    var typeOf = function (kind, cat) { return kind === 'lesson' || cat === 'lesson' ? 'les' : cat === 'exam' ? 'exam' : kind === 'quiz' || cat === 'quiz' ? 'qs' : 'oth'; };
    var TYPES = [['les', '📘 Interactive lessons', '#2563eb'], ['exam', '🧪 Examinations', '#7c3aed'], ['qs', '📝 Exam-style questions', '#ea580c'], ['oth', '📎 Other tasks', '#0d9488']];
    // inside each type: sorted A to Z, and IB Biology themes A to D kept apart (16 Nov 2026), each theme with its own colour
    var THEME = {}; Object.keys(BV.THEMES).forEach(function (k) { var t = BV.THEMES[k]; THEME[k] = [k + ' · ' + t[1], t[2]]; });
    var themeOf = function (t) { var m = /(?:^|[^A-Za-z0-9])([A-D])([1-4])\.(\d)/.exec(t || ''); return m ? m[1] : ''; };
    var nat = function (a, b) { return String(a.title || '').localeCompare(String(b.title || ''), undefined, { numeric: true, sensitivity: 'base' }); };
    var listOf = function (o) { return o.slice(0, 4).map(function (x) { return x.html; }).join('') + (o.length > 4 ? '<details><summary class="small" style="cursor:pointer;font-weight:700;color:var(--tc)">Show ' + (o.length - 4) + ' more</summary>' + o.slice(4).map(function (x) { return x.html; }).join('') + '</details>' : ''); };
    var groups = function (rows, empty) {
      var out = TYPES.map(function (T) { var r = rows.filter(function (x) { return x.type === T[0]; }).sort(nat); if (!r.length) return '';
        var open = r.filter(function (x) { return !x.done; }), done = r.filter(function (x) { return x.done; });
        var keys = ['A', 'B', 'C', 'D'].filter(function (k) { return open.some(function (x) { return themeOf(x.title) === k; }); });
        var byLevel = function (o) {   // inside a theme: molecules, cells, organisms, ecosystems
          var lvOf = function (x) { var t = BV.theme(x.title); return t ? t.lv : 9; };
          return [1, 2, 3, 4, 9].map(function (n) { var g = o.filter(function (x) { return lvOf(x) === n; }); if (!g.length) return '';
            return '<div class="td-lv"><p class="td-lvh">' + (n === 9 ? 'Other' : n + ' · ' + BV.LEVELS[n][0]) + ' <b>' + g.length + '</b></p>' + listOf(g) + '</div>'; }).join(''); };
        var body = keys.length ? keys.map(function (k) { var o = open.filter(function (x) { return themeOf(x.title) === k; });
            return '<div class="td-th" style="--hc:' + THEME[k][1] + '"><p class="td-thh"><span>' + k + '</span>' + THEME[k][0].slice(4) + ' <b>' + o.length + '</b></p>' + byLevel(o) + '</div>'; }).join('') +
            (function () { var o = open.filter(function (x) { return !themeOf(x.title); }); return o.length ? '<div class="td-th" style="--hc:#64748b"><p class="td-thh"><span>•</span>Other topics <b>' + o.length + '</b></p>' + listOf(o) + '</div>' : ''; })()
          : listOf(open);
        return '<div class="td-grp" style="--tc:' + T[2] + '"><h4>' + T[1] + ' <span>' + open.length + '</span></h4>' + body +
          (done.length ? '<details><summary class="small muted">Done (' + done.length + ')</summary>' + done.map(function (x) { return x.html; }).join('') + '</details>' : '') + '</div>'; }).join('');
      return out || '<p class="emptybox">' + empty + '</p>';
    };
    var setRows = tasks.map(function (t) { return { title: t.title, type: typeOf(t.kind, CAT[t.ref]), done: t.state === 'done', html: todoHtml([t]).replace(/^<details>.*<\/summary>/, '').replace(/<\/details>$/, '') }; });
    var myRows = todo.map(function (q) { return { title: q.title, type: typeOf('', q.category), done: false, html: '<div class="todo td-row">' + stag('quiz', q.id, q.title) + '<a href="' + ({ exam: '/exams/', lesson: '/lesson/' }[q.category] || '/quizzes/') + '#' + q.id + '"><b>' + E(q.title) + '</b></a>' + (q.due_at ? ' <span class="small muted">due ' + E(S.when(q.due_at)) + '</span>' : '') + '</div>' }; })
      .concat(prog.filter(function (p) { return p.status !== 'completed'; }).slice(0, 8).map(function (p) { return { title: p.lessons && p.lessons.title, type: 'les', done: false, html: '<div class="todo td-row">' + stag('lesson', p.lesson_id, p.lessons && p.lessons.title) + '<a href="' + E(p.lessons && p.lessons.url || '/learn/') + '"><b>' + E(p.lessons ? p.lessons.title : 'Lesson') + '</b></a> <span class="small muted">' + p.percent + '% done · Continue</span></div>' }; }));
    h += '<style>.td-wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:14px;margin:14px 0}.td-col{border-radius:18px;padding:14px 16px;background:#fff;border:1px solid var(--line,#e2e8f0)}.td-col>h3{margin:0 0 4px;display:flex;align-items:center;gap:8px}.td-col>p{margin:0 0 8px}' +
      '.td-set{border-top:6px solid #4f46e5;background:linear-gradient(180deg,#eef2ff,#fff 90px)}.td-mine{border-top:6px solid #059669;background:linear-gradient(180deg,#ecfdf5,#fff 90px)}' +
      '.td-lv{margin:4px 0 6px 6px;padding-left:10px;border-left:3px dotted color-mix(in srgb,var(--hc) 45%,#fff)}.td-lvh{margin:6px 0 0;font-size:.74rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:color-mix(in srgb,var(--hc) 70%,#334155);display:flex;gap:6px;align-items:center}.td-lvh b{background:color-mix(in srgb,var(--hc) 15%,#fff);border-radius:999px;padding:0 7px;font-size:.72rem}' +
      '.td-col{font-family:Outfit,system-ui,sans-serif}.td-row a{color:color-mix(in srgb,var(--hc,var(--tc)) 78%,#0f172a);text-decoration:none;font-weight:700}.td-row a b{font-weight:700}.td-row a:hover{text-decoration:underline}.td-row .small{font-family:system-ui,sans-serif}.td-col .todo a{color:color-mix(in srgb,var(--hc,var(--tc)) 78%,#0f172a);text-decoration:none}' +
      '.td-th{margin:8px 0 10px;border-radius:12px;padding:6px 10px 4px;background:color-mix(in srgb,var(--hc) 7%,#fff);border:1px solid color-mix(in srgb,var(--hc) 25%,#fff)}.td-thh{margin:0 0 2px;display:flex;align-items:center;gap:8px;font-weight:800;color:color-mix(in srgb,var(--hc) 80%,#000);font-size:.9rem}.td-thh span{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:7px;background:var(--hc);color:#fff;font-size:.8rem}.td-thh b{margin-left:auto;background:#fff;border-radius:999px;padding:0 8px;font-size:.78rem;color:#334155}.td-th .td-row:last-child{border-bottom:0}' +
      '.td-grp{margin:10px 0;border-left:4px solid var(--tc);padding-left:10px}.td-grp h4{margin:0 0 4px;color:var(--tc);display:flex;align-items:center;gap:6px}.td-grp h4 span{background:var(--tc);color:#fff;border-radius:999px;padding:0 8px;font-size:.8rem}.td-row{overflow-wrap:anywhere;padding:6px 0;border-bottom:1px solid var(--line,#e2e8f0)}</style>';
    h += '<section class="td-wrap" aria-label="To do"><div class="td-col td-set"><h3>🧑‍🏫 Set by my teacher</h3><p class="small muted">Work your teacher set for your class, with its due date.</p>' + groups(setRows, 'Your teacher has not set any work right now.') + '</div>' +
      '<div class="td-col td-mine"><h3>✅ My to-do list</h3><p class="small muted">Lessons you have started and other sets open for your class.</p>' + groups(myRows, 'Nothing else to do right now. Well done! 🎉') + '</div></section>';
    h += '<div class="two">' +
      '<section class="panel"><h3>My progress</h3>' + (prog.length ? prog.slice(0, 8).map(function (p) { return '<div class="grp" style="gap:4px"><div class="row2"><span class="small">' + stag('lesson', p.lesson_id, p.lessons && p.lessons.title) + E(p.lessons ? p.lessons.title : '') + '</span><span class="small muted">' + p.percent + '%</span></div><div class="bar"><i style="width:' + p.percent + '%"></i></div></div>'; }).join('') : '<p class="muted">Open a lesson from the <a href="/learn/">Learning centre</a> to start.</p>') + '</section></div>';
    h += '<section class="panel" id="mylessons"><h3>📘 My interactive lessons</h3><p class="small muted">Loading…</p></section>';
    h += '<section class="panel" id="revise" style="border-left:6px solid #db2777"><h3>🎯 Revise next</h3><p class="small muted">Looking at your results…</p></section>';
    h += '<section class="panel" id="plan"><h3>🧭 My learning plan</h3><p class="small muted">Loading…</p></section>';
    h += '<section class="panel" id="anbox"><h3>📊 My learning profile</h3><p class="muted small">Loading…</p></section>';
    var resOf = function (r) { return SUBJ ? (r.quiz_id ? SUBJ.quiz(r.quiz_id, r.title) : SUBJ.lesson(r.lesson_id, r.title)) : ''; };
    h += '<section class="grp"><h3 class="sec-h">My results and feedback</h3>' + (res.length ? BV.subj.split(res, resOf, function (part) { return part.map(function (r) { var pc = S.pct(+r.score, +r.max_score);
      return '<article class="task"><div class="top2"><b>' + E(r.title || 'Task') + '</b><span class="score">' + (r.score == null ? 'Being marked' : E(r.score) + ' / ' + E(r.max_score) + (pc != null ? ' (' + pc + '%)' : '')) + '</span></div>' +
        '<div class="bar"><i style="width:' + (pc || 0) + '%"></i></div><span class="small muted">' + E(S.when(r.recorded_at)) + '</span>' +
        (r.teacher_feedback ? '<div class="fb tch"><h4>Teacher feedback</h4>' + BV.md(r.teacher_feedback) + '</div>' : '') + (r.ai_feedback ? '<div class="fb ai"><h4>Feedback</h4>' + BV.md(String(r.ai_feedback).replace(/_🤖 Automatic AI feedback from your marks on each question\./, '_📝 Feedback from your marks on each question.').replace(/_⚙ Automatic feedback from your marks on each question\._/, '_📝 Feedback from your marks on each question._')) + '</div>' : '') + '</article>'; }).join(''); }) :
      '<p class="emptybox">No results yet. Results appear here when you finish lessons and quizzes.</p>') + '</section>';
    h += '<details class="panel"><summary><b>My profile</b></summary><form id="pf" class="grp" style="margin-top:10px"><label class="f">Full name<input id="pn" value="' + E(me.profile.full_name) + '"></label><button class="btn sm" type="submit">Save</button><p class="msg" id="pm"></p></form>' +
      '</details>';
    app.innerHTML = h; boardWatch(me); news(me);
    var tdw = app.querySelector('.td-wrap'); if (tdw && BV.findBox) { var fw = document.createElement('div'); tdw.parentNode.insertBefore(fw, tdw); fw.appendChild(tdw); BV.findBox(fw, '.td-row, .todo', '.td-lv, .td-th, .td-grp', 'Find in my To do: a topic, code or title…'); }
    app.querySelector('#so').onclick = S.signOut;
    myProfile(me);
    app.querySelectorAll('[data-done]').forEach(function (b) { b.onclick = function () {
      b.disabled = true; S.db.from('assignment_done').insert({ assignment_id: b.getAttribute('data-done'), student_id: me.user.id }).then(function (r) {
        if (r.error) { b.disabled = false; alert(S.nice(r.error)); return; }
        tasks.forEach(function (t) { if (t.id === b.getAttribute('data-done')) t.state = 'done'; }); draw(me, res, prog, quizzes, att, tasks); }); }; });
    classesPanel(me, app.querySelector('#mycl'));
    if (!me.view) reminders(app.querySelector('#remind'));
    learningPlan(me, prog);
    reviseNext(me, prog);
    myLessons(me); reviewBox(me);
    app.querySelector('#pf').onsubmit = function (e) { e.preventDefault(); var m = app.querySelector('#pm');
      S.db.from('profiles').update({ full_name: app.querySelector('#pn').value.trim() }).eq('id', me.user.id).then(function (r) { m.className = r.error ? 'msg' : 'msg ok'; m.textContent = r.error ? S.nice(r.error) : 'Saved.'; }); };
  }
})();
