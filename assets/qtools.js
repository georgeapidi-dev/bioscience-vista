/* Learnova question tools · tables in questions, answer styles (drop-down, draw a graph, draw a diagram, label a picture) · by Learnova */
(function () {
  var T = window.BVT = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* answer style is kept with the question text as a last line such as [[answer:graph|Temperature / °C|Rate / s⁻¹]] */
  var MARK = /\n?\[\[answer:(dropdown|graph|draw|annotate)((?:\|[^\]|]*)*)\]\]\s*$/;
  T.MODES = { dropdown: 'Drop-down list', graph: 'Draw a graph', draw: 'Draw a diagram', annotate: 'Label / annotate the picture' };
  T.parse = function (prompt) {
    var p = String(prompt || ''), m = MARK.exec(p);
    if (!m) return { text: p, mode: '', x: '', y: '' };
    var bits = m[2].split('|').slice(1);
    return { text: p.slice(0, m.index).replace(/\s+$/, ''), mode: m[1], x: bits[0] || '', y: bits[1] || '' };
  };
  T.join = function (text, mode, x, y) {
    text = T.parse(text).text;   // never stack two markers
    if (!mode) return text;
    return text + '\n[[answer:' + mode + (mode === 'graph' ? '|' + String(x || '').replace(/[|\]]/g, '') + '|' + String(y || '').replace(/[|\]]/g, '') : '') + ']]';
  };
  T.text = function (prompt) { return T.parse(prompt).text; };

  /* question text → HTML: **bold**, line breaks and tables written as | a | b | rows */
  function fmt(s) { return E(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\^(\S+?)\^/g, '<sup>$1</sup>').replace(/~(\S+?)~/g, '<sub>$1</sub>'); }
  function isRow(l) { return /^\s*\|.*\|\s*$/.test(l); }
  function cells(l) { return l.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); }
  T.table = function (lines) {
    var sep = function (l) { return /-/.test(l) && /^\s*\|?[\s:\-|]+\|?\s*$/.test(l); };
    var rows = lines.filter(function (l) { return !sep(l); }).map(cells), head = lines.length > 1 && sep(lines[1]);
    return '<div class="qtable-wrap"><table class="qtable">' + rows.map(function (r, i) { var tag = head && i === 0 ? 'th' : 'td'; return '<tr>' + r.map(function (c) { return '<' + tag + '>' + (c ? fmt(c) : '&nbsp;') + '</' + tag + '>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
  };
  T.rich = function (prompt, inline) {
    var lines = T.text(prompt).split('\n'), out = [], buf = [], para = [];
    function flushP() { if (para.length) { out.push(inline && !out.length ? para.map(fmt).join('<br>') : '<span class="qp">' + para.map(fmt).join('<br>') + '</span>'); para = []; } }
    lines.forEach(function (l) {
      if (isRow(l)) { flushP(); buf.push(l); return; }
      if (buf.length) { out.push(T.table(buf)); buf = []; }
      if (!l.trim()) { flushP(); return; }
      para.push(l);
    });
    flushP(); if (buf.length) out.push(T.table(buf));
    return out.join('');
  };
  T.hasTable = function (prompt) { return T.text(prompt).split('\n').some(isRow); };
  /* tab-separated text (copied from Word or Excel) → | a | b | rows */
  T.tabsToTable = function (text) {
    var ls = String(text).replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
    if (ls.length < 2 || !ls.every(function (l) { return l.indexOf('\t') >= 0; })) return null;
    var rows = ls.map(function (l) { return '| ' + l.split('\t').map(function (c) { return c.trim(); }).join(' | ') + ' |'; });
    var n = ls[0].split('\t').length, sep = '|' + new Array(n + 1).join(' --- |');
    return [rows[0], sep].concat(rows.slice(1)).join('\n');
  };
  T.blankTable = function (r, c) {
    r = Math.max(1, Math.min(20, r | 0)); c = Math.max(1, Math.min(8, c | 0));
    var row = function (f) { var a = []; for (var j = 0; j < c; j++) a.push(f(j)); return '| ' + a.join(' | ') + ' |'; };
    var out = [row(function (j) { return 'Heading ' + (j + 1); }), '|' + new Array(c + 1).join(' --- |')];
    for (var i = 0; i < r - 1; i++) out.push(row(function () { return ' '; }));
    return out.join('\n');
  };

  /* ---------- drawing pad: draw a graph, draw a diagram or label a picture ---------- */
  var W = 900;
  T.pad = function (host, o) {
    o = o || {}; var mode = o.mode || 'draw', H = mode === 'graph' ? 640 : mode === 'annotate' ? 600 : 520;
    host.innerHTML = '<div class="dpad" data-mode="' + mode + '">' + (o.readonly ? '' :
      '<div class="toolbar small dtools" role="toolbar" aria-label="Drawing tools">' +
      '<button type="button" data-t="pen" aria-pressed="true">✏️ Pen</button>' +
      (mode === 'graph' ? '<button type="button" data-t="point">✕ Plot point</button>' : '') +
      '<button type="button" data-t="line">📏 Straight line</button>' +
      (mode !== 'graph' ? '<button type="button" data-t="arrow">➝ Label line</button>' : '') +
      '<button type="button" data-t="text">Aa Label</button>' +
      '<button type="button" data-t="erase">🧽 Rub out</button>' +
      '<span class="dcol"><button type="button" data-c="#172033" aria-label="Black" aria-pressed="true" style="color:#172033">●</button><button type="button" data-c="#2563eb" aria-label="Blue" style="color:#2563eb">●</button><button type="button" data-c="#dc2626" aria-label="Red" style="color:#dc2626">●</button><button type="button" data-c="#059669" aria-label="Green" style="color:#059669">●</button></span>' +
      '<button type="button" data-undo>↶ Undo</button><button type="button" data-clear>Clear</button></div>') +
      '<div class="dwrap" style="position:relative"><canvas width="' + W + '" height="' + H + '" class="hwpad" aria-label="' + E(T.MODES[mode] || 'Drawing area') + '" style="touch-action:none;width:100%;height:auto;background:#fff;border:1px solid var(--line,#d6dbe4);border-radius:10px"></canvas></div>' +
      (o.readonly ? '' : '<p class="small muted dhelp">' + ({ graph: 'Plot each point with ✕, then draw a line or curve of best fit with the pen or ruler. Label anything you need with Aa.', draw: 'Draw your diagram with the pen and ruler. Use Label line and Aa to add labels.', annotate: 'Draw label lines to the parts of the picture and write the labels with Aa.' })[mode] + '</p>') + '</div>';
    var c = host.querySelector('canvas'), g = c.getContext('2d'), strokes = [], tool = 'pen', col = '#172033', bg = null, base = null, cur = null, used = false;
    var A = { l: 90, r: W - 30, t: 30, b: H - 80 };   // graph axes box
    function grid() {
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      if (mode === 'graph') {
        for (var x = A.l, k = 0; x <= A.r + 0.1; x += (A.r - A.l) / 40, k++) { g.strokeStyle = k % 5 ? '#e6edf7' : '#c7d4e6'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, A.t); g.lineTo(x, A.b); g.stroke(); }
        for (var y = A.b, j = 0; y >= A.t - 0.1; y -= (A.b - A.t) / 26, j++) { g.strokeStyle = j % 5 ? '#e6edf7' : '#c7d4e6'; g.lineWidth = 1; g.beginPath(); g.moveTo(A.l, y); g.lineTo(A.r, y); g.stroke(); }
        g.strokeStyle = '#172033'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(A.l, A.t - 10); g.lineTo(A.l, A.b); g.lineTo(A.r + 10, A.b); g.stroke();
        g.fillStyle = '#172033'; g.font = '600 20px system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText(o.x || 'x-axis: label and units', (A.l + A.r) / 2, H - 28);
        g.save(); g.translate(30, (A.t + A.b) / 2); g.rotate(-Math.PI / 2); g.fillText(o.y || 'y-axis: label and units', 0, 0); g.restore();
        g.font = '14px system-ui, sans-serif'; g.fillStyle = '#64748b'; g.fillText('Write your scale on the axes with Aa', A.l + 150, A.b + 26); g.textAlign = 'start';
      }
      if (bg) { var s = Math.min(W / bg.width, H / bg.height), w = bg.width * s, h = bg.height * s; g.drawImage(bg, (W - w) / 2, (H - h) / 2, w, h); }
      if (base) g.drawImage(base, 0, 0, W, H);
    }
    function arrowHead(a, b) { var an = Math.atan2(b.y - a.y, b.x - a.x); g.beginPath(); g.arc(b.x, b.y, 4, 0, 7); g.fill(); }
    function paint(s) {
      g.strokeStyle = g.fillStyle = s.c; g.lineWidth = s.w || 3; g.lineCap = 'round'; g.lineJoin = 'round';
      if (s.t === 'pen') { g.beginPath(); s.p.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); if (s.p.length === 1) g.lineTo(s.p[0].x + 0.1, s.p[0].y); g.stroke(); }
      else if (s.t === 'line' || s.t === 'arrow') { g.beginPath(); g.moveTo(s.a.x, s.a.y); g.lineTo(s.b.x, s.b.y); g.stroke(); if (s.t === 'arrow') arrowHead(s.a, s.b); }
      else if (s.t === 'point') { var d = 7; g.lineWidth = 2.5; g.beginPath(); g.moveTo(s.a.x - d, s.a.y - d); g.lineTo(s.a.x + d, s.a.y + d); g.moveTo(s.a.x + d, s.a.y - d); g.lineTo(s.a.x - d, s.a.y + d); g.stroke(); }
      else if (s.t === 'text') { g.font = '600 22px system-ui, sans-serif'; g.textBaseline = 'middle'; var tw = g.measureText(s.s).width; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(s.a.x - 3, s.a.y - 14, tw + 6, 28); g.fillStyle = s.c; g.fillText(s.s, s.a.x, s.a.y); g.textBaseline = 'alphabetic'; }
    }
    function redraw() { grid(); strokes.forEach(paint); if (cur) paint(cur); }
    function changed() { used = true; if (o.onchange) o.onchange(); }
    function pos(e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    function near(s, p) {
      var pts = s.t === 'pen' ? s.p : s.t === 'text' ? [s.a, { x: s.a.x + s.s.length * 11, y: s.a.y }] : s.b ? [s.a, s.b, { x: (s.a.x + s.b.x) / 2, y: (s.a.y + s.b.y) / 2 }] : [s.a];
      return pts.some(function (q) { return Math.abs(q.x - p.x) < 16 && Math.abs(q.y - p.y) < 16; });
    }
    function label(p) {
      var wrap = host.querySelector('.dwrap'), r = c.getBoundingClientRect(), inp = document.createElement('input');
      inp.type = 'text'; inp.placeholder = 'Type a label, press Enter'; inp.setAttribute('aria-label', 'Label text');
      inp.style.cssText = 'position:absolute;left:' + Math.min(p.x * r.width / W, r.width - 190) + 'px;top:' + Math.max(0, p.y * r.height / H - 16) + 'px;width:180px;font:600 15px system-ui;padding:4px 6px;border:2px solid #2563eb;border-radius:6px;background:#fff;z-index:2';
      wrap.appendChild(inp); inp.focus(); setTimeout(function () { if (document.activeElement !== inp) inp.focus(); }, 0);
      var done = false; function commit() { if (done) return; done = true; var v = inp.value.trim(); inp.remove(); if (v) { strokes.push({ t: 'text', a: p, s: v, c: col }); redraw(); changed(); } }
      inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { inp.value = ''; commit(); } };
      inp.onblur = commit;
    }
    function ready() {
      redraw(); if (o.readonly) return;
      host.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { tool = b.getAttribute('data-t'); host.querySelectorAll('[data-t]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }; });
      host.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { col = b.getAttribute('data-c'); host.querySelectorAll('[data-c]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }; });
      host.querySelector('[data-undo]').onclick = function () { if (strokes.length) { strokes.pop(); redraw(); changed(); } else if (base) { base = null; redraw(); changed(); } };
      host.querySelector('[data-clear]').onclick = function () { strokes = []; base = null; redraw(); used = true; if (o.onchange) o.onchange(); };
      var down = false;
      c.addEventListener('pointerdown', function (e) {
        var p = pos(e); e.preventDefault();
        if (tool === 'text') { label(p); return; }
        if (tool === 'point') { strokes.push({ t: 'point', a: p, c: col }); redraw(); changed(); return; }
        if (tool === 'erase') { var n = strokes.length; strokes = strokes.filter(function (s) { return !near(s, p); }); if (strokes.length !== n) { redraw(); changed(); } down = true; c.setPointerCapture(e.pointerId); return; }
        down = true; c.setPointerCapture(e.pointerId);
        cur = tool === 'pen' ? { t: 'pen', p: [p], c: col, w: e.pointerType === 'pen' && e.pressure ? 1.5 + e.pressure * 3 : 3 } : { t: tool, a: p, b: p, c: col, w: 3 };
      });
      c.addEventListener('pointermove', function (e) {
        if (!down) return; var p = pos(e); e.preventDefault();
        if (tool === 'erase') { var n = strokes.length; strokes = strokes.filter(function (s) { return !near(s, p); }); if (strokes.length !== n) { redraw(); changed(); } return; }
        if (!cur) return; if (cur.t === 'pen') cur.p.push(p); else cur.b = p; redraw();
      });
      var up = function () { if (!down) return; down = false; if (cur) { if (cur.t === 'pen' || Math.hypot(cur.b.x - cur.a.x, cur.b.y - cur.a.y) > 4) strokes.push(cur); cur = null; redraw(); changed(); } };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    }
    var wait = [];
    if (o.value && /^data:image/.test(o.value)) wait.push(new Promise(function (ok) { var im = new Image(); im.onload = function () { base = im; ok(); }; im.onerror = ok; im.src = o.value; }));
    else if (mode === 'annotate' && o.image) wait.push(new Promise(function (ok) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { bg = im; ok(); }; im.onerror = function () { ok(); }; im.src = o.image; }));
    Promise.all(wait).then(ready);
    return {
      used: function () { return used || strokes.length > 0; },
      get: function () {   // the finished drawing as a small JPEG; '' if nothing was drawn
        if (!strokes.length && !base) return '';
        redraw(); var t = document.createElement('canvas'); t.width = 760; t.height = Math.round(H * 760 / W); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
        try { return t.toDataURL('image/jpeg', 0.7); } catch (e) { return ''; }   // a picture from another site without permission cannot be saved
      }
    };
  };
  T.isPic = function (v) { return /^data:image\//.test(v || ''); };

  /* ---------- feedback (rule-based, AI or teacher), the same layout everywhere ----------
     row = { source: 'rule' | 'ai' | 'teacher', rule: {got, feedback}, ai: {got, confidence, feedback}, teacher: {got, comment}, reviewed }
     opts.staff: show every part for the teacher (rule check and AI suggestion side by side) */
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  T.fbSource = function (row) {
    if (!row) return '';
    if (row.source === 'teacher') return '🧑‍🏫 Marked by your teacher';
    if (row.source === 'ai') return row.reviewed ? '📝 Detailed feedback · mark confirmed by your teacher' : '📝 Detailed feedback · your teacher will confirm the mark';
    return row.reviewed ? '⚙️ Marked from your teacher\'s mark scheme · checked by your teacher' : '⚙️ Marked automatically from your teacher\'s mark scheme';
  };
  T.fbParts = function (f, correct) {   // f = {understood[], missing[], why[], explain, improve, next}
    f = f || {}; var L = function (a) { return (a || []).filter(Boolean); }, out = '';
    var und = L(f.understood), mis = L(f.missing), why = L(f.why);
    if (und.length) out += '<div class="fbp good"><b>✓ What you did well</b><ul>' + und.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    if (mis.length) out += '<div class="fbp miss"><b>✗ What is missing or incorrect</b><ul>' + mis.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    if (why.length || (f.explain && !correct)) out += '<div class="fbp why"><b>💡 Why</b>' + why.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + (f.explain && why.indexOf(f.explain) < 0 ? '<p>' + esc(f.explain) + '</p>' : '') + '</div>';
    else if (f.explain && correct) out += '<div class="fbp why"><b>💡 Remember</b><p>' + esc(f.explain) + '</p></div>';
    var choice = /^(The correct answer is|No answer was chosen|You chose the correct answer)/.test(mis[0] || und[0] || '');
    var imp = f.improve || (!mis.length ? '' : choice ? 'Read the question and every option carefully, and rule out the options you know are wrong before you choose.' :
      'Add the missing ideas above to your answer, using the key scientific words. Then read your answer again: does each sentence answer the question?');
    if (imp && !correct) out += '<div class="fbp imp"><b>↗ How to improve</b><p>' + esc(imp) + '</p></div>';
    if (f.next && !correct) out += '<div class="fbp next"><b>📚 Study next</b><p>' + esc(f.next) + '</p></div>';
    return out;
  };
  T.feedback = function (row, opts) {
    opts = opts || {}; if (!row) return '';
    var rf = (row.rule || {}).feedback, af = (row.ai || {}).feedback, t = row.teacher || {};
    var main = row.source === 'ai' && af ? af : rf || af, got = t.got != null ? t.got : row.source === 'ai' && row.ai ? row.ai.got : (row.rule || {}).got, max = (row.rule || row.ai || {}).max;
    var correct = got != null && max != null && +got === +max && !((main || {}).missing || []).length;
    var html = '<div class="fbbox">' + T.fbParts(main, correct) + (t.comment ? '<div class="fbp tc"><b>🧑‍🏫 Teacher\'s comment</b><p>' + esc(t.comment) + '</p></div>' : '') +
      '<p class="fbsrc">' + T.fbSource(row) + '</p></div>';
    if (!opts.staff) return html;
    var parts = '';
    if (row.rule && (row.rule.rules || row.rule.got != null)) parts += '<div class="fbcol"><p class="label">⚙️ Rule check' + (row.rule.got != null ? ': ' + row.rule.got + ' / ' + row.rule.max : '') + (row.rule.confident ? ' · reliable' : ' · needs a check') + '</p>' + T.fbParts(rf, false) + '</div>';
    if (row.ai) parts += '<div class="fbcol"><p class="label">🤖 AI suggestion: ' + esc(row.ai.got) + ' / ' + esc(row.ai.max) + ' · ' + esc(row.ai.confidence || '') + ' confidence</p>' + T.fbParts(af, false) +
      '<button type="button" class="btn sm" data-useai="' + esc(row.ai.got) + '">Use AI mark (' + esc(row.ai.got) + ')</button></div>';
    else if (row.need_ai) parts += '<div class="fbcol"><p class="label">🤖 AI suggestion</p><p class="small muted">Waiting for AI marking. Press "Get AI suggestions" above, or mark it yourself.</p></div>';
    return parts ? '<div class="fbstaff">' + parts + '</div><p class="fbsrc">Students will see: ' + T.fbSource(row) + '</p>' : '';
  };

  if (!document.getElementById('qtools-css')) {
    var st = document.createElement('style'); st.id = 'qtools-css';
    st.textContent = '.qtable-wrap{overflow-x:auto;margin:.5em 0}.qtable{border-collapse:collapse;min-width:50%;font-size:.95em;background:var(--card,#fff)}.qtable th,.qtable td{border:1px solid var(--line,#cfd6e2);padding:6px 10px;text-align:left;vertical-align:top}.qtable th{background:var(--tint,#eef4ff);font-weight:700}' +
      '.qp{display:block;margin:.25em 0}.dtools{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.dtools button{border:1px solid var(--line,#d6dbe4);background:var(--card,#fff);border-radius:8px;padding:5px 9px;cursor:pointer;font:inherit}.dtools button[aria-pressed=true]{background:#2563eb;color:#fff;border-color:#2563eb}.dcol{display:inline-flex;gap:2px}.dcol button{font-size:18px;padding:2px 7px}.dcol button[aria-pressed=true]{background:#e0e7ff!important;color:inherit}' +
      'select.qdrop{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid var(--line,#d6dbe4);min-width:260px;max-width:100%}' +
      '.fbbox{display:grid;gap:8px;margin:.5em 0}.fbp{border-left:4px solid var(--line,#d6dbe4);padding:4px 10px;border-radius:4px}.fbp b{display:block;margin-bottom:2px}.fbp ul{margin:0;padding-left:20px}.fbp p{margin:2px 0}' +
      '.fbp.good{border-color:#16a34a;background:rgba(22,163,74,.07)}.fbp.miss{border-color:#dc2626;background:rgba(220,38,38,.06)}.fbp.why{border-color:#2563eb;background:rgba(37,99,235,.06)}' +
      '.fbp.imp{border-color:#d97706;background:rgba(217,119,6,.07)}.fbp.next{border-color:#7c3aed;background:rgba(124,58,237,.06)}.fbp.tc{border-color:#0f766e;background:rgba(15,118,110,.07)}' +
      '.fbsrc{font-size:.8em;color:var(--muted,#64748b);margin:2px 0 0}.fbstaff{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin:.5em 0}.fbcol{border:1px solid var(--line,#d6dbe4);border-radius:10px;padding:8px 10px;display:grid;gap:6px}';
    document.head.appendChild(st);
  }
})();
