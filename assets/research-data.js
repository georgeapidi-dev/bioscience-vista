/* VistaEd · VISTA Research Hub · data collection workspace, statistics lab and graph studio (loaded before research.js).
   Data sets live in research_datasets: the original raw rows are locked once recorded (never changed or deleted), and the
   working copy keeps a version history. Validation flags problems but never removes a value. Statistics: research-stats.js. */
(function () {
  'use strict';
  var RH = window.RH = window.RH || {}, D = RH.data = {}, R = window.RStats;
  var E = function (s) { return RH.E(s); };
  var NUM = /^\s*-?\d+(\.\d+)?([eE]-?\d+)?\s*$/;
  var isNum = function (v) { return v != null && NUM.test(String(v)); };
  var dp = function (v) { var m = String(v).trim().match(/\.(\d+)$/); return m ? m[1].length : 0; };

  /* ---------- import: CSV and XLSX (first sheet) ---------- */
  D.parseCSV = function (text) {
    var rows = [], row = [], cell = '', q = false, sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : (text.indexOf('\t') >= 0 && text.indexOf(',') < 0 ? '\t' : ',');
    for (var i = 0; i < text.length; i++) { var c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c; }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  };
  D.parseXLSX = function (buf) {
    if (!window.JSZip) return Promise.reject(new Error('The spreadsheet reader did not load. Save the sheet as CSV and import that.'));
    return window.JSZip.loadAsync(buf).then(function (z) {
      var ss = z.file('xl/sharedStrings.xml'), wbr = z.file('xl/_rels/workbook.xml.rels'), wb = z.file('xl/workbook.xml');
      return Promise.all([ss ? ss.async('string') : '', wb ? wb.async('string') : '', wbr ? wbr.async('string') : '']).then(function (x) {
        var P = new DOMParser(), strs = [];
        if (x[0]) P.parseFromString(x[0], 'application/xml').querySelectorAll('si').forEach(function (si) { strs.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join('')); });
        var first = 'xl/worksheets/sheet1.xml';
        try { var rid = P.parseFromString(x[1], 'application/xml').getElementsByTagName('sheet')[0].getAttribute('r:id'); var rel = Array.prototype.filter.call(P.parseFromString(x[2], 'application/xml').getElementsByTagName('Relationship'), function (r) { return r.getAttribute('Id') === rid; })[0]; if (rel) first = 'xl/' + rel.getAttribute('Target').replace(/^\/?xl\//, ''); } catch (e) {}
        var sh = z.file(first); if (!sh) throw new Error('No worksheet found in this file.');
        return sh.async('string').then(function (s) {
          var doc = P.parseFromString(s, 'application/xml'), out = [];
          var col = function (ref) { var l = ref.replace(/\d+/g, ''), n = 0; for (var i = 0; i < l.length; i++) n = n * 26 + l.charCodeAt(i) - 64; return n - 1; };
          doc.querySelectorAll('sheetData row').forEach(function (r) { var row = []; r.querySelectorAll('c').forEach(function (c) { var v = c.getElementsByTagName('v')[0], t = c.getAttribute('t'), txt = v ? v.textContent : (c.getElementsByTagName('t')[0] || {}).textContent || ''; if (t === 's') txt = strs[+txt]; var k = col(c.getAttribute('r') || ''); while (row.length < k) row.push(''); row[k] = txt; }); out.push(row); });
          return out.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
        });
      });
    });
  };
  D.readFile = function (f) {
    return /\.xlsx$/i.test(f.name) ? f.arrayBuffer().then(D.parseXLSX) : f.text().then(D.parseCSV);
  };

  /* ---------- validation: flags, never deletes ---------- */
  D.validate = function (ds) {
    var cols = ds.columns || [], rows = ds.rows || [], issues = [], flag = {};
    var mark = function (r, c, why) { flag[r + ':' + c] = why; };
    cols.forEach(function (col, c) {
      var vals = rows.map(function (r) { return r[c]; }), numeric = col.kind !== 'note' && vals.filter(function (v) { return String(v || '').trim() !== ''; }).filter(isNum).length >= Math.max(1, vals.filter(function (v) { return String(v || '').trim() !== ''; }).length * 0.6);
      if (!col.unit && col.kind !== 'note') issues.push(['mid', 'Column "' + E(col.name || 'unnamed') + '" has no unit.']);
      if (numeric && (col.kind === 'trial' || col.kind === 'dv') && !col.unc) issues.push(['mid', 'Column "' + E(col.name) + '" has no instrument uncertainty (±).']);
      var miss = 0, bad = 0, neg = 0, dps = {};
      vals.forEach(function (v, r) { var s = String(v == null ? '' : v).trim(); if (s === '') { if (col.kind !== 'note') { miss++; mark(r, c, 'Missing value'); } return; } if (numeric && !isNum(s)) { bad++; mark(r, c, 'Not a number: units or symbols belong in the column heading'); return; } if (numeric) { dps[dp(s)] = (dps[dp(s)] || 0) + 1; if (+s < 0 && (col.kind === 'trial' || col.kind === 'dv') && !/°c|temperature|change|ψ|potential|%/i.test(col.name + col.unit)) { neg++; mark(r, c, 'Negative value: is this possible for this quantity?'); } } });
      if (miss) issues.push(['no', miss + ' missing value(s) in "' + E(col.name) + '". Leave a note if a trial failed rather than inventing a value.']);
      if (bad) issues.push(['no', bad + ' value(s) in "' + E(col.name) + '" are not plain numbers.']);
      if (neg) issues.push(['no', neg + ' negative value(s) in "' + E(col.name) + '" that may be impossible.']);
      if (Object.keys(dps).length > 1) { issues.push(['mid', 'Inconsistent decimal places in "' + E(col.name) + '" (' + Object.keys(dps).join(', ') + '). Record every value to the precision of the instrument.']); }
    });
    var seen = {}; rows.forEach(function (r, i) { var k = JSON.stringify(r); if (r.some(function (x) { return String(x || '').trim(); }) && seen[k] != null) { issues.push(['mid', 'Row ' + (i + 1) + ' duplicates row ' + (seen[k] + 1) + '. Check it was not entered twice.']); cols.forEach(function (_, c) { mark(i, c, 'Duplicate row'); }); } else seen[k] = i; });
    // possible outliers among the repeats of one level: outside Q1 − 1.5 IQR or Q3 + 1.5 IQR, or more than 2 SD from the mean of the repeats
    var tc = cols.map(function (c, i) { return c.kind === 'trial' ? i : -1; }).filter(function (i) { return i >= 0; }), out = 0;
    if (tc.length >= 3) rows.forEach(function (r, i) { var v = tc.map(function (c) { return r[c]; }).filter(isNum).map(Number); if (v.length < 3) return; var q1 = R.quantile(v, 0.25), q3 = R.quantile(v, 0.75), iqr = q3 - q1, m = R.mean(v), sd = R.sd(v);
      tc.forEach(function (c) { if (!isNum(r[c])) return; var x = +r[c]; if ((iqr > 0 && (x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr)) || (v.length >= 5 && sd > 0 && Math.abs(x - m) > 2 * sd)) { out++; mark(i, c, 'Possible outlier: investigate and explain it; do not delete it without a reason recorded in your notes'); } }); });
    if (out) issues.push(['mid', out + ' possible outlier(s) among repeats. Investigate each one: if you exclude it from processing, say why in your report. The raw value stays recorded.']);
    if (!rows.length) issues.push(['no', 'No data yet.']);
    return { issues: issues, flag: flag };
  };

  /* ---------- processed data: one row per IV level, statistics across the trial columns ---------- */
  D.processed = function (ds) {
    var cols = ds.columns || [], iv = cols.map(function (c) { return c.kind; }).indexOf('iv'), tc = cols.map(function (c, i) { return c.kind === 'trial' ? i : -1; }).filter(function (i) { return i >= 0; });
    var dv = cols.map(function (c) { return c.kind; }).indexOf('dv');
    if (iv < 0) return null;
    if (!tc.length && dv >= 0) {   // long format: one measurement per row; group the DV by IV value
      var g = {}, order = []; (ds.rows || []).forEach(function (r) { var k = String(r[iv]).trim(); if (k === '' || !isNum(r[dv])) return; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(+r[dv]); });
      return { iv: cols[iv], dvc: cols[dv], rows: order.map(function (k) { return stat(k, g[k]); }) };
    }
    if (!tc.length) return null;
    return { iv: cols[iv], dvc: cols[tc[0]], rows: (ds.rows || []).filter(function (r) { return String(r[iv] || '').trim() !== ''; }).map(function (r) { return stat(r[iv], tc.map(function (c) { return r[c]; }).filter(isNum).map(Number)); }) };
    function stat(x, v) { var n = v.length, m = R.mean(v); return { x: x, xn: isNum(x) ? +x : null, vals: v, n: n, mean: m, sd: n > 1 ? R.sd(v) : NaN, se: n > 1 ? R.se(v) : NaN, half: R.halfRange(v), pct: n > 1 ? R.halfRange(v) / m * 100 : NaN }; }
  };
  var fx = function (x, s) { return x == null || !isFinite(x) ? '–' : R.sig(x, s || 3); };
  D.processedTable = function (pr, ds) {
    if (!pr || !pr.rows.length) return '<p class="small muted">Mark one column as the independent variable (IV) and your repeat columns as trials (or one column as the DV) to see the processed data.</p>';
    var u = pr.dvc.unit ? ' / ' + E(pr.dvc.unit) : '', unc = pr.dvc.unc ? ' (instrument ±' + E(pr.dvc.unc) + ')' : '';
    return '<div class="scroll"><table class="dt"><caption class="small muted" style="caption-side:bottom;text-align:left">Mean, standard deviation (SD), standard error (SE) and half the range of the repeats' + unc + '. Report means to a precision that matches the uncertainty.</caption><thead><tr><th>' + E(pr.iv.name || 'IV') + (pr.iv.unit ? ' / ' + E(pr.iv.unit) : '') + '</th><th>n</th><th>Mean' + u + '</th><th>SD' + u + '</th><th>SE' + u + '</th><th>± half range' + u + '</th><th>% uncertainty</th></tr></thead><tbody>' +
      pr.rows.map(function (r) { return '<tr><td>' + E(r.x) + '</td><td class="num">' + r.n + '</td><td class="num">' + fx(r.mean, 4) + '</td><td class="num">' + fx(r.sd) + '</td><td class="num">' + fx(r.se) + '</td><td class="num">' + fx(r.half) + '</td><td class="num">' + fx(r.pct, 2) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  };

  /* ---------- stage 7: data collection ---------- */
  var dsTimer = null;
  D.dataStage = function () {
    var list = (RH.extra && RH.extra.list) || [];
    if (!list.length && RH.owner) {
      var m0 = RH.ia.page('data', '<div class="rh-card"><h3>Create your raw data table</h3><p class="small">A typical layout: the IV in the first column, then one column per repeat (trial) of the DV. You can also import a CSV or Excel file.</p><div class="btns"><button class="btn main sm" id="ds-new" type="button">Create a table from my design</button><label class="btn sm">Import CSV or Excel<input type="file" id="ds-imp" accept=".csv,.xlsx,text/csv" hidden></label></div><p class="msg" id="ds-msg"></p></div>');
      var mk = function (cols, rows) { return RH.S.db.from('research_datasets').insert({ project_id: RH.p.id, name: 'Raw data', columns: cols, rows: rows }).select('id,name,raw_locked,updated_at').single().then(function (r) { if (r.error) throw r.error; RH.extra.list = [r.data]; RH.extra.datasets = 1; D.dataStage(); }).catch(function (e) { m0.querySelector('#ds-msg').textContent = RH.S.nice(e); }); };
      m0.querySelector('#ds-new').onclick = function () {
        var v = RH.get('variables', {}), lv = String((v.iv || {}).levels || '').split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean), tr = Math.min(10, parseInt((v.design || {}).trials, 10) || 5);
        var split = function (t) { var mm = String(t || '').match(/^(.*?)\s*\(([^)]*)\)\s*$/); return mm ? [mm[1], mm[2]] : [t, '']; }, ivp = split((v.iv || {}).name || 'Independent variable'), dvp = split((v.dv || {}).name || ''), unc = ((String((v.dv || {}).equip || '').match(/±\s*([\d.]+)/) || [])[1]) || '';
        var cols = [{ name: ivp[0], unit: ivp[1], unc: '', kind: 'iv' }]; for (var i = 1; i <= tr; i++) cols.push({ name: 'Trial ' + i, unit: dvp[1], unc: unc, kind: 'trial' }); cols.push({ name: 'Observations', unit: '', unc: '', kind: 'note' });
        mk(cols, (lv.length ? lv : ['', '', '', '', '']).map(function (l) { var r = [l]; for (var i = 0; i < cols.length - 1; i++) r.push(''); return r; }));
      };
      m0.querySelector('#ds-imp').onchange = function () { var f = this.files[0]; if (!f) return; D.readFile(f).then(function (rows) { if (!rows.length) throw new Error('The file is empty.'); var head = rows[0]; mk(head.map(function (h, i) { var m = String(h).match(/^(.*?)\s*[\/(]\s*([^)]*)\)?\s*$/); return { name: (m ? m[1] : h) || 'Column ' + (i + 1), unit: m ? m[2] : '', unc: '', kind: i === 0 ? 'iv' : /trial|repeat|rep\b/i.test(h) ? 'trial' : 'dv' }; }), rows.slice(1).map(function (r) { while (r.length < head.length) r.push(''); return r.map(String); })); }).catch(function (e) { m0.querySelector('#ds-msg').textContent = RH.S.nice(e); }); };
      return;
    }
    if (!list.length) { RH.ia.page('data', '<div class="rh-card"><p class="small muted">The student has not entered any data yet.</p></div>'); return; }
    var dsId = D.curDs && list.some(function (x) { return x.id === D.curDs; }) ? D.curDs : list[0].id;
    RH.S.db.from('research_datasets').select('*').eq('id', dsId).single().then(function (r) { if (r.error) return RH.err(r.error); drawData(r.data, list); });
  };
  function drawData(ds, list) {
    D.curDs = ds.id; var ro = !RH.owner, view = D.viewRaw && ds.raw_locked ? 'raw' : 'work';
    var m = RH.ia.page('data', '<div class="rh-card"><div class="rh-head"><div class="btns">' + (list.length > 1 ? '<select id="ds-pick">' + list.map(function (x) { return '<option value="' + x.id + '"' + (x.id === ds.id ? ' selected' : '') + '>' + E(x.name) + '</option>'; }).join('') + '</select>' : '') + '<input type="text" id="ds-name" value="' + E(ds.name) + '" aria-label="Data set name" style="max-width:260px"' + (ro ? ' readonly' : '') + '></div>' +
      (ds.raw_locked ? '<span class="rh-badge ok">🔒 Original raw data locked ' + RH.date(ds.updated_at) + '</span>' : '<span class="rh-badge warn">Original not locked yet</span>') + '</div>' +
      (ds.raw_locked ? '<div class="rh-tabs" role="tablist"><button type="button" role="tab" data-view="work" aria-selected="' + (view === 'work') + '">Working copy</button><button type="button" role="tab" data-view="raw" aria-selected="' + (view === 'raw') + '">Original raw data (read-only)</button></div>' : '') +
      '<div class="scroll" id="ds-table"></div>' + (RH.owner && view === 'work' ? '<div class="btns"><button class="btn xs" id="ds-row" type="button">+ Row</button><button class="btn xs" id="ds-col" type="button">+ Column</button><button class="btn xs" id="ds-delrow" type="button">Remove the last empty row</button><label class="btn xs">Import into this table<input type="file" id="ds-imp2" accept=".csv,.xlsx" hidden></label><button class="btn xs" id="ds-csv" type="button">Download CSV</button>' + (ds.raw_locked ? '<button class="btn xs" id="ds-ver" type="button">🕘 Save a version of the working copy</button>' : '<button class="btn main xs" id="ds-lock" type="button">🔒 Lock as my original raw data</button>') + '<button class="btn xs" id="ds-add" type="button">+ Another data set</button></div>' : '') +
      '<p class="small muted">Column kinds: <b>IV</b> = independent variable, <b>trial</b> = one repeat of the DV, <b>DV</b> = one measurement per row, <b>note</b> = text. Put units and ± in the heading cells, not in the data.</p></div>' +
      '<div class="rh-card"><div class="rh-field"><label for="ds-obs">Qualitative observations</label><span class="tip">What you saw, smelt or noticed during the experiment (colour changes, bubbles, problems). Photos can be added to your report.</span><textarea id="ds-obs"' + (ro ? ' readonly' : '') + '>' + E(ds.observations || '') + '</textarea></div></div>' +
      '<div class="rh-card"><h3>Validation</h3><div id="ds-val"></div></div><div class="rh-card"><h3>Processed data (preview)</h3><div id="ds-pro"></div></div>');
    var save = function (extra) { if (ro) return; clearTimeout(dsTimer); var s = document.getElementById('rh-save'); if (s) s.textContent = 'Saving…'; dsTimer = setTimeout(function () { RH.S.db.from('research_datasets').update(Object.assign({ name: ds.name, columns: ds.columns, rows: ds.rows, observations: ds.observations }, extra || {})).eq('id', ds.id).then(function (r) { var s2 = document.getElementById('rh-save'); if (s2) s2.textContent = r.error ? 'Not saved: ' + RH.S.nice(r.error) : 'Data saved'; }); }, 900); };
    var table = function () {
      var rows = view === 'raw' ? ds.raw : ds.rows, v = D.validate({ columns: ds.columns, rows: rows }), edit = RH.owner && view === 'work';
      var head = '<tr>' + ds.columns.map(function (c, i) { return '<th>' + (edit ? '<input data-h="' + i + '.name" value="' + E(c.name) + '" aria-label="Column name"><div style="display:flex;gap:4px"><input data-h="' + i + '.unit" value="' + E(c.unit) + '" placeholder="unit" aria-label="Unit" style="min-width:50px"><input data-h="' + i + '.unc" value="' + E(c.unc) + '" placeholder="±" aria-label="Uncertainty" style="min-width:40px"></div><select data-h="' + i + '.kind" aria-label="Column kind">' + ['iv', 'trial', 'dv', 'note'].map(function (k) { return '<option' + (c.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' : E(c.name) + (c.unit ? ' / ' + E(c.unit) : '') + (c.unc ? ' (±' + E(c.unc) + ')' : '') + ' <span class="rh-badge">' + E(c.kind) + '</span>') + '</th>'; }).join('') + '</tr>';
      var body = (rows || []).map(function (r, ri) { return '<tr>' + ds.columns.map(function (c, ci) { var f = v.flag[ri + ':' + ci], val = r[ci] == null ? '' : r[ci]; return '<td class="' + (c.kind !== 'note' ? 'num' : '') + (f ? ' flag' : '') + '"' + (f ? ' title="' + E(f) + '"' : '') + '>' + (edit ? '<input data-c="' + ri + '.' + ci + '" value="' + E(val) + '" aria-label="Row ' + (ri + 1) + ' ' + E(c.name) + '">' : E(val)) + '</td>'; }).join('') + '</tr>'; }).join('');
      m.querySelector('#ds-table').innerHTML = '<table class="dt"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
      m.querySelector('#ds-val').innerHTML = v.issues.length ? RH.ia.meter(v.issues) + '<p class="small muted">Shaded cells have a flag: hover or focus to read it. Nothing is changed or removed automatically.</p>' : RH.ia.meter([['ok', 'No problems found.']]);
      m.querySelector('#ds-pro').innerHTML = D.processedTable(D.processed({ columns: ds.columns, rows: rows }), ds);
      m.querySelectorAll('[data-c]').forEach(function (i) { i.onchange = function () { var k = i.dataset.c.split('.'); ds.rows[+k[0]][+k[1]] = i.value.trim(); save(); setTimeout(table, 0); }; });
      m.querySelectorAll('[data-h]').forEach(function (i) { i.onchange = function () { var k = i.dataset.h.split('.'); ds.columns[+k[0]][k[1]] = i.value.trim(); save(); setTimeout(table, 0); }; });
    };
    table();
    m.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function () { D.viewRaw = b.dataset.view === 'raw'; drawData(ds, list); }; });
    var on = function (id, f) { var x = m.querySelector(id); if (x) x.onclick = f; };
    var nm = m.querySelector('#ds-name'); nm.onchange = function () { ds.name = nm.value.trim() || 'Raw data'; save(); };
    m.querySelector('#ds-obs').oninput = function () { ds.observations = this.value; save(); };
    var pk = m.querySelector('#ds-pick'); if (pk) pk.onchange = function () { D.curDs = pk.value; D.dataStage(); };
    on('#ds-row', function () { ds.rows.push(ds.columns.map(function () { return ''; })); save(); table(); });
    on('#ds-col', function () { ds.columns.push({ name: 'Trial ' + (ds.columns.filter(function (c) { return c.kind === 'trial'; }).length + 1), unit: '', unc: '', kind: 'trial' }); ds.rows.forEach(function (r) { r.push(''); }); save(); table(); });
    on('#ds-delrow', function () { var last = ds.rows[ds.rows.length - 1]; if (last && last.every(function (x) { return String(x || '').trim() === ''; })) { ds.rows.pop(); save(); table(); } else RH.toast('Only an empty last row can be removed. Recorded values stay.'); });
    on('#ds-csv', function () { var q = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; }; var csv = [ds.columns.map(function (c) { return q(c.name + (c.unit ? ' (' + c.unit + ')' : '')); }).join(',')].concat(ds.rows.map(function (r) { return r.map(q).join(','); })).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = (ds.name || 'data').replace(/\W+/g, '-') + '.csv'; a.click(); });
    on('#ds-lock', function () { var v = D.validate(ds); if (!confirm('Lock this table as your original raw data? The original can never be changed afterwards; you keep editing a working copy, and every version is kept.' + (v.issues.some(function (x) { return x[0] === 'no'; }) ? '\n\nThe validation still shows problems. Lock anyway?' : ''))) return; clearTimeout(dsTimer); RH.S.db.from('research_datasets').update({ name: ds.name, columns: ds.columns, rows: ds.rows, raw: ds.rows, raw_locked: true, observations: ds.observations }).eq('id', ds.id).then(function (r) { if (r.error) return RH.err(r.error); ds.raw = JSON.parse(JSON.stringify(ds.rows)); ds.raw_locked = true; RH.extra.locked = true; list.forEach(function (x) { if (x.id === ds.id) x.raw_locked = true; }); RH.S.db.from('research_versions').insert({ project_id: RH.p.id, section: 'dataset:' + ds.id, data: { columns: ds.columns, rows: ds.rows }, note: 'Original raw data locked' }); RH.toast('Original raw data locked'); drawData(ds, list); }); });
    on('#ds-ver', function () { RH.S.db.from('research_versions').insert({ project_id: RH.p.id, section: 'dataset:' + ds.id, data: { columns: ds.columns, rows: ds.rows }, note: prompt('A note for this version (optional):') || 'Working copy' }).then(function (r) { if (r.error) return RH.err(r.error); RH.toast('Version saved'); }); });
    on('#ds-add', function () { RH.S.db.from('research_datasets').insert({ project_id: RH.p.id, name: 'Data set ' + (list.length + 1), columns: [{ name: 'Independent variable', unit: '', unc: '', kind: 'iv' }, { name: 'Trial 1', unit: '', unc: '', kind: 'trial' }], rows: [['', ''], ['', ''], ['', '']] }).select('id,name,raw_locked,updated_at').single().then(function (r) { if (r.error) return RH.err(r.error); list.push(r.data); RH.extra.datasets = list.length; D.curDs = r.data.id; D.dataStage(); }); });
    var imp = m.querySelector('#ds-imp2'); if (imp) imp.onchange = function () { var f = this.files[0]; if (!f) return; D.readFile(f).then(function (rows) { var body = rows.slice(1); if (!confirm('Add ' + body.length + ' rows from ' + f.name + ' to the working copy? Columns are matched by position.')) return; body.forEach(function (r) { var x = ds.columns.map(function (_, i) { return r[i] == null ? '' : String(r[i]); }); ds.rows.push(x); }); save(); table(); }).catch(RH.err); };
  }

  /* ---------- statistics: shared panel (in a project or the standalone lab) ---------- */
  var TESTS = { tTest: ['t-test (two independent groups)', 2], pairedT: ['Paired t-test', 'pair'], mannWhitney: ['Mann–Whitney U (two independent groups)', 2], wilcoxon: ['Wilcoxon signed-rank (paired)', 'pair'], anova: ['One-way ANOVA (3+ groups)', 3], kruskal: ['Kruskal–Wallis H (3+ groups)', 3], pearson: ['Pearson correlation', 'xy'], spearman: ['Spearman rank correlation', 'xy'], regression: ['Linear regression', 'xy'], chiSquare: ['Chi-squared test of independence', 'table'], chiGoodness: ['Chi-squared goodness of fit', 'gof'] };
  var EXPLAIN = {
    tTest: ['Compares the means of two independent groups.', 'Two separate groups measured once each (e.g. two temperatures, two sites).', 'Continuous measurements; at least 5 values per group is better.', 'Independent observations; roughly normal data. Welch\'s version (used here) does not assume equal variances.', 'p < 0.05: the means differ more than chance alone would usually produce.', 'Says nothing about why the groups differ, or whether the difference matters biologically.'],
    pairedT: ['Compares two measurements on the same individuals or samples.', 'Before/after, or two treatments on each individual.', 'Pairs of continuous values.', 'The differences are roughly normal; pairs are independent of each other.', 'p < 0.05: the mean difference is unlikely to be zero.', 'Order effects (e.g. fatigue) can cause a difference.'],
    mannWhitney: ['Compares two independent groups by ranks (medians, broadly).', 'Small samples, skewed data or ordinal scores.', 'Ordinal or continuous values.', 'Independent observations; similar-shaped distributions to compare medians.', 'p < 0.05: values in one group tend to be larger.', 'Less powerful than a t-test when data really are normal; uses a normal approximation here.'],
    wilcoxon: ['Compares paired measurements by the ranks of the differences.', 'Paired data that are skewed or ordinal.', 'Pairs of ordinal or continuous values.', 'Pairs independent; differences symmetric about the median.', 'p < 0.05: the paired differences tend to be in one direction.', 'Zero differences are dropped; uses a normal approximation here.'],
    anova: ['Compares the means of three or more independent groups in one test.', 'Several levels of one IV, with repeats at each.', 'Continuous measurements, several per group.', 'Independent; roughly normal in each group; similar variances.', 'p < 0.05: at least one group mean differs from the others.', 'Does not say which groups differ.'],
    kruskal: ['Compares three or more groups by ranks.', 'Several groups with skewed or ordinal data.', 'Ordinal or continuous values.', 'Independent observations.', 'p < 0.05: at least one group tends to have larger values.', 'Does not say which groups differ.'],
    pearson: ['Measures the strength and direction of a linear relationship.', 'Two continuous variables measured on the same samples.', 'Pairs of continuous values (at least 5, ideally 10+).', 'Linear relationship, roughly normal variables, no extreme outliers.', 'r near ±1: strong linear relationship; p < 0.05: unlikely if there were no correlation.', 'Correlation is not causation; a curve can give a low r.'],
    spearman: ['Measures the strength of a monotonic (consistently rising or falling) relationship using ranks.', 'Curved but consistent trends, ranked or skewed data.', 'Pairs of ordinal or continuous values.', 'Monotonic relationship.', 'rₛ near ±1: strong monotonic relationship.', 'Correlation is not causation.'],
    regression: ['Fits the best straight line y = mx + c through the points.', 'To describe how much y changes per unit of x.', 'Pairs of continuous values.', 'A linear trend; scatter about the line roughly even.', 'The gradient is the change in y per unit x; R² is the fraction of the variation in y explained by the line.', 'Only valid within the range measured; do not extrapolate.'],
    chiSquare: ['Tests whether two categorical variables are associated.', 'Counts of individuals in categories (e.g. species × zone).', 'Raw counts in a table.', 'Independent individuals; expected counts at least 5.', 'p < 0.05: the categories are associated.', 'Use counts, never percentages or means.'],
    chiGoodness: ['Tests whether observed counts fit an expected ratio.', 'Genetic crosses (e.g. 3:1 or 9:3:3:1).', 'Raw counts and the expected ratio.', 'Independent individuals; expected counts at least 5.', 'p < 0.05: the observed counts do not fit the expected ratio.', 'A good fit does not prove the expected model is right.']
  };
  function nums(s) { return String(s || '').split(/[\s,;\t]+/).filter(isNum).map(Number); }
  D.statsPanel = function (host, opts) {
    opts = opts || {}; var pr = opts.processed, ds = opts.ds;
    host.innerHTML = '<div class="rh-card"><h3>1. Choose a test from your design</h3><p class="small">The test follows from the question and the data, never from which test gives the smallest p-value.</p><div class="two">' +
      sel('ch-goal', 'What do you want to find out?', [['difference', 'Whether groups differ'], ['relationship', 'Whether two measured variables are related'], ['association', 'Whether counts in categories are associated'], ['fit', 'Whether counts fit an expected ratio']]) +
      sel('ch-data', 'What kind of data?', [['continuous', 'Measurements (continuous)'], ['ordinal', 'Ranks or scores (ordinal)'], ['counts', 'Counts in categories']]) +
      sel('ch-groups', 'How many groups?', [['2', 'Two'], ['3', 'Three or more']]) + sel('ch-paired', 'Are the data paired?', [['no', 'No: different samples in each group'], ['yes', 'Yes: the same samples measured twice']]) +
      sel('ch-normal', 'Roughly normal (symmetrical, no long tail)?', [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]) + '<div class="rh-field"><label for="ch-n">Smallest group size (or number of pairs)</label><input type="number" id="ch-n" min="1" value="' + (pr && pr.rows.length ? Math.min.apply(null, pr.rows.map(function (r) { return r.n; })) : 5) + '"></div></div><div id="ch-out"></div></div>' +
      '<div class="rh-card"><h3>2. Run it</h3><div class="two"><div class="rh-field"><label for="ts">Test</label><select id="ts">' + Object.keys(TESTS).map(function (k) { return '<option value="' + k + '">' + TESTS[k][0] + '</option>'; }).join('') + '</select></div><div class="rh-field"><label for="alpha">Significance level</label><select id="alpha"><option value="0.05">0.05 (5%)</option><option value="0.01">0.01 (1%)</option></select></div></div><div id="ts-in"></div><div class="btns"><button class="btn main sm" id="ts-run" type="button">Calculate</button></div><div id="ts-out" aria-live="polite"></div></div>' +
      '<div class="rh-card"><h3>Uncertainty and percentage calculators</h3><div class="two"><div class="rh-field"><label>Value and absolute uncertainty</label><div style="display:flex;gap:6px"><input type="number" id="u-v" placeholder="value" step="any"><input type="number" id="u-a" placeholder="±" step="any"></div><span class="tip" id="u-o"></span></div><div class="rh-field"><label>Percentage change from → to</label><div style="display:flex;gap:6px"><input type="number" id="pc-a" placeholder="from" step="any"><input type="number" id="pc-b" placeholder="to" step="any"></div><span class="tip" id="pc-o"></span></div><div class="rh-field"><label>Percentage error: measured, accepted</label><div style="display:flex;gap:6px"><input type="number" id="pe-a" placeholder="measured" step="any"><input type="number" id="pe-b" placeholder="accepted" step="any"></div><span class="tip" id="pe-o"></span></div><div class="rh-field"><label>Propagate: a ± Δa and b ± Δb</label><div style="display:flex;gap:4px"><input type="number" id="pp-a" placeholder="a" step="any"><input type="number" id="pp-da" placeholder="Δa" step="any"><input type="number" id="pp-b" placeholder="b" step="any"><input type="number" id="pp-db" placeholder="Δb" step="any"></div><span class="tip" id="pp-o"></span></div></div></div>';
    function sel(id, label, o) { return '<div class="rh-field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + o.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select></div>'; }
    var $ = function (s) { return host.querySelector(s); };
    var choose = function () {
      var c = R.chooseTest({ goal: $('#ch-goal').value, data: $('#ch-data').value, groups: +$('#ch-groups').value, paired: $('#ch-paired').value === 'yes', normal: $('#ch-normal').value, n: +$('#ch-n').value });
      $('#ch-out').innerHTML = '<div class="rh-card tint fadein"><b>Suggested: ' + E(TESTS[c.test][0]) + '</b>' + (c.alt ? '<span class="small">Alternative if the assumptions are not met: ' + E(TESTS[c.alt][0]) + '</span>' : '') + '<ul class="small">' + c.why.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul><b class="small">Assumptions to check</b><ul class="small">' + c.assume.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul><div class="btns"><button class="btn xs" type="button" id="ch-use">Use this test</button></div></div>';
      $('#ch-use').onclick = function () { $('#ts').value = c.test; inputs(); };
    };
    ['#ch-goal', '#ch-data', '#ch-groups', '#ch-paired', '#ch-normal', '#ch-n'].forEach(function (s) { $(s).onchange = choose; }); choose();
    var inputs = function () {
      var t = $('#ts').value, kind = TESTS[t][1], fill = '';
      if (pr && pr.rows.length) {
        if (kind === 2 || kind === 3 || kind === 'pair') fill = '<span class="tip">Fill a group from your data set: ' + pr.rows.map(function (r, i) { return '<button class="btn xs" type="button" data-fill="' + i + '">' + E(r.x) + (pr.iv.unit ? ' ' + E(pr.iv.unit) : '') + '</button>'; }).join(' ') + ' (click, then click the box to fill)</span>';
        if (kind === 'xy') fill = '<div class="btns"><button class="btn xs" type="button" id="fill-means">Use IV values and the means</button><button class="btn xs" type="button" id="fill-all">Use every repeat as a point</button></div>';
      }
      var box = function (id, label) { return '<div class="rh-field"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" style="min-height:60px" placeholder="numbers separated by spaces, commas or new lines"></textarea></div>'; };
      var h = kind === 2 || kind === 'pair' ? '<div class="two">' + box('g1', kind === 'pair' ? 'First measurement of each pair' : 'Group 1') + box('g2', kind === 'pair' ? 'Second measurement (same order)' : 'Group 2') + '</div>'
        : kind === 3 ? '<div class="two">' + box('g1', 'Group 1') + box('g2', 'Group 2') + box('g3', 'Group 3') + box('g4', 'Group 4 (optional)') + box('g5', 'Group 5 (optional)') + box('g6', 'Group 6 (optional)') + '</div>'
        : kind === 'xy' ? '<div class="two">' + box('gx', 'x values (independent variable)') + box('gy', 'y values (same order)') + '</div>'
        : kind === 'table' ? '<div class="rh-field"><label for="gt">Observed counts: one row per line, values separated by spaces or commas</label><textarea id="gt" placeholder="30 10\n20 25"></textarea></div>'
        : '<div class="two">' + box('go', 'Observed counts') + box('ge', 'Expected ratio or counts (e.g. 9 3 3 1)') + '</div>';
      $('#ts-in').innerHTML = '<p class="small">' + E(EXPLAIN[t][0]) + '</p>' + h + fill;
      var target = null; host.querySelectorAll('#ts-in textarea').forEach(function (a) { a.onfocus = function () { target = a; }; });
      host.querySelectorAll('[data-fill]').forEach(function (b) { b.onclick = function () { var empty = target || Array.prototype.filter.call(host.querySelectorAll('#ts-in textarea'), function (a) { return !a.value.trim(); })[0]; if (empty) { empty.value = pr.rows[+b.dataset.fill].vals.join(', '); empty.dataset.label = pr.rows[+b.dataset.fill].x; target = null; } }; });
      var fm = $('#fill-means'); if (fm) fm.onclick = function () { var r = pr.rows.filter(function (x) { return x.xn != null && isFinite(x.mean); }); $('#gx').value = r.map(function (x) { return x.xn; }).join(', '); $('#gy').value = r.map(function (x) { return R.sig(x.mean, 5); }).join(', '); };
      var fa = $('#fill-all'); if (fa) fa.onclick = function () { var xs = [], ys = []; pr.rows.forEach(function (r) { if (r.xn == null) return; r.vals.forEach(function (v) { xs.push(r.xn); ys.push(v); }); }); $('#gx').value = xs.join(', '); $('#gy').value = ys.join(', '); };
    };
    $('#ts').onchange = inputs; inputs();
    $('#ts-run').onclick = function () {
      var t = $('#ts').value, kind = TESTS[t][1], alpha = +$('#alpha').value, res, inp = {};
      try {
        if (kind === 2 || kind === 'pair') { inp.g1 = nums($('#g1').value); inp.g2 = nums($('#g2').value); res = R[t](inp.g1, inp.g2); }
        else if (kind === 3) { inp.groups = ['#g1', '#g2', '#g3', '#g4', '#g5', '#g6'].map(function (s) { return nums($(s).value); }).filter(function (g) { return g.length; }); res = R[t](inp.groups); }
        else if (kind === 'xy') { inp.x = nums($('#gx').value); inp.y = nums($('#gy').value); if (inp.x.length !== inp.y.length) throw new Error('x and y need the same number of values (' + inp.x.length + ' and ' + inp.y.length + ').'); res = R[t](inp.x, inp.y); }
        else if (kind === 'table') { inp.table = $('#gt').value.trim().split('\n').map(nums).filter(function (r) { return r.length; }); if (inp.table.length < 2 || inp.table.some(function (r) { return r.length !== inp.table[0].length || r.length < 2; })) throw new Error('Enter at least 2 rows with the same number (2 or more) of counts.'); res = R.chiSquare(inp.table); }
        else { inp.obs = nums($('#go').value); inp.exp = nums($('#ge').value); if (inp.obs.length !== inp.exp.length || inp.obs.length < 2) throw new Error('Give an expected value for each observed count.'); res = R.chiGoodness(inp.obs, inp.exp); }
      } catch (e) { $('#ts-out').innerHTML = '<p class="msg">' + E(e.message) + '</p>'; return; }
      if (res.error) { $('#ts-out').innerHTML = '<p class="msg">' + E(res.error) + '</p>'; return; }
      var desc = '';
      if (inp.g1) desc = '<table class="dt"><thead><tr><th></th><th>n</th><th>Mean</th><th>SD</th><th>Median</th></tr></thead><tbody>' + [inp.g1, inp.g2].map(function (g, i) { var d = R.describe(g); return '<tr><td>' + (i ? (kind === 'pair' ? 'Second' : 'Group 2') : (kind === 'pair' ? 'First' : 'Group 1')) + '</td><td class="num">' + d.n + '</td><td class="num">' + fx(d.mean, 4) + '</td><td class="num">' + fx(d.sd) + '</td><td class="num">' + fx(d.median, 4) + '</td></tr>'; }).join('') + '</tbody></table>';
      if (inp.groups) desc = '<table class="dt"><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>SD</th></tr></thead><tbody>' + inp.groups.map(function (g, i) { var d = R.describe(g); return '<tr><td>' + (i + 1) + '</td><td class="num">' + d.n + '</td><td class="num">' + fx(d.mean, 4) + '</td><td class="num">' + fx(d.sd) + '</td></tr>'; }).join('') + '</tbody></table>';
      if (res.expected && t === 'chiSquare') desc = '<p class="small">Expected counts: ' + res.expected.map(function (r) { return r.map(function (x) { return fx(x); }).join(', '); }).join(' | ') + '</p>';
      var extra = t === 'regression' ? '<p class="small"><b>y = ' + fx(res.slope, 4) + 'x ' + (res.intercept < 0 ? '− ' : '+ ') + fx(Math.abs(res.intercept), 4) + '</b> · R² = ' + fx(res.r2, 3) + ' · gradient uncertainty (SE) ± ' + fx(res.seSlope) + '</p>' : (res.r2 != null ? '<p class="small">r² = ' + fx(res.r2, 3) + '</p>' : '');
      var summary = res.name + ': ' + (res.statName || '') + ' = ' + fx(res.stat, 4) + (res.df != null ? ', df = ' + (Array.isArray(res.df) ? res.df.map(function (x) { return fx(x); }).join(', ') : fx(res.df)) : '') + ', p ' + (res.p < 0.001 ? '< 0.001' : '= ' + R.sig(res.p, 3)) + (t === 'regression' ? ', R² = ' + fx(res.r2, 3) : '');
      var ex = EXPLAIN[t];
      $('#ts-out').innerHTML = '<div class="rh-card fadein"><h3>' + E(res.name) + '</h3>' + desc + '<div class="rh-kpi"><div><b>' + fx(res.stat, 4) + '</b><span>' + E(res.statName || 'statistic') + '</span></div>' + (res.df != null ? '<div><b>' + (Array.isArray(res.df) ? res.df.map(function (x) { return fx(x); }).join(', ') : fx(res.df)) + '</b><span>degrees of freedom</span></div>' : '') + '<div><b>' + (res.p < 0.001 ? '< 0.001' : R.sig(res.p, 3)) + '</b><span>p-value</span></div></div>' + extra +
        '<p class="small">' + E(R.interpret(res, alpha)) + '</p><details><summary>About this test</summary><ul class="small"><li><b>What it does:</b> ' + E(ex[0]) + '</li><li><b>When to use it:</b> ' + E(ex[1]) + '</li><li><b>Data needed:</b> ' + E(ex[2]) + '</li><li><b>Assumptions:</b> ' + E(ex[3]) + '</li><li><b>Reading the output:</b> ' + E(ex[4]) + '</li><li><b>Limitations:</b> ' + E(ex[5]) + '</li></ul></details>' +
        '<div class="btns">' + (opts.onSave ? '<button class="btn main sm" id="ts-save" type="button">Save to my analysis</button>' : '') + '<button class="btn sm" id="ts-csv" type="button">Export the calculation (CSV)</button></div></div>';
      var sv = $('#ts-save'); if (sv) sv.onclick = function () { opts.onSave({ test: t, name: res.name, stat: res.stat, statName: res.statName, df: res.df, p: res.p, r2: res.r2, slope: res.slope, intercept: res.intercept, alpha: alpha, inputs: inp, summary: summary, at: new Date().toISOString() }); sv.disabled = true; sv.textContent = 'Saved'; };
      $('#ts-csv').onclick = function () { var lines = [['Test', res.name], ['Statistic', res.statName, res.stat], ['Degrees of freedom', Array.isArray(res.df) ? res.df.join(' ') : res.df], ['p-value', res.p], ['Significance level', alpha], ['Inputs', JSON.stringify(inp)], ['Interpretation', R.interpret(res, alpha)], ['Calculated with', 'VistaEd Research Hub, ' + new Date().toISOString()]]; var csv = lines.map(function (l) { return l.map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = t + '-result.csv'; a.click(); };
    };
    var calc = function () {
      var v = +$('#u-v').value, a = +$('#u-a').value; $('#u-o').textContent = $('#u-v').value && $('#u-a').value ? (function (u) { return 'relative ' + R.sig(u.rel, 3) + ' · percentage uncertainty ' + R.sig(u.pct, 3) + '%'; })(R.unc(v, a)) : '';
      $('#pc-o').textContent = $('#pc-a').value && $('#pc-b').value ? 'percentage change ' + R.sig(R.pctChange(+$('#pc-a').value, +$('#pc-b').value), 4) + '%' : '';
      $('#pe-o').textContent = $('#pe-a').value && $('#pe-b').value ? 'percentage error ' + R.sig(R.pctError(+$('#pe-a').value, +$('#pe-b').value), 4) + '%' : '';
      var A = +$('#pp-a').value, dA = +$('#pp-da').value, B = +$('#pp-b').value, dB = +$('#pp-db').value;
      $('#pp-o').textContent = $('#pp-a').value && $('#pp-b').value ? 'a + b = ' + R.sig(A + B, 4) + ' ± ' + R.sig(R.prop.add(dA, dB), 3) + ' · a − b = ' + R.sig(A - B, 4) + ' ± ' + R.sig(R.prop.add(dA, dB), 3) + ' · a × b = ' + R.sig(A * B, 4) + ' ± ' + R.sig(Math.abs(A * B) * R.prop.mulRel(A, dA, B, dB), 3) + ' · a ÷ b = ' + R.sig(A / B, 4) + ' ± ' + R.sig(Math.abs(A / B) * R.prop.mulRel(A, dA, B, dB), 3) : '';
    };
    host.querySelectorAll('#u-v,#u-a,#pc-a,#pc-b,#pe-a,#pe-b,#pp-a,#pp-da,#pp-b,#pp-db').forEach(function (i) { i.oninput = calc; });
  };

  function loadFirstDs() {
    var list = (RH.extra && RH.extra.list) || []; if (!list.length) return Promise.resolve(null);
    return RH.S.db.from('research_datasets').select('*').eq('id', D.curDs && list.some(function (x) { return x.id === D.curDs; }) ? D.curDs : list[0].id).single().then(function (r) { return r.data; });
  }
  /* ---------- stage 8: data analysis ---------- */
  D.analysisStage = function () {
    loadFirstDs().then(function (ds) {
      var pr = ds ? D.processed(ds) : null, saved = RH.get('analysis.saved', []);
      var m = RH.ia.page('analysis', '<div class="rh-card"><h3>Processed data' + (ds ? ': ' + E(ds.name) : '') + '</h3>' + (ds ? D.processedTable(pr, ds) : '<p class="small muted">Enter your data in <a href="#/p/' + RH.p.id + '/data">Data collection</a> first.</p>') + '</div>' +
        '<div id="an-panel"></div><div class="rh-card"><h3>Saved analysis</h3><div id="an-saved"></div></div>' + RH.ia.ta('analysis.notes', 'Notes on processing', 'How you processed the data, which values (if any) you excluded and why, and how you treated uncertainties.'));
      var drawSaved = function () { m.querySelector('#an-saved').innerHTML = saved.length ? '<div class="rh-list">' + saved.map(function (s, i) { return '<div class="rh-item"><b class="small">' + E(s.summary) + '</b><span class="meta">' + RH.date(s.at, true) + '</span>' + (RH.owner ? '<div class="btns"><button class="btn xs bad" data-rm="' + i + '" type="button">Remove</button></div>' : '') + '</div>'; }).join('') + '</div>' : '<p class="small muted">Run a test and choose "Save to my analysis". Saved results feed your conclusion and the readiness check.</p>';
        m.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { saved.splice(+b.dataset.rm, 1); RH.set('analysis.saved', saved); drawSaved(); }; }); };
      D.statsPanel(m.querySelector('#an-panel'), { processed: pr, ds: ds, onSave: RH.owner ? function (x) { saved.push(x); RH.set('analysis.saved', saved); drawSaved(); RH.toast('Saved to your analysis'); } : null });
      drawSaved();
    });
  };
  D.statsLab = function () {
    var m = RH.shell('#/lab', '<div class="rh-card"><h2>🧮 Statistics lab</h2><p class="small">Descriptive and inferential statistics with explanations. Use it on its own or from inside your IA project. Results are calculated in your browser and checked against SciPy, the standard scientific library.</p></div><div class="rh-card"><h3>Descriptive statistics</h3><div class="rh-field"><label for="ds-in">Values</label><textarea id="ds-in" placeholder="numbers separated by spaces, commas or new lines"></textarea></div><div id="ds-out"></div></div><div id="lab-panel"></div>');
    var di = m.querySelector('#ds-in'); di.oninput = function () { var v = nums(di.value); if (!v.length) { m.querySelector('#ds-out').innerHTML = ''; return; } var d = R.describe(v), sk = R.shapiroHint(v);
      m.querySelector('#ds-out').innerHTML = '<div class="rh-kpi">' + [['n', d.n], ['Mean', fx(d.mean, 4)], ['Median', fx(d.median, 4)], ['Mode', d.modes.length ? d.modes.join(', ') : 'none'], ['Range', fx(d.range)], ['SD', fx(d.sd)], ['SE', fx(d.se)], ['95% CI', fx(d.ci[0], 4) + ' to ' + fx(d.ci[1], 4)], ['Q1 / Q3', fx(d.q1) + ' / ' + fx(d.q3)]].map(function (x) { return '<div><b style="font-size:1.1rem">' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join('') + '</div>' + (sk ? '<p class="small muted">Skewness ' + fx(sk.skew, 2) + (sk.looksSkewed ? ': the data look skewed, so a non-parametric test may be safer.' : ': no strong skew.') + ' SD uses n − 1 (sample standard deviation).</p>' : ''); };
    D.statsPanel(m.querySelector('#lab-panel'), {});
  };

  /* ---------- graphs ---------- */
  function nice(lo, hi, n) { if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1; } if (lo === hi) { lo -= 1; hi += 1; } var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = n / span * step; if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2; var a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, t = []; for (var x = a; x <= b + step / 2; x += step) t.push(+x.toPrecision(10)); return { lo: a, hi: b, ticks: t }; }
  D.render = function (g, data) {   // returns an SVG string; data: {series:[{name, pts:[{x, y, e, vals}]}], cats:[...]}
    var W = 760, H = 480, L = 78, Rr = 24, T = 50, B = 78, pw = W - L - Rr, ph = H - T - B, col = ['#0f766e', '#2563eb', '#be185d', '#b7791f', '#7c3aed', '#15803d'];
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" font-family="Arial, sans-serif" font-size="13"><rect width="' + W + '" height="' + H + '" fill="#fff"/>';
    s += '<text x="' + (W / 2) + '" y="24" text-anchor="middle" font-size="15" font-weight="bold" fill="#172033">' + E(g.title || '') + '</text>';
    var all = [], cat = g.type === 'bar' || g.type === 'box';
    data.series.forEach(function (se) { se.pts.forEach(function (p) { if (g.type === 'box') { all = all.concat(p.vals || []); } else if (g.type === 'hist') { } else { all.push(p.y + (p.e || 0), p.y - (p.e || 0)); } }); });
    if (g.type === 'hist') { var v = [].concat.apply([], data.series.map(function (se) { return se.pts.map(function (p) { return p.y; }); })), k = Math.max(3, Math.ceil(Math.log2(v.length) + 1)), mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), w = (mx - mn) / k || 1, bins = []; for (var i = 0; i < k; i++) bins.push(0); v.forEach(function (x) { bins[Math.min(k - 1, Math.floor((x - mn) / w))]++; }); data.hist = { mn: mn, w: w, bins: bins }; all = [0, Math.max.apply(null, bins)]; }
    var yr = nice(g.yFrom0 || cat || g.type === 'hist' ? Math.min(0, Math.min.apply(null, all)) : Math.min.apply(null, all), Math.max.apply(null, all), 6);
    var Y = function (v) { return T + ph - (v - yr.lo) / (yr.hi - yr.lo) * ph; };
    var xs = [].concat.apply([], data.series.map(function (se) { return se.pts.map(function (p) { return p.x; }); })).filter(function (x) { return isFinite(x); });
    var xr = g.type === 'hist' ? nice(data.hist.mn, data.hist.mn + data.hist.w * data.hist.bins.length, 6) : cat ? null : nice(g.xFrom0 ? Math.min(0, Math.min.apply(null, xs)) : Math.min.apply(null, xs), Math.max.apply(null, xs), 7);
    var X = cat ? function (i) { return L + (i + 0.5) * pw / data.cats.length; } : function (v) { return L + (v - xr.lo) / (xr.hi - xr.lo) * pw; };
    yr.ticks.forEach(function (t) { s += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="#e5e7eb"/><text x="' + (L - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end" fill="#334155">' + R.sig(t, 6) + '</text>'; });
    if (cat) data.cats.forEach(function (c, i) { s += '<text x="' + X(i) + '" y="' + (T + ph + 20) + '" text-anchor="middle" fill="#334155">' + E(c) + '</text>'; });
    else xr.ticks.forEach(function (t) { s += '<line x1="' + X(t) + '" x2="' + X(t) + '" y1="' + (T + ph) + '" y2="' + (T + ph + 5) + '" stroke="#334155"/><text x="' + X(t) + '" y="' + (T + ph + 20) + '" text-anchor="middle" fill="#334155">' + R.sig(t, 6) + '</text>'; });
    s += '<line x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (T + ph) + '" stroke="#172033" stroke-width="1.5"/><line x1="' + L + '" x2="' + (L + pw) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '" stroke="#172033" stroke-width="1.5"/>';
    s += '<text x="' + (L + pw / 2) + '" y="' + (H - 30) + '" text-anchor="middle" font-weight="bold" fill="#172033">' + E(g.xTitle || '') + '</text><text transform="translate(18 ' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle" font-weight="bold" fill="#172033">' + E(g.yTitle || '') + '</text>';
    var eb = function (x, y, e, c) { if (!e || !isFinite(e)) return ''; return '<line x1="' + x + '" x2="' + x + '" y1="' + Y(y - e) + '" y2="' + Y(y + e) + '" stroke="' + c + '" stroke-width="1.4"/><line x1="' + (x - 5) + '" x2="' + (x + 5) + '" y1="' + Y(y - e) + '" y2="' + Y(y - e) + '" stroke="' + c + '"/><line x1="' + (x - 5) + '" x2="' + (x + 5) + '" y1="' + Y(y + e) + '" y2="' + Y(y + e) + '" stroke="' + c + '"/>'; };
    if (g.type === 'hist') { var hb = data.hist, bw = pw / hb.bins.length; hb.bins.forEach(function (n, i) { var x0 = X(hb.mn + i * hb.w), x1 = X(hb.mn + (i + 1) * hb.w); s += '<rect x="' + x0 + '" y="' + Y(n) + '" width="' + Math.max(1, x1 - x0 - 1) + '" height="' + (Y(0) - Y(n)) + '" fill="' + col[0] + '" fill-opacity=".75"/>'; }); }
    else data.series.forEach(function (se, si) {
      var c = col[si % col.length], nS = data.series.length;
      if (g.type === 'bar') se.pts.forEach(function (p, i) { var bw = pw / data.cats.length * 0.7 / nS, x = X(i) - pw / data.cats.length * 0.35 + bw * si; s += '<rect x="' + x + '" y="' + Math.min(Y(p.y), Y(0)) + '" width="' + bw + '" height="' + Math.abs(Y(0) - Y(p.y)) + '" fill="' + c + '" fill-opacity=".8"/>' + eb(x + bw / 2, p.y, p.e, '#172033'); });
      else if (g.type === 'box') se.pts.forEach(function (p, i) { var v = (p.vals || []).slice().sort(function (a, b) { return a - b; }); if (!v.length) return; var q1 = R.quantile(v, .25), q3 = R.quantile(v, .75), md = R.median(v), x = X(i), bw = Math.min(60, pw / data.cats.length * 0.5); s += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(v[0]) + '" y2="' + Y(v[v.length - 1]) + '" stroke="#172033"/><rect x="' + (x - bw / 2) + '" y="' + Y(q3) + '" width="' + bw + '" height="' + Math.max(1, Y(q1) - Y(q3)) + '" fill="' + c + '" fill-opacity=".25" stroke="' + c + '"/><line x1="' + (x - bw / 2) + '" x2="' + (x + bw / 2) + '" y1="' + Y(md) + '" y2="' + Y(md) + '" stroke="' + c + '" stroke-width="2.5"/>'; });
      else {
        var pts = se.pts.filter(function (p) { return isFinite(p.x) && isFinite(p.y); }).sort(function (a, b) { return a.x - b.x; });
        if (g.type === 'line') s += '<polyline fill="none" stroke="' + c + '" stroke-width="2" points="' + pts.map(function (p) { return X(p.x) + ',' + Y(p.y); }).join(' ') + '"/>';
        pts.forEach(function (p) { s += eb(X(p.x), p.y, p.e, c) + '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5" fill="' + c + '"/>'; });
        if (g.trend && pts.length >= 3) { var rg = R.regression(pts.map(function (p) { return p.x; }), pts.map(function (p) { return p.y; })); if (!rg.error) { var x0 = xr.lo, x1 = xr.hi; s += '<line x1="' + X(x0) + '" x2="' + X(x1) + '" y1="' + Y(rg.slope * x0 + rg.intercept) + '" y2="' + Y(rg.slope * x1 + rg.intercept) + '" stroke="' + c + '" stroke-dasharray="6 4" stroke-width="1.6"/><text x="' + (L + pw - 6) + '" y="' + (T + 16 + si * 18) + '" text-anchor="end" fill="' + c + '">y = ' + R.sig(rg.slope, 4) + 'x ' + (rg.intercept < 0 ? '− ' : '+ ') + R.sig(Math.abs(rg.intercept), 4) + '   R² = ' + R.sig(rg.r2, 3) + '</text>'; data.reg = rg; } }
      }
    });
    if (data.series.length > 1) s += data.series.map(function (se, i) { return '<rect x="' + (L + 10) + '" y="' + (T + 8 + i * 18) + '" width="12" height="12" fill="' + col[i % col.length] + '"/><text x="' + (L + 28) + '" y="' + (T + 18 + i * 18) + '" fill="#172033">' + E(se.name) + '</text>'; }).join('');
    s += '<text x="' + L + '" y="' + (H - 8) + '" fill="#334155" font-size="12">' + E((g.fig ? 'Figure ' + g.fig + ': ' : '') + (g.caption || '')).slice(0, 140) + '</text></svg>';
    return s;
  };
  D.graphData = function (g, ds) {   // from a data set and the graph settings
    var pr = D.processed(ds);
    if (!pr) return { series: [], cats: [] };
    var err = function (r) { return g.err === 'sd' ? r.sd : g.err === 'se' ? r.se : g.err === 'range' ? r.half : g.err === 'ci' ? (r.n > 1 ? R.tInv(0.975, r.n - 1) * r.se : NaN) : 0; };
    if (g.type === 'bar' || g.type === 'box') return { cats: pr.rows.map(function (r) { return r.x; }), series: [{ name: pr.dvc.name, pts: pr.rows.map(function (r) { return { y: r.mean, e: err(r), vals: r.vals }; }) }] };
    if (g.type === 'hist') return { series: [{ name: pr.dvc.name, pts: [].concat.apply([], pr.rows.map(function (r) { return r.vals.map(function (v) { return { y: v }; }); })) }] };
    if (g.points === 'all') return { series: [{ name: pr.dvc.name, pts: [].concat.apply([], pr.rows.map(function (r) { return r.vals.map(function (v) { return { x: r.xn, y: v }; }); })) }] };
    return { series: [{ name: pr.dvc.name, pts: pr.rows.map(function (r) { return { x: r.xn, y: r.mean, e: err(r) }; }) }] };
  };
  D.graphCheck = function (g, ds) {
    var pr = ds ? D.processed(ds) : null, numIV = pr && pr.rows.every(function (r) { return r.xn != null; }), rows = [];
    rows.push([g.title ? 'ok' : 'no', 'A title that says what the graph shows.']);
    rows.push([/\(.+\)|\//.test(g.xTitle || '') ? 'ok' : 'no', 'The x-axis title includes units, e.g. "Temperature / °C".']);
    rows.push([/\(.+\)|\//.test(g.yTitle || '') ? 'ok' : 'no', 'The y-axis title includes units.']);
    if (g.type === 'bar' && numIV) rows.push(['mid', 'Your IV is continuous (numbers): a scatter or line graph usually shows the trend better than a bar chart.']);
    if ((g.type === 'scatter' || g.type === 'line') && pr && !numIV) rows.push(['no', 'Your IV values are categories, not numbers: use a bar chart or box plot.']);
    if (g.type !== 'hist' && g.type !== 'box') rows.push([g.err && g.err !== 'none' ? 'ok' : 'no', g.err && g.err !== 'none' ? 'Error bars are shown; say in the caption what they represent (' + ({ sd: '± 1 SD', se: '± 1 SE', range: '± half the range', ci: '95% confidence interval' }[g.err]) + ').' : 'Add error bars (usually ± 1 standard deviation) and say what they show.']);
    rows.push([g.fig && g.caption ? 'ok' : 'mid', 'A figure number and a caption that explains the graph.']);
    if (g.trend) rows.push(['mid', 'A straight trend line assumes a linear relationship: check the points really follow a line, and do not extrapolate beyond your data.']);
    return rows;
  };
  function graphForm(g) {
    var o = function (id, opts, v) { return '<select id="' + id + '">' + opts.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === v ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>'; };
    return '<div class="two"><div class="rh-field"><label for="g-type">Graph type</label>' + o('g-type', [['scatter', 'Scatter (means)'], ['line', 'Line'], ['bar', 'Bar chart'], ['box', 'Box plot'], ['hist', 'Histogram'], ['regression', 'Scatter with regression line']], g.type) + '</div><div class="rh-field"><label for="g-err">Error bars</label>' + o('g-err', [['sd', '± 1 standard deviation'], ['se', '± 1 standard error'], ['range', '± half the range'], ['ci', '95% confidence interval'], ['none', 'None']], g.err) + '</div><div class="rh-field"><label for="g-pts">Points</label>' + o('g-pts', [['means', 'Means of the repeats'], ['all', 'Every repeat']], g.points) + '</div><div class="rh-field"><label for="g-fig">Figure number</label><input type="number" id="g-fig" min="1" value="' + (g.fig || 1) + '"></div></div>' +
      '<div class="rh-field"><label for="g-title">Title</label><input type="text" id="g-title" value="' + E(g.title || '') + '"></div><div class="two"><div class="rh-field"><label for="g-x">x-axis title with units</label><input type="text" id="g-x" value="' + E(g.xTitle || '') + '"></div><div class="rh-field"><label for="g-y">y-axis title with units</label><input type="text" id="g-y" value="' + E(g.yTitle || '') + '"></div></div>' +
      '<div class="rh-field"><label for="g-cap">Caption</label><input type="text" id="g-cap" value="' + E(g.caption || '') + '" placeholder="e.g. Mean rate at each temperature; error bars show ± 1 SD (n = 5)."></div><div class="btns"><label class="chk small"><input type="checkbox" id="g-y0"' + (g.yFrom0 ? ' checked' : '') + '> y-axis from 0</label><label class="chk small"><input type="checkbox" id="g-x0"' + (g.xFrom0 ? ' checked' : '') + '> x-axis from 0</label></div>';
  }
  function readForm(h, g) { g.type = h.querySelector('#g-type').value; g.trend = g.type === 'regression'; if (g.type === 'regression') g.type = 'scatter'; g.err = h.querySelector('#g-err').value; g.points = h.querySelector('#g-pts').value; g.fig = +h.querySelector('#g-fig').value || 1; g.title = h.querySelector('#g-title').value; g.xTitle = h.querySelector('#g-x').value; g.yTitle = h.querySelector('#g-y').value; g.caption = h.querySelector('#g-cap').value; g.yFrom0 = h.querySelector('#g-y0').checked; g.xFrom0 = h.querySelector('#g-x0').checked; return g; }
  D.exportPNG = function (svg, name) {
    var img = new Image(), c = document.createElement('canvas'); c.width = 760 * 3; c.height = 480 * 3;
    img.onload = function () { var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); c.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (name || 'graph') + '.png'; a.click(); }); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
  function studio(host, ds, g, onSave) {
    host.innerHTML = '<div class="rh-card">' + graphForm(g) + '</div><div class="rh-card"><div class="rh-graph" id="g-svg"></div><div class="btns"><button class="btn sm" id="g-png" type="button">Download PNG (high resolution)</button><button class="btn sm" id="g-svgdl" type="button">Download SVG</button>' + (onSave ? '<button class="btn main sm" id="g-save" type="button">Save graph to my IA</button>' : '') + '</div></div><div class="rh-card"><h3>Is this graph suitable?</h3><div id="g-chk"></div></div>';
    var svg = '';
    var draw = function () { readForm(host, g); var data = D.graphData(Object.assign({}, g, { type: g.trend ? 'scatter' : g.type }), ds); if (!data.series.length || !data.series[0].pts.length) { host.querySelector('#g-svg').innerHTML = '<p class="small muted" style="padding:20px">Mark an IV column and trial (or DV) columns with numbers in your data set to draw a graph.</p>'; return; } svg = D.render(g, data); host.querySelector('#g-svg').innerHTML = svg; host.querySelector('#g-chk').innerHTML = RH.ia.meter(D.graphCheck(g, ds)); };
    host.querySelectorAll('input,select').forEach(function (i) { i.addEventListener(i.type === 'text' ? 'input' : 'change', draw); });
    host.querySelector('#g-png').onclick = function () { if (svg) D.exportPNG(svg, 'figure-' + g.fig); };
    host.querySelector('#g-svgdl').onclick = function () { if (!svg) return; var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); a.download = 'figure-' + g.fig + '.svg'; a.click(); };
    var sv = host.querySelector('#g-save'); if (sv) sv.onclick = function () { onSave(JSON.parse(JSON.stringify(readForm(host, g)))); };
    draw();
  }
  /* ---------- stage 9: graphs ---------- */
  D.graphStage = function () {
    loadFirstDs().then(function (ds) {
      var gs = RH.get('graphs', []);
      if (!ds) { RH.ia.page('graphs', '<div class="rh-card"><p class="small muted">Enter your data in <a href="#/p/' + RH.p.id + '/data">Data collection</a> first.</p></div>'); return; }
      var pr = D.processed(ds), iv = pr ? pr.iv : {}, dvc = pr ? pr.dvc : {};
      var g = D.editG != null && gs[D.editG] ? gs[D.editG] : { type: pr && pr.rows.every(function (r) { return r.xn != null; }) ? 'scatter' : 'bar', err: 'sd', points: 'means', fig: gs.length + 1, title: '', xTitle: (iv.name || '') + (iv.unit ? ' / ' + iv.unit : ''), yTitle: (function () { var dn = String(RH.get('variables.dv.name', '') || '').replace(/\s*\([^)]*\)\s*$/, ''), nm = dn || (/^trial\b/i.test(dvc.name || '') ? 'value' : dvc.name || 'value'); return 'Mean ' + nm.charAt(0).toLowerCase() + nm.slice(1) + (dvc.unit ? ' / ' + dvc.unit : ''); })(), caption: '' };
      var m = RH.ia.page('graphs', '<div class="rh-card"><h3>Saved graphs</h3><div id="g-list"></div></div><div id="g-studio"></div>');
      var list = function () { m.querySelector('#g-list').innerHTML = gs.length ? '<div class="rh-list">' + gs.map(function (x, i) { return '<div class="rh-item"><b class="small">Figure ' + x.fig + ': ' + E(x.title || 'untitled') + '</b><span class="meta">' + E(x.type) + (x.trend ? ' with regression' : '') + ' · error bars: ' + E(x.err) + '</span><div class="btns"><button class="btn xs" data-ed="' + i + '" type="button">Open</button>' + (RH.owner ? '<button class="btn xs bad" data-rm="' + i + '" type="button">Remove</button>' : '') + '</div></div>'; }).join('') + '</div>' : '<p class="small muted">No graphs saved yet.</p>';
        m.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { D.editG = +b.dataset.ed; D.graphStage(); }; });
        m.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { gs.splice(+b.dataset.rm, 1); RH.set('graphs', gs); D.editG = null; list(); }; }); };
      list();
      studio(m.querySelector('#g-studio'), ds, g, RH.owner ? function (x) { if (D.editG != null && gs[D.editG]) gs[D.editG] = x; else { gs.push(x); D.editG = gs.length - 1; } RH.set('graphs', gs); list(); RH.toast('Graph saved'); } : null);
    });
  };
  D.graphLab = function () {
    var m = RH.shell('#/graph', '<div class="rh-card"><h2>📈 Graph studio</h2><p class="small">Paste a table (first column the IV, then one column per repeat; first row the headings with units) to draw a scientific graph and check it. In your IA, graphs come straight from your data set.</p><div class="rh-field"><label for="gl-in">Table (CSV, or copied from a spreadsheet)</label><textarea id="gl-in" class="tall" placeholder="Temperature (°C),Trial 1,Trial 2,Trial 3\n20,1.2,1.4,1.3\n30,2.0,2.2,1.9"></textarea></div><div class="btns"><button class="btn main sm" id="gl-go" type="button">Draw</button></div></div><div id="gl-studio"></div>');
    m.querySelector('#gl-go').onclick = function () {
      var rows = D.parseCSV(m.querySelector('#gl-in').value.replace(/\t/g, ',')); if (rows.length < 2) return RH.toast('Paste a heading row and at least one data row');
      var head = rows[0], cols = head.map(function (h, i) { var mm = String(h).match(/^(.*?)\s*[\/(]\s*([^)]*)\)?\s*$/); return { name: (mm ? mm[1] : h).trim(), unit: mm ? mm[2].trim() : '', kind: i === 0 ? 'iv' : 'trial' }; });
      var ds = { columns: cols, rows: rows.slice(1) };
      studio(m.querySelector('#gl-studio'), ds, { type: rows.slice(1).every(function (r) { return isNum(r[0]); }) ? 'scatter' : 'bar', err: 'sd', points: 'means', fig: 1, title: '', xTitle: cols[0].name + (cols[0].unit ? ' / ' + cols[0].unit : ''), yTitle: 'Mean ' + (cols[1] ? cols[1].name.replace(/trial\s*\d*/i, '').trim() || 'value' : 'value') + (cols[1] && cols[1].unit ? ' / ' + cols[1].unit : ''), caption: '' }, null);
    };
  };
})();
