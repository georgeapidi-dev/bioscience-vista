/* Registration and login · BioScience Vista */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), mode = app.getAttribute('data-mode');
  if (!S.on) return S.notReady(app);
  var next = new URLSearchParams(location.search).get('next');
  function go(me) { location.href = next && next.charAt(0) === '/' && next.charAt(1) !== '/' ? next : (me && me.staff ? '/staff/' : me && me.parent ? '/parent/' : '/dashboard/'); }

  if (mode === 'register' && new URLSearchParams(location.search).get('as') === 'parent') return parentRegister();
  if (mode === 'register') {
    app.innerHTML = '<form class="form narrow" id="rf" novalidate><h2>Your details</h2>' +
      '<p class="muted small">You need the class code your teacher gave you.</p>' +
      '<label class="f">Full name<input id="rn" autocomplete="name" required placeholder="As it appears on your school records"></label>' +
      '<label class="f">School email<input id="re" type="email" autocomplete="email" required></label>' +
      '<label class="f">Password (at least 8 characters)<input id="rp" type="password" autocomplete="new-password" minlength="8" required></label>' +
      '<label class="f">Confirm password<input id="rp2" type="password" autocomplete="new-password" required></label>' +
      '<label class="f">Class code<input id="rc" autocomplete="off" required placeholder="6 letters and numbers" autocapitalize="characters" style="text-transform:uppercase"></label><p class="small" id="rcn" aria-live="polite"></p>' +
      '<label class="chk"><input type="checkbox" id="ra" required> I will keep my password private and follow my school\'s rules for using this site.</label>' +
      '<button class="btn main" type="submit">Create account</button><p class="msg" id="rm" role="alert"></p>' +
      '<p class="small">Already registered? <a href="/login/' + (next ? '?next=' + encodeURIComponent(next) : '') + '">Log in</a> · Parent or carer? <a href="/register/?as=parent">Create a parent account</a></p></form>';
    var code = app.querySelector('#rc'), cn = app.querySelector('#rcn'), t;
    code.addEventListener('input', function () { clearTimeout(t); var v = code.value.trim(); cn.textContent = '';
      if (v.length < 4) return; t = setTimeout(function () { S.db.rpc('check_join_code', { code: v }).then(function (r) { cn.innerHTML = r.data ? '<span class="ok-t">✓ ' + E(r.data) + '</span>' : '<span class="bad-t">Code not recognised. Check it with your teacher.</span>'; }); }, 350); });
    app.querySelector('#rf').addEventListener('submit', function (e) {
      e.preventDefault(); var m = app.querySelector('#rm'); m.className = 'msg';
      var n = app.querySelector('#rn').value.trim(), em = app.querySelector('#re').value.trim(), p = app.querySelector('#rp').value, p2 = app.querySelector('#rp2').value, c = code.value.trim().toUpperCase();
      if (n.split(/\s+/).length < 2) return m.textContent = 'Please give your first and last name.';
      if (!/^\S+@\S+\.\S+$/.test(em)) return m.textContent = 'Please enter a valid email address.';
      if (p.length < 8) return m.textContent = 'Your password needs at least 8 characters.';
      if (p !== p2) return m.textContent = 'The two passwords do not match.';
      if (!app.querySelector('#ra').checked) return m.textContent = 'Please tick the box to agree.';
      m.textContent = 'Checking your class code…';
      S.db.rpc('check_join_code', { code: c }).then(function (r) {
        if (!r.data) { m.textContent = 'That class code is not recognised. Check it with your teacher.'; return; }
        m.textContent = 'Creating your account…';
        return S.db.auth.signUp({ email: em, password: p, options: { data: { full_name: n, join_code: c }, emailRedirectTo: location.origin + '/login/' } }).then(function (res) {
          if (res.error) { m.textContent = S.nice(res.error); return; }
          if (res.data.session) { location.href = next && next.charAt(0) === '/' && next.charAt(1) !== '/' ? next : '/dashboard/'; return; }
          app.innerHTML = '<section class="panel tint"><p class="label">Almost there</p><h2>Check your email</h2><p>We sent a confirmation link to <b>' + E(em) + '</b>. Open it to activate your account, then <a href="/login/">log in</a>. You are joining <b>' + E(r.data) + '</b>.</p><p class="small muted">No email after a few minutes? Check your spam folder.</p></section>';
        });
      });
    });
    return;
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
  function loginForm(msg) {
    app.innerHTML = '<form class="form narrow" id="lf"><h2>Log in</h2><label class="f">Email<input id="le" type="email" autocomplete="email" required></label>' +
      '<label class="f">Password<input id="lp" type="password" autocomplete="current-password" required></label>' +
      '<button class="btn main" type="submit">Log in</button><p class="msg" id="lm" role="alert">' + E(msg || '') + '</p>' +
      '<p class="small"><a href="#" id="fp">Forgot your password?</a> · New student? <a href="/register/">Create an account</a></p></form>';
    app.querySelector('#lf').addEventListener('submit', function (e) {
      e.preventDefault(); var m = app.querySelector('#lm'); m.className = 'msg'; m.textContent = 'Logging in…';
      S.db.auth.signInWithPassword({ email: app.querySelector('#le').value.trim(), password: app.querySelector('#lp').value }).then(function (r) {
        if (r.error) { m.textContent = /confirm/i.test(r.error.message) ? 'Please confirm your email first: open the link we sent you.' : 'Email or password is not right.'; return; }
        S.me().then(go);
      });
    });
    app.querySelector('#fp').addEventListener('click', function (e) {
      e.preventDefault(); var em = app.querySelector('#le').value.trim(), m = app.querySelector('#lm');
      if (!em) { m.textContent = 'Type your email above first, then click "Forgot your password?".'; return; }
      S.db.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/login/?reset=1' }).then(function (r) { m.className = r.error ? 'msg' : 'msg ok'; m.textContent = r.error ? S.nice(r.error) : 'If that email has an account, a reset link is on its way.'; });
    });
  }
  function resetForm() {
    app.innerHTML = '<form class="form narrow" id="nf"><h2>Choose a new password</h2><label class="f">New password (at least 8 characters)<input id="np" type="password" autocomplete="new-password" minlength="8" required></label><button class="btn main" type="submit">Save password</button><p class="msg" id="nm"></p></form>';
    app.querySelector('#nf').addEventListener('submit', function (e) {
      e.preventDefault(); var p = app.querySelector('#np').value, m = app.querySelector('#nm'); if (p.length < 8) return m.textContent = 'At least 8 characters, please.';
      S.db.auth.updateUser({ password: p }).then(function (r) { if (r.error) { m.textContent = S.nice(r.error); return; } S.me().then(go); });
    });
  }
  S.db.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') resetForm(); });
  S.me().then(function (me) { if (new URLSearchParams(location.search).get('reset')) return resetForm(); if (me) go(me); else loginForm(); });
})();
