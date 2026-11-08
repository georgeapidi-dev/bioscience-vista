/* BioScience Vista · graph and drawing tools inside every lesson (UDL: multiple means of action and expression)
   A floating "Graph & draw" button opens the site's Science tools (graph plotter with best fit, graph paper, drawing board,
   calculator) in a panel over the lesson, so students never leave their work. Downloads still work from inside the panel. */
(function () {
  if (window.__bvDock || window.top !== window) return; window.__bvDock = true;
  var css = document.createElement('style');
  css.textContent = '#bvdock-btn{position:fixed;left:14px;bottom:62px;z-index:2147483000;display:inline-flex!important;align-items:center;gap:6px;width:auto!important;max-width:max-content!important;margin:0!important;' +
    'border:0;border-radius:999px;padding:10px 15px;background:linear-gradient(120deg,#0d9488,#2563eb);color:#fff;font:700 14px/1.1 system-ui,Arial,sans-serif;box-shadow:0 6px 18px rgba(15,23,42,.28);cursor:pointer;text-transform:none!important}' +
    '#bvdock-btn:hover{filter:brightness(1.08)}' +
    '#bvdock{position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:12px}' +
    '#bvdock.on{display:flex}#bvdock .bvd-box{background:#fff;border-radius:16px;width:min(1100px,100%);height:min(92vh,980px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '#bvdock .bvd-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font:600 14px system-ui,Arial,sans-serif}' +
    '#bvdock .bvd-bar b{margin-right:auto;color:#0f172a}#bvdock .bvd-bar button{width:auto!important;margin:0!important;border:1.5px solid #cbd5e1;background:#fff;border-radius:999px;padding:6px 12px;font:600 13px system-ui,Arial,sans-serif;cursor:pointer;color:#0f172a;text-transform:none!important;box-shadow:none!important}' +
    '#bvdock .bvd-bar button[aria-pressed=true]{background:#2563eb;border-color:#2563eb;color:#fff}#bvdock .bvd-bar .bvd-x{background:#0f172a;color:#fff;border-color:#0f172a}' +
    '#bvdock iframe{flex:1;border:0;width:100%;background:#fff}@media print{#bvdock-btn,#bvdock{display:none!important}}' +
    '@media(max-width:560px){#bvdock-btn{left:10px;bottom:58px;padding:9px 12px;font-size:13px}#bvdock{padding:0}#bvdock .bvd-box{height:100vh;border-radius:0}}';
  document.head.appendChild(css);
  var btn = document.createElement('button'); btn.type = 'button'; btn.id = 'bvdock-btn'; btn.innerHTML = '📈 Graph &amp; ✏️ Draw'; btn.setAttribute('aria-haspopup', 'dialog'); btn.title = 'Open the graph plotter and drawing board without leaving the lesson';
  var dock = document.createElement('div'); dock.id = 'bvdock'; dock.setAttribute('role', 'dialog'); dock.setAttribute('aria-modal', 'true'); dock.setAttribute('aria-label', 'Graph and drawing tools');
  dock.innerHTML = '<div class="bvd-box"><div class="bvd-bar"><b>Science tools</b><button type="button" data-go="graph" aria-pressed="true">📈 Graph</button><button type="button" data-go="draw" aria-pressed="false">✏️ Draw a diagram</button>' +
    '<button type="button" data-go="calc" aria-pressed="false">🧮 Calculator</button><button type="button" class="bvd-x" aria-label="Close the tools">✕ Back to the lesson</button></div><iframe title="Graph plotter, drawing board and calculator"></iframe></div>';
  var frame = dock.querySelector('iframe'), loaded = false, want = 'graph';
  function strip() {   // show only the tools inside the panel: no site header, footer or hero
    try {
      var d = frame.contentDocument; if (!d || d.getElementById('bvd-embed')) return;
      var s = d.createElement('style'); s.id = 'bvd-embed';
      s.textContent = 'header.top,footer.site,#offbar,.hero,.toc,#install,.installbar{display:none!important}main{padding-top:8px!important}body{background:#fff!important}';
      d.head.appendChild(s);
    } catch (e) {}
  }
  function go(where) {
    want = where;
    dock.querySelectorAll('[data-go]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-go') === where ? 'true' : 'false'); });
    try { var el = frame.contentDocument && frame.contentDocument.getElementById(where); if (el) el.scrollIntoView({ block: 'start' }); } catch (e) {}
  }
  frame.addEventListener('load', function () { strip(); setTimeout(function () { go(want); }, 150); });
  function open(where) {
    dock.classList.add('on'); document.documentElement.style.overflow = 'hidden';
    if (!loaded) { loaded = true; want = where || 'graph'; frame.src = '/tools/'; } else go(where || want);
    var first = dock.querySelector('[aria-pressed=true]'); if (first) first.focus();
  }
  function close() { dock.classList.remove('on'); document.documentElement.style.overflow = ''; btn.focus(); }
  btn.addEventListener('click', function () { open(want); });
  dock.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) { go(g.getAttribute('data-go')); return; }
    if (e.target.closest('.bvd-x') || e.target === dock) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dock.classList.contains('on')) close(); });
  window.BVTools = { open: open, close: close };
  // any link in a lesson that points at /tools/ opens the panel instead of leaving the page
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || ''; if (!/^\/tools\/?(#.*)?$/.test(h)) return;
    e.preventDefault(); open((h.split('#')[1]) || 'graph');
  }, true);
  function mount() { if (!document.body) return setTimeout(mount, 50); document.body.appendChild(btn); document.body.appendChild(dock); }
  mount();
})();
