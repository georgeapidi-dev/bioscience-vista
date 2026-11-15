/* Learnova · question types (window.BVQT). Ten kinds of question that are marked automatically:
   multi (several correct answers), match, order, classify, gaps, cloze (drop-down in a sentence), number, table, label, hotspot.
   One module gives the student's view, the teacher's editor and the scoring used by the preview. The same scoring runs on the
   server when work is handed in (auto_feedback, migration 038): the key (accepted) is never sent to students.
     questions.options           what the student sees (layout, choices in shuffled order)
     question_answers.accepted   the key
     question_answers.model_answer   the key in words
     the answer in an attempt    a JSON string (a plain string for number and hotspot)
   Teachers edit a "draft" (plain text and lists); pack() turns it into options + accepted + model, unpack() turns it back. */
(function () {
  if (window.BVQT) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function h(tag, a, kids) {
    var e = document.createElement(tag); a = a || {};
    Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null || v === false) return;
      if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v; else if (k.slice(0, 2) === 'on') e[k] = v; else if (k === 'value') e.value = v; else if (k === 'checked' || k === 'disabled' || k === 'selected') e[k] = !!v; else e.setAttribute(k, v); });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function J(v, d) { if (v == null || v === '') return d; try { var x = typeof v === 'string' ? JSON.parse(v) : v; return x == null ? d : x; } catch (e) { return d; } }
  function norm(t) { return String(t == null ? '' : t).trim().replace(/[.!?;:,]+$/, '').replace(/\s+/g, ' ').trim().toLowerCase(); }   // the same rule as qnorm() on the server
  function seedOf(s) { var x = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function perm(n, seed) {   // the same shuffle every time for the same text, and never the original order
    var a = [], s = seedOf(seed) || 1, i, j, t; for (i = 0; i < n; i++) a.push(i);
    function rnd() { s = (s + 0x6D2B79F5) | 0; var z = Math.imul(s ^ (s >>> 15), 1 | s); z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z; return ((z ^ (z >>> 14)) >>> 0) / 4294967296; }
    for (i = n - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    if (n > 1 && a.every(function (v, k) { return v === k; })) a.push(a.shift());
    return a;
  }
  var CSS = '.qt{display:grid;gap:8px;margin:6px 0}.qt select,.qt input[type=text],.qt input[type=number]{font:inherit;padding:7px 9px;border:2px solid #c7d2fe;border-radius:10px;background:#fff;color:#172033;max-width:100%}' +
    '.qt-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:7px 10px;border:1px solid var(--line,#dde3ea);border-radius:12px;background:var(--card,#fff)}.qt-row>span:first-child{flex:1;min-width:120px}' +
    '.qt-chk{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line,#dde3ea);border-radius:12px;cursor:pointer}.qt-chk input{margin-top:3px}' +
    '.qt-ord b{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#4f46e5;color:#fff;font-size:.85rem}.qt-ord button{all:unset;cursor:pointer;padding:2px 9px;border-radius:8px;background:#eef2ff;color:#3730a3;font-weight:800}.qt-ord button:disabled{opacity:.35;cursor:default}.qt-ord button:focus-visible{outline:3px solid #a5b4fc}' +
    '.qt-line{line-height:2.3}.qt-line input{width:9.5em}.qt-tab{border-collapse:collapse;width:100%}.qt-tab th,.qt-tab td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}.qt-tab th{background:#eef2ff}.qt-tab input{width:100%;box-sizing:border-box}' +
    '.qt-pic{position:relative;display:inline-block;max-width:100%;line-height:0}.qt-pic img{max-width:100%;max-height:440px;border-radius:10px;display:block}.qt-pin{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#db2777;color:#fff;font:800 13px/1 system-ui;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)}' +
    '.qt-pin.me{background:#16a34a;width:22px;height:22px}.qt-zone{position:absolute;border:3px dashed #16a34a;border-radius:50%;background:rgba(22,163,74,.18);transform:translate(-50%,-50%);pointer-events:none}.qt-hot img{cursor:crosshair}' +
    '.qt-ed{display:grid;gap:8px}.qt-ed .r{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.qt-ed input[type=text],.qt-ed textarea,.qt-ed input[type=number],.qt-ed input[type=url]{font:inherit;padding:7px 9px;border:1px solid #cbd5e1;border-radius:10px;flex:1;min-width:110px;box-sizing:border-box}.qt-ed textarea{width:100%;min-height:84px}' +
    '.qt-ed .x{all:unset;cursor:pointer;color:#b91c1c;font-weight:800;padding:0 6px}.qt-ed .hint{font-size:.85rem;color:#475569}.qt-ed .add{all:unset;cursor:pointer;color:#4338ca;font-weight:700}';
  var styled = false; function style() { if (styled) return; styled = true; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }

  var KINDS = [
    ['multi', '☑️', 'Several correct answers', 'Choice'], ['match', '🔗', 'Match the pairs', 'Choice'], ['order', '🔢', 'Put in order', 'Choice'], ['classify', '🗂️', 'Sort into groups', 'Choice'],
    ['gaps', '✍️', 'Fill in the gaps', 'Fill in'], ['cloze', '🔽', 'Drop-down in a sentence', 'Fill in'], ['number', '🔟', 'Number with unit', 'Fill in'], ['table', '▦', 'Complete a table', 'Fill in'],
    ['label', '🏷️', 'Label a diagram', 'Diagram'], ['hotspot', '🎯', 'Click the correct part', 'Diagram']];
  var NAMES = {}; KINDS.forEach(function (k) { NAMES[k[0]] = k; });
  function has(kind) { return !!NAMES[kind]; }

  /* ---------------------------------------------------------------- drafts */
  function blank(kind) {
    return { multi: { choices: [{ t: '', ok: true }, { t: '', ok: false }, { t: '', ok: false }] }, match: { pairs: [{ l: '', r: '' }, { l: '', r: '' }, { l: '', r: '' }] }, order: { items: ['', '', ''] },
      classify: { groups: ['', ''], items: [{ t: '', g: 0 }, { t: '', g: 1 }] }, gaps: { text: '' }, cloze: { text: '' }, number: { value: '', tol: '', unit: '' }, table: { cols: '', rows: '' },
      label: { image: '', spots: [], extra: '' }, hotspot: { image: '', x: 50, y: 50, r: 10, ratio: 1 } }[kind];
  }
  function alts(s) { return String(s).split('|').map(function (x) { return x.trim(); }).filter(Boolean); }
  function cut(text) {   // "a [b|c] d" -> { text: "a [[1]] d", groups: [["b","c"]] }
    var groups = []; return { text: String(text || '').replace(/\[([^\[\]]+)\]/g, function (m, g) { groups.push(alts(g)); return '[[' + groups.length + ']]'; }), groups: groups };
  }
  function pack(kind, d) {
    var o = {}, a = {}, model = '', p, i;
    if (kind === 'multi') { var ch = d.choices.filter(function (c) { return c.t.trim(); }); o.choices = ch.map(function (c) { return c.t.trim(); }); a.correct = []; ch.forEach(function (c, k) { if (c.ok) a.correct.push(k); }); model = ch.filter(function (c) { return c.ok; }).map(function (c) { return c.t.trim(); }).join('; '); }
    else if (kind === 'match') { var pr = d.pairs.filter(function (x) { return x.l.trim() && x.r.trim(); }); p = perm(pr.length, pr.map(function (x) { return x.r; }).join('|')); o.left = pr.map(function (x) { return x.l.trim(); }); o.right = p.map(function (k) { return pr[k].r.trim(); }); a.pairs = pr.map(function (x, k) { return p.indexOf(k); }); model = pr.map(function (x) { return x.l.trim() + ' → ' + x.r.trim(); }).join('; '); }
    else if (kind === 'order') { var it = d.items.map(function (x) { return x.trim(); }).filter(Boolean); p = perm(it.length, it.join('|')); o.items = p.map(function (k) { return it[k]; }); a.order = it.map(function (x, k) { return p.indexOf(k); }); model = it.map(function (x, k) { return (k + 1) + '. ' + x; }).join('  '); }
    else if (kind === 'classify') { var gs = d.groups.map(function (g) { return g.trim(); }), its = d.items.filter(function (x) { return x.t.trim(); }); p = perm(its.length, its.map(function (x) { return x.t; }).join('|')); o.groups = gs; o.items = p.map(function (k) { return its[k].t.trim(); }); a.groups = p.map(function (k) { return +its[k].g || 0; });
      model = gs.map(function (g, gi) { return g + ': ' + its.filter(function (x) { return (+x.g || 0) === gi; }).map(function (x) { return x.t.trim(); }).join(', '); }).join('; '); }
    else if (kind === 'gaps') { var c1 = cut(d.text); o.text = c1.text; a.gaps = c1.groups; model = String(d.text || '').replace(/\[([^\[\]]+)\]/g, function (m, g) { return alts(g)[0] || ''; }); }
    else if (kind === 'cloze') { var c2 = cut(d.text); o.text = c2.text; o.choices = []; a.gaps = []; c2.groups.forEach(function (g, k) { var q = perm(g.length, g.join('|') + k); o.choices.push(q.map(function (z) { return g[z]; })); a.gaps.push(q.indexOf(0)); }); model = String(d.text || '').replace(/\[([^\[\]]+)\]/g, function (m, g) { return alts(g)[0] || ''; }); }
    else if (kind === 'number') { o.unit = String(d.unit || '').trim(); a.value = parseFloat(d.value); a.tol = Math.abs(parseFloat(d.tol)) || 0; model = (isFinite(a.value) ? a.value : '') + (a.tol ? ' (± ' + a.tol + ')' : '') + (o.unit ? ' ' + o.unit : ''); }
    else if (kind === 'table') { o.cols = String(d.cols || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); o.rows = []; a.cells = {}; var words = [];
      String(d.rows || '').split('\n').forEach(function (line) { if (!line.trim()) return; var c3 = cut(line), r = o.rows.length, row = c3.text.split('|').map(function (cell, ci) { cell = cell.trim(); var m = /^\[\[(\d+)\]\]$/.exec(cell); if (m) { a.cells[r + ',' + ci] = c3.groups[m[1] - 1]; words.push((row0(c3, cell) || 'Row ' + (r + 1)) + ' → ' + c3.groups[m[1] - 1][0]); return null; } return cell.replace(/\[\[(\d+)\]\]/g, function (z, n) { return c3.groups[n - 1][0]; }); }); o.rows.push(row); });
      model = words.join('; '); }
    else if (kind === 'label') { var sp = d.spots.filter(function (s) { return s.t.trim(); }), all = sp.map(function (s) { return s.t.trim(); }).concat(String(d.extra || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean)); p = perm(all.length, all.join('|'));
      o.image = d.image; o.spots = sp.map(function (s) { return { x: +s.x, y: +s.y }; }); o.labels = p.map(function (k) { return all[k]; }); a.spots = sp.map(function (s, k) { return p.indexOf(k); }); model = sp.map(function (s, k) { return (k + 1) + ': ' + s.t.trim(); }).join('; '); }
    else if (kind === 'hotspot') { o.image = d.image; o.ratio = +d.ratio || 1; a.zones = [{ x: +d.x, y: +d.y, r: +d.r }]; model = 'The area marked on the picture.'; }
    return { options: o, accepted: a, model: model };
    function row0(c, cell) { var first = c.text.split('|')[0].trim(); return /^\[\[\d+\]\]$/.test(first) ? '' : first; }
  }
  function unpack(kind, o, a) {
    o = J(o, {}) || {}; a = J(a, {}) || {}; var d = blank(kind), g;
    function back(text, groups) { return String(text || '').replace(/\[\[(\d+)\]\]/g, function (m, n) { return '[' + (groups[n - 1] || []).join('|') + ']'; }); }
    if (kind === 'multi' && o.choices) d.choices = o.choices.map(function (t, k) { return { t: t, ok: (a.correct || []).indexOf(k) >= 0 }; });
    else if (kind === 'match' && o.left) d.pairs = o.left.map(function (l, k) { return { l: l, r: (o.right || [])[(a.pairs || [])[k]] || '' }; });
    else if (kind === 'order' && o.items) d.items = (a.order || []).map(function (k) { return o.items[k]; });
    else if (kind === 'classify' && o.items) { d.groups = o.groups || []; d.items = o.items.map(function (t, k) { return { t: t, g: (a.groups || [])[k] || 0 }; }); }
    else if (kind === 'gaps' && o.text != null) d.text = back(o.text, a.gaps || []);
    else if (kind === 'cloze' && o.text != null) { g = (o.choices || []).map(function (c, k) { var ok = (a.gaps || [])[k] || 0; return [c[ok]].concat(c.filter(function (x, z) { return z !== ok; })); }); d.text = back(o.text, g); }
    else if (kind === 'number') { d.value = a.value == null ? '' : a.value; d.tol = a.tol || ''; d.unit = o.unit || ''; }
    else if (kind === 'table' && o.rows) { d.cols = (o.cols || []).join(', '); d.rows = o.rows.map(function (r, ri) { return r.map(function (c, ci) { return c == null ? '[' + ((a.cells || {})[ri + ',' + ci] || []).join('|') + ']' : c; }).join(' | '); }).join('\n'); }
    else if (kind === 'label' && o.spots) { d.image = o.image || ''; d.spots = o.spots.map(function (s, k) { return { t: (o.labels || [])[(a.spots || [])[k]] || '', x: s.x, y: s.y }; }); var used = a.spots || []; d.extra = (o.labels || []).filter(function (l, k) { return used.indexOf(k) < 0; }).join(', '); }
    else if (kind === 'hotspot') { var z = (a.zones || [])[0] || {}; d.image = o.image || ''; d.x = z.x == null ? 50 : z.x; d.y = z.y == null ? 50 : z.y; d.r = z.r || 10; d.ratio = o.ratio || 1; }
    return d;
  }
  /* what is still missing before the question can be saved (empty list = ready) */
  function problems(kind, d) {
    var p = pack(kind, d), o = p.options, a = p.accepted, out = [];
    if (kind === 'multi') { if (o.choices.length < 2) out.push('Type at least two choices.'); if (!a.correct.length) out.push('Tick at least one correct choice.'); }
    if (kind === 'match' && o.left.length < 2) out.push('Type at least two pairs.');
    if (kind === 'order' && o.items.length < 2) out.push('Type at least two items, in the correct order.');
    if (kind === 'classify') { if (o.groups.filter(Boolean).length < 2) out.push('Name at least two groups.'); if (o.items.length < 2) out.push('Type at least two items.'); }
    if ((kind === 'gaps' || kind === 'cloze') && !a.gaps.length) out.push('Put [square brackets] round each answer in the sentence.');
    if (kind === 'cloze' && o.choices.some(function (c) { return c.length < 2; })) out.push('Each drop-down needs the correct answer and at least one wrong one: [correct|wrong].');
    if (kind === 'number' && !isFinite(a.value)) out.push('Type the correct number.');
    if (kind === 'table') { if (!o.cols.length) out.push('Type the column headings.'); if (!Object.keys(a.cells).length) out.push('Put [square brackets] round the answer in each cell students must fill in.'); }
    if (kind === 'label') { if (!o.image) out.push('Add the picture.'); if (o.spots.length < 1) out.push('Add at least one label and click the picture to place it.'); }
    if (kind === 'hotspot' && !o.image) out.push('Add the picture.');
    return out;
  }

  /* ---------------------------------------------------------------- scoring (the preview; the server does the same) */
  function score(kind, o, a, value, marks) {
    o = J(o, {}) || {}; a = J(a, {}) || {}; var n = 0, hit = 0, v, k, i;
    var blankAns = value == null || String(value).trim() === '';
    if (kind === 'number') { n = 1; var m = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/.exec(String(value == null ? '' : value).replace(/,/g, '.')); if (m && Math.abs(parseFloat(m[0]) - a.value) <= (a.tol || 0) + 1e-9) hit = 1; }
    else if (kind === 'hotspot') { n = 1; var xy = String(value || '').split(','), px = parseFloat(xy[0]), py = parseFloat(xy[1]), ra = o.ratio || 1; if (isFinite(px) && isFinite(py)) (a.zones || []).forEach(function (z) { var dx = px - z.x, dy = (py - z.y) * ra; if (dx * dx + dy * dy <= z.r * z.r) hit = 1; }); }
    else { v = blankAns ? null : J(value, null);
      if (kind === 'multi') { n = (a.correct || []).length; if (Array.isArray(v)) { var good = 0, bad = 0; v.filter(function (x, i) { return typeof x === 'number' && v.indexOf(x) === i; }).forEach(function (x) { if (a.correct.indexOf(x) >= 0) good++; else bad++; }); hit = Math.max(0, good - bad); } }
      else if (kind === 'gaps') { k = a.gaps || []; n = k.length; if (Array.isArray(v)) for (i = 0; i < n; i++) if (k[i].some(function (alt) { return norm(alt) === norm(v[i]) && norm(alt) !== ''; })) hit++; }
      else if (kind === 'table') { k = a.cells || {}; n = Object.keys(k).length; if (v && typeof v === 'object') Object.keys(k).forEach(function (c) { if (k[c].some(function (alt) { return norm(alt) === norm(v[c]) && norm(alt) !== ''; })) hit++; }); }
      else { k = a[{ match: 'pairs', classify: 'groups', label: 'spots', cloze: 'gaps', order: 'order' }[kind]] || []; n = k.length; if (Array.isArray(v)) for (i = 0; i < n; i++) if (typeof v[i] === 'number' && v[i] === k[i]) hit++; }
    }
    return { hit: hit, of: n, got: n ? Math.round((+marks || 0) * hit / n * 2) / 2 : 0, max: +marks || 0 };
  }
  /* the student's answer in words (marking screens, review) */
  function pretty(kind, o, value) {
    o = J(o, {}) || {}; if (value == null || value === '') return ''; var v = kind === 'number' || kind === 'hotspot' ? value : J(value, null); if (v == null) return String(value);
    var pick = function (list, i) { return i == null || list[i] == null ? '–' : list[i]; };
    if (kind === 'multi') return v.map(function (i) { return pick(o.choices || [], i); }).join('; ');
    if (kind === 'match') return (o.left || []).map(function (l, i) { return l + ' → ' + pick(o.right || [], v[i]); }).join('; ');
    if (kind === 'order') return v.map(function (i, k) { return (k + 1) + '. ' + pick(o.items || [], i); }).join('  ');
    if (kind === 'classify') return (o.items || []).map(function (t, i) { return t + ' → ' + pick(o.groups || [], v[i]); }).join('; ');
    if (kind === 'gaps') return String(o.text || '').replace(/\[\[(\d+)\]\]/g, function (m, n) { return '[' + (v[n - 1] || '–') + ']'; });
    if (kind === 'cloze') return String(o.text || '').replace(/\[\[(\d+)\]\]/g, function (m, n) { return '[' + pick((o.choices || [])[n - 1] || [], v[n - 1]) + ']'; });
    if (kind === 'number') return String(v) + (o.unit ? ' ' + o.unit : '');
    if (kind === 'table') return Object.keys(v).map(function (c) { var rc = c.split(','); return 'row ' + (+rc[0] + 1) + ', ' + ((o.cols || [])[rc[1]] || 'column ' + (+rc[1] + 1)) + ': ' + v[c]; }).join('; ');
    if (kind === 'label') return (o.spots || []).map(function (s, i) { return (i + 1) + ': ' + pick(o.labels || [], v[i]); }).join('; ');
    if (kind === 'hotspot') return 'Clicked the picture at ' + String(v).split(',').map(function (x) { return Math.round(parseFloat(x)) + '%'; }).join(' across, ') + ' down';
    return String(value);
  }

  /* ---------------------------------------------------------------- the student's view */
  function student(kind, o, value, onChange, opt) {
    style(); o = J(o, {}) || {}; opt = opt || {}; var lock = !!opt.locked, box = h('div', { class: 'qt qt-' + kind }), v, send = function (x) { if (onChange) onChange(typeof x === 'string' ? x : JSON.stringify(x)); };
    function sel(list, cur, on, label) { var s = h('select', { 'aria-label': label, disabled: lock, onchange: function () { on(s.value === '' ? null : +s.value); } }, [h('option', { value: '', text: 'Choose…' })].concat(list.map(function (t, i) { return h('option', { value: i, text: t, selected: cur === i }); }))); return s; }
    function line(text, each) { var p = h('p', { class: 'qt-line' }); String(text || '').split(/(\[\[\d+\]\])/).forEach(function (part) { var m = /^\[\[(\d+)\]\]$/.exec(part); if (m) p.appendChild(each(m[1] - 1)); else if (part) p.appendChild(document.createTextNode(part)); }); return p; }
    if (kind === 'multi') { v = J(value, []); (o.choices || []).forEach(function (t, i) { box.appendChild(h('label', { class: 'qt-chk' }, [h('input', { type: 'checkbox', checked: v.indexOf(i) >= 0, disabled: lock, onchange: function () { var k = v.indexOf(i); if (k >= 0) v.splice(k, 1); else v.push(i); v.sort(function (a, b) { return a - b; }); send(v.length ? v : ''); } }), h('span', { text: t })])); }); box.appendChild(h('p', { class: 'small muted', text: 'Tick every correct answer.' })); }
    else if (kind === 'match') { v = J(value, []); (o.left || []).forEach(function (l, i) { box.appendChild(h('div', { class: 'qt-row' }, [h('span', { text: l }), sel(o.right || [], v[i], function (x) { v[i] = x; for (var k = 0; k < o.left.length; k++) if (v[k] === undefined) v[k] = null; send(v); }, 'Match for ' + l)])); }); }
    else if (kind === 'order') { var seq = J(value, null) || (o.items || []).map(function (x, i) { return i; }), list = h('div', { class: 'qt qt-ord' }), paint = function () { list.innerHTML = ''; seq.forEach(function (idx, pos) {
        list.appendChild(h('div', { class: 'qt-row' }, [h('span', {}, [h('b', { text: String(pos + 1) }), ' ' + (o.items[idx] || '')]), h('button', { type: 'button', disabled: lock || pos === 0, 'aria-label': 'Move up: ' + o.items[idx], text: '▲', onclick: function () { seq.splice(pos - 1, 0, seq.splice(pos, 1)[0]); paint(); send(seq); } }), h('button', { type: 'button', disabled: lock || pos === seq.length - 1, 'aria-label': 'Move down: ' + o.items[idx], text: '▼', onclick: function () { seq.splice(pos + 1, 0, seq.splice(pos, 1)[0]); paint(); send(seq); } })])); }); };
      paint(); box.appendChild(list); box.appendChild(h('p', { class: 'small muted', text: 'Use the arrows to put the items in the correct order.' })); }
    else if (kind === 'classify') { v = J(value, []); (o.items || []).forEach(function (t, i) { box.appendChild(h('div', { class: 'qt-row' }, [h('span', { text: t }), sel(o.groups || [], v[i], function (x) { v[i] = x; for (var k = 0; k < o.items.length; k++) if (v[k] === undefined) v[k] = null; send(v); }, 'Group for ' + t)])); }); }
    else if (kind === 'gaps') { v = J(value, []); box.appendChild(line(o.text, function (i) { return h('input', { type: 'text', value: v[i] || '', 'aria-label': 'Gap ' + (i + 1), autocomplete: 'off', spellcheck: 'false', readonly: lock ? '' : null, oninput: function () { v[i] = this.value; for (var k = 0; k <= i; k++) if (v[k] == null) v[k] = ''; send(v.some(function (x) { return x && x.trim(); }) ? v : ''); } }); })); }
    else if (kind === 'cloze') { v = J(value, []); box.appendChild(line(o.text, function (i) { return sel((o.choices || [])[i] || [], v[i], function (x) { v[i] = x; for (var k = 0; k < (o.choices || []).length; k++) if (v[k] === undefined) v[k] = null; send(v); }, 'Choice ' + (i + 1)); })); }
    else if (kind === 'number') box.appendChild(h('p', { class: 'qt-line' }, [h('input', { type: 'text', inputmode: 'decimal', value: value == null ? '' : value, 'aria-label': 'Your answer' + (o.unit ? ' in ' + o.unit : ''), autocomplete: 'off', readonly: lock ? '' : null, oninput: function () { send(this.value.trim()); } }), o.unit ? ' ' + o.unit : '']));
    else if (kind === 'table') { v = J(value, {}); var tb = h('table', { class: 'qt-tab' }, [h('tr', {}, (o.cols || []).map(function (c) { return h('th', { scope: 'col', text: c }); }))]);
      (o.rows || []).forEach(function (r, ri) { tb.appendChild(h('tr', {}, r.map(function (c, ci) { return h('td', {}, [c == null ? h('input', { type: 'text', value: v[ri + ',' + ci] || '', 'aria-label': ((o.cols || [])[ci] || 'Column ' + (ci + 1)) + ', row ' + (ri + 1), autocomplete: 'off', readonly: lock ? '' : null, oninput: function () { v[ri + ',' + ci] = this.value; send(Object.keys(v).some(function (k) { return v[k] && v[k].trim(); }) ? v : ''); } }) : c]); }))); });
      box.appendChild(h('div', { style: 'overflow-x:auto' }, [tb])); }
    else if (kind === 'label') { v = J(value, []); var pic = h('div', { class: 'qt-pic' }, [h('img', { src: o.image || '', alt: 'Diagram to label' })]); (o.spots || []).forEach(function (s, i) { pic.appendChild(h('span', { class: 'qt-pin', style: 'left:' + s.x + '%;top:' + s.y + '%', text: String(i + 1) })); }); box.appendChild(pic);
      (o.spots || []).forEach(function (s, i) { box.appendChild(h('div', { class: 'qt-row' }, [h('span', {}, [h('b', { text: 'Label ' + (i + 1) })]), sel(o.labels || [], v[i], function (x) { v[i] = x; for (var k = 0; k < o.spots.length; k++) if (v[k] === undefined) v[k] = null; send(v); }, 'Label ' + (i + 1))])); }); }
    else if (kind === 'hotspot') { var hp = h('div', { class: 'qt-pic qt-hot' }, [h('img', { src: o.image || '', alt: 'Picture: click the correct part' })]), mark = function (xy) { var old = hp.querySelector('.qt-pin'); if (old) old.remove(); if (!xy) return; var p = String(xy).split(','); hp.appendChild(h('span', { class: 'qt-pin me', style: 'left:' + p[0] + '%;top:' + p[1] + '%', text: '✓' })); };
      mark(value); if (!lock) hp.firstChild.onclick = function (e) { var r = this.getBoundingClientRect(), xy = (Math.round((e.clientX - r.left) / r.width * 1000) / 10) + ',' + (Math.round((e.clientY - r.top) / r.height * 1000) / 10); mark(xy); send(xy); };
      box.appendChild(hp); box.appendChild(h('p', { class: 'small muted', text: 'Click (or tap) the correct part of the picture. Click again to change your answer.' })); }
    return box;
  }

  /* ---------------------------------------------------------------- the teacher's editor (changes the draft d in place) */
  function editor(kind, d, changed) {
    style(); var box = h('div', { class: 'qt-ed' }), ch = function () { if (changed) changed(); };
    function txt(val, ph, on, extra) { var a = { type: 'text', value: val == null ? '' : val, placeholder: ph, oninput: function () { on(this.value); ch(); } }; Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; }); return h('input', a); }
    function rows(list, make, fresh, addText) { var w = h('div', { class: 'qt-ed' }), draw = function () { w.innerHTML = ''; list.forEach(function (it, i) { var r = make(it, i); r.appendChild(h('button', { type: 'button', class: 'x', 'aria-label': 'Remove row ' + (i + 1), text: '✕', onclick: function () { list.splice(i, 1); draw(); ch(); } })); w.appendChild(r); }); w.appendChild(h('button', { type: 'button', class: 'add', text: '＋ ' + addText, onclick: function () { list.push(fresh()); draw(); ch(); var ins = w.querySelectorAll('input[type=text]'); if (ins.length) ins[ins.length - (kind === 'match' ? 2 : 1)].focus(); } })); }; draw(); return w; }
    function picker(onPlace) { var wrap = h('div', {}), holder = h('div', { class: 'qt-pic qt-hot' }), show = function () { holder.innerHTML = ''; if (!d.image) return; var im = h('img', { src: d.image, alt: 'Your picture', onclick: function (e) { var r = im.getBoundingClientRect(); onPlace(Math.round((e.clientX - r.left) / r.width * 1000) / 10, Math.round((e.clientY - r.top) / r.height * 1000) / 10, im); } }); im.onload = function () { if (kind === 'hotspot') d.ratio = Math.round(im.naturalHeight / im.naturalWidth * 1000) / 1000 || 1; overlay(); }; holder.appendChild(im); overlay(); };
      var overlay = function () { holder.querySelectorAll('.qt-pin,.qt-zone').forEach(function (x) { x.remove(); }); if (kind === 'label') d.spots.forEach(function (s, i) { if (s.x != null) holder.appendChild(h('span', { class: 'qt-pin', style: 'left:' + s.x + '%;top:' + s.y + '%', text: String(i + 1) })); }); else if (d.image) holder.appendChild(h('span', { class: 'qt-zone', style: 'left:' + d.x + '%;top:' + d.y + '%;width:' + (2 * d.r) + '%;aspect-ratio:1' })); };
      if (window.BVM && BVM.picField) { var pf = h('div', {}); BVM.picField(pf, { value: d.image || '', uid: window.BVM_UID, label: 'Add the picture or diagram', onChange: function (src) { d.image = src; show(); ch(); } }); wrap.appendChild(pf); } else wrap.appendChild(h('div', { class: 'r' }, [h('input', { type: 'url', value: d.image || '', placeholder: 'Link to the picture (https://…)', 'aria-label': 'Link to the picture', oninput: function () { d.image = this.value.trim(); show(); ch(); } })])); wrap.appendChild(holder); show(); wrap.redraw = overlay; return wrap; }
    if (kind === 'multi') { box.appendChild(h('p', { class: 'hint', text: 'Tick every choice that is correct.' })); box.appendChild(rows(d.choices, function (c, i) { return h('div', { class: 'r' }, [h('input', { type: 'checkbox', checked: c.ok, 'aria-label': 'Choice ' + (i + 1) + ' is correct', onchange: function () { c.ok = this.checked; ch(); } }), txt(c.t, 'Choice ' + (i + 1), function (v) { c.t = v; })]); }, function () { return { t: '', ok: false }; }, 'Add a choice')); }
    else if (kind === 'match') { box.appendChild(h('p', { class: 'hint', text: 'Type each pair side by side. Students see the right-hand side shuffled.' })); box.appendChild(rows(d.pairs, function (p, i) { return h('div', { class: 'r' }, [txt(p.l, 'Item ' + (i + 1), function (v) { p.l = v; }), h('span', { text: '→' }), txt(p.r, 'Its match', function (v) { p.r = v; })]); }, function () { return { l: '', r: '' }; }, 'Add a pair')); }
    else if (kind === 'order') { box.appendChild(h('p', { class: 'hint', text: 'Type the items in the CORRECT order. Students see them shuffled.' })); box.appendChild(rows(d.items, function (t, i) { return h('div', { class: 'r' }, [h('b', { text: (i + 1) + '.' }), txt(t, 'Step ' + (i + 1), function (v) { d.items[i] = v; })]); }, function () { return ''; }, 'Add an item')); }
    else if (kind === 'classify') { var itemsBox = h('div', {}), drawItems = function () { itemsBox.innerHTML = ''; itemsBox.appendChild(rows(d.items, function (it, i) { var s = h('select', { 'aria-label': 'Group for item ' + (i + 1), onchange: function () { it.g = +this.value; ch(); } }, d.groups.map(function (g, gi) { return h('option', { value: gi, text: g || 'Group ' + (gi + 1), selected: (+it.g || 0) === gi }); })); return h('div', { class: 'r' }, [txt(it.t, 'Item ' + (i + 1), function (v) { it.t = v; }), s]); }, function () { return { t: '', g: 0 }; }, 'Add an item')); };
      box.appendChild(h('label', { class: 'hint', text: 'Groups (separate with commas)' })); box.appendChild(txt(d.groups.join(', '), 'Metals, Non-metals', function (v) { d.groups = v.split(',').map(function (x) { return x.trim(); }); if (d.groups.length < 2) d.groups.push(''); drawItems(); }, { 'aria-label': 'Groups' })); box.appendChild(h('p', { class: 'hint', text: 'Items, each with its correct group:' })); box.appendChild(itemsBox); drawItems(); }
    else if (kind === 'gaps' || kind === 'cloze') { box.appendChild(h('p', { class: 'hint', html: kind === 'gaps' ? 'Write the sentence and put <b>[square brackets]</b> round each answer. Other accepted spellings go after a bar: <b>[colour|color]</b>.' : 'Write the sentence and put the choices in <b>[square brackets]</b>, the correct one first: <b>[force|voltage|charge]</b>.' }));
      box.appendChild(h('textarea', { 'aria-label': 'Sentence with gaps', placeholder: kind === 'gaps' ? 'Plants make [glucose] by [photosynthesis].' : 'A wire carrying a current in a magnetic field feels a [force|voltage|charge].', value: d.text, oninput: function () { d.text = this.value; ch(); } })); }
    else if (kind === 'number') box.appendChild(h('div', { class: 'r' }, [h('label', { class: 'hint', text: 'Correct number' }), txt(d.value, '96', function (v) { d.value = v; }, { inputmode: 'decimal', 'aria-label': 'Correct number' }), h('label', { class: 'hint', text: 'Accept ±' }), txt(d.tol, '0.5', function (v) { d.tol = v; }, { inputmode: 'decimal', 'aria-label': 'Tolerance' }), h('label', { class: 'hint', text: 'Unit shown' }), txt(d.unit, 'N', function (v) { d.unit = v; }, { 'aria-label': 'Unit' })]));
    else if (kind === 'table') { box.appendChild(h('label', { class: 'hint', text: 'Column headings (separate with commas)' })); box.appendChild(txt(d.cols, 'Planet, Time for one orbit', function (v) { d.cols = v; }, { 'aria-label': 'Column headings' }));
      box.appendChild(h('p', { class: 'hint', html: 'One row per line, cells separated by a bar <b>|</b>. Put <b>[square brackets]</b> round a cell students must fill in.' })); box.appendChild(h('textarea', { 'aria-label': 'Table rows', placeholder: 'Mercury | [88 days|88]\nEarth | [1 year|365 days]', value: d.rows, oninput: function () { d.rows = this.value; ch(); } })); }
    else if (kind === 'label') { var cur = -1, pk = picker(function (x, y) { if (cur < 0 || !d.spots[cur]) { cur = d.spots.length; d.spots.push({ t: '', x: x, y: y }); } else { d.spots[cur].x = x; d.spots[cur].y = y; } cur = -1; drawSpots(); pk.redraw(); ch(); }), spotsBox = h('div', {}), drawSpots = function () { spotsBox.innerHTML = '';
        d.spots.forEach(function (s, i) { spotsBox.appendChild(h('div', { class: 'r' }, [h('b', { text: (i + 1) + '.' }), txt(s.t, 'Label ' + (i + 1), function (v) { s.t = v; }), h('button', { type: 'button', class: 'add', text: cur === i ? 'Now click the picture' : '📍 Move', onclick: function () { cur = i; drawSpots(); } }), h('button', { type: 'button', class: 'x', 'aria-label': 'Remove label ' + (i + 1), text: '✕', onclick: function () { d.spots.splice(i, 1); drawSpots(); pk.redraw(); ch(); } })])); }); };
      box.appendChild(pk); box.appendChild(h('p', { class: 'hint', text: 'Click the picture where a label belongs, then type the label. Students choose each numbered label from a list.' })); box.appendChild(spotsBox); drawSpots(); box.appendChild(h('label', { class: 'hint', text: 'Extra wrong labels (optional, separate with commas)' })); box.appendChild(txt(d.extra, 'nucleus, cell wall', function (v) { d.extra = v; }, { 'aria-label': 'Extra wrong labels' })); }
    else if (kind === 'hotspot') { var pk2 = picker(function (x, y) { d.x = x; d.y = y; pk2.redraw(); ch(); }); box.appendChild(pk2); box.appendChild(h('p', { class: 'hint', text: 'Click the picture on the correct part. The green circle is the area that counts as correct.' }));
      box.appendChild(h('div', { class: 'r' }, [h('label', { class: 'hint', text: 'Size of the correct area' }), h('input', { type: 'range', min: 3, max: 30, value: d.r, 'aria-label': 'Size of the correct area', oninput: function () { d.r = +this.value; pk2.redraw(); ch(); } })])); }
    return box;
  }

  window.BVQT = { KINDS: KINDS, has: has, name: function (k) { return NAMES[k] ? NAMES[k][1] + ' ' + NAMES[k][2] : k; }, blank: blank, pack: pack, unpack: unpack, problems: problems, score: score, pretty: pretty, student: student, editor: editor, norm: norm };
})();
