/* BioscienceVista gradebook (23 Nov 2026). Teacher dashboard → Gradebook.
   One grid per class: every task (interactive lessons, exam-style question sets, exams) for every student, from the marks already saved
   (student_results). For MYP (Grade 6–10) classes, each student's level 0–8 in criteria A–D comes from every marked answer
   (item_results), using the criteria each lesson step and question assesses (/assets/criteria.json, questions.criterion), turned into levels
   with the teacher's own MYP boundaries; the four levels give the MYP grade 1–7 with the IB's published boundaries.
   IB Diploma classes get a 1–7 grade from the teacher's HL or SL boundaries. Everything can be downloaded as a CSV for ManageBac.
   Read only: nothing here changes a mark. */
(function () {
  var GB = window.BVGB = {};
  var MYP_GRADE = [[1, 5, 1], [6, 9, 2], [10, 14, 3], [15, 18, 4], [19, 23, 5], [24, 27, 6], [28, 32, 7]];   // IB MYP grade boundaries (sum of four criteria, 0–32)
  var CRIT = null, CN = { A: 'Knowing and understanding', B: 'Inquiring and designing', C: 'Processing and evaluating', D: 'Reflecting on the impacts of science' };
  var CN_MATHS = { A: 'Knowing and understanding', B: 'Investigating patterns', C: 'Communicating', D: 'Applying mathematics in real-life contexts' };
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pct(g, m) { return m > 0 ? Math.round(g / m * 1000) / 10 : null; }
  function levelOf(p, b) { if (p == null) return null; var n = 0; b.forEach(function (x) { if (p >= x) n++; }); return n; }   // MYP 0–8 from the teacher's boundaries
  function dpGrade(p, b) { if (p == null) return null; var n = 1; b.forEach(function (x) { if (p >= x) n++; }); return n; }   // IB 1–7
  function mypGrade(sum) { for (var i = 0; i < MYP_GRADE.length; i++) if (sum >= MYP_GRADE[i][0] && sum <= MYP_GRADE[i][1]) return MYP_GRADE[i][2]; return sum > 32 ? 7 : null; }
  function shortTitle(t) { t = String(t || ''); var m = t.match(/: (.+)$/); return (m ? m[1] : t).replace(/\s*·\s*Criteri.*$/, '').replace(/ exam-style questions$/i, ''); }
  function csv(rows, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n')], { type: 'text/csv' })); a.download = name; a.click(); }
  function inChunks(ids, n, f) { var out = [], ps = []; for (var i = 0; i < ids.length; i += n) ps.push(f(ids.slice(i, i + n))); return Promise.all(ps).then(function (rs) { rs.forEach(function (r) { if (r && r.data) out = out.concat(r.data); }); return out; }); }
  function crits() { return CRIT ? Promise.resolve(CRIT) : fetch('/assets/criteria.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (j) { CRIT = j || {}; return CRIT; }); }

  /* Grading scales (23 Nov 2026). Each class has the boundaries of its course; a teacher can change them for each class
     (table class_grade_boundaries, migration 079). bounds = minimum % for each grade, lowest grade first. */
  var SC = GB.SCALES = {
    MYP: { name: 'MYP level', below: '0', grades: ['1', '2', '3', '4', '5', '6', '7', '8'], def: [1, 13, 26, 38, 51, 63, 76, 88], note: 'Level for each criterion A–D. The MYP grade 1–7 comes from the four levels with the IB\'s fixed boundaries.' },
    HL: { name: 'IB grade (HL)', below: '1', grades: ['2', '3', '4', '5', '6', '7'], def: [14, 26, 38, 49, 60, 72], note: 'IB Diploma Higher Level grades 1–7.' },
    SL: { name: 'IB grade (SL)', below: '1', grades: ['2', '3', '4', '5', '6', '7'], def: [14, 26, 38, 49, 60, 72], note: 'IB Diploma Standard Level grades 1–7.' },
    IGCSE: { name: 'IGCSE grade', below: 'U', grades: ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'A*'], def: [20, 30, 40, 50, 60, 70, 80, 90], note: 'Cambridge IGCSE grades A*–G. Cambridge publishes new thresholds for each exam series: type in the thresholds for the paper you used.' },
    ALEVEL: { name: 'A Level grade', below: 'U', grades: ['E', 'D', 'C', 'B', 'A', 'A*'], def: [40, 50, 60, 70, 80, 90], note: 'Cambridge AS & A Level grades A*–E. Cambridge publishes new thresholds for each exam series: type in the thresholds for the paper you used.' }
  };
  GB.scaleOf = function (cls, isMyp) {
    var t = [cls.course, cls.programme, cls.level, cls.name, cls.subject].join(' ');
    if ((isMyp && isMyp(cls)) || /\bMYP\b|\bgrade[- ]?(6|7|8|9|10)\b/i.test(t)) return 'MYP';
    if (/igcse/i.test(t)) return 'IGCSE';
    if (/\bA[ -]?Level\b|\bAS Level\b|alevel/i.test(t)) return 'ALEVEL';
    if (/\b(stage|checkpoint|lower secondary|ks3)\b|\bcks\d/i.test(t)) return '';
    return /\bHL\b|-hl\b|higher level/i.test(t) ? 'HL' : 'SL';
  };
  GB.grade = function (p, scale, b) {   // {t: grade text, r: rank 0..n, n} or null
    var s = SC[scale]; if (p == null || !s) return null; var r = 0; (b || s.def).forEach(function (x) { if (p >= x) r++; });
    return { t: r ? s.grades[r - 1] : s.below, r: r, n: s.grades.length };
  };
  function gcls(g) { return g ? 'g' + Math.max(1, Math.min(7, 1 + Math.round(6 * g.r / g.n))) : ''; }
  /* Boundary editor for one class: host element, class, ctx {S, ME}, current bounds or null, onSaved(bounds) */
  GB.editor = function (host, cls, ctx, scale, cur, onSaved, others) {
    var s = SC[scale]; if (!s) { host.innerHTML = '<p class="small muted">This class\'s course is graded as a percentage only, so it has no grade boundaries.</p>'; return; }
    var b = (cur || s.def).slice(), db = ctx.S.db;
    host.innerHTML = '<p class="small" style="margin:0 0 6px">' + E(s.note) + ' Below the lowest boundary: ' + E(s.below) + '. ' + (cur ? '<b>This class has its own boundaries.</b>' : 'Using the default boundaries for this course.') + '</p>' +
      '<div class="tablewrap"><table><tr>' + s.grades.map(function (g) { return '<th>' + E(g) + '</th>'; }).join('') + '</tr><tr>' +
      b.map(function (v, i) { return '<td><input type="number" min="0" max="100" step="0.5" value="' + E(v) + '" data-i="' + i + '" style="width:4.8em" aria-label="' + E(s.name + ' ' + s.grades[i]) + ' minimum percentage"> %</td>'; }).join('') + '</tr></table></div>' +
      '<div class="acts" style="margin-top:6px"><button type="button" class="btn main sm" data-sv>Save for this class</button>' + (others && others.length ? ' <button type="button" class="btn sm" data-cp>Save for all ' + (others.length + 1) + ' of my ' + E(s.name.replace(/ grade| level/i, '')) + ' classes</button>' : '') + ' <button type="button" class="btn sm" data-df>Back to defaults</button> <span class="small" data-m></span></div>';
    var ins = [].slice.call(host.querySelectorAll('input[data-i]')), msg = host.querySelector('[data-m]');
    function vals() { return ins.map(function (x) { return +x.value; }); }
    function ok(v) { return v.every(function (x, i) { return isFinite(x) && x >= 0 && x <= 100 && (i === 0 || x > v[i - 1]); }); }
    function save(ids) {
      var v = vals(); if (!ok(v)) { msg.textContent = 'Each boundary must be between 0 and 100 and higher than the one before.'; return; }
      msg.textContent = 'Saving…';
      db.from('class_grade_boundaries').upsert(ids.map(function (id) { return { class_id: id, teacher_id: ctx.ME.user.id, scale: scale, bounds: v, updated_at: new Date().toISOString() }; })).then(function (x) {
        if (x.error) { msg.textContent = /does not exist|schema cache/i.test(x.error.message) ? 'Class boundaries need database update 079 first.' : 'Could not save: ' + x.error.message; return; }
        try { sessionStorage.removeItem('bv-bounds'); } catch (e) {} msg.textContent = '✓ Saved' + (ids.length > 1 ? ' for ' + ids.length + ' classes' : '') + '.'; if (onSaved) onSaved(v);
      });
    }
    host.querySelector('[data-sv]').onclick = function () { save([cls.id]); };
    var cp = host.querySelector('[data-cp]'); if (cp) cp.onclick = function () { save([cls.id].concat(others.map(function (c) { return c.id; }))); };
    host.querySelector('[data-df]').onclick = function () {
      msg.textContent = 'Resetting…';
      db.from('class_grade_boundaries').delete().eq('class_id', cls.id).then(function (x) {
        if (x.error) { msg.textContent = 'Could not reset: ' + x.error.message; return; }
        s.def.forEach(function (v, i) { ins[i].value = v; }); msg.textContent = '✓ Back to the defaults.'; if (onSaved) onSaved(null);
      });
    };
  };

  /* ctx: { S, ME, classes, isMyp(class), toast(msg), fixed (one class, shown inside its class page) } */
  GB.render = function (p, ctx) {
    var S = ctx.S, db = S.db, classes = ctx.classes || [];
    var cid = ''; try { cid = sessionStorage.getItem('bv-gb-class') || ''; } catch (e) {}
    if (!classes.some(function (c) { return c.id === cid; })) cid = classes.length ? classes[0].id : '';
    if (ctx.only) cid = ctx.only;
    var from = ''; try { from = sessionStorage.getItem('bv-gb-from') || ''; } catch (e) {}
    var view = 'tasks', ALL = false, TL = {};
    if (!classes.length) { p.innerHTML = '<p class="emptybox">Create a class first; its gradebook appears here.</p>'; return; }
    var css = '<style>.gb-wrap{overflow:auto;max-height:70vh;border:1px solid #e2e8f0;border-radius:14px}.gb{border-collapse:separate;border-spacing:0;font-size:.86rem;min-width:100%}' +
      '.gb th,.gb td{padding:6px 8px;border-bottom:1px solid #eef2f7;border-right:1px solid #f1f5f9;white-space:nowrap;text-align:center}.gb thead th{position:sticky;top:0;background:#f8fafc;z-index:2;vertical-align:bottom}' +
      '.gb th.tk{writing-mode:vertical-rl;transform:rotate(180deg);max-height:180px;white-space:normal;font-weight:600;font-size:.78rem;min-width:34px}.gb td.nm,.gb th.nm{position:sticky;left:0;background:#fff;text-align:left;z-index:1;font-weight:700}.gb thead th.nm{z-index:3;background:#f8fafc}' +
      '.gb .c{border-radius:8px;padding:2px 6px;display:inline-block;min-width:2.6em;font-weight:700}.gb .g7,.gb .l8,.gb .l7{background:#dcfce7;color:#166534}.gb .g6,.gb .g5,.gb .l6,.gb .l5{background:#e0f2fe;color:#075985}.gb .g4,.gb .l4,.gb .l3{background:#fef9c3;color:#854d0e}.gb .g3,.gb .g2,.gb .g1,.gb .l2,.gb .l1,.gb .l0{background:#fee2e2;color:#991b1b}' +
      '.gb .fin{font-size:1rem}.gb-key{display:flex;flex-wrap:wrap;gap:8px;font-size:.82rem;margin:8px 0}.gb-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.gb-tabs button{border-radius:999px;border:2px solid #4f46e5;background:#eef2ff;color:#4f46e5;font-weight:800;padding:6px 14px;cursor:pointer}.gb-tabs button[aria-pressed=true]{background:#4f46e5;color:#fff}</style>';
    p.innerHTML = css + '<section class="panel tint"><h3 style="margin-top:0">📒 Gradebook</h3><p class="small">Every mark your students have earned in this class, in one grid. MYP classes also get each student\'s <b>level 0–8 in criteria A–D</b> and their <b>MYP grade 1–7</b> (IB boundaries); IB Diploma classes get a <b>grade 1–7</b> from your <a href="#grading">grade boundaries</a>. Download any view as a CSV to enter in ManageBac.</p>' +
      '<div class="row2" style="align-items:end;flex-wrap:wrap;gap:10px"><label class="f" style="margin:0;min-width:220px' + (ctx.fixed ? ';display:none' : '') + '">Class<select id="gbc">' + classes.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cid ? ' selected' : '') + '>' + E(c.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f" style="margin:0">From (term start)<input type="date" id="gbf" value="' + E(from) + '"></label><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="gba"> Include work not set for this class</label>' +
      '<button type="button" class="btn sm" id="gbcsv">⬇ Download CSV for ManageBac</button></div></section><details class="panel" id="gbbd" style="margin:8px 0"><summary style="cursor:pointer;font-weight:800">🎯 Grade boundaries for this class</summary><div id="gbbe" style="margin-top:8px"></div></details><div id="gbtabs" class="gb-tabs"></div><div id="gbbody"><p class="muted">Loading the gradebook…</p></div>';
    var body = p.querySelector('#gbbody'), DATA = null;
    p.querySelector('#gbc').onchange = function () { cid = this.value; try { sessionStorage.setItem('bv-gb-class', cid); } catch (e) {} load(); };
    p.querySelector('#gbf').onchange = function () { from = this.value; try { sessionStorage.setItem('bv-gb-from', from); } catch (e) {} load(); };
    p.querySelector('#gba').onchange = function () { ALL = this.checked; load(); };
    p.querySelector('#gbcsv').onclick = function () { if (DATA) DATA.csv(); };
    load();

    function load() {
      body.innerHTML = '<p class="muted">Loading the gradebook…</p>'; DATA = null;
      var cls = classes.filter(function (c) { return c.id === cid; })[0] || {}, myp = ctx.isMyp(cls), maths = /math/i.test([cls.subject, cls.course, cls.name].join(' '));
      var level = /\bHL\b/i.test([cls.level, cls.name, cls.course].join(' ')) ? 'HL' : 'SL';
      Promise.all([
        db.from('enrolments').select('student_id,status').eq('class_id', cid),
        db.from('profiles').select('id').eq('class_id', cid),
        db.from('grade_boundaries').select('scale,bounds').eq('teacher_id', cls.teacher_id || ctx.ME.user.id),
        db.from('class_materials').select('path').eq('class_id', cid),
        db.from('quiz_classes').select('quiz_id').eq('class_id', cid),
        crits(),
        db.from('class_grade_boundaries').select('scale,bounds').eq('class_id', cid).then(function (r) { return r; }, function () { return {}; })
      ]).then(function (x) {
        var sids = {}; (x[0].data || []).forEach(function (r) { if (!r.status || /approv|active|accept/i.test(r.status)) sids[r.student_id] = 1; }); (x[1].data || []).forEach(function (r) { sids[r.id] = 1; });
        delete sids[ctx.ME.user.id]; var ids = Object.keys(sids);
        var B = { HL: [14, 26, 38, 49, 60, 72], SL: [14, 26, 38, 49, 60, 72], MYP: [1, 13, 26, 38, 51, 63, 76, 88] }; if (window.BVT && BVT.DEFAULT_BOUNDS) B = JSON.parse(JSON.stringify(BVT.DEFAULT_BOUNDS));
        (x[2].data || []).forEach(function (r) { if (Array.isArray(r.bounds) && B[r.scale] && r.bounds.length === B[r.scale].length) B[r.scale] = r.bounds.map(Number); });
        Object.keys(SC).forEach(function (k) { if (!B[k]) B[k] = SC[k].def.slice(); });
        var own = ((x[6] && x[6].data) || [])[0], scale = own && SC[own.scale] ? own.scale : GB.scaleOf(cls, ctx.isMyp);
        if (own && Array.isArray(own.bounds) && own.bounds.length === SC[own.scale].def.length) B[own.scale] = own.bounds.map(Number);
        if (scale === 'HL' || scale === 'SL') level = scale;
        B.scale = scale;
        var others = classes.filter(function (c) { return c.id !== cid && GB.scaleOf(c, ctx.isMyp) === scale; });
        GB.editor(p.querySelector('#gbbe'), cls, ctx, scale, own ? B[scale] : null, function () { load(); }, others);
        var paths = (x[3].data || []).map(function (r) { return r.path; }), quizSet = {}; (x[4].data || []).forEach(function (r) { quizSet[r.quiz_id] = 1; });
        if (!ids.length) { body.innerHTML = '<p class="emptybox">No students in this class yet.</p>'; return; }
        return Promise.all([
          db.from('profiles').select('id,full_name,email,student_number').in('id', ids),
          inChunks(ids, 60, function (ch) { var q = db.from('student_results').select('student_id,lesson_id,quiz_id,title,score,max_score,best_score,recorded_at').in('student_id', ch).limit(20000); if (from) q = q.gte('recorded_at', from); return q; }),
          myp ? inChunks(ids, 60, function (ch) { var q = db.from('item_results').select('student_id,kind,ref,q_ref,got,max,at,class_id').in('student_id', ch).limit(50000); if (from) q = q.gte('at', from); return q; }) : Promise.resolve([]),
          paths.length ? inChunks(paths, 150, function (ch) { return db.from('materials').select('path,lesson_id').in('path', ch); }) : Promise.resolve([]),
          myp ? inChunks(ids, 60, function (ch) { var q = db.from('quiz_attempts').select('student_id,submitted_at,attempt_criteria(criterion,level)').in('student_id', ch).neq('status', 'in_progress').limit(5000); if (from) q = q.gte('submitted_at', from); return q.then(function (r) { return r; }, function () { return {}; }); }) : Promise.resolve([])
        ]).then(function (y) {
          TL = {}; (y[4] || []).forEach(function (a) { (a.attempt_criteria || []).forEach(function (c) { var o = TL[a.student_id] = TL[a.student_id] || {}; (o[c.criterion] = o[c.criterion] || []).push(+c.level); }); });   // teacher-set best-fit levels (migration 081)
          var exts = (y[3] || []).map(function (m) { return m.lesson_id; }).filter(Boolean);
          return (exts.length ? inChunks(exts, 150, function (ch) { return db.from('lessons').select('id,external_id').in('external_id', ch); }) : Promise.resolve([])).then(function (ls) {
            var lessonSet = {}; ls.forEach(function (l) { lessonSet[l.id] = 1; });
            var qrefs = {}; (y[2] || []).forEach(function (it) { if (it.kind !== 'lesson' && /^[0-9a-f-]{36}$/i.test(it.q_ref || '')) qrefs[it.q_ref] = 1; });
            var qids = Object.keys(qrefs);
            return (qids.length ? inChunks(qids, 150, function (ch) { return db.from('questions').select('id,criterion,section').in('id', ch); }) : Promise.resolve([])).then(function (qs) {
              var qcrit = {}; qs.forEach(function (q) { var m = (q.criterion || '') || ((q.section || '').match(/Criteri\w*\s+([ABCD])/) || [])[1] || ''; if (m) qcrit[q.id] = m; });
              build(cls, myp, maths, level, B, y[0].data || [], y[1], y[2], lessonSet, quizSet, qcrit);
            });
          });
        });
      }).catch(function (e) { body.innerHTML = '<p class="msg">The gradebook could not load (' + E(e && e.message || e) + ').</p>'; });
    }

    function build(cls, myp, maths, level, B, people, results, items, lessonSet, quizSet, qcrit) {
      var name = {}; people.forEach(function (p) { name[p.id] = p; });
      var studs = people.slice().sort(function (a, b) { return (a.full_name || '').localeCompare(b.full_name || ''); });
      // tasks: one column per lesson or question set, in the order they were first done
      var tasks = {}, cell = {};
      results.forEach(function (r) {
        var k = r.quiz_id ? 'q:' + r.quiz_id : r.lesson_id ? 'l:' + r.lesson_id : 't:' + r.title; if (!name[r.student_id]) return;
        var set = r.quiz_id ? quizSet[r.quiz_id] : r.lesson_id ? lessonSet[r.lesson_id] : false;
        if (!ALL && !set) return;
        var t = tasks[k] || (tasks[k] = { k: k, title: shortTitle(r.title), kind: r.quiz_id ? 'Q' : 'L', first: r.recorded_at, max: Number(r.max_score) || 0 }); if (r.recorded_at < t.first) t.first = r.recorded_at;
        var sc = r.best_score != null ? Number(r.best_score) : Number(r.score), key = r.student_id + '|' + k, old = cell[key];
        if (!old || sc / (Number(r.max_score) || 1) > old.s / (old.m || 1)) cell[key] = { s: sc, m: Number(r.max_score) || 0 };
      });
      var cols = Object.keys(tasks).map(function (k) { return tasks[k]; }).sort(function (a, b) { return a.first < b.first ? -1 : 1; });
      // MYP criteria from every marked answer
      var CR = {}; if (myp) items.forEach(function (it) {
        if (!name[it.student_id] || (it.class_id && it.class_id !== cid)) return;
        var letters = '';
        if (it.kind === 'lesson') { var m = CRIT[it.ref] || {}, st = (String(it.q_ref || '').match(/^(?:q|step)(\d+)/) || [])[1]; letters = (st && m[st]) || m['*'] || ''; }
        else letters = qcrit[it.q_ref] || '';
        letters.split('').forEach(function (L) { var o = (CR[it.student_id] = CR[it.student_id] || {}); o[L] = o[L] || { g: 0, m: 0, n: 0 }; o[L].g += Number(it.got) || 0; o[L].m += Number(it.max) || 0; o[L].n++; });
      });
      function overall(sid) { var g = 0, m = 0; cols.forEach(function (t) { var c = cell[sid + '|' + t.k]; if (c) { g += c.s; m += c.m; } }); return pct(g, m); }
      function critRow(sid) { var o = CR[sid] || {}, t = TL[sid] || {}, lv = {}, tch = {}, sum = 0, all = true;
        'ABCD'.split('').forEach(function (L) { var c = o[L];
          if (t[L] && t[L].length) { lv[L] = Math.round(t[L].reduce(function (a, b) { return a + b; }, 0) / t[L].length); tch[L] = t[L].length; }   // the teacher's own judgements come first
          else lv[L] = c && c.m ? levelOf(pct(c.g, c.m), B.MYP) : null;
          if (lv[L] == null) all = false; else sum += lv[L]; });
        return { lv: lv, tch: tch, sum: sum, all: all, grade: all ? mypGrade(sum) : null }; }
      var CNAMES = maths ? CN_MATHS : CN;
      var scale = B.scale || (myp ? 'MYP' : level), SS = SC[scale];
      function gOf(v) { return scale === 'MYP' || !SS ? null : GB.grade(v, scale, B[scale]); }
      var tabs = [['tasks', '📋 Tasks']].concat(myp ? [['crit', '🎯 MYP criteria and grade']] : SS ? [['grade', '🎓 ' + SS.name]] : []).concat([['rep', '📄 Term reports']]);
      if (!tabs.some(function (t) { return t[0] === view; })) view = 'tasks';
      var tb = p.querySelector('#gbtabs'); tb.innerHTML = tabs.map(function (t) { return '<button type="button" data-v="' + t[0] + '" aria-pressed="' + (t[0] === view) + '">' + t[1] + '</button>'; }).join('');
      tb.querySelectorAll('button').forEach(function (b) { b.onclick = function () { view = b.getAttribute('data-v'); build(cls, myp, maths, level, B, people, results, items, lessonSet, quizSet, qcrit); }; });

      if (view === 'tasks') {
        body.innerHTML = cols.length ? '<p class="small muted">' + studs.length + ' students · ' + cols.length + ' tasks' + (from ? ' since ' + E(from) : '') + '. Each cell is the student\'s best percentage. L = interactive lesson, Q = question set or exam. Blank = not done yet.</p>' +
          '<div class="gb-wrap"><table class="gb"><thead><tr><th class="nm">Student</th>' + cols.map(function (t) { return '<th class="tk" title="' + E(t.title) + '">' + t.kind + ' · ' + E(t.title.slice(0, 48)) + '</th>'; }).join('') + '<th>Overall</th>' + (myp || !SS ? '' : '<th>Grade</th>') + '</tr></thead><tbody>' +
          studs.map(function (s) { var o = overall(s.id), g = myp ? null : gOf(o);
            return '<tr><td class="nm">' + E(s.full_name || s.email) + '</td>' + cols.map(function (t) { var c = cell[s.id + '|' + t.k], v = c ? pct(c.s, c.m) : null;
              return '<td>' + (v == null ? '' : '<span class="c ' + (myp ? 'l' + levelOf(v, B.MYP) : gcls(gOf(v))) + '" title="' + E(c.s + ' / ' + c.m) + '">' + Math.round(v) + '</span>') + '</td>'; }).join('') +
              '<td><b>' + (o == null ? '–' : Math.round(o) + '%') + '</b></td>' + (myp || !SS ? '' : '<td>' + (g ? '<span class="c fin ' + gcls(g) + '">' + E(g.t) + '</span>' : '–') + '</td>') + '</tr>'; }).join('') + '</tbody></table></div>'
          : '<p class="emptybox">No marked work yet' + (from ? ' since ' + E(from) : '') + (ALL ? '' : ' for tasks set to this class. Tick "Include work not set for this class" to see everything these students have done') + '.</p>';
      } else if (view === 'rep') {
        repView();
      } else if (view === 'crit') {
        body.innerHTML = '<p class="small">Each level 0–8 comes from every marked answer that assesses the criterion' + (from ? ' since ' + E(from) : ' this year') + ', using your <a href="#grading">MYP boundaries</a>. The four levels add up to 32 and give the <b>MYP grade 1–7</b> with the IB\'s boundaries (1–5 → 1, 6–9 → 2, 10–14 → 3, 15–18 → 4, 19–23 → 5, 24–27 → 6, 28–32 → 7). ' +
          '✎ = your own best-fit level from marking a test against the criteria (used instead of the level from marks). A grade appears only when all four criteria have evidence. These are suggested levels: use your professional judgement for the final best-fit level.</p>' +
          '<div class="gb-wrap"><table class="gb"><thead><tr><th class="nm">Student</th>' + 'ABCD'.split('').map(function (L) { return '<th title="' + E(CNAMES[L]) + '">' + L + '<br><span class="small muted" style="font-weight:400">' + E(CNAMES[L].split(' ')[0]) + '</span></th>'; }).join('') + '<th>Total /32</th><th>MYP grade</th><th class="small">Evidence (answers A·B·C·D)</th></tr></thead><tbody>' +
          studs.map(function (s) { var r = critRow(s.id), o = CR[s.id] || {};
            return '<tr><td class="nm">' + E(s.full_name || s.email) + '</td>' + 'ABCD'.split('').map(function (L) { var v = r.lv[L]; return '<td>' + (v == null ? '<span class="muted" title="No marked answers for this criterion yet">–</span>' : '<span class="c l' + v + '"' + (r.tch[L] ? ' title="Your best-fit level, from ' + r.tch[L] + ' marked test' + (r.tch[L] > 1 ? 's' : '') + '"' : ' title="Worked out from marks"') + '>' + v + (r.tch[L] ? '✎' : '') + '</span>') + '</td>'; }).join('') +
              '<td><b>' + (r.all ? r.sum : '–') + '</b></td><td>' + (r.grade ? '<span class="c fin g' + r.grade + '">' + r.grade + '</span>' : '<span class="small muted">needs ' + 'ABCD'.split('').filter(function (L) { return r.lv[L] == null; }).join(', ') + '</span>') + '</td>' +
              '<td class="small muted">' + 'ABCD'.split('').map(function (L) { return o[L] ? o[L].n : 0; }).join(' · ') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      } else {
        body.innerHTML = '<p class="small">Overall percentage across every task' + (from ? ' since ' + E(from) : '') + ', turned into a grade with this class\'s boundaries (' + B[scale].map(function (b, i) { return SS.grades[i] + ' from ' + b + '%'; }).join(', ') + '). Change them under 🎯 Grade boundaries above.</p>' +
          '<div class="gb-wrap"><table class="gb"><thead><tr><th class="nm">Student</th><th>Tasks done</th><th>Overall %</th><th>' + E(SS.name) + '</th></tr></thead><tbody>' +
          studs.map(function (s) { var o = overall(s.id), g = gOf(o), n = cols.filter(function (t) { return cell[s.id + '|' + t.k]; }).length;
            return '<tr><td class="nm">' + E(s.full_name || s.email) + '</td><td>' + n + ' / ' + cols.length + '</td><td><b>' + (o == null ? '–' : Math.round(o) + '%') + '</b></td><td>' + (g ? '<span class="c fin ' + gcls(g) + '">' + E(g.t) + '</span>' : '–') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }

      /* 📄 Term reports (migration 084): grade, criterion levels, attendance and tasks from this gradebook, with a comment drafted from the marks */
      function repView() {
        var mo = new Date().getMonth(), term0 = 'Term ' + (mo < 4 ? 1 : mo < 8 ? 2 : 3) + ' ' + new Date().getFullYear();
        body.innerHTML = '<p class="muted">Loading reports…</p>';
        Promise.all([db.from('class_sessions').select('id,held_on').eq('class_id', cid).then(function (r) { return r; }, function () { return {}; }),
          db.from('term_reports').select('student_id,term,data,comment,published,updated_at').eq('class_id', cid).then(function (r) { return r; }, function () { return { error: { message: 'missing' } }; }),
          window.BVREP ? Promise.resolve() : new Promise(function (ok, bad) { var x = document.createElement('script'); x.src = '/assets/reports.js?v=' + (window.BV_VER || '5'); x.onload = ok; x.onerror = bad; document.head.appendChild(x); })]).then(function (z) {
          var sess = ((z[0] && z[0].data) || []).filter(function (r) { return !from || r.held_on >= from; }), noTable = !!(z[1] && z[1].error), saved = ((z[1] && z[1].data) || []);
          var terms = []; saved.forEach(function (r) { if (terms.indexOf(r.term) < 0) terms.push(r.term); });
          var term = (function () { try { return sessionStorage.getItem('bv-gb-term-' + cid) || terms[0] || term0; } catch (e) { return terms[0] || term0; } })();
          var sids = sess.map(function (r) { return r.id; });
          return (sids.length ? inChunks(sids, 150, function (ch) { return db.from('attendance').select('session_id,student_id,status').in('session_id', ch); }) : Promise.resolve([])).then(function (att) {
            var A = {}; att.forEach(function (a) { var o = A[a.student_id] = A[a.student_id] || { p: 0, n: 0 }; o.n++; if (/present|late/i.test(a.status || '')) o.p++; });
            function first(s) { return String(s.full_name || 'This student').split(' ')[0]; }
            function info(s) {
              var o = overall(s.id), done = cols.filter(function (t) { return cell[s.id + '|' + t.k]; }), g = myp ? null : gOf(o), d = { scale: scale, pct: o == null ? null : Math.round(o), tasks: { done: done.length, of: cols.length }, from: from || '', class_name: cls.name, subject: cls.subject || '' };
              if (myp) { var r = critRow(s.id); d.crit = {}; 'ABCD'.split('').forEach(function (L) { d.crit[L] = { l: r.lv[L], n: CNAMES[L] }; }); d.critTotal = r.all ? r.sum : null; d.grade = r.grade || ''; d.gradeName = 'MYP grade (1–7)'; d._r = r; }
              else if (g) { d.grade = g.t; d.gradeName = SS.name; }
              var at = A[s.id]; if (at && at.n) d.att = { pct: Math.round(100 * at.p / at.n), present: at.p, of: at.n };
              d._done = done; return d;
            }
            function draft(s, d) {
              var F = first(s), ratio = d.tasks.of ? d.tasks.done / d.tasks.of : 0, eff = ratio >= 0.9 ? 'consistently' : ratio >= 0.6 ? 'steadily' : 'unevenly', out = [], strong = '', weak = '';
              out.push(F + ' has worked ' + eff + ' this term, completing ' + d.tasks.done + ' of ' + d.tasks.of + ' tasks' + (d.pct != null ? ' with an overall result of ' + d.pct + '%' : '') + (d.grade ? ' (' + d.gradeName.replace(/\s*\(1–7\)/, '') + ' ' + d.grade + ')' : '') + '.');
              if (d._r) { var ls = 'ABCD'.split('').filter(function (L) { return d._r.lv[L] != null; }).sort(function (a, b) { return d._r.lv[b] - d._r.lv[a]; }); if (ls.length) { strong = 'Criterion ' + ls[0] + ' (' + CNAMES[ls[0]].toLowerCase() + ')'; if (ls.length > 1) weak = 'criterion ' + ls[ls.length - 1] + ' (' + CNAMES[ls[ls.length - 1]].toLowerCase() + ')'; } }
              else { var ts = d._done.map(function (t) { var c = cell[s.id + '|' + t.k]; return { t: t.title, v: pct(c.s, c.m) }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return b.v - a.v; }); if (ts.length) { strong = '"' + ts[0].t + '"'; if (ts.length > 1 && ts[ts.length - 1].v < 60) weak = 'the ideas in "' + ts[ts.length - 1].t + '"'; } }
              if (strong) out.push(F + '\'s strongest work was in ' + strong + '.');
              var next = []; if (weak) next.push('revisit ' + weak); if (d.tasks.of && ratio < 0.9) next.push('complete every task set'); if (d.att && d.att.pct < 90) next.push('attend every lesson (attendance ' + d.att.pct + '%)');
              out.push(next.length ? 'To improve, ' + F + ' should ' + next.join(', and ') + '.' : 'Keep up this excellent work next term.');
              return out.join(' ');
            }
            var bySid = {}; saved.filter(function (r) { return r.term === term; }).forEach(function (r) { bySid[r.student_id] = r; });
            body.innerHTML = '<section class="panel tint"><div class="row2" style="align-items:end;flex-wrap:wrap;gap:10px"><label class="f" style="margin:0">Term<input id="rpterm" value="' + E(term) + '" list="rpterms" style="min-width:180px"><datalist id="rpterms">' + terms.map(function (t) { return '<option value="' + E(t) + '">'; }).join('') + '</datalist></label>' +
              '<span class="acts" style="margin:0"><button type="button" class="btn sm" id="rpsave"' + (noTable ? ' disabled' : '') + '>💾 Save drafts</button><button type="button" class="btn sm" id="rpprint">🖨 Print all</button><button type="button" class="btn main sm" id="rppub"' + (noTable ? ' disabled' : '') + '>📢 Publish to students and parents</button></span></div>' +
              '<p class="small" style="margin:8px 0 0">Grades, levels and tasks come from this gradebook' + (from ? ' since ' + E(from) : '') + ' (set the term start date above to match the term). Attendance comes from the class register. Each comment is a draft written from the marks: read and edit it before you publish. ' + (noTable ? '<b>Saving reports needs database update 084.</b>' : '') + '</p><p class="small" id="rpmsg" style="margin:4px 0 0"></p></section>' +
              studs.map(function (s) { var d = info(s), sv = bySid[s.id];
                return '<details class="panel" data-rs="' + E(s.id) + '"><summary><b>' + E(s.full_name || s.email) + '</b> · ' + (d.grade ? E(d.gradeName) + ' <b>' + E(d.grade) + '</b> · ' : '') + (d.pct != null ? d.pct + '% · ' : '') + d.tasks.done + '/' + d.tasks.of + ' tasks' + (d.att ? ' · attendance ' + d.att.pct + '%' : '') + (sv ? (sv.published ? ' · <span class="pill ok">published</span>' : ' · <span class="pill">draft saved</span>') : '') + '</summary>' +
                  '<label class="f">Teacher\'s comment<textarea data-cm rows="4" maxlength="3000">' + E(sv ? sv.comment || '' : draft(s, d)) + '</textarea></label><div class="acts"><button type="button" class="btn sm" data-redraft>↺ Draft again from the marks</button><button type="button" class="btn sm" data-prev>👁 Preview</button></div></details>'; }).join('');
            var termIn = body.querySelector('#rpterm'), msg = body.querySelector('#rpmsg');
            termIn.onchange = function () { try { sessionStorage.setItem('bv-gb-term-' + cid, termIn.value.trim()); } catch (e) {} repView(); };
            function repOf(s) { var d = info(s), box = body.querySelector('[data-rs="' + s.id + '"]'); var data = {}; Object.keys(d).forEach(function (k) { if (k.charAt(0) !== '_') data[k] = d[k]; }); data.student = s.full_name || ''; data.teacher = (ctx.ME.profile && ctx.ME.profile.full_name) || ''; return { class_id: cid, student_id: s.id, term: termIn.value.trim(), data: data, comment: box.querySelector('[data-cm]').value.trim(), teacher_id: ctx.ME.user.id, updated_at: new Date().toISOString() }; }
            body.querySelectorAll('[data-redraft]').forEach(function (b) { b.onclick = function () { var id = b.closest('[data-rs]').getAttribute('data-rs'), s = studs.filter(function (x) { return x.id === id; })[0]; b.closest('[data-rs]').querySelector('[data-cm]').value = draft(s, info(s)); }; });
            body.querySelectorAll('[data-prev]').forEach(function (b) { b.onclick = function () { var id = b.closest('[data-rs]').getAttribute('data-rs'), s = studs.filter(function (x) { return x.id === id; })[0]; BVREP.print([{ rep: repOf(s), head: { student_name: s.full_name, class_name: cls.name, teacher_name: (ctx.ME.profile && ctx.ME.profile.full_name) || '' } }], 'Preview'); }; });
            body.querySelector('#rpprint').onclick = function () { BVREP.print(studs.map(function (s) { return { rep: repOf(s), head: { student_name: s.full_name, class_name: cls.name, teacher_name: (ctx.ME.profile && ctx.ME.profile.full_name) || '' } }; }), cls.name + ' · ' + termIn.value); };
            function save(publish) {
              if (!termIn.value.trim()) { msg.textContent = 'Type the term name first.'; return; }
              if (publish && !confirm('Publish ' + studs.length + ' reports for ' + termIn.value.trim() + '? Students and their linked parents will be able to read them.')) return;
              msg.textContent = 'Saving…';
              db.from('term_reports').upsert(studs.map(function (s) { var r = repOf(s); r.published = !!publish || !!(bySid[s.id] && bySid[s.id].published); return r; }), { onConflict: 'class_id,student_id,term' }).then(function (x) {
                msg.textContent = x.error ? 'Could not save: ' + x.error.message : publish ? '✓ Published. Students see them on their dashboard and parents on the parent page.' : '✓ Drafts saved.';
                if (!x.error) setTimeout(repView, 900);
              });
            }
            body.querySelector('#rpsave').onclick = function () { save(false); };
            body.querySelector('#rppub').onclick = function () { save(true); };
          });
        }).catch(function (e) { body.innerHTML = '<p class="msg">' + E(e && e.message || e) + '</p>'; });
      }

      DATA = { csv: function () {
        var head = ['Student', 'Email', 'Student number'], rows;
        if (view === 'crit') { head = head.concat(['Criterion A', 'Criterion B', 'Criterion C', 'Criterion D', 'Total /32', 'MYP grade 1-7']);
          rows = studs.map(function (s) { var r = critRow(s.id); return [s.full_name, s.email, s.student_number].concat('ABCD'.split('').map(function (L) { return r.lv[L] == null ? '' : r.lv[L]; })).concat([r.all ? r.sum : '', r.grade || '']); }); }
        else if (view === 'grade') { head = head.concat(['Overall %', SS.name]); rows = studs.map(function (s) { var o = overall(s.id), g = gOf(o); return [s.full_name, s.email, s.student_number, o == null ? '' : Math.round(o), g ? g.t : '']; }); }
        else { head = head.concat(cols.map(function (t) { return t.title + ' (%)'; })).concat(['Overall %']); rows = studs.map(function (s) { var o = overall(s.id); return [s.full_name, s.email, s.student_number].concat(cols.map(function (t) { var c = cell[s.id + '|' + t.k]; return c ? Math.round(pct(c.s, c.m)) : ''; })).concat([o == null ? '' : Math.round(o)]); }); }
        csv([head].concat(rows), (cls.name || 'class').replace(/[^\w-]+/g, '_') + '_' + view + '_gradebook.csv');
      } };
    }
  };
})();
