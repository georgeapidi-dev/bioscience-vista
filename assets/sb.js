/* BioScience Vista · Supabase helper (public anon key only; security comes from Row Level Security) */
(function () {
  var BV = window.BV = window.BV || {}, S = window.BVS = {};
  S.on = !!(BV.sbUrl && BV.sbKey && window.supabase);
  S.db = S.on ? window.supabase.createClient(BV.sbUrl, BV.sbKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
  S.E = function (s) { return BV.esc ? BV.esc(s) : String(s == null ? '' : s); };
  S.notReady = function (el) {
    el.innerHTML = '<section class="panel tint"><h2>Accounts are being switched on</h2><p>Student accounts are not connected yet. In the meantime use <a href="/progress/">My learning</a> with your personal code.</p></section>';
  };
  /* who is signed in: {user, profile, roles[], staff, admin, cls} */
  S.me = function () {
    if (!S.on) return Promise.resolve(null);
    return S.db.auth.getSession().then(function (r) {
      var u = r.data.session && r.data.session.user; if (!u) return null;
      return Promise.all([
        S.db.from('profiles').select('*').eq('id', u.id).maybeSingle(),
        S.db.from('user_roles').select('role').eq('user_id', u.id)
      ]).then(function (x) {
        if (!x[0].error && !x[0].data) { return S.db.auth.signOut().then(function () { return null; }); }   // account was deleted
        var roles = (x[1].data || []).map(function (r) { return r.role; }), p = x[0].data || {};
        var me = { user: u, profile: p, roles: roles, admin: roles.indexOf('admin') >= 0, staff: roles.indexOf('teacher') >= 0 || roles.indexOf('admin') >= 0, cls: null };
        if (!p.class_id) return me;
        return S.db.from('classes').select('id,name,programme').eq('id', p.class_id).maybeSingle().then(function (c) { me.cls = c.data; return me; });
      });
    });
  };
  /* page guard: redirects to login when signed out; staff:true requires teacher/admin */
  S.guard = function (el, opts) {
    opts = opts || {};
    if (!S.on) { S.notReady(el); return Promise.reject('off'); }
    el.innerHTML = '<p class="muted">Loading…</p>';
    return S.me().then(function (me) {
      if (!me) { location.href = '/login/?next=' + encodeURIComponent(location.pathname + location.search); throw 'signed-out'; }
      if (opts.staff && !me.staff) { el.innerHTML = '<section class="panel"><h2>Teachers only</h2><p>This area is for teachers. <a href="/dashboard/">Go to your dashboard</a>.</p></section>'; throw 'not-staff'; }
      if (!opts.allowPending && !me.staff && !me.profile.approved) { S.updateNav(me); el.innerHTML = S.pendingBox(me); throw 'pending'; }
      S.updateNav(me); return me;
    });
  };
  S.pendingBox = function (me) {
    return '<section class="panel tint"><p class="label">Almost there</p><h2>Waiting for your teacher</h2><p>Your account' + (me.cls ? ' for <b>' + S.E(me.cls.name) + '</b>' : '') +
      ' has been created. Your teacher will approve it soon; then your lessons, quizzes and simulations open here.</p><p class="small muted">Signed in as ' + S.E(me.user.email) + ' · <a href="#" onclick="BVS.signOut();return false">Log out</a></p></section>';
  };
  /* anonymous visit log: page, where they came from, device type; a random id in this browser counts unique visitors (no IP address is kept) */
  S.logVisit = function () {
    if (!S.on) return; var vid;
    try { vid = localStorage.getItem('bv-vid'); if (!vid) { vid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); localStorage.setItem('bv-vid', vid); } } catch (e) {}
    var dev = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'phone' : /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' : 'computer';
    var ref = document.referrer && document.referrer.indexOf(location.origin) !== 0 ? document.referrer.split('?')[0] : null;
    S.db.rpc('log_visit', { page: location.pathname, ref: ref, dev: dev, vid: vid || null }).then(function () {}, function () {});
  };
  S.signOut = function () { S.db.auth.signOut().then(function () { location.href = '/'; }); };
  S.err = function (r) { if (r && r.error) { throw new Error(r.error.message || 'Something went wrong.'); } return r ? r.data : null; };
  S.nice = function (e) { var m = (e && (e.message || e.error_description || e)) || 'Something went wrong.'; return String(m).replace(/^.*?ERROR:\s*/, ''); };
  S.updateNav = function (me) {
    var a = document.querySelector('.cta-nav'); if (!a || !me) return;
    a.textContent = me.staff ? 'Teacher dashboard' : 'My dashboard'; a.href = me.staff ? '/staff/' : '/dashboard/';
  };
  S.pct = function (s, m) { return m ? Math.round(100 * s / m) : null; };
  S.when = function (t) { return t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''; };
  if (S.on) { S.me().then(S.updateNav).catch(function () {}); S.logVisit(); }
})();
