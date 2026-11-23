/* BioscienceVista · CAS (DP) and Service as Action (MYP) (23 Nov 2026, roadmap phase 5; table service_entries, migration 086).
   Students log experiences and projects with strands, the stage reached, dates, hours, the learning outcomes each shows,
   evidence links and dated reflections. A coverage grid shows which of the seven learning outcomes have evidence, and which
   a teacher has approved. Teachers comment and approve; parents read what is shared. Anyone who can see it can print it.
   BVSVC.student(host, S, me)                        the student's own log
   BVSVC.view(host, S, { ids, names, teacher })      teachers (comment, approve) and parents (read only)
   Learning outcomes: IB CAS guide (seven outcomes); MYP: From principles into practice, service as action (seven outcomes). */
(function () {
  var V = window.BVSVC = {};
  var LO = {
    CAS: ['Identify own strengths and develop areas for growth', 'Demonstrate that challenges have been undertaken, developing new skills in the process', 'Demonstrate how to initiate and plan a CAS experience', 'Show commitment to and perseverance in CAS experiences', 'Demonstrate the skills and recognize the benefits of working collaboratively', 'Demonstrate engagement with issues of global significance', 'Recognize and consider the ethics of choices and actions'],
    SA: ['Become more aware of their own strengths and areas for growth', 'Undertake challenges that develop new skills', 'Discuss, evaluate and plan student-initiated activities', 'Persevere in action', 'Work collaboratively with others', 'Develop international-mindedness through global engagement, multilingualism and intercultural understanding', 'Consider the ethical implications of their actions']
  };
  var STRANDS = { CAS: [['creativity', '🎨 Creativity'], ['activity', '🏃 Activity'], ['service', '🤝 Service']], SA: [['direct', '🤝 Direct service'], ['indirect', '📦 Indirect service'], ['advocacy', '📣 Advocacy'], ['research', '🔎 Research']] };
  var STAGES = [['investigation', '1 Investigation'], ['preparation', '2 Preparation'], ['action', '3 Action'], ['reflection', '4 Reflection'], ['demonstration', '5 Demonstration']];
  var STATUS = { planned: '🗓 Planned', ongoing: '▶ Ongoing', completed: '✓ Completed' };
  var NAME = { CAS: 'CAS: creativity, activity, service', SA: 'Service as Action' };
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function day(d) { return d ? new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString() : ''; }
  var CSS = '<style>.sv-it{border:1px solid #e2e8f0;border-left:6px solid #0d9488;border-radius:12px;padding:10px 12px;margin:8px 0;background:#fff}.sv-it.ok{border-left-color:#16a34a}.sv-it h4{margin:2px 0}.sv-m{font-size:.8rem;color:#64748b}' +
    '.sv-chip{display:inline-block;padding:1px 8px;margin:2px 4px 2px 0;border-radius:999px;font-size:.75rem;font-weight:700;background:#ccfbf1;color:#115e59}.sv-chip.lo{background:#ede9fe;color:#5b21b6}.sv-chip.ok{background:#dcfce7;color:#166534}' +
    '.sv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:8px;margin:8px 0}.sv-lo{border-radius:10px;padding:8px 10px;font-size:.84rem;border:1px solid #e2e8f0;background:#f8fafc}.sv-lo b{display:block}.sv-lo.ev{background:#f5f3ff;border-color:#c4b5fd}.sv-lo.ap{background:#f0fdf4;border-color:#86efac}' +
    '.sv-sum{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}.sv-sum span{padding:4px 10px;border-radius:999px;background:#f1f5f9;font-weight:700;font-size:.84rem}.sv-rf{border-left:3px solid #c4b5fd;padding:4px 10px;margin:6px 0;font-size:.9rem;white-space:pre-wrap}' +
    '.sv-tc{margin-top:8px;border-left:4px solid #0d9488;background:#f0fdfa;padding:6px 10px;border-radius:6px;font-size:.9rem}.sv-f label{display:block;margin:0 0 8px;font-weight:700;font-size:.9rem}.sv-f input:not([type=checkbox]),.sv-f select,.sv-f textarea{width:100%;box-sizing:border-box;font:inherit;font-weight:400;margin-top:3px;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px}' +
    '.sv-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px}.sv-ck{display:flex!important;gap:6px;align-items:flex-start;font-weight:400!important}.sv-ck input{margin-top:4px}.sv-f fieldset{border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;margin:0 0 8px}.sv-f legend{font-weight:700;font-size:.9rem}</style>';

  function totals(rows, prog) {
    var h = 0, by = {}, lo = {}, ap = {}, proj = 0;
    rows.forEach(function (x) { if (x.programme !== prog) return; h += +x.hours || 0; if (x.is_project) proj++;
      (x.strands || []).forEach(function (s) { by[s] = (by[s] || 0) + 1; });
      (x.outcomes || []).forEach(function (n) { lo[n] = (lo[n] || 0) + 1; if (x.approved) ap[n] = 1; }); });
    return { h: h, by: by, lo: lo, ap: ap, proj: proj, n: rows.filter(function (x) { return x.programme === prog; }).length };
  }
  function overview(rows, prog) {
    var t = totals(rows, prog);
    return '<div class="sv-sum"><span>' + t.n + ' entr' + (t.n === 1 ? 'y' : 'ies') + '</span>' + STRANDS[prog].map(function (s) { return '<span>' + s[1] + ': ' + (t.by[s[0]] || 0) + '</span>'; }).join('') +
      '<span>⏱ ' + (Math.round(t.h * 10) / 10) + ' h</span>' + (prog === 'CAS' ? '<span' + (t.proj ? '' : ' style="background:#fef3c7;color:#92400e"') + '>🧩 CAS project: ' + (t.proj ? t.proj : 'not yet') + '</span>' : '') + '</div>' +
      '<p class="small" style="margin:8px 0 0"><b>Learning outcomes</b> <span class="sv-m">purple = evidence logged · green = approved by a teacher</span></p><div class="sv-grid">' + LO[prog].map(function (d, i) { var n = i + 1;
        return '<div class="sv-lo' + (t.ap[n] ? ' ap' : t.lo[n] ? ' ev' : '') + '"><b>' + (t.ap[n] ? '✅' : t.lo[n] ? '🟣' : '⬜') + ' LO' + n + '</b>' + E(d) + (t.lo[n] ? '<div class="sv-m">' + t.lo[n] + ' entr' + (t.lo[n] === 1 ? 'y' : 'ies') + '</div>' : '') + '</div>'; }).join('') + '</div>';
  }
  function card(x, o) {
    o = o || {}; var st = {}; STRANDS[x.programme].forEach(function (s) { st[s[0]] = s[1]; }); var sg = {}; STAGES.forEach(function (s) { sg[s[0]] = s[1]; });
    return '<div class="sv-it' + (x.approved ? ' ok' : '') + '" data-id="' + E(x.id) + '"><div class="sv-m">' + (o.prog ? '<b>' + (x.programme === 'CAS' ? 'CAS' : 'MYP service') + '</b> · ' : '') + E(STATUS[x.status] || x.status) + ' · stage ' + E(sg[x.stage] || x.stage) + (x.is_project ? ' · 🧩 project' : '') +
      (x.starts_on ? ' · ' + E(day(x.starts_on)) + (x.ends_on ? ' to ' + E(day(x.ends_on)) : '') : '') + (x.hours != null ? ' · ' + E(x.hours) + ' h' : '') + (x.approved ? ' · <b style="color:#166534">✅ approved</b>' : '') + '</div>' +
      '<h4>' + E(x.title) + '</h4><div>' + (x.strands || []).map(function (s) { return '<span class="sv-chip">' + E(st[s] || s) + '</span>'; }).join('') + (x.outcomes || []).slice().sort().map(function (n) { return '<span class="sv-chip lo" title="' + E(LO[x.programme][n - 1]) + '">LO' + n + '</span>'; }).join('') + '</div>' +
      (x.description ? '<p class="small" style="margin:6px 0;white-space:pre-wrap">' + E(x.description) + '</p>' : '') + (x.supervisor ? '<div class="sv-m">Supervisor: ' + E(x.supervisor) + '</div>' : '') +
      ((x.evidence || []).length ? '<div class="small" style="margin:4px 0">📎 ' + x.evidence.map(function (v) { var u = safeUrl(v.url); return u ? '<a href="' + E(u) + '" target="_blank" rel="noopener">' + E(v.label || 'Evidence') + '</a>' : E(v.label || ''); }).join(' · ') + '</div>' : '') +
      ((x.reflections || []).length ? '<details' + (o.open ? ' open' : '') + '><summary class="small"><b>💭 ' + x.reflections.length + ' reflection' + (x.reflections.length === 1 ? '' : 's') + '</b></summary>' + x.reflections.map(function (r) { return '<div class="sv-rf"><span class="sv-m">' + E(new Date(r.at).toLocaleDateString()) + '</span>\n' + E(r.text) + '</div>'; }).join('') + '</details>' : '') +
      (x.teacher_comment ? '<div class="sv-tc"><b>Teacher:</b> ' + E(x.teacher_comment) + '</div>' : '') +
      (o.teacher ? '<div class="sv-f" style="margin-top:8px"><label>Your comment<textarea data-tc rows="2" maxlength="2000" placeholder="What this shows, and one next step">' + E(x.teacher_comment || '') + '</textarea></label><label class="sv-ck"><input type="checkbox" data-ap' + (x.approved ? ' checked' : '') + '> Approved: this entry is evidence of the learning outcomes it names</label><button type="button" class="btn sm main" data-save>Save</button> <span class="small" data-msg role="status"></span></div>' : '') +
      (o.mine ? '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px"><button type="button" class="btn sm main" data-rf>💭 Add a reflection</button><button type="button" class="btn sm" data-ed>✎ Edit</button><button type="button" class="btn sm" data-share>' + (x.share_parents ? 'Stop sharing with parents' : 'Share with parents') + '</button><button type="button" class="btn sm" data-del>Remove</button></div><div data-box></div>' : '') + '</div>';
  }
  function printAll(rows, prog, who) {
    var w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; }
    w.document.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + E(NAME[prog]) + ' · ' + E(who || '') + '</title><style>body{font:14px/1.5 system-ui,sans-serif;max-width:780px;margin:20px auto;padding:0 14px;color:#0f172a}details{display:block}details>summary{list-style:none}</style>' + CSS + '</head><body><h1 style="margin:0">' + E(NAME[prog]) + '</h1><p>' + E(who || '') + ' · printed ' + new Date().toLocaleDateString() + '</p>' +
      overview(rows, prog) + rows.filter(function (x) { return x.programme === prog; }).map(function (x) { return card(x, { open: true }); }).join('') + '<script>document.querySelectorAll("details").forEach(function(d){d.open=true});print()<\/script></body></html>');
    w.document.close();
  }
  function guess(me) { var c = (me && me.classes) || []; if (c.some(function (k) { return /dp|diploma|ib (sl|hl)|\b(sl|hl)\b/i.test((k.programme || '') + ' ' + (k.name || '')); })) return 'CAS'; return 'SA'; }

  V.student = function (host, S, me) {
    var KEY = 'bv-svc-prog-' + me.user.id, prog; try { prog = localStorage.getItem(KEY); } catch (e) {} if (prog !== 'CAS' && prog !== 'SA') prog = guess(me);
    var rows = [];
    function load() {
      S.db.from('service_entries').select('*').eq('student_id', me.user.id).order('starts_on', { ascending: false, nullsFirst: true }).order('created_at', { ascending: false }).then(function (r) {
        if (r.error) { host.innerHTML = '<h3>🤝 CAS and Service as Action</h3><p class="small muted">' + (/service_entries|schema cache|does not exist/.test(r.error.message || '') ? 'This part opens soon.' : E(S.nice(r.error))) + '</p>'; return; }
        rows = r.data || []; draw(); }, function () { host.innerHTML = '<p class="small muted">Could not load right now.</p>'; });
    }
    function draw() {
      var mine = rows.filter(function (x) { return x.programme === prog; }), other = rows.length - mine.length;
      host.innerHTML = CSS + '<div class="row2" style="flex-wrap:wrap;gap:8px"><h3 style="margin:0">🤝 ' + E(NAME[prog]) + '</h3><span style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm main" id="svadd">＋ Log an experience</button><button type="button" class="btn sm" id="svprint">🖨 Print</button>' +
        '<button type="button" class="btn sm" id="svsw" title="DP students log CAS; MYP students log Service as Action">Switch to ' + (prog === 'CAS' ? 'Service as Action (MYP)' : 'CAS (DP)') + (other ? ' (' + other + ')' : '') + '</button></span></div>' +
        '<p class="small muted" style="margin:4px 0 0">' + (prog === 'CAS' ? 'Log each creativity, activity or service experience and your CAS project. Reflect as you go, link evidence (photos, videos, documents) and say which of the seven learning outcomes it shows.' : 'Log each time you take action to help others or the environment. Reflect as you go, link evidence and say which of the seven learning outcomes it shows.') + ' Your teacher comments and approves.</p>' +
        '<div id="svform"></div>' + overview(rows, prog) + (mine.length ? mine.map(function (x) { return card(x, { mine: true }); }).join('') : '<p class="emptybox">Nothing logged yet. Press <b>＋ Log an experience</b> to start with something you plan to do or have already done.</p>');
      host.querySelector('#svadd').onclick = function () { form(null); };
      host.querySelector('#svprint').onclick = function () { printAll(rows, prog, (me.profile && me.profile.full_name) || ''); };
      host.querySelector('#svsw').onclick = function () { prog = prog === 'CAS' ? 'SA' : 'CAS'; try { localStorage.setItem(KEY, prog); } catch (e) {} draw(); };
      host.querySelectorAll('.sv-it').forEach(function (el) { var x = rows.filter(function (y) { return y.id === el.getAttribute('data-id'); })[0]; if (!x) return;
        el.querySelector('[data-ed]').onclick = function () { form(x); };
        el.querySelector('[data-del]').onclick = function () { if (!confirm('Remove "' + x.title + '" and its reflections?')) return; S.db.from('service_entries').delete().eq('id', x.id).then(function (r) { if (r.error) return alert(S.nice(r.error)); load(); }); };
        el.querySelector('[data-share]').onclick = function () { S.db.from('service_entries').update({ share_parents: !x.share_parents }).eq('id', x.id).then(function (r) { if (r.error) return alert(S.nice(r.error)); load(); }); };
        el.querySelector('[data-rf]').onclick = function () { var b = el.querySelector('[data-box]');
          b.innerHTML = '<div class="sv-f" style="margin-top:8px"><label>Reflection<textarea rows="4" maxlength="4000" placeholder="What happened? What did you learn about yourself or others? What will you do differently? Which learning outcome does it show?"></textarea></label><button type="button" class="btn sm main">Save reflection</button> <button type="button" class="btn sm" data-x>Cancel</button> <span class="small" role="status"></span></div>';
          var ta = b.querySelector('textarea'); ta.focus(); b.querySelector('[data-x]').onclick = function () { b.innerHTML = ''; };
          b.querySelector('.main').onclick = function () { var t = ta.value.trim(), m = b.querySelector('[role=status]'); if (t.length < 10) { m.textContent = 'Write at least a sentence.'; return; }
            this.disabled = true; var rf = (x.reflections || []).concat([{ at: new Date().toISOString(), text: t.slice(0, 4000) }]);
            S.db.from('service_entries').update({ reflections: rf }).eq('id', x.id).then(function (r) { if (r.error) { m.textContent = S.nice(r.error); return; } load(); }); }; };
      });
    }
    function form(x) {
      var f = host.querySelector('#svform'), v = x || { strands: [], outcomes: [], evidence: [], stage: 'investigation', status: 'planned' };
      f.innerHTML = '<form class="panel sv-f" style="margin:10px 0"><h4 style="margin-top:0">' + (x ? '✎ Edit' : '＋ Log an experience') + '</h4>' +
        '<label>Title<input name="t" required maxlength="200" value="' + E(v.title || '') + '" placeholder="' + (prog === 'CAS' ? 'For example: Coaching under-12 football' : 'For example: Recycling drive for our school') + '"></label>' +
        '<fieldset><legend>' + (prog === 'CAS' ? 'Strands' : 'Type of action') + '</legend>' + STRANDS[prog].map(function (s) { return '<label class="sv-ck"><input type="checkbox" name="s" value="' + s[0] + '"' + (v.strands.indexOf(s[0]) >= 0 ? ' checked' : '') + '> ' + s[1] + '</label>'; }).join('') +
        '<label class="sv-ck"><input type="checkbox" name="p"' + (v.is_project ? ' checked' : '') + '> 🧩 This is a ' + (prog === 'CAS' ? 'CAS project (collaborative, at least a month)' : 'service project') + '</label></fieldset>' +
        '<div class="sv-g"><label>Stage<select name="g">' + STAGES.map(function (s) { return '<option value="' + s[0] + '"' + (v.stage === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label>' +
        '<label>Status<select name="st">' + Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (v.status === k ? ' selected' : '') + '>' + STATUS[k] + '</option>'; }).join('') + '</select></label>' +
        '<label>Start<input type="date" name="a" value="' + E(v.starts_on || '') + '"></label><label>End<input type="date" name="b" value="' + E(v.ends_on || '') + '"></label><label>Hours<input type="number" name="h" min="0" max="2000" step="0.5" value="' + E(v.hours == null ? '' : v.hours) + '"></label></div>' +
        '<label>What you plan to do or did<textarea name="d" rows="3" maxlength="4000">' + E(v.description || '') + '</textarea></label>' +
        '<label>Supervisor (name and role)<input name="su" maxlength="160" value="' + E(v.supervisor || '') + '" placeholder="For example: Ms Wanjiru, club coach"></label>' +
        '<fieldset><legend>Learning outcomes it shows</legend>' + LO[prog].map(function (d, i) { return '<label class="sv-ck"><input type="checkbox" name="o" value="' + (i + 1) + '"' + (v.outcomes.indexOf(i + 1) >= 0 ? ' checked' : '') + '> <span><b>LO' + (i + 1) + '</b> ' + E(d) + '</span></label>'; }).join('') + '</fieldset>' +
        '<label>Evidence links (one per line: a label, then the link)<textarea name="e" rows="3" placeholder="Photos | https://…&#10;Plan | https://…">' + E((v.evidence || []).map(function (q) { return (q.label || '') + ' | ' + (q.url || ''); }).join('\n')) + '</textarea></label>' +
        '<button type="submit" class="btn main sm">Save</button> <button type="button" class="btn sm" data-x>Cancel</button> <span class="small" role="status"></span></form>';
      var F = f.querySelector('form'); F.querySelector('[name=t]').focus(); f.scrollIntoView({ block: 'nearest' });
      F.querySelector('[data-x]').onclick = function () { f.innerHTML = ''; };
      F.onsubmit = function (e) { e.preventDefault(); var m = F.querySelector('[role=status]'), g = function (n) { return F.querySelector('[name=' + n + ']').value.trim(); };
        var ev = g('e').split('\n').map(function (l) { var k = l.lastIndexOf('|'), u = (k >= 0 ? l.slice(k + 1) : l).trim(), lb = (k >= 0 ? l.slice(0, k) : '').trim(); return u ? { label: lb.slice(0, 80) || 'Evidence', url: u.slice(0, 500) } : null; }).filter(Boolean);
        if (ev.some(function (q) { return !safeUrl(q.url); })) { m.textContent = 'Each evidence link must start with https://'; return; }
        var a = g('a') || null, b = g('b') || null; if (a && b && b < a) { m.textContent = 'The end date is before the start date.'; return; }
        var row = { programme: prog, title: g('t').slice(0, 200), strands: [].map.call(F.querySelectorAll('[name=s]:checked'), function (c) { return c.value; }), is_project: F.querySelector('[name=p]').checked,
          stage: g('g'), status: g('st'), starts_on: a, ends_on: b, hours: g('h') === '' ? null : Math.max(0, Math.min(2000, +g('h'))), description: g('d') || null, supervisor: g('su') || null,
          outcomes: [].map.call(F.querySelectorAll('[name=o]:checked'), function (c) { return +c.value; }), evidence: ev.slice(0, 20) };
        if (!row.title) { m.textContent = 'Give it a title.'; return; }
        F.querySelector('[type=submit]').disabled = true;
        (x ? S.db.from('service_entries').update(row).eq('id', x.id) : S.db.from('service_entries').insert(row)).then(function (r) { if (r.error) { F.querySelector('[type=submit]').disabled = false; m.textContent = S.nice(r.error); return; } load(); }); };
    }
    host.innerHTML = '<h3>🤝 CAS and Service as Action</h3><p class="small muted">Loading…</p>'; load();
  };

  V.view = function (host, S, o) {
    var ids = (o.ids || []).filter(Boolean); if (!ids.length) { host.remove(); return; }
    S.db.from('service_entries').select('*').in('student_id', ids).order('created_at', { ascending: false }).limit(2000).then(function (r) {
      if (r.error) { if (o.teacher) host.innerHTML = '<p class="small muted">CAS and Service as Action need database update 086.</p>'; else host.remove(); return; }
      var rows = r.data || []; if (!o.teacher && !rows.length) { host.remove(); return; }
      var by = {}; rows.forEach(function (x) { (by[x.student_id] = by[x.student_id] || []).push(x); });
      var who = ids.slice().sort(function (a, b) { return String(o.names[a] || '').localeCompare(String(o.names[b] || '')); });
      var progOf = function (list) { var c = list.filter(function (x) { return x.programme === 'CAS'; }).length; return c * 2 >= list.length ? 'CAS' : 'SA'; };
      host.innerHTML = CSS + '<h3 style="margin-top:0">🤝 CAS and Service as Action</h3>' + (o.teacher ? '<p class="small muted">Each student\'s experiences, reflections and learning outcomes. Comment, and tick <b>Approved</b> when an entry is good evidence of the outcomes it names. Students cannot change your comment or approval.</p>' +
        '<div class="tablewrap"><table class="marks"><tr><th>Student</th><th>Entries</th><th>Hours</th><th>Outcomes with evidence</th><th>Approved</th><th></th></tr>' + who.map(function (id) { var L = by[id] || [], p = L.length ? progOf(L) : 'CAS', t = totals(L, p), ev = Object.keys(t.lo).length, ap = Object.keys(t.ap).length;
          return '<tr data-row="' + E(id) + '"><td>' + E(o.names[id] || 'Student') + '</td><td>' + L.length + (L.length ? ' <span class="small muted">' + p + '</span>' : '') + '</td><td>' + (Math.round(t.h * 10) / 10) + '</td><td>' + ev + ' / 7</td><td>' + ap + ' / 7</td><td>' + (L.length ? '<button type="button" class="btn sm" data-open="' + E(id) + '">Open</button>' : '') + '</td></tr>'; }).join('') + '</table></div><div id="svone"></div>'
        : who.filter(function (id) { return by[id]; }).map(function (id) { var L = by[id], p = progOf(L); return '<h4>' + E(o.names[id] || '') + ' · ' + E(NAME[p]) + '</h4>' + overview(L, p) + L.map(function (x) { return card(x, { prog: true }); }).join(''); }).join(''));
      if (!o.teacher) return;
      host.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-open'), L = by[id] || [], p = progOf(L), one = host.querySelector('#svone');
        one.innerHTML = '<section class="panel" style="margin-top:10px"><div class="row2"><h4 style="margin:0">' + E(o.names[id] || '') + ' · ' + E(NAME[p]) + '</h4><span><button type="button" class="btn sm" data-pr>🖨 Print</button> <button type="button" class="btn sm" data-cl>Close</button></span></div>' + overview(L, p) + L.map(function (x) { return card(x, { teacher: true, prog: true }); }).join('') + '</section>';
        one.querySelector('[data-cl]').onclick = function () { one.innerHTML = ''; };
        one.querySelector('[data-pr]').onclick = function () { printAll(L, p, o.names[id] || ''); };
        one.querySelectorAll('.sv-it').forEach(function (el) { var x = L.filter(function (y) { return y.id === el.getAttribute('data-id'); })[0];
          el.querySelector('[data-save]').onclick = function () { var bt = this, m = el.querySelector('[data-msg]'); bt.disabled = true;
            S.db.from('service_entries').update({ teacher_comment: el.querySelector('[data-tc]').value.trim() || null, approved: el.querySelector('[data-ap]').checked }).eq('id', x.id).select('teacher_comment,approved').then(function (r2) { bt.disabled = false;
              if (r2.error || !(r2.data || []).length) { m.textContent = r2.error ? S.nice(r2.error) : 'Not saved: you may not teach this student.'; return; }
              x.teacher_comment = r2.data[0].teacher_comment; x.approved = r2.data[0].approved; m.textContent = '✓ Saved'; el.classList.toggle('ok', x.approved);
              var t2 = totals(L, p), tr = host.querySelector('tr[data-row="' + id + '"]'); if (tr) tr.children[4].textContent = Object.keys(t2.ap).length + ' / 7';
              var ov = one.querySelector('.sv-sum'); if (ov) { var tmp = document.createElement('div'); tmp.innerHTML = overview(L, p); ov.nextElementSibling.remove(); ov.nextElementSibling.remove(); ov.replaceWith.apply(ov, [].slice.call(tmp.childNodes)); } }); }; });
        one.scrollIntoView({ block: 'nearest' }); }; });
    }, function () { host.remove(); });
  };
})();
