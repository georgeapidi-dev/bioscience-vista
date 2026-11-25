/* Material protection · VistaEd · by George Apidi (17 Nov 2026)
   Runs on every page but acts only on locked material pages (window.BV_LOCKED, set inside the encrypted page by protect.py).
   For students and other non-staff accounts: a faint watermark with the person's name, email and the date on every screen
   (so screenshots and photos can be traced), and no right-click, copying, dragging, printing or saving of the page.
   The site admin and teachers are not restricted. Typing in answer boxes still works normally. */
(function () {
  // 17 Nov 2026 (admin): signed-up students and teachers are NOT restricted (now or in future); only visitors are kept out,
  // and they never reach a locked page. So the watermark and copy blocks are switched off.
  var ENABLED = false;
  if (!ENABLED || !window.BV_LOCKED || window.BV_GUARD) return; window.BV_GUARD = 1;
  var BV = window.BV || {}, sess = null;
  try { Object.keys(localStorage).forEach(function (k) { if (/^sb-.*-auth-token$/.test(k)) { var v = JSON.parse(localStorage.getItem(k)); sess = v && (v.currentSession || v); } }); } catch (e) {}
  var user = sess && sess.user; if (!user) return;
  var C = 'bv-staff-' + user.id;
  function staff() {
    try { var c = sessionStorage.getItem(C); if (c != null) return Promise.resolve(c === '1'); } catch (e) {}
    if (!BV.sbUrl || !BV.sbKey || !sess.access_token) return Promise.resolve(false);
    return fetch(BV.sbUrl + '/rest/v1/rpc/is_class_teacher', { method: 'POST', headers: { apikey: BV.sbKey, Authorization: 'Bearer ' + sess.access_token, 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { return r.ok ? r.json() : false; }).then(function (t) { try { sessionStorage.setItem(C, t === true ? '1' : '0'); } catch (e) {} return t === true; }, function () { return false; });
  }
  function editable(el) { return el && el.closest && el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .vl-ctl, .pad, canvas.drawpad'); }
  function protect() {
    var name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '', mark = (name ? name + ' · ' : '') + (user.email || '') + ' · ' + new Date().toLocaleDateString('en-GB');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220"><text x="10" y="120" transform="rotate(-24 210 110)" font-family="Arial" font-size="15" fill="#334155" fill-opacity="0.13">' + mark.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }) + '</text></svg>';
    var url = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
    function addMark() { if (document.getElementById('bv-wm')) return; var d = document.createElement('div'); d.id = 'bv-wm'; d.setAttribute('aria-hidden', 'true');
      d.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;background-image:' + url + ';background-repeat:repeat'; (document.body || document.documentElement).appendChild(d); }
    addMark(); new MutationObserver(addMark).observe(document.documentElement, { childList: true, subtree: true });
    var st = document.createElement('style');
    st.textContent = 'body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}input,textarea,select,[contenteditable]{-webkit-user-select:text;user-select:text}img,svg,canvas,video{-webkit-user-drag:none}' +
      '@media print{body *{visibility:hidden!important}body::before{visibility:visible;content:"Printing VistaEd materials is not allowed. Use the lesson online.";position:fixed;top:40px;left:40px;font:20px Arial}}';
    document.head.appendChild(st);
    document.addEventListener('contextmenu', function (e) { if (!editable(e.target)) e.preventDefault(); }, true);
    ['copy', 'cut'].forEach(function (t) { document.addEventListener(t, function (e) { if (!editable(e.target)) { e.preventDefault(); } }, true); });
    document.addEventListener('dragstart', function (e) { if (!editable(e.target)) e.preventDefault(); }, true);
    document.addEventListener('keydown', function (e) {
      var k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if ((mod && (k === 's' || k === 'p' || k === 'u')) || (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) || k === 'f12' || (mod && (k === 'c' || k === 'x' || k === 'a') && !editable(e.target))) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    window.addEventListener('beforeprint', function () { document.documentElement.setAttribute('data-noprint', '1'); });
    try { window.print = function () { alert('Printing VistaEd materials is not allowed.'); }; } catch (e) {}
  }
  staff().then(function (isStaff) { if (!isStaff) protect(); });
})();
