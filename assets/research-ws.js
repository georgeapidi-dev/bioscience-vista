/* BioscienceVista · VISTA Research Hub · interactive worksheets engine (content in research-ws-data.js; loaded before research.js).
   A worksheet is a list of sections; each has guidance, an exemplar extract and tasks with instant feedback:
   text (with rule hints), mcq, classify, num (checked with a tolerance), rq (research-question checker), data (simulator
   data table, processed automatically), stats (test on that table) and graph. Answers save in the browser and, for signed-in
   students with a project, in the project (data.worksheets). Guided worksheets can send answers into the IA or EE project. */
(function () {
  'use strict';
  var RH = window.RH = window.RH || {}, W = RH.ws = {}, R = window.RStats;
  var E = function (s) { return RH.E(s); };
  W.list = function () { return window.RH_WS || []; };
  W.get = function (id) { return W.list().filter(function (x) { return x.id === id; })[0]; };
  var KEY = function (id) { return 'rh-ws-' + id; };
  function load(id) { try { return JSON.parse(localStorage.getItem(KEY(id)) || '{}'); } catch (e) { return {}; } }
  function store(id, st) { try { localStorage.setItem(KEY(id), JSON.stringify(st)); } catch (e) {} }
  var nums = function (s) { return String(s || '').split(/[\s,;]+/).filter(function (x) { return x !== '' && isFinite(+x); }).map(Number); };

  /* ---------- the student's project of the matching kind (to save to the account and to send answers into) ---------- */
  function project(kind) {
    if (!RH.me || RH.teacher) return Promise.resolve(null);
    return RH.S.db.from('research_projects').select('id,kind,data,stage').eq('student_id', RH.me.user.id).eq('kind', kind).neq('status', 'archived').order('updated_at', { ascending: false }).limit(1).then(function (r) { return (r.data || [])[0] || null; });
  }
  var saveT = null;
  function saveAccount(ws, st) {
    clearTimeout(saveT); saveT = setTimeout(function () {
      project(ws.target || 'ia').then(function (p) { if (!p) return;
        return RH.S.db.from('research_projects').select('data').eq('id', p.id).single().then(function (r) { var d = (r.data && r.data.data) || {}; d.worksheets = d.worksheets || {}; d.worksheets[ws.id] = { a: st.a, at: new Date().toISOString(), pct: progress(ws, st) }; return RH.S.db.from('research_projects').update({ data: d }).eq('id', p.id); }); }).then(function () { var m = document.getElementById('ws-save'); if (m) m.textContent = 'Saved to your account'; }, function () {});
    }, 2000);
  }

  /* ---------- completion ---------- */
  function taskDone(t, st) {
    var a = st.a[t.k];
    switch (t.type) {
      case 'text': case 'rq': return RH.words(a) >= (t.min || 8);
      case 'mcq': return a === t.a;
      case 'num': return a != null && a !== '' && numOk(t, +a, st);
      case 'classify': return Array.isArray(a) && t.items.every(function (it, i) { return +a[i] === it[1]; });
      case 'data': return dataRows(t, st).filter(function (r) { return r.vals.length >= 2; }).length >= Math.min(3, t.levels.length);
      default: return true;
    }
  }
  function graded(ws) { var out = []; ws.sections.forEach(function (s) { (s.tasks || []).forEach(function (t) { if (['text', 'rq', 'mcq', 'num', 'classify', 'data'].indexOf(t.type) >= 0) out.push(t); }); }); return out; }
  function progress(ws, st) { var g = graded(ws); return g.length ? Math.round(g.filter(function (t) { return taskDone(t, st); }).length / g.length * 100) : 0; }
  function answerOf(t, st) { return typeof t.a === 'function' ? t.a(st, R) : t.a; }
  function numOk(t, v, st) { var a = answerOf(t, st); if (a == null || !isFinite(a)) return false; var tol = t.tol != null ? t.tol : Math.max(Math.abs(a) * 0.02, 0.005); return Math.abs(v - a) <= tol; }
  function dataRows(t, st) { var d = st.a[t.k] || {}; return t.levels.map(function (lv, i) { return { x: lv, vals: (d[i] || []).filter(function (v) { return v !== '' && v != null && isFinite(+v); }).map(Number) }; }); }
  function dsFrom(t, st) { var cols = [{ name: t.iv, unit: t.ivUnit || '', kind: 'iv' }]; for (var j = 0; j < t.trials; j++) cols.push({ name: 'Trial ' + (j + 1), unit: t.dvUnit || '', kind: 'trial' }); var d = st.a[t.k] || {}; return { columns: cols, rows: t.levels.map(function (lv, i) { return [String(lv)].concat(Array.apply(null, { length: t.trials }).map(function (_, j) { var v = (d[i] || [])[j]; return v == null ? '' : String(v); })); }) }; }

  /* ---------- list page ---------- */
  W.page = function () {
    var L = W.list(), groups = [['IA', '🧬 Guided IA worksheets'], ['EE', '📝 Guided extended essay worksheets (one per subject)'], ['Practice', '🧮 Practice worksheets with worked examples']];
    var m = RH.shell('#/worksheets', '<div class="rh-card"><h2>🧭 Interactive worksheets</h2><p class="small">Work through each section on screen: read the guidance, look at the exemplar, then write your own version or answer the questions. You get feedback straight away, and your answers save as you go. Guided worksheets can send your answers straight into your IA or EE project.</p></div>' +
      groups.map(function (g) { var items = L.filter(function (w) { return w.group === g[0]; }); if (!items.length) return '';
        return '<div class="rh-card"><h3>' + g[1] + '</h3><div class="rh-grid">' + items.map(function (w) { var st = load(w.id), pc = progress(w, Object.assign({ a: {} }, st));
          return '<div class="rh-item"><div class="rh-head"><b>' + E(w.title) + '</b>' + (w.subject ? '<span class="rh-badge info">' + E(w.subject) + '</span>' : '') + '</div><span class="small">' + E(w.summary) + '</span><div class="rh-prog"><i style="width:' + pc + '%"></i></div><span class="meta">' + pc + '% done · about ' + (w.minutes || 40) + ' minutes' + (w.sim ? ' · uses a simulator' : '') + '</span><div class="btns"><a class="btn sm main" href="#/ws/' + w.id + '">' + (pc ? 'Continue' : 'Start') + '</a>' + (w.download ? '<a class="btn sm" href="/assets/research-resources/' + w.download + '" download>Exemplar (Word)</a>' : '') + '</div></div>'; }).join('') + '</div></div>'; }).join(''));
  };

  /* ---------- one worksheet ---------- */
  W.open = function (id) {
    var ws = W.get(id); if (!ws) { location.hash = '#/worksheets'; return; }
    (W._ls || []).forEach(function (f) { document.removeEventListener('wsdata', f); }); W._ls = [];
    var st = Object.assign({ a: {} }, load(id)); st.a = st.a || {};
    var html = '<div class="rh-card"><div class="rh-head"><div><p class="label">' + E(ws.group === 'EE' ? 'Extended essay · ' + ws.subject : ws.group === 'IA' ? 'Biology IA · guided' : 'Practice') + '</p><h2>' + E(ws.title) + '</h2></div><div style="min-width:200px"><div class="rh-prog"><i id="ws-bar"></i></div><span class="small muted" id="ws-pc"></span> <span class="small muted" id="ws-save"></span></div></div><p class="small">' + E(ws.summary) + '</p>' +
      '<div class="btns">' + (ws.sim ? '<a class="btn sm main" href="' + ws.sim[0] + '" target="_blank" rel="noopener">🔬 Open the ' + E(ws.sim[1]) + '</a>' : '') + (ws.download ? '<a class="btn sm" href="/assets/research-resources/' + ws.download + '" download>📄 Exemplar (Word)</a>' : '') + '<button class="btn sm" id="ws-docx" type="button">⬇ Download my answers (Word)</button>' + (ws.target ? '<button class="btn sm" id="ws-send" type="button">➡ Send my answers to my ' + (ws.target === 'ee' ? 'EE' : 'IA') + ' project</button>' : '') + '<button class="btn sm bad" id="ws-reset" type="button">Start again</button></div>' +
      '<nav class="rh-tabs" aria-label="Sections">' + ws.sections.map(function (s, i) { return '<button type="button" data-go="' + i + '">' + (i + 1) + '. ' + E(s.title) + '</button>'; }).join('') + '</nav></div>' +
      ws.sections.map(function (s, i) { return '<section class="rh-card" id="ws-s' + i + '"><h3>' + (i + 1) + '. ' + E(s.title) + '</h3>' + (s.guide || []).map(function (g) { return '<p class="small">' + g + '</p>'; }).join('') + exHtml(s.example) + (s.tasks || []).map(function (t, j) { return '<div class="rh-card" style="padding:12px;box-shadow:none" data-t="' + i + '.' + j + '">' + taskHtml(t, st) + '<div class="small" data-fb aria-live="polite"></div></div>'; }).join('') + '</section>'; }).join('');
    var m = RH.shell('#/worksheets', html);
    var bar = function () { var pc = progress(ws, st); m.querySelector('#ws-bar').style.width = pc + '%'; m.querySelector('#ws-pc').textContent = pc + '% done'; };
    var save = function () { store(id, st); bar(); var s = m.querySelector('#ws-save'); if (s) s.textContent = 'Saved'; saveAccount(ws, st); };
    ws.sections.forEach(function (s, i) { (s.tasks || []).forEach(function (t, j) { wire(m.querySelector('[data-t="' + i + '.' + j + '"]'), t, st, save, ws); }); });
    m.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { m.querySelector('#ws-s' + b.dataset.go).scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    m.querySelector('#ws-reset').onclick = function () { if (!confirm('Clear all your answers on this worksheet? This cannot be undone.')) return; st = { a: {} }; store(id, st); W.open(id); };
    m.querySelector('#ws-docx').onclick = function () { exportDocx(ws, st); };
    var sb = m.querySelector('#ws-send'); if (sb) sb.onclick = function () { send(ws, st); };
    bar();
    if (!localStorage.getItem(KEY(id)) && RH.me && !RH.teacher) project(ws.target || 'ia').then(function (p) { var saved = p && p.data && p.data.worksheets && p.data.worksheets[id]; if (saved && saved.a && confirm('You have saved answers for this worksheet in your account (' + RH.date(saved.at, true) + '). Load them?')) { st = { a: saved.a }; store(id, st); W.open(id); } });
  };
  function exHtml(ex) {
    if (!ex) return '';
    var body = Array.isArray(ex.text) ? ex.text.map(function (p) { return '<p class="small">' + p + '</p>'; }).join('') : ex.text ? '<p class="small">' + ex.text + '</p>' : '';
    if (ex.table) body += '<div class="scroll"><table class="dt"><thead><tr>' + ex.table[0].map(function (h) { return '<th>' + E(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + ex.table.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + E(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    if (ex.note) body += '<p class="small muted"><b>Why it works:</b> ' + ex.note + '</p>';
    return '<details class="rh-item" style="background:color-mix(in srgb,var(--sun) 8%,var(--raised))"><summary><b class="small">📘 ' + E(ex.title || 'Exemplar extract') + '</b> <span class="rh-badge">teacher-created example</span></summary>' + body + '</details>';
  }
  function taskHtml(t, st) {
    var a = st.a[t.k];
    switch (t.type) {
      case 'text': return '<div class="rh-field"><label for="w-' + t.k + '">' + E(t.label) + '</label>' + (t.tip ? '<span class="tip">' + t.tip + '</span>' : '') + (t.short ? '<input type="text" id="w-' + t.k + '" value="' + E(a || '') + '">' : '<textarea id="w-' + t.k + '"' + (t.tall ? ' class="tall"' : '') + '>' + E(a || '') + '</textarea>') + '<span class="tip" data-wc></span></div>';
      case 'rq': return '<div class="rh-field"><label for="w-' + t.k + '">' + E(t.label || 'Your research question') + '</label>' + (t.tip ? '<span class="tip">' + t.tip + '</span>' : '') + '<textarea id="w-' + t.k + '">' + E(a || '') + '</textarea></div>';
      case 'mcq': return '<p class="small"><b>' + t.q + '</b></p><div class="rh-list">' + t.opts.map(function (o, i) { return '<label class="chk small"><input type="radio" name="w-' + t.k + '" value="' + i + '"' + (a === i ? ' checked' : '') + '> ' + o + '</label>'; }).join('') + '</div>';
      case 'num': return '<p class="small"><b>' + t.q + '</b></p><div class="btns" style="flex-wrap:nowrap"><input type="number" step="any" id="w-' + t.k + '" value="' + (a == null ? '' : E(a)) + '" style="max-width:180px" aria-label="Your answer"> <span class="small">' + E(t.unit || '') + '</span><button class="btn xs" type="button" data-check>Check</button>' + (t.hint ? '<button class="btn xs" type="button" data-hint>Hint</button>' : '') + '</div>';
      case 'classify': return '<p class="small"><b>' + t.q + '</b></p><div class="scroll"><table class="dt"><tbody>' + t.items.map(function (it, i) { return '<tr><td class="small">' + it[0] + '</td><td style="width:220px"><select data-i="' + i + '" aria-label="Category"><option value=""></option>' + t.cats.map(function (c, k) { return '<option value="' + k + '"' + (Array.isArray(a) && +a[i] === k && a[i] !== '' && a[i] != null ? ' selected' : '') + '>' + E(c) + '</option>'; }).join('') + '</select></td></tr>'; }).join('') + '</tbody></table></div><div class="btns"><button class="btn xs" type="button" data-check>Check my answers</button></div>';
      case 'data': return '<p class="small"><b>' + E(t.label || 'Your data') + '</b></p>' + (t.tip ? '<p class="tip small">' + t.tip + '</p>' : '') + '<div class="scroll"><table class="dt"><thead><tr><th>' + E(t.iv) + (t.ivUnit ? ' / ' + E(t.ivUnit) : '') + '</th>' + Array.apply(null, { length: t.trials }).map(function (_, j) { return '<th>Trial ' + (j + 1) + (t.dvUnit ? ' / ' + E(t.dvUnit) : '') + '</th>'; }).join('') + '</tr></thead><tbody>' + t.levels.map(function (lv, i) { return '<tr><td><b>' + E(lv) + '</b></td>' + Array.apply(null, { length: t.trials }).map(function (_, j) { var v = ((a || {})[i] || [])[j]; return '<td><input type="number" step="any" data-c="' + i + '.' + j + '" value="' + (v == null ? '' : E(v)) + '" aria-label="' + E(t.iv + ' ' + lv + ' trial ' + (j + 1)) + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + (t.example ? '<div class="btns"><button class="btn xs" type="button" data-ex>Fill with the exemplar data (to practise)</button></div>' : '') + '<div data-pro></div>';
      case 'stats': return '<p class="small"><b>' + E(t.label || 'Statistical test on your data') + '</b></p><div data-st></div>';
      case 'graph': return '<p class="small"><b>' + E(t.label || 'Graph of your data') + '</b></p><div class="rh-graph" data-gr></div><div class="btns"><button class="btn xs" type="button" data-png>Download PNG</button></div>';
      case 'info': return '<div class="small">' + t.html + '</div>';
    }
    return '';
  }
  function wire(box, t, st, save, ws) {
    if (!box) return; var fb = box.querySelector('[data-fb]');
    var say = function (ok, msg) { fb.innerHTML = '<span class="rh-badge ' + (ok ? 'ok' : 'warn') + '">' + (ok ? '✔ Correct' : '✘ Not yet') + '</span> ' + msg; };
    if (t.type === 'text' || t.type === 'rq') {
      var el = box.querySelector('#w-' + t.k), wc = box.querySelector('[data-wc]');
      var hint = function () {
        var v = el.value; if (wc) wc.textContent = RH.words(v) + ' words' + (t.min ? ' (aim for at least ' + t.min + ')' : '');
        if (t.type === 'rq') { if (!v.trim()) { fb.innerHTML = ''; return; } var c = (t.kind === 'ee' ? RH.ee.rqCheck(v, {}) : RH.ia.rqCheck(v, {})); fb.innerHTML = '<span class="rh-badge ' + c.level[1] + '">' + c.level[0] + ' · ' + c.score + '/' + c.max + '</span>' + RH.ia.meter(c.rows); return; }
        if (t.rules && v.trim()) fb.innerHTML = RH.ia.meter(t.rules.map(function (r) { var ok = new RegExp(r[0], 'i').test(v); return [ok ? 'ok' : (r[3] || 'mid'), ok ? r[1] : r[2]]; })); else fb.innerHTML = '';
      };
      el.addEventListener('input', function () { st.a[t.k] = el.value; save(); hint(); }); hint();
    }
    if (t.type === 'mcq') box.querySelectorAll('input[type=radio]').forEach(function (r) { r.onchange = function () { st.a[t.k] = +r.value; save(); say(+r.value === t.a, (t.fb && t.fb[+r.value]) || t.why || ''); }; if (r.checked) say(+r.value === t.a, (t.fb && t.fb[+r.value]) || t.why || ''); });
    if (t.type === 'num') { var inp = box.querySelector('input'); inp.oninput = function () { st.a[t.k] = inp.value; save(); }; box.querySelector('[data-check]').onclick = function () { var ok = numOk(t, +inp.value, st), a = answerOf(t, st); say(ok, ok ? (t.why || '') : 'Check your working and try again.'); if (!ok) fb.innerHTML += ' <button class="btn xs" type="button" data-show>Show the worked answer</button>'; var sh = fb.querySelector('[data-show]'); if (sh) sh.onclick = function () { fb.innerHTML = '<span class="rh-badge info">Worked answer</span> ' + (t.work ? t.work(st, R) : 'Answer: ' + R.sig(a, 4) + ' ' + (t.unit || '')) + (t.why ? '<br>' + t.why : ''); }; }; var hb = box.querySelector('[data-hint]'); if (hb) hb.onclick = function () { fb.innerHTML = '<span class="rh-badge info">Hint</span> ' + t.hint; }; }
    if (t.type === 'classify') { var sel = box.querySelectorAll('select'); sel.forEach(function (s) { s.onchange = function () { var a = st.a[t.k] || []; a[+s.dataset.i] = s.value === '' ? '' : +s.value; st.a[t.k] = a; save(); }; });
      box.querySelector('[data-check]').onclick = function () { var a = st.a[t.k] || [], wrong = t.items.map(function (it, i) { return +a[i] === it[1] && a[i] !== '' && a[i] != null ? null : i; }).filter(function (x) { return x != null; }); sel.forEach(function (s) { var i = +s.dataset.i; s.style.outline = wrong.indexOf(i) >= 0 ? '2px solid var(--bad)' : '2px solid var(--ok)'; }); say(!wrong.length, wrong.length ? wrong.length + ' still to put right (outlined in orange). ' + (t.hint || '') : (t.why || 'All correct.')); }; }
    if (t.type === 'data') {
      var pro = box.querySelector('[data-pro]');
      var redraw = function () { var ds = dsFrom(t, st), pr = RH.data.processed(ds); pro.innerHTML = pr && pr.rows.some(function (r) { return r.n; }) ? '<p class="small"><b>Processed automatically</b></p>' + RH.data.processedTable(pr, ds) + RH.ia.meter(RH.data.validate(ds).issues.filter(function (x) { return !/no unit|uncertainty \(±\)/.test(x[1]); }).slice(0, 4)) : ''; box.dispatchEvent(new CustomEvent('wsdata', { bubbles: true })); };
      box.querySelectorAll('[data-c]').forEach(function (inp) { inp.onchange = function () { var k = inp.dataset.c.split('.'), d = st.a[t.k] || {}; d[k[0]] = d[k[0]] || []; d[k[0]][+k[1]] = inp.value === '' ? '' : +inp.value; st.a[t.k] = d; save(); redraw(); }; });
      var exb = box.querySelector('[data-ex]'); if (exb) exb.onclick = function () { if (!confirm('Replace your table with the exemplar data? Use it to practise; your IA must use data you collect yourself.')) return; var d = {}; t.example.forEach(function (row, i) { d[i] = row.slice(); }); st.a[t.k] = d; save(); W.open(ws.id); };
      redraw();
    }
    if (t.type === 'stats' || t.type === 'graph') {
      var src = ws.sections.reduce(function (f, s) { return f || (s.tasks || []).filter(function (x) { return x.type === 'data' && x.k === t.from; })[0]; }, null);
      var draw = function () {
        var rows = dataRows(src, st).filter(function (r) { return r.vals.length >= 2; });
        if (t.type === 'stats') { var out = box.querySelector('[data-st]'); if (rows.length < 2) { out.innerHTML = '<p class="small muted">Enter at least two repeats for two or more levels to run the test.</p>'; return; }
          var res = t.test === 'spearman' || t.test === 'pearson' ? R[t.test]([].concat.apply([], rows.map(function (r) { return r.vals.map(function () { return +r.x; }); })), [].concat.apply([], rows.map(function (r) { return r.vals; }))) : rows.length === 2 ? R.tTest(rows[0].vals, rows[1].vals) : R.anova(rows.map(function (r) { return r.vals; }));
          out.innerHTML = res.error ? '<p class="small">' + E(res.error) + '</p>' : '<div class="rh-kpi"><div><b>' + R.fmt(res.stat) + '</b><span>' + E(res.statName) + '</span></div><div><b>' + (Array.isArray(res.df) ? res.df.map(function (x) { return R.fmt(x); }).join(', ') : R.fmt(res.df)) + '</b><span>degrees of freedom</span></div><div><b>' + (res.p < 0.001 ? '< 0.001' : R.sig(res.p, 3)) + '</b><span>p-value</span></div></div><p class="small">' + E(R.interpret(res, 0.05)) + '</p>' + (t.note ? '<p class="small muted">' + t.note + '</p>' : ''); }
        else { var g = box.querySelector('[data-gr]'); if (rows.length < 2) { g.innerHTML = '<p class="small muted" style="padding:14px">Enter data to draw the graph.</p>'; return; } var ds = dsFrom(src, st), cfg = { type: 'scatter', err: 'sd', points: 'means', fig: 1, title: t.title || (src.dv + ' against ' + src.iv), xTitle: src.iv + (src.ivUnit ? ' / ' + src.ivUnit : ''), yTitle: 'Mean ' + src.dv.toLowerCase() + (src.dvUnit ? ' / ' + src.dvUnit : ''), caption: 'Mean of the repeats; error bars ± 1 SD.', line: true }; cfg.type = t.line ? 'line' : 'scatter'; var svg = RH.data.render(cfg, RH.data.graphData(cfg, ds)); g.innerHTML = svg; box.querySelector('[data-png]').onclick = function () { RH.data.exportPNG(svg, ws.id + '-graph'); }; }
      };
      document.addEventListener('wsdata', draw); W._ls.push(draw); draw();
    }
  }

  /* ---------- download answers ---------- */
  function exportDocx(ws, st) {
    if (!window.JSZip) return RH.toast('The export tool did not load.');
    var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var P = function (t, sty) { return String(t || '').split(/\n+/).filter(function (x) { return x.trim(); }).map(function (x) { return '<w:p>' + (sty ? '<w:pPr><w:pStyle w:val="' + sty + '"/></w:pPr>' : '') + '<w:r><w:t xml:space="preserve">' + esc(x) + '</w:t></w:r></w:p>'; }).join(''); };
    var body = P(ws.title, 'Title') + P('Worksheet by BioscienceVista · VISTA Research Hub · my answers, ' + new Date().toLocaleDateString());
    ws.sections.forEach(function (s, i) { body += P((i + 1) + '. ' + s.title, 'Heading1'); (s.tasks || []).forEach(function (t) { var a = st.a[t.k]; if (t.type === 'text' || t.type === 'rq') { body += P(t.label || 'Research question', 'Heading2') + P(a || '(not answered yet)'); } else if (t.type === 'data') { var rows = dataRows(t, st); body += P(t.label || 'Data', 'Heading2') + rows.map(function (r) { return P(t.iv + ' ' + r.x + ': ' + (r.vals.join(', ') || '—') + (r.vals.length > 1 ? ' (mean ' + R.sig(R.mean(r.vals), 3) + ', SD ' + R.sig(R.sd(r.vals), 3) + ')' : '')); }).join(''); } }); });
    var z = new window.JSZip();
    z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
    z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    z.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    z.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="0F766E"/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style></w:styles>');
    z.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>');
    z.generateAsync({ type: 'blob' }).then(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = ws.id + '-my-answers.docx'; a.click(); });
  }

  /* ---------- send answers into the IA or EE project (fills empty sections only) ---------- */
  function send(ws, st) {
    if (!RH.me || RH.teacher) return RH.toast('Sign in as a student to use this.');
    project(ws.target).then(function (p) {
      if (!p) { if (confirm('You have no ' + (ws.target === 'ee' ? 'EE' : 'IA') + ' project yet. Start one now? Then come back and send your answers.')) location.hash = '#/new/' + ws.target; return; }
      var d = p.data || {}, filled = 0, skipped = 0;
      var setp = function (path, val) { var o = d, ks = path.split('.'); for (var i = 0; i < ks.length - 1; i++) { o[ks[i]] = o[ks[i]] || {}; o = o[ks[i]]; } var cur = o[ks[ks.length - 1]]; if (cur && String(cur).trim()) { skipped++; return; } o[ks[ks.length - 1]] = val; filled++; };
      var datasetTask = null;
      ws.sections.forEach(function (s) { (s.tasks || []).forEach(function (t) { var a = st.a[t.k]; if (t.map && typeof a === 'string' && a.trim()) { if (/^ee_write:/.test(t.map)) { var head = t.map.slice(9); d.ee_write = d.ee_write || {}; if (!d.ee_write.sections) d.ee_write.sections = [['Introduction', false], ['Background', false], ['Research methodology', false], ['Analysis and discussion', false], ['Evaluation', false], ['Conclusion', false], ['References', true]].map(function (x) { return { id: Math.random().toString(36).slice(2, 8), heading: x[0], text: '', excluded: x[1] }; }); var sec = d.ee_write.sections.filter(function (x) { return x.heading === head; })[0]; if (!sec) { sec = { id: Math.random().toString(36).slice(2, 8), heading: head, text: '', excluded: /reference|bibliograph/i.test(head) }; d.ee_write.sections.push(sec); } if (sec.text && sec.text.trim()) skipped++; else { sec.text = a; filled++; } } else setp(t.map, a); } if (t.type === 'data' && ws.target === 'ia') datasetTask = t; }); });
      if (!confirm('Copy ' + filled + ' answer(s) into empty sections of your project' + (skipped ? ' (' + skipped + ' section(s) you have already written will not be changed)' : '') + (datasetTask ? ', and add your data table as a data set' : '') + '?')) return;
      var jobs = [RH.S.db.from('research_projects').update({ data: d, rq: (d.rq && d.rq.text) || (d.ee_rq && d.ee_rq.text) || null }).eq('id', p.id)];
      if (datasetTask && dataRows(datasetTask, st).some(function (r) { return r.vals.length; })) { var ds = dsFrom(datasetTask, st); jobs.push(RH.S.db.from('research_datasets').insert({ project_id: p.id, name: ws.title + ' (from the worksheet)', columns: ds.columns, rows: ds.rows })); }
      return Promise.all(jobs).then(function (rs) { var e = rs.filter(function (r) { return r.error; })[0]; if (e) throw e.error; RH.toast('Copied into your project'); if (confirm('Open your project now?')) location.hash = '#/p/' + p.id + '/'; });
    }).catch(RH.err);
  }
})();
