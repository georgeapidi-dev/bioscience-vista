/* VistaEd · a class page for classes run by teachers from other schools: the lessons their teacher chose. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var id = new URLSearchParams(location.search).get('id') || '';
  S.guard(app, { allowPending: true, school: true }).then(function (me) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) { app.innerHTML = '<p class="emptybox">Open your class from <a href="/dashboard/">your dashboard</a>.</p>'; return; }
    return S.db.from('classes').select('id,name,subject,level,description,site_slug,school_name,teacher_id').eq('id', id).maybeSingle().then(function (r) {
      var c = r.data;
      if (!c) { app.innerHTML = '<p class="emptybox">This class is not one of yours. <a href="/dashboard/">Join it from your dashboard</a>.</p>'; return; }
      if (c.site_slug) { location.replace('/' + c.site_slug + '/'); return; }
      var mine = me.staff || c.teacher_id === me.user.id || (me.classes || []).some(function (x) { return x.id === c.id; });
      if (!mine) { app.innerHTML = '<p class="emptybox">Your teacher has not approved you for <b>' + E(c.name) + '</b> yet.</p>'; return; }
      return S.db.from('class_materials').select('path,sort,materials(title,unit,subject,level)').eq('class_id', id).order('sort').then(function (x) {
        var rows = x.data || [];
        app.innerHTML = '<header class="grp"><p class="label">' + E([c.school_name, c.subject, c.level].filter(Boolean).join(' · ')) + '</p><h1>' + E(c.name) + '</h1>' + (c.description ? '<p class="muted">' + E(c.description) + '</p>' : '') +
          (!me.ok && !me.staff ? '<p class="msg">Lessons open when you have <a href="/premium/">premium access</a>.</p>' : '') +
          '<div class="cta"><a class="btn sm" href="/quizzes/">Quizzes for my classes</a><a class="btn sm" href="/messages/">Message my teacher</a><a class="btn sm" href="/dashboard/">My dashboard</a></div></header>' +
          (rows.length ? '<section class="grp">' + BV.subj.split(rows, function (m) { var t = m.materials || {}; return /^MYP /.test(t.subject || '') ? BV.subj.of(t.subject, t.unit) : ''; }, function (list) { var last = '', lastLv = '';
            // Grade 6 to 10 science: one tab per subject (Biology, Chemistry, Physics); inside a tab, lessons sit under their unit
            list = list.slice().sort(function (a, b) { var x = (a.materials || {}).title || '', y = (b.materials || {}).title || ''; var tx = BV.theme(x), ty = BV.theme(y); return (tx ? tx.k : 'Z').localeCompare(ty ? ty.k : 'Z') || (tx ? tx.lv : 9) - (ty ? ty.lv : 9) || x.localeCompare(y, undefined, { numeric: true }); });
            return '<style>.cp-m{border-left:6px solid var(--hc,#0d9488);background:color-mix(in srgb,var(--hc,#0d9488) 6%,var(--raised,#fff));font-family:Outfit,system-ui,sans-serif}.cp-m a{color:color-mix(in srgb,var(--hc,#0d9488) 80%,#0f172a);text-decoration:none;font-weight:700}.cp-m a:hover{text-decoration:underline}.cp-th{display:inline-grid;place-items:center;min-width:22px;height:22px;border-radius:7px;background:var(--hc);color:#fff;font-size:.78rem;font-weight:800;margin-right:6px;padding:0 4px}.cp-lv{margin:18px 0 4px;padding:8px 12px;border-radius:12px;background:color-mix(in srgb,var(--hc) 12%,#fff);color:color-mix(in srgb,var(--hc) 80%,#0f172a);font-weight:800;font-family:Outfit,system-ui,sans-serif}.cp-h{color:color-mix(in srgb,var(--hc,#0d9488) 80%,#0f172a);border-left:5px solid var(--hc,#0d9488);padding-left:10px}</style>' +
              list.map(function (m) { var t = m.materials || {}, u = t.unit || '', lvk, th = BV.theme(t.title || u), col = th ? th.c : '#0d9488', lvk = th ? th.k + th.lv : '', lh = lvk && lvk !== lastLv ? '<p class="cp-lv" style="--hc:' + col + '"><span class="cp-th">' + th.k + '</span>Theme ' + th.k + ' · ' + E(th.name) + ' → <b>' + th.lv + ' · ' + E(th.level) + '</b></p>' : ''; lastLv = lvk || lastLv; hd = lh + (u !== last ? '<h3 class="sec-h cp-h" style="--hc:' + col + '">' + E(u) + '</h3>' : ''); last = u;
              return hd + '<article class="task cp-m" style="--hc:' + col + '"><div class="top2"><b><a href="' + E(m.path) + '">' + E(t.title || m.path) + '</a></b>' + (t.level === 'HL only' ? '<span class="pill">HL</span>' : '') + (me.admin ? S.del('classmat', c.id + '|' + m.path, (t.title || m.path) + ' (from ' + c.name + ')') : '') + '</div></article>'; }).join(''); }) + '</section>'
            : '<p class="emptybox">Your teacher has not added lessons yet.</p>');
        var sec = app.querySelector('section.grp'); if (sec && BV.findBox) BV.findBox(sec, '.cp-m', null, 'Find a lesson in this class…');
      });
    });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
})();
