/* BioScience Vista shared script · by George Apidi */
(function () {
  var BV = window.BV = window.BV || {};
  // menu + theme
  var mb = document.querySelector('.menu-btn'), nav = document.getElementById('mainnav');
  if (mb && nav) mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  /* installable app: service worker + install prompt (Android, Windows, Mac, Chromebook); iPhone uses Share → Add to Home Screen */
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  BV.app = { installed: standalone, can: false, ios: /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), ev: null,
    install: function () { if (!BV.app.ev) return Promise.resolve(false); BV.app.ev.prompt(); return BV.app.ev.userChoice.then(function (c) { BV.app.ev = null; BV.app.can = false; return c.outcome === 'accepted'; }); } };
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); BV.app.ev = e; BV.app.can = true; document.dispatchEvent(new Event('bv-installable'));
    if (nav && !document.getElementById('navInstall')) { var b = document.createElement('a'); b.href = '#'; b.id = 'navInstall'; b.textContent = '📲 Install app';
      b.onclick = function (x) { x.preventDefault(); BV.app.install().then(function (ok) { if (ok) b.remove(); }); }; nav.insertBefore(b, nav.querySelector('.cta-nav')); }
  });
  window.addEventListener('appinstalled', function () { BV.app.installed = true; var b = document.getElementById('navInstall'); if (b) b.remove(); document.dispatchEvent(new Event('bv-installed')); });
  /* offline notice */
  function netBar() {
    var b = document.getElementById('offbar');
    if (navigator.onLine) { if (b) b.remove(); return; }
    if (b) return; b = document.createElement('div'); b.id = 'offbar'; b.setAttribute('role', 'status');
    b.innerHTML = '📴 You are offline: showing pages saved on this device. Logging in, quizzes and sending marks need internet.';
    document.body.insertBefore(b, document.body.firstChild);
  }
  window.addEventListener('online', netBar); window.addEventListener('offline', netBar); netBar();
  var tb = document.getElementById('themeBtn');
  if (tb) tb.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', nx); BV.store('bv-theme', nx);
  });

  BV.store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
  BV.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* tiny markdown for AI text: **bold**, bullets, line breaks */
  BV.md = function (t) {
    var lines = BV.esc(t).split(/\n/), out = '', inl = false;
    lines.forEach(function (l) {
      l = l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      if (/^\s*[-•*]\s+/.test(l)) { if (!inl) { out += '<ul>'; inl = true; } out += '<li>' + l.replace(/^\s*[-•*]\s+/, '') + '</li>'; }
      else { if (inl) { out += '</ul>'; inl = false; } if (l.trim()) out += '<p>' + l + '</p>'; }
    });
    return out + (inl ? '</ul>' : '');
  };
  BV.toast = function (t) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 3800);
  };
  BV.when = function (s) { if (!s) return ''; var d = new Date(String(s).indexOf('T') > 0 || /Z$/.test(s) ? s : String(s).replace(' ', 'T')); return isNaN(d) ? s : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); };
  /* call the Google script (POST, text/plain so no preflight) */
  BV.api = function (action, data) {
    if (!BV.url) return Promise.resolve({ ok: false, error: 'The learning service is not switched on yet.' });
    var body = Object.assign({ action: action }, data || {});
    return fetch(BV.url, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: 'Could not reach the learning service. Check your internet connection and try again.' }; });
  };
  /* student session */
  BV.me = function () { try { return JSON.parse(BV.store('bv-me') || sessionStorage.getItem('bv-me') || 'null'); } catch (e) { return null; } };
  BV.as = function (action, data) { var m = BV.me() || {}; return BV.api(action, Object.assign({ name: m.n, cls: m.c, code: m.k }, data || {})); };
  BV.signout = function () { BV.store('bv-me', null); try { sessionStorage.removeItem('bv-me'); } catch (e) {} location.reload(); };
  /* login box used by My learning, Exams and Forum */
  BV.loginForm = function (el, done) {
    el.innerHTML = '<form class="form narrow" id="bvlogin"><h2>Sign in</h2><p class="muted small">Use your name exactly as you type it in lessons, your class, and the personal code your teacher gave you.</p>' +
      '<label class="f">Your name<input id="ln" autocomplete="name" required></label><label class="f">Class<select id="lc" required><option value="">Choose your class</option></select></label>' +
      '<label class="f">Personal code<input id="lk" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" required></label><label class="chk"><input type="checkbox" id="lr" checked> Remember me on this device</label>' +
      '<button class="btn main" type="submit">Sign in</button><p class="msg" id="lm" role="alert"></p></form>';
    var sel = el.querySelector('#lc');
    (BV.classes || []).forEach(function (c) { sel.add(new Option(c, c)); });
    BV.api('classes').then(function (d) { if (d.ok) { var v = sel.value; sel.length = 1; d.classes.forEach(function (c) { sel.add(new Option(c, c)); }); sel.value = v; } });
    el.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault(); var m = el.querySelector('#lm'); m.textContent = 'Checking…';
      var me = { n: el.querySelector('#ln').value.trim(), c: sel.value, k: el.querySelector('#lk').value.trim() };
      BV.api('student', { name: me.n, cls: me.c, code: me.k }).then(function (d) {
        if (!d.ok) { m.textContent = d.error; return; }
        if (el.querySelector('#lr').checked) BV.store('bv-me', JSON.stringify(me)); else { try { sessionStorage.setItem('bv-me', JSON.stringify(me)); } catch (x) {} }
        done(d);
      });
    });
  };
  BV.title = function (id) { return (BV.meta && BV.meta[id] && BV.meta[id].t) || id; };
  BV.link = function (id) { return BV.meta && BV.meta[id] && BV.meta[id].p; };
})();
