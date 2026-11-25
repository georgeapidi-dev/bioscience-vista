/* Parent page: a read-only view of each linked child's marks, lesson progress and teacher feedback · VistaEd */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), BV = window.BV || {};
  if (!S.on) return S.notReady(app);
  var ME = null;
  function toast(m, bad) { if (BV.toast) BV.toast(m, bad); }

  S.guard(app, { parent: true }).then(function (me) { ME = me; return load(); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function load() {
    return S.db.from('parent_links').select('student_id').eq('parent_id', ME.user.id).then(function (r) {
      if (r.error) throw r.error;
      var ids = (r.data || []).map(function (l) { return l.student_id; });
      if (!ids.length) return draw([], [], [], []);
      return Promise.all([
        S.db.from('profiles').select('id, full_name').in('id', ids),
        S.db.from('student_results').select('student_id, lesson_id, quiz_id, title, score, max_score, teacher_feedback, ai_feedback, recorded_at').in('student_id', ids).order('recorded_at', { ascending: false }),
        S.db.from('learning_progress').select('student_id, lesson_id, percent, lessons(title)').in('student_id', ids)
      ]).then(function (x) {   // Grade 6 to 10 science: marks and lessons are shown under their own subject (Biology, Chemistry or Physics)
        var res = x[1].data || [], pg = x[2].data || [];
        return S.subjectLookup(res.map(function (r) { return r.lesson_id; }).concat(pg.map(function (l) { return l.lesson_id; })), res.map(function (r) { return r.quiz_id; })).then(function (look) { SUBJ = look; }, function () {})
          .then(function () { draw(x[0].data || [], res, pg, ids); });
      });
    });
  }

  var SUBJ = null;
  function subjOfResult(r) { if (!SUBJ) return ''; var kind = r.quiz_id ? 'quiz' : 'lesson', id = r.quiz_id || r.lesson_id; return SUBJ.myp(kind, id, r.title) ? SUBJ[kind](id, r.title) : ''; }
  function subjOfLesson(l) { var t = l.lessons && l.lessons.title; return SUBJ && SUBJ.myp('lesson', l.lesson_id, t) ? SUBJ.lesson(l.lesson_id, t) : ''; }
  function child(k, results, prog) {
    var rs = results.filter(function (r) { return r.student_id === k.id; }), pg = prog.filter(function (l) { return l.student_id === k.id; });
    var marked = rs.filter(function (r) { return r.score != null; });
    var s = marked.reduce(function (a, r) { return a + +r.score; }, 0), m = marked.reduce(function (a, r) { return a + +r.max_score; }, 0);
    var avg = S.pct(s, m);
    return '<section class="panel"><div class="row2"><h2>' + E(k.full_name) + '</h2>' + (avg == null ? '' : '<span class="pill">Average ' + avg + '%</span>') + '</div>' +
      '<h3>Lesson progress</h3>' + (pg.length ? BV.subj.split(pg, subjOfLesson, function (part) { return part.map(function (l) { return '<div class="row2"><span class="small">' + E(l.lessons ? l.lessons.title : '') + '</span><span class="small muted">' + l.percent + '%</span></div><div class="bar"><i style="width:' + l.percent + '%"></i></div>'; }).join(''); }) : '<p class="muted">No lessons opened yet.</p>') +
      '<h3>Marks and feedback</h3>' + (rs.length ? BV.subj.split(rs, subjOfResult, function (part) { return part.map(function (r) {
        return '<article class="task"><div class="top2"><b>' + E(r.title) + '</b><span class="small muted">' + E(S.when(r.recorded_at)) + '</span></div>' +
          '<p><b>' + (r.score == null ? 'Not marked yet' : E(r.score) + ' / ' + E(r.max_score)) + '</b></p>' +
          (r.teacher_feedback ? '<div class="fb"><h4>Teacher feedback</h4><p>' + E(r.teacher_feedback) + '</p></div>' : '') +
          (r.ai_feedback ? '<div class="fb ai"><h4>AI feedback</h4>' + (BV.md ? BV.md(r.ai_feedback) : '<p>' + E(r.ai_feedback) + '</p>') + '</div>' : '') + '</article>';
      }).join(''); }) : '<p class="emptybox">No marks yet.</p>') +
      '<p class="small"><button class="btn sm" type="button" data-unlink="' + E(k.id) + '">Remove this link</button></p></section>';
  }

  /* Calendar of work set for each linked child, with due dates and whether it is done (migration 080, child_calendar) */
  function calendar(host, kids) {
    var nm = {}; kids.forEach(function (k) { nm[k.id] = (k.full_name || '').split(' ')[0]; });
    var go = function () { return window.BVCAL ? Promise.resolve() : new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = '/assets/calendar.js?v=' + (window.BV_VER || '5'); x.onload = ok; x.onerror = bad; document.head.appendChild(x); }); };
    S.db.rpc('child_calendar').then(function (r) {
      if (r.error) { host.remove(); return; }
      return go().then(function () {
        BVCAL.month(host, { title: '📅 Calendar', empty: 'No work is due this month.', note: 'Work set by teachers, on the day it is due. Crossed out = done.',
          items: (r.data || []).map(function (a) { return { d: a.due_at, t: a.title, k: a.kind, st: a.state, sub: kids.length > 1 ? nm[a.student_id] : '', c: a.state === 'done' ? '#16a34a' : new Date(a.due_at) < new Date() ? '#dc2626' : '#4f46e5' }; }) });
      });
    }, function () { host.remove(); });
  }

  function draw(kids, results, prog, ids) {
    var body = ids.length ? kids.map(function (k) { return child(k, results, prog); }).join('')
      : '<section class="panel tint"><h2>No child linked yet</h2><p>Enter the parent code your school gave you, below. Then you can see your child\'s marks and feedback here.</p></section>';
    app.innerHTML = '<section class="hero"><p class="label">Parent view</p><h1>My child\'s progress</h1><p class="muted">Read-only. You see the marks, lesson progress and teacher feedback for each child linked to your account. You cannot change anything here.</p></section>' +
      (ids.length ? '<section class="panel" id="ppf"></section><section class="panel" id="psv"></section><section class="panel" id="prep"></section><section class="panel" id="pcal"></section>' : '') + '<div class="grp">' + body + '</div>' +
      '<section class="panel"><h2>Add another child</h2><p class="small muted">Ask the school for your child\'s parent code.</p>' +
      '<form id="lk" class="row2"><label class="f">Parent code<input id="lc" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase" required></label><button class="btn main sm" type="submit">Link child</button></form><p class="msg" id="lm" role="alert"></p></section>' +
      '<p class="small muted">Signed in as ' + E(ME.user.email) + ' · <a href="#" id="lo">Log out</a></p>';

    app.querySelector('#lo').onclick = function (e) { e.preventDefault(); S.signOut(); };
    var pc = app.querySelector('#pcal'); if (pc) calendar(pc, kids);
    var pp = app.querySelector('#ppf'); if (pp) { var pn = {}; kids.forEach(function (k) { pn[k.id] = k.full_name; }); (window.BVPF ? Promise.resolve() : new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = '/assets/portfolio.js?v=' + (window.BV_VER || '5'); x.onload = ok; x.onerror = bad; document.head.appendChild(x); })).then(function () { BVPF.view(pp, S, { ids: ids, names: pn }); }, function () { pp.remove(); }); }   /* 🗂 shared portfolio items (migration 085) */
    var ps = app.querySelector('#psv'); if (ps) { var sn = {}; kids.forEach(function (k) { sn[k.id] = k.full_name; }); (window.BVSVC ? Promise.resolve() : new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = '/assets/service.js?v=' + (window.BV_VER || '5'); x.onload = ok; x.onerror = bad; document.head.appendChild(x); })).then(function () { BVSVC.view(ps, S, { ids: ids, names: sn }); }, function () { ps.remove(); }); }   /* 🤝 shared CAS / Service as Action (migration 086) */
    var pr = app.querySelector('#prep'); if (pr) (window.BVREP ? Promise.resolve() : new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = '/assets/reports.js?v=' + (window.BV_VER || '5'); x.onload = ok; x.onerror = bad; document.head.appendChild(x); })).then(function () { BVREP.mine(pr, S); }, function () { pr.remove(); });   /* 📄 published term reports (migration 084) */
    app.querySelector('#lk').onsubmit = function (e) {
      e.preventDefault(); var msg = app.querySelector('#lm'); msg.className = 'msg';
      S.db.rpc('link_child', { pcode: app.querySelector('#lc').value.trim() }).then(function (r) {
        if (r.error) { msg.textContent = S.nice(r.error); return; }
        toast('Linked to ' + (r.data || 'your child')); load().catch(function () {});
        app.querySelector('#lc').value = '';
      });
    };
    app.querySelectorAll('[data-unlink]').forEach(function (b) {
      b.onclick = function () {
        if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again to remove the link'; return; }
        S.db.from('parent_links').delete().eq('parent_id', ME.user.id).eq('student_id', b.getAttribute('data-unlink')).then(function (r) {
          if (r.error) { toast(S.nice(r.error), true); return; }
          toast('Link removed'); load().catch(function () {});
        });
      };
    });
  }
})();
