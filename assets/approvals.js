/* Approval Centre · VistaEd admin · by George Apidi (22 Nov 2026, migration 078)
   Every registration in one place: groups, search and filters (name, school, country, role, pathway, section, subject, date,
   status, membership), account decisions with history, authorised subjects, Free/Premium (1, 3, 6, 12 months or custom dates),
   extra access, devices and sessions, security flags, and the access level of every course, topic, lesson and examination. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var CSS = '.apx-hero{padding:22px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#16a34a,#0ea5e9 50%,#7c3aed);margin:0 0 14px}.apx-hero h1{margin:0;color:#fff}.apx-hero p{margin:4px 0 0;color:#fff}' +
    '.apx-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}.apx-tabs button{font:inherit;font-weight:800;padding:8px 12px;border-radius:999px;border:2px solid #c7d2fe;background:#eef2ff;color:#3730a3;cursor:pointer}' +
    '.apx-tabs button.on{background:#4338ca;border-color:#4338ca;color:#fff}.apx-tabs b{display:inline-block;min-width:1.4em;padding:0 6px;margin-left:4px;border-radius:999px;background:#fff;color:#4338ca}.apx-tabs button.hot b{background:#dc2626;color:#fff}' +
    '.apx-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px;margin:0 0 10px}.apx-f input,.apx-f select{font:inherit;padding:7px;border:1px solid #cbd5e1;border-radius:9px;width:100%}' +
    '.apx-grp{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.apx-grp button{font:inherit;font-size:.85rem;padding:5px 10px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;cursor:pointer}.apx-grp button.on{background:#0f172a;color:#fff}' +
    '.apx-t{width:100%;border-collapse:collapse;font-size:.9rem}.apx-t th,.apx-t td{padding:7px 8px;border-bottom:1px solid #f1f5f9;text-align:left;vertical-align:top}.apx-t th{background:#f8fafc;position:sticky;top:0}.apx-t tr:hover td{background:#fafaff}' +
    '.apx-p{display:inline-block;padding:2px 8px;border-radius:999px;font-weight:800;font-size:.74rem;margin:1px 3px 1px 0}.q-ok{background:#dcfce7;color:#166534}.q-w{background:#fef3c7;color:#92400e}.q-n{background:#fee2e2;color:#991b1b}.q-i{background:#e0f2fe;color:#075985}.q-p{background:linear-gradient(90deg,#f59e0b,#db2777);color:#fff}' +
    '.apx-d{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;justify-content:flex-end;z-index:60}.apx-dp{background:#fff;width:min(720px,100%);height:100%;overflow:auto;padding:18px}.apx-dp h2{margin:0}.apx-sec{border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin:10px 0}.apx-sec h3{margin:0 0 6px;font-size:1rem}' +
    '.apx-btns{display:flex;flex-wrap:wrap;gap:6px}.apx-btns .btn{margin:0}.btn.ok{background:#16a34a;color:#fff;border-color:#16a34a}.btn.no{background:#dc2626;color:#fff;border-color:#dc2626}.apx-m{color:#64748b;font-size:.86rem}.apx-bulk{position:sticky;bottom:0;background:#0f172a;color:#fff;border-radius:14px;padding:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var ROWS = [], TREE = null, TAB = 'p_students', SEL = {}, FL = { q: '', school: '', country: '', role: '', pathway: '', section: '', subject: '', from: '', to: '', status: '', member: '' };
  var TABS = [['p_students', '🎒 Pending students'], ['a_students', 'Approved students'], ['p_teachers', '🧑‍🏫 Pending teachers'], ['a_teachers', 'Approved teachers'], ['independent', '🚀 Independent learners'],
    ['subjects', '📚 Subject requests'], ['info', '❓ Info requested'], ['rejected', 'Rejected'], ['suspended', '⏸ Suspended'], ['expired', '⌛ Expired Premium'], ['all', 'Everyone'], ['security', '🛡 Security'], ['access', '🔓 Public content & access'], ['settings', '⚙ Settings']];
  var SUBJ = { biology: 'Biology', chemistry: 'Chemistry', physics: 'Physics', mathematics: 'Mathematics', 'maths-aa': 'Maths AA', 'maths-ai': 'Maths AI', ess: 'ESS', 'computer-science': 'Computer Science', 'digital-society': 'Digital Society', science: 'MYP Science' };
  var STAT = { pending: ['Pending', 'q-w'], approved: ['Approved', 'q-ok'], rejected: ['Rejected', 'q-n'], info_requested: ['Info requested', 'q-i'], suspended: ['Suspended', 'q-n'] };
  function pill(t, k) { return '<span class="apx-p ' + k + '">' + E(t) + '</span>'; }
  function day(t) { return t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }

  S.guard(app, { staff: true }).then(function () { return Promise.all([S.db.rpc('academic_tree'), reload()]); }).then(function (x) { TREE = (function (T) { if (!T || T._edx) return T; T._edx = 1; T.sections = T.sections || []; T.courses = T.courses || []; var has = {}; T.courses.forEach(function (c) { if (c.pathway === 'edexcel' && !/^edx-/.test(c.section)) c.section = 'edx-' + c.section; if (c.pathway === 'edexcel') has[c.section] = 1; }); [['edx-ks3', 'iLowerSecondary (KS3)', 'Pearson Edexcel iLowerSecondary, Years 7–9', 80], ['edx-igcse', 'International GCSE', 'Pearson Edexcel International GCSE (9–1)', 81], ['edx-ial', 'International AS & A Level', 'Pearson Edexcel International AS & A Level', 82]].forEach(function (s) { if (has[s[0]] && !T.sections.some(function (x) { return x.section === s[0]; })) T.sections.push({ section: s[0], name: s[1], blurb: s[2], pathway: 'edexcel', sort: s[3] }); }); return T; })(x[0].data || { sections: [], courses: [] }); draw(); newTop(); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  // 🆕 New members and the "All courses free" switch above the lists (migration 093, site_assets/newmembers.js)
  function newTop() {
    var box = document.getElementById('apx-new'); if (!box) { box = document.createElement('div'); box.id = 'apx-new'; app.parentNode.insertBefore(box, app); }
    var go = function () { BVNEW(box, S); };
    if (window.BVNEW) return go(); var x = document.createElement('script'); x.src = '/assets/newmembers.js?v=' + (window.BV_VER || '5'); x.onload = go; document.head.appendChild(x);
  }
  function reload() { return S.db.rpc('admin_registrations').then(function (r) { if (r.error) throw r.error; ROWS = r.data || []; }); }
  function kind(r) { return r.account_type === 'teacher' ? 'teacher' : r.account_type === 'admin' ? 'admin' : r.learner_kind === 'independent' ? 'independent' : 'student'; }
  function inTab(r, t) {
    var k = kind(r);
    switch (t) {
      case 'p_students': return k === 'student' && r.status === 'pending';
      case 'a_students': return k === 'student' && r.status === 'approved';
      case 'p_teachers': return k === 'teacher' && r.status === 'pending';
      case 'a_teachers': return k === 'teacher' && r.status === 'approved';
      case 'independent': return k === 'independent' && ['rejected', 'suspended'].indexOf(r.status) < 0;
      case 'subjects': return r.status === 'approved' && (r.courses || []).some(function (c) { return c.status === 'requested'; });
      case 'info': return r.status === 'info_requested';
      case 'rejected': return r.status === 'rejected';
      case 'suspended': return r.status === 'suspended';
      case 'expired': return r.premium === 'expired';
      default: return true;
    }
  }
  function match(r) {
    var f = FL, q = f.q.toLowerCase(), cs = r.courses || [];
    if (q && ((r.full_name || '') + ' ' + (r.email || '') + ' ' + (r.school_name || '')).toLowerCase().indexOf(q) < 0) return false;
    if (f.school && (r.school_name || '') !== f.school) return false;
    if (f.country && (r.country || '') !== f.country) return false;
    if (f.role && kind(r) !== f.role) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.member && r.premium !== f.member && !(f.member === 'premium' && r.premium === 'free_premium')) return false;
    if (f.pathway && !cs.some(function (c) { return c.pathway === f.pathway; })) return false;
    if (f.section && !cs.some(function (c) { return c.section === f.section; })) return false;
    if (f.subject && !cs.some(function (c) { return c.subject === f.subject && (!f.section || c.section === f.section); })) return false;
    if (f.from && r.created_at < f.from) return false;
    if (f.to && r.created_at > f.to + 'T23:59:59') return false;
    return true;
  }
  function uniq(k) { var o = {}; ROWS.forEach(function (r) { if (r[k]) o[r[k]] = 1; }); return Object.keys(o).sort(); }
  function draw() {
    var counts = {}; TABS.forEach(function (t) { counts[t[0]] = ROWS.filter(function (r) { return inTab(r, t[0]); }).length; });
    var h = '<section class="apx-hero"><p class="vx-eye">Admin</p><h1>✅ Approval Centre</h1><p>Approve accounts and subjects, set Free or Premium, and keep every account to one verified person. ' + counts.p_students + ' student' + (counts.p_students === 1 ? '' : 's') + ' and ' + counts.p_teachers + ' teacher' + (counts.p_teachers === 1 ? '' : 's') + ' are waiting.</p></section>' +
      '<nav class="apx-tabs" aria-label="Groups">' + TABS.map(function (t) { var n = counts[t[0]], hot = /^p_|subjects|info/.test(t[0]) && n;
        return '<button type="button" data-tab="' + t[0] + '" class="' + (TAB === t[0] ? 'on' : '') + (hot ? ' hot' : '') + '">' + t[1] + (['security', 'access', 'settings'].indexOf(t[0]) < 0 ? '<b>' + n + '</b>' : '') + '</button>'; }).join('') + '</nav><div id="apxb"></div>';
    app.innerHTML = h;
    app.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { TAB = b.getAttribute('data-tab'); SEL = {}; draw(); }; });
    if (TAB === 'security') return security(); if (TAB === 'access') return access(); if (TAB === 'settings') return settings();
    list();
  }
  function opts(arr, v, label) { return '<option value="">' + label + '</option>' + arr.map(function (x) { var k = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x; return '<option value="' + E(k) + '"' + (v === k ? ' selected' : '') + '>' + E(t) + '</option>'; }).join(''); }
  function list() {
    var box = app.querySelector('#apxb'), f = FL, secs = TREE.sections.filter(function (s) { return !f.pathway || s.pathway === f.pathway; });
    var rows = ROWS.filter(function (r) { return inTab(r, TAB) && match(r); });
    // groups by pathway and section, with counts (Cambridge: KS3, IGCSE, A Level; IB: MYP, IBDP)
    var g = '<div class="apx-grp" role="group" aria-label="Groups by pathway and section"><button type="button" data-g="" class="' + (!f.pathway && !f.section ? 'on' : '') + '">All</button>';
    [['cambridge', 'Cambridge'], ['ib', 'IB']].forEach(function (pw) {
      var base = ROWS.filter(function (r) { return inTab(r, TAB); });
      g += '<button type="button" data-g="' + pw[0] + '|" class="' + (f.pathway === pw[0] && !f.section ? 'on' : '') + '"><b>' + pw[1] + '</b> ' + base.filter(function (r) { return (r.courses || []).some(function (c) { return c.pathway === pw[0]; }); }).length + '</button>';
      TREE.sections.filter(function (s) { return s.pathway === pw[0]; }).forEach(function (s) {
        g += '<button type="button" data-g="' + pw[0] + '|' + s.section + '" class="' + (f.section === s.section ? 'on' : '') + '">' + E(s.name) + ' ' + base.filter(function (r) { return (r.courses || []).some(function (c) { return c.section === s.section; }); }).length + '</button>'; });
    });
    g += '</div>';
    box.innerHTML = g + '<div class="apx-f">' +
      '<input type="search" id="fq" placeholder="Search name, email, school" value="' + E(f.q) + '" aria-label="Search">' +
      '<select id="fschool" aria-label="School">' + opts(uniq('school_name'), f.school, 'Any school') + '</select>' +
      '<select id="fcountry" aria-label="Country">' + opts(uniq('country'), f.country, 'Any country') + '</select>' +
      '<select id="frole" aria-label="Role">' + opts([['student', 'Student'], ['independent', 'Independent learner'], ['teacher', 'Teacher']], f.role, 'Any role') + '</select>' +
      '<select id="fpathway" aria-label="Pathway">' + opts([['cambridge', 'Cambridge International'], ['ib', 'International Baccalaureate'], ['kenya', 'Kenya CBE (KICD)'], ['edexcel', 'Pearson Edexcel']], f.pathway, 'Any pathway') + '</select>' +
      '<select id="fsection" aria-label="Section">' + opts(secs.map(function (s) { return [s.section, s.name]; }), f.section, 'Any section') + '</select>' +
      '<select id="fsubject" aria-label="Subject">' + opts(Object.keys(SUBJ).map(function (k) { return [k, SUBJ[k]]; }), f.subject, 'Any subject') + '</select>' +
      '<select id="fstatus" aria-label="Approval status">' + opts(Object.keys(STAT).map(function (k) { return [k, STAT[k][0]]; }), f.status, 'Any status') + '</select>' +
      '<select id="fmember" aria-label="Membership">' + opts([['free', 'Free'], ['premium', 'Premium'], ['free_premium', 'Premium given free'], ['expired', 'Premium expired']], f.member, 'Any membership') + '</select>' +
      '<input type="date" id="ffrom" value="' + E(f.from) + '" aria-label="Registered from"><input type="date" id="fto" value="' + E(f.to) + '" aria-label="Registered until"></div>' +
      '<p class="apx-m">' + rows.length + ' ' + (rows.length === 1 ? 'person' : 'people') + '. Tick rows for bulk actions; open a name for every decision.</p>' +
      (rows.length ? '<div style="overflow:auto;max-height:70vh"><table class="apx-t"><thead><tr><th><input type="checkbox" id="sela" aria-label="Select all"></th><th>Name</th><th>Role</th><th>School · country</th><th>Subjects</th><th>Status</th><th>Membership</th><th>Registered</th></tr></thead><tbody>' +
        rows.map(function (r) { var s = STAT[r.status] || STAT.pending;
          return '<tr><td><input type="checkbox" data-sel="' + E(r.id) + '"' + (SEL[r.id] ? ' checked' : '') + ' aria-label="Select ' + E(r.full_name) + '"></td><td><a href="#" data-open="' + E(r.id) + '"><b>' + E(r.full_name || '—') + '</b></a><br><span class="apx-m">' + E(r.email || '') + '</span>' + (r.flags ? ' ' + pill('⚠ ' + r.flags + ' flag', 'q-n') : '') + '</td>' +
            '<td>' + E({ student: 'Student', independent: 'Independent', teacher: 'Teacher', admin: 'Admin' }[kind(r)]) + '</td><td>' + E(r.school_name || '—') + '<br><span class="apx-m">' + E(r.country || '') + '</span></td>' +
            '<td>' + (r.courses || []).map(function (c) { return pill(c.name, c.status === 'approved' ? 'q-ok' : c.status === 'requested' ? 'q-w' : 'q-n'); }).join('') + '</td>' +
            '<td>' + pill(s[0], s[1]) + (r.verified ? '' : '<br>' + pill('email not verified', 'q-w')) + (r.pending_classes ? '<br>' + pill(r.pending_classes + ' class request', 'q-i') : '') + '</td>' +
            '<td>' + member(r) + '</td><td class="apx-m">' + day(r.created_at) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="emptybox">Nobody here.</p>') +
      '<div class="apx-bulk" id="bulk" hidden><b id="bn"></b><button class="btn sm ok" data-bulk="approve">Approve</button><button class="btn sm" data-bulk="subjects">Approve their subjects</button>' +
      '<select id="bm" aria-label="Membership for selected"><option value="">Membership…</option><option value="free">Free</option><option value="1">Premium 1 month</option><option value="3">Premium 3 months</option><option value="6">Premium 6 months</option><option value="12">Premium 12 months</option></select>' +
      '<button class="btn sm" data-bulk="member">Set membership</button><button class="btn sm no" data-bulk="suspend">Suspend</button></div>';
    var on = function (id, k) { var el = box.querySelector(id); el.oninput = el.onchange = function () { FL[k] = el.value; if (k === 'pathway') FL.section = ''; clearTimeout(on.t); on.t = setTimeout(function () { list(); var x = box.querySelector(id); if (x && x.type === 'search') { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, el.type === 'search' ? 250 : 0); }; };
    on('#fq', 'q'); on('#fschool', 'school'); on('#fcountry', 'country'); on('#frole', 'role'); on('#fpathway', 'pathway'); on('#fsection', 'section'); on('#fsubject', 'subject'); on('#fstatus', 'status'); on('#fmember', 'member'); on('#ffrom', 'from'); on('#fto', 'to');
    box.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-g').split('|'); FL.pathway = v[0] || ''; FL.section = v[1] || ''; list(); }; });
    box.querySelectorAll('[data-open]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); detail(a.getAttribute('data-open')); }; });
    var bulk = function () { var n = Object.keys(SEL).filter(function (k) { return SEL[k]; }).length; box.querySelector('#bulk').hidden = !n; box.querySelector('#bn').textContent = n + ' selected'; };
    box.querySelectorAll('[data-sel]').forEach(function (c) { c.onchange = function () { SEL[c.getAttribute('data-sel')] = c.checked; bulk(); }; });
    var sa = box.querySelector('#sela'); if (sa) sa.onchange = function () { rows.forEach(function (r) { SEL[r.id] = sa.checked; }); box.querySelectorAll('[data-sel]').forEach(function (c) { c.checked = sa.checked; }); bulk(); };
    bulk();
    box.querySelectorAll('[data-bulk]').forEach(function (b) { b.onclick = function () { doBulk(b.getAttribute('data-bulk'), box.querySelector('#bm').value); }; });
  }
  function member(r) {
    if (r.premium === 'free_premium') return pill('Premium (free)', 'q-p');
    if (r.premium === 'premium') return pill('Premium', 'q-p') + '<br><span class="apx-m">until ' + day(r.premium_until) + '</span>';
    if (r.premium === 'expired') return pill('Expired', 'q-n') + '<br><span class="apx-m">' + day(r.premium_until) + '</span>';
    return pill('Free', 'q-i');
  }
  function doBulk(act, months) {
    var ids = Object.keys(SEL).filter(function (k) { return SEL[k]; }); if (!ids.length) return;
    var label = { approve: 'approve', subjects: 'approve the requested subjects of', member: 'change the membership of', suspend: 'suspend' }[act];
    if (act === 'member' && !months) return alertBox('Choose a membership first.');
    if (!confirm('Do you want to ' + label + ' ' + ids.length + ' account' + (ids.length === 1 ? '' : 's') + '?' + (act === 'approve' ? ' Accounts whose email is not verified will be approved too.' : ''))) return;
    var by = {}; ROWS.forEach(function (r) { by[r.id] = r; });
    var jobs = ids.map(function (id) { var r = by[id];
      if (act === 'approve') return S.db.rpc('admin_decide_account', { uid: id, act: 'approve', note: null, force: true });
      if (act === 'suspend') return S.db.rpc('admin_decide_account', { uid: id, act: 'suspend', note: null, force: false });
      if (act === 'subjects') return S.db.rpc('admin_set_courses', { uid: id, approve: (r.courses || []).filter(function (c) { return c.status === 'requested'; }).map(function (c) { return c.course; }), reject: [], add: [] });
      return months === 'free' ? S.db.rpc('admin_set_membership', { uid: id, kind: 'free' }) : S.db.rpc('admin_set_membership', { uid: id, kind: 'premium', months: +months });
    });
    Promise.all(jobs).then(function (res) { var bad = res.filter(function (x) { return x.error; }); SEL = {}; return reload().then(function () { draw(); if (bad.length) alertBox(bad.length + ' could not be changed: ' + S.nice(bad[0].error)); }); });
  }
  function alertBox(t) { window.alert(t); }

  // ---------- one person ----------
  function detail(id) {
    var r = ROWS.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    var d = document.createElement('div'); d.className = 'apx-d'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', r.full_name || 'Account');
    document.body.appendChild(d);
    var close = function () { d.remove(); document.removeEventListener('keydown', esc); }, esc = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc); d.onclick = function (e) { if (e.target === d) close(); };
    Promise.all([S.db.rpc('admin_account_history', { uid: id }), S.db.rpc('admin_sessions', { uid: id }), S.db.from('access_grants').select('*').eq('user_id', id)]).then(function (x) {
      var hist = x[0].data || [], sess = x[1].data || [], grants = x[2].data || [], s = STAT[r.status] || STAT.pending, k = kind(r);
      var have = {}; (r.courses || []).forEach(function (c) { have[c.course] = c.status; });
      d.innerHTML = '<div class="apx-dp"><div style="display:flex;justify-content:space-between;gap:10px"><div><h2>' + E(r.full_name || '—') + '</h2><p class="apx-m">' + E(r.email || '') + '</p></div><button class="btn sm" id="dx">Close ✕</button></div>' +
        '<div class="apx-sec"><h3>Registration</h3><p>' + pill(s[0], s[1]) + (r.verified ? pill('Email verified', 'q-ok') : pill('Email not verified', 'q-w')) + member(r) + '</p>' +
        '<p><b>Account:</b> ' + E({ student: 'Student', independent: 'Independent learner', teacher: 'Teacher', admin: 'Admin' }[k]) + ' · <b>School:</b> ' + E(r.school_name || '—') + ' · <b>Country:</b> ' + E(r.country || '—') + '<br><b>Registered:</b> ' + E(S.when(r.created_at)) + ' · <b>Last sign-in:</b> ' + E(r.last_sign_in ? S.when(r.last_sign_in) : 'never') + '</p>' +
        (r.info_request ? '<p><b>You asked:</b> ' + E(r.info_request) + '</p>' : '') + (r.status_note ? '<p><b>Their answer:</b> ' + E(r.status_note) + '</p>' : '') +
        '<label class="f" for="dn">Note (sent with Reject, Request information or Suspend)</label><textarea id="dn" rows="2" style="width:100%"></textarea>' +
        '<div class="apx-btns">' + (r.status !== 'approved' && r.status !== 'suspended' ? '<button class="btn sm ok" data-act="approve">Approve</button>' : '') + (r.status === 'suspended' ? '<button class="btn sm ok" data-act="reactivate">Reactivate</button>' : '') +
        (r.status !== 'rejected' && r.status !== 'approved' ? '<button class="btn sm no" data-act="reject">Reject</button>' : '') + (r.status !== 'approved' ? '<button class="btn sm" data-act="request_info">Request information</button>' : '') +
        (r.status === 'approved' ? '<button class="btn sm no" data-act="suspend">Suspend</button>' : '') + '</div><p class="msg" id="dm"></p></div>' +
        '<div class="apx-sec"><h3>Authorised subjects</h3><p class="apx-m">Only authorised subjects open: a student never sees other pathways, sections or subjects.</p>' + (r.courses || []).map(function (c) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0"><span>' + E(c.name) + ' ' + pill(c.status === 'approved' ? 'Authorised' : c.status === 'requested' ? 'Requested' : 'Refused', c.status === 'approved' ? 'q-ok' : c.status === 'requested' ? 'q-w' : 'q-n') + '</span><span class="apx-btns">' +
            (c.status !== 'approved' ? '<button class="btn sm ok" data-c-ok="' + E(c.course) + '">Authorise</button>' : '') + (c.status !== 'rejected' ? '<button class="btn sm" data-c-no="' + E(c.course) + '">Remove</button>' : '') + '</span></div>'; }).join('') +
        '<label class="f" for="dadd">Add a subject</label><select id="dadd"><option value="">Choose…</option>' + TREE.courses.filter(function (c) { return have[c.slug] !== 'approved'; }).map(function (c) {
          return '<option value="' + E(c.slug) + '">' + E((c.pathway === 'ib' ? 'IB' : c.pathway === 'kenya' ? 'Kenya CBE' : c.pathway === 'edexcel' ? 'Edexcel' : 'Cambridge') + ' · ' + c.name) + '</option>'; }).join('') + '</select><button class="btn sm" id="dadb">Add as authorised</button><p class="msg" id="dcm"></p></div>' +
        '<div class="apx-sec"><h3>Membership</h3><div class="apx-btns"><button class="btn sm" data-mem="free">Free</button>' + [1, 3, 6, 12].map(function (m) { return '<button class="btn sm" data-mem="' + m + '">Premium ' + m + ' month' + (m > 1 ? 's' : '') + '</button>'; }).join('') + '<button class="btn sm" data-mem="forever">Premium, no end date</button></div>' +
        '<p class="apx-m">Custom dates (for exceptions):</p><div class="apx-btns"><input type="date" id="ms" aria-label="Start"><input type="date" id="me" aria-label="End"><button class="btn sm" id="mcb">Set Premium for these dates</button></div><p class="msg" id="mm"></p>' +
        '<p class="apx-m">Premium ends automatically on its end date unless renewed. A payment, when online payment is used, renews it only after the payment is confirmed on the server.</p></div>' +
        '<div class="apx-sec"><h3>Extra access</h3><p class="apx-m">Premium-level access to one subject, topic, lesson or examination, within the person\'s authorised subjects.</p>' + (grants.length ? grants.map(function (g) {
          return '<div style="display:flex;justify-content:space-between;gap:8px"><span>' + E(g.scope + ': ' + g.ref) + (g.until ? ' · until ' + day(g.until) : '') + '</span><button class="btn sm" data-gx="' + E(g.scope + '|' + g.ref) + '">Remove</button></div>'; }).join('') : '<p class="apx-m">None.</p>') +
        '<div class="apx-btns"><select id="gs" aria-label="Kind"><option value="course">Subject (course code, e.g. igcse-bio-ext)</option><option value="page">Lesson page (e.g. /igbio-1-1/)</option><option value="topic">Topic (topic id)</option><option value="quiz">Examination (quiz id)</option></select>' +
        '<input id="gr" placeholder="Code, page or id" aria-label="What"><input type="date" id="gu" aria-label="Until (optional)"><button class="btn sm" id="gb">Give access</button></div><p class="msg" id="gm"></p></div>' +
        '<div class="apx-sec"><h3>Devices and security</h3>' + (sess.length ? sess.map(function (x) { return '<p class="apx-m">' + E(x.device.slice(0, 90)) + '<br>IP ' + E(x.ip || '—') + ' · signed in ' + E(S.when(x.started)) + ' · active ' + E(S.when(x.last_active)) + '</p>'; }).join('') : '<p class="apx-m">Not signed in anywhere.</p>') +
        '<div class="apx-btns"><button class="btn sm" id="sx">Sign out everywhere (requires sign-in again)</button><button class="btn sm" id="rp">Email a password reset link</button>' +
        '<label class="apx-m">Device limit <input type="number" id="dl" min="1" max="10" style="width:64px" placeholder="default"></label><button class="btn sm" id="dlb">Set</button></div><p class="msg" id="sm"></p></div>' +
        '<div class="apx-sec"><h3>History</h3>' + (hist.length ? hist.map(function (h) { return '<p class="apx-m"><b>' + E(S.when(h.at)) + '</b> · ' + E(h.action.replace(/_/g, ' ')) + ' · ' + E(h.actor || '') + (h.detail && Object.keys(h.detail).length ? ' · <code>' + E(JSON.stringify(h.detail).slice(0, 180)) + '</code>' : '') + '</p>'; }).join('') : '<p class="apx-m">Nothing yet.</p>') + '</div></div>';
      d.querySelector('#dx').onclick = close; d.querySelector('#dx').focus();
      var after = function (sel, okText) { return function (res) { if (res.error) { d.querySelector(sel).textContent = S.nice(res.error); return; } d.querySelector(sel).className = 'msg ok'; d.querySelector(sel).textContent = okText || 'Done.'; reload().then(function () { close(); draw(); detail(id); }); }; };
      d.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-act'), note = d.querySelector('#dn').value.trim();
        if (a === 'request_info' && note.length < 3) { d.querySelector('#dm').textContent = 'Write your question in the note first.'; return; }
        var force = false; if (a === 'approve' && !r.verified) { if (!confirm('This email address is not verified yet. Approve anyway?')) return; force = true; }
        if ((a === 'suspend' || a === 'reject') && !confirm((a === 'suspend' ? 'Suspend' : 'Reject') + ' ' + (r.full_name || 'this account') + '?')) return;
        S.db.rpc('admin_decide_account', { uid: id, act: a, note: note || null, force: force }).then(after('#dm')); }; });
      d.querySelectorAll('[data-c-ok]').forEach(function (b) { b.onclick = function () { S.db.rpc('admin_set_courses', { uid: id, approve: [b.getAttribute('data-c-ok')], reject: [], add: [] }).then(after('#dcm')); }; });
      d.querySelectorAll('[data-c-no]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this subject? Its materials close for this person.')) return; S.db.rpc('admin_set_courses', { uid: id, approve: [], reject: [b.getAttribute('data-c-no')], add: [] }).then(after('#dcm')); }; });
      d.querySelector('#dadb').onclick = function () { var v = d.querySelector('#dadd').value; if (!v) return; S.db.rpc('admin_set_courses', { uid: id, approve: [], reject: [], add: [v] }).then(after('#dcm')); };
      d.querySelectorAll('[data-mem]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-mem');
        S.db.rpc('admin_set_membership', v === 'free' ? { uid: id, kind: 'free' } : v === 'forever' ? { uid: id, kind: 'free_forever' } : { uid: id, kind: 'premium', months: +v }).then(after('#mm')); }; });
      d.querySelector('#mcb').onclick = function () { var a = d.querySelector('#ms').value, b = d.querySelector('#me').value; if (!a || !b) { d.querySelector('#mm').textContent = 'Choose both dates.'; return; }
        S.db.rpc('admin_set_membership', { uid: id, kind: 'premium', starts: a + 'T00:00:00Z', ends: b + 'T23:59:59Z', note: 'custom dates' }).then(after('#mm')); };
      d.querySelector('#gb').onclick = function () { var sc = d.querySelector('#gs').value, rf = d.querySelector('#gr').value.trim(), u = d.querySelector('#gu').value; if (!rf) return;
        if (sc === 'page' && !/^\/[a-z0-9-]+\/$/.test(rf)) { d.querySelector('#gm').textContent = 'A page looks like /igbio-1-1/.'; return; }
        S.db.rpc('admin_grant', { uid: id, g_scope: sc, g_ref: rf, g_until: u ? u + 'T23:59:59Z' : null, remove: false }).then(after('#gm')); };
      d.querySelectorAll('[data-gx]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-gx').split('|'); S.db.rpc('admin_grant', { uid: id, g_scope: v[0], g_ref: v[1], g_until: null, remove: true }).then(after('#gm')); }; });
      d.querySelector('#sx').onclick = function () { if (!confirm('Sign this account out on every device?')) return; S.db.rpc('admin_end_sessions', { uid: id }).then(after('#sm', 'Signed out everywhere.')); };
      d.querySelector('#rp').onclick = function () { if (!r.email || /@students\.biosciencevista\.com$/.test(r.email)) { d.querySelector('#sm').textContent = 'This account has no real email address.'; return; }
        S.db.auth.resetPasswordForEmail(r.email, { redirectTo: location.origin + '/login/?reset=1' }).then(function (x) { d.querySelector('#sm').textContent = x.error ? S.nice(x.error) : 'Reset link sent to ' + r.email + '.'; }); };
      d.querySelector('#dlb').onclick = function () { var v = d.querySelector('#dl').value; S.db.rpc('admin_set_device_limit', { uid: id, devices: v ? +v : null }).then(after('#sm', 'Device limit saved.')); };
    });
  }

  // ---------- security flags ----------
  function security() {
    var box = app.querySelector('#apxb'); box.innerHTML = '<p class="muted">Loading…</p>';
    S.db.rpc('admin_flags').then(function (r) { var fl = r.data || [];
      box.innerHTML = '<section class="panel"><h2>🛡 Possible shared accounts</h2><p class="apx-m">Flags are only for review: nobody is suspended automatically, because school networks, VPNs and changing connections are normal. Open the person to see their devices, sign them out everywhere, reset their password or suspend them.</p>' +
        (fl.length ? '<table class="apx-t"><thead><tr><th>When</th><th>Person</th><th>What</th><th>Review</th></tr></thead><tbody>' + fl.map(function (f) {
          var what = f.kind === 'simultaneous' ? 'Signed in at the same time from ' + (f.detail.networks || '?') + ' different networks on ' + (f.detail.devices || '?') + ' devices' : f.kind === 'many_devices' ? (f.detail.devices_7_days || '?') + ' different devices in 7 days' : f.kind;
          return '<tr><td class="apx-m">' + E(S.when(f.at)) + '</td><td><a href="#" data-open="' + E(f.user_id) + '">' + E(f.full_name || '—') + '</a></td><td>' + E(what) + '</td><td>' + (f.reviewed_at ? pill(f.outcome || 'Reviewed', 'q-ok') :
            '<span class="apx-btns"><button class="btn sm" data-rv="' + f.id + '|fine">Looks fine</button><button class="btn sm no" data-rv="' + f.id + '|warned">Warned</button></span>') + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="emptybox">No flags.</p>') + '</section>';
      box.querySelectorAll('[data-open]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); detail(a.getAttribute('data-open')); }; });
      box.querySelectorAll('[data-rv]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-rv').split('|'); S.db.rpc('admin_review_flag', { fid: +v[0], result: v[1] === 'fine' ? 'Looks fine' : 'Warned' }).then(security); }; });
    });
  }
  // ---------- Public content and access levels ----------
  var LV = [['public', '🌐 Public Access'], ['free', '🆓 Free Account Required'], ['premium', '⭐ Premium Access'], ['class', '🏫 Teacher/Class Access']];
  function access() {
    var box = app.querySelector('#apxb'); box.innerHTML = '<p class="muted">Loading…</p>';
    S.db.from('content_access').select('*').then(function (r) { var CA = {}; (r.data || []).forEach(function (x) { CA[x.scope + '|' + x.ref] = x.level; });
      var sel = function (scope, ref) { var v = CA[scope + '|' + ref] || ''; return '<select data-ca="' + E(scope + '|' + ref) + '" aria-label="Access level"><option value="">Default (' + (scope === 'quiz' ? 'class and course rules' : 'Premium') + ')</option>' + LV.map(function (l) { return '<option value="' + l[0] + '"' + (v === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select>'; };
      var secName = {}; TREE.sections.forEach(function (s) { secName[s.section] = s.name; });
      var h = '<section class="panel"><h2>🔓 Public content and access levels</h2><p class="apx-m">The server checks these on every page: <b>Public</b> opens without an account; <b>Free</b> opens for approved accounts authorised for the subject; <b>Premium</b> needs Premium in that subject; <b>Class</b> opens only through an approved teacher\'s class. The most specific setting wins (lesson, then topic, then subject).</p>' +
        '<h3>Whole subjects</h3><table class="apx-t"><thead><tr><th>Pathway · section</th><th>Subject and level</th><th>Lessons</th><th>Access</th></tr></thead><tbody>' + TREE.courses.map(function (c) {
          return '<tr><td>' + E((c.pathway === 'ib' ? 'IB' : c.pathway === 'kenya' ? 'Kenya CBE' : c.pathway === 'edexcel' ? 'Edexcel' : 'Cambridge') + ' · ' + (secName[c.section] || '')) + '</td><td>' + E(c.name) + '</td><td>' + (c.lessons || 0) + '</td><td>' + sel('course', c.slug) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3 style="margin-top:16px">One lesson, file or examination</h3><div class="apx-btns"><input id="aq" placeholder="Search lessons and examinations by title" style="min-width:280px"><button class="btn sm" id="aqb">Search</button></div><div id="aqr"></div>' +
        '<h3 style="margin-top:16px">Set individually</h3>' + Object.keys(CA).filter(function (k) { return k.indexOf('course|') !== 0; }).map(function (k) { var p = k.split('|'); return '<p>' + E(p[0] + ': ' + p[1]) + ' ' + sel(p[0], p[1]) + '</p>'; }).join('') + '</section>';
      box.innerHTML = h;
      var bind = function (root) { root.querySelectorAll('[data-ca]').forEach(function (s) { s.onchange = function () { var v = s.getAttribute('data-ca').split('|');
        if (s.value === 'public' && !confirm('Make this open to anyone on the internet, with no account?')) { s.value = CA[v[0] + '|' + v[1]] || ''; return; }
        S.db.rpc('set_content_access', { c_scope: v[0], c_ref: v[1], c_level: s.value || null }).then(function (x) { if (x.error) alertBox(S.nice(x.error)); else CA[v[0] + '|' + v[1]] = s.value; }); }; }); };
      bind(box);
      box.querySelector('#aqb').onclick = function () { var q = box.querySelector('#aq').value.trim(); if (q.length < 2) return;
        Promise.all([S.db.from('materials').select('path,title,subject').ilike('title', '%' + q + '%').limit(25), S.db.from('quizzes').select('id,title,category').ilike('title', '%' + q + '%').is('deleted_at', null).limit(25)]).then(function (x) {
          var out = box.querySelector('#aqr');
          out.innerHTML = '<table class="apx-t"><tbody>' + (x[0].data || []).map(function (m) { return '<tr><td>📄 ' + E(m.title) + '<br><span class="apx-m">' + E(m.subject || '') + ' · ' + E(m.path) + '</span></td><td>' + sel('page', m.path) + '</td></tr>'; }).join('') +
            (x[1].data || []).map(function (z) { return '<tr><td>📝 ' + E(z.title) + '<br><span class="apx-m">' + E(z.category || 'quiz') + '</span></td><td>' + sel('quiz', z.id) + '</td></tr>'; }).join('') + '</tbody></table>';
          bind(out); }); };
    });
  }
  function settings() {
    var box = app.querySelector('#apxb'); box.innerHTML = '<p class="muted">Loading…</p>';
    S.db.from('security_settings').select('*').eq('id', 1).maybeSingle().then(function (r) { var s = r.data || { max_devices: 3, idle_days: 14, flag_window_minutes: 30 };
      box.innerHTML = '<section class="panel"><h2>⚙ Sign-in and security settings</h2>' +
        '<label class="f">Devices that can stay signed in at once (per account)<input type="number" id="s1" min="1" max="10" value="' + s.max_devices + '"></label>' +
        '<label class="f">Sign out sessions not used for this many days<input type="number" id="s2" min="1" max="90" value="' + s.idle_days + '"></label>' +
        '<label class="f">Flag sign-ins from different networks within (minutes)<input type="number" id="s3" min="5" max="240" value="' + s.flag_window_minutes + '"></label>' +
        '<button class="btn main" id="ssb">Save</button><p class="msg" id="ssm"></p>' +
        '<p class="apx-m">Passwords are stored by the sign-in service with strong hashing, never on this site. Repeated wrong passwords are slowed down by the sign-in service. People can turn on two-step sign-in on their Account page.</p></section>';
      box.querySelector('#ssb').onclick = function () { S.db.rpc('admin_security_settings', { devices: +box.querySelector('#s1').value, idle: +box.querySelector('#s2').value, win: +box.querySelector('#s3').value }).then(function (x) {
        var m = box.querySelector('#ssm'); m.textContent = x.error ? S.nice(x.error) : 'Saved.'; m.className = 'msg' + (x.error ? '' : ' ok'); }); };
    });
  }
})();
