/* Learning centre and simulation library · VistaEd */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), mode = app.getAttribute('data-mode');
  var KIND = { file: '📄', folder: '📁', video: '🎬', link: '🔗', slides: '🖥', worksheet: '📝', 'past paper': '📚' };
  S.guard(app).then(function (me) { return mode === 'sims' ? sims(me) : centre(me); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  /* every row of a table, 1000 at a time (the API caps one request at 1000 rows) */
  function allRows(build, from, acc) {
    from = from || 0; acc = acc || [];
    return build().range(from, from + 999).then(function (r) {
      if (r.error) return { data: acc.length ? acc : null, error: r.error };
      var rows = r.data || []; acc = acc.concat(rows);
      return rows.length === 1000 ? allRows(build, from + 1000, acc) : { data: acc };
    });
  }

  /* Learning centre: subject → topic → subtopic, following each syllabus; interactive lessons sit in their subtopic */
  function centre(me) {
    return Promise.all([
      S.db.from('subjects').select('id,slug,name,colour,sort_order').order('sort_order'),
      allRows(function () { return S.db.from('topics').select('id,subject_id,parent_id,name,code,programme,summary,sort_order,published').order('sort_order').order('id'); }),
      allRows(function () { return S.db.from('lessons').select('id,topic_id,title,summary,url,minutes,max_marks,sort_order,published,external_id').order('sort_order').order('id'); }),   // over 1000 lessons: the API returns at most 1000 rows per request (22 Nov 2026)
      S.db.from('resources').select('id,topic_id,title,kind,url,download_url,sort_order,published').order('sort_order'),
      S.db.from('learning_progress').select('lesson_id,status,percent,last_step,updated_at').eq('student_id', me.user.id),
      S.db.from('quizzes').select('id,title,instructions,due_at').eq('category', 'lesson').in('published', (me.roles || []).some(function (r) { return r === 'admin' || r === 'teacher'; }) ? [true] : [true, false]).order('created_at', { ascending: false }),
      S.db.from('simulations').select('id,topic_id,title,url,is_internal').eq('published', true),
      S.db.from('learner_preferences').select('programme,subjects').eq('user_id', me.user.id).maybeSingle().then(function (r) { return r; }, function () { return { data: null }; }),
      S.db.rpc('my_visible_paths').then(function (r) { return r; }, function () { return { data: null }; })   // only the authorised subjects and approved classes (migration 078)
    ]).then(function (x) {
      var subjects = x[0].data || [], topics = (x[1].data || []).filter(function (t) { return t.published; }), prog = {}, mineIL = {};
      (x[4].data || []).forEach(function (p) { prog[p.lesson_id] = p; });
      (x[5].data || []).forEach(function (q) { mineIL['IL-' + q.id] = q; });   // interactive lessons set for this student's class
      // a teacher-built lesson is listed only if it is set for this student's class
      var lessons = (x[2].data || []).filter(function (l) { return l.published && (!/^IL-/.test(l.external_id || '') || me.staff || mineIL[l.external_id]); });
      var VIS = x[8] && Array.isArray(x[8].data) ? x[8].data : null; if (VIS && !me.staff) { var vs = {}; VIS.forEach(function (p) { vs[p] = 1; }); lessons = lessons.filter(function (l) { return !/^\/[a-z0-9-]+\/$/.test(l.url || '') || vs[l.url] || /^IL-/.test(l.external_id || ''); });
        topics = topics.filter(function (t) { return lessons.some(function (l) { return l.topic_id === t.id; }) || topics.some(function (k) { return k.parent_id === t.id && lessons.some(function (l) { return l.topic_id === k.id; }); }); }); }
      var by = function (list, k) { var m = {}; list.forEach(function (o) { (m[o[k]] = m[o[k]] || []).push(o); }); return m; };
      var L = by(lessons, 'topic_id'), R = by((x[3].data || []).filter(function (r) { return r.published; }), 'topic_id'), SIM = by(x[6].data || [], 'topic_id'), KIDS = by(topics.filter(function (t) { return t.parent_id; }), 'parent_id');
      var orphanIL = Object.keys(mineIL).filter(function (k) { return !lessons.some(function (l) { return l.external_id === k && l.topic_id; }); }).map(function (k) { return mineIL[k]; });
      subjects = subjects.filter(function (s) { return topics.some(function (t) { return t.subject_id === s.id; }); });
      /* Student Learning Centre phase 3: pick up where you stopped, and open on the subject you are working in */
      var TOP = {}; topics.forEach(function (t) { TOP[t.id] = t; });
      var LID = {}; lessons.forEach(function (l) { LID[l.id] = l; });
      var subjOfL = function (l) { var t = TOP[l.topic_id]; return t && t.subject_id; };
      var recent = (x[4].data || []).filter(function (p) { return LID[p.lesson_id]; }).sort(function (a, b) { return new Date(b.updated_at || 0) - new Date(a.updated_at || 0); });
      var mySubj = recent.length && subjOfL(LID[recent[0].lesson_id]), mySlug = (subjects.filter(function (z) { return z.id === mySubj; })[0] || {}).slug;
      if (!mySlug && x[7] && x[7].data) {   // no lessons started yet: open on the programme and subject from my learning profile (phase 6)
        var LP = x[7].data, f = ((LP.subjects || [])[0] || '').toLowerCase(), pre = { ib_dp: 'ib-', igcse: 'igcse-', a_level: 'a-level-', cambridge_ks3: 'cam-ls-' }[LP.programme];
        var sub = /bio/.test(f) ? 'biology' : /chem/.test(f) ? 'chemistry' : /phys/.test(f) ? 'physics' : /environment/.test(f) ? 'ess' : /math/.test(f) ? (LP.programme === 'ib_dp' ? 'maths-aa' : 'mathematics') : '';
        var want = LP.programme === 'ib_myp' ? 'myp-science' : pre && sub ? pre + sub : '';
        if (want && subjects.some(function (z) { return z.slug === want; })) mySlug = want;
      }
      var going = recent.filter(function (p) { return p.status !== 'completed' && (p.percent || 0) < 100; }).slice(0, 4);
      if (going.length && !me.staff) {
        var cw = document.createElement('section'); cw.className = 'lc-cont';
        cw.innerHTML = '<h3>▶ Continue where you stopped</h3><div class="lc-cl">' + going.map(function (p) { var l = LID[p.lesson_id], t = TOP[l.topic_id], pc = p.percent || 0;
          return '<a class="lc-ci" href="' + E(l.url || '#') + '"><b>' + E(l.title) + '</b><span class="small">' + E(t ? t.name : '') + (p.updated_at ? ' · ' + E(S.when ? S.when(p.updated_at) : new Date(p.updated_at).toLocaleDateString()) : '') + '</span><span class="bar"><i style="width:' + pc + '%"></i></span><span class="lc-go">' + pc + '% · Continue ▶</span></a>'; }).join('') + '</div>';
        app.before(cw);
        if (!document.getElementById('lc-cont-css')) { var st = document.createElement('style'); st.id = 'lc-cont-css';
          st.textContent = '.lc-cont{background:linear-gradient(120deg,#4f46e5,#7c3aed 60%,#db2777);border-radius:18px;padding:14px 16px;margin:0 0 14px;color:#fff}.lc-cont h3{margin:0 0 8px;color:#fff}.lc-cl{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}' +
            '.lc-ci{display:flex;flex-direction:column;gap:4px;background:#fff;color:#1e1b4b;border-radius:14px;padding:10px 12px;text-decoration:none;min-width:0}.lc-ci b{overflow-wrap:anywhere}.lc-ci .small{color:#64748b}.lc-ci .bar{display:block;height:7px;background:#e0e7ff;border-radius:9px;overflow:hidden}.lc-ci .bar i{display:block;height:100%;background:#22c55e}.lc-go{font-weight:800;color:#4f46e5;font-size:.88rem}.lc-ci:hover{outline:3px solid #fde047}';
          document.head.appendChild(st); }
      }
      var cur = location.hash.slice(1) || mySlug || (subjects[0] && subjects[0].slug), q = '', onlyLessons = false;
      try { onlyLessons = localStorage.getItem('bv-only') === '1'; } catch (e) {}

      function count(t) { var n = (L[t.id] || []).length + (R[t.id] || []).length + (SIM[t.id] || []).length; (KIDS[t.id] || []).forEach(function (k) { n += count(k); }); return n; }
      function lessonCard(l) {
        var lk = CAT[l.id];
        if (lk) return '<div class="lcard" style="opacity:.92"><span class="ic">🔒</span><span><b>' + E(l.title) + '</b><span class="small muted">' + E(l.summary || '') + ' · opens when your teacher approves it</span></span>' +
          (lk.status === 'pending' ? '<span class="pill">Requested · waiting</span>' : '<button type="button" class="btn sm" data-ask="' + l.id + '" data-cls="' + lk.class_id + '">' + (lk.status === 'declined' ? 'Ask again' : 'Request') + '</button>') + '</div>';
        var p = prog[l.id], pc = p ? p.percent : 0, il = /^IL-/.test(l.external_id || '');
        return '<a class="lcard" href="' + E(l.url || '#') + '"><span class="ic">' + (il ? '📘' : '🧪') + '</span><span><b>' + E(l.title) + '</b><span class="small muted">' + E(l.summary || '') + (l.minutes ? ' · ' + l.minutes + ' min' + (l.minutes > 75 ? ' (2 sessions)' : '') : '') + (l.max_marks ? ' · ' + l.max_marks + ' marks' : '') + '</span>' + (/^AHL\b|HL only|\(HL\)/.test(l.title || '') ? '<span class="pill" title="Higher Level only">HL</span>' : '') +
          '<span class="bar" title="' + pc + '% done"><i style="width:' + pc + '%"></i></span></span><span class="go">' + (p && p.status === 'completed' ? 'Review ✓' : p ? 'Continue' : 'Start') + '</span>' + (me.admin && l.id ? S.del('lesson', l.id, l.title) : '') + '</a>';
      }
      function items(t) {
        return (L[t.id] || []).map(lessonCard).join('') +
          (SIM[t.id] || []).map(function (s) { return '<a class="lcard" href="' + E(s.url) + '"' + (s.is_internal ? '' : ' target="_blank" rel="noopener"') + '><span class="ic">🔬</span><span><b>' + E(s.title) + '</b><span class="small muted">Virtual lab</span></span><span class="go">Open</span>' + (me.admin ? S.del('simulation', s.id, s.title) : '') + '</a>'; }).join('') +
          (R[t.id] || []).map(function (r) { var lk = r.kind === 'link' && /^\/[a-z0-9-]+\/$/.test(r.url || '');   // a lesson that also teaches this subtopic (22 Nov 2026)
            return '<a class="lcard" href="' + E(r.url) + '"' + (lk ? '' : ' target="_blank" rel="noopener"') + '><span class="ic">' + (r.kind === 'video' ? '🎬' : lk ? '🧪' : '📄') + '</span><span><b>' + E(r.title) + '</b><span class="small muted">' + E(r.kind === 'video' ? 'Videos' : lk ? 'Interactive lesson covering this subtopic' : 'Notes') + '</span></span><span class="go">' + (lk ? 'Open →' : 'Open ↗') + '</span>' + (me.admin ? S.del('resource', r.id, r.title) : '') + '</a>'; }).join('');
      }
      function match(t) { if (!q) return true; var txt = (t.name + ' ' + (t.code || '') + ' ' + (L[t.id] || []).map(function (l) { return l.title; }).join(' ')).toLowerCase(); return txt.indexOf(q) >= 0 || (KIDS[t.id] || []).some(match); }
      /* In a teacher's class you see the lessons your teacher added. The rest of the course can be asked for here; your teacher decides.
         (Needs migration 031; before that, and for independent learners, there is nothing to show.) */
      var rq = document.createElement('section'); rq.id = 'lcreq'; app.before(rq); var CAT = {};
      function requests() {
        S.db.rpc('class_catalogue').then(function (r) {
          var rows = r.data || []; CAT = {}; if (!r.error) rows.forEach(function (x) { CAT[x.lesson_id] = x; });
          var known = {}; lessons.forEach(function (l) { known[l.id] = 1; }); rows = rows.filter(function (x) { return !known[x.lesson_id]; });   // lessons already in the lists below get their Request button there
          draw();
          if (r.error || !rows.length) { rq.innerHTML = ''; return; }
          var by = {}, order = []; rows.forEach(function (x) { var k = x.class_name + ' · ' + x.topic; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(x); });
          var waiting = rows.filter(function (x) { return x.status === 'pending'; }).length, was = rq.querySelector('details'), open = was && was.open;
          rq.innerHTML = '<details class="panel tint"' + (open ? ' open' : '') + '><summary style="cursor:pointer;font-weight:700">➕ Ask your teacher for more lessons <span class="small muted">' + rows.length + ' more in your course' + (waiting ? ' · ' + waiting + ' waiting for your teacher' : '') + '</span></summary>' +
            '<p class="small muted">You see the lessons your teacher added to your class. Ask for any of these and your teacher will decide.</p>' + order.map(function (k) {
              return '<h4 style="margin:12px 0 4px">' + E(k) + '</h4>' + by[k].map(function (x) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>' + E(x.title) + '</span>' +
                (x.status === 'pending' ? '<span class="pill">Requested · waiting</span>' : '<button type="button" class="btn sm" data-ask="' + x.lesson_id + '" data-cls="' + x.class_id + '">' + (x.status === 'declined' ? 'Ask again' : 'Request') + '</button>') + '</div>'; }).join(''); }).join('') + '</details>';
          rq.querySelectorAll('[data-ask]').forEach(function (b) { b.onclick = function () { b.disabled = true;
            S.db.rpc('request_material', { lid: b.getAttribute('data-ask'), cid: b.getAttribute('data-cls') }).then(function (x) { if (x.error) { b.disabled = false; alert(S.nice(x.error)); return; } requests(); }); }; });
        }, function () {});
      }
      if (!me.staff) requests();
      var grade = null; try { grade = localStorage.getItem('bv-grade'); } catch (e) {}
      if (!grade && recent.length) { var t0 = TOP[LID[recent[0].lesson_id].topic_id]; while (t0 && t0.parent_id && TOP[t0.parent_id]) t0 = TOP[t0.parent_id]; if (t0 && t0.programme) grade = t0.programme; }   // open on the grade you are working in
      var MORE = { 'myp-science': '/myp/', 'ib-biology': '/biology/', 'a-level-biology': '/biology/', 'igcse-biology': '/biology/', 'ib-maths-aa': '/maths/', 'ib-maths-ai': '/maths/', 'ib-chemistry': '/chemistry/', 'igcse-chemistry': '/chemistry/', 'a-level-chemistry': '/chemistry/', 'ib-physics': '/physics/', 'ib-ess': '/environmental-systems/', 'ib-computer-science': '/computer-science/', 'ib-digital-society': '/digital-society/' };
      app.addEventListener('click', function (e) { var k = e.target.closest ? e.target.closest('[data-ask]') : null; if (!k) return; k.disabled = true;
        S.db.rpc('request_material', { lid: k.getAttribute('data-ask'), cid: k.getAttribute('data-cls') }).then(function (x) { if (x.error) { k.disabled = false; alert(S.nice(x.error)); return; } requests(); }); });
      app.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('[data-grade]') : null; if (!b) return; grade = b.getAttribute('data-grade'); try { localStorage.setItem('bv-grade', grade); } catch (x) {} draw(); });
      window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (h && subjects.some(function (z) { return z.slug === h; })) { cur = h; q = ''; draw(); } });
      function draw() {
        var s = subjects.filter(function (z) { return z.slug === cur; })[0] || subjects[0];
        var il = orphanIL.length ? '<section class="grp"><h3 class="sec-h">📘 Interactive lessons for your class</h3><div class="lgrid">' + orphanIL.map(function (q2) {
          var row = lessons.filter(function (l) { return l.external_id === 'IL-' + q2.id; })[0] || { id: null, title: q2.title, url: '/lesson/#' + q2.id, external_id: 'IL-' + q2.id, summary: (q2.instructions || '').split('\n')[0] };
          return lessonCard(row); }).join('') + '</div></section>' : '';
        if (!s) { app.innerHTML = il || '<p class="emptybox">No learning content has been published yet.</p>'; return; }
        var all0 = topics.filter(function (t) { return t.subject_id === s.id && !t.parent_id; });
        // MYP Science: one grade at a time (Grade 6 = MYP 1 … Grade 10 = MYP 5), not every grade on one page
        var grades = s.slug === 'myp-science' ? all0.map(function (t) { return t.programme; }).filter(function (g, i, a) { return g && a.indexOf(g) === i; }).sort() : [];
        if (grades.length > 1 && grades.indexOf(grade) < 0) grade = grades[0];
        var tops = all0.filter(function (t) { return grades.length < 2 || q || t.programme === grade; }).filter(match).filter(function (t) { return (me && me.staff) ? (!onlyLessons || count(t)) : count(t); });   // students only see topics with lessons (George, 21 Nov 2026: nothing "coming soon")
        var bar = '<div class="lc-bar"><b>' + E(s.name) + '</b><a class="btn sm" href="/quizzes/">📝 Exam-style questions</a><a class="btn sm" href="/exams/">🧪 Examinations</a><a class="btn sm" href="/simulations/">🔬 Virtual labs</a>' + (MORE[s.slug] ? '<a class="btn sm" href="' + MORE[s.slug] + '">📚 Subject page: all levels</a>' : '') + '</div>' +
          (grades.length > 1 ? '<div class="lc-grades" role="group" aria-label="Grade">' + grades.map(function (g) { var n = +String(g).replace(/\D/g, ''); return '<button type="button" data-grade="' + E(g) + '" aria-pressed="' + (g === grade) + '">Grade ' + (n + 5) + ' <span class="small">· ' + E(g) + '</span></button>'; }).join('') + '</div>' : '');
        var make = me.staff ? '<div class="panel tint row2 lmake"><span><b>Teachers:</b> turn any file (PDF, Word, PowerPoint, Excel, web page, text or pictures) into an interactive six-step lesson. Use <b>＋ Add lesson</b> in a subtopic to file it there.</span><a class="btn main sm" href="/staff/#lessons/new">✨ Create an interactive lesson from a file</a></div>' : '';
        var addHere = function (t) { return me.staff ? '<a class="addles small" href="/staff/#lessons/new/' + t.id + '">＋ Add lesson</a>' : ''; };
        app.innerHTML = make + il + '<div class="tabs" role="tablist">' + subjects.map(function (z) { return '<button role="tab" aria-selected="' + (z === s) + '" data-s="' + E(z.slug) + '" style="' + (z === s ? 'background:' + E(z.colour) + ';color:#fff' : '') + '">' + E(z.name) + '</button>'; }).join('') + '</div>' +
          bar + '<div class="row2"><input id="q" type="search" placeholder="Search topics and lessons" value="' + E(q) + '" style="max-width:340px" aria-label="Search topics and lessons">' +
          '<label class="chk small"><input type="checkbox" id="only"' + (onlyLessons ? ' checked' : '') + '> Only show topics with lessons</label></div>' +
          (tops.length ? tops.map(function (t) {
            var kids = (KIDS[t.id] || []).filter(function (k) { return k.published && (!q || match(k) || match(t)) && ((me && me.staff) ? (!onlyLessons || count(k)) : count(k)); }), n = count(t);
            return '<details class="ltopic"' + (n || q ? ' open' : '') + '><summary><span class="lt-name">' + E(t.name) + '</span><span class="pill">' + (n ? n + ' item' + (n === 1 ? '' : 's') : 'empty') + '</span>' + (t.programme && t.programme !== 'IB DP' && t.programme !== 'IGCSE' ? '<span class="small muted">' + E(t.programme) + '</span>' : '') + '</summary>' +
              (t.summary ? '<p class="small muted">' + E(t.summary) + '</p>' : '') + (items(t) ? '<div class="lgrid">' + items(t) + '</div>' : '') +
              (function (subs) {   // MYP Science: the units of a grade are kept in their subjects (Biology, Chemistry, Physics), one tab each
                return s.slug === 'myp-science' ? BV.subj.split(kids, function (k) { return BV.subj.of(k.name); }, subs) : subs(kids); })(function (list) { return list.map(function (k) { var inner = items(k);
                return '<div class="lsub' + (inner ? '' : ' empty') + '"><h4>' + E(s.slug === 'myp-science' ? String(k.name).replace(/^(Biology|Chemistry|Physics) · /, '') : k.name) + (k.summary && /HL only/.test(k.summary) ? ' <span class="pill">HL</span>' : '') + addHere(k) + '</h4>' +
                  (inner ? '<div class="lgrid">' + inner + '</div>' : '') + '</div>'; }).join(''); }) +
              '' + (!kids.length ? '<p>' + addHere(t) + '</p>' : '') + '</details>';
          }).join('') : '<p class="emptybox">Nothing matches.</p>');
        app.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { cur = b.getAttribute('data-s'); history.replaceState(null, '', '#' + cur); draw(); }; });
        app.querySelector('#only').onchange = function () { onlyLessons = this.checked; try { localStorage.setItem('bv-only', onlyLessons ? '1' : '0'); } catch (e) {} draw(); };
        var qi = app.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); var pos = qi.selectionStart; draw(); var n2 = app.querySelector('#q'); n2.focus(); n2.setSelectionRange(pos, pos); };
      }
      draw();
    });
  }

  function sims(me) {
    return S.db.from('simulations').select('id,title,description,url,thumbnail_url,source,is_internal,sort_order, topics(name, subjects(name,slug,colour))').eq('published', true).order('sort_order').then(function (r) {
      var all = r.data || [], f = 'all', q = '';
      var subs = []; all.forEach(function (s) { var sb = s.topics && s.topics.subjects; if (sb && !subs.some(function (x) { return x.slug === sb.slug; })) subs.push(sb); });
      function draw() {
        var list = all.filter(function (s) { var sb = s.topics && s.topics.subjects; return (f === 'all' || (f === 'ours' ? s.is_internal : sb && sb.slug === f)) && (!q || (s.title + ' ' + (s.description || '') + ' ' + (s.topics ? s.topics.name : '')).toLowerCase().indexOf(q) >= 0); });
        app.innerHTML = '<div class="row2"><div class="tabs">' + [['all', 'All'], ['ours', 'Made for our lessons']].concat(subs.map(function (x) { return [x.slug, x.name]; })).map(function (t) { return '<button type="button" aria-selected="' + (f === t[0]) + '" data-f="' + E(t[0]) + '">' + E(t[1]) + '</button>'; }).join('') + '</div>' +
          '<input id="q" type="search" placeholder="Search simulations" value="' + E(q) + '" style="max-width:280px" aria-label="Search simulations"></div>' +
          (list.length ? '<div class="courses">' + list.map(function (s) { var sb = s.topics && s.topics.subjects;
            return '<a class="course" style="--k:' + E(sb ? sb.colour : '#15803d') + '" href="' + E(s.url) + '"' + (s.is_internal ? '' : ' target="_blank" rel="noopener"') + '>' +
              (s.thumbnail_url ? '<img src="' + E(s.thumbnail_url) + '" alt="" loading="lazy" style="width:100%;height:140px;object-fit:cover;border-radius:10px;background:var(--surface)">' : '<span class="ic">🔬</span>') +
              '<span class="label" style="color:var(--k)">' + E(s.topics ? s.topics.name : (s.is_internal ? 'VistaEd lab' : s.source || 'External')) + '</span><b>' + E(s.title) + '</b><span class="muted">' + E(s.description || '') + '</span>' +
              '<span class="go">' + (s.is_internal ? 'Open lab →' : 'Open on ' + E(s.source || 'website') + ' ↗') + (me && me.admin ? S.del('simulation', s.id, s.title) : '') + '</span></a>'; }).join('') + '</div>' : '<p class="emptybox">No simulations match.</p>');
        app.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); draw(); }; });
        var qi = app.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); draw(); var n = app.querySelector('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      }
      draw();
    });
  }
})();
