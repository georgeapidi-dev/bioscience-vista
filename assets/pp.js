/* MYP Personal Project Hub · VistaEd · by George Apidi
   The student's side (part 1): start a project, plan it (criterion A), keep a timeline, a process journal, evidence and sources,
   draft the report section by section against the official rules, self-assess with the official descriptors, and submit.
   Data: pp_* tables (migration 061) and the private pp-files bucket. Nothing here gives marks: checks are advice only. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var GUIDE_ID = '7a2c3e10-61aa-4b0e-9c61-000000000061';
  var CONTEXTS = [['identities', 'Identities and relationships', 'Who am I? Who are we? Health, beliefs, relationships, what it means to be human.'],
    ['orientation', 'Orientation in space and time', 'Homes and journeys, history, discoveries, migration, place and scale.'],
    ['expression', 'Personal and cultural expression', 'Creativity, the arts, culture, beliefs and values, craft, design.'],
    ['innovation', 'Scientific and technical innovation', 'How we understand the natural world, technology, systems, models, the impact of science.'],
    ['sustainability', 'Globalization and sustainability', 'Interconnectedness, resources, the environment, consumption, communities.'],
    ['fairness', 'Fairness and development', 'Rights and responsibilities, equality, access, peace and conflict, communities.']];
  var ATL = ['communication', 'collaboration', 'organization', 'affective', 'reflection', 'information literacy', 'media literacy', 'critical thinking', 'creative thinking', 'transfer'];
  var STAGES = [['plan', 'Plan', 'A'], ['apply', 'Apply skills', 'B'], ['reflect', 'Reflect', 'C'], ['report', 'Report', ''], ['exhibit', 'Exhibition', '']];
  var STATUS = { active: 'Working', proposal_submitted: 'Proposal sent to your supervisor', proposal_approved: 'Proposal approved', returned: 'Returned with feedback', final_submitted: 'Final report submitted', completed: 'Completed', archived: 'Archived' };
  var TABS = [['home', '🏠 Overview'], ['plan', '🎯 Plan (A)'], ['tasks', '🗓 Timeline'], ['journal', '📓 Process journal'], ['evidence', '📎 Evidence'], ['sources', '📚 Sources'], ['report', '📝 Report'], ['assess', '✅ Self-assessment'], ['feedback', '💬 Feedback']];
  var ST = { me: null, p: null, guide: null, cohort: null, names: {}, tab: (location.hash.slice(1) || 'home') };

  var CSS = '#pp{--pp:#7C3AED;--pp2:#DB2777}.pp-hero{margin:8px 0 14px;padding:22px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#7C3AED,#DB2777 60%,#F59E0B)}.pp-hero h1{margin:4px 0 6px;color:#fff;font:700 clamp(1.5rem,3.6vw,2.2rem)/1.15 var(--vx-font-head,inherit)}.pp-hero p{margin:0;color:#fff}.pp-hero .vx-eye{color:#FEF3C7}' +
    '.pp-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}.pp-tabs button{border:2px solid #E9D5FF;background:#FAF5FF;color:#5B21B6;border-radius:999px;padding:7px 12px;font-weight:700;cursor:pointer}.pp-tabs button[aria-selected=true]{background:var(--pp);border-color:var(--pp);color:#fff}' +
    '.pp-card{background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:16px 18px;margin:0 0 14px}.pp-card h3{margin:0 0 8px}.pp-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}' +
    '.pp-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.pp-steps div{padding:10px;border-radius:12px;background:#F5F3FF;text-align:center;font-weight:700;font-size:.9rem}.pp-steps div.on{background:var(--pp);color:#fff}.pp-steps div.done{background:#DCFCE7;color:#166534}' +
    '.pp-f{display:grid;gap:4px;margin:0 0 10px}.pp-f span{font-weight:700}.pp-f small{color:#64748b}.pp-f input,.pp-f textarea,.pp-f select{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid var(--line,#cbd5e1);font:inherit}' +
    '.pp-tip{padding:8px 12px;border-radius:10px;background:#FEF3C7;border:1px solid #FCD34D;font-size:.9rem;margin:6px 0}.pp-ok{background:#DCFCE7;border-color:#86EFAC}.pp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
    '.pp-list{list-style:none;padding:0;margin:0;display:grid;gap:8px}.pp-list li{padding:10px 12px;border:1px solid var(--line,#e5e7eb);border-radius:12px;background:#fff}.pp-chip{display:inline-block;padding:2px 9px;border-radius:999px;background:#EDE9FE;color:#5B21B6;font-size:.78rem;font-weight:700;margin:2px 4px 2px 0}' +
    '.pp-kan{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}.pp-kan>div{background:#F8FAFC;border-radius:12px;padding:10px}.pp-kan h4{margin:0 0 8px}.pp-band{border:1px solid #E9D5FF;border-radius:12px;padding:10px;margin:6px 0;cursor:pointer}.pp-band.sel{border:2px solid var(--pp);background:#FAF5FF}' +
    '.pp-meter{height:10px;border-radius:99px;background:#E5E7EB;overflow:hidden}.pp-meter i{display:block;height:100%;background:linear-gradient(90deg,#16A34A,#F59E0B,#DC2626)}.pp-muted{color:#64748b;font-size:.9rem}';

  function css() { if (document.getElementById('pp-css')) return; var s = document.createElement('style'); s.id = 'pp-css'; s.textContent = CSS; document.head.appendChild(s); }
  function msg(t, bad) { var m = document.getElementById('pp-msg'); if (m) { m.textContent = t; m.style.color = bad ? '#B91C1C' : '#166534'; clearTimeout(msg.t); msg.t = setTimeout(function () { m.textContent = ''; }, 4000); } }
  function ok(r, t) { if (r && r.error) { msg(S.nice(r.error), true); return false; } if (t) msg(t); return true; }
  function words(t) { return (String(t || '').trim().match(/\S+/g) || []).length; }
  function D() { return ST.p.data || (ST.p.data = {}); }
  var saveT = null;
  function saveData(now) { clearTimeout(saveT); var go = function () { S.db.from('pp_projects').update({ data: ST.p.data, title: ST.p.title }).eq('id', ST.p.id).then(function (r) { ok(r, 'Saved'); }); }; if (now) go(); else saveT = setTimeout(go, 900); }

  S.guard(app, { anyone: true, allowPending: true, school: true }).then(function (me) {
    ST.me = me; css();
    var staff = me.staff || me.school || (me.roles || []).indexOf('teacher') >= 0;
    return Promise.all([S.db.from('pp_guides').select('*').eq('id', GUIDE_ID).maybeSingle(), S.db.from('pp_projects').select('*').eq('student_id', me.user.id).neq('status', 'archived').order('created_at', { ascending: false }).limit(1)]).then(function (x) {
      ST.guide = x[0].data; ST.p = (x[1].data || [])[0] || null;
      if (staff && !ST.p) return supervisorList();
      if (!ST.p) return startScreen();
      return loadCohort().then(shell);
    });
  }, function () {});

  function loadCohort() {
    var ps = [S.db.rpc('pp_names', { pids: [ST.p.id] })];
    if (ST.p.cohort_id) ps.push(S.db.from('pp_cohorts').select('*').eq('id', ST.p.cohort_id).maybeSingle());
    return Promise.all(ps).then(function (x) { ST.names = ((x[0].data || [])[0]) || {}; ST.cohort = x[1] ? x[1].data : null; });
  }

  /* ---------- no project yet ---------- */
  function startScreen() {
    S.db.from('pp_cohorts').select('id,name,year').eq('archived', false).order('created_at', { ascending: false }).then(function (r) {
      var co = r.data || [], cls = ST.me.classes || [];
      app.innerHTML = '<div id="pp">' + hero('Start your personal project', 'Plan it, do it, reflect on it, and write the report, step by step. Your supervisor sees your progress and gives feedback here.') +
        '<section class="pp-card"><h3>Start</h3><label class="pp-f"><span>Working title (you can change it later)</span><input id="ps-t" maxlength="140" placeholder="e.g. Designing a water filter from local materials"></label>' +
        (co.length ? '<label class="pp-f"><span>Your personal project group</span><select id="ps-c"><option value="">Not sure yet</option>' + co.map(function (c) { return '<option value="' + c.id + '">' + E(c.name + (c.year ? ' · ' + c.year : '')) + '</option>'; }).join('') + '</select><small>Your coordinator sets this up. Choose “Not sure yet” if you cannot see your group.</small></label>' : '') +
        (cls.length ? '<label class="pp-f"><span>Your class</span><select id="ps-k"><option value="">None</option>' + cls.map(function (c) { return '<option value="' + E(c.class_id || c.id) + '">' + E(c.name || 'Class') + '</option>'; }).join('') + '</select><small>Your class teacher can then see and support your project.</small></label>' : '') +
        '<div class="pp-row"><button class="btn main" id="ps-go">🚀 Start my personal project</button><span id="pp-msg" role="status"></span></div></section>' +
        '<section class="pp-card"><h3>How it works</h3><div class="pp-steps">' + STAGES.map(function (s) { return '<div>' + E(s[1]) + (s[2] ? '<br><small>Criterion ' + s[2] + '</small>' : '') + '</div>'; }).join('') + '</div>' +
        '<p class="pp-muted" style="margin-top:10px">The personal project is assessed on three criteria: A Planning, B Applying skills and C Reflecting (each out of 8), from your report. Source: ' + E(ST.guide ? ST.guide.source : 'IB MYP Personal project guide') + '.</p></section></div>';
      document.getElementById('ps-go').onclick = function () {
        var t = document.getElementById('ps-t').value.trim() || 'My personal project', c = document.getElementById('ps-c'), k = document.getElementById('ps-k');
        S.db.from('pp_projects').insert({ title: t, cohort_id: c && c.value || null, class_id: k && k.value || null, data: {} }).select('*').single().then(function (r) {
          if (!ok(r)) return; ST.p = r.data; loadCohort().then(shell);
        });
      };
    });
  }
  function hero(h, p) { return '<section class="pp-hero"><p class="vx-eye">MYP Personal Project Hub</p><h1>' + E(h) + '</h1><p>' + E(p) + '</p></section>'; }

  /* ---------- the hub ---------- */
  function shell() {
    app.innerHTML = '<div id="pp">' + hero(ST.p.title, (STATUS[ST.p.status] || ST.p.status) + (ST.names.supervisor_name ? ' · Supervisor: ' + ST.names.supervisor_name : ' · No supervisor assigned yet') + (ST.cohort ? ' · ' + ST.cohort.name : '')) +
      '<nav class="pp-tabs" role="tablist" aria-label="Personal project sections">' + TABS.map(function (t) { return '<button role="tab" data-t="' + t[0] + '" aria-selected="' + (t[0] === ST.tab) + '">' + t[1] + '</button>'; }).join('') + '</nav>' +
      '<p id="pp-msg" role="status" class="pp-muted" style="min-height:1.2em;margin:-6px 0 8px"></p><div id="pp-body"></div></div>';
    [].forEach.call(app.querySelectorAll('.pp-tabs button'), function (b) { b.onclick = function () { go(b.getAttribute('data-t')); }; });
    go(TABS.some(function (t) { return t[0] === ST.tab; }) ? ST.tab : 'home');
  }
  function go(t) {
    ST.tab = t; history.replaceState(null, '', '#' + t);
    [].forEach.call(app.querySelectorAll('.pp-tabs button'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-t') === t)); });
    var body = document.getElementById('pp-body'); body.innerHTML = '<p class="pp-muted">Loading…</p>';
    ({ home: home, plan: plan, tasks: tasks, journal: journal, evidence: evidence, sources: sources, report: report, assess: assess, feedback: feedback })[t](body);
  }

  /* overview */
  function home(body) {
    var pid = ST.p.id;
    Promise.all([S.db.from('pp_tasks').select('title,due_on,status').eq('project_id', pid).neq('status', 'done').order('due_on', { ascending: true, nullsFirst: false }).limit(5),
      S.db.from('pp_journal').select('id', { count: 'exact', head: true }).eq('project_id', pid), S.db.from('pp_evidence').select('id', { count: 'exact', head: true }).eq('project_id', pid),
      S.db.from('pp_sources').select('id', { count: 'exact', head: true }).eq('project_id', pid), S.db.from('pp_feedback').select('comment,created_at,resolved,author_id').eq('project_id', pid).eq('resolved', false).order('created_at', { ascending: false }).limit(3)]).then(function (x) {
      var d = D(), A = !!(d.goal && d.product && (d.criteria || []).length), B = (x[1].count || 0) >= 3, C = !!(d.report && (d.report.impact || d.report.evaluation)), R = ['final_submitted', 'completed'].indexOf(ST.p.status) >= 0;
      var cur = !A ? 0 : !B ? 1 : !C ? 2 : !R ? 3 : 4, dl = (ST.cohort && ST.cohort.deadlines) || [];
      body.innerHTML = '<section class="pp-card"><h3>Where you are</h3><div class="pp-steps">' + STAGES.map(function (s, i) { return '<div class="' + (i < cur ? 'done' : i === cur ? 'on' : '') + '">' + (i < cur ? '✓ ' : '') + E(s[1]) + '</div>'; }).join('') + '</div>' +
        '<p class="pp-muted" style="margin-top:8px">' + ['Next: write your learning goal, product and success criteria in <b>Plan</b>.', 'Next: keep your process journal going (at least a few entries as you work) and collect evidence.', 'Next: reflect on the impact and evaluate your product in the <b>Report</b>.', 'Next: check your report against the rules, self-assess, then submit it.', 'Your final report is in. Prepare for the exhibition.'][cur] + '</p></section>' +
        '<div class="pp-g"><section class="pp-card"><h3>Coming up</h3>' + ((x[0].data || []).length ? '<ul class="pp-list">' + x[0].data.map(function (t) { return '<li>' + E(t.title) + (t.due_on ? ' <span class="pp-chip">' + E(t.due_on) + '</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="pp-muted">No tasks yet. Add them in <a href="#tasks" data-go="tasks">Timeline</a>.</p>') +
        (dl.length ? '<h4 style="margin:12px 0 6px">School deadlines</h4><ul class="pp-list">' + dl.map(function (z) { return '<li>' + E(z.label) + ' <span class="pp-chip">' + E(z.due || '') + '</span></li>'; }).join('') + '</ul>' : '') + '</section>' +
        '<section class="pp-card"><h3>Your record so far</h3><p>📓 ' + (x[1].count || 0) + ' journal entries<br>📎 ' + (x[2].count || 0) + ' pieces of evidence<br>📚 ' + (x[3].count || 0) + ' sources<br>📝 ' + Object.keys((d.report || {})).reduce(function (n, k) { return n + words(d.report[k]); }, 0) + ' words in your report draft</p></section>' +
        '<section class="pp-card"><h3>New feedback</h3>' + ((x[4].data || []).length ? '<ul class="pp-list">' + x[4].data.map(function (f) { return '<li>' + E(f.comment) + '<br><small class="pp-muted">' + new Date(f.created_at).toLocaleDateString() + '</small></li>'; }).join('') + '</ul><p><a href="#feedback" data-go="feedback">See all feedback →</a></p>' : '<p class="pp-muted">No new feedback.</p>') + '</section></div>' +
        '<section class="pp-card"><h3>Need help thinking it through?</h3><p class="pp-muted">The AI tutor can ask you questions about your idea and your plan. It will not write any part of your report: that has to be your own work.</p><a class="btn sm" href="/tutor/?mode=guide&topic=' + encodeURIComponent('MYP personal project: ' + ST.p.title) + '">🤖 Talk my idea through with the AI tutor</a> <a class="btn sm" href="/poster/">🖼️ Make my exhibition poster</a></section>';
      wireGo(body);
    });
  }
  function wireGo(root) { [].forEach.call(root.querySelectorAll('[data-go]'), function (a) { a.onclick = function (e) { e.preventDefault(); go(a.getAttribute('data-go')); }; }); }

  /* plan: criterion A */
  function plan(body) {
    var d = D(), crit = d.criteria || (d.criteria = []), cx = d.context || (d.context = {});
    var locked = ['proposal_submitted', 'final_submitted', 'completed'].indexOf(ST.p.status) >= 0;
    function critRow(c, i) { return '<li class="pp-row" style="align-items:flex-start"><div style="flex:1;min-width:200px"><label class="pp-f"><span>Criterion ' + (i + 1) + '</span><input data-ci="' + i + '" data-k="c" value="' + E(c.c || '') + '" placeholder="e.g. The filter removes visible particles from muddy water"></label></div>' +
      '<div style="flex:1;min-width:200px"><label class="pp-f"><span>How you will check it</span><input data-ci="' + i + '" data-k="how" value="' + E(c.how || '') + '" placeholder="e.g. Compare turbidity before and after with a turbidity tube"></label></div><button class="btn sm" data-del="' + i + '" aria-label="Remove criterion ' + (i + 1) + '">✕</button></li>'; }
    body.innerHTML = '<section class="pp-card"><h3>Project title</h3><label class="pp-f"><span>Title</span><input id="pl-title" maxlength="140" value="' + E(ST.p.title) + '"></label></section>' +
      '<section class="pp-card"><h3>Learning goal (criterion A, strand i)</h3><label class="pp-f"><span>What interests you, and why?</span><textarea id="pl-int" rows="3">' + E(d.interest || '') + '</textarea><small>A personal interest, experience or question that led you to this project.</small></label>' +
      '<label class="pp-f"><span>Your learning goal</span><textarea id="pl-goal" rows="2" placeholder="e.g. To learn how filtration and adsorption remove impurities from water">' + E(d.goal || '') + '</textarea><small>What you want to <b>learn</b> as a result of the project (not the same as the product).</small></label><div id="pl-gtip"></div></section>' +
      '<section class="pp-card"><h3>Global context</h3><div class="pp-g">' + CONTEXTS.map(function (c) { return '<label class="pp-band' + (cx.key === c[0] ? ' sel' : '') + '"><input type="radio" name="pl-cx" value="' + c[0] + '"' + (cx.key === c[0] ? ' checked' : '') + '> <b>' + E(c[1]) + '</b><br><small class="pp-muted">' + E(c[2]) + '</small></label>'; }).join('') + '</div>' +
      '<label class="pp-f" style="margin-top:10px"><span>Your exploration of this context</span><textarea id="pl-cxe" rows="2">' + E(cx.exploration || '') + '</textarea><small>How your project connects to this context.</small></label></section>' +
      '<section class="pp-card"><h3>Product and success criteria (strand ii)</h3><label class="pp-f"><span>Your intended product</span><textarea id="pl-prod" rows="2">' + E(d.product || '') + '</textarea><small>What you will create.</small></label>' +
      '<ul class="pp-list" id="pl-crit">' + crit.map(critRow).join('') + '</ul><div class="pp-row" style="margin-top:8px"><button class="btn sm" id="pl-add">➕ Add a success criterion</button></div><div id="pl-ctip"></div></section>' +
      '<section class="pp-card"><h3>Plan (strand iii)</h3><label class="pp-f"><span>How you will achieve the product</span><textarea id="pl-plan" rows="4">' + E(d.plan_notes || '') + '</textarea><small>Main stages, resources, and how you will manage your time. Add dated tasks in the <a href="#tasks" data-go="tasks">Timeline</a>.</small></label>' +
      '<label class="pp-f"><span>ATL skills you expect to use</span><div>' + ATL.map(function (a) { return '<label class="pp-chip" style="cursor:pointer"><input type="checkbox" data-atl="' + E(a) + '"' + ((d.atl_plan || []).indexOf(a) >= 0 ? ' checked' : '') + '> ' + E(a) + '</label>'; }).join('') + '</div></label></section>' +
      '<section class="pp-card"><h3>Proposal</h3>' + (locked ? '<p class="pp-tip pp-ok">Your proposal has been sent. Your supervisor will approve it or return it with feedback.</p>' : '<p class="pp-muted">When your goal, product, criteria and plan are ready, send them to your supervisor for approval.</p><button class="btn main sm" id="pl-send">📤 Send my proposal to my supervisor</button>') + '</section>';
    var $ = function (q) { return body.querySelector(q); };
    function tips() {
      var g = (d.goal || '').toLowerCase(), out = [];
      if (g && words(g) < 6) out.push('Your learning goal is very short. Say what you want to learn, about what.');
      if (g && /\b(make|build|create|design)\b/.test(g) && !/\b(learn|understand|find out|investigate|explore)\b/.test(g)) out.push('This reads like a product. A learning goal says what you want to learn; the product is what you make.');
      if (g && d.interest && words(d.interest) < 12) out.push('Explain your personal interest more fully: how did it lead to this goal?');
      $('#pl-gtip').innerHTML = out.length ? out.map(function (t) { return '<p class="pp-tip">💡 ' + E(t) + '</p>'; }).join('') : (g ? '<p class="pp-tip pp-ok">✓ Your goal and interest are filled in. Check them with your supervisor.</p>' : '');
      var c = d.criteria || [], vague = c.filter(function (x) { return /\b(good|nice|interesting|great|cool|well|better|attractive)\b/i.test(x.c || ''); }), noHow = c.filter(function (x) { return x.c && !x.how; }), ct = [];
      if (c.length && c.length < 3) ct.push('Most products need several criteria (for example appearance, function, materials, audience). You have ' + c.length + '.');
      if (vague.length) ct.push('Some criteria use vague words (good, nice, better…). Make them specific and measurable.');
      if (noHow.length) ct.push('Say how you will check each criterion: a test, a measurement, a survey or feedback.');
      $('#pl-ctip').innerHTML = ct.map(function (t) { return '<p class="pp-tip">💡 ' + E(t) + '</p>'; }).join('') + '<p class="pp-muted">These tips are automatic advice, not marks.</p>';
    }
    tips();
    $('#pl-title').oninput = function () { ST.p.title = this.value.trim() || 'My personal project'; saveData(); };
    [['#pl-int', 'interest'], ['#pl-goal', 'goal'], ['#pl-prod', 'product'], ['#pl-plan', 'plan_notes']].forEach(function (f) { $(f[0]).oninput = function () { d[f[1]] = this.value; saveData(); tips(); }; });
    $('#pl-cxe').oninput = function () { cx.exploration = this.value; saveData(); };
    [].forEach.call(body.querySelectorAll('[name=pl-cx]'), function (r) { r.onchange = function () { cx.key = r.value; [].forEach.call(body.querySelectorAll('.pp-band'), function (b) { b.classList.toggle('sel', b.querySelector('input').checked); }); saveData(); }; });
    [].forEach.call(body.querySelectorAll('[data-atl]'), function (c) { c.onchange = function () { d.atl_plan = [].filter.call(body.querySelectorAll('[data-atl]'), function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-atl'); }); saveData(); }; });
    function wireCrit() {
      [].forEach.call(body.querySelectorAll('[data-ci]'), function (i) { i.oninput = function () { crit[+i.getAttribute('data-ci')][i.getAttribute('data-k')] = i.value; saveData(); tips(); }; });
      [].forEach.call(body.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { crit.splice(+b.getAttribute('data-del'), 1); $('#pl-crit').innerHTML = crit.map(critRow).join(''); wireCrit(); saveData(); tips(); }; });
    }
    wireCrit();
    $('#pl-add').onclick = function () { crit.push({ c: '', how: '' }); $('#pl-crit').innerHTML = crit.map(critRow).join(''); wireCrit(); };
    var send = $('#pl-send'); if (send) send.onclick = function () {
      if (!d.goal || !d.product || !crit.filter(function (c) { return c.c; }).length) { msg('Fill in your learning goal, product and at least one success criterion first.', true); return; }
      saveData(true);
      S.db.from('pp_projects').update({ status: 'proposal_submitted' }).eq('id', ST.p.id).select('status').single().then(function (r) {
        if (!ok(r, 'Proposal sent to your supervisor.')) return; ST.p.status = r.data.status;
        S.db.from('pp_submissions').insert({ project_id: ST.p.id, kind: 'proposal', note: (d.goal || '').slice(0, 300) }).then(function () {}); shell();
      });
    };
    wireGo(body);
  }

  /* timeline */
  function tasks(body) {
    S.db.from('pp_tasks').select('*').eq('project_id', ST.p.id).order('sort').order('due_on', { ascending: true, nullsFirst: false }).then(function (r) {
      var T = r.data || [], cols = [['todo', 'To do'], ['doing', 'Doing'], ['attention', 'Needs attention'], ['done', 'Done']];
      body.innerHTML = '<section class="pp-card"><h3>Add a task</h3><div class="pp-row"><input id="tk-t" placeholder="e.g. Test the filter with three water samples" style="flex:2;min-width:220px;padding:8px;border-radius:10px;border:1px solid #cbd5e1">' +
        '<select id="tk-p" style="padding:8px;border-radius:10px"><option value="planning">Planning</option><option value="research">Research</option><option value="product">Making the product</option><option value="testing">Testing</option><option value="report">Report</option><option value="exhibition">Exhibition</option></select>' +
        '<label class="pp-muted">Due <input type="date" id="tk-d"></label><label class="pp-muted"><input type="checkbox" id="tk-m"> Milestone</label><button class="btn main sm" id="tk-add">Add</button></div></section>' +
        '<div class="pp-kan">' + cols.map(function (c) { return '<div><h4>' + c[1] + ' (' + T.filter(function (t) { return t.status === c[0]; }).length + ')</h4><ul class="pp-list">' + T.filter(function (t) { return t.status === c[0]; }).map(function (t) {
          var late = t.due_on && t.status !== 'done' && t.due_on < new Date().toISOString().slice(0, 10);
          return '<li>' + (t.milestone ? '🏁 ' : '') + '<b>' + E(t.title) + '</b><br><span class="pp-chip">' + E(t.phase) + '</span>' + (t.due_on ? '<span class="pp-chip"' + (late ? ' style="background:#FEE2E2;color:#991B1B"' : '') + '>' + (late ? 'late · ' : '') + E(t.due_on) + '</span>' : '') +
            '<div class="pp-row" style="margin-top:6px"><select data-st="' + t.id + '" aria-label="Status">' + cols.map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === t.status ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select><button class="btn sm" data-rm="' + t.id + '" aria-label="Delete task">✕</button></div></li>'; }).join('') + '</ul></div>'; }).join('') + '</div>';
      var $ = function (q) { return body.querySelector(q); };
      $('#tk-add').onclick = function () { var t = $('#tk-t').value.trim(); if (!t) { msg('Write the task first.', true); return; }
        S.db.from('pp_tasks').insert({ project_id: ST.p.id, title: t, phase: $('#tk-p').value, due_on: $('#tk-d').value || null, milestone: $('#tk-m').checked, sort: T.length }).then(function (x) { if (ok(x, 'Task added')) tasks(body); }); };
      [].forEach.call(body.querySelectorAll('[data-st]'), function (s) { s.onchange = function () { S.db.from('pp_tasks').update({ status: s.value }).eq('id', s.getAttribute('data-st')).then(function (x) { if (ok(x, 'Updated')) tasks(body); }); }; });
      [].forEach.call(body.querySelectorAll('[data-rm]'), function (b) { b.onclick = function () { if (!confirm('Delete this task?')) return; S.db.from('pp_tasks').delete().eq('id', b.getAttribute('data-rm')).then(function (x) { if (ok(x, 'Deleted')) tasks(body); }); }; });
    });
  }

  /* process journal */
  function journal(body, editId) {
    S.db.from('pp_journal').select('*').eq('project_id', ST.p.id).order('entry_date', { ascending: false }).order('created_at', { ascending: false }).then(function (r) {
      var J = r.data || [], ed = J.filter(function (j) { return j.id === editId; })[0] || {};
      var f = function (k, l, h) { return '<label class="pp-f"><span>' + l + '</span><textarea id="jn-' + k + '" rows="2">' + E(ed[k] || '') + '</textarea>' + (h ? '<small>' + h + '</small>' : '') + '</label>'; };
      body.innerHTML = '<section class="pp-card"><h3>' + (ed.id ? 'Edit entry' : 'New journal entry') + '</h3><div class="pp-row"><label class="pp-muted">Date <input type="date" id="jn-d" value="' + E(ed.entry_date || new Date().toISOString().slice(0, 10)) + '"></label>' +
        '<label class="pp-muted">Stage <select id="jn-s">' + STAGES.map(function (s) { return '<option value="' + s[0] + '"' + (ed.stage === s[0] ? ' selected' : '') + '>' + E(s[1]) + '</option>'; }).join('') + '</select></label></div>' +
        f('activity', 'What I did', 'Actions, research, making, testing.') + f('learning', 'What I learned') + f('challenges', 'Challenges and how I dealt with them') + f('decisions', 'Decisions I made and why') + f('next_steps', 'Next steps') +
        '<label class="pp-f"><span>ATL skills I used</span><div>' + ATL.map(function (a) { return '<label class="pp-chip" style="cursor:pointer"><input type="checkbox" data-ja="' + E(a) + '"' + ((ed.atl || []).indexOf(a) >= 0 ? ' checked' : '') + '> ' + E(a) + '</label>'; }).join('') + '</div></label>' +
        '<div class="pp-row"><button class="btn main sm" id="jn-save">' + (ed.id ? 'Save changes' : 'Add entry') + '</button>' + (ed.id ? '<button class="btn sm" id="jn-cancel">Cancel</button><span class="pp-muted">Earlier versions are kept for your supervisor.</span>' : '') + '</div></section>' +
        '<section class="pp-card"><h3>Your entries (' + J.length + ')</h3>' + (J.length ? '<ul class="pp-list">' + J.map(function (j) {
          return '<li><div class="pp-row" style="justify-content:space-between"><b>' + E(j.entry_date) + ' · ' + E((STAGES.filter(function (s) { return s[0] === j.stage; })[0] || [0, j.stage || ''])[1]) + '</b><button class="btn sm" data-ed="' + j.id + '">✏️ Edit</button></div>' +
            ['activity', 'learning', 'challenges', 'decisions', 'next_steps'].filter(function (k) { return j[k]; }).map(function (k) { return '<p style="margin:4px 0"><b>' + { activity: 'Did', learning: 'Learned', challenges: 'Challenges', decisions: 'Decisions', next_steps: 'Next' }[k] + ':</b> ' + E(j[k]) + '</p>'; }).join('') +
            (j.atl || []).map(function (a) { return '<span class="pp-chip">' + E(a) + '</span>'; }).join('') + ((j.history || []).length ? ' <small class="pp-muted">edited ' + j.history.length + '×</small>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="pp-muted">No entries yet. Write one each time you work on your project: it is your main evidence for criteria B and C.</p>') + '</section>';
      var $ = function (q) { return body.querySelector(q); };
      $('#jn-save').onclick = function () {
        var row = { entry_date: $('#jn-d').value, stage: $('#jn-s').value, activity: $('#jn-activity').value.trim(), learning: $('#jn-learning').value.trim(), challenges: $('#jn-challenges').value.trim(), decisions: $('#jn-decisions').value.trim(), next_steps: $('#jn-next_steps').value.trim(),
          atl: [].filter.call(body.querySelectorAll('[data-ja]'), function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-ja'); }) };
        if (!row.activity && !row.learning) { msg('Write at least what you did or what you learned.', true); return; }
        (ed.id ? S.db.from('pp_journal').update(row).eq('id', ed.id) : S.db.from('pp_journal').insert(Object.assign({ project_id: ST.p.id }, row))).then(function (x) { if (ok(x, ed.id ? 'Entry updated' : 'Entry added')) journal(body); });
      };
      if ($('#jn-cancel')) $('#jn-cancel').onclick = function () { journal(body); };
      [].forEach.call(body.querySelectorAll('[data-ed]'), function (b) { b.onclick = function () { journal(body, b.getAttribute('data-ed')); window.scrollTo({ top: 0, behavior: 'smooth' }); }; });
    });
  }

  /* evidence */
  function evidence(body) {
    S.db.from('pp_evidence').select('*').eq('project_id', ST.p.id).order('created_at', { ascending: false }).then(function (r) {
      var EV = r.data || [];
      body.innerHTML = '<section class="pp-card"><h3>Add evidence</h3><p class="pp-muted">Photos of your product as it develops, plans, test results, surveys, screenshots, or a link to a video. Files are private: only you and your supervisors can open them (up to 50 MB each).</p>' +
        '<div class="pp-g"><label class="pp-f"><span>Title</span><input id="ev-t" maxlength="120" placeholder="e.g. Prototype 2 after testing"></label><label class="pp-f"><span>Area</span><select id="ev-a"><option value="product">Product development</option><option value="research">Research</option><option value="atl">ATL skills</option><option value="journal">Journal</option><option value="exhibition">Exhibition</option><option value="general">Other</option></select></label>' +
        '<label class="pp-f"><span>Stage</span><select id="ev-s"><option value="">—</option><option value="design">Design</option><option value="prototype">Prototype</option><option value="test">Testing</option><option value="final">Final product</option></select></label></div>' +
        '<label class="pp-f"><span>Caption: what does this show?</span><input id="ev-c" maxlength="300"></label><div class="pp-g"><label class="pp-f"><span>File</span><input type="file" id="ev-f"></label><label class="pp-f"><span>…or a link</span><input type="url" id="ev-l" placeholder="https://"></label></div>' +
        '<div class="pp-row"><button class="btn main sm" id="ev-add">📎 Add evidence</button></div></section>' +
        '<section class="pp-card"><h3>Your evidence (' + EV.length + ')</h3>' + (EV.length ? '<ul class="pp-list">' + EV.map(function (e) { return '<li><div class="pp-row" style="justify-content:space-between"><b>' + E(e.title) + '</b><span><span class="pp-chip">' + E(e.area) + '</span>' + (e.stage ? '<span class="pp-chip">' + E(e.stage) + '</span>' : '') + '</span></div>' + (e.caption ? '<p style="margin:4px 0">' + E(e.caption) + '</p>' : '') +
          '<div class="pp-row">' + (e.path ? '<button class="btn sm" data-open="' + E(e.path) + '">Open file</button>' : '') + (e.link ? '<a class="btn sm" href="' + E(e.link) + '" target="_blank" rel="noopener">Open link</a>' : '') + '<button class="btn sm" data-rmv="' + e.id + '" data-p="' + E(e.path || '') + '">✕ Delete</button></div></li>'; }).join('') + '</ul>' : '<p class="pp-muted">No evidence yet.</p>') + '</section>';
      var $ = function (q) { return body.querySelector(q); };
      $('#ev-add').onclick = function () {
        var file = $('#ev-f').files[0], link = $('#ev-l').value.trim(), t = $('#ev-t').value.trim() || (file ? file.name : 'Evidence');
        if (!file && !/^https?:\/\//.test(link)) { msg('Choose a file or paste a link.', true); return; }
        if (file && file.size > 50 * 1024 * 1024) { msg('That file is over 50 MB.', true); return; }
        var row = { project_id: ST.p.id, title: t, area: $('#ev-a').value, stage: $('#ev-s').value || null, caption: $('#ev-c').value.trim() || null, link: link || null };
        var up = file ? S.db.storage.from('pp-files').upload(ST.p.id + '/' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_'), file, { contentType: file.type || 'application/octet-stream' }) : Promise.resolve({ data: null });
        msg('Uploading…');
        up.then(function (u) { if (u.error) { msg(S.nice(u.error), true); return; } if (u.data) { row.path = u.data.path; row.mime = file.type; row.size_bytes = file.size; }
          S.db.from('pp_evidence').insert(row).then(function (x) { if (ok(x, 'Evidence added')) evidence(body); }); });
      };
      [].forEach.call(body.querySelectorAll('[data-open]'), function (b) { b.onclick = function () { S.db.storage.from('pp-files').createSignedUrl(b.getAttribute('data-open'), 600).then(function (s) { if (s.error) msg(S.nice(s.error), true); else window.open(s.data.signedUrl, '_blank', 'noopener'); }); }; });
      [].forEach.call(body.querySelectorAll('[data-rmv]'), function (b) { b.onclick = function () { if (!confirm('Delete this evidence? The file is removed too.')) return; var p = b.getAttribute('data-p');
        (p ? S.db.storage.from('pp-files').remove([p]) : Promise.resolve({})).then(function () { S.db.from('pp_evidence').delete().eq('id', b.getAttribute('data-rmv')).then(function (x) { if (ok(x, 'Deleted')) evidence(body); }); }); }; });
    });
  }

  /* sources */
  function sources(body) {
    S.db.from('pp_sources').select('*').eq('project_id', ST.p.id).order('created_at').then(function (r) {
      var SR = r.data || [], Q = [['relevance', 'Relevant to my goal'], ['authority', 'Author is an expert'], ['accuracy', 'Accurate, with evidence'], ['currency', 'Up to date'], ['purpose', 'Purpose is to inform, not to sell']];
      body.innerHTML = '<section class="pp-card"><h3>Add a source</h3><label class="pp-f"><span>Full reference</span><textarea id="sr-c" rows="2" placeholder="Author (year). Title. Publisher or website. URL (accessed date)."></textarea><small>Use the referencing style your school uses. Your bibliography is uploaded separately and does not count towards the page limit.</small></label>' +
        '<div class="pp-g"><label class="pp-f"><span>Link</span><input id="sr-u" type="url" placeholder="https://"></label><label class="pp-f"><span>Type</span><select id="sr-k"><option>Website</option><option>Book</option><option>Journal article</option><option>Video</option><option>Interview or expert</option><option>Other</option></select></label></div>' +
        '<p style="margin:6px 0"><b>Evaluate it</b> <small class="pp-muted">(1 = weak, 3 = strong)</small></p><div class="pp-g">' + Q.map(function (q) { return '<label class="pp-f"><span>' + q[1] + '</span><select data-q="' + q[0] + '"><option value="">—</option><option>1</option><option>2</option><option>3</option></select></label>'; }).join('') + '</div>' +
        '<label class="pp-f"><span>How you used it</span><input id="sr-n" maxlength="300"></label><button class="btn main sm" id="sr-add">📚 Add source</button></section>' +
        '<section class="pp-card"><h3>Your sources (' + SR.length + ')</h3>' + (SR.length ? '<ul class="pp-list">' + SR.map(function (s) { var ev = s.evaluation || {}, sc = Q.map(function (q) { return +ev[q[0]] || 0; }).filter(Boolean), avg = sc.length ? sc.reduce(function (a, b) { return a + b; }, 0) / sc.length : 0;
          return '<li>' + E(s.citation) + (s.url ? ' <a href="' + E(s.url) + '" target="_blank" rel="noopener">link</a>' : '') + '<br><span class="pp-chip">' + E(s.kind || '') + '</span>' + (avg ? '<span class="pp-chip" style="background:' + (avg >= 2.5 ? '#DCFCE7' : avg >= 1.8 ? '#FEF3C7' : '#FEE2E2') + '">reliability ' + avg.toFixed(1) + '/3</span>' : '') + (s.notes ? '<br><small class="pp-muted">' + E(s.notes) + '</small>' : '') + ' <button class="btn sm" data-rs="' + s.id + '">✕</button></li>'; }).join('') + '</ul>' +
          '<p><button class="btn sm" id="sr-copy">📋 Copy my bibliography</button></p>' : '<p class="pp-muted">No sources yet.</p>') + '</section>';
      var $ = function (q) { return body.querySelector(q); };
      $('#sr-add').onclick = function () { var c = $('#sr-c').value.trim(); if (!c) { msg('Write the reference first.', true); return; }
        var ev = {}; [].forEach.call(body.querySelectorAll('[data-q]'), function (s) { if (s.value) ev[s.getAttribute('data-q')] = +s.value; });
        S.db.from('pp_sources').insert({ project_id: ST.p.id, citation: c, url: $('#sr-u').value.trim() || null, kind: $('#sr-k').value, notes: $('#sr-n').value.trim() || null, evaluation: ev }).then(function (x) { if (ok(x, 'Source added')) sources(body); }); };
      [].forEach.call(body.querySelectorAll('[data-rs]'), function (b) { b.onclick = function () { S.db.from('pp_sources').delete().eq('id', b.getAttribute('data-rs')).then(function (x) { if (ok(x, 'Deleted')) sources(body); }); }; });
      if ($('#sr-copy')) $('#sr-copy').onclick = function () { var t = SR.map(function (s) { return s.citation; }).sort(function (a, b) { return a.localeCompare(b); }).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { msg('Bibliography copied, in alphabetical order.'); }, function () { msg('Copy did not work in this browser.', true); }); };
    });
  }

  /* report */
  function report(body) {
    var g = (ST.guide && ST.guide.report) || {}, secs = (g.sections || []).filter(function (s) { return s.key !== 'references'; }), d = D(), rp = d.report || (d.report = {}), notes = g.notes || [];
    var final = ['final_submitted', 'completed'].indexOf(ST.p.status) >= 0;
    body.innerHTML = (ST.p.status === 'proposal_submitted' ? '<p class="pp-tip">Your proposal is waiting for your supervisor. You can keep drafting; submit the final report after it has been approved.</p>' : '') + '<section class="pp-card"><h3>Report rules</h3><ul>' + notes.map(function (n) { return '<li>' + E(n) + '</li>'; }).join('') + '</ul><p class="pp-muted">Source: ' + E(ST.guide ? ST.guide.source : '') + '</p></section>' +
      '<section class="pp-card"><h3>Draft your report</h3><p class="pp-muted">Write each section in your own words. Use your journal, evidence and sources. Your draft saves as you type; use <b>Save a version</b> to keep a copy your supervisor can see.</p>' +
      secs.map(function (s) { return '<label class="pp-f"><span>' + E(s.label) + (s.criterion ? ' <span class="pp-chip">Criterion ' + E(s.criterion) + '</span>' : '') + '</span><textarea data-sec="' + E(s.key) + '" rows="5">' + E(rp[s.key] || '') + '</textarea><small data-wc="' + E(s.key) + '"></small></label>'; }).join('') +
      '<div class="pp-row"><button class="btn sm" id="rp-ver">💾 Save a version</button><span class="pp-muted" id="rp-tot"></span></div><div class="pp-meter" style="margin-top:8px"><i id="rp-bar" style="width:0"></i></div><p class="pp-muted" id="rp-pages"></p></section>' +
      '<section class="pp-card"><h3>Submit your final report</h3>' + (final ? '<p class="pp-tip pp-ok">✓ Your final report has been submitted.</p>' :
        '<p class="pp-muted">Write and format your report in a word processor (at least 11-point font, 2 cm margins, no title page), then upload it here as .docx, .doc, .rtf or non-editable .pdf. Upload your bibliography as a separate file.</p>' +
        '<div class="pp-g"><label class="pp-f"><span>Final report file</span><input type="file" id="rp-f" accept=".doc,.docx,.pdf,.rtf"></label><label class="pp-f"><span>Bibliography file</span><input type="file" id="rp-b" accept=".doc,.docx,.pdf,.rtf"></label><label class="pp-f"><span>Recording (optional)</span><input type="file" id="rp-r" accept=".mp3,.m4a,.mp4,.mov,.m4v"></label></div>' +
        '<label class="pp-f"><span>Number of pages in your report</span><input type="number" id="rp-n" min="1" max="15" style="max-width:120px"></label>' +
        '<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="rp-h"> <span>I confirm this report is my own work, that I have acknowledged every source I used, and that I have completed my school\'s academic integrity form.</span></label>' +
        '<div class="pp-row" style="margin-top:10px"><button class="btn main sm" id="rp-sub">📤 Submit final report</button></div>') + '</section>';
    var $ = function (q) { return body.querySelector(q); };
    function count() { var tot = 0; secs.forEach(function (s) { var w = words(rp[s.key]); tot += w; var el = body.querySelector('[data-wc="' + s.key + '"]'); if (el) el.textContent = w + ' words'; });
      var pages = Math.ceil(tot / 450); $('#rp-tot').textContent = tot + ' words in total'; $('#rp-bar').style.width = Math.min(100, pages / (g.max_pages || 15) * 100) + '%';
      $('#rp-pages').textContent = 'About ' + pages + ' page' + (pages === 1 ? '' : 's') + ' of text at 11-point font (a rough guide only: images and headings add more). The limit is ' + (g.max_pages || 15) + ' pages, or fewer if you include a recording.'; }
    count();
    [].forEach.call(body.querySelectorAll('[data-sec]'), function (t) { t.oninput = function () { rp[t.getAttribute('data-sec')] = t.value; count(); saveData(); }; });
    $('#rp-ver').onclick = function () { var tot = secs.reduce(function (n, s) { return n + words(rp[s.key]); }, 0);
      S.db.from('pp_report_versions').insert({ project_id: ST.p.id, label: 'Draft ' + new Date().toLocaleString(), sections: rp, words: tot }).then(function (x) { ok(x, 'Version saved for your supervisor'); }); };
    var sub = $('#rp-sub'); if (sub) sub.onclick = function () {
      var f = $('#rp-f').files[0], b = $('#rp-b').files[0], rec = $('#rp-r').files[0], n = +$('#rp-n').value;
      if (!f) { msg('Choose your final report file.', true); return; }
      if (!/\.(docx?|pdf|rtf)$/i.test(f.name)) { msg('The report must be .doc, .docx, .pdf or .rtf.', true); return; }
      if (!$('#rp-h').checked) { msg('Tick the academic integrity statement first.', true); return; }
      if (n > (g.max_pages || 15)) { msg('Your report is over ' + (g.max_pages || 15) + ' pages.', true); return; }
      if (rec && n && n > 14) { msg('With a recording the page limit is lower: 14 pages with up to 1 minute, down to 5 pages with up to 10 minutes.', true); return; }
      if (!confirm('Submit your final report now? Your supervisor will be able to assess it.')) return;
      sub.disabled = true; msg('Uploading…');
      var put = function (file, kind) { if (!file) return Promise.resolve(null); var path = ST.p.id + '/final-' + kind + '-' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_');
        return S.db.storage.from('pp-files').upload(path, file, { contentType: file.type || 'application/octet-stream' }).then(function (u) { if (u.error) throw u.error; return { path: path, name: file.name }; }); };
      Promise.all([put(f, 'report'), put(b, 'bibliography'), put(rec, 'recording')]).then(function (x) {
        var tot = secs.reduce(function (s2, s) { return s2 + words(rp[s.key]); }, 0);
        return S.db.from('pp_submissions').insert({ project_id: ST.p.id, kind: 'report_final', path: x[0].path, filename: x[0].name, words: tot, academic_honesty: true,
          note: 'Pages: ' + (n || '?') + (x[1] ? ' · bibliography: ' + x[1].path : '') + (x[2] ? ' · recording: ' + x[2].path : '') }).then(function (r) { if (r.error) throw r.error;
          return S.db.from('pp_projects').update({ status: 'final_submitted' }).eq('id', ST.p.id).select('status').single(); });
      }).then(function (r) { sub.disabled = false; if (!ok(r, 'Final report submitted.')) return; ST.p.status = r.data.status; shell(); }, function (e) { sub.disabled = false; msg(S.nice(e), true); });
    };
  }

  /* self-assessment with the official descriptors */
  function assess(body) {
    var C = (ST.guide && ST.guide.criteria) || [];
    S.db.from('pp_assessments').select('*').eq('project_id', ST.p.id).then(function (r) {
      var mine = (r.data || []).filter(function (a) { return a.kind === 'self'; })[0] || { levels: {}, comments: {} }, teach = (r.data || []).filter(function (a) { return a.kind === 'teacher'; })[0];
      var L = Object.assign({}, mine.levels), K = Object.assign({}, mine.comments);
      function draw() {
        var y = window.scrollY;
        body.innerHTML = '<section class="pp-card"><h3>Self-assessment</h3><p class="pp-muted">Read the descriptors for each criterion, choose the band that best fits your report, pick a level and say why. This helps you improve before you submit; your supervisor gives the real marks. Descriptors from the ' + E(ST.guide ? ST.guide.source : 'IB guide') + '.</p></section>' +
          C.map(function (c) { var bands = (c.bands || []).slice().sort(function (a, b) { return b.min - a.min; }), lvl = L[c.key];
            return '<section class="pp-card"><h3>Criterion ' + E(c.key) + ': ' + E(c.name) + ' <small class="pp-muted">(maximum ' + c.max + ')</small></h3><p class="pp-muted">Strands: ' + (c.strands || []).map(E).join('; ') + '</p>' +
              (bands.length ? '' : '<p class="pp-tip">The descriptors for this criterion have not been entered yet.</p>') +
              bands.map(function (b) { var sel = lvl != null && lvl >= b.min && lvl <= b.max; return '<div class="pp-band' + (sel ? ' sel' : '') + '" data-c="' + c.key + '" data-max="' + b.max + '" data-min="' + b.min + '" tabindex="0" role="button" aria-pressed="' + sel + '"><b>Band ' + b.min + '–' + b.max + '</b><ul style="margin:4px 0 0">' + (b.d || []).map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul>' +
                (sel ? '<div class="pp-row" style="margin-top:6px">Level: ' + [b.min, b.max].map(function (v) { return '<label><input type="radio" name="lv-' + c.key + '" value="' + v + '"' + (lvl === v ? ' checked' : '') + '> ' + v + '</label>'; }).join(' ') + '</div>' : '') + '</div>'; }).join('') +
              '<p class="pp-muted" style="margin:6px 0 0"><label><input type="radio" name="z-' + c.key + '" data-zero="' + c.key + '"' + (lvl === 0 ? ' checked' : '') + '> Level 0: does not reach any band</label></p>' +
              '<label class="pp-f" style="margin-top:8px"><span>Why? Point to evidence in your report</span><textarea data-why="' + c.key + '" rows="2">' + E(K[c.key] || '') + '</textarea></label>' +
              (teach && teach.levels && teach.levels[c.key] != null ? '<p class="pp-tip pp-ok">Your supervisor: level ' + teach.levels[c.key] + (teach.comments && teach.comments[c.key] ? ' · ' + E(teach.comments[c.key]) : '') + '</p>' : '') + '</section>'; }).join('') +
          '<div class="pp-row"><button class="btn main sm" id="as-save">💾 Save my self-assessment</button><b id="as-tot"></b></div>';
        tot(); wire(); window.scrollTo(0, y);
      }
      function tot() { body.querySelector('#as-tot').textContent = 'Total: ' + C.reduce(function (s, c) { return s + (+L[c.key] || 0); }, 0) + ' / ' + C.reduce(function (s, c) { return s + c.max; }, 0); }
      function wire() {
        [].forEach.call(body.querySelectorAll('.pp-band'), function (b) { var pick = function (e) { if (e && e.target.tagName === 'INPUT') return; var c = b.getAttribute('data-c'), lo = +b.getAttribute('data-min'), hi = +b.getAttribute('data-max'); if (!(L[c] >= lo && L[c] <= hi)) { L[c] = hi; draw(); } };
          b.onclick = pick; b.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }; });
        [].forEach.call(body.querySelectorAll('input[name^="lv-"]'), function (r2) { r2.onchange = function () { L[r2.name.slice(3)] = +r2.value; tot(); }; });
        [].forEach.call(body.querySelectorAll('[data-zero]'), function (r2) { r2.onchange = function () { L[r2.getAttribute('data-zero')] = 0; draw(); }; });
        [].forEach.call(body.querySelectorAll('[data-why]'), function (t) { t.oninput = function () { K[t.getAttribute('data-why')] = t.value; }; });
        body.querySelector('#as-save').onclick = function () { S.db.from('pp_assessments').upsert({ project_id: ST.p.id, assessor_id: ST.me.user.id, kind: 'self', levels: L, comments: K, updated_at: new Date().toISOString() }, { onConflict: 'project_id,assessor_id,kind' }).then(function (x) { ok(x, 'Self-assessment saved'); }); };
      }
      draw();
    });
  }

  /* feedback */
  function feedback(body) {
    S.db.from('pp_feedback').select('*').eq('project_id', ST.p.id).order('created_at', { ascending: false }).then(function (r) {
      var F = r.data || [];
      body.innerHTML = '<section class="pp-card"><h3>Feedback from your supervisor</h3>' + (F.length ? '<ul class="pp-list">' + F.map(function (f) { var mine = f.author_id === ST.me.user.id;
        return '<li style="' + (f.resolved ? 'opacity:.6' : '') + '"><div class="pp-row" style="justify-content:space-between"><span class="pp-chip">' + E(f.target) + '</span><small class="pp-muted">' + new Date(f.created_at).toLocaleString() + (mine ? ' · you' : '') + '</small></div><p style="margin:6px 0">' + E(f.comment) + '</p>' +
          (f.resolved ? '<small class="pp-muted">✓ Done</small>' : '<button class="btn sm" data-rs="' + f.id + '">✓ Mark as done</button>') + '</li>'; }).join('') + '</ul>' : '<p class="pp-muted">No feedback yet.</p>') + '</section>' +
        '<section class="pp-card"><h3>Ask your supervisor</h3><label class="pp-f"><span>Your question or note</span><textarea id="fb-q" rows="2"></textarea></label><button class="btn sm" id="fb-send">Send</button></section>';
      [].forEach.call(body.querySelectorAll('[data-rs]'), function (b) { b.onclick = function () { S.db.from('pp_feedback').update({ resolved: true }).eq('id', b.getAttribute('data-rs')).then(function (x) { if (ok(x, 'Marked as done')) feedback(body); }); }; });
      body.querySelector('#fb-send').onclick = function () { var q = body.querySelector('#fb-q').value.trim(); if (!q) return; S.db.from('pp_feedback').insert({ project_id: ST.p.id, author_id: ST.me.user.id, target: 'question', comment: q }).then(function (x) { if (ok(x, 'Sent')) feedback(body); }); };
    });
  }

  /* =================== supervisors and coordinators (part 2) =================== */
  var SVS = { proposal_submitted: 'Proposal to review', final_submitted: 'Final report to assess', returned: 'Returned to the student', active: 'Working' };
  function svs(k) { return SVS[k] || STATUS[k] || k; }
  var SV = { P: [], NM: {}, CO: [], T: [], filter: { st: '', co: '', mine: false, q: '' } };
  function supervisorList() {
    css();
    Promise.all([S.db.from('pp_projects').select('id,title,status,updated_at,student_id,supervisor_id,cohort_id,class_id').neq('status', 'archived').order('updated_at', { ascending: false }).limit(500),
      S.db.from('pp_cohorts').select('*').eq('archived', false).order('created_at', { ascending: false }), S.db.rpc('pp_teachers')]).then(function (x) {
      SV.P = (x[0].data || []).filter(function (p) { return p.student_id !== ST.me.user.id; }); SV.CO = x[1].data || []; SV.T = x[2].data || [];
      return (SV.P.length ? S.db.rpc('pp_names', { pids: SV.P.map(function (p) { return p.id; }) }) : Promise.resolve({ data: [] })).then(function (n) {
        SV.NM = {}; (n.data || []).forEach(function (r) { SV.NM[r.project_id] = r; }); svList();
      });
    });
  }
  function svList() {
    var f = SV.filter, me = ST.me.user.id, coName = {}; SV.CO.forEach(function (c) { coName[c.id] = c.name; });
    var P = SV.P.filter(function (p) { var n = SV.NM[p.id] || {}; return (!f.st || p.status === f.st) && (!f.co || p.cohort_id === f.co) && (!f.mine || p.supervisor_id === me) && (!f.q || ((n.student_name || '') + ' ' + p.title).toLowerCase().indexOf(f.q) >= 0); });
    var waiting = SV.P.filter(function (p) { return p.status === 'proposal_submitted' || p.status === 'final_submitted'; }).length;
    app.innerHTML = '<div id="pp">' + hero('Personal projects', 'Supervise, give feedback, approve proposals and assess with the official criteria. ' + (waiting ? waiting + ' waiting for you.' : '')) +
      '<nav class="pp-tabs"><button aria-selected="true">📋 Projects (' + SV.P.length + ')</button><button id="sv-co">👥 Groups and deadlines (' + SV.CO.length + ')</button></nav><p id="pp-msg" role="status" class="pp-muted" style="min-height:1.2em"></p>' +
      '<section class="pp-card"><div class="pp-row"><input id="sv-q" type="search" placeholder="Search student or title" value="' + E(f.q) + '" style="flex:1;min-width:200px;padding:8px;border-radius:10px;border:1px solid #cbd5e1">' +
      '<select id="sv-st"><option value="">All statuses</option>' + Object.keys(STATUS).filter(function (k) { return k !== 'archived'; }).map(function (k) { return '<option value="' + k + '"' + (f.st === k ? ' selected' : '') + '>' + E(svs(k)) + '</option>'; }).join('') + '</select>' +
      '<select id="sv-cf"><option value="">All groups</option>' + SV.CO.map(function (c) { return '<option value="' + c.id + '"' + (f.co === c.id ? ' selected' : '') + '>' + E(c.name) + '</option>'; }).join('') + '</select>' +
      '<label class="pp-muted"><input type="checkbox" id="sv-mine"' + (f.mine ? ' checked' : '') + '> Only mine</label></div></section>' +
      '<section class="pp-card">' + (P.length ? '<div style="overflow-x:auto"><table class="marks" style="width:100%"><tr><th>Student</th><th>Project</th><th>Status</th><th>Group</th><th>Supervisor</th><th>Updated</th><th></th></tr>' + P.map(function (p) { var n = SV.NM[p.id] || {};
        return '<tr><td><b>' + E(n.student_name || 'Student') + '</b></td><td>' + E(p.title) + '</td><td><span class="pp-chip"' + (/submitted/.test(p.status) ? ' style="background:#FEF3C7;color:#92400E"' : '') + '>' + E(svs(p.status)) + '</span></td><td>' + E(coName[p.cohort_id] || '—') + '</td>' +
          '<td><select data-sup="' + p.id + '" aria-label="Supervisor"><option value="">— none —</option>' + SV.T.map(function (t) { return '<option value="' + t.id + '"' + (p.supervisor_id === t.id ? ' selected' : '') + '>' + E(t.full_name || 'Teacher') + '</option>'; }).join('') + '</select></td>' +
          '<td class="small">' + new Date(p.updated_at).toLocaleDateString() + '</td><td><button class="btn sm main" data-open="' + p.id + '">Open</button></td></tr>'; }).join('') + '</table></div>' : '<p class="pp-muted">No projects match. Students start their projects on this page.</p>') + '</section></div>';
    var $ = function (q) { return app.querySelector(q); };
    $('#sv-q').oninput = function () { f.q = this.value.trim().toLowerCase(); clearTimeout(svList.t); svList.t = setTimeout(svList, 300); };
    $('#sv-st').onchange = function () { f.st = this.value; svList(); }; $('#sv-cf').onchange = function () { f.co = this.value; svList(); }; $('#sv-mine').onchange = function () { f.mine = this.checked; svList(); };
    $('#sv-co').onclick = cohorts;
    [].forEach.call(app.querySelectorAll('[data-sup]'), function (s) { s.onchange = function () { var id = s.getAttribute('data-sup');
      S.db.from('pp_projects').update({ supervisor_id: s.value || null }).eq('id', id).then(function (r) { if (ok(r, 'Supervisor saved')) SV.P.forEach(function (p) { if (p.id === id) p.supervisor_id = s.value || null; }); }); }; });
    [].forEach.call(app.querySelectorAll('[data-open]'), function (b) { b.onclick = function () { svOpen(b.getAttribute('data-open')); }; });
  }

  /* groups (cohorts) and their deadlines */
  function cohorts() {
    app.innerHTML = '<div id="pp">' + hero('Groups and deadlines', 'A group is one year\'s personal project students. Set its deadlines and exhibition; students choose their group when they start.') +
      '<nav class="pp-tabs"><button id="sv-back">📋 Projects</button><button aria-selected="true">👥 Groups and deadlines</button></nav><p id="pp-msg" role="status" class="pp-muted" style="min-height:1.2em"></p>' +
      '<section class="pp-card"><h3>New group</h3><div class="pp-row"><input id="co-n" placeholder="e.g. MYP 5 Personal Project 2026–27" style="flex:2;min-width:220px;padding:8px;border-radius:10px;border:1px solid #cbd5e1"><input id="co-y" placeholder="Year" style="width:110px;padding:8px;border-radius:10px;border:1px solid #cbd5e1"><button class="btn main sm" id="co-add">Create group</button></div></section>' +
      SV.CO.map(function (c) { var dl = c.deadlines || [], ex = c.exhibition || {}, mineC = c.created_by === ST.me.user.id || ST.me.admin;
        return '<section class="pp-card" data-co="' + c.id + '"><h3>' + E(c.name) + (c.year ? ' <small class="pp-muted">' + E(c.year) + '</small>' : '') + ' <small class="pp-muted">· ' + SV.P.filter(function (p) { return p.cohort_id === c.id; }).length + ' projects</small></h3>' +
          '<ul class="pp-list" data-dl>' + dl.map(function (d, i) { return '<li class="pp-row"><input data-dlab="' + i + '" value="' + E(d.label) + '"' + (mineC ? '' : ' disabled') + ' style="flex:2;padding:6px;border-radius:8px;border:1px solid #cbd5e1"><input type="date" data-ddue="' + i + '" value="' + E(d.due || '') + '"' + (mineC ? '' : ' disabled') + '>' + (mineC ? '<button class="btn sm" data-drm="' + i + '">✕</button>' : '') + '</li>'; }).join('') + '</ul>' +
          (mineC ? '<div class="pp-row" style="margin-top:8px"><button class="btn sm" data-dadd>➕ Add a deadline</button><button class="btn sm" data-dstd>Add the usual milestones</button></div>' +
          '<div class="pp-g" style="margin-top:10px"><label class="pp-f"><span>Exhibition date</span><input type="date" data-exd value="' + E(ex.date || '') + '"></label><label class="pp-f"><span>Venue</span><input data-exv value="' + E(ex.venue || '') + '"></label></div>' +
          '<div class="pp-row"><button class="btn main sm" data-csave>💾 Save group</button><button class="btn sm" data-carch>Archive group</button></div>' : '<p class="pp-muted">Only the teacher who created this group can change it.</p>') + '</section>'; }).join('') + '</div>';
    app.querySelector('#sv-back').onclick = svList;
    app.querySelector('#co-add').onclick = function () { var n = app.querySelector('#co-n').value.trim(); if (!n) { msg('Name the group first.', true); return; }
      S.db.from('pp_cohorts').insert({ name: n, year: app.querySelector('#co-y').value.trim() || null, guide_id: GUIDE_ID, deadlines: [] }).select('*').single().then(function (r) { if (ok(r, 'Group created')) { SV.CO.unshift(r.data); cohorts(); } }); };
    [].forEach.call(app.querySelectorAll('[data-co]'), function (sec) {
      var c = SV.CO.filter(function (x) { return x.id === sec.getAttribute('data-co'); })[0], q = function (s) { return sec.querySelector(s); };
      function collect() { c.deadlines = [].map.call(sec.querySelectorAll('[data-dlab]'), function (i) { var k = i.getAttribute('data-dlab'); return { label: i.value.trim(), due: (sec.querySelector('[data-ddue="' + k + '"]') || {}).value || '' }; }).filter(function (d) { return d.label; }); }
      if (q('[data-dadd]')) q('[data-dadd]').onclick = function () { collect(); c.deadlines.push({ label: 'New deadline', due: '' }); cohorts(); };
      if (q('[data-dstd]')) q('[data-dstd]').onclick = function () { collect(); ['Proposal: learning goal, product and success criteria', 'Plan and timeline checked by supervisor', 'Process journal check', 'Product finished', 'Report draft to supervisor', 'Final report submitted', 'Exhibition'].forEach(function (l) { if (!c.deadlines.some(function (d) { return d.label === l; })) c.deadlines.push({ label: l, due: '' }); }); cohorts(); };
      [].forEach.call(sec.querySelectorAll('[data-drm]'), function (b) { b.onclick = function () { collect(); c.deadlines.splice(+b.getAttribute('data-drm'), 1); cohorts(); }; });
      if (q('[data-csave]')) q('[data-csave]').onclick = function () { collect(); c.exhibition = { date: q('[data-exd]').value || null, venue: q('[data-exv]').value.trim() || null };
        S.db.from('pp_cohorts').update({ deadlines: c.deadlines, exhibition: c.exhibition }).eq('id', c.id).then(function (r) { ok(r, 'Group saved'); }); };
      if (q('[data-carch]')) q('[data-carch]').onclick = function () { if (!confirm('Archive this group? Students keep their projects; the group no longer appears for new students.')) return;
        S.db.from('pp_cohorts').update({ archived: true }).eq('id', c.id).then(function (r) { if (ok(r, 'Archived')) { SV.CO = SV.CO.filter(function (x) { return x.id !== c.id; }); cohorts(); } }); };
    });
  }

  /* one project, as the supervisor sees it */
  var SVT = [['ov', '🏠 Overview'], ['plan', '🎯 Plan'], ['journal', '📓 Journal'], ['evidence', '📎 Evidence'], ['sources', '📚 Sources'], ['report', '📝 Report'], ['assess', '🧮 Assess'], ['feedback', '💬 Feedback']];
  function svOpen(pid, tab) {
    S.db.from('pp_projects').select('*').eq('id', pid).maybeSingle().then(function (r) {
      var p = r.data; if (!p) { msg('Could not open that project.', true); return; }
      var n = SV.NM[pid] || {}, co = SV.CO.filter(function (c) { return c.id === p.cohort_id; })[0];
      tab = tab || 'ov';
      app.innerHTML = '<div id="pp">' + hero(p.title, (n.student_name || 'Student') + ' · ' + svs(p.status) + (n.supervisor_name ? ' · Supervisor: ' + n.supervisor_name : '') + (co ? ' · ' + co.name : '')) +
        '<nav class="pp-tabs"><button id="sv-back">← All projects</button>' + SVT.map(function (t) { return '<button data-svt="' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</button>'; }).join('') + '</nav>' +
        '<p id="pp-msg" role="status" class="pp-muted" style="min-height:1.2em"></p><div id="sv-body"><p class="pp-muted">Loading…</p></div></div>';
      app.querySelector('#sv-back').onclick = function () { supervisorList(); };
      [].forEach.call(app.querySelectorAll('[data-svt]'), function (b) { b.onclick = function () { svOpen(pid, b.getAttribute('data-svt')); }; });
      var body = app.querySelector('#sv-body');
      ({ ov: svOverview, plan: svPlan, journal: svJournal, evidence: svEvidence, sources: svSources, report: svReport, assess: svAssess, feedback: svFeedback })[tab](body, p);
    });
  }
  function fbBox(p, target, label) { return '<div class="pp-row" style="margin-top:8px" data-fbbox="' + E(target) + '"><input placeholder="' + E(label || 'Feedback on this part…') + '" style="flex:1;min-width:220px;padding:8px;border-radius:10px;border:1px solid #cbd5e1"><button class="btn sm">💬 Send feedback</button></div>'; }
  function wireFb(body, p) { [].forEach.call(body.querySelectorAll('[data-fbbox]'), function (w) { var i = w.querySelector('input'), b = w.querySelector('button');
    b.onclick = function () { var t = i.value.trim(); if (!t) return; S.db.from('pp_feedback').insert({ project_id: p.id, author_id: ST.me.user.id, target: w.getAttribute('data-fbbox'), comment: t }).then(function (r) { if (ok(r, 'Feedback sent to the student')) i.value = ''; }); }; }); }
  function setStatus(p, st, note) {
    return S.db.from('pp_projects').update({ status: st }).eq('id', p.id).then(function (r) {
      if (!ok(r, 'Status: ' + svs(st))) return;
      SV.P.forEach(function (x) { if (x.id === p.id) x.status = st; });
      if (note) S.db.from('pp_feedback').insert({ project_id: p.id, author_id: ST.me.user.id, target: st === 'returned' ? 'proposal' : 'project', comment: note }).then(function () {});
      svOpen(p.id, 'ov');
    });
  }
  function svOverview(body, p) {
    Promise.all([S.db.from('pp_journal').select('entry_date', { count: 'exact' }).eq('project_id', p.id).order('entry_date', { ascending: false }).limit(1), S.db.from('pp_evidence').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
      S.db.from('pp_sources').select('id', { count: 'exact', head: true }).eq('project_id', p.id), S.db.from('pp_tasks').select('status,due_on').eq('project_id', p.id), S.db.from('pp_submissions').select('*').eq('project_id', p.id).order('created_at', { ascending: false })]).then(function (x) {
      var T = x[3].data || [], today = new Date().toISOString().slice(0, 10), late = T.filter(function (t) { return t.status !== 'done' && t.due_on && t.due_on < today; }).length, SUB = x[4].data || [], lastJ = (x[0].data || [])[0];
      var act = p.status === 'proposal_submitted' ? '<section class="pp-card" style="border:2px solid #F59E0B"><h3>Proposal waiting for you</h3><p class="pp-muted">Read the <b>Plan</b> tab, then approve it or return it with feedback.</p><label class="pp-f"><span>Message to the student (needed to return it)</span><textarea id="ov-note" rows="2"></textarea></label><div class="pp-row"><button class="btn main sm" id="ov-ok">✓ Approve the proposal</button><button class="btn sm" id="ov-ret">↩ Return with feedback</button></div></section>'
        : p.status === 'final_submitted' ? '<section class="pp-card" style="border:2px solid #7C3AED"><h3>Final report submitted</h3><p class="pp-muted">Open the <b>Report</b> tab to download it, then assess it in <b>Assess</b>. Mark the project complete when you have finished.</p><button class="btn main sm" id="ov-done">✓ Mark the project completed</button> <button class="btn sm" id="ov-reopen">↩ Return the final report</button></section>' : '';
      body.innerHTML = act + '<div class="pp-g"><section class="pp-card"><h3>Activity</h3><p>📓 ' + (x[0].count || 0) + ' journal entries' + (lastJ ? ' (latest ' + E(lastJ.entry_date) + ')' : '') + '<br>📎 ' + (x[1].count || 0) + ' evidence<br>📚 ' + (x[2].count || 0) + ' sources<br>🗓 ' + T.filter(function (t) { return t.status === 'done'; }).length + ' / ' + T.length + ' tasks done' + (late ? ' · <b style="color:#B91C1C">' + late + ' late</b>' : '') + '</p></section>' +
        '<section class="pp-card"><h3>Submissions</h3>' + (SUB.length ? '<ul class="pp-list">' + SUB.map(function (s) { return '<li><b>' + E({ proposal: 'Proposal', report_draft: 'Report draft', report_final: 'Final report', exhibition: 'Exhibition' }[s.kind] || s.kind) + '</b> · ' + new Date(s.created_at).toLocaleString() + (s.path ? ' <button class="btn sm" data-dl="' + E(s.path) + '">⬇ ' + E(s.filename || 'file') + '</button>' : '') + (s.note ? '<br><small class="pp-muted">' + E(s.note) + '</small>' : '') + (s.academic_honesty ? '<br><small>✓ Academic integrity statement ticked</small>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="pp-muted">Nothing submitted yet.</p>') + '</section></div>' +
        '<section class="pp-card"><h3>General feedback</h3>' + fbBox(p, 'project') + '</section>';
      wireFb(body, p); wireDl(body);
      var $ = function (q) { return body.querySelector(q); };
      if ($('#ov-ok')) $('#ov-ok').onclick = function () { setStatus(p, 'proposal_approved', ($('#ov-note').value.trim() || null)); };
      if ($('#ov-ret')) $('#ov-ret').onclick = function () { var t = $('#ov-note').value.trim(); if (!t) { msg('Write what the student should change.', true); return; } setStatus(p, 'returned', t); };
      if ($('#ov-done')) $('#ov-done').onclick = function () { if (confirm('Mark this project as completed?')) setStatus(p, 'completed'); };
      if ($('#ov-reopen')) $('#ov-reopen').onclick = function () { var t = prompt('What should the student change before submitting again?'); if (t) setStatus(p, 'returned', t); };
    });
  }
  function wireDl(root) { [].forEach.call(root.querySelectorAll('[data-dl]'), function (b) { b.onclick = function () { S.db.storage.from('pp-files').createSignedUrl(b.getAttribute('data-dl'), 600).then(function (s) { if (s.error) msg(S.nice(s.error), true); else window.open(s.data.signedUrl, '_blank', 'noopener'); }); }; }); }
  function svPlan(body, p) {
    var d = p.data || {}, cx = d.context || {}, ctx = CONTEXTS.filter(function (c) { return c[0] === cx.key; })[0];
    body.innerHTML = '<section class="pp-card"><h3>Learning goal</h3><p><b>Personal interest:</b> ' + E(d.interest || '—') + '</p><p><b>Learning goal:</b> ' + E(d.goal || '—') + '</p>' + fbBox(p, 'goal') + '</section>' +
      '<section class="pp-card"><h3>Global context</h3><p><b>' + E(ctx ? ctx[1] : '—') + '</b></p><p>' + E(cx.exploration || '') + '</p></section>' +
      '<section class="pp-card"><h3>Product and success criteria</h3><p><b>Product:</b> ' + E(d.product || '—') + '</p>' + ((d.criteria || []).length ? '<ol>' + d.criteria.map(function (c) { return '<li>' + E(c.c) + (c.how ? ' <small class="pp-muted">· checked by: ' + E(c.how) + '</small>' : '') + '</li>'; }).join('') + '</ol>' : '<p class="pp-muted">No success criteria yet.</p>') + fbBox(p, 'criteria') + '</section>' +
      '<section class="pp-card"><h3>Plan</h3><p style="white-space:pre-wrap">' + E(d.plan_notes || '—') + '</p><p>' + (d.atl_plan || []).map(function (a) { return '<span class="pp-chip">' + E(a) + '</span>'; }).join('') + '</p>' + fbBox(p, 'plan') + '</section>';
    wireFb(body, p);
  }
  function svJournal(body, p) {
    S.db.from('pp_journal').select('*').eq('project_id', p.id).order('entry_date', { ascending: false }).then(function (r) {
      var J = r.data || [];
      body.innerHTML = '<section class="pp-card"><h3>Process journal (' + J.length + ' entries)</h3>' + (J.length ? '<ul class="pp-list">' + J.map(function (j) {
        return '<li><b>' + E(j.entry_date) + '</b> <span class="pp-chip">' + E(j.stage || '') + '</span>' + ['activity', 'learning', 'challenges', 'decisions', 'next_steps'].filter(function (k) { return j[k]; }).map(function (k) { return '<p style="margin:4px 0"><b>' + { activity: 'Did', learning: 'Learned', challenges: 'Challenges', decisions: 'Decisions', next_steps: 'Next' }[k] + ':</b> ' + E(j[k]) + '</p>'; }).join('') +
          (j.atl || []).map(function (a) { return '<span class="pp-chip">' + E(a) + '</span>'; }).join('') +
          ((j.history || []).length ? '<details style="margin-top:6px"><summary class="pp-muted">Edited ' + j.history.length + '×: see earlier versions</summary>' + j.history.map(function (h) { return '<div class="pp-tip" style="background:#F8FAFC;border-color:#E2E8F0"><small>Before ' + E(String(h.at || '').slice(0, 16).replace('T', ' ')) + '</small><br>' + ['activity', 'learning', 'challenges', 'decisions', 'next_steps'].filter(function (k) { return h[k]; }).map(function (k) { return E(h[k]); }).join(' · ') + '</div>'; }).join('') + '</details>' : '') +
          fbBox(p, 'journal:' + j.id, 'Comment on this entry…') + '</li>'; }).join('') + '</ul>' : '<p class="pp-muted">No entries yet.</p>') + '</section>';
      wireFb(body, p);
    });
  }
  function svEvidence(body, p) {
    S.db.from('pp_evidence').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).then(function (r) {
      var EV = r.data || [];
      body.innerHTML = '<section class="pp-card"><h3>Evidence (' + EV.length + ')</h3>' + (EV.length ? '<ul class="pp-list">' + EV.map(function (e) { return '<li><b>' + E(e.title) + '</b> <span class="pp-chip">' + E(e.area) + '</span>' + (e.stage ? '<span class="pp-chip">' + E(e.stage) + '</span>' : '') + (e.caption ? '<br>' + E(e.caption) : '') +
        '<div class="pp-row" style="margin-top:6px">' + (e.path ? '<button class="btn sm" data-dl="' + E(e.path) + '">Open file</button>' : '') + (e.link ? '<a class="btn sm" href="' + E(e.link) + '" target="_blank" rel="noopener">Open link</a>' : '') + '</div></li>'; }).join('') + '</ul>' : '<p class="pp-muted">No evidence yet.</p>') + fbBox(p, 'product', 'Feedback on the product or evidence…') + '</section>';
      wireDl(body); wireFb(body, p);
    });
  }
  function svSources(body, p) {
    S.db.from('pp_sources').select('*').eq('project_id', p.id).order('created_at').then(function (r) {
      var SR = r.data || [];
      body.innerHTML = '<section class="pp-card"><h3>Sources (' + SR.length + ')</h3>' + (SR.length ? '<ol>' + SR.map(function (s) { var ev = s.evaluation || {}, v = Object.keys(ev).map(function (k) { return +ev[k] || 0; }).filter(Boolean), avg = v.length ? (v.reduce(function (a, b) { return a + b; }, 0) / v.length).toFixed(1) : '';
        return '<li>' + E(s.citation) + (s.url ? ' <a href="' + E(s.url) + '" target="_blank" rel="noopener">link</a>' : '') + (avg ? ' <span class="pp-chip">student rated ' + avg + '/3</span>' : '') + (s.notes ? '<br><small class="pp-muted">' + E(s.notes) + '</small>' : '') + '</li>'; }).join('') + '</ol>' : '<p class="pp-muted">No sources yet.</p>') + fbBox(p, 'sources', 'Feedback on sources and referencing…') + '</section>';
      wireFb(body, p);
    });
  }
  function svReport(body, p) {
    var g = (ST.guide && ST.guide.report) || {}, secs = (g.sections || []).filter(function (s) { return s.key !== 'references'; }), rp = (p.data || {}).report || {};
    Promise.all([S.db.from('pp_report_versions').select('id,label,words,created_at,sections').eq('project_id', p.id).order('created_at', { ascending: false }), S.db.from('pp_submissions').select('*').eq('project_id', p.id).eq('kind', 'report_final').order('created_at', { ascending: false })]).then(function (x) {
      var V = x[0].data || [], F = x[1].data || [];
      body.innerHTML = (F.length ? '<section class="pp-card"><h3>Final report</h3><ul class="pp-list">' + F.map(function (s) { var extra = (s.note || '').match(/(bibliography|recording): ([^ ·]+)/g) || [];
        return '<li><button class="btn sm main" data-dl="' + E(s.path) + '">⬇ ' + E(s.filename || 'Report') + '</button> ' + extra.map(function (e) { var m = e.split(': '); return '<button class="btn sm" data-dl="' + E(m[1]) + '">⬇ ' + E(m[0]) + '</button>'; }).join(' ') + '<br><small class="pp-muted">' + new Date(s.created_at).toLocaleString() + ' · ' + E((s.note || '').split(' · ')[0]) + ' · ' + (s.words || 0) + ' words drafted in the hub</small></li>'; }).join('') + '</ul></section>' : '') +
        '<section class="pp-card"><h3>Current draft in the hub</h3>' + secs.map(function (s) { return '<h4 style="margin:12px 0 4px">' + E(s.label) + (s.criterion ? ' <span class="pp-chip">' + E(s.criterion) + '</span>' : '') + ' <small class="pp-muted">' + words(rp[s.key]) + ' words</small></h4><p style="white-space:pre-wrap;margin:0">' + (rp[s.key] ? E(rp[s.key]) : '<span class="pp-muted">—</span>') + '</p>' + fbBox(p, 'report:' + s.key, 'Feedback on “' + s.label + '”…'); }).join('') + '</section>' +
        '<section class="pp-card"><h3>Saved versions (' + V.length + ')</h3>' + (V.length ? '<ul class="pp-list">' + V.map(function (v) { return '<li>' + E(v.label || 'Version') + ' · ' + v.words + ' words <details><summary class="pp-muted">Show</summary>' + secs.map(function (s) { return (v.sections || {})[s.key] ? '<p><b>' + E(s.label) + ':</b> ' + E(v.sections[s.key]) + '</p>' : ''; }).join('') + '</details></li>'; }).join('') + '</ul>' : '<p class="pp-muted">No saved versions.</p>') + '</section>';
      wireDl(body); wireFb(body, p);
    });
  }
  function svAssess(body, p) {
    var C = (ST.guide && ST.guide.criteria) || [];
    S.db.from('pp_assessments').select('*').eq('project_id', p.id).then(function (r) {
      var A = r.data || [], self = A.filter(function (a) { return a.kind === 'self'; })[0], mine = A.filter(function (a) { return a.kind === 'teacher' && a.assessor_id === ST.me.user.id; })[0] || { levels: {}, comments: {} }, others = A.filter(function (a) { return a.kind === 'teacher' && a.assessor_id !== ST.me.user.id; });
      var L = Object.assign({}, mine.levels), K = Object.assign({}, mine.comments);
      function draw() {
        var y = window.scrollY;
        body.innerHTML = '<section class="pp-card"><h3>Assess with the official criteria</h3><p class="pp-muted">Choose the band that best fits the report (best fit), then the level. Your levels and comments are shown to the student. Descriptors: ' + E(ST.guide ? ST.guide.source : '') + '.</p></section>' +
          C.map(function (c) { var bands = (c.bands || []).slice().sort(function (a, b) { return b.min - a.min; }), lvl = L[c.key];
            return '<section class="pp-card"><h3>Criterion ' + E(c.key) + ': ' + E(c.name) + ' <small class="pp-muted">/ ' + c.max + '</small></h3>' +
              (self && self.levels && self.levels[c.key] != null ? '<p class="pp-tip">Student\'s self-assessment: level ' + self.levels[c.key] + (self.comments && self.comments[c.key] ? ' · “' + E(self.comments[c.key]) + '”' : '') + '</p>' : '') +
              others.map(function (o) { return o.levels && o.levels[c.key] != null ? '<p class="pp-tip" style="background:#E0F2FE;border-color:#7DD3FC">Another assessor: level ' + o.levels[c.key] + '</p>' : ''; }).join('') +
              bands.map(function (b) { var sel = lvl != null && lvl >= b.min && lvl <= b.max; return '<div class="pp-band' + (sel ? ' sel' : '') + '" data-c="' + c.key + '" data-min="' + b.min + '" data-max="' + b.max + '" tabindex="0" role="button" aria-pressed="' + sel + '"><b>' + b.min + '–' + b.max + '</b><ul style="margin:4px 0 0">' + (b.d || []).map(function (z) { return '<li>' + E(z) + '</li>'; }).join('') + '</ul>' +
                (sel ? '<div class="pp-row" style="margin-top:6px">Level: ' + [b.min, b.max].map(function (v) { return '<label><input type="radio" name="tl-' + c.key + '" value="' + v + '"' + (lvl === v ? ' checked' : '') + '> ' + v + '</label>'; }).join(' ') + '</div>' : '') + '</div>'; }).join('') +
              '<p class="pp-muted"><label><input type="radio" data-zero="' + c.key + '"' + (lvl === 0 ? ' checked' : '') + '> 0: does not reach a standard described by any of the descriptors</label></p>' +
              '<label class="pp-f"><span>Comment for the student</span><textarea data-why="' + c.key + '" rows="2">' + E(K[c.key] || '') + '</textarea></label></section>'; }).join('') +
          '<div class="pp-row"><button class="btn main sm" id="ta-save">💾 Save assessment</button><b id="ta-tot"></b></div>';
        body.querySelector('#ta-tot').textContent = 'Total: ' + C.reduce(function (s, c) { return s + (+L[c.key] || 0); }, 0) + ' / ' + C.reduce(function (s, c) { return s + c.max; }, 0);
        [].forEach.call(body.querySelectorAll('.pp-band'), function (b) { var pick = function (e) { if (e && e.target.tagName === 'INPUT') return; var c = b.getAttribute('data-c'), lo = +b.getAttribute('data-min'), hi = +b.getAttribute('data-max'); if (!(L[c] >= lo && L[c] <= hi)) { L[c] = hi; draw(); } };
          b.onclick = pick; b.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }; });
        [].forEach.call(body.querySelectorAll('input[name^="tl-"]'), function (x) { x.onchange = function () { L[x.name.slice(3)] = +x.value; draw(); }; });
        [].forEach.call(body.querySelectorAll('[data-zero]'), function (x) { x.onchange = function () { L[x.getAttribute('data-zero')] = 0; draw(); }; });
        [].forEach.call(body.querySelectorAll('[data-why]'), function (t) { t.oninput = function () { K[t.getAttribute('data-why')] = t.value; }; });
        body.querySelector('#ta-save').onclick = function () { S.db.from('pp_assessments').upsert({ project_id: p.id, assessor_id: ST.me.user.id, kind: 'teacher', levels: L, comments: K, updated_at: new Date().toISOString() }, { onConflict: 'project_id,assessor_id,kind' }).then(function (x) { ok(x, 'Assessment saved; the student can see it'); }); };
        window.scrollTo(0, y);
      }
      draw();
    });
  }
  function svFeedback(body, p) {
    S.db.from('pp_feedback').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).then(function (r) {
      var F = r.data || [];
      body.innerHTML = '<section class="pp-card"><h3>All feedback and questions</h3>' + (F.length ? '<ul class="pp-list">' + F.map(function (f) { var fromStudent = f.author_id === p.student_id;
        return '<li style="' + (f.resolved ? 'opacity:.6' : '') + '"><span class="pp-chip">' + E(f.target) + '</span>' + (fromStudent ? '<span class="pp-chip" style="background:#FEF3C7;color:#92400E">from the student</span>' : '') + ' <small class="pp-muted">' + new Date(f.created_at).toLocaleString() + '</small><p style="margin:6px 0">' + E(f.comment) + '</p>' + (f.resolved ? '<small class="pp-muted">✓ Done</small>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="pp-muted">No feedback yet.</p>') + fbBox(p, 'project', 'Write feedback or answer the student…') + '</section>';
      wireFb(body, p);
    });
  }
})();
