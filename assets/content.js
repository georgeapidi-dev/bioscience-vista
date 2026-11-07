/* Live page content from the teacher's Site editor · BioScience Vista */
(function () {
  var E = BV.esc;
  function autoDl(u) {
    u = u || ''; var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]+)/);
    if (m) return 'https://drive.google.com/uc?export=download&id=' + m[1];
    m = u.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([\w-]+)/);
    if (m) return { document: 'https://docs.google.com/document/d/' + m[2] + '/export?format=pdf', presentation: 'https://docs.google.com/presentation/d/' + m[2] + '/export/pdf', spreadsheets: 'https://docs.google.com/spreadsheets/d/' + m[2] + '/export?format=xlsx' }[m[1]];
    return '';
  }
  BV.autoDl = autoDl;
  BV.card = function (it) {
    var u = it.link || '', local = u.charAt(0) === '/', folder = /\/folders\//.test(u);
    var dl = it.dl || (it.locked ? '' : autoDl(u)), tgt = it.locked || local ? '' : ' target="_blank" rel="noopener"';
    var acts = (u ? '<a class="go" href="' + E(u) + '"' + tgt + '>' + (it.locked ? 'Open · class password' : folder ? 'Open folder' : 'Open') + '</a>' : '') +
      (dl ? '<a href="' + E(dl) + '" target="_blank" rel="noopener">Download</a>' : '');
    return '<div class="card"><b>' + E(it.title) + '</b><span>' + E(it.desc) + '</span>' + (acts ? '<div class="acts">' + acts + '</div>' : '') + '</div>';
  };
  BV.renderSections = function (sections) {
    return sections.map(function (s) {
      var id = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return '<section class="grp" id="' + id + '"><h2 class="sec-h">' + E(s.name) + '</h2>' +
        (s.items.length ? '<div class="res">' + s.items.map(BV.card).join('') + '</div>' : '<p class="emptybox">Coming soon.</p>') + '</section>';
    }).join('');
  };
  var live = document.getElementById('live'), news = document.getElementById('news');
  var target = live || news; if (!target) return;
  BV.api('content', { page: target.getAttribute('data-page') }).then(function (d) {
    if (!d || !d.ok) return;
    if (news) {
      var items = (d.sections[0] && d.sections[0].items) || [];
      if (!items.length) return;
      news.innerHTML = '<h2 class="sec-h">' + E((d.intro && d.intro.title) || 'Announcements') + '</h2>' +
        items.map(function (it) { return '<div class="item"><b>' + E(it.title) + '</b><span>' + E(it.desc) + '</span>' + (it.link ? '<div class="acts"><a class="go" href="' + E(it.link) + '">Open</a></div>' : '') + '</div>'; }).join('');
      news.hidden = false; return;
    }
    if (d.intro) { var t = document.getElementById('ptitle'), p = document.getElementById('pdesc'); if (t && d.intro.title) t.textContent = d.intro.title; if (p && d.intro.desc) p.textContent = d.intro.desc; }
    live.innerHTML = BV.renderSections(d.sections);
    var toc = document.querySelector('nav.toc[data-live]');
    if (toc) toc.innerHTML = d.sections.map(function (s) { return '<a href="#' + s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '">' + E(s.name) + '</a>'; }).join('');
  });
})();
