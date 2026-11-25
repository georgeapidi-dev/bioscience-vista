/* VistaEd paper exams (23 Nov 2026, roadmap phase 4). From a class's Assessments tab → 🖨 Paper.
   1. Print the question paper: a cover page (name, class, time, total marks, instructions), numbered questions with
      marks, answer lines sized to the marks, options for multiple choice, and source passages and diagrams.
      Optionally one copy per student with the name already printed.
   2. Print the mark scheme (the existing printable mark scheme).
   3. Enter marks: a grid of students × questions. Type, or paste a block straight from Excel or Google Sheets.
      Saving calls record_paper_marks (migration 083), so the gradebook and analysis update like an online attempt.
   BVPAPER.open({ S, cls, quiz: {id, title, time_limit_minutes}, kids: [{id, full_name}], markScheme(qid) }) */
(function () {
  var P = window.BVPAPER = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rich(p) { var T = window.BVT || {}; try { return T.rich ? T.rich(p, true) : E(p); } catch (e) { return E(p); } }
  function load(S, qid) { return S.db.from('quiz_questions').select('position, questions(id,kind,prompt,options,marks,image_url,section,meta)').eq('quiz_id', qid).order('position').then(function (r) { return (r.data || []).map(function (z) { return z.questions; }).filter(Boolean); }); }
  function label(q, i) { var mt = q.meta || {}; return 'label' in mt && mt.label ? mt.label : String(i); }

  P.open = function (o) {
    var S = o.S, w = document.createElement('div');
    w.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px';
    w.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:1100px;width:100%;padding:16px 18px"><div class="row2" style="align-items:center"><h3 style="margin:0">🖨 Paper exam · ' + E(o.quiz.title) + '</h3><button type="button" class="btn sm" data-x>✕ Close</button></div>' +
      '<p class="small muted">' + E(o.cls.name) + ' · students sit it on paper; you type their marks here and they flow into the gradebook like an online attempt.</p>' +
      '<div class="acts"><button type="button" class="btn sm main" data-a="print">1 · Print the question paper</button><label class="small" style="display:inline-flex;gap:5px;align-items:center"><input type="checkbox" data-named> one copy per student, name printed</label>' +
      '<button type="button" class="btn sm" data-a="ms">2 · Print the mark scheme</button><button type="button" class="btn sm main" data-a="grid">3 · Enter marks</button></div><div data-body style="margin-top:10px"></div></div>';
    document.body.appendChild(w);
    var body = w.querySelector('[data-body]');
    w.addEventListener('click', function (e) { if (e.target === w || e.target.closest('[data-x]')) w.remove(); });
    w.querySelector('[data-a="print"]').onclick = function () { load(S, o.quiz.id).then(function (qs) { printPaper(o, qs, w.querySelector('[data-named]').checked); }); };
    w.querySelector('[data-a="ms"]').onclick = function () { if (o.markScheme) o.markScheme(o.quiz.id); };
    w.querySelector('[data-a="grid"]').onclick = function () { body.innerHTML = '<p class="muted">Loading…</p>'; load(S, o.quiz.id).then(function (qs) { grid(body, o, qs); }); };
  };

  function printPaper(o, qs, named) {
    var items = qs.filter(function (q) { return q.kind !== 'info'; }), total = items.reduce(function (t, q) { return t + (+q.marks || 0); }, 0), n = 0;
    var paper = qs.map(function (q) {
      if (q.kind === 'info') return '<div class="info">' + rich(q.prompt) + (q.image_url ? '<img src="' + E(q.image_url) + '" alt="">' : '') + '</div>';
      n++; var lines = q.kind === 'short' ? Math.max(3, Math.min(24, (+q.marks || 1) * 2)) : 0;
      return (q.section && /Section|Paper|Part/i.test(q.section) ? '<h3>' + E(q.section) + '</h3>' : '') + '<div class="q"><div class="qh"><b>' + E(label(q, n)) + '</b> <span>' + rich(q.prompt) + '</span><em>[' + E(q.marks) + ']</em></div>' +
        (q.image_url ? '<img src="' + E(q.image_url) + '" alt="">' : '') +
        (q.kind === 'mcq' || q.kind === 'tf' ? '<ol class="opt" type="A">' + (q.options || []).map(function (x) { return '<li>' + rich(String(x)) + '</li>'; }).join('') + '</ol><p class="box">Answer: ______</p>'
          : q.kind === 'short' ? '<div class="lines">' + new Array(lines + 1).join('<div></div>') + '</div>' : '<p class="small">(Answer this question on the website or as your teacher directs.)</p>') + '</div>';
    }).join('');
    function cover(name) {
      return '<section class="cover"><p class="brand">VistaEd' + (o.author ? ' · prepared by ' + E(o.author) : '') + '</p><h1>' + E(o.quiz.title) + '</h1><p>' + E(o.cls.name) + '</p>' +
        '<table><tr><td>Name</td><td class="w">' + E(name || '') + '</td></tr><tr><td>Date</td><td class="w"></td></tr>' + (o.quiz.time_limit_minutes ? '<tr><td>Time allowed</td><td>' + E(o.quiz.time_limit_minutes) + ' minutes</td></tr>' : '') + '<tr><td>Total marks</td><td>' + total + '</td></tr></table>' +
        '<h3>Instructions</h3><ul><li>Answer all questions in the spaces provided.</li><li>The number of marks is shown in brackets [ ] at the end of each question.</li><li>Show your working in calculations. Write clearly in dark ink.</li></ul>' +
        '<table class="mk"><tr><th>Question</th>' + items.map(function (q, i) { return '<th>' + E(label(q, i + 1)) + '</th>'; }).join('') + '<th>Total</th></tr><tr><td>Mark</td>' + items.map(function () { return '<td></td>'; }).join('') + '<td></td></tr><tr><td>Out of</td>' + items.map(function (q) { return '<td>' + E(q.marks) + '</td>'; }).join('') + '<td>' + total + '</td></tr></table></section>';
    }
    var names = named ? o.kids.map(function (k) { return k.full_name || ''; }).sort() : [''];
    var css = 'body{font:13pt/1.45 Georgia,"Times New Roman",serif;margin:0;color:#000}.pg{max-width:780px;margin:0 auto;padding:18px}.bar{position:sticky;top:0;background:#fff;padding:8px;border-bottom:1px solid #ccc;text-align:center}@media print{.bar{display:none}.copy{page-break-after:always}}' +
      '.cover{page-break-after:always;text-align:center}.cover .brand{letter-spacing:.2em;font-size:10pt;color:#444}.cover table{margin:14px auto;border-collapse:collapse;text-align:left}.cover td{padding:6px 10px;border-bottom:1px solid #999}.cover td.w{min-width:280px}.cover ul{text-align:left;max-width:560px;margin:0 auto}' +
      '.mk{font-size:10pt}.mk th,.mk td{border:1px solid #555;padding:4px 6px;text-align:center;min-width:26px}.q{margin:14px 0;page-break-inside:avoid}.qh{display:flex;gap:8px}.qh span{flex:1}.qh em{font-style:normal;white-space:nowrap}' +
      '.lines div{border-bottom:1px solid #888;height:30px}.opt{margin:6px 0 4px 34px}.box{margin:4px 0 0 34px}.info{border:1px solid #555;padding:8px 10px;margin:12px 0;background:#f7f7f7}img{max-width:100%;max-height:340px;display:block;margin:6px auto}h3{margin:18px 0 4px}';
    var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + E(o.quiz.title) + ' · question paper</title><style>' + css + '</style></head><body><div class="bar"><button onclick="print()">🖨 Print or save as PDF</button></div>' +
      names.map(function (nm) { return '<div class="copy"><div class="pg">' + cover(nm) + paper + '<p style="text-align:center;margin-top:24px">END OF PAPER</p></div></div>'; }).join('') + '</body></html>';
    var win = window.open('', '_blank'); if (!win) { alert('Allow pop-ups to open the paper.'); return; } win.document.write(html); win.document.close();
  }

  function grid(host, o, qs) {
    var S = o.S, items = qs.filter(function (q) { return q.kind !== 'info' && +q.marks > 0; }), kids = o.kids.slice().sort(function (a, b) { return (a.full_name || '').localeCompare(b.full_name || ''); });
    if (!items.length) { host.innerHTML = '<p class="emptybox">This quiz has no questions with marks.</p>'; return; }
    S.db.from('quiz_attempts').select('student_id,detail,answers,submitted_at').eq('quiz_id', o.quiz.id).in('student_id', kids.map(function (k) { return k.id; })).then(function (r) {
      var prev = {}; (r.data || []).forEach(function (a) { if (!a.answers || !a.answers._paper) return; var m = {}; (a.detail || []).forEach(function (d) { if (d.got != null) m[d.question_id] = d.got; }); prev[a.student_id] = m; });
      host.innerHTML = '<style>.pg-t{border-collapse:collapse;font-size:.86rem}.pg-t th,.pg-t td{border:1px solid #e2e8f0;padding:3px;text-align:center}.pg-t td.nm,.pg-t th.nm{text-align:left;white-space:nowrap;padding:3px 8px;position:sticky;left:0;background:#fff}.pg-t input{width:3.4em;text-align:center;border:1px solid #cbd5e1;border-radius:6px;padding:3px}.pg-t input.bad{background:#fee2e2;border-color:#ef4444}.pg-t tr.saved td{background:#f0fdf4}</style>' +
        '<p class="small">Type each mark; <b>Enter</b> moves down, <b>Tab</b> moves right. You can paste a block copied from Excel or Google Sheets into any box. Leave a box empty if that question is not marked yet. Rows with no marks are skipped.</p>' +
        '<div class="tablewrap" style="max-height:60vh;overflow:auto"><table class="pg-t"><tr><th class="nm">Student</th>' + items.map(function (q, i) { return '<th title="' + E(String(q.prompt || '').slice(0, 120)) + '">' + E(label(q, i + 1)) + '<br><span class="small muted">/' + E(q.marks) + '</span></th>'; }).join('') + '<th>Total</th></tr>' +
        kids.map(function (k, r2) { var pv = prev[k.id] || {};
          return '<tr data-s="' + E(k.id) + '"' + (prev[k.id] ? ' class="saved"' : '') + '><td class="nm">' + E(k.full_name || '(no name)') + '</td>' + items.map(function (q, c) { return '<td><input inputmode="decimal" data-r="' + r2 + '" data-c="' + c + '" data-q="' + E(q.id) + '" data-max="' + E(q.marks) + '" value="' + E(pv[q.id] != null ? pv[q.id] : '') + '" aria-label="' + E((k.full_name || '') + ', question ' + label(q, c + 1)) + '"></td>'; }).join('') + '<td data-tot><b></b></td></tr>'; }).join('') + '</table></div>' +
        '<div class="acts" style="margin-top:8px"><button type="button" class="btn main sm" data-save>💾 Save marks</button> <span class="small" data-m></span></div>';
      var all = [].slice.call(host.querySelectorAll('input[data-q]'));
      function cell(r3, c) { return host.querySelector('input[data-r="' + r3 + '"][data-c="' + c + '"]'); }
      function check(i) { var v = i.value.trim(), ok = v === '' || (!isNaN(+v) && +v >= 0 && +v <= +i.getAttribute('data-max')); i.classList.toggle('bad', !ok); return ok; }
      function totals() { host.querySelectorAll('tr[data-s]').forEach(function (tr) { var t = 0, any = false; tr.querySelectorAll('input').forEach(function (i) { if (i.value.trim() !== '' && !isNaN(+i.value)) { t += +i.value; any = true; } }); tr.querySelector('[data-tot] b').textContent = any ? t : ''; }); }
      all.forEach(function (i) {
        i.addEventListener('input', function () { check(i); totals(); });
        i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var n = cell(+i.getAttribute('data-r') + 1, i.getAttribute('data-c')); if (n) n.focus(); } });
        i.addEventListener('paste', function (e) { var t = (e.clipboardData || window.clipboardData).getData('text'); if (!/[\t\n]/.test(t)) return; e.preventDefault();
          var r0 = +i.getAttribute('data-r'), c0 = +i.getAttribute('data-c');
          t.replace(/\r/g, '').replace(/\n$/, '').split('\n').forEach(function (line, dr) { line.split('\t').forEach(function (v, dc) { var x = cell(r0 + dr, c0 + dc); if (x) { x.value = v.trim(); check(x); } }); }); totals(); });
      });
      totals();
      host.querySelector('[data-save]').onclick = function () {
        var m = host.querySelector('[data-m]'); if (!all.every(check)) { m.textContent = 'Fix the boxes in red: each mark must be between 0 and the question\'s marks.'; return; }
        var rows = []; host.querySelectorAll('tr[data-s]').forEach(function (tr) { var mk = {}, any = false; tr.querySelectorAll('input').forEach(function (i) { var v = i.value.trim(); if (v !== '') { mk[i.getAttribute('data-q')] = +v; any = true; } }); if (any) rows.push({ student_id: tr.getAttribute('data-s'), marks: mk }); });
        if (!rows.length) { m.textContent = 'Type at least one mark first.'; return; }
        m.textContent = 'Saving ' + rows.length + ' student' + (rows.length > 1 ? 's' : '') + '…';
        S.db.rpc('record_paper_marks', { qz: o.quiz.id, cls: o.cls.id, rows: rows }).then(function (x) {
          if (x.error) { m.textContent = /does not exist|schema cache/i.test(x.error.message) ? 'Saving paper marks needs database update 083.' : 'Could not save: ' + x.error.message; return; }
          rows.forEach(function (rw) { var tr = host.querySelector('tr[data-s="' + rw.student_id + '"]'); if (tr) tr.classList.add('saved'); });
          m.textContent = '✓ Saved for ' + x.data + ' student' + (x.data === 1 ? '' : 's') + '. The gradebook and each student\'s results now include them.';
        });
      };
    });
  }
})();
