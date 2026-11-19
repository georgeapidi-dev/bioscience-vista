/* My lab results · BioscienceVista · by BioscienceVista
   Every virtual laboratory and simulator result a student has recorded (table sim_attempts), on any device:
   the data table, analysis score, hand-in state and the teacher's comment, with CSV download and a link back to the lab. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var CSS = '.lr-hero{margin:8px 0 16px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#16A34A,#0D9488 45%,#0284C7)}.lr-hero h1{margin:4px 0 6px;color:#fff}.lr-hero p{margin:0;color:#fff}' +
    '.lr-card{background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-top:4px solid var(--c,#0D9488);border-radius:16px;padding:14px 16px;margin:0 0 12px}.lr-card summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}' +
    '.lr-chip{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.78rem;font-weight:700;background:#ECFDF5;color:#065F46;margin-right:4px}.lr-tw{overflow:auto;max-height:340px;margin:10px 0}.lr-t{border-collapse:collapse;font-size:.86rem;width:100%}.lr-t th,.lr-t td{border:1px solid #e2e8f0;padding:4px 7px;text-align:left}.lr-t th{background:#F0FDFA}' +
    '.lr-fb{padding:8px 12px;border-radius:10px;background:#EEF2FF;border:1px solid #C7D2FE;margin:6px 0}.lr-muted{color:#64748b;font-size:.88rem}';
  var LC = {};
  function dps(a) { var D = {}; ((a.answers && a.answers._cols) || LC[a.sim] || []).forEach(function (c) { if (c && c[2] != null) D[c[0]] = c[2]; }); return D; }
  function fmt(v, d) { if (v == null) return ''; if (typeof v === 'number') return d != null ? v.toFixed(d) : String(Number.isInteger(v) ? v : Number(v.toPrecision(4))); return typeof v === 'object' ? JSON.stringify(v) : String(v); }
  function heads(a) { var H = {}; (LC[a.sim] || []).forEach(function (c) { H[c[0]] = c[1]; }); ((a.answers && a.answers._cols) || []).forEach(function (c) { if (c && c[0]) H[c[0]] = c[1]; }); return H; }
  function colsOf(a) { var cols = ((a.answers && a.answers._cols) || LC[a.sim] || []).map(function (c) { return c[0]; }); a.data.forEach(function (row) { Object.keys(row || {}).forEach(function (k) { if (k[0] !== '_' && cols.indexOf(k) < 0) cols.push(k); }); });
    return cols.filter(function (k) { return a.data.some(function (r) { return r && r[k] != null && r[k] !== ''; }); }); }
  var COL = ['#16A34A', '#0284C7', '#EA580C', '#7C3AED', '#DB2777', '#0D9488'];
  S.guard(app, { anyone: true, allowPending: true, school: true }).then(function (me) {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    app.innerHTML = '<section class="lr-hero"><p class="vx-eye" style="color:#FEF3C7">Virtual Science Laboratory</p><h1>📋 My lab results</h1><p>Every result you have recorded in a virtual laboratory or simulator, on any device.</p></section><div id="lr"><p class="lr-muted">Loading…</p></div>';
    fetch('/assets/labresults-cols.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (m) { LC = m || {}; return S.db.from('sim_attempts').select('id,sim,sim_title,data,score,max_score,trials,started_at,updated_at,submitted_at,teacher_comment,answers').eq('student_id', me.user.id).order('updated_at', { ascending: false }).limit(300).then(function (r) {
      var A = (r.data || []).filter(function (a) { return Array.isArray(a.data) && a.data.length; }), box = document.getElementById('lr');
      if (!A.length) { box.innerHTML = '<section class="lr-card"><p>No recorded results yet. In a <a href="/simulations/">virtual laboratory</a>, press <b>➕ Record trial</b>; in a simulator, press <b>📋 Record this result</b>. Your results then appear here and your teacher can see them.</p></section>'; return; }
      box.innerHTML = '<p class="lr-muted">' + A.length + ' labs and simulations with recorded results.</p>' + A.map(function (a, i) {
        var cols = colsOf(a), H = heads(a), D = dps(a);
        var sim = /^sim:/.test(a.sim), href = sim ? ((a.answers && a.answers.Page) || '/simulations/play/?s=' + a.sim.slice(4)) : '/simulations/' + a.sim + '/';
        return '<details class="lr-card" style="--c:' + COL[i % COL.length] + '"' + (i < 3 ? ' open' : '') + '><summary><b>' + E(a.sim_title || a.sim) + '</b><span><span class="lr-chip">' + a.data.length + ' result' + (a.data.length === 1 ? '' : 's') + '</span>' +
          (a.max_score > 0 ? '<span class="lr-chip" style="background:#EFF6FF;color:#1E40AF">analysis ' + a.score + ' / ' + a.max_score + '</span>' : '') + (a.submitted_at ? '<span class="lr-chip" style="background:#F5F3FF;color:#5B21B6">handed in</span>' : '') + '<span class="lr-muted">' + new Date(a.updated_at).toLocaleDateString() + '</span></span></summary>' +
          '<div class="lr-tw"><table class="lr-t"><tr><th>#</th>' + cols.map(function (c) { return '<th>' + E(H[c] || c) + '</th>'; }).join('') + '</tr>' + a.data.map(function (row, j) { return '<tr><td>' + (j + 1) + '</td>' + cols.map(function (c) { return '<td>' + E(fmt(row[c], D[c])) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
          (a.teacher_comment ? '<div class="lr-fb"><b>Your teacher:</b> ' + E(a.teacher_comment) + '</div>' : '') +
          '<p><a class="btn sm main" href="' + E(href) + '">Open the ' + (sim ? 'simulator' : 'laboratory') + '</a> <button class="btn sm" data-csv="' + i + '">⬇ Download CSV</button></p></details>'; }).join('');
      [].forEach.call(box.querySelectorAll('[data-csv]'), function (b) { b.onclick = function () { var a = A[+b.getAttribute('data-csv')], cols = colsOf(a), H = heads(a), D = dps(a);
        var q = function (v) { v = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
        var csv = [['Trial'].concat(cols.map(function (c) { return H[c] || c; })).map(q).join(',')].concat(a.data.map(function (row, j) { return [j + 1].concat(cols.map(function (c) { return fmt(row[c], D[c]); })).map(q).join(','); })).join('\r\n');
        var l = document.createElement('a'); l.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); l.download = (a.sim || 'results').replace(/[^\w-]+/g, '-') + '.csv'; document.body.appendChild(l); l.click(); setTimeout(function () { URL.revokeObjectURL(l.href); l.remove(); }, 500); }; });
    }); });
  }, function () {});
})();
