/* Learnova · open course materials inside the site (view only, no download).
   Resource pages: a list of [data-f] buttons; tapping one shows it in the viewer above the list.
   /view/?f=<id>&t=<title>&b=<back>: a single file. Videos and documents stream from the creator's files. */
(function () {
  var dv = document.getElementById('dv'); if (!dv) return;
  var box = document.getElementById('dv-box'), tt = document.getElementById('dv-t');
  var list = [].slice.call(document.querySelectorAll('[data-f]')), cur = -1;
  function ok(id) { return /^[\w-]{10,}$/.test(id || ''); }
  function show(id, kind, title, i) {
    if (!ok(id)) return;
    cur = i == null ? -1 : i;
    list.forEach(function (b, j) { b.classList.toggle('on', j === cur); });
    tt.textContent = title || 'Document';
    box.className = 'dv-box ' + (kind === 'video' ? 'v' : 'd');
    box.innerHTML = '';
    var fr = document.createElement('iframe');
    fr.src = 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/preview';
    fr.allow = 'autoplay; fullscreen'; fr.setAttribute('allowfullscreen', ''); fr.title = title || 'Document';
    fr.setAttribute('referrerpolicy', 'no-referrer');
    box.appendChild(fr);
    var c = document.createElement('div'); c.className = 'cover'; box.appendChild(c);   // hides Drive's "open in new window" corner
    dv.hidden = false;
    document.getElementById('dv-prev').hidden = document.getElementById('dv-next').hidden = cur < 0;
    try { history.replaceState(null, '', location.pathname + location.search + (cur >= 0 ? '#f=' + id : '')); } catch (e) {}
    dv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function step(d) {
    if (cur < 0) return;
    for (var j = cur + d; j >= 0 && j < list.length; j += d) {
      if (!list[j].closest('li').hidden) { var b = list[j]; show(b.getAttribute('data-f'), b.getAttribute('data-k'), b.getAttribute('data-t'), j); return; }
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-f]');
    if (b) { show(b.getAttribute('data-f'), b.getAttribute('data-k'), b.getAttribute('data-t'), list.indexOf(b)); return; }
    if (e.target.id === 'dv-prev') step(-1);
    if (e.target.id === 'dv-next') step(1);
    if (e.target.id === 'dv-x') { box.innerHTML = ''; dv.hidden = true; cur = -1; list.forEach(function (x) { x.classList.remove('on'); }); try { history.replaceState(null, '', location.pathname + location.search); } catch (e2) {} }
  });
  dv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  var q = document.getElementById('rl-q');
  if (q) q.addEventListener('input', function () {
    var v = q.value.trim().toLowerCase();
    [].forEach.call(document.querySelectorAll('.rl li'), function (li) { li.hidden = v && li.getAttribute('data-txt').indexOf(v) < 0; });
    [].forEach.call(document.querySelectorAll('.rl-h'), function (h) { var ul = h.nextElementSibling; h.hidden = ul && ![].some.call(ul.children, function (li) { return !li.hidden; }); });
  });
  // deep links
  var p = new URLSearchParams(location.search), h = (location.hash.match(/#f=([\w-]+)/) || [])[1];
  if (p.get('f')) {
    var t = p.get('t') || 'Document', back = p.get('b') || '/';
    if (!/^\/[\w\/-]*$/.test(back)) back = '/';
    var vt = document.getElementById('vw-t'), vb = document.getElementById('vw-back');
    if (vt) vt.textContent = t; if (vb) vb.href = back; document.title = t + ' · Learnova';
    show(p.get('f'), p.get('k') === 'video' ? 'video' : 'doc', t);
  } else if (h) {
    var b0 = list.filter(function (b) { return b.getAttribute('data-f') === h; })[0];
    if (b0) show(h, b0.getAttribute('data-k'), b0.getAttribute('data-t'), list.indexOf(b0));
  }
})();
