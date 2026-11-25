/* VistaEd · personal learning dashboard and teacher class insights (phase 3, 18 Nov 2026).
   Student (/dashboard/): profile and preferences (learner_preferences, migration 062), personal goals, topic mastery and
   weak areas (item_results), recommendations, recent lessons (learning_progress), assessment history (quiz_attempts),
   research and personal projects, and achievements. Every number comes from the learner's own records; nothing is invented.
   Teacher (/teach/): one card per class with active students this week, lessons completed, weakest topics, common wrong
   answers, students who may need support, and research supervision. Sits above the existing dashboards, which are unchanged. */
(function () {
  'use strict';
  var root = document.getElementById('lx'); if (!root) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PROG = [['ib_myp', 'IB Middle Years (MYP)'], ['ib_dp', 'IB Diploma (DP)'], ['cambridge_ks3', 'Cambridge Lower Secondary (Stages 6–9)'], ['igcse', 'Cambridge IGCSE'], ['a_level', 'AS and A Level'], ['other', 'Other']];
  var YEARS = { ib_myp: ['MYP 1', 'MYP 2', 'MYP 3', 'MYP 4', 'MYP 5'], ib_dp: ['DP1', 'DP2'], cambridge_ks3: ['Stage 6', 'Stage 7', 'Stage 8', 'Stage 9'], igcse: ['Year 10', 'Year 11'], a_level: ['AS', 'A2'], other: ['Other'] };
  var SUBJ = ['Biology', 'Chemistry', 'Physics', 'Environmental systems and societies', 'Mathematics', 'Integrated science'];
  var INTEREST = [['cells', 'Cells'], ['molecular', 'Enzymes and molecules'], ['genetics', 'Genetics'], ['evolution', 'Evolution'], ['ecology', 'Ecology'], ['physiology', 'The human body'], ['plants', 'Plants'], ['biotech', 'Biotechnology'], ['reactions', 'Chemical reactions'], ['acids', 'Acids and bases'], ['organic', 'Organic chemistry'], ['ess-climate', 'Climate change'], ['ess-biodiversity', 'Conservation'], ['phys-motion', 'Forces and motion'], ['phys-electric', 'Electricity'], ['math-stats', 'Statistics'], ['math-algebra', 'Algebra'], ['general-investigation', 'Experiments and data'], ['general-eng', 'Engineering']];
  var APPROACH = [['visual', 'Diagrams and videos'], ['hands_on', 'Experiments and simulations'], ['reading', 'Reading and notes'], ['practice', 'Practice questions'], ['discussion', 'Talking it through']];
  var ACCENTS = ['#0284C7', '#0D9488', '#16A34A', '#7C3AED', '#DB2777', '#EA580C'];
  var tries = 0, t = setInterval(function () {
    var S = window.BVS; if (++tries > 80) clearInterval(t); if (!S || !S.db || !S.me) return; clearInterval(t);
    S.me().then(function (me) { if (!me || me.parent) return; var staff = me.staff || me.school || (me.roles || []).indexOf('teacher') >= 0;
      if (root.dataset.mode === 'teach') { if (staff) whenSeen(function () { teacher(S, me); }); } else if (!staff) { if (/^\/dashboard\/?$/.test(location.pathname)) gate(S, me); else student(S, me); } }, function () {});
  }, 200);

  /* Class insights on the teacher home page load when they come into view (23 Nov 2026): Home opens without waiting for them */
  function whenSeen(go) {
    var done = false, run = function () { if (!done) { done = true; go(); } };
    if (!('IntersectionObserver' in window)) return run();
    var w = setInterval(function () {   // the home page moves this panel into place once it has drawn
      if (!root.closest('.cc-body') || root.style.display === 'none') return;   // waits until Home shows it (not on other tabs, or hidden by the teacher)
      clearInterval(w);
      root.hidden = false; if (!root.innerHTML.trim()) root.innerHTML = '<p class="muted" style="padding:12px 0">Class insights…</p>';
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); run(); } }, { rootMargin: '300px 0px' }); io.observe(root);
    }, 250);
  }
  function gate(S, me) {   /* one click opens "My learning journey" on the dashboard (23 Nov 2026), so the dashboard itself loads fast */
    if (!root.closest('#db-wrap')) { var n = 0, w = setInterval(function () { if (root.closest('#db-wrap')) { clearInterval(w); gate(S, me); } else if (++n > 300) clearInterval(w); }, 200); return; }   // wait until the dashboard has placed it, so it never shows first
    root.hidden = false; root.innerHTML = '<button type="button" class="db-open" aria-expanded="false"><span>🚀 My learning journey: goals, mastery and achievements</span><b>Open ▸</b></button>';
    root.querySelector('.db-open').onclick = function () { root.innerHTML = '<p class="muted">Loading…</p>'; student(S, me); };
  }
  /* =================== student =================== */
  function student(S, me) {
    var uid = me.user.id, name = ((me.profile && me.profile.full_name) || '').split(' ')[0];
    var q = function (p) { return p.then(function (r) { return r; }, function () { return { data: null, error: true }; }); };
    Promise.all([
      q(S.db.from('learner_preferences').select('*').eq('user_id', uid).maybeSingle()),
      q(S.db.from('learning_progress').select('lesson_id,status,percent,updated_at').eq('student_id', uid).order('updated_at', { ascending: false }).limit(300)),
      q(S.db.from('item_results').select('topic,got,max,misconceptions,at').eq('student_id', uid).limit(3000)),
      q(S.db.from('quiz_attempts').select('quiz_id,score,max_score,submitted_at,status').eq('student_id', uid).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(50)),
      q(S.db.from('sim_attempts').select('sim_title,score,max_score,updated_at').eq('student_id', uid).order('updated_at', { ascending: false }).limit(50)),
      q(S.db.from('research_projects').select('id,kind,title,stage,status,updated_at').eq('student_id', uid).neq('status', 'archived')),
      q(S.db.from('pp_projects').select('id,title,stage,status').eq('student_id', uid).neq('status', 'archived'))
    ]).then(function (R) {
      var prefsMissing = R[0].error, P = R[0].data || null, LP = R[1].data || [], IR = R[2].data || [], QA = R[3].data || [], SA = R[4].data || [], RP = R[5].data || [], PP = R[6].data || [];
      var lids = LP.slice(0, 40).map(function (x) { return x.lesson_id; }), qids = QA.slice(0, 8).map(function (x) { return x.quiz_id; });
      Promise.all([lids.length ? q(S.db.from('lessons').select('id,title,url').in('id', lids)) : { data: [] }, qids.length ? q(S.db.from('quizzes').select('id,title').in('id', qids)) : { data: [] }]).then(function (X) {
        var LS = {}, QZ = {}; (X[0].data || []).forEach(function (l) { LS[l.id] = l; }); (X[1].data || []).forEach(function (z) { QZ[z.id] = z.title; });
        render({ S: S, uid: uid, name: name, P: P, prefsMissing: prefsMissing, LP: LP, IR: IR, QA: QA, SA: SA, RP: RP, PP: PP, LS: LS, QZ: QZ });
      });
    });
  }
  function mastery(IR) {
    var by = {};
    IR.forEach(function (r) { if (!r.topic || !(r.max > 0)) return; var k = String(r.topic).replace(/^(Biology|Chemistry|Physics) · /, ''); var o = by[k] = by[k] || { topic: k, got: 0, max: 0, n: 0, mis: {} }; o.got += +r.got || 0; o.max += +r.max; o.n++; (r.misconceptions || []).forEach(function (m) { if (m) o.mis[m] = (o.mis[m] || 0) + 1; }); });
    return Object.keys(by).map(function (k) { var o = by[k]; o.pct = Math.round(o.got / o.max * 100); return o; }).filter(function (o) { return o.max >= 3; }).sort(function (a, b) { return b.max - a.max; });
  }
  function render(D) {
    var P = D.P || {}, accent = P.accent || '#0284C7', M = mastery(D.IR);
    var done = D.LP.filter(function (p) { return p.status === 'completed' || p.percent >= 100; });
    var open = D.LP.filter(function (p) { return !(p.status === 'completed' || p.percent >= 100) && D.LS[p.lesson_id]; });
    var weak = M.filter(function (o) { return o.pct < 60 && o.max >= 5; }).sort(function (a, b) { return a.pct - b.pct; }).slice(0, 4);
    var strong = M.filter(function (o) { return o.pct >= 80 && o.max >= 5; }).sort(function (a, b) { return b.pct - a.pct; }).slice(0, 3);
    var progName = (PROG.filter(function (x) { return x[0] === P.programme; })[0] || [])[1];
    // achievements: computed from the records above, never stored or invented
    var A = [[done.length >= 1, '🌱', 'First lesson completed'], [done.length >= 10, '📗', '10 lessons completed'], [done.length >= 50, '📚', '50 lessons completed'], [D.SA.length >= 1, '🔬', 'First lab investigation'], [D.SA.length >= 5, '🧪', '5 lab investigations'],
      [D.QA.length >= 1, '📝', 'First assessment submitted'], [D.QA.length >= 10, '🏅', '10 assessments submitted'], [strong.length >= 1, '⭐', 'A topic at 80 % or more'], [D.RP.length + D.PP.length >= 1, '🧭', 'Research or personal project started'], [(P.goals || []).some(function (g) { return g.done; }), '🎯', 'A personal goal achieved']];
    var earned = A.filter(function (a) { return a[0]; });
    root.style.setProperty('--lx', accent);
    root.innerHTML = '<style>#lx{--lx:#0F766E;margin:8px 0 22px}#lx .lx-top{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;padding:22px;border-radius:22px;color:#fff;background:radial-gradient(420px 220px at 95% 0%,rgba(250,204,21,.55),transparent 70%),radial-gradient(420px 220px at 0% 100%,rgba(236,72,153,.4),transparent 70%),var(--lx)}#lx .lx-top h2{margin:0;font:700 1.7rem/1.15 var(--vx-font-head);color:#fff}#lx .lx-top p{margin:4px 0 0;color:rgba(255,255,255,.9)}#lx .chip{display:inline-block;font-size:.8rem;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.18);margin:6px 6px 0 0}' +
      '#lx .lx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:14px}#lx .lx-c{background:var(--vx-card);border:1px solid var(--vx-line);border-radius:16px;padding:18px;box-shadow:var(--vx-shadow)}#lx .lx-c h3{margin:0 0 10px;font:700 1.08rem/1.2 var(--vx-font-head);display:flex;gap:8px;align-items:center}#lx .bar{height:8px;border-radius:99px;background:var(--vx-line);overflow:hidden;margin:4px 0 10px}#lx .bar i{display:block;height:100%;border-radius:99px}' +
      '#lx ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}#lx li{font-size:.94rem}#lx .muted{color:var(--vx-text-2);font-size:.88rem}#lx .badges{display:flex;flex-wrap:wrap;gap:8px}#lx .badge{display:flex;gap:6px;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid var(--vx-line);font-size:.86rem}#lx .badge.off{opacity:.38}#lx form{display:grid;gap:12px}#lx fieldset{border:1px solid var(--vx-line);border-radius:12px;padding:10px 12px}#lx legend{font-weight:700;font-size:.92rem}#lx .opts{display:flex;flex-wrap:wrap;gap:6px}#lx .opts label{display:flex;gap:6px;align-items:center;padding:6px 10px;border:1px solid var(--vx-line);border-radius:999px;font-size:.88rem;cursor:pointer}#lx select,#lx input[type=text]{padding:9px 10px;border-radius:10px;border:1px solid var(--vx-line);font:inherit;background:var(--vx-card);color:var(--vx-text)}#lx .goal{display:flex;gap:8px;align-items:center}#lx .goal.done span{text-decoration:line-through;opacity:.6}</style>' +
      '<div class="lx-top"><div><h2>🚀 My learning journey</h2><p>' + (progName ? E(progName) + (P.year_level ? ' · ' + E(P.year_level) : '') : 'Tell us about your learning to personalise this page') + '</p><div>' + (P.subjects || []).map(function (s) { return '<span class="chip">' + E(s) + '</span>'; }).join('') + '</div></div>' +
      '<div><button class="vx-btn light" type="button" id="lx-edit">' + (D.P ? 'Edit my learning profile' : 'Set up my learning profile') + '</button></div></div><div id="lx-form"></div>' +
      '<div class="lx-grid">' +
      // what to do next
      '<div class="lx-c"><h3>🧭 What to do next</h3><ul>' + (open[0] ? '<li>▶ <a href="' + E(D.LS[open[0].lesson_id].url) + '">Continue: ' + E(D.LS[open[0].lesson_id].title) + '</a> <span class="muted">' + Math.round(open[0].percent || 0) + ' %</span></li>' : '') +
        weak.slice(0, 2).map(function (w) { return '<li>🎯 Strengthen <b>' + E(w.topic) + '</b> (' + w.pct + ' %): <a href="/explore/?q=' + encodeURIComponent(w.topic.split(':')[0].split(' ')[0]) + '">lessons and labs</a> · <a href="/quizzes/">practice questions</a></li>'; }).join('') +
        (!open[0] && !weak.length ? '<li>🌌 <a href="/explore/">Explore a new topic in the Science Universe</a></li>' : '') + '<li>🔬 <a href="/simulations/">Run a Virtual Lab investigation</a> · <a href="/lab-results/">my recorded results</a></li></ul></div>' +
      // mastery
      '<div class="lx-c"><h3>📊 Topic mastery <a href="/mastery/" style="font-size:.8rem;font-weight:600">see all and practise →</a></h3>' + (M.length ? M.slice(0, 6).map(function (o) { var c = o.pct >= 80 ? '#2F9E74' : o.pct >= 60 ? '#D9861A' : '#E25C4B'; return '<div><b style="font-size:.92rem">' + E(o.topic) + '</b> <span class="muted">' + o.pct + ' % of ' + o.max + ' marks</span><div class="bar" role="img" aria-label="' + o.pct + ' percent"><i style="width:' + o.pct + '%;background:' + c + '"></i></div></div>'; }).join('') : '<p class="muted">Your mastery appears here after your first marked questions.</p>') + '</div>' +
      // weak areas and misconceptions
      '<div class="lx-c"><h3>🔍 Areas to work on</h3>' + (weak.length ? '<ul>' + weak.map(function (w) { var mis = Object.keys(w.mis).sort(function (a, b) { return w.mis[b] - w.mis[a]; })[0]; return '<li><b>' + E(w.topic) + '</b> · ' + w.pct + ' %' + (mis ? '<br><span class="muted">Common mix-up: ' + E(mis) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted">' + (M.length ? 'No weak topics: every topic with enough marks is at 60 % or more.' : 'Nothing yet: answer some questions first.') + '</p>') + (strong.length ? '<p class="muted" style="margin-top:10px">Strongest: ' + strong.map(function (s) { return E(s.topic) + ' (' + s.pct + ' %)'; }).join(', ') + '</p>' : '') + '</div>' +
      // goals
      '<div class="lx-c"><h3>🎯 My learning goals</h3><ul id="lx-goals"></ul><div class="goal" style="margin-top:10px"><label class="sr-only" for="lx-g">New goal</label><input type="text" id="lx-g" placeholder="e.g. Understand how enzymes work by Friday" style="flex:1;min-width:0"><button class="vx-btn pri" type="button" id="lx-gadd" style="padding:9px 14px">Add</button></div></div>' +
      // recent lessons
      '<div class="lx-c"><h3>📘 Recently studied</h3>' + (D.LP.filter(function (p) { return D.LS[p.lesson_id]; }).length ? '<ul>' + D.LP.filter(function (p) { return D.LS[p.lesson_id]; }).slice(0, 5).map(function (p) { var l = D.LS[p.lesson_id]; return '<li><a href="' + E(l.url) + '">' + E(l.title) + '</a> <span class="muted">' + (p.status === 'completed' ? '✓ done' : Math.round(p.percent || 0) + ' %') + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">No lessons yet. <a href="/learn/">Start one</a>.</p>') + '<p class="muted" style="margin-top:10px">' + done.length + ' lessons completed · ' + D.SA.length + ' lab investigations</p></div>' +
      // assessments
      '<div class="lx-c"><h3>📝 Assessment history</h3>' + (D.QA.length ? '<ul>' + D.QA.slice(0, 5).map(function (a) { var pc = a.max_score ? Math.round(a.score / a.max_score * 100) : null; return '<li>' + E(D.QZ[a.quiz_id] || 'Assessment') + ' <span class="muted">' + (pc != null ? a.score + '/' + a.max_score + ' (' + pc + ' %)' : 'submitted') + ' · ' + new Date(a.submitted_at).toLocaleDateString() + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">No assessments submitted yet.</p>') + '<p style="margin-top:10px"><a href="/quizzes/">Open the Assessment centre →</a></p></div>' +
      // research
      '<div class="lx-c"><h3>🧪 Research and projects</h3>' + (D.RP.length + D.PP.length ? '<ul>' + D.RP.map(function (p) { return '<li><a href="/research/#/p/' + E(p.id) + '/">' + (p.kind === 'ee' ? 'Extended essay' : 'IA') + ': ' + E(p.title) + '</a> <span class="muted">' + E(String(p.status).replace(/_/g, ' ')) + '</span></li>'; }).join('') + D.PP.map(function (p) { return '<li><a href="/personal-project/">Personal project: ' + E(p.title) + '</a> <span class="muted">' + E(String(p.status).replace(/_/g, ' ')) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">No research projects yet. <a href="/research/">Open the VISTA Research Hub</a> or <a href="/personal-project/">start your MYP personal project</a>.</p>') + '</div>' +
      // achievements
      '<div class="lx-c"><h3>🏆 Achievements</h3><p class="muted" style="margin:0 0 10px">' + earned.length + ' of ' + A.length + ' earned, from your own records.</p><div class="badges">' + A.map(function (a) { return '<span class="badge' + (a[0] ? '' : ' off') + '" title="' + (a[0] ? 'Earned' : 'Not yet') + '"><span aria-hidden="true">' + a[1] + '</span>' + E(a[2]) + (a[0] ? '' : '<span class="sr-only"> (not yet)</span>') + '</span>'; }).join('') + '</div></div>' +
      '</div>';
    // goals (saved in learner_preferences.goals)
    var goals = (P.goals || []).slice(), gl = root.querySelector('#lx-goals');
    var save = function (patch) { if (D.prefsMissing) { alert('Saving your profile and goals will work after the next site update.'); return Promise.resolve(); } var row = Object.assign({ user_id: D.uid }, patch); return D.S.db.from('learner_preferences').upsert(row).then(function (r) { if (r.error) alert('Could not save: ' + r.error.message); else D.P = Object.assign(D.P || {}, row); }); };
    var drawGoals = function () { gl.innerHTML = goals.length ? goals.map(function (g, i) { return '<li class="goal' + (g.done ? ' done' : '') + '"><input type="checkbox" id="lxg' + i + '"' + (g.done ? ' checked' : '') + ' data-i="' + i + '"><label for="lxg' + i + '"><span>' + E(g.text) + '</span></label><button type="button" class="vx-btn ghost" style="padding:4px 9px;margin-left:auto" data-x="' + i + '" aria-label="Remove goal">✕</button></li>'; }).join('') : '<li class="muted">Set a goal you want to reach. Only you and your teacher can see it.</li>';
      gl.querySelectorAll('input').forEach(function (c) { c.onchange = function () { goals[+c.dataset.i].done = c.checked; drawGoals(); save({ goals: goals }); }; });
      gl.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () { goals.splice(+b.dataset.x, 1); drawGoals(); save({ goals: goals }); }; }); };
    drawGoals();
    root.querySelector('#lx-gadd').onclick = function () { var inp = root.querySelector('#lx-g'), v = inp.value.trim(); if (!v) return; goals.push({ id: Date.now().toString(36), text: v.slice(0, 200), done: false, at: new Date().toISOString() }); inp.value = ''; drawGoals(); save({ goals: goals }); };
    // profile form (onboarding)
    var openForm = function (auto) {
      var f = root.querySelector('#lx-form'), p = D.P || {};
      var box = function (name, list, sel) { return '<div class="opts">' + list.map(function (x) { var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<label><input type="checkbox" name="' + name + '" value="' + E(v) + '"' + ((sel || []).indexOf(v) >= 0 ? ' checked' : '') + '>' + E(l) + '</label>'; }).join('') + '</div>'; };
      f.innerHTML = '<div class="lx-c" style="margin-top:14px"><h3>✏️ My learning profile</h3><p class="muted">Used only to personalise your homepage and this dashboard. Only you and your teachers can see it.</p><form>' +
        '<fieldset><legend>Programme and year</legend><div class="opts"><label for="lx-prog" class="sr-only">Programme</label><select id="lx-prog"><option value="">Choose your programme</option>' + PROG.map(function (x) { return '<option value="' + x[0] + '"' + (p.programme === x[0] ? ' selected' : '') + '>' + E(x[1]) + '</option>'; }).join('') + '</select><label for="lx-year" class="sr-only">Year</label><select id="lx-year"></select></div></fieldset>' +
        '<fieldset><legend>Subjects I study</legend>' + box('subj', SUBJ, p.subjects) + '</fieldset>' +
        '<fieldset><legend>Topics that interest me</legend>' + box('int', INTEREST, p.interests) + '</fieldset>' +
        '<fieldset><legend>How I like to learn</legend>' + box('appr', APPROACH, p.approach) + '</fieldset>' +
        '<fieldset><legend>Dashboard colour</legend><div class="opts">' + ACCENTS.map(function (c) { return '<label><input type="radio" name="acc" value="' + c + '"' + ((p.accent || '#0284C7') === c ? ' checked' : '') + '><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:' + c + '"></span><span class="sr-only">' + c + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<div><button class="vx-btn pri" type="submit">Save my profile</button> <button class="vx-btn ghost" type="button" id="lx-cancel">Cancel</button></div></form></div>';
      var prog = f.querySelector('#lx-prog'), yr = f.querySelector('#lx-year');
      var years = function () { yr.innerHTML = '<option value="">Year</option>' + (YEARS[prog.value] || []).map(function (y) { return '<option' + (p.year_level === y ? ' selected' : '') + '>' + E(y) + '</option>'; }).join(''); };
      prog.onchange = years; years();
      f.querySelector('#lx-cancel').onclick = function () { f.innerHTML = ''; };
      var vals = function (n) { return [].map.call(f.querySelectorAll('input[name=' + n + ']:checked'), function (i) { return i.value; }); };
      f.querySelector('form').onsubmit = function (ev) { ev.preventDefault();
        var acc = f.querySelector('input[name=acc]:checked');
        save({ programme: prog.value || null, year_level: yr.value || null, subjects: vals('subj'), interests: vals('int'), approach: vals('appr'), accent: acc ? acc.value : null, onboarded_at: (D.P && D.P.onboarded_at) || new Date().toISOString(), goals: goals }).then(function () { render(D); }); };
      if (auto !== true) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    root.querySelector('#lx-edit').onclick = function () { openForm(); };
    if (!D.P && !D.prefsMissing && !sessionStorage.getItem('lx-skip')) { openForm(true); sessionStorage.setItem('lx-skip', '1'); }
    root.hidden = false;
  }

  /* =================== teacher: class insights =================== */
  function teacher(S, me) {
    var uid = me.user.id, q = function (p) { return p.then(function (r) { return r; }, function () { return { data: null }; }); };
    Promise.all([q(S.db.from('classes').select('id,name,deleted_at,owner_kind,archived_at').eq('teacher_id', uid)), q(S.db.from('class_teachers').select('class_id').eq('teacher_id', uid))]).then(function (R) {
      var own = (R[0].data || []).filter(function (c) { return !c.deleted_at && !c.archived_at; }), extra = (R[1].data || []).map(function (x) { return x.class_id; }).filter(function (id) { return !own.some(function (c) { return c.id === id; }); });
      return (extra.length ? q(S.db.from('classes').select('id,name,deleted_at,owner_kind,archived_at').in('id', extra)) : Promise.resolve({ data: [] })).then(function (r2) { return own.concat((r2.data || []).filter(function (c) { return !c.deleted_at; })); });
    }).then(function (classes) {
      if (!classes.length) return;
      var ids = classes.map(function (c) { return c.id; }), week = new Date(Date.now() - 7 * 864e5).toISOString();
      return Promise.all([
        q(S.db.from('enrolments').select('class_id,student_id').in('class_id', ids).eq('status', 'approved')),
        q(S.db.from('item_results').select('class_id,student_id,topic,got,max,misconceptions').in('class_id', ids).limit(10000)),
        q(S.db.from('research_projects').select('class_id,status').in('class_id', ids).neq('status', 'archived')),
        q(S.db.from('pp_projects').select('id,status').eq('supervisor_id', uid).neq('status', 'archived'))
      ]).then(function (R) {
        var EN = R[0].data || [], IR = R[1].data || [], RP = R[2].data || [], PP = R[3].data || [];
        var sids = EN.map(function (e) { return e.student_id; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        return Promise.all([sids.length ? q(S.db.from('learning_progress').select('student_id,status,updated_at').in('student_id', sids).gte('updated_at', week)) : { data: [] }, sids.length ? q(S.db.from('profiles').select('id,full_name').in('id', sids)) : { data: [] }, sids.length ? q(S.db.from('tutor_sessions').select('user_id,flagged,updated_at').in('user_id', sids).gte('updated_at', week).limit(5000)) : { data: [] }]).then(function (X) {
          var LP = X[0].data || [], TS = X[2].data || [], NM = {}; (X[1].data || []).forEach(function (p) { NM[p.id] = p.full_name; });
          // Compact class insights (21 Nov 2026): one row per class that has students; empty curriculum classes are left out
          var withSt = classes.filter(function (c) { return EN.some(function (e) { return e.class_id === c.id; }) && !(location.pathname.indexOf('/teach/') === 0 && c.owner_kind === 'main'); });   // on My classes: only the teacher's own classroom classes
          if (!withSt.length) { root.hidden = true; return; }
          var rows = withSt.map(function (c) {
            var st = EN.filter(function (e) { return e.class_id === c.id; }).map(function (e) { return e.student_id; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
            var lp = LP.filter(function (l) { return st.indexOf(l.student_id) >= 0; }), active = lp.map(function (l) { return l.student_id; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length, done = lp.filter(function (l) { return l.status === 'completed'; }).length;
            var ir = IR.filter(function (r) { return r.class_id === c.id; }), m = mastery(ir), weak = m.filter(function (o) { return o.max >= 10; }).sort(function (a, b) { return a.pct - b.pct; })[0];
            var mis = {}; ir.forEach(function (r) { (r.misconceptions || []).forEach(function (x) { if (x) mis[x] = (mis[x] || 0) + 1; }); }); var topMis = Object.keys(mis).sort(function (a, b) { return mis[b] - mis[a]; })[0];
            var per = {}; ir.forEach(function (r) { if (!(r.max > 0)) return; var o = per[r.student_id] = per[r.student_id] || { g: 0, m: 0 }; o.g += +r.got || 0; o.m += +r.max; });
            var support = Object.keys(per).filter(function (s) { return per[s].m >= 10 && per[s].g / per[s].m < 0.5 && st.indexOf(s) >= 0; });
            var ts = TS.filter(function (t) { return st.indexOf(t.user_id) >= 0; }), fl = ts.filter(function (t) { return t.flagged; });
            var rp = RP.filter(function (r) { return r.class_id === c.id; }), waiting = rp.filter(function (r) { return /submitted/.test(r.status); }).length;
            var dash = '<span class="muted">–</span>';
            return '<tr><td><b>' + E(c.name) + '</b><br><span class="muted">' + active + ' of ' + st.length + ' active · ' + done + ' lesson' + (done === 1 ? '' : 's') + ' done (7 days)</span></td>' +
              '<td>' + (weak ? E(weak.topic) + ' <span class="muted">' + weak.pct + ' % of ' + weak.max + ' marks</span>' : '<span class="muted" title="Fewer than 10 marks in every topic">Not enough evidence yet</span>') + '</td>' +
              '<td class="w2">' + (topMis ? E(topMis) + ' <span class="muted">(' + mis[topMis] + ')</span>' : dash) + '</td>' +
              '<td class="n">' + (support.length ? '<a href="/mastery/?class=' + c.id + '" title="' + E(support.map(function (s) { return NM[s] || 'A student'; }).join(', ')) + '"><b style="color:#c2410c">' + support.length + '</b></a>' : '0') + '</td>' +
              '<td>' + ts.length + ' tutor chat' + (ts.length === 1 ? '' : 's') + (fl.length ? ' <span title="Asked the tutor for assessed work" style="color:#b45309">⚠' + fl.length + '</span>' : '') + (rp.length ? '<br><a href="/research/#/teacher">' + rp.length + ' research' + (waiting ? ' · <b>' + waiting + ' waiting</b>' : '') + '</a>' : '') + '</td></tr>';
          }).join('');
          root.innerHTML = '<style>#lx{margin:18px 0 8px}#lx table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;font-size:.88rem}#lx th{background:#f8fafc;color:#475569;font-size:.74rem;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:8px 10px}#lx td{padding:8px 10px;border-top:1px solid #f1f5f9;vertical-align:top}#lx td.n,#lx th.n{text-align:center}#lx .tw{overflow-x:auto}#lx td{overflow-wrap:anywhere}@media (max-width:1180px){#lx .w2{display:none}}</style>' +
            '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin:0 0 8px"><h3 style="margin:0;color:#0f1f3d">Class insights</h3><a class="small" href="/mastery/">🔥 Class mastery heatmap →</a></div>' +
            '<div class="tw"><table><tr><th>Class</th><th>Weakest topic</th><th class="w2">Most common wrong idea</th><th class="n">May need support</th><th>AI tutor and research</th></tr>' + rows + '</table></div>' +
            '<p class="muted small" style="margin:6px 0 0">How it is worked out: from marked answers in lessons and quizzes (item results). Weakest topic needs 10+ marks; "may need support" means below 50 % across 10+ marks. Classes without students are not shown.</p>';
          root.hidden = false;
        });
      });
    });
  }
})();
