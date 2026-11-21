/* Join or sign in with a class code · BioscienceVista · by BioscienceVista (21 Nov 2026)
   Students in a teacher's class need no email or password: class code → tap your name → PIN.
   New in the class: type your name and choose a PIN. The class-join server function checks everything and signs the student in.
   Students already signed in join another teacher's class here by typing its code (join_class). Independent learners use /register/. */
(function () {
  var S = window.BVS, app = document.getElementById('app'); if (!app || !S) return;
  var E = S.E, R = null, CODE = '', ME = null;
  var CSS = '.jn{max-width:620px;margin:0 auto}.jn-card{background:#fff;border-radius:22px;padding:22px;box-shadow:0 10px 30px rgba(15,23,42,.08);border:1px solid #e2e8f0}' +
    '.jn-steps{display:flex;gap:6px;margin:0 0 14px}.jn-steps span{flex:1;height:7px;border-radius:9px;background:#e2e8f0}.jn-steps span.on{background:linear-gradient(90deg,#f97316,#db2777)}' +
    '.jn h2{margin:0 0 4px}.jn .lead{color:#475569;margin:0 0 14px}.jn-code{font:800 2rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.35em;text-transform:uppercase;text-align:center;width:100%;padding:14px;border:3px solid #fdba74;border-radius:16px;background:#fff7ed}' +
    '.jn-pin{font:800 2rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.5em;text-align:center;width:100%;padding:12px;border:3px solid #c7d2fe;border-radius:16px;background:#eef2ff}' +
    '.jn-go{display:block;width:100%;margin-top:12px;font-size:1.1rem;padding:14px;border-radius:14px;background:linear-gradient(120deg,#f97316,#db2777);border:0;color:#fff;font-weight:800;cursor:pointer}.jn-go:disabled{opacity:.6;cursor:wait}' +
    '.jn-names{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,170px),1fr));gap:8px;margin:10px 0;max-height:52vh;overflow:auto;padding:2px}' +
    '.jn-names button{font:inherit;font-weight:700;text-align:left;padding:12px;border-radius:14px;border:2px solid #e2e8f0;background:#f8fafc;cursor:pointer;overflow-wrap:anywhere}.jn-names button:hover,.jn-names button:focus-visible{border-color:#f97316;background:#fff7ed}' +
    '.jn-new{display:block;width:100%;font:inherit;font-weight:800;padding:12px;border-radius:14px;border:2px dashed #a78bfa;background:#f5f3ff;color:#5b21b6;cursor:pointer;margin-top:6px}' +
    '.jn-msg{min-height:1.4em;margin:10px 0 0;font-weight:700;color:#b91c1c}.jn-msg.ok{color:#166534}.jn-back{background:none;border:0;color:#475569;font:inherit;cursor:pointer;padding:0;margin:0 0 10px;text-decoration:underline}' +
    '.jn-who{display:flex;gap:10px;align-items:center;background:#fff7ed;border-radius:14px;padding:10px 12px;margin:0 0 12px}.jn-who b{font-size:1.1rem}.jn-note{font-size:.88rem;color:#475569;margin:12px 0 0}' +
    '.jn label{display:block;font-weight:700;margin:10px 0 4px}.jn input[type=text]{width:100%;font:inherit;padding:12px;border:2px solid #cbd5e1;border-radius:12px}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function call(body) {   // the class-join server function; errors come back as {error}
    return S.db.functions.invoke('class-join', { body: body }).then(function (r) {
      if (!r.error) return r.data || {};
      var ctx = r.error.context; return ctx && typeof ctx.json === 'function' ? ctx.json().catch(function () { return { error: 'Something went wrong. Try again.' }; }) : { error: 'Could not reach BioscienceVista. Check your internet connection.' };
    }, function () { return { error: 'Could not reach BioscienceVista. Check your internet connection.' }; });
  }
  function signInWith(token) {
    return S.db.auth.verifyOtp({ token_hash: token, type: 'magiclink' }).then(function (r) {
      if (r.error) throw r.error; try { localStorage.setItem('bv-last-code', CODE); } catch (e) {}
      location.href = '/dashboard/';
    });
  }
  function shell(step, inner) { app.innerHTML = '<div class="jn"><div class="jn-card"><div class="jn-steps">' + [1, 2, 3].map(function (i) { return '<span' + (i <= step ? ' class="on"' : '') + '></span>'; }).join('') + '</div>' + inner + '</div></div>'; }
  function msg(t, ok) { var m = app.querySelector('.jn-msg'); if (m) { m.textContent = t || ''; m.className = 'jn-msg' + (ok ? ' ok' : ''); } }
  function busy(b, on, label) { b.disabled = on; if (label) b.textContent = label; }

  // step 1: the class code
  function codeStep(pre) {
    var last = ''; try { last = localStorage.getItem('bv-last-code') || ''; } catch (e) {}
    shell(1, '<h2>🎒 Join or sign in with your class code</h2><p class="lead">Your teacher gives you the class code. No email or password needed.</p>' +
      '<form id="jc"><label for="jcode">Class code</label><input id="jcode" class="jn-code" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + E(pre || last) + '" aria-describedby="jcm">' +
      '<button class="jn-go" type="submit">Next ▶</button><p class="jn-msg" id="jcm" role="alert"></p></form>' +
      '<p class="jn-note">Learning on your own, without a teacher? <a href="/register/?as=learner">Create an independent learner account</a>. Teachers and parents: <a href="/login/">log in here</a>.</p>');
    var f = app.querySelector('#jc'), inp = app.querySelector('#jcode'); inp.focus();
    f.onsubmit = function (e) { e.preventDefault(); var c = inp.value.replace(/\s+/g, '').toUpperCase(), b = f.querySelector('button');
      if (!/^[A-Z0-9]{4,10}$/.test(c)) return msg('Type the class code your teacher gave you (letters and numbers).');
      if (ME) return joinSignedIn(c, b);
      busy(b, true, 'Finding your class…');
      call({ action: 'roster', code: c }).then(function (d) { busy(b, false, 'Next ▶'); if (d.error) return msg(d.error); CODE = c; R = d; nameStep(); }); };
  }
  // signed in already: join another class with its code
  function joinSignedIn(c, b) {
    busy(b, true, 'Joining…');
    S.db.rpc('join_class', { code: c }).then(function (r) { busy(b, false, 'Join ▶');
      if (r.error) return msg(S.nice(r.error));
      shell(3, '<h2>🎉 You are in ' + E(r.data) + '</h2><p class="lead">Your teacher can now set you work. It appears on your dashboard.</p><a class="jn-go" style="text-align:center;text-decoration:none" href="/dashboard/">Go to my dashboard ▶</a>'); });
  }
  // step 2: tap your name
  function nameStep() {
    var many = R.students.length > 12;
    shell(2, '<button class="jn-back" type="button" id="jb">← Change the code</button><h2>' + E(R['class']) + '</h2><p class="lead">' + (R.teacher ? 'Teacher: ' + E(R.teacher) + ' · ' : '') + 'Tap your name.</p>' +
      (many ? '<label for="jf" class="sr-only">Find your name</label><input type="text" id="jf" placeholder="🔎 Type part of your name">' : '') +
      '<div class="jn-names" role="list">' + R.students.map(function (s, i) { return '<button type="button" role="listitem" data-i="' + i + '">' + E(s.name) + '</button>'; }).join('') + '</div>' +
      (R.students.length ? '' : '<p class="lead">No one has joined this class yet.</p>') +
      '<button class="jn-new" type="button" id="jnew">✨ I am new in this class</button><p class="jn-msg" role="alert"></p>');
    app.querySelector('#jb').onclick = function () { codeStep(CODE); };
    app.querySelector('#jnew').onclick = newStep;
    var jf = app.querySelector('#jf'); if (jf) { jf.focus(); jf.oninput = function () { var t = jf.value.trim().toLowerCase(); app.querySelectorAll('[data-i]').forEach(function (b) { b.hidden = !!t && b.textContent.toLowerCase().indexOf(t) < 0; }); }; }
    app.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { pinStep(R.students[+b.getAttribute('data-i')]); }; });
  }
  // step 3: PIN
  function pinStep(s) {
    if (!s.pin) {
      shell(3, '<button class="jn-back" type="button" id="jb">← Not me</button><div class="jn-who">👋 <b>' + E(s.name) + '</b></div><h2>Choose your PIN first</h2>' +
        '<p class="lead">You have not chosen a PIN yet. You can do it in one of two ways:</p><ul><li>Ask your teacher to set a PIN for you (they can do it in a few seconds).</li><li>If you used to sign in with an email and password, <a href="/login/?next=/dashboard/">sign in that way once</a>: your dashboard asks you to choose a PIN.</li></ul>');
      app.querySelector('#jb').onclick = nameStep; return;
    }
    shell(3, '<button class="jn-back" type="button" id="jb">← Not me</button><div class="jn-who">👋 <b>' + E(s.name) + '</b></div>' +
      '<form id="jp"><label for="jpin">Your PIN</label><input id="jpin" class="jn-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="current-password">' +
      '<button class="jn-go" type="submit">Sign in ▶</button><p class="jn-msg" role="alert"></p></form><p class="jn-note">Forgot your PIN? Your teacher can reset it.</p>');
    app.querySelector('#jb').onclick = nameStep;
    var f = app.querySelector('#jp'), inp = app.querySelector('#jpin'); inp.focus();
    f.onsubmit = function (e) { e.preventDefault(); var pin = inp.value.trim(), b = f.querySelector('button');
      if (!/^[0-9]{4,6}$/.test(pin)) return msg('Your PIN is 4 to 6 numbers.');
      busy(b, true, 'Signing in…');
      call({ action: 'signin', code: CODE, sid: s.id, pin: pin }).then(function (d) {
        if (d.error || !d.token_hash) { busy(b, false, 'Sign in ▶'); inp.value = ''; inp.focus(); return msg(d.error || 'Could not sign in.'); }
        msg('✓ Signed in. Opening your dashboard…', true);
        return signInWith(d.token_hash).catch(function () { busy(b, false, 'Sign in ▶'); msg('Could not finish signing in. Try again.'); });
      }); };
  }
  // new in the class: name and a new PIN
  function newStep() {
    shell(3, '<button class="jn-back" type="button" id="jb">← Back to the names</button><h2>✨ Join ' + E(R['class']) + '</h2><p class="lead">Use your real name, as your teacher knows you.</p>' +
      '<form id="jw"><label for="jn">First name and family name</label><input type="text" id="jn" autocomplete="name" maxlength="60">' +
      '<label for="jp1">Choose a PIN (4 to 6 numbers)</label><input id="jp1" class="jn-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password">' +
      '<label for="jp2">Type the PIN again</label><input id="jp2" class="jn-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="new-password">' +
      '<button class="jn-go" type="submit">Join the class ▶</button><p class="jn-msg" role="alert"></p></form>' +
      '<p class="jn-note">🔒 Keep your PIN secret, like a password. Next time: class code → your name → PIN. Lessons and quizzes open once BioscienceVista has checked your place in the class.</p>');
    app.querySelector('#jb').onclick = nameStep;
    var f = app.querySelector('#jw'); app.querySelector('#jn').focus();
    f.onsubmit = function (e) { e.preventDefault(); var n = app.querySelector('#jn').value.replace(/\s+/g, ' ').trim(), p1 = app.querySelector('#jp1').value.trim(), p2 = app.querySelector('#jp2').value.trim(), b = f.querySelector('button');
      if (n.split(' ').length < 2) return msg('Type your first name and your family name.');
      if (!/^[0-9]{4,6}$/.test(p1)) return msg('Your PIN must be 4 to 6 numbers.');
      if (p1 !== p2) return msg('The two PINs are not the same. Type them again.');
      if (/^(\d)\1+$/.test(p1) || '0123456789'.indexOf(p1) >= 0 || '9876543210'.indexOf(p1) >= 0) return msg('Choose a PIN that is harder to guess than ' + p1 + '.');
      busy(b, true, 'Joining…');
      call({ action: 'new', code: CODE, name: n, pin: p1 }).then(function (d) {
        if (d.error || !d.token_hash) { busy(b, false, 'Join the class ▶'); return msg(d.error || 'Could not join the class.'); }
        msg('🎉 You are in ' + (d['class'] || 'the class') + '. Opening your dashboard…', true);
        return signInWith(d.token_hash).catch(function () { busy(b, false, 'Join the class ▶'); msg('You joined, but signing in did not finish. Go back and sign in with your name and PIN.'); });
      }); };
  }

  var pre = (new URLSearchParams(location.search).get('code') || '').toUpperCase();
  if (!S.on) return S.notReady(app);
  S.me().then(function (me) {
    if (me && !me.staff && !me.parent && !me.school) {   // signed in: join another class
      ME = me;
      shell(1, '<h2>🎒 Join another class</h2><p class="lead">Signed in as <b>' + E((me.profile && me.profile.full_name) || '') + '</b>. Type the code of the class you want to join. You are in straight away.</p>' +
        '<form id="jc"><label for="jcode">Class code</label><input id="jcode" class="jn-code" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + E(pre) + '">' +
        '<button class="jn-go" type="submit">Join ▶</button><p class="jn-msg" role="alert"></p></form><p class="jn-note"><a href="/dashboard/">← Back to my dashboard</a></p>');
      var f = app.querySelector('#jc'), inp = app.querySelector('#jcode'); inp.focus();
      f.onsubmit = function (e) { e.preventDefault(); var c = inp.value.replace(/\s+/g, '').toUpperCase(); if (!/^[A-Z0-9]{4,10}$/.test(c)) return msg('Type the class code your teacher gave you.'); joinSignedIn(c, f.querySelector('button')); };
      return;
    }
    if (me && (me.staff || me.school || me.parent)) { shell(1, '<h2>Class codes are for students</h2><p class="lead">You are signed in as a ' + (me.parent ? 'parent' : 'teacher') + '. Students type the class code here on their own device.</p><a class="jn-go" style="text-align:center;text-decoration:none" href="' + (me.parent ? '/parent/' : me.school ? '/teach/' : '/staff/') + '">Go to my page ▶</a>'); return; }
    codeStep(pre);
  }, function () { codeStep(pre); });
})();
