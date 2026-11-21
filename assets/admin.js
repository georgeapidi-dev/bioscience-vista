/* BioscienceVista · admin: join requests, members and free access, teacher approvals, payments (PayPal and M-Pesa), prices and settings. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), TAB = (location.hash.slice(1) || 'approvals');
  S.guard(app, { staff: true }).then(function (me) {
    window.BVS_ME = me.user.id;
    if (!me.admin) { app.innerHTML = '<section class="panel"><h2>Admin only</h2><p><a href="/staff/">Back to the teacher dashboard</a></p></section>'; return; }
    draw();
  }).catch(function () {});
  if (TAB === 'requests' || TAB === 'teachers') TAB = 'approvals';
  var TABS = [['approvals', '✅ Approvals'], ['members', '👥 Members & access'], ['payments', '💳 Payments'], ['settings', '⚙️ Prices & settings'], ['codes', '🎟 Website codes'], ['schools', '🏫 Schools'], ['reviews', '⭐ Reviews'], ['admins', '🔑 Admins']];
  function draw() {
    app.innerHTML = '<div class="row2 cband" style="--k:#7c3aed"><div><p class="label">Admin</p><h2 style="margin:0">BioscienceVista admin</h2><p class="small">Approvals, members, teachers, payments and settings</p></div><div class="cta"><a class="btn sm" href="/staff/">🌐 Main site</a><a class="btn sm" href="/teach/">🏫 My classes</a></div></div>' +
      '<div class="cta" role="tablist">' + TABS.map(function (t) { return '<button type="button" class="btn sm' + (TAB === t[0] ? ' main' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="ais" class="small" style="margin:10px 0;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:#f8fafc"></div><div id="ems" class="small" style="margin:10px 0;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:#f8fafc"></div><section class="panel grp" id="tab"><p class="muted small">Loading…</p></section>';
    aiStatus(false); mailStatus(null);
    app.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { TAB = b.getAttribute('data-t'); history.replaceState(null, '', '#' + TAB); draw(); }; });
    ({ approvals: approvals, members: members, payments: payments, settings: settings, codes: codes, schools: schools, reviews: reviews, admins: admins })[TAB](app.querySelector('#tab'));
  }
  /* Website codes (migrations 071–074), organised (George, 21 Nov 2026): students per class, teachers per school, independent learners,
     private teachers; one line per person: name, code, duration, status, Renew. Every code lasts 1 week, 1 month, 3, 6 or 12 months.
     Students and teachers sign in with their code + 4-digit PIN; parents type the child's code at /family/ for a read-only view. */
  var DUR = [[7, '1 week'], [30, '1 month'], [90, '3 months'], [180, '6 months'], [365, '12 months']];
  function durSel(id, pick, attr) { return '<select ' + (attr || '') + ' aria-label="How long the code lasts"' + (id ? ' id="' + id + '"' : '') + '>' + DUR.map(function (d) { return '<option value="' + d[0] + '"' + (d[0] === pick ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select>'; }
  function codes(box) {
    box.innerHTML = '<style>.wc-g>summary{cursor:pointer;font-weight:800;padding:8px 0;list-style:none}.wc-g>summary::-webkit-details-marker{display:none}.wc-g>summary:before{content:"▸ ";color:#7c3aed}.wc-g[open]>summary:before{content:"▾ "}.wc-sub{margin:0 0 6px 12px}' +
      '.wc-row{display:grid;grid-template-columns:minmax(140px,1.4fr) 120px 150px minmax(110px,1fr) auto;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9}.wc-row b.c{font-family:ui-monospace,monospace;letter-spacing:.08em}.wc-row select{font:inherit;padding:4px 6px;border-radius:8px;max-width:100%}' +
      '.wc-st{font-size:.82rem}.wc-st .pill{font-size:.78rem}.wc-h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}.wc-cnt{font-size:.82rem;color:#64748b;font-weight:600}' +
      '@media(max-width:760px){.wc-row{grid-template-columns:1fr auto;}.wc-row>.wc-st{grid-column:1/-1}.wc-row>.wc-d{grid-column:1}}</style>' +
      '<section class="panel tint grp"><h3 style="margin:0">🎟 Make new codes</h3><p class="small">One person per line with their two official names (first name, then family name), or a number of unnamed codes (the student types both names). New people create a 4-digit PIN the first time they use the code.</p>' +
        '<label class="f">Names (one per line)<textarea id="scn" rows="3" placeholder="Amani Otieno&#10;Brian Kip"></textarea></label>' +
        '<div class="row2" style="gap:8px;flex-wrap:wrap;justify-content:flex-start;align-items:flex-end"><label class="f" style="margin:0">or how many unnamed<input id="scq" type="number" min="1" max="300" style="width:90px"></label>' +
        '<label class="f" style="margin:0">Lasts ' + durSel('scd', 365) + '</label><label class="f" style="margin:0">Note (e.g. school)<input id="sco" maxlength="120" style="width:190px"></label>' +
        '<button type="button" class="btn main sm" id="scm">＋ Make codes</button></div><p class="msg" id="scmsg" role="status"></p></section>' +
      '<section class="panel grp"><div class="wc-h"><h3 style="margin:0">👥 Everyone and their codes</h3><span class="row2" style="gap:6px;flex-wrap:wrap">' +
        '<label class="small">Teachers\' joining codes last ' + durSel('jdays', 30) + '</label>' +
        '<button type="button" class="btn sm" id="scs">🎟 Codes for everyone without one</button></span></div>' +
        '<div class="row2" style="gap:8px;flex-wrap:wrap;justify-content:flex-start;margin:8px 0"><input id="scf" type="search" placeholder="🔎 Find a name, code, class or school" style="flex:1 1 220px;max-width:340px">' +
        '<select id="scw" aria-label="Show"><option value="all">Everyone</option><option value="none">No code yet</option><option value="soon">Expiring within 30 days</option><option value="exp">Expired</option><option value="unused">Not used yet</option></select>' +
        '<label class="small">New codes and renewals last ' + durSel('rdays', 365) + '</label></div><p class="msg" id="scsm" role="status"></p><div id="scl"><p class="small muted">Loading…</p></div></section>';
    var ROWS = [], open = {};
    S.db.from('code_settings').select('kind,days').then(function (r) { (r.data || []).forEach(function (x) { if (x.kind === 'join') box.querySelector('#jdays').value = String(x.days); }); });
    box.querySelector('#jdays').onchange = function () { var d = +this.value; S.db.rpc('set_code_days', { k: 'join', d: d }).then(function (r) { var m = box.querySelector('#scsm'); m.className = r.error ? 'msg' : 'msg ok'; m.textContent = r.error ? S.nice(r.error) : 'Teachers\' new joining codes now last ' + DUR.filter(function (x) { return x[0] === d; })[0][1] + '.'; }); };
    function load() {
      S.db.rpc('admin_people_codes').then(function (r) {
        var l = box.querySelector('#scl');
        if (r.error) { l.innerHTML = '<p class="msg">' + E(S.nice(r.error)) + '</p>'; return; }
        ROWS = r.data || []; draw();
      });
    }
    function fmt(c) { return c ? c.slice(0, 4) + '-' + c.slice(4) : ''; }
    function state(x) { var now = Date.now(); if (!x.code) return 'none'; if (x.expires_at && new Date(x.expires_at) < now) return 'exp'; if (!x.used_at) return 'unused'; return 'ok'; }
    function left(x) { if (!x.expires_at) return 'no expiry'; var d = Math.ceil((new Date(x.expires_at) - Date.now()) / 864e5); return d < 0 ? 'expired ' + new Date(x.expires_at).toLocaleDateString() : 'until ' + new Date(x.expires_at).toLocaleDateString() + (d <= 30 ? ' (' + d + ' day' + (d === 1 ? '' : 's') + ')' : ''); }
    function nearest(x) { if (!x.expires_at || !x.created_at) return 365; var d = Math.round((new Date(x.expires_at) - new Date(x.created_at)) / 864e5); var best = 365; DUR.forEach(function (o) { if (Math.abs(o[0] - d) < Math.abs(best - d)) best = o[0]; }); return best; }
    function row(x) {
      var st = state(x), key = (x.person || '') + '|' + (x.code || '');
      var status = st === 'none' ? '<span class="pill t">no code yet</span>' : st === 'exp' ? '<span class="pill" style="background:#fee2e2;color:#991b1b">expired</span>' : st === 'unused' ? '<span class="pill t">not used yet</span>' : '<span class="pill ok">✓ in use</span>';
      var act = !x.person ? '<button type="button" class="btn sm" data-del="' + E(x.code) + '" title="Delete this unused code">🗑</button>'
        : st === 'none' ? '<button type="button" class="btn main sm" data-make="' + E(x.person) + '">＋ Make code</button>'
        : '<button type="button" class="btn sm" data-renew="' + E(x.code) + '" title="A new code for the same person; the old one stops now. Their place, classes and results stay.">↻ Renew</button>';
      return '<div class="wc-row" data-key="' + E(key) + '"><div><b>' + E(x.name || 'Unnamed code') + '</b>' + (x.role === 'teacher' && x.grp_type === 'unassigned' ? ' <span class="small muted">teacher</span>' : '') + '</div>' +
        '<div>' + (x.code ? '<b class="c">' + E(fmt(x.code)) + '</b>' : '<span class="small muted">—</span>') + '</div>' +
        '<div class="wc-d">' + (x.code && st !== 'exp' ? durSel('', nearest(x), 'data-dur="' + E(x.code) + '"') : '') + '</div>' +
        '<div class="wc-st">' + status + ' <span class="small muted">' + (x.code ? E(left(x)) : '') + '</span></div><div>' + act + '</div></div>';
    }
    function draw() {
      var q = (box.querySelector('#scf').value || '').trim().toLowerCase(), w = box.querySelector('#scw').value, now = Date.now();
      var keepIt = function (x) { var st = state(x);
        if (w === 'none' && st !== 'none') return false; if (w === 'exp' && st !== 'exp') return false; if (w === 'unused' && st !== 'unused') return false;
        if (w === 'soon' && !(x.expires_at && st !== 'exp' && new Date(x.expires_at) - now < 30 * 864e5)) return false;
        return !q || ((x.name || '') + ' ' + (x.code || '') + ' ' + (x.grp || '')).toLowerCase().indexOf(q) >= 0; };
      var SEC = [['class', '🏫 Students by class'], ['school', '🏛 Teachers by school'], ['indep', '🚀 Independent learners'], ['private', '🧑‍🏫 Private teachers'], ['unassigned', '🆕 New codes not used yet']];
      var html = SEC.map(function (s) {
        var rows = ROWS.filter(function (x) { return x.grp_type === s[0] && keepIt(x); }); if (!rows.length) return '';
        var groups = {}, order = []; rows.forEach(function (x) { var g = x.grp || '—'; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(x); });
        order.sort(function (a, b) { return a.localeCompare(b); });
        var many = order.length > 1 || s[0] === 'class' || s[0] === 'school';
        var body = order.map(function (g) { var list = groups[g].sort(function (a, b) { return String(a.name || '').localeCompare(String(b.name || '')); });
          var none = list.filter(function (x) { return !x.code; }).length, ex = list.filter(function (x) { return state(x) === 'exp'; }).length;
          var inner = list.map(row).join('');
          if (!many) return inner;
          var gk = s[0] + ':' + g;
          return '<details class="wc-g wc-sub" data-g="' + E(gk) + '"' + (open[gk] || q ? ' open' : '') + '><summary>' + E(g) + ' <span class="wc-cnt">' + list.length + (none ? ' · ' + none + ' without a code' : '') + (ex ? ' · ' + ex + ' expired' : '') + '</span> <button type="button" class="btn sm" data-print="' + E(gk) + '" style="margin-left:6px">🖨 Print</button></summary>' + inner + '</details>'; }).join('');
        return '<details class="wc-g" data-g="' + s[0] + '"' + (open[s[0]] !== false ? ' open' : '') + '><summary>' + s[1] + ' <span class="wc-cnt">' + rows.length + '</span>' + (many ? '' : ' <button type="button" class="btn sm" data-print="' + s[0] + ':' + E(order[0]) + '" style="margin-left:6px">🖨 Print</button>') + '</summary>' + body + '</details>';
      }).join('');
      box.querySelector('#scl').innerHTML = html || '<p class="small muted">Nobody matches.</p>';
      box.querySelectorAll('details.wc-g').forEach(function (d) { d.ontoggle = function () { open[d.getAttribute('data-g')] = d.open; }; });
      var rd = function () { return +box.querySelector('#rdays').value; }, msg = function (t, ok) { var m = box.querySelector('#scsm'); m.className = ok ? 'msg ok' : 'msg'; m.textContent = t; };
      box.querySelectorAll('[data-dur]').forEach(function (s2) { s2.onchange = function () { var c = s2.getAttribute('data-dur'), d = +s2.value;
        S.db.rpc('set_code_expiry', { c: c, days: d }).then(function (r) { if (r.error) return msg(S.nice(r.error)); ROWS.forEach(function (x) { if (x.code === c) { x.expires_at = r.data; x.created_at = new Date().toISOString(); } }); msg('Code ' + fmt(c) + ' now lasts ' + DUR.filter(function (o) { return o[0] === d; })[0][1] + ' from today.', true); draw(); }); }; });
      box.querySelectorAll('[data-renew]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); if (b.disabled) return; b.disabled = true;
        S.db.rpc('renew_code', { old: b.getAttribute('data-renew'), days: rd() }).then(function (r) { b.disabled = false; if (r.error) return msg(S.nice(r.error)); msg('New code ' + fmt(r.data.code) + ' for ' + (r.data.full_name || 'them') + '. The old code has stopped; their place, classes and results are kept.', true); load(); }); }; });
      box.querySelectorAll('[data-make]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); if (b.disabled) return; b.disabled = true;
        S.db.rpc('make_person_code', { pid: b.getAttribute('data-make'), days: rd() }).then(function (r) { b.disabled = false; if (r.error) return msg(S.nice(r.error)); msg('Code ' + fmt(r.data.code) + ' made for ' + (r.data.full_name || 'them') + '.', true); load(); }); }; });
      box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); if (b.disabled) return; b.disabled = true;
        S.db.from('site_invites').delete().eq('code', b.getAttribute('data-del')).is('used_by', null).then(function (r) { b.disabled = false; if (r.error) return msg(S.nice(r.error)); load(); }); }; });
      box.querySelectorAll('[data-print]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation();
        var gk = b.getAttribute('data-print'), i = gk.indexOf(':'), t = gk.slice(0, i), g = gk.slice(i + 1);
        var list = ROWS.filter(function (x) { return x.grp_type === t && (x.grp || '—') === g && x.code && state(x) !== 'exp'; });
        if (!list.length) { msg('No codes to print in ' + g + '. Make them first.'); return; }
        var w = window.open('', '_blank'); if (!w) { msg('Allow pop-ups to print the codes.'); return; }
        w.document.write('<!doctype html><meta charset="utf-8"><title>Codes · ' + E(g) + '</title><style>body{font-family:system-ui,sans-serif;margin:16px}.g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.k{border:2px dashed #94a3b8;border-radius:12px;padding:12px;break-inside:avoid}.k b{display:block;font:800 1.6rem ui-monospace,monospace;letter-spacing:.18em;margin:6px 0}small{color:#475569}</style>' +
          '<h3 style="margin:0 0 10px">' + E(g) + '</h3><div class="g">' + list.map(function (x) { var tch = x.role === 'teacher';
            return '<div class="k"><small>BioscienceVista · ' + (tch ? 'your teacher code' : 'your website code') + '</small><div><b style="font:700 1rem system-ui;letter-spacing:0;display:inline">' + E(x.name || '') + '</b></div><b>' + E(fmt(x.code)) + '</b><small>Go to ' + E(location.host) + '/join and type this code. The first time, create your 4-digit PIN; after that this code and your PIN sign you in' + (x.expires_at ? ' until ' + new Date(x.expires_at).toLocaleDateString() : '') + '.' + (tch ? '' : ' Parents: see progress at ' + E(location.host) + '/family with this code.') + '</small></div>'; }).join('') + '</div><script>print()<\/script>');
        w.document.close(); }; });
    }
    box.querySelector('#scf').oninput = draw; box.querySelector('#scw').onchange = draw;
    box.querySelector('#scs').onclick = function () { var b = this, m = box.querySelector('#scsm'); if (b.disabled) return;
      var none = ROWS.filter(function (x) { return x.person && !x.code; }), seen = {}, ids = []; none.forEach(function (x) { if (!seen[x.person]) { seen[x.person] = 1; ids.push(x.person); } });
      if (!ids.length) { m.className = 'msg ok'; m.textContent = 'Everyone already has a code.'; return; }
      b.disabled = true; m.className = 'msg'; m.textContent = 'Making ' + ids.length + ' codes…'; var d = +box.querySelector('#rdays').value, done = 0, bad = 0;
      ids.reduce(function (p, id) { return p.then(function () { return S.db.rpc('make_person_code', { pid: id, days: d }).then(function (r) { if (r.error) bad++; else done++; }); }); }, Promise.resolve()).then(function () {
        b.disabled = false; m.className = bad ? 'msg' : 'msg ok'; m.textContent = done + ' code' + (done === 1 ? '' : 's') + ' made' + (bad ? ', ' + bad + ' could not be made' : '') + '. Print them by class or school.'; load(); }); };
    box.querySelector('#scm').onclick = function () { var b = this, m = box.querySelector('#scmsg'); if (b.disabled) return;
      var names = box.querySelector('#scn').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean), q = +box.querySelector('#scq').value || 0;
      if (!names.length && q > 0) for (var i = 0; i < Math.min(q, 300); i++) names.push('');
      var bad = names.filter(function (x) { return x && x.split(/\s+/).length < 2; });
      if (!names.length) { m.className = 'msg'; m.textContent = 'Type the names, one per line, or a number of unnamed codes.'; return; }
      if (bad.length) { m.className = 'msg'; m.textContent = 'Give each person two official names (first and family name): ' + bad.slice(0, 5).join(', '); return; }
      b.disabled = true; m.className = 'msg'; m.textContent = 'Making codes…';
      S.db.rpc('make_site_codes', { names: names, note: box.querySelector('#sco').value.trim() || null, days: +box.querySelector('#scd').value }).then(function (r) { b.disabled = false;
        if (r.error) { m.textContent = S.nice(r.error); return; }
        m.className = 'msg ok'; m.textContent = (r.data || []).length + ' code' + ((r.data || []).length === 1 ? '' : 's') + ' made: see "New codes not used yet" below to print them.';
        box.querySelector('#scn').value = ''; box.querySelector('#scq').value = ''; load(); }); };
    load();
  }
  // AI helper status: one tiny server-side check, remembered for this visit; "Check again" repeats it
  var AIS = null;
  function aiStatus(force) {
    var box = app.querySelector('#ais'); if (!box) return;
    var show = function (d) {
      var ok = d && d.ok, col = ok ? '#15803d' : (d && d.state === 'busy' ? '#b45309' : '#b91c1c'), bg = ok ? '#f0fdf4' : (d && d.state === 'busy' ? '#fffbeb' : '#fef2f2');
      box.style.background = bg; box.style.borderColor = col;
      box.innerHTML = '<b style="color:' + col + '">' + (ok ? '🟢 AI helper: working' : (d && d.state === 'busy' ? '🟠 AI helper: busy' : '🔴 AI helper: off')) + '</b> · ' + E(d && d.message || 'Could not check.') +
        (d && d.provider ? ' <span class="muted">Service: ' + E(d.provider) + (d.model ? ', model ' + E(d.model) : '') + '.</span>' : '') +
        (ok ? '' : ' <span class="muted">Marking by rules and by teachers still works.</span>') +
        (d && d.link === 'https://console.anthropic.com/settings/billing' && d.state === 'no_credit' ? ' <a href="' + d.link + '" target="_blank" rel="noopener">Open billing</a>' : '') +
        (d && d.link === 'https://console.groq.com/keys' && d.state === 'bad_key' ? ' <a href="' + d.link + '" target="_blank" rel="noopener">Open Groq keys</a>' : '') +
        ' <button type="button" class="btn sm" id="aisb" style="margin-left:6px">Check again</button>';
      box.querySelector('#aisb').onclick = function () { aiStatus(true); };
    };
    if (AIS && !force) return show(AIS);
    box.style.background = '#f8fafc'; box.style.borderColor = 'var(--line)'; box.innerHTML = '<span class="muted">Checking the AI helper…</span>';
    if (!S.db.functions) return show({ ok: false, state: 'error', message: 'Could not check.' });
    S.db.functions.invoke('ai-status', { body: {} }).then(function (res) { var d = res.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
      AIS = d && d.state ? d : { ok: false, state: 'error', message: 'Could not check the AI helper just now.' }; show(AIS);
    }, function () { show({ ok: false, state: 'error', message: 'Could not check the AI helper just now.' }); });
  }
  // Email notices (migration 037 and the server function send-email): are they switched on, how many wait, were sent or failed
  var EMS = null;
  function mailStatus(act) {
    var box = app.querySelector('#ems'); if (!box) return;
    var show = function (d) {
      if (!d || d.off) { box.style.background = '#f8fafc'; box.style.borderColor = 'var(--line)';
        box.innerHTML = '<b>⚪ Email notices: not switched on yet</b> · <span class="muted">Approval requests and messages still appear on the site. Emails start once the email service is set up.</span>'; return; }
      var ok = d.configured && !d.failed, col = !d.configured ? '#b45309' : ok ? '#15803d' : '#b91c1c', bg = !d.configured ? '#fffbeb' : ok ? '#f0fdf4' : '#fef2f2';
      box.style.background = bg; box.style.borderColor = col;
      box.innerHTML = '<b style="color:' + col + '">' + (!d.configured ? '🟠 Email notices: waiting for the email service key' : ok ? '🟢 Email notices: working' : '🔴 Email notices: some emails failed') + '</b> · ' +
        (d.sent || 0) + ' sent, ' + (d.waiting || 0) + ' waiting, ' + (d.failed || 0) + ' failed.' +
        (d.configured && d.test_sender ? ' <span class="muted">Using the test sender: emails reach only the address of the email service account until the site domain is verified.</span>' : '') +
        (d.last_error && (d.failed || d.waiting) ? ' <span class="muted">Last problem: ' + E(d.last_error) + '</span>' : '') +
        ' <button type="button" class="btn sm" id="emt" style="margin-left:6px"' + (d.configured ? '' : ' disabled') + '>Send me a test email</button> <button type="button" class="btn sm" id="emc">Check again</button>' +
        (d.note ? ' <b>' + E(d.note) + '</b>' : '');
      box.querySelector('#emc').onclick = function () { mailStatus('check'); };
      box.querySelector('#emt').onclick = function () { mailStatus('test'); };
    };
    if (EMS && !act) return show(EMS);
    box.innerHTML = '<span class="muted">' + (act === 'test' ? 'Sending a test email…' : 'Checking email notices…') + '</span>';
    if (!S.db.functions) return show({ off: true });
    S.db.functions.invoke('send-email', { body: act === 'test' ? { test: true } : { status: true } }).then(function (res) { var d = res.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
      if (!d || res.error || d.error) { EMS = { off: true }; return show(EMS); }
      if (act === 'test') d.note = d.sent_now ? 'Test email sent: look in your inbox.' : 'The test email was not sent.';
      EMS = d; show(d);
    }, function () { EMS = { off: true }; show(EMS); });
  }
  // one name per school: merge spellings teachers typed differently
  function schools(t) {
    Promise.all([S.db.from('schools').select('id,name').order('name'), S.db.from('classes').select('school_id').eq('owner_kind', 'school'), S.db.from('profiles').select('school_id').not('school_id', 'is', null)]).then(function (x) {
      if (x[0].error) return fail(t, x[0]);
      var n = function (rows, id) { return (rows.data || []).filter(function (r) { return r.school_id === id; }).length; }, list = x[0].data || [];
      t.innerHTML = '<p class="small">Teachers choose their school from this list. If the same school appears twice, merge the extra spelling into the right one: its teachers and classes move across.</p>' +
        list.map(function (sc) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(sc.name) + '</b> <span class="small muted">' + n(x[2], sc.id) + ' people · ' + n(x[1], sc.id) + ' classes</span></span>' +
          '<span class="cta"><select data-into="' + E(sc.id) + '"><option value="">Merge into…</option>' + list.filter(function (o) { return o.id !== sc.id; }).map(function (o) { return '<option value="' + E(o.id) + '">' + E(o.name) + '</option>'; }).join('') + '</select>' +
          '<button class="btn sm" data-ren="' + E(sc.id) + '">Rename</button></span></div>'; }).join('') || '<p class="small muted">No schools yet.</p>';
      t.querySelectorAll('[data-into]').forEach(function (sel) { sel.onchange = function () { if (!sel.value) return; var a = sel.getAttribute('data-into');
        if (!confirm('Move every teacher and class from "' + list.filter(function (o) { return o.id === a; })[0].name + '" into "' + sel.options[sel.selectedIndex].text + '"?')) { sel.value = ''; return; }
        S.db.rpc('merge_schools', { src: a, dst: sel.value }).then(function (r) { if (r.error) return alert(S.nice(r.error)); schools(t); }); }; });
      t.querySelectorAll('[data-ren]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-ren'), nm = prompt('New name for this school:', list.filter(function (o) { return o.id === id; })[0].name); if (!nm) return;
        S.db.from('schools').update({ name: nm.trim() }).eq('id', id).then(function (r) { if (r.error) return alert(S.nice(r.error)); schools(t); }); }; });
    });
  }
  // reviews from real students, parents and teachers: publish or hide
  function reviews(t) {
    S.db.from('reviews').select('*').order('status').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) return fail(t, r);
      var rows = r.data || [];
      t.innerHTML = '<p class="small">Students, parents and teachers write reviews from their dashboards. Only reviews you publish appear on the home page.</p>' +
        (rows.map(function (v) { return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row2"><span><b>' + '★'.repeat(v.rating) + '</b> ' + E(v.display_name) + ' <span class="small muted">' + E(v.who) + (v.school ? ' · ' + E(v.school) : '') + ' · ' + E(v.status) + '</span></span>' +
          '<span class="cta">' + (v.status !== 'approved' ? '<button class="btn main sm" data-pub="' + v.id + '">Publish</button>' : '') + (v.status !== 'hidden' ? '<button class="btn sm" data-hide="' + v.id + '">Hide</button>' : '') + '</span></div><p class="small">' + E(v.body) + '</p></div>'; }).join('') || '<p class="small muted">No reviews yet.</p>');
      t.querySelectorAll('[data-pub],[data-hide]').forEach(function (b) { b.onclick = function () { var pub = b.hasAttribute('data-pub');
        S.db.from('reviews').update({ status: pub ? 'approved' : 'hidden' }).eq('id', b.getAttribute(pub ? 'data-pub' : 'data-hide')).then(function (x) { if (x.error) return alert(S.nice(x.error)); reviews(t); }); }; });
    });
  }
  // only admins can change the main site; an admin can make another account an admin
  function admins(t) {
    S.db.rpc('admin_members').then(function (r) {
      if (r.error) return fail(t, r);
      var all = r.data || [], ad = all.filter(function (m) { return m.account_type === 'admin'; });
      t.innerHTML = '<p class="small">Admins can change everything on the main site: lessons, quizzes, classes, prices, payments and members. Teachers and students cannot. Give admin rights only to people you trust.</p>' +
        '<h4>Admins (' + ad.length + ')</h4>' + ad.map(function (m) { return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>🔑 <b>' + E(m.full_name) + '</b> <span class="small muted">' + E(m.email) + '</span></span>' +
          (m.id === (window.BVS_ME || '') ? '<span class="pill">you</span>' : '<button class="btn sm" data-rm="' + E(m.id) + '">Remove admin</button>') + '</div>'; }).join('') +
        '<h4>Add an admin</h4><label class="f">Their email (they must already have a BioscienceVista account)<input id="ae" type="email" list="ael"><datalist id="ael">' + all.filter(function (m) { return m.account_type !== 'admin'; }).map(function (m) { return '<option value="' + E(m.email) + '">' + E(m.full_name) + '</option>'; }).join('') + '</datalist></label>' +
        '<button class="btn main sm" id="aadd">Make admin</button><p class="msg" id="am"></p>';
      t.querySelector('#aadd').onclick = function () { var em = t.querySelector('#ae').value.trim().toLowerCase(), u = all.filter(function (m) { return (m.email || '').toLowerCase() === em; })[0], m = t.querySelector('#am');
        if (!u) { m.textContent = 'No account uses that email.'; return; }
        if (!confirm('Give ' + u.full_name + ' full admin rights over the whole site?')) return;
        S.db.rpc('set_admin', { uid: u.id, make: true }).then(function (x) { if (x.error) { m.textContent = S.nice(x.error); return; } MEM = null; admins(t); }); };
      t.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this person\'s admin rights?')) return;
        S.db.rpc('set_admin', { uid: b.getAttribute('data-rm'), make: false }).then(function (x) { if (x.error) return alert(S.nice(x.error)); MEM = null; admins(t); }); }; });
    });
  }
  /* Members grouped the way a school is: teacher → their classes → the students in each class. Click a teacher, then a class, then a student's Dashboard. */
  function byTeacher(box) {
    box.innerHTML = '<p class="muted">Loading teachers, classes and students…</p>';
    Promise.all([S.db.from('classes').select('id,name,programme,teacher_id,owner_kind,archived_at').order('name'), S.db.from('enrolments').select('id,student_id,class_id,status'), S.db.from('profiles').select('id,full_name,class_id')]).then(function (x) {
      if (x[0].error) return fail(box, x[0]);
      var who = {}; (x[2].data || []).forEach(function (p) { who[p.id] = { name: p.full_name || '(no name)', email: '' }; });
      (MEM || []).forEach(function (m) { who[m.id] = { name: m.full_name || (who[m.id] || {}).name || '(no name)', email: m.email || '', type: m.account_type }; });
      var inClass = {}, placed = {}, add = function (c, s, eid) { (inClass[c] = inClass[c] || {})[s] = eid || (inClass[c] || {})[s] || 1; };
      (x[1].data || []).forEach(function (e) { if (e.status === 'approved') add(e.class_id, e.student_id, e.id); });
      (x[2].data || []).forEach(function (p) { if (p.class_id) add(p.class_id, p.id); });
      var by = {}, order = [];
      (x[0].data || []).filter(function (c) { return !c.archived_at; }).forEach(function (c) { var k = c.teacher_id || '_'; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(c); });
      var kids = function (c, tid) { return Object.keys(inClass[c.id] || {}).filter(function (s) { return s !== tid; }).sort(function (a, b) { return ((who[a] || {}).name || '').localeCompare((who[b] || {}).name || ''); }); };
      var total = function (tid) { var u = {}; by[tid].forEach(function (c) { kids(c, tid).forEach(function (s) { u[s] = 1; }); }); return Object.keys(u).length; };
      order.sort(function (a, b) { return (a === window.BVS_ME ? -1 : b === window.BVS_ME ? 1 : 0) || total(b) - total(a) || ((who[a] || {}).name || '').localeCompare((who[b] || {}).name || ''); });
      var row = function (s, c) { placed[s] = 1; var w = who[s] || { name: '(no name)', email: '' }, m = memOf(s), eid = c && inClass[c.id] ? inClass[c.id][s] : null;
        return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(w.name) + '</b> <span class="small muted">' + E(w.email) + '</span> ' + prem(m) + '</span><span class="cta"><a class="btn sm" href="/dashboard/?as=' + s + '">📊 Dashboard</a>' + accessBtns(m) +
          (c ? '<button class="btn sm" data-out="' + s + '" data-cls="' + c.id + '" data-eid="' + (eid && eid !== 1 ? eid : '') + '">Remove from class</button>' : '') + '<button class="btn sm" data-del="' + s + '">Delete account</button></span></div>'; };
      var cls = function (c, tid) { var ss = kids(c, tid), link = c.owner_kind === 'main' ? '/staff/#classes/' + c.id : '/teach/?as=' + tid + '#classes/' + c.id;
        return '<details class="panel" style="margin:8px 0"><summary style="cursor:pointer"><b>▸ 🏫 ' + E(c.name) + '</b> <span class="small muted">' + E(c.programme || '') + ' · ' + ss.length + ' student' + (ss.length === 1 ? '' : 's') + '</span></summary><p style="margin:8px 0"><a class="btn sm" href="' + link + '">Open the class page</a></p>' + (ss.length ? ss.map(function (z) { return row(z, c); }).join('') : '<p class="emptybox">No students in this class yet.</p>') + '</details>'; };
      var html = order.map(function (tid) { var w = who[tid] || { name: 'Teacher', email: '' }, mine = tid === window.BVS_ME, cs = by[tid], full = cs.filter(function (c) { return kids(c, tid).length; }), empty = cs.filter(function (c) { return !kids(c, tid).length; });
        return '<details class="panel tint" style="margin:10px 0"' + (order.length === 1 ? ' open' : '') + '><summary style="cursor:pointer"><b style="font-size:1.05rem">▸ 🧑‍🏫 ' + E(w.name) + '</b>' + (mine ? ' <span class="pill" style="display:inline-block;width:auto">you · main site</span>' : '') + ' <span class="small muted">' + E(w.email) + ' · ' + cs.length + ' class' + (cs.length === 1 ? '' : 'es') + ' · ' + total(tid) + ' student' + (total(tid) === 1 ? '' : 's') + '</span></summary>' +
          '<div class="row2" style="margin:8px 0"><span>' + (mine ? '' : prem(memOf(tid))) + '</span><span class="cta"><a class="btn sm" href="' + (mine ? '/staff/#classes' : '/teach/?as=' + tid + '#overview') + '">👁 Open ' + (mine ? 'my classes' : 'this teacher\'s classroom') + '</a>' + (mine || tid === '_' ? '' : accessBtns(memOf(tid)) + '<button class="btn sm" data-del="' + tid + '">Delete teacher account</button>') + '</span></div>' +
          (full.length ? full.map(function (c) { return cls(c, tid); }).join('') : '<p class="emptybox">No class of this teacher has students yet.</p>') +
          (empty.length ? '<details style="margin:8px 0"><summary class="small" style="cursor:pointer;font-weight:700">Classes with no students yet (' + empty.length + ')</summary>' + empty.map(function (c) { return cls(c, tid); }).join('') + '</details>' : '') + '</details>'; }).join('');
      var loose = (MEM || []).filter(function (m) { return m.account_type === 'student' && !placed[m.id]; });
      box.innerHTML = '<p class="small muted">Click a teacher to see their classes, then a class to see its students. Each person\'s row has everything: premium status, free access, extra premium months, remove from class and delete account.</p>' + (html || '<p class="emptybox">No classes yet.</p>') +
        (loose.length ? '<details class="panel" style="margin:10px 0"><summary><b>Students not in a class yet</b> <span class="small muted">' + loose.length + '</span></summary>' + loose.map(function (m) { return row(m.id); }).join('') + '</details>' : '');
      var again = function () { byTeacher(box); };
      wireAccess(box, again);
      box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { delAcct(b, again); }; });
      box.querySelectorAll('[data-out]').forEach(function (b) { b.onclick = function () { twice(b, 'Click again to remove', function () {
        var sid = b.getAttribute('data-out'), cid = b.getAttribute('data-cls'), eid = b.getAttribute('data-eid');
        (eid ? S.db.rpc('decide_enrolment', { eid: eid, approve: false }) : Promise.resolve({})).then(function (r) { if (r.error) throw r.error;
          return S.db.from('profiles').update({ class_id: null }).eq('id', sid).eq('class_id', cid); }).then(function (r) { if (r && r.error) throw r.error; again(); }, function (e) { b.disabled = false; alert(S.nice(e)); }); }); }; });
    });
  }
  /* asking approved students to pay for premium: a message (also emailed when email notices are on) and the premium page when they next sign in */
  var ASKPAY = null;   // admin setting 'ask_pay': 'on' (default) or 'off'
  function askPaySetting() { if (ASKPAY !== null) return Promise.resolve(ASKPAY); return S.db.from('app_settings').select('v').eq('k', 'ask_pay').maybeSingle().then(function (r) { ASKPAY = !(r.data && r.data.v === 'off'); return ASKPAY; }, function () { ASKPAY = true; return ASKPAY; }); }
  var PAYMSG = '💳 Premium: you have been approved on BioscienceVista. To open your lessons, quizzes and simulations, please pay for premium here: https://biosciencevista.com/premium/ (M-Pesa or bank transfer). Thank you!';
  function hasPrem(m) { return !!(m && (m.premium_free || (m.premium_until && new Date(m.premium_until) > new Date()))); }
  function askPay(ids, force) {   // ids of students; only those without premium are asked
    return (force ? Promise.resolve(true) : askPaySetting()).then(function (on) {
      if (!on) return 0;
      var who = ids.filter(function (i) { return !hasPrem(memOf(i)); }); if (!who.length) return 0;
      return S.db.from('messages').insert(who.map(function (i) { return { sender: window.BVS_ME, recipient: i, body: PAYMSG }; })).then(function (r) { if (r.error) alert(S.nice(r.error)); return r.error ? 0 : who.length; });
    });
  }
  /* premium and free access on one row with the name: status pill, free access on/off, add paid months */
  function prem(m) { var paid = m.premium_until && new Date(m.premium_until) > new Date();
    return m.premium_free ? '<span class="pill ok">free access</span>' : paid ? '<span class="pill ok">premium to ' + E(new Date(m.premium_until).toLocaleDateString()) + '</span>' : '<span class="pill">no premium</span>'; }
  function accessBtns(m) { return '<button class="btn sm' + (m.premium_free ? '' : ' main') + '" data-pfree="' + m.id + '" data-v="' + (m.premium_free ? 0 : 1) + '">' + (m.premium_free ? 'Remove free access' : '🎁 Give free access') + '</button>' +
    '<button class="btn sm" data-padd="' + m.id + '" title="Add months of paid premium">＋ Premium months</button>' + (hasPrem(m) || m.account_type === 'admin' ? '' : '<button class="btn sm" data-ask="' + m.id + '" title="Send a message asking them to pay for premium; the premium page opens when they next sign in">💳 Ask to pay</button>'); }
  function memOf(id) { return (MEM || []).filter(function (z) { return z.id === id; })[0] || { id: id }; }
  function wireAccess(box, after) {
    box.querySelectorAll('[data-pfree]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-pfree'), v = b.getAttribute('data-v') === '1'; b.disabled = true;
      S.db.rpc('set_premium', { uid: id, free: v }).then(function (x) { if (x.error) { b.disabled = false; return alert(S.nice(x.error)); } (MEM || []).forEach(function (m) { if (m.id === id) m.premium_free = v; }); after(); }); }; });
    box.querySelectorAll('[data-ask]').forEach(function (b) { b.onclick = function () { b.disabled = true; askPay([b.getAttribute('data-ask')], true).then(function (n) { b.textContent = n ? '✓ Asked to pay' : 'Already has premium'; }); }; });
    box.querySelectorAll('[data-padd]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-padd'), n = parseInt(prompt('Add how many months of premium?', '4'), 10); if (!(n > 0 && n <= 24)) return;
      var m = memOf(id), from = m.premium_until && new Date(m.premium_until) > new Date() ? new Date(m.premium_until) : new Date(); from.setMonth(from.getMonth() + n);
      S.db.rpc('set_premium', { uid: id, free: !!m.premium_free, until: from.toISOString() }).then(function (x) { if (x.error) return alert(S.nice(x.error)); m.premium_until = from.toISOString(); after(); }); }; });
  }
  function fail(t, r) { t.innerHTML = '<p class="msg">' + E(S.nice(r.error)) + '</p>'; }
  /* ---------- one place for every approval: teachers, and students in my classes and other teachers' classes ---------- */
  function twice(b, label, fn) {   // first click asks, second click does it
    if (!b.dataset.sure) { b.dataset.was = b.textContent; b.dataset.sure = 1; b.textContent = label; b.classList.add('main'); setTimeout(function () { if (b.isConnected && b.dataset.sure) { delete b.dataset.sure; b.textContent = b.dataset.was; b.classList.remove('main'); } }, 5000); return; }
    b.disabled = true; fn();
  }
  function delAcct(b, after) { twice(b, 'Click again: delete forever', function () { S.db.rpc('delete_account', { uid: b.getAttribute('data-del') }).then(function (r) { if (r.error) { b.disabled = false; return alert(S.nice(r.error)); } MEM = null; after(); }); }); }
  function approvals(t) {
    var none = function () { return { data: [] }; };
    Promise.all([S.db.rpc('my_join_requests'), S.db.from('classes').select('id,name,teacher_id,owner_kind'), S.db.rpc('admin_members'), S.db.from('pending_accounts').select('*').then(null, none), S.db.from('teacher_courses').select('teacher_id,course,status').then(null, none)]).then(function (x) {
      if (x[0].error) return fail(t, x[0]);
      var reqs = x[0].data || [], CL = {}, mem = {}, me = window.BVS_ME;
      (x[1].data || []).forEach(function (c) { CL[c.id] = c; });
      MEM = x[2].data || MEM; (MEM || []).forEach(function (m) { mem[m.id] = m; });
      var asked = {}; reqs.forEach(function (q) { asked[q.student_id] = 1; });
      var newAcc = (x[3].data || []).filter(function (p) { return !asked[p.student_id] && p.account_type !== 'teacher' && p.account_type !== 'admin'; });
      var tcWait = (x[4].data || []).filter(function (c) { return c.status === 'pending'; });
      var tWait = (MEM || []).filter(function (m) { return m.account_type === 'teacher' && (m.teacher_status === 'pending' || tcWait.some(function (c) { return c.teacher_id === m.id; })); });
      var mine = function (cid) { var c = CL[cid]; return !c || c.owner_kind === 'main' || c.teacher_id === me; };
      var tname = function (tid) { return tid === me ? 'You' : ((mem[tid] || {}).full_name || 'Teacher'); };
      var srow = function (q) { var m = mem[q.student_id] || {};
        return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><label class="chk"><input type="checkbox" data-sel="' + q.id + '"> <b>' + E(q.full_name || m.full_name || 'Student') + '</b> <span class="small muted">' + E(m.email || '') + ' · asked ' + E(S.when(q.requested_at)) + '</span> ' +
          (q.status === 'teacher_ok' ? '<span class="pill ok">teacher said yes</span> ' : '') + (q.premium ? '<span class="pill ok">premium</span>' : '<span class="pill">no premium</span>') + '</label>' +
          '<span class="cta"><button class="btn main sm" data-ok="' + q.id + '">✓ Approve</button>' + (q.premium ? '' : '<button class="btn sm" data-okpay="' + q.id + '" data-sid="' + q.student_id + '">💳 Approve + ask to pay</button><button class="btn sm" data-free="' + q.id + '">✓ Approve + free access</button>') +
          '<button class="btn sm" data-no="' + q.id + '">Decline</button><button class="btn sm" data-del="' + q.student_id + '">Delete account</button></span></div>'; };
      var byClass = function (list) { var g = {}, o = []; list.forEach(function (q) { if (!g[q.class_id]) { g[q.class_id] = []; o.push(q.class_id); } g[q.class_id].push(q); });
        o.sort(function (a, b) { return (CL[a] ? CL[a].name : '').localeCompare(CL[b] ? CL[b].name : ''); });
        return o.map(function (cid) { return '<div class="panel" style="margin:8px 0"><p style="margin:0 0 4px"><b>🏫 ' + E((CL[cid] || {}).name || g[cid][0].class_name || 'Class') + '</b> <span class="small muted">' + g[cid].length + ' waiting</span></p>' + g[cid].map(srow).join('') + '</div>'; }).join(''); };
      var my = reqs.filter(function (q) { return mine(q.class_id); }), other = reqs.filter(function (q) { return !mine(q.class_id); });
      var byT = {}, tOrder = []; other.forEach(function (q) { var tid = (CL[q.class_id] || {}).teacher_id || '_'; if (!byT[tid]) { byT[tid] = []; tOrder.push(tid); } byT[tid].push(q); });
      tOrder.sort(function (a, b) { return tname(a).localeCompare(tname(b)); });
      var total = reqs.length + newAcc.length + tWait.length;
      t.innerHTML = '<div class="row2"><p style="margin:0"><b>' + total + '</b> waiting for you: ' + tWait.length + ' teacher' + (tWait.length === 1 ? '' : 's') + ', ' + reqs.length + ' join request' + (reqs.length === 1 ? '' : 's') + ', ' + newAcc.length + ' new account' + (newAcc.length === 1 ? '' : 's') + '.</p>' +
          (total ? '<button class="btn main" id="okeverything">✓ Approve all ' + total + '</button>' : '') + '</div>' +
        '<p class="small muted">One place for every approval. <b>Approve + free access</b> also gives the student free premium. <b>💳 Approve + ask to pay</b> approves and sends the student a message asking them to pay for premium; the premium page opens when they next sign in. <b>Delete account</b> asks twice, then removes the account for good.</p>' +
        '<label class="chk panel" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="askpay"' + (ASKPAY === false ? '' : ' checked') + '> <span><b>💳 Ask to pay automatically:</b> when I press <b>✓ Approve</b> (or approve several, or Approve all) for a student without premium, ask them to pay as well.</span></label>' +
        '<h3>🧑‍🏫 Teachers waiting (' + tWait.length + ')</h3>' + (tWait.length ? '<p class="small muted">Approve the teacher and each course they chose below.</p>' : '<p class="small muted">No teachers waiting.</p>') + '<div id="tbox"></div>' +
        '<h3>🙋 Students: my classes (' + my.length + ')</h3>' + (my.length ? byClass(my) : '<p class="small muted">No requests for your classes.</p>') +
        '<h3>🙋 Students: other teachers\' classes (' + other.length + ')</h3>' + (other.length ? tOrder.map(function (tid) { return '<details class="panel tint" open style="margin:8px 0"><summary style="cursor:pointer"><b>🧑‍🏫 ' + E(tname(tid)) + '</b> <span class="small muted">' + byT[tid].length + ' waiting</span></summary>' + byClass(byT[tid]) + '</details>'; }).join('') : '<p class="small muted">No requests for other teachers\' classes.</p>') +
        (reqs.length ? '<div class="cta" style="margin:8px 0"><label class="chk"><input type="checkbox" id="all"> Select all students</label><button class="btn main sm" id="okall">✓ Approve selected</button><button class="btn sm" id="freeall">✓ Approve selected + free access</button><button class="btn sm" id="noall">Decline selected</button></div>' : '') +
        '<h3>🆕 New accounts not in a class yet (' + newAcc.length + ')</h3>' + (newAcc.length ? newAcc.map(function (p) { var m = mem[p.student_id] || {};
          return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>' + E(p.full_name || '(no name)') + '</b> <span class="small muted">' + E(m.email || '') + ' · ' + E(p.account_type || 'student') + ' · ' + E(p.class_name || 'no class') + ' · signed up ' + E(S.when(p.created_at)) + '</span></span>' +
            '<span class="cta"><button class="btn main sm" data-acc="' + p.student_id + '">✓ Approve</button>' + (hasPrem(m) ? '' : '<button class="btn sm" data-accpay="' + p.student_id + '">💳 Approve + ask to pay</button>') + '<button class="btn sm" data-accfree="' + p.student_id + '">✓ Approve + free access</button><button class="btn sm" data-del="' + p.student_id + '">Delete account</button></span></div>'; }).join('') : '<p class="small muted">Nobody waiting.</p>') +
        '<details style="margin-top:14px"><summary style="cursor:pointer;font-weight:700">🧑‍🏫 All teachers and their courses</summary><div id="tall"></div></details>';
      // teachers waiting: the teacher manager, only those waiting; all teachers in the details box
      if (tWait.length) teachers(t.querySelector('#tbox'), function (m) { return tWait.some(function (w) { return w.id === m.id; }); });
      var tall = t.querySelector('#tall'), opened = false; t.querySelector('details:last-of-type').addEventListener('toggle', function () { if (!opened) { opened = true; teachers(tall); } });
      var redo = function () { approvals(t); };
      var go = function (ids, ok, free) { return Promise.all(ids.map(function (i) { return S.db.rpc('decide_enrolment', { eid: i, approve: ok, give_free: !!free }); })).then(function (rs) { var e = rs.filter(function (z) { return z.error; })[0]; if (e) alert(S.nice(e.error)); MEM = null; }); };
      var acc = function (ids, free) { return S.db.from('profiles').update({ approved: true, admin_ok: true }).in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).then(function (r) { if (r.error) alert(S.nice(r.error));
        return free ? Promise.all(ids.map(function (i) { return S.db.rpc('set_premium', { uid: i, free: true }); })) : null; }).then(function () { MEM = null; }); };
      var sidOf = function (eids) { return reqs.filter(function (q) { return eids.indexOf(q.id) >= 0; }).map(function (q) { return q.student_id; }); };
      var ap = t.querySelector('#askpay'); askPaySetting().then(function (v) { if (ap) ap.checked = v; });
      if (ap) ap.onchange = function () { ASKPAY = ap.checked; S.db.from('app_settings').upsert({ k: 'ask_pay', v: ap.checked ? 'on' : 'off' }).then(function (r) { if (r.error) alert(S.nice(r.error)); }); };
      t.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { b.disabled = true; var e = b.getAttribute('data-ok'); go([e], true).then(function () { return askPay(sidOf([e])); }).then(redo); }; });
      t.querySelectorAll('[data-okpay]').forEach(function (b) { b.onclick = function () { b.disabled = true; go([b.getAttribute('data-okpay')], true).then(function () { return askPay([b.getAttribute('data-sid')], true); }).then(redo); }; });
      t.querySelectorAll('[data-accpay]').forEach(function (b) { b.onclick = function () { b.disabled = true; var id = b.getAttribute('data-accpay'); acc([id]).then(function () { return askPay([id], true); }).then(redo); }; });
      t.querySelectorAll('[data-free]').forEach(function (b) { b.onclick = function () { b.disabled = true; go([b.getAttribute('data-free')], true, true).then(redo); }; });
      t.querySelectorAll('[data-no]').forEach(function (b) { b.onclick = function () { if (!confirm('Decline this request?')) return; b.disabled = true; go([b.getAttribute('data-no')], false).then(redo); }; });
      t.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { b.disabled = true; var id = b.getAttribute('data-acc'); acc([id]).then(function () { return askPay([id]); }).then(redo); }; });
      t.querySelectorAll('[data-accfree]').forEach(function (b) { b.onclick = function () { b.disabled = true; acc([b.getAttribute('data-accfree')], true).then(redo); }; });
      [].forEach.call(t.querySelectorAll('[data-del]'), function (b) { b.onclick = function () { delAcct(b, redo); }; });
      var sel = function () { return [].map.call(t.querySelectorAll('[data-sel]:checked'), function (b) { return b.getAttribute('data-sel'); }); };
      var a = t.querySelector('#all'); if (a) a.onchange = function () { t.querySelectorAll('[data-sel]').forEach(function (b) { b.checked = a.checked; }); };
      var oa = t.querySelector('#okall'); if (oa) {
        oa.onclick = function () { var s = sel(); if (s.length) go(s, true).then(function () { return askPay(sidOf(s)); }).then(redo); };
        t.querySelector('#freeall').onclick = function () { var s = sel(); if (s.length) go(s, true, true).then(redo); };
        t.querySelector('#noall').onclick = function () { var s = sel(); if (s.length && confirm('Decline ' + s.length + ' requests?')) go(s, false).then(redo); }; }
      var ev = t.querySelector('#okeverything'); if (ev) ev.onclick = function () {
        if (!confirm('Approve everything waiting?\n\n• ' + tWait.length + ' teacher(s) and the ' + tcWait.length + ' course(s) they chose\n• ' + reqs.length + ' student join request(s)\n• ' + newAcc.length + ' new account(s)\n\nNo free access is given' + (ASKPAY === false ? '.' : '; students without premium are asked to pay.'))) return;
        ev.disabled = true; ev.textContent = 'Approving…';
        var tjobs = tWait.filter(function (m) { return m.teacher_status === 'pending'; }).map(function (m) { return S.db.rpc('decide_teacher', { uid: m.id, approve: true }); })
          .concat(tcWait.filter(function (c) { return tWait.some(function (m) { return m.id === c.teacher_id; }); }).map(function (c) { return S.db.rpc('decide_teacher_course', { uid: c.teacher_id, course_slug: c.course, yes: true }); }));
        Promise.all(tjobs).then(function (rs) { var e = rs.filter(function (z) { return z && z.error; })[0]; if (e) alert(S.nice(e.error)); return go(reqs.map(function (q) { return q.id; }), true); })
          .then(function () { return acc(newAcc.map(function (p) { return p.student_id; })); })
          .then(function () { return askPay(reqs.map(function (q) { return q.student_id; }).concat(newAcc.map(function (p) { return p.student_id; }))); }).then(redo); };
    });
  }
  var MEM = null;
  function members(t) {
    (MEM ? Promise.resolve({ data: MEM }) : S.db.rpc('admin_members')).then(function (r) {
      if (r.error) return fail(t, r);
      MEM = r.data || [];
      t.innerHTML = '<p class="small">Give free access to anyone you choose (it lasts until you remove it), or add paid time by hand. Students who were approved before premium started have free access.</p>' +
        '<div class="cta" style="justify-content:flex-start;margin:8px 0" role="tablist"><button type="button" class="btn sm main" id="vt">🧑‍🏫 By teacher and class</button><button type="button" class="btn sm" id="va">📋 All accounts and premium access</button></div><div id="mt"></div><div id="mall" hidden>' +
        '<div class="two"><label class="f">Search<input id="mq" placeholder="name, email or class"></label><label class="f">Show<select id="mf"><option value="">Everyone</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="nopremium">Without premium</option><option value="pending">With join requests</option></select></label></div><div id="ml"></div></div>';
      var show = function (all) { t.querySelector('#mall').hidden = !all; t.querySelector('#mt').hidden = all; t.querySelector('#vt').classList.toggle('main', !all); t.querySelector('#va').classList.toggle('main', all); };
      t.querySelector('#vt').onclick = function () { show(false); }; t.querySelector('#va').onclick = function () { show(true); };
      byTeacher(t.querySelector('#mt'));
      var now = new Date();
      var list = function () {
        var q = t.querySelector('#mq').value.trim().toLowerCase(), f = t.querySelector('#mf').value;
        var rows = (MEM || []).filter(function (m) { var prem = m.premium_free || (m.premium_until && new Date(m.premium_until) > now);
          return (!q || ((m.full_name || '') + ' ' + (m.email || '') + ' ' + (m.classes || '')).toLowerCase().indexOf(q) >= 0) &&
            (!f || (f === 'nopremium' ? !prem : f === 'pending' ? m.pending > 0 : m.account_type === f)); });
        t.querySelector('#ml').innerHTML = '<p class="small muted">' + rows.length + ' accounts</p>' + rows.slice(0, 300).map(function (m) {
          var paid = m.premium_until && new Date(m.premium_until) > now;
          return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row2"><span><b>' + E(m.full_name || '–') + '</b> <span class="small muted">' + E(m.email) + ' · ' + E(m.account_type) + '</span><br><span class="small">' + E(m.classes || 'no class') + '</span></span>' +
            '<span class="cta">' + (m.account_type === 'teacher' ? '<a class="btn sm" href="/teach/?as=' + m.id + '#overview">👁 Classroom</a>' : m.account_type === 'student' ? '<a class="btn sm" href="/dashboard/?as=' + m.id + '">📊 Dashboard</a>' : '') + prem(m) + accessBtns(m) +
            (m.id === window.BVS_ME ? '' : '<button class="btn sm" data-del="' + m.id + '">Delete account</button>') + '</span></div></div>'; }).join('');
        var ml = t.querySelector('#ml'); wireAccess(ml, list); ml.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { delAcct(b, function () { members(t); }); }; });
      };
      t.querySelector('#mq').oninput = list; t.querySelector('#mf').onchange = list; list();
    });
  }
  function teachers(t, only) {
    var none = function () { return { error: true }; };
    Promise.all([S.db.rpc('admin_members'), S.db.from('teacher_courses').select('teacher_id,course,status,requested_at').then(null, none), S.db.rpc('course_list').then(null, none)]).then(function (z) {
      var r = z[0]; if (r.error) return fail(t, r);
      var TC = z[1] && !z[1].error ? (z[1].data || []) : null, nm = {};   // TC is null until migration 034 (courses approved one by one)
      var ALLC = (z[2] && z[2].data) || []; ALLC.forEach(function (k) { nm[k.slug] = k.name; });
      var by = {}; (TC || []).forEach(function (c) { (by[c.teacher_id] = by[c.teacher_id] || []).push(c); });
      var rows = (r.data || []).filter(function (m) { return m.account_type === 'teacher' && m.teacher_status && (!only || only(m)); });
      var wait = (TC || []).filter(function (c) { return c.status === 'pending' && rows.some(function (m) { return m.id === c.teacher_id; }); }).length;
      rows.sort(function (a, b) { var pa = (by[a.id] || []).some(function (c) { return c.status === 'pending'; }) || a.teacher_status === 'pending', pb = (by[b.id] || []).some(function (c) { return c.status === 'pending'; }) || b.teacher_status === 'pending'; return (pb - pa) || (a.full_name || '').localeCompare(b.full_name || ''); });
      var courses = function (m) {
        if (!TC) return '';
        var cs = (by[m.id] || []).slice().sort(function (a, b) { return (nm[a.course] || a.course).localeCompare(nm[b.course] || b.course); });
        return '<div style="margin:6px 0 0 4px">' + (cs.length ? cs.map(function (c) {
          return '<div class="row2" style="padding:3px 0"><span class="small">📚 <b>' + E(nm[c.course] || c.course) + '</b> ' + (c.status === 'approved' ? '<span class="pill ok">approved</span>' : c.status === 'pending' ? '<span class="pill t">⏳ waiting for you</span>' : '<span class="pill">declined</span>') + '</span><span class="cta">' +
            (c.status !== 'approved' ? '<button class="btn main sm" data-cyes="' + m.id + '" data-course="' + E(c.course) + '">Approve course</button>' : '') +
            (c.status !== 'declined' ? '<button class="btn sm" data-cno="' + m.id + '" data-course="' + E(c.course) + '">' + (c.status === 'approved' ? 'Remove course' : 'Decline') + '</button>' : '') + '</span></div>'; }).join('') : '<p class="small muted" style="margin:0">No course chosen yet.</p>') +
          (function () { var have = cs.map(function (c) { return c.course; }), rest = ALLC.filter(function (k) { return have.indexOf(k.slug) < 0; });   // teachers cannot add courses themselves: the admin adds one here
            return rest.length && m.teacher_status !== 'rejected' ? '<div class="row2" style="padding:3px 0;justify-content:flex-start;gap:8px"><select data-addsel="' + m.id + '" aria-label="Add a course for ' + E(m.full_name) + '" style="max-width:280px"><option value="">Add a course for this teacher…</option>' +
              rest.map(function (k) { return '<option value="' + E(k.slug) + '">' + E(k.name) + '</option>'; }).join('') + '</select><button class="btn sm" data-addc="' + m.id + '">Add and approve</button></div>' : ''; })() + '</div>';
      };
      t.innerHTML = (only ? '' : '<p class="small">Teachers from other schools and private tutors. An approved teacher with premium can create their own classes, add BioscienceVista lessons and published quizzes to them, and see only their own students. They cannot change anything on the main site.</p>' +
        (TC ? '<p class="small"><b>Each teacher selects courses at sign-up and you approve each course.</b> Approving a course makes that teacher\'s class for it (and approves a teacher who is still waiting). A teacher can make classes only for approved courses, and cannot add courses: you add one here.' + (wait ? ' <span class="pill t">' + wait + ' course' + (wait === 1 ? '' : 's') + ' waiting</span>' : '') + '</p>' : '')) +
        (rows.length ? rows.map(function (m) { return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row2"><span><b>' + E(m.full_name) + '</b> <span class="small muted">' + E(m.email) + ' · signed up ' + E(new Date(m.created_at).toLocaleDateString()) + '</span><br>' +
          '<span class="pill' + (m.teacher_status === 'approved' ? ' ok' : '') + '">' + E(m.teacher_status) + '</span> ' + prem(m) + '</span><span class="cta"><a class="btn sm" href="/teach/?as=' + m.id + '#overview" title="See and edit this teacher\'s classes, their dashboard and their students">👁 Open classroom</a>' + (m.teacher_status !== 'approved' ? '<button class="btn main sm" data-ok="' + m.id + '">Approve</button>' : '') +
          (m.teacher_status !== 'rejected' ? '<button class="btn sm" data-no="' + m.id + '">' + (m.teacher_status === 'approved' ? 'Remove teacher access' : 'Decline') + '</button>' : '') + accessBtns(m) + '<button class="btn sm" data-del="' + m.id + '">Delete account</button></span></div>' + courses(m) + '</div>'; }).join('') : '<p class="small muted">No teacher sign-ups yet.</p>');
      t.querySelectorAll('[data-ok],[data-no]').forEach(function (b) { b.onclick = function () { var ok = b.hasAttribute('data-ok'); if (!ok && !confirm('Remove this teacher\'s access? Their classes stay but they cannot manage them.')) return;
        S.db.rpc('decide_teacher', { uid: b.getAttribute(ok ? 'data-ok' : 'data-no'), approve: ok }).then(function (x) { if (x.error) return alert(S.nice(x.error)); MEM = null; if (only) approvals(app.querySelector('#tab')); else teachers(t); }); }; });
      wireAccess(t, function () { if (only) approvals(app.querySelector('#tab')); else teachers(t, only); });
      t.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { delAcct(b, function () { if (only) approvals(app.querySelector('#tab')); else teachers(t, only); }); }; });
      t.querySelectorAll('[data-addc]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-addc'), sel = t.querySelector('[data-addsel="' + id + '"]'); if (!sel.value) return alert('Choose the course to add.'); b.disabled = true;
        S.db.rpc('decide_teacher_course', { uid: id, course_slug: sel.value, yes: true }).then(function (x) { if (x.error) { b.disabled = false; return alert(S.nice(x.error)); } MEM = null; if (only) approvals(app.querySelector('#tab')); else teachers(t); }); }; });
      t.querySelectorAll('[data-cyes],[data-cno]').forEach(function (b) { b.onclick = function () { var yes = b.hasAttribute('data-cyes');
        if (!yes && b.textContent === 'Remove course' && !confirm('Remove this course from the teacher? Classes already made stay, but the teacher cannot make new classes for it.')) return;
        b.disabled = true;
        S.db.rpc('decide_teacher_course', { uid: b.getAttribute(yes ? 'data-cyes' : 'data-cno'), course_slug: b.getAttribute('data-course'), yes: yes }).then(function (x) { if (x.error) { b.disabled = false; return alert(S.nice(x.error)); } MEM = null; if (only) approvals(app.querySelector('#tab')); else teachers(t); }); }; });
    });
  }
  var MAN = {};
  function payments(t) {
    S.db.rpc('admin_payments').then(function (r) {
      if (r.error) return fail(t, r);
      var rows = r.data || [], MAN = { mpesa: 'M-Pesa', usd_bank: 'USD bank transfer', payoneer: 'Payoneer', paypalme: 'PayPal.Me', bank: 'Bank transfer', link: 'Payment link' }, wait = rows.filter(function (y) { return MAN[y.method] && y.status === 'pending'; });
      t.innerHTML = '<h3>Payments to check (' + wait.length + ')</h3><p class="small">M-Pesa, PayPal.Me, bank transfers and payment-link payments wait here. Find the transaction ID in your M-Pesa messages, PayPal activity or bank statement and check the amount before confirming. Confirming starts the premium time straight away.</p>' +
        (wait.length ? wait.map(function (y) { return '<div class="row2" style="padding:8px 0;border-bottom:1px solid var(--line)"><span><span class="pill">' + E(MAN[y.method]) + '</span> <b>' + E(y.mpesa_code) + '</b> · ' + E(y.currency) + ' ' + E(Number(y.amount).toLocaleString()) + ' · ' + E(y.plan) + '<br><span class="small">' + E(y.full_name || '') + ' (' + E(y.email || '') + ') · paid from ' + E(y.payer_phone || '') + (y.payer_name ? ' · ' + E(y.payer_name) : '') + ' · ' + E(S.when(y.created_at)) + (y.donor_message ? '<br>“' + E(y.donor_message) + '”' : '') + '</span></span>' +
          '<span class="cta"><button class="btn main sm" data-ok="' + E(y.reference) + '">Confirm</button><button class="btn sm" data-no="' + E(y.reference) + '">Not received</button></span></div>'; }).join('') : '<p class="small muted">Nothing waiting.</p>') +
        '<h3>All payments</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Date</th><th>Name</th><th>Plan</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
        rows.map(function (y) { return '<tr><td>' + E(new Date(y.created_at).toLocaleDateString()) + '</td><td>' + E(y.full_name || '') + '</td><td>' + E(y.plan || '') + '</td><td>' + E((MAN[y.method] || 'PayPal') + (y.mpesa_code ? ' ' + y.mpesa_code : '')) + '</td><td>' + E(y.currency + ' ' + Number(y.amount).toLocaleString()) + '</td><td>' + E(y.status) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      t.querySelectorAll('[data-ok],[data-no]').forEach(function (b) { b.onclick = function () { var ok = b.hasAttribute('data-ok'); if (!confirm(ok ? 'Confirm this payment was received?' : 'Mark this payment as not received?')) return;
        S.db.rpc('decide_mpesa', { ref: b.getAttribute(ok ? 'data-ok' : 'data-no'), approve: ok }).then(function (x) { if (x.error) return alert(S.nice(x.error)); MEM = null; payments(t); }); }; });
    });
  }
  function settings(t) {
    Promise.all([S.db.from('plans').select('*').order('sort'), S.db.from('app_settings').select('k,v')]).then(function (x) {
      if (x[0].error) return fail(t, x[0]);
      var set = {}; (x[1].data || []).forEach(function (r) { set[r.k] = r.v; });
      t.innerHTML = '<h3>Prices</h3><p class="small">A price of 0 hides that way of paying for the plan. PayPal uses the USD price; M-Pesa uses the Kenya-shilling price.</p>' +
        '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Plan</th><th>For</th><th>Months</th><th>PayPal (USD)</th><th>M-Pesa (KES)</th><th>On sale</th></tr></thead><tbody>' +
        (x[0].data || []).map(function (p) { return '<tr data-plan="' + E(p.code) + '"><td><input data-f="name" value="' + E(p.name) + '" maxlength="60"></td><td>' + E(p.audience) + '</td><td><input data-f="months" type="number" min="1" max="24" value="' + p.months + '" style="width:5em"></td>' +
          '<td><input data-f="amount" type="number" min="0" step="0.01" value="' + p.amount + '" style="width:7em"></td><td><input data-f="amount_kes" type="number" min="0" step="1" value="' + p.amount_kes + '" style="width:7em"></td><td><input data-f="active" type="checkbox"' + (p.active ? ' checked' : '') + '></td></tr>'; }).join('') +
        '</tbody></table></div><button class="btn main sm" id="savep">Save prices</button><p class="msg" id="pm"></p>' +
        '<h3>Payment details shown to payers</h3>' +
        '<label class="f">M-Pesa number students send money to<input id="s_mpesa_number" value="' + E(set.mpesa_number || '') + '" placeholder="e.g. 0712 345 678" inputmode="tel"></label>' +
        '<label class="f">Name shown on M-Pesa for that number<input id="s_mpesa_name" value="' + E(set.mpesa_name || '') + '" maxlength="60"></label>' +
        '<label class="f">PayPal client ID (public; from developer.paypal.com → Apps &amp; Credentials → Live)<input id="s_paypal_client_id" value="' + E(set.paypal_client_id || '') + '" autocomplete="off"></label>' +
        '<label class="f">Card payments by Paystack (yes = show the 💳 Card button to everyone; test = only on /premium/?pstest=1 for trying test cards; the secret key is kept in Supabase, never here)<input id="s_paystack_on" value="' + E(set.paystack_on || '') + '" autocomplete="off" placeholder="yes, test or blank"></label>' +
        '<label class="f">Charity line (shown on the premium and donate pages)<input id="s_charity_note" value="' + E(set.charity_note || '') + '" maxlength="200"></label>' +
        '<label class="f">Note on the premium page (optional)<input id="s_premium_note" value="' + E(set.premium_note || '') + '" maxlength="200"></label>' +
        '<button class="btn main sm" id="saves">Save settings</button><p class="msg" id="sm"></p>' +
        '<p class="small muted">The PayPal <b>secret</b> never goes here. Put PAYPAL_CLIENT_ID, PAYPAL_SECRET and PAYPAL_ENV (live) in Supabase → Edge Functions → Secrets.</p>';
      t.querySelector('#savep').onclick = function () { var m = t.querySelector('#pm');
        Promise.all([].map.call(t.querySelectorAll('[data-plan]'), function (tr) { var g = function (f) { return tr.querySelector('[data-f=' + f + ']'); };
          return S.db.from('plans').update({ name: g('name').value.trim(), months: +g('months').value, amount: +g('amount').value || 0, amount_kes: +g('amount_kes').value || 0, active: g('active').checked }).eq('code', tr.getAttribute('data-plan')); }))
          .then(function (rs) { var e = rs.filter(function (r) { return r.error; })[0]; m.className = e ? 'msg' : 'msg ok'; m.textContent = e ? S.nice(e.error) : 'Prices saved.'; }); };
      t.querySelector('#saves').onclick = function () { var m = t.querySelector('#sm');
        var rows = ['mpesa_number', 'mpesa_name', 'paypal_client_id', 'paystack_on', 'premium_note', 'charity_note'].map(function (k) { return { k: k, v: t.querySelector('#s_' + k).value.trim() }; });
        Promise.all([S.db.from('app_settings').upsert(rows.filter(function (r) { return r.v; })), S.db.from('app_settings').delete().in('k', rows.filter(function (r) { return !r.v; }).map(function (r) { return r.k; }).concat(['__none__']))])
          .then(function (rs) { var e = rs.filter(function (r) { return r.error; })[0]; m.className = e ? 'msg' : 'msg ok'; m.textContent = e ? S.nice(e.error) : 'Settings saved.'; }); };
    });
  }
})();
