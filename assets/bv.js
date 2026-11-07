/* BioScience Vista shared script · by George Apidi */
(function () {
  var BV = window.BV = window.BV || {};
  // menu + theme
  var mb = document.querySelector('.menu-btn'), nav = document.getElementById('mainnav');
  if (mb && nav) mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
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
      '<label class="f">Personal code<input id="lk" inputmode="numeric" autocomplete="off" required></label><label class="chk"><input type="checkbox" id="lr" checked> Remember me on this device</label>' +
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
