/* Registration and login · Learnova */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), mode = app.getAttribute('data-mode');
  if (!S.on) return S.notReady(app);
  var next = new URLSearchParams(location.search).get('next');
  function go(me) { location.href = next && next.charAt(0) === '/' && next.charAt(1) !== '/' ? next : (me && me.staff ? '/staff/' : me && me.school ? '/teach/' : me && me.parent ? '/parent/' : '/dashboard/'); }

  if (mode === 'register' && new URLSearchParams(location.search).get('as') === 'parent') return parentRegister();
  if (mode === 'register' && new URLSearchParams(location.search).get('as') === 'teacher') return accountForm('teacher');
  if (mode === 'register' && new URLSearchParams(location.search).get('as') === 'student') return accountForm('student');
  if (mode === 'register') {   // no class codes: choose the kind of account first
    app.innerHTML = '<div class="form narrow"><h2>Who is signing up?</h2><p class="muted small">After signing up, students choose their school or teacher and then their class. The teacher approves each student.</p>' +
      '<a class="btn main" href="/register/?as=student" style="display:block;margin:10px 0;text-align:left">🎓 I am a student</a>' +
      '<a class="btn main" href="/register/?as=teacher" style="display:block;margin:10px 0;text-align:left">🧑‍🏫 I am a teacher (my own school or private classes)</a>' +
      '<a class="btn main" href="/register/?as=parent" style="display:block;margin:10px 0;text-align:left">👪 I am a parent or carer</a>' +
      '<p class="small">Already registered? <a href="/login/' + (next ? '?next=' + encodeURIComponent(next) : '') + '">Log in</a></p></div>';
    return;
  }
  function accountForm(kind) {
    var T = kind === 'teacher';
    app.innerHTML = '<form class="form narrow" id="rf" novalidate><h2>' + (T ? 'Teacher account' : 'Student account') + '</h2>' +
      '<p class="muted small">' + (T ? 'Your classes, students and materials are private to you and your students. The Learnova admin approves new teachers; a premium subscription is needed to run classes.' :
        'After signing up you choose your school or teacher, then your class. Your teacher approves you, and premium access opens the class materials.') + '</p>' +
      '<label class="f">Full name<input id="rn" autocomplete="name" required placeholder="' + (T ? 'Your name as students know it' : 'As it appears on your school records') + '"></label>' +
      (T ? '<label class="f">School (choose it from the list, or type it if it is new; "Private tutor" if you have none)<input id="rs" list="rsl" autocomplete="organization" required maxlength="120"><datalist id="rsl"></datalist></label>' : '') +
      '<label class="f">Email<input id="re" type="email" autocomplete="email" required></label>' +
      '<label class="f">Password (at least 8 characters)<input id="rp" type="password" autocomplete="new-password" minlength="8" required></label>' +
      '<label class="f">Confirm password<input id="rp2" type="password" autocomplete="new-password" required></label>' +
      '<label class="chk"><input type="checkbox" id="ra" required> I will keep my password private' + (T ? ' and use student data only for teaching my own classes.' : ' and follow my school\'s rules for using this site.') + '</label>' +
      '<button class="btn main" type="submit">Create account</button><p class="msg" id="rm" role="alert"></p>' +
      '<p class="small">Already registered? <a href="/login/">Log in</a> · <a href="/register/">← Other account types</a></p></form>';
    if (T) S.db.from('schools').select('name').order('name').then(function (r) { var dl = app.querySelector('#rsl'); if (dl) dl.innerHTML = (r.data || []).map(function (x) { return '<option value="' + E(x.name) + '">'; }).join(''); });
    app.querySelector('#rf').addEventListener('submit', function (e) {
      e.preventDefault(); var m = app.querySelector('#rm'); m.className = 'msg';
      var n = app.querySelector('#rn').value.trim(), em = app.querySelector('#re').value.trim(), p = app.querySelector('#rp').value, p2 = app.querySelector('#rp2').value,
          sc = T ? app.querySelector('#rs').value.trim() : '';
      if (n.split(/\s+/).length < 2) return m.textContent = 'Please give your first and last name.';
      if (T && sc.length < 2) return m.textContent = 'Please type your school, or "Private tutor".';
      if (!/^\S+@\S+\.\S+$/.test(em)) return m.textContent = 'Please enter a valid email address.';
      if (p.length < 8) return m.textContent = 'Your password needs at least 8 characters.';
      if (p !== p2) return m.textContent = 'The two passwords do not match.';
      if (!app.querySelector('#ra').checked) return m.textContent = 'Please tick the box to agree.';
      m.textContent = 'Creating your account…';
      var data = T ? { full_name: n, account_type: 'teacher', school_name: sc } : { full_name: n, account_type: 'student' };
      S.db.auth.signUp({ email: em, password: p, options: { data: data, emailRedirectTo: location.origin + '/login/' } }).then(function (res) {
        if (res.error) { m.textContent = S.nice(res.error); return; }
        if (res.data.session) { location.href = T ? '/teach/' : '/dashboard/'; return; }
        app.innerHTML = '<section class="panel tint"><p class="label">Almost there</p><h2>Check your email</h2><p>We sent a confirmation link to <b>' + E(em) + '</b>. Open it to activate your account, then <a href="/login/">log in</a>' +
          (T ? '. The admin will then approve your teacher account.' : ' and choose your class.') + '</p><p class="small muted">No email after a few minutes? Check your spam folder.</p></section>';
      });
    });
  }

  // ---- parent registration: needs the parent code the school gave for the child ----
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
    student: ['Student', 'Use the school email and password you chose when you signed up.', '<a href="/register/?as=student">New student? Create an account</a>'],
    parent: ['Parent or carer', 'Use the email and password you chose for your parent account.', '<a href="/register/?as=parent">New parent? Create a parent account</a>'],
    teacher: ['Teacher', 'Use the email and password of your teacher account.', '<a href="/register/?as=teacher">New teacher? Create a teacher account</a>']
  };
  // step 1: ask who is logging in, so the right account type and page are used
  function chooser() {
    app.innerHTML = '<div class="form narrow" id="rolepick"><h2>Who is logging in?</h2><p class="muted small">Choose one so we open the right page for you.</p>' +
      '<button class="btn main" type="button" data-role="student" style="display:block;width:100%;margin:10px 0;text-align:left">🎓 I am a student</button>' +
      '<button class="btn main" type="button" data-role="parent" style="display:block;width:100%;margin:10px 0;text-align:left">👪 I am a parent or carer</button>' +
      '<button class="btn main" type="button" data-role="teacher" style="display:block;width:100%;margin:10px 0;text-align:left">🧑‍🏫 I am a teacher</button>' +
      '<p class="small" style="margin-top:12px"><a href="#" id="fp0">🔑 Forgot your password?</a></p></div>';
    app.querySelectorAll('[data-role]').forEach(function (b) { b.addEventListener('click', function () { loginForm('', b.getAttribute('data-role')); }); });
    app.querySelector('#fp0').addEventListener('click', function (e) { e.preventDefault(); forgotForm(''); });
  }
  // step 2: email and password for the chosen role
  function loginForm(msg, role) {
    role = ROLE[role] ? role : 'student';
    var info = ROLE[role];
    app.innerHTML = '<form class="form narrow" id="lf"><h2>Log in as ' + E(info[0]) + '</h2><p class="muted small">' + E(info[1]) + ' <a href="#" id="chg">Not you? Change</a></p>' +
      '<label class="f">Email<input id="le" type="email" autocomplete="email" required></label>' +
      '<label class="f">Password<input id="lp" type="password" autocomplete="current-password" required></label>' +
      '<button class="btn main" type="submit">Log in</button><p class="msg" id="lm" role="alert">' + E(msg || '') + '</p>' +
      '<p class="small"><a href="#" id="fp">Forgot your password?</a> · ' + info[2] + '</p></form>';
    app.querySelector('#lf').addEventListener('submit', function (e) {
      e.preventDefault(); var m = app.querySelector('#lm'); m.className = 'msg'; m.textContent = 'Logging in…';
      S.db.auth.signInWithPassword({ email: app.querySelector('#le').value.trim(), password: app.querySelector('#lp').value }).then(function (r) {
        if (r.error) { m.textContent = /confirm/i.test(r.error.message) ? 'Please confirm your email first: open the link we sent you.' : 'Email or password is not right.'; return; }
        S.me().then(function (me) {
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
  // forgotten password: email a reset link; the link opens this page with ?reset=1 and a one-time sign-in
  function forgotForm(email, note) {
    app.innerHTML = '<form class="form narrow" id="ff"><h2>Reset your password</h2><p class="muted small">Type the email you use for Learnova. We will email you a link to choose a new password.</p>' +
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
        app.innerHTML = '<section class="panel tint"><p class="label">Check your email</p><h2>Reset link sent</h2><p>If <b>' + E(em) + '</b> has a Learnova account, a link to choose a new password is on its way. Open it on this device.</p>' +
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
