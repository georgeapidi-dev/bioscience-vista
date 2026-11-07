/* Get the app page · BioScience Vista */
(function () {
  var A = (window.BV && BV.app) || {}, box = document.getElementById('appcta'), ua = navigator.userAgent;
  var os = A.ios ? 'ios' : /android/i.test(ua) ? 'android' : 'desktop';
  document.querySelectorAll('#howto [data-os]').forEach(function (s) { if (s.getAttribute('data-os') === os) { s.classList.add('tint'); s.parentNode.prepend(s); } });
  function draw(msg) {
    if (A.installed) { box.innerHTML = '<p class="msg ok">✅ You are using the installed app.</p>'; return; }
    if (A.can) { box.innerHTML = '<button class="btn main" type="button" id="inst">📲 Install app</button><span class="small muted">Free · about 1 MB</span>';
      document.getElementById('inst').onclick = function () { A.install().then(function (ok) { draw(ok ? 'done' : ''); }); }; return; }
    if (msg === 'done') { box.innerHTML = '<p class="msg ok">✅ Installed. Open BioScience Vista from your home screen or desktop.</p>'; return; }
    box.innerHTML = os === 'ios'
      ? '<p class="msg">On iPhone and iPad: tap <b>Share</b> (□↑) in Safari, then <b>Add to Home Screen</b>.</p>'
      : '<p class="msg">Your browser has not offered the install button yet. Follow the steps for your device below, or open this page in Chrome or Edge.</p>';
  }
  document.addEventListener('bv-installable', function () { draw(); });
  document.addEventListener('bv-installed', function () { draw('done'); });
  draw();
  var sb = document.getElementById('saveall'), sm = document.getElementById('savemsg');
  if (sb) {
    if (!('serviceWorker' in navigator)) { sb.disabled = true; sm.textContent = 'This browser cannot save pages for offline use.'; }
    try { if (localStorage.getItem('bv-saved-all')) sm.textContent = 'Saved for offline on ' + new Date(+localStorage.getItem('bv-saved-all')).toLocaleDateString() + '. Press again to update.'; } catch (e) {}
    sb.onclick = function () {
      if (!navigator.onLine) { sm.textContent = 'Connect to the internet first.'; return; }
      sb.disabled = true; sm.textContent = 'Preparing…';
      navigator.serviceWorker.ready.then(function (reg) { (reg.active || navigator.serviceWorker.controller).postMessage({ type: 'save-all' }); });
    };
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type === 'save-progress') sm.textContent = 'Saving… ' + d.done + ' of ' + d.total + ' files';
      if (d.type === 'save-done') { sb.disabled = false; sm.textContent = d.fail ? 'Saved, but ' + d.fail + ' files could not be saved. Try again on a better connection.' : '✅ Everything is saved. The whole site now works offline on this device.';
        try { localStorage.setItem('bv-saved-all', String(Date.now())); } catch (x) {} }
    });
  }
})();
