/* Live page content from the teacher's Site editor · BioscienceVista */
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
  function inSite(u) {   // Drive and Google Docs files open in the site's viewer (view only)
    var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=)([\w-]+)/) || u.match(/docs\.google\.com\/(?:document|presentation|spreadsheets)\/d\/([\w-]+)/);
    return m ? '/view/?f=' + m[1] + '&b=' + encodeURIComponent(location.pathname) : u;
  }
  BV.card = function (it) {
    var u = inSite(it.link || ''), local = u.charAt(0) === '/', folder = /\/folders\//.test(u);
    var dl = '', tgt = it.locked || local ? '' : ' target="_blank" rel="noopener"';   // no downloads of materials
    var acts = (u ? '<a class="go" href="' + E(u) + '"' + tgt + '>' + (it.locked ? 'Open · class password' : folder ? 'Open folder' : 'Open') + '</a>' : '') +
      (dl ? '<a href="' + E(dl) + '" target="_blank" rel="noopener">Download</a>' : '');
    return '<div class="card"><b>' + E(it.title) + '</b><span>' + E(it.desc) + '</span>' + (acts ? '<div class="acts">' + acts + '</div>' : '') + '</div>';
  };
  BV.renderSections = function (sections) {
    return sections.map(function (s) {
      var id = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (!s.items.length) return '';   // empty sections are hidden, not "coming soon" (21 Nov 2026)
      return '<section class="grp" id="' + id + '"><h2 class="sec-h">' + E(s.name) + '</h2><div class="res">' + s.items.map(BV.card).join('') + '</div></section>';
    }).join('');
  };
  /* The first backend (Google Sheet) was retired on 15 Nov 2026: page sections are built into the pages, and the home page
     shows the admin's public announcements from BioscienceVista (table announcements, migration 044). */
  var news = document.getElementById('news');
  if (!news || !BV.sbUrl || !BV.sbKey) return;
  fetch(BV.sbUrl + '/rest/v1/announcements?select=title,body,link,created_at,expires_at,pinned&class_id=is.null&is_public=eq.true&order=pinned.desc,created_at.desc&limit=8',
    { headers: { apikey: BV.sbKey, Authorization: 'Bearer ' + BV.sbKey } }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
    var now = Date.now(); rows = (rows || []).filter(function (a) { return !a.expires_at || new Date(a.expires_at).getTime() >= now; }).slice(0, 4);
    if (!rows.length) return;
    news.innerHTML = '<h2 class="sec-h">📣 Announcements</h2>' + rows.map(function (it) {
      return '<div class="item"><b>' + E(it.title) + '</b><span>' + E(it.body) + '</span>' + (it.link && /^(\/|https:\/\/)/.test(it.link) ? '<div class="acts"><a class="go" href="' + E(it.link) + '">Open</a></div>' : '') + '</div>'; }).join('');
    news.hidden = false;
  }, function () {});
})();
