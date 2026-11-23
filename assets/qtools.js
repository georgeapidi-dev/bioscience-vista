/* BioscienceVista question tools · tables in questions, answer styles (drop-down, draw a graph, draw a diagram, label a picture) · by BioscienceVista */
(function () {
  var T = window.BVT = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* answer style is kept with the question text as a last line such as [[answer:graph|Temperature / °C|Rate / s⁻¹]] */
  var MARK = /\n?\[\[answer:(dropdown|graph|draw|annotate|audio|video|file)((?:\|[^\]|]*)*)\]\]\s*$/;
  T.MODES = { dropdown: 'Drop-down list', graph: 'Draw a graph', draw: 'Draw a diagram', annotate: 'Label / annotate the picture', audio: 'Record a spoken answer', video: 'Record a video answer', file: 'Upload a file' };
  /* pictures, video, audio, graphs and drawings are kept with the question text as lines such as [[media:%7B%22t%22...%7D]] */
  var MEDIA = /^\[\[media:([^\]]+)\]\]$/;
  function pullMedia(text) { var media = [], keep = String(text).split('\n').filter(function (l) { var m = MEDIA.exec(l.trim()); if (!m) return true; try { media.push(JSON.parse(decodeURIComponent(m[1]))); } catch (e) {} return false; }); return { text: keep.join('\n').replace(/\s+$/, ''), media: media }; }
  T.parse = function (prompt) {
    var p = String(prompt || ''), m = MARK.exec(p), out;
    if (!m) { out = pullMedia(p); return { text: out.text, media: out.media, mode: '', x: '', y: '' }; }
    var bits = m[2].split('|').slice(1); out = pullMedia(p.slice(0, m.index));
    return { text: out.text, media: out.media, mode: m[1], x: bits[0] || '', y: bits[1] || '' };
  };
  T.mediaLines = function (media) { return (media || []).filter(Boolean).map(function (x) { return '[[media:' + encodeURIComponent(JSON.stringify(x)) + ']]'; }).join('\n'); };
  T.join = function (text, mode, x, y, media) {
    var pr = T.parse(text); text = pr.text;   // never stack two markers; media kept unless new media are given
    var ml = T.mediaLines(media || pr.media); if (ml) text += '\n' + ml;
    if (!mode) return text;
    return text + '\n[[answer:' + mode + (mode === 'graph' ? '|' + String(x || '').replace(/[|\]]/g, '') + '|' + String(y || '').replace(/[|\]]/g, '') : '') + ']]';
  };
  T.text = function (prompt) { return T.parse(prompt).text; };

  /* question text → HTML: **bold**, line breaks and tables written as | a | b | rows */
  function fmt(s) { return E(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/__(\S(?:.*?\S)?)__/g, '<u>$1</u>').replace(/(^|[^*\w])\*(?![\s*])([^*\n]*?[^\s*])\*(?![\w*])/g, '$1<i>$2</i>').replace(/\^(\S+?)\^/g, '<sup>$1</sup>').replace(/~(\S+?)~/g, '<sub>$1</sub>'); }
  T.fmt = fmt;   /* **bold**, *italic*, __underline__, ^superscript^, ~subscript~ */
  function isRow(l) { return /^\s*\|.*\|\s*$/.test(l); }
  function cells(l) { return l.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); }
  T.table = function (lines) {
    var sep = function (l) { return /-/.test(l) && /^\s*\|?[\s:\-|]+\|?\s*$/.test(l); };
    var rows = lines.filter(function (l) { return !sep(l); }).map(cells), head = lines.length > 1 && sep(lines[1]);
    return '<div class="qtable-wrap"><table class="qtable">' + rows.map(function (r, i) { var tag = head && i === 0 ? 'th' : 'td'; return '<tr>' + r.map(function (c) { return '<' + tag + '>' + (c ? fmt(c) : '&nbsp;') + '</' + tag + '>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
  };
  /* data written as "Temperature / °C | 10 | 20 | 30" lines (no outer bars): two or more such lines in a row with the same number of cells
     are a table too, shown with a header row (16 Nov 2026, admin: put tables in all questions that need them) */
  function loose(l) { return l.indexOf('|') >= 0 && !(/^\s*\|/.test(l) && /\|\s*$/.test(l)) && !/\[\[/.test(l) && l.trim().length > 2 ? l.split('|').length : 0; }
  function tidy(lines) {
    var out = lines.slice();
    for (var i = 0; i < out.length; i++) {
      var n = loose(out[i]); if (!n) continue;
      var j = i; while (j + 1 < out.length && loose(out[j + 1]) === n) j++;
      if (j > i) { for (var k = i; k <= j; k++) out[k] = '| ' + out[k].trim() + ' |'; out.splice(i + 1, 0, '|' + new Array(n + 1).join(' --- |')); i = j + 1; }
    }
    return out;
  }
  var SEEN = {}, SEENT = 0;
  T.rich = function (prompt, inline) {
    var lines = tidy(T.text(prompt).split('\n')), out = [], buf = [], para = [], tAt = -1;
    function flushP() { if (para.length) { out.push(inline && !out.length ? para.map(fmt).join('<br>') : '<span class="qp">' + para.map(fmt).join('<br>') + '</span>'); para = []; } }
    lines.forEach(function (l) {
      if (isRow(l)) { flushP(); buf.push(l); return; }
      if (buf.length) { out.push(T.table(buf)); buf = []; if (tAt < 0) tAt = out.length; }
      if (!l.trim()) { flushP(); return; }
      para.push(l);
    });
    flushP(); if (buf.length) { out.push(T.table(buf)); if (tAt < 0) tAt = out.length; }
    // a table of numbers also gets a graph of the data, unless the question asks the student to plot or draw it
    var raw = String(prompt || '');
    if (!/\[\[answer:graph|\b(plot|plotting|sketch|draw|drawing|construct)\b|your graph|bar chart|histogram/i.test(raw)) {
      var tl = [], done = false; lines.forEach(function (l) { if (done) return; if (isRow(l)) tl.push(l); else if (tl.length) done = true; });
      var sig = tl.join('\n'), now = Date.now(); if (now - SEENT > 2000) SEEN = {}; SEENT = now;   // parts (a), (b), (c) repeat the same data: draw its graph once per page
      var g = SEEN[sig] ? null : T.autoGraph(tl); if (g) SEEN[sig] = 1; if (g) out.splice(tAt < 0 ? out.length : tAt, 0, '<figure class="qm qm-graph qm-auto">' + T.graphSvg(g) + '<figcaption>Graph of the data in the table</figcaption></figure>');   // straight under its table
    }
    var md = T.parse(prompt).media; if (md.length) out.push(T.mediaHtml(md));
    return out.join('');
  };
  /* a graph spec from table rows, or null: columns (x then series) or rows (x row first, then series rows) of numbers */
  T.autoGraph = function (tl) {
    var sep = function (l) { return /-/.test(l) && /^\s*\|?[\s:\-|]+\|?\s*$/.test(l); };
    var R = tl.filter(function (l) { return !sep(l); }).map(cells); if (R.length < 2) return null;
    var isN = function (v) { return /^[-+−]?\d+(?:[.,]\d+)?$/.test(String(v).replace(/\s/g, '').replace('−', '-')); }, nv = function (v) { return String(v).replace(/\s/g, '').replace('−', '-').replace(',', '.'); };
    var cols = function (M) {   // M[0] = header; M[1..] data rows: x in column 0, numeric columns are series
      var data = M.slice(1); if (data.length < 3) return null;
      var ser = []; for (var k = 1; k < M[0].length; k++) if (data.every(function (r) { return isN(r[k]); })) ser.push(k);
      if (!ser.length || ser.length > 6) return null;
      var unit = function (h) { var m = /\/\s*(.+)$|\(([^)]+)\)\s*$/.exec(String(h)); return m ? (m[1] || m[2]).trim() : ''; };
      if (ser.length > 1 && ser.some(function (k) { return unit(M[0][k]) !== unit(M[0][ser[0]]); })) ser = [ser[ser.length - 1]];   // different units: graph the last measured column only
      var xnum = data.every(function (r) { return isN(r[0]); });
      return { t: 'graph', kind: xnum ? 'line' : 'bar', x: M[0][0], y: ser.length === 1 ? M[0][ser[0]] : '', series: ser.length > 1 ? ser.map(function (k) { return M[0][k]; }) : [''],
        rows: data.map(function (r) { return [xnum ? nv(r[0]) : r[0]].concat(ser.map(function (k) { return nv(r[k]); })); }), zero: !xnum ? true : undefined };
    };
    var g = cols(R);
    if (!g && R.length <= 6 && R[0].length >= 4) { var T2 = R[0].map(function (_, j) { return R.map(function (r) { return r[j]; }); }); g = cols(T2); }   // data written across the rows
    return g;
  };
  /* a question's picture (questions.image_url); "#cap=…" at the end of the address is its caption */
  T.fig = function (url, alt, h) {
    var u = String(url || ''), m = /#cap=([^#]*)$/.exec(u), cap = ''; if (m) { try { cap = decodeURIComponent(m[1]); } catch (e) {} u = u.slice(0, m.index); }
    var src = safe(u) || (u.charAt(0) === '/' ? u : ''); if (!src) return '';
    return '<figure class="qm qm-img qfig"><img src="' + E(src) + '" alt="' + E(cap || alt || 'Diagram for this question') + '" loading="lazy" style="max-width:100%;max-height:' + (h || 420) + 'px;border-radius:8px">' + (cap ? '<figcaption>' + E(cap) + '</figcaption>' : '') + '</figure>';
  };
  T.media = function (prompt) { return T.parse(prompt).media; };
  /* a choice can be a picture: "[[img:https://…]] optional words" */
  var OPTIMG = /^\s*\[\[img:(\S+?)\]\]\s*([\s\S]*)$/;
  T.optPic = function (o) { var m = OPTIMG.exec(String(o || '')); return m ? { src: m[1], text: m[2] } : null; };
  T.opt = function (o) { var m = T.optPic(o); if (!m) return E(o); var src = safe(m.src); return (src ? '<img class="qopt-img" src="' + E(src) + '" alt="' + E(m.text || 'Picture choice') + '" loading="lazy">' : '') + (m.text ? '<span class="qopt-cap">' + E(m.text) + '</span>' : ''); };
  T.optText = function (o) { var m = T.optPic(o); return m ? (m.text || 'the picture') : String(o == null ? '' : o); };

  /* ---------- media in questions: picture, video (YouTube or a file), audio, graph from data, drawing ---------- */
  var YT = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/;
  T.ytId = function (u) { var m = YT.exec(String(u || '')); return m ? m[1] : ''; };
  var safe = function (u) { u = String(u || ''); return /^(https?:\/\/|data:image\/)/.test(u) ? u : ''; };
  T.mediaHtml = function (list) {
    return '<div class="qmedia">' + (list || []).map(function (m) {
      var cap = m.cap ? '<figcaption>' + fmt(m.cap) + '</figcaption>' : '', src = safe(m.src);
      if (m.t === 'image' || m.t === 'drawing') return src ? '<figure class="qm qm-img"><img src="' + E(src) + '" alt="' + E(m.alt || m.cap || 'Picture for this question') + '" loading="lazy">' + cap + '</figure>' : '';
      if (m.t === 'video') { var y = T.ytId(src); return y ? '<figure class="qm qm-vid"><div class="qm-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + y + '?rel=0' + (m.start ? '&start=' + (+m.start | 0) : '') + '" title="' + E(m.cap || 'Video for this question') + '" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' + cap + '</figure>'
        : src ? '<figure class="qm qm-vid"><video controls preload="metadata" playsinline src="' + E(src) + '"></video>' + cap + '</figure>' : ''; }
      if (m.t === 'audio') return src ? '<figure class="qm qm-aud"><span aria-hidden="true">🔊</span><audio controls preload="metadata" src="' + E(src) + '"></audio>' + cap + '</figure>' : '';
      if (m.t === 'graph') return '<figure class="qm qm-graph">' + T.graphSvg(m) + cap + '</figure>';
      return '';
    }).join('') + '</div>';
  };
  /* a graph drawn from a small data table: line, bar or scatter; several series; axes with units */
  var COLS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777'];
  function nice(lo, hi) {
    if (!(hi > lo)) { hi = lo + 1; } var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / 5))), f = span / 5 / step;
    step *= f > 5 ? 10 : f > 2 ? 5 : f > 1 ? 2 : 1; return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step, step: step };
  }
  var num = function (v) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  var lab = function (n) { return Math.abs(n) >= 1e5 || (Math.abs(n) < 1e-3 && n) ? n.toExponential(1) : +n.toFixed(6) + ''; };
  T.graphSvg = function (g) {
    var rows = (g.rows || []).filter(function (r) { return r && r.length > 1 && String(r[0]).trim() !== ''; }), ser = (g.series && g.series.length ? g.series : ['']).slice(0, 6), kind = g.kind || 'line';
    var W = 640, H = 380, L = 70, R = 18, Tp = g.title ? 34 : 16, B = 58, pw = W - L - R, ph = H - Tp - B;
    if (!rows.length) return '<p class="small muted">(No data for this graph yet.)</p>';
    var xs = rows.map(function (r) { return num(r[0]); }), cat = kind === 'bar' || xs.some(function (x) { return x == null; });
    var ys = []; rows.forEach(function (r) { ser.forEach(function (s, k) { var v = num(r[k + 1]); if (v != null) ys.push(v); }); });
    var yr = nice(Math.min(0, Math.min.apply(null, ys.length ? ys : [0])), Math.max.apply(null, ys.length ? ys : [1]));
    var xr = cat ? null : nice(g.zero === false ? Math.min.apply(null, xs) : Math.min(0, Math.min.apply(null, xs)), Math.max.apply(null, xs));
    var X = function (i) { return cat ? L + pw * (i + 0.5) / rows.length : L + pw * (xs[i] - xr.lo) / (xr.hi - xr.lo); }, Y = function (v) { return Tp + ph - ph * (v - yr.lo) / (yr.hi - yr.lo); };
    var o = '<svg class="qgraph" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E((g.title || 'Graph') + ': ' + (g.y || 'y') + ' against ' + (g.x || 'x')) + '" style="width:100%;max-width:640px;height:auto;background:#fff;border-radius:10px;border:1px solid #e2e8f0">';
    if (g.title) o += '<text x="' + (W / 2) + '" y="22" text-anchor="middle" font-size="15" font-weight="700" fill="#172033">' + E(g.title) + '</text>';
    for (var v = yr.lo; v <= yr.hi + yr.step / 2; v += yr.step) { var yy = Y(v); o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="#e2e8f0"/><text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="#475569">' + lab(v) + '</text>'; }
    if (cat) rows.forEach(function (r, i) { o += '<text x="' + X(i) + '" y="' + (Tp + ph + 16) + '" text-anchor="middle" font-size="11" fill="#475569">' + E(String(r[0]).slice(0, 14)) + '</text>'; });
    else for (var u = xr.lo; u <= xr.hi + xr.step / 2; u += xr.step) { var xx = L + pw * (u - xr.lo) / (xr.hi - xr.lo); o += '<line x1="' + xx + '" x2="' + xx + '" y1="' + Tp + '" y2="' + (Tp + ph) + '" stroke="#f1f5f9"/><text x="' + xx + '" y="' + (Tp + ph + 16) + '" text-anchor="middle" font-size="11" fill="#475569">' + lab(u) + '</text>'; }
    o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(Math.max(yr.lo, 0)) + '" y2="' + Y(Math.max(yr.lo, 0)) + '" stroke="#334155" stroke-width="1.5"/><line x1="' + L + '" x2="' + L + '" y1="' + Tp + '" y2="' + (Tp + ph) + '" stroke="#334155" stroke-width="1.5"/>';
    ser.forEach(function (s, k) {
      var c = COLS[k % COLS.length], pts = rows.map(function (r, i) { var val = num(r[k + 1]); return val == null ? null : [X(i), Y(val)]; });
      if (kind === 'bar') { var bw = pw / rows.length * 0.8 / ser.length; pts.forEach(function (p, i) { if (!p) return; var x0 = L + pw * i / rows.length + pw / rows.length * 0.1 + bw * k, y0 = Y(Math.max(yr.lo, 0)); o += '<rect x="' + x0 + '" y="' + Math.min(p[1], y0) + '" width="' + bw + '" height="' + Math.abs(y0 - p[1]) + '" fill="' + c + '" rx="2"/>'; }); }
      else { var ok = pts.filter(Boolean); if (kind === 'line' && ok.length > 1) o += '<polyline fill="none" stroke="' + c + '" stroke-width="2.4" points="' + ok.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
        ok.forEach(function (p) { o += kind === 'scatter' ? '<g stroke="' + c + '" stroke-width="2.2"><line x1="' + (p[0] - 5) + '" y1="' + (p[1] - 5) + '" x2="' + (p[0] + 5) + '" y2="' + (p[1] + 5) + '"/><line x1="' + (p[0] - 5) + '" y1="' + (p[1] + 5) + '" x2="' + (p[0] + 5) + '" y2="' + (p[1] - 5) + '"/></g>' : '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="' + c + '"/>'; }); }
    });
    o += '<text x="' + (L + pw / 2) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#172033">' + E(g.x || '') + '</text>';
    o += '<text transform="translate(16 ' + (Tp + ph / 2) + ') rotate(-90)" text-anchor="middle" font-size="13" font-weight="600" fill="#172033">' + E(g.y || '') + '</text>';
    if (ser.length > 1 || ser[0]) o += ser.map(function (s, k) { return '<g transform="translate(' + (L + 10 + k * 120) + ' ' + (Tp + 8) + ')"><rect width="12" height="12" rx="2" fill="' + COLS[k % COLS.length] + '"/><text x="16" y="10" font-size="11" fill="#172033">' + E(String(s).slice(0, 16)) + '</text></g>'; }).join('');
    return o + '</svg>';
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
    st.textContent = '.qtable-wrap{overflow-x:auto;margin:.5em 0}.qtable{border-collapse:collapse;min-width:50%;font-size:.95em;background:var(--card,#fff)}.qtable th,.qtable td{border:1px solid var(--line,#cfd6e2);padding:6px 10px;text-align:left;vertical-align:top}.qtable th{background:var(--tint,#eef4ff);font-weight:700}.qtable td:first-child{font-weight:600;background:#f8fafc}.qtable td,.qtable th{text-align:center}.qtable td:first-child,.qtable th:first-child{text-align:left}' +
      '.qp{display:block;margin:.25em 0}.dtools{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.dtools button{border:1px solid var(--line,#d6dbe4);background:var(--card,#fff);border-radius:8px;padding:5px 9px;cursor:pointer;font:inherit}.dtools button[aria-pressed=true]{background:#2563eb;color:#fff;border-color:#2563eb}.dcol{display:inline-flex;gap:2px}.dcol button{font-size:18px;padding:2px 7px}.dcol button[aria-pressed=true]{background:#e0e7ff!important;color:inherit}' +
      'select.qdrop{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid var(--line,#d6dbe4);min-width:260px;max-width:100%}' +
      '.fbbox{display:grid;gap:8px;margin:.5em 0}.fbp{border-left:4px solid var(--line,#d6dbe4);padding:4px 10px;border-radius:4px}.fbp b{display:block;margin-bottom:2px}.fbp ul{margin:0;padding-left:20px}.fbp p{margin:2px 0}' +
      '.fbp.good{border-color:#16a34a;background:rgba(22,163,74,.07)}.fbp.miss{border-color:#dc2626;background:rgba(220,38,38,.06)}.fbp.why{border-color:#2563eb;background:rgba(37,99,235,.06)}' +
      '.fbp.imp{border-color:#d97706;background:rgba(217,119,6,.07)}.fbp.next{border-color:#7c3aed;background:rgba(124,58,237,.06)}.fbp.tc{border-color:#0f766e;background:rgba(15,118,110,.07)}' +
      '.fbsrc{font-size:.8em;color:var(--muted,#64748b);margin:2px 0 0}.fbstaff{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin:.5em 0}.fbcol{border:1px solid var(--line,#d6dbe4);border-radius:10px;padding:8px 10px;display:grid;gap:6px}';
    document.head.appendChild(st);
  }
})();

/* Tools inside the question (admin's rule, Nov 2026): a question that asks for a graph, a drawing or a table carries the tool for it.
   - BVT.needs(text)   which tools a question asks for: graph, draw, table
   - BVT.detect(text)  a question that asks ONLY for a graph or a drawing: in the Assessment centre its answer is the drawing itself
   - BVT.tableTool(ta) a table builder under an answer box; the finished table is written into the answer, so it is saved and marked with it
   - lessons: every question that needs one gets the tool under its answer box; MYP lessons show the criterion (A to D) of every step */
(function () {
  var T = window.BVT; if (!T) return;
  var RX = {
    graph: /\b(plot|sketch|draw|construct|present)\b[^.?!]{0,70}\b(graph|line of best fit|best[- ]fit line|bar chart|histogram|curve|box[- ]and[- ]whisker|scatter ?(graph|diagram|plot)|pie chart|waveforms?|distribution)\b|\bgraph (the|your|these|this) (data|results)\b|\bsketch how\b[^.?!]{0,90}\bchang/i,
    table: /\b(construct|draw|design|make|create|prepare|copy and complete)\b[^.?!]{0,60}\btable\b|\b(record|present|organi[sz]e|put)\b[^.?!]{0,70}\bin a (suitable |results |data |neat )?table\b|\b(results|data) table\b/i,
    draw: /\b(draw|sketch)\b(?![^.?!]{0,70}\b(graph|table|conclusion|line of best fit|chart|curve|histogram)\b)[^.?!]{0,90}\b(diagram|formulae?|repeat unit|monomers?|polymer|isomers?|enantiomers?|zwitterions?|curly arrows?|mechanism|energy profile|cladogram|nucleotides?|dna|dipeptide|peptide|pyramid|net|circle|triangle|shape|symbol|logo|product|section|moon|waveform|labell?ed|label|cell|circuit|apparatus|structure|particles?|arrangement|ray|wave|molecule|atom|food (chain|web)|flower|picture|model|set-?up|punnett|cross)\b|\blabell?ed diagram\b|\bdraw and label\b/i
  };
  T.needs = function (text) { var t = String(text || ''), out = []; ['graph', 'table', 'draw'].forEach(function (k) { if (RX[k].test(t)) out.push(k); }); return out; };
  T.detect = function (text) {   // only a drawing is asked for: nothing to explain, describe, state or calculate in words
    var t = String(text || ''), n = T.needs(t);
    if (/\b(explain|describe|state|suggest|calculate|evaluate|discuss|outline|compare|identify|justify|why|what|which|how)\b/i.test(t)) return '';
    return n.indexOf('graph') >= 0 ? 'graph' : n.indexOf('draw') >= 0 ? 'draw' : '';
  };
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }
  function fire(ta) { try { ta.dispatchEvent(new Event('input', { bubbles: true })); ta.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }
  var OPEN = '[Table]', CLOSE = '[End of table]';
  function readTable(v) {   // the table already in the answer, if there is one
    var a = v.indexOf(OPEN), b = v.indexOf(CLOSE); if (a < 0 || b < a) return null;
    return v.slice(a + OPEN.length, b).split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { return l.split('|').map(function (c) { return c.trim(); }); });
  }
  T.tableTool = function (ta) {
    var box = el('div', 'border:1px solid var(--line,#cbd5e1);border-radius:10px;padding:10px;margin:8px 0;background:var(--card,#fff)');
    var data = readTable(ta.value) || [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
    function draw() {
      var cols = Math.max.apply(null, data.map(function (r) { return r.length; }));
      data.forEach(function (r) { while (r.length < cols) r.push(''); });
      box.innerHTML = '<p class="small" style="margin:0 0 6px"><b>▦ Table tool</b> · The first row is for your headings: write the quantity and its unit, for example "Time / s".</p>' +
        '<div style="overflow-x:auto"><table style="border-collapse:collapse">' + data.map(function (r, i) { return '<tr>' + r.map(function (c, j) {
          return '<td style="border:1px solid #94a3b8;padding:0"><input data-r="' + i + '" data-c="' + j + '" value="' + String(c).replace(/"/g, '&quot;') + '" aria-label="Row ' + (i + 1) + ', column ' + (j + 1) + '" style="border:0;padding:6px 8px;width:9.5em;font:inherit;' + (i ? '' : 'font-weight:700;background:#eff6ff') + '"></td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
        '<p style="margin:8px 0 0;display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-a="row">＋ Row</button><button type="button" class="btn sm" data-a="col">＋ Column</button><button type="button" class="btn sm" data-a="rrow">− Row</button><button type="button" class="btn sm" data-a="rcol">− Column</button><button type="button" class="btn main sm" data-a="put">Add the table to my answer</button></p><p class="small muted" data-m style="margin:4px 0 0"></p>';
      box.querySelectorAll('input').forEach(function (i) { i.oninput = function () { data[+i.getAttribute('data-r')][+i.getAttribute('data-c')] = i.value.replace(/[|\n]/g, ' '); }; });
      box.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-a');
        if (a === 'row' && data.length < 30) data.push(data[0].map(function () { return ''; }));
        if (a === 'col' && data[0].length < 8) data.forEach(function (r) { r.push(''); });
        if (a === 'rrow' && data.length > 2) data.pop();
        if (a === 'rcol' && data[0].length > 1) data.forEach(function (r) { r.pop(); });
        if (a === 'put') {
          var rows = data.filter(function (r) { return r.some(function (c) { return c.trim(); }); });
          if (rows.length < 2) { box.querySelector('[data-m]').textContent = 'Fill in the headings and at least one row first.'; return; }
          var block = OPEN + '\n' + rows.map(function (r) { return r.join(' | '); }).join('\n') + '\n' + CLOSE, v = ta.value, i0 = v.indexOf(OPEN), i1 = v.indexOf(CLOSE);
          ta.value = i0 >= 0 && i1 > i0 ? v.slice(0, i0) + block + v.slice(i1 + CLOSE.length) : (v.replace(/\s+$/, '') + (v.trim() ? '\n' : '') + block);
          fire(ta); draw(); box.querySelector('[data-m]').textContent = 'Your table is in your answer. Change the table here and press the button again to update it.'; return;
        }
        draw(); }; });
    }
    draw(); return box;
  };
  /* one row of tool buttons under an answer box; each opens its tool inside the question */
  T.attachTools = function (ta, text, key) {
    if (!ta || ta.getAttribute('data-tools')) return; var need = T.needs(text); if (!need.length) return;
    ta.setAttribute('data-tools', need.join(' '));
    var bar = el('div', 'margin:6px 0 2px;display:flex;gap:6px;flex-wrap:wrap;align-items:center', '<span class="small"><b>Tools for this question:</b></span>'), host = el('div');
    var NAME = { graph: '📈 Graph tool', draw: '✏️ Drawing tool', table: '▦ Table tool' }, open = {};
    need.forEach(function (k) {
      var b = el('button', '', NAME[k]); b.type = 'button'; b.className = 'btn sm'; b.setAttribute('aria-expanded', 'false');
      b.onclick = function () {
        if (open[k]) { open[k].hidden = !open[k].hidden; b.setAttribute('aria-expanded', String(!open[k].hidden)); return; }
        var w = el('div', 'margin:8px 0'); host.appendChild(w); open[k] = w; b.setAttribute('aria-expanded', 'true');
        if (k === 'table') { w.appendChild(T.tableTool(ta)); return; }
        var sk = 'bv-pad:' + location.pathname + ':' + key + ':' + k, saved = ''; try { saved = localStorage.getItem(sk) || ''; } catch (e) {}
        var note = k === 'graph' ? '[My graph is drawn in the graph tool.]' : '[My diagram is drawn in the drawing tool.]';
        var what = k === 'graph' ? 'graph' : 'drawing';
        w.innerHTML = '<div data-padhost></div><p class="small muted" data-sent style="margin:4px 0 0">Your ' + what + ' is saved as you work.</p>';
        var sent = w.querySelector('[data-sent]'), timer = null;
        function send() {   // the picture goes to the teacher with the student's sign-in (table lesson_drawings, migration 035); until then it stays on this device
          var d = ''; try { d = pad && pad.get && pad.get(); } catch (e) {} if (!d) return;
          var db = window.BV_LDB; if (!db) { sent.textContent = 'Your ' + what + ' is kept on this device.'; return; }
          db.auth.getSession().then(function (r) {
            if (!(r.data && r.data.session)) { sent.textContent = 'Your ' + what + ' is kept on this device. Sign in to send it to your teacher.'; return; }
            var lesson = String(window.LESSON_ID || (window.SPEC && window.SPEC.id) || location.pathname.replace(/\//g, '') || 'lesson').slice(0, 60);
            return db.from('lesson_drawings').upsert({ lesson: lesson, path: location.pathname.slice(0, 120), qkey: String(key).slice(0, 60), kind: k === 'graph' ? 'graph' : 'draw', label: String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300), image: d, updated_at: new Date().toISOString() }, { onConflict: 'student_id,lesson,qkey,kind' })
              .then(function (x) { sent.textContent = x.error ? 'Your ' + what + ' is kept on this device (it could not be sent just now).' : '✓ Your ' + what + ' was sent to your teacher at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '.'; });
          }).then(null, function () { sent.textContent = 'Your ' + what + ' is kept on this device (it could not be sent just now).'; });
        }
        var pad = T.pad(w.querySelector('[data-padhost]'), { mode: k === 'graph' ? 'graph' : 'draw', value: saved, onchange: function () {
          try { var d = pad && pad.get && pad.get(); if (d) localStorage.setItem(sk, d); } catch (e) {}
          sent.textContent = 'Saving your ' + what + '…'; clearTimeout(timer); timer = setTimeout(send, 1500);
          if (ta.value.indexOf(note) < 0) { ta.value = ta.value.replace(/\s+$/, '') + (ta.value.trim() ? '\n' : '') + note; fire(ta); } } });
      };
      bar.appendChild(b);
    });
    ta.parentNode.insertBefore(bar, ta.nextSibling); bar.parentNode.insertBefore(host, bar.nextSibling);
  };

  /* Grading scales (admin's rule): MYP work is reported as a level 1 to 8, IB Diploma work as a grade 1 to 7.
     MYP: eight equal bands of the marks (0 marks = level 0). Diploma: the school's boundaries 20, 30, 44, 54, 64 and 77 %. */
  /* Grades. Each teacher sets their own boundaries for IB HL, IB SL and MYP (Grade boundaries tab; table grade_boundaries, migration 041).
     A student sees grades from the boundaries of their own class's teacher; until a teacher saves any, the defaults below apply. */
  T.DEFAULT_BOUNDS = { HL: [14, 26, 38, 49, 60, 72], SL: [14, 26, 38, 49, 60, 72], MYP: [1, 13, 26, 38, 51, 63, 76, 88] };   // minimum % for IB grades 2–7, and for MYP levels 1–8
  T.BOUNDS = { HL: T.DEFAULT_BOUNDS.HL, SL: T.DEFAULT_BOUNDS.SL, MYP: T.DEFAULT_BOUNDS.MYP }; T.MYLEVEL = null;
  T.scaleOf = function (label) {
    var t = String(label || '');
    if (t === 'MYP' || t === 'DP' || t === 'HL' || t === 'SL') return t;
    if (/\bMYP\b|\bGrade\s*(6|7|8|9|10)\b|^\/?g(6|7|8|9|10)-|^G(6|7|8|9|10)-|^\/?(leafdisc|review|classification|separating-mixtures-2)\b/i.test(t)) return 'MYP';
    var hl = /\bHL\b|\(HL\)|\bHigher Level\b/.test(t), sl = /\bSL\b|\bStandard Level\b/.test(t);
    if (hl && !sl) return 'HL'; if (sl && !hl) return 'SL';
    if (/\bIB\b|\bDP\s?[12]?\b|Diploma|\b(SL|HL)\b|^\s*(Theme\s+)?[A-D][1-4]\.[1-4]\b|\b(Structure|Reactivity)\s+\d|^\/?[abcd]\d\d-lesson|^\/?(chem|phys|ess|maths)-/i.test(t)) return 'DP';
    return '';
  };
  T.level = function (score, max, scale) {
    scale = T.scaleOf(scale); if (!scale || !(max > 0) || score == null || isNaN(score)) return null;
    var p = 100 * score / max;
    if (scale === 'MYP') { var m = 0; T.BOUNDS.MYP.forEach(function (b) { if (p >= b) m++; }); return { n: m, of: 8, name: 'MYP level' }; }
    if (scale === 'DP') scale = T.MYLEVEL || 'HL';   // not labelled HL or SL: the student's own level
    var n = 1; T.BOUNDS[scale].forEach(function (b) { if (p >= b) n++; }); return { n: n, of: 7, name: 'IB grade' };
  };
  T.levelPill = function (score, max, label) {
    var l = T.level(+score, +max, label);
    return l ? ' <span class="pill bv-grade" data-g="' + String([+score, +max, String(label || '').slice(0, 300)].join('\u0001')).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }) + '" style="background:#ede9fe;color:#5b21b6;font-weight:700">' + l.name + ' ' + l.n + ' of ' + l.of + '</span>' : '';
  };
  function refreshPills() {   // grades already on the page are redrawn once the teacher's boundaries have arrived
    document.querySelectorAll('.bv-grade[data-g]').forEach(function (el) {
      var g = el.getAttribute('data-g').split('\u0001'), l = T.level(+g[0], +g[1], g[2]); if (l) el.textContent = l.name + ' ' + l.n + ' of ' + l.of;
    });
  }
  T.setBounds = function (b) {
    b = b || {}; ['HL', 'SL', 'MYP'].forEach(function (k) { T.BOUNDS[k] = Array.isArray(b[k]) && b[k].length === T.DEFAULT_BOUNDS[k].length ? b[k].map(Number) : T.DEFAULT_BOUNDS[k]; });
    T.MYLEVEL = b.level === 'HL' || b.level === 'SL' ? b.level : null; refreshPills();
  };
  T.loadBounds = function (force) {
    var db = (window.BVS && window.BVS.db) || window.BV_LDB; if (!db || !db.rpc) return Promise.resolve(T.BOUNDS);
    if (!force) { try { var c = JSON.parse(sessionStorage.getItem('bv-bounds') || 'null'); if (c && Date.now() - c.t < 600000) { T.setBounds(c.b); return Promise.resolve(T.BOUNDS); } } catch (e) {} }
    return db.rpc('my_grade_boundaries').then(function (r) {
      if (r.error || !r.data) return T.BOUNDS;
      try { sessionStorage.setItem('bv-bounds', JSON.stringify({ t: Date.now(), b: r.data })); } catch (e) {}
      T.setBounds(r.data); return T.BOUNDS;
    }, function () { return T.BOUNDS; });
  };
  setTimeout(function () { T.loadBounds(); }, 300);   // after the page's own sign-in client is ready

  /* ---- lesson pages ---- */
  if (!document.querySelector('section.step, [data-save]') || document.getElementById('qf')) return;
  /* "In your book" (23 Nov 2026): lessons built by hand get the same box as generated ones. Books hold notes, a summary and a
     simple diagram; answers are typed and saved in the lesson. */
  (function book() {
    if (document.getElementById('bv-book') || !document.querySelector('section.step')) return;
    document.querySelectorAll('h3').forEach(function (h) { if (/^\s*In your book, then here\s*$/i.test(h.textContent)) h.textContent = 'Your answers'; });
    var h1 = document.querySelector('h1'), title = h1 ? h1.textContent.trim() : document.title.split('·')[0].trim(), objs = 0, terms = '';
    var oh = [].slice.call(document.querySelectorAll('h2, h3, b, strong')).filter(function (x) { return /by the end of this lesson|learning objectives|lesson objectives|^\s*objectives/i.test(x.textContent); })[0];
    if (oh) { var ul = oh.parentNode.querySelector('ul, ol'); if (ul) objs = ul.children.length; }
    var kt = [].slice.call(document.querySelectorAll('div, p')).filter(function (x) { return /^\s*Key terms/i.test(x.textContent) && x.textContent.length < 600; }).pop();
    if (kt) terms = kt.textContent.replace(/^\s*Key terms[^:]*:\s*/i, '').split(/\s*[·,;]\s*/).slice(0, 8).join(', ');
    var w = document.querySelector('details.worked summary'), f = document.querySelector('figure figcaption');
    var dia = w ? 'A flow chart of “' + w.textContent.replace(/^.*?:\s*/, '') + '”: one box for each step, joined by arrows.'
      : f ? 'A simple labelled sketch: ' + f.textContent.replace(/^Figure \d+\s*·\s*/, '').replace(/\.$/, '') + '. Pencil, 4–6 labels, no shading.'
      : 'A simple flow chart or spider diagram linking the key ideas of the lesson.';
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var box = document.createElement('section'); box.className = 'card'; box.id = 'bv-book';
    box.style.cssText = 'border-left:8px solid #0d9488;background:#f0fdfa;color:#1f2937';
    box.innerHTML = '<h3 style="margin:0 0 6px">📓 In your book</h3><p class="small" style="margin:0 0 8px">Your book is for notes, not answers. Type your answers in the lesson: they are saved and marked here. Write only this, neatly, on a new page:</p><ol style="margin:0;padding-left:1.3em">' +
      '<li><b>Date and title:</b> ' + esc(title) + '</li><li><b>Lesson objectives:</b> copy ' + (objs ? 'the ' + objs + ' objectives' : 'the objectives') + ' at the top of the lesson.</li>' +
      (terms ? '<li><b>Key terms:</b> ' + esc(terms) + ', each with a one-line meaning.</li>' : '') +
      '<li><b>Short notes:</b> 3–5 bullet points in your own words from the lesson notes.</li><li><b>Summary:</b> two or three sentences on the big idea of the lesson.</li><li><b>Diagram:</b> ' + esc(dia) + '</li></ol>';
    var anchor = oh && oh.closest('.card, section, div'), first = document.querySelector('section.step');
    if (anchor && anchor !== document.body && !anchor.closest('section.step')) anchor.parentNode.insertBefore(box, anchor.nextSibling); else first.parentNode.insertBefore(box, first);
  })();
  function qText(ta) { var q = ta.closest('.q, .question, li, fieldset'), l = q && q.querySelector('.ql, legend, label, p'); return l ? l.textContent : (q ? q.textContent.slice(0, 400) : ''); }
  function scan() {
    document.querySelectorAll('textarea[data-save]').forEach(function (ta) { if (!ta.closest('.bv-rep, .bv-tans') && !ta.disabled) T.attachTools(ta, qText(ta), ta.getAttribute('data-save')); });
    if (window.BV_MYP) criteria();
  }
  /* MYP: every step shows the criterion it works on. A lesson that already names its criteria keeps its own labels. */
  var CRIT = { A: 'Knowing and understanding', B: 'Inquiring and designing', C: 'Processing and evaluating', D: 'Reflecting on the impacts of science' };
  function infer(t) {
    var c = [];
    if (/\b(hypothes|variable|plan (a|an|your)|design (a|an|your)|method|research question|fair test|predict|independent|dependent|control)/i.test(t)) c.push('B');
    if (/\b(table|graph|plot|calculate|data|results|conclusion|pattern|trend|anomal|reliab|valid|improve|evaluate the (method|hypothesis|experiment))/i.test(t)) c.push('C');
    if (/\b(impact|implication|society|social|ethic|moral|environment|econom|advantage|disadvantage|benefit|risk|should (we|people|scientists|governments))/i.test(t)) c.push('D');
    return c.length > 2 ? c.slice(0, 2) : c.length ? c : ['A'];
  }
  var STEPCRIT = {};
  function criteria() {
    var all = {};
    document.querySelectorAll('section.step').forEach(function (st) {
      var head = st.querySelector('.stephead'); if (!head || head.querySelector('.bv-crit')) return;
      var own = st.textContent.match(/Criteri(?:on|a)\s+[A-D](?:(?:\s*,\s*(?:and\s+)?|\s+and\s+)[A-D])*/gi), cs;
      if (own) { cs = []; own.join(' ').replace(/Criteri(?:on|a)/gi, '').replace(/[A-D]\b/g, function (c) { if (cs.indexOf(c) < 0) cs.push(c); return c; }); cs.sort(); }
      else { var qs = [].map.call(st.querySelectorAll('.ql'), function (q) { return q.textContent; }).join(' '); if (!qs.trim()) return; cs = infer(qs); }
      cs.forEach(function (c) { all[c] = 1; }); STEPCRIT[(st.id || '').replace(/\D/g, '')] = cs;
      if (own) return;
      var chip = el('span', 'display:inline-block;margin:4px 6px 0 0;padding:2px 10px;border-radius:99px;background:#ede9fe;color:#5b21b6;font-size:.82rem;font-weight:700', cs.map(function (c) { return 'Criterion ' + c + ' · ' + CRIT[c]; }).join(' &nbsp;|&nbsp; '));
      chip.className = 'bv-crit'; head.appendChild(chip);
    });
    var keys = Object.keys(all).sort(), first = document.querySelector('section.step');
    if (keys.length && first && !document.getElementById('bv-critbar')) {
      var bar = el('div', 'margin:10px 0;padding:10px 14px;border-radius:12px;background:#f5f3ff;border:1px solid #ddd6fe;color:#3b0764', '<b>MYP criteria in this lesson:</b> ' + keys.map(function (c) { return '<b>' + c + '</b> ' + CRIT[c]; }).join(' · '));
      bar.id = 'bv-critbar'; bar.className = 'card'; first.parentNode.insertBefore(bar, first);
    }
  }
  /* the lesson's mark as a level: MYP 1 to 8 (for each criterion the lesson assesses), IB Diploma 1 to 7 */
  function levels() {
    var tb = document.getElementById('totalbar'), sc = window.BV_SCALE; if (!tb || !sc) return;
    var m = (tb.textContent || '').match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/); if (!m) return;
    if (!(+m[1] > 0) && !(window.marks && Object.keys(window.marks).length)) return;   // nothing marked yet: no level to show
    var box = document.getElementById('bv-level'); if (!box) { box = el('div', 'margin:6px 0;font-size:.92rem'); box.id = 'bv-level'; tb.parentNode.insertBefore(box, tb.nextSibling); }
    var html = T.levelPill(+m[1], +m[2], sc) + ' <span class="small muted">for the marks so far</span>', mk = window.marks, by = {};
    if (sc === 'MYP' && mk && typeof mk === 'object') {
      Object.keys(mk).forEach(function (n) { (STEPCRIT[n] || []).forEach(function (c) { by[c] = by[c] || [0, 0]; by[c][0] += +mk[n].score || 0; by[c][1] += +mk[n].max || 0; }); });
      var parts = Object.keys(by).sort().filter(function (c) { return by[c][1] > 0; }).map(function (c) { return '<b>Criterion ' + c + '</b>: level ' + T.level(by[c][0], by[c][1], 'MYP').n + ' of 8'; });
      if (parts.length) html += '<br><span class="small">' + parts.join(' · ') + '</span>';
    }
    if (box.innerHTML !== html) box.innerHTML = html;
  }
  function go() { scan(); setTimeout(scan, 1200); setTimeout(scan, 3500); levels(); setInterval(levels, 1500); }   // lessons that draw their questions with a script are scanned again
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

/* Answer tools for every written answer (admin, Nov 2026: "graphing tool, table tool or keyboard, drawing tool").
   - BVT.keyboard(ta)            science symbols typed into the box at the cursor (x², H₂O, →, ⇌, Δ, °, μ, ±, ×, √ …)
   - BVT.writeBar(ta, {table})   for teachers writing a question: symbols, and a table written into the question text
   - BVT.answerTools(ta, text, {pics, onchange})  for students: ⌨️ Symbols · ▦ Table · 📈 Graph · ✏️ Draw under the answer box.
       The tools the question asks for are marked "suggested". A graph or drawing travels with the written answer as a line
       [[pic:graph:data:image/jpeg;base64,…]] that the student never sees in the box.
   - BVT.answerValue(ta)         the full answer: the typed text plus any graph or drawing
   - BVT.splitAns(v)             {text, pics: {graph, draw}}     - BVT.answerHtml(v)  the answer for teachers and results pages
   - BVT.answerText(v)           the typed words only (for the mark-scheme check) */
(function () {
  var T = window.BVT; if (!T) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PIC = /\n?\[\[pic:(graph|draw):(data:image\/[a-z]+;base64,[A-Za-z0-9+\/=]+)\]\]/g;
  T.splitAns = function (v) { var pics = {}, text = String(v == null ? '' : v).replace(PIC, function (m, k, d) { pics[k] = d; return ''; }); return { text: text.replace(/\s+$/, ''), pics: pics }; };
  T.joinAns = function (text, pics) { var out = String(text || '').replace(/\s+$/, ''); ['graph', 'draw'].forEach(function (k) { if (pics && pics[k]) out += '\n[[pic:' + k + ':' + pics[k] + ']]'; }); return out; };
  T.answerText = function (v) { return T.splitAns(v).text; };
  T.answerValue = function (ta) { return ta && ta._bvTools ? T.joinAns(ta.value, ta._bvTools.pics) : ta ? ta.value : ''; };
  T.answerHtml = function (v) {
    var s = T.splitAns(v), t = s.text, html = '', a = t.indexOf('[Table]'), b = t.indexOf('[End of table]');
    var para = function (x) { return x.trim() ? '<p style="white-space:pre-wrap;margin:.3em 0">' + E(x.trim()) + '</p>' : ''; };
    if (a >= 0 && b > a) html = para(t.slice(0, a)) + T.table(t.slice(a + 7, b).split('\n').filter(function (l) { return l.trim(); }).map(function (l) { return '| ' + l + ' |'; })) + para(t.slice(b + 14));
    else html = para(t);
    ['graph', 'draw'].forEach(function (k) { if (s.pics[k]) html += '<figure style="margin:.4em 0"><img class="hw" src="' + s.pics[k] + '" alt="' + (k === 'graph' ? 'Graph drawn by the student' : 'Diagram drawn by the student') + '" style="max-width:100%;border:1px solid #d6dbe4;border-radius:8px;background:#fff"><figcaption class="small muted">' + (k === 'graph' ? '📈 Graph' : '✏️ Drawing') + '</figcaption></figure>'; });
    return html || '<i>no answer</i>';
  };

  var KEYS = [
    ['Powers', ['²', '³', '⁻¹', '⁻²', '⁻³', '⁰', '¹', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁺', '⁻', '×10']],
    ['Formulas', ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '⁺', '²⁺', '³⁺', '⁻', '²⁻', '³⁻']],
    ['Reactions', ['→', '⇌', '←', '↑', '↓', '(s)', '(l)', '(g)', '(aq)', 'Δ', '+']],
    ['Maths', ['×', '÷', '±', '≈', '≠', '≤', '≥', '<', '>', '√', '∛', 'π', '∝', '∞', '½', '¼', '¾', '·', '°', '%', '‰', 'Σ', 'x̄']],
    ['Greek', ['α', 'β', 'γ', 'δ', 'Δ', 'θ', 'λ', 'μ', 'ρ', 'σ', 'Ω', 'ω', 'φ', 'χ²']],
    ['Units', ['°C', 'K', 'cm³', 'dm³', 'm s⁻¹', 'm s⁻²', 'mol dm⁻³', 'g cm⁻³', 'kJ mol⁻¹', 'J kg⁻¹ K⁻¹', 'Ω', 'μm', 'nm', 'N', 'Pa', 'W', 'V', 'A']]];
  function fire(ta) { try { ta.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {} }
  function insert(ta, s) {
    var a = ta.selectionStart == null ? ta.value.length : ta.selectionStart, b = ta.selectionEnd == null ? a : ta.selectionEnd;
    ta.value = ta.value.slice(0, a) + s + ta.value.slice(b); var p = a + s.length; ta.focus(); try { ta.setSelectionRange(p, p); } catch (e) {} fire(ta);
  }
  T.keyboard = function (ta) {
    var box = document.createElement('div'); box.className = 'bvk'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Science symbols');
    box.innerHTML = '<div class="bvk-tabs">' + KEYS.map(function (g, i) { return '<button type="button" data-g="' + i + '" aria-pressed="' + (i === 0) + '">' + g[0] + '</button>'; }).join('') + '</div><div class="bvk-keys"></div>' +
      '<p class="small muted" style="margin:4px 0 0">Click a symbol to put it where the cursor is. Example: H₂O, CO₂, 3.0 × 10⁸ m s⁻¹, Fe³⁺.</p>';
    var keys = box.querySelector('.bvk-keys'), show = function (i) { keys.innerHTML = KEYS[i][1].map(function (k) { var show = (i === 0 && /^[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/.test(k) ? '<span style="opacity:.45">x</span>' : i === 1 && /^[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁺⁻]+$/.test(k) ? '<span style="opacity:.45">X</span>' : '') + E(k); return '<button type="button" data-k="' + E(k) + '" aria-label="Type ' + E(k) + '">' + show + '</button>'; }).join('');
      keys.querySelectorAll('[data-k]').forEach(function (b) { b.onmousedown = function (e) { e.preventDefault(); }; b.onclick = function () { insert(ta, b.getAttribute('data-k')); }; }); };
    box.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { box.querySelectorAll('[data-g]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); show(+b.getAttribute('data-g')); }; });
    show(0); return box;
  };
  /* a table builder that writes | a | b | rows into a question (the builder shows them as a table) */
  function mdTable(ta) {
    var box = document.createElement('div'); box.className = 'bvk'; var data = [['', '', ''], ['', '', ''], ['', '', '']];
    function draw() {
      box.innerHTML = '<p class="small" style="margin:0 0 6px"><b>▦ Table</b> · the first row is the heading row.</p><div style="overflow-x:auto"><table style="border-collapse:collapse">' + data.map(function (r, i) { return '<tr>' + r.map(function (c, j) { return '<td style="border:1px solid #94a3b8;padding:0"><input data-r="' + i + '" data-c="' + j + '" value="' + E(c) + '" aria-label="Row ' + (i + 1) + ', column ' + (j + 1) + '" style="border:0;padding:5px 7px;width:8em;font:inherit;' + (i ? '' : 'font-weight:700;background:#f1f5f9') + '"></td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
        '<p style="margin:6px 0 0;display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-a="row">＋ Row</button><button type="button" class="btn sm" data-a="col">＋ Column</button><button type="button" class="btn sm" data-a="rrow">− Row</button><button type="button" class="btn sm" data-a="rcol">− Column</button><button type="button" class="btn sm main" data-a="put">Put the table in the question</button></p>';
      box.querySelectorAll('input').forEach(function (i) { i.oninput = function () { data[+i.getAttribute('data-r')][+i.getAttribute('data-c')] = i.value.replace(/[|\n]/g, ' '); }; });
      box.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-a');
        if (a === 'row' && data.length < 30) data.push(data[0].map(function () { return ''; })); if (a === 'col' && data[0].length < 8) data.forEach(function (r) { r.push(''); });
        if (a === 'rrow' && data.length > 2) data.pop(); if (a === 'rcol' && data[0].length > 1) data.forEach(function (r) { r.pop(); });
        if (a === 'put') { insert(ta, '\n' + data.map(function (r) { return '| ' + r.map(function (c) { return c || ' '; }).join(' | ') + ' |'; }).join('\n') + '\n'); return; }
        draw(); }; });
    }
    draw(); return box;
  }
  function bar(ta, buttons) {   // buttons: [key, label, make(holder) -> element | null, suggested]
    var wrap = document.createElement('div'); wrap.className = 'bvk-bar'; var row = document.createElement('div'); row.className = 'bvk-row'; row.setAttribute('role', 'toolbar'); row.setAttribute('aria-label', 'Answer tools');
    var host = document.createElement('div'), open = {}; wrap.appendChild(row); wrap.appendChild(host);
    buttons.forEach(function (bt) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm' + (bt[3] ? ' bvk-sug' : ''); b.textContent = bt[1] + (bt[3] ? ' ★' : ''); b.setAttribute('aria-expanded', 'false'); b.setAttribute('data-tool', bt[0]);
      if (bt[3]) b.title = 'This question asks for this';
      b.onclick = function () {
        if (open[bt[0]]) { open[bt[0]].hidden = !open[bt[0]].hidden; b.setAttribute('aria-expanded', String(!open[bt[0]].hidden)); return; }
        var w = document.createElement('div'); w.style.margin = '6px 0'; host.appendChild(w); open[bt[0]] = w; b.setAttribute('aria-expanded', 'true'); var c = bt[2](w); if (c) w.appendChild(c);
      };
      row.appendChild(b);
    });
    ta.parentNode.insertBefore(wrap, ta.nextSibling); return { wrap: wrap, open: function (k) { var b = row.querySelector('[data-tool="' + k + '"]'); if (b && !open[k]) b.click(); } };
  }
  T.writeBar = function (ta, o) {
    if (!ta || ta._bvBar) return; ta._bvBar = true; o = o || {};
    var b = [['keys', '⌨️ Symbols', function () { return T.keyboard(ta); }]];
    if (o.table) b.push(['table', '▦ Table', function () { return mdTable(ta); }]);
    return bar(ta, b);
  };
  T.answerTools = function (ta, text, o) {
    if (!ta || ta._bvTools) return ta && ta._bvTools; o = o || {};
    var need = T.needs ? T.needs(text) : [], api = ta._bvTools = { pics: Object.assign({}, o.pics || {}) }, pads = {};
    function padTool(k) { return function (w) {
      var note = document.createElement('p'); note.className = 'small muted'; note.style.margin = '4px 0 0'; note.textContent = k === 'graph' ? 'Your graph is handed in with your answer. Label both axes with the quantity and unit.' : 'Your drawing is handed in with your answer. Label it with the Aa and label-line tools.';
      var h = document.createElement('div'); w.appendChild(h); w.appendChild(note);
      var pr = T.parse ? T.parse(text) : {}, pad = pads[k] = T.pad(h, { mode: k === 'graph' ? 'graph' : 'draw', x: pr.x || '', y: pr.y || '', value: api.pics[k] || '', readonly: !!o.readonly, onchange: function () {
        var d = ''; try { d = pad.get(); } catch (e) {} if (d) api.pics[k] = d; else delete api.pics[k]; if (o.onchange) o.onchange(); } });
      return null; }; }
    var b = [['keys', '⌨️ Symbols', function () { return T.keyboard(ta); }, false],
      ['table', '▦ Table', function () { return T.tableTool(ta); }, need.indexOf('table') >= 0],
      ['graph', '📈 Graph', padTool('graph'), need.indexOf('graph') >= 0],
      ['draw', '✏️ Draw', padTool('draw'), need.indexOf('draw') >= 0]];
    if (o.readonly) b = b.filter(function (x) { return x[0] === 'graph' || x[0] === 'draw'; }).filter(function (x) { return api.pics[x[0]]; });
    if (!b.length) return api;
    var ui = bar(ta, b); ['graph', 'draw'].forEach(function (k) { if (api.pics[k]) ui.open(k); });
    return api;
  };
  if (!document.getElementById('bvk-css')) { var st = document.createElement('style'); st.id = 'bvk-css';
    st.textContent = '.bvk-bar{margin:6px 0 2px;min-width:0;max-width:100%}.bvk{max-width:100%;box-sizing:border-box;overflow-x:auto}.bvk-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.bvk-row .bvk-sug{border-color:#7c3aed;background:#f5f3ff;color:#5b21b6;font-weight:700}.bvk{border:1px solid var(--line,#cbd5e1);border-radius:12px;padding:8px;background:var(--card,#fff)}.bvk-tabs{display:flex;gap:4px;flex-wrap:wrap;margin:0 0 6px}.bvk-tabs button{border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:3px 10px;font:inherit;font-size:.85rem;cursor:pointer}.bvk-tabs button[aria-pressed=true]{background:#4f46e5;color:#fff;border-color:#4f46e5}.bvk-keys{display:flex;flex-wrap:wrap;gap:4px}.bvk-keys button{min-width:2.4em;padding:4px 8px;font-size:1.08rem!important;line-height:1.3;color:#172033;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;font:inherit;cursor:pointer}.bvk-keys button:hover,.bvk-keys button:focus-visible{background:#eef2ff;border-color:#4f46e5}';
    document.head.appendChild(st); }
})();

/* Assessment Studio additions (Nov 2026)
   - BVT.files(v) / BVT.fileToken(f)   recorded or uploaded answers travel inside the answer as [[file:<path>|<name>|<type>]] lines.
     The files sit in the PRIVATE bucket "student-responses" (migration 049): only the student, their teachers, parents and the admin
     can open them, through short-lived signed links. Wherever an answer is shown (BVT.answerHtml) the file plays or opens in place.
   - BVT.responder(holder, {mode:'audio'|'video'|'file', value, quiz, onchange}) the student's recorder / uploader; .get() gives the answer
   - BVT.richBar(ta)   the question editor's toolbar: bold, italic, underline, superscript, subscript, lists, symbols, table,
                       chemical equation and equation tidying, undo and redo. Formatting is kept as the site's light mark-up. */
(function () {
  var T = window.BVT; if (!T || T.responder) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var FILE = /\n?\[\[file:([^|\]]+)\|([^|\]]*)\|([^|\]]*)\]\]/g, BUCKET = 'student-responses';
  T.files = function (v) { var out = [], m; FILE.lastIndex = 0; while ((m = FILE.exec(String(v == null ? '' : v)))) out.push({ path: m[1], name: m[2], type: m[3] }); return out; };
  T.fileToken = function (f) { var c = function (x) { return String(x || '').replace(/[|\]\[\n]/g, ' ').slice(0, 120); }; return '[[file:' + c(f.path) + '|' + c(f.name) + '|' + c(f.type) + ']]'; };
  T.stripFiles = function (v) { return String(v == null ? '' : v).replace(FILE, '').replace(/\s+$/, ''); };
  var baseHtml = T.answerHtml, baseText = T.answerText;
  if (baseHtml) T.answerHtml = function (v) { var f = T.files(v); if (!f.length) return baseHtml(v); var rest = T.stripFiles(v);
    return (rest.trim() ? baseHtml(rest) : '') + f.map(function (x) { return '<div class="bv-file" data-bvfile="' + E(x.path) + '" data-type="' + E(x.type) + '" style="margin:.4em 0"><span class="small muted">' + (/^audio/.test(x.type) ? '🎙' : /^video/.test(x.type) ? '🎬' : '📎') + ' ' + E(x.name || 'Answer file') + ' (opening…)</span></div>'; }).join(''); };
  if (baseText) T.answerText = function (v) { return baseText(T.stripFiles(v)); };
  /* open every file answer on the page with a signed link (teachers' marking screens, results, the student's own review) */
  function resolve(root) {
    var S = window.BVS; if (!S || !S.db || !S.db.storage) return;
    [].forEach.call((root || document).querySelectorAll('[data-bvfile]:not([data-done])'), function (el) {
      el.setAttribute('data-done', '1'); var path = el.getAttribute('data-bvfile'), type = el.getAttribute('data-type') || '', name = (el.textContent || '').replace(/^\S+\s/, '').replace(/ \(opening…\)$/, '');
      S.db.storage.from(BUCKET).createSignedUrl(path, 3600).then(function (r) {
        if (!r || r.error || !r.data) { el.innerHTML = '<span class="small muted">📎 ' + E(name) + ': this file could not be opened (' + E((r && r.error && r.error.message) || 'no access') + ').</span>'; return; }
        var u = r.data.signedUrl;
        el.innerHTML = /^audio/.test(type) ? '<audio controls preload="metadata" src="' + E(u) + '" style="max-width:100%"></audio>' : /^video/.test(type) ? '<video controls preload="metadata" src="' + E(u) + '" style="max-width:100%;max-height:360px;border-radius:8px"></video>' :
          /^image/.test(type) ? '<a href="' + E(u) + '" target="_blank" rel="noopener"><img src="' + E(u) + '" alt="' + E(name) + '" style="max-width:100%;max-height:360px;border-radius:8px"></a>' : '';
        el.insertAdjacentHTML('beforeend', '<div class="small"><a href="' + E(u) + '" target="_blank" rel="noopener" download="' + E(name) + '">📎 ' + E(name || 'Open the file') + ' ↗</a></div>');
      });
    });
  }
  T.resolveFiles = resolve;
  if (typeof MutationObserver !== 'undefined') { var mo = new MutationObserver(function () { clearTimeout(mo.t); mo.t = setTimeout(function () { resolve(document); }, 120); });
    var go = function () { if (document.body) { mo.observe(document.body, { childList: true, subtree: true }); resolve(document); } }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go(); }

  /* ---------------------------------------------------------------- the student's recorder / uploader */
  var NEED = { audio: 'Record your spoken answer (or upload a sound file).', video: 'Record a short video answer (or upload a video file).', file: 'Upload your work: a document, PDF, spreadsheet, photo, sound or video file.' };
  T.responder = function (holder, o) {
    o = o || {}; var mode = o.mode || 'file', files = T.files(o.value), note = T.stripFiles(o.value), rec = null, chunks = [], stream = null, busy = false;
    var box = document.createElement('div'); box.className = 'bv-resp'; box.style.cssText = 'display:grid;gap:8px;border:1px solid var(--line,#dde3ea);border-radius:12px;padding:10px;background:var(--card,#fff)';
    holder.appendChild(box);
    function changed() { if (o.onchange) o.onchange(); }
    function uid() { var S = window.BVS; return S.db.auth.getSession().then(function (r) { var u = r && r.data && r.data.session && r.data.session.user; if (!u) throw new Error('Please sign in again.'); return u.id; }); }
    function upload(blob, name) {
      var S = window.BVS; if (!S || !S.db) return Promise.reject(new Error('Not signed in.'));
      if (blob.size > 50 * 1048576) return Promise.reject(new Error('The file is larger than 50 MB.'));
      var safe = String(name || 'answer').replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80);
      return uid().then(function (id) { var path = id + '/' + (o.quiz || 'work') + '/' + Date.now() + '-' + safe;
        return S.db.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: false }).then(function (r) { if (r.error) throw r.error; return { path: path, name: name, type: blob.type || 'application/octet-stream' }; }); });
    }
    function draw(msg) {
      var canRec = (mode === 'audio' || mode === 'video') && navigator.mediaDevices && window.MediaRecorder;
      box.innerHTML = '<p class="small muted" style="margin:0">' + (mode === 'audio' ? '🎙 ' : mode === 'video' ? '🎬 ' : '📎 ') + NEED[mode] + '</p>' +
        '<div class="acts" style="display:flex;gap:8px;flex-wrap:wrap">' + (canRec ? '<button type="button" class="btn sm" data-rec>' + (rec ? '⏹ Stop recording' : '⏺ Record') + '</button>' : '') +
        '<label class="btn sm" style="cursor:pointer">⬆ Upload a file<input type="file" data-up hidden accept="' + (mode === 'audio' ? 'audio/*' : mode === 'video' ? 'video/*' : '') + '"></label></div>' +
        (rec ? '<div data-live></div><p class="small" style="color:#b91c1c;margin:0">● Recording…</p>' : '') +
        '<div data-list>' + files.map(function (f, i) { return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="bv-file" data-bvfile="' + E(f.path) + '" data-type="' + E(f.type) + '" style="flex:1;min-width:200px"><span class="small muted">' + E(f.name) + ' (opening…)</span></div><button type="button" class="btn sm" data-del="' + i + '" aria-label="Remove ' + E(f.name) + '">✕ Remove</button></div>'; }).join('') + '</div>' +
        (msg ? '<p class="small" role="status" style="margin:0">' + E(msg) + '</p>' : '');
      var up = box.querySelector('[data-up]'); if (up) up.onchange = function () { var f = up.files && up.files[0]; if (!f || busy) return; busy = true; draw('Uploading ' + f.name + '…');
        upload(f, f.name).then(function (x) { files.push(x); busy = false; draw('Uploaded.'); changed(); }, function (e) { busy = false; draw('Upload failed: ' + (e.message || e)); }); };
      box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { files.splice(+b.getAttribute('data-del'), 1); draw(); changed(); }; });
      var rb = box.querySelector('[data-rec]'); if (rb) rb.onclick = function () { if (rec) { rec.stop(); return; }
        navigator.mediaDevices.getUserMedia(mode === 'video' ? { audio: true, video: { width: 640, height: 480 } } : { audio: true }).then(function (st) {
          stream = st; chunks = []; rec = new MediaRecorder(st); rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = function () { var type = (chunks[0] && chunks[0].type) || (mode === 'video' ? 'video/webm' : 'audio/webm'), blob = new Blob(chunks, { type: type.split(';')[0] }); stream.getTracks().forEach(function (t) { t.stop(); }); rec = null;
            var name = (mode === 'video' ? 'video-answer' : 'spoken-answer') + '.' + (/mp4/.test(type) ? 'mp4' : /ogg/.test(type) ? 'ogg' : 'webm'); busy = true; draw('Saving your recording…');
            upload(blob, name).then(function (x) { files.push(x); busy = false; draw('Recording saved.'); changed(); }, function (e) { busy = false; draw('The recording could not be saved: ' + (e.message || e)); }); };
          rec.start(); draw(); if (mode === 'video') { var v = document.createElement('video'); v.muted = true; v.autoplay = true; v.playsInline = true; v.style.cssText = 'max-width:100%;max-height:240px;border-radius:8px'; v.srcObject = st; box.querySelector('[data-live]').appendChild(v); }
        }, function (e) { draw('The ' + (mode === 'video' ? 'camera' : 'microphone') + ' could not be used (' + (e.message || e.name || 'not allowed') + '). Upload a file instead.'); }); };
      resolve(box);
    }
    draw();
    return { get: function () { var t = String(note || '').trim(); return (t ? t + '\n' : '') + files.map(T.fileToken).join('\n'); }, files: function () { return files.slice(); } };
  };

  /* ---------------------------------------------------------------- chemistry and equation tidying */
  var SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋', '(': '₍', ')': '₎' }, SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '(': '⁽', ')': '⁾', n: 'ⁿ' };
  var map = function (t, m) { return String(t).split('').map(function (c) { return m[c] || c; }).join(''); };
  /* "6CO2 + 6H2O -> C6H12O6 + 6O2" → "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂"; "Fe3+" → "Fe³⁺"; "SO4^2-" → "SO₄²⁻" */
  T.chem = function (t) {
    return String(t).replace(/<=>|<->/g, '⇌').replace(/-->|->|=>/g, '→').replace(/\^([0-9]*[+-])/g, function (m, c) { return map(c, SUP); })
      .replace(/([A-Z][a-z]?)(\d?)([+-])(?=[\s,;.)]|$)/g, function (m, el, n, s) { return el + map(n + s, SUP); })   /* ions first: Fe3+ → Fe³⁺, Cl- → Cl⁻ */
      .replace(/([A-Z][a-z]?|\))(\d+)/g, function (m, el, n) { return el + map(n, SUB); });
  };
  /* "x^2", "10^-3", "x_1", "+-", "sqrt(", "<=", ">=", "!=" → x², 10⁻³, x₁, ±, √(, ≤, ≥, ≠ */
  T.uni = function (t) {
    return String(t).replace(/\^\(?(-?[0-9n+]+)\)?/g, function (m, c) { return map(c, SUP); }).replace(/_\(?([0-9+-]+)\)?/g, function (m, c) { return map(c, SUB); })
      .replace(/\+-|\+\/-/g, '±').replace(/sqrt\s*\(/g, '√(').replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=/g, '≠').replace(/\bdelta\b/gi, 'Δ').replace(/\bchi2\b|\bchi\^2\b/gi, 'χ²').replace(/\bmu\b/g, 'μ').replace(/(\d)\s*x\s*10/g, '$1 × 10');
  };

  /* ---------------------------------------------------------------- the question editor's toolbar */
  T.richBar = function (ta, o) {
    if (!ta || ta._bvRich) return; ta._bvRich = true; o = o || {};
    var hist = [ta.value], at = 0, lock = false, bar = document.createElement('div');
    bar.className = 'bv-rich'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Formatting');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:2px;padding:4px;border:1px solid #cbd5e1;border-bottom:0;border-radius:10px 10px 0 0;background:#f8fafc';
    var B = [['B', 'Bold', '**', '**', 'font-weight:900'], ['I', 'Italic', '*', '*', 'font-style:italic'], ['U', 'Underline', '__', '__', 'text-decoration:underline'], ['x²', 'Superscript', '^', '^'], ['x₂', 'Subscript', '~', '~'],
      ['•', 'Bulleted list', 'list'], ['1.', 'Numbered list', 'olist'], ['|', '', 'sep'], ['⚗', 'Chemical equation: tidy the selection (H2O → H₂O, -> → →)', 'chem'], ['∑', 'Equation: tidy the selection (x^2 → x², +- → ±, <= → ≤)', 'eq'], ['Tx', 'Clear formatting', 'clear'], ['|', '', 'sep'], ['↶', 'Undo', 'undo'], ['↷', 'Redo', 'redo']];
    function fire() { try { ta.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {} }
    function snap() { if (lock) return; if (hist[at] === ta.value) return; hist = hist.slice(0, at + 1); hist.push(ta.value); if (hist.length > 80) hist.shift(); at = hist.length - 1; }
    function put(v, s, e) { ta.value = v; ta.focus(); try { ta.setSelectionRange(s, e); } catch (x) {} snap(); fire(); }
    function wrap(a, b) { var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e) || 'text'; put(v.slice(0, s) + a + sel + b + v.slice(e), s + a.length, s + a.length + sel.length); }
    function lines(fn) { var v = ta.value, s = v.lastIndexOf('\n', ta.selectionStart - 1) + 1, e = v.indexOf('\n', ta.selectionEnd); if (e < 0) e = v.length; var block = v.slice(s, e).split('\n').map(fn).join('\n'); put(v.slice(0, s) + block + v.slice(e), s, s + block.length); }
    function sel(fn) { var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value; if (s === e) { s = v.lastIndexOf('\n', s - 1) + 1; e = v.indexOf('\n', e); if (e < 0) e = v.length; } var t = fn(v.slice(s, e)); put(v.slice(0, s) + t + v.slice(e), s, s + t.length); }
    B.forEach(function (b) {
      if (b[2] === 'sep') { var sp = document.createElement('span'); sp.style.cssText = 'width:1px;background:#cbd5e1;margin:2px 4px'; bar.appendChild(sp); return; }
      var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = b[0]; btn.title = b[1]; btn.setAttribute('aria-label', b[1]);
      btn.style.cssText = 'all:unset;cursor:pointer;min-width:26px;text-align:center;padding:3px 6px;border-radius:6px;font:700 13px system-ui;color:#1e293b;' + (b[4] || '');
      btn.onmouseenter = function () { btn.style.background = '#e0e7ff'; }; btn.onmouseleave = function () { btn.style.background = ''; };
      btn.onmousedown = function (e) { e.preventDefault(); };
      btn.onclick = function () {
        var k = b[2];
        if (k === 'list') return lines(function (l) { return /^• /.test(l) ? l.slice(2) : '• ' + l; });
        if (k === 'olist') { var n = 0; return lines(function (l) { return /^\d+\. /.test(l) ? l.replace(/^\d+\. /, '') : (++n) + '. ' + l; }); }
        if (k === 'chem') return sel(T.chem); if (k === 'eq') return sel(T.uni);
        if (k === 'clear') return sel(function (t) { return t.replace(/\*\*|__|\^|~/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/(\S)\*(\s|$)/g, '$1$2'); });
        if (k === 'undo') { if (at > 0) { lock = true; at--; ta.value = hist[at]; fire(); lock = false; } return; }
        if (k === 'redo') { if (at < hist.length - 1) { lock = true; at++; ta.value = hist[at]; fire(); lock = false; } return; }
        wrap(b[2], b[3]);
      };
      bar.appendChild(btn);
    });
    ta.addEventListener('input', function () { clearTimeout(ta._bvSnap); ta._bvSnap = setTimeout(snap, 350); });
    ta.addEventListener('keydown', function (e) { if (!(e.ctrlKey || e.metaKey)) return; var k = e.key.toLowerCase(); if (k === 'b') { e.preventDefault(); wrap('**', '**'); } else if (k === 'i') { e.preventDefault(); wrap('*', '*'); } else if (k === 'u') { e.preventDefault(); wrap('__', '__'); } });
    ta.style.borderTopLeftRadius = ta.style.borderTopRightRadius = '0';
    ta.parentNode.insertBefore(bar, ta);
    if (T.writeBar) T.writeBar(ta, { table: true });
    return bar;
  };
})();
