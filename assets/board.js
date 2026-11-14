/* Learnova · Smart Whiteboard.
   Pen (with stylus pressure), pencil, highlighter, eraser, text, lines, arrows, boxes, ellipses, graphs and images on
   16:9 pages, with zoom and pan, projected full screen and shared live. Two modes:
   - Freehand: ink stays exactly as written.
   - Smart Notes: after a pause (or on "Recognise") handwriting is read, checked for spelling and grammar (equations and
     formulae are never re-worded) and offered as a suggestion: Accept, Edit or Reject. Nothing is replaced silently, and
     accepted text keeps the original strokes as a layer that can be shown or restored.
   Recognition: the browser's own Handwriting Recognition API when it exists, otherwise the "handwriting" Edge Function.
   Correction: the "smart-correct" Edge Function. Keys stay on the server. Boards autosave to this device at once and to
   Supabase (whiteboards / whiteboard_pages) after a short pause; "Share with class" lets that class open a board. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var W = 1600, H = 900;   // page coordinates (16:9)
  var COLS = ['#111827', '#1d4ed8', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0d9488', '#db2777'];
  var CHALK = ['#f9fafb', '#93c5fd', '#fca5a5', '#86efac', '#c4b5fd', '#fdba74', '#5eead4', '#f9a8d4'];
  var BGS = [['white', 'White'], ['grid', 'Squares'], ['graph', 'Graph paper'], ['lined', 'Lines'], ['dark', 'Chalkboard']];
  var NEAT_FONT = "'Patrick Hand', 'Comic Neue', 'Segoe Print', cursive", TYPE_FONT = "'Atkinson Hyperlegible', system-ui, sans-serif";
  var SIZES = { pen: [2, 3.5, 5, 8, 12], pencil: [1.2, 2, 3, 4.5, 6], hl: [12, 18, 26, 34, 44], text: [24, 32, 44, 60, 80], shape: [2, 3, 5, 7, 10] };
  var SHAPES = { line: 1, arrow: 1, darrow: 1, rect: 1, ellipse: 1 };
  var QS = new URLSearchParams(location.search), UUID = /^[0-9a-f-]{36}$/;
  var live = QS.get('live'), CLS = UUID.test(QS.get('class') || '') ? QS.get('class') : null, BID = UUID.test(QS.get('b') || '') ? QS.get('b') : null, CNAME = (QS.get('n') || '').slice(0, 80);

  var me = null, board = null, tool = 'pen', col = 0, size = 1, mode = 'smart', tidy = true, showInk = false, readOnly = false;
  var undo = [], redo = [], view = { z: 1, x: 0, y: 0 }, base = 1, cv, cx, wrap, stage, layer = null, drawing = null, sel = [], ghost = null;
  var pointers = {}, pinch = null, pan = null, spaceDown = false, penSeen = false;
  var cloud = 'unknown', dirty = {}, metaDirty = false, pagesShrunk = false, saving = false, cloudAgain = false, localT = null, cloudT = null, retryT = null, boards = [];
  var pending = [], recT = null, sugs = [], browserRec = null, browserBad = false, lastEngine = '';
  var chans = {}, room = null, IMG = {}, liveT = null;
  var rep = function (k, v) { return k.charAt(0) === '_' ? undefined : v; };
  var uid = function () { return Math.random().toString(36).slice(2, 10); };
  var r1 = function (v) { return Math.round(v * 10) / 10; };
  (function () { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap'; document.head.appendChild(l); })();

  function newBoard() { return { id: null, cls: CLS, title: (CNAME ? CNAME + ' · ' : 'Board · ') + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), shared: false, pages: [{ bg: 'white', items: [] }], cur: 0 }; }
  function isTeacher(m) { return m.admin || m.staff || m.roles.indexOf('teacher') >= 0 || m.roles.indexOf('school_teacher') >= 0; }
  function page() { return board.pages[board.cur]; }
  function find(id) { var its = page().items; for (var i = 0; i < its.length; i++) if (its[i].id === id) return its[i]; return null; }
  function colour() { return (page().bg === 'dark' ? CHALK : COLS)[col]; }
  function chk(r) { if (r && r.error) throw r.error; return r; }
  function fnData(r) { var d = r && r.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } } return d; }

  S.guard(app, { school: true, allowPending: true, anyone: true }).then(function (m) {
    me = m; board = newBoard();
    if (live) return viewer();
    if (BID) return openBoardLink(BID);
    if (!isTeacher(m)) return studentHome();
    startTeacher();
  }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  // ======================= look =======================
  var CSS = '.wb{display:grid;gap:10px;--wbk:#0d9488}.wb-top{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--raised,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:8px 10px;box-shadow:0 2px 10px rgba(15,23,42,.06)}' +
    '.wb button.k{font:700 .88rem var(--body,inherit);border:2px solid var(--k,#cbd5e1);background:color-mix(in srgb,var(--k,#64748b) 10%,transparent);color:var(--k,#334155);border-radius:11px;padding:6px 10px;cursor:pointer;min-width:38px;min-height:38px;line-height:1.1}' +
    '.wb button.k[aria-pressed=true]{background:var(--k,#334155)!important;color:#fff!important}.wb button.k:disabled{opacity:.45;cursor:not-allowed}.wb button.k:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}' +
    '.wb .seg{display:inline-flex;border-radius:12px;overflow:hidden;border:2px solid #0d9488}.wb .seg button.k{border:0;border-radius:0;min-height:34px}' +
    '.wb .sw{width:26px;height:26px;border-radius:50%;padding:0;border:3px solid #fff;box-shadow:0 0 0 2px #cbd5e1;cursor:pointer}.wb .sw[aria-pressed=true]{box-shadow:0 0 0 3px #111827}' +
    '.wb .sep{width:1px;height:28px;background:var(--line,#e5e7eb);margin:0 3px}.wb .grow{flex:1}.wb .pill{font:700 .8rem system-ui;border-radius:999px;padding:5px 10px;background:#f1f5f9;color:#334155;white-space:nowrap}' +
    '.wb .pill.ok{background:#dcfce7;color:#166534}.wb .pill.busy{background:#e0f2fe;color:#075985}.wb .pill.warn{background:#fef3c7;color:#92400e}.wb .pill.bad{background:#fee2e2;color:#991b1b}' +
    '.wb input[type=range]{width:90px;accent-color:#0d9488}.wb-main{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start}' +
    '.wb-rail{display:grid;grid-template-columns:repeat(2,42px);gap:5px;align-content:start;background:var(--raised,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:7px;box-shadow:0 2px 10px rgba(15,23,42,.06)}.wb-rail button.k{width:42px;height:42px;min-width:0;padding:0;font-size:1.1rem}.wb-rail hr{grid-column:1/-1;border:0;border-top:1px solid var(--line,#e5e7eb);margin:2px 0;width:100%}' +
    '.wb-stage{position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;box-shadow:0 12px 34px rgba(15,23,42,.18);touch-action:none;background:#fff;user-select:none;-webkit-user-select:none}' +
    '.wb-stage canvas{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;touch-action:none}.wb-stage[data-tool=text] canvas{cursor:text}.wb-stage[data-tool=select] canvas{cursor:default}.wb-stage[data-tool=hand] canvas,.wb-stage.panning canvas{cursor:grab}.wb-stage[data-tool=erase] canvas{cursor:cell}' +
    '.wb-stage .wb-in{position:absolute;z-index:4;margin:0;box-sizing:content-box;border:2px dashed #2563eb;background:rgba(255,255,255,.92);outline:none;padding:2px 6px;min-width:140px;resize:none;overflow:hidden;line-height:1.25;white-space:pre}' +
    '.wb-note{position:absolute;left:50%;transform:translateX(-50%);bottom:10px;z-index:6;font:600 .85rem system-ui;background:rgba(17,24,39,.82);color:#fff;border-radius:999px;padding:6px 14px;pointer-events:none;opacity:0;transition:opacity .3s;max-width:90%;text-align:center}.wb-note.on{opacity:1}' +
    '.wb-selbar{position:absolute;z-index:5;display:none;gap:4px;background:#0f172a;border-radius:12px;padding:4px;box-shadow:0 6px 18px rgba(0,0,0,.25)}.wb-selbar button{font:700 .8rem system-ui;background:transparent;color:#fff;border:0;border-radius:8px;padding:6px 8px;cursor:pointer}.wb-selbar button:hover{background:#334155}' +
    '.wb-sugs{position:absolute;right:10px;top:10px;z-index:5;width:min(380px,46%);max-height:calc(100% - 20px);overflow:auto;display:flex;flex-direction:column;gap:8px}' +
    '.wb-sug{background:rgba(255,255,255,.97);border:2px solid #0d9488;border-radius:14px;padding:10px;box-shadow:0 10px 26px rgba(15,23,42,.22);font:500 .88rem system-ui;color:#0f172a}.wb-sug.focus{border-color:#f59e0b}' +
    '.wb-sug .sh{display:flex;gap:6px;align-items:center;margin-bottom:6px}.wb-sug .sh b{flex:1}.wb-sug .kd{font:700 .72rem system-ui;border-radius:999px;padding:2px 8px;background:#ccfbf1;color:#115e59}.wb-sug .kd.eq{background:#ede9fe;color:#5b21b6}' +
    '.wb-sug .cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wb-sug label{display:block;font:800 .7rem system-ui;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:3px}' +
    '.wb-sug .rec{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:6px 8px;min-height:38px;white-space:pre-wrap;word-break:break-word}.wb-sug textarea{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #14b8a6;border-radius:9px;padding:6px 8px;font:600 .9rem system-ui;resize:vertical;background:#f0fdfa}' +
    '.wb-sug ul{margin:6px 0 0;padding-left:18px;color:#475569;font-size:.8rem}.wb-sug .fl{margin-top:6px;background:#fef3c7;color:#92400e;border-radius:8px;padding:5px 8px;font-size:.8rem}.wb-sug .er{margin-top:6px;color:#b45309;font-size:.8rem}' +
    '.wb-sug .acts{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.wb-sug .acts button{font:700 .8rem system-ui;border-radius:9px;padding:6px 9px;cursor:pointer;border:2px solid #cbd5e1;background:#fff;color:#334155}.wb-sug .acts .yes{background:#0d9488;border-color:#0d9488;color:#fff}.wb-sug .acts .no{border-color:#fecaca;color:#b91c1c}' +
    '.wb-modal{position:absolute;inset:0;z-index:8;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:12px}.wb-modal[hidden]{display:none}' +
    '.wb-card{background:#fff;color:#0f172a;border-radius:16px;padding:14px;width:min(560px,100%);max-height:100%;overflow:auto;box-shadow:0 18px 40px rgba(0,0,0,.3);font:500 .9rem system-ui}.wb-card h3{margin:0 0 8px}.wb-card .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wb-card label{display:block;font-weight:700;font-size:.8rem;margin:6px 0 2px;color:#334155}' +
    '.wb-card input,.wb-card select,.wb-card textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:7px 9px;font:inherit}.wb-card .acts{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.wb-card .err{color:#b91c1c;font-weight:700;min-height:1.2em;margin-top:6px}' +
    '.wb:fullscreen,.wb.full{position:fixed;inset:0;z-index:9999;background:#0f172a;padding:10px;display:flex;flex-direction:column;overflow:auto}.wb:fullscreen .wb-main,.wb.full .wb-main{flex:1}' +
    '.wb:fullscreen .wb-stage,.wb.full .wb-stage{width:min(100%,calc((100vh - 150px) * 16 / 9));margin:0 auto}' +
    '.wb-live{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.wb-live code{font-size:1.2rem;font-weight:800;letter-spacing:.1em;background:#eef2ff;color:#3730a3;border-radius:8px;padding:4px 10px}' +
    '.wb-boards{display:grid;gap:6px}.wb-boards .brow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;border:1px solid var(--line,#e5e7eb);border-radius:12px;padding:8px 10px;background:var(--raised,#fff)}.wb-boards .brow b{flex:1;min-width:160px}' +
    '.wb-title{font:800 1.2rem var(--head,inherit);border:2px solid transparent;border-radius:10px;padding:4px 8px;background:transparent;color:inherit;min-width:220px;max-width:100%}.wb-title:hover,.wb-title:focus{border-color:#99f6e4;background:rgba(255,255,255,.6)}' +
    '@media (max-width:1150px){.wb .lbl{display:none}}@media (max-width:760px){.wb-main{grid-template-columns:1fr}.wb-rail{display:flex;flex-direction:row;flex-wrap:wrap}.wb-rail hr{display:none}.wb-sugs{width:calc(100% - 20px)}.wb-sug .cols{grid-template-columns:1fr}}';

  function css() { if (!document.getElementById('wb-css')) { var s = document.createElement('style'); s.id = 'wb-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function K(a, icon, label, k, title, on, extra) { return '<button type="button" class="k" data-a="' + a + '" style="--k:' + k + '" title="' + E(title || label) + '" aria-label="' + E(label) + '"' + (on != null ? ' aria-pressed="' + on + '"' : '') + (extra || '') + '>' + icon + (label && icon ? '<span class="lbl"> ' + E(label) + '</span>' : E(label)) + '</button>'; }
  function R(a, icon, label, k, key) { return '<button type="button" class="k" data-t="' + a + '" style="--k:' + k + '" title="' + E(label + (key ? ' (' + key + ')' : '')) + '" aria-label="' + E(label) + '" aria-pressed="' + (tool === a) + '">' + icon + '</button>'; }

  // ======================= teacher board =======================
  function build(kind) {
    css();
    var T = kind === 'teacher';
    var back = board.cls ? '/teach/#classes/' + board.cls : '/teach/';
    app.innerHTML = (T ? '<div class="row2 cband" style="--k:#0d9488"><div style="flex:1;min-width:240px"><p class="label">Smart Whiteboard' + (CNAME ? ' · ' + E(CNAME) : '') + '</p>' +
        '<input class="wb-title" id="wbt" maxlength="120" value="' + E(board.title) + '" aria-label="Board title"><p class="small" style="margin:2px 0 0">Write, draw, graph and type; switch on ✨ Smart Notes to turn handwriting into neat, checked text.</p></div>' +
        '<div class="cta"><button class="btn sm" id="bdl" type="button">📂 My boards</button>' + (board.cls ? '<label class="btn sm" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="shr"' + (board.shared ? ' checked' : '') + '> Share with class</label>' : '') +
        '<a class="btn sm" href="' + back + '">' + (board.cls ? '← Back to the class' : '🏫 My classes') + '</a></div></div><div id="bdbox"></div>'
      : '') +
      '<div class="wb" id="wb">' + (T ? topBar() : viewBar(kind)) +
      '<div class="wb-main' + (T ? '' : '" style="grid-template-columns:1fr') + '">' + (T ? rail() : '') +
      '<div class="wb-stage" id="stage" data-tool="' + tool + '"><canvas id="cv"></canvas><div class="wb-selbar" id="selbar"></div><div class="wb-sugs" id="sugs"></div><div class="wb-note" id="note" role="status" aria-live="polite"></div><div class="wb-modal" id="modal" hidden></div></div></div>' +
      (T || kind === 'view' ? '<div class="wb-top" id="pgbar"></div>' : '') + '</div>' +
      (T ? '<div id="livebox"></div><input type="file" id="imgf" accept="image/*" hidden>' + helpText() : '');
    wrap = app.querySelector('#wb'); stage = app.querySelector('#stage'); cv = app.querySelector('#cv'); cx = cv.getContext('2d');
    window.addEventListener('resize', fit); document.addEventListener('fullscreenchange', function () { setTimeout(fit, 80); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(); });
    app.querySelectorAll('[data-a="full"]').forEach(function (b) { b.onclick = full; });
    stage.addEventListener('pointerdown', down); stage.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', wheel, { passive: false });
    stage.addEventListener('contextmenu', function (e) { if (e.target === cv) e.preventDefault(); });
    fit();
    if (kind === 'view') pagesBar();
    if (!T) return;
    wire(); pagesBar(); setStatus(); recStatus();
    stage.addEventListener('click', function (e) { if (tool === 'text' && e.target === cv && !pan) typeAt(toWorld(e.clientX, e.clientY)); });
    stage.addEventListener('dblclick', function (e) { if (e.target !== cv || (tool !== 'select' && tool !== 'text')) return; var h = hitTest(toWorld(e.clientX, e.clientY)); if (!h) return; if (h.t === 'graph') graphDialog(h); else if (h.t === 'text') typeAt([h.x, h.y], h); });
    stage.addEventListener('dragover', function (e) { e.preventDefault(); });
    stage.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f && /^image\//.test(f.type)) addImage(f, toWorld(e.clientX, e.clientY)); });
    document.addEventListener('paste', function (e) { if (typing()) return; var its = (e.clipboardData && e.clipboardData.items) || []; for (var i = 0; i < its.length; i++) if (/^image\//.test(its[i].type)) { e.preventDefault(); addImage(its[i].getAsFile()); return; } });
    document.addEventListener('keydown', keys); document.addEventListener('keyup', function (e) { if (e.key === ' ') { spaceDown = false; stage.classList.remove('panning'); } });
    window.addEventListener('online', function () { if (cloud === 'off') { cloud = 'unknown'; probeCloud().then(function () { if (cloud === 'ok') saveCloud(); }); } else saveCloud(); });
    window.addEventListener('offline', function () { setStatus('offline'); });
    window.addEventListener('beforeunload', function () { writeLocal(); if (chans.class) closeChan('class'); if (chans.code) closeChan('code'); });
    classLive(!!board.cls);
    if (/^(localhost|127\.)/.test(location.hostname)) window.__wb = function () { return { board: board, sugs: sugs, cloud: cloud, view: view, sel: sel, dirty: dirty, mode: mode, compileFn: compileFn, classify: classify, sciFormat: sciFormat, engine: lastEngine }; };
  }
  function topBar() {
    return '<div class="wb-top"><span class="seg" role="group" aria-label="Mode">' + K('mode-free', '✏️', 'Freehand', '#0d9488', 'Freehand: ink stays exactly as written', mode === 'free') + K('mode-smart', '✨', 'Smart Notes', '#0d9488', 'Smart Notes: handwriting is offered as neat, checked text', mode === 'smart') + '</span>' +
      K('recog', '🔍', 'Recognise', '#0891b2', 'Read the selected handwriting now, or all handwriting on this page (Ctrl+Enter)') + K('inklayer', '👁', 'Handwriting', '#64748b', 'Show the original handwriting behind accepted text', showInk) + K('tidy', '📐', 'Tidy shapes', '#0891b2', 'Straighten rough lines, circles and boxes', tidy) +
      '<span class="sep"></span><span id="sws"></span><label class="small" title="Thickness ([ and ])" style="display:inline-flex;align-items:center;gap:4px">●<input type="range" id="sz" min="0" max="4" step="1" value="' + size + '" aria-label="Thickness"></label>' +
      '<span class="sep"></span>' + K('undo', '↶', '', '#334155', 'Undo (Ctrl+Z)') + K('redo', '↷', '', '#334155', 'Redo (Ctrl+Y)') + K('clear', '🗑', 'Clear', '#b91c1c', 'Clear this page') + K('bg', '🎨', 'Background', '#9333ea', 'White, squares, graph paper, lines or chalkboard') +
      '<span class="sep"></span>' + K('zout', '−', '', '#475569', 'Zoom out (-)') + '<button type="button" class="k" data-a="z100" style="--k:#475569" title="Reset zoom (0)" id="zl">100%</button>' + K('zin', '+', '', '#475569', 'Zoom in (+)') +
      '<span class="sep"></span>' + K('png', '🖼', 'PNG', '#2563eb', 'Download this page as a picture') + K('pdf', '📄', 'PDF', '#2563eb', 'Download all pages as a PDF') + K('full', '⛶', 'Project', '#0d9488', 'Full screen for the projector (F)') + (board.cls ? K('clive', '🟢', 'Live to class', '#16a34a', 'Students in this class see your board live from their dashboard', true) : '') + K('live', '📡', 'Code', '#db2777', 'Live code: anyone with the code can watch', !!chans.code) +
      '<span class="grow"></span><span class="pill" id="rst" title="Handwriting recognition">✍️ Ready</span><span class="pill" id="sst" title="Saving">💾</span></div>';
  }
  function rail() {
    return '<div class="wb-rail" role="toolbar" aria-label="Tools">' + R('select', '🖱', 'Select, move and resize', '#334155', 'V') + R('hand', '✋', 'Pan (or hold Space)', '#475569', 'H') + '<hr>' +
      R('pen', '🖊', 'Pen (pressure on a stylus)', '#1d4ed8', 'P') + R('pencil', '✏️', 'Pencil', '#57534e', 'N') + R('hl', '🖍', 'Highlighter', '#ca8a04', 'I') + R('erase', '🧽', 'Eraser: rubs out strokes, shapes and text', '#dc2626', 'E') + '<hr>' +
      R('text', '⌨️', 'Type text', '#7c3aed', 'T') + R('line', '╱', 'Line', '#0f766e', 'L') + R('arrow', '➝', 'Arrow', '#0f766e', 'A') + R('darrow', '⟷', 'Double arrow', '#0f766e', 'D') + R('rect', '▭', 'Box', '#0f766e', 'R') + R('ellipse', '◯', 'Ellipse', '#0f766e', 'O') + '<hr>' +
      '<button type="button" class="k" data-a="graph" style="--k:#16a34a" title="Insert a graph (G)" aria-label="Insert a graph">📈</button><button type="button" class="k" data-a="image" style="--k:#2563eb" title="Insert an image (or paste / drop one)" aria-label="Insert an image">🖼</button></div>';
  }
  function viewBar(kind) {
    return '<div class="wb-top"><b>' + (kind === 'live' ? '📡 Live board' + (liveName ? ' · ' + E(liveName) : '') : '🖊 ' + E(board.title)) + '</b><span class="small muted" id="vst">' + (kind === 'live' ? 'Connecting…' : 'View only') + '</span><span class="grow"></span>' +
      K('full', '⛶', 'Full screen', '#0d9488', 'Full screen') + '</div>';
  }
  function helpText() {
    return '<details class="small" style="margin-top:8px"><summary><b>How it works and keyboard shortcuts</b></summary><p><b>✨ Smart Notes</b>: stop writing for a moment (or press 🔍 Recognise) and a card shows what was read next to a corrected version. Choose <b>Accept</b>, edit the text first, use the text as read, or <b>Keep handwriting</b>. Nothing changes until you choose. Accepted text keeps your strokes: 👁 Handwriting shows them, and selecting the text gives <b>↩ Handwriting</b> to bring them back. Equations and formulae are tidied (H2O → H₂O, -> → →) but never re-worded.</p>' +
      '<p>Handwriting is read by your browser where it can do this itself; otherwise only the finished strokes are sent to Learnova\'s server, which asks Google\'s handwriting recogniser. Corrections come from Claude via Learnova\'s server. If either is unavailable the status says so and your ink stays as written.</p>' +
      '<p><b>Keys</b>: V select · H pan · P pen · N pencil · I highlighter · E eraser · T text · L line · A arrow · D double arrow · R box · O ellipse · G graph · [ ] thickness · Ctrl+Z / Ctrl+Y undo / redo · Delete removes the selection · Ctrl+D duplicate · Ctrl+Enter recognise · Ctrl+S save now · + − 0 zoom · Space+drag or two fingers pan · Ctrl+wheel or pinch zoom · F full screen · Alt+← → pages. Paste or drop an image to add it.</p></details>';
  }

  function wire() {
    swatches();
    var A = function (a, f) { app.querySelectorAll('[data-a="' + a + '"]').forEach(function (el) { el.onclick = f; }); };
    app.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { setTool(b.getAttribute('data-t')); }; });
    A('mode-free', function () { setMode('free'); }); A('mode-smart', function () { setMode('smart'); });
    A('recog', function () { manualRecognise(); });
    A('inklayer', function () { showInk = !showInk; this.setAttribute('aria-pressed', showInk); note(showInk ? '👁 Showing the original handwriting behind accepted text' : 'Showing neat text'); render(); });
    A('tidy', function () { tidy = !tidy; this.setAttribute('aria-pressed', tidy); note(tidy ? '📐 Tidy shapes on' : 'Tidy shapes off'); });
    app.querySelector('#sz').oninput = function () { size = +this.value; };
    A('undo', doUndo); A('redo', doRedo);
    A('clear', function () { var b = this; if (!b.dataset.sure) { b.dataset.sure = 1; b.innerHTML = 'Clear page?'; setTimeout(function () { delete b.dataset.sure; b.innerHTML = '🗑<span class="lbl"> Clear</span>'; }, 2500); return; } snap(); page().items = []; sel = []; delete b.dataset.sure; b.innerHTML = '🗑<span class="lbl"> Clear</span>'; changed(); });
    A('bg', function () { var i = BGS.map(function (x) { return x[0]; }).indexOf(page().bg); snap(); page().bg = BGS[(i + 1) % BGS.length][0]; note(BGS[(i + 1) % BGS.length][1]); swatches(); changed(); });
    A('zin', function () { zoomBy(1.25); }); A('zout', function () { zoomBy(0.8); }); A('z100', resetZoom);
    A('png', exportPNG); A('pdf', exportPDF); A('live', shareLive); A('clive', function () { classLive(!chans.class); note(chans.class ? '🟢 Your class can watch live again' : '⚪ Stopped: students no longer see the board'); });
    A('graph', function () { graphDialog(null); }); A('image', function () { app.querySelector('#imgf').click(); });
    app.querySelector('#imgf').onchange = function () { if (this.files[0]) addImage(this.files[0]); this.value = ''; };
    var t = app.querySelector('#wbt'); t.onchange = function () { board.title = t.value.trim().slice(0, 120) || 'Untitled board'; t.value = board.title; metaDirty = true; scheduleSave(); };
    t.onkeydown = function (e) { if (e.key === 'Enter') t.blur(); };
    var sh = app.querySelector('#shr'); if (sh) sh.onchange = function () {
      if (cloud !== 'ok') { sh.checked = false; note(cloud === 'setup' ? 'Sharing starts once boards can be saved to your account' : 'Sharing needs a connection'); return; }
      board.shared = sh.checked; metaDirty = true; note(board.shared ? '🔗 Students in this class can now open this board' : 'This board is private again'); scheduleSave(200); };
    app.querySelector('#bdl').onclick = boardsPanel;
  }
  function swatches() { var pal = page().bg === 'dark' ? CHALK : COLS, el = app.querySelector('#sws'); if (!el) return;
    el.innerHTML = pal.map(function (c, i) { return '<button type="button" class="sw" data-c="' + i + '" style="background:' + c + '" aria-label="Colour ' + (i + 1) + '" aria-pressed="' + (i === col) + '"></button>'; }).join(' ');
    el.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { col = +b.getAttribute('data-c');
      if (sel.length) { snap(); sel.forEach(function (id) { var it = find(id); if (it && it.t !== 'img') it.c = colour(); }); changed(); }
      else if (tool === 'erase' || tool === 'select' || tool === 'hand') setTool('pen');
      swatches(); }; }); }
  function setTool(t) { commitText(); tool = t; app.querySelectorAll('[data-t]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-t') === t); }); stage.setAttribute('data-tool', t); if (t !== 'select') { sel = []; selbar(); render(); } }
  function setMode(m) { mode = m; app.querySelector('[data-a=mode-free]').setAttribute('aria-pressed', m === 'free'); app.querySelector('[data-a=mode-smart]').setAttribute('aria-pressed', m === 'smart');
    clearTimeout(recT); note(m === 'smart' ? '✨ Smart Notes: pause after writing to get neat, checked text' : '✏️ Freehand: your ink stays exactly as written'); recStatus(); }
  function typing() { var a = document.activeElement; return a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable); }
  function keys(e) {
    if (!app.querySelector('#stage') || readOnly) return;
    if (e.key === 'Escape') { if (!app.querySelector('#modal').hidden) { closeModal(); return; } sel = []; selbar(); render(); return; }
    if (typing()) return;
    var c = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (c && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if (c && k === 'y') { e.preventDefault(); doRedo(); return; }
    if (c && k === 's') { e.preventDefault(); writeLocal(); saveCloud(); note('Saving…'); return; }
    if (c && k === 'enter') { e.preventDefault(); manualRecognise(); return; }
    if (c && k === 'd') { e.preventDefault(); duplicateSel(); return; }
    if (c && k === 'a') { e.preventDefault(); setTool('select'); sel = page().items.map(function (i) { return i.id; }); selbar(); render(); return; }
    if (c) return;
    if (e.altKey && e.key === 'ArrowRight') { goPage(1); return; } if (e.altKey && e.key === 'ArrowLeft') { goPage(-1); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length) { e.preventDefault(); deleteSel(); return; }
    if (e.key === ' ') { e.preventDefault(); spaceDown = true; stage.classList.add('panning'); return; }
    var map = { v: 'select', h: 'hand', p: 'pen', n: 'pencil', i: 'hl', e: 'erase', t: 'text', l: 'line', a: 'arrow', d: 'darrow', r: 'rect', o: 'ellipse' };
    if (map[k]) { e.preventDefault(); setTool(map[k]); return; }
    if (k === 'g') { e.preventDefault(); graphDialog(null); return; } if (k === 'f') { e.preventDefault(); full(); return; }
    if (k === '[' || k === ']') { size = Math.max(0, Math.min(4, size + (k === ']' ? 1 : -1))); app.querySelector('#sz').value = size; note(['Thinnest', 'Thin', 'Medium', 'Thick', 'Thickest'][size]); return; }
    if (k === '+' || k === '=') zoomBy(1.25); if (k === '-') zoomBy(0.8); if (k === '0') resetZoom();
  }

  // ======================= pages =======================
  function pagesBar() {
    var pb = app.querySelector('#pgbar'); if (!pb) return;
    pb.innerHTML = '<button type="button" class="k" data-p="-1" style="--k:#334155" aria-label="Previous page">◀</button><b>Page ' + (board.cur + 1) + ' of ' + board.pages.length + '</b><button type="button" class="k" data-p="1" style="--k:#334155" aria-label="Next page">▶</button>' +
      (readOnly ? '' : '<button type="button" class="k" data-p="new" style="--k:#059669">＋ New page</button><button type="button" class="k" data-p="dup" style="--k:#0891b2">⧉ Copy page</button><button type="button" class="k" data-p="del" style="--k:#b91c1c">Delete page</button>') +
      '<span class="grow"></span><span class="small muted">Alt + ← → change page</span>';
    pb.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-p');
      if (v === 'new' || v === 'dup') { commitText(); var np = v === 'dup' ? JSON.parse(JSON.stringify(page(), rep)) : { bg: page().bg, items: [] };
        if (v === 'dup') np.items.forEach(function (i) { i.id = uid(); });
        board.pages.splice(board.cur + 1, 0, np); board.cur++; for (var i = board.cur; i < board.pages.length; i++) dirty[i] = true; resetPageState(); changed(); pagesBar(); return; }
      if (v === 'del') { if (board.pages.length === 1) { snap(); page().items = []; changed(); return; } if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Delete this page?'; return; }
        board.pages.splice(board.cur, 1); board.cur = Math.max(0, board.cur - 1); for (var j = board.cur; j < board.pages.length; j++) dirty[j] = true; pagesShrunk = true; resetPageState(); changed(); pagesBar(); return; }
      goPage(+v); }; });
  }
  function resetPageState() { undo = []; redo = []; sel = []; sugs = []; pending = []; drawSugs(); selbar(); swatches(); }
  function goPage(d) { var n = Math.max(0, Math.min(board.pages.length - 1, board.cur + d)); if (n === board.cur) return; commitText(); board.cur = n; undo = []; redo = []; sel = []; selbar(); swatches(); drawSugs(); render(); pagesBar(); sendLive('page'); if (!readOnly) writeLocalSoon(); }

  // ======================= view: fit, zoom, pan =======================
  function fit() { if (!cv) return; var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); base = cv.width / W; clampView(); render(); }
  function dprNow() { var r = cv.getBoundingClientRect(); return r.width ? cv.width / r.width : 1; }
  function toWorld(x, y) { var r = cv.getBoundingClientRect(), d = cv.width / (r.width || 1), s = base * view.z; return [((x - r.left) * d - view.x) / s, ((y - r.top) * d - view.y) / s]; }
  function toCss(wx, wy) { var d = dprNow(), s = base * view.z; return [(wx * s + view.x) / d, (wy * s + view.y) / d]; }
  function clampView() { view.z = Math.max(1, Math.min(5, view.z)); var pw = W * base * view.z, ph = H * base * view.z; view.x = Math.min(0, Math.max(cv.width - pw, view.x)); view.y = Math.min(0, Math.max(cv.height - ph, view.y)); var zl = app.querySelector('#zl'); if (zl) zl.textContent = Math.round(view.z * 100) + '%'; }
  function zoomAt(f, sx, sy) { var nz = Math.max(1, Math.min(5, view.z * f)); view.x = sx - (sx - view.x) * nz / view.z; view.y = sy - (sy - view.y) * nz / view.z; view.z = nz; clampView(); commitText(); render(); }
  function resetZoom() { view = { z: 1, x: 0, y: 0 }; clampView(); commitText(); render(); }
  function zoomBy(f) { zoomAt(f, cv.width / 2, cv.height / 2); }
  function wheel(e) {
    var r = cv.getBoundingClientRect(), d = cv.width / r.width;
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0022), (e.clientX - r.left) * d, (e.clientY - r.top) * d); return; }
    if (view.z > 1) { e.preventDefault(); view.x -= e.deltaX * d; view.y -= e.deltaY * d; clampView(); render(); }
  }

  // ======================= pointer input =======================
  function touchIds() { return Object.keys(pointers).filter(function (k) { return pointers[k].type === 'touch'; }); }
  function down(e) {
    if (e.target !== cv) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY, type: e.pointerType };
    if (e.pointerType === 'pen') penSeen = true;
    var ts = touchIds();
    if (e.pointerType === 'touch' && ts.length === 2) { cancelDrawing(); var a = pointers[ts[0]], b = pointers[ts[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, z: view.z, vx: view.x, vy: view.y }; pan = null; return; }
    if (readOnly || (e.pointerType === 'touch' && penSeen) || e.button === 1 || tool === 'hand' || spaceDown) { pan = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; e.preventDefault(); return; }
    if (e.button && e.button !== 0) return;
    if (cv.setPointerCapture) try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    var p = toWorld(e.clientX, e.clientY);
    if (tool === 'text') return;   // typing starts on click, so the new box keeps the focus
    if (tool === 'select') { selDown(p, e); return; }
    commitText();
    if (tool === 'erase') { drawing = { erase: true }; eraseAt(p); return; }
    if (SHAPES[tool]) { drawing = { id: uid(), t: 'shape', k: tool, x1: r1(p[0]), y1: r1(p[1]), x2: r1(p[0]), y2: r1(p[1]), c: colour(), w: SIZES.shape[size] }; makeLayer(); return; }
    var pen = e.pointerType === 'pen', now = Date.now();
    drawing = { id: uid(), t: 'ink', c: colour(), w: SIZES[tool === 'hl' ? 'hl' : tool === 'pencil' ? 'pencil' : 'pen'][size], ts0: now, pts: [[r1(p[0]), r1(p[1]), pen ? pres(e) : 0.5, 0]] };
    if (pen) drawing.pr = true; if (tool === 'hl') drawing.hl = true; if (tool === 'pencil') drawing.pencil = true;
    clearTimeout(recT); makeLayer();
  }
  function pres(e) { return e.pressure > 0 ? Math.round(e.pressure * 100) / 100 : 0.5; }
  function move(e) {
    if (pointers[e.pointerId]) { pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY; }
    var d = dprNow();
    if (pinch) { var ts = touchIds(); if (ts.length < 2) return; var a = pointers[ts[0]], b = pointers[ts[1]], r = cv.getBoundingClientRect();
      var nz = Math.max(1, Math.min(5, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)), sx = (pinch.m.x - r.left) * d, sy = (pinch.m.y - r.top) * d, m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      view.z = nz; view.x = sx - (sx - pinch.vx) * nz / pinch.z + (m.x - pinch.m.x) * d; view.y = sy - (sy - pinch.vy) * nz / pinch.z + (m.y - pinch.m.y) * d; clampView(); render(); return; }
    if (pan) { view.x = pan.vx + (e.clientX - pan.x) * d; view.y = pan.vy + (e.clientY - pan.y) * d; clampView(); render(); return; }
    if (!drawing) return;
    var p = toWorld(e.clientX, e.clientY);
    if (drawing.erase) { eraseAt(p); return; }
    if (drawing.sel) { selMove(p, e); return; }
    if (drawing.t === 'shape') { drawing.x2 = r1(p[0]); drawing.y2 = r1(p[1]);
      if (e.shiftKey) { if (drawing.k === 'rect' || drawing.k === 'ellipse') { var s = Math.max(Math.abs(drawing.x2 - drawing.x1), Math.abs(drawing.y2 - drawing.y1)); drawing.x2 = drawing.x1 + s * Math.sign(drawing.x2 - drawing.x1 || 1); drawing.y2 = drawing.y1 + s * Math.sign(drawing.y2 - drawing.y1 || 1); }
        else { var ang = Math.round(Math.atan2(drawing.y2 - drawing.y1, drawing.x2 - drawing.x1) / (Math.PI / 4)) * Math.PI / 4, L = Math.hypot(drawing.x2 - drawing.x1, drawing.y2 - drawing.y1); drawing.x2 = r1(drawing.x1 + L * Math.cos(ang)); drawing.y2 = r1(drawing.y1 + L * Math.sin(ang)); } }
      render(); sendLive('ghost', drawing); return; }
    var co = e.getCoalescedEvents ? e.getCoalescedEvents() : []; if (!co || !co.length) co = [e];
    co.forEach(function (ev) { var q = toWorld(ev.clientX, ev.clientY), last = drawing.pts[drawing.pts.length - 1];
      if (Math.abs(q[0] - last[0]) + Math.abs(q[1] - last[1]) < 0.6) return;
      drawing.pts.push([r1(q[0]), r1(q[1]), drawing.pr ? pres(ev) : 0.5, Date.now() - drawing.ts0]); });
    delete drawing._s; render(); sendLive('ghost', drawing);
  }
  function up(e) {
    delete pointers[e.pointerId];
    if (pinch) { if (touchIds().length < 2) pinch = null; return; }
    if (pan) { pan = null; return; }
    if (!drawing) return;
    var d = drawing; drawing = null; layer = null;
    if (d.erase) { if (d.hit) changed(); return; }
    if (d.sel) { selUp(d); return; }
    if (d.t === 'shape') { if (Math.hypot(d.x2 - d.x1, d.y2 - d.y1) < 6) { render(); return; } snap(); page().items.push(d); changed(); return; }
    if (d.pts.length < 2) d.pts.push([d.pts[0][0] + 0.5, d.pts[0][1] + 0.5, d.pts[0][2], 1]);
    snap(); delete d._s;
    var shape = tidy && !d.hl && !d.pencil ? tidyShape(d) : null;
    if (shape) { page().items.push(shape); note('📐 Tidied'); changed(); return; }
    page().items.push(d); changed();
    if (!d.hl) { pending.push(d.id); if (mode === 'smart') { clearTimeout(recT); recT = setTimeout(autoRecognise, 1500); recStatus('wait'); } }
  }
  function cancelDrawing() { if (drawing && !drawing.sel && !drawing.erase) { drawing = null; layer = null; render(); } }
  function makeLayer() { render(); try { layer = document.createElement('canvas'); layer.width = cv.width; layer.height = cv.height; layer.getContext('2d').drawImage(cv, 0, 0); } catch (x) { layer = null; } }

  // ======================= items: geometry =======================
  function bbox(it) {
    var x0, y0, x1, y1, pad;
    if (it.t === 'ink') { x0 = y0 = 1e9; x1 = y1 = -1e9; it.pts.forEach(function (q) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }); pad = it.w / 2; return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad }; }
    if (it.t === 'shape') { pad = it.w + (it.k === 'arrow' || it.k === 'darrow' ? 12 : 0); return { x0: Math.min(it.x1, it.x2) - pad, y0: Math.min(it.y1, it.y2) - pad, x1: Math.max(it.x1, it.x2) + pad, y1: Math.max(it.y1, it.y2) + pad }; }
    if (it.t === 'text') { cx.save(); cx.font = font(it); var ls = it.txt.split('\n'), w = 0; ls.forEach(function (l) { w = Math.max(w, cx.measureText(l).width); }); cx.restore(); return { x0: it.x - 4, y0: it.y - it.size, x1: it.x + w + 4, y1: it.y + (ls.length - 1) * it.size * 1.25 + it.size * 0.3 }; }
    return { x0: it.x, y0: it.y, x1: it.x + it.w, y1: it.y + it.h };
  }
  function font(it) { return (it.font === 'neat' ? '' : '600 ') + it.size + 'px ' + (it.font === 'neat' ? NEAT_FONT : TYPE_FONT); }
  function segDist(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0; return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
  function near(it, p, r) {
    if (it.t === 'ink') { var q = it.pts; if (q.length === 1) return Math.hypot(p[0] - q[0][0], p[1] - q[0][1]) < r + it.w; for (var i = 1; i < q.length; i++) if (segDist(p, q[i - 1], q[i]) < r + it.w / 2) return true; return false; }
    if (it.t === 'shape') { var a = [it.x1, it.y1], b = [it.x2, it.y2];
      if (it.k === 'rect') { var c = [it.x2, it.y1], d = [it.x1, it.y2]; return segDist(p, a, c) < r || segDist(p, c, b) < r || segDist(p, b, d) < r || segDist(p, d, a) < r; }
      if (it.k === 'ellipse') { var rx = Math.abs(it.x2 - it.x1) / 2 || 1, ry = Math.abs(it.y2 - it.y1) / 2 || 1, ex = (p[0] - (it.x1 + it.x2) / 2) / rx, ey = (p[1] - (it.y1 + it.y2) / 2) / ry; return Math.abs(Math.hypot(ex, ey) - 1) * Math.min(rx, ry) < r; }
      return segDist(p, a, b) < r + it.w; }
    var bb = bbox(it); return p[0] >= bb.x0 - r && p[0] <= bb.x1 + r && p[1] >= bb.y0 - r && p[1] <= bb.y1 + r;
  }
  function hitTest(p) { var its = page().items; for (var i = its.length - 1; i >= 0; i--) { var it = its[i]; if (it.t === 'img' || it.t === 'graph' || it.t === 'text' ? near(it, p, 2) : near(it, p, 9 / view.z)) return it; } return null; }
  function translate(it, dx, dy) {
    if (it.t === 'ink') { it.pts.forEach(function (q) { q[0] = r1(q[0] + dx); q[1] = r1(q[1] + dy); }); delete it._s; }
    else if (it.t === 'shape') { it.x1 += dx; it.y1 += dy; it.x2 += dx; it.y2 += dy; }
    else { it.x += dx; it.y += dy; if (it.ink) it.ink.forEach(function (s) { translate(s, dx, dy); }); }
  }
  function eraseAt(p) { var its = page().items, r = 14 / view.z;
    for (var i = its.length - 1; i >= 0; i--) { var it = its[i]; if (it.t === 'img' || it.t === 'graph') continue;
      if (near(it, p, r)) { if (!drawing.hit) { snap(); drawing.hit = true; } its.splice(i, 1); render(); return; } } }

  // ---------- select / move / resize ----------
  function unionBox(ids) { var b = null; ids.forEach(function (id) { var it = find(id); if (!it) return; var q = bbox(it); b = b ? { x0: Math.min(b.x0, q.x0), y0: Math.min(b.y0, q.y0), x1: Math.max(b.x1, q.x1), y1: Math.max(b.y1, q.y1) } : q; }); return b; }
  function onHandle(p) { if (sel.length !== 1) return false; var b = unionBox(sel); if (!b) return false; return Math.hypot(p[0] - b.x1, p[1] - b.y1) < 16 / view.z; }
  function selDown(p, e) {
    if (onHandle(p)) { var it = find(sel[0]); drawing = { sel: true, resize: true, it: it, b0: bbox(it), o: JSON.parse(JSON.stringify(it, rep)), snapped: false }; return; }
    var h = hitTest(p);
    if (h) { if (sel.indexOf(h.id) < 0) sel = e.shiftKey ? sel.concat(h.id) : [h.id]; drawing = { sel: true, move: true, last: p, moved: false }; render(); selbar(); return; }
    sel = []; drawing = { sel: true, marquee: true, x1: p[0], y1: p[1], x2: p[0], y2: p[1] }; render(); selbar();
  }
  function selMove(p, e) {
    var d = drawing;
    if (d.move) { if (!d.moved) { snap(); d.moved = true; } var dx = p[0] - d.last[0], dy = p[1] - d.last[1]; sel.forEach(function (id) { var it = find(id); if (it) translate(it, dx, dy); }); d.last = p; render(); selbar(); return; }
    if (d.marquee) { d.x2 = p[0]; d.y2 = p[1]; render(); return; }
    if (d.resize) { if (!d.snapped) { snap(); d.snapped = true; } var it = d.it, b = d.b0, o = d.o;
      var sx = Math.max(0.05, (p[0] - b.x0) / Math.max(1, b.x1 - b.x0)), sy = Math.max(0.05, (p[1] - b.y0) / Math.max(1, b.y1 - b.y0));
      if (it.t === 'img' || it.t === 'text' || (it.t === 'ink' && !e.shiftKey)) { var s = Math.max(sx, sy); sx = sy = s; }
      if (it.t === 'img' || it.t === 'graph') { it.w = Math.max(60, o.w * sx); it.h = Math.max(40, o.h * sy); }
      else if (it.t === 'text') { it.size = Math.max(10, Math.min(300, o.size * sx)); }
      else if (it.t === 'shape') { it.x1 = b.x0 + (o.x1 - b.x0) * sx; it.x2 = b.x0 + (o.x2 - b.x0) * sx; it.y1 = b.y0 + (o.y1 - b.y0) * sy; it.y2 = b.y0 + (o.y2 - b.y0) * sy; }
      else if (it.t === 'ink') { it.pts = o.pts.map(function (q) { return [r1(b.x0 + (q[0] - b.x0) * sx), r1(b.y0 + (q[1] - b.y0) * sy), q[2], q[3]]; }); delete it._s; }
      render(); selbar(); }
  }
  function selUp(d) {
    if (d.marquee) { var r = { x0: Math.min(d.x1, d.x2), y0: Math.min(d.y1, d.y2), x1: Math.max(d.x1, d.x2), y1: Math.max(d.y1, d.y2) };
      if (r.x1 - r.x0 > 4 || r.y1 - r.y0 > 4) sel = page().items.filter(function (it) { var b = bbox(it); return b.x0 < r.x1 && b.x1 > r.x0 && b.y0 < r.y1 && b.y1 > r.y0; }).map(function (it) { return it.id; });
      render(); selbar(); return; }
    if ((d.move && d.moved) || (d.resize && d.snapped)) changed(); else render(); selbar(); }
  function selbar() {
    var bar = app.querySelector('#selbar'); if (!bar) return;
    var its = sel.map(find).filter(Boolean); sel = its.map(function (i) { return i.id; });
    if (!its.length || tool !== 'select') { bar.style.display = 'none'; return; }
    var one = its.length === 1 ? its[0] : null, inks = its.filter(function (i) { return i.t === 'ink' && !i.hl; }).length;
    var b = [['del', '🗑 Delete'], ['dup', '⧉ Copy']];
    if (inks) b.push(['rec', '🔍 Recognise']);
    if (one && one.t === 'text') b.push(['edit', '✏️ Edit']);
    if (one && one.t === 'text' && one.ink && one.ink.length) b.push(['back', '↩ Handwriting']);
    if (one && one.t === 'graph') b.push(['graph', '📈 Edit graph']);
    b.push(['front', '⬆ Front']);
    bar.innerHTML = b.map(function (x) { return '<button type="button" data-s="' + x[0] + '">' + x[1] + '</button>'; }).join('');
    var bb = unionBox(sel), tl = toCss(bb.x0, bb.y0), sr = stage.getBoundingClientRect();
    bar.style.display = 'flex'; bar.style.left = Math.max(4, Math.min(sr.width - bar.offsetWidth - 4, tl[0])) + 'px'; bar.style.top = Math.max(4, tl[1] - 46) + 'px';
    bar.querySelectorAll('[data-s]').forEach(function (x) { x.onclick = function () { var a = x.getAttribute('data-s');
      if (a === 'del') deleteSel(); if (a === 'dup') duplicateSel(); if (a === 'rec') manualRecognise();
      if (a === 'edit') typeAt([one.x, one.y], one); if (a === 'graph') graphDialog(one); if (a === 'back') restoreInk(one);
      if (a === 'front') { snap(); var its2 = page().items; sel.forEach(function (id) { var it = find(id); its2.splice(its2.indexOf(it), 1); its2.push(it); }); changed(); } }; });
  }
  function deleteSel() { if (!sel.length) return; snap(); page().items = page().items.filter(function (i) { return sel.indexOf(i.id) < 0; }); sel = []; selbar(); changed(); }
  function duplicateSel() { if (!sel.length) return; snap(); var ns = []; sel.forEach(function (id) { var it = find(id); if (!it) return; var c = JSON.parse(JSON.stringify(it, rep)); c.id = uid(); translate(c, 24, 24); page().items.push(c); ns.push(c.id); }); sel = ns; changed(); selbar(); }

  // ---------- tidy shapes ----------
  function tidyShape(d) {
    var p = d.pts, n = p.length; if (n < 6) return null;
    var len = 0; for (var i = 1; i < n; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    var ends = Math.hypot(p[n - 1][0] - p[0][0], p[n - 1][1] - p[0][1]);
    if (len > 60 && ends / len > 0.97) return { id: d.id, t: 'shape', k: 'line', c: d.c, w: d.w, x1: p[0][0], y1: p[0][1], x2: p[n - 1][0], y2: p[n - 1][1] };
    var xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; }), x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    if (len < 150 || ends > 0.18 * len || x1 - x0 < 40 || y1 - y0 < 40) return null;
    var cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2, ds = p.map(function (q) { return Math.hypot((q[0] - cxm) / (x1 - x0), (q[1] - cym) / (y1 - y0)); }), m = ds.reduce(function (a, b) { return a + b; }, 0) / n;
    var sd = Math.sqrt(ds.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / n);
    if (sd / m < 0.1) return { id: d.id, t: 'shape', k: 'ellipse', c: d.c, w: d.w, x1: x0, y1: y0, x2: x1, y2: y1 };
    var nearE = p.filter(function (q) { return Math.min(q[0] - x0, x1 - q[0], q[1] - y0, y1 - q[1]) < 0.12 * Math.min(x1 - x0, y1 - y0); }).length / n;
    if (nearE > 0.85) return { id: d.id, t: 'shape', k: 'rect', c: d.c, w: d.w, x1: x0, y1: y0, x2: x1, y2: y1 };
    return null;
  }

  // ======================= render =======================
  function render() {
    if (!cx || !board) return;
    if (layer && drawing && (drawing.t === 'ink' || drawing.t === 'shape')) { cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(layer, 0, 0); applyView(cx); item(cx, drawing, false); return; }
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#cbd5e1'; cx.fillRect(0, 0, cv.width, cv.height);
    applyView(cx); paintPage(cx, page(), showInk);
    if (ghost) item(cx, ghost, false);
    if (drawing && (drawing.t === 'ink' || drawing.t === 'shape')) item(cx, drawing, false);
    // overlays: handwriting waiting for a decision, the selection, the selection rectangle
    sugs.forEach(function (s) { if (s.page !== board.cur) return; dashed(s.bx, s.focus ? '#f59e0b' : '#0d9488', 3); });
    if (sel.length && tool === 'select') { var b = unionBox(sel); if (b) { dashed(b, '#2563eb', 2); if (sel.length === 1) { cx.fillStyle = '#2563eb'; cx.beginPath(); cx.arc(b.x1, b.y1, 9 / view.z, 0, Math.PI * 2); cx.fill(); } } }
    if (drawing && drawing.marquee) dashed({ x0: Math.min(drawing.x1, drawing.x2), y0: Math.min(drawing.y1, drawing.y2), x1: Math.max(drawing.x1, drawing.x2), y1: Math.max(drawing.y1, drawing.y2) }, '#2563eb', 1.5);
    posText();
  }
  function applyView(c) { var s = base * view.z; c.setTransform(s, 0, 0, s, view.x, view.y); }
  function dashed(b, colr, w) { cx.save(); cx.strokeStyle = colr; cx.lineWidth = w / view.z; cx.setLineDash([10 / view.z, 7 / view.z]); cx.strokeRect(b.x0 - 6, b.y0 - 6, b.x1 - b.x0 + 12, b.y1 - b.y0 + 12); cx.restore(); }
  function paintPage(c, pg, inkLayer) {
    var dark = pg.bg === 'dark';
    c.fillStyle = dark ? '#14532d' : '#ffffff'; c.fillRect(0, 0, W, H);
    if (pg.bg === 'grid' || pg.bg === 'lined' || pg.bg === 'graph') { c.save(); c.lineWidth = 1.5;
      if (pg.bg === 'graph') { c.strokeStyle = '#e0f2fe'; c.lineWidth = 1; c.beginPath(); for (var g = 20; g < W; g += 20) { c.moveTo(g, 0); c.lineTo(g, H); } for (g = 20; g < H; g += 20) { c.moveTo(0, g); c.lineTo(W, g); } c.stroke(); c.strokeStyle = '#7dd3fc'; c.lineWidth = 1.6; c.beginPath(); for (g = 100; g < W; g += 100) { c.moveTo(g, 0); c.lineTo(g, H); } for (g = 100; g < H; g += 100) { c.moveTo(0, g); c.lineTo(W, g); } c.stroke(); }
      else { c.strokeStyle = pg.bg === 'grid' ? '#dbeafe' : '#bfdbfe'; c.beginPath(); for (var y = 60; y < H; y += 60) { c.moveTo(0, y); c.lineTo(W, y); } if (pg.bg === 'grid') for (var x = 60; x < W; x += 60) { c.moveTo(x, 0); c.lineTo(x, H); } c.stroke();
        if (pg.bg === 'lined') { c.strokeStyle = '#fca5a5'; c.beginPath(); c.moveTo(110, 0); c.lineTo(110, H); c.stroke(); } }
      c.restore(); }
    pg.items.forEach(function (it) { item(c, it, inkLayer); });
  }
  function smoothP(pts) {   // Chaikin corner cutting on position and pressure: steadier ink, original points kept
    var a = pts.map(function (q) { return [q[0], q[1], q[2] == null ? 0.5 : q[2]]; });
    for (var k = 0; k < 2 && a.length > 2; k++) { var b = [a[0]]; for (var i = 0; i < a.length - 1; i++) { var p = a[i], q = a[i + 1]; b.push([.75 * p[0] + .25 * q[0], .75 * p[1] + .25 * q[1], .75 * p[2] + .25 * q[2]], [.25 * p[0] + .75 * q[0], .25 * p[1] + .75 * q[1], .25 * p[2] + .75 * q[2]]); } b.push(a[a.length - 1]); a = b; }
    return a;
  }
  function drawInk(c, it) {
    var p = it._s || (it._s = smoothP(it.pts));
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = it.c;
    if (it.hl) { c.globalAlpha = 0.32; c.lineCap = 'butt'; } else if (it.pencil) c.globalAlpha = 0.78;
    if (!it.pr || it.hl || p.length < 3) { c.lineWidth = it.w; c.beginPath(); c.moveTo(p[0][0], p[0][1]);
      if (p.length < 3) { for (var i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); }
      else { for (var j = 1; j < p.length - 1; j++) c.quadraticCurveTo(p[j][0], p[j][1], (p[j][0] + p[j + 1][0]) / 2, (p[j][1] + p[j + 1][1]) / 2); c.lineTo(p[p.length - 1][0], p[p.length - 1][1]); }
      c.stroke(); return; }
    // stylus pressure: each short piece of the stroke gets its own thickness
    var prev = [p[0][0], p[0][1]];
    for (var k = 1; k < p.length - 1; k++) { var mid = [(p[k][0] + p[k + 1][0]) / 2, (p[k][1] + p[k + 1][1]) / 2];
      c.lineWidth = it.w * (0.35 + 1.3 * p[k][2]); c.beginPath(); c.moveTo(prev[0], prev[1]); c.quadraticCurveTo(p[k][0], p[k][1], mid[0], mid[1]); c.stroke(); prev = mid; }
    c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(p[p.length - 1][0], p[p.length - 1][1]); c.stroke();
  }
  function head(c, x1, y1, x2, y2, w) { var a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(16, w * 4.5); c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - L * Math.cos(a - 0.42), y2 - L * Math.sin(a - 0.42)); c.lineTo(x2 - L * Math.cos(a + 0.42), y2 - L * Math.sin(a + 0.42)); c.closePath(); c.fill(); }
  function item(c, it, inkLayer) {
    if (it._hidden) return;
    c.save(); c.strokeStyle = it.c; c.fillStyle = it.c; c.lineCap = 'round'; c.lineJoin = 'round';
    if (it.t === 'ink') drawInk(c, it);
    else if (it.t === 'shape') { c.lineWidth = it.w;
      if (it.k === 'rect') c.strokeRect(Math.min(it.x1, it.x2), Math.min(it.y1, it.y2), Math.abs(it.x2 - it.x1), Math.abs(it.y2 - it.y1));
      else if (it.k === 'ellipse') { c.beginPath(); c.ellipse((it.x1 + it.x2) / 2, (it.y1 + it.y2) / 2, Math.abs(it.x2 - it.x1) / 2 || 1, Math.abs(it.y2 - it.y1) / 2 || 1, 0, 0, Math.PI * 2); c.stroke(); }
      else { c.beginPath(); c.moveTo(it.x1, it.y1); c.lineTo(it.x2, it.y2); c.stroke(); if (it.k !== 'line') head(c, it.x1, it.y1, it.x2, it.y2, it.w); if (it.k === 'darrow') head(c, it.x2, it.y2, it.x1, it.y1, it.w); } }
    else if (it.t === 'text') {
      if (inkLayer && it.ink && it.ink.length) { it.ink.forEach(function (s) { c.save(); drawInk(c, s); c.restore(); }); c.globalAlpha = 0.18; }
      c.font = font(it); c.textBaseline = 'alphabetic'; it.txt.split('\n').forEach(function (l, i) { c.fillText(l, it.x, it.y + i * it.size * 1.25); }); }
    else if (it.t === 'img') { var im = getImg(it.src); if (im) c.drawImage(im, it.x, it.y, it.w, it.h); else { c.fillStyle = '#f1f5f9'; c.fillRect(it.x, it.y, it.w, it.h); c.fillStyle = '#64748b'; c.font = '600 28px system-ui'; c.fillText('🖼 image', it.x + 16, it.y + 44); } }
    else if (it.t === 'graph') drawGraph(c, it);
    c.restore();
  }
  function getImg(src) { if (!src) return null; var im = IMG[src]; if (!im) { im = IMG[src] = new Image(); im.onload = function () { render(); }; im.src = src; } return im.complete && im.naturalWidth ? im : null; }
  function loadImgs(pg) { return Promise.all(pg.items.filter(function (i) { return i.t === 'img' && i.src; }).map(function (i) { var im = getImg(i.src) || IMG[i.src]; return im.complete ? 0 : new Promise(function (res) { im.addEventListener('load', res); im.addEventListener('error', res); }); })); }
  function note(t) { var n = app.querySelector('#note'); if (!n) return; n.textContent = t; n.classList.add('on'); clearTimeout(note.t); note.t = setTimeout(function () { n.classList.remove('on'); }, 2300); }

  // ======================= graphs =======================
  var FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sqrt: Math.sqrt, ln: Math.log, log: Math.log10 || function (v) { return Math.log(v) / Math.LN10; }, exp: Math.exp, abs: Math.abs };
  var WORDS = ['asin', 'acos', 'atan', 'sqrt', 'sin', 'cos', 'tan', 'exp', 'abs', 'log', 'ln', 'pi', 'x', 'e'];
  function compileFn(src) {   // safe maths parser (no eval): + − × ÷ ^, brackets, x, pi, e, sin cos tan asin acos atan sqrt ln log exp abs, 2x and 3(x+1)
    var s = String(src || '').replace(/^\s*y\s*=\s*/i, '').replace(/\s+/g, '').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/²/g, '^2').replace(/³/g, '^3').toLowerCase();
    if (!s) return null;
    var toks = [], i = 0;
    while (i < s.length) { var ch = s[i], m;
      if ((m = /^\d*\.?\d+(?:e[+-]?\d+)?/.exec(s.slice(i))) && /[\d.]/.test(ch)) { toks.push({ n: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ('+-*/^(),'.indexOf(ch) >= 0) { toks.push({ o: ch }); i++; continue; }
      var w = null; for (var j = 0; j < WORDS.length; j++) if (s.substr(i, WORDS[j].length) === WORDS[j]) { w = WORDS[j]; break; }
      if (!w) throw new Error('I don\'t understand "' + s.slice(i, i + 6) + '"');
      toks.push(FN[w] ? { f: w } : { v: w }); i += w.length; }
    var t2 = []; toks.forEach(function (t, k) { var p = t2[t2.length - 1]; if (p && (p.n != null || p.v || p.o === ')') && (t.n != null || t.v || t.f || t.o === '(')) t2.push({ o: '*' }); t2.push(t); });
    var pos = 0, peek = function () { return t2[pos]; }, eat = function (o) { if (t2[pos] && t2[pos].o === o) { pos++; return true; } return false; };
    function expr() { var a = term(); for (;;) { if (eat('+')) { var b = term(), A = a; a = (function (A, b) { return function (x) { return A(x) + b(x); }; })(A, b); } else if (eat('-')) { var b2 = term(), A2 = a; a = (function (A, b) { return function (x) { return A(x) - b(x); }; })(A2, b2); } else return a; } }
    function term() { var a = unary(); for (;;) { if (eat('*')) { var b = unary(), A = a; a = (function (A, b) { return function (x) { return A(x) * b(x); }; })(A, b); } else if (eat('/')) { var b2 = unary(), A2 = a; a = (function (A, b) { return function (x) { return A(x) / b(x); }; })(A2, b2); } else return a; } }
    function unary() { if (eat('-')) { var a = unary(); return function (x) { return -a(x); }; } if (eat('+')) return unary(); return power(); }
    function power() { var a = atom(); if (eat('^')) { var b = unary(); return function (x) { return Math.pow(a(x), b(x)); }; } return a; }
    function atom() { var t = peek(); if (!t) throw new Error('The formula ends too soon');
      if (t.n != null) { pos++; var n = t.n; return function () { return n; }; }
      if (t.v) { pos++; if (t.v === 'x') return function (x) { return x; }; var c = t.v === 'pi' ? Math.PI : Math.E; return function () { return c; }; }
      if (t.f) { pos++; var f = FN[t.f]; if (!eat('(')) { var a1 = power(); return function (x) { return f(a1(x)); }; } var a = expr(); if (!eat(')')) throw new Error('A bracket is missing'); return function (x) { return f(a(x)); }; }
      if (eat('(')) { var e = expr(); if (!eat(')')) throw new Error('A bracket is missing'); return e; }
      throw new Error('Unexpected "' + (t.o || '') + '"'); }
    var out = expr(); if (pos < t2.length) throw new Error('Unexpected "' + (t2[pos].o || '?') + '"');
    return out;
  }
  function fns(g) { if (g._fk === g.fn) return g._f; g._fk = g.fn; g._f = String(g.fn || '').split(/;|\n/).map(function (s) { s = s.trim(); if (!s) return null; try { return { src: s, f: compileFn(s) }; } catch (e) { return null; } }).filter(Boolean); return g._f; }
  function rows(g) { if (g._rk === g.data) return g._r; g._rk = g.data;
    g._r = String(g.data || '').split('\n').map(function (l) { var p = l.split(/[,;\t]/).map(function (x) { return x.trim(); }); if (p.length < 2 || p[1] === '' || isNaN(+p[1])) return null; return [p[0], +p[1]]; }).filter(Boolean); return g._r; }
  function ticks(a, b, n) { var span = b - a; if (!(span > 0)) return []; var raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag, st = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag, out = []; for (var v = Math.ceil(a / st - 1e-9) * st; v <= b + 1e-9; v += st) out.push(Math.abs(v) < st * 1e-6 ? 0 : v); return out; }
  function fmt(v) { var a = Math.abs(v); return a >= 1e4 || (a < 1e-3 && a > 0) ? v.toExponential(1) : String(Math.round(v * 1000) / 1000); }
  function drawGraph(c, g) {
    c.fillStyle = '#ffffff'; c.strokeStyle = '#cbd5e1'; c.lineWidth = 2; c.beginPath(); if (c.roundRect) c.roundRect(g.x, g.y, g.w, g.h, 14); else c.rect(g.x, g.y, g.w, g.h); c.fill(); c.stroke();
    var bar = g.kind === 'bar', data = rows(g), mt = g.title ? 52 : 24, ml = 74, mb = 64, mr = 24, px = g.x + ml, py = g.y + mt, pw = g.w - ml - mr, ph = g.h - mt - mb;
    if (pw < 40 || ph < 40) return;
    var x0 = +g.xmin, x1 = +g.xmax, y0 = +g.ymin, y1 = +g.ymax; if (!(x1 > x0)) { x0 = -10; x1 = 10; } if (!(y1 > y0)) { y0 = -10; y1 = 10; }
    if (bar) { x0 = 0; x1 = Math.max(1, data.length); }
    var X = function (v) { return px + (v - x0) / (x1 - x0) * pw; }, Y = function (v) { return py + ph - (v - y0) / (y1 - y0) * ph; };
    c.font = '500 19px ' + TYPE_FONT; c.fillStyle = '#334155'; c.lineWidth = 1; c.strokeStyle = '#e5e7eb';
    var xt = bar ? [] : ticks(x0, x1, Math.max(3, Math.round(pw / 90))), yt = ticks(y0, y1, Math.max(3, Math.round(ph / 60)));
    c.beginPath(); xt.forEach(function (v) { c.moveTo(X(v), py); c.lineTo(X(v), py + ph); }); yt.forEach(function (v) { c.moveTo(px, Y(v)); c.lineTo(px + pw, Y(v)); }); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'top'; xt.forEach(function (v) { c.fillText(fmt(v), X(v), py + ph + 8); });
    c.textAlign = 'right'; c.textBaseline = 'middle'; yt.forEach(function (v) { c.fillText(fmt(v), px - 8, Y(v)); });
    c.strokeStyle = '#0f172a'; c.lineWidth = 2.4; var ax = (!bar && x0 <= 0 && x1 >= 0) ? X(0) : px, ay = (y0 <= 0 && y1 >= 0) ? Y(0) : py + ph;
    c.beginPath(); c.moveTo(px, ay); c.lineTo(px + pw, ay); c.moveTo(ax, py); c.lineTo(ax, py + ph); c.stroke();
    c.fillStyle = '#0f172a'; c.font = '700 21px ' + TYPE_FONT; c.textAlign = 'center'; c.textBaseline = 'bottom';
    if (g.xl) c.fillText(g.xl, px + pw / 2, g.y + g.h - 8);
    if (g.yl) { c.save(); c.translate(g.x + 22, py + ph / 2); c.rotate(-Math.PI / 2); c.textBaseline = 'middle'; c.fillText(g.yl, 0, 0); c.restore(); }
    if (g.title) { c.font = '800 24px ' + TYPE_FONT; c.textBaseline = 'top'; c.fillText(g.title, g.x + g.w / 2, g.y + 14); }
    c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
    var PAL = [g.c || '#1d4ed8', '#dc2626', '#059669', '#7c3aed', '#ea580c'];
    if (bar) { var bw = pw / data.length * 0.62; data.forEach(function (r, i) { c.fillStyle = PAL[0]; var top = Y(Math.max(0, r[1])), bot = Y(Math.min(0, r[1])); c.fillRect(X(i + 0.5) - bw / 2, top, bw, Math.max(1, bot - top)); }); }
    else {
      fns(g).forEach(function (fo, k) { c.strokeStyle = PAL[k % PAL.length]; c.lineWidth = 3.2; c.beginPath(); var pen = false, prevY = null, N = Math.max(200, Math.round(pw));
        for (var i = 0; i <= N; i++) { var xv = x0 + (x1 - x0) * i / N, yv; try { yv = fo.f(xv); } catch (e) { yv = NaN; }
          if (!isFinite(yv) || (prevY != null && Math.abs(yv - prevY) > (y1 - y0))) { pen = false; prevY = isFinite(yv) ? yv : null; continue; }
          var sx = X(xv), sy = Math.max(py - ph, Math.min(py + 2 * ph, Y(yv))); if (pen) c.lineTo(sx, sy); else { c.moveTo(sx, sy); pen = true; } prevY = yv; }
        c.stroke(); });
      var pts = data.map(function (r) { return [+r[0], r[1]]; }).filter(function (r) { return isFinite(r[0]); });
      if (pts.length) { c.fillStyle = PAL[0]; c.strokeStyle = PAL[0]; c.lineWidth = 2.6;
        if (g.kind === 'line') { var srt = pts.slice().sort(function (a, b) { return a[0] - b[0]; }); c.beginPath(); srt.forEach(function (r, i) { if (i) c.lineTo(X(r[0]), Y(r[1])); else c.moveTo(X(r[0]), Y(r[1])); }); c.stroke(); }
        pts.forEach(function (r) { c.beginPath(); c.arc(X(r[0]), Y(r[1]), 6, 0, Math.PI * 2); c.fill(); }); } }
    c.restore();
    if (bar) { c.fillStyle = '#334155'; c.font = '500 18px ' + TYPE_FONT; c.textAlign = 'center'; c.textBaseline = 'top'; data.forEach(function (r, i) { c.fillText(String(r[0]).slice(0, 14), X(i + 0.5), py + ph + 8); }); }
  }
  function autoY(g) {
    var lo = Infinity, hi = -Infinity, add = function (v) { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } };
    if (g.kind === 'bar') { rows(g).forEach(function (r) { add(r[1]); }); add(0); }
    else { fns(g).forEach(function (fo) { var vals = []; for (var i = 0; i <= 200; i++) { var v; try { v = fo.f(+g.xmin + (g.xmax - g.xmin) * i / 200); } catch (e) { v = NaN; } if (isFinite(v)) vals.push(v); }
        vals.sort(function (a, b) { return a - b; }); if (vals.length) { add(vals[Math.floor(vals.length * 0.02)]); add(vals[Math.ceil(vals.length * 0.98) - 1]); } });
      rows(g).forEach(function (r) { add(r[1]); }); }
    if (!isFinite(lo)) { lo = -10; hi = 10; } if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var pad = (hi - lo) * 0.1; return [lo === 0 ? 0 : lo - pad, hi + pad];
  }
  function graphDialog(g) {
    var isNew = !g; g = g || { kind: 'fn', title: '', xl: 'x', yl: 'y', xmin: -10, xmax: 10, ymin: '', ymax: '', fn: 'x^2 - 3', data: '' };
    var m = app.querySelector('#modal');
    m.innerHTML = '<form class="wb-card" id="gf"><h3>📈 ' + (isNew ? 'Insert a graph' : 'Edit graph') + '</h3>' +
      '<label>Title (optional)</label><input name="title" maxlength="80" value="' + E(g.title) + '">' +
      '<div class="g2"><div><label>x-axis label</label><input name="xl" maxlength="40" value="' + E(g.xl) + '"></div><div><label>y-axis label</label><input name="yl" maxlength="40" value="' + E(g.yl) + '"></div></div>' +
      '<label>What to plot</label><select name="kind"><option value="fn">A function, e.g. y = x² − 3</option><option value="line">Data points joined by a line</option><option value="scatter">Data points (scatter)</option><option value="bar">Bar chart (category, value)</option></select>' +
      '<div id="gfn"><label>y = (separate several with ;)</label><input name="fn" value="' + E(g.fn) + '" placeholder="e.g. 2x + 1; sin(x); 0.5x^2 - 3"><p class="small muted" style="margin:3px 0 0">Use x, + − * / ^, brackets, sin cos tan sqrt ln log exp abs, pi.</p></div>' +
      '<div id="gdt"><label>Data: one point per line, "x, y" (or "category, value" for a bar chart)</label><textarea name="data" rows="5" placeholder="0, 1.2&#10;5, 3.4&#10;10, 6.1">' + E(g.data) + '</textarea>' + '<label style="font-weight:500"><input type="checkbox" name="both"' + (g.kind !== 'fn' && g.fn ? ' checked' : '') + ' style="width:auto"> also draw the function(s) typed above (line of best fit, model)</label></div>' +
      '<div class="g2" id="gxr"><div><label>x from</label><input name="xmin" type="number" step="any" value="' + E(g.xmin) + '"></div><div><label>x to</label><input name="xmax" type="number" step="any" value="' + E(g.xmax) + '"></div></div>' +
      '<div class="g2"><div><label>y from (blank = automatic)</label><input name="ymin" type="number" step="any" value="' + E(isNew ? '' : g.ymin) + '"></div><div><label>y to (blank = automatic)</label><input name="ymax" type="number" step="any" value="' + E(isNew ? '' : g.ymax) + '"></div></div>' +
      '<p class="err" id="gerr"></p><div class="acts"><button type="button" class="btn sm" id="gcx">Cancel</button><button class="btn main sm">' + (isNew ? 'Insert graph' : 'Update graph') + '</button></div></form>';
    m.hidden = false;
    var f = m.querySelector('#gf'), kind = f.elements.kind; kind.value = g.kind || 'fn';
    var showK = function () { var k = kind.value; m.querySelector('#gfn').style.display = k === 'fn' || (k !== 'bar' && f.elements.both.checked) ? '' : 'none'; m.querySelector('#gdt').style.display = k === 'fn' ? 'none' : ''; m.querySelector('#gxr').style.display = k === 'bar' ? 'none' : ''; };
    kind.onchange = showK; f.elements.both.onchange = showK; showK(); f.elements.title.focus();
    m.querySelector('#gcx').onclick = closeModal;
    f.onsubmit = function (e) { e.preventDefault(); var v = function (n) { return f.elements[n] ? f.elements[n].value : ''; }, err = m.querySelector('#gerr');
      var ng = { kind: v('kind'), title: v('title').trim(), xl: v('xl').trim(), yl: v('yl').trim(), xmin: parseFloat(v('xmin')), xmax: parseFloat(v('xmax')), fn: '', data: v('data').trim() };
      if (ng.kind === 'fn' || (f.elements.both && f.elements.both.checked)) ng.fn = v('fn').trim();
      if (ng.kind === 'fn') ng.data = '';
      if (ng.kind !== 'bar' && !(ng.xmax > ng.xmin)) { err.textContent = '"x to" must be bigger than "x from".'; return; }
      if (ng.kind === 'fn' && !ng.fn) { err.textContent = 'Type a function, e.g. 2x + 1.'; return; }
      var bad = String(ng.fn).split(/;|\n/).filter(function (s) { return s.trim(); }).map(function (s) { try { compileFn(s); return null; } catch (x) { return '"' + s.trim() + '": ' + x.message; } }).filter(Boolean);
      if (bad.length) { err.textContent = bad[0]; return; }
      if (ng.kind !== 'fn' && !rows(ng).length) { err.textContent = 'Add at least one data line such as "2, 5".'; return; }
      var ymin = parseFloat(v('ymin')), ymax = parseFloat(v('ymax'));
      if (isFinite(ymin) && isFinite(ymax)) { if (!(ymax > ymin)) { err.textContent = '"y to" must be bigger than "y from".'; return; } ng.ymin = ymin; ng.ymax = ymax; }
      else { var a = autoY(ng); ng.ymin = isFinite(ymin) ? ymin : a[0]; ng.ymax = isFinite(ymax) ? ymax : a[1]; if (!(ng.ymax > ng.ymin)) ng.ymax = ng.ymin + 1; }
      snap();
      if (isNew) { var c = viewCentre(); ng.id = uid(); ng.t = 'graph'; ng.w = 720; ng.h = 480; ng.x = Math.max(10, Math.min(W - 730, c[0] - 360)); ng.y = Math.max(10, Math.min(H - 490, c[1] - 240)); ng.c = page().bg === 'dark' ? '#1d4ed8' : colour(); page().items.push(ng); setTool('select'); sel = [ng.id]; }
      else { ['kind', 'title', 'xl', 'yl', 'xmin', 'xmax', 'ymin', 'ymax', 'fn', 'data'].forEach(function (k) { g[k] = ng[k]; }); }
      closeModal(); changed(); selbar(); note(isNew ? '📈 Graph added: drag to move, pull the blue dot to resize, write on it with the pen' : '📈 Graph updated'); };
  }
  function closeModal() { var m = app.querySelector('#modal'); m.hidden = true; m.innerHTML = ''; }
  function viewCentre() { var r = cv.getBoundingClientRect(); return toWorld(r.left + r.width / 2, r.top + r.height / 2); }

  // ======================= images =======================
  function addImage(file, at) {
    if (!file || !/^image\//.test(file.type)) return;
    if (file.size > 25e6) { note('That image is too large (over 25 MB)'); return; }
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var max = 1400, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), cw = Math.max(1, Math.round(im.naturalWidth * k)), ch = Math.max(1, Math.round(im.naturalHeight * k));
      var c = document.createElement('canvas'); c.width = cw; c.height = ch; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); g.drawImage(im, 0, 0, cw, ch); URL.revokeObjectURL(url);
      var src = c.toDataURL('image/jpeg', 0.84);
      var fitK = Math.min(1, 900 / cw, 560 / ch), w = cw * fitK, h = ch * fitK, p = at || viewCentre();
      snap(); var it = { id: uid(), t: 'img', src: src, x: Math.max(0, Math.min(W - w, p[0] - w / 2)), y: Math.max(0, Math.min(H - h, p[1] - h / 2)), w: w, h: h };
      page().items.push(it); setTool('select'); sel = [it.id]; changed(); selbar(); note('🖼 Image added (made smaller so the board saves quickly)'); };
    im.onerror = function () { URL.revokeObjectURL(url); note('That image could not be opened'); };
    im.src = url;
  }

  // ======================= typed text =======================
  var textBox = null;
  function typeAt(p, edit) {
    commitText();
    var pal = page().bg === 'dark' ? CHALK : COLS, fs = edit ? edit.size : SIZES.text[size], c = edit ? edit.c : pal[col], fnt = edit ? edit.font : 'type';
    var inp = document.createElement('textarea'); inp.className = 'wb-in'; inp.rows = 1; inp.spellcheck = true;
    inp.value = edit ? edit.txt : ''; inp.placeholder = 'Type; Enter = next line, Esc = done';
    stage.appendChild(inp); textBox = { el: inp, p: p, fs: fs, c: c, font: fnt, edit: edit };
    if (edit) { edit._hidden = true; render(); }
    posText(); inp.focus();
    var grow = function () { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; inp.style.width = 'auto'; inp.style.width = Math.max(140, inp.scrollWidth + 4) + 'px'; };
    inp.oninput = function () { grow(); sendLive('typing', { x: p[0], y: p[1], size: fs, c: c, txt: inp.value }); }; grow();
    inp.onkeydown = function (e) { e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey && !edit) { e.preventDefault(); commitText(); typeAt([p[0], p[1] + fs * 1.35 * Math.max(1, inp.value.split('\n').length)]); }
      else if (e.key === 'Enter' && !e.shiftKey && edit) { e.preventDefault(); commitText(); }
      if (e.key === 'Escape') { e.preventDefault(); commitText(); } };
    inp.onblur = function () { setTimeout(function () { if (textBox && textBox.el === inp) commitText(); }, 0); };
  }
  function posText() { if (!textBox) return; var b = textBox, s = toCss(b.p[0], b.p[1]), z = b.fs * base * view.z / dprNow();
    b.el.style.left = s[0] + 'px'; b.el.style.top = (s[1] - z) + 'px'; b.el.style.fontSize = z + 'px'; b.el.style.color = b.c; b.el.style.fontFamily = b.font === 'neat' ? NEAT_FONT : TYPE_FONT; b.el.style.fontWeight = b.font === 'neat' ? '400' : '600'; }
  function commitText() {
    if (!textBox) return; var b = textBox; textBox = null; var v = b.el.value.replace(/\s+$/, ''); b.el.remove();
    if (b.edit) { delete b.edit._hidden; if (v && v !== b.edit.txt) { snap(); b.edit.txt = v; if (b.edit.rec) b.edit.st = 'edited'; changed(); } else if (!v) { snap(); page().items.splice(page().items.indexOf(b.edit), 1); changed(); } else render(); return; }
    if (!v.trim()) { render(); return; }
    snap(); page().items.push({ id: uid(), t: 'text', x: r1(b.p[0]), y: r1(b.p[1]), size: b.fs, c: b.c, txt: v, font: 'type' }); changed();
  }

  // ======================= Smart Notes: recognise → check → suggest =======================
  function inkStats(it) { var q = it.pts, L = 0; for (var i = 1; i < q.length; i++) L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); var b = bbox(it); return { L: L, straight: L ? Math.hypot(q[q.length - 1][0] - q[0][0], q[q.length - 1][1] - q[0][1]) / L : 0, b: b }; }
  function busy(id) { return sugs.some(function (s) { return s.ids.indexOf(id) >= 0; }); }
  function groupLines(strokes) {   // writing lines: strokes that overlap vertically and sit close together
    var lines = [];
    strokes.slice().sort(function (a, b) { return bbox(a).x0 - bbox(b).x0; }).forEach(function (st) {
      var b = bbox(st), cyy = (b.y0 + b.y1) / 2, hit = null;
      lines.forEach(function (l) { var ov = Math.min(l.b.y1, b.y1) - Math.max(l.b.y0, b.y0), mh = Math.min(l.b.y1 - l.b.y0, b.y1 - b.y0);
        if (!hit && ((ov > 0.35 * mh) || (cyy > l.b.y0 && cyy < l.b.y1)) && b.x0 - l.b.x1 < 260) hit = l; });
      if (hit) { hit.s.push(st); hit.b = { x0: Math.min(hit.b.x0, b.x0), y0: Math.min(hit.b.y0, b.y0), x1: Math.max(hit.b.x1, b.x1), y1: Math.max(hit.b.y1, b.y1) }; }
      else lines.push({ s: [st], b: b }); });
    return lines.sort(function (a, b) { return a.b.y0 - b.b.y0; });
  }
  function writingLike(l) {   // diagrams, arrows, ticks and long rules stay as drawn
    var h = l.b.y1 - l.b.y0, w = l.b.x1 - l.b.x0;
    if (h > 230 || (w < 22 && h < 22)) return false;
    if (l.s.length === 1) { var s = inkStats(l.s[0]); if (s.straight > 0.85 && s.L > 70) return false; }
    return true;
  }
  function autoRecognise() {
    if (mode !== 'smart') return; var ids = pending; pending = [];
    var strokes = ids.map(find).filter(function (it) { return it && it.t === 'ink' && !it.hl && !it.kept && !busy(it.id); });
    if (!strokes.length) { recStatus(); return; }
    startSuggestion(groupLines(strokes).filter(writingLike), true);
  }
  function manualRecognise() {
    commitText(); clearTimeout(recT); pending = [];
    var chosen = sel.map(find).filter(function (it) { return it && it.t === 'ink' && !it.hl; });
    var strokes = chosen.length ? chosen : page().items.filter(function (it) { return it.t === 'ink' && !it.hl && !it.kept && !busy(it.id); });
    strokes = strokes.filter(function (it) { return !busy(it.id); });
    if (!strokes.length) { note('No handwriting to read here. Write with the pen, or select some handwriting first.'); return; }
    var lines = groupLines(strokes).filter(function (l) { return chosen.length || writingLike(l); });
    if (!lines.length) { note('That looks like a drawing, so it stays as ink. Select it and press Recognise to try anyway.'); return; }
    startSuggestion(lines, false);
  }
  function startSuggestion(lines, auto) {
    if (!lines.length) { recStatus(); return; }
    // one card per block of writing: lines that are close together belong to the same block
    var blocks = [], cur = null;
    lines.forEach(function (l) { if (cur && l.b.y0 - cur.bx.y1 < (l.b.y1 - l.b.y0) * 1.2 && Math.abs(l.b.x0 - cur.bx.x0) < 400) { cur.lines.push(l); cur.bx = { x0: Math.min(cur.bx.x0, l.b.x0), y0: cur.bx.y0, x1: Math.max(cur.bx.x1, l.b.x1), y1: Math.max(cur.bx.y1, l.b.y1) }; }
      else { cur = { lines: [l], bx: l.b }; blocks.push(cur); } });
    blocks.forEach(function (bk) {
      var s = { id: uid(), page: board.cur, lines: bk.lines, bx: bk.bx, ids: [], state: 'reading', auto: auto };
      bk.lines.forEach(function (l) { l.s.forEach(function (st) { s.ids.push(st.id); }); });
      sugs.push(s); drawSugs(); render(); recStatus();
      Promise.all(bk.lines.map(function (l) { return recogniseLine(l.s); })).then(function (texts) {
        s.recognised = texts.map(function (t) { return t.trim(); }).filter(Boolean).join('\n');
        if (!s.recognised) { dropSug(s); note('No words found there, so it stays as handwriting.'); markKept(s); return; }
        s.kind = classify(s.recognised);
        if (s.kind === 'equation') { s.corrected = sciFormat(s.recognised); s.state = 'ready'; s.changes = s.corrected !== s.recognised ? ['Formatted symbols, subscripts and arrows'] : []; drawSugs(); recStatus(); return; }
        s.state = 'checking'; drawSugs(); recStatus();
        return correct(s.recognised).then(function (d) { s.corrected = d.corrected; s.changes = d.changes || []; s.flag = d.flag; s.state = 'ready'; drawSugs(); recStatus(); },
          function (err) { s.corrErr = err.message || String(err); s.corrected = s.kind === 'mixed' ? sciFormat(s.recognised) : s.recognised; s.state = 'ready'; drawSugs(); recStatus(); });
      }).catch(function (err) { dropSug(s); recStatus('fail', err && err.message); note('⚠️ Handwriting recognition is unavailable (' + (err && err.message || 'no recogniser') + '). Your ink is kept.'); });
    });
  }
  function markKept(s) { s.ids.forEach(function (id) { var it = find(id); if (it) it.kept = true; }); }
  function inkFor(strokes) {
    var all = []; strokes.forEach(function (s) { all = all.concat(s.pts); });
    var x0 = Math.min.apply(0, all.map(function (q) { return q[0]; })), y0 = Math.min.apply(0, all.map(function (q) { return q[1]; })), x1 = Math.max.apply(0, all.map(function (q) { return q[0]; })), y1 = Math.max.apply(0, all.map(function (q) { return q[1]; }));
    var t0 = Math.min.apply(0, strokes.map(function (s) { return s.ts0 || 0; }));
    var ordered = strokes.slice().sort(function (a, b) { return (a.ts0 || 0) - (b.ts0 || 0); });
    return { box: { x0: x0, y0: y0, x1: x1, y1: y1 }, strokes: ordered, ink: ordered.map(function (s, i) { var off = s.ts0 ? s.ts0 - t0 : i * 600;
      return [s.pts.map(function (q) { return Math.round(q[0] - x0); }), s.pts.map(function (q) { return Math.round(q[1] - y0); }), s.pts.map(function (q, k) { return Math.round(off + (q[3] != null ? q[3] : k * 8)); })]; }) };
  }
  function recogniseLine(strokes) {
    var d = inkFor(strokes);
    return viaBrowser(d).catch(function () { return viaServer(d); });
  }
  function viaBrowser(d) {
    if (browserBad || !('createHandwritingRecognizer' in navigator)) return Promise.reject(new Error('no browser recogniser'));
    if (!browserRec) {
      var q = navigator.queryHandwritingRecognizer ? navigator.queryHandwritingRecognizer({ languages: ['en'] }) : Promise.resolve({});
      browserRec = Promise.resolve(q).then(function (ok) { if (ok === null) throw new Error('English handwriting is not supported by this browser'); return navigator.createHandwritingRecognizer({ languages: ['en'] }); });
      browserRec.catch(function () { browserBad = true; });
    }
    return browserRec.then(function (rec) {
      var dr = rec.startDrawing({ recognitionType: 'text', inputType: penSeen ? 'stylus' : 'mouse', alternatives: 3 });
      d.strokes.forEach(function (s) { var hs = new HandwritingStroke(); s.pts.forEach(function (q, k) { hs.addPoint({ x: q[0], y: q[1], t: q[3] != null ? q[3] : k * 8 }); }); dr.addStroke(hs); });
      return dr.getPrediction().then(function (pr) { if (dr.clear) dr.clear(); lastEngine = 'browser'; return pr && pr[0] ? pr[0].text : ''; });
    }).catch(function (e) { browserBad = true; throw e; });
  }
  function invokeFn(name, body) {   // the JSON answer of an Edge Function, including its error message on a failure status
    return S.db.functions.invoke(name, { body: body }).then(function (r) { var j = fnData(r); if (j) return j;
      var ctx = r.error && r.error.context; if (ctx && typeof ctx.json === 'function') return ctx.json().catch(function () { return null; }).then(function (x) { return x || { ok: false, error: 'the service did not answer' }; });
      return { ok: false, error: r.error ? 'the service did not answer' : 'no answer' }; }); }
  function viaServer(d) {
    if (!S.db || !S.db.functions) return Promise.reject(new Error('the recognition service is not reachable'));
    if (navigator.onLine === false) return Promise.reject(new Error('you are offline'));
    return invokeFn('handwriting', { ink: d.ink, width: Math.round(d.box.x1 - d.box.x0 + 20), height: Math.round(d.box.y1 - d.box.y0 + 20), language: 'en' }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'the recognition service did not answer');
      lastEngine = 'server'; return (j.candidates && j.candidates[0]) || ''; });
  }
  function correct(text) {
    if (!S.db || !S.db.functions || navigator.onLine === false) return Promise.reject(new Error('AI correction needs a connection'));
    return invokeFn('smart-correct', { text: text, subject: CNAME }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'AI correction is unavailable right now');
      return j; });
  }
  // equations and formulae are tidied, never re-worded
  var CHEM = /^\(?\d*(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+(?:\^?\d*[+\-−])?\)?$/;
  function classify(t) {
    var toks = t.split(/\s+/).filter(Boolean), mathy = 0;
    toks.forEach(function (w) { if (/[=→⇌⟶^√∫Σ±≤≥×÷<>]|->|<-/.test(w) || /^[+\-*/]$/.test(w) || /^-?\d+(\.\d+)?[a-z]?$/i.test(w) || (CHEM.test(w) && /\d|[A-Z].*[A-Z]/.test(w) && w.length <= 14 && !/^[A-Z]+$/.test(w)) || /^[a-z]\^?\d$|^[a-z][+\-*/][a-z0-9]/.test(w)) mathy++; });
    if (!toks.length) return 'prose';
    if (mathy / toks.length >= 0.5 && toks.length <= 25) return 'equation';
    return mathy ? 'mixed' : 'prose';
  }
  var SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' }, SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻' };
  function sciFormat(t) {
    var s = t.replace(/<=>|<->/g, '⇌').replace(/-->|->|=>/g, '→').replace(/<-/g, '←').replace(/\+\/-/g, '±').replace(/>=/g, '≥').replace(/<=/g, '≤').replace(/\bsqrt\b/g, '√');
    s = s.split(/(\s+)/).map(function (w) {
      var bare = w.replace(/[,.;]$/, '');
      if (!(/\d/.test(bare) || /[A-Za-z)][+\-−]$/.test(bare)) || !/[A-Z]/.test(bare) || !CHEM.test(bare) || /^[\d.]+$/.test(bare)) return w;
      var m = /^(\(?)(\d*)(.*?)([,.;]?)$/.exec(w), coef = m[2], body = m[3], charge = '';
      body = body.replace(/([A-Za-z])0(?=\d|$|[A-Z(+\-−^])/g, '$1O').replace(/^H20$/, 'H2O').replace(/H20(?=[A-Z(]|$)/g, 'H2O');   // a recogniser's 0 straight after a letter is an O (CO2, H2O)
      var cm = /\^?(\d*[+\-−])$/.exec(body); if (cm && /[A-Za-z)]\^?\d*[+\-−]$/.test(body)) { charge = cm[1]; body = body.slice(0, body.length - cm[0].length); }
      body = body.replace(/([A-Za-z)])(\d+)/g, function (x, a, n) { return a + n.split('').map(function (ch) { return SUB[ch]; }).join(''); });
      return m[1] + coef + body + charge.split('').map(function (ch) { return SUP[ch] || ch; }).join('') + m[4];
    }).join('');
    return s.replace(/\^\(?(-?\d+)\)?/g, function (m, n) { return n.split('').map(function (ch) { return SUP[ch] || ch; }).join(''); });
  }
  function dropSug(s) { sugs = sugs.filter(function (x) { return x !== s; }); drawSugs(); render(); }
  function drawSugs() {
    var box = app.querySelector('#sugs'); if (!box) return;
    var mine = sugs.filter(function (s) { return s.page === board.cur; });
    box.innerHTML = mine.map(function (s) {
      var kd = s.kind === 'equation' ? '<span class="kd eq">Equation · not re-worded</span>' : s.kind === 'mixed' ? '<span class="kd">Text + formulae</span>' : s.kind ? '<span class="kd">Text</span>' : '';
      if (s.state === 'reading') return '<div class="wb-sug" data-g="' + s.id + '"><div class="sh"><b>✍️ Reading handwriting…</b></div><p class="small muted" style="margin:0">Keep writing: this runs in the background.</p></div>';
      var ready = s.state === 'ready', same = ready && s.corrected === s.recognised;
      return '<div class="wb-sug" data-g="' + s.id + '"><div class="sh"><b>✍️ Handwriting → text</b>' + kd + '<button type="button" class="k" data-x="no" title="Keep handwriting" aria-label="Close" style="--k:#64748b;min-height:28px;min-width:28px;padding:2px 6px">✕</button></div>' +
        '<div class="cols"><div><label>Recognised</label><div class="rec">' + E(s.recognised) + '</div></div><div><label>' + (s.kind === 'equation' ? 'Formatted' : 'Corrected') + ' · you can edit</label>' +
        (ready ? '<textarea data-x="txt" rows="' + Math.min(6, s.corrected.split('\n').length + 1) + '" aria-label="Suggested text">' + E(s.corrected) + '</textarea>' : '<div class="rec muted">Checking spelling and grammar…</div>') + '</div></div>' +
        (ready && s.changes && s.changes.length && !same ? '<ul>' + s.changes.map(function (c) { return '<li>' + E(c) + '</li>'; }).join('') + '</ul>' : '') +
        (ready && same && !s.corrErr ? '<p class="small muted" style="margin:6px 0 0">No corrections needed.</p>' : '') +
        (s.flag ? '<div class="fl">⚠️ ' + E(s.flag) + '</div>' : '') + (s.corrErr ? '<div class="er">' + E(s.corrErr) + ' You can still accept or edit the recognised text.</div>' : '') +
        '<div class="acts">' + (ready ? '<button type="button" class="yes" data-x="ok">✔ Accept</button>' : '') + '<button type="button" data-x="raw">Use as recognised</button><button type="button" class="no" data-x="no">✖ Keep handwriting</button></div></div>';
    }).join('');
    box.querySelectorAll('[data-g]').forEach(function (el) { var s = sugs.filter(function (x) { return x.id === el.getAttribute('data-g'); })[0]; if (!s) return;
      el.onmouseenter = function () { s.focus = true; render(); }; el.onmouseleave = function () { s.focus = false; render(); };
      el.querySelectorAll('[data-x]').forEach(function (b) { var a = b.getAttribute('data-x'); if (a === 'txt') { b.onkeydown = function (e) { e.stopPropagation(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) acceptSug(s, b.value); }; return; }
        b.onclick = function () { if (a === 'ok') acceptSug(s, el.querySelector('[data-x=txt]').value); if (a === 'raw') acceptSug(s, s.recognised, true); if (a === 'no') { markKept(s); dropSug(s); changed(); note('Kept as handwriting'); } }; }); });
  }
  function acceptSug(s, text, raw) {
    text = String(text || '').replace(/\s+$/, ''); if (!text.trim()) { note('The text is empty'); return; }
    var its = page().items, strokes = s.ids.map(find);
    if (s.page !== board.cur || strokes.some(function (x) { return !x; })) { dropSug(s); note('That handwriting changed, so nothing was replaced'); return; }
    snap();
    var at = Math.min.apply(0, strokes.map(function (x) { return its.indexOf(x); }));
    strokes.forEach(function (x) { its.splice(its.indexOf(x), 1); });
    var hs = s.lines.map(function (l) { return l.b.y1 - l.b.y0; }).sort(function (a, b) { return a - b; }), lh = hs[Math.floor(hs.length / 2)];
    var nl = text.split('\n').length, fs = Math.max(22, Math.min(110, Math.min(lh * 0.82, (s.bx.y1 - s.bx.y0) / Math.max(1, nl) * 0.9)));
    var t = { id: uid(), t: 'text', x: r1(s.bx.x0), y: r1(s.lines[0].b.y0 + fs * 0.95), size: Math.round(fs), c: strokes[0].c, txt: text, font: 'neat',
      ink: strokes.map(function (x) { var c = JSON.parse(JSON.stringify(x, rep)); delete c.kept; return c; }), rec: s.recognised, ai: s.corrected && s.corrected !== s.recognised ? s.corrected : null,
      st: raw ? 'recognised' : text === s.corrected ? (s.corrected === s.recognised ? 'recognised' : (s.kind === 'equation' ? 'formatted' : 'corrected')) : 'edited' };
    its.splice(Math.max(0, at), 0, t);
    dropSug(s); changed(); note('✨ Neat text added. 👁 Handwriting or ↩ Handwriting brings your strokes back.');
  }
  function restoreInk(t) { var its = page().items, i = its.indexOf(t); if (i < 0 || !t.ink) return; snap(); its.splice.apply(its, [i, 1].concat(t.ink.map(function (s) { s.kept = true; s.id = s.id || uid(); return s; }))); sel = []; selbar(); changed(); note('↩ Your handwriting is back'); }
  function recStatus(kind, msg) {
    var el = app.querySelector('#rst'); if (!el) return;
    var reading = sugs.filter(function (s) { return s.state === 'reading'; }).length, checking = sugs.filter(function (s) { return s.state === 'checking'; }).length, ready = sugs.filter(function (s) { return s.state === 'ready'; }).length;
    var eng = lastEngine === 'browser' ? ' · browser' : lastEngine === 'server' ? ' · server' : '';
    if (kind === 'fail') { el.className = 'pill bad'; el.textContent = '⚠️ Recognition unavailable'; el.title = msg || ''; return; }
    if (reading) { el.className = 'pill busy'; el.textContent = '✍️ Reading…'; }
    else if (checking) { el.className = 'pill busy'; el.textContent = '✨ Checking…'; }
    else if (ready) { el.className = 'pill warn'; el.textContent = '💡 ' + ready + ' suggestion' + (ready > 1 ? 's' : ''); }
    else if (kind === 'wait' && mode === 'smart') { el.className = 'pill'; el.textContent = '✍️ Waiting for a pause…'; }
    else { el.className = 'pill' + (mode === 'smart' ? ' ok' : ''); el.textContent = mode === 'smart' ? '✨ Smart Notes on' + eng : '✏️ Freehand'; }
    el.title = 'Handwriting recognition' + (lastEngine ? ': last read by the ' + (lastEngine === 'browser' ? 'browser\'s own recogniser' : 'Learnova server') : '');
  }

  // ======================= undo / redo =======================
  function snap() { undo.push(JSON.stringify(page(), rep)); if (undo.length > 40) undo.shift(); redo = []; }
  function doUndo() { commitText(); if (!undo.length) { note('Nothing to undo'); return; } redo.push(JSON.stringify(page(), rep)); board.pages[board.cur] = JSON.parse(undo.pop()); afterHistory(); }
  function doRedo() { commitText(); if (!redo.length) { note('Nothing to redo'); return; } undo.push(JSON.stringify(page(), rep)); board.pages[board.cur] = JSON.parse(redo.pop()); afterHistory(); }
  function afterHistory() { pending = []; sel = sel.filter(find); selbar(); swatches(); sugs = sugs.filter(function (s) { return s.page !== board.cur || s.ids.every(find); }); drawSugs(); changed(); }

  // ======================= saving: this device at once, Supabase after a pause =======================
  function KEY() { return 'bv-wb2-' + me.user.id + (CLS ? '-' + CLS : ''); }
  function changed() { render(); if (readOnly) return; dirty[board.cur] = true; scheduleSave(); sendLive('page'); }
  function scheduleSave(ms) { setStatus('pending'); writeLocalSoon(); clearTimeout(cloudT); cloudT = setTimeout(saveCloud, ms == null ? 2500 : ms); }
  function writeLocalSoon() { clearTimeout(localT); localT = setTimeout(writeLocal, 400); }
  function needsSync() { return Object.keys(dirty).length > 0 || metaDirty || pagesShrunk || (!board.id && !emptyBoard()); }
  function emptyBoard() { return board.pages.every(function (p) { return !p.items.length; }) && board.pages.length === 1; }
  function writeLocal() {
    if (!me || readOnly || !board) return;
    try { localStorage.setItem(KEY(), JSON.stringify({ board: board, dirty: needsSync(), savedAt: Date.now() }, rep)); writeLocal.err = null; }
    catch (e) { writeLocal.err = e; setStatus('localfull'); }
  }
  function readLocal() {
    try { var j = JSON.parse(localStorage.getItem(KEY()) || 'null'); if (j && j.board && j.board.pages && j.board.pages.length) return j;
      var old = JSON.parse(localStorage.getItem('bv-board-' + me.user.id + (CLS ? '-' + CLS : '')) || 'null');   // boards from the first whiteboard
      if (old && old.pages && old.pages.length && old.pages.some(function (p) { return p.items && p.items.length; })) { var b = newBoard(); b.pages = old.pages; return { board: b, dirty: true, savedAt: 0 }; }
    } catch (e) {}
    return null;
  }
  function normalise() {
    board.pages = (board.pages || []).filter(Boolean); if (!board.pages.length) board.pages = [{ bg: 'white', items: [] }];
    board.cur = Math.max(0, Math.min(board.cur || 0, board.pages.length - 1));
    board.pages.forEach(function (p) { p.bg = p.bg || 'white'; p.items = (p.items || []).map(function (it) {
      if (!it || !it.t) return null; it.id = it.id || uid();
      if (it.t === 'circle') return { id: it.id, t: 'shape', k: 'ellipse', c: it.c, w: it.w, x1: it.cx - it.r, y1: it.cy - it.r, x2: it.cx + it.r, y2: it.cy + it.r };
      if (it.t === 'rect') return { id: it.id, t: 'shape', k: 'rect', c: it.c, w: it.w, x1: it.x, y1: it.y, x2: it.x + it.w2, y2: it.y + it.h2 };
      if (it.t === 'ink' && it.shape === 'line' && it.pts.length === 2) return { id: it.id, t: 'shape', k: 'line', c: it.c, w: it.w, x1: it.pts[0][0], y1: it.pts[0][1], x2: it.pts[1][0], y2: it.pts[1][1] };
      return it; }).filter(Boolean); });
  }
  function pageRow(i) {
    var pg = board.pages[i], recog = [], corr = [];
    pg.items.forEach(function (it) { if (it.t === 'text' && it.rec) { recog.push({ id: it.id, text: it.rec }); corr.push({ id: it.id, text: it.txt, ai: it.ai || null, status: it.st || 'recognised' }); } });
    return { board_id: board.id, page_no: i + 1, data: JSON.parse(JSON.stringify(pg, rep)), thumb: thumb(pg), recognised: recog, corrected: corr };
  }
  function thumb(pg) { try { var c = document.createElement('canvas'); c.width = 320; c.height = 180; var g = c.getContext('2d'); g.scale(0.2, 0.2); paintPage(g, pg, false); return c.toDataURL('image/jpeg', 0.62); } catch (e) { return null; } }
  function probeCloud() {
    if (!S.db || !S.db.from) { cloud = 'off'; setStatus(); return Promise.resolve(); }
    return Promise.resolve(S.db.from('whiteboards').select('id').limit(1)).then(function (r) {
      if (r && r.error) { var m = (r.error.message || '') + ' ' + (r.error.code || ''); cloud = /42P01|PGRST20[25]|does not exist|schema cache|relation/i.test(m) ? 'setup' : 'off'; } else cloud = 'ok';
      setStatus(); syncShareBox(); }, function () { cloud = 'off'; setStatus(); });
  }
  function syncShareBox() { var sh = app.querySelector('#shr'); if (sh) { sh.disabled = cloud !== 'ok'; sh.parentNode.title = cloud === 'ok' ? 'Students in this class can open the board, view only' : 'Sharing starts once boards are saved to your account'; } }
  function saveCloud() {
    clearTimeout(cloudT); if (readOnly) return Promise.resolve();
    if (cloud !== 'ok') { setStatus(); return Promise.resolve(); }
    if (saving) { cloudAgain = true; return Promise.resolve(); }
    if (!needsSync()) { setStatus('saved'); return Promise.resolve(); }
    if (!board.id && emptyBoard()) { setStatus('saved'); return Promise.resolve(); }
    saving = true; setStatus('saving');
    var todo = Object.keys(dirty).map(Number).filter(function (i) { return i < board.pages.length; }), shrunk = pagesShrunk, meta = metaDirty;
    dirty = {}; pagesShrunk = false; metaDirty = false;
    var p = Promise.resolve();
    if (!board.id) p = S.db.from('whiteboards').insert({ owner_id: me.user.id, class_id: board.cls || null, title: board.title, shared: !!board.shared }).select('id').single().then(chk).then(function (r) { board.id = r.data.id; todo = board.pages.map(function (x, i) { return i; }); });
    else if (meta) p = S.db.from('whiteboards').update({ title: board.title, shared: !!board.shared }).eq('id', board.id).then(chk);
    p = p.then(function () { if (!todo.length) return; return S.db.from('whiteboard_pages').upsert(todo.map(pageRow), { onConflict: 'board_id,page_no' }).then(chk); })
      .then(function () { if (shrunk) return S.db.from('whiteboard_pages').delete().eq('board_id', board.id).gt('page_no', board.pages.length).then(chk); });
    return p.then(function () { saving = false; writeLocal(); setStatus('saved'); if (cloudAgain || needsSync()) { cloudAgain = false; if (needsSync()) scheduleSave(800); } },
      function (e) { saving = false; todo.forEach(function (i) { dirty[i] = true; }); if (shrunk) pagesShrunk = true; if (meta) metaDirty = true; writeLocal();
        var msg = S.nice(e); setStatus(navigator.onLine === false || /fetch|network|timeout|load failed/i.test(msg) ? 'offline' : 'error', msg);
        clearTimeout(retryT); retryT = setTimeout(saveCloud, 20000); });
  }
  function setStatus(kind, detail) {
    var el = app.querySelector('#sst'); if (!el) return; var t, c = 'pill', tip = '';
    if (writeLocal.err && kind !== 'saving') { el.className = 'pill bad'; el.textContent = '⚠️ Device storage full'; el.title = 'This browser could not keep a copy. Remove large images.'; return; }
    if (!kind) kind = needsSync() ? 'pending' : 'saved';
    if (kind === 'saving') { t = '⏳ Saving…'; c += ' busy'; }
    else if (kind === 'pending') { t = cloud === 'ok' ? '✏️ Unsaved changes' : '💾 Saved on this device'; c += cloud === 'ok' ? '' : ' ok'; }
    else if (kind === 'offline') { t = '📴 Offline · kept on this device'; c += ' warn'; tip = 'It will save to your account when the connection is back.'; }
    else if (kind === 'error') { t = '⚠️ Not saved to account'; c += ' bad'; tip = (detail || '') + ' Your work is kept on this device; retrying.'; }
    else if (kind === 'localfull') { t = '⚠️ Device storage full'; c += ' bad'; }
    else if (cloud === 'ok') { t = '☁️ Saved'; c += ' ok'; tip = 'Saved to your account ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    else if (cloud === 'setup') { t = '💾 Saved on this device'; c += ' ok'; tip = 'Saving boards to your account starts once the database update (027) has been run.'; }
    else if (cloud === 'off') { t = '📴 Saved on this device'; c += ' warn'; tip = 'Your account could not be reached; it will sync when it can.'; }
    else { t = '💾 Saved on this device'; c += ' ok'; }
    el.className = c; el.textContent = t; el.title = tip;
  }
  function startTeacher() {
    var loc = readLocal();
    if (loc && loc.board) { board = loc.board; board.cls = board.cls === undefined ? CLS : board.cls; normalise(); if (loc.dirty) board.pages.forEach(function (x, i) { dirty[i] = true; }); }
    build('teacher');
    probeCloud().then(function () {
      if (cloud !== 'ok') { if (loc && loc.dirty && loc.board.pages.some(function (p) { return p.items.length; })) note('Your board was kept on this device'); return; }
      if (loc && loc.dirty && !emptyBoard()) { note('↺ Recovered your unsaved work; saving it to your account'); scheduleSave(600); return; }
      return listBoards().then(function (rs) {
        if (loc && loc.board.id) { var r = rs.filter(function (x) { return x.id === loc.board.id; })[0]; if (r && new Date(r.updated_at).getTime() > (loc.savedAt || 0) + 1000) return loadBoard(r.id, true); if (r) return; }
        if (rs[0] && emptyBoard()) return loadBoard(rs[0].id, true);
      });
    });
  }
  function listBoards() {
    var q = S.db.from('whiteboards').select('id,title,class_id,shared,updated_at,created_at').eq('owner_id', me.user.id);
    q = CLS ? q.eq('class_id', CLS) : q.is('class_id', null);
    return Promise.resolve(q.order('updated_at', { ascending: false }).limit(60)).then(function (r) { boards = (r && r.data) || []; return boards; }, function () { return []; });
  }
  function fetchBoard(id) {
    return Promise.all([S.db.from('whiteboards').select('id,title,class_id,shared,owner_id,updated_at').eq('id', id).maybeSingle(), S.db.from('whiteboard_pages').select('page_no,data').eq('board_id', id).order('page_no', { ascending: true })])
      .then(function (rs) { chk(rs[0]); chk(rs[1]); if (!rs[0].data) throw new Error('This board was not found, or it is not shared with you.');
        var b = rs[0].data; return { id: b.id, owner: b.owner_id, title: b.title, cls: b.class_id, shared: b.shared, cur: 0, pages: (rs[1].data || []).map(function (p) { return p.data; }) }; });
  }
  function loadBoard(id, quiet) {
    if (!quiet) setStatus('saving');
    return fetchBoard(id).then(function (b) { delete b.owner; board = b; normalise(); dirty = {}; metaDirty = false; pagesShrunk = false; undo = []; redo = []; sel = []; sugs = []; pending = []; view = { z: 1, x: 0, y: 0 };
      var t = app.querySelector('#wbt'); if (t) t.value = board.title; var sh = app.querySelector('#shr'); if (sh) sh.checked = !!board.shared;
      writeLocal(); swatches(); drawSugs(); selbar(); pagesBar(); fit(); setStatus('saved'); sendLive('page'); if (!quiet) note('📂 Opened "' + board.title + '"'); })
      .catch(function (e) { setStatus('error', S.nice(e)); note('Could not open that board: ' + S.nice(e)); });
  }
  function boardsPanel() {
    var box = app.querySelector('#bdbox');
    if (box.innerHTML) { box.innerHTML = ''; return; }
    if (cloud !== 'ok') { box.innerHTML = '<div class="panel tint"><b>📂 My boards</b><p class="small">' + (cloud === 'setup' ? 'Saving boards to your account starts once the database update has been run. Until then this board is kept on this device.' : 'Your account cannot be reached right now. This board is kept on this device.') + '</p></div>'; return; }
    box.innerHTML = '<div class="panel tint"><p class="small muted">Loading your boards…</p></div>';
    saveCloud().then(listBoards).then(function (rs) {
      box.innerHTML = '<div class="panel tint"><div class="row2"><b>📂 My boards' + (CNAME ? ' for ' + E(CNAME) : '') + '</b><button class="btn main sm" type="button" id="bnew">＋ New board</button></div><div class="wb-boards" style="margin-top:8px">' +
        (rs.length ? rs.map(function (r) { return '<div class="brow"><b>' + E(r.title) + (r.id === board.id ? ' <span class="pill ok">open</span>' : '') + '</b>' + (r.shared ? '<span class="pill ok">🔗 shared with class</span>' : '<span class="pill">🔒 private</span>') + '<span class="small muted">' + E(new Date(r.updated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })) + '</span>' +
          (r.id === board.id ? '' : '<button class="btn sm" type="button" data-open="' + r.id + '">Open</button>') + '<button class="btn sm" type="button" data-del="' + r.id + '" style="color:#b91c1c">Delete</button></div>'; }).join('') : '<p class="small muted">No saved boards yet. This board is saved automatically once you write on it.</p>') + '</div></div>';
      box.querySelector('#bnew').onclick = function () { saveCloud().then(function () { board = newBoard(); normalise(); dirty = {}; metaDirty = false; pagesShrunk = false; undo = []; redo = []; sel = []; sugs = []; view = { z: 1, x: 0, y: 0 };
        app.querySelector('#wbt').value = board.title; var sh = app.querySelector('#shr'); if (sh) sh.checked = false; writeLocal(); swatches(); drawSugs(); selbar(); pagesBar(); render(); box.innerHTML = ''; setStatus(); note('＋ New board'); }); };
      box.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { saveCloud().then(function () { loadBoard(b.getAttribute('data-open')); box.innerHTML = ''; }); }; });
      box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Delete for good?'; return; }
        var id = b.getAttribute('data-del'); S.db.from('whiteboards').delete().eq('id', id).then(chk).then(function () { if (id === board.id) { board.id = null; board.shared = false; board.pages.forEach(function (x, i) { dirty[i] = true; }); writeLocal(); }
          box.innerHTML = ''; boardsPanel(); note('Board deleted'); }, function (e) { note('Could not delete: ' + S.nice(e)); }); }; });
    });
  }

  // ======================= export =======================
  function pageCanvas(pg, k) { var c = document.createElement('canvas'); c.width = W * k; c.height = H * k; var g = c.getContext('2d'); g.scale(k, k); paintPage(g, pg, false); return c; }
  function fileName(ext, n) { return (board.title || 'board').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) + (n ? '-page-' + n : '') + '.' + ext; }
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function exportPNG() { commitText(); var pg = page(); loadImgs(pg).then(function () { pageCanvas(pg, 2).toBlob(function (b) { save(b, fileName('png', board.cur + 1)); note('🖼 Page ' + (board.cur + 1) + ' downloaded'); }, 'image/png'); }); }
  function jspdf() { if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF); return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload = function () { window.jspdf ? res(window.jspdf.jsPDF) : rej(new Error('PDF maker did not load')); }; s.onerror = function () { rej(new Error('PDF maker could not be downloaded')); }; document.head.appendChild(s); }); }
  function exportPDF() {
    commitText(); note('📄 Making the PDF…');
    Promise.all([jspdf()].concat(board.pages.map(loadImgs))).then(function (r) { var J = r[0], doc = new J({ orientation: 'landscape', unit: 'pt', format: [W / 2, H / 2] });
      board.pages.forEach(function (pg, i) { if (i) doc.addPage([W / 2, H / 2], 'landscape'); doc.addImage(pageCanvas(pg, 1.6).toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, W / 2, H / 2); });
      doc.save(fileName('pdf')); note('📄 PDF downloaded (' + board.pages.length + ' page' + (board.pages.length > 1 ? 's' : '') + ')'); })
      .catch(function (e) { note('⚠️ ' + e.message + '. Use 🖼 PNG instead.'); });
  }
  function full() { if (document.fullscreenElement) { document.exitFullscreen(); return; } if (wrap.requestFullscreen) wrap.requestFullscreen().catch(function () { wrap.classList.toggle('full'); setTimeout(fit, 80); }); else { wrap.classList.toggle('full'); setTimeout(fit, 80); } }

  // ======================= live sharing =======================
  // Two ways to watch: the whole class (students press 🖊 Whiteboard on their dashboard; no code) and a 6-letter code.
  function livePage() { var total = 0; return { bg: page().bg, items: JSON.parse(JSON.stringify(page().items, rep)).map(function (it) { if (it.t === 'img') { total += it.src.length; if (total > 400000) it.src = null; } if (it.t === 'text') delete it.ink; return it; }) }; }
  function hasLive() { return Object.keys(chans).length > 0; }
  function sendAll(ev, payload) { Object.keys(chans).forEach(function (k) { try { chans[k].send({ type: 'broadcast', event: ev, payload: payload }); } catch (e) {} }); }
  function sendLive(kind, d) {
    if (readOnly || !hasLive()) return;
    if (kind === 'page') { clearTimeout(liveT); liveT = setTimeout(function () { sendAll('page', { page: livePage(), n: board.cur + 1, of: board.pages.length, title: board.title, cls: CNAME }); }, 150); return; }
    var now = Date.now(); if (now - (sendLive.t || 0) < 60) return; sendLive.t = now;
    var p = kind === 'ghost' ? JSON.parse(JSON.stringify(d, rep)) : d; if (p.pts) p.pts = p.pts.map(function (q) { return [Math.round(q[0]), Math.round(q[1]), q[2]]; });
    sendAll(kind, p);
  }
  function openChan(key, name) {
    var c = S.db.channel(name, { config: { broadcast: { self: false } } }); chans[key] = c;
    c.on('broadcast', { event: 'hello' }, function () { sendLive('page'); }).subscribe(function (st2) { if (st2 === 'SUBSCRIBED') sendLive('page'); });
  }
  function closeChan(key) { var c = chans[key]; if (!c) return; delete chans[key]; try { c.send({ type: 'broadcast', event: 'end', payload: {} }); } catch (e) {} setTimeout(function () { try { S.db.removeChannel(c); } catch (e) {} }, 400); }
  function classLive(on) {
    var btn = app.querySelector('[data-a=clive]'); if (!board.cls || !S.db.channel) { if (btn) btn.hidden = true; return; }
    if (on) openChan('class', 'board-class-' + board.cls); else closeChan('class');
    if (btn) { btn.setAttribute('aria-pressed', !!on); btn.innerHTML = on ? '🟢<span class="lbl"> Live to class</span>' : '⚪<span class="lbl"> Not live</span>'; btn.title = on ? 'Students in this class see your board live from their dashboard (🖊 Whiteboard). Press to stop.' : 'Press to let this class watch your board live again'; }
  }
  function shareLive() {
    var box = app.querySelector('#livebox'), btn = app.querySelector('[data-a=live]');
    if (chans.code) { closeChan('code'); room = null; box.innerHTML = ''; btn.setAttribute('aria-pressed', false); note('Live code stopped'); return; }
    if (!S.db.channel) { note('Live sharing is not available here'); return; }
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint8Array(6); crypto.getRandomValues(b); room = Array.prototype.map.call(b, function (x) { return a[x % a.length]; }).join('');
    openChan('code', 'board-' + room);
    var url = location.origin + '/board/?live=' + room;
    btn.setAttribute('aria-pressed', true);
    box.innerHTML = '<div class="panel tint wb-live"><b>📡 Live code.</b> Anyone with the code can watch, also people outside this class: open <a href="' + E(url) + '" target="_blank" rel="noopener">' + E(url.replace(/^https?:\/\//, '')) + '</a> or type <code>' + room + '</code> on <b>' + E(location.host) + '/board/</b>. Press 📡 again to stop.<button type="button" class="btn sm" id="cpl">Copy link</button></div>';
    box.querySelector('#cpl').onclick = function () { try { navigator.clipboard.writeText(url); note('Link copied'); } catch (e) {} };
  }

  // ======================= students and view-only boards =======================
  function joinForm() { return '<section class="panel"><h2>📡 Have a code?</h2><p class="small">If your teacher shows a 6-letter code, type it here.</p><form id="jc" class="row2" style="justify-content:flex-start;gap:8px"><input id="jcv" maxlength="6" placeholder="e.g. K7QPZ3" style="text-transform:uppercase;font-size:1.3rem;letter-spacing:.15em;max-width:200px" required aria-label="Board code"><button class="btn main">Join</button></form></section>'; }
  function sharedList() { return '<section class="panel"><h2>🔗 Boards shared with your class</h2><div id="shl" class="wb-boards"><p class="small muted">Loading…</p></div></section>'; }
  function loadShared() {
    var el = app.querySelector('#shl'); if (!el) return;
    var q = S.db.from('whiteboards').select('id,title,class_id,updated_at').eq('shared', true); if (CLS) q = q.eq('class_id', CLS);
    Promise.resolve(q.order('updated_at', { ascending: false }).limit(40)).then(function (r) { var rs = (r && !r.error && r.data) || [];
      el.innerHTML = rs.length ? rs.map(function (b) { return '<div class="brow"><b>' + E(b.title) + '</b><span class="small muted">' + E(new Date(b.updated_at).toLocaleDateString([], { dateStyle: 'medium' })) + '</span><a class="btn sm" href="/board/?b=' + b.id + '">Open</a></div>'; }).join('') : '<p class="small muted">Your teachers have not shared any saved boards yet.</p>'; });
  }
  function studentHome() {
    css();
    var mine = (me.classes || []).filter(function (c) { return c && c.id && (!CLS || c.id === CLS); });
    app.innerHTML = '<div class="row2 cband" style="--k:#0d9488"><div><p class="label">Class whiteboard</p><h2 style="margin:0">🖊 Your teacher\'s board, live</h2><p class="small" id="wst">' +
      (mine.length ? '⏳ Waiting for your teacher to start writing' + (mine.length === 1 ? ' in <b>' + E(mine[0].name) + '</b>' : '') + '. Keep this page open: the board appears by itself as soon as they start.' : 'Join a class first; then your teacher\'s board appears here when they write.') +
      '</p></div><div class="cta"><a class="btn sm" href="/dashboard/">← My dashboard</a></div></div>' + joinForm() + sharedList();
    app.querySelector('#jc').onsubmit = function (e) { e.preventDefault(); location.href = '/board/?live=' + encodeURIComponent(app.querySelector('#jcv').value.trim().toUpperCase()); };
    loadShared();
    if (!S.db.channel) return;
    var subs = [];
    mine.forEach(function (c) {
      var ch = S.db.channel('board-class-' + c.id, { config: { broadcast: { self: false } } }); subs.push(ch);
      watch(ch, function () { subs.forEach(function (x) { if (x !== ch) try { S.db.removeChannel(x); } catch (e) {} }); liveName = c.name; readOnly = true; board = newBoard(); build('live'); app.insertAdjacentHTML('beforeend', '<p class="small muted" style="margin-top:8px">You are watching live. You can go full screen; you cannot write on your teacher\'s board. <a href="/board/">Saved boards</a></p>'); });
      ch.subscribe(function (st2) { if (st2 === 'SUBSCRIBED') ch.send({ type: 'broadcast', event: 'hello', payload: {} }); });
    });
  }
  var liveName = '', watching = null;
  function watch(ch, onStart) {   // show the teacher's page, their pen as it moves, and what they type
    var vs = function (t) { var el = app.querySelector('#vst'); if (el) el.textContent = t; };
    var on = function () { if (watching && watching !== ch) return false; if (!watching) { watching = ch; if (onStart) onStart(); } return true; };
    ch.on('broadcast', { event: 'page' }, function (m) { if (!on()) return; board.pages[0] = m.payload.page; normalise(); ghost = null; vs('🟢 Live' + (m.payload.title ? ' · ' + m.payload.title : '') + ' · page ' + m.payload.n + ' of ' + m.payload.of); render(); })
      .on('broadcast', { event: 'ghost' }, function (m) { if (watching !== ch) return; ghost = m.payload; render(); })
      .on('broadcast', { event: 'ink' }, function (m) { if (watching !== ch) return; ghost = m.payload; render(); })
      .on('broadcast', { event: 'typing' }, function (m) { if (watching !== ch) return; var t = m.payload; ghost = { t: 'text', x: t.x, y: t.y, size: t.size, c: t.c, txt: t.txt || ' ', font: 'type' }; render(); })
      .on('broadcast', { event: 'end' }, function () { if (watching !== ch) return; ghost = null; render(); vs('⏸ Your teacher stopped sharing. The last page stays here and updates if they start again.'); });
  }
  function openBoardLink(id) {
    css(); app.innerHTML = '<p class="small muted">Opening the board…</p>';
    fetchBoard(id).then(function (b) {
      if (b.owner === me.user.id && isTeacher(me)) { delete b.owner; board = b; normalise(); build('teacher'); probeCloud(); writeLocal(); return; }
      readOnly = true; delete b.owner; board = b; normalise(); build('view'); render();
    }).catch(function (e) { app.innerHTML = '<section class="panel"><h2>Whiteboard</h2><p>' + E(S.nice(e)) + '</p><a class="btn sm" href="/board/">← Back</a></section>'; });
  }
  function viewer() {
    if (!/^[A-Z0-9]{6}$/.test(live)) { app.innerHTML = '<section class="panel"><h2>Live board</h2><p>That board code does not look right. Ask your teacher for the link.</p></section>'; return; }
    readOnly = true; board = newBoard();
    build('live');
    var ch = S.db.channel('board-' + live, { config: { broadcast: { self: false } } });
    watch(ch, null);
    ch.subscribe(function (s2) { if (s2 === 'SUBSCRIBED') { var el = app.querySelector('#vst'); if (el && !watching) el.textContent = 'Waiting for your teacher…'; ch.send({ type: 'broadcast', event: 'hello', payload: {} }); } });
  }
})();
