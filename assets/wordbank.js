/* Word bank (BioscienceVista, 23 Nov 2026): every key term is a button; click it to see what it means.
   Definitions are in the page (<script id="bv-defs">): written definitions, or the sentence in this lesson that explains the word. */
(function () {
  var DEFS = null;   // read on first click: on protected pages the lesson (and its definitions) appears only after sign-in
  function defs() { if (!DEFS || !Object.keys(DEFS).length) { try { DEFS = JSON.parse((document.getElementById('bv-defs') || {}).textContent || '{}'); } catch (e) { DEFS = {}; } } return DEFS; }
  var st = document.createElement('style');
  st.textContent = '.bv-wb{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.bv-wbhint{font-weight:400;color:#64748b;margin-left:6px}' +
    '.bv-term{font:600 .9rem inherit;font-family:inherit;border:1.5px solid #99f6e4;background:#f0fdfa;color:#0f766e;border-radius:999px;padding:4px 11px;cursor:pointer;margin:2px}' +
    '.bv-term:hover,.bv-term[aria-expanded="true"]{background:#0d9488;border-color:#0d9488;color:#fff}' +
    '.bv-def{position:absolute;z-index:60;max-width:min(340px,90vw);background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,.18);padding:10px 12px;font:400 .92rem/1.45 inherit;font-family:inherit}' +
    '.bv-def b{display:block;color:#0f766e;margin-bottom:3px}.bv-def small{display:block;color:#64748b;margin-top:5px}' +
    '@media (prefers-color-scheme:dark){.bv-def{background:#0f172a;color:#e2e8f0;border-color:#334155}.bv-term{background:#042f2e;color:#5eead4;border-color:#115e59}}';
  document.head.appendChild(st);
  var open = null;
  function close() { if (!open) return; open.btn.setAttribute('aria-expanded', 'false'); open.box.remove(); open = null; }
  function show(btn) {
    var w = btn.textContent.trim(), d = defs()[w.toLowerCase()];
    var box = document.createElement('div'); box.className = 'bv-def'; box.setAttribute('role', 'tooltip'); box.id = 'bv-def-now';
    box.innerHTML = '<b></b><span></span>' + (d && d.l ? '<small>From this lesson</small>' : '');
    box.querySelector('b').textContent = w;
    box.querySelector('span').textContent = d ? d.d : 'Look for this word in the lesson notes and slides, then write its meaning in your book.';
    document.body.appendChild(box);
    var r = btn.getBoundingClientRect(), x = r.left + window.scrollX, y = r.bottom + window.scrollY + 6;
    x = Math.max(8, Math.min(x, window.scrollX + document.documentElement.clientWidth - box.offsetWidth - 8));
    box.style.left = x + 'px'; box.style.top = y + 'px';
    btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-describedby', 'bv-def-now'); open = { btn: btn, box: box };
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.bv-term');
    if (b) { var same = open && open.btn === b; close(); if (!same) show(b); e.preventDefault(); return; }
    if (open && !open.box.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', close);
})();
