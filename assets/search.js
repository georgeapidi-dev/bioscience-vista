/* BioscienceVista · search the whole site from any page (added 16 Nov 2026, admin: "easy to search a material in each page").
   A Search button in the header (and in the quick-tools menu, and a big box on the home page) opens one search over every interactive lesson,
   virtual lab, simulation, game and main page (assets/search.json, made by build_site.py). Press / or Ctrl+K to open it. */
(function () {
  if (window.top !== window || window.__bvSearch) return; window.__bvSearch = 1;
  var DATA = null, loading = null;
  var TYPES = { Lesson: ['Interactive lessons', '#2563eb'], Lab: ['Virtual labs', '#0d9488'], Simulation: ['Simulations', '#16a34a'], Game: ['Games', '#db2777'], Page: ['Pages', '#7c3aed'] };
  var ORDER = ['Lesson', 'Lab', 'Simulation', 'Game', 'Page'];
  function load() { if (DATA) return Promise.resolve(DATA); if (!loading) loading = fetch('/assets/search.json?v=' + (window.BV && BV.ver || '')).then(function (r) { return r.json(); }).then(function (d) { DATA = d.map(function (r) { return { t: r[0], n: r[1], u: r[2], d: r[3] || '', k: (r[1] + ' ' + (r[3] || '')).toLowerCase() }; }); return DATA; }); return loading; }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var css = document.createElement('style');
  css.textContent = '#bvs{position:fixed;inset:0;z-index:2147483002;background:rgba(15,23,42,.55);display:none;align-items:flex-start;justify-content:center;padding:6vh 12px 12px}#bvs.on{display:flex}' +
    '#bvs .bx{background:#fff;color:#0f172a;border-radius:20px;width:min(760px,100%);max-height:84vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.35)}' +
    '#bvs .top{display:flex;gap:10px;align-items:center;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:linear-gradient(120deg,#ecfeff,#eef2ff,#fdf2f8)}' +
    '#bvs input{flex:1;font:600 1.1rem system-ui,Arial,sans-serif;border:2px solid #c7d2fe;border-radius:12px;padding:11px 14px;outline:none;background:#fff}#bvs input:focus{border-color:#4f46e5}' +
    '#bvs .x{border:0;background:#0f172a;color:#fff;border-radius:999px;padding:8px 13px;font:700 13px system-ui,Arial;cursor:pointer}' +
    '#bvs .chips{display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px 0}#bvs .chips button{border:1.5px solid var(--c);color:var(--c);background:#fff;border-radius:999px;padding:4px 11px;font:700 12.5px system-ui,Arial;cursor:pointer}#bvs .chips button.on{background:var(--c);color:#fff}' +
    '#bvs .bvs-res{overflow:auto;padding:6px 16px 16px}#bvs h5{margin:14px 0 4px;font:800 .78rem system-ui,Arial;text-transform:uppercase;letter-spacing:.06em;color:var(--c)}' +
    '#bvs a.r{display:block;padding:9px 12px;border-radius:12px;text-decoration:none;color:#0f172a;border-left:4px solid var(--c);margin:4px 0;background:#f8fafc}#bvs a.r:hover,#bvs a.r.sel{background:#eef2ff}#bvs a.r b{display:block;font-size:.98rem}#bvs a.r span{font-size:.8rem;color:#64748b}#bvs mark{background:#fef08a;color:inherit;border-radius:3px}' +
    '#bvs .none,#bvs .hint{color:#64748b;padding:14px 4px;font:500 .92rem system-ui,Arial}' +
    '.bvs-btn{display:inline-flex;align-items:center;gap:6px;border:0;cursor:pointer;font:800 .95rem Outfit,system-ui,sans-serif;color:#fff;border-radius:999px;padding:9px 16px;background:linear-gradient(120deg,#0d9488,#2563eb);box-shadow:0 4px 12px rgba(37,99,235,.25)}.bvs-btn svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2.4;stroke-linecap:round}.bvs-btn kbd{font:700 .7rem system-ui;background:rgba(255,255,255,.25);border-radius:5px;padding:1px 5px}' +
    '.bvs-hero{display:flex;gap:8px;align-items:center;max-width:560px;margin:18px 0 6px;background:#fff;border:2px solid #c7d2fe;border-radius:16px;padding:6px 6px 6px 14px;box-shadow:0 8px 24px rgba(79,70,229,.15);cursor:text}.bvs-hero svg{width:22px;height:22px;stroke:#4f46e5;fill:none;stroke-width:2.4;stroke-linecap:round;flex:none}.bvs-hero input{flex:1;border:0;outline:none;font:600 1.02rem system-ui,Arial;background:transparent;min-width:0;color:#0f172a}.bvs-hero button{border:0;border-radius:12px;padding:10px 16px;font:800 .95rem Outfit,system-ui;color:#fff;background:linear-gradient(120deg,#f97316,#db2777);cursor:pointer}' +
    '@media(max-width:600px){.bvs-btn{display:none!important}#bvs{padding:0}#bvs .bx{max-height:100vh;height:100vh;border-radius:0}}';
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var box = document.createElement('div'); box.id = 'bvs'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Search BioscienceVista');
  box.innerHTML = '<div class="bx"><div class="top"><input type="search" id="bvs-q" placeholder="Search lessons, labs, games and pages…" aria-label="Search the site" autocomplete="off"><button type="button" class="x">Close</button></div>' +
    '<div class="chips" role="group" aria-label="Show"><button type="button" class="on" data-t="" style="--c:#0f172a">Everything</button>' + ORDER.map(function (t) { return '<button type="button" data-t="' + t + '" style="--c:' + TYPES[t][1] + '">' + TYPES[t][0] + '</button>'; }).join('') + '</div><div class="bvs-res" id="bvs-res" aria-live="polite"></div></div>';
  var only = '', sel = -1;
  function mark(s, words) { var h = esc(s); words.forEach(function (w) { if (w.length > 1) h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); }); return h; }
  function draw() {
    var q = box.querySelector('#bvs-q').value.trim().toLowerCase(), res = box.querySelector('#bvs-res'), words = q.split(/\s+/).filter(Boolean);
    if (!DATA) { res.innerHTML = '<p class="hint">Loading…</p>'; return; }
    if (!words.length) { res.innerHTML = '<p class="hint">Type a topic, for example <b>enzymes</b>, <b>osmosis</b>, <b>A2.3 viruses</b>, <b>titration</b> or <b>circuits</b>.</p>'; return; }
    var hits = DATA.filter(function (r) { return (!only || r.t === only) && words.every(function (w) { return r.k.indexOf(w) >= 0; }); });
    hits.sort(function (a, b) { var A = a.n.toLowerCase().indexOf(words[0]), B = b.n.toLowerCase().indexOf(words[0]); return (A < 0) - (B < 0) || a.n.localeCompare(b.n, undefined, { numeric: true }); });
    if (!hits.length) { res.innerHTML = '<p class="none">Nothing found for “' + esc(q) + '”. Try a shorter word.</p>'; return; }
    var html = '', n = 0;
    ORDER.forEach(function (t) { var g = hits.filter(function (r) { return r.t === t; }); if (!g.length) return;
      html += '<h5 style="--c:' + TYPES[t][1] + '">' + TYPES[t][0] + ' · ' + g.length + '</h5>' + g.slice(0, only ? 80 : 12).map(function (r) { return '<a class="r" data-i="' + (n++) + '" style="--c:' + TYPES[t][1] + '" href="' + esc(r.u) + '"><b>' + mark(r.n, words) + '</b><span>' + mark(r.d, words) + '</span></a>'; }).join('') +
        (!only && g.length > 12 ? '<p class="hint" style="padding:4px"><button type="button" class="x" data-more="' + t + '" style="background:' + TYPES[t][1] + '">Show all ' + g.length + '</button></p>' : ''); });
    res.innerHTML = html; sel = -1;
    res.querySelectorAll('[data-more]').forEach(function (b) { b.onclick = function () { only = b.getAttribute('data-more'); chips(); draw(); }; });
  }
  function chips() { box.querySelectorAll('.chips button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === only); }); }
  function open(q) {
    if (!document.body.contains(box)) document.body.appendChild(box);
    box.classList.add('on'); document.documentElement.style.overflow = 'hidden';
    var i = box.querySelector('#bvs-q'); if (q != null) i.value = q; i.focus(); load().then(draw); draw();
  }
  function close() { box.classList.remove('on'); document.documentElement.style.overflow = ''; }
  box.addEventListener('click', function (e) { if (e.target === box || (e.target.classList.contains('x') && !e.target.hasAttribute('data-more'))) close(); var c = e.target.closest('.chips button'); if (c) { only = c.getAttribute('data-t'); chips(); draw(); } });
  box.querySelector('#bvs-q').addEventListener('input', draw);
  box.addEventListener('keydown', function (e) {
    var rs = box.querySelectorAll('a.r'); if (e.key === 'Escape') return close();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!rs.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + rs.length) % rs.length; rs.forEach(function (a, i) { a.classList.toggle('sel', i === sel); }); rs[sel].scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter' && sel >= 0 && rs[sel]) { e.preventDefault(); location.href = rs[sel].href; }
  });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if ((e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag) && !(e.target && e.target.isContentEditable)) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); open(); }
  });
  window.BVSearch = { open: open, close: close };
  function mount() {
    if (!document.head.contains(css)) document.head.appendChild(css);
    // a Search button in the site header, beside "All pages"
    var top = document.querySelector('header.top .top-in');
    if (top && !top.querySelector('.bvs-btn')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'bvs-btn'; b.innerHTML = ICON + '<span>Search</span> <kbd aria-hidden="true">/</kbd>'; b.setAttribute('aria-label', 'Search the site');
      b.onclick = function () { open(); };
      var all = top.querySelector('.all-btn');
      if (all) all.parentNode.insertBefore(b, all); else top.appendChild(b);
    }
    // the home page: a big search box in the welcome panel
    var hero = document.querySelector('.hm-hero');
    if (hero && !document.querySelector('.bvs-hero')) {
      var f = document.createElement('form'); f.className = 'bvs-hero'; f.setAttribute('role', 'search');
      f.innerHTML = ICON + '<input type="search" placeholder="What do you want to learn? e.g. enzymes, cells, circuits" aria-label="Search lessons, labs and games"><button type="submit">Search</button>';
      f.onsubmit = function (e) { e.preventDefault(); open(f.querySelector('input').value); };
      f.querySelector('input').addEventListener('input', function () { if (this.value.length > 1) { var v = this.value; this.value = ''; open(v); } });
      var p = hero.querySelector('p'); if (p && p.parentNode) p.parentNode.insertBefore(f, p.nextSibling); else hero.appendChild(f);
    }
    // the quick-tools menu (bottom left): Search first
    var list = document.getElementById('bvf-list');
    if (list && !list.querySelector('.bvs-q')) {
      var q = document.createElement('button'); q.type = 'button'; q.className = 'bvs-q'; q.style.background = 'linear-gradient(120deg,#0d9488,#2563eb)'; q.innerHTML = '🔍 Search the site'; q.onclick = function () { open(); };
      list.insertBefore(q, list.firstChild);
    }
  }
  if (document.body) mount(); document.addEventListener('DOMContentLoaded', mount); window.addEventListener('load', mount); setInterval(mount, 2000);
})();
