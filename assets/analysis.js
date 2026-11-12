/* Learnova · Student Work Analysis Engine: views shared by the teacher dashboard and the student dashboard.
   Everything here is drawn from the database's rule-based analysis (works without AI). AI analysis, when present,
   is shown in its own clearly labelled box. Evidence (what the marks show) is kept apart from suggestions. */
(function () {
  var A = window.BVA = {};
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function when(v) { if (!v) return ''; var d = new Date(v); return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }); }
  A.E = E; A.when = when;
  var LEVEL = { secure: ['Secure understanding', '#15803d', '#dcfce7'], developing: ['Developing understanding', '#1d4ed8', '#dbeafe'],
    practice: ['Needs further practice', '#b45309', '#fef3c7'], intervention: ['Requires intervention', '#b91c1c', '#fee2e2'] };
  var SKILL = { recall: 'Knowledge and recall', explanation: 'Written explanations', calculation: 'Calculations', skills: 'Scientific skills (planning, data, evaluation)' };
  var STATE = { correct: ['✓', 'Correct', '#15803d'], partial: ['◐', 'Partly correct', '#b45309'], incorrect: ['✗', 'Incorrect', '#b91c1c'], unanswered: ['○', 'Not answered', '#64748b'], pending: ['…', 'Waiting for marking', '#64748b'] };
  A.LEVEL = LEVEL;
  function levelOf(pct, th) { th = th || {}; if (pct == null) return null; return pct >= (th.secure || 85) ? 'secure' : pct >= (th.developing || 70) ? 'developing' : pct >= (th.practice || 50) ? 'practice' : 'intervention'; }
  A.levelOf = levelOf;
  function pill(level, note) {
    if (!level) return '<span class="ba-pill" style="background:#f1f5f9;color:#475569" title="Too few marked questions to judge yet">' + E(note || 'Not enough evidence yet') + '</span>';
    var L = LEVEL[level]; return '<span class="ba-pill" style="background:' + L[2] + ';color:' + L[1] + '">' + L[0] + '</span>';
  }
  A.pill = pill;
  function bar(pct, level) { var L = LEVEL[level] || ['', '#94a3b8']; return '<span class="ba-bar"><i style="width:' + Math.max(0, Math.min(100, pct || 0)) + '%;background:' + L[1] + '"></i></span>'; }
  function trend(a, b) { if (a == null || b == null) return ''; var d = b - a; return d >= 5 ? '<span class="ba-up" title="First ' + a + '% → latest ' + b + '%">▲ ' + d + '</span>' : d <= -5 ? '<span class="ba-down" title="First ' + a + '% → latest ' + b + '%">▼ ' + (-d) + '</span>' : '<span class="ba-flat" title="First ' + a + '% → latest ' + b + '%">→</span>'; }
  function spark(hist) {   // results over time, as a small line chart
    var pts = (hist || []).filter(function (h) { return h.pct != null; }); if (pts.length < 2) return '';
    var w = 260, h = 60, n = pts.length, xy = pts.map(function (p, i) { return [6 + i * (w - 12) / (n - 1), h - 6 - (p.pct / 100) * (h - 12)]; });
    return '<svg class="ba-spark" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Results over time: ' + pts.map(function (p) { return p.pct + '%'; }).join(', ') + '">' +
      '<line x1="0" x2="' + w + '" y1="' + (h - 6 - 0.5 * (h - 12)) + '" y2="' + (h - 6 - 0.5 * (h - 12)) + '" stroke="#e2e8f0" stroke-dasharray="3 3"/>' +
      '<polyline fill="none" stroke="#2563eb" stroke-width="2" points="' + xy.map(function (p) { return p.join(','); }).join(' ') + '"/>' +
      xy.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#2563eb"><title>' + E(pts[i].title) + ': ' + pts[i].pct + '%</title></circle>'; }).join('') + '</svg>';
  }
  function list(arr, icon) { return (arr || []).length ? '<ul class="ba-list">' + arr.map(function (x) { return '<li>' + (icon ? icon + ' ' : '') + E(x) + '</li>'; }).join('') + '</ul>' : ''; }
  function aiDim(name, d) { if (!d || !d.rating) return ''; var c = { strong: '#15803d', adequate: '#1d4ed8', weak: '#b45309' }[d.rating] || '#64748b';
    return '<div class="ba-dim"><b>' + E(name) + '</b> <span style="color:' + c + ';font-weight:600">' + E(d.rating) + '</span>' + (d.evidence ? '<div class="small">Evidence: ' + E(d.evidence) + '</div>' : '') + (d.advice ? '<div class="small">↗ ' + E(d.advice) + '</div>' : '') + '</div>'; }

  /* ---------- one submission ---------- */
  A.submissionHtml = function (sa, items, opts) {
    opts = opts || {}; var r = sa.rule || {}, th = (opts.settings || {}).thresholds, c = r.counts || {};
    var h = '<div class="ba"><div class="ba-head"><div><b>' + E(sa.title) + '</b> <span class="small muted">' + ({ quiz: 'Quiz', exam: 'Exam', lesson: 'Interactive lesson' }[sa.kind] || '') + ' · ' + when(sa.at) + '</span></div>' +
      '<div><b style="font-size:1.3em">' + (sa.pct == null ? '–' : sa.pct + '%') + '</b> <span class="small">(' + E(sa.score) + ' / ' + E(sa.max) + ')</span> ' + pill(r.level || levelOf(sa.pct, th)) + '</div></div>';
    h += '<p class="small">' + ['correct', 'partial', 'incorrect', 'unanswered', 'pending'].filter(function (k) { return c[k]; }).map(function (k) { return '<span style="color:' + STATE[k][2] + '">' + STATE[k][0] + ' ' + c[k] + ' ' + STATE[k][1].toLowerCase() + '</span>'; }).join(' · ') +
      (r.compare ? ' · ' + (r.compare.change >= 0 ? '<span class="ba-up">▲ ' + r.compare.change + ' points</span>' : '<span class="ba-down">▼ ' + (-r.compare.change) + ' points</span>') + ' compared with ' + E(r.compare.title) + ' (' + r.compare.pct + '%, ' + when(r.compare.at) + ')' : '') + '</p>';
    h += '<div class="ba-grid2"><div><h5>By topic</h5>' + (r.by_topic || []).map(function (t) { return '<div class="ba-row"><span>' + E(t.topic) + '</span>' + bar(t.pct, t.level) + '<span class="small">' + t.pct + '%</span></div>'; }).join('') +
      '<h5>By kind of question</h5>' + (r.by_skill || []).map(function (s) { var lv = levelOf(s.pct, th); return '<div class="ba-row"><span>' + E(SKILL[s.skill] || s.skill) + '</span>' + bar(s.pct, lv) + '<span class="small">' + s.pct + '%</span></div>'; }).join('') + '</div>' +
      '<div>' + ((r.strengths || []).length ? '<h5>✓ Strengths</h5>' + list(r.strengths) : '') + ((r.gaps || []).length ? '<h5>✗ Learning gaps</h5>' + list(r.gaps) : '') +
      ((r.misconceptions || []).length ? '<h5>💡 Misconceptions</h5>' + list(r.misconceptions) : '') +
      ((r.improve || []).length ? '<h5>↗ To improve</h5><ul class="ba-list">' + r.improve.map(function (i) { return '<li><b>' + E(i.q) + '</b> (' + E(i.got == null ? '–' : i.got) + '/' + E(i.max) + ', ' + E(i.objective) + ')' + (i.note ? ': ' + E(i.note) : '') + '</li>'; }).join('') + '</ul>' : '') + '</div></div>';
    if (items && items.length) h += '<details' + (opts.open ? ' open' : '') + '><summary class="small"><b>Question by question</b></summary><table class="ba-t"><tr><th>Q</th><th>Objective</th><th>Topic</th><th>Mark</th><th>Result</th></tr>' + items.map(function (i) {
      var s = STATE[i.state] || ['', i.state, '#64748b']; return '<tr><td>' + E(i.q_label) + '</td><td>' + E(i.objective) + '</td><td class="small">' + E(i.topic) + '</td><td>' + (i.got == null ? '–' : E(i.got)) + '/' + E(i.max) + '</td><td style="color:' + s[2] + '">' + s[0] + ' ' + s[1] +
        ((i.misconceptions || []).length ? '<div class="small">💡 ' + E(i.misconceptions.join(' ')) + '</div>' : '') + (i.note && i.state !== 'correct' ? '<div class="small muted">' + E(i.note) + '</div>' : '') + '</td></tr>'; }).join('') + '</table></details>';
    var ai = sa.ai; if (ai && !ai.none) h += '<div class="ba-ai"><b>' + (opts.staff ? '🤖 AI analysis of the written answers' : '📝 A closer look at your written answers') + '</b> <span class="small muted">' + (opts.staff ? 'a suggestion based on the answers; the marks above are the evidence' : 'based on your answers') + '</span>' +
      (ai.summary ? '<p>' + E(ai.summary) + '</p>' : '') + aiDim('Scientific terminology', ai.terminology) + aiDim('Application of concepts', ai.application) + aiDim('Explanations and reasoning', ai.reasoning) +
      ((ai.misconceptions || []).length ? '<h5>💡 Misconceptions noticed</h5><ul class="ba-list">' + ai.misconceptions.map(function (m) { return '<li>' + (m.q ? '<b>' + E(m.q) + ':</b> ' : '') + E(m.idea) + (m.correct ? ' → ' + E(m.correct) : '') + '</li>'; }).join('') + '</ul>' : '') +
      ((ai.gaps || []).length ? '<h5>Gaps</h5>' + list(ai.gaps) : '') + ((ai.recommendations || []).length ? '<h5>📚 Recommended next steps</h5>' + list(ai.recommendations) : '') + '</div>';
    return h + '</div>';
  };

  /* ---------- a student's learning profile ---------- */
  A.profileHtml = function (p, opts) {
    opts = opts || {}; var th = (p.settings || {}).thresholds || {}, o = p.overall || {};
    if (!o.items) return '<p class="emptybox">No marked work has been analysed yet. The profile fills in as ' + (opts.staff ? 'the student hands in' : 'you hand in') + ' lessons, quizzes and exams.</p>';
    var you = opts.staff ? 'the student' : 'you';
    var h = '<div class="ba"><div class="ba-tiles"><div><span class="small muted">Overall</span><b>' + o.pct + '%</b><span class="small">' + o.items + ' questions · ' + o.assessments + ' pieces of work</span></div>' +
      '<div><span class="small muted">Trend</span><b>' + (p.trend == null ? '–' : (p.trend > 0 ? '▲ ' : p.trend < 0 ? '▼ ' : '') + Math.abs(p.trend)) + '</b><span class="small">' + (p.trend == null ? 'needs 4 or more results' : 'latest two results vs first two') + '</span></div>' +
      '<div><span class="small muted">Results over time</span>' + (spark(p.history) || '<span class="small">needs 2 or more results</span>') + '</div></div>';
    h += '<h5>Topic mastery</h5><p class="small muted">Levels: ' + Object.keys(LEVEL).map(function (k) { return pill(k) + ' ' + ({ secure: (th.secure || 85) + '–100%', developing: (th.developing || 70) + '–' + ((th.secure || 85) - 1) + '%', practice: (th.practice || 50) + '–' + ((th.developing || 70) - 1) + '%', intervention: 'below ' + (th.practice || 50) + '%' }[k]); }).join(' ') +
      '. A topic gets a level only after ' + ((p.settings || {}).min_items || 3) + ' or more marked questions from ' + ((p.settings || {}).min_assessments || 2) + ' or more pieces of work.</p>';
    h += '<table class="ba-t"><tr><th>Topic</th><th>Mastery</th><th></th><th>Level</th><th>Change</th><th class="small">Evidence</th></tr>' + (p.topics || []).slice().sort(function (a, b) { return b.pct - a.pct; }).map(function (t) {
      return '<tr><td>' + E(t.topic) + '</td><td>' + bar(t.pct, t.level || 'none') + '</td><td>' + t.pct + '%</td><td>' + pill(t.level) + '</td><td>' + trend(t.first_pct, t.last_pct) + '</td><td class="small muted">' + t.items + ' q · ' + t.assessments + ' work</td></tr>'; }).join('') + '</table>';
    var strong = (p.topics || []).filter(function (t) { return t.level === 'secure'; }), weak = (p.topics || []).filter(function (t) { return t.level === 'practice' || t.level === 'intervention'; });
    var improving = (p.topics || []).filter(function (t) { return t.first_pct != null && t.last_pct - t.first_pct >= 10; }), hard = (p.topics || []).filter(function (t) { return t.assessments >= 2 && t.last_pct != null && t.last_pct < (th.practice || 50); });
    h += '<div class="ba-grid2"><div>' + (strong.length ? '<h5>✓ Consistently strong</h5>' + list(strong.map(function (t) { return t.topic + ' (' + t.pct + '%)'; })) : '') +
      (improving.length ? '<h5>▲ Improving</h5>' + list(improving.map(function (t) { return t.topic + ': ' + t.first_pct + '% → ' + t.last_pct + '%'; })) : '') + '</div><div>' +
      (weak.length ? '<h5>✗ Weaker topics</h5>' + list(weak.map(function (t) { return t.topic + ' (' + t.pct + '%)'; })) : '') +
      (hard.length ? '<h5>Still difficult</h5>' + list(hard.map(function (t) { return t.topic + ' (latest ' + t.last_pct + '%)'; })) : '') + '</div></div>';
    var objs = (p.objectives || []).filter(function (x) { return x.level === 'practice' || x.level === 'intervention'; });
    if (objs.length) h += '<h5>Learning objectives that need practice</h5><table class="ba-t"><tr><th>Objective</th><th>Topic</th><th>Mastery</th></tr>' + objs.slice(0, 12).map(function (x) { return '<tr><td>' + E(x.objective) + '</td><td class="small">' + E(x.topic) + '</td><td>' + x.pct + '% <span class="small muted">(' + x.items + ' q)</span></td></tr>'; }).join('') + '</table>';
    if ((p.skills || []).length) h += '<h5>By kind of question</h5>' + p.skills.map(function (s) { return '<div class="ba-row"><span>' + E(SKILL[s.skill] || s.skill) + '</span>' + bar(s.pct, levelOf(s.pct, th)) + '<span class="small">' + s.pct + '% (' + s.items + ' q)</span></div>'; }).join('');
    if ((p.repeated || []).length) h += '<h5>🔁 Repeated mistakes</h5><ul class="ba-list">' + p.repeated.map(function (r) { return '<li>' + E(r.misconception) + ' <span class="small muted">(in ' + r.times + ' pieces of work)</span></li>'; }).join('') + '</ul>';
    var recs = p.recommendations || [];
    if (recs.length) h += '<h5>📚 Recommended next</h5>' + recs.map(function (r) {
      var links = [].concat((r.lessons || []).map(function (l) { return ['🧪', l.title, l.url]; }), (r.sims || []).map(function (l) { return ['🔬', l.title, l.url]; }), (r.resources || []).map(function (l) { return ['📄', l.title, l.url]; }),
        (r.quizzes || []).map(function (q) { return ['📝', q.title, ({ exam: '/exams/', lesson: '/lesson/' }[q.category] || '/quizzes/') + '#' + q.id]; }));
      return '<div class="ba-rec"><b>' + E(r.topic) + '</b> <span class="small muted">' + r.pct + '%' + (r.enough ? '' : ', based on limited evidence') + '</span>' +
        ((r.practise || []).length ? '<div class="small">Practise: ' + E(r.practise.join('; ')) + '</div>' : '') +
        (links.length ? '<div class="ba-links">' + links.map(function (l) { return '<a href="' + E(l[2] || '#') + '">' + l[0] + ' ' + E(l[1]) + '</a>'; }).join('') + '</div>' : '<div class="small muted">Revise this topic in your notes, then correct the questions listed in your work.</div>') + '</div>'; }).join('');
    var ins = p.insight && p.insight.ai; if (ins) h += '<div class="ba-ai"><b>' + (opts.staff ? '🤖 AI summary of this profile' : '📝 Summary of your learning') + '</b> <span class="small muted">' + when(p.insight.at) + ' · based only on the marks above</span><p>' + E(ins.summary) + '</p>' +
      (ins.patterns && ins.patterns.length ? '<h5>Patterns</h5>' + list(ins.patterns) : '') + (ins.recommendations && ins.recommendations.length ? '<h5>Next steps</h5>' + list(ins.recommendations) : '') + '</div>';
    if ((p.comments || []).length) h += '<h5>👩‍🏫 Teacher comments</h5>' + p.comments.map(function (c) { return '<div class="ba-note"><span class="small muted">' + when(c.at) + '</span> ' + E(c.comment) + '</div>'; }).join('');
    return h + '</div>';
  };

  /* ---------- class analytics ---------- */
  A.classHtml = function (d, opts) {
    opts = opts || {}; var th = (d.settings || {}).thresholds || {}, s = d.summary || {};
    var topics = (d.topics || []).map(function (t) { return t.topic; });
    var h = '<div class="ba"><div class="ba-tiles"><div><span class="small muted">Class average</span><b>' + (s.avg == null ? '–' : s.avg + '%') + '</b><span class="small">' + (s.with_data || 0) + ' of ' + (s.students || 0) + ' students with marked work</span></div>' +
      '<div><span class="small muted">Highest</span><b>' + (s.high == null ? '–' : s.high + '%') + '</b></div><div><span class="small muted">Lowest</span><b>' + (s.low == null ? '–' : s.low + '%') + '</b></div></div>';
    if ((d.suggestions || []).length) h += '<h5>🧭 Teaching suggestions</h5><p class="small muted">Each suggestion shows the <b>evidence</b> (from the marks) and a <b>suggested action</b> (made by the system, for you to decide).</p>' + d.suggestions.map(function (g, i) {
      return '<div class="ba-sug"><b>' + E(g.title) + '</b><div class="small"><b>Evidence:</b> ' + E(g.evidence) + '</div><div class="small"><b>Suggested action:</b> ' + E(g.action) + '</div>' + (opts.save ? '<button type="button" class="btn sm" data-iv="' + i + '">＋ Add to my intervention plan</button>' : '') + '</div>'; }).join('');
    h += '<h5>Topic mastery across the class</h5>' + ((d.topics || []).length ? (d.topics || []).map(function (t) { return '<div class="ba-row"><span>' + E(t.topic) + '</span>' + bar(t.pct, t.level) + '<span class="small">' + t.pct + '% · ' + t.students + ' students</span> ' + pill(t.level) + '</div>'; }).join('') : '<p class="small muted">No marked work yet for these filters.</p>');
    var studs = (d.students || []).filter(function (x) { return x.items > 0; });
    if (studs.length && topics.length) {
      var g = {}; (d.grid || []).forEach(function (x) { g[x.student_id + '|' + x.topic] = x; });
      h += '<h5>Students × topics</h5><div class="ba-scroll"><table class="ba-t ba-heat"><tr><th>Student</th><th>Overall</th>' + topics.map(function (t) { return '<th title="' + E(t) + '">' + E(t.length > 18 ? t.slice(0, 17) + '…' : t) + '</th>'; }).join('') + '<th>Change</th></tr>' +
        studs.sort(function (a, b) { return (a.pct || 0) - (b.pct || 0); }).map(function (x) {
          return '<tr><td>' + (opts.link ? '<a href="' + opts.link(x.student_id) + '">' + E(x.name) + '</a>' : E(x.name)) + '</td><td>' + cell(x.pct, x.items) + '</td>' + topics.map(function (t) { var c = g[x.student_id + '|' + t]; return '<td>' + (c ? cell(c.pct, c.items) : '<span class="muted">·</span>') + '</td>'; }).join('') +
            '<td>' + (x.n_subs >= 4 ? trend(x.first_pct, x.last_pct) : '<span class="small muted">–</span>') + '</td></tr>'; }).join('') + '</table></div>';
    }
    function cell(p, n) { var lv = n >= ((d.settings || {}).min_items || 3) ? levelOf(p, th) : null, L = LEVEL[lv]; return '<span class="ba-cell" style="background:' + (L ? L[2] : '#f1f5f9') + ';color:' + (L ? L[1] : '#475569') + '" title="' + n + ' marked questions">' + (p == null ? '–' : p + '%') + '</span>'; }
    var need = studs.filter(function (x) { return x.items >= ((d.settings || {}).min_items || 3) && x.pct < (th.practice || 50); }), strong = studs.filter(function (x) { return x.items >= ((d.settings || {}).min_items || 3) && x.pct >= (th.secure || 85); });
    h += '<div class="ba-grid2"><div><h5>Need additional support</h5>' + (need.length ? list(need.map(function (x) { return x.name + ' (' + x.pct + '%)'; })) : '<p class="small muted">None at the moment.</p>') + '</div>' +
      '<div><h5>Strong mastery</h5>' + (strong.length ? list(strong.map(function (x) { return x.name + ' (' + x.pct + '%)'; })) : '<p class="small muted">None yet.</p>') + '</div></div>';
    if ((d.missed || []).length) h += '<h5>Most frequently missed questions</h5><table class="ba-t"><tr><th>Assessment</th><th>Q</th><th>Objective</th><th>Class score</th><th>Wrong / partly</th></tr>' + d.missed.map(function (m) {
      return '<tr><td class="small">' + E(m.title) + '</td><td>' + E(m.q) + '</td><td>' + E(m.objective) + '</td><td>' + m.pct + '%</td><td class="small">' + m.wrong + ' / ' + m.partial + ' of ' + m.attempts + '</td></tr>'; }).join('') + '</table>';
    if ((d.misconceptions || []).length) h += '<h5>💡 Common misconceptions</h5><ul class="ba-list">' + d.misconceptions.map(function (m) { return '<li>' + E(m.misconception) + ' <span class="small muted">(' + m.students + ' student' + (m.students === 1 ? '' : 's') + ')</span></li>'; }).join('') + '</ul>';
    if ((d.progress || []).length) h += '<h5>Progress across assessments</h5><table class="ba-t"><tr><th>Assessment</th><th>Type</th><th>Date</th><th>Average</th><th>High</th><th>Low</th><th>Students</th></tr>' + d.progress.map(function (p) {
      return '<tr><td>' + E(p.title) + '</td><td class="small">' + E(p.kind) + '</td><td class="small">' + when(p.at) + '</td><td>' + bar(p.avg, levelOf(p.avg, th)) + ' ' + p.avg + '%</td><td>' + p.high + '%</td><td>' + p.low + '%</td><td>' + p.n + '</td></tr>'; }).join('') + '</table>';
    return h + '</div>';
  };

  /* ---------- printable reports ---------- */
  var CSS = 'body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#111;max-width:900px;margin:20px auto;padding:0 16px}h1{font-size:1.45em;margin:0 0 4px}h2{font-size:1.15em;border-bottom:2px solid #e2e8f0;padding-bottom:3px;margin-top:22px}' +
    '.meta{color:#555;margin-bottom:12px}.bar{position:sticky;top:0;background:#fff;padding:8px 0;border-bottom:1px solid #ddd;margin-bottom:10px}@media print{.bar{display:none}a{color:#111;text-decoration:none}}' +
    '.note{border:1px dashed #94a3b8;border-radius:8px;min-height:70px;padding:8px;margin:6px 0}' + 'STYLES';
  A.reportDoc = function (title, meta, body) {
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + E(title) + '</title><style>' + CSS.replace('STYLES', A.css) + '</style></head><body>' +
      '<div class="bar"><button onclick="print()">🖨 Print or save as PDF</button></div><h1>' + E(title) + '</h1><p class="meta">' + meta + '</p>' + body +
      '<p class="meta" style="margin-top:24px">Learnova · prepared by George Apidi · generated ' + E(new Date().toLocaleString()) + ' from the marks recorded in Learnova. Marks are evidence; suggestions and AI analysis are recommendations for the teacher to judge.</p></body></html>';
  };
  A.openDoc = function (html, name) {
    var w = window.open('', '_blank');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = (name || 'report') + '.html'; a.click();
  };

  A.css = '.ba{display:grid;gap:6px}.ba h5{margin:12px 0 4px;font-size:.98em}.ba-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}' +
    '.ba-pill{display:inline-block;border-radius:99px;padding:1px 9px;font-size:.8em;font-weight:600;white-space:nowrap}.ba-bar{display:inline-block;width:120px;height:9px;background:#e2e8f0;border-radius:99px;overflow:hidden;vertical-align:middle}.ba-bar i{display:block;height:100%}' +
    '.ba-row{display:grid;grid-template-columns:minmax(120px,1fr) 130px auto auto;gap:8px;align-items:center;margin:3px 0}.ba-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}' +
    '.ba-list{margin:2px 0;padding-left:1.2em}.ba-list li{margin:2px 0}.ba-t{border-collapse:collapse;width:100%;font-size:.92em}.ba-t th,.ba-t td{border-bottom:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:top}' +
    '.ba-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.ba-tiles>div{border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;display:grid;gap:2px;background:#fff}.ba-tiles b{font-size:1.5em}' +
    '.ba-up{color:#15803d;font-weight:600}.ba-down{color:#b91c1c;font-weight:600}.ba-flat{color:#64748b}.ba-spark{width:100%;max-width:260px;height:60px}' +
    '.ba-ai{border:1px dashed #c4b5fd;background:#faf5ff;border-radius:10px;padding:8px 12px;margin-top:8px}.ba-dim{margin:4px 0}.ba-rec{border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;margin:4px 0;background:#fff}' +
    '.ba-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.ba-links a{border:1px solid #cbd5e1;border-radius:8px;padding:2px 8px;font-size:.88em;text-decoration:none}.ba-note{border-left:3px solid #2563eb;padding:3px 8px;margin:3px 0;background:#f8fafc}' +
    '.ba-sug{border:1px solid #e2e8f0;border-left:4px solid #7c3aed;border-radius:8px;padding:6px 10px;margin:5px 0;display:grid;gap:3px;background:#fff}.ba-scroll{overflow-x:auto}.ba-heat td,.ba-heat th{text-align:center;white-space:nowrap}.ba-heat td:first-child,.ba-heat th:first-child{text-align:left}' +
    '.ba-cell{display:inline-block;min-width:44px;border-radius:6px;padding:1px 4px;font-size:.85em;font-weight:600}@media (max-width:600px){.ba-row{grid-template-columns:1fr 90px auto}.ba-row .ba-pill{display:none}.ba-bar{width:80px}}';
  var st = document.createElement('style'); st.textContent = A.css; document.head.appendChild(st);
})();
