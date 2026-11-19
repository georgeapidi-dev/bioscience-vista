/* Mastery · BioscienceVista · by BioscienceVista (phase 6)
   Students: how secure each topic and skill is, from every marked answer (lessons and assessments: item_results), with
   recent work counting more; which topics are due for spaced review; recurring mistakes; one click to a practice set
   aimed at weak questions (practice_make). Teachers: a class heatmap of students × topics, skills and common mistakes.
   Only real marked work is used. Levels are guidance for learning, not grades. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var LV = [['none', 'Not started', '#E2E8F0', '#475569'], ['begin', 'Beginning', '#FECACA', '#991B1B'], ['dev', 'Developing', '#FED7AA', '#9A3412'], ['secure', 'Secure', '#BBF7D0', '#166534'], ['master', 'Mastered', '#A7F3D0', '#065F46']];
  var GAP = { begin: 3, dev: 7, secure: 14, master: 30 };   // days before a topic is due for review again
  var DAY = 864e5;
  var CSS = '.ms-hero{margin:8px 0 16px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#16A34A,#0D9488 45%,#0284C7)}.ms-hero h1{margin:4px 0 6px;color:#fff}.ms-hero p{margin:0;color:#fff;max-width:72ch}.ms-hero .vx-eye{color:#FEF3C7}' +
    '.ms-card{background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:16px;margin:0 0 14px}.ms-card h3{margin:0 0 10px}.ms-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.ms-sum div{border-radius:14px;padding:12px;text-align:center;font-weight:700}.ms-sum b{display:block;font-size:1.8rem}' +
    '.ms-due{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.ms-due>div{border:2px solid #FDE68A;background:#FFFBEB;border-radius:14px;padding:12px;display:grid;gap:6px}' +
    '.ms-row{display:grid;grid-template-columns:minmax(160px,1.4fr) 2fr auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9}.ms-bar{height:12px;border-radius:99px;background:#F1F5F9;overflow:hidden}.ms-bar i{display:block;height:100%;border-radius:99px}' +
    '.ms-pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.78rem;font-weight:700}.ms-muted{color:#64748b;font-size:.88rem}.ms-mis li{margin:0 0 8px}' +
    '.ms-heat{border-collapse:collapse;font-size:.82rem}.ms-heat th,.ms-heat td{border:1px solid #fff;padding:5px 6px;text-align:center;min-width:46px}.ms-heat th{background:#F8FAFC;font-weight:700;max-width:120px;vertical-align:bottom}.ms-heat td:first-child,.ms-heat th:first-child{text-align:left;min-width:150px;background:#F8FAFC}';
  function css() { if (!document.getElementById('ms-css')) { var s = document.createElement('style'); s.id = 'ms-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function hero(h, p) { return '<section class="ms-hero"><p class="vx-eye">Assessment for mastery</p><h1>' + E(h) + '</h1><p>' + E(p) + '</p></section>'; }

  /* weighted score: recent answers count more (half weight after 45 days) */
  function aggregate(rows, keyOf) {
    var M = {}, now = Date.now();
    rows.forEach(function (r) { var k = keyOf(r); if (!k || !(+r.max > 0) || r.got == null) return; var w = Math.pow(0.5, (now - new Date(r.at).getTime()) / (45 * DAY)), m = M[k] || (M[k] = { k: k, g: 0, m: 0, n: 0, marks: 0, last: 0, tid: null, mis: [] });
      m.g += w * Math.min(+r.got, +r.max) / +r.max; m.m += w; m.n++; m.marks += +r.max; m.last = Math.max(m.last, new Date(r.at).getTime()); if (r.topic_id) m.tid = r.topic_id;
      (Array.isArray(r.misconceptions) ? r.misconceptions : []).forEach(function (x) { if (typeof x === 'string' && x.trim()) m.mis.push(x.trim()); }); });
    Object.keys(M).forEach(function (k) { var m = M[k]; m.pct = m.m ? Math.round(m.g / m.m * 100) : null; m.lv = level(m); m.due = m.last + (GAP[m.lv] || 7) * DAY; });
    return M;
  }
  function level(m) { if (!m || m.pct == null) return 'none'; if (m.pct >= 85 && m.marks >= 10) return 'master'; if (m.pct >= 70) return 'secure'; if (m.pct >= 40) return 'dev'; return 'begin'; }
  function L(k) { return LV.filter(function (x) { return x[0] === k; })[0] || LV[0]; }
  function pill(k) { var l = L(k); return '<span class="ms-pill" style="background:' + l[2] + ';color:' + l[3] + '">' + l[1] + '</span>'; }
  function ago(t) { var d = Math.round((Date.now() - t) / DAY); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; }

  S.guard(app, { anyone: true, allowPending: true, school: true }).then(function (me) {
    css(); var staff = me.staff || me.school || me.admin;
    if (staff && !/student/.test(location.hash)) teacher(me); else student(me);
  }, function () {});

  /* ---------- student ---------- */
  function student(me) {
    app.innerHTML = hero('My mastery', 'Loading your marked work…');
    Promise.all([S.db.from('item_results').select('topic,topic_id,skill,got,max,at,misconceptions').eq('student_id', me.user.id).gte('at', new Date(Date.now() - 365 * DAY).toISOString()).limit(5000),
      S.db.rpc('practice_topics')]).then(function (x) {
      var R = x[0].data || [], PT = x[1].data || [], T = aggregate(R, function (r) { return r.topic; }), SK = aggregate(R, function (r) { return r.skill; });
      var byName = {}, byId = {}; PT.forEach(function (p) { byName[(p.topic || '').toLowerCase()] = p; byId[p.topic_id] = p; });
      function practiceId(m) { var p = (m.tid && byId[m.tid]) || byName[(m.k || '').toLowerCase()]; return p ? p.topic_id : null; }
      var topics = Object.keys(T).map(function (k) { return T[k]; }).sort(function (a, b) { return (a.pct || 0) - (b.pct || 0); });
      var due = topics.filter(function (m) { return m.due <= Date.now() && m.lv !== 'none'; }).sort(function (a, b) { return a.due - b.due; });
      var notStarted = PT.filter(function (p) { return !T[p.topic] && !topics.some(function (m) { return m.tid === p.topic_id; }); });
      var count = function (k) { return topics.filter(function (m) { return m.lv === k; }).length; };
      var mis = []; topics.forEach(function (m) { m.mis.slice(-3).forEach(function (t) { mis.push([m.k, t]); }); });
      if (!R.length) { app.innerHTML = hero('My mastery', 'See how secure you are in every topic.') + '<section class="ms-card"><p>No marked work yet. When you complete lessons and assessments, your mastery of each topic and skill appears here.</p><p><a class="btn sm main" href="/practice/">🎯 Start practising</a> <a class="btn sm" href="/learn/">📚 Open a lesson</a></p></section>'; return; }
      app.innerHTML = hero('My mastery', 'Built from ' + R.length + ' marked answers in your lessons and assessments. Recent work counts more. Practise what is due for review, and your mastery grows.') +
        '<section class="ms-card"><div class="ms-sum">' + ['begin', 'dev', 'secure', 'master'].map(function (k) { var l = L(k); return '<div style="background:' + l[2] + ';color:' + l[3] + '"><b>' + count(k) + '</b>' + l[1] + '</div>'; }).join('') + '<div style="background:#FEF3C7;color:#92400E"><b>' + due.length + '</b>Due for review</div></div>' +
        '<p class="ms-muted" style="margin:10px 0 0">Beginning: under 40 % · Developing: 40–69 % · Secure: 70–84 % · Mastered: 85 % or more over at least 10 marks. Reviews are spaced out: 3 days for Beginning, 7 for Developing, 14 for Secure, 30 for Mastered.</p></section>' +
        (due.length ? '<section class="ms-card"><h3>🔁 Due for review</h3><div class="ms-due">' + due.slice(0, 9).map(function (m) { var pid = practiceId(m);
          return '<div><b>' + E(m.k) + '</b><span>' + pill(m.lv) + ' <span class="ms-muted">' + m.pct + ' % · last practised ' + ago(m.last) + '</span></span>' + (pid ? '<button class="btn sm main" data-prac="' + pid + '">🎯 Practise 10 questions</button>' : '<a class="btn sm" href="/tutor/?mode=test&topic=' + encodeURIComponent(m.k) + '">🤖 Quiz me with the AI tutor</a>') + '</div>'; }).join('') + '</div></section>' : '<section class="ms-card"><h3>🔁 Due for review</h3><p>Nothing is due right now. Well done.</p></section>') +
        '<section class="ms-card"><h3>📚 Topics</h3>' + topics.map(function (m) { var l = L(m.lv), pid = practiceId(m);
          return '<div class="ms-row"><div><b>' + E(m.k) + '</b><br><span class="ms-muted">' + m.n + ' answers · ' + ago(m.last) + '</span></div><div><div class="ms-bar" role="img" aria-label="' + m.pct + ' percent"><i style="width:' + m.pct + '%;background:' + l[3] + '"></i></div><span class="ms-muted">' + m.pct + ' %</span> ' + pill(m.lv) + '</div>' +
            '<div>' + (pid ? '<button class="btn sm" data-prac="' + pid + '">🎯 Practise</button>' : '') + '</div></div>'; }).join('') +
        (notStarted.length ? '<details style="margin-top:10px"><summary class="ms-muted">Topics you can practise but have not started (' + notStarted.length + ')</summary><p>' + notStarted.slice(0, 40).map(function (p) { return '<button class="btn sm" data-prac="' + p.topic_id + '" style="margin:3px">' + E(p.topic) + '</button>'; }).join('') + '</p></details>' : '') + '</section>' +
        (Object.keys(SK).length ? '<section class="ms-card"><h3>🧠 Skills</h3>' + Object.keys(SK).map(function (k) { return SK[k]; }).sort(function (a, b) { return a.pct - b.pct; }).map(function (m) { var l = L(m.lv);
          return '<div class="ms-row"><div><b>' + E(m.k.charAt(0).toUpperCase() + m.k.slice(1)) + '</b><br><span class="ms-muted">' + m.n + ' answers</span></div><div><div class="ms-bar"><i style="width:' + m.pct + '%;background:' + l[3] + '"></i></div><span class="ms-muted">' + m.pct + ' %</span> ' + pill(m.lv) + '</div><div><a class="btn sm" href="/tutor/?mode=guide&topic=' + encodeURIComponent('Improving my ' + m.k + ' answers in science') + '">🤖 Help</a></div></div>'; }).join('') + '</section>' : '') +
        (mis.length ? '<section class="ms-card"><h3>🩹 Mistakes to fix</h3><p class="ms-muted">From the feedback on your marked answers.</p><ul class="ms-mis">' + mis.slice(-10).reverse().map(function (x) { return '<li><b>' + E(x[0]) + ':</b> ' + E(x[1]) + ' <a href="/tutor/?mode=mistake&topic=' + encodeURIComponent(x[0]) + '">explain it to me</a></li>'; }).join('') + '</ul></section>' : '') +
        '<p id="ms-msg" class="ms-muted" role="status"></p>';
      [].forEach.call(app.querySelectorAll('[data-prac]'), function (b) { b.onclick = function () { b.disabled = true; b.textContent = 'Making your set…';
        S.db.rpc('practice_make', { topic_ids: [b.getAttribute('data-prac')], n: 10, kinds: null, set_title: null, crit: '', diff: null }).then(function (r) {
          if (r.error) { b.disabled = false; b.textContent = '🎯 Practise'; document.getElementById('ms-msg').textContent = S.nice(r.error); return; } location.href = '/quizzes/#' + r.data; }); }; });
    });
  }

  /* ---------- teacher: class heatmap ---------- */
  function teacher(me) {
    app.innerHTML = hero('Class mastery', 'Loading your classes…');
    Promise.all([S.db.from('classes').select('id,name').eq('teacher_id', me.user.id).is('deleted_at', null).order('name'), S.db.from('class_teachers').select('class_id').eq('teacher_id', me.user.id)]).then(function (x) {
      var C = x[0].data || [], extra = (x[1].data || []).map(function (r) { return r.class_id; }).filter(function (id) { return !C.some(function (c) { return c.id === id; }); });
      return (extra.length ? S.db.from('classes').select('id,name').in('id', extra) : Promise.resolve({ data: [] })).then(function (y) { C = C.concat(y.data || []);
        if (!C.length && me.admin) return S.db.from('classes').select('id,name').is('deleted_at', null).order('name').limit(200).then(function (z) { return z.data || []; });
        return C; });
    }).then(function (C) {
      var pick = new URLSearchParams(location.search).get('class') || (C[0] && C[0].id);
      app.innerHTML = hero('Class mastery', 'Each cell is a student\'s weighted score in a topic from their marked lessons and assessments (recent work counts more). Use it to plan reteaching and target practice.') +
        '<section class="ms-card"><label>Class <select id="ms-c">' + C.map(function (c) { return '<option value="' + c.id + '"' + (c.id === pick ? ' selected' : '') + '>' + E(c.name) + '</option>'; }).join('') + '</select></label> <a class="btn sm" href="#student" id="ms-me">See my own mastery page</a></section><div id="ms-body"></div>';
      document.getElementById('ms-c').onchange = function () { history.replaceState(null, '', '?class=' + this.value); heat(this.value); };
      document.getElementById('ms-me').onclick = function () { setTimeout(function () { location.reload(); }, 50); };
      if (pick) heat(pick); else document.getElementById('ms-body').innerHTML = '<p class="ms-card">You have no classes yet.</p>';
    });
  }
  function heat(cid) {
    var body = document.getElementById('ms-body'); body.innerHTML = '<p class="ms-muted">Loading…</p>';
    Promise.all([S.db.from('enrolments').select('student_id').eq('class_id', cid).eq('status', 'approved'), S.db.from('item_results').select('student_id,topic,skill,got,max,at,misconceptions').eq('class_id', cid).gte('at', new Date(Date.now() - 365 * DAY).toISOString()).limit(20000)]).then(function (x) {
      var ids = (x[0].data || []).map(function (r) { return r.student_id; }), R = x[1].data || [];
      return (ids.length ? S.db.from('profiles').select('id,full_name').in('id', ids) : Promise.resolve({ data: [] })).then(function (p) {
        var NM = {}; (p.data || []).forEach(function (r) { NM[r.id] = r.full_name || 'Student'; });
        var topicsAll = aggregate(R, function (r) { return r.topic; }), tk = Object.keys(topicsAll).sort(function (a, b) { return topicsAll[a].pct - topicsAll[b].pct; }).slice(0, 18);
        var per = {}; ids.forEach(function (s) { per[s] = aggregate(R.filter(function (r) { return r.student_id === s; }), function (r) { return r.topic; }); });
        var skills = aggregate(R, function (r) { return r.skill; }), mis = {}; R.forEach(function (r) { (Array.isArray(r.misconceptions) ? r.misconceptions : []).forEach(function (t) { if (typeof t === 'string') { var k = r.topic + '||' + t; mis[k] = (mis[k] || 0) + 1; } }); });
        var topMis = Object.keys(mis).sort(function (a, b) { return mis[b] - mis[a]; }).slice(0, 8);
        if (!R.length) { body.innerHTML = '<section class="ms-card"><p>No marked work in this class yet.</p></section>'; return; }
        var cell = function (m) { if (!m) return '<td style="background:#F8FAFC;color:#94a3b8">–</td>'; var l = L(m.lv); return '<td style="background:' + l[2] + ';color:' + l[3] + '" title="' + m.n + ' answers">' + m.pct + '</td>'; };
        body.innerHTML = '<section class="ms-card"><h3>Topics (weakest first)</h3><div style="overflow:auto"><table class="ms-heat"><tr><th>Student</th>' + tk.map(function (t) { return '<th title="' + E(t) + '">' + E(t.length > 28 ? t.slice(0, 26) + '…' : t) + '</th>'; }).join('') + '</tr>' +
          '<tr><td><b>Class</b></td>' + tk.map(function (t) { return cell(topicsAll[t]); }).join('') + '</tr>' +
          ids.slice().sort(function (a, b) { return (NM[a] || '').localeCompare(NM[b] || ''); }).map(function (s) { return '<tr><td>' + E(NM[s] || 'Student') + '</td>' + tk.map(function (t) { return cell(per[s][t]); }).join('') + '</tr>'; }).join('') + '</table></div>' +
          '<p class="ms-muted">' + LV.slice(1).map(function (l) { return '<span class="ms-pill" style="background:' + l[2] + ';color:' + l[3] + '">' + l[1] + '</span>'; }).join(' ') + ' · numbers are percentages; hover for the number of answers.</p></section>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px"><section class="ms-card"><h3>Skills</h3>' + Object.keys(skills).map(function (k) { return skills[k]; }).sort(function (a, b) { return a.pct - b.pct; }).map(function (m) { var l = L(m.lv); return '<div class="ms-row" style="grid-template-columns:1fr 1.4fr"><b>' + E(m.k) + '</b><div><div class="ms-bar"><i style="width:' + m.pct + '%;background:' + l[3] + '"></i></div><span class="ms-muted">' + m.pct + ' % · ' + m.n + ' answers</span></div></div>'; }).join('') + '</section>' +
          '<section class="ms-card"><h3>Most common mistakes</h3>' + (topMis.length ? '<ol class="ms-mis">' + topMis.map(function (k) { var p = k.split('||'); return '<li><b>' + E(p[0]) + '</b> (' + mis[k] + '×): ' + E(p[1]) + '</li>'; }).join('') + '</ol>' : '<p class="ms-muted">None recorded.</p>') + '</section></div>';
      });
    });
  }
})();
