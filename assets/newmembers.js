/* VistaEd · New members (24 Nov 2026, migration 093). By George Apidi.
   Everyone gets in at sign-up. The admin sees who joined in the last 30 days and can give or remove premium, pause, reactivate
   or delete an account, and turn "All courses free for members" on or off. Used by the Admin page and the Approval Centre. */
(function () {
  /* New members (24 Nov 2026, migration 093): everyone gets in at sign-up with free access; the admin sees who joined and can
     give premium, pause or delete. The switch "Free for members" waives Premium while it is on; members still open only the courses they registered for (migration 098). */
  window.BVNEW = function (box, S) {
    var E = S.E;
    S.db.rpc('admin_members').then(function (r0) { var mem = r0.data || [];
    var since = Date.now() - 30 * 864e5, list = mem.filter(function (m) { return m.created_at && new Date(m.created_at).getTime() >= since && (m.account_type === 'student' || m.account_type === 'teacher'); });
    var ids = list.map(function (m) { return m.id; });
    Promise.all([S.db.from('app_settings').select('v').eq('k', 'all_free').maybeSingle(),
                 ids.length ? S.db.from('profiles').select('id,account_status,premium_free,premium_until,learner_kind,school_name,country').in('id', ids) : Promise.resolve({ data: [] })]).then(function (x) {
      var free = !(x[0].data && x[0].data.v === 'off'), P = {}; (x[1].data || []).forEach(function (p) { P[p.id] = p; });
      var prem = function (p) { return p && (p.premium_free || (p.premium_until && new Date(p.premium_until) > new Date())); };
      box.innerHTML = '<section class="panel" style="border-left:6px solid #4f46e5;margin:0 0 14px"><h3 style="margin-top:0">🆕 New members <span class="small muted">last 30 days · ' + list.length + '</span></h3>' +
        '<label class="chk" style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:' + (free ? '#ecfdf5' : '#fff7ed') + ';border:1px solid ' + (free ? '#a7f3d0' : '#fed7aa') + '"><input type="checkbox" id="allfree"' + (free ? ' checked' : '') + ' style="width:20px;height:20px;margin-top:2px">' +
        '<span><b>Free for members (no Premium needed)</b><br><span class="small">' + (free ? 'On: members open the courses they registered for, and the pages that go with them, free of charge. Nobody needs approval to join.' : 'Off: members open the courses they registered for, and the pages that go with them, during their 30-day free trial or with Premium. Aga Khan Academy members stay free.') + ' Members never open courses they did not register for.</span></span></label>' +
        '<p class="small muted">People get in as soon as they sign up; you are emailed about each one. Joining a teacher\'s class still needs that teacher\'s yes.</p>' +
        (list.length ? list.map(function (m) { var p = P[m.id] || {}, paused = p.account_status === 'suspended', pr = prem(p);
          return '<div class="row2" style="padding:8px 0;border-bottom:1px solid var(--line);gap:8px"><span><b>' + E(m.full_name || '(no name)') + '</b> ' +
            '<span class="pill">' + (m.account_type === 'teacher' ? 'teacher' : p.learner_kind === 'independent' ? 'independent learner' : 'student') + '</span> ' +
            (paused ? '<span class="pill" style="background:#fee2e2;color:#991b1b">paused</span> ' : '') + (pr ? '<span class="pill ok">⭐ premium</span>' : '') +
            '<br><span class="small muted">' + E(m.email || '') + (p.school_name ? ' · ' + E(p.school_name) : '') + (p.country ? ' · ' + E(p.country) : '') + ' · joined ' + E(S.when(m.created_at)) + (m.classes ? ' · ' + E(m.classes) : '') + '</span></span>' +
            '<span class="cta">' + (pr ? '<button class="btn sm" data-nmprem="0" data-id="' + m.id + '">Remove premium</button>' : '<button class="btn main sm" data-nmprem="1" data-id="' + m.id + '">⭐ Give premium</button>') +
            (paused ? '<button class="btn sm" data-nmact="reactivate" data-id="' + m.id + '">▶ Reactivate</button>' : '<button class="btn sm" data-nmact="suspend" data-id="' + m.id + '">⏸ Pause</button>') +
            '<button class="btn sm" data-del="' + m.id + '">🗑 Delete account</button></span></div>'; }).join('') : '<p class="small muted">Nobody new in the last 30 days.</p>') + '</section>';
      var again = function () { window.BVNEW(box, S); };
      box.querySelector('#allfree').onchange = function (e) { var on = e.target.checked;
        S.db.from('app_settings').upsert({ k: 'all_free', v: on ? 'on' : 'off' }).then(function (r) { if (r.error) { e.target.checked = !on; return alert(S.nice(r.error)); } again(); }); };
      box.querySelectorAll('[data-nmprem]').forEach(function (b) { b.onclick = function () { b.disabled = true;
        S.db.rpc('set_premium', { uid: b.getAttribute('data-id'), free: b.getAttribute('data-nmprem') === '1' }).then(function (r) { if (r.error) { b.disabled = false; return alert(S.nice(r.error)); } again(); }); }; });
      box.querySelectorAll('[data-nmact]').forEach(function (b) { b.onclick = function () { b.disabled = true;
        S.db.rpc('admin_decide_account', { uid: b.getAttribute('data-id'), act: b.getAttribute('data-nmact') }).then(function (r) { if (r.error) { b.disabled = false; return alert(S.nice(r.error)); } again(); }); }; });
      box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Click again: delete forever'; setTimeout(function () { delete b.dataset.sure; b.textContent = '🗑 Delete account'; }, 5000); return; }
        b.disabled = true; S.db.rpc('delete_account', { uid: b.getAttribute('data-del') }).then(function (r) { if (r.error) { b.disabled = false; return alert(S.nice(r.error)); } again(); }); }; });
    });
    });
  };
})();
