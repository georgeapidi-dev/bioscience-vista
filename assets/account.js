/* My account · VistaEd · by George Apidi (22 Nov 2026, migration 078)
   Status of the registration, email verification, profile, authorised subjects, Free/Premium membership, classes,
   devices and sessions, two-step sign-in, password, and the account policy. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var CSS = '.ac{display:grid;gap:14px}.ac-hero{padding:22px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#0ea5e9,#7c3aed 55%,#db2777)}.ac-hero h1{margin:0 0 4px;color:#fff}.ac-hero p{margin:0;color:#fff}' +
    '.ac-card{background:var(--card,#fff);border:1px solid var(--line,#e2e8f0);border-radius:18px;padding:16px}.ac-card h2{margin:0 0 8px;font-size:1.15rem}' +
    '.ac-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px}.ac-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-weight:800;font-size:.8rem;margin:2px 4px 2px 0}' +
    '.p-ok{background:#dcfce7;color:#166534}.p-wait{background:#fef3c7;color:#92400e}.p-no{background:#fee2e2;color:#991b1b}.p-info{background:#e0f2fe;color:#075985}.p-prem{background:linear-gradient(90deg,#f59e0b,#db2777);color:#fff}' +
    '.ac-row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px dashed #e2e8f0}.ac-row:first-of-type{border-top:0}.ac-m{color:#64748b;font-size:.88rem}' +
    '.ac-warn{background:#fff7ed;border:2px solid #fdba74;border-radius:14px;padding:12px}.ac-alert{background:#fef2f2;border:2px solid #fca5a5;border-radius:14px;padding:12px}' +
    '.ac label.f{display:block;font-weight:700;margin:8px 0 3px}.ac input,.ac select,.ac textarea{font:inherit;padding:9px;border:2px solid #cbd5e1;border-radius:10px;width:100%}.ac .btn{margin-top:8px}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var ME = null, A = null, MOVE = new URLSearchParams(location.search).get('move');
  function pill(t, k) { return '<span class="ac-pill ' + k + '">' + t + '</span>'; }
  var STATUS = { pending: ['Waiting for approval', 'p-wait'], approved: ['Approved', 'p-ok'], rejected: ['Not approved', 'p-no'], info_requested: ['More information needed', 'p-info'], suspended: ['Paused', 'p-no'] };
  function day(t) { return t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }

  S.guard(app, { allowPending: true, anyone: true, school: true, parent: true }).then(function (me) { ME = me; A = me.access || {}; return load(); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function load() {
    return Promise.all([S.db.rpc('my_sessions'), S.db.rpc('my_pin_status'), S.db.auth.mfa.listFactors(), S.db.rpc('academic_tree')]).then(function (x) { draw(x[0].data || [], x[1].data || {}, (x[2].data && x[2].data.totp) || [], (function (T) { if (!T || T._edx) return T; T._edx = 1; T.sections = T.sections || []; T.courses = T.courses || []; T.courses.forEach(function (c) { if (c.pathway === 'edexcel' && !/^edx-/.test(c.section)) c.section = 'edx-' + c.section; }); [['edx-ks3', 'iLowerSecondary (KS3)'], ['edx-igcse', 'International GCSE'], ['edx-ial', 'International AS & A Level']].forEach(function (s) { T.sections.push({ section: s[0], name: s[1], pathway: 'edexcel' }); }); return T; })(x[3].data || { courses: [], sections: [] })); });
  }
  function draw(sess, pin, totp, tree) {
    var p = ME.profile || {}, stt = A.status || (A.premium ? 'approved' : 'pending'), s = STATUS[stt] || STATUS.pending;
    var h = '<div class="ac"><section class="ac-hero"><p class="vx-eye">My account</p><h1>👤 ' + E(p.full_name || 'My account') + '</h1><p>' + E(ME.user.email || '') + ' · ' + pill(s[0], s[1]) + (A.verified ? pill('Email verified', 'p-ok') : pill('Email not verified', 'p-wait')) + '</p></section>';
    if (pin.pin || MOVE) h += '<section class="ac-card ac-warn" id="mv"><h2>🔑 Set your password for email sign-in</h2><p>Signing in with a code and PIN is being replaced by your own email and password, so that each account belongs to one verified person.' +
      (pin.record_email ? ' Your account has no email address of its own yet: ask your teacher or the admin to add your school email, then set your password here.' : ' Choose a password now. Next time, sign in with <b>' + E(ME.user.email) + '</b> and this password.') + '</p>' +
      (pin.record_email ? '' : pwForm('mvp')) + '</section>';
    if (stt === 'info_requested') h += '<section class="ac-card ac-warn"><h2>The admin asks</h2><p>' + E(A.info_request || '') + '</p><label class="f" for="rta">Your answer</label><textarea id="rta" rows="3" maxlength="1000"></textarea><button class="btn main" id="rtb">Send answer</button><p class="msg" id="rtm"></p></section>';
    if (stt === 'pending') h += '<section class="ac-card"><h2>⏳ Your registration is with the admin</h2><p>You will get an email when it is approved.' + (A.verified ? '' : ' Please verify your email address first: it makes approval quicker.') + '</p></section>';
    if (stt === 'suspended' || stt === 'rejected') h += '<section class="ac-card ac-alert"><h2>' + (stt === 'suspended' ? 'Your account is paused' : 'Your registration was not approved') + '</h2><p>Learning materials are closed. Use <a href="/messages/">Messages</a> or contact VistaEd if you think this is a mistake.</p></section>';
    if (!A.verified) h += '<section class="ac-card"><h2>✉️ Verify your email</h2><p>We sent a link to <b>' + E(ME.user.email) + '</b>. No email? Check your spam folder or send it again.</p><button class="btn main" id="vrb">Send the link again</button><p class="msg" id="vrm"></p></section>';
    h += '<div class="ac-grid">';
    // subjects
    var mine = A.courses || [], have = {}; mine.forEach(function (c) { have[c.course] = c.status; });
    var secName = {}; (tree.sections || []).forEach(function (x) { secName[x.section] = x.name; });
    h += '<section class="ac-card"><h2>📚 My subjects</h2>' + (mine.length ? mine.map(function (c) {
        return '<div class="ac-row"><span><b>' + E(c.name) + '</b><br><span class="ac-m">' + E(c.pathway === 'ib' ? 'International Baccalaureate' : c.pathway === 'kenya' ? 'Kenya Competency-Based Education (KICD)' : c.pathway === 'edexcel' ? 'Pearson Edexcel' : 'Cambridge International') + ' · ' + E(secName[c.section] || '') + '</span></span>' +
          (c.status === 'approved' ? pill('Authorised', 'p-ok') : c.status === 'requested' ? pill('Waiting for admin', 'p-wait') : pill('Not authorised', 'p-no')) + '</div>'; }).join('') : '<p class="ac-m">No subjects yet.</p>') +
      (ME.parent ? '' : '<label class="f" for="rqs">Ask for another subject</label><select id="rqs"><option value="">Choose…</option>' + (tree.courses || []).filter(function (c) { return !have[c.slug] || have[c.slug] === 'rejected'; })
        .map(function (c) { return '<option value="' + E(c.slug) + '">' + E((c.pathway === 'ib' ? 'IB' : c.pathway === 'kenya' ? 'Kenya CBE' : c.pathway === 'edexcel' ? 'Edexcel' : 'Cambridge') + ' · ' + (secName[c.section] || '') + ' · ' + c.name) + '</option>'; }).join('') + '</select><button class="btn sm" id="rqb">Ask the admin</button><p class="msg" id="rqm"></p>') + '</section>';
    // membership
    var prem = A.premium, until = A.until, from = A.from;
    h += '<section class="ac-card"><h2>⭐ Membership</h2><p>' + (A.free ? pill('Premium (given by the admin)', 'p-prem') : prem ? pill('Premium', 'p-prem') : pill('Free', 'p-info')) + '</p>' +
      (prem && !A.free && until ? '<p>Premium until <b>' + day(until) + '</b>.</p>' : '') + (!prem && until && new Date(until) < new Date() ? '<p class="ac-m">Your Premium access ended on ' + day(until) + '.</p>' : '') +
      (from && new Date(from) > new Date() ? '<p class="ac-m">Premium starts on ' + day(from) + '.</p>' : '') +
      '<p class="ac-m">Free: the materials the admin marks Free in your subjects, and what your teacher shares with your class. Premium: every lesson, examination and activity in your authorised subjects.</p>' +
      (prem ? '' : '<a class="btn main sm" href="/premium/">Premium membership</a>') + '</section>';
    // classes
    if (!ME.school && !ME.parent) {
      var cls = (A.classes || []).filter(function (c) { return !c.self; });
      h += '<section class="ac-card"><h2>🏫 My classes</h2>' + (cls.length ? cls.map(function (c) { return '<div class="ac-row"><span><b>' + E(c.name) + '</b><br><span class="ac-m">' + E(c.teacher || '') + '</span></span>' +
          (c.status === 'approved' ? pill('Member', 'p-ok') : c.status === 'pending' ? pill('Waiting for teacher', 'p-wait') : pill('Not accepted', 'p-no')) + '</div>'; }).join('') : '<p class="ac-m">You have not joined a class.</p>') +
        (A.learner_kind === 'independent' ? '' : '<a class="btn sm" href="/join/">Join a class with a code</a>') + '</section>';
    }
    // profile
    h += '<section class="ac-card"><h2>✏️ My details</h2><label class="f" for="pfn">Full name</label><input id="pfn" value="' + E(p.full_name || '') + '"><label class="f" for="pfs">School</label><input id="pfs" value="' + E(p.school_name || '') + '">' +
      '<label class="f" for="pfc">Country</label><input id="pfc" value="' + E(p.country || '') + '"><button class="btn sm" id="pfb">Save</button><p class="msg" id="pfm"></p></section>';
    h += '</div>';
    // devices
    var wk = !(S.prefsGet && S.prefsGet('weekly') === 'off');
    h += '<section class="ac-card" id="acwk"><h2>✉️ Emails</h2><label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="wkon"' + (wk ? ' checked' : '') + ' style="width:20px;height:20px;margin-top:2px;flex:none"> <span><b>Weekly summary on Mondays</b><br><span class="ac-m">Work due this week, work not finished, and new marks. For parents, the same for each linked child. Nothing is sent in a week with nothing to report.</span></span></label><p class="ac-m" id="wkmsg" role="status" style="min-height:1.2em;margin:6px 0 0"></p></section>';
    h += '<section class="ac-card"><h2>💻 Devices signed in</h2><p class="ac-m">Every device where your account is signed in. If you do not recognise one, sign it out and change your password. Only a few devices can stay signed in at once; the oldest is signed out first.</p>' +
      sess.map(function (x) { return '<div class="ac-row"><span><b>' + E(device(x.device)) + '</b>' + (x.current ? ' ' + pill('This device', 'p-ok') : '') + '<br><span class="ac-m">Signed in ' + E(S.when(x.started)) + ' · last active ' + E(S.when(x.last_active)) + (x.network ? ' · network ' + E(x.network) : '') + '</span></span>' +
        (x.current ? '' : '<button class="btn sm" data-end="' + E(x.id) + '">Sign out</button>') + '</div>'; }).join('') +
      (sess.length > 1 ? '<button class="btn sm" id="endall">Sign out all other devices</button>' : '') + '<p class="msg" id="dvm"></p></section>';
    // security
    var tf = totp.filter(function (f) { return f.status === 'verified'; })[0];
    h += '<div class="ac-grid"><section class="ac-card"><h2>🔐 Two-step sign-in <span class="ac-m">(optional)</span></h2>' + (tf ? '<p>' + pill('On', 'p-ok') + ' You type a code from your authenticator app when you sign in.</p><button class="btn sm" id="mfoff">Turn off</button>' :
        '<p class="ac-m">Use an authenticator app (Google Authenticator, Microsoft Authenticator…) for a second step at sign-in.</p><button class="btn sm" id="mfon">Turn on</button>') + '<div id="mfx"></div><p class="msg" id="mfm"></p></section>' +
      '<section class="ac-card"><h2>🔑 Password</h2>' + pwForm('pwx') + '</section></div>';
    h += '<section class="ac-card"><h2>📜 Account policy</h2><p>Your account is for you alone. Never share your password or sign in for someone else. VistaEd watches for signs of shared accounts (for example the same account used at the same time far apart) and the admin may ask about them or pause the account. Signing in from a school network or VPN is fine.</p></section></div>';
    app.innerHTML = h;
    var wkb = app.querySelector('#wkon'); if (wkb) wkb.onchange = function () { if (!S.prefsPush) return; S.prefsPush('weekly', wkb.checked ? 'on' : 'off'); if (S.prefsSave) S.prefsSave();
      app.querySelector('#wkmsg').textContent = wkb.checked ? 'Saved: you will get the weekly summary.' : 'Saved: no more weekly summaries.'; };
    wire(totp);
  }
  function pwForm(id) { return '<form id="' + id + '"><label class="f">New password (at least 8 characters)<input type="password" autocomplete="new-password" minlength="8" required></label><label class="f">Type it again<input type="password" autocomplete="new-password" required></label><button class="btn main sm" type="submit">Save password</button><p class="msg"></p></form>'; }
  function device(ua) { ua = ua || ''; var os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'Device';
    var br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''; return os + (br ? ' · ' + br : ''); }
  function say(id, t, ok) { var m = app.querySelector(id); if (m) { m.textContent = t; m.className = 'msg' + (ok ? ' ok' : ''); } }
  function wire(totp) {
    app.querySelectorAll('#mvp,#pwx').forEach(function (f) { f.onsubmit = function (e) { e.preventDefault(); var i = f.querySelectorAll('input'), m = f.querySelector('.msg');
      if (i[0].value.length < 8) { m.textContent = 'At least 8 characters, please.'; return; } if (i[0].value !== i[1].value) { m.textContent = 'The two passwords do not match.'; return; }
      m.textContent = 'Saving…'; S.db.auth.updateUser({ password: i[0].value }).then(function (r) { if (r.error) { m.textContent = S.nice(r.error); return; }
        m.className = 'msg ok'; m.textContent = 'Password saved. Sign in with your email and this password from now on.'; i[0].value = i[1].value = '';
        if (f.id === 'mvp') S.db.rpc('retire_my_pin').then(function () { history.replaceState(null, '', location.pathname); try { localStorage.removeItem('bv-join-me'); } catch (e) {} }); }); }; });
    var b;
    if ((b = app.querySelector('#rtb'))) b.onclick = function () { S.db.rpc('reply_to_admin', { msg: app.querySelector('#rta').value }).then(function (r) { if (r.error) return say('#rtm', S.nice(r.error)); say('#rtm', 'Sent. Your registration is back with the admin.', true); }); };
    if ((b = app.querySelector('#vrb'))) b.onclick = function () { b.disabled = true; S.db.rpc('resend_verification').then(function (r) { b.disabled = false; if (r.error) return say('#vrm', S.nice(r.error)); say('#vrm', r.data === 'verified' ? 'Your email is already verified.' : 'Sent. It can take a few minutes.', true); }); };
    if ((b = app.querySelector('#rqb'))) b.onclick = function () { var v = app.querySelector('#rqs').value; if (!v) return say('#rqm', 'Choose a subject first.');
      S.db.rpc('request_subject', { course_slug: v }).then(function (r) { if (r.error) return say('#rqm', S.nice(r.error)); say('#rqm', 'Asked. The admin will decide.', true); }); };
    if ((b = app.querySelector('#pfb'))) b.onclick = function () { var n = app.querySelector('#pfn').value.replace(/\s+/g, ' ').trim(); if (n.split(' ').length < 2) return say('#pfm', 'Please give your first and last name.');
      S.db.from('profiles').update({ full_name: n, school_name: app.querySelector('#pfs').value.trim() || null, country: app.querySelector('#pfc').value.trim() || null }).eq('id', ME.user.id)
        .then(function (r) { if (r.error) return say('#pfm', S.nice(r.error)); say('#pfm', 'Saved.', true); }); };
    app.querySelectorAll('[data-end]').forEach(function (x) { x.onclick = function () { S.db.rpc('end_my_sessions', { which: x.getAttribute('data-end') }).then(function (r) { if (r.error) return say('#dvm', S.nice(r.error)); load(); }); }; });
    if ((b = app.querySelector('#endall'))) b.onclick = function () { S.db.rpc('end_my_sessions', { which: null }).then(function (r) { if (r.error) return say('#dvm', S.nice(r.error)); load(); }); };
    if ((b = app.querySelector('#mfoff'))) b.onclick = function () { var f = totp.filter(function (x) { return x.status === 'verified'; })[0];
      S.db.auth.mfa.unenroll({ factorId: f.id }).then(function (r) { if (r.error) return say('#mfm', /aal2|assurance/i.test(r.error.message) ? 'Sign out and in again with your code first, then turn it off.' : S.nice(r.error)); load(); }); };
    if ((b = app.querySelector('#mfon'))) b.onclick = function () {
      totp.filter(function (x) { return x.status !== 'verified'; }).forEach(function (x) { S.db.auth.mfa.unenroll({ factorId: x.id }); });
      S.db.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator ' + Date.now() }).then(function (r) { if (r.error) return say('#mfm', S.nice(r.error));
        var d = r.data; app.querySelector('#mfx').innerHTML = '<p>Scan this with your authenticator app, then type the 6-digit code.</p><img alt="QR code for your authenticator app" style="width:180px;height:180px;background:#fff" src="' + E(d.totp.qr_code) + '">' +
          '<p class="ac-m">Or type this key: <code>' + E(d.totp.secret) + '</code></p><label class="f">Code<input id="mfc" inputmode="numeric" maxlength="6"></label><button class="btn main sm" id="mfv">Turn on</button>';
        app.querySelector('#mfv').onclick = function () { S.db.auth.mfa.challengeAndVerify({ factorId: d.id, code: app.querySelector('#mfc').value.trim() }).then(function (v) { if (v.error) return say('#mfm', 'That code is not right. Try the newest code.'); load(); }); }; }); };
  }
})();
