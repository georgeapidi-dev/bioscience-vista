/* BioscienceVista · VISA Research Hub (/research/): IB research, investigation and academic excellence.
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
  RH.stageName = function (k) { var s = RH.IA.filter(function (x) { return x.k === k; })[0]; return s ? s.n : k; };
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
  RH.wordCount = function (d) { return RH.words(RH.reportText(d)); };

  /* ---------- how complete each stage is (0–1), used for the progress cards and next steps ---------- */
  var filled = function (s, n) { return RH.words(s) >= (n || 3); };
  RH.stageDone = function (k, p, extra) {
    var d = p.data || {}; extra = extra || {};
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
  RH.progress = function (p, extra) { var t = 0; RH.IA.forEach(function (s) { t += RH.stageDone(s.k, p, extra); }); return Math.round(t / RH.IA.length * 100); };
  RH.nextStage = function (p, extra) { for (var i = 0; i < RH.IA.length; i++) if (RH.stageDone(RH.IA[i].k, p, extra) < 1) return RH.IA[i]; return RH.IA[RH.IA.length - 1]; };
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
      return RH.curriculum(p.curriculum_id).then(function () { return p; });
    });
  };
  RH.curriculum = function (id) {
    if (RH.cur && RH.cur.id === id) return Promise.resolve(RH.cur);
    var q = S.db.from('research_curricula').select('*'); q = id ? q.eq('id', id) : q.eq('kind', 'ia').eq('active', true).order('created_at', { ascending: false }).limit(1);
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
  RH.saveNow = function () {
    if (!RH.p || !RH.owner) return Promise.resolve(); clearTimeout(saveTimer);
    var p = RH.p, wc = RH.wordCount(p.data);
    saving = S.db.from('research_projects').update({ data: p.data, title: p.title, rq: (p.data.rq && p.data.rq.text) || p.rq, stage: p.stage, word_count: wc }).eq('id', p.id).then(function (r) {
      var m = document.getElementById('rh-save');
      if (r.error) { if (m) m.textContent = 'Not saved: ' + S.nice(r.error); return; }
      p.word_count = wc; if (m) m.textContent = 'Saved ' + new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      var w = document.getElementById('rh-wc'); if (w) w.innerHTML = wcText(wc);
    });
    return saving;
  };
  window.addEventListener('beforeunload', function (e) { if (saveTimer) { RH.saveNow(); e.preventDefault(); e.returnValue = ''; } });
  function wcText(wc) { var lim = (RH.cur && RH.cur.word_limit) || 3000; return '<b>' + wc + '</b> / ' + lim + ' words' + (wc > lim ? ' <span class="rh-badge warn">over the limit</span>' : ''); }
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
  var NAV_STUDENT = [['#/', '🏠', 'Research dashboard'], ['IA', '🧬', 'Biology IA Studio'], ['#/rqlab', '❓', 'Research question lab'], ['#/lab', '🧮', 'Statistics lab'], ['#/graph', '📈', 'Graph studio'],
    ['P:submit', '📤', 'Submission centre'], ['P:feedback', '💬', 'Feedback centre'], ['P:meetings', '🗓️', 'Supervision'], ['P:notebook', '📓', 'Research notebook'], ['P:integrity', '🛡️', 'Academic integrity'], ['P:versions', '🕘', 'Version history'], ['#/library', '📚', 'Templates and library'], ['#/ee', '📝', 'Extended Essay Studio'], ['#/help', '🎓', 'Research academy']];
  var NAV_TEACHER = [['#/teacher', '🧑‍🏫', 'Supervisor dashboard'], ['#/teacher/milestones', '📅', 'Milestones and deadlines'], ['#/lab', '🧮', 'Statistics lab'], ['#/graph', '📈', 'Graph studio'], ['#/library', '📚', 'Templates and library'], ['#/help', '🎓', 'Research academy']];
  RH.shell = function (active, mainHtml, ctxHtml) {
    var nav = RH.teacher ? NAV_TEACHER.slice() : NAV_STUDENT.slice(); if (RH.me.admin) nav.push(['#/admin', '🛠️', 'Curriculum and admin']);
    var pid = RH.p && RH.owner ? RH.p.id : RH.lastPid;
    var links = nav.map(function (n) {
      var href = n[0], cur = active === n[0];
      if (href === 'IA') { href = pid ? '#/p/' + pid + '/' + ((RH.p && RH.p.stage) || 'topic') : '#/'; cur = active === 'IA'; }
      else if (href.indexOf('P:') === 0) { var v = href.slice(2); cur = active === v; href = pid ? '#/p/' + pid + '/' + v : '#/'; }
      return '<a href="' + href + '"' + (cur ? ' aria-current="page"' : '') + '><span class="ic" aria-hidden="true">' + n[1] + '</span>' + E(n[2]) + '</a>';
    });
    if (RH.teacher && RH.p && !RH.owner) links.splice(1, 0, '<span class="sep">Open project</span><a href="#/p/' + RH.p.id + '/assess"' + (active === 'IA' ? ' aria-current="page"' : '') + '><span class="ic">🧬</span>' + E(RH.p.title) + '</a>');
    el.innerHTML = '<div class="rh' + (ctxHtml ? ' ctx' : '') + '"><nav class="rh-nav" aria-label="Research Hub"><div class="rh-brand">VISA RESEARCH HUB<small>IB Research, Investigation &amp; Academic Excellence</small></div>' + links.join('') + '</nav>' +
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
      if (r === 'library') return library();
      if (r === 'help') return academy();
      if (r === 'ee') return eeSoon();
      if (r === 'admin') return RH.me.admin ? admin() : home();
      if (r === 'teacher') return RH.teacher ? (h[1] === 'milestones' ? milestonesPage() : teacherHome()) : home();
      if (r === 'new') return newProject();
      return RH.teacher ? teacherHome() : home();
    };
    try { go(); } catch (e) { RH.err(e); }
  }
  RH.route = route;
  RH.openProject = function (id, view) {
    var m = RH.shell('IA', '<p class="muted">Opening the project…</p>');
    return RH.load(id).then(function (p) {
      if (RH.owner) { RH.lastPid = p.id; try { localStorage.setItem('rh-last', p.id); } catch (e) {} }
      if (['submit', 'feedback', 'meetings', 'notebook', 'integrity', 'versions'].indexOf(view) >= 0) return PAGES[view]();
      var stage = view || (RH.sup ? 'assess' : p.stage || 'topic');
      if (RH.owner && stage !== p.stage && RH.IA.some(function (s) { return s.k === stage; })) { p.stage = stage; RH.dirty(); }
      return RH.ia.stage(stage);
    }).catch(function (e) { m.innerHTML = '<div class="rh-card warn"><h2>Cannot open this project</h2><p>' + E(S.nice(e)) + '</p><p><a class="btn sm" href="#/">Back to the dashboard</a></p></div>'; });
  };

  /* ---------- the stage header shared by every IA page ---------- */
  RH.stageHead = function (k) {
    var p = RH.p, i = RH.IA.map(function (s) { return s.k; }).indexOf(k);
    var steps = RH.IA.map(function (s) { var d = RH.stageDone(s.k, p, RH.extra); return '<li class="' + (s.k === k ? 'now' : d >= 1 ? 'done' : '') + '"><a href="#/p/' + p.id + '/' + s.k + '" title="' + E(s.n) + '">' + s.ic + ' <span>' + (s.k === k ? E(s.n) : (d >= 1 ? '✓' : '')) + '</span></a></li>'; }).join('');
    return '<div class="rh-card"><div class="rh-head"><div><p class="label">Biology IA Studio · stage ' + (i + 1) + ' of ' + RH.IA.length + (RH.sup ? ' · viewing as supervisor' : '') + '</p><h2>' + E(RH.IA[i] ? RH.IA[i].ic + ' ' + RH.IA[i].n : k) + '</h2></div>' +
      '<div style="text-align:right"><div id="rh-wc" class="small">' + wcText(p.word_count || RH.wordCount(p.data)) + '</div><div id="rh-save" class="rh-save" aria-live="polite">' + (RH.owner ? 'All changes save automatically' : 'Read-only: ' + E(p.title)) + '</div></div></div>' +
      '<ul class="rh-steps" aria-label="Stages">' + steps + '</ul></div>';
  };
  RH.stageNav = function (k) {
    var i = RH.IA.map(function (s) { return s.k; }).indexOf(k), p = RH.p, prev = RH.IA[i - 1], next = RH.IA[i + 1];
    return '<div class="btns" style="justify-content:space-between">' + (prev ? '<a class="btn sm" href="#/p/' + p.id + '/' + prev.k + '">← ' + E(prev.n) + '</a>' : '<span></span>') +
      (RH.owner ? '<button class="btn sm" type="button" onclick="RH.snapshot(\'' + k + '\', RH.p.data[\'' + k + '\']||{}, \'Saved by student\')">🕘 Save a version of this stage</button>' : '') +
      (next ? '<a class="btn main sm" href="#/p/' + p.id + '/' + next.k + '">' + E(next.n) + ' →</a>' : '') + '</div>';
  };
  RH.ctx = function (k) {   // contextual sidebar: what the criterion expects at this stage, and supervisor feedback
    var s = RH.IA.filter(function (x) { return x.k === k; })[0] || {}, c = RH.cur && (RH.cur.criteria || []).filter(function (x) { return x.key === s.crit; })[0];
    var h = '';
    if (c) h += '<div class="rh-card tint"><p class="label">Criterion this stage builds</p><h3>' + E(c.name) + ' (' + c.max + ' marks)</h3><p class="small">' + E(c.assesses) + '</p><details><summary>Top markband (' + c.bands[c.bands.length - 1].min + '–' + c.max + ')</summary><ul class="small">' + c.bands[c.bands.length - 1].d.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul></details><p class="small muted">From the ' + E(RH.cur.guide) + '.</p></div>';
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
      var ia = ps.filter(function (p) { return p.kind === 'ia'; })[0];
      var ids = ps.map(function (p) { return p.id; });
      return (ids.length ? S.db.from('research_datasets').select('project_id,raw_locked').in('project_id', ids) : Promise.resolve({ data: [] })).then(function (dr) {
        var ds = dr.data || []; var ex = function (p) { var mine = ds.filter(function (d) { return d.project_id === p.id; }); return { datasets: mine.length, locked: mine.some(function (d) { return d.raw_locked; }) }; };
        var sup = ia && ia.class_id ? (me.classes || []).filter(function (c) { return c.id === ia.class_id; })[0] : null;
        var h = '<section class="rh-hero"><p class="label">VISA Research Hub</p><h1>Welcome, ' + E(name) + '</h1><p>IB Diploma Programme · ' + (ia ? 'Biology internal assessment' : 'start your Biology IA when you are ready') + (sup ? ' · supervised in <b>' + E(sup.name) + '</b>' : '') + '</p></section>';
        if (!ia) {
          h += '<div class="rh-card tint"><h2>Start your Biology IA</h2><p>The Studio takes you from a topic to a submitted scientific investigation in twelve guided stages. Your work saves as you type, and your supervisor can see it and give feedback.</p><div class="btns"><a class="btn main" href="#/new">🧬 Start my Biology IA</a></div></div>';
        } else {
          var e1 = ex(ia), pr = RH.progress(ia, e1), nx = RH.nextStage(ia, e1);
          var jr = RH.JOURNEY.map(function (j) { var done = j[1].every(function (k) { return RH.stageDone(k, ia, e1) >= 1; }), now = j[1].indexOf(nx.k) >= 0; return '<li class="' + (now ? 'now' : done ? 'done' : '') + '"><span>' + (done ? '✓ ' : '') + E(j[0]) + '</span></li>'; }).join('');
          h += '<div class="rh-grid"><div class="rh-card"><div class="rh-head"><p class="label">🧬 Biology IA</p>' + RH.badge(ia.status) + '</div><h2>' + E(ia.title) + '</h2>' +
            '<p class="small"><b>Research question:</b> ' + (ia.rq ? E(ia.rq) : '<span class="muted">not written yet</span>') + '</p>' +
            '<div class="rh-prog" role="progressbar" aria-valuenow="' + pr + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pr + '%"></i></div><p class="small muted">' + pr + '% of the stages complete · ' + (ia.word_count || 0) + ' / 3000 words · last saved ' + RH.date(ia.updated_at, true) + '</p>' +
            '<ul class="rh-steps">' + jr + '</ul><div class="rh-card tint" style="padding:12px"><b>Next step: ' + nx.ic + ' ' + E(nx.n) + '</b><span class="small">' + E(NEXT_TIP[nx.k] || '') + '</span><div class="btns"><a class="btn main sm" href="#/p/' + ia.id + '/' + nx.k + '">Continue where I stopped →</a></div></div></div>' +
            '<div class="rh-card"><p class="label">📝 Extended Essay</p><h2>Extended Essay Studio</h2><p class="small">The EE Studio (subject and topic, research question, proposal, sources, writing, the three reflection sessions and the 2027 criteria) opens in the next phase of the Hub.</p><a class="btn sm" href="#/ee">What is coming</a></div></div>';
          RH.lastPid = ia.id;
        }
        var mine = ms.filter(function (x) { return !x.project_id || ids.indexOf(x.project_id) >= 0; });
        var today = new Date().toISOString().slice(0, 10);
        h += '<div class="rh-grid"><div class="rh-card"><p class="label">📅 Deadlines and milestones</p>' + (mine.length ? '<div class="rh-list">' + mine.slice(0, 6).map(function (x) { var late = x.due_on < today && !(ia && RH.stageDone(x.stage, ia, ex(ia)) >= 1); return '<div class="rh-item"><b>' + E(x.title) + '</b><span class="meta">' + RH.date(x.due_on) + ' · ' + E(RH.stageName(x.stage)) + (late ? ' · <span class="rh-badge warn">overdue</span>' : '') + '</span></div>'; }).join('') + '</div>' : '<p class="small muted">Your supervisor has not set deadlines yet.</p>') + '</div>' +
          '<div class="rh-card"><p class="label">💬 Recent feedback</p>' + (fb.length ? '<div class="rh-list">' + fb.map(function (f) { return '<div class="rh-item"><span class="meta">' + (f.source === 'ai' ? '<span class="rh-badge ai">AI</span>' : '<span class="rh-badge ok">Supervisor</span>') + ' ' + E(critName(f.criterion) || RH.stageName(f.stage) || '') + ' · ' + RH.date(f.created_at) + '</span><span class="small">' + E(f.comment.slice(0, 220)) + (f.comment.length > 220 ? '…' : '') + '</span></div>'; }).join('') + '</div>' : '<p class="small muted">No feedback yet.</p>') + (ia ? '<a class="small" href="#/p/' + ia.id + '/feedback">Feedback centre →</a>' : '') + '</div></div>';
        m.innerHTML = h;
        if (!RH.cur) RH.curriculum();
      });
    }).catch(function (e) { m.innerHTML = '<div class="rh-card warn"><p>' + E(S.nice(e)) + '</p></div>'; });
  }
  var NEXT_TIP = { topic: 'Choose an area that interests you and read the background.', rq: 'Build a focused question with a named IV, range, DV and organism.', hypothesis: 'Write null and alternative hypotheses with a biological reason.', variables: 'Decide how you will change, measure and control each variable.', method: 'Write a method someone else could repeat exactly.', safety: 'Check safety, ethics and environmental issues before you collect data.', data: 'Enter your raw data with units and uncertainties, then lock the original.', analysis: 'Process your data and choose a suitable statistical test.', graphs: 'Draw a graph that answers your research question, with error bars.', conclusion: 'Answer the question using your numbers and the scientific context.', evaluation: 'Explain specific weaknesses and realistic improvements.', assess: 'Check the rubric, read your feedback and submit.' };

  function newProject() {
    var me = RH.me, cls = (me.classes || []);
    var m = RH.shell('#/', '<div class="rh-card"><h2>Start your Biology IA</h2><p>Choose the class whose teacher will supervise your investigation. They will see your work and give feedback.</p>' +
      '<div class="rh-field"><label for="rh-cls">Supervising class</label><select id="rh-cls">' + (cls.length ? cls.map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + '</option>'; }).join('') : '<option value="">No class yet</option>') + '</select>' +
      (cls.length ? '' : '<span class="tip">You have not joined a class yet. <a href="/dashboard/">Join your teacher\'s class</a> first, or start now and choose a class later.</span>') + '</div>' +
      '<div class="rh-field"><label for="rh-title">Working title</label><input type="text" id="rh-title" value="My Biology investigation" maxlength="160"></div>' +
      '<div class="btns"><button class="btn main" id="rh-go" type="button">Create my IA project</button><a class="btn" href="#/">Cancel</a></div><p class="msg" id="rh-msg"></p></div>');
    m.querySelector('#rh-go').onclick = function () {
      var b = this; b.disabled = true;
      RH.curriculum().then(function (cur) {
        return S.db.from('research_projects').insert({ kind: 'ia', subject: 'Biology', curriculum_id: cur && cur.id, class_id: m.querySelector('#rh-cls').value || null, title: m.querySelector('#rh-title').value.trim() || 'My Biology investigation', data: {} }).select('id').single();
      }).then(function (r) { if (r.error) throw r.error; location.hash = '#/p/' + r.data.id + '/topic'; }).catch(function (e) { b.disabled = false; m.querySelector('#rh-msg').textContent = S.nice(e); });
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
        var form = RH.owner ? '<h3>New submission</h3><div class="two"><div class="rh-field"><label for="sb-stage">What is it?</label><select id="sb-stage"><option value="proposal">Proposal</option><option value="draft">Draft report</option><option value="data">Data file</option><option value="final">Final report</option></select></div>' +
          '<div class="rh-field"><label for="sb-file">File (DOCX, PDF, CSV or XLSX, up to 25 MB)</label><input type="file" id="sb-file" accept=".docx,.pdf,.csv,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div></div>' +
          '<div class="rh-field"><label for="sb-note">Note to your supervisor (optional)</label><textarea id="sb-note" maxlength="2000"></textarea></div>' +
          '<label class="chk small"><input type="checkbox" id="sb-own"> This is my own work. I have acknowledged every source and recorded any AI assistance in my <a href="#/p/' + p.id + '/integrity">integrity record</a>.</label>' +
          '<div class="btns"><button class="btn main" id="sb-go" type="button">Submit</button><span class="small muted" id="sb-msg"></span></div><hr style="border:0;border-top:1px solid var(--line)">' : '';
        box.innerHTML = form + '<h3>History</h3>' + (subs.length ? '<div class="scroll"><table class="dt"><thead><tr><th>Stage</th><th>Version</th><th>File</th><th>Words</th><th>Submitted</th><th>Status</th><th>Supervisor</th></tr></thead><tbody>' + subs.map(function (s) {
          return '<tr><td>' + E(s.stage) + '</td><td>v' + s.version + '</td><td>' + (s.file_path ? '<a href="#" data-f="' + E(s.file_path) + '">' + E(s.file_name) + '</a>' : '—') + (s.note ? '<div class="small muted">' + E(s.note) + '</div>' : '') + '</td><td>' + (s.word_count || '') + '</td><td>' + RH.date(s.submitted_at, true) + '</td><td>' + (s.status === 'approved' ? '<span class="rh-badge ok">Approved</span>' : s.status === 'returned' ? '<span class="rh-badge warn">Returned</span>' : '<span class="rh-badge info">Submitted</span>') + (s.decision_note ? '<div class="small">' + E(s.decision_note) + '</div>' : '') + '</td><td>' +
            (RH.sup && s.status === 'submitted' ? '<div class="btns"><button class="btn xs" data-ok="' + s.id + '" type="button">Approve</button><button class="btn xs bad" data-ret="' + s.id + '" type="button">Return for revision</button></div>' : (s.decided_at ? RH.date(s.decided_at) : '')) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="small muted">Nothing submitted yet.</p>');
        box.querySelectorAll('[data-f]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); S.db.storage.from('research-files').createSignedUrl(a.dataset.f, 600).then(function (u) { if (u.error) return RH.err(u.error); window.open(u.data.signedUrl, '_blank', 'noopener'); }); }; });
        var decide = function (id, status) { var note = prompt(status === 'approved' ? 'Comment for the student (optional):' : 'What should the student revise?') ; if (note === null) return; S.db.from('research_submissions').update({ status: status, decision_note: note || null }).eq('id', id).then(function (r) { if (r.error) return RH.err(r.error); RH.toast(status === 'approved' ? 'Approved' : 'Returned for revision'); S.db.from('research_projects').select('status').eq('id', p.id).single().then(function (x) { if (x.data) p.status = x.data.status; load(); }); }); };
        box.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { decide(b.dataset.ok, 'approved'); }; });
        box.querySelectorAll('[data-ret]').forEach(function (b) { b.onclick = function () { decide(b.dataset.ret, 'returned'); }; });
        var go = box.querySelector('#sb-go'); if (go) go.onclick = function () {
          var f = box.querySelector('#sb-file').files[0], msg = box.querySelector('#sb-msg'), stage = box.querySelector('#sb-stage').value;
          if (!f) { msg.textContent = 'Choose a file first.'; return; }
          if (!/\.(docx|pdf|csv|xlsx)$/i.test(f.name)) { msg.textContent = 'Use a DOCX, PDF, CSV or XLSX file.'; return; }
          if (f.size > 25 * 1024 * 1024) { msg.textContent = 'The file is larger than 25 MB.'; return; }
          if (!box.querySelector('#sb-own').checked) { msg.textContent = 'Tick the declaration first.'; return; }
          go.disabled = true; msg.textContent = 'Uploading…';
          var path = p.id + '/' + Date.now() + '-' + f.name.replace(/[^A-Za-z0-9._-]+/g, '_');
          RH.saveNow().then(function () { return S.db.storage.from('research-files').upload(path, f, { contentType: f.type || 'application/octet-stream', upsert: false }); }).then(function (u) {
            if (u.error) throw u.error;
            return S.db.from('research_submissions').insert({ project_id: p.id, stage: stage, file_path: path, file_name: f.name, mime: f.type, size_bytes: f.size, word_count: p.word_count || null, note: box.querySelector('#sb-note').value.trim() || null });
          }).then(function (r) { if (r.error) throw r.error; RH.toast('Submitted'); if (stage === 'proposal') p.status = 'proposal_submitted'; if (stage === 'final') p.status = 'final_submitted'; RH.snapshot('submission:' + stage, p.data, 'Snapshot at ' + stage + ' submission').catch(function () {}); load(); })
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
      var h = '<div class="rh-card"><h3>Supervisor\'s criterion marks</h3><div class="rh-kpi">' + crit.map(function (c) { return '<div><b>' + (latest[c.key] ? latest[c.key].mark : '–') + '<small style="font-size:.9rem">/' + c.max + '</small></b><span>' + E(c.name) + '</span></div>'; }).join('') + '<div><b>' + (any ? tot : '–') + '<small style="font-size:.9rem">/' + crit.reduce(function (s, c) { return s + c.max; }, 0) + '</small></b><span>Total (school assessment, not final)</span></div></div><p class="small muted">Marks are your supervisor\'s best-fit judgement against the markbands. They are not guaranteed: IB moderation can change them.</p></div>';
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
    var m = RH.shell('notebook', projHead('📓 Research notebook', 'A dated record of your decisions, observations, problems and discoveries. It is the evidence of your own thinking, and helps when you write the evaluation.') +
      (RH.owner ? '<div class="rh-card"><div class="two"><div class="rh-field"><label for="nb-kind">Type</label><select id="nb-kind"><option>Decision</option><option>Observation</option><option>Challenge</option><option>Discovery</option><option>Idea</option></select></div></div><div class="rh-field"><label for="nb-text">Entry</label><textarea id="nb-text"></textarea></div><div class="btns"><button class="btn main sm" id="nb-add" type="button">Add entry</button></div></div>' : '') +
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
        var late = function (p) { return ms.some(function (q) { return q.class_id === p.class_id && q.due_on < today && RH.stageDone(q.stage, p, {}) < 1; }); };
        var awaitingP = subs.filter(function (s) { return s.stage === 'proposal'; }).length, awaitingF = subs.length - awaitingP;
        var needs = ps.filter(function (p) { return late(p) || concern.some(function (c) { return c.project_id === p.id; }) || p.updated_at < weekAgo || p.status === 'returned'; });
        var h = '<section class="rh-hero"><p class="label">Supervisor dashboard</p><h1>Research supervision</h1><p>Every IA your students have started in the classes you teach.</p></section>' +
          '<div class="rh-kpi"><div><b>' + sids.length + '</b><span>Students</span></div><div><b>' + ps.filter(function (p) { return p.kind === 'ia'; }).length + '</b><span>IA projects</span></div><div><b>' + ps.filter(function (p) { return p.kind === 'ee'; }).length + '</b><span>EE projects</span></div><div><b>' + awaitingP + '</b><span>Proposals awaiting approval</span></div><div><b>' + awaitingF + '</b><span>Drafts and finals awaiting feedback</span></div><div><b>' + ps.filter(late).length + '</b><span>Past a deadline</span></div><div><b>' + needs.length + '</b><span>May need intervention</span></div></div>';
        h += '<div class="rh-card"><div class="rh-head"><h2>Students</h2><div class="btns"><select id="tf-cls" aria-label="Class"><option value="">All classes</option>' + cids.map(function (c) { return '<option value="' + c + '">' + E(cls[c] || 'Class') + '</option>'; }).join('') + '</select><select id="tf-st" aria-label="Status"><option value="">Any status</option>' + Object.keys(RH.STATUS).map(function (k) { return '<option value="' + k + '">' + RH.STATUS[k][0] + '</option>'; }).join('') + '<option value="needs">Needs intervention</option></select><button class="btn sm" id="tf-csv" type="button">Download class report (CSV)</button></div></div><div class="scroll" id="tf-tab"></div></div>';
        m.innerHTML = h;
        var rowsFor = function () { var c = m.querySelector('#tf-cls').value, s = m.querySelector('#tf-st').value; return ps.filter(function (p) { return (!c || p.class_id === c) && (!s || (s === 'needs' ? needs.indexOf(p) >= 0 : p.status === s)); }); };
        var draw = function () {
          var rs = rowsFor();
          m.querySelector('#tf-tab').innerHTML = rs.length ? '<table class="dt"><thead><tr><th>Student</th><th>Class</th><th>Project</th><th>Stage</th><th>Progress</th><th>Words</th><th>Status</th><th>Waiting for you</th><th>Updated</th></tr></thead><tbody>' + rs.map(function (p) {
            var pr = RH.progress(p, {}), wait = subs.filter(function (s) { return s.project_id === p.id; }).map(function (s) { return s.stage; });
            return '<tr><td><a href="#/p/' + p.id + '/assess">' + E(names[p.student_id] || 'Student') + '</a>' + (needs.indexOf(p) >= 0 ? ' <span class="rh-badge warn">check in</span>' : '') + '</td><td>' + E(cls[p.class_id] || '—') + '</td><td>' + E(p.title) + '<div class="small muted">' + E((p.rq || '').slice(0, 90)) + '</div></td><td>' + E(RH.stageName(p.stage)) + '</td><td><div class="rh-prog" style="min-width:70px"><i style="width:' + pr + '%"></i></div><span class="small">' + pr + '%</span></td><td class="num">' + (p.word_count || 0) + '</td><td>' + RH.badge(p.status) + '</td><td>' + (wait.length ? '<a class="rh-badge info" href="#/p/' + p.id + '/submit">' + E(wait.join(', ')) + '</a>' : '') + '</td><td>' + RH.date(p.updated_at) + '</td></tr>'; }).join('') + '</tbody></table>'
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
    var m = RH.shell('#/teacher/milestones', '<div class="rh-card"><h2>📅 Milestones and deadlines</h2><p class="small muted">Set a due date for each IA stage per class. Students see them on their dashboard, and overdue stages show on your supervisor dashboard.</p></div><div id="ms-box" class="grp"><p class="muted">Loading…</p></div>');
    var box = m.querySelector('#ms-box');
    var load = function () {
      S.db.from('classes').select('id,name').is('deleted_at', null).order('name').then(function (cr) {
        var mineCls = (cr.data || []);   // RLS returns the classes this teacher can see; teaches_class decides who can write milestones
        return S.db.from('research_milestones').select('*').not('class_id', 'is', null).order('due_on').then(function (r) {
          var ms = r.data || [];
          box.innerHTML = '<div class="rh-card"><h3>Add a milestone</h3><div class="two"><div class="rh-field"><label for="ms-c">Class</label><select id="ms-c">' + mineCls.map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + '</option>'; }).join('') + '</select></div><div class="rh-field"><label for="ms-s">IA stage</label><select id="ms-s">' + RH.IA.map(function (s) { return '<option value="' + s.k + '">' + E(s.n) + '</option>'; }).join('') + '</select></div><div class="rh-field"><label for="ms-d">Due</label><input type="date" id="ms-d"></div><div class="rh-field"><label for="ms-t">Title</label><input type="text" id="ms-t" placeholder="e.g. Proposal and research question"></div></div><div class="btns"><button class="btn main sm" id="ms-add" type="button">Add milestone</button></div></div>' +
            '<div class="rh-card"><h3>Current milestones</h3>' + (ms.length ? '<table class="dt"><thead><tr><th>Class</th><th>Stage</th><th>Title</th><th>Due</th><th></th></tr></thead><tbody>' + ms.map(function (x) { var c = mineCls.filter(function (q) { return q.id === x.class_id; })[0]; return '<tr><td>' + E(c ? c.name : '') + '</td><td>' + E(RH.stageName(x.stage)) + '</td><td>' + E(x.title) + '</td><td>' + RH.date(x.due_on) + '</td><td><button class="btn xs bad" data-del="' + x.id + '" type="button">Remove</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="small muted">None yet.</p>') + '</div>';
          box.querySelector('#ms-add').onclick = function () { var d = box.querySelector('#ms-d').value; if (!d) return RH.toast('Choose a date'); S.db.from('research_milestones').insert({ class_id: box.querySelector('#ms-c').value, kind: 'ia', stage: box.querySelector('#ms-s').value, title: box.querySelector('#ms-t').value.trim() || RH.stageName(box.querySelector('#ms-s').value), due_on: d }).then(function (r) { if (r.error) return RH.err(r.error); load(); }); };
          box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this milestone?')) return; S.db.from('research_milestones').delete().eq('id', b.dataset.del).then(function (r) { if (r.error) return RH.err(r.error); load(); }); }; });
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
  function library() {
    var T = [['IA planning and proposal', 'Topic, research question, hypothesis, variables and method in one plan: the Studio stages 1 to 6 are this template, saved for you.', '#/'], ['Research question worksheet', 'The Research question lab checks the five parts of a focused question and explains each.', '#/rqlab'], ['Variables table and experimental design', 'Stage 4 of the Studio: IV, DV, controlled and confounding variables with how each is changed, measured and controlled.', ''], ['Raw and processed data templates', 'Stage 7: a data table with units and uncertainties, CSV and Excel import, validation and a locked original.', ''], ['Graphing guide', 'The Graph studio draws scatter, line, bar, box and histogram graphs with error bars, trend lines and captions, and checks them.', '#/graph'], ['Statistical analysis guide', 'The Statistics lab chooses a test from your design, runs it and explains the result and its assumptions.', '#/lab'], ['Conclusion and evaluation guides', 'Stages 10 and 11 guide each part and build the limitation-and-improvement table.', ''], ['Final submission checklist', 'Stage 12 runs a readiness check against the four criteria before you submit.', '']];
    RH.shell('#/library', '<div class="rh-card"><h2>📚 Templates and research library</h2><p class="small">Every template is an interactive tool that saves your work. Teacher-created guidance by BioscienceVista; IB criteria are quoted from the IB Biology guide with their source. Official IB exemplars are not reproduced here: ask your teacher for the teacher support material.</p></div><div class="rh-grid">' +
      T.map(function (t) { return '<div class="rh-card"><h3>' + E(t[0]) + '</h3><p class="small">' + E(t[1]) + '</p>' + (t[2] ? '<a class="btn sm" href="' + t[2] + '">Open</a>' : '<span class="small muted">Inside your IA project</span>') + '</div>'; }).join('') + '</div>' +
      '<div class="rh-card"><h3>Finding reliable sources</h3><p class="small">Search these yourself and cite exactly what you read:</p><ul class="small"><li><a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubMed</a>: biomedical and life-science research articles.</li><li><a href="https://scholar.google.com/" target="_blank" rel="noopener">Google Scholar</a>: peer-reviewed papers across all sciences.</li><li><a href="https://doaj.org/" target="_blank" rel="noopener">DOAJ</a>: open-access, peer-reviewed journals.</li><li><a href="https://search.crossref.org/" target="_blank" rel="noopener">Crossref search</a>: check a DOI and the full reference.</li></ul></div>');
  }
  function academy() {
    var A = [['What makes a focused research question?', 'It names the independent variable with its range and units, the dependent variable and how it is measured, and the organism or system. "How does temperature affect enzymes?" is a topic; a research question says which enzyme, which temperatures, and how the rate is measured.'], ['Prediction or hypothesis?', 'A prediction says what you expect to happen ("the rate will increase up to 40 °C"). A hypothesis also explains why, using biology ("because more kinetic energy means more enzyme–substrate collisions, until the active site denatures"). Statistical tests use a null hypothesis (no difference or no relationship) and an alternative hypothesis.'],
      ['Uncertainty in Biology', 'Record the instrument uncertainty (± half the smallest division for analogue scales, ± the last digit for digital), show variation between trials (standard deviation or range), and carry uncertainties into processed values. Error bars on graphs show the spread of the data.'], ['Choosing a statistical test', 'The test follows from the design: comparing groups or looking for a relationship; two groups or more; independent or paired; normal or skewed; counts or measurements. Never pick a test because it is available or because it gives a smaller p-value.'],
      ['Significance is not importance', 'p < 0.05 means a result this extreme would be unlikely if the null hypothesis were true. It does not tell you how big or biologically important the effect is, and a correlation does not show cause and effect.'], ['Writing an evaluation', 'For each specific weakness: what it was, how it affected the results (in which direction and how much), why it happened, a realistic improvement, and how that improvement would make the conclusion more reliable.'], ['Using AI responsibly', 'AI can explain, question and give feedback. It must not write your work, invent data or create references. Record every use in your integrity record, as your school and the IB require.']];
    RH.shell('#/help', '<div class="rh-card"><h2>🎓 Research academy</h2><p class="small">Short guides to the ideas behind a strong investigation. Each Studio stage also has its own guidance in the side panel.</p></div>' + A.map(function (a) { return '<details class="rh-card"><summary>' + E(a[0]) + '</summary><p class="small" style="margin-top:8px">' + E(a[1]) + '</p></details>'; }).join(''));
  }
  function eeSoon() {
    RH.shell('#/ee', '<div class="rh-card tint"><p class="label">Next phase</p><h2>📝 Extended Essay Studio</h2><p>The EE Studio is the next phase of the Hub. It will follow the Extended Essay guide for first assessment 2027 (five criteria, 4,000 words, a 500-word RPF and three reflection sessions ending with the viva voce), checked against the guide before it opens.</p><p class="small muted">It will include subject and topic selection, a research question builder, the proposal for your supervisor, a source library with credibility checks, a writing studio with word counts and draft comparison, the reflection sessions, and the five-criterion rubric.</p><a class="btn sm" href="#/">Back to the dashboard</a></div>');
  }

  /* ---------- start ---------- */
  S.guard(el, { anyone: true, school: true, allowPending: true }).then(function (me) {
    RH.me = me; RH.teacher = !!(me.staff || me.school || (me.roles || []).indexOf('teacher') >= 0);
    try { RH.lastPid = localStorage.getItem('rh-last'); } catch (e) {}
    if (!RH.teacher && !(me.classes || []).length) {
      // students without a class can still explore the tools, and start a project once they join a class
    }
    RH.curriculum().then(function () { window.addEventListener('hashchange', route); route(); });
  }).catch(function () {});
})();
