/* VistaEd · VISTA Research Hub (/research/): IB research, investigation and academic excellence.
   Core: sign-in, layout, navigation, dashboards (student, teacher, admin), saving with autosave and version history,
   submissions with an audit trail, supervision meetings, notebook, AI-assistance record and the Research Mentor.
   The IA Studio stages are in research-ia.js; data, statistics and graphs in research-data.js; statistics in research-stats.js.
   Tables: research_* (migration 059). Students see only their own projects; supervisors those of the classes they teach. */
(function () {
  'use strict';
  var S = window.BVS, el = document.getElementById('app'); if (!el) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var RH = window.RH = window.RH || {}; RH.E = E; RH.S = S;   // research-ia.js and research-data.js (loaded first) add RH.ia and RH.data
  document.body.classList.add('t-research');

  RH.IA = [
    { k: 'topic', n: 'Topic exploration', ic: '🔭', crit: 'rd' }, { k: 'rq', n: 'Research question', ic: '❓', crit: 'rd' }, { k: 'hypothesis', n: 'Hypothesis', ic: '💡', crit: 'rd' },
    { k: 'variables', n: 'Variables and design', ic: '🎛️', crit: 'rd' }, { k: 'method', n: 'Methodology', ic: '🧪', crit: 'rd' }, { k: 'safety', n: 'Safety and ethics', ic: '🦺', crit: 'rd' },
    { k: 'data', n: 'Data collection', ic: '📋', crit: 'da' }, { k: 'analysis', n: 'Data analysis', ic: '🧮', crit: 'da' }, { k: 'graphs', n: 'Graphs', ic: '📈', crit: 'da' },
    { k: 'conclusion', n: 'Conclusion', ic: '✅', crit: 'co' }, { k: 'evaluation', n: 'Evaluation', ic: '🔍', crit: 'ev' }, { k: 'assess', n: 'Rubric and feedback', ic: '🏁' }];
  RH.stagesOf = function (p) { return p && p.kind === 'ee' ? (RH.EE || []) : RH.IA; };
  RH.stageName = function (k) { var s = RH.IA.concat(RH.EE || []).filter(function (x) { return x.k === k; })[0]; return s ? s.n : { ee_draft: 'Draft submission', ee_viva: 'Viva voce' }[k] || k; };
  RH.STATUS = { active: ['In progress', ''], proposal_submitted: ['Proposal with supervisor', 'info'], proposal_approved: ['Proposal approved', 'ok'], returned: ['Returned for revision', 'warn'], final_submitted: ['Final submitted', 'info'], completed: ['Completed', 'ok'], archived: ['Archived', ''] };
  RH.badge = function (st) { var s = RH.STATUS[st] || [st, '']; return '<span class="rh-badge ' + s[1] + '">' + E(s[0]) + '</span>'; };
  RH.date = function (d, time) { if (!d) return ''; var x = new Date(d); return x.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + (time ? ' ' + x.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''); };
  RH.toast = function (msg) { var t = document.createElement('div'); t.className = 'rh-toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.style.opacity = 0; setTimeout(function () { t.remove(); }, 400); }, 2400); };
  RH.err = function (e) { RH.toast(S.nice(e)); console.error(e); };
  RH.words = function (s) { return (String(s || '').match(/[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9]+)*/g) || []).length; };

  /* ---------- word count of the report-facing text (what would go in the 3,000-word report) ---------- */
  RH.reportText = function (d) {
    d = d || {}; var parts = [];
    var push = function (o) { if (!o) return; if (typeof o === 'string') parts.push(o); else if (Array.isArray(o)) o.forEach(push); else Object.keys(o).forEach(function (k) { if (k !== 'versions' && k !== 'checks' && k !== 'answers' && k !== 'graphs_meta' && k !== 'area') push(o[k]); }); };
    ['rq', 'hypothesis', 'variables', 'method', 'conclusion', 'evaluation'].forEach(function (k) { push(d[k]); });
    if (d.topic && d.topic.background) push(d.topic.background);
    return parts.join(' ');
  };
  RH.wordCount = function (d, kind) { return kind === 'ee' && RH.ee ? RH.ee.essayWords(d) : RH.words(RH.reportText(d)); };

  /* ---------- how complete each stage is (0–1), used for the progress cards and next steps ---------- */
  var filled = function (s, n) { return RH.words(s) >= (n || 3); };
  RH.stageDone = function (k, p, extra) {
    var d = p.data || {}; extra = extra || {};
    if (/^ee_/.test(k)) return RH.ee ? RH.ee.done(k, p) : 0;
    switch (k) {
      case 'topic': return d.topic && d.topic.area && filled(d.topic.background, 30) ? 1 : d.topic && d.topic.area ? 0.5 : 0;
      case 'rq': return d.rq && filled(d.rq.text, 8) ? (d.rq.quality >= 5 ? 1 : 0.6) : 0;
      case 'hypothesis': var h = d.hypothesis || {}; return [h.alt, h.prediction, h.explanation].filter(function (x) { return filled(x, 5); }).length / 3;
      case 'variables': var v = d.variables || {}; return ((v.iv && v.iv.name ? 1 : 0) + (v.dv && v.dv.name ? 1 : 0) + ((v.controls || []).length >= 3 ? 1 : 0) + (v.design && v.design.trials ? 1 : 0)) / 4;
      case 'method': var m = d.method || {}; return ((m.materials ? 1 : 0) + ((m.procedure || []).filter(Boolean).length >= 4 ? 1 : 0) + (m.collection ? 1 : 0) + (m.safety ? 1 : 0)) / 4;
      case 'safety': var s = d.safety || {}; return s.done ? 1 : Object.keys(s.answers || {}).length ? 0.5 : 0;
      case 'data': return extra.datasets ? (extra.locked ? 1 : 0.6) : 0;
      case 'analysis': return (d.analysis && (d.analysis.saved || []).length) ? 1 : 0;
      case 'graphs': return (d.graphs || []).length ? 1 : 0;
      case 'conclusion': var c = d.conclusion || {}; return ['answer', 'quant', 'mechanism', 'literature', 'hypothesis'].filter(function (x) { return filled(c[x], 6); }).length / 5;
      case 'evaluation': var rows = (d.evaluation && d.evaluation.rows) || []; return Math.min(1, rows.filter(function (r) { return filled(r.what, 3) && filled(r.improve, 3); }).length / 3);
      case 'assess': return p.status === 'final_submitted' || p.status === 'completed' ? 1 : 0;
    }
    return 0;
  };
  RH.progress = function (p, extra) { var L = RH.stagesOf(p), t = 0; L.forEach(function (s) { t += RH.stageDone(s.k, p, extra); }); return Math.round(t / L.length * 100); };
  RH.nextStage = function (p, extra) { var L = RH.stagesOf(p); for (var i = 0; i < L.length; i++) if (RH.stageDone(L[i].k, p, extra) < 1) return L[i]; return L[L.length - 1]; };
  RH.journeyOf = function (p) { return p && p.kind === 'ee' ? RH.ee.JOURNEY : RH.JOURNEY; };
  RH.firstStage = function (p) { return p && p.kind === 'ee' ? 'ee_subject' : 'topic'; };
  RH.lastStage = function (p) { return p && p.kind === 'ee' ? 'ee_assess' : 'assess'; };
  // the journey shown on the dashboard card, as named in the brief
  RH.JOURNEY = [['Research question', ['topic', 'rq']], ['Proposal', ['hypothesis']], ['Research design', ['variables', 'method', 'safety']], ['Data collection', ['data']], ['Data analysis', ['analysis', 'graphs']], ['Conclusion', ['conclusion']], ['Evaluation', ['evaluation']], ['Final submission', ['assess']]];

  /* ---------- loading and saving one project ---------- */
  RH.load = function (id) {
    return Promise.all([
      S.db.from('research_projects').select('*').eq('id', id).maybeSingle(),
      S.db.from('research_datasets').select('id,name,raw_locked,updated_at').eq('project_id', id)
    ]).then(function (x) {
      if (x[0].error) throw x[0].error; if (!x[0].data) throw new Error('Project not found, or you do not have access to it.');
      var p = x[0].data; p.data = p.data || {};
      RH.p = p; RH.extra = { datasets: (x[1].data || []).length, locked: (x[1].data || []).some(function (d) { return d.raw_locked; }), list: x[1].data || [] };
      RH.owner = p.student_id === RH.me.user.id; RH.sup = !RH.owner;
      if (RH.owner) setTimeout(function () { RH.syncTodo(p, RH.extra, true); }, 1500);
      return RH.curriculum(p.curriculum_id, p.kind).then(function () { return p; });
    });
  };
  RH.curriculum = function (id, kind) {
    if (RH.cur && (id ? RH.cur.id === id : RH.cur.kind === (kind || 'ia'))) return Promise.resolve(RH.cur);
    var q = S.db.from('research_curricula').select('*'); q = id ? q.eq('id', id) : q.eq('kind', kind || 'ia').eq('active', true).order('created_at', { ascending: false }).limit(1);
    return q.then(function (r) { RH.cur = (r.data || [])[0] || null; return RH.cur; });
  };
  var saveTimer = null, saving = null;
  RH.set = function (path, value) {   // RH.set('rq.text', '...'): change the working copy and autosave
    if (!RH.owner) return; var o = RH.p.data, ks = path.split('.');
    for (var i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = value; RH.dirty();
  };
  RH.get = function (path, dflt) { var o = RH.p && RH.p.data; path.split('.').forEach(function (k) { o = o == null ? undefined : o[k]; }); return o == null ? dflt : o; };
  RH.dirty = function () { var m = document.getElementById('rh-save'); if (m) m.textContent = 'Saving…'; clearTimeout(saveTimer); saveTimer = setTimeout(RH.saveNow, 1200); };
  /* Work set on the teacher dashboard for a Research Hub stage (assignment ref research:<ia|ee>:<stage>) ticks itself off
     on the student's dashboard as soon as this project completes that stage (19 Nov 2026). */
  var syncAt = 0;
  RH.syncTodo = function (p, extra, now) {
    if (!p || !RH.owner || !RH.me || (!now && Date.now() - syncAt < 20000)) return; syncAt = Date.now();
    S.db.rpc('my_todo').then(function (r) {
      (r.data || []).forEach(function (t) { var m = /^research:(ia|ee):(.+)$/.exec(t.ref || '');
        if (!m || t.state === 'done' || m[1] !== (p.kind || 'ia')) return;
        if (RH.stageDone(m[2], p, extra || {}) >= 1) S.db.from('assignment_done').insert({ assignment_id: t.id, student_id: RH.me.user.id }).then(function (z) { if (!z.error) RH.toast('✓ "' + t.title + '" is ticked off on your dashboard'); }); });
    }, function () {});
  };
  RH.saveNow = function () {
    if (!RH.p || !RH.owner) return Promise.resolve(); clearTimeout(saveTimer);
    var p = RH.p, wc = RH.wordCount(p.data, p.kind);
    saving = S.db.from('research_projects').update({ data: p.data, title: p.title, rq: (p.data.rq && p.data.rq.text) || p.rq, stage: p.stage, word_count: wc }).eq('id', p.id).then(function (r) {
      var m = document.getElementById('rh-save');
      if (r.error) { if (m) m.textContent = 'Not saved: ' + S.nice(r.error); return; }
      p.word_count = wc; if (m) m.textContent = 'Saved ' + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      RH.syncTodo(p, RH.extra);
      var w = document.getElementById('rh-wc'); if (w) w.innerHTML = wcText(wc);
    });
    return saving;
  };
  window.addEventListener('beforeunload', function (e) { if (saveTimer) { RH.saveNow(); e.preventDefault(); e.returnValue = ''; } });
  function wcText(wc) { var lim = (RH.cur && RH.cur.word_limit) || (RH.p && RH.p.kind === 'ee' ? 4000 : 3000); return '<b>' + wc + '</b> / ' + lim + ' words' + (wc > lim ? ' <span class="rh-badge warn">over the limit</span>' : ''); }
  RH.wcText = wcText;
  RH.snapshot = function (section, data, note) {   // a named version the student (or supervisor) can return to
    return S.db.from('research_versions').insert({ project_id: RH.p.id, section: section, data: data, note: note || null }).then(function (r) { if (r.error) throw r.error; RH.toast('Version saved'); });
  };

  /* ---------- the Research Mentor (server function research-mentor) ---------- */
  RH.mentor = function (tool, opts) {
    opts = opts || {};
    return RH.saveNow().then(function () { return S.db.functions.invoke('research-mentor', { body: Object.assign({ project_id: RH.p.id, tool: tool }, opts) }); }).then(function (r) {
      var b = r.data; if (r.error && !b) { return r.error.context && r.error.context.json ? r.error.context.json() : { ok: false, error: r.error.message }; } return b;
    }).then(function (b) { if (!b || !b.ok) throw new Error((b && b.error) || 'The mentor could not answer.'); return b; });
  };
  RH.mentorBox = function (tool, label, getText, extraOpts) {   // a button that asks the mentor and shows the answer, labelled as AI feedback
    var id = 'mb' + Math.random().toString(36).slice(2);
    setTimeout(function () {
      var b = document.getElementById(id); if (!b) return;
      b.onclick = function () {
        var out = document.getElementById(id + 'o'); b.disabled = true; out.innerHTML = '<p class="muted small">The mentor is reading your work…</p>';
        RH.mentor(tool, Object.assign({ text: getText ? getText() : '' }, extraOpts ? extraOpts() : {})).then(function (r) {
          out.innerHTML = '<div class="rh-card ai fadein"><div class="rh-head"><b>Research Mentor</b><span class="rh-badge ai">AI feedback, not your teacher\'s assessment</span></div><div style="white-space:pre-wrap">' + E(r.text) + '</div><p class="small muted">Think about it, then make your own changes. Recorded in your AI-assistance history.</p></div>';
        }).catch(function (e) { out.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; }).then(function () { b.disabled = false; });
      };
    });
    return RH.owner ? '<div class="grp"><div class="btns"><button class="btn sm" id="' + id + '" type="button">🤖 ' + E(label) + '</button></div><div id="' + id + 'o" aria-live="polite"></div></div>' : '';
  };

  /* ---------- layout ---------- */
  /* menu groups: [href, icon, label, colour]; a string starts a new group. P: items need an open project. */
  var NAV_STUDENT = ['Start', ['#/', '🏠', 'Research dashboard', '#7C3AED'],
    'My projects', ['IA', '🧬', 'Biology IA Studio', '#16A34A'], ['EE', '📝', 'Extended Essay Studio', '#0284C7'],
    'This project', ['P:check', '✅', 'Pre-submission check', '#16A34A'], ['P:submit', '📤', 'Submission centre', '#0D9488'], ['P:feedback', '💬', 'Feedback centre', '#DB2777'], ['P:meetings', '🗓️', 'Supervision', '#EA580C'], ['P:notebook', '📓', 'Research notebook', '#7C3AED'], ['P:integrity', '🛡️', 'Academic integrity', '#0284C7'], ['P:versions', '🕘', 'Version history', '#475569'],
    'Research toolkit', ['#/rqlab', '❓', 'Research question lab', '#E11D48'], ['#/lab', '🧮', 'Statistics lab', '#0D9488'], ['#/graph', '📈', 'Graph studio', '#2563EB'], ['/biodata/', '📊', 'BioData Lab', '#16A34A'], ['/poster/', '🖼️', 'Poster creator', '#DB2777'], ['#/worksheets', '🧭', 'Interactive worksheets', '#EA580C'],
    'Learn', ['#/library', '📚', 'Templates and samples', '#7C3AED'], ['#/help', '🎓', 'Research academy', '#0284C7']];
  var NAV_TEACHER = ['Supervise', ['#/teacher', '🧑‍🏫', 'Supervisor dashboard', '#7C3AED'], ['#/teacher/milestones', '📅', 'Milestones and deadlines', '#EA580C'],
    'Research toolkit', ['#/lab', '🧮', 'Statistics lab', '#0D9488'], ['#/graph', '📈', 'Graph studio', '#2563EB'], ['/biodata/', '📊', 'BioData Lab', '#16A34A'], ['/poster/', '🖼️', 'Poster creator', '#DB2777'], ['#/worksheets', '🧭', 'Interactive worksheets', '#EA580C'],
    'Learn', ['#/library', '📚', 'Templates and samples', '#7C3AED'], ['#/help', '🎓', 'Research academy', '#0284C7']];
  /* colourful launch tiles for the dashboards */
  RH.toolkit = function (teacher) {
    var T = [['#/rqlab', '❓', 'Research question lab', 'Turn a topic into a focused, testable question.', '#E11D48'], ['#/lab', '🧮', 'Statistics lab', 'Descriptive statistics, t-tests, ANOVA, correlation, chi-squared.', '#0D9488'],
      ['#/graph', '📈', 'Graph studio', 'Scatter, bar and line graphs with error bars and trend lines.', '#2563EB'], ['/biodata/', '📊', 'BioData Lab', 'Explore 10 real published datasets.', '#16A34A'],
      ['/poster/', '🖼️', 'Poster creator', 'Turn your investigation into an A0–A3 poster.', '#DB2777'], ['#/worksheets', '🧭', 'Interactive worksheets', 'Guided IA and EE practice with simulators.', '#EA580C'],
      ['#/library', '📚', 'Templates and samples', 'Full exemplars, templates and the IB guides.', '#7C3AED'], ['/tutor/?mode=guide', '🤖', 'AI Science Tutor', 'Talk your ideas through. It guides; it never writes your work.', '#E11D48']];
    if (teacher) T = T.filter(function (t) { return t[0] !== '#/rqlab'; });
    return '<section class="rh-tk" aria-label="Research toolkit"><h2 class="rh-tk-h">🧰 Research toolkit</h2><div class="rh-tk-g">' + T.map(function (t) { return '<a class="rh-tile" href="' + t[0] + '" style="--c:' + t[4] + '"><span class="ic" aria-hidden="true">' + t[1] + '</span><b>' + E(t[2]) + '</b><span>' + E(t[3]) + '</span></a>'; }).join('') + '</div></section>';
  };
  RH.shell = function (active, mainHtml, ctxHtml) {
    var nav = RH.teacher ? NAV_TEACHER.slice() : NAV_STUDENT.slice(); if (RH.me.admin) nav.push(['#/admin', '🛠️', 'Curriculum and admin']);
    var pid = RH.p && RH.owner ? RH.p.id : RH.lastPid;
    var links = [], grp = null, open = null;
    nav.forEach(function (n) {
      if (typeof n === 'string') { grp = n; open = null; return; }
      var href = n[0], cur = active === n[0];
      if (href === 'IA') { href = RH.lastIa ? '#/p/' + RH.lastIa + '/' + (RH.p && RH.p.id === RH.lastIa ? RH.p.stage : '') : '#/new/ia'; cur = active === 'IA'; }
      else if (href === 'EE') { href = RH.lastEe ? '#/p/' + RH.lastEe + '/' + (RH.p && RH.p.id === RH.lastEe ? RH.p.stage : '') : '#/new/ee'; cur = active === 'EE'; }
      else if (href.indexOf('P:') === 0) { if (!pid) return; var v = href.slice(2); cur = active === v; href = '#/p/' + pid + '/' + v; }
      if (open !== grp) { links.push('<span class="sep">' + E(grp) + '</span>'); open = grp; }
      links.push('<a href="' + href + '"' + (cur ? ' aria-current="page"' : '') + ' style="--c:' + (n[3] || '#7C3AED') + '"><span class="ic" aria-hidden="true">' + n[1] + '</span>' + E(n[2]) + '</a>');
    });
    if (RH.teacher && RH.p && !RH.owner) links.splice(1, 0, '<span class="sep">Open project</span><a href="#/p/' + RH.p.id + '/' + RH.lastStage(RH.p) + '"' + (active === 'IA' || active === 'EE' ? ' aria-current="page"' : '') + '><span class="ic">' + (RH.p.kind === 'ee' ? '📝' : '🧬') + '</span>' + E(RH.p.title) + '</a>');
    var meta = null; nav.forEach(function (n, i) { if (typeof n === 'string') return; var k = n[0]; if (k === active || (k.indexOf('P:') === 0 && k.slice(2) === active)) meta = [n[1], n[2], n[3], (function () { for (var j = i; j >= 0; j--) if (typeof nav[j] === 'string') return nav[j]; return ''; })()]; });
    if (!meta && /^#\/p\//.test(location.hash)) meta = RH.p && RH.p.kind === 'ee' ? ['📝', 'Extended Essay Studio', '#0284C7', 'My projects'] : ['🧬', 'Biology IA Studio', '#16A34A', 'My projects'];
    var pc = (meta && meta[2]) || '#7C3AED', band = meta && !/rh-hero|rv-head/.test(mainHtml) ? '<div class="rh-band"><span class="ic" aria-hidden="true">' + meta[0] + '</span><div><small>VISTA Research Hub · ' + E(meta[3]) + '</small><b>' + E(meta[1]) + '</b></div></div>' : '';
    if (band && /^\s*<div class="rh-card"><h2>/.test(mainHtml)) { mainHtml = mainHtml.replace('<div class="rh-card">', '<div class="rh-card rh-lead"><small class="rh-lead-k">VISTA Research Hub · ' + E(meta[3]) + '</small>'); band = ''; }   // a page that opens with its own title card: colour that card instead of adding a banner
    mainHtml = band + mainHtml;
    el.innerHTML = '<div class="rh' + (ctxHtml ? ' ctx' : '') + '" style="--pc:' + pc + '"><nav class="rh-nav" aria-label="Research Hub"><a class="rh-brand" href="#/"><span class="rh-logo" aria-hidden="true">🔬</span><span>VISTA Research Hub<small>Research, investigation and academic excellence</small></span></a>' + links.join('') + '</nav>' +
      '<div class="rh-main fadein" id="rh-main">' + mainHtml + '</div>' + (ctxHtml ? '<aside class="rh-ctx" aria-label="Guidance">' + ctxHtml + '</aside>' : '') + '</div>';
    window.scrollTo(0, 0);
    return document.getElementById('rh-main');
  };

  /* ---------- routing ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/'), r = h[0] || '';
    if (RH.p && RH.owner && saveTimer) RH.saveNow();
    var go = function () {
      if (r === 'p' && h[1]) return RH.openProject(h[1], h[2] || '');
      RH.p = null;
      if (r === 'lab') return RH.data.statsLab();
      if (r === 'graph') return RH.data.graphLab();
      if (r === 'rqlab') return RH.ia.rqLab();
      if (r === 'worksheets') return RH.ws.page();
      if (r === 'ws' && h[1]) return RH.ws.open(h[1]);
      if (r === 'library') return library();
      if (r === 'view' && h[1]) return viewer(decodeURIComponent(h.slice(1).join('/')));
      if (r === 'help') return academy();
      if (r === 'ee') { location.hash = RH.lastEe ? '#/p/' + RH.lastEe + '/' : '#/new/ee'; return; }
      if (r === 'admin') return RH.me.admin ? admin() : home();
      if (r === 'teacher') return RH.teacher ? (h[1] === 'milestones' ? milestonesPage() : teacherHome()) : home();
      if (r === 'new') return newProject(h[1] === 'ee' ? 'ee' : 'ia');
      return RH.teacher ? teacherHome() : home();
    };
    try { go(); } catch (e) { RH.err(e); }
  }
  RH.route = route;
  RH.openProject = function (id, view) {
    var m = RH.shell('', '<p class="muted">Opening the project…</p>');
    return RH.load(id).then(function (p) {
      if (RH.owner) { RH.lastPid = p.id; if (p.kind === 'ee') RH.lastEe = p.id; else RH.lastIa = p.id; try { localStorage.setItem('rh-last', p.id); localStorage.setItem('rh-last-' + p.kind, p.id); } catch (e) {} }
      if (view === 'check') return RH.check.page();
      if (['submit', 'feedback', 'meetings', 'notebook', 'integrity', 'versions'].indexOf(view) >= 0) return PAGES[view]();
      var L = RH.stagesOf(p), valid = function (k) { return L.some(function (s) { return s.k === k; }) || ['data', 'analysis', 'graphs'].indexOf(k) >= 0; };
      var stage = view && valid(view) ? view : (RH.sup ? RH.lastStage(p) : (valid(p.stage) ? p.stage : RH.firstStage(p)));
      if (RH.owner && stage !== p.stage && L.some(function (s) { return s.k === stage; })) { p.stage = stage; RH.dirty(); }
      return /^ee_/.test(stage) ? RH.ee.stage(stage) : RH.ia.stage(stage);
    }).catch(function (e) { m.innerHTML = '<div class="rh-card warn"><h2>Cannot open this project</h2><p>' + E(S.nice(e)) + '</p><p><a class="btn sm" href="#/">Back to the dashboard</a></p></div>'; });
  };

  /* ---------- the stage header shared by every IA page ---------- */
  RH.stageHead = function (k) {
    var p = RH.p, L = RH.stagesOf(p), i = L.map(function (s) { return s.k; }).indexOf(k), cur = L[i] || RH.IA.filter(function (s) { return s.k === k; })[0];
    var steps = L.map(function (s) { var d = RH.stageDone(s.k, p, RH.extra); return '<li class="' + (s.k === k ? 'now' : d >= 1 ? 'done' : '') + '"><a href="#/p/' + p.id + '/' + s.k + '" title="' + E(s.n) + '">' + s.ic + ' <span>' + (s.k === k ? E(s.n) : (d >= 1 ? '✓' : '')) + '</span></a></li>'; }).join('');
    return '<div class="rh-card"><div class="rh-head"><div><p class="label">' + (p.kind === 'ee' ? 'Extended Essay Studio' : 'Biology IA Studio') + (i >= 0 ? ' · stage ' + (i + 1) + ' of ' + L.length : ' · tool') + (RH.sup ? ' · viewing as supervisor' : '') + '</p><h2>' + E(cur ? cur.ic + ' ' + cur.n : k) + '</h2></div>' +
      '<div style="text-align:right"><div id="rh-wc" class="small">' + wcText(RH.wordCount(p.data, p.kind)) + '</div><div id="rh-save" class="rh-save" aria-live="polite">' + (RH.owner ? 'All changes save automatically' : 'Read-only: ' + E(p.title)) + '</div></div></div>' +
      '<ul class="rh-steps" aria-label="Stages">' + steps + '</ul></div>';
  };
  RH.stageNav = function (k) {
    var p = RH.p, L = RH.stagesOf(p), i = L.map(function (s) { return s.k; }).indexOf(k), prev = i > 0 ? L[i - 1] : null, next = i >= 0 ? L[i + 1] : null;
    return '<div class="btns" style="justify-content:space-between">' + (prev ? '<a class="btn sm" href="#/p/' + p.id + '/' + prev.k + '">← ' + E(prev.n) + '</a>' : '<span></span>') +
      (RH.owner ? '<button class="btn sm" type="button" onclick="RH.snapshot(\'' + k + '\', RH.p.data[\'' + k + '\']||{}, \'Saved by student\')">🕘 Save a version of this stage</button>' : '') +
      (next ? '<a class="btn main sm" data-next href="#/p/' + p.id + '/' + next.k + '">' + E(next.n) + ' →</a>' : '') + '</div>';
  };
  RH.ctx = function (k) {   // contextual sidebar: what the criterion expects at this stage, and supervisor feedback
    var s = RH.IA.concat(RH.EE || []).filter(function (x) { return x.k === k; })[0] || {}, c = RH.cur && (RH.cur.criteria || []).filter(function (x) { return x.key === s.crit; })[0];
    var h = '';
    if (c) h += '<div class="rh-card tint"><p class="label">Criterion this stage builds</p><h3>' + E(c.name) + ' (' + c.max + ' marks)</h3><p class="small">' + E(c.assesses) + '</p><details><summary>Top markband (' + (c.bands[c.bands.length - 1].min === c.max ? c.max : c.bands[c.bands.length - 1].min + '–' + c.max) + ')</summary><ul class="small">' + c.bands[c.bands.length - 1].d.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul></details><p class="small muted">From the ' + E(RH.cur.guide) + '.</p></div>';
    h += '<div class="rh-card" id="rh-ctx-fb"><p class="label">Latest supervisor feedback</p><p class="small muted">Loading…</p></div>';
    setTimeout(function () {
      S.db.from('research_feedback').select('*').eq('project_id', RH.p.id).eq('source', 'teacher').order('created_at', { ascending: false }).limit(3).then(function (r) {
        var b = document.getElementById('rh-ctx-fb'); if (!b) return; var f = r.data || [];
        b.innerHTML = '<p class="label">Latest supervisor feedback</p>' + (f.length ? f.map(function (x) { return '<div class="small"><b>' + E(critName(x.criterion) || RH.stageName(x.stage) || 'General') + '</b> · ' + RH.date(x.created_at) + '<br>' + E(x.comment) + '</div>'; }).join('<hr style="border:0;border-top:1px solid var(--line)">') : '<p class="small muted">No supervisor feedback yet.</p>') + '<a class="small" href="#/p/' + RH.p.id + '/feedback">All feedback →</a>';
      });
    });
    return h;
  };
  function critName(k) { var c = RH.cur && (RH.cur.criteria || []).filter(function (x) { return x.key === k; })[0]; return c && c.name; }
  RH.critName = critName;

  /* ---------- student dashboard ---------- */
  function home() {
    var m = RH.shell('#/', '<p class="muted">Loading your research…</p>');
    var me = RH.me, name = (me.profile.full_name || me.user.email || '').split(' ')[0];
    Promise.all([
      S.db.from('research_projects').select('id,kind,title,rq,stage,status,data,word_count,class_id,supervisor_id,updated_at').eq('student_id', me.user.id).neq('status', 'archived').order('updated_at', { ascending: false }),
      S.db.from('research_milestones').select('*').order('due_on'),
      S.db.from('research_feedback').select('id,project_id,source,criterion,stage,comment,created_at').order('created_at', { ascending: false }).limit(5)
    ]).then(function (x) {
      var ps = x[0].data || [], ms = x[1].data || [], fb = (x[2].data || []).filter(function (f) { return ps.some(function (p) { return p.id === f.project_id; }); });
      var ia = ps.filter(function (p) { return p.kind === 'ia'; })[0], ee = ps.filter(function (p) { return p.kind === 'ee'; })[0];
      if (ia) RH.lastIa = ia.id; if (ee) RH.lastEe = ee.id;
      var ids = ps.map(function (p) { return p.id; });
      return (ids.length ? S.db.from('research_datasets').select('project_id,raw_locked').in('project_id', ids) : Promise.resolve({ data: [] })).then(function (dr) {
        var ds = dr.data || []; var ex = function (p) { var mine = ds.filter(function (d) { return d.project_id === p.id; }); return { datasets: mine.length, locked: mine.some(function (d) { return d.raw_locked; }) }; };
        var sup = ia && ia.class_id ? (me.classes || []).filter(function (c) { return c.id === ia.class_id; })[0] : null;
        var h = '<section class="rh-hero"><p class="label">VISTA Research Hub</p><h1>Welcome, ' + E(name) + '</h1><p>IB Diploma Programme · Biology internal assessment and Extended Essay' + (sup ? ' · IA supervised in <b>' + E(sup.name) + '</b>' : '') + '</p></section>';
        var card = function (p, label) { var e1 = ex(p), pr = RH.progress(p, e1), nx = RH.nextStage(p, e1), lim = p.kind === 'ee' ? 4000 : 3000;
          var jr = RH.journeyOf(p).map(function (j) { var done = j[1].every(function (k) { return RH.stageDone(k, p, e1) >= 1; }), now = j[1].indexOf(nx.k) >= 0; return '<li class="' + (now ? 'now' : done ? 'done' : '') + '"><span>' + (done ? '✓ ' : '') + E(j[0]) + '</span></li>'; }).join('');
          return '<div class="rh-card"><div class="rh-head"><p class="label">' + label + '</p>' + RH.badge(p.status) + '</div><h2>' + E(p.title) + '</h2><p class="small"><b>Research question:</b> ' + (p.rq ? E(p.rq) : '<span class="muted">not written yet</span>') + '</p>' +
            '<div class="rh-prog" role="progressbar" aria-valuenow="' + pr + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pr + '%"></i></div><p class="small muted">' + pr + '% of the stages complete · ' + (p.word_count || 0) + ' / ' + lim + ' words · last saved ' + RH.date(p.updated_at, true) + '</p>' +
            '<ul class="rh-steps">' + jr + '</ul><div class="rh-card tint" style="padding:12px"><b>Next step: ' + nx.ic + ' ' + E(nx.n) + '</b><span class="small">' + E((p.kind === 'ee' ? RH.ee.TIP : NEXT_TIP)[nx.k] || '') + '</span><div class="btns"><a class="btn main sm" href="#/p/' + p.id + '/' + nx.k + '">Continue where I stopped →</a></div></div></div>'; };
        h += '<div class="rh-grid">' + (ia ? card(ia, '🧬 Biology IA') : '<div class="rh-card tint"><p class="label">🧬 Biology IA</p><h2>Start your Biology IA</h2><p class="small">Twelve guided stages from a topic to a submitted scientific investigation (24 marks, 3,000 words). Your work saves as you type, and your supervisor can see it and give feedback.</p><div class="btns"><a class="btn main sm" href="#/new/ia">🧬 Start my Biology IA</a></div></div>') +
          (ee ? card(ee, '📝 Extended Essay') : '<div class="rh-card tint"><p class="label">📝 Extended Essay</p><h2>Start your Extended Essay</h2><p class="small">Ten stages from subject and pathway to the viva voce and final submission, following the Extended essay guide for first assessment 2027: 4,000 words, a 500-word reflective statement and three reflection sessions.</p><div class="btns"><a class="btn main sm" href="#/new/ee">📝 Start my Extended Essay</a></div></div>') + '</div>';
        var mine = ms.filter(function (x) { return !x.project_id || ids.indexOf(x.project_id) >= 0; });
        var today = new Date().toISOString().slice(0, 10);
        h += '<div class="rh-grid"><div class="rh-card"><p class="label">📅 Deadlines and milestones</p>' + (mine.length ? '<div class="rh-list">' + mine.slice(0, 6).map(function (x) { var pp = x.kind === 'ee' ? ee : ia, late = x.due_on < today && !(pp && RH.stageDone(x.stage, pp, ex(pp)) >= 1); return '<div class="rh-item"><b>' + E(x.title) + '</b><span class="meta">' + RH.date(x.due_on) + ' · ' + E(RH.stageName(x.stage)) + (late ? ' · <span class="rh-badge warn">overdue</span>' : '') + '</span></div>'; }).join('') + '</div>' : '<p class="small muted">Your supervisor has not set deadlines yet.</p>') + '</div>' +
          '<div class="rh-card"><p class="label">💬 Recent feedback</p>' + (fb.length ? '<div class="rh-list">' + fb.map(function (f) { return '<div class="rh-item"><span class="meta">' + (f.source === 'ai' ? '<span class="rh-badge ai">AI</span>' : '<span class="rh-badge ok">Supervisor</span>') + ' ' + E(critName(f.criterion) || RH.stageName(f.stage) || '') + ' · ' + RH.date(f.created_at) + '</span><span class="small">' + E(f.comment.slice(0, 220)) + (f.comment.length > 220 ? '…' : '') + '</span></div>'; }).join('') + '</div>' : '<p class="small muted">No feedback yet.</p>') + ((ia || ee) ? '<a class="small" href="#/p/' + (ia || ee).id + '/feedback">Feedback centre →</a>' : '') + '</div></div>';
        m.innerHTML = h + RH.toolkit(false);
        if (!RH.cur) RH.curriculum();
      });
    }).catch(function (e) { m.innerHTML = '<div class="rh-card warn"><p>' + E(S.nice(e)) + '</p></div>'; });
  }
  var NEXT_TIP = { topic: 'Choose an area that interests you and read the background.', rq: 'Build a focused question with a named IV, range, DV and organism.', hypothesis: 'Write null and alternative hypotheses with a biological reason.', variables: 'Decide how you will change, measure and control each variable.', method: 'Write a method someone else could repeat exactly.', safety: 'Check safety, ethics and environmental issues before you collect data.', data: 'Enter your raw data with units and uncertainties, then lock the original.', analysis: 'Process your data and choose a suitable statistical test.', graphs: 'Draw a graph that answers your research question, with error bars.', conclusion: 'Answer the question using your numbers and the scientific context.', evaluation: 'Explain specific weaknesses and realistic improvements.', assess: 'Check the rubric, read your feedback and submit.' };

  function newProject(kind) {
    var me = RH.me, cls = (me.classes || []), isEE = kind === 'ee';
    var m = RH.shell(isEE ? 'EE' : 'IA', '<div class="rh-card"><h2>' + (isEE ? 'Start your Extended Essay' : 'Start your Biology IA') + '</h2><p>Choose the class whose teacher will supervise your ' + (isEE ? 'extended essay' : 'investigation') + '. They will see your work and give feedback.' + (isEE ? ' (If your school has given you a different EE supervisor, ask them to add you to one of their classes on VistaEd.)' : '') + '</p>' +
      '<div class="rh-field"><label for="rh-cls">Supervising class</label><select id="rh-cls">' + (cls.length ? cls.map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + '</option>'; }).join('') : '<option value="">No class yet</option>') + '</select>' +
      (cls.length ? '' : '<span class="tip">You have not joined a class yet. <a href="/dashboard/">Join your teacher\'s class</a> first, or start now and choose a class later.</span>') + '</div>' +
      '<div class="rh-field"><label for="rh-title">Working title</label><input type="text" id="rh-title" value="' + (isEE ? 'My extended essay' : 'My Biology investigation') + '" maxlength="160"></div>' +
      '<div class="btns"><button class="btn main" id="rh-go" type="button">' + (isEE ? 'Create my EE project' : 'Create my IA project') + '</button><a class="btn" href="#/">Cancel</a></div><p class="msg" id="rh-msg"></p></div>');
    m.querySelector('#rh-go').onclick = function () {
      var b = this; b.disabled = true;
      RH.curriculum(null, isEE ? 'ee' : 'ia').then(function (cur) {
        return S.db.from('research_projects').insert({ kind: isEE ? 'ee' : 'ia', subject: isEE ? 'Extended essay' : 'Biology', curriculum_id: cur && cur.id, class_id: m.querySelector('#rh-cls').value || null, title: m.querySelector('#rh-title').value.trim() || (isEE ? 'My extended essay' : 'My Biology investigation'), stage: isEE ? 'ee_subject' : 'topic', data: {} }).select('id').single();
      }).then(function (r) { if (r.error) throw r.error; location.hash = '#/p/' + r.data.id + '/' + (isEE ? 'ee_subject' : 'topic'); }).catch(function (e) { b.disabled = false; m.querySelector('#rh-msg').textContent = S.nice(e); });
    };
  }

  /* ---------- project pages: submissions, feedback, meetings, notebook, integrity, versions ---------- */
  var PAGES = {};
  function projHead(title, sub) { return '<div class="rh-card"><div class="rh-head"><div><p class="label">' + E(RH.p.title) + (RH.sup ? ' · supervisor view' : '') + '</p><h2>' + title + '</h2></div>' + RH.badge(RH.p.status) + '</div>' + (sub ? '<p class="small muted">' + sub + '</p>' : '') + '</div>'; }

  PAGES.submit = function () {
    var p = RH.p, m = RH.shell('submit', projHead('📤 Submission centre', 'Upload proposals, drafts, data files and your final report. Nothing is ever overwritten: each upload is a new numbered version with its date, and your supervisor approves or returns it.') + '<div id="rh-subs" class="rh-card"><p class="muted">Loading…</p></div>');
    var box = m.querySelector('#rh-subs');
    var load = function () {
      S.db.from('research_submissions').select('*').eq('project_id', p.id).order('submitted_at', { ascending: false }).then(function (r) {
        var subs = r.data || [];
        var drafts = subs.filter(function (x) { return x.stage === 'draft'; });
        var eeNote = p.kind === 'ee' ? '<div class="rh-card tint" style="padding:12px"><p class="small"><b>Extended essay rules:</b> your supervisor reads and comments on <b>one draft only</b> (after the interim reflection, before the viva voce), and the <b>final version is handed in before the viva voce</b>; it cannot be changed afterwards.' + (RH.sup && drafts.some(function (x) { return x.status !== 'submitted'; }) ? ' <b>You have already responded to a draft: further drafts should not receive comments.</b>' : '') + '</p></div>' : '';
        var form = (RH.owner ? '<h3>New submission</h3><div class="two"><div class="rh-field"><label for="sb-stage">What is it?</label><select id="sb-stage"><option value="proposal">Proposal</option><option value="draft">Draft report</option><option value="data">Data file</option><option value="final">Final report</option></select></div>' +
          '<div class="rh-field"><label for="sb-file">File (DOCX, PDF, CSV or XLSX, up to 25 MB)</label><input type="file" id="sb-file" accept=".docx,.pdf,.csv,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div></div>' +
          '<div class="rh-field"><label for="sb-note">Note to your supervisor (optional)</label><textarea id="sb-note" maxlength="2000"></textarea></div>' +
          '<label class="chk small"><input type="checkbox" id="sb-own"> This is my own work. I have acknowledged every source and recorded any AI assistance in my <a href="#/p/' + p.id + '/integrity">integrity record</a>.</label>' +
          '<div class="btns"><button class="btn main" id="sb-go" type="button">Submit</button><span class="small muted" id="sb-msg"></span></div><hr style="border:0;border-top:1px solid var(--line)">' : '') + eeNote;
        box.innerHTML = form + '<h3>History</h3>' + (subs.length ? '<div class="scroll"><table class="dt"><thead><tr><th>Stage</th><th>Version</th><th>File</th><th>Words</th><th>Submitted</th><th>Status</th><th>Supervisor</th></tr></thead><tbody>' + subs.map(function (s) {
          return '<tr><td>' + E(s.stage) + '</td><td>v' + s.version + '</td><td>' + (s.file_path ? '<a href="#" data-f="' + E(s.file_path) + '">' + E(s.file_name) + '</a>' : '—') + (s.note ? '<div class="small muted">' + E(s.note) + '</div>' : '') + '</td><td>' + (s.word_count || '') + '</td><td>' + RH.date(s.submitted_at, true) + '</td><td>' + (s.status === 'approved' ? '<span class="rh-badge ok">Approved</span>' : s.status === 'returned' ? '<span class="rh-badge warn">Returned</span>' : '<span class="rh-badge info">Submitted</span>') + (s.decision_note ? '<div class="small">' + E(s.decision_note) + '</div>' : '') + '</td><td>' +
            (RH.sup && s.status === 'submitted' ? '<div class="btns"><button class="btn xs" data-ok="' + s.id + '" type="button">Approve</button><button class="btn xs bad" data-ret="' + s.id + '" type="button">Return for revision</button></div>' : (s.decided_at ? RH.date(s.decided_at) : '')) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="small muted">Nothing submitted yet.</p>');
        box.querySelectorAll('[data-f]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); S.db.storage.from('research-files').createSignedUrl(a.dataset.f, 600).then(function (u) { if (u.error) return RH.err(u.error); window.open(u.data.signedUrl, '_blank', 'noopener'); }); }; });
        var decide = function (id, status) { var note = prompt(status === 'approved' ? 'Comment for the student (optional):' : 'What should the student revise?') ; if (note === null) return; S.db.from('research_submissions').update({ status: status, decision_note: note || null }).eq('id', id).then(function (r) { if (r.error) return RH.err(r.error); RH.toast(status === 'approved' ? 'Approved' : 'Returned for revision'); S.db.from('research_projects').select('status').eq('id', p.id).single().then(function (x) { if (x.data) p.status = x.data.status; load(); }); }); };
        box.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { decide(b.dataset.ok, 'approved'); }; });
        box.querySelectorAll('[data-ret]').forEach(function (b) { b.onclick = function () { decide(b.dataset.ret, 'returned'); }; });
        var fileIn = box.querySelector('#sb-file'), autoRep = null;
        if (fileIn) { var ck = document.createElement('div'); ck.id = 'sb-check'; fileIn.closest('.two').after(ck);
          fileIn.onchange = function () { var f = fileIn.files[0]; autoRep = null; ck.innerHTML = ''; if (!f || !/\.(docx|pdf)$/i.test(f.name) || box.querySelector('#sb-stage').value === 'data') return; ck.innerHTML = '<p class="small muted">Checking ' + E(f.name) + ' automatically…</p>';
            RH.check.read(f).then(function (doc) { autoRep = RH.check.analyse(doc, p.kind); RH.check.save(autoRep); ck.innerHTML = RH.check.reportHtml(autoRep) + (autoRep.counts.no ? '<label class="chk small"><input type="checkbox" id="sb-ack"> I have read the automatic check. I understand ' + autoRep.counts.no + ' item(s) are marked "fix before submitting" and I still want to submit.</label>' : ''); })
              .catch(function (e) { ck.innerHTML = '<p class="small muted">The automatic check could not read this file (' + E(S.nice(e)) + '). You can still submit it.</p>'; }); }; }
        var go = box.querySelector('#sb-go'); if (go) go.onclick = function () {
          var f = box.querySelector('#sb-file').files[0], msg = box.querySelector('#sb-msg'), stage = box.querySelector('#sb-stage').value;
          if (autoRep && autoRep.counts.no && !(box.querySelector('#sb-ack') || {}).checked) { msg.textContent = 'Read the automatic check first, then tick the box under it (or fix the file and choose it again).'; return; }
          if (!f) { msg.textContent = 'Choose a file first.'; return; }
          if (!/\.(docx|pdf|csv|xlsx)$/i.test(f.name)) { msg.textContent = 'Use a DOCX, PDF, CSV or XLSX file.'; return; }
          if (f.size > 25 * 1024 * 1024) { msg.textContent = 'The file is larger than 25 MB.'; return; }
          if (!box.querySelector('#sb-own').checked) { msg.textContent = 'Tick the declaration first.'; return; }
          go.disabled = true; msg.textContent = 'Uploading…';
          var path = p.id + '/' + Date.now() + '-' + f.name.replace(/[^A-Za-z0-9._-]+/g, '_');
          RH.saveNow().then(function () { return S.db.storage.from('research-files').upload(path, f, { contentType: f.type || 'application/octet-stream', upsert: false }); }).then(function (u) {
            if (u.error) throw u.error;
            return S.db.from('research_submissions').insert({ project_id: p.id, stage: stage, file_path: path, file_name: f.name, mime: f.type, size_bytes: f.size, word_count: p.word_count || null, note: ((box.querySelector('#sb-note').value.trim() || '') + (autoRep ? ' [Automatic check: ' + autoRep.counts.no + ' to fix, ' + autoRep.counts.mid + ' to check, about ' + autoRep.words + ' words]' : '')).trim() || null });
          }).then(function (r) { if (r.error) throw r.error; RH.toast('Submitted'); if (p.kind === 'ee' && stage === 'draft') RH.set('ee_flags.draft', true); if (stage === 'proposal') p.status = 'proposal_submitted'; if (stage === 'final') p.status = 'final_submitted'; RH.snapshot('submission:' + stage, p.data, 'Snapshot at ' + stage + ' submission').catch(function () {}); load(); })
            .catch(function (e) { go.disabled = false; msg.textContent = S.nice(e); });
        };
      });
    };
    load();
  };

  PAGES.feedback = function () {
    var p = RH.p, m = RH.shell('feedback', projHead('💬 Feedback centre', 'Supervisor feedback is your teacher\'s judgement. AI feedback is indicative only: it is not a mark and not an IB decision.') + '<div id="rh-fb" class="grp"><p class="muted">Loading…</p></div>');
    S.db.from('research_feedback').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).then(function (r) {
      var f = r.data || [], box = m.querySelector('#rh-fb'), crit = (RH.cur && RH.cur.criteria) || [];
      var latest = {}; f.filter(function (x) { return x.source === 'teacher' && x.mark != null; }).forEach(function (x) { if (!latest[x.criterion]) latest[x.criterion] = x; });
      var tot = crit.reduce(function (s, c) { return s + (latest[c.key] ? latest[c.key].mark : 0); }, 0), any = crit.some(function (c) { return latest[c.key]; });
      var pg = f.filter(function (x) { return x.criterion === 'predicted'; })[0];
      var h = p.kind === 'ee' ? '<div class="rh-card"><h3>Predicted grade</h3><p>' + (pg ? '<b>' + E(pg.comment) + '</b> <span class="small muted">(' + RH.date(pg.created_at) + ')</span>' : '<span class="muted">Not recorded yet.</span>') + '</p><p class="small muted">Your extended essay is marked by IB examiners out of 30. Your supervisor does not mark it; they predict a grade from the grade descriptors.</p></div>' : '<div class="rh-card"><h3>Supervisor\'s criterion marks</h3><div class="rh-kpi">' + crit.map(function (c) { return '<div><b>' + (latest[c.key] ? latest[c.key].mark : '–') + '<small style="font-size:.9rem">/' + c.max + '</small></b><span>' + E(c.name) + '</span></div>'; }).join('') + '<div><b>' + (any ? tot : '–') + '<small style="font-size:.9rem">/' + crit.reduce(function (s, c) { return s + c.max; }, 0) + '</small></b><span>Total (school assessment, not final)</span></div></div><p class="small muted">Marks are your supervisor\'s best-fit judgement against the markbands. They are not guaranteed: IB moderation can change them.</p></div>';
      var tabs = [['all', 'All'], ['teacher', 'Supervisor'], ['ai', 'AI mentor']];
      h += '<div class="rh-tabs" role="tablist">' + tabs.map(function (t, i) { return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="fb-list" class="rh-list"></div>';
      box.innerHTML = h;
      var show = function (t) { box.querySelector('#fb-list').innerHTML = f.filter(function (x) { return t === 'all' || x.source === t; }).map(function (x) { return '<div class="rh-card ' + (x.source === 'ai' ? 'ai' : 'tch') + '"><div class="rh-head"><b>' + E(critName(x.criterion) || RH.stageName(x.stage) || 'General') + (x.mark != null ? ' · ' + x.mark + ' marks' : '') + '</b><span class="rh-badge ' + (x.source === 'ai' ? 'ai' : 'ok') + '">' + (x.source === 'ai' ? 'AI feedback' : 'Supervisor') + '</span></div><div style="white-space:pre-wrap" class="small">' + E(x.comment) + '</div>' + (x.evidence ? '<p class="small muted"><b>Evidence:</b> ' + E(x.evidence) + '</p>' : '') + '<span class="small muted">' + RH.date(x.created_at, true) + '</span></div>'; }).join('') || '<p class="small muted">Nothing here yet.</p>'; };
      box.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { box.querySelectorAll('[data-t]').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); show(b.dataset.t); }; });
      show('all');
    });
  };

  PAGES.meetings = function () {
    var p = RH.p, m = RH.shell('meetings', projHead('🗓️ Supervision meetings', 'Meeting records for your investigation: agenda, notes, your reflection, your supervisor\'s comments and agreed actions. Your reflections must be your own words.') + '<div id="rh-mt" class="grp"><p class="muted">Loading…</p></div>');
    var box = m.querySelector('#rh-mt');
    var load = function () {
      S.db.from('research_meetings').select('*').eq('project_id', p.id).order('meeting_at', { ascending: true, nullsFirst: false }).then(function (r) {
        var ms = r.data || [];
        box.innerHTML = '<div class="btns"><button class="btn main sm" id="mt-new" type="button">' + (RH.sup ? 'Schedule a meeting' : 'Add a meeting record') + '</button></div>' + (ms.length ? ms.map(function (x, i) {
          return '<div class="rh-card' + (x.concern ? ' warn' : '') + '" data-id="' + x.id + '"><div class="rh-head"><h3>Meeting ' + (i + 1) + (x.meeting_at ? ' · ' + RH.date(x.meeting_at, true) : '') + '</h3>' + (x.concern ? '<span class="rh-badge warn">Concern flagged</span>' : '') + '</div>' +
            '<div class="two"><div class="rh-field"><label>Date and time</label><input type="datetime-local" data-k="meeting_at" value="' + (x.meeting_at ? new Date(new Date(x.meeting_at).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : '') + '"></div><div class="rh-field"><label>Agenda</label><input type="text" data-k="agenda" value="' + E(x.agenda || '') + '"></div></div>' +
            '<div class="rh-field"><label>Discussion notes and progress since the last meeting</label><textarea data-k="notes">' + E(x.notes || '') + '</textarea></div>' +
            '<div class="rh-field"><label>Student reflection' + (RH.sup ? ' (written by the student)' : '') + '</label><textarea data-k="student_reflection"' + (RH.sup ? ' readonly' : '') + '>' + E(x.student_reflection || '') + '</textarea></div>' +
            '<div class="rh-field"><label>Supervisor comment' + (RH.owner ? ' (written by your supervisor)' : '') + '</label><textarea data-k="supervisor_comment"' + (RH.owner ? ' readonly' : '') + '>' + E(x.supervisor_comment || '') + '</textarea></div>' +
            '<div class="rh-field"><label>Agreed action points and outstanding challenges</label><textarea data-k="actions">' + E(x.actions || '') + '</textarea></div>' +
            (RH.sup ? '<label class="chk small"><input type="checkbox" data-k="concern"' + (x.concern ? ' checked' : '') + '> Flag a concern (shows on your supervisor dashboard)</label>' : '') +
            '<div class="btns"><button class="btn sm" data-save type="button">Save meeting</button></div></div>'; }).join('') : '<p class="small muted">No meetings recorded yet.</p>');
        box.querySelector('#mt-new').onclick = function () { S.db.from('research_meetings').insert({ project_id: p.id, kind: 'supervision', meeting_at: new Date().toISOString() }).then(function (r) { if (r.error) return RH.err(r.error); load(); }); };
        box.querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () {
          var card = b.closest('[data-id]'), up = { updated_at: new Date().toISOString() };
          card.querySelectorAll('[data-k]').forEach(function (i) { if (i.readOnly) return; var k = i.dataset.k; up[k] = i.type === 'checkbox' ? i.checked : i.type === 'datetime-local' ? (i.value ? new Date(i.value).toISOString() : null) : i.value; });
          S.db.from('research_meetings').update(up).eq('id', card.dataset.id).then(function (r) { if (r.error) return RH.err(r.error); RH.toast('Meeting saved'); });
        }; });
      });
    };
    load();
  };

  PAGES.notebook = function () {
    var p = RH.p, nb = RH.get('notebook', []);
    var m = RH.shell('notebook', projHead(p.kind === 'ee' ? '📓 Researcher\'s reflection space (RRS)' : '📓 Research notebook', p.kind === 'ee' ? 'Your ongoing record of reading, ideas, decisions, challenges and emerging questions, as the guide recommends. Share extracts in your reflection sessions; it is the best source for your reflective statement.' : 'A dated record of your decisions, observations, problems and discoveries. It is the evidence of your own thinking, and helps when you write the evaluation.') +
      (RH.owner ? '<div class="rh-card"><div class="two"><div class="rh-field"><label for="nb-kind">Type</label><select id="nb-kind"><option>Decision</option><option>Observation</option><option>Challenge</option><option>Discovery</option><option>Idea</option><option>Reading</option><option>Emerging question</option><option>Reflection</option></select></div></div><div class="rh-field"><label for="nb-text">Entry</label><textarea id="nb-text"></textarea></div><div class="btns"><button class="btn main sm" id="nb-add" type="button">Add entry</button></div></div>' : '') +
      '<div class="rh-list" id="nb-list"></div>');
    var draw = function () { m.querySelector('#nb-list').innerHTML = nb.slice().reverse().map(function (x) { return '<div class="rh-item"><span class="meta"><b>' + E(x.kind) + '</b> · ' + RH.date(x.at, true) + '</span><span style="white-space:pre-wrap">' + E(x.text) + '</span></div>'; }).join('') || '<p class="small muted">No entries yet.</p>'; };
    draw();
    var add = m.querySelector('#nb-add'); if (add) add.onclick = function () { var t = m.querySelector('#nb-text').value.trim(); if (!t) return; nb.push({ at: new Date().toISOString(), kind: m.querySelector('#nb-kind').value, text: t }); RH.set('notebook', nb); m.querySelector('#nb-text').value = ''; draw(); };
  };

  PAGES.integrity = function () {
    var p = RH.p, m = RH.shell('integrity', projHead('🛡️ Academic integrity', 'Your record of AI assistance and source acknowledgement. Use AI as a mentor, record how you used it, and follow your school\'s academic integrity policy and current IB guidance.') + '<div id="rh-ai" class="grp"><p class="muted">Loading…</p></div>');
    var box = m.querySelector('#rh-ai');
    S.db.from('research_ai_log').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).then(function (r) {
      var log = r.data || [], ck = RH.get('integrity.checks', {});
      var items = [['cite', 'Every source of information, image, data set and idea that is not mine is cited in the text and in the reference list.'], ['quote', 'Direct quotations are in quotation marks with their source.'], ['para', 'Paraphrases are in my own words and still cited.'], ['data', 'All data are my own (or from a named database), and nothing has been invented or changed to fit the hypothesis.'], ['ai', 'Any AI assistance is recorded below and acknowledged as my school requires.'], ['refs', 'References follow one consistent style and can be traced (author, date, title, publisher or URL and date accessed).']];
      box.innerHTML = '<div class="rh-card"><h3>Source acknowledgement checklist</h3>' + items.map(function (x) { return '<label class="chk small"><input type="checkbox" data-c="' + x[0] + '"' + (ck[x[0]] ? ' checked' : '') + (RH.owner ? '' : ' disabled') + '> ' + E(x[1]) + '</label>'; }).join('') + '</div>' +
        '<div class="rh-card"><h3>Similarity reports</h3><p class="small">This site does not run a plagiarism checker. If your school uses a licensed service (such as Turnitin), upload its report as a data file in the <a href="#/p/' + p.id + '/submit">Submission centre</a>. A similarity percentage is not proof of plagiarism: quotations, references and common phrases also match, so every report needs a person to read it.</p></div>' +
        '<div class="rh-card"><h3>AI-assistance history</h3>' + (RH.owner ? '<p class="small">The Research Mentor is recorded automatically. Add any other AI tool you used (tool, date, and what you used it for).</p><div class="two"><div class="rh-field"><label for="ai-tool">Tool</label><input type="text" id="ai-tool" placeholder="e.g. a chatbot, a translator, a grammar checker"></div><div class="rh-field"><label for="ai-sum">How you used it</label><input type="text" id="ai-sum" placeholder="e.g. to explain what a t-test assumes"></div></div><div class="btns"><button class="btn sm" id="ai-add" type="button">Add to my record</button></div>' : '') +
        (log.length ? '<div class="scroll"><table class="dt"><thead><tr><th>Date</th><th>Tool</th><th>Use</th><th>Recorded by</th></tr></thead><tbody>' + log.map(function (x) { return '<tr><td>' + RH.date(x.created_at, true) + '</td><td>' + E(x.tool) + '</td><td>' + E(x.summary || '') + '</td><td>' + (x.kind === 'disclosure' ? 'Student' : 'Automatic') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="small muted">No AI assistance recorded.</p>') + '</div>';
      box.querySelectorAll('[data-c]').forEach(function (c) { c.onchange = function () { ck[c.dataset.c] = c.checked; RH.set('integrity.checks', ck); }; });
      var add = box.querySelector('#ai-add'); if (add) add.onclick = function () { var t = box.querySelector('#ai-tool').value.trim(); if (!t) return; S.db.from('research_ai_log').insert({ project_id: p.id, kind: 'disclosure', tool: t, summary: box.querySelector('#ai-sum').value.trim() || null }).then(function (r) { if (r.error) return RH.err(r.error); PAGES.integrity(); }); };
    });
  };

  PAGES.versions = function () {
    var p = RH.p, m = RH.shell('versions', projHead('🕘 Version history', 'Saved versions of each stage and a snapshot at every submission. Compare any version with your current work; restore one if you need to.') + '<div id="rh-v" class="grp"><p class="muted">Loading…</p></div>');
    S.db.from('research_versions').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).limit(200).then(function (r) {
      var vs = r.data || [], box = m.querySelector('#rh-v');
      if (!vs.length) { box.innerHTML = '<p class="small muted">No versions yet. Use "Save a version of this stage" at the bottom of any stage, or submit work.</p>'; return; }
      box.innerHTML = '<div class="rh-list">' + vs.map(function (v, i) { return '<div class="rh-item"><div class="rh-head"><b>' + E(v.section.indexOf('submission:') === 0 ? 'Whole project at ' + v.section.slice(11) + ' submission' : v.section.indexOf('dataset:') === 0 ? 'Data set' : RH.stageName(v.section)) + '</b><span class="meta">' + RH.date(v.created_at, true) + (v.note ? ' · ' + E(v.note) : '') + '</span></div><div class="btns"><button class="btn xs" data-cmp="' + i + '" type="button">Compare with now</button>' + (RH.owner && v.section.indexOf(':') < 0 ? '<button class="btn xs" data-res="' + i + '" type="button">Restore this version</button>' : '') + '</div><div data-out="' + i + '"></div></div>'; }).join('') + '</div>';
      var flat = function (o) { var out = []; (function f(x) { if (x == null) return; if (typeof x === 'string' || typeof x === 'number') out.push(String(x)); else if (Array.isArray(x)) x.forEach(f); else Object.keys(x).forEach(function (k) { f(x[k]); }); })(o); return out.join('\n'); };
      box.querySelectorAll('[data-cmp]').forEach(function (b) { b.onclick = function () { var v = vs[+b.dataset.cmp], now = v.section.indexOf('submission:') === 0 ? p.data : p.data[v.section]; box.querySelector('[data-out="' + b.dataset.cmp + '"]').innerHTML = '<div class="rh-diff small" style="white-space:pre-wrap;border:1px solid var(--line);border-radius:10px;padding:8px;margin-top:6px">' + RH.diff(flat(v.data), flat(now)) + '</div><p class="small muted"><del>removed since then</del> · <ins>added since then</ins></p>'; }; });
      box.querySelectorAll('[data-res]').forEach(function (b) { b.onclick = function () { var v = vs[+b.dataset.res]; if (!confirm('Replace your current "' + RH.stageName(v.section) + '" with this version? Your current text is saved as a version first.')) return; RH.snapshot(v.section, p.data[v.section] || {}, 'Before restoring an older version').then(function () { p.data[v.section] = v.data; RH.dirty(); RH.toast('Version restored'); }); }; });
    });
  };
  RH.diff = function (a, b) {   // word-level difference (longest common subsequence), for comparing drafts
    var x = a.split(/(\s+)/), y = b.split(/(\s+)/); if (x.length * y.length > 4e6) return E(b);
    var n = x.length, mm = y.length, L = []; for (var i = 0; i <= n; i++) L.push(new Uint16Array(mm + 1));
    for (i = n - 1; i >= 0; i--) for (var j = mm - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var out = [], ii = 0, jj = 0; while (ii < n && jj < mm) { if (x[ii] === y[jj]) { out.push(E(x[ii])); ii++; jj++; } else if (L[ii + 1][jj] >= L[ii][jj + 1]) { out.push('<del>' + E(x[ii]) + '</del>'); ii++; } else { out.push('<ins>' + E(y[jj]) + '</ins>'); jj++; } }
    while (ii < n) out.push('<del>' + E(x[ii++]) + '</del>'); while (jj < mm) out.push('<ins>' + E(y[jj++]) + '</ins>'); return out.join('');
  };

  /* ---------- supervisor dashboard ---------- */
  function teacherHome() {
    var m = RH.shell('#/teacher', '<p class="muted">Loading your students\' research…</p>');
    Promise.all([
      S.db.from('research_projects').select('id,student_id,kind,title,rq,stage,status,data,word_count,class_id,updated_at').neq('status', 'archived').order('updated_at', { ascending: false }),
      S.db.from('research_submissions').select('id,project_id,stage,status,submitted_at').eq('status', 'submitted'),
      S.db.from('research_meetings').select('project_id,concern').eq('concern', true),
      S.db.from('research_milestones').select('*').not('class_id', 'is', null)
    ]).then(function (x) {
      var ps = (x[0].data || []).filter(function (p) { return p.student_id !== RH.me.user.id; }), subs = x[1].data || [], concern = x[2].data || [], ms = x[3].data || [];
      var sids = ps.map(function (p) { return p.student_id; }).filter(function (v, i, a) { return a.indexOf(v) === i; }), cids = ps.map(function (p) { return p.class_id; }).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; });
      return Promise.all([sids.length ? S.db.from('profiles').select('id,full_name').in('id', sids) : { data: [] }, cids.length ? S.db.from('classes').select('id,name').in('id', cids) : { data: [] }]).then(function (y) {
        var names = {}, cls = {}; (y[0].data || []).forEach(function (r) { names[r.id] = r.full_name || 'Student'; }); (y[1].data || []).forEach(function (r) { cls[r.id] = r.name; });
        var today = new Date().toISOString().slice(0, 10), weekAgo = new Date(Date.now() - 14 * 864e5).toISOString();
        var late = function (p) { return ms.some(function (q) { return q.class_id === p.class_id && (q.kind || 'ia') === p.kind && q.due_on < today && RH.stageDone(q.stage, p, {}) < 1; }); };
        var awaitingP = subs.filter(function (s) { return s.stage === 'proposal'; }).length, awaitingF = subs.length - awaitingP;
        var needs = ps.filter(function (p) { return late(p) || concern.some(function (c) { return c.project_id === p.id; }) || p.updated_at < weekAgo || p.status === 'returned'; });
        var h = '<section class="rh-hero"><p class="label">Supervisor dashboard</p><h1>Research supervision</h1><p>Every IA and extended essay your students have started in the classes you teach.</p></section>' +
          '<div class="rh-kpi"><div><b>' + sids.length + '</b><span>Students</span></div><div><b>' + ps.filter(function (p) { return p.kind === 'ia'; }).length + '</b><span>IA projects</span></div><div><b>' + ps.filter(function (p) { return p.kind === 'ee'; }).length + '</b><span>EE projects</span></div><div><b>' + awaitingP + '</b><span>Proposals awaiting approval</span></div><div><b>' + awaitingF + '</b><span>Drafts and finals awaiting feedback</span></div><div><b>' + ps.filter(late).length + '</b><span>Past a deadline</span></div><div><b>' + needs.length + '</b><span>May need intervention</span></div></div>';
        h += '<div class="rh-card"><div class="rh-head"><h2>Students</h2><div class="btns"><select id="tf-cls" aria-label="Class"><option value="">All classes</option>' + cids.map(function (c) { return '<option value="' + c + '">' + E(cls[c] || 'Class') + '</option>'; }).join('') + '</select><select id="tf-st" aria-label="Status"><option value="">Any status</option>' + Object.keys(RH.STATUS).map(function (k) { return '<option value="' + k + '">' + RH.STATUS[k][0] + '</option>'; }).join('') + '<option value="needs">Needs intervention</option></select><button class="btn sm" id="tf-csv" type="button">Download class report (CSV)</button></div></div><div class="scroll" id="tf-tab"></div></div>' + RH.toolkit(true);
        m.innerHTML = h;
        var rowsFor = function () { var c = m.querySelector('#tf-cls').value, s = m.querySelector('#tf-st').value; return ps.filter(function (p) { return (!c || p.class_id === c) && (!s || (s === 'needs' ? needs.indexOf(p) >= 0 : p.status === s)); }); };
        var draw = function () {
          var rs = rowsFor();
          m.querySelector('#tf-tab').innerHTML = rs.length ? '<table class="dt"><thead><tr><th>Student</th><th>Class</th><th>Project</th><th>Stage</th><th>Progress</th><th>Words</th><th>Status</th><th>Waiting for you</th><th>Updated</th></tr></thead><tbody>' + rs.map(function (p) {
            var pr = RH.progress(p, {}), wait = subs.filter(function (s) { return s.project_id === p.id; }).map(function (s) { return s.stage; });
            return '<tr><td><a href="#/p/' + p.id + '/' + RH.lastStage(p) + '">' + E(names[p.student_id] || 'Student') + '</a>' + (needs.indexOf(p) >= 0 ? ' <span class="rh-badge warn">check in</span>' : '') + '</td><td>' + E(cls[p.class_id] || '—') + '</td><td><span class="rh-badge ' + (p.kind === 'ee' ? 'ai' : 'info') + '">' + (p.kind === 'ee' ? 'EE' : 'IA') + '</span> ' + E(p.title) + '<div class="small muted">' + E((p.rq || '').slice(0, 90)) + '</div></td><td>' + E(RH.stageName(p.stage)) + '</td><td><div class="rh-prog" style="min-width:70px"><i style="width:' + pr + '%"></i></div><span class="small">' + pr + '%</span></td><td class="num">' + (p.word_count || 0) + '</td><td>' + RH.badge(p.status) + '</td><td>' + (wait.length ? '<a class="rh-badge info" href="#/p/' + p.id + '/submit">' + E(wait.join(', ')) + '</a>' : '') + '</td><td>' + RH.date(p.updated_at) + '</td></tr>'; }).join('') + '</tbody></table>'
            : '<p class="small muted">' + (ps.length ? 'No projects match the filter.' : 'None of your students has started an IA yet. Ask them to open <b>/research/</b> and choose your class as their supervising class.') + '</p>';
        };
        m.querySelector('#tf-cls').onchange = draw; m.querySelector('#tf-st').onchange = draw; draw();
        m.querySelector('#tf-csv').onclick = function () {
          var rs = rowsFor(), q = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
          var csv = ['Student,Class,Title,Research question,Stage,Progress %,Words,Status,Last updated'].concat(rs.map(function (p) { return [names[p.student_id], cls[p.class_id], p.title, p.rq, RH.stageName(p.stage), RH.progress(p, {}), p.word_count, (RH.STATUS[p.status] || [p.status])[0], p.updated_at].map(q).join(','); })).join('\n');
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'research-progress-' + today + '.csv'; a.click();
        };
      });
    }).catch(function (e) { m.innerHTML = '<div class="rh-card warn"><p>' + E(S.nice(e)) + '</p></div>'; });
  }

  function milestonesPage() {
    var m = RH.shell('#/teacher/milestones', '<div class="rh-card"><h2>📅 Milestones and deadlines</h2><p class="small muted">Set a due date for each IA or EE stage per class. Each deadline is also put on every student\'s dashboard (To do) and ticks itself off when they finish the stage; overdue stages show on your supervisor dashboard. You can also set these from your teacher dashboard: <b>📌 Set work → 🔬 Research Hub</b>.</p></div><div id="ms-box" class="grp"><p class="muted">Loading…</p></div>');
    var box = m.querySelector('#ms-box');
    var load = function () {
      S.db.from('classes').select('id,name').is('deleted_at', null).order('name').then(function (cr) {
        var mineCls = (cr.data || []);   // RLS returns the classes this teacher can see; teaches_class decides who can write milestones
        return S.db.from('research_milestones').select('*').not('class_id', 'is', null).order('due_on').then(function (r) {
          var ms = r.data || [];
          box.innerHTML = '<div class="rh-card"><h3>Add a milestone</h3><div class="two"><div class="rh-field"><label for="ms-c">Class</label><select id="ms-c">' + mineCls.map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + '</option>'; }).join('') + '</select></div><div class="rh-field"><label for="ms-s">IA stage</label><select id="ms-s"><optgroup label="Biology IA">' + RH.IA.map(function (s) { return '<option value="ia:' + s.k + '">' + E(s.n) + '</option>'; }).join('') + '</optgroup><optgroup label="Extended Essay">' + (RH.EE || []).concat([{ k: 'ee_draft', n: 'Draft submission' }, { k: 'ee_viva', n: 'Viva voce' }]).map(function (s) { return '<option value="ee:' + s.k + '">' + E(s.n) + '</option>'; }).join('') + '</optgroup></select></div><div class="rh-field"><label for="ms-d">Due</label><input type="date" id="ms-d"></div><div class="rh-field"><label for="ms-t">Title</label><input type="text" id="ms-t" placeholder="e.g. Proposal and research question"></div></div><div class="btns"><button class="btn main sm" id="ms-add" type="button">Add milestone</button></div></div>' +
            '<div class="rh-card"><h3>Current milestones</h3>' + (ms.length ? '<table class="dt"><thead><tr><th>Class</th><th>Stage</th><th>Title</th><th>Due</th><th></th></tr></thead><tbody>' + ms.map(function (x) { var c = mineCls.filter(function (q) { return q.id === x.class_id; })[0]; return '<tr><td>' + E(c ? c.name : '') + '</td><td>' + (x.kind === 'ee' ? 'EE · ' : 'IA · ') + E(RH.stageName(x.stage)) + '</td><td>' + E(x.title) + '</td><td>' + RH.date(x.due_on) + '</td><td><button class="btn xs bad" data-del="' + x.id + '" type="button">Remove</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="small muted">None yet.</p>') + '</div>';
          box.querySelector('#ms-add').onclick = function () { var d = box.querySelector('#ms-d').value; if (!d) return RH.toast('Choose a date'); var ks = box.querySelector('#ms-s').value.split(':'); S.db.from('research_milestones').insert({ class_id: box.querySelector('#ms-c').value, kind: ks[0], stage: ks[1], title: box.querySelector('#ms-t').value.trim() || (ks[0] === 'ee' ? 'EE: ' : 'IA: ') + RH.stageName(ks[1]), due_on: d }).then(function (r) { if (r.error) return RH.err(r.error);
              var cid = box.querySelector('#ms-c').value, ttl = box.querySelector('#ms-t').value.trim() || (ks[0] === 'ee' ? 'Extended essay: ' : 'IA: ') + RH.stageName(ks[1]);   // the same work on every student's dashboard (To do), ticked off when they finish the stage
              S.db.rpc('assign_work', { cls: cid, title: ttl, kind: 'task', ref: 'research:' + ks[0] + ':' + ks[1], url: '/research/', instructions: 'Open the Research Hub, choose your project and complete this stage.', due: new Date(d + 'T23:59').toISOString(), students: null }).then(function (z) {
                RH.toast(z.error ? 'Deadline saved; it could not be added to the to-do list: ' + S.nice(z.error) : 'Deadline saved and added to every student\'s to-do list'); load(); }); }); };
          box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this milestone? It is also taken off the students\' to-do lists.')) return; var x = ms.filter(function (q) { return q.id === b.dataset.del; })[0];
            S.db.from('research_milestones').delete().eq('id', b.dataset.del).then(function (r) { if (r.error) return RH.err(r.error);
              (x && x.class_id ? S.db.from('assignments').delete().eq('class_id', x.class_id).eq('ref', 'research:' + (x.kind || 'ia') + ':' + x.stage) : Promise.resolve()).then(function () { load(); }, function () { load(); }); }); }; });
        });
      });
    };
    load();
  }

  /* ---------- admin: curriculum versions and their criteria ---------- */
  function admin() {
    var m = RH.shell('#/admin', '<div class="rh-card"><h2>🛠️ Curriculum and assessment configuration</h2><p class="small">Each project records the curriculum version it follows. When the IB publishes a new guide, add a new version (or edit this one) here: the Studio, rubric and Mentor use whatever is stored, with no rebuild.</p></div><div id="ad-box" class="grp"><p class="muted">Loading…</p></div>');
    var box = m.querySelector('#ad-box');
    S.db.from('research_curricula').select('*').order('created_at').then(function (r) {
      var cs = r.data || [];
      box.innerHTML = cs.map(function (c, i) {
        return '<div class="rh-card" data-i="' + i + '"><div class="rh-head"><h3>' + E(c.title) + '</h3><span class="rh-badge ' + (c.active ? 'ok' : '') + '">' + (c.active ? 'Active' : 'Inactive') + '</span></div><div class="two"><div class="rh-field"><label>Title</label><input type="text" data-k="title" value="' + E(c.title) + '"></div><div class="rh-field"><label>Guide</label><input type="text" data-k="guide" value="' + E(c.guide) + '"></div><div class="rh-field"><label>Sessions</label><input type="text" data-k="sessions" value="' + E(c.sessions) + '"></div><div class="rh-field"><label>Word limit</label><input type="number" data-k="word_limit" value="' + (c.word_limit || '') + '"></div></div>' +
          '<div class="rh-field"><label>Notes</label><textarea data-k="notes">' + E(c.notes || '') + '</textarea></div><div class="rh-field"><label>Criteria (JSON: key, name, max, assesses, bands [min, max, d], clar)</label><textarea class="tall" data-k="criteria" style="font-family:monospace;font-size:.8rem;min-height:260px">' + E(JSON.stringify(c.criteria, null, 1)) + '</textarea><span class="tip">Total: ' + (c.criteria || []).reduce(function (s, x) { return s + (x.max || 0); }, 0) + ' marks across ' + (c.criteria || []).length + ' criteria.</span></div>' +
          '<label class="chk small"><input type="checkbox" data-k="active"' + (c.active ? ' checked' : '') + '> Active (new projects use the newest active version)</label><div class="btns"><button class="btn main sm" data-save type="button">Save</button><button class="btn sm" data-copy type="button">Copy as a new version</button></div></div>'; }).join('');
      var read = function (card) { var o = {}; card.querySelectorAll('[data-k]').forEach(function (i) { o[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? (+i.value || null) : i.value; }); o.criteria = JSON.parse(o.criteria); if (!Array.isArray(o.criteria) || o.criteria.some(function (x) { return !x.key || !x.name || !x.max || !Array.isArray(x.bands); })) throw new Error('Each criterion needs key, name, max and bands.'); o.updated_at = new Date().toISOString(); o.updated_by = RH.me.user.id; return o; };
      box.querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () { var card = b.closest('[data-i]'), c = cs[+card.dataset.i]; try { var o = read(card); } catch (e) { return RH.toast('Not saved: ' + e.message); } S.db.from('research_curricula').update(o).eq('id', c.id).then(function (r) { if (r.error) return RH.err(r.error); RH.toast('Saved'); }); }; });
      box.querySelectorAll('[data-copy]').forEach(function (b) { b.onclick = function () { var card = b.closest('[data-i]'), c = cs[+card.dataset.i]; try { var o = read(card); } catch (e) { return RH.toast(e.message); } o.kind = c.kind; o.subject = c.subject; o.title = o.title + ' (new version)'; o.active = false; S.db.from('research_curricula').insert(o).then(function (r) { if (r.error) return RH.err(r.error); admin(); }); }; });
    });
  }

  /* ---------- library, academy, EE ---------- */
  /* ---------- resources library: downloadable templates, guides, data sheets and annotated samples (site_assets/research-resources) ---------- */
  var RES = [
    // [file, title, description, group, for, origin]
    ['ia-report-template.docx', 'IA report template', 'The full report structure with guidance under each heading: research question, background, hypothesis, variables, method, risk assessment, data analysis, uncertainty, conclusion, evaluation and references.', 'Templates', 'IA', 'yours'],
    ['ia-proposals-tracker.xlsx', 'IA proposal sheet (class tracker)', 'One row per student: research question, hypotheses, variables, levels, measurement, controls, statistical test, apparatus, dates, feedback and approval. Includes a worked example.', 'Templates', 'IA', 'yours'],
    ['ia-variables-design-template.docx', 'Variables and experimental design', 'Independent, dependent, controlled and confounding variables with how each is changed, measured and controlled; design table and flowchart box.', 'Templates', 'IA', 'new'],
    ['ia-risk-assessment.docx', 'Risk assessment: safety, ethics and environment', 'Likelihood × severity risk table, ethics checklist (animals, human participants, microorganisms) and disposal plan, with a teacher approval line.', 'Templates', 'IA', 'new'],
    ['research-question-worksheet.docx', 'Research question worksheet', 'Topic to focused question in four steps, with a checklist and weak, improved and strong examples. For the IA and the EE.', 'Templates', 'Both', 'new'],
    ['ia-final-checklist.docx', 'IA final submission checklist', 'Every requirement of the four criteria plus presentation and integrity, to tick before submitting.', 'Checklists', 'IA', 'new'],
    ['ia-marking-rubric.xlsx', 'IA marking rubric', 'The four criteria with their markband descriptors, mark boxes, comments, automatic total and indicative grade, and the command terms.', 'Assessment', 'IA', 'yours'],
    ['ee-subject-pathway-guide.docx', 'EE subject and pathway guide', 'Subject-focused or interdisciplinary, the rule for ESS and literature and performance, and a planning sheet for your choice.', 'Templates', 'EE', 'new'],
    ['ee-proposal-template.docx', 'EE research proposal', 'Title, pathway, question, rationale, objectives, methodology, preliminary sources, challenges, ethics and a timeline with the three reflection sessions.', 'Templates', 'EE', 'new'],
    ['ee-research-log-rrs.docx', "Research log (researcher's reflection space)", 'A dated log of reading, ideas, decisions, challenges and emerging questions, plus questions to bring to your next session.', 'Templates', 'EE', 'new'],
    ['ee-source-evaluation-worksheet.docx', 'Source evaluation worksheet', 'Score a source on eight credibility criteria and record its findings, limitations and how you will use it.', 'Templates', 'Both', 'new'],
    ['ee-literature-review-template.docx', 'Literature review planner', 'Compare studies side by side, then synthesise agreements, disagreements and the gap your essay addresses.', 'Templates', 'EE', 'new'],
    ['ee-academic-writing-and-referencing-guide.docx', 'Academic writing, citing and referencing', 'EE structure, what counts towards the 4,000 words, analytical writing, citing while writing (APA examples) and AI and integrity.', 'Guides', 'Both', 'new'],
    ['ee-rpf-preparation.docx', 'RPF preparation', 'How criterion E works, records of the three sessions, and a planning grid for your 500-word reflective statement.', 'Templates', 'EE', 'new'],
    ['ee-viva-voce-preparation.docx', 'Viva voce preparation', 'What to do before the viva, the guide\'s questions to prepare, other common questions and notes for your reflective statement.', 'Guides', 'EE', 'new'],
    ['ee-final-checklist.docx', 'EE final checklist', 'Criteria A to E and the integrity and presentation rules, to tick before handing in the final version.', 'Checklists', 'EE', 'new'],
    ['raw-data-and-statistics-template.xlsx', 'Raw data and statistics template', 'Raw data with automatic mean, SD, SE, half range and % uncertainty, a graph with ± SD error bars, and sheets for Welch\'s t-test and chi-squared.', 'Data and statistics', 'Both', 'new'],
    ['how-to-add-sd-error-bars.xlsx', 'How to add standard deviation error bars', 'Step-by-step spreadsheet showing how to graph means with SD error bars.', 'Data and statistics', 'IA', 'yours'],
    ['how-to-use-statistical-tests.pdf', 'How to use statistical tests', 'Student\'s t-test, Spearman\'s rank, chi-squared (independence and goodness of fit) and ANOVA, with worked examples, practice activities and critical-value tables.', 'Data and statistics', 'Both', 'yours'],
    ['ecology-beach-practical-guide.pdf', 'Ecology beach practical guide', 'Random and systematic sampling in the field, and interpreting the data.', 'Practicals', 'IA', 'yours'],
    ['ecology-beach-practical-objectives.pdf', 'Ecology beach practical objectives', 'The task: three questions answered with a t-test, Spearman\'s rank and chi-squared.', 'Practicals', 'IA', 'yours'],
    ['ia-exemplar-ph-enzyme-activity.docx', 'Exemplar IA: pH and catalase activity', 'A complete teacher-created IA (about 3,000 words) with every section, data from the enzyme simulator, statistics and a full evaluation. Goes with the guided worksheet “pH and enzyme activity”.', 'Samples', 'IA', 'sample'],
    ['ee-exemplar-biology.docx', 'Exemplar EE: Biology (temperature and photosynthesis)', 'A complete teacher-created extended essay (about 4,000 words) with every section, illustrative data, statistics and an evaluation against a model.', 'Samples', 'EE', 'sample'],
    ['ee-exemplar-chemistry.docx', 'Exemplar EE: Chemistry (ethanoic acid concentration and pH)', 'A complete teacher-created essay (about 4,000 words) testing the weak-acid approximation, with uncertainties and a linearised graph.', 'Samples', 'EE', 'sample'],
    ['ee-exemplar-physics.docx', 'Exemplar EE: Physics (squash ball temperature and bounce)', 'A complete teacher-created essay (about 4,000 words) on the coefficient of restitution, with gradient uncertainty and systematic error.', 'Samples', 'EE', 'sample'],
    ['ee-exemplar-ess.docx', 'Exemplar EE: ESS (ecotourism and mangroves, Mida Creek)', 'A complete teacher-created essay (about 4,000 words) linking an ecological survey with a visitor questionnaire and value systems.', 'Samples', 'EE', 'sample'],
    ['ee-exemplar-sehs.docx', 'Exemplar EE: SEHS (training status and heart-rate recovery)', 'A complete teacher-created essay (about 4,000 words) with human participants, ethics, recovery curves and statistical tests.', 'Samples', 'EE', 'sample'],
    ['ds-ia-guide.docx', 'Digital Society IA: student guide', 'The inquiry project explained: what to submit, the five criteria in plain words, the focus–explore–investigate–reflect–share stages, and academic integrity.', 'Guides', 'IA', 'new'],
    ['ds-ia-ipd-template.docx', 'Digital Society IA: inquiry process document template', 'Inquiry focus planner and prose box, a claims-and-perspectives grid for three sources (origin and purpose, meaning and methods, corroboration and use) and a reference list.', 'Templates', 'IA', 'new'],
    ['ds-ia-presentation-planner.docx', 'Digital Society IA: presentation planner and storyboard', 'Timing plan for the 10-minute recorded presentation, an analysis and evaluation grid, a storyboard and an emerging-trends table.', 'Templates', 'IA', 'new'],
    ['ds-ia-final-checklist.docx', 'Digital Society IA: final checklist', 'Everything to tick before submitting the inquiry process document, the presentation and the references.', 'Checklists', 'IA', 'new'],
    ['ia-annotated-samples.docx', 'Annotated IA samples', 'Research questions, a data table, a graph, a statistical interpretation, conclusions and an evaluation table, each annotated against the criteria (illustrative data).', 'Samples', 'IA', 'sample'],
    ['ee-annotated-samples.docx', 'Annotated EE samples', 'Research questions, an introduction, descriptive versus analytical writing, discussion and evaluation, and the difference between descriptive and evaluative reflection.', 'Samples', 'EE', 'sample']];
  var ORIGIN = { yours: ['George Apidi\'s classroom resource', 'ok'], 'new': ['Template by George Apidi', 'info'], sample: ['Teacher-created sample (not IB, not real student work)', 'ai'] };
  function library() {
    var m = RH.shell('#/library', '<div class="rh-card"><h2>📚 Templates, guides and samples</h2><p class="small">Everything you need to plan, carry out and write your IA and extended essay. Download a template, fill it in, and use the matching Studio stage for checks and feedback. All resources are by George Apidi; IB criteria are quoted from the IB guides with their source. Official IB exemplars are not published here: ask your teacher.</p>' +
      '<div class="btns" style="flex-wrap:nowrap"><input type="text" id="lib-q" placeholder="Search the library" aria-label="Search the library"></div><div class="rh-tabs" role="tablist" id="lib-for">' + ['All', 'IA', 'EE'].map(function (x, i) { return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-for="' + x + '">' + (x === 'All' ? 'IA and EE' : x === 'IA' ? 'Internal assessment' : 'Extended Essay') + '</button>'; }).join('') + '</div></div><div id="lib-out" class="grp"></div>' +
      '<div class="rh-card"><h3>Finding reliable sources</h3><p class="small">Search these yourself and cite exactly what you read:</p><ul class="small"><li><a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubMed</a>: biomedical and life-science research.</li><li><a href="https://scholar.google.com/" target="_blank" rel="noopener">Google Scholar</a>: peer-reviewed papers across all subjects.</li><li><a href="https://doaj.org/" target="_blank" rel="noopener">DOAJ</a>: open-access, peer-reviewed journals.</li><li><a href="https://search.crossref.org/" target="_blank" rel="noopener">Crossref</a>: check a DOI and its full reference.</li></ul></div>');
    var who = 'All';
    var draw = function () {
      var q = m.querySelector('#lib-q').value.trim().toLowerCase(), groups = ['Templates', 'Checklists', 'Guides', 'Data and statistics', 'Assessment', 'Practicals', 'Samples'];
      var hit = RES.filter(function (r) { return (who === 'All' || r[4] === who || r[4] === 'Both') && (!q || (r[1] + ' ' + r[2] + ' ' + r[3]).toLowerCase().indexOf(q) >= 0); });
      m.querySelector('#lib-out').innerHTML = hit.length ? groups.map(function (g) { var items = hit.filter(function (r) { return r[3] === g; }); if (!items.length) return '';
        return '<div class="rh-card"><h3>' + E(g) + '</h3><div class="rh-grid">' + items.map(function (r) { var ext = r[0].split('.').pop().toUpperCase(), o = ORIGIN[r[5]];
          return '<div class="rh-item"><div class="rh-head"><b>' + E(r[1]) + '</b><span class="rh-badge">' + ext + '</span></div><span class="small">' + E(r[2]) + '</span><span class="meta"><span class="rh-badge ' + o[1] + '">' + E(o[0]) + '</span> <span class="rh-badge">' + (r[4] === 'Both' ? 'IA and EE' : r[4]) + '</span></span><div class="btns"><a class="btn sm main" href="#/view/' + encodeURIComponent(r[0]) + '">📖 Open</a><a class="btn sm" href="/assets/research-resources/' + r[0] + '" download>⬇ Download</a></div></div>'; }).join('') + '</div></div>'; }).join('') : '<p class="small muted">Nothing matches.</p>';
    };
    m.querySelector('#lib-q').oninput = draw;
    // IB-owned examples and guidelines (migration 060): listed only to students and co-teachers of Mr Apidi's classes
    S.db.rpc('research_private_list').then(function (r) {
      var L = r.data || []; if (!L.length) return;
      var box = document.createElement('div'); box.className = 'rh-card';
      box.innerHTML = '<h3>🔒 IB materials (your classes only)</h3><p class="small">Official IB examples with examiner comments and the IB experimentation guidelines. They are for students in Mr Apidi\'s classes only: do not share or upload them anywhere else.</p><div class="rh-grid">' + L.map(function (f) { return '<div class="rh-item"><div class="rh-head"><b>' + E(f.title) + '</b><span class="rh-badge">PDF</span></div><span class="small">' + E(f.description || '') + '</span><span class="meta"><span class="rh-badge info">' + E(f.source) + '</span> ' + Math.round((f.size_bytes || 0) / 1024) + ' KB</span><div class="btns"><a class="btn sm main" href="#/view/ib:' + encodeURIComponent(f.name) + '">📖 Open</a><button class="btn sm" type="button" data-pf="' + E(f.name) + '">Download</button></div></div>'; }).join('') + '</div>';
      m.querySelector('#lib-out').parentNode.insertBefore(box, m.querySelector('#lib-out'));
      box.querySelectorAll('[data-pf]').forEach(function (b) { b.onclick = function () { b.disabled = true; b.textContent = 'Preparing…';
        S.db.rpc('research_private_get', { fname: b.dataset.pf }).then(function (x) { b.disabled = false; b.textContent = 'Download'; if (x.error) throw x.error;
          var bin = atob(x.data), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([u], { type: 'application/pdf' })); a.download = b.dataset.pf + '.pdf'; document.body.appendChild(a); a.click(); a.remove(); }).catch(function (e) { b.disabled = false; b.textContent = 'Download'; RH.err(e); }); }; });
    }, function () {});
    m.querySelectorAll('[data-for]').forEach(function (b) { b.onclick = function () { who = b.dataset.for; m.querySelectorAll('[data-for]').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); draw(); }; });
    draw();
  }
  /* read any template, guide or sample inside the site: PDFs in the browser's own viewer; Word and Excel files as converted pages
     (research/convert/convert_resources.py writes /assets/research-resources/view/<name>.html); IB files from the private store */
  function viewer(fn) {
    var ib = fn.indexOf('ib:') === 0, r = ib ? null : RES.filter(function (x) { return x[0] === fn; })[0];
    if (!ib && !r) { location.hash = '#/library'; return; }
    var ext = ib ? 'PDF' : fn.split('.').pop().toUpperCase(), base = fn.replace(/\.[^.]+$/, ''), url = '/assets/research-resources/' + fn;
    var col = { DOCX: '#2563EB', XLSX: '#16A34A', PDF: '#E11D48' }[ext] || '#7C3AED';
    var m = RH.shell('#/library', '<section class="rv-head" style="--c:' + col + '"><div><p class="label">' + (ib ? '🔒 IB material · your classes only' : E(r[3]) + ' · ' + (r[4] === 'Both' ? 'IA and EE' : r[4])) + '</p><h1>' + E(ib ? fn.slice(3).replace(/-/g, ' ') : r[1]) + '</h1>' + (r ? '<p>' + E(r[2]) + '</p>' : '') + '</div>' +
      '<div class="btns"><a class="btn sm" href="#/library">← Library</a>' + (ib ? '' : '<a class="btn sm" href="' + url + '" download>⬇ Download ' + ext + '</a>') + (ext !== 'PDF' ? '<button class="btn sm" type="button" id="rv-print">🖨 Print</button>' : '') + '</div></section>' +
      '<div class="rh-card rv-body" id="rv"><p class="muted">Opening…</p></div>');
    var box = m.querySelector('#rv');
    if (ext === 'PDF' && !ib) { box.innerHTML = '<iframe class="rv-pdf" src="' + url + '#view=FitH" title="' + E(r[1]) + '"></iframe><p class="small muted">If the document does not show, <a href="' + url + '" target="_blank" rel="noopener">open it in a new tab</a>.</p>'; return; }
    if (ib) {
      S.db.rpc('research_private_list').then(function (r) { var f = (r.data || []).filter(function (x) { return x.name === fn.slice(3); })[0], h1 = m.querySelector('.rv-head h1'); if (f && h1) { h1.textContent = f.title; if (f.description) h1.insertAdjacentHTML('afterend', '<p>' + E(f.description) + '</p>'); } }, function () {});
      S.db.rpc('research_private_get', { fname: fn.slice(3) }).then(function (x) { if (x.error) throw x.error;
        var bin = atob(x.data), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        var src = URL.createObjectURL(new Blob([u], { type: 'application/pdf' })); box.innerHTML = '<iframe class="rv-pdf" src="' + src + '" title="IB material"></iframe><p class="small muted">For students in Mr Apidi\'s classes only. Do not share or upload it anywhere else.</p>';
      }).catch(function (e) { box.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
      return;
    }
    fetch('/assets/research-resources/view/' + base + '.html?v=' + (window.BV_VER || '')).then(function (x) { if (!x.ok) throw new Error('This file cannot be shown here yet. Download it instead.'); return x.text(); }).then(function (h) {
      box.innerHTML = '<article class="rv-doc' + (ext === 'XLSX' ? ' xl' : '') + '">' + h + '</article>' + (ext === 'XLSX' ? '<p class="small muted">Values as last calculated. Download the spreadsheet to enter your own data: the formulas recalculate in Excel, Google Sheets or LibreOffice.</p>' : '<p class="small muted">Download the Word file to fill it in or edit it.</p>');
      [].forEach.call(box.querySelectorAll('a[href^="http"]'), function (a) { a.target = '_blank'; a.rel = 'noopener'; });
      var pr = m.querySelector('#rv-print'); if (pr) pr.onclick = function () { window.print(); };
    }).catch(function (e) { box.innerHTML = '<p class="msg">' + E(e.message || S.nice(e)) + ' <a class="btn sm" href="' + url + '" download>Download</a></p>'; });
  }
  function academy() {
    var A = [['What makes a focused research question?', 'It names the independent variable with its range and units, the dependent variable and how it is measured, and the organism or system. "How does temperature affect enzymes?" is a topic; a research question says which enzyme, which temperatures, and how the rate is measured.'], ['Prediction or hypothesis?', 'A prediction says what you expect to happen ("the rate will increase up to 40 °C"). A hypothesis also explains why, using biology ("because more kinetic energy means more enzyme–substrate collisions, until the active site denatures"). Statistical tests use a null hypothesis (no difference or no relationship) and an alternative hypothesis.'],
      ['Uncertainty in Biology', 'Record the instrument uncertainty (± half the smallest division for analogue scales, ± the last digit for digital), show variation between trials (standard deviation or range), and carry uncertainties into processed values. Error bars on graphs show the spread of the data.'], ['Choosing a statistical test', 'The test follows from the design: comparing groups or looking for a relationship; two groups or more; independent or paired; normal or skewed; counts or measurements. Never pick a test because it is available or because it gives a smaller p-value.'],
      ['Significance is not importance', 'p < 0.05 means a result this extreme would be unlikely if the null hypothesis were true. It does not tell you how big or biologically important the effect is, and a correlation does not show cause and effect.'], ['Writing an evaluation', 'For each specific weakness: what it was, how it affected the results (in which direction and how much), why it happened, a realistic improvement, and how that improvement would make the conclusion more reliable.'], ['Using AI responsibly', 'AI can explain, question and give feedback. It must not write your work, invent data or create references. Record every use in your integrity record, as your school and the IB require.'],
      ['EE: subject-focused or interdisciplinary?', 'Subject-focused: one DP subject, ideally one you study. Interdisciplinary: two DP subjects whose knowledge, concepts, theories, perspectives or methods are integrated. ESS and literature and performance are cross-disciplinary and can only be taken on the subject-focused pathway.'],
      ['EE: the three reflection sessions', 'First reflection: your initial explorations. Interim reflection: progress, challenges and a completed piece of writing. Final reflection (viva voce): a 20–30 minute interview after you hand in the final version. Attendance is recorded on the RPF; check-ins in between are encouraged but not recorded.'],
      ['EE: drafts and the final version', 'Your supervisor reads and comments on one draft only (no direct editing), after the interim reflection and before the viva voce. The final version is handed in before the viva voce and cannot be changed afterwards.'],
      ['EE: how it is assessed', 'IB examiners mark the essay out of 30 by best fit: A Framework 6, B Knowledge and understanding 6, C Analysis and line of argument 6, D Discussion and evaluation 8, E Reflection 4 (the 500-word statement on the RPF only). Your supervisor predicts a grade A–E; a D or higher is needed for the diploma.']];
    RH.shell('#/help', '<div class="rh-card"><h2>🎓 Research academy</h2><p class="small">Short guides to the ideas behind a strong investigation. Each Studio stage also has its own guidance in the side panel.</p></div>' + A.map(function (a) { return '<details class="rh-card"><summary>' + E(a[0]) + '</summary><p class="small" style="margin-top:8px">' + E(a[1]) + '</p></details>'; }).join(''));
  }


  /* ---------- start ---------- */
  S.guard(el, { anyone: true, school: true, allowPending: true }).then(function (me) {
    RH.me = me; RH.teacher = !!(me.staff || me.school || (me.roles || []).indexOf('teacher') >= 0);
    try { RH.lastPid = localStorage.getItem('rh-last'); RH.lastIa = localStorage.getItem('rh-last-ia'); RH.lastEe = localStorage.getItem('rh-last-ee'); } catch (e) {}
    if (!RH.teacher && !(me.classes || []).length) {
      // students without a class can still explore the tools, and start a project once they join a class
    }
    RH.curriculum().then(function () { window.addEventListener('hashchange', route); route(); });
  }).catch(function () {});
})();
