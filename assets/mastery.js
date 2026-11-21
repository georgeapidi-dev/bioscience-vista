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
  function classOpts(C, pick) {   // the teacher's own classroom first, then the main-site course classes (as on /teach/ and /staff/)
    var live = C.filter(function (c) { return !c.archived_at; }), mine = live.filter(function (c) { return c.owner_kind !== 'main'; }), main = live.filter(function (c) { return c.owner_kind === 'main'; });
    var o = function (c) { return '<option value="' + E(c.id) + '"' + (c.id === pick ? ' selected' : '') + '>' + E(c.name) + '</option>'; };
    return (mine.length && main.length ? '<optgroup label="My classroom">' + mine.map(o).join('') + '</optgroup><optgroup label="Main site courses">' + main.map(o).join('') + '</optgroup>' : live.map(o).join(''));
  }
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


  function teacher(me) {
    app.innerHTML = hero('Mastery and student support', 'Who may need support and why, a heatmap of every student by topic, and the actions you take with their effect. Built only from marked work in this class.');
    Promise.all([S.db.from('classes').select('id,name,owner_kind,archived_at').eq('teacher_id', me.user.id).is('deleted_at', null).order('name'), S.db.from('class_teachers').select('class_id').eq('teacher_id', me.user.id)]).then(function (x) {
      var C = x[0].data || [], extra = (x[1].data || []).map(function (r) { return r.class_id; }).filter(function (id) { return !C.some(function (c) { return c.id === id; }); });
      return (extra.length ? S.db.from('classes').select('id,name,owner_kind,archived_at').in('id', extra) : Promise.resolve({ data: [] })).then(function (y) { C = C.concat(y.data || []);
        if (!C.length && me.admin) return S.db.from('classes').select('id,name,owner_kind,archived_at').is('deleted_at', null).order('name').limit(200).then(function (z) { return z.data || []; });
        return C; });
    }).then(function (C) {
      var first = C.filter(function (c) { return !c.archived_at && c.owner_kind !== 'main'; })[0] || C.filter(function (c) { return !c.archived_at; })[0] || C[0];
      var pick = new URLSearchParams(location.search).get('class') || (first && first.id);
      app.innerHTML = hero('Mastery and student support', 'Who may need support and why, a heatmap of every student by topic, and the support actions you take with their effect. Built only from marked work in this class.') +
        '<section class="ms-card"><label>Class <select id="ms-c">' + classOpts(C, pick) + '</select></label> <a class="btn sm" href="#student" id="ms-me">See my own mastery page</a></section><div id="ms-body"></div>';
      document.getElementById('ms-c').onchange = function () { history.replaceState(null, '', '?class=' + this.value); heat(this.value); };
      document.getElementById('ms-me').onclick = function () { setTimeout(function () { location.reload(); }, 50); };
      if (pick) heat(pick); else document.getElementById('ms-body').innerHTML = '<p class="ms-card">You have no classes yet.</p>';
    });
  }
  /* ---------- teacher: student support centre + class heatmap (Command Centre phase 6, 21 Nov 2026) ----------
     Four states for teachers: Strong understanding (Secure or Mastered), Developing, Needs support (Beginning), Insufficient evidence
     (fewer than 5 marks in that topic). The weighted score itself is unchanged. Every recommendation gives its reason; actions are
     recorded in public.interventions and their effect shown from marks gained after the action. */
  var TL = { strong: ['Strong understanding', '#BBF7D0', '#166534'], dev: ['Developing', '#FED7AA', '#9A3412'], need: ['Needs support', '#FECACA', '#991B1B'], none: ['Insufficient evidence', '#F1F5F9', '#64748B'] };
  function tstate(m) { if (!m || m.pct == null || m.marks < 5) return 'none'; return m.lv === 'master' || m.lv === 'secure' ? 'strong' : m.lv === 'dev' ? 'dev' : 'need'; }
  var ACTIONS = ['Assign additional practice', 'Recommend a lesson', 'Send individual feedback', 'Arrange a support session', 'Monitor progress'];
  function heat(cid) {
    var body = document.getElementById('ms-body'); body.innerHTML = '<p class="ms-muted">Loading…</p>';
    var q = function (p) { return p.then(function (r) { return r; }, function () { return { data: null }; }); };
    Promise.all([q(S.db.from('enrolments').select('student_id').eq('class_id', cid).eq('status', 'approved')),
      q(S.db.from('item_results').select('student_id,topic,topic_id,skill,got,max,at,misconceptions,title,q_label,objective').eq('class_id', cid).gte('at', new Date(Date.now() - 365 * DAY).toISOString()).limit(20000)),
      q(S.db.from('interventions').select('*').eq('class_id', cid).order('at', { ascending: false }).limit(200)),
      q(S.db.rpc('class_todo', { cls: cid })), q(S.db.from('assignments').select('id,title,due_at').eq('class_id', cid))]).then(function (x) {
      var ids = (x[0].data || []).map(function (r) { return r.student_id; }).filter(function (v, i, a) { return a.indexOf(v) === i; }), R = x[1].data || [], IV = x[2].data || [], TD = x[3].data || [], AS = x[4].data || [];
      if (!ids.length) { body.innerHTML = '<section class="ms-card"><p>No students in this class yet.</p></section>'; return; }
      var since14 = new Date(Date.now() - 14 * DAY).toISOString(), since30 = new Date(Date.now() - 30 * DAY).toISOString();
      return Promise.all([q(S.db.from('profiles').select('id,full_name').in('id', ids)), q(S.db.from('learning_progress').select('student_id,updated_at').in('student_id', ids).gte('updated_at', since14).limit(5000)),
        q(S.db.from('help_questions').select('student_id,created_at').in('student_id', ids).gte('created_at', since30).limit(2000))]).then(function (y) {
        var NM = {}; (y[0].data || []).forEach(function (r) { NM[r.id] = r.full_name || 'Student'; });
        var active = {}; (y[1].data || []).forEach(function (r) { active[r.student_id] = 1; });
        var asks = {}; (y[2].data || []).forEach(function (r) { asks[r.student_id] = (asks[r.student_id] || 0) + 1; });
        var due = {}, od = {}; AS.forEach(function (a) { due[a.id] = a; }); TD.forEach(function (t) { var a = due[t.assignment_id]; if (a && a.due_at && new Date(a.due_at) < Date.now() && t.state !== 'done') (od[t.student_id] = od[t.student_id] || []).push(a.title); });
        var topicsAll = aggregate(R, function (r) { return r.topic; }), tk = Object.keys(topicsAll).sort(function (a, b) { return topicsAll[a].pct - topicsAll[b].pct; }).slice(0, 18);
        var per = {}; ids.forEach(function (s) { per[s] = aggregate(R.filter(function (r) { return r.student_id === s; }), function (r) { return r.topic; }); });
        var tot = function (s, after) { var g = 0, m = 0; R.forEach(function (r) { if (r.student_id !== s || !(+r.max > 0) || r.got == null) return; if (after && r.at <= after) return; g += Math.min(+r.got, +r.max); m += +r.max; }); return { g: g, m: m, pct: m ? Math.round(100 * g / m) : null }; };
        var totBefore = function (s, at) { var g = 0, m = 0; R.forEach(function (r) { if (r.student_id !== s || !(+r.max > 0) || r.got == null || r.at > at) return; g += Math.min(+r.got, +r.max); m += +r.max; }); return { g: g, m: m, pct: m ? Math.round(100 * g / m) : null }; };
        // reasons, in plain words, from real records only
        var SUP = ids.map(function (s) { var why = [], weakest = null;
          Object.keys(per[s]).forEach(function (t) { var m = per[s][t]; if (m.marks >= 10 && m.pct < 50 && (!weakest || m.pct < weakest.pct)) weakest = { t: t, pct: m.pct, marks: m.marks, tid: m.tid }; });
          if (weakest) why.push(['topic', E(weakest.t) + ': ' + weakest.pct + ' % across ' + weakest.marks + ' marks']);
          var o = tot(s); if (o.m >= 10 && o.pct < 50) why.push(['overall', 'Overall ' + o.pct + ' % across ' + o.m + ' marked marks']);
          if ((od[s] || []).length >= 2) why.push(['work', od[s].length + ' overdue tasks not done']);
          if (!active[s]) why.push(['quiet', 'No lesson activity in the last 14 days']);
          if ((asks[s] || 0) >= 3) why.push(['help', 'Asked for help ' + asks[s] + ' times in 30 days']);
          return { s: s, why: why, weakest: weakest }; }).filter(function (r) { return r.why.length; }).sort(function (a, b) { return b.why.length - a.why.length; });
        var cell = function (s, t, m) { var st = tstate(m), l = TL[st]; return '<td class="ms-cl" data-s="' + E(s) + '" data-t="' + E(t) + '" style="background:' + l[1] + ';color:' + l[2] + '" title="' + (m ? (m.marks < 5 ? 'Insufficient evidence: ' + m.marks + ' marks' : l[0] + ': ' + m.pct + ' % from ' + m.marks + ' marks') : 'No answers yet') + '">' + (m && m.marks >= 5 ? m.pct : '·') + '</td>'; };
        var ivRow = function (iv) { var b = totBefore(iv.student_id, iv.at), a = tot(iv.student_id, iv.at), ch = a.m ? (b.pct != null ? a.pct - b.pct : null) : null;
          return '<tr><td><b>' + E(NM[iv.student_id] || (iv.student_id ? 'Student' : 'Whole class')) + '</b><div class="ms-muted">' + E(iv.title) + '</div></td><td>' + E(iv.action || '') + (iv.evidence ? '<div class="ms-muted">' + E(iv.evidence) + '</div>' : '') + '</td><td class="ms-muted">' + new Date(iv.at).toLocaleDateString() + '</td>' +
            '<td>' + (!iv.student_id ? '–' : a.m ? (ch != null ? '<b style="color:' + (ch >= 0 ? '#166534' : '#b91c1c') + '">' + (ch >= 0 ? '↑ +' + ch : '↓ ' + Math.abs(ch)) + ' points</b>' : '') + '<div class="ms-muted">' + a.pct + ' % from ' + a.m + ' new marks</div>' : '<span class="ms-muted">No new marks yet</span>') + '</td>' +
            '<td><select data-ivs="' + iv.id + '">' + ['planned', 'done', 'dropped'].map(function (v) { return '<option' + (iv.status === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select></td></tr>'; };
        var supRow = function (r) { return '<div class="sp-row"><div style="flex:1 1 min(100%,260px)"><b>' + E(NM[r.s]) + '</b><ul class="sp-why">' + r.why.map(function (w) { return '<li>' + w[1] + '</li>'; }).join('') + '</ul></div>' +
            '<div style="flex:1 1 min(100%,320px)"><div class="sp-acts">' + (r.weakest ? '<button class="btn sm" type="button" data-ev="' + E(r.s) + '" data-et="' + E(r.weakest.t) + '">🔍 Evidence</button>' : '') + '<a class="btn sm" href="/teach/#classes/' + cid + '/todo/new">📌 Assign practice</a><a class="btn sm" href="/messages/?to=' + E(r.s) + '">💬 Message</a><button class="btn sm" type="button" data-rec="' + E(r.s) + '" data-title="' + E(r.weakest ? r.weakest.t : r.why[0][1].replace(/<[^>]+>/g, '')) + '" data-evd="' + E(r.why.map(function (w) { return w[1].replace(/<[^>]+>/g, ''); }).join('; ')) + '">📝 Record an action</button></div><div data-recbox="' + E(r.s) + '"></div></div></div>'; };
        body.innerHTML = '<style>.ms-cl{cursor:pointer}.ms-cl:hover{outline:2px solid #0f1f3d;outline-offset:-2px}.ms-th{cursor:pointer;text-decoration:underline dotted}.sp-acts{display:flex;flex-wrap:wrap;gap:6px}.sp-hd{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}.sp-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #f1f5f9}.sp-row:first-of-type{border-top:0}.sp-why{margin:2px 0 0;padding-left:18px}.sp-why li{font-size:.88rem}.ms-tbl{width:100%;border-collapse:collapse;font-size:.88rem}.ms-tbl td,.ms-tbl th{padding:7px 8px;border-top:1px solid #f1f5f9;text-align:left;vertical-align:top}.ms-tbl th{background:#f8fafc;font-size:.74rem;text-transform:uppercase;color:#475569}.sp-form{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}.sp-form select,.sp-form input{padding:6px 8px;border-radius:8px;border:1px solid #cbd5e1;font:inherit}.sp-form input{flex:1 1 min(100%,200px);min-width:0}</style>' +
          '<section class="ms-card"><h3>🤝 Students who may benefit from support <span class="ms-muted" style="font-weight:600">(' + SUP.length + ' of ' + ids.length + ')</span></h3><p class="ms-muted" style="margin-top:0">Each reason comes from real records: a topic below 50 % across 10+ marks; overall below 50 % across 10+ marks; 2+ overdue tasks not done; no lesson activity in 14 days; 3+ help requests in 30 days. These are prompts for your judgement, not labels.</p>' +
          (SUP.length ? SUP.map(function (r, i) { return (i === 10 ? '<details><summary style="cursor:pointer;font-weight:700;margin:8px 0">Show ' + (SUP.length - 10) + ' more</summary>' : '') + supRow(r); }).join('') + (SUP.length > 10 ? '</details>' : '') : '<p>Nobody stands out on these rules right now. 🎉</p>') + '</section>' +
          '<section class="ms-card" id="ms-ev" hidden></section>' +
          '<section class="ms-card"><h3>Class mastery heatmap</h3><p class="ms-muted" style="margin-top:0">Rows are students, columns are topics (weakest first). Click a cell to see the evidence, or a topic to drill down. Recent answers count more. A grey dot means fewer than 5 marks: not enough evidence, which is not the same as low performance.</p>' +
          (R.length ? '<div style="overflow:auto"><table class="ms-heat"><tr><th>Student</th>' + tk.map(function (t) { return '<th class="ms-th" data-topic="' + E(t) + '" title="' + E(t) + '">' + E(t.length > 28 ? t.slice(0, 26) + '…' : t) + '</th>'; }).join('') + '</tr>' +
            '<tr><td><b>Class</b></td>' + tk.map(function (t) { var m = topicsAll[t], l = TL[tstate(m)]; return '<td style="background:' + l[1] + ';color:' + l[2] + ';font-weight:800">' + (m.marks >= 5 ? m.pct : '·') + '</td>'; }).join('') + '</tr>' +
            ids.slice().sort(function (a, b) { return (NM[a] || '').localeCompare(NM[b] || ''); }).map(function (s) { return '<tr><td>' + E(NM[s] || 'Student') + '</td>' + tk.map(function (t) { return cell(s, t, per[s][t]); }).join('') + '</tr>'; }).join('') + '</table></div>' +
            '<p class="ms-muted">' + ['strong', 'dev', 'need', 'none'].map(function (k) { var l = TL[k]; return '<span class="ms-pill" style="background:' + l[1] + ';color:' + l[2] + '">' + l[0] + '</span>'; }).join(' ') + '</p>' : '<p>No marked work in this class yet.</p>') + '</section>' +
          '<section class="ms-card"><h3>📝 Support actions and their effect</h3><p class="ms-muted" style="margin-top:0">"Effect" compares the student\'s marks after the action with their marks before it.</p>' + (IV.length ? '<div style="overflow:auto"><table class="ms-tbl"><tr><th>Who</th><th>Action</th><th>When</th><th>Effect</th><th>Status</th></tr>' + IV.map(ivRow).join('') + '</table></div>' : '<p class="ms-muted">No actions recorded yet. Use 📝 Record an action above.</p>') + '</section>';
        var ev = body.querySelector('#ms-ev');
        var showEv = function (s, t) {
          var rows = R.filter(function (r) { return r.student_id === s && r.topic === t; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }), m = per[s][t];
          ev.hidden = false; ev.innerHTML = '<div class="sp-hd"><h3 style="margin:0">🔍 ' + E(NM[s]) + ' · ' + E(t) + '</h3><button class="btn sm" type="button" id="evx">Close</button></div><p class="ms-muted">' + (m ? (m.marks < 5 ? 'Insufficient evidence: ' + m.marks + ' marks so far' : TL[tstate(m)][0] + ': ' + m.pct + ' % from ' + m.marks + ' marks') : 'No answers in this topic yet') + '</p>' +
            (rows.length ? '<div style="overflow:auto"><table class="ms-tbl"><tr><th>When</th><th>Question</th><th>Marks</th><th>What went wrong</th></tr>' + rows.slice(0, 30).map(function (r) { return '<tr><td class="ms-muted">' + new Date(r.at).toLocaleDateString() + '</td><td>' + E(r.title || '') + (r.q_label ? ' · ' + E(r.q_label) : '') + (r.objective ? '<div class="ms-muted">' + E(r.objective) + '</div>' : '') + '</td><td><b>' + E(r.got) + '</b>/' + E(r.max) + '</td><td class="ms-muted">' + E((Array.isArray(r.misconceptions) ? r.misconceptions : []).join('; ')) + '</td></tr>'; }).join('') + '</table></div>' : '') +
            '<div class="sp-acts" style="margin-top:8px"><a class="btn sm" href="/teach/#classes/' + cid + '/todo/new">📌 Assign practice</a><a class="btn sm" href="/messages/?to=' + E(s) + '">💬 Message</a><button class="btn sm" type="button" data-rec="' + E(s) + '" data-title="' + E(t) + '" data-evd="' + E(m ? m.pct + ' % from ' + m.marks + ' marks' : '') + '">📝 Record an action</button></div><div data-recbox="' + E(s) + '"></div>';
          ev.querySelector('#evx').onclick = function () { ev.hidden = true; }; wireRec(ev); ev.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        var showTopic = function (t) {
          var st = ids.map(function (s) { return { s: s, m: per[s][t] }; }).sort(function (a, b) { return ((a.m && a.m.marks >= 5) ? a.m.pct : 999) - ((b.m && b.m.marks >= 5) ? b.m.pct : 999); }), tid = (topicsAll[t] || {}).tid;
          var mis = {}; R.forEach(function (r) { if (r.topic === t) (Array.isArray(r.misconceptions) ? r.misconceptions : []).forEach(function (x) { if (x) mis[x] = (mis[x] || 0) + 1; }); });
          var qs = {}; R.forEach(function (r) { if (r.topic !== t || !(+r.max > 0)) return; var k = (r.title || '') + (r.q_label ? ' · ' + r.q_label : ''); var o = qs[k] = qs[k] || { g: 0, m: 0, n: 0 }; o.g += Math.min(+r.got, +r.max); o.m += +r.max; o.n++; });
          var qlist = Object.keys(qs).map(function (k) { return { k: k, pct: Math.round(100 * qs[k].g / qs[k].m), n: qs[k].n }; }).filter(function (o) { return o.n >= 3; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 6);
          ev.hidden = false; ev.innerHTML = '<div class="sp-hd"><h3 style="margin:0">📊 Topic: ' + E(t) + '</h3><button class="btn sm" type="button" id="evx">Close</button></div><p class="ms-muted">Class: ' + (topicsAll[t].marks >= 5 ? topicsAll[t].pct + ' % from ' + topicsAll[t].marks + ' marks' : 'not enough evidence yet') + '</p>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px"><div><b>Students, lowest first</b><ol class="sp-why">' + st.map(function (o) { return '<li><a href="#" data-ev="' + E(o.s) + '" data-et="' + E(t) + '">' + E(NM[o.s]) + '</a> <span class="ms-muted">' + (o.m && o.m.marks >= 5 ? o.m.pct + ' %' : 'not enough evidence') + '</span></li>'; }).join('') + '</ol></div>' +
            '<div><b>Hardest questions</b> <span class="ms-muted">(3+ answers)</span><ol class="sp-why">' + (qlist.map(function (o) { return '<li>' + E(o.k) + ' <span class="ms-muted">' + o.pct + ' % · ' + o.n + ' answers</span></li>'; }).join('') || '<li class="ms-muted">Not enough answers yet</li>') + '</ol>' +
            '<b>Common wrong ideas</b><ol class="sp-why">' + (Object.keys(mis).sort(function (a, b) { return mis[b] - mis[a]; }).slice(0, 5).map(function (k) { return '<li>' + E(k) + ' <span class="ms-muted">(' + mis[k] + ')</span></li>'; }).join('') || '<li class="ms-muted">None recorded</li>') + '</ol></div>' +
            '<div><b>Reteach or practise</b><div id="tles" class="ms-muted">Loading lessons…</div><p style="margin-top:8px"><a class="btn sm" href="/teach/#classes/' + cid + '/todo/new">📌 Assign to the class</a> <button class="btn sm" type="button" data-rec="" data-title="' + E(t) + '" data-evd="' + E('Class ' + topicsAll[t].pct + ' %') + '">📝 Record a class action</button></p><div data-recbox=""></div></div></div>';
          ev.querySelector('#evx').onclick = function () { ev.hidden = true; }; wireRec(ev); wireEv(ev); ev.scrollIntoView({ behavior: 'smooth', block: 'start' });
          (tid ? S.db.from('lessons').select('title,url').eq('topic_id', tid).eq('published', true).order('sort_order').limit(6) : Promise.resolve({ data: [] })).then(function (r) { var b2 = ev.querySelector('#tles'); if (b2) b2.innerHTML = (r.data || []).length ? '<ul class="sp-why">' + r.data.map(function (l) { return '<li><a href="' + E(l.url) + '" target="_blank" rel="noopener">' + E(l.title) + '</a></li>'; }).join('') + '</ul>' : 'No lessons linked to this topic.'; });
        };
        function wireEv(root) { root.querySelectorAll('[data-ev]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); showEv(b.getAttribute('data-ev'), b.getAttribute('data-et')); }; }); }
        function wireRec(root) { root.querySelectorAll('[data-rec]').forEach(function (b) { b.onclick = function () { var s = b.getAttribute('data-rec'), box = root.querySelector('[data-recbox="' + s + '"]'); if (!box) return;
          box.innerHTML = '<div class="sp-form"><select>' + ACTIONS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select><input placeholder="Note (optional), e.g. lunchtime session Tuesday"><button class="btn sm main" type="button">Save</button></div>';
          box.querySelector('button').onclick = function () { var act = box.querySelector('select').value + (box.querySelector('input').value.trim() ? ': ' + box.querySelector('input').value.trim() : '');
            S.db.from('interventions').insert({ class_id: cid, student_id: s || null, title: b.getAttribute('data-title') || 'Support', evidence: b.getAttribute('data-evd') || null, action: act }).then(function (r) { if (r.error) { box.innerHTML = '<p class="ms-muted">' + E(S.nice(r.error)) + '</p>'; return; } heat(cid); }); }; }; }); }
        body.querySelectorAll('.ms-cl').forEach(function (td) { td.onclick = function () { showEv(td.getAttribute('data-s'), td.getAttribute('data-t')); }; });
        body.querySelectorAll('[data-topic]').forEach(function (th) { th.onclick = function () { showTopic(th.getAttribute('data-topic')); }; });
        body.querySelectorAll('[data-ivs]').forEach(function (sel) { sel.onchange = function () { S.db.from('interventions').update({ status: sel.value }).eq('id', sel.getAttribute('data-ivs')).then(function () {}); }; });
        wireEv(body); wireRec(body);
      });
    });
  }
})();
