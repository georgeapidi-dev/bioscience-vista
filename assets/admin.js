/* Learnova · admin: join requests, members and free access, teacher approvals, payments (PayPal and M-Pesa), prices and settings. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), TAB = (location.hash.slice(1) || 'requests');
  S.guard(app, { staff: true }).then(function (me) {
    if (!me.admin) { app.innerHTML = '<section class="panel"><h2>Admin only</h2><p><a href="/staff/">Back to the teacher dashboard</a></p></section>'; return; }
    draw();
  }).catch(function () {});
  var TABS = [['requests', '🙋 Join requests'], ['members', '👥 Members & access'], ['teachers', '🧑‍🏫 Teachers'], ['payments', '💳 Payments'], ['settings', '⚙️ Prices & settings']];
  function draw() {
    app.innerHTML = '<div class="row2"><div><p class="label">Admin</p><h2>Learnova admin</h2></div><div class="cta"><a class="btn sm" href="/staff/">Teacher dashboard</a></div></div>' +
      '<div class="cta" role="tablist">' + TABS.map(function (t) { return '<button type="button" class="btn sm' + (TAB === t[0] ? ' main' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><section class="panel grp" id="tab"><p class="muted small">Loading…</p></section>';
    app.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { TAB = b.getAttribute('data-t'); history.replaceState(null, '', '#' + TAB); draw(); }; });
    ({ requests: requests, members: members, teachers: teachers, payments: payments, settings: settings })[TAB](app.querySelector('#tab'));
  }
  function fail(t, r) { t.innerHTML = '<p class="msg">' + E(S.nice(r.error)) + '</p>'; }
  function requests(t) {
    S.db.rpc('my_join_requests').then(function (r) {
      if (r.error) return fail(t, r);
      var rows = r.data || [];
      t.innerHTML = '<h3>Students asking to join (' + rows.length + ')</h3><p class="small">You approve every student, including those in other teachers\' classes. <b>Approve + free</b> also gives that student free access, so they can join without paying.</p>' + (rows.length ? '<label class="chk"><input type="checkbox" id="all"> Select all</label>' + rows.map(function (x) {
        return '<div class="row2" style="padding:6px 0;border-bottom:1px solid var(--line)"><label class="chk"><input type="checkbox" data-sel="' + x.id + '"> <b>' + E(x.full_name || 'Student') + '</b> → ' + E(x.class_name) + ' <span class="small muted">' + E(x.school || '') + ' · ' + E(S.when(x.requested_at)) + '</span> ' +
          (x.status === 'teacher_ok' ? '<span class="pill ok">teacher said yes</span> ' : x.school !== 'Learnova' ? '<span class="pill">teacher has not answered</span> ' : '') +
          (x.premium ? '<span class="pill ok">premium</span>' : '<span class="pill">no premium</span>') + '</label><span class="cta"><button class="btn main sm" data-ok="' + x.id + '">Approve</button>' +
          (x.premium ? '' : '<button class="btn sm" data-free="' + x.id + '">Approve + free</button>') + '<button class="btn sm" data-no="' + x.id + '">Decline</button></span></div>'; }).join('') +
        '<div class="cta" style="margin-top:10px"><button class="btn main sm" id="okall">Approve selected</button><button class="btn sm" id="noall">Decline selected</button></div>' : '<p class="small muted">No requests waiting.</p>') +
        '<p class="small muted">A student also needs premium (paid, or free access from the Members tab) to open materials.</p>';
      var go = function (ids, ok, free) { Promise.all(ids.map(function (i) { return S.db.rpc('decide_enrolment', { eid: i, approve: ok, give_free: !!free }); })).then(function (rs) { var e = rs.filter(function (z) { return z.error; })[0]; if (e) alert(S.nice(e.error)); requests(t); }); };
      t.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { go([b.getAttribute('data-ok')], true); }; });
      t.querySelectorAll('[data-no]').forEach(function (b) { b.onclick = function () { go([b.getAttribute('data-no')], false); }; });
      t.querySelectorAll('[data-free]').forEach(function (b) { b.onclick = function () { MEM = null; go([b.getAttribute('data-free')], true, true); }; });
      var sel = function () { return [].map.call(t.querySelectorAll('[data-sel]:checked'), function (b) { return b.getAttribute('data-sel'); }); };
      var a = t.querySelector('#all'); if (a) a.onchange = function () { t.querySelectorAll('[data-sel]').forEach(function (b) { b.checked = a.checked; }); };
      var oa = t.querySelector('#okall'); if (oa) { oa.onclick = function () { var s = sel(); if (s.length) go(s, true); }; t.querySelector('#noall').onclick = function () { var s = sel(); if (s.length && confirm('Decline ' + s.length + ' requests?')) go(s, false); }; }
    });
  }
  var MEM = null;
  function members(t) {
    (MEM ? Promise.resolve({ data: MEM }) : S.db.rpc('admin_members')).then(function (r) {
      if (r.error) return fail(t, r);
      MEM = r.data || [];
      t.innerHTML = '<p class="small">Give free access to anyone you choose (it lasts until you remove it), or add paid time by hand. Students who were approved before premium started have free access.</p>' +
        '<div class="two"><label class="f">Search<input id="mq" placeholder="name, email or class"></label><label class="f">Show<select id="mf"><option value="">Everyone</option><option value="student">Students</option><option value="teacher">Teachers</option><option value="nopremium">Without premium</option><option value="pending">With join requests</option></select></label></div><div id="ml"></div>';
      var now = new Date();
      var list = function () {
        var q = t.querySelector('#mq').value.trim().toLowerCase(), f = t.querySelector('#mf').value;
        var rows = MEM.filter(function (m) { var prem = m.premium_free || (m.premium_until && new Date(m.premium_until) > now);
          return (!q || ((m.full_name || '') + ' ' + (m.email || '') + ' ' + (m.classes || '')).toLowerCase().indexOf(q) >= 0) &&
            (!f || (f === 'nopremium' ? !prem : f === 'pending' ? m.pending > 0 : m.account_type === f)); });
        t.querySelector('#ml').innerHTML = '<p class="small muted">' + rows.length + ' accounts</p>' + rows.slice(0, 300).map(function (m) {
          var paid = m.premium_until && new Date(m.premium_until) > now;
          return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row2"><span><b>' + E(m.full_name || '–') + '</b> <span class="small muted">' + E(m.email) + ' · ' + E(m.account_type) + '</span><br><span class="small">' + E(m.classes || 'no class') + '</span></span>' +
            '<span class="cta">' + (m.premium_free ? '<span class="pill ok">free access</span>' : paid ? '<span class="pill ok">paid to ' + E(new Date(m.premium_until).toLocaleDateString()) + '</span>' : '<span class="pill">no premium</span>') +
            '<button class="btn sm' + (m.premium_free ? '' : ' main') + '" data-free="' + m.id + '" data-v="' + (m.premium_free ? 0 : 1) + '">' + (m.premium_free ? 'Remove free access' : 'Give free access') + '</button>' +
            '<button class="btn sm" data-add="' + m.id + '">＋ Months</button></span></div></div>'; }).join('');
        t.querySelectorAll('[data-free]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-free'), v = b.getAttribute('data-v') === '1';
          S.db.rpc('set_premium', { uid: id, free: v }).then(function (x) { if (x.error) return alert(S.nice(x.error)); MEM.forEach(function (m) { if (m.id === id) m.premium_free = v; }); list(); }); }; });
        t.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-add'), n = parseInt(prompt('Add how many months of premium?', '4'), 10); if (!(n > 0 && n <= 24)) return;
          var m = MEM.filter(function (z) { return z.id === id; })[0], from = m.premium_until && new Date(m.premium_until) > now ? new Date(m.premium_until) : new Date(); from.setMonth(from.getMonth() + n);
          S.db.rpc('set_premium', { uid: id, free: !!m.premium_free, until: from.toISOString() }).then(function (x) { if (x.error) return alert(S.nice(x.error)); m.premium_until = from.toISOString(); list(); }); }; });
      };
      t.querySelector('#mq').oninput = list; t.querySelector('#mf').onchange = list; list();
    });
  }
  function teachers(t) {
    S.db.rpc('admin_members').then(function (r) {
      if (r.error) return fail(t, r);
      var rows = (r.data || []).filter(function (m) { return m.account_type === 'teacher' && m.teacher_status; });
      t.innerHTML = '<p class="small">Teachers from other schools and private tutors. An approved teacher with premium can create their own classes, add Learnova lessons and published quizzes to them, and see only their own students. They cannot change anything on the main site.</p>' +
        (rows.length ? rows.map(function (m) { return '<div class="row2" style="padding:8px 0;border-bottom:1px solid var(--line)"><span><b>' + E(m.full_name) + '</b> <span class="small muted">' + E(m.email) + ' · signed up ' + E(new Date(m.created_at).toLocaleDateString()) + '</span><br>' +
          '<span class="pill' + (m.teacher_status === 'approved' ? ' ok' : '') + '">' + E(m.teacher_status) + '</span></span><span class="cta">' + (m.teacher_status !== 'approved' ? '<button class="btn main sm" data-ok="' + m.id + '">Approve</button>' : '') +
          (m.teacher_status !== 'rejected' ? '<button class="btn sm" data-no="' + m.id + '">' + (m.teacher_status === 'approved' ? 'Remove teacher access' : 'Decline') + '</button>' : '') + '</span></div>'; }).join('') : '<p class="small muted">No teacher sign-ups yet.</p>');
      t.querySelectorAll('[data-ok],[data-no]').forEach(function (b) { b.onclick = function () { var ok = b.hasAttribute('data-ok'); if (!ok && !confirm('Remove this teacher\'s access? Their classes stay but they cannot manage them.')) return;
        S.db.rpc('decide_teacher', { uid: b.getAttribute(ok ? 'data-ok' : 'data-no'), approve: ok }).then(function (x) { if (x.error) return alert(S.nice(x.error)); MEM = null; teachers(t); }); }; });
    });
  }
  function payments(t) {
    S.db.rpc('admin_payments').then(function (r) {
      if (r.error) return fail(t, r);
      var rows = r.data || [], wait = rows.filter(function (y) { return y.method === 'mpesa' && y.status === 'pending'; });
      t.innerHTML = '<h3>M-Pesa payments to check (' + wait.length + ')</h3><p class="small">Find the code in the M-Pesa messages on your phone and check the amount before confirming. Confirming starts the premium time straight away.</p>' +
        (wait.length ? wait.map(function (y) { return '<div class="row2" style="padding:8px 0;border-bottom:1px solid var(--line)"><span><b>' + E(y.mpesa_code) + '</b> · KES ' + E(Number(y.amount).toLocaleString()) + ' · ' + E(y.plan) + '<br><span class="small">' + E(y.full_name || '') + ' (' + E(y.email || '') + ') · paid from ' + E(y.payer_phone || '') + (y.payer_name ? ' · ' + E(y.payer_name) : '') + ' · ' + E(S.when(y.created_at)) + '</span></span>' +
          '<span class="cta"><button class="btn main sm" data-ok="' + E(y.reference) + '">Confirm</button><button class="btn sm" data-no="' + E(y.reference) + '">Not received</button></span></div>'; }).join('') : '<p class="small muted">Nothing waiting.</p>') +
        '<h3>All payments</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Date</th><th>Name</th><th>Plan</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
        rows.map(function (y) { return '<tr><td>' + E(new Date(y.created_at).toLocaleDateString()) + '</td><td>' + E(y.full_name || '') + '</td><td>' + E(y.plan || '') + '</td><td>' + E(y.method === 'mpesa' ? 'M-Pesa ' + (y.mpesa_code || '') : 'PayPal') + '</td><td>' + E(y.currency + ' ' + Number(y.amount).toLocaleString()) + '</td><td>' + E(y.status) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      t.querySelectorAll('[data-ok],[data-no]').forEach(function (b) { b.onclick = function () { var ok = b.hasAttribute('data-ok'); if (!confirm(ok ? 'Confirm this M-Pesa payment was received?' : 'Mark this payment as not received?')) return;
        S.db.rpc('decide_mpesa', { ref: b.getAttribute(ok ? 'data-ok' : 'data-no'), approve: ok }).then(function (x) { if (x.error) return alert(S.nice(x.error)); MEM = null; payments(t); }); }; });
    });
  }
  function settings(t) {
    Promise.all([S.db.from('plans').select('*').order('sort'), S.db.from('app_settings').select('k,v')]).then(function (x) {
      if (x[0].error) return fail(t, x[0]);
      var set = {}; (x[1].data || []).forEach(function (r) { set[r.k] = r.v; });
      t.innerHTML = '<h3>Prices</h3><p class="small">A price of 0 hides that way of paying for the plan. PayPal is charged in US dollars; M-Pesa in Kenya shillings.</p>' +
        '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Plan</th><th>For</th><th>Months</th><th>PayPal (USD)</th><th>M-Pesa (KES)</th><th>On sale</th></tr></thead><tbody>' +
        (x[0].data || []).map(function (p) { return '<tr data-plan="' + E(p.code) + '"><td><input data-f="name" value="' + E(p.name) + '" maxlength="60"></td><td>' + E(p.audience) + '</td><td><input data-f="months" type="number" min="1" max="24" value="' + p.months + '" style="width:5em"></td>' +
          '<td><input data-f="amount" type="number" min="0" step="0.01" value="' + p.amount + '" style="width:7em"></td><td><input data-f="amount_kes" type="number" min="0" step="1" value="' + p.amount_kes + '" style="width:7em"></td><td><input data-f="active" type="checkbox"' + (p.active ? ' checked' : '') + '></td></tr>'; }).join('') +
        '</tbody></table></div><button class="btn main sm" id="savep">Save prices</button><p class="msg" id="pm"></p>' +
        '<h3>Payment details shown to payers</h3>' +
        '<label class="f">M-Pesa number students send money to<input id="s_mpesa_number" value="' + E(set.mpesa_number || '') + '" placeholder="e.g. 0712 345 678" inputmode="tel"></label>' +
        '<label class="f">Name shown on M-Pesa for that number<input id="s_mpesa_name" value="' + E(set.mpesa_name || '') + '" maxlength="60"></label>' +
        '<label class="f">PayPal client ID (public; from developer.paypal.com → Apps &amp; Credentials)<input id="s_paypal_client_id" value="' + E(set.paypal_client_id || '') + '" autocomplete="off"></label>' +
        '<label class="f">Note on the premium page (optional)<input id="s_premium_note" value="' + E(set.premium_note || '') + '" maxlength="200"></label>' +
        '<button class="btn main sm" id="saves">Save settings</button><p class="msg" id="sm"></p>' +
        '<p class="small muted">The PayPal <b>secret</b> never goes here. Put PAYPAL_CLIENT_ID, PAYPAL_SECRET and PAYPAL_ENV (live) in Supabase → Edge Functions → Secrets.</p>';
      t.querySelector('#savep').onclick = function () { var m = t.querySelector('#pm');
        Promise.all([].map.call(t.querySelectorAll('[data-plan]'), function (tr) { var g = function (f) { return tr.querySelector('[data-f=' + f + ']'); };
          return S.db.from('plans').update({ name: g('name').value.trim(), months: +g('months').value, amount: +g('amount').value || 0, amount_kes: +g('amount_kes').value || 0, active: g('active').checked }).eq('code', tr.getAttribute('data-plan')); }))
          .then(function (rs) { var e = rs.filter(function (r) { return r.error; })[0]; m.className = e ? 'msg' : 'msg ok'; m.textContent = e ? S.nice(e.error) : 'Prices saved.'; }); };
      t.querySelector('#saves').onclick = function () { var m = t.querySelector('#sm');
        var rows = ['mpesa_number', 'mpesa_name', 'paypal_client_id', 'premium_note'].map(function (k) { return { k: k, v: t.querySelector('#s_' + k).value.trim() }; });
        Promise.all([S.db.from('app_settings').upsert(rows.filter(function (r) { return r.v; })), S.db.from('app_settings').delete().in('k', rows.filter(function (r) { return !r.v; }).map(function (r) { return r.k; }).concat(['__none__']))])
          .then(function (rs) { var e = rs.filter(function (r) { return r.error; })[0]; m.className = e ? 'msg' : 'msg ok'; m.textContent = e ? S.nice(e.error) : 'Settings saved.'; }); };
    });
  }
})();
