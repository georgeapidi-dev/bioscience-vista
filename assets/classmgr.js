/* My classes: codes, join requests and members · BioscienceVista · by BioscienceVista (22 Nov 2026, migration 078)
   Teachers create classes only in the subjects the admin authorised. Each class has a code that can be renewed, revoked or
   given an end date. A student who types the code sends a request; the teacher approves or rejects it here. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var CSS = '.cm-hero{padding:22px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#f97316,#db2777 55%,#7c3aed);margin:0 0 14px}.cm-hero h1{margin:0;color:#fff}.cm-hero p{margin:4px 0 0;color:#fff}' +
    '.cm-c{background:var(--card,#fff);border:1px solid var(--line,#e2e8f0);border-radius:18px;padding:16px;margin:0 0 14px}.cm-c h2{margin:0 0 4px;font-size:1.2rem}' +
    '.cm-code{font:800 1.5rem ui-monospace,Menlo,monospace;letter-spacing:.2em;background:#fff7ed;border:2px dashed #fdba74;border-radius:12px;padding:6px 12px;display:inline-block}' +
    '.cm-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:7px 0;border-top:1px dashed #e2e8f0;flex-wrap:wrap}.cm-m{color:#64748b;font-size:.87rem}' +
    '.cm-p{display:inline-block;padding:2px 8px;border-radius:999px;font-weight:800;font-size:.75rem;margin-left:4px}.c-ok{background:#dcfce7;color:#166534}.c-w{background:#fef3c7;color:#92400e}.c-n{background:#fee2e2;color:#991b1b}' +
    '.cm-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.cm-g input,.cm-g select,.cm-c textarea{font:inherit;padding:8px;border:1px solid #cbd5e1;border-radius:10px;width:100%}.cm-b{display:flex;gap:6px;flex-wrap:wrap}.cm-b .btn{margin:0}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var ME = null, CAT = {};
  S.guard(app, { school: true, anyone: true }).then(function (me) { ME = me; if (!me.school && !me.staff) { app.innerHTML = '<section class="panel"><h2>Teachers only</h2><p><a href="/dashboard/">Go to your dashboard</a></p></section>'; return; } return load(); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  function load() {
    return Promise.all([
      S.db.from('classes').select('id,name,course,join_code,code_revoked,code_expires_at,capacity,academic_year,description,active,created_at').eq('teacher_id', ME.user.id).eq('owner_kind', 'school').is('deleted_at', null).is('archived_at', null).order('created_at'),
      S.db.from('teacher_courses').select('course,status').eq('teacher_id', ME.user.id), S.db.rpc('academic_tree')
    ]).then(function (x) {
      (x[2].data && x[2].data.courses || []).forEach(function (c) { CAT[c.slug] = c; });
      var cls = x[0].data || [], mine = (x[1].data || []).filter(function (t) { return t.status === 'approved'; }).map(function (t) { return t.course; });
      var ids = cls.map(function (c) { return c.id; });
      return (ids.length ? S.db.from('enrolments').select('id,student_id,class_id,status,requested_at').in('class_id', ids).in('status', ['pending', 'approved']) : Promise.resolve({ data: [] })).then(function (en) {
        var sids = (en.data || []).map(function (e) { return e.student_id; });
        return Promise.all([sids.length ? S.db.from('profiles').select('id,full_name,account_status').in('id', sids) : { data: [] }, sids.length ? S.db.from('account_courses').select('user_id,course,status').in('user_id', sids) : { data: [] }])
          .then(function (y) { draw(cls, mine, en.data || [], y[0].data || [], y[1].data || []); });
      });
    });
  }
  function draw(cls, mine, en, people, acs) {
    var P = {}; people.forEach(function (p) { P[p.id] = p; }); var AC = {}; acs.forEach(function (a) { AC[a.user_id + '|' + a.course] = a.status; });
    var h = '<section class="cm-hero"><p class="vx-eye">Teacher</p><h1>🏫 Class codes and join requests</h1><p>Share a class code with your students. Each student who types it sends you a request; only the students you approve join the class.</p></section>';
    h += cls.map(function (c) {
      var req = en.filter(function (e) { return e.class_id === c.id && e.status === 'pending'; }), mem = en.filter(function (e) { return e.class_id === c.id && e.status === 'approved'; });
      var expired = c.code_expires_at && new Date(c.code_expires_at) < new Date(), course = CAT[c.course] || {};
      return '<section class="cm-c"><h2>' + E(c.name) + '</h2><p class="cm-m">' + E(course.name || c.course || '') + (c.academic_year ? ' · ' + E(c.academic_year) : '') + ' · ' + mem.length + (c.capacity ? ' of ' + c.capacity : '') + ' students</p>' +
        '<p>Class code: <span class="cm-code">' + E(c.join_code || '—') + '</span> ' + (c.code_revoked ? '<span class="cm-p c-n">Revoked</span>' : expired ? '<span class="cm-p c-n">Expired</span>' : c.code_expires_at ? '<span class="cm-p c-w">Works until ' + E(new Date(c.code_expires_at).toLocaleDateString()) + '</span>' : '<span class="cm-p c-ok">Active</span>') + '</p>' +
        '<div class="cm-b"><button class="btn sm" data-code="' + c.id + '|new">New code</button><button class="btn sm" data-code="' + c.id + '|revoke">Revoke code</button>' +
        '<label class="cm-m">Code works for <select data-exp="' + c.id + '"><option value="">no limit</option><option>7</option><option>14</option><option>30</option><option>90</option></select> days</label><button class="btn sm" data-code="' + c.id + '|expire">Set</button></div>' +
        '<h3 style="margin:14px 0 4px">Join requests ' + (req.length ? '<span class="cm-p c-w">' + req.length + '</span>' : '') + '</h3>' +
        (req.length ? req.map(function (e) { var p = P[e.student_id] || {}, au = AC[e.student_id + '|' + c.course];
          return '<div class="cm-row"><span><b>' + E(p.full_name || 'Student') + '</b> <span class="cm-m">asked ' + E(S.when(e.requested_at)) + '</span>' +
            (p.account_status !== 'approved' ? '<span class="cm-p c-w">account waiting for admin</span>' : '') + (au !== 'approved' ? '<span class="cm-p c-w">subject waiting for admin</span>' : '') + '</span>' +
            '<span class="cm-b"><button class="btn sm" style="background:#16a34a;color:#fff" data-dec="' + e.id + '|1">Approve</button><button class="btn sm" data-dec="' + e.id + '|0">Reject</button></span></div>'; }).join('') : '<p class="cm-m">No requests waiting.</p>') +
        '<details style="margin-top:8px"><summary><b>Members (' + mem.length + ')</b></summary>' + mem.map(function (e) { var p = P[e.student_id] || {};
          return '<div class="cm-row"><span>' + E(p.full_name || 'Student') + '</span><button class="btn sm" data-rm="' + e.id + '">Remove from class</button></div>'; }).join('') + '</details>' +
        '<details style="margin-top:8px"><summary><b>Class settings</b></summary><div class="cm-g" style="margin-top:8px"><label class="cm-m">Academic year<input data-yr="' + c.id + '" value="' + E(c.academic_year || '') + '" placeholder="2026–2027"></label>' +
        '<label class="cm-m">Maximum students<input type="number" min="1" max="500" data-cap="' + c.id + '" value="' + E(c.capacity || '') + '"></label></div><label class="cm-m">Description<textarea rows="2" data-ds="' + c.id + '">' + E(c.description || '') + '</textarea></label>' +
        '<button class="btn sm" data-save="' + c.id + '">Save settings</button></details><p class="msg" id="m' + c.id + '"></p></section>';
    }).join('') || '<p class="emptybox">You have no classes yet.</p>';
    h += '<section class="cm-c"><h2>➕ New class</h2>' + (mine.length ? '<p class="cm-m">You can create classes only in the subjects the admin authorised for you.</p><div class="cm-g"><label class="cm-m">Class name<input id="nn" placeholder="IBDP Biology 2027 – Group A"></label>' +
      '<label class="cm-m">Subject<select id="nc">' + mine.map(function (k) { return '<option value="' + E(k) + '">' + E((CAT[k] || {}).name || k) + '</option>'; }).join('') + '</select></label><label class="cm-m">Academic year<input id="ny" placeholder="2026–2027"></label>' +
      '<label class="cm-m">Maximum students<input id="nm" type="number" min="1" max="500"></label></div><label class="cm-m">Description<textarea id="nd" rows="2"></textarea></label><button class="btn main" id="nb">Create class</button><p class="msg" id="nmsg"></p>' :
      '<p>No subject is authorised for you yet. The admin authorises the subjects you registered with; ask for another one on your <a href="/account/">Account page</a>.</p>') + '</section>';
    app.innerHTML = h;
    var res = function (id) { return function (r) { if (r.error) { var m = app.querySelector('#m' + id) || app.querySelector('#nmsg'); if (m) m.textContent = S.nice(r.error); return; } load(); }; };
    app.querySelectorAll('[data-code]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-code').split('|'), days = app.querySelector('[data-exp="' + v[0] + '"]').value;
      if (v[1] === 'revoke' && !confirm('Revoke this code? Students cannot use it any more (members stay in the class).')) return;
      S.db.rpc('class_code_set', { cid: v[0], act: v[1], days: days ? +days : null }).then(res(v[0])); }; });
    app.querySelectorAll('[data-dec]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-dec').split('|'); S.db.rpc('decide_enrolment', { eid: v[0], approve: v[1] === '1' }).then(function (r) { if (r.error) return window.alert(S.nice(r.error)); load(); }); }; });
    app.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { if (!confirm('Remove this student from the class? Their past work and marks are kept.')) return; S.db.rpc('decide_enrolment', { eid: b.getAttribute('data-rm'), approve: false }).then(function () { load(); }); }; });
    app.querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-save'), cap = app.querySelector('[data-cap="' + id + '"]').value;
      S.db.rpc('class_settings_set', { cid: id, yr: app.querySelector('[data-yr="' + id + '"]').value, cap: cap ? +cap : null, descr: app.querySelector('[data-ds="' + id + '"]').value }).then(res(id)); }; });
    var nb = app.querySelector('#nb'); if (nb) nb.onclick = function () { var n = app.querySelector('#nn').value.trim(), cap = app.querySelector('#nm').value;
      if (n.length < 3) { app.querySelector('#nmsg').textContent = 'Give the class a name.'; return; }
      nb.disabled = true;
      S.db.rpc('create_school_class', { nm: n, course_slug: app.querySelector('#nc').value, descr: app.querySelector('#nd').value || null, is_listed: false }).then(function (r) { nb.disabled = false;
        if (r.error) { app.querySelector('#nmsg').textContent = S.nice(r.error); return; }
        S.db.rpc('class_settings_set', { cid: r.data, yr: app.querySelector('#ny').value, cap: cap ? +cap : null, descr: app.querySelector('#nd').value }).then(function () { return S.db.rpc('class_code_set', { cid: r.data, act: 'new', days: null }); }).then(load); }); };
  }
})();
