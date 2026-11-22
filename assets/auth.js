/* Registration and login · BioscienceVista */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), mode = app.getAttribute('data-mode');
  if (!S.on) return S.notReady(app);
  var next = new URLSearchParams(location.search).get('next');
  function go(me) { location.href = next && next.charAt(0) === '/' && next.charAt(1) !== '/' ? next : (me && me.staff ? '/staff/' : me && me.school ? '/teach/' : me && me.parent ? '/parent/' : '/dashboard/'); }

  if (mode === 'register' && new URLSearchParams(location.search).get('as') === 'parent') return parentRegister();
  /* The course list (the admin's list): [address of the course, name, group, soon]. soon = no BioscienceVista lessons yet.
     The same list is kept in the database (course_catalog, migration 034). It changes only what people choose from. */
  var CAT = [['grade-6', 'Grade 6 Science', 'MYP Science'], ['grade-7', 'Grade 7 Science', 'MYP Science'], ['grade-8', 'Grade 8 Science', 'MYP Science'], ['grade-9', 'Grade 9 Science', 'MYP Science'], ['grade-10', 'Grade 10 Science', 'MYP Science'],
    ['bio-sl', 'IB Diploma Biology SL', 'IB Diploma'], ['bio-hl', 'IB Diploma Biology HL', 'IB Diploma'], ['chem-sl', 'IB Diploma Chemistry SL', 'IB Diploma'], ['chem-hl', 'IB Diploma Chemistry HL', 'IB Diploma'],
    ['phys-sl', 'IB Diploma Physics SL', 'IB Diploma'], ['phys-hl', 'IB Diploma Physics HL', 'IB Diploma'], ['ess-sl', 'IB ESS SL', 'IB Diploma'], ['ess-hl', 'IB ESS HL', 'IB Diploma'],
    ['maths-aa-sl', 'IB Mathematics AA SL', 'IB Diploma'], ['maths-aa-hl', 'IB Mathematics AA HL', 'IB Diploma'], ['maths-ai-sl', 'IB Mathematics AI SL', 'IB Diploma'], ['maths-ai-hl', 'IB Mathematics AI HL', 'IB Diploma'],
    ['igcse-bio-core', 'IGCSE Biology Core', 'Cambridge IGCSE'], ['igcse-bio-ext', 'IGCSE Biology Extended', 'Cambridge IGCSE'], ['igcse-chem-core', 'IGCSE Chemistry Core', 'Cambridge IGCSE', 1], ['igcse-chem-ext', 'IGCSE Chemistry Extended', 'Cambridge IGCSE', 1],
    ['igcse-phys-core', 'IGCSE Physics Core', 'Cambridge IGCSE', 1], ['igcse-phys-ext', 'IGCSE Physics Extended', 'Cambridge IGCSE', 1],
    ['alevel-bio-as', 'AS Level Biology', 'Cambridge AS & A Level', 1], ['alevel-bio-a2', 'A Level Biology', 'Cambridge AS & A Level', 1],
    ['alevel-chem-as', 'AS Level Chemistry', 'Cambridge AS & A Level'], ['alevel-chem-a2', 'A Level Chemistry', 'Cambridge AS & A Level']];
  function coursePicker(label, teacher) {   // tick as many as you like; a learner cannot tick a course that has no lessons yet
    var g = '', h = '';
    CAT.forEach(function (c) {
      if (c[3] && !teacher) return;   // a course with no lessons yet is not offered to learners (no "coming soon", 21 Nov 2026)
      if (c[2] !== g) { g = c[2]; h += '<p class="small" style="margin:10px 0 2px"><b>' + E(g) + '</b></p>'; }
      h += '<div style="padding:3px 0"><label class="chk"><input type="checkbox" data-course="' + c[0] + '"' + '> ' + E(c[1]) + '</label></div>'; });
    return '<fieldset class="grp" id="rcs" style="border:1px solid var(--line);border-radius:12px;padding:12px"><legend><b>' + label + '</b></legend>' + h + '</fieldset>';
  }
  function chosen() { var out = []; app.querySelectorAll('[data-course]:checked').forEach(function (b) { out.push(b.getAttribute('data-course')); }); return out; }
  if (mode === 'register') {   // Student, Teacher and Independent learner: the guided registration (register.js, migration 078)
    var sc = document.createElement('script'); sc.src = '/assets/register.js?v=' + new Date().toISOString().slice(0, 13); sc.onload = function () { window.BVReg(); }; document.head.appendChild(sc);
    return;
  }
  function parentRegister() {
    app.innerHTML = '<form class="form narrow" id="pf" novalidate><h2>Parent or carer account</h2>' +
      '<p class="muted small">You need the parent code for your child. Ask the school or the class teacher for it.</p>' +
      '<label class="f">Your full name<input id="pn" autocomplete="name" required></label>' +
      '<label class="f">Your email<input id="pe" type="email" autocomplete="email" required></label>' +
      '<label class="f">Password (at least 8 characters)<input id="pp" type="password" autocomplete="new-password" minlength="8" required></label>' +
      '<label class="f">Confirm password<input id="pp2" type="password" autocomplete="new-password" required></label>' +
      '<label class="f">Parent code for your child<input id="pc" autocomplete="off" required placeholder="6 letters and numbers" autocapitalize="characters" style="text-transform:uppercase"></label><p class="small" id="pcn" aria-live="polite"></p>' +
      '<label class="chk"><input type="checkbox" id="pa" required> I will keep my password private. I understand that this account lets me see my child\'s marks, lesson progress and teacher feedback on this site.</label>' +
      '<button class="btn main" type="submit">Create parent account</button><p class="msg" id="pm" role="alert"></p>' +
      '<p class="small">Student? <a href="/register/">Create a student account</a> · Already registered? <a href="/login/">Log in</a></p></form>';
    var code = app.querySelector('#pc'), cn = app.querySelector('#pcn'), t;
    code.addEventListener('input', function () { clearTimeout(t); var v = code.value.trim(); cn.textContent = '';
      if (v.length < 4) return; t = setTimeout(function () { S.db.rpc('check_parent_code', { pcode: v }).then(function (r) { cn.innerHTML = r.data ? '<span class="ok-t">✓ This code is for ' + E(r.data) + "'s account</span>" : '<span class="bad-t">Code not recognised. Check it with the school.</span>'; }); }, 350); });
    app.querySelector('#pf').addEventListener('submit', function (e) {
      e.preventDefault(); var m = app.querySelector('#pm'); m.className = 'msg';
      var n = app.querySelector('#pn').value.trim(), em = app.querySelector('#pe').value.trim(), p = app.querySelector('#pp').value, p2 = app.querySelector('#pp2').value, c = code.value.trim().toUpperCase();
      if (n.split(/\s+/).length < 2) return m.textContent = 'Please give your first and last name.';
      if (!/^\S+@\S+\.\S+$/.test(em)) return m.textContent = 'Please enter a valid email address.';
      if (p.length < 8) return m.textContent = 'Your password needs at least 8 characters.';
      if (p !== p2) return m.textContent = 'The two passwords do not match.';
      if (!app.querySelector('#pa').checked) return m.textContent = 'Please tick the box to agree.';
      m.textContent = 'Creating your account…';
      S.db.auth.signUp({ email: em, password: p, options: { data: { full_name: n, account_type: 'parent', parent_code: c }, emailRedirectTo: location.origin + '/login/' } }).then(function (res) {
        if (res.error) { m.textContent = S.nice(res.error); return; }
        if (res.data.session) { location.href = '/parent/'; return; }
        app.innerHTML = '<section class="panel tint"><p class="label">Almost there</p><h2>Check your email</h2><p>We sent a confirmation link to <b>' + E(em) + '</b>. Open it to activate your account, then <a href="/login/">log in</a>.</p><p class="small muted">No email after a few minutes? Check your spam folder.</p></section>';
      });
    });
  }

  // ---- login ----
  var ROLE = {
    student: ['Student or independent learner', 'Use the email and password of your account. Used a code and PIN before? <a href="/join/">Move your account to email sign-in</a>.', '<a href="/register/">New here? Register</a>'],
    parent: ['Parent or carer', 'Use the email and password of your parent account. No account? <a href="/family/">See your child\'s progress with their code</a>.', '<a href="/register/?as=parent">New parent? Create a parent account</a>'],
    teacher: ['Teacher', 'Use the email and password of your teacher account. Used a teacher code and PIN before? <a href="/join/">Move your account to email sign-in</a>.', '<a href="/register/?as=teacher">New teacher? Register</a>']
  };
  // step 1: ask who is logging in, so the right account type and page are used
  function chooser() {
    app.innerHTML = '<div class="form narrow" id="rolepick"><h2>Who are you?</h2>' +
      '<button class="btn main" type="button" data-role="student" style="display:block;width:100%;margin:10px 0;text-align:left">🎒 Student or independent learner</button>' +
      '<button class="btn main" type="button" data-role="teacher" style="display:block;width:100%;margin:10px 0;text-align:left">🧑‍🏫 Teacher</button>' +
      '<button class="btn main" type="button" data-role="parent" style="display:block;width:100%;margin:10px 0;text-align:left">👪 Parent or carer</button>' +
      '<p class="small" style="margin-top:12px"><a href="#" id="fp0">Forgot your password?</a> · <b><a href="/register/">New here? Register</a></b></p>' +
      '<p class="small muted">Signed in with a code and PIN before? <a href="/join/">Move your account to email sign-in</a>.</p></div>';
    app.querySelectorAll('[data-role]').forEach(function (b) { b.addEventListener('click', function () { loginForm('', b.getAttribute('data-role')); }); });
    app.querySelector('#fp0').addEventListener('click', function (e) { e.preventDefault(); forgotForm(''); });
  }
  // step 2: email and password for the chosen role
  function loginForm(msg, role) {
    role = ROLE[role] ? role : 'student';
    var info = ROLE[role];
    app.innerHTML = '<form class="form narrow" id="lf"><h2>Log in as ' + E(info[0]) + '</h2><p class="muted small">' + info[1] + ' <a href="#" id="chg">Not you? Change</a></p>' +
      '<label class="f">Email<input id="le" type="email" autocomplete="email" required></label>' +
      '<label class="f">Password<input id="lp" type="password" autocomplete="current-password" required></label>' +
      '<button class="btn main" type="submit">Log in</button><p class="msg" id="lm" role="alert">' + E(msg || '') + '</p>' +
      '<p class="small"><a href="#" id="fp">Forgot your password?</a> · ' + info[2] + '</p></form>';
    app.querySelector('#lf').addEventListener('submit', function (e) {
      e.preventDefault(); var m = app.querySelector('#lm'); m.className = 'msg'; m.textContent = 'Logging in…';
      S.db.auth.signInWithPassword({ email: app.querySelector('#le').value.trim(), password: app.querySelector('#lp').value }).then(function (r) {
        if (r.error) { m.textContent = /confirm/i.test(r.error.message) ? 'Please confirm your email first: open the link we sent you.' : 'Email or password is not right.'; return; }
        mfaStep(m).then(function () { return S.me(); }).then(function (me) {
          // the account must match the role chosen; otherwise sign out again
          var ok = !!me && (role === 'teacher' ? me.staff || me.school : role === 'parent' ? me.parent : !me.staff && !me.school);
          if (ok) return go(me);
          S.db.auth.signOut().then(function () { m.textContent = 'This is not a ' + info[0].toLowerCase() + ' account. Go back and choose the right option.'; });
        });
      });
    });
    app.querySelector('#chg').addEventListener('click', function (e) { e.preventDefault(); chooser(); });
    app.querySelector('#fp').addEventListener('click', function (e) { e.preventDefault(); forgotForm(app.querySelector('#le').value.trim()); });
  }
  // two-step sign-in (optional, set up on the Account page): ask for the 6-digit code from the authenticator app
  function mfaStep(m) {
    return S.db.auth.mfa.getAuthenticatorAssuranceLevel().then(function (r) {
      var d = r.data || {}; if (d.nextLevel !== 'aal2' || d.currentLevel === 'aal2') return;
      return S.db.auth.mfa.listFactors().then(function (lf) {
        var f = ((lf.data && lf.data.totp) || []).filter(function (x) { return x.status === 'verified'; })[0]; if (!f) return;
        return new Promise(function (ok) {
          app.innerHTML = '<form class="form narrow" id="mf"><h2>Two-step sign-in</h2><p class="muted small">Type the 6-digit code from your authenticator app.</p>' +
            '<label class="f">Code<input id="mc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></label><button class="btn main" type="submit">Continue</button><p class="msg" id="mm" role="alert"></p></form>';
          app.querySelector('#mc').focus();
          app.querySelector('#mf').onsubmit = function (e) { e.preventDefault(); var mm = app.querySelector('#mm'); mm.textContent = 'Checking…';
            S.db.auth.mfa.challengeAndVerify({ factorId: f.id, code: app.querySelector('#mc').value.trim() }).then(function (v) {
              if (v.error) { mm.textContent = 'That code is not right. Try the newest code.'; return; } ok(); }); };
        });
      });
    });
  }
  // forgotten password: email a reset link; the link opens this page with ?reset=1 and a one-time sign-in
  function forgotForm(email, note) {
    app.innerHTML = '<form class="form narrow" id="ff"><h2>Reset your password</h2><p class="muted small">Type the email you use for BioscienceVista. We will email you a link to choose a new password.</p>' +
      (note ? '<p class="msg">' + E(note) + '</p>' : '') +
      '<label class="f">Email<input id="fe" type="email" autocomplete="email" required value="' + E(email || '') + '"></label>' +
      '<button class="btn main" type="submit">Email me a reset link</button><p class="msg" id="fm" role="alert"></p>' +
      '<p class="small"><a href="#" id="fb">← Back to log in</a></p></form>';
    app.querySelector('#fb').addEventListener('click', function (e) { e.preventDefault(); history.replaceState(null, '', location.pathname); chooser(); });
    app.querySelector('#ff').addEventListener('submit', function (e) {
      e.preventDefault(); var em = app.querySelector('#fe').value.trim(), m = app.querySelector('#fm'), b = this.querySelector('button');
      if (!/^\S+@\S+\.\S+$/.test(em)) { m.textContent = 'Please enter a valid email address.'; return; }
      b.disabled = true; m.className = 'msg'; m.textContent = 'Sending…';
      S.db.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/login/?reset=1' }).then(function (r) {
        b.disabled = false;
        if (r.error) { m.textContent = /rate|seconds/i.test(r.error.message) ? 'Please wait a minute before asking for another link.' : S.nice(r.error); return; }
        app.innerHTML = '<section class="panel tint"><p class="label">Check your email</p><h2>Reset link sent</h2><p>If <b>' + E(em) + '</b> has a BioscienceVista account, a link to choose a new password is on its way. Open it on this device.</p>' +
          '<p class="small muted">No email after a few minutes? Check your spam or junk folder, or ask your teacher to reset it for you.</p><p class="small"><a href="/login/">← Back to log in</a></p></section>';
      });
    });
  }
  function resetForm() {
    if (app.querySelector('#nf')) return;
    app.innerHTML = '<form class="form narrow" id="nf"><h2>Choose a new password</h2><label class="f">New password (at least 8 characters)<input id="np" type="password" autocomplete="new-password" minlength="8" required></label>' +
      '<label class="f">Type it again<input id="np2" type="password" autocomplete="new-password" required></label><button class="btn main" type="submit">Save password</button><p class="msg" id="nm" role="alert"></p></form>';
    app.querySelector('#nf').addEventListener('submit', function (e) {
      e.preventDefault(); var p = app.querySelector('#np').value, m = app.querySelector('#nm'); m.className = 'msg';
      if (p.length < 8) return m.textContent = 'At least 8 characters, please.';
      if (p !== app.querySelector('#np2').value) return m.textContent = 'The two passwords do not match.';
      S.db.auth.updateUser({ password: p }).then(function (r) {
        if (r.error) { m.textContent = /session/i.test(r.error.message) ? 'This reset link has expired. Ask for a new one.' : S.nice(r.error); return; }
        m.className = 'msg ok'; m.textContent = 'Password saved. Opening your page…'; history.replaceState(null, '', location.pathname); setTimeout(function () { S.me().then(go); }, 800);
      });
    });
  }
  S.db.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') resetForm(); });
  var hashErr = new URLSearchParams(location.hash.slice(1)).get('error_description') || new URLSearchParams(location.search).get('error_description');
  S.me().then(function (me) {
    if (new URLSearchParams(location.search).get('reset')) {
      if (me) return resetForm();
      return forgotForm('', hashErr ? 'That reset link has expired or was already used. Ask for a new one below.' : 'Open the newest reset link from your email, or ask for a new one below.');
    }
    if (me) go(me); else chooser();
  });
})();
