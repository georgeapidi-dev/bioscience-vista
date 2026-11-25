/* Email verification link · VistaEd (migration 078). The link works once; the token never stays in the address bar. */
(function () {
  var S = window.BVS, app = document.getElementById('app'), t = new URLSearchParams(location.search).get('t') || '';
  if (location.search) history.replaceState(null, '', location.pathname);
  if (!S || !S.on) return;
  function show(ok, text) { app.innerHTML = '<section class="panel ' + (ok ? 'tint' : '') + '" style="max-width:620px;margin:0 auto"><p class="label">' + (ok ? 'Done' : 'Email verification') + '</p><h2>' + (ok ? '✅ Your email is verified' : 'This link did not work') + '</h2><p>' + S.E(text) + '</p><div class="cta"><a class="btn main" href="/account/">My account</a><a class="btn" href="/login/">Log in</a></div></section>'; }
  if (!/^[0-9a-f]{48}$/.test(t)) return show(false, 'Open the newest link from your email, or sign in and ask for a new one on your Account page.');
  app.innerHTML = '<p class="muted">Checking your link…</p>';
  S.db.rpc('verify_email', { t: t }).then(function (r) { if (r.error) return show(false, S.nice(r.error)); show(true, 'Thank you. The admin can now approve your registration, if that has not happened yet.'); });
})();
