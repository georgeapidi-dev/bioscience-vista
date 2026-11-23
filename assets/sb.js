/* BioscienceVista · Supabase helper (public anon key only; security comes from Row Level Security) */
(function () {
  var BV = window.BV = window.BV || {}, S = window.BVS = {};
  S.on = !!(BV.sbUrl && BV.sbKey && window.supabase);
  S.db = S.on ? window.supabase.createClient(BV.sbUrl, BV.sbKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
  S.E = function (s) { return BV.esc ? BV.esc(s) : String(s == null ? '' : s); };
  S.notReady = function (el) {
    el.innerHTML = '<section class="panel tint"><h2>Accounts are being switched on</h2><p>Student accounts are not connected yet. In the meantime use <a href="/progress/">My learning</a> with your personal code.</p></section>';
  };
  /* who is signed in: {user, profile, roles[], staff, admin, cls} */
  var ME = null;   // one account lookup shared by every script that asks while the page opens (23 Nov 2026): saves repeat requests
  S.me = function () {
    if (!S.on) return Promise.resolve(null);
    if (ME && Date.now() - ME.t < 8000) return ME.p;
    var p = meNow(); ME = { t: Date.now(), p: p }; p.then(null, function () { ME = null; }); return p;
  };
  function meNow() {
    return S.db.auth.getSession().then(function (r) {
      var u = r.data.session && r.data.session.user; if (!u) return null;
      return Promise.all([
        S.db.from('profiles').select('*').eq('id', u.id).maybeSingle(),
        S.db.from('user_roles').select('role').eq('user_id', u.id),
        S.db.rpc('my_access').then(function (r) { return r; }, function () { return { data: null }; })
      ]).then(function (x) {
        if (!x[0].error && !x[0].data) { return S.db.auth.signOut().then(function () { return null; }); }   // account was deleted
        var roles = (x[1].data || []).map(function (r) { return r.role; }), p = x[0].data || {};
        var me = { user: u, profile: p, roles: roles, admin: roles.indexOf('admin') >= 0, staff: roles.indexOf('admin') >= 0,   /* only admins edit the main site (migration 024) */ parent: roles.indexOf('parent') >= 0, cls: null };
        var a = me.access = x[2].data || { premium: false, classes: [] };   // premium access and the classes this account joined (migration 022)
        me.school = !me.staff && (roles.indexOf('school_teacher') >= 0 || p.account_type === 'teacher');   // a teacher from another school: own classes only
        me.classes = (a.classes || []).filter(function (c) { return c.status === 'approved'; });
        me.ok = me.staff || me.parent || (me.school ? !!a.premium && roles.indexOf('school_teacher') >= 0 : !!a.premium && me.classes.length > 0);
        if (!p.class_id) return me;
        return S.db.from('classes').select('id,name,programme').eq('id', p.class_id).maybeSingle().then(function (c) { me.cls = c.data; return me; });
      });
    });
  }

  /* page guard: redirects to login when signed out; staff:true requires teacher/admin */
  S.guard = function (el, opts) {
    opts = opts || {};
    if (!S.on) { S.notReady(el); return Promise.reject('off'); }
    el.innerHTML = '<p class="muted">Loading…</p>';
    return S.me().then(function (me) {
      if (!me) { location.href = '/login/?next=' + encodeURIComponent(location.pathname + location.search); throw 'signed-out'; }
      if (opts.staff && !me.staff) { el.innerHTML = '<section class="panel"><h2>Teachers only</h2><p>This area is for teachers. <a href="/dashboard/">Go to your dashboard</a>.</p></section>'; throw 'not-staff'; }
      if (me.parent && !me.staff && !opts.parent && !opts.anyone) { location.href = '/parent/'; throw 'parent'; }   // parents have their own page
      if (me.school && !opts.school && !opts.anyone) { location.href = '/teach/'; throw 'school'; }   // teachers from other schools have their own portal
      if (opts.parent && !me.parent && !me.staff) { el.innerHTML = '<section class="panel"><h2>Parents only</h2><p>This page is for parents. <a href="/dashboard/">Go to your dashboard</a>.</p></section>'; throw 'not-parent'; }
      if (!opts.allowPending && !me.ok) { S.updateNav(me); el.innerHTML = S.pendingBox(me); throw 'pending'; }
      S.updateNav(me); if (me.admin) S.areaBar(el); return S.prefsPull(me).then(function () { return me; });
    });
  };
  /* Settings that follow the account (migration 068, ui_prefs): teacher dashboard layout (cc), student dashboard sections (dhide)
     and reading settings (a11y). The browser keeps a copy; the newer of the two wins, key by key. Never waits more than 1.5 s. */
  var PREFS = null, PUID = null, PT = null;
  function pkeys(uid) { return { cc: 'bv-cc-prefs-' + uid, dhide: 'bv-dhide-' + uid, a11y: 'bv-a11y' }; }
  function pstamps(uid, set) { var k = 'bv-prefs-at-' + uid; try { if (set) localStorage.setItem(k, JSON.stringify(set)); return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } }
  S.prefsPull = function (me) {
    if (!me || !me.user || me.view || me.preview) return Promise.resolve();
    if (PUID === me.user.id && PREFS) return Promise.resolve();
    PUID = me.user.id;
    var work = S.db.from('ui_prefs').select('prefs').eq('user_id', PUID).maybeSingle().then(function (r) {
      if (r.error) { PREFS = null; return; }
      PREFS = (r.data && r.data.prefs) || {};
      var K = pkeys(PUID), at = pstamps(PUID), up = false;
      Object.keys(K).forEach(function (k) {
        var rem = PREFS[k], loc = null; try { loc = localStorage.getItem(K[k]); } catch (e) {}
        if (rem && +rem.at > (+at[k] || 0)) {   // the account has a newer setting: use it here
          try { if (rem.v == null) localStorage.removeItem(K[k]); else localStorage.setItem(K[k], String(rem.v)); } catch (e) {}
          at[k] = +rem.at;
          if (k === 'a11y' && window.BV && BV.a11y) BV.a11y(rem.v ? String(rem.v).split(',') : [], true);
        } else if (!rem && loc != null) { PREFS[k] = { v: loc, at: +at[k] || Date.now() }; at[k] = PREFS[k].at; up = true; }   // first time: keep what this device has
      });
      pstamps(PUID, at); if (up) S.prefsSave();
    }, function () {});
    return Promise.race([work, new Promise(function (ok) { setTimeout(ok, 1500); })]);
  };
  S.prefsPush = function (k, v) {
    if (!PUID) return; var at = pstamps(PUID); at[k] = Date.now(); pstamps(PUID, at);
    if (!PREFS) return; PREFS[k] = { v: v == null ? null : String(v), at: at[k] };
    clearTimeout(PT); PT = setTimeout(S.prefsSave, 800);
  };
  S.prefsSave = function () {
    if (!PUID || !PREFS) return;
    S.db.from('ui_prefs').upsert({ user_id: PUID, prefs: PREFS, updated_at: new Date().toISOString() }).then(function () {}, function () {});
  };
  /* the admin works in three separate places: running the site, the main-site courses, and their own classes */
  S.AREAS = [['/admin/approvals/', '✅ APPROVAL CENTRE', 'Registrations, subjects, memberships, security'], ['/admin/', '🛠 Admin', 'Members, payments, settings'], ['/staff/', '🌐 Main site', 'Main-site courses, lessons, quizzes and their classes'], ['/teach/', '🏫 My classes', 'Classes you teach, like any teacher']];
  S.areaBar = function (el) {
    var here = location.pathname; if (!S.AREAS.some(function (a) { return here.indexOf(a[0]) === 0; }) || document.getElementById('areabar')) return;
    var bar = document.createElement('nav'); bar.id = 'areabar'; bar.setAttribute('aria-label', 'Admin areas');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px';
    var best = S.AREAS.map(function (a) { return a[0]; }).filter(function (k) { return here.indexOf(k) === 0; }).sort(function (x, y) { return y.length - x.length; })[0];
    bar.innerHTML = S.AREAS.map(function (a) { var on = a[0] === best;
      return '<a href="' + a[0] + '" title="' + S.E(a[2]) + '" style="flex:1;min-width:150px;text-align:center;padding:10px 14px;border-radius:12px;font-weight:700;text-decoration:none;border:1px solid var(--line,#dde3ea);' +
        (on ? 'background:linear-gradient(120deg,#7c3aed,#2563eb);color:#fff;border-color:transparent' : 'background:var(--card,#fff);color:inherit') + '"' + (on ? ' aria-current="page"' : '') + '>' + a[1] + '</a>'; }).join('');
    el.parentNode.insertBefore(bar, el);
  };
  S.pendingBox = function (me) {
    var a0 = me.access || {}, stt = a0.status;
    if (stt && stt !== 'approved') {   // the account itself waits for the admin (migration 078)
      var t = { pending: ['Waiting for approval', 'The BioscienceVista admin checks every new account. You will get an email when yours is approved.' + (a0.verified ? '' : ' Please verify your email address first.')],
                info_requested: ['The admin needs more information', S.E(a0.info_request || '') + ' Answer it on your Account page.'],
                suspended: ['Your account is paused', 'Learning materials are closed. Contact BioscienceVista if you think this is a mistake.'],
                rejected: ['Your registration was not approved', 'Contact BioscienceVista if you think this is a mistake.'] }[stt] || ['Not open yet', ''];
      return '<section class="panel tint"><p class="label">My account</p><h2>' + t[0] + '</h2><p>' + t[1] + '</p><div class="cta"><a class="btn main sm" href="/account/">My account</a></div>' +
        '<p class="small muted">Signed in as ' + S.E(me.user.email) + ' · <a href="#" onclick="BVS.signOut();return false">Log out</a></p></section>';
    }
    var a = me.access || {}, waiting = (a.classes || []).filter(function (c) { return c.status === 'pending'; });
    var need = [];
    if (!me.classes || !me.classes.length) need.push(waiting.length ? 'your teacher to approve you for <b>' + waiting.map(function (c) { return S.E(c.name); }).join(', ') + '</b>' : (a.learner_kind === 'independent' ? 'an authorised subject: see <a href="/account/">My account</a>' : 'your class: <a href="/join/">type the class code your teacher gave you</a>'));
    if (!a.premium) need.push('<a href="/premium/">premium access</a>');
    return '<section class="panel tint"><p class="label">Almost there</p><h2>Not open yet</h2><p>Lessons, quizzes and simulations open when your account has ' + (need.length ? 'these: ' + need.join(' and ') : 'an approved class and premium access') + '.</p>' +
      '<div class="cta"><a class="btn main sm" href="/dashboard/">My dashboard</a>' + (a.premium ? '' : '<a class="btn sm" href="/premium/">Get premium</a>') + '</div>' +
      '<p class="small muted">Signed in as ' + S.E(/@students\.biosciencevista\.com$/.test(me.user.email || '') ? ((me.profile && me.profile.full_name) || 'student') : me.user.email) + ' · <a href="#" onclick="BVS.signOut();return false">Log out</a></p></section>';
  };
  /* anonymous visit log: page, where they came from, device type; a random id in this browser counts unique visitors (no IP address is kept) */
  S.logVisit = function () {
    if (!S.on) return; var vid;
    try { vid = localStorage.getItem('bv-vid'); if (!vid) { vid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); localStorage.setItem('bv-vid', vid); } } catch (e) {}
    var dev = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'phone' : /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' : 'computer';
    var ref = document.referrer && document.referrer.indexOf(location.origin) !== 0 ? document.referrer.split('?')[0] : null;
    S.db.rpc('log_visit', { page: location.pathname, ref: ref, dev: dev, vid: vid || null }).then(function () {}, function () {});
  };
  /* A strip at the top of the student and teacher dashboards: authorised pathway, section and subjects, membership and expiry,
     class requests, email verification, and links to My account and (teachers) class codes and join requests (migration 078). */
  S.acctStrip = function (me, el) {
    if (!me || me.view || me.preview || !el || document.getElementById('acct-strip')) return;
    var a = me.access || {}, cs = (a.courses || []).filter(function (c) { return c.status === 'approved'; }), wait = (a.courses || []).filter(function (c) { return c.status === 'requested'; });
    var pend = (a.classes || []).filter(function (c) { return c.status === 'pending' && !c.self; });
    var PW = { cambridge: 'Cambridge International', ib: 'International Baccalaureate' }, SEC = { ks3: 'KS3', igcse: 'IGCSE', alevel: 'A Level', myp: 'MYP', ibdp: 'IBDP' };
    var pws = {}; cs.forEach(function (c) { pws[PW[c.pathway] + ' · ' + SEC[c.section]] = 1; });
    var prem = a.free ? 'Premium' : a.premium && !(a.until && new Date(a.until) > new Date()) ? 'Premium · school licence' : a.premium ? 'Premium until ' + new Date(a.until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (a.until && new Date(a.until) < new Date() ? 'Free (Premium ended ' + new Date(a.until).toLocaleDateString() + ')' : 'Free');
    var d = document.createElement('section'); d.id = 'acct-strip';
    d.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:10px 14px;margin:0 0 12px;border-radius:14px;background:linear-gradient(90deg,#eef2ff,#fdf2f8);border:1px solid #e0e7ff;font-size:.9rem';
    d.innerHTML = '<b>' + (Object.keys(pws).map(S.E).join(' · ') || 'No authorised subject yet') + '</b>' +
      (cs.length ? '<span>📚 ' + cs.map(function (c) { return S.E(c.name); }).join(', ') + '</span>' : '') + (wait.length ? '<span>⏳ ' + wait.length + ' subject' + (wait.length > 1 ? 's' : '') + ' waiting for the admin</span>' : '') +
      (pend.length ? '<span>📨 Waiting for your teacher: ' + pend.map(function (c) { return S.E(c.name); }).join(', ') + '</span>' : '') +
      '<span>⭐ ' + S.E(prem) + '</span>' + (a.verified === false ? '<span style="color:#b45309;font-weight:700">✉️ Please verify your email</span>' : '') +
      '<span style="margin-left:auto;display:flex;gap:6px">' + (me.school ? '<a class="btn sm" href="/teach/classes/">Class codes and requests</a>' : (a.learner_kind === 'independent' ? '' : '<a class="btn sm" href="/join/">Join a class</a>')) + '<a class="btn sm" href="/account/">👤 My account</a></span>';
    el.parentNode.insertBefore(d, el);
    if (me.school || me.admin || (me.roles || []).indexOf('teacher') >= 0) S.db.rpc('my_schools').then(function (r) {   // school coordinators (migration 087)
      var L = (r && r.data) || []; if (!L.length || me.admin) return; var box = d.querySelector('span[style*="margin-left:auto"]'), x = document.createElement('a');
      x.className = 'btn sm'; x.href = '/school/'; x.textContent = '🏫 ' + (L.length === 1 ? L[0].name : 'My schools'); box.insertBefore(x, box.firstChild); }, function () {});
  };
  S.signOut = function () { S.db.auth.signOut().then(function () { location.href = '/'; }); };
  S.err = function (r) { if (r && r.error) { throw new Error(r.error.message || 'Something went wrong.'); } return r ? r.data : null; };
  /* every row of a query, 1000 at a time: the API returns at most 1000 rows per request (there are over 1300 lessons, 22 Nov 2026) */
  S.all = function (build, from, acc) {
    from = from || 0; acc = acc || [];
    return build().range(from, from + 999).then(function (r) {
      if (r.error) return acc.length ? { data: acc } : r;
      var rows = r.data || []; acc = acc.concat(rows);
      return rows.length === 1000 ? S.all(build, from + 1000, acc) : { data: acc };
    });
  };
  S.nice = function (e) { var m = (e && (e.message || e.error_description || e)) || 'Something went wrong.'; return String(m).replace(/^.*?ERROR:\s*/, ''); };
  S.updateNav = function (me) {
    var a = document.querySelector('.cta-nav'); if (!a || !me) return;
    a.textContent = me.admin ? 'My dashboards' : me.staff || me.school ? 'Teacher dashboard' : me.parent ? "My child's progress" : 'My dashboard'; a.href = me.admin ? '/teach/' : me.staff ? '/staff/' : me.school ? '/teach/' : me.parent ? '/parent/' : '/dashboard/';
  };
  /* Grade 6 to 10 science: each question set and exam says its subject (Biology, Chemistry or Physics) in quizzes.subject (migration 036).
     Resolves true when that column exists; before the migration the subject is read from the set's topic and title (BV.subj.of). */
  S.quizSubjectCol = function () { if (!S._qsc) S._qsc = S.db.from('quizzes').select('subject').limit(1).then(function (r) { return !r.error; }, function () { return false; }); return S._qsc; };
  /* Which subject a lesson or a question set belongs to, for pages that list a student's work (dashboard, parent view).
     Give the lesson ids and quiz ids on the page; resolves { lesson(id, title), quiz(id, title), myp(kind, id, title) }. */
  S.subjectLookup = function (lessonIds, quizIds) {
    var uniq = function (a) { return (a || []).filter(function (v, i, x) { return v && x.indexOf(v) === i; }); }, none = Promise.resolve({ data: [] });
    var soft = function (q) { return q.then(function (r) { return r.error ? { data: [] } : r; }, function () { return { data: [] }; }); };
    var lids = uniq(lessonIds), qids = uniq(quizIds);
    return Promise.all([soft(S.db.from('topics').select('id,name,programme,parent_id')), lids.length ? soft(S.db.from('lessons').select('id,topic_id').in('id', lids)) : none,
      qids.length ? S.quizSubjectCol().then(function (has) { return soft(S.db.from('quizzes').select('id,topic_id' + (has ? ',subject' : '')).in('id', qids)); }) : none]).then(function (y) {
      var T = {}, lt = {}, qz = {}; (y[0].data || []).forEach(function (t) { T[t.id] = t; }); (y[1].data || []).forEach(function (l) { lt[l.id] = l.topic_id; }); (y[2].data || []).forEach(function (q) { qz[q.id] = q; });
      var prog = function (tid) { var t = T[tid] || {}; return t.programme || (T[t.parent_id] || {}).programme || ''; };
      return { lesson: function (id, title) { return BV.subj.of((T[lt[id]] || {}).name, title); },
        quiz: function (id, title) { var q = qz[id] || {}; return BV.subj.of(q.subject, (T[q.topic_id] || {}).name, title); },
        myp: function (kind, id, title) { return /^MYP/.test(prog(kind === 'quiz' ? (qz[id] || {}).topic_id : lt[id])) || /\bgrade (6|7|8|9|10)\b/i.test(title || ''); } };
    });
  };
  /* 🗑 admin delete button for any material (added 16 Nov 2026). S.del(kind, id, title) gives the button's HTML; one click handler for the whole site.
     quiz / lesson → the 🗑 Bin for 30 days (bin_item, migration 042; restore from Teacher dashboard → Bin);
     resource / simulation → unpublished (hidden from everyone; publish it again under Content); classmat → taken out of that class only (id = class id|path). */
  S.del = function (kind, id, title) {
    return '<span class="adm-del" role="button" tabindex="0" data-dk="' + S.E(kind) + '" data-di="' + S.E(id) + '" data-dt="' + S.E(title || '') + '" title="Delete (admin)" aria-label="Delete ' + S.E(title || 'this item') + '">🗑</span>';
  };
  (function () {
    if (document.getElementById('adm-del-css')) return;
    var st = document.createElement('style'); st.id = 'adm-del-css';
    st.textContent = '.adm-del{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;flex:none;border-radius:9px;background:#fee2e2;border:1px solid #fca5a5;color:#b91c1c;cursor:pointer;font-size:15px;line-height:1;margin-left:6px;transition:transform .1s}.adm-del:hover,.adm-del:focus-visible{background:#ef4444;color:#fff;transform:scale(1.08);outline:none}.adm-gone{opacity:.25;filter:grayscale(1);pointer-events:none;transition:opacity .4s}';
    (document.head || document.documentElement).appendChild(st);
    var NAMES = { quiz: 'This goes to the 🗑 Bin for 30 days. You can restore it from Teacher dashboard → Bin.', lesson: 'This goes to the 🗑 Bin for 30 days. You can restore it from Teacher dashboard → Bin.',
      resource: 'It will be hidden from everyone (unpublished). You can publish it again under Teacher dashboard → Content.', simulation: 'It will be hidden from everyone (unpublished). You can publish it again under Teacher dashboard → Content.',
      classmat: 'It is taken out of this class only. The material itself stays on the site.' };
    function run(el) {
      var k = el.getAttribute('data-dk'), id = el.getAttribute('data-di'), t = el.getAttribute('data-dt') || 'this item';
      if (!confirm('Delete “' + t + '”?\n\n' + (NAMES[k] || ''))) return;
      var done = function (r) {
        if (r && r.error) { alert(S.nice(r.error)); return; }
        var card = el.closest('[data-delcard], .lcard, .course, .qc-card, .task, li, tr') || el; card.classList.add('adm-gone'); el.remove();
        setTimeout(function () { card.style.display = 'none'; }, 450);
      };
      var p = k === 'quiz' || k === 'lesson' ? S.db.rpc('bin_item', { kind: k, item: id })
        : k === 'resource' ? S.db.from('resources').update({ published: false }).eq('id', id)
        : k === 'simulation' ? S.db.from('simulations').update({ published: false }).eq('id', id)
        : k === 'classmat' ? S.db.from('class_materials').delete().eq('class_id', id.split('|')[0]).eq('path', id.split('|').slice(1).join('|'))
        : null;
      if (p) p.then(done, function (e) { alert(S.nice(e)); });
    }
    var handle = function (e) {
      var el = e.target && e.target.closest ? e.target.closest('.adm-del') : null; if (!el) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); e.stopPropagation(); run(el);
    };
    document.addEventListener('click', handle, true); document.addEventListener('keydown', handle, true);
  })();
  S.pct = function (s, m) { return m ? Math.round(100 * s / m) : null; };
  S.when = function (t) { return t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''; };
  if (S.on) { S.me().then(S.updateNav).catch(function () {}); S.logVisit(); }
})();
