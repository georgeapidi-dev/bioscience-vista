/* Learnova · a class page for classes run by teachers from other schools: the lessons their teacher chose. */
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
        var rows = x.data || [], last = '';
        app.innerHTML = '<header class="grp"><p class="label">' + E([c.school_name, c.subject, c.level].filter(Boolean).join(' · ')) + '</p><h1>' + E(c.name) + '</h1>' + (c.description ? '<p class="muted">' + E(c.description) + '</p>' : '') +
          (!me.ok && !me.staff ? '<p class="msg">Lessons open when you have <a href="/premium/">premium access</a>.</p>' : '') +
          '<div class="cta"><a class="btn sm" href="/quizzes/">Quizzes for my classes</a><a class="btn sm" href="/messages/">Message my teacher</a><a class="btn sm" href="/dashboard/">My dashboard</a></div></header>' +
          (rows.length ? '<section class="grp">' + rows.map(function (m) { var t = m.materials || {}, u = t.unit || '', hd = u !== last ? '<h3 class="sec-h">' + E(u) + '</h3>' : ''; last = u;
            return hd + '<article class="task"><div class="top2"><b><a href="' + E(m.path) + '">' + E(t.title || m.path) + '</a></b>' + (t.level === 'HL only' ? '<span class="pill">HL</span>' : '') + '</div></article>'; }).join('') + '</section>'
            : '<p class="emptybox">Your teacher has not added lessons yet.</p>');
      });
    });
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
})();
