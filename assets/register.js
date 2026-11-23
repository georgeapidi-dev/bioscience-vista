/* Registration wizard · BioscienceVista · by George Apidi (22 Nov 2026, migration 078)
   Student, Teacher and Independent learner: details → pathway → section → subjects → review → (students) class code.
   Every account waits for the admin. The subjects chosen here are requests; the admin authorises them.
   A class code makes a join request that the class teacher approves. One verified email per person. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app');
  var KIND = (new URLSearchParams(location.search).get('as') || '').replace('learner', 'independent');
  var TREE = null, F = { pathways: [], sections: [], courses: [] }, STEP = 0;
  var COUNTRIES = 'Kenya|Uganda|Tanzania|Rwanda|Burundi|Ethiopia|Somalia|South Sudan|Democratic Republic of the Congo|Nigeria|Ghana|South Africa|Egypt|Morocco|Zambia|Zimbabwe|Malawi|Mozambique|Botswana|Namibia|Cameroon|Senegal|Côte d\'Ivoire|Sudan|Algeria|Tunisia|Angola|Madagascar|Mauritius|Seychelles|' +
    'United Arab Emirates|Saudi Arabia|Qatar|Kuwait|Oman|Bahrain|Jordan|Lebanon|Israel|Turkey|Iran|Iraq|Pakistan|India|Bangladesh|Sri Lanka|Nepal|China|Hong Kong|Japan|South Korea|Singapore|Malaysia|Indonesia|Thailand|Vietnam|Philippines|' +
    'United Kingdom|Ireland|France|Germany|Netherlands|Belgium|Switzerland|Austria|Italy|Spain|Portugal|Sweden|Norway|Denmark|Finland|Poland|Czech Republic|Hungary|Romania|Greece|Russia|Ukraine|' +
    'United States|Canada|Mexico|Brazil|Argentina|Chile|Colombia|Peru|Australia|New Zealand|Other';
  var CSS = '.rg{max-width:760px;margin:0 auto}.rg-card{background:#fff;border-radius:22px;padding:22px;border:1px solid #e2e8f0;box-shadow:0 12px 34px rgba(15,23,42,.08)}' +
    '.rg-steps{display:flex;gap:6px;margin:0 0 6px}.rg-steps span{flex:1;height:8px;border-radius:9px;background:#e2e8f0}.rg-steps span.on{background:linear-gradient(90deg,#0ea5e9,#7c3aed,#db2777)}' +
    '.rg-steplbl{font-size:.82rem;color:#64748b;font-weight:700;margin:0 0 12px}.rg h2{margin:0 0 6px}.rg .lead{color:#475569;margin:0 0 14px}' +
    '.rg-types{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px}.rg-type{display:block;text-decoration:none;color:#0f172a;border-radius:18px;padding:18px;border:2px solid #e2e8f0;background:#f8fafc}' +
    '.rg-type:hover,.rg-type:focus-visible{border-color:#7c3aed;background:#faf5ff}.rg-type b{display:block;font-size:1.1rem;margin:6px 0 4px}.rg-type span{font-size:.88rem;color:#475569}.rg-type i{font-style:normal;font-size:1.8rem}' +
    '.rg-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px}.rg-opt{position:relative;display:block;border-radius:18px;padding:18px;border:2px solid #e2e8f0;cursor:pointer;background:#fff}' +
    '.rg-opt input{position:absolute;opacity:0}.rg-opt b{display:block;font-size:1.05rem}.rg-opt span{font-size:.86rem;color:#475569}.rg-opt.on{border-color:transparent;box-shadow:0 0 0 3px #7c3aed;background:#faf5ff}' +
    '.rg-opt.cam.on{box-shadow:0 0 0 3px #0369a1;background:#f0f9ff}.rg-opt.ib.on{box-shadow:0 0 0 3px #be123c;background:#fff1f2}.rg-opt:focus-within{outline:3px solid #a5b4fc;outline-offset:2px}' +
    '.rg-sub{border:1px solid #e2e8f0;border-radius:16px;padding:12px 14px;margin:0 0 10px}.rg-sub h3{margin:0 0 8px;font-size:1rem}.rg-lv{display:flex;flex-wrap:wrap;gap:8px}.rg-lv label{display:inline-flex;gap:6px;align-items:center;padding:7px 12px;border-radius:999px;border:2px solid #e2e8f0;cursor:pointer;font-weight:700;font-size:.9rem}' +
    '.rg-lv label.on{border-color:#7c3aed;background:#f5f3ff}.rg-lv small{font-weight:500;color:#64748b}.rg label.f{display:block;font-weight:700;margin:10px 0 4px}.rg input[type=text],.rg input[type=email],.rg input[type=password],.rg select{width:100%;font:inherit;padding:11px;border:2px solid #cbd5e1;border-radius:12px;background:#fff}' +
    '.rg-nav{display:flex;gap:10px;justify-content:space-between;margin-top:16px}.rg-btn{font:inherit;font-weight:800;padding:12px 18px;border-radius:14px;border:0;cursor:pointer;background:linear-gradient(120deg,#7c3aed,#db2777);color:#fff}' +
    '.rg-btn.alt{background:#f1f5f9;color:#0f172a}.rg-btn:disabled{opacity:.6;cursor:wait}.rg-msg{min-height:1.3em;font-weight:700;color:#b91c1c;margin:10px 0 0}.rg-msg.ok{color:#166534}' +
    '.rg-sum{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;background:#f8fafc;border-radius:14px;padding:14px}.rg-sum dt{font-weight:800;color:#334155}.rg-sum dd{margin:0}' +
    '.rg-policy{font-size:.86rem;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:10px 12px;margin:12px 0}.rg-code{font:800 1.6rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.25em;text-transform:uppercase;text-align:center}' +
    '.rg-class{background:#f0fdf4;border:2px solid #86efac;border-radius:16px;padding:14px;margin:12px 0}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  var STEPS = { student: ['Your details', 'Pathway', 'Section', 'Subjects', 'Review', 'Join a class'], independent: ['Your details', 'Pathway', 'Section', 'Subjects', 'Review'], teacher: ['Your details', 'Pathways', 'Sections', 'Subjects you teach', 'Review'] };
  var T = function () { return KIND === 'teacher'; };
  function shell(inner) {
    var names = STEPS[KIND];
    app.innerHTML = '<div class="rg"><div class="rg-card"><div class="rg-steps" aria-hidden="true">' + names.map(function (n, i) { return '<span' + (i <= STEP ? ' class="on"' : '') + '></span>'; }).join('') + '</div>' +
      '<p class="rg-steplbl">Step ' + (STEP + 1) + ' of ' + names.length + ': ' + E(names[STEP]) + '</p>' + inner + '</div></div>';
    var h = app.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: false }); }
  }
  function msg(t, ok) { var m = app.querySelector('.rg-msg'); if (m) { m.textContent = t || ''; m.className = 'rg-msg' + (ok ? ' ok' : ''); } }
  function nav(back, nextLabel) { return '<p class="rg-msg" role="alert"></p><div class="rg-nav">' + (back ? '<button type="button" class="rg-btn alt" id="rgb">← Back</button>' : '<a class="rg-btn alt" href="/register/">← Account type</a>') + '<button type="submit" class="rg-btn" id="rgn">' + (nextLabel || 'Next ▶') + '</button></div>'; }
  function wire(onNext) {
    var f = app.querySelector('form'); f.onsubmit = function (e) { e.preventDefault(); onNext(); };
    var b = app.querySelector('#rgb'); if (b) b.onclick = function () { STEP--; draw(); };
  }
  function sectionsOf(pw) { return TREE.sections.filter(function (s) { return pw.indexOf(s.pathway) >= 0; }); }
  function coursesOf(secs) { return TREE.courses.filter(function (c) { return secs.indexOf(c.section) >= 0; }); }
  var SUBJ = { biology: 'Biology', chemistry: 'Chemistry', physics: 'Physics', mathematics: 'Mathematics', 'maths-aa': 'Mathematics: Analysis and Approaches', 'maths-ai': 'Mathematics: Applications and Interpretation', ess: 'Environmental Systems and Societies (ESS)', science: 'MYP Science' };
  var PW = { cambridge: ['Cambridge International', 'KS3 · IGCSE · A Level', '🎓'], ib: ['International Baccalaureate', 'MYP · IBDP', '🌍'] };

  function draw() { [details, pathway, section, subjects, review, classCode][STEP](); }

  // 0 · details
  function details() {
    shell('<form novalidate><h2>' + (T() ? 'Teacher registration' : KIND === 'independent' ? 'Independent learner registration' : 'Student registration') + '</h2>' +
      '<p class="lead">' + (T() ? 'After the admin approves you, you can create classes in the subjects you are authorised to teach.' : KIND === 'independent' ? 'Learn on your own. After approval you see the materials of your subjects that your membership allows.' : 'After the admin approves you, you can join your teacher\'s class with the class code.') + '</p>' +
      '<label class="f" for="rn">Full name</label><input type="text" id="rn" autocomplete="name" required value="' + E(F.name || '') + '">' +
      '<label class="f" for="rs">School name' + (KIND === 'independent' ? ' <small>(optional)</small>' : '') + '</label><input type="text" id="rs" autocomplete="organization" maxlength="120" value="' + E(F.school || '') + '"' + (T() ? ' placeholder="or Private tutor"' : '') + '>' +
      '<label class="f" for="rc">Country</label><select id="rc" required><option value="">Choose…</option>' + COUNTRIES.split('|').map(function (c) { return '<option' + (F.country === c ? ' selected' : '') + '>' + E(c) + '</option>'; }).join('') + '</select>' +
      '<label class="f" for="re">Email address <small>(we send a link to verify it; one account per person)</small></label><input type="email" id="re" autocomplete="email" required value="' + E(F.email || '') + '">' +
      '<label class="f" for="rp">Password <small>(at least 8 characters)</small></label><input type="password" id="rp" autocomplete="new-password" minlength="8" required value="' + E(F.pw || '') + '">' +
      '<label class="f" for="rp2">Confirm password</label><input type="password" id="rp2" autocomplete="new-password" required value="' + E(F.pw || '') + '">' +
      nav(false) + '</form>');
    wire(function () {
      var n = app.querySelector('#rn').value.replace(/\s+/g, ' ').trim(), s = app.querySelector('#rs').value.trim(), c = app.querySelector('#rc').value,
          em = app.querySelector('#re').value.trim(), p = app.querySelector('#rp').value, p2 = app.querySelector('#rp2').value;
      if (n.split(' ').length < 2) return msg('Please give your first and last name.');
      if (KIND !== 'independent' && s.length < 2) return msg(T() ? 'Please type your school, or "Private tutor".' : 'Please type your school name.');
      if (!c) return msg('Please choose your country.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return msg('Please enter a valid email address.');
      if (p.length < 8) return msg('Your password needs at least 8 characters.');
      if (p !== p2) return msg('The two passwords do not match.');
      F.name = n; F.school = s; F.country = c; F.email = em; F.pw = p; STEP = 1; draw();
    });
  }
  // 1 · pathway (teachers may choose both)
  function pathway() {
    var multi = T();
    shell('<form><h2>Choose your pathway' + (multi ? 's' : '') + '</h2><p class="lead">' + (multi ? 'Tick every curriculum you teach.' : 'Which curriculum do you follow?') + '</p><div class="rg-opts" role="' + (multi ? 'group' : 'radiogroup') + '">' +
      Object.keys(PW).map(function (k) { var on = F.pathways.indexOf(k) >= 0;
        return '<label class="rg-opt ' + (k === 'ib' ? 'ib' : 'cam') + (on ? ' on' : '') + '"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="pw" value="' + k + '"' + (on ? ' checked' : '') + '><i style="font-style:normal;font-size:1.8rem">' + PW[k][2] + '</i><b>' + PW[k][0] + '</b><span>' + PW[k][1] + '</span></label>'; }).join('') +
      '</div>' + nav(true) + '</form>');
    toggles('pw');
    wire(function () { var v = picked('pw'); if (!v.length) return msg('Choose a pathway.');
      F.pathways = v; F.sections = F.sections.filter(function (s) { return sectionsOf(v).some(function (x) { return x.section === s; }); }); STEP = 2; draw(); });
  }
  // 2 · section
  function section() {
    var multi = T(), secs = sectionsOf(F.pathways);
    shell('<form><h2>Choose your section' + (multi ? 's' : '') + '</h2><p class="lead">' + (multi ? 'Tick every section you teach.' : 'Which part of the ' + E(PW[F.pathways[0]][0]) + ' pathway are you in?') + '</p><div class="rg-opts">' +
      secs.map(function (s) { var on = F.sections.indexOf(s.section) >= 0;
        return '<label class="rg-opt ' + (s.pathway === 'ib' ? 'ib' : 'cam') + (on ? ' on' : '') + '"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="sec" value="' + E(s.section) + '"' + (on ? ' checked' : '') + '><b>' + E(s.name) + '</b><span>' + E(s.blurb || '') + (multi ? ' · ' + E(PW[s.pathway][0]) : '') + '</span></label>'; }).join('') +
      '</div>' + nav(true) + '</form>');
    toggles('sec');
    wire(function () { var v = picked('sec'); if (!v.length) return msg('Choose a section.');
      F.sections = v; var ok = coursesOf(v).map(function (c) { return c.slug; }); F.courses = F.courses.filter(function (c) { return ok.indexOf(c) >= 0; }); STEP = 3; draw(); });
  }
  // 3 · subjects (with their level: SL/HL, Core/Extended, AS/A Level, Stage or Grade)
  function subjects() {
    var cs = coursesOf(F.sections), groups = {}, order = [];
    cs.forEach(function (c) { var k = c.section + '|' + c.subject; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(c); });
    var secName = {}; TREE.sections.forEach(function (s) { secName[s.section] = s.name; });
    shell('<form><h2>' + (T() ? 'Subjects you teach' : 'Choose your subjects') + '</h2><p class="lead">' + (T() ? 'Tick each subject and level you teach. The admin authorises each one.' : 'Tick each subject you study and its level' + (F.sections[0] === 'myp' ? ' (your MYP year)' : '') + '. You can choose more than one subject.') + '</p>' +
      order.map(function (k) { var g = groups[k], sec = k.split('|')[0], sub = k.split('|')[1];
        return '<fieldset class="rg-sub"><legend class="sr-only">' + E(SUBJ[sub] || sub) + '</legend><h3>' + E(SUBJ[sub] || sub) + (F.sections.length > 1 ? ' <small style="color:#64748b">· ' + E(secName[sec]) + '</small>' : '') + '</h3><div class="rg-lv">' +
          g.map(function (c) { var on = F.courses.indexOf(c.slug) >= 0;
            return '<label class="' + (on ? 'on' : '') + '"><input type="checkbox" name="crs" value="' + E(c.slug) + '"' + (on ? ' checked' : '') + '> ' + E(c.level || c.name) + (c.lessons ? '' : ' <small>(lessons being added)</small>') + '</label>'; }).join('') + '</div></fieldset>'; }).join('') +
      (T() ? '' : '<p class="small muted">HL includes the SL lessons and Extended includes Core, so tick only your own level.</p>') + nav(true) + '</form>');
    app.querySelectorAll('[name=crs]').forEach(function (b) { b.onchange = function () {
      if (!T() && b.checked) b.closest('.rg-lv').querySelectorAll('[name=crs]').forEach(function (o) { if (o !== b) o.checked = false; });   // one level per subject
      app.querySelectorAll('.rg-lv label').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); }; });
    wire(function () { var v = picked('crs'); if (!v.length) return msg('Tick at least one subject.'); F.courses = v; STEP = 4; draw(); });
  }
  // 4 · review and submit
  function review() {
    var name = {}; TREE.courses.forEach(function (c) { name[c.slug] = c.name; });
    var secName = {}; TREE.sections.forEach(function (s) { secName[s.section] = s.name; });
    shell('<form><h2>Check and submit</h2><p class="lead">The admin checks every registration before the account opens.</p><dl class="rg-sum">' +
      '<dt>Name</dt><dd>' + E(F.name) + '</dd><dt>School</dt><dd>' + E(F.school || '—') + '</dd><dt>Country</dt><dd>' + E(F.country) + '</dd><dt>Email</dt><dd>' + E(F.email) + '</dd>' +
      '<dt>Account</dt><dd>' + (T() ? 'Teacher' : KIND === 'independent' ? 'Independent learner' : 'Student') + '</dd>' +
      '<dt>Pathway</dt><dd>' + F.pathways.map(function (p) { return E(PW[p][0]); }).join(', ') + '</dd><dt>Section</dt><dd>' + F.sections.map(function (s) { return E(secName[s]); }).join(', ') + '</dd>' +
      '<dt>Subjects</dt><dd>' + F.courses.map(function (c) { return E(name[c] || c); }).join('<br>') + '</dd></dl>' +
      '<div class="rg-policy"><b>Account policy.</b> This account is for you alone. Do not share your password or let anyone else sign in as you. Accounts used by more than one person can be paused. You can see and sign out your devices on your Account page.</div>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:600"><input type="checkbox" id="ra" style="margin-top:4px"> I agree to keep my password private and to follow the account policy' + (T() ? ', and to use student data only for teaching my own classes' : '') + '.</label>' +
      nav(true, 'Submit registration ▶') + '</form>');
    wire(function () {
      if (!app.querySelector('#ra').checked) return msg('Please tick the box to agree.');
      var b = app.querySelector('#rgn'); b.disabled = true; b.textContent = 'Submitting…';
      var data = { full_name: F.name, account_type: T() ? 'teacher' : 'student', learner_kind: KIND === 'independent' ? 'independent' : 'school', school_name: F.school, country: F.country, courses: F.courses };
      S.db.auth.signUp({ email: F.email, password: F.pw, options: { data: data, emailRedirectTo: location.origin + '/login/' } }).then(function (r) {
        b.disabled = false; b.textContent = 'Submit registration ▶';
        if (r.error) return msg(/registered|exists/i.test(r.error.message) ? 'An account with this email already exists. Log in, or use "Forgot your password".' : S.nice(r.error));
        if (r.data && r.data.user && r.data.user.identities && !r.data.user.identities.length) return msg('An account with this email already exists. Log in, or use "Forgot your password".');
        F.pw = ''; F.signedIn = !!(r.data && r.data.session);
        if (KIND === 'student' && F.signedIn) { STEP = 5; draw(); } else done();
      });
    });
  }
  // 5 · students: optional class code (the teacher approves)
  function classCode() {
    shell('<form><h2>Join your teacher\'s class</h2><p class="lead">Have a class code from your teacher? Type it to send a joining request. Your teacher approves it. You can also do this later from your dashboard.</p>' +
      '<label class="f" for="rk">Class code</label><input type="text" id="rk" class="rg-code" maxlength="10" autocomplete="off" autocapitalize="characters" spellcheck="false"><div id="rki"></div>' +
      '<p class="rg-msg" role="alert"></p><div class="rg-nav"><button type="button" class="rg-btn alt" id="rgs">Skip for now</button><button type="submit" class="rg-btn" id="rgn">Check code ▶</button></div></form>');
    app.querySelector('#rgs').onclick = done;
    var info = null;
    wire(function () {
      var k = app.querySelector('#rk').value.replace(/[^A-Za-z0-9]/g, '').toUpperCase(), b = app.querySelector('#rgn');
      if (info && info.code === k) {   // second press: send the request
        b.disabled = true; b.textContent = 'Sending…';
        return S.db.rpc('join_class', { code: k }).then(function (r) { b.disabled = false;
          if (r.error) { b.textContent = 'Send request ▶'; return msg(S.nice(r.error)); }
          F.joined = info; done(); });
      }
      if (k.length < 6 || k.length > 8) return msg('Type the whole class code.');
      b.disabled = true; b.textContent = 'Checking…';
      S.db.rpc('class_code_info', { code: k }).then(function (r) { b.disabled = false; b.textContent = 'Check code ▶';
        if (r.error) return msg(S.nice(r.error)); var d = r.data || {}; if (!d.ok) return msg(d.message || 'That code is not recognised.');
        info = d; info.code = k; msg('');
        app.querySelector('#rki').innerHTML = '<div class="rg-class"><b>' + E(d['class']) + '</b><br>Teacher: ' + E(d.teacher || '—') + (d.school ? ' · ' + E(d.school) : '') + '<br>Subject: ' + E(d.course || '—') + ' · ' + E(d.section || '') + (d.year ? ' · ' + E(d.year) : '') +
          (d.authorised || d.requested ? '' : '<br><small>This subject is not in your registration yet; the admin will be asked to add it.</small>') + '</div>';
        b.textContent = 'Send request ▶'; });
    });
  }
  function done() {
    STEP = STEPS[KIND].length - 1;
    app.innerHTML = '<div class="rg"><div class="rg-card"><p class="label">Registration sent</p><h2>Thank you, ' + E((F.name || '').split(' ')[0]) + '!</h2>' +
      '<ol style="line-height:1.7"><li><b>Verify your email.</b> We sent a link to <b>' + E(F.email) + '</b> (it can take a few minutes; check your spam folder).</li>' +
      '<li><b>Wait for approval.</b> The BioscienceVista admin checks your details and authorises your subjects. You will get an email.</li>' +
      (KIND === 'student' ? '<li><b>Your class.</b> ' + (F.joined ? 'Your request to join <b>' + E(F.joined['class']) + '</b> is with ' + E(F.joined.teacher || 'your teacher') + '.' : 'Join your teacher\'s class from your dashboard with the class code.') + '</li>' : '') +
      (T() ? '<li><b>Create your classes.</b> Once approved, create classes in your authorised subjects and share their codes.</li>' : '') + '</ol>' +
      '<div class="rg-nav"><a class="rg-btn alt" href="/">Home</a><a class="rg-btn" href="' + (F.signedIn ? '/account/' : '/login/') + '">' + (F.signedIn ? 'My account ▶' : 'Log in ▶') + '</a></div></div></div>';
  }
  function toggles(n) { app.querySelectorAll('[name=' + n + ']').forEach(function (b) { b.onchange = function () { app.querySelectorAll('[name=' + n + ']').forEach(function (o) { o.closest('.rg-opt').classList.toggle('on', o.checked); }); }; }); }
  function picked(n) { var v = []; app.querySelectorAll('[name=' + n + ']:checked').forEach(function (b) { v.push(b.value); }); return v; }

  window.BVReg = function () {
    if (['student', 'teacher', 'independent'].indexOf(KIND) < 0) return chooseType();
    app.innerHTML = '<p class="muted">Loading…</p>';
    S.db.rpc('academic_tree').then(function (r) {
      if (r.error || !r.data) { app.innerHTML = '<p class="msg">Registration could not load. Please refresh the page.</p>'; return; }
      TREE = r.data; TREE.courses = TREE.courses || []; TREE.sections = TREE.sections || [];
      var pre = new URLSearchParams(location.search).get('pathway'); if (pre && PW[pre]) F.pathways = [pre];
      draw();
    });
  };
  function chooseType() {
    app.innerHTML = '<div class="rg"><div class="rg-card"><h2>Create your account</h2><p class="lead">Choose the account that fits you. Every account is checked by the admin before it opens.</p><div class="rg-types">' +
      '<a class="rg-type" href="/register/?as=student"><i>🎒</i><b>Student</b><span>In a teacher\'s class at school. Join with your teacher\'s class code.</span></a>' +
      '<a class="rg-type" href="/register/?as=independent"><i>🚀</i><b>Independent learner</b><span>Learning on your own, at your own pace. No class needed.</span></a>' +
      '<a class="rg-type" href="/register/?as=teacher"><i>🧑‍🏫</i><b>Teacher</b><span>Create classes, approve students and follow their progress.</span></a>' +
      '<a class="rg-type" href="/register/?as=parent"><i>👪</i><b>Parent or carer</b><span>See your child\'s progress with the parent code from the school.</span></a></div>' +
      '<p class="small" style="margin-top:14px">Already registered? <a href="/login/">Log in</a></p></div></div>';
  }
})();
