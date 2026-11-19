/* Innovation Studio · BioscienceVista · by BioscienceVista (phase 8)
   Real-world design challenges worked through the design cycle: inquire and analyse → develop ideas → create → evaluate → share
   (MYP Design criteria A–D). Students work alone or in a team; teachers publish challenges, read projects and give feedback.
   Data: innovation_* tables (migration 065) and the private innovation-files bucket. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var STARTERS = [
    ['water', '💧', 'Safe water for a school', 'Many schools rely on water that may be cloudy or contaminated. Design a low-cost way to make water clearer or safer to drink, or to show when it is not safe.', 'SDG 6: Clean water and sanitation', 'Biology · Chemistry'],
    ['handwash', '🧼', 'A hands-free hand-washing station', 'Hand-washing stops many infections, but taps spread germs and waste water. Design a hand-washing station that people can use without touching it and that uses less water.', 'SDG 3: Good health', 'Biology · Design'],
    ['cool', '❄️', 'Keep it cool without electricity', 'Vaccines, milk and vegetables spoil without cooling. Design a cooler that keeps its contents cold for longer, using evaporation, insulation or shade, with no electricity.', 'SDG 3 · SDG 7', 'Physics · Biology'],
    ['plastic', '♻️', 'Less plastic in the canteen', 'Single-use plastic ends up in drains and the sea. Design a product, system or campaign that measurably reduces plastic waste at your school.', 'SDG 12: Responsible consumption', 'ESS · Chemistry'],
    ['grow', '🌱', 'Grow more food in less space', 'Cities have little land. Design a vertical, hydroponic or container growing system that produces food in a small space, and measure how well plants grow.', 'SDG 2: Zero hunger', 'Biology · ESS'],
    ['air', '🌫️', 'How clean is our air?', 'Air pollution affects health. Design a simple way to detect or compare dust or pollution at different places around your school, and a way to share what you find.', 'SDG 11: Sustainable cities', 'Chemistry · ESS'],
    ['pests', '🐛', 'Protect crops without harmful chemicals', 'Pesticides can harm pollinators and people. Design a way to protect a crop from insects or birds using traps, barriers, companion planting or natural repellents.', 'SDG 15: Life on land', 'Biology · ESS'],
    ['assist', '🤝', 'A tool for someone with limited grip', 'Arthritis or injury can make everyday tasks hard. Design a simple aid that helps someone open, hold or carry something, and test it with a real user.', 'SDG 10: Reduced inequalities', 'Biology · Physics · Design']];
  var STAGES = [['inquire', '🔍', 'Inquire and analyse', 'A'], ['ideas', '💡', 'Develop ideas', 'B'], ['create', '🛠️', 'Create the solution', 'C'], ['evaluate', '🧪', 'Evaluate', 'D'], ['share', '📣', 'Share', '']];
  var ST = { me: null, staff: false, p: null, names: {}, tab: 'inquire', ro: false };

  var CSS = '.in-hero{margin:8px 0 16px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#EA580C,#DB2777 50%,#7C3AED)}.in-hero h1{margin:4px 0 6px;color:#fff}.in-hero p{margin:0;color:#fff;max-width:72ch}.in-hero .vx-eye{color:#FEF3C7}' +
    '.in-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.in-ch{display:grid;gap:6px;padding:16px;border-radius:16px;background:#fff;border:2px solid #FED7AA;text-align:left}.in-ch .ic{font-size:2rem}.in-ch small{color:#64748b}' +
    '.in-card{background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:16px;margin:0 0 14px}.in-card h3{margin:0 0 8px}.in-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}' +
    '.in-tabs button{border:2px solid #FED7AA;background:#FFF7ED;color:#9A3412;border-radius:999px;padding:7px 12px;font-weight:700;cursor:pointer}.in-tabs button[aria-selected=true]{background:#EA580C;border-color:#EA580C;color:#fff}' +
    '.in-f{display:grid;gap:4px;margin:0 0 10px}.in-f span{font-weight:700}.in-f small{color:#64748b}.in-f input,.in-f textarea,.in-f select,.in-l input,.in-l textarea,.in-l select{width:100%;box-sizing:border-box;padding:7px 9px;border-radius:9px;border:1px solid #cbd5e1;font:inherit}' +
    '.in-l{display:grid;gap:8px;margin:6px 0}.in-l .row{display:grid;gap:8px;align-items:start;padding:8px;border:1px solid #F1F5F9;border-radius:10px;background:#FAFAFA}.in-l .row button{justify-self:end}' +
    '.in-tbl{border-collapse:collapse;width:100%;font-size:.9rem}.in-tbl th,.in-tbl td{border:1px solid #e2e8f0;padding:5px 7px;text-align:center}.in-tbl th:first-child,.in-tbl td:first-child{text-align:left}.in-tbl select{padding:4px;border-radius:6px}' +
    '.in-fb{padding:10px 12px;border-radius:12px;background:#EEF2FF;border:1px solid #C7D2FE;margin:0 0 8px}.in-tip{padding:8px 12px;border-radius:10px;background:#FEF3C7;border:1px solid #FCD34D;font-size:.9rem;margin:6px 0}' +
    '.in-thumb{max-width:220px;max-height:160px;border-radius:10px;display:block;margin:6px 0;border:1px solid #e2e8f0}.in-chip{display:inline-block;padding:2px 9px;border-radius:999px;background:#FFEDD5;color:#9A3412;font-size:.78rem;font-weight:700;margin:2px 4px 2px 0}.in-muted{color:#64748b;font-size:.9rem}';
  function classOpts(C, pick) {   // the teacher's own classroom first, then the main-site course classes (as on /teach/ and /staff/)
    var live = C.filter(function (c) { return !c.archived_at; }), mine = live.filter(function (c) { return c.owner_kind !== 'main'; }), main = live.filter(function (c) { return c.owner_kind === 'main'; });
    var o = function (c) { return '<option value="' + E(c.id) + '"' + (c.id === pick ? ' selected' : '') + '>' + E(c.name) + '</option>'; };
    return (mine.length && main.length ? '<optgroup label="My classroom">' + mine.map(o).join('') + '</optgroup><optgroup label="Main site courses">' + main.map(o).join('') + '</optgroup>' : live.map(o).join(''));
  }
  function css() { if (!document.getElementById('in-css')) { var s = document.createElement('style'); s.id = 'in-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function msg(t, bad) { var m = document.getElementById('in-msg'); if (m) { m.textContent = t; m.style.color = bad ? '#B91C1C' : '#166534'; clearTimeout(msg.t); msg.t = setTimeout(function () { m.textContent = ''; }, 4000); } }
  function ok(r, t) { if (r && r.error) { msg(/innovation_|schema cache|PGRST205/.test(r.error.message || '') ? 'The Innovation Studio is being set up. Try again soon.' : S.nice(r.error), true); return false; } if (t) msg(t); return true; }
  var saveT; function save(now) { if (ST.ro) return; clearTimeout(saveT); var go = function () { S.db.from('innovation_projects').update({ data: ST.p.data, title: ST.p.title, stage: ST.p.stage }).eq('id', ST.p.id).then(function (r) { ok(r, 'Saved'); }); }; if (now) go(); else saveT = setTimeout(go, 900); }
  function hero(h, p) { return '<section class="in-hero"><p class="vx-eye">Innovation Studio</p><h1>' + E(h) + '</h1><p>' + E(p) + '</p></section>'; }

  S.guard(app, { anyone: true, allowPending: true, school: true }).then(function (me) {
    ST.me = me; ST.staff = !!(me.staff || me.school || me.admin); css(); home();
  }, function () {});

  /* ---------- home: challenges and projects ---------- */
  function home() {
    Promise.all([S.db.from('innovation_challenges').select('*').eq('published', true).order('created_at', { ascending: false }).limit(60),
      S.db.from('innovation_projects').select('id,title,stage,status,owner_id,team,class_id,challenge_key,challenge_id,updated_at').neq('status', 'archived').order('updated_at', { ascending: false }).limit(300),
      ST.staff ? S.db.from('classes').select('id,name,owner_kind,archived_at').eq('teacher_id', ST.me.user.id).is('deleted_at', null).order('name') : Promise.resolve({ data: [] })]).then(function (x) {
      ST.teach = x[2].data || [];
      if (x[1].error && /innovation_|schema cache|PGRST205/.test(x[1].error.message || '')) { app.innerHTML = hero('Innovation Studio', 'Design real solutions to real problems.') + '<p class="in-tip">The Innovation Studio is being set up. Please check back soon.</p>'; return; }
      var CH = x[0].data || [], P = x[1].data || [], me = ST.me.user.id, mine = P.filter(function (p) { return p.owner_id === me || (p.team || []).indexOf(me) >= 0; }), others = P.filter(function (p) { return mine.indexOf(p) < 0; });
      var chal = function (c, custom) { return '<div class="in-ch"><span class="ic" aria-hidden="true">' + (custom ? '🎯' : c[1]) + '</span><b>' + E(custom ? c.title : c[2]) + '</b><span>' + E(custom ? c.brief : c[3]) + '</span><small>' + E(custom ? [c.context, c.subject, c.due_on && 'due ' + c.due_on].filter(Boolean).join(' · ') : c[4] + ' · ' + c[5]) + '</small>' +
        (custom && c.constraints ? '<small><b>Constraints:</b> ' + E(c.constraints) + '</small>' : '') + '<button class="btn sm main" data-start="' + (custom ? 'c:' + c.id : 's:' + c[0]) + '">Start this challenge</button></div>'; };
      app.innerHTML = '<div>' + hero('🚀 Innovation Studio', 'Pick a real-world problem and solve it like a scientist and engineer: inquire, develop ideas, build a prototype, test it and improve it. Work alone or with classmates; your teacher can follow your progress and give feedback.') +
        '<p id="in-msg" role="status" class="in-muted" style="min-height:1.2em"></p>' +
        (mine.length ? '<section class="in-card"><h3>My design projects</h3><ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px">' + mine.map(function (p) { var st = STAGES.filter(function (s) { return s[0] === p.stage; })[0] || STAGES[0];
          return '<li class="in-ch" style="border-color:#E9D5FF"><b>' + E(p.title) + '</b><span><span class="in-chip">' + st[1] + ' ' + E(st[2]) + '</span><span class="in-chip">' + E(p.status) + '</span>' + ((p.team || []).length ? '<span class="in-chip">team of ' + (p.team.length + 1) + '</span>' : '') + '</span><button class="btn sm main" data-open="' + p.id + '">Open</button></li>'; }).join('') + '</ul></section>' : '') +
        (ST.staff ? '<section class="in-card"><h3>Projects in your classes (' + others.length + ')</h3>' + (others.length ? '<div style="overflow-x:auto"><table class="in-tbl"><tr><th>Project</th><th>Stage</th><th>Status</th><th>Updated</th><th></th></tr>' + others.map(function (p) { var st = STAGES.filter(function (s) { return s[0] === p.stage; })[0] || STAGES[0];
            return '<tr><td>' + E(p.title) + ' <small class="in-muted" data-nm="' + p.id + '"></small></td><td>' + st[1] + ' ' + E(st[2]) + '</td><td>' + (p.status === 'submitted' ? '<b style="color:#B45309">submitted</b>' : E(p.status)) + '</td><td>' + new Date(p.updated_at).toLocaleDateString() + '</td><td><button class="btn sm" data-open="' + p.id + '">Open</button></td></tr>'; }).join('') + '</table></div>' : '<p class="in-muted">No student projects yet.</p>') + '</section>' +
          '<section class="in-card"><h3>Set a challenge</h3><div class="in-g" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"><label class="in-f"><span>Title</span><input id="nc-t" maxlength="160"></label><label class="in-f"><span>Context</span><input id="nc-x" placeholder="e.g. SDG 6 or a global context"></label><label class="in-f"><span>Subject</span><input id="nc-s"></label>' +
          '<label class="in-f"><span>Class</span><select id="nc-c"><option value="">Everyone on the site</option>' + classOpts(ST.teach || [], '') + '</select></label><label class="in-f"><span>Due</span><input type="date" id="nc-d"></label></div>' +
          '<label class="in-f"><span>The problem (brief)</span><textarea id="nc-b" rows="3"></textarea></label><label class="in-f"><span>Constraints</span><input id="nc-k" placeholder="e.g. materials under 500 KES, must work without electricity"></label><button class="btn main sm" id="nc-go">Publish challenge</button></section>' : '') +
        (CH.length ? '<section class="in-card"><h3>Challenges from your teachers</h3><div class="in-g">' + CH.map(function (c) { return chal(c, true); }).join('') + '</div></section>' : '') +
        '<section class="in-card"><h3>Starter challenges</h3><div class="in-g">' + STARTERS.map(function (c) { return chal(c); }).join('') + '</div><div class="in-row" style="margin-top:10px"><button class="btn sm" data-start="own">✏️ Start my own design challenge</button></div></section></div>';
      [].forEach.call(app.querySelectorAll('[data-open]'), function (b) { b.onclick = function () { openP(b.getAttribute('data-open')); }; });
      [].forEach.call(app.querySelectorAll('[data-start]'), function (b) { b.onclick = function () { start(b.getAttribute('data-start'), CH); }; });
      var ncg = document.getElementById('nc-go'); if (ncg) ncg.onclick = function () { var g = function (i) { return document.getElementById(i).value.trim(); }; if (!g('nc-t') || !g('nc-b')) { msg('Give the challenge a title and a brief.', true); return; }
        S.db.from('innovation_challenges').insert({ title: g('nc-t'), brief: g('nc-b'), context: g('nc-x') || null, subject: g('nc-s') || null, constraints: g('nc-k') || null, class_id: g('nc-c') || null, due_on: g('nc-d') || null }).then(function (r) { if (ok(r, 'Challenge published')) home(); }); };
      if (others.length) S.db.rpc('innov_names', { pids: others.map(function (p) { return p.id; }) }).then(function (r) { (r.data || []).forEach(function (n) { var el = app.querySelector('[data-nm="' + n.project_id + '"]'); if (el) el.textContent = '· ' + [n.owner_name].concat(n.team_names || []).filter(Boolean).join(', '); }); });
    });
  }
  function start(src, CH) {
    var row = { title: 'My design project', data: {} }, cls = (ST.me.classes || [])[0];
    if (src.indexOf('s:') === 0) { var s = STARTERS.filter(function (c) { return c[0] === src.slice(2); })[0]; row.title = s[2]; row.challenge_key = s[0]; row.data.problem = s[3]; }
    else if (src.indexOf('c:') === 0) { var c = CH.filter(function (x) { return x.id === src.slice(2); })[0]; row.title = c.title; row.challenge_id = c.id; row.class_id = c.class_id || null; row.data.problem = c.brief; row.data.constraints = c.constraints || ''; }
    if (!row.class_id && cls) row.class_id = cls.id || cls.class_id;
    S.db.from('innovation_projects').insert(row).select('id').single().then(function (r) { if (ok(r)) openP(r.data.id); });
  }

  /* ---------- a project ---------- */
  function openP(id, tab) {
    Promise.all([S.db.from('innovation_projects').select('*').eq('id', id).maybeSingle(), S.db.rpc('innov_names', { pids: [id] }), S.db.from('innovation_feedback').select('*').eq('project_id', id).order('created_at', { ascending: false })]).then(function (x) {
      var p = x[0].data; if (!p) { msg('Could not open the project.', true); return; }
      ST.p = p; p.data = p.data || {}; ST.names = (x[1].data || [])[0] || {}; ST.fb = x[2].data || []; var me = ST.me.user.id;
      ST.ro = !(p.owner_id === me || (p.team || []).indexOf(me) >= 0); ST.tab = tab || (ST.ro ? 'inquire' : p.stage) || 'inquire';
      var who = [ST.names.owner_name].concat(ST.names.team_names || []).filter(Boolean).join(', ');
      app.innerHTML = hero(p.title, (who ? who + ' · ' : '') + (ST.ro ? 'You are viewing this project as a teacher.' : 'Work through each stage; it saves as you go.')) +
        '<nav class="in-tabs" role="tablist"><button id="in-back">← All projects</button>' + STAGES.map(function (s) { var n = ST.fb.filter(function (f) { return f.stage === s[0] && !f.resolved; }).length;
          return '<button role="tab" data-tab="' + s[0] + '" aria-selected="' + (s[0] === ST.tab) + '">' + s[1] + ' ' + E(s[2]) + (s[3] ? ' (' + s[3] + ')' : '') + (n ? ' · ' + n + ' 💬' : '') + '</button>'; }).join('') + (ST.ro ? '' : '<button data-tab="team">👥 Team</button>') + '</nav>' +
        '<p id="in-msg" role="status" class="in-muted" style="min-height:1.2em"></p><div id="in-body"></div>';
      document.getElementById('in-back').onclick = home;
      [].forEach.call(app.querySelectorAll('[data-tab]'), function (b) { b.onclick = function () { openTab(b.getAttribute('data-tab')); }; });
      openTab(ST.tab);
    });
  }
  function openTab(t) {
    ST.tab = t; [].forEach.call(app.querySelectorAll('[data-tab]'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === t)); });
    if (!ST.ro && t !== 'team' && ST.p.stage !== t && STAGES.map(function (s) { return s[0]; }).indexOf(t) > STAGES.map(function (s) { return s[0]; }).indexOf(ST.p.stage)) { ST.p.stage = t; save(); }
    var body = document.getElementById('in-body');
    body.innerHTML = (t === 'team' ? '' : fbBlock(t)) + ({ inquire: inquire, ideas: ideas, create: create, evaluate: evaluate, share: share, team: team })[t]();
    wire(body);
    if (t === 'team') teamWire(body);
  }
  function fbBlock(stage) {
    var F = ST.fb.filter(function (f) { return f.stage === stage; });
    return (F.length ? '<section class="in-card"><h3>💬 Feedback on this stage</h3>' + F.map(function (f) { return '<div class="in-fb" style="' + (f.resolved ? 'opacity:.6' : '') + '">' + E(f.comment) + '<br><small class="in-muted">' + new Date(f.created_at).toLocaleDateString() + (f.resolved ? ' · done' : '') + '</small>' + (!ST.ro && !f.resolved ? ' <button class="btn sm" data-fbdone="' + f.id + '">✓ Done</button>' : '') + '</div>'; }).join('') + '</section>' : '') +
      (ST.ro ? '<section class="in-card"><h3>Give feedback on this stage</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="fb-new" style="flex:1;min-width:240px;padding:8px;border-radius:10px;border:1px solid #cbd5e1" placeholder="What is strong, and what should they improve?"><button class="btn sm main" id="fb-send" data-stage="' + stage + '">Send</button></div>' +
        (ST.p.status === 'submitted' ? '<p style="margin-top:10px"><button class="btn sm" id="in-reviewed">✓ Mark the project reviewed</button> <button class="btn sm" id="in-return">↩ Return for more work</button></p>' : '') + '</section>' : '');
  }

  /* field helpers: every input carries data-k (a path in project.data) */
  function D() { return ST.p.data; }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, D()); }
  function set(path, v) { var ks = path.split('.'), o = D(); for (var i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = v; }
  var dis = function () { return ST.ro ? ' disabled' : ''; };
  function fld(k, label, hint, rows) { var v = get(k) || ''; return '<label class="in-f"><span>' + E(label) + '</span>' + (rows ? '<textarea data-k="' + k + '" rows="' + rows + '"' + dis() + '>' + E(v) + '</textarea>' : '<input data-k="' + k + '" value="' + E(v) + '"' + dis() + '>') + (hint ? '<small>' + hint + '</small>' : '') + '</label>'; }
  function list(k, fields, addLabel) {   // fields: [key, label, kind ('t' text, 'a' area, 'img' picture, 'sel:a|b|c')]
    var arr = get(k) || [];
    return '<div class="in-l" data-list="' + k + '">' + arr.map(function (it, i) { return '<div class="row" style="grid-template-columns:' + fields.map(function (f) { return f[2] === 'a' ? '2fr' : f[2] === 'img' ? 'auto' : '1fr'; }).join(' ') + (ST.ro ? '' : ' auto') + '">' +
      fields.map(function (f) { var p = k + '.' + i + '.' + f[0], v = it[f[0]] || '';
        if (f[2] === 'img') return '<div>' + (v ? '<img class="in-thumb" data-img="' + E(v) + '" alt="' + E(f[1]) + '">' : '') + (ST.ro ? '' : '<label class="in-muted">' + E(f[1]) + ' <input type="file" accept="image/*" data-up="' + p + '"></label>') + '</div>';
        if (f[2] && f[2].indexOf('sel:') === 0) return '<label class="in-f"><span>' + E(f[1]) + '</span><select data-k="' + p + '"' + dis() + '><option value=""></option>' + f[2].slice(4).split('|').map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + E(o) + '</option>'; }).join('') + '</select></label>';
        return '<label class="in-f"><span>' + E(f[1]) + '</span>' + (f[2] === 'a' ? '<textarea rows="2" data-k="' + p + '"' + dis() + '>' + E(v) + '</textarea>' : '<input data-k="' + p + '" value="' + E(v) + '"' + dis() + '>') + '</label>'; }).join('') +
      (ST.ro ? '' : '<button class="btn sm" data-del="' + k + '" data-i="' + i + '" aria-label="Remove">✕</button>') + '</div>'; }).join('') +
      (ST.ro ? (arr.length ? '' : '<p class="in-muted">Nothing yet.</p>') : '<button class="btn sm" data-add="' + k + '">➕ ' + E(addLabel) + '</button>') + '</div>';
  }

  function inquire() {
    return '<section class="in-card"><h3>The problem</h3>' + fld('problem', 'What is the problem?', 'Describe it in your own words. Who has it, where and how often?', 3) + fld('users', 'Who is it for? (target audience, client)', '', 2) + fld('why', 'Why does it matter?', 'Its impact on people, health or the environment. Use evidence from your research.', 3) + (get('constraints') ? '<p class="in-tip"><b>Constraints from your teacher:</b> ' + E(get('constraints')) + '</p>' : '') + '</section>' +
      '<section class="in-card"><h3>Research</h3><p class="in-muted">What do you need to know? Record what you found and where.</p>' + list('research', [['q', 'Question', 't'], ['found', 'What I found', 'a'], ['src', 'Source', 't']], 'Add research') + '</section>' +
      '<section class="in-card"><h3>Existing solutions</h3><p class="in-muted">Analyse products or methods that already exist.</p>' + list('existing', [['name', 'Product or method', 't'], ['good', 'Strengths', 'a'], ['bad', 'Weaknesses', 'a']], 'Add a solution') + '</section>' +
      '<section class="in-card"><h3>Design brief and specification</h3>' + fld('brief', 'Design brief', 'One paragraph: what you will design, for whom, and why.', 3) +
      '<p class="in-muted" style="margin:8px 0 4px">Specification: what your solution must do, each with a way to test it.</p>' + list('spec', [['req', 'Requirement', 't'], ['test', 'How I will test it', 't']], 'Add a requirement') + specTip() + '</section>';
  }
  function specTip() { var s = get('spec') || [], vague = s.filter(function (x) { return /\b(good|nice|better|easy|cheap|strong)\b/i.test(x.req || '') && !/\d/.test(x.req || ''); }); return s.length && (s.length < 4 || vague.length) ? '<p class="in-tip">💡 ' + (s.length < 4 ? 'Most specifications have at least 4–6 requirements (function, user, materials, cost, size, safety, environment). ' : '') + (vague.length ? 'Make vague requirements measurable: “costs less than 300 KES” instead of “cheap”.' : '') + '</p>' : ''; }
  function ideas() {
    var I = get('ideas') || [], SP = get('spec') || [], sc = get('scores') || {};
    var tot = function (i) { return SP.reduce(function (n, s, j) { return n + (+((sc[i] || {})[j]) || 0); }, 0); };
    return '<section class="in-card"><h3>Your ideas</h3><p class="in-muted">Sketch at least three different ideas. Photograph your sketches or draw them on paper and upload.</p>' + list('ideas', [['t', 'Idea', 't'], ['d', 'How it works', 'a'], ['img', 'Sketch', 'img']], 'Add an idea') + '</section>' +
      '<section class="in-card"><h3>Compare ideas against your specification</h3>' + (I.length && SP.length ? '<div style="overflow-x:auto"><table class="in-tbl"><tr><th>Requirement</th>' + I.map(function (it, i) { return '<th>' + E(it.t || 'Idea ' + (i + 1)) + '</th>'; }).join('') + '</tr>' +
        SP.map(function (s, j) { return '<tr><td>' + E(s.req) + '</td>' + I.map(function (it, i) { var v = (sc[i] || {})[j] || ''; return '<td><select data-score="' + i + '.' + j + '"' + dis() + '><option value=""></option><option' + (v == 1 ? ' selected' : '') + '>1</option><option' + (v == 2 ? ' selected' : '') + '>2</option><option' + (v == 3 ? ' selected' : '') + '>3</option></select></td>'; }).join('') + '</tr>'; }).join('') +
        '<tr><th>Total</th>' + I.map(function (it, i) { return '<th>' + tot(i) + ' / ' + SP.length * 3 + '</th>'; }).join('') + '</tr></table></div><p class="in-muted">1 = does not meet it, 2 = partly, 3 = fully.</p>' : '<p class="in-muted">Add your specification (Inquire) and at least two ideas to compare them.</p>') +
      '<label class="in-f"><span>Chosen design</span><select data-k="chosen"' + dis() + '><option value=""></option>' + I.map(function (it, i) { return '<option value="' + i + '"' + (String(get('chosen')) === String(i) ? ' selected' : '') + '>' + E(it.t || 'Idea ' + (i + 1)) + '</option>'; }).join('') + '</select></label>' +
      fld('justify', 'Why this design?', 'Refer to the specification and your comparison table.', 3) + fld('plan_drawing', 'Planning details', 'Dimensions, materials, parts list and costs. Upload a labelled drawing in Create if you have one.', 3) + '</section>';
  }
  function create() {
    return '<section class="in-card"><h3>Plan the making</h3><p class="in-muted">The steps, in order, with the time and resources each needs.</p>' + list('steps', [['t', 'Step', 't'], ['time', 'Time', 't'], ['status', 'Status', 'sel:to do|doing|done']], 'Add a step') + '</section>' +
      '<section class="in-card"><h3>Build log</h3><p class="in-muted">Each time you work on the prototype: what you did, problems, and any change from your plan (and why). Add a photo.</p>' + list('log', [['date', 'Date', 't'], ['did', 'What I did', 'a'], ['change', 'Changes and why', 'a'], ['img', 'Photo', 'img']], 'Add a log entry') + '</section>' +
      '<section class="in-card">' + fld('materials', 'Materials and cost', 'What you used and what it cost.', 3) + '</section>';
  }
  function evaluate() {
    var SP = get('spec') || [], T = get('tests') || [];
    if (!ST.ro && SP.length && T.length < SP.length) { for (var i = T.length; i < SP.length; i++) T.push({ req: SP[i].req, method: SP[i].test }); set('tests', T); save(); }
    var met = T.filter(function (t) { return t.met === 'met'; }).length;
    return '<section class="in-card"><h3>Test against your specification</h3>' + list('tests', [['req', 'Requirement', 't'], ['method', 'Test', 't'], ['result', 'Result (with data)', 'a'], ['met', 'Met?', 'sel:met|partly|not met']], 'Add a test') +
      (T.length ? '<p class="in-muted">' + met + ' of ' + T.length + ' requirements fully met.</p>' : '') + '</section>' +
      '<section class="in-card">' + fld('userfb', 'Feedback from users', 'Who tried it, what they said, and any survey results.', 3) + fld('evaluation', 'How successful is your solution?', 'Use your test results and user feedback.', 4) +
      fld('improve', 'How could it be improved?', 'Specific changes, linked to what did not work.', 3) + fld('impact', 'Impact', 'How does your solution affect the target audience, and the environment?', 3) + '</section>';
  }
  function share() {
    var done = [['problem', 'Problem described'], ['brief', 'Design brief'], ['spec', 'Specification'], ['ideas', 'Ideas'], ['justify', 'Chosen design justified'], ['log', 'Build log'], ['tests', 'Tests'], ['evaluation', 'Evaluation']].map(function (c) { var v = get(c[0]); return [c[1], Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim())]; });
    return '<section class="in-card"><h3>Your pitch</h3>' + fld('pitch', 'In 100 words: the problem, your solution and its impact', 'For the exhibition, a poster or a presentation.', 4) +
      '<p><a class="btn sm" href="/poster/">🖼️ Make a poster</a> <a class="btn sm" href="/tutor/?mode=guide&topic=' + encodeURIComponent('Design project: ' + ST.p.title) + '">🤖 Talk it through with the AI tutor</a></p></section>' +
      '<section class="in-card"><h3>Checklist</h3><ul style="list-style:none;padding:0">' + done.map(function (c) { return '<li>' + (c[1] ? '✅' : '⬜') + ' ' + E(c[0]) + '</li>'; }).join('') + '</ul>' +
      (ST.ro ? '' : ST.p.status === 'submitted' ? '<p class="in-tip">Submitted. Your teacher will review it.</p>' : ST.p.status === 'reviewed' ? '<p class="in-tip">✓ Reviewed by your teacher.</p>' : '<button class="btn main sm" id="in-submit">📤 Submit for review</button>') + '</section>';
  }
  function team() {
    return '<section class="in-card"><h3>Project title</h3><label class="in-f"><span>Title</span><input id="tm-title" maxlength="160" value="' + E(ST.p.title) + '"></label></section>' +
      '<section class="in-card"><h3>Team</h3><p>' + E([ST.names.owner_name].concat(ST.names.team_names || []).filter(Boolean).join(', ') || 'Just you') + '</p>' + (ST.p.owner_id === ST.me.user.id ? (ST.p.class_id ? '<div id="tm-pick" class="in-muted">Loading classmates…</div>' : '<p class="in-muted">Join a class to add classmates to your team.</p>') : '<p class="in-muted">Only the person who started the project can change the team.</p>') + '</section>' +
      (ST.p.owner_id === ST.me.user.id ? '<section class="in-card"><button class="btn sm" id="tm-arch">Archive this project</button></section>' : '');
  }
  function teamWire(body) {
    var t = body.querySelector('#tm-title'); if (t) t.oninput = function () { ST.p.title = t.value.trim() || 'My design project'; save(); };
    var a = body.querySelector('#tm-arch'); if (a) a.onclick = function () { if (confirm('Archive this project? It will no longer appear in your list.')) S.db.from('innovation_projects').update({ status: 'archived' }).eq('id', ST.p.id).then(function (r) { if (ok(r)) home(); }); };
    var pk = body.querySelector('#tm-pick'); if (!pk) return;
    S.db.rpc('innov_classmates', { cid: ST.p.class_id }).then(function (r) { var C = r.data || [];
      pk.innerHTML = C.length ? C.map(function (c) { return '<label style="display:block"><input type="checkbox" data-mate="' + c.id + '"' + ((ST.p.team || []).indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + E(c.full_name || 'Classmate') + '</label>'; }).join('') + '<button class="btn sm main" id="tm-save" style="margin-top:8px">Save team</button>' : 'No classmates found in your class.';
      var sv = pk.querySelector('#tm-save'); if (sv) sv.onclick = function () { var ids = [].filter.call(pk.querySelectorAll('[data-mate]'), function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-mate'); }).slice(0, 5);
        S.db.from('innovation_projects').update({ team: ids }).eq('id', ST.p.id).then(function (x) { if (ok(x, 'Team saved')) openP(ST.p.id, 'team'); }); }; });
  }

  function wire(body) {
    [].forEach.call(body.querySelectorAll('[data-k]'), function (i) { i.oninput = i.onchange = function () { set(i.getAttribute('data-k'), i.value); save(); }; });
    [].forEach.call(body.querySelectorAll('[data-add]'), function (b) { b.onclick = function () { var k = b.getAttribute('data-add'), a = get(k) || []; a.push({}); set(k, a); openTab(ST.tab); }; });
    [].forEach.call(body.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { var k = b.getAttribute('data-del'), a = get(k) || []; a.splice(+b.getAttribute('data-i'), 1); set(k, a); save(); openTab(ST.tab); }; });
    [].forEach.call(body.querySelectorAll('[data-score]'), function (s) { s.onchange = function () { var ij = s.getAttribute('data-score').split('.'), sc = get('scores') || {}; sc[ij[0]] = sc[ij[0]] || {}; sc[ij[0]][ij[1]] = s.value; set('scores', sc); save(); openTab('ideas'); }; });
    [].forEach.call(body.querySelectorAll('[data-up]'), function (inp) { inp.onchange = function () { var f = inp.files[0]; if (!f) return; if (f.size > 25 * 1024 * 1024) { msg('That image is over 25 MB.', true); return; }
      var path = ST.p.id + '/' + Date.now() + '-' + f.name.replace(/[^\w.\-]+/g, '_'); msg('Uploading…');
      S.db.storage.from('innovation-files').upload(path, f, { contentType: f.type }).then(function (u) { if (u.error) { msg(S.nice(u.error), true); return; } set(inp.getAttribute('data-up'), path); save(true); openTab(ST.tab); }); }; });
    [].forEach.call(body.querySelectorAll('img[data-img]'), function (im) { S.db.storage.from('innovation-files').createSignedUrl(im.getAttribute('data-img'), 3600).then(function (s) { if (!s.error) im.src = s.data.signedUrl; }); });
    [].forEach.call(body.querySelectorAll('[data-fbdone]'), function (b) { b.onclick = function () { S.db.from('innovation_feedback').update({ resolved: true }).eq('id', b.getAttribute('data-fbdone')).then(function (r) { if (ok(r, 'Marked as done')) openP(ST.p.id, ST.tab); }); }; });
    var fs = body.querySelector('#fb-send'); if (fs) fs.onclick = function () { var t = body.querySelector('#fb-new').value.trim(); if (!t) return; S.db.from('innovation_feedback').insert({ project_id: ST.p.id, stage: fs.getAttribute('data-stage'), comment: t }).then(function (r) { if (ok(r, 'Feedback sent')) openP(ST.p.id, ST.tab); }); };
    var rv = body.querySelector('#in-reviewed'); if (rv) rv.onclick = function () { S.db.from('innovation_projects').update({ status: 'reviewed' }).eq('id', ST.p.id).then(function (r) { if (ok(r, 'Marked reviewed')) openP(ST.p.id, ST.tab); }); };
    var rt = body.querySelector('#in-return'); if (rt) rt.onclick = function () { S.db.from('innovation_projects').update({ status: 'active' }).eq('id', ST.p.id).then(function (r) { if (ok(r, 'Returned to the student')) openP(ST.p.id, ST.tab); }); };
    var sb = body.querySelector('#in-submit'); if (sb) sb.onclick = function () { save(true); S.db.from('innovation_projects').update({ status: 'submitted' }).eq('id', ST.p.id).then(function (r) { if (ok(r, 'Submitted for review')) { ST.p.status = 'submitted'; openTab('share'); } }); };
  }
})();
