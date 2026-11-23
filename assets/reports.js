/* BioscienceVista term reports (23 Nov 2026, roadmap phase 4; table term_reports, migration 084).
   BVREP.page(rep, head) → the HTML of one report card. BVREP.print(items) opens them for printing or saving as PDF, one per page.
   BVREP.mine(host, S) lists the published reports a student or parent may see, with a print button. The teacher's side lives in the
   gradebook (📄 Term reports tab). rep.data: { scale, gradeName, grade, pct, crit: {A: {l, n}}, critTotal, att: {pct, present, of}, tasks: {done, of}, from } */
(function () {
  var R = window.BVREP = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  R.CSS = '.rc{max-width:760px;margin:0 auto 18px;border:1px solid #cbd5e1;border-radius:14px;padding:18px 22px;background:#fff;color:#0f172a;font:14px/1.5 system-ui,sans-serif}' +
    '.rc h2{margin:0 0 2px;font-size:1.3rem}.rc .meta{color:#475569;font-size:.85rem}.rc .band{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.rc .tile{flex:1 1 140px;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:#f8fafc}' +
    '.rc .tile b{display:block;font-size:1.4rem;color:#0f1f3d}.rc .tile span{font-size:.78rem;color:#475569}.rc table{border-collapse:collapse;width:100%;margin:6px 0}.rc td,.rc th{border:1px solid #e2e8f0;padding:5px 8px;text-align:left;font-size:.88rem}' +
    '.rc .cm{white-space:pre-wrap;border-left:4px solid #0d9488;padding:6px 10px;background:#f0fdfa;border-radius:6px}.rc .foot{color:#64748b;font-size:.75rem;margin-top:10px}@media print{.rc{border:none;page-break-after:always}.noprint{display:none}}';
  R.page = function (rep, head) {
    var d = rep.data || {}, h = head || {}, crit = d.crit || {};
    return '<article class="rc"><div class="meta">BioscienceVista · Term report</div><h2>' + E(h.student_name || d.student || '') + '</h2><div class="meta">' + E(h.class_name || d.class_name || '') + (h.subject || d.subject ? ' · ' + E(h.subject || d.subject) : '') + ' · ' + E(rep.term) + (h.teacher_name || d.teacher ? ' · Teacher: ' + E(h.teacher_name || d.teacher) : '') + '</div>' +
      '<div class="band">' + (d.grade != null && d.grade !== '' ? '<div class="tile"><b>' + E(d.grade) + '</b><span>' + E(d.gradeName || 'Grade') + '</span></div>' : '') + (d.pct != null ? '<div class="tile"><b>' + E(d.pct) + '%</b><span>Overall result</span></div>' : '') +
      (d.tasks ? '<div class="tile"><b>' + E(d.tasks.done) + ' / ' + E(d.tasks.of) + '</b><span>Tasks completed</span></div>' : '') + (d.att && d.att.of ? '<div class="tile"><b>' + E(d.att.pct) + '%</b><span>Attendance (' + E(d.att.present) + ' of ' + E(d.att.of) + ' lessons)</span></div>' : '') + '</div>' +
      (Object.keys(crit).length ? '<table><tr><th>MYP criterion</th><th>Level (0–8)</th></tr>' + 'ABCD'.split('').filter(function (L) { return crit[L]; }).map(function (L) { return '<tr><td>' + L + ': ' + E(crit[L].n) + '</td><td>' + (crit[L].l == null ? '–' : E(crit[L].l)) + '</td></tr>'; }).join('') + (d.critTotal != null ? '<tr><th>Total / 32</th><th>' + E(d.critTotal) + '</th></tr>' : '') + '</table>' : '') +
      (rep.comment ? '<h4 style="margin:12px 0 4px">Teacher\'s comment</h4><div class="cm">' + E(rep.comment) + '</div>' : '') +
      '<div class="foot">' + (d.from ? 'Covers work from ' + E(d.from) + '. ' : '') + 'Issued ' + E(new Date(rep.updated_at || Date.now()).toLocaleDateString()) + '.' + (Object.keys(crit).length ? ' MYP grades use the IB\'s 1–7 boundaries for the sum of the four criteria.' : '') + '</div></article>';
  };
  R.print = function (items, title) {
    var w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print the reports.'); return; }
    w.document.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + E(title || 'Term reports') + '</title><style>body{background:#f1f5f9;margin:0;padding:16px}' + R.CSS + '</style></head><body><p class="noprint" style="text-align:center"><button onclick="print()">🖨 Print or save as PDF</button></p>' +
      items.map(function (x) { return R.page(x.rep, x.head); }).join('') + '</body></html>'); w.document.close();
  };
  R.mine = function (host, S) {
    S.db.from('term_reports').select('id,term,data,comment,updated_at,student_id').eq('published', true).order('updated_at', { ascending: false }).limit(60).then(function (r) {
      var rows = r.data || []; if (r.error || !rows.length) { host.remove(); return; }
      S.db.rpc('report_heads', { ids: rows.map(function (x) { return x.id; }) }).then(function (h) {
        var hd = {}; ((h && h.data) || []).forEach(function (x) { hd[x.report_id] = x; });
        host.innerHTML = '<h3>📄 Term reports</h3><div class="tablewrap"><table class="marks"><tr><th>Term</th><th>Student</th><th>Class</th><th>Grade</th><th></th></tr>' + rows.map(function (x, i) { var e = hd[x.id] || {}, d = x.data || {};
          return '<tr><td>' + E(x.term) + '</td><td>' + E(e.student_name || '') + '</td><td>' + E(e.class_name || '') + '</td><td>' + E(d.grade != null ? d.grade : '–') + '</td><td><button type="button" class="btn sm" data-rp="' + i + '">📄 Open</button></td></tr>'; }).join('') + '</table></div>';
        host.querySelectorAll('[data-rp]').forEach(function (b) { b.onclick = function () { var x = rows[+b.getAttribute('data-rp')]; R.print([{ rep: x, head: hd[x.id] }], x.term); }; });
      }, function () { host.remove(); });
    }, function () { host.remove(); });
  };
})();
