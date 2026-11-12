/* Learnova · class lessons: a signed-in student sees only the lessons of the class they registered for.
   Teachers and visitors who are not signed in still see every class. */
document.addEventListener('DOMContentLoaded', function () {
  var S = window.BVS; if (!S || !S.db) return;
  function slug(name) {   // "Grade 9 Science" → grade-9, "DP1 Biology" / "IB DP year 1" → dp1
    var n = String(name || '').toLowerCase(), m;
    if ((m = /\bdp\s*([12])\b|ib dp year ([12])/.exec(n))) {   // "DP1 Biology SL" → dp1-sl, "DP1 Biology HL" → dp1-hl
      var lv = /\b(sl|standard level)\b/.test(n) ? '-sl' : /\b(hl|higher level)\b/.test(n) ? '-hl' : '';
      return 'dp' + (m[1] || m[2]) + lv;
    }
    if ((m = /grade\s*(\d+)/.exec(n))) return 'grade-' + m[1];
    return '';
  }
  S.db.auth.getSession().then(function (r) {
    var s = r.data && r.data.session; if (!s) return;
    return Promise.all([S.db.rpc('is_staff'), S.db.from('profiles').select('class_id, classes(name)').eq('id', s.user.id).maybeSingle()]).then(function (x) {
      if (x[0].data === true) return;
      var cls = x[1].data && x[1].data.classes && x[1].data.classes.name, mine = slug(cls);
      var tiles = document.querySelectorAll('[data-cls]'), page = document.querySelector('[data-page-cls]');
      if (!cls) {
        var note = document.createElement('p'); note.className = 'msg';
        note.innerHTML = 'Join your class first: open <a href="/dashboard/">My dashboard</a> and type the class code from your teacher. Then you will see your class lessons here.';
        (document.querySelector('nav.grid') || document.querySelector('main')).before(note); tiles.forEach(function (t) { t.hidden = true; });
        return;
      }
      tiles.forEach(function (t) { t.hidden = t.getAttribute('data-cls') !== mine; });
      var head = document.querySelector('.hero p.muted'); if (head && tiles.length) head.textContent = 'Your class: ' + cls + '. Open it to see your interactive lessons.';
      // DP students go straight to their own level: /lessons/, /dp1/ and the other level's page all open /dp1-sl/ (or /dp1-hl/)
      var pc = page ? page.getAttribute('data-page-cls') : '', lvl = /^dp[12]-(sl|hl)$/.test(mine);
      if (lvl && (!page || pc === mine.slice(0, 3) || (/^dp[12]-/.test(pc) && pc !== mine))) { location.replace('/' + mine + '/'); return; }
      if (page && page.getAttribute('data-page-cls') !== mine) {
        var list = document.querySelector('section.list'); if (list) list.hidden = true;
        var n = document.createElement('p'); n.className = 'emptybox';
        n.innerHTML = 'These lessons are for another class. <a href="/' + (mine || 'lessons') + '/">Go to your class lessons (' + S.E(cls) + ')</a>.';
        page.after(n);
      }
    });
  }).catch(function () {});
});
