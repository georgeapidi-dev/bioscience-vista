/* Science tools: calculator, graph plotter, drawing board · BioScience Vista (uses math.js) */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, E = BV.esc;

  /* ---------- scientific calculator ---------- */
  var calc = $('#calc');
  if (calc) {
    var input = $('#cin'), out = $('#cout'), deg = true, ans = 0, hist = [];
    var keys = ['sin(', 'cos(', 'tan(', 'log10(', 'ln(', 'asin(', 'acos(', 'atan(', 'sqrt(', '^', '7', '8', '9', '(', ')', '4', '5', '6', '*', '/', '1', '2', '3', '+', '-', '0', '.', 'e', 'pi', 'Ans', 'x10^', '!', '%', 'DEL', 'AC', '='];
    var labels = { 'log10(': 'log', 'ln(': 'ln', 'asin(': 'sin⁻¹', 'acos(': 'cos⁻¹', 'atan(': 'tan⁻¹', 'sqrt(': '√', '^': 'xʸ', '*': '×', '/': '÷', '-': '−', 'pi': 'π', 'x10^': '×10ˣ', 'sin(': 'sin', 'cos(': 'cos', 'tan(': 'tan' };
    $('#keys').innerHTML = keys.map(function (k) { var c = /^[0-9.]$/.test(k) ? '' : k === '=' ? 'eq' : /^[+\-*/^()]$/.test(k) ? 'op' : 'fn'; return '<button type="button" class="' + c + '" data-k="' + k + '">' + (labels[k] || k) + '</button>'; }).join('');
    function scope() {
      var d = Math.PI / 180, s = { Ans: ans, ln: function (x) { return Math.log(x); } };
      if (deg) { s.sin = function (x) { return Math.sin(x * d); }; s.cos = function (x) { return Math.cos(x * d); }; s.tan = function (x) { return Math.tan(x * d); };
        s.asin = function (x) { return Math.asin(x) / d; }; s.acos = function (x) { return Math.acos(x) / d; }; s.atan = function (x) { return Math.atan(x) / d; }; }
      return s;
    }
    function run() {
      var ex = input.value.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/x10\^/g, '*10^');
      if (!ex.trim()) return;
      try { var v = math.evaluate(ex, scope()); var txt = typeof v === 'number' ? (Math.abs(v) >= 1e10 || (Math.abs(v) < 1e-6 && v !== 0) ? v.toExponential(6) : String(+v.toPrecision(12))) : math.format(v, { precision: 12 });
        ans = typeof v === 'number' ? v : ans; out.innerHTML = '<small>' + E(input.value) + ' =</small>' + E(txt); hist.unshift(input.value + ' = ' + txt); $('#chist').innerHTML = hist.slice(0, 8).map(function (h) { return '<li>' + E(h) + '</li>'; }).join(''); }
      catch (e) { out.innerHTML = '<small>' + E(input.value) + '</small>Error: check the expression'; }
    }
    $('#keys').addEventListener('click', function (e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      if (k === '=') return run(); if (k === 'AC') { input.value = ''; out.innerHTML = '<small>&nbsp;</small>0'; return; }
      if (k === 'DEL') { input.value = input.value.slice(0, -1); return; }
      var p = input.selectionStart == null ? input.value.length : input.selectionStart; input.value = input.value.slice(0, p) + k + input.value.slice(input.selectionEnd || p); input.focus();
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    $('#cmode').addEventListener('click', function () { deg = !deg; this.textContent = deg ? 'DEG' : 'RAD'; this.setAttribute('aria-pressed', deg); });
  }

  /* ---------- graph plotter ---------- */
  var gc = $('#gcanvas');
  if (gc) {
    var COLS = ['#2563eb', '#e4572e', '#15803d', '#7c3aed'];
    function parseData() {
      return $('#gdata').value.split(/\n/).map(function (l) { var p = l.split(/[,\t; ]+/).map(Number); return p.length >= 2 && isFinite(p[0]) && isFinite(p[1]) ? [p[0], p[1]] : null; }).filter(Boolean);
    }
    function fit(pts) {
      var n = pts.length; if (n < 2) return null; var sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
      pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxy += p[0] * p[1]; sxx += p[0] * p[0]; syy += p[1] * p[1]; });
      var den = n * sxx - sx * sx; if (!den) return null; var m = (n * sxy - sx * sy) / den, c = (sy - m * sx) / n;
      var r = (n * sxy - sx * sy) / Math.sqrt(den * (n * syy - sy * sy)); return { m: m, c: c, r2: isFinite(r) ? r * r : 1 };
    }
    function nice(span) { var p = Math.pow(10, Math.floor(Math.log10(span / 8))), f = span / 8 / p; return p * (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10); }
    function draw() {
      var W = gc.clientWidth, H = Math.round(W * 0.62), dpr = window.devicePixelRatio || 1; gc.width = W * dpr; gc.height = H * dpr; gc.style.height = H + 'px';
      var g = gc.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      var fns = [].slice.call(document.querySelectorAll('.gfn')).map(function (i) { return i.value.trim(); }), pts = parseData();
      var x0 = +$('#gx0').value, x1 = +$('#gx1').value; if (!(x1 > x0)) { x0 = -10; x1 = 10; }
      var comp = fns.map(function (f) { if (!f) return null; try { var c = math.compile(f.replace(/^y\s*=\s*/i, '')); return function (x) { try { var v = c.evaluate({ x: x }); return typeof v === 'number' ? v : NaN; } catch (e) { return NaN; } }; } catch (e) { return 'err'; } });
      var ys = []; pts.forEach(function (p) { ys.push(p[1]); });
      comp.forEach(function (f) { if (typeof f === 'function') for (var i = 0; i <= 200; i++) { var v = f(x0 + (x1 - x0) * i / 200); if (isFinite(v)) ys.push(v); } });
      var y0 = +$('#gy0').value, y1 = +$('#gy1').value;
      if (!(y1 > y0)) { y0 = ys.length ? Math.min.apply(null, ys) : -10; y1 = ys.length ? Math.max.apply(null, ys) : 10; if (y0 === y1) { y0 -= 1; y1 += 1; } var pad = (y1 - y0) * 0.08; y0 -= pad; y1 += pad; if (y0 > 0 && y0 < (y1 - y0) * 0.5) y0 = 0; }
      if (pts.length && !($('#gx1').value && $('#gx0').value)) { var xs = pts.map(function (p) { return p[0]; }); x0 = Math.min(x0, Math.min.apply(null, xs)); x1 = Math.max(x1, Math.max.apply(null, xs)); }
      var L = 58, R = 16, T = 18, B = 46, X = function (x) { return L + (x - x0) / (x1 - x0) * (W - L - R); }, Y = function (y) { return H - B - (y - y0) / (y1 - y0) * (H - T - B); };
      g.font = '12px Atkinson Hyperlegible, Arial'; g.fillStyle = '#5a6478'; g.strokeStyle = '#e5e7eb'; g.lineWidth = 1;
      var sx = nice(x1 - x0), sy = nice(y1 - y0);
      for (var x = Math.ceil(x0 / sx) * sx; x <= x1 + 1e-9; x += sx) { g.beginPath(); g.moveTo(X(x), T); g.lineTo(X(x), H - B); g.stroke(); g.textAlign = 'center'; g.fillText(+x.toPrecision(6), X(x), H - B + 16); }
      for (var y = Math.ceil(y0 / sy) * sy; y <= y1 + 1e-9; y += sy) { g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(W - R, Y(y)); g.stroke(); g.textAlign = 'right'; g.fillText(+y.toPrecision(6), L - 6, Y(y) + 4); }
      g.strokeStyle = '#334155'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(L, T); g.lineTo(L, H - B); g.lineTo(W - R, H - B); g.stroke();
      if (y0 < 0 && y1 > 0) { g.strokeStyle = '#94a3b8'; g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(W - R, Y(0)); g.stroke(); }
      g.fillStyle = '#172033'; g.textAlign = 'center'; g.font = '600 13px Atkinson Hyperlegible, Arial'; g.fillText($('#gxl').value || 'x', L + (W - L - R) / 2, H - 10);
      g.save(); g.translate(14, T + (H - T - B) / 2); g.rotate(-Math.PI / 2); g.fillText($('#gyl').value || 'y', 0, 0); g.restore();
      g.save(); g.beginPath(); g.rect(L, T, W - L - R, H - T - B); g.clip();
      var info = [];
      comp.forEach(function (f, k) {
        if (f === 'err') { info.push('<span class="bad-t">Function ' + (k + 1) + ': cannot read it</span>'); return; } if (!f) return;
        g.strokeStyle = COLS[k]; g.lineWidth = 2.4; g.beginPath(); var on = false;
        for (var i = 0; i <= 600; i++) { var xv = x0 + (x1 - x0) * i / 600, yv = f(xv); if (!isFinite(yv) || Math.abs(Y(yv)) > 1e5) { on = false; continue; } if (on) g.lineTo(X(xv), Y(yv)); else { g.moveTo(X(xv), Y(yv)); on = true; } }
        g.stroke(); info.push('<span style="color:' + COLS[k] + '">■</span> y = ' + E(fns[k].replace(/^y\s*=\s*/i, '')));
      });
      if (pts.length) {
        g.fillStyle = '#e4572e'; pts.forEach(function (p) { g.beginPath(); g.arc(X(p[0]), Y(p[1]), 4.5, 0, 7); g.fill(); });
        var fr = $('#gfit').checked && fit(pts);
        if (fr) { g.strokeStyle = '#7c3aed'; g.setLineDash([6, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(x0), Y(fr.m * x0 + fr.c)); g.lineTo(X(x1), Y(fr.m * x1 + fr.c)); g.stroke(); g.setLineDash([]);
          info.push('<span style="color:#7c3aed">- -</span> Best fit: y = ' + (+fr.m.toPrecision(4)) + 'x ' + (fr.c < 0 ? '− ' : '+ ') + Math.abs(+fr.c.toPrecision(4)) + ' · gradient ' + (+fr.m.toPrecision(4)) + ' · R² = ' + fr.r2.toFixed(4)); }
        info.push('<span style="color:#e4572e">●</span> ' + pts.length + ' data points');
      }
      g.restore(); $('#ginfo').innerHTML = info.join('<br>') || 'Type a function or paste data, then press Plot.';
    }
    $('#gplot').onclick = draw; $('#gsave').onclick = function () { var a = document.createElement('a'); a.href = gc.toDataURL('image/png'); a.download = 'graph.png'; a.click(); };
    document.querySelectorAll('#graph input, #graph textarea').forEach(function (i) { i.addEventListener('change', draw); });
    window.addEventListener('resize', draw); draw();
  }

  /* ---------- drawing board ---------- */
  var dc = $('#dcanvas');
  if (dc) {
    var ctx, tool = 'pen', color = '#172033', size = 4, grid = false, undo = [], drawing = false, sx0, sy0, snap;
    function setup() {
      var W = dc.clientWidth, H = Math.round(W * 0.66), old = dc.width ? dc.toDataURL() : null; dc.width = W * 2; dc.height = H * 2; dc.style.height = H + 'px';
      ctx = dc.getContext('2d'); ctx.setTransform(2, 0, 0, 2, 0, 0); bg(); if (old) { var im = new Image(); im.onload = function () { ctx.drawImage(im, 0, 0, W, H); }; im.src = old; }
    }
    function bg() { var W = dc.width / 2, H = dc.height / 2; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); if (grid) { ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; for (var x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (var y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } } }
    function pos(e) { var r = dc.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function save() { undo.push(ctx.getImageData(0, 0, dc.width, dc.height)); if (undo.length > 30) undo.shift(); }
    function style() { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = tool === 'hi' ? size * 4 : tool === 'eraser' ? size * 4 : size; ctx.strokeStyle = tool === 'eraser' ? '#fff' : color; ctx.globalAlpha = tool === 'hi' ? 0.3 : 1; ctx.fillStyle = color; }
    function shape(p) {
      ctx.putImageData(snap, 0, 0); ctx.setTransform(2, 0, 0, 2, 0, 0); style(); ctx.beginPath();
      if (tool === 'line' || tool === 'arrow') { ctx.moveTo(sx0, sy0); ctx.lineTo(p[0], p[1]); ctx.stroke();
        if (tool === 'arrow') { var a = Math.atan2(p[1] - sy0, p[0] - sx0), h = 10 + size * 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - h * Math.cos(a - .45), p[1] - h * Math.sin(a - .45)); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - h * Math.cos(a + .45), p[1] - h * Math.sin(a + .45)); ctx.stroke(); } }
      else if (tool === 'rect') ctx.strokeRect(sx0, sy0, p[0] - sx0, p[1] - sy0);
      else if (tool === 'circle') { ctx.ellipse((sx0 + p[0]) / 2, (sy0 + p[1]) / 2, Math.abs(p[0] - sx0) / 2, Math.abs(p[1] - sy0) / 2, 0, 0, 7); ctx.stroke(); }
    }
    dc.addEventListener('pointerdown', function (e) {
      var p = pos(e); save(); dc.setPointerCapture(e.pointerId);
      if (tool === 'text') { var t = prompt('Text to add:'); if (t) { style(); ctx.globalAlpha = 1; ctx.font = (12 + size * 2) + 'px Atkinson Hyperlegible, Arial'; ctx.fillText(t, p[0], p[1]); } return; }
      drawing = true; sx0 = p[0]; sy0 = p[1]; snap = ctx.getImageData(0, 0, dc.width, dc.height); style(); ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    });
    dc.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); if (tool === 'pen' || tool === 'hi' || tool === 'eraser') { ctx.lineTo(p[0], p[1]); ctx.stroke(); } else shape(p); });
    window.addEventListener('pointerup', function () { drawing = false; if (ctx) ctx.globalAlpha = 1; });
    $('#dtools').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool) { tool = b.dataset.tool; $('#dtools').querySelectorAll('[data-tool]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }
      if (b.dataset.col) { color = b.dataset.col; $('#dtools').querySelectorAll('[data-col]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }
      if (b.id === 'dundo' && undo.length) { ctx.putImageData(undo.pop(), 0, 0); ctx.setTransform(2, 0, 0, 2, 0, 0); }
      if (b.id === 'dclear') { save(); bg(); }
      if (b.id === 'dgrid') { grid = !grid; b.setAttribute('aria-pressed', grid); save(); bg(); }
      if (b.id === 'dsave') { var a = document.createElement('a'); a.href = dc.toDataURL('image/png'); a.download = 'drawing.png'; a.click(); }
    });
    $('#dsize').addEventListener('input', function () { size = +this.value; });
    $('#dcol').addEventListener('input', function () { color = this.value; });
    setup(); window.addEventListener('resize', function () { clearTimeout(setup.t); setup.t = setTimeout(setup, 200); });
  }
})();
