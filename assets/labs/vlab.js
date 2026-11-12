/* Learnova Virtual Laboratory engine · by Learnova
   One lab = one spec object passed to VLab.mount(spec). The engine draws the seven lab sections
   (background, plan, experiment, results, analyse, evaluate, about the model), keeps the results table,
   draws graphs on <canvas>, exports CSV, gives rule-based feedback (no AI needed) and saves the work
   to the student's Learnova account when they are signed in. */
(function () {
  var COL = ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00', '#56B4E9', '#000000'];   // Okabe–Ito: safe for colour-blind readers
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fx(v, d) { if (v == null || v === '' || isNaN(v)) return ''; return (+v).toFixed(d == null ? 2 : d); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  var CSS = '.vl{--vl-line:#d6dde6;--vl-soft:#f4f7fb;--vl-acc:#0f766e;display:grid;gap:14px}' +
    '.vl-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:6px 0}' +
    '.vl-tabs button{border:1px solid var(--vl-line);background:#fff;border-radius:999px;padding:7px 14px;font:inherit;font-size:.92rem;cursor:pointer;color:inherit}' +
    '.vl-tabs button[aria-selected=true]{background:var(--vl-acc);color:#fff;border-color:var(--vl-acc)}' +
    '.vl-sec{display:none}.vl-sec.on{display:grid;gap:12px}.vl-card{border:1px solid var(--vl-line);border-radius:14px;padding:14px 16px;background:#fff}' +
    '.vl-card h3{margin:.1em 0 .5em}.vl-two{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr);gap:14px}@media(max-width:820px){.vl-two{grid-template-columns:minmax(0,1fr)}}.vl-card{min-width:0}' +
    '.vl-ctl{display:grid;gap:10px}.vl-ctl label{display:grid;gap:3px;font-size:.92rem}.vl-ctl output{font-weight:700;color:var(--vl-acc)}' +
    '.vl-ctl input[type=range]{width:100%}.vl-ctl select{padding:6px;border-radius:8px;border:1px solid var(--vl-line);font:inherit}' +
    '.vl-btns{display:flex;gap:8px;flex-wrap:wrap}.vl-btn{border:1px solid var(--vl-line);background:#fff;border-radius:999px;padding:8px 16px;font:inherit;font-weight:600;cursor:pointer;color:inherit}' +
    '.vl-btn.main{background:var(--vl-acc);border-color:var(--vl-acc);color:#fff}.vl-btn:disabled{opacity:.55;cursor:not-allowed}.vl-btn:focus-visible,.vl-tabs button:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}' +
    '.vl-stage{width:100%;display:block;border-radius:12px;background:var(--vl-soft)}.vl-chart{width:100%;height:280px;display:block}' +
    '.vl-read{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.vl-read div{background:var(--vl-soft);border-radius:10px;padding:8px 10px}.vl-read b{display:block;font-size:1.15rem}.vl-read span{font-size:.8rem;color:#475569}' +
    '.vl-tbl{width:100%;border-collapse:collapse;font-size:.9rem}.vl-tbl th,.vl-tbl td{border:1px solid var(--vl-line);padding:5px 8px;text-align:center}.vl-tbl th{background:var(--vl-soft)}.vl-tw{overflow-x:auto}' +
    '.vl-q{display:grid;gap:6px;border-top:1px solid var(--vl-line);padding-top:10px}.vl-q textarea,.vl-q input{width:100%;font:inherit;padding:8px;border-radius:8px;border:1px solid var(--vl-line);box-sizing:border-box}' +
    '.vl-fb{border-radius:10px;padding:8px 10px;font-size:.92rem}.vl-fb.good{background:#e7f6ec}.vl-fb.part{background:#fff7e0}.vl-fb.no{background:#fdecec}' +
    '.vl-hint{background:#eef5ff;border-radius:10px;padding:8px 10px;font-size:.92rem}.vl-note{font-size:.85rem;color:#475569}.vl-tags{display:flex;gap:6px;flex-wrap:wrap}.vl-tags span{background:var(--vl-soft);border-radius:999px;padding:3px 10px;font-size:.8rem}' +
    '.vl-save{font-size:.85rem;color:#475569}.vl ul{margin:.2em 0;padding-left:1.2em}.vl-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:.85rem}.vl-legend i{display:inline-block;width:14px;height:4px;border-radius:2px;margin-right:5px;vertical-align:middle}';

  /* ---------- graph on canvas ---------- */
  function niceStep(range) { var p = Math.pow(10, Math.floor(Math.log10(range || 1))), r = range / p; return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p; }
  function ticks(lo, hi) { var st = niceStep((hi - lo) / 5) || 1, out = [], s = Math.ceil(lo / st) * st; for (var v = s; v <= hi + st * 1e-6; v += st) out.push(+v.toFixed(10)); return out; }
  function chart(cv, o) {   // o: {xLabel, yLabel, series:[{name, pts:[[x,y]], line, dots, dash, color}], xmin, xmax, ymin, ymax, marks:[{x,label}]}
    var dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = cv.clientHeight || 280;
    cv.width = W * dpr; cv.height = H * dpr; var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    var all = []; o.series.forEach(function (s) { all = all.concat(s.pts); });
    var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    var x0 = o.xmin != null ? o.xmin : Math.min.apply(null, xs.concat([0])), x1 = o.xmax != null ? o.xmax : Math.max.apply(null, xs.concat([1]));
    var y0 = o.ymin != null ? o.ymin : Math.min.apply(null, ys.concat([0])), y1 = o.ymax != null ? o.ymax : Math.max.apply(null, ys.concat([1]));
    if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1;
    if (o.ymax == null) y1 += (y1 - y0) * 0.08;
    var L = 58, R = 14, T = 12, B = 44, pw = W - L - R, ph = H - T - B;
    function X(v) { return L + (v - x0) / (x1 - x0) * pw; } function Y(v) { return T + ph - (v - y0) / (y1 - y0) * ph; }
    c.font = '12px system-ui,Arial'; c.fillStyle = '#334155'; c.strokeStyle = '#e2e8f0'; c.lineWidth = 1;
    ticks(x0, x1).forEach(function (v) { c.beginPath(); c.moveTo(X(v), T); c.lineTo(X(v), T + ph); c.stroke(); c.textAlign = 'center'; c.fillText(+v.toPrecision(6), X(v), T + ph + 16); });
    ticks(y0, y1).forEach(function (v) { c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + pw, Y(v)); c.stroke(); c.textAlign = 'right'; c.fillText(+v.toPrecision(6), L - 6, Y(v) + 4); });
    c.strokeStyle = '#334155'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(L, T); c.lineTo(L, T + ph); c.lineTo(L + pw, T + ph); c.stroke();
    c.textAlign = 'center'; c.fillText(o.xLabel || '', L + pw / 2, H - 6);
    c.save(); c.translate(14, T + ph / 2); c.rotate(-Math.PI / 2); c.fillText(o.yLabel || '', 0, 0); c.restore();
    (o.marks || []).forEach(function (m) { c.strokeStyle = '#94a3b8'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(X(m.x), T); c.lineTo(X(m.x), T + ph); c.stroke(); c.setLineDash([]); c.fillStyle = '#475569'; c.textAlign = 'left'; c.fillText(m.label, X(m.x) + 4, T + 12); });
    c.save(); c.beginPath(); c.rect(L, T - 2, pw + 2, ph + 4); c.clip();
    o.series.forEach(function (s, i) {
      var col = s.color || COL[i % COL.length]; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2.2;
      var pts = s.pts.slice(); if (s.sort) pts.sort(function (a, b) { return a[0] - b[0]; });
      if (s.line !== false && !s.bar && pts.length > 1) { c.setLineDash(s.dash ? [6, 4] : []); c.beginPath(); pts.forEach(function (p, k) { k ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])); }); c.stroke(); c.setLineDash([]); }
      if (s.bar) pts.forEach(function (p) { c.globalAlpha = 0.85; c.fillRect(X(p[0]) - 18, Y(p[1]), 36, Y(Math.max(y0, 0)) - Y(p[1])); c.globalAlpha = 1; });
      if (s.dots) pts.forEach(function (p) { c.beginPath(); c.arc(X(p[0]), Y(p[1]), 4, 0, 7); c.fill(); });
    });
    c.restore();
    cv.setAttribute('aria-label', (o.yLabel || '') + ' against ' + (o.xLabel || '') + '. ' + o.series.map(function (s) { return (s.name ? s.name + ': ' : '') + s.pts.length + ' points'; }).join('; '));
  }
  function legend(series) { return '<div class="vl-legend">' + series.filter(function (s) { return s.name; }).map(function (s, i) { return '<span><i style="background:' + (s.color || COL[i % COL.length]) + '"></i>' + E(s.name) + '</span>'; }).join('') + '</div>'; }

  /* ---------- rule-based marking ---------- */
  function norm(t) { return String(t || '').toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' '); }
  function markRules(ans, q, ctx) {
    var a = norm(ans), got = 0, notes = [], tips = [];
    if (!a.trim()) return { score: 0, fb: 'No answer yet.' };
    if (q.number) {   // numeric answer: {value(ctx) or value, tol (fraction), unit}
      var want = typeof q.number.value === 'function' ? q.number.value(ctx) : q.number.value, m = a.match(/-?\d+(\.\d+)?(e-?\d+)?/);
      if (want == null || isNaN(want)) return { score: 0, fb: q.number.missing || 'Collect the data first, then answer.' };
      if (!m) return { score: 0, fb: 'Give a number' + (q.number.unit ? ' in ' + q.number.unit : '') + '.' };
      var v = +m[0], ok = Math.abs(v - want) <= Math.abs(want) * (q.number.tol || 0.05) + (q.number.abs || 0);
      if (ok) { got = q.marks; notes.push('Correct: about ' + fx(want, q.number.dp == null ? 2 : q.number.dp) + (q.number.unit ? ' ' + q.number.unit : '') + '.'); }
      else tips.push(q.number.hint || 'Check your working: the value from your data is about ' + fx(want, q.number.dp == null ? 2 : q.number.dp) + (q.number.unit ? ' ' + q.number.unit : '') + '.');
      if (ok && q.number.unit && q.number.needUnit && a.indexOf(q.number.unitKey || q.number.unit.toLowerCase()) < 0) { got = Math.max(0, got - 1); tips.push('Include the unit (' + q.number.unit + ').'); }
    }
    (q.points || []).forEach(function (p) {   // each point: {re: [regex], marks, ok: 'text', miss: 'tip'}
      var hit = p.re.some(function (r) { return r.test(a); });
      if (hit) { got += p.marks || 1; if (p.ok) notes.push(p.ok); } else if (p.miss) tips.push(p.miss);
    });
    (q.wrong || []).forEach(function (w) { if (w.re.test(a)) { tips.unshift('⚠ ' + w.msg); if (w.minus) got -= w.minus; } });
    got = Math.max(0, Math.min(q.marks, got));
    return { score: got, fb: (notes.length ? '✓ ' + notes.join(' ✓ ') : '') + (tips.length ? (notes.length ? '<br>' : '') + '➜ ' + tips.join('<br>➜ ') : '') };
  }

  /* ---------- the lab ---------- */
  function mount(host, spec) {
    if (!document.getElementById('vl-css')) { var st = document.createElement('style'); st.id = 'vl-css'; st.textContent = CSS; document.head.appendChild(st); }
    var KEY = 'vl-' + spec.id, saved = store(KEY) || {};
    var S = { trials: saved.trials || [], answers: saved.answers || {}, hyp: saved.hyp || '', hints: saved.hints || 0, log: saved.log || [], scores: saved.scores || {}, started: saved.started || new Date().toISOString(), id: saved.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) };
    var SECS = [['bg', '1 Background'], ['plan', '2 Plan'], ['exp', '3 Experiment'], ['res', '4 Results'], ['an', '5 Analyse'], ['ev', '6 Evaluate'], ['model', 'About the model']];
    var ctl = spec.controls || [];
    host.innerHTML = '<div class="vl">' +
      '<div class="vl-tags">' + (spec.tags || []).map(function (t) { return '<span>' + E(t) + '</span>'; }).join('') + '</div>' +
      '<nav class="vl-tabs" role="tablist" aria-label="Lab sections">' + SECS.map(function (s, i) { return '<button type="button" role="tab" data-s="' + s[0] + '" aria-selected="' + (i === 0) + '">' + s[1] + '</button>'; }).join('') + '</nav>' +
      // 1 background
      '<section class="vl-sec on" data-sec="bg"><div class="vl-card"><h3>Scientific background</h3>' + spec.background + '</div>' +
      '<div class="vl-card"><h3>Learning objectives</h3><ul>' + spec.objectives.map(function (o) { return '<li>' + E(o) + '</li>'; }).join('') + '</ul></div></section>' +
      // 2 plan
      '<section class="vl-sec" data-sec="plan"><div class="vl-card"><h3>Research question</h3><p><b>' + E(spec.rq) + '</b></p>' +
      '<label class="vl-q"><span><b>Your hypothesis.</b> ' + E(spec.hypPrompt || 'Write a prediction and give a scientific reason: "If … then … because …"') + '</span><textarea id="vl-hyp" rows="3">' + E(S.hyp) + '</textarea></label><div id="vl-hypfb"></div>' +
      '<div class="vl-btns"><button class="vl-btn" type="button" id="vl-hypchk">Check my hypothesis</button></div></div>' +
      '<div class="vl-two"><div class="vl-card"><h3>Variables</h3><p><b>Independent (you change):</b> ' + spec.variables.iv + '</p><p><b>Dependent (you measure):</b> ' + spec.variables.dv + '</p><p><b>Controlled (keep the same):</b></p><ul>' + spec.variables.cv.map(function (v) { return '<li>' + v + '</li>'; }).join('') + '</ul></div>' +
      '<div class="vl-card"><h3>Apparatus and materials</h3><ul>' + spec.apparatus.map(function (v) { return '<li>' + E(v) + '</li>'; }).join('') + '</ul><h3>Safety</h3><ul>' + spec.safety.map(function (v) { return '<li>' + E(v) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="vl-card"><h3>Method</h3><ol>' + spec.method.map(function (v) { return '<li>' + v + '</li>'; }).join('') + '</ol></div></section>' +
      // 3 experiment
      '<section class="vl-sec" data-sec="exp"><div class="vl-two"><div class="vl-card"><div id="vl-stage"></div></div>' +
      '<div class="vl-card"><h3>Controls</h3><div class="vl-ctl">' + ctl.map(function (c) {
        if (c.type === 'select') return '<label>' + E(c.label) + '<select id="c-' + c.id + '">' + c.options.map(function (o) { return '<option value="' + E(o[0]) + '"' + (o[0] === c.value ? ' selected' : '') + '>' + E(o[1]) + '</option>'; }).join('') + '</select></label>';
        if (c.type === 'check') return '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="c-' + c.id + '"' + (c.value ? ' checked' : '') + '> ' + E(c.label) + '</label>';
        return '<label>' + E(c.label) + ' <output id="o-' + c.id + '"></output><input type="range" id="c-' + c.id + '" min="' + c.min + '" max="' + c.max + '" step="' + (c.step || 1) + '" value="' + c.value + '"></label>';
      }).join('') + '</div><div class="vl-btns" style="margin-top:10px" id="vl-acts"></div><p class="vl-note" id="vl-status" role="status"></p>' +
      '<div class="vl-btns"><button class="vl-btn" type="button" id="vl-hint">💡 Hint</button></div><div id="vl-hints"></div></div></div>' +
      '<div class="vl-card"><h3>Live readings</h3><div class="vl-read" id="vl-read"></div></div></section>' +
      // 4 results
      '<section class="vl-sec" data-sec="res"><div class="vl-card"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><h3>Results table</h3><div class="vl-btns"><button class="vl-btn" type="button" id="vl-csv">⬇ Download CSV</button><button class="vl-btn" type="button" id="vl-clear">Clear table</button></div></div>' +
      '<div class="vl-tw" id="vl-table"></div><p class="vl-note">Each row is one recorded trial. Repeat trials with the same settings, and change one variable at a time.</p></div>' +
      '<div class="vl-card"><h3>Graph</h3><div class="vl-btns"><label>x-axis <select id="vl-gx"></select></label><label>y-axis <select id="vl-gy"></select></label><label>Separate lines for <select id="vl-gs"></select></label></div>' +
      '<canvas class="vl-chart" id="vl-gc"></canvas><div id="vl-gl"></div><p class="vl-note" id="vl-gnote"></p></div></section>' +
      // 5 analyse, 6 evaluate
      '<section class="vl-sec" data-sec="an"><div class="vl-card"><h3>Analyse and conclude</h3><p class="vl-note">Use the results in your own table. Press <b>Check</b> for feedback on each answer.</p><div id="vl-an"></div></div></section>' +
      '<section class="vl-sec" data-sec="ev"><div class="vl-card"><h3>Evaluate</h3><div id="vl-ev"></div></div>' +
      '<div class="vl-card"><h3>Hand in</h3><p>Score so far: <b id="vl-score">0</b> / <span id="vl-max"></span></p><div class="vl-btns"><button class="vl-btn main" type="button" id="vl-submit">✓ Submit my lab</button><button class="vl-btn" type="button" id="vl-print">🖨 Print my lab report</button></div><p class="vl-save" id="vl-save"></p></div></section>' +
      // model
      '<section class="vl-sec" data-sec="model"><div class="vl-card"><h3>About the model</h3>' + spec.model + '<p class="vl-note">Simulations simplify real systems. Use them to test ideas, then compare with real experiments and data.</p></div></section></div>';

    var $ = function (q) { return host.querySelector(q); }, $$ = function (q) { return host.querySelectorAll(q); };
    $$('.vl-tabs button').forEach(function (b) { b.onclick = function () { show(b.getAttribute('data-s')); }; });
    function show(s) { $$('.vl-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-s') === s); }); $$('.vl-sec').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-sec') === s); }); if (s === 'res') drawResults(); if (s === 'exp' && api.onShow) api.onShow(); }

    // controls
    function vals() { var o = {}; ctl.forEach(function (c) { var el = $('#c-' + c.id); o[c.id] = c.type === 'select' ? el.value : c.type === 'check' ? el.checked : +el.value; }); return o; }
    function outs() { ctl.forEach(function (c) { var o = $('#o-' + c.id); if (o) { var v = +$('#c-' + c.id).value; o.textContent = (c.fmt ? c.fmt(v) : fx(v, c.dp == null ? 0 : c.dp)) + (c.unit ? ' ' + c.unit : ''); } }); }
    ctl.forEach(function (c) { $('#c-' + c.id).addEventListener('input', function () { outs(); S.log.push([Math.round((Date.now() - Date.parse(S.started)) / 1000), c.id, vals()[c.id]]); if (S.log.length > 400) S.log.shift(); if (api.onChange) api.onChange(vals(), c.id); }); });
    outs();

    // hints
    var hintI = 0;
    $('#vl-hint').onclick = function () { var h = spec.hints || []; if (!h.length) return; $('#vl-hints').insertAdjacentHTML('beforeend', '<p class="vl-hint">' + h[Math.min(hintI, h.length - 1)] + '</p>'); hintI++; S.hints++; keep(); };

    // the results table
    var cols = spec.columns;
    function cell(r, c) { var v = r[c.key]; return typeof v === 'number' ? fx(v, c.dp) : E(v); }
    function drawTable() {
      $('#vl-table').innerHTML = S.trials.length ? '<table class="vl-tbl"><tr><th>Trial</th>' + cols.map(function (c) { return '<th>' + E(c.label) + (c.unit ? ' / ' + E(c.unit) : '') + '</th>'; }).join('') + '<th></th></tr>' +
        S.trials.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td>' + cols.map(function (c) { return '<td>' + cell(r, c) + '</td>'; }).join('') + '<td><button type="button" class="vl-btn" data-del="' + i + '" aria-label="Delete trial ' + (i + 1) + '" style="padding:2px 8px">✕</button></td></tr>'; }).join('') + '</table>'
        : '<p class="vl-note">No trials recorded yet. Go to <b>3 Experiment</b>, run the model and press <b>Record</b>.</p>';
      $$('[data-del]').forEach(function (b) { b.onclick = function () { S.trials.splice(+b.getAttribute('data-del'), 1); keep(); drawResults(); }; });
    }
    var num = cols.filter(function (c) { return c.num !== false; }), grp = cols.filter(function (c) { return c.group; });
    $('#vl-gx').innerHTML = num.map(function (c) { return '<option value="' + c.key + '"' + (c.key === spec.graph.x ? ' selected' : '') + '>' + E(c.label) + '</option>'; }).join('');
    $('#vl-gy').innerHTML = num.map(function (c) { return '<option value="' + c.key + '"' + (c.key === spec.graph.y ? ' selected' : '') + '>' + E(c.label) + '</option>'; }).join('');
    $('#vl-gs').innerHTML = '<option value="">(one line)</option>' + grp.map(function (c) { return '<option value="' + c.key + '"' + (c.key === spec.graph.group ? ' selected' : '') + '>' + E(c.label) + '</option>'; }).join('');
    ['#vl-gx', '#vl-gy', '#vl-gs'].forEach(function (q) { $(q).onchange = drawGraph; });
    function colOf(k) { return cols.filter(function (c) { return c.key === k; })[0]; }
    function drawGraph() {
      var gx = $('#vl-gx').value, gy = $('#vl-gy').value, gs = $('#vl-gs').value, groups = {};
      S.trials.forEach(function (r) { var g = gs ? String(r[gs]) : ''; (groups[g] = groups[g] || []).push(r); });
      var series = Object.keys(groups).map(function (g) {   // mean of repeats at each x
        var byx = {}; groups[g].forEach(function (r) { if (typeof r[gx] !== 'number' || typeof r[gy] !== 'number') return; (byx[r[gx]] = byx[r[gx]] || []).push(r[gy]); });
        var pts = Object.keys(byx).map(function (x) { var a = byx[x]; return [+x, a.reduce(function (s, v) { return s + v; }, 0) / a.length]; }).sort(function (a, b) { return a[0] - b[0]; });
        return { name: gs ? colOf(gs).label + ': ' + g : '', pts: pts, dots: true, line: pts.length > 1 };
      });
      var cx = colOf(gx), cy = colOf(gy);
      chart($('#vl-gc'), { xLabel: cx.label + (cx.unit ? ' / ' + cx.unit : ''), yLabel: cy.label + (cy.unit ? ' / ' + cy.unit : ''), series: series.length ? series : [{ pts: [] }] });
      $('#vl-gl').innerHTML = legend(series);
      $('#vl-gnote').textContent = S.trials.length ? 'Points show the mean of repeat trials with the same settings.' : '';
    }
    function drawResults() { drawTable(); drawGraph(); }
    $('#vl-clear').onclick = function () { if (S.trials.length && confirm('Delete every row of your results table?')) { S.trials = []; keep(); drawResults(); } };
    $('#vl-csv').onclick = function () {
      var rows = [['Trial'].concat(cols.map(function (c) { return c.label + (c.unit ? ' (' + c.unit + ')' : ''); }))].concat(S.trials.map(function (r, i) { return [i + 1].concat(cols.map(function (c) { return r[c.key]; })); }));
      var csv = '﻿' + rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = spec.id + '-results.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };

    // questions
    var QS = (spec.analyse || []).concat(spec.evaluate || []), MAX = QS.reduce(function (s, q) { return s + q.marks; }, 0) + (spec.hypothesis ? spec.hypothesis.marks : 0);
    $('#vl-max').textContent = MAX;
    function qHtml(q) { return '<div class="vl-q" data-q="' + q.id + '"><label for="q-' + q.id + '"><b>' + E(q.q) + '</b> <span class="vl-note">[' + q.marks + ']</span></label>' +
      (q.lines === 1 ? '<input id="q-' + q.id + '" value="' + E(S.answers[q.id] || '') + '">' : '<textarea id="q-' + q.id + '" rows="' + (q.lines || 3) + '">' + E(S.answers[q.id] || '') + '</textarea>') +
      '<div class="vl-btns"><button class="vl-btn" type="button" data-chk="' + q.id + '">Check</button></div><div class="vl-fbw"></div></div>'; }
    $('#vl-an').innerHTML = (spec.analyse || []).map(qHtml).join('');
    $('#vl-ev').innerHTML = (spec.evaluate || []).map(qHtml).join('');
    function ctx() { return { trials: S.trials, vals: vals(), api: api }; }
    function check(q, quiet) {
      var el = $('#q-' + q.id); S.answers[q.id] = el.value;
      var r = q.check ? q.check(el.value, ctx()) : markRules(el.value, q, ctx());
      S.scores[q.id] = r.score;
      if (!quiet) { var w = host.querySelector('[data-q="' + q.id + '"] .vl-fbw'); w.innerHTML = '<div class="vl-fb ' + (r.score >= q.marks ? 'good' : r.score > 0 ? 'part' : 'no') + '"><b>' + r.score + ' / ' + q.marks + '</b> · ' + r.fb + '</div>'; }
      total(); keep();
    }
    QS.forEach(function (q) { host.querySelector('[data-chk="' + q.id + '"]').onclick = function () { check(q); }; $('#q-' + q.id).addEventListener('change', function () { S.answers[q.id] = this.value; keep(); }); });
    $('#vl-hypchk').onclick = function () { S.hyp = $('#vl-hyp').value; var r = markRules(S.hyp, spec.hypothesis, ctx()); S.scores._hyp = r.score; $('#vl-hypfb').innerHTML = '<div class="vl-fb ' + (r.score >= spec.hypothesis.marks ? 'good' : r.score ? 'part' : 'no') + '"><b>' + r.score + ' / ' + spec.hypothesis.marks + '</b> · ' + r.fb + '</div>'; total(); keep(); };
    $('#vl-hyp').addEventListener('change', function () { S.hyp = this.value; keep(); });
    function score() { var s = 0; for (var k in S.scores) s += S.scores[k] || 0; return s; }
    function total() { $('#vl-score').textContent = score(); }
    total();

    // saving
    var saveT = null;
    function keep() { store(KEY, S); clearTimeout(saveT); saveT = setTimeout(function () { remote(false); }, 2500); }
    function remote(submitted) {
      var B = window.BVS; if (!B || !B.on || !B.db) return Promise.resolve(false);
      return B.db.auth.getSession().then(function (r) {
        var u = r.data.session && r.data.session.user; if (!u) { $('#vl-save').textContent = 'Not signed in: your work is kept in this browser only. Sign in to hand it in to your teacher.'; return false; }
        var row = { id: S.id, student_id: u.id, sim: spec.id, sim_title: spec.title, variables: S.log.slice(-200), data: S.trials, answers: Object.assign({ _hypothesis: S.hyp }, S.answers), scores: S.scores,
          score: score(), max_score: MAX, hints: S.hints, trials: S.trials.length, started_at: S.started, updated_at: new Date().toISOString() };
        if (submitted) { row.submitted_at = new Date().toISOString(); S.submitted = row.submitted_at; } else if (S.submitted) row.submitted_at = S.submitted;
        return B.db.from('sim_attempts').upsert(row).then(function (x) {
          $('#vl-save').textContent = x.error ? 'Saved in this browser. (Could not reach your account just now.)' : (submitted || S.submitted ? '✓ Handed in to your teacher' + (submitted ? ' at ' + new Date().toLocaleTimeString() : '') + '. Later changes are saved too.' : 'Saved to your account at ' + new Date().toLocaleTimeString() + '.');
          B.db.from('sim_attempts').select('teacher_comment').eq('id', S.id).maybeSingle().then(function (c) { var t = c && c.data && c.data.teacher_comment; if (t) $('#vl-save').insertAdjacentHTML('afterend', '<div class="vl-fb good" id="vl-tc"><b>Your teacher\'s comment:</b> ' + E(t) + '</div>'); var o = host.querySelectorAll('#vl-tc'); for (var i = 1; i < o.length; i++) o[i].remove(); });
          return !x.error;
        });
      }).catch(function () { return false; });
    }
    $('#vl-submit').onclick = function () {
      if (!S.trials.length) { $('#vl-save').textContent = 'Record some results before you hand in.'; return; }
      QS.forEach(function (q) { check(q, true); });
      remote(true).then(function (ok) { if (!ok && !$('#vl-save').textContent) $('#vl-save').textContent = 'Kept in this browser.'; });
    };
    $('#vl-print').onclick = function () { QS.forEach(function (q) { S.answers[q.id] = $('#q-' + q.id).value; }); report(); };
    function report() {
      var w = window.open('', '_blank'); if (!w) { $('#vl-save').textContent = 'Allow pop-ups to open the report.'; return; }
      var img = ''; try { img = $('#vl-gc').toDataURL('image/png'); } catch (e) {}
      w.document.write('<!doctype html><meta charset="utf-8"><title>' + E(spec.title) + ' · lab report</title><style>body{font:15px/1.5 system-ui,Arial;max-width:860px;margin:24px auto;padding:0 16px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4px 6px;text-align:center}h1{font-size:1.5rem}h2{font-size:1.15rem;margin-top:1.4em}.a{background:#f4f7fb;padding:8px;border-radius:8px;white-space:pre-wrap}</style>' +
        '<h1>' + E(spec.title) + '</h1><p>Learnova virtual laboratory · ' + new Date().toLocaleString() + ' · Score ' + score() + ' / ' + MAX + '</p>' +
        '<h2>Research question</h2><p>' + E(spec.rq) + '</p><h2>Hypothesis</h2><div class="a">' + E(S.hyp || '—') + '</div>' +
        '<h2>Results</h2><table><tr><th>Trial</th>' + cols.map(function (c) { return '<th>' + E(c.label) + (c.unit ? ' / ' + E(c.unit) : '') + '</th>'; }).join('') + '</tr>' + S.trials.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td>' + cols.map(function (c) { return '<td>' + cell(r, c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
        (img ? '<h2>Graph</h2><img src="' + img + '" style="max-width:100%">' : '') +
        QS.map(function (q) { return '<h2>' + E(q.q) + '</h2><div class="a">' + E(S.answers[q.id] || '—') + '</div><p>Mark: ' + (S.scores[q.id] || 0) + ' / ' + q.marks + '</p>'; }).join('') +
        '<p style="color:#666;font-size:.85em">Lab by Learnova · biosciencevista.com</p>');
      w.document.close(); setTimeout(function () { try { w.print(); } catch (e) {} }, 400);
    }

    // the experiment itself
    var api = {
      stage: $('#vl-stage'), vals: vals, chart: chart, legend: legend, E: E, fx: fx, COL: COL,
      status: function (t) { $('#vl-status').textContent = t || ''; },
      readings: function (list) { $('#vl-read').innerHTML = list.map(function (x) { return '<div><b>' + x[1] + '</b><span>' + E(x[0]) + '</span></div>'; }).join(''); },
      actions: function (list) {   // [{id,label,main,fn}]
        $('#vl-acts').innerHTML = list.map(function (a) { return '<button type="button" class="vl-btn' + (a.main ? ' main' : '') + '" id="a-' + a.id + '">' + a.label + '</button>'; }).join('');
        list.forEach(function (a) { $('#a-' + a.id).onclick = a.fn; });
      },
      enable: function (id, on) { var b = $('#a-' + id); if (b) b.disabled = !on; },
      label: function (id, t) { var b = $('#a-' + id); if (b) b.innerHTML = t; },
      record: function (row) { S.trials.push(row); keep(); api.status('✓ Trial ' + S.trials.length + ' recorded. See 4 Results.'); },
      trials: function () { return S.trials; },
      setControl: function (id, v) { var el = $('#c-' + id); if (el) { el.value = v; outs(); } }
    };
    spec.setup(api);
    if (api.onChange) api.onChange(vals(), null);
    window.addEventListener('resize', function () { if ($('[data-sec=res]').classList.contains('on')) drawGraph(); if (api.onResize) api.onResize(); });
    if (S.trials.length) api.status(S.trials.length + ' trials kept from last time. See 4 Results.');
    remote(false);
    return api;
  }
  window.VLab = { mount: mount, chart: chart, legend: legend, markRules: markRules, E: E, fx: fx, COL: COL };
})();
