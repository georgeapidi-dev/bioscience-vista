/* Learnova · reviews on the home page: only reviews from real students, parents and teachers that the admin has published. */
document.addEventListener('DOMContentLoaded', function () {
  var box = document.getElementById('reviews'), S = window.BVS; if (!box || !S || !S.db) return;
  S.db.from('reviews').select('who,display_name,school,rating,body,created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(12).then(function (r) {
    var rows = r.data || [], E = S.E;
    if (!rows.length) { box.querySelector('.rv-list').innerHTML = '<p class="muted">Be one of the first to review Learnova: open <a href="/dashboard/">your dashboard</a> after a lesson and press ⭐ Review Learnova.</p>'; return; }
    box.querySelector('.rv-list').innerHTML = rows.map(function (v) {
      return '<figure class="rv"><div class="rv-st" aria-label="' + v.rating + ' out of 5 stars">' + '★'.repeat(v.rating) + '<span>' + '★'.repeat(5 - v.rating) + '</span></div><blockquote>' + E(v.body) + '</blockquote><figcaption><b>' + E(v.display_name) + '</b> · ' + E(v.who) + (v.school ? ', ' + E(v.school) : '') + '</figcaption></figure>';
    }).join('');
  });
});
