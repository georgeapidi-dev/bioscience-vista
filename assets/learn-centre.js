/* Learning centre and simulation library · Learnova */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), mode = app.getAttribute('data-mode');
  var KIND = { file: '📄', folder: '📁', video: '🎬', link: '🔗', slides: '🖥', worksheet: '📝', 'past paper': '📚' };
  S.guard(app).then(function (me) { return mode === 'sims' ? sims(me) : centre(me); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  /* Learning centre: subject → topic → subtopic, following each syllabus; interactive lessons sit in their subtopic */
  function centre(me) {
    return Promise.all([
      S.db.from('subjects').select('id,slug,name,colour,sort_order').order('sort_order'),
      S.db.from('topics').select('id,subject_id,parent_id,name,code,programme,summary,sort_order,published').order('sort_order'),
      S.db.from('lessons').select('id,topic_id,title,summary,url,minutes,max_marks,sort_order,published,external_id').order('sort_order'),
      S.db.from('resources').select('id,topic_id,title,kind,url,download_url,sort_order,published').order('sort_order'),
      S.db.from('learning_progress').select('lesson_id,status,percent').eq('student_id', me.user.id),
      S.db.from('quizzes').select('id,title,instructions,due_at').eq('category', 'lesson').in('published', (me.roles || []).some(function (r) { return r === 'admin' || r === 'teacher'; }) ? [true] : [true, false]).order('created_at', { ascending: false }),
      S.db.from('simulations').select('id,topic_id,title,url,is_internal').eq('published', true)
    ]).then(function (x) {
      var subjects = x[0].data || [], topics = (x[1].data || []).filter(function (t) { return t.published; }), prog = {}, mineIL = {};
      (x[4].data || []).forEach(function (p) { prog[p.lesson_id] = p; });
      (x[5].data || []).forEach(function (q) { mineIL['IL-' + q.id] = q; });   // interactive lessons set for this student's class
      // a teacher-built lesson is listed only if it is set for this student's class
      var lessons = (x[2].data || []).filter(function (l) { return l.published && (!/^IL-/.test(l.external_id || '') || me.staff || mineIL[l.external_id]); });
      var by = function (list, k) { var m = {}; list.forEach(function (o) { (m[o[k]] = m[o[k]] || []).push(o); }); return m; };
      var L = by(lessons, 'topic_id'), R = by((x[3].data || []).filter(function (r) { return r.published; }), 'topic_id'), SIM = by(x[6].data || [], 'topic_id'), KIDS = by(topics.filter(function (t) { return t.parent_id; }), 'parent_id');
      var orphanIL = Object.keys(mineIL).filter(function (k) { return !lessons.some(function (l) { return l.external_id === k && l.topic_id; }); }).map(function (k) { return mineIL[k]; });
      subjects = subjects.filter(function (s) { return topics.some(function (t) { return t.subject_id === s.id; }); });
      var cur = location.hash.slice(1) || (subjects[0] && subjects[0].slug), q = '', onlyLessons = false;
      try { onlyLessons = localStorage.getItem('bv-only') === '1'; } catch (e) {}

      function count(t) { var n = (L[t.id] || []).length + (R[t.id] || []).length + (SIM[t.id] || []).length; (KIDS[t.id] || []).forEach(function (k) { n += count(k); }); return n; }
      function lessonCard(l) {
        var p = prog[l.id], pc = p ? p.percent : 0, il = /^IL-/.test(l.external_id || '');
        return '<a class="lcard" href="' + E(l.url || '#') + '"><span class="ic">' + (il ? '📘' : '🧪') + '</span><span><b>' + E(l.title) + '</b><span class="small muted">' + E(l.summary || '') + (l.max_marks ? ' · ' + l.max_marks + ' marks' : '') + '</span>' +
          '<span class="bar" title="' + pc + '% done"><i style="width:' + pc + '%"></i></span></span><span class="go">' + (p && p.status === 'completed' ? 'Review ✓' : p ? 'Continue' : 'Start') + '</span></a>';
      }
      function items(t) {
        return (L[t.id] || []).map(lessonCard).join('') +
          (SIM[t.id] || []).map(function (s) { return '<a class="lcard" href="' + E(s.url) + '"' + (s.is_internal ? '' : ' target="_blank" rel="noopener"') + '><span class="ic">🔬</span><span><b>' + E(s.title) + '</b><span class="small muted">Virtual lab</span></span><span class="go">Open</span></a>'; }).join('') +
          (R[t.id] || []).map(function (r) { return '<a class="lcard" href="' + E(r.url) + '" target="_blank" rel="noopener"><span class="ic">' + (r.kind === 'video' ? '🎬' : '📄') + '</span><span><b>' + E(r.title) + '</b><span class="small muted">' + E(r.kind === 'video' ? 'Videos' : 'Notes') + '</span></span><span class="go">Open ↗</span></a>'; }).join('');
      }
      function match(t) { if (!q) return true; var txt = (t.name + ' ' + (t.code || '') + ' ' + (L[t.id] || []).map(function (l) { return l.title; }).join(' ')).toLowerCase(); return txt.indexOf(q) >= 0 || (KIDS[t.id] || []).some(match); }
      function draw() {
        var s = subjects.filter(function (z) { return z.slug === cur; })[0] || subjects[0];
        var il = orphanIL.length ? '<section class="grp"><h3 class="sec-h">📘 Interactive lessons for your class</h3><div class="lgrid">' + orphanIL.map(function (q2) {
          var row = lessons.filter(function (l) { return l.external_id === 'IL-' + q2.id; })[0] || { id: null, title: q2.title, url: '/lesson/#' + q2.id, external_id: 'IL-' + q2.id, summary: (q2.instructions || '').split('\n')[0] };
          return lessonCard(row); }).join('') + '</div></section>' : '';
        if (!s) { app.innerHTML = il || '<p class="emptybox">No learning content has been published yet.</p>'; return; }
        var tops = topics.filter(function (t) { return t.subject_id === s.id && !t.parent_id; }).filter(match).filter(function (t) { return !onlyLessons || count(t); });
        var make = me.staff ? '<div class="panel tint row2 lmake"><span><b>Teachers:</b> turn any file (PDF, Word, PowerPoint, Excel, web page, text or pictures) into an interactive six-step lesson. Use <b>＋ Add lesson</b> in a subtopic to file it there.</span><a class="btn main sm" href="/staff/#lessons/new">✨ Create an interactive lesson from a file</a></div>' : '';
        var addHere = function (t) { return me.staff ? '<a class="addles small" href="/staff/#lessons/new/' + t.id + '">＋ Add lesson</a>' : ''; };
        app.innerHTML = make + il + '<div class="tabs" role="tablist">' + subjects.map(function (z) { return '<button role="tab" aria-selected="' + (z === s) + '" data-s="' + E(z.slug) + '" style="' + (z === s ? 'background:' + E(z.colour) + ';color:#fff' : '') + '">' + E(z.name) + '</button>'; }).join('') + '</div>' +
          '<div class="row2"><input id="q" type="search" placeholder="Search topics and lessons" value="' + E(q) + '" style="max-width:340px" aria-label="Search topics and lessons">' +
          '<label class="chk small"><input type="checkbox" id="only"' + (onlyLessons ? ' checked' : '') + '> Only show topics with lessons</label></div>' +
          (tops.length ? tops.map(function (t) {
            var kids = (KIDS[t.id] || []).filter(function (k) { return k.published && (!q || match(k) || match(t)) && (!onlyLessons || count(k)); }), n = count(t);
            return '<details class="ltopic"' + (n || q ? ' open' : '') + '><summary><span class="lt-name">' + E(t.name) + '</span><span class="pill">' + (n ? n + ' item' + (n === 1 ? '' : 's') : 'coming soon') + '</span>' + (t.programme && t.programme !== 'IB DP' && t.programme !== 'IGCSE' ? '<span class="small muted">' + E(t.programme) + '</span>' : '') + '</summary>' +
              (t.summary ? '<p class="small muted">' + E(t.summary) + '</p>' : '') + (items(t) ? '<div class="lgrid">' + items(t) + '</div>' : '') +
              kids.map(function (k) { var inner = items(k);
                return '<div class="lsub' + (inner ? '' : ' empty') + '"><h4>' + E(k.name) + (k.summary && /HL only/.test(k.summary) ? ' <span class="pill">HL</span>' : '') + addHere(k) + '</h4>' +
                  (inner ? '<div class="lgrid">' + inner + '</div>' : '<p class="small muted">Interactive lessons coming soon.</p>') + '</div>'; }).join('') +
              (!kids.length && !items(t) ? '<p class="small muted">Interactive lessons coming soon.</p>' : '') + (!kids.length ? '<p>' + addHere(t) + '</p>' : '') + '</details>';
          }).join('') : '<p class="emptybox">Nothing matches.</p>');
        app.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { cur = b.getAttribute('data-s'); history.replaceState(null, '', '#' + cur); draw(); }; });
        app.querySelector('#only').onchange = function () { onlyLessons = this.checked; try { localStorage.setItem('bv-only', onlyLessons ? '1' : '0'); } catch (e) {} draw(); };
        var qi = app.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); var pos = qi.selectionStart; draw(); var n2 = app.querySelector('#q'); n2.focus(); n2.setSelectionRange(pos, pos); };
      }
      draw();
    });
  }

  function sims() {
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
              '<span class="label" style="color:var(--k)">' + E(s.topics ? s.topics.name : (s.is_internal ? 'Learnova lab' : s.source || 'External')) + '</span><b>' + E(s.title) + '</b><span class="muted">' + E(s.description || '') + '</span>' +
              '<span class="go">' + (s.is_internal ? 'Open lab →' : 'Open on ' + E(s.source || 'website') + ' ↗') + '</span></a>'; }).join('') + '</div>' : '<p class="emptybox">No simulations match.</p>');
        app.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); draw(); }; });
        var qi = app.querySelector('#q'); qi.oninput = function () { q = qi.value.toLowerCase().trim(); draw(); var n = app.querySelector('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      }
      draw();
    });
  }
})();
