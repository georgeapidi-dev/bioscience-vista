/* Learnova · class lessons: a signed-in student sees only the classes they joined and were approved for.
   Teachers and visitors who are not signed in still see every class (the pages themselves stay locked). */
document.addEventListener('DOMContentLoaded', function () {
  var S = window.BVS; if (!S || !S.db) return;
  S.db.auth.getSession().then(function (r) {
    var s = r.data && r.data.session; if (!s) return;
    return Promise.all([S.db.rpc('is_staff'), S.db.rpc('my_access')]).then(function (x) {
      if (x[0].data === true) return;
      var acc = x[1].data || {}, roles = acc.roles || [];
      if (roles.indexOf('school_teacher') >= 0 || acc.account_type === 'teacher') return;
      var cls = (acc.classes || []).filter(function (c) { return c.status === 'approved'; });
      var mine = cls.map(function (c) { return c.slug; }).filter(Boolean);
      var base = function (id) { return String(id).replace(/-(sl|hl)$/, ''); };
      var tiles = document.querySelectorAll('[data-cls]'), page = document.querySelector('[data-page-cls]');
      var pc = page ? page.getAttribute('data-page-cls') : '';
      var note = function (html, where) { var n = document.createElement('p'); n.className = 'emptybox'; n.innerHTML = html; where.after ? where.after(n) : where.appendChild(n); };
      if (!cls.length) {
        tiles.forEach(function (t) { t.hidden = true; });
        var at = document.querySelector('nav.grid') || page; if (at) note('Join a class first: open <a href="/dashboard/">My dashboard</a>, choose your school or teacher, then your class. Your lessons appear here when your teacher approves you.', at);
        return;
      }
      tiles.forEach(function (t) { var id = t.getAttribute('data-cls'); t.hidden = !mine.some(function (m) { return m === id || base(m) === id; }); });
      var head = document.querySelector('.hero p.muted');
      if (head && tiles.length) head.textContent = 'Your classes: ' + cls.map(function (c) { return c.name; }).join(', ') + '.';
      if (tiles.length && !mine.length) {   // only classes from a teacher's own school: they live on the class page
        var g = document.querySelector('nav.grid'); if (g) note('Your classes are on your dashboard: ' + cls.map(function (c) { return '<a href="/class/?id=' + S.E(c.id) + '">' + S.E(c.name) + '</a>'; }).join(' · '), g);
      }
      if (!page) return;
      if (page.getAttribute('data-chooser')) {   // IB subject page: go straight to the student's level when they have only one
        var lv = mine.filter(function (m) { return base(m) === pc && m !== pc; });
        if (lv.length === 1) location.replace('/' + lv[0] + '/');
        return;
      }
      if (mine.indexOf(pc) < 0) {
        var list = document.querySelector('section.list'); if (list) list.hidden = true;
        note('These lessons are for another class. Your classes: ' + cls.map(function (c) { return '<a href="' + (c.slug ? '/' + S.E(c.slug) + '/' : '/class/?id=' + S.E(c.id)) + '">' + S.E(c.name) + '</a>'; }).join(' · ') + '. To add this class, join it from <a href="/dashboard/">My dashboard</a>.', page);
      }
    });
  }).catch(function () {});
});
