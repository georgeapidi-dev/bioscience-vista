/* Autosave: keeps everything a student types, ticks or chooses in this lesson, on this device,
   so a refresh or closing the browser loses nothing. Added to every lesson by the hub. */
(function () {
  if (window.__autosave) return; window.__autosave = 1;
  var KEY = 'autosave:' + location.pathname, data = {}, restored = {};
  try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { data = {}; }
  function fields() { return Array.prototype.filter.call(document.querySelectorAll('input, textarea, select'), function (el) {
    var t = (el.type || '').toLowerCase();
    return t !== 'password' && t !== 'file' && t !== 'button' && t !== 'submit' && t !== 'reset' && t !== 'hidden' && !el.closest('#dlkit-btn');
  }); }
  function keyOf(el, i) {
    var t = (el.type || '').toLowerCase(), base = el.getAttribute('data-save') || el.id || el.name || ('#' + i);
    return (t === 'radio') ? 'r:' + (el.name || base) + '=' + el.value : base;
  }
  function snapshot() {
    var out = {};
    fields().forEach(function (el, i) {
      var t = (el.type || '').toLowerCase(), k = keyOf(el, i);
      if (t === 'radio') { if (el.checked) out[k] = 1; }
      else if (t === 'checkbox') out[k] = el.checked ? 1 : 0;
      else if (el.value !== '') out[k] = el.value;
    });
    return out;
  }
  var last = '', stopped = false;
  function save() {
    if (stopped) return;
    var s = JSON.stringify(snapshot()); if (s === last) return; last = s;
    try { localStorage.setItem(KEY, s); localStorage.setItem(KEY + ':t', String(Date.now())); } catch (e) {}
  }
  function fire(el) { ['input', 'change'].forEach(function (ev) { try { el.dispatchEvent(new Event(ev, { bubbles: true })); } catch (e) {} }); }
  function restore() {
    fields().forEach(function (el, i) {
      var t = (el.type || '').toLowerCase(), k = keyOf(el, i);
      if (restored[k] || !(k in data)) return;
      if (t === 'radio') { if (!el.checked) { el.checked = true; fire(el); } }
      else if (t === 'checkbox') { if (el.checked !== !!data[k]) { el.checked = !!data[k]; fire(el); } }
      else if (el.value === '' || el.value == null) { el.value = data[k]; fire(el); }
      restored[k] = 1;
    });
  }
  function start() {
    var had = Object.keys(data).length > 0;
    restore(); setTimeout(restore, 600); setTimeout(restore, 2000);
    document.addEventListener('input', save, true); document.addEventListener('change', save, true);
    setInterval(save, 4000); window.addEventListener('pagehide', save); window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });
    if (had) {
      var n = document.createElement('div');
      n.setAttribute('role', 'status');
      n.style.cssText = 'position:fixed;left:calc(16px + env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;max-width:320px;background:#1f2a24;color:#fff;border-radius:10px;padding:10px 14px;font:14px/1.4 system-ui,Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)';
      n.innerHTML = 'Your saved work is back. <button type="button" style="margin-left:6px;background:none;border:1px solid #fff;color:#fff;border-radius:6px;padding:2px 8px;cursor:pointer;font:inherit">Not me? Clear it</button>';
      n.querySelector('button').addEventListener('click', function () {
        if (!window.confirm || window.confirm('Clear all saved answers on this device? Do this only if this is not your work.')) {
          try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('mas-key') !== 0) localStorage.removeItem(k); }); } catch (e) {}
          stopped = true;
          location.reload();
        }
      });
      document.body.appendChild(n); setTimeout(function () { n.remove(); }, 9000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
