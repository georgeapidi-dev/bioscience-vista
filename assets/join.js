/* Join or sign in with a code · BioscienceVista · by BioscienceVista (21 Nov 2026, migration 071)
   Students need no email or password. One code box takes every kind of code:
   • website code (8 characters, personal, from BioscienceVista): the first time it makes your place on the site and you choose a PIN;
     after that, website code + PIN signs you in.
   • class sign-in code (6 characters, shared by a class): tap your name, type your PIN.
   • class joining code (7 characters, personal, from your teacher): once signed in, it puts you in that class (used once).
   The class-join server function checks codes and PINs and signs the student in. Independent learners use /register/. */
(function () {
  var S = window.BVS, app = document.getElementById('app'); if (!app || !S) return;
  var E = S.E, CODE = '', R = null, ME = null, PEND = 'bv-join-pending';
  var CSS = '.jn{max-width:620px;margin:0 auto}.jn-card{background:#fff;border-radius:22px;padding:22px;box-shadow:0 10px 30px rgba(15,23,42,.08);border:1px solid #e2e8f0}' +
    '.jn-steps{display:flex;gap:6px;margin:0 0 14px}.jn-steps span{flex:1;height:7px;border-radius:9px;background:#e2e8f0}.jn-steps span.on{background:linear-gradient(90deg,#f97316,#db2777)}' +
    '.jn h2{margin:0 0 4px}.jn .lead{color:#475569;margin:0 0 14px}.jn-code{font:800 1.8rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.3em;text-transform:uppercase;text-align:center;width:100%;padding:14px;border:3px solid #fdba74;border-radius:16px;background:#fff7ed}' +
    '.jn-pin{font:800 2rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.5em;text-align:center;width:100%;padding:12px;border:3px solid #c7d2fe;border-radius:16px;background:#eef2ff}' +
    '.jn-go{display:block;width:100%;margin-top:12px;font-size:1.1rem;padding:14px;border-radius:14px;background:linear-gradient(120deg,#f97316,#db2777);border:0;color:#fff;font-weight:800;cursor:pointer;text-align:center;text-decoration:none}.jn-go:disabled{opacity:.6;cursor:wait}' +
    '.jn-names{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,170px),1fr));gap:8px;margin:10px 0;max-height:52vh;overflow:auto;padding:2px}' +
    '.jn-names button{font:inherit;font-weight:700;text-align:left;padding:12px;border-radius:14px;border:2px solid #e2e8f0;background:#f8fafc;cursor:pointer;overflow-wrap:anywhere}.jn-names button:hover,.jn-names button:focus-visible{border-color:#f97316;background:#fff7ed}' +
    '.jn-msg{min-height:1.4em;margin:10px 0 0;font-weight:700;color:#b91c1c}.jn-msg.ok{color:#166534}.jn-back{background:none;border:0;color:#475569;font:inherit;cursor:pointer;padding:0;margin:0 0 10px;text-decoration:underline}' +
    '.jn-who{display:flex;gap:10px;align-items:center;background:#fff7ed;border-radius:14px;padding:10px 12px;margin:0 0 12px}.jn-who b{font-size:1.1rem}.jn-note{font-size:.88rem;color:#475569;margin:12px 0 0}' +
    '.jn-kinds{display:grid;gap:6px;margin:12px 0 0;font-size:.88rem;color:#334155}.jn-kinds div{background:#f8fafc;border-radius:10px;padding:7px 10px}.jn-kinds b{font-family:ui-monospace,monospace}' +
    '.jn label{display:block;font-weight:700;margin:10px 0 4px}.jn input[type=text]{width:100%;font:inherit;padding:12px;border:2px solid #cbd5e1;border-radius:12px}.jn input[readonly]{background:#f1f5f9}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function clean(v) { return String(v || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase(); }
  function call(body) {
    return S.db.functions.invoke('class-join', { body: body }).then(function (r) {
      if (!r.error) return r.data || {};
      var ctx = r.error.context; return ctx && typeof ctx.json === 'function' ? ctx.json().catch(function () { return { error: 'Something went wrong. Try again.' }; }) : { error: 'Could not reach BioscienceVista. Check your internet connection.' };
    }, function () { return { error: 'Could not reach BioscienceVista. Check your internet connection.' }; });
  }
  /* Next visits: just the PIN. This device remembers the code (and the name tapped) for KEEP_DAYS after the last sign-in;
     after that the saved code expires and the student types their code again. "Not you?" forgets it. */
  var KEEP = 'bv-join-me', KEEP_DAYS = 90, NEXT = null;
  function saved() { try { var o = JSON.parse(localStorage.getItem(KEEP) || 'null'); if (!o || !o.code) return null; if (Date.now() - (+o.at || 0) > KEEP_DAYS * 864e5) { localStorage.removeItem(KEEP); return { expired: true }; } return o; } catch (e) { return null; } }
  function remember(o) { try { if (o) { o.at = Date.now(); localStorage.setItem(KEEP, JSON.stringify(o)); } else localStorage.removeItem(KEEP); } catch (e) {} }
  function signInWith(token, then) {
    return S.db.auth.verifyOtp({ token_hash: token, type: 'magiclink' }).then(function (r) {
      if (r.error) throw r.error;
      if (NEXT) remember(NEXT);
      var pend = null; try { pend = sessionStorage.getItem(PEND); } catch (e) {}
      location.href = then || (pend ? '/join/' : '/dashboard/');
    });
  }
  function shell(step, inner) { app.innerHTML = '<div class="jn"><div class="jn-card"><div class="jn-steps">' + [1, 2, 3].map(function (i) { return '<span' + (i <= step ? ' class="on"' : '') + '></span>'; }).join('') + '</div>' + inner + '</div></div>'; }
  function msg(t, ok) { var m = app.querySelector('.jn-msg'); if (m) { m.textContent = t || ''; m.className = 'jn-msg' + (ok ? ' ok' : ''); } }
  function busy(b, on, label) { b.disabled = on; if (label) b.textContent = label; }
  function pinOk(p) { return /^[0-9]{4}$/.test(p) && !/^(\d)\1+$/.test(p) && '0123456789'.indexOf(p) < 0 && '9876543210'.indexOf(p) < 0; }

  // ---------- signed out: one code box ----------
  function codeStep(pre, note) {
    shell(1, '<h2>🎒 Sign in or join with your code</h2><p class="lead">' + (note || 'No email or password needed. Type the code you were given.') + '</p>' +
      '<form id="jc"><label for="jcode">Your code</label><input id="jcode" class="jn-code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + E(pre || '') + '">' +
      '<button class="jn-go" type="submit">Next ▶</button><p class="jn-msg" role="alert"></p></form>' +
      '<div class="jn-kinds"><div>🆕 <b>8 characters</b>: your personal website code. The first time, it opens your place on BioscienceVista; after that it signs you in with your PIN.</div>' +
      '<div>🏫 <b>6 characters</b>: your class sign-in code. Tap your name and type your PIN.</div>' +
      '<div>🎟 <b>7 characters</b>: a joining code from your teacher for one class. Sign in first, then type it.</div></div>' +
      '<p class="jn-note">👪 <b>Parent or carer?</b> <a href="/family/">See your child\'s progress with their website code</a>. Teachers with a teacher code type it above. Learning on your own? <a href="/register/?as=learner">Independent learner account</a>.</p>');
    var f = app.querySelector('#jc'), inp = app.querySelector('#jcode'); inp.focus();
    f.onsubmit = function (e) { e.preventDefault(); var c = clean(inp.value), b = f.querySelector('button');
      if (c.length < 6 || c.length > 8) return msg('Type the whole code: 6, 7 or 8 letters and numbers.');
      busy(b, true, 'Checking…');
      call({ action: 'lookup', code: c }).then(function (d) { busy(b, false, 'Next ▶'); if (d.error) return msg(d.error); CODE = c; R = d;
        if (d.kind === 'site') return newStep();
        if (d.kind === 'student') return pinStep({ name: d.name, pin: d.pin }, 'signin_code');
        if (d.kind === 'class') return nameStep();
        if (d.kind === 'join') { try { sessionStorage.setItem(PEND, c); } catch (x) {}
          return codeStep('', '🎟 That is your joining code for <b>' + E(d['class']) + '</b>' + (d.used ? ' (already used)' : '') + '. First sign in: type your website code (8 characters) or your class sign-in code (6 characters). The joining code is used straight after.'); }
        msg('That code is not recognised.'); }); };
  }
  // class sign-in code: tap your name
  function nameStep() {
    var many = R.students.length > 12;
    shell(2, '<button class="jn-back" type="button" id="jb">← Change the code</button><h2>' + E(R['class']) + '</h2><p class="lead">' + (R.teacher ? 'Teacher: ' + E(R.teacher) + ' · ' : '') + 'Tap your name.</p>' +
      (many ? '<label for="jf" class="sr-only">Find your name</label><input type="text" id="jf" placeholder="🔎 Type part of your name">' : '') +
      '<div class="jn-names" role="list">' + R.students.map(function (s, i) { return '<button type="button" role="listitem" data-i="' + i + '">' + E(s.name) + '</button>'; }).join('') + '</div>' +
      (R.students.length ? '' : '<p class="lead">No one has joined this class yet.</p>') +
      '<p class="jn-note">Not in the list? You are not in this class yet. Sign in with your website code, then type the joining code your teacher gave you.</p>');
    app.querySelector('#jb').onclick = function () { codeStep(CODE); };
    var jf = app.querySelector('#jf'); if (jf) { jf.focus(); jf.oninput = function () { var t = jf.value.trim().toLowerCase(); app.querySelectorAll('[data-i]').forEach(function (b) { b.hidden = !!t && b.textContent.toLowerCase().indexOf(t) < 0; }); }; }
    app.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { pinStep(R.students[+b.getAttribute('data-i')], 'signin'); }; });
  }
  // PIN (by class sign-in code + name, or by website code)
  function pinStep(s, how) {
    var back = function () { if (how === 'signin') nameStep(); else codeStep(CODE); };
    if (!s.pin) {   // no PIN yet: the student's own 8-character website code lets them create one (the class code alone cannot)
      shell(2, '<button class="jn-back" type="button" id="jb">← Back</button><div class="jn-who">👋 <b>' + E(s.name || 'Hello') + '</b></div><h2>Create your PIN</h2>' +
        '<p class="lead">You have not made a PIN yet. Type your personal <b>8-character website code</b> (your teacher or BioscienceVista gave it to you). Then you create your 4-digit PIN.</p>' +
        '<form id="jw8"><label for="j8">Your website code</label><input id="j8" class="jn-code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false">' +
        '<button class="jn-go" type="submit">Next ▶</button><p class="jn-msg" role="alert"></p></form>' +
        '<p class="jn-note">No website code? Ask your teacher: they can give you one, or set your PIN for you. Used to sign in with an email and password? <a href="/login/?next=/dashboard/">Sign in that way once</a>.</p>');
      app.querySelector('#jb').onclick = back;
      var f8 = app.querySelector('#jw8'), i8 = app.querySelector('#j8'); i8.focus();
      f8.onsubmit = function (e) { e.preventDefault(); var c = clean(i8.value), b = f8.querySelector('button');
        if (c.length !== 8) return msg('Your website code has 8 letters and numbers.');
        busy(b, true, 'Checking…');
        call({ action: 'lookup', code: c }).then(function (d) { busy(b, false, 'Next ▶'); if (d.error) return msg(d.error); CODE = c; R = d;
          if (d.kind === 'site') return newStep();
          if (d.kind === 'student') return pinStep({ name: d.name, pin: d.pin }, 'signin_code');
          msg('That is not a website code. Type the 8-character code with your name on it.'); }); };
      return;
    }
    shell(3, '<button class="jn-back" type="button" id="jb">← ' + (how === 'signin' ? 'Not me' : 'Change the code') + '</button><div class="jn-who">👋 <b>' + E(s.name || 'Welcome back') + '</b></div>' +
      '<form id="jp"><label for="jpin">Your 4-digit PIN</label><input id="jpin" class="jn-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="current-password">' +
      '<button class="jn-go" type="submit">Sign in ▶</button><p class="jn-msg" role="alert"></p></form><p class="jn-note">Forgot your PIN? Your teacher can reset it.</p>');
    app.querySelector('#jb').onclick = back;
    var f = app.querySelector('#jp'), inp = app.querySelector('#jpin'); inp.focus();
    f.onsubmit = function (e) { e.preventDefault(); var pin = inp.value.trim(), b = f.querySelector('button');
      if (!/^[0-9]{4,6}$/.test(pin)) return msg('Your PIN is 4 numbers.');
      busy(b, true, 'Signing in…');
      NEXT = how === 'signin' ? { how: 'signin', code: CODE, sid: s.id, name: s.name, pin: true } : { how: 'signin_code', code: CODE, name: s.name, pin: true };
      call(how === 'signin' ? { action: 'signin', code: CODE, sid: s.id, pin: pin } : { action: 'signin_code', code: CODE, pin: pin }).then(function (d) {
        if (d.error || !d.token_hash) { busy(b, false, 'Sign in ▶'); inp.value = ''; inp.focus(); if (/expired/i.test(d.error || '')) remember(null); return msg(d.error || 'Could not sign in.'); }
        msg('✓ Signed in…', true);
        return signInWith(d.token_hash, d.role === 'teacher' ? '/teach/' : null).catch(function () { busy(b, false, 'Sign in ▶'); msg('Could not finish signing in. Try again.'); });
      }); };
  }
  // unused website code: make your place on the site
  function newStep() {
    var named = !!(R.name && R.name.trim()), parts = String(R.name || '').trim().split(/\s+/), pre1 = named ? parts[0] : '', pre2 = named ? parts.slice(1).join(' ') : '';
    shell(2, '<button class="jn-back" type="button" id="jb">← Change the code</button><h2>✨ ' + (R.linked ? 'Welcome back' : 'Welcome to BioscienceVista') + '</h2>' + (R.linked ? '<p class="lead">' + (R.role === 'teacher' ? 'This is your teacher code. It opens your own classes and everything in them. Create your 4-digit PIN: from now on you sign in with this code and your PIN.' : 'This code opens your own place on BioscienceVista: your classes, work and results are all still there. Check your names and create your 4-digit PIN. From now on you sign in with this code and your PIN, not your email.') + '</p>' : '') + '<p class="lead"' + (R.linked ? ' hidden' : '') + '>This is your personal website code. Use it once now: give your two official names and create a 4-digit PIN. Keep the code: next time, your code and your PIN sign you in.</p>' +
      '<form id="jw"><label for="jn1">First name (official, as on your school record)</label><input type="text" id="jn1" autocomplete="given-name" maxlength="40" value="' + E(pre1) + '"' + (named ? ' readonly' : '') + '>' +
      '<label for="jn2">Family name (official)</label><input type="text" id="jn2" autocomplete="family-name" maxlength="40" value="' + E(pre2) + '"' + (named ? ' readonly' : '') + '>' +
      (named ? '<p class="jn-note">Not your name? Do not continue: give the code back to your teacher.</p>' : '') +
      '<label for="jp1">Create your 4-digit PIN</label><input id="jp1" class="jn-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="new-password">' +
      '<label for="jp2">Type the PIN again</label><input id="jp2" class="jn-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="new-password">' +
      '<button class="jn-go" type="submit">Start ▶</button><p class="jn-msg" role="alert"></p></form>' +
      '<p class="jn-note">🔒 Keep your PIN secret. Next, your teacher gives you a joining code for each class.</p>');
    app.querySelector('#jb').onclick = function () { codeStep(CODE); };
    var f = app.querySelector('#jw'); (named ? app.querySelector('#jp1') : app.querySelector('#jn1')).focus();
    f.onsubmit = function (e) { e.preventDefault(); var g = app.querySelector('#jn1').value.replace(/\s+/g, ' ').trim(), fm = app.querySelector('#jn2').value.replace(/\s+/g, ' ').trim(), n = (g + ' ' + fm).trim(), p1 = app.querySelector('#jp1').value.trim(), p2 = app.querySelector('#jp2').value.trim(), b = f.querySelector('button');
      if (g.length < 2) return msg('Type your official first name.');
      if (fm.length < 2) return msg('Type your official family name.');
      if (!/^[0-9]{4}$/.test(p1)) return msg('Your PIN must be exactly 4 numbers.');
      if (p1 !== p2) return msg('The two PINs are not the same. Type them again.');
      if (!pinOk(p1)) return msg('Choose a PIN that is harder to guess than ' + p1 + '.');
      busy(b, true, 'Making your place…');
      NEXT = { how: 'signin_code', code: CODE, name: g, pin: true };
      call({ action: 'new', code: CODE, first: g, last: fm, name: n, pin: p1 }).then(function (d) {
        if (d.error || !d.token_hash) { busy(b, false, 'Start ▶'); return msg(d.error || 'Could not use that code.'); }
        msg('🎉 Welcome, ' + n.split(' ')[0] + '!', true);
        return signInWith(d.token_hash, d.role === 'teacher' ? '/teach/' : d.linked ? '/dashboard/' : '/join/').catch(function () { busy(b, false, 'Start ▶'); msg('Your place is made, but signing in did not finish. Go back and sign in with your code and PIN.'); });
      }); };
  }

  function pinOnly(o) {
    CODE = o.code;
    pinStep({ id: o.sid, name: o.name, pin: true }, o.how);
    var back = app.querySelector('#jb'); if (back) { back.textContent = '← Not you? Use a different code'; back.onclick = function () { remember(null); codeStep(''); }; }
    var lead = app.querySelector('.jn-who'); if (lead) lead.insertAdjacentHTML('afterend', '<p class="lead" style="margin-top:-4px">Welcome back. Type your PIN.</p>');
  }
  // ---------- signed in: type a class joining code ----------
  function joinView(me, pre, first) {
    var nm = ((me.profile && me.profile.full_name) || '').split(' ')[0];
    shell(first ? 2 : 1, '<h2>🎟 ' + (first ? 'Now join your class' : 'Join a class') + '</h2><p class="lead">' + (nm ? 'Hello ' + E(nm) + '. ' : '') + 'Type the joining code your teacher gave you for the class. Each class has its own code, and each code works once.</p>' +
      '<form id="jc"><label for="jcode">Joining code</label><input id="jcode" class="jn-code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + E(pre || '') + '">' +
      '<button class="jn-go" type="submit">Join ▶</button><p class="jn-msg" role="alert"></p></form><div id="jdone"></div><p class="jn-note"><a href="/dashboard/">Go to my dashboard ▶</a></p>');
    var f = app.querySelector('#jc'), inp = app.querySelector('#jcode'); inp.focus();
    var go = function () { var c = clean(inp.value), b = f.querySelector('button');
      if (c.length !== 7) return msg(c.length === 6 ? 'That looks like the class sign-in code. To join, you need your own 7-character joining code from your teacher.' : 'A joining code has 7 letters and numbers.');
      busy(b, true, 'Joining…');
      S.db.rpc('redeem_class_code', { code: c }).then(function (r) { busy(b, false, 'Join ▶'); try { sessionStorage.removeItem(PEND); } catch (e) {}
        if (r.error) return msg(S.nice(r.error));
        inp.value = ''; msg('🎉 You are in ' + r.data + '. Have another joining code? Type it now.', true);
        app.querySelector('#jdone').innerHTML = '<a class="jn-go" href="/dashboard/">Open my dashboard ▶</a>'; }); };
    f.onsubmit = function (e) { e.preventDefault(); go(); };
    if (pre) go();
  }

  var pre = clean(new URLSearchParams(location.search).get('code') || '');
  if (!S.on) return S.notReady(app);
  S.me().then(function (me) {
    if (me && (me.staff || me.school || me.parent)) { shell(1, '<h2>Codes are for students</h2><p class="lead">You are signed in as a ' + (me.parent ? 'parent' : 'teacher') + '. Students type their codes here on their own device.</p><a class="jn-go" href="' + (me.parent ? '/parent/' : me.school ? '/teach/' : '/staff/') + '">Go to my page ▶</a>'); return; }
    if (me) { ME = me; var pend = ''; try { pend = sessionStorage.getItem(PEND) || ''; } catch (e) {}
      return joinView(me, pre.length === 7 ? pre : pend, !(me.classes || []).length); }
    if (pre.length === 7) { try { sessionStorage.setItem(PEND, pre); } catch (e) {} return codeStep('', '🎟 You have a class joining code. First sign in: type your website code (8 characters) or your class sign-in code (6 characters).'); }
    var sv = saved();
    if (sv && sv.code && !pre) return pinOnly(sv);
    codeStep(pre, sv && sv.expired ? 'Your saved code has expired on this device. Type your code again.' : '');
    if (pre.length === 6 || pre.length === 8) { var fm = app.querySelector('#jc'); if (fm) fm.onsubmit({ preventDefault: function () {} }); }   // a code typed in the homepage box goes straight on to the next step
  }, function () { codeStep(pre); });
})();
