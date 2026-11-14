/* Learnova · Help Desk and Messages buttons.
   ❓ Help Desk appears in every interactive lesson, simulation and lab: it opens the Science Help Desk over the page,
   so students can ask a question without leaving their work. ✉️ Messages appears on every page for signed-in users
   (students, teachers, admin), with the number of unread messages. */
(function () {
  if (window.top !== window || document.getElementById('bvhelp-stack')) return;
  var me = document.currentScript && document.currentScript.src || '', path = location.pathname;
  if (/^\/(tutor|messages|login|register|live)\//.test(path)) return;   // not over a live lesson
  var HELP = /[?&]help=1/.test(me) || /^\/(simulations|library|lesson|learn)\//.test(path) || !!window.SPEC || !!document.querySelector('[data-sim]');
  var cfg = window.BV || {}, URL_ = cfg.sbUrl || window.SB_URL, KEY = cfg.sbKey || window.SB_KEY;
  function token() {
    try { var ref = new URL(URL_).hostname.split('.')[0], t = JSON.parse(localStorage.getItem('sb-' + ref + '-auth-token') || 'null');
      if (t && t.access_token && (!t.expires_at || t.expires_at * 1000 > Date.now() - 864e5)) return t.access_token; } catch (e) {}
    return null;
  }
  var signed = !!(URL_ && token());
  var GIVE = !/^\/(donate|admin|staff)\//.test(path);   // 💚 Donate shows for everyone, signed in or not

  var css = document.createElement('style');
  css.textContent = '#bvhelp-stack{position:fixed;left:calc(14px + env(safe-area-inset-left,0px));z-index:2147483000;display:flex;flex-direction:column;align-items:flex-start;gap:8px}' +
    '#bvhelp-stack button{position:relative;display:inline-flex!important;align-items:center;gap:6px;width:auto!important;max-width:max-content!important;margin:0!important;border:0;border-radius:999px;padding:10px 15px;color:#fff;font:700 14px/1.1 system-ui,Arial,sans-serif;box-shadow:0 6px 18px rgba(15,23,42,.28);cursor:pointer;text-transform:none!important}' +
    '#bvhelp-stack .h{background:linear-gradient(120deg,#f97316,#ec4899)}#bvhelp-stack .m{background:linear-gradient(120deg,#7c3aed,#2563eb)}#bvhelp-stack .g{background:linear-gradient(120deg,#16a34a,#0d9488)}#bvhelp-stack button:hover{filter:brightness(1.08)}' +
    '#bvhelp-stack .n{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;border-radius:999px;background:#ef4444;color:#fff;font:700 12px/20px system-ui,Arial;text-align:center;padding:0 5px;border:2px solid #fff}' +
    '#bvhelp{position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:12px}#bvhelp.on{display:flex}' +
    '#bvhelp .bx{background:#fff;border-radius:16px;width:min(900px,100%);height:min(92vh,960px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}' +
    '#bvhelp .br{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;font:700 15px system-ui,Arial,sans-serif;color:#0f172a}#bvhelp .br b{margin-right:auto}' +
    '#bvhelp .br button{width:auto!important;margin:0!important;border:0;background:#0f172a;color:#fff;border-radius:999px;padding:7px 13px;font:600 13px system-ui,Arial,sans-serif;cursor:pointer}' +
    '#bvhelp iframe{flex:1;border:0;width:100%;background:#fff}@media print{#bvhelp-stack,#bvhelp{display:none!important}}' +
    '@media(max-width:560px){#bvhelp-stack button{padding:9px 12px;font-size:13px}#bvhelp{padding:0}#bvhelp .bx{height:100vh;border-radius:0}}';
  var stack = document.createElement('div'); stack.id = 'bvhelp-stack';
  var hb = document.createElement('button'); hb.type = 'button'; hb.className = 'h'; hb.innerHTML = '❓ Help Desk'; hb.title = 'Ask a science question without leaving this page';
  var mb = document.createElement('button'); mb.type = 'button'; mb.className = 'm'; mb.innerHTML = '✉️ Messages <span class="n" hidden></span>'; mb.title = 'Messages with your teachers';
  var gb = document.createElement('button'); gb.type = 'button'; gb.className = 'g'; gb.innerHTML = '💚 Donate'; gb.title = '70% of every donation goes to charity';
  gb.addEventListener('click', function () { location.href = '/donate/'; });
  if (GIVE) stack.appendChild(gb); if (signed) stack.appendChild(mb); if (HELP) stack.appendChild(hb);
  if (!GIVE && !signed && !HELP) return;
  var box = document.createElement('div'); box.id = 'bvhelp'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<div class="bx"><div class="br"><b></b><button type="button" class="x">✕ Back to the page</button></div><iframe></iframe></div>';
  var frame = box.querySelector('iframe'), cur = '';
  frame.addEventListener('load', function () {   // only the Help Desk or Messages inside the panel: no site header, footer or hero
    try { var d = frame.contentDocument, s = d.createElement('style');
      s.textContent = 'header.top,footer.site,#offbar,.installbar,#install,#bvhelp-stack,#bvdock-btn{display:none!important}main{padding-top:8px!important}.hero{padding:10px 0!important}.hero p.muted{display:none}';
      d.head.appendChild(s); } catch (e) {}
  });
  function open(kind) {
    var title = kind === 'help' ? '❓ Science Help Desk' : '✉️ Messages';
    box.querySelector('b').textContent = title; box.setAttribute('aria-label', title);
    var src = kind === 'help' ? '/tutor/' : '/messages/';
    if (cur !== src) { cur = src; frame.src = src; frame.title = title; }
    box.classList.add('on'); document.documentElement.style.overflow = 'hidden'; box.querySelector('.x').focus();
  }
  function close() { box.classList.remove('on'); document.documentElement.style.overflow = ''; if (cur === '/messages/') { cur = ''; unread(); } }
  hb.addEventListener('click', function () { open('help'); });
  mb.addEventListener('click', function () { open('msg'); });
  box.addEventListener('click', function (e) { if (e.target.closest('.x') || e.target === box) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('on')) close(); });
  window.BVHelp = { open: open, close: close };
  function unread() {
    var t = token(); if (!t || !window.fetch) return;
    fetch(URL_ + '/rest/v1/rpc/unread_messages', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { return r.ok ? r.json() : 0; }).then(function (n) { var b = mb.querySelector('.n'); n = +n || 0; b.textContent = n > 99 ? '99+' : n; b.hidden = !n; }).catch(function () {});
  }
  function place() { stack.style.bottom = (document.getElementById('bvdock-btn') ? 112 : 16) + 'px'; }
  function mount() {
    if (!document.body) return;
    if (!document.head.contains(css)) document.head.appendChild(css);
    if (!document.body.contains(stack)) document.body.appendChild(stack);
    if (!document.body.contains(box)) document.body.appendChild(box);
    place();
  }
  mount(); document.addEventListener('DOMContentLoaded', mount); window.addEventListener('load', mount); setInterval(mount, 1500);
  if (signed) { unread(); setInterval(unread, 60000); }
})();
