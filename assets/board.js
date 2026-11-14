/* Learnova · classroom whiteboard.
   Handwriting and typed notes on one board, projected full screen. "Neat handwriting" turns what you write into tidy text;
   "Tidy shapes" straightens lines, circles and boxes; ink is always smoothed. "Share live" lets students follow on their own
   screens in real time (/board/?live=CODE). Boards are kept in this browser. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var W = 1600, H = 900;   // board coordinates (16:9); the canvas is scaled to fit
  var COLS = ['#111827', '#1d4ed8', '#dc2626', '#059669', '#7c3aed', '#ea580c'], CHALK = ['#f9fafb', '#93c5fd', '#fca5a5', '#86efac', '#fde68a', '#f9a8d4'];
  var BGS = [['white', 'White'], ['grid', 'Squares'], ['lined', 'Lines'], ['dark', 'Chalkboard']];
  var NEAT_FONT = "'Patrick Hand', 'Comic Neue', 'Segoe Print', cursive", TYPE_FONT = "'Atkinson Hyperlegible', system-ui, sans-serif";
  var QS = new URLSearchParams(location.search), live = QS.get('live'), CLS = /^[0-9a-f-]{36}$/.test(QS.get('class') || '') ? QS.get('class') : null, CNAME = (QS.get('n') || '').slice(0, 80);
  var KEY = function (me) { return 'bv-board-' + me.user.id + (CLS ? '-' + CLS : ''); };
  var st = { pages: [{ bg: 'white', items: [] }], cur: 0 }, tool = 'pen', col = 0, size = 1, neat = true, tidy = true;
  var undo = [], redo = [], pending = [], neatTimer = null, chan = null, room = null, cv, cx, wrap, scale = 1, drawing = null;
  (function () { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap'; document.head.appendChild(l); })();

  S.guard(app, { school: true, allowPending: true, anyone: true }).then(function (me) {
    if (live) return viewer(me);
    if (!(me.admin || me.staff || me.roles.indexOf('teacher') >= 0 || me.roles.indexOf('school_teacher') >= 0)) {
      app.innerHTML = '<section class="panel"><h2>📡 Join your teacher\'s live board</h2><p>Type the 6-letter code your teacher shows on the board.</p><form id="jc" class="row2" style="justify-content:flex-start;gap:8px"><input id="jcv" maxlength="6" placeholder="e.g. K7QPZ3" style="text-transform:uppercase;font-size:1.3rem;letter-spacing:.15em;max-width:200px" required><button class="btn main">Join</button></form></section>';
      app.querySelector('#jc').onsubmit = function (e) { e.preventDefault(); location.href = '/board/?live=' + encodeURIComponent(app.querySelector('#jcv').value.trim().toUpperCase()); }; return; }
    try { var saved = JSON.parse(localStorage.getItem(KEY(me)) || 'null'); if (saved && saved.pages && saved.pages.length) st = saved; } catch (e) {}
    st.cur = Math.min(st.cur || 0, st.pages.length - 1);
    build(me, true);
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  var CSS = '.wb{display:grid;gap:10px}.wb-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--raised,#fff);border:1px solid var(--line,#e5e7eb);border-radius:14px;padding:8px}' +
    '.wb-bar button{font:700 .9rem var(--body,inherit);border:2px solid var(--k,#cbd5e1);background:color-mix(in srgb,var(--k,#64748b) 10%,transparent);color:var(--k,#334155);border-radius:10px;padding:6px 10px;cursor:pointer;min-width:38px}' +
    '.wb-bar button[aria-pressed=true]{background:var(--k,#334155);color:#fff}.wb-bar .sw{width:28px;height:28px;border-radius:50%;padding:0;min-width:28px;border:3px solid #fff;box-shadow:0 0 0 2px #cbd5e1}.wb-bar .sw[aria-pressed=true]{box-shadow:0 0 0 3px #111827}' +
    '.wb-bar .sep{width:1px;height:26px;background:var(--line,#e5e7eb);margin:0 4px}.wb-stage{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.15);touch-action:none;background:#fff}' +
    '.wb-stage canvas{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair}.wb-stage.texting canvas{cursor:text}.wb-stage .wb-in{position:absolute;z-index:3;width:auto!important;max-width:80%;margin:0;box-sizing:content-box;border:2px dashed #2563eb;background:rgba(255,255,255,.9);font:inherit;outline:none;padding:2px 6px;min-width:120px}' +
    '.wb-note{position:absolute;right:10px;bottom:8px;z-index:2;font:600 .85rem system-ui;background:rgba(17,24,39,.75);color:#fff;border-radius:999px;padding:5px 12px;pointer-events:none;opacity:0;transition:opacity .3s}.wb-note.on{opacity:1}' +
    '.wb:fullscreen,.wb.full{position:fixed;inset:0;z-index:9999;background:#0f172a;padding:10px;display:flex;flex-direction:column}.wb:fullscreen .wb-stage,.wb.full .wb-stage{flex:1;aspect-ratio:auto;max-height:none;width:min(100%,calc((100vh - 90px) * 16 / 9));margin:0 auto}' +
    '.wb-live{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.wb-live code{font-size:1.2rem;font-weight:800;letter-spacing:.1em;background:#eef2ff;color:#3730a3;border-radius:8px;padding:4px 10px}';

  function build(me, teacher) {
    if (!document.getElementById('wb-css')) { var s = document.createElement('style'); s.id = 'wb-css'; s.textContent = CSS; document.head.appendChild(s); }
    app.innerHTML = (teacher ? '<div class="row2 cband" style="--k:#0d9488"><div><p class="label">Classroom</p><h2 style="margin:0">🖊 Whiteboard' + (CNAME ? ' · ' + E(CNAME) : '') + '</h2><p class="small">' + (CNAME ? 'This class keeps its own pages. ' : '') + 'Write or type, project it full screen, and share it live with your class.</p></div><div class="cta"><a class="btn sm" href="' + (CLS ? '/teach/#classes/' + CLS : '/teach/') + '">' + (CLS ? '← Back to the class' : '🏫 My classes') + '</a></div></div>' : '') +
      '<div class="wb" id="wb">' + (teacher ? bar() : '<div class="wb-bar"><b>📡 Live board</b><span class="small muted" id="vst">Connecting…</span><span style="flex:1"></span><button type="button" data-a="full" style="--k:#0d9488">⛶ Full screen</button></div>') +
      '<div class="wb-stage" id="stage"><canvas id="cv"></canvas><div class="wb-note" id="note"></div></div>' +
      (teacher ? '<div class="wb-bar" id="pgbar"></div>' : '') + '</div>' +
      (teacher ? '<p class="small muted">✍️ <b>Neat handwriting</b> turns what you write into tidy text a moment after you stop writing (press ↶ Undo to bring back your own ink). It sends your pen strokes to Google\'s handwriting recognition; nothing else is sent. 📐 <b>Tidy shapes</b> straightens lines and turns rough circles and boxes into neat ones. Boards are saved in this browser.</p>' : '');
    wrap = app.querySelector('#wb'); cv = app.querySelector('#cv'); cx = cv.getContext('2d');
    window.addEventListener('resize', fit); document.addEventListener('fullscreenchange', function () { setTimeout(fit, 60); });
    fit();
    app.querySelectorAll('[data-a="full"]').forEach(function (b) { b.onclick = full; });
    if (!teacher) return;
    wire(); pages();
    var stage = app.querySelector('#stage');
    stage.addEventListener('pointerdown', down);
    stage.addEventListener('click', function (e) { if (tool !== 'text' || e.target !== cv) return; typeAt(pt(e)); }); stage.addEventListener('pointermove', move); window.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    document.addEventListener('keydown', function (e) { if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); }
      if (e.key === 'ArrowRight' && e.altKey) goPage(1); if (e.key === 'ArrowLeft' && e.altKey) goPage(-1); });
  }
  function bar() {
    var b = function (a, label, k, title, on) { return '<button type="button" data-a="' + a + '" style="--k:' + k + '" title="' + E(title || '') + '"' + (on != null ? ' aria-pressed="' + on + '"' : '') + '>' + label + '</button>'; };
    return '<div class="wb-bar">' + b('pen', '🖊 Pen', '#1d4ed8', 'Write', tool === 'pen') + b('hl', '🖍 Highlight', '#ca8a04', 'Highlighter', tool === 'hl') + b('text', '⌨️ Type', '#7c3aed', 'Click the board, then type', tool === 'text') + b('erase', '🧽 Eraser', '#dc2626', 'Rub out a stroke or a piece of text', tool === 'erase') +
      '<span class="sep"></span><span id="sws"></span><span class="sep"></span>' + b('size', '● Size', '#475569', 'Pen size') +
      '<span class="sep"></span>' + b('neat', '✍️ Neat handwriting', '#059669', 'Turn handwriting into neat text', neat) + b('tidy', '📐 Tidy shapes', '#0891b2', 'Straighten lines, circles and boxes', tidy) +
      '<span class="sep"></span>' + b('undo', '↶ Undo', '#334155', 'Ctrl+Z') + b('redo', '↷ Redo', '#334155', 'Ctrl+Y') + b('clear', '🗑 Clear', '#b91c1c', 'Clear this page') +
      '<span class="sep"></span>' + b('bg', '🎨 Background', '#9333ea', 'White, squares, lines or chalkboard') + b('full', '⛶ Project', '#0d9488', 'Full screen for the projector') + b('live', '📡 Share live', '#db2777', 'Students follow on their own screens') + '</div><div id="livebox"></div>';
  }
  function swatches() { var pal = st.pages[st.cur].bg === 'dark' ? CHALK : COLS;
    app.querySelector('#sws').innerHTML = pal.map(function (c, i) { return '<button type="button" class="sw" data-c="' + i + '" style="background:' + c + '" aria-label="Colour ' + (i + 1) + '" aria-pressed="' + (i === col) + '"></button>'; }).join(' ');
    app.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { col = +b.getAttribute('data-c'); if (tool === 'erase') setTool('pen'); swatches(); }; }); }
  function setTool(t) { tool = t; app.querySelectorAll('[data-a=pen],[data-a=hl],[data-a=text],[data-a=erase]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-a') === t); });
    app.querySelector('#stage').classList.toggle('texting', t === 'text'); }
  function wire() {
    swatches();
    var A = function (a, f) { var el = app.querySelector('[data-a="' + a + '"]'); if (el) el.onclick = f; };
    ['pen', 'hl', 'text', 'erase'].forEach(function (t) { A(t, function () { setTool(t); }); });
    A('size', function () { size = (size + 1) % 3; this.textContent = ['● Size', '⬤ Size', '⬛ Size'][size]; note(['Thin', 'Medium', 'Thick'][size] + ' pen'); });
    A('neat', function () { neat = !neat; this.setAttribute('aria-pressed', neat); note(neat ? 'Neat handwriting on' : 'Neat handwriting off: your own ink stays'); });
    A('tidy', function () { tidy = !tidy; this.setAttribute('aria-pressed', tidy); note(tidy ? 'Tidy shapes on' : 'Tidy shapes off'); });
    A('undo', doUndo); A('redo', doRedo);
    A('clear', function () { var b = this; if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Clear page?'; setTimeout(function () { delete b.dataset.sure; b.textContent = '🗑 Clear'; }, 2500); return; } snap(); page().items = []; delete b.dataset.sure; b.textContent = '🗑 Clear'; changed(); });
    A('bg', function () { var i = BGS.map(function (x) { return x[0]; }).indexOf(page().bg); snap(); page().bg = BGS[(i + 1) % BGS.length][0]; note(BGS[(i + 1) % BGS.length][1]); swatches(); changed(); });
    A('live', shareLive);
  }
  function pages() {
    var pb = app.querySelector('#pgbar');
    pb.innerHTML = '<button type="button" data-p="-1" style="--k:#334155">◀</button><b>Page ' + (st.cur + 1) + ' of ' + st.pages.length + '</b><button type="button" data-p="1" style="--k:#334155">▶</button>' +
      '<button type="button" data-p="new" style="--k:#059669">＋ New page</button><button type="button" data-p="del" style="--k:#b91c1c">Delete page</button><span style="flex:1"></span><span class="small muted">Alt + ← → change page</span>';
    pb.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-p');
      if (v === 'new') { st.pages.splice(st.cur + 1, 0, { bg: page().bg, items: [] }); st.cur++; undo = []; redo = []; changed(); pages(); return; }
      if (v === 'del') { if (st.pages.length === 1) { snap(); page().items = []; changed(); return; } if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Delete this page?'; return; } st.pages.splice(st.cur, 1); st.cur = Math.max(0, st.cur - 1); undo = []; redo = []; changed(); pages(); return; }
      goPage(+v); }; });
  }
  function goPage(d) { var n = Math.max(0, Math.min(st.pages.length - 1, st.cur + d)); if (n === st.cur) return; flushNeat(); st.cur = n; undo = []; redo = []; swatches(); changed(); pages(); }
  function page() { return st.pages[st.cur]; }

  // ---------- drawing ----------
  function fit() { var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); scale = cv.width / W; render(); }
  function pt(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H, Date.now()]; }
  function down(e) {
    if (e.button && e.button !== 0) return; var p = pt(e);
    if (tool === 'text') return;   // typing starts on click (below), so the new box keeps the focus
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    if (tool === 'erase') { drawing = { erase: true }; eraseAt(p); return; }
    var pal = page().bg === 'dark' ? CHALK : COLS;
    drawing = { t: 'ink', c: pal[col], w: tool === 'hl' ? [18, 26, 36][size] : [3, 5, 9][size], hl: tool === 'hl', pts: [p] };
    clearTimeout(neatTimer);
  }
  function move(e) {
    if (!drawing) return; var p = pt(e);
    if (drawing.erase) { eraseAt(p); return; }
    var co = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; co.forEach(function (ev) { drawing.pts.push(pt(ev)); });
    render(); sendLive('ink', drawing);
  }
  function up() {
    if (!drawing) return; var d = drawing; drawing = null;
    if (d.erase) { changed(); return; }
    if (d.pts.length < 2) d.pts.push([d.pts[0][0] + 0.5, d.pts[0][1] + 0.5, Date.now()]);
    snap();
    var shape = tidy && !d.hl ? tidyShape(d) : null;
    if (shape) { page().items.push(shape); note('📐 Tidied'); changed(); return; }
    d.raw = d.pts.map(function (q) { return q.slice(); }); d.pts = smooth(d.pts);
    page().items.push(d);
    if (neat && !d.hl) { pending.push(d); clearTimeout(neatTimer); neatTimer = setTimeout(flushNeat, 1300); }
    changed();
  }
  function eraseAt(p) { var its = page().items, hit = -1, r = 18;
    for (var i = its.length - 1; i >= 0 && hit < 0; i--) { var it = its[i];
      if (it.t === 'text') { var bw = it.size * 0.55 * it.txt.length, bh = it.size * 1.2; if (p[0] >= it.x - 4 && p[0] <= it.x + bw && p[1] >= it.y - bh && p[1] <= it.y + 8) hit = i; }
      else if (it.pts && it.pts.some(function (q) { return Math.abs(q[0] - p[0]) < r + it.w && Math.abs(q[1] - p[1]) < r + it.w; })) hit = i;
      else if (it.t === 'circle' && Math.abs(Math.hypot(p[0] - it.cx, p[1] - it.cy) - it.r) < r) hit = i;
      else if (it.t === 'rect' && ((Math.abs(p[0] - it.x) < r || Math.abs(p[0] - it.x - it.w2) < r) && p[1] > it.y - r && p[1] < it.y + it.h2 + r || (Math.abs(p[1] - it.y) < r || Math.abs(p[1] - it.y - it.h2) < r) && p[0] > it.x - r && p[0] < it.x + it.w2 + r)) hit = i; }
    if (hit >= 0) { snap(); its.splice(hit, 1); render(); }
  }
  function smooth(pts) {   // Chaikin corner cutting: steadier, neater ink
    var a = pts.map(function (q) { return [q[0], q[1]]; });
    for (var k = 0; k < 2 && a.length > 2; k++) { var b = [a[0]]; for (var i = 0; i < a.length - 1; i++) { var p = a[i], q = a[i + 1]; b.push([.75 * p[0] + .25 * q[0], .75 * p[1] + .25 * q[1]], [.25 * p[0] + .75 * q[0], .25 * p[1] + .75 * q[1]]); } b.push(a[a.length - 1]); a = b; }
    return a;
  }
  function tidyShape(d) {   // a nearly straight stroke → line; a closed loop → circle or box
    var p = d.pts, n = p.length; if (n < 6) return null;
    var len = 0; for (var i = 1; i < n; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    var ends = Math.hypot(p[n - 1][0] - p[0][0], p[n - 1][1] - p[0][1]);
    if (len > 60 && ends / len > 0.96) return { t: 'ink', c: d.c, w: d.w, pts: [[p[0][0], p[0][1]], [p[n - 1][0], p[n - 1][1]]], shape: 'line' };
    var xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; }), x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    if (len < 150 || ends > 0.18 * len || x1 - x0 < 40 || y1 - y0 < 40) return null;
    var cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2, ds = p.map(function (q) { return Math.hypot(q[0] - cxm, q[1] - cym); }), m = ds.reduce(function (a, b) { return a + b; }, 0) / n;
    var sd = Math.sqrt(ds.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / n), asp = (x1 - x0) / (y1 - y0);
    if (sd / m < 0.13 && asp > 0.75 && asp < 1.33) return { t: 'circle', c: d.c, w: d.w, cx: cxm, cy: cym, r: m };
    var near = p.filter(function (q) { return Math.min(q[0] - x0, x1 - q[0], q[1] - y0, y1 - q[1]) < 0.12 * Math.min(x1 - x0, y1 - y0); }).length / n;
    if (near > 0.8) return { t: 'rect', c: d.c, w: d.w, x: x0, y: y0, w2: x1 - x0, h2: y1 - y0 };
    return null;
  }

  // ---------- neat handwriting: recognise the strokes, swap them for tidy text ----------
  function flushNeat() {
    clearTimeout(neatTimer); var grp = pending.filter(function (d) { return page().items.indexOf(d) >= 0; }); pending = [];
    if (!grp.length) return;
    var all = []; grp.forEach(function (d) { all = all.concat(d.raw || d.pts); });
    var xs = all.map(function (q) { return q[0]; }), ys = all.map(function (q) { return q[1]; });
    var bx = { x0: Math.min.apply(0, xs), x1: Math.max.apply(0, xs), y0: Math.min.apply(0, ys), y1: Math.max.apply(0, ys) };
    if (bx.x1 - bx.x0 < 25 && bx.y1 - bx.y0 < 25) return;   // a dot or a tick: keep it as ink
    // only writing becomes text: diagrams, arrows and long lines stay as drawn
    if (bx.y1 - bx.y0 > 230) return;
    if (grp.length === 1) { var r1 = grp[0].raw || grp[0].pts, L1 = 0; for (var i = 1; i < r1.length; i++) L1 += Math.hypot(r1[i][0] - r1[i - 1][0], r1[i][1] - r1[i - 1][1]);
      if (Math.hypot(r1[r1.length - 1][0] - r1[0][0], r1[r1.length - 1][1] - r1[0][1]) / (L1 || 1) > 0.8) return; }
    note('✍️ Reading your handwriting…');
    recognise(grp, bx).then(function (txt) {
      txt = (txt || '').trim();
      if (!txt) { note('Kept as handwriting'); return; }
      var its = page().items; if (!grp.every(function (d) { return its.indexOf(d) >= 0; })) return;   // changed meanwhile
      snap();
      var at = its.indexOf(grp[0]); grp.forEach(function (d) { its.splice(its.indexOf(d), 1); });
      var lineH = bx.y1 - bx.y0, sizePx = Math.max(26, Math.min(110, lineH * 0.95));
      its.splice(Math.max(0, at), 0, { t: 'text', x: bx.x0, y: bx.y1, size: sizePx, c: grp[0].c, txt: txt, font: 'neat', ink: grp });
      note('✨ "' + (txt.length > 30 ? txt.slice(0, 30) + '…' : txt) + '"'); changed();
    }, function () { note('Handwriting kept (recognition is offline)'); });
  }
  function recognise(grp, bx) {
    var ink = grp.map(function (d) { var r = d.raw || d.pts, t0 = r[0][2] || 0; return [r.map(function (q) { return Math.round(q[0] - bx.x0); }), r.map(function (q) { return Math.round(q[1] - bx.y0); }), r.map(function (q) { return Math.max(0, (q[2] || t0) - t0); })]; });
    // 1. the browser's own recogniser, where available (no data leaves the device)
    if (navigator.createHandwritingRecognizer) {
      return navigator.createHandwritingRecognizer({ languages: ['en'] }).then(function (rec) {
        var dr = rec.startDrawing({ recognitionType: 'text' });
        grp.forEach(function (d) { var s2 = new HandwritingStroke(); (d.raw || d.pts).forEach(function (q) { s2.addPoint({ x: q[0], y: q[1], t: q[2] || 0 }); }); dr.addStroke(s2); });
        return dr.getPrediction().then(function (pr) { dr.clear(); return pr && pr[0] ? pr[0].text : ''; });
      }).catch(function () { return google(ink, bx); });
    }
    return google(ink, bx);
  }
  function google(ink, bx) {
    return fetch('https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: 'enable_pre_space', requests: [{ writing_guide: { writing_area_width: Math.round(bx.x1 - bx.x0 + 20), writing_area_height: Math.round(bx.y1 - bx.y0 + 20) }, ink: ink, language: 'en' }] }) })
      .then(function (r) { return r.json(); }).then(function (j) { return j && j[0] === 'SUCCESS' && j[1] && j[1][0] && j[1][0][1] ? j[1][0][1][0] : ''; });
  }

  // ---------- typed notes ----------
  function typeAt(p) {
    var stage = app.querySelector('#stage'), r = cv.getBoundingClientRect(), pal = page().bg === 'dark' ? CHALK : COLS;
    var old = stage.querySelector('.wb-in'); if (old) old.blur();
    var fs = [30, 42, 60][size], inp = document.createElement('input'); inp.className = 'wb-in';
    inp.style.left = (p[0] / W * r.width) + 'px'; inp.style.top = (p[1] / H * r.height - fs * r.width / W) + 'px'; inp.style.fontSize = (fs * r.width / W) + 'px'; inp.style.color = pal[col];
    inp.placeholder = 'Type, then press Enter'; stage.appendChild(inp); inp.focus();
    var done = false, commit = function () { if (done) return; done = true; var v = inp.value.trim(); inp.remove(); if (!v) return; snap(); page().items.push({ t: 'text', x: p[0], y: p[1], size: fs, c: pal[col], txt: v, font: 'type' }); changed(); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') { commit(); if (!e.shiftKey) typeAt([p[0], p[1] + fs * 1.35]); } if (e.key === 'Escape') { done = true; inp.remove(); } };
    inp.oninput = function () { sendLive('typing', { x: p[0], y: p[1], size: fs, c: pal[col], txt: inp.value }); };
    inp.onblur = commit;
  }

  // ---------- render ----------
  function render(extra) {
    if (!cx) return; var pg = live ? (st.pages[0] || { bg: 'white', items: [] }) : page(), dark = pg.bg === 'dark';
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = dark ? '#14532d' : '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height); cx.setTransform(scale, 0, 0, scale, 0, 0);
    if (pg.bg === 'grid' || pg.bg === 'lined') { cx.strokeStyle = pg.bg === 'grid' ? '#dbeafe' : '#bfdbfe'; cx.lineWidth = 1.5; cx.beginPath();
      for (var y = 60; y < H; y += 60) { cx.moveTo(0, y); cx.lineTo(W, y); } if (pg.bg === 'grid') for (var x = 60; x < W; x += 60) { cx.moveTo(x, 0); cx.lineTo(x, H); } cx.stroke();
      if (pg.bg === 'lined') { cx.strokeStyle = '#fca5a5'; cx.beginPath(); cx.moveTo(110, 0); cx.lineTo(110, H); cx.stroke(); } }
    pg.items.forEach(item); if (drawing && !drawing.erase) item(drawing); if (extra) item(extra);
  }
  function item(it) {
    cx.save(); cx.strokeStyle = it.c; cx.fillStyle = it.c; cx.lineCap = 'round'; cx.lineJoin = 'round';
    if (it.t === 'ink') { cx.lineWidth = it.w; if (it.hl) { cx.globalAlpha = .32; cx.lineCap = 'square'; } var p = it.pts; cx.beginPath(); cx.moveTo(p[0][0], p[0][1]);
      if (p.length < 3) { for (var i = 1; i < p.length; i++) cx.lineTo(p[i][0], p[i][1]); } else { for (var j = 1; j < p.length - 1; j++) { var mx = (p[j][0] + p[j + 1][0]) / 2, my = (p[j][1] + p[j + 1][1]) / 2; cx.quadraticCurveTo(p[j][0], p[j][1], mx, my); } cx.lineTo(p[p.length - 1][0], p[p.length - 1][1]); }
      cx.stroke(); }
    else if (it.t === 'circle') { cx.lineWidth = it.w; cx.beginPath(); cx.arc(it.cx, it.cy, it.r, 0, Math.PI * 2); cx.stroke(); }
    else if (it.t === 'rect') { cx.lineWidth = it.w; cx.strokeRect(it.x, it.y, it.w2, it.h2); }
    else if (it.t === 'text') { cx.font = (it.font === 'neat' ? '' : '600 ') + it.size + 'px ' + (it.font === 'neat' ? NEAT_FONT : TYPE_FONT); cx.textBaseline = 'alphabetic'; cx.fillText(it.txt, it.x, it.y); }
    cx.restore();
  }
  function note(t) { var n = app.querySelector('#note'); if (!n) return; n.textContent = t; n.classList.add('on'); clearTimeout(note.t); note.t = setTimeout(function () { n.classList.remove('on'); }, 1800); }

  // ---------- undo, save, share ----------
  function snap() { undo.push(JSON.stringify(page())); if (undo.length > 60) undo.shift(); redo = []; }
  function doUndo() { if (!undo.length) return; redo.push(JSON.stringify(page())); st.pages[st.cur] = JSON.parse(undo.pop()); pending = []; changed(); swatches(); }
  function doRedo() { if (!redo.length) return; undo.push(JSON.stringify(page())); st.pages[st.cur] = JSON.parse(redo.pop()); changed(); swatches(); }
  var saveT = null;
  function changed() { render(); clearTimeout(saveT); saveT = setTimeout(function () {
    try { S.me().then(function (me) { localStorage.setItem(KEY(me), JSON.stringify(st, function (k, v) { return k === 'raw' || k === 'ink' ? undefined : v; })); }); } catch (e) {} }, 600);
    sendLive('page'); }
  function full() { if (document.fullscreenElement) { document.exitFullscreen(); return; } if (wrap.requestFullscreen) wrap.requestFullscreen().catch(function () { wrap.classList.toggle('full'); setTimeout(fit, 60); }); else { wrap.classList.toggle('full'); setTimeout(fit, 60); } }
  function clean(pg) { return JSON.parse(JSON.stringify(pg, function (k, v) { return k === 'raw' || k === 'ink' ? undefined : v; })); }
  var liveT = null;
  function sendLive(kind, d) {
    if (!chan) return;
    if (kind === 'page') { clearTimeout(liveT); liveT = setTimeout(function () { chan.send({ type: 'broadcast', event: 'page', payload: { page: clean(page()), n: st.cur + 1, of: st.pages.length } }); }, 120); return; }
    var now = Date.now(); if (now - (sendLive.t || 0) < 60) return; sendLive.t = now;
    chan.send({ type: 'broadcast', event: kind, payload: kind === 'ink' ? { t: 'ink', c: d.c, w: d.w, hl: d.hl, pts: d.pts.map(function (q) { return [Math.round(q[0]), Math.round(q[1])]; }) } : d });
  }
  function shareLive() {
    var box = app.querySelector('#livebox');
    if (chan) { S.db.removeChannel(chan); chan = null; room = null; box.innerHTML = ''; this.setAttribute('aria-pressed', false); note('Live sharing stopped'); return; }
    if (!S.db.channel) { note('Live sharing is not available here'); return; }
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint8Array(6); crypto.getRandomValues(b); room = Array.prototype.map.call(b, function (x) { return a[x % a.length]; }).join('');
    chan = S.db.channel('board-' + room, { config: { broadcast: { self: false } } });
    chan.on('broadcast', { event: 'hello' }, function () { sendLive('page'); }).subscribe(function (s2) { if (s2 === 'SUBSCRIBED') sendLive('page'); });
    var url = location.origin + '/board/?live=' + room;
    this.setAttribute('aria-pressed', true);
    box.innerHTML = '<div class="panel tint wb-live"><b>📡 Live now.</b> Students open <a href="' + E(url) + '" target="_blank" rel="noopener">' + E(url.replace(/^https?:\/\//, '')) + '</a> or type the code <code>' + room + '</code> on <b>' + E(location.host) + '/board/</b>. They see every stroke as you write. Press 📡 again to stop.<button type="button" class="btn sm" id="cpl">Copy link</button></div>';
    box.querySelector('#cpl').onclick = function () { try { navigator.clipboard.writeText(url); note('Link copied'); } catch (e) {} };
  }

  // ---------- student view (live) ----------
  function viewer(me) {
    if (!/^[A-Z0-9]{6}$/.test(live)) { app.innerHTML = '<section class="panel"><h2>Live board</h2><p>That board code does not look right. Ask your teacher for the link.</p></section>'; return; }
    st = { pages: [{ bg: 'white', items: [] }], cur: 0 };
    build(me, false);
    var vst = app.querySelector('#vst'), ghost = null;
    chan = S.db.channel('board-' + live, { config: { broadcast: { self: false } } });
    chan.on('broadcast', { event: 'page' }, function (m) { st.pages[0] = m.payload.page; ghost = null; vst.textContent = '🟢 Live · page ' + m.payload.n + ' of ' + m.payload.of; render(); })
      .on('broadcast', { event: 'ink' }, function (m) { ghost = m.payload; render(ghost); })
      .on('broadcast', { event: 'typing' }, function (m) { var t = m.payload; ghost = { t: 'text', x: t.x, y: t.y, size: t.size, c: t.c, txt: t.txt, font: 'type' }; render(ghost); })
      .subscribe(function (s2) { if (s2 === 'SUBSCRIBED') { vst.textContent = 'Waiting for your teacher…'; chan.send({ type: 'broadcast', event: 'hello', payload: {} }); } });
  }
})();
