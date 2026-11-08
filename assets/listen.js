/* Learnova · read-aloud for every interactive lesson (UDL: multiple means of representation)
   Adds "🔊 Listen to this step" to each step and a 🔊 button to any notes box that has none. Uses the browser's own voice. */
(function () {
  if (!('speechSynthesis' in window) || window.__bvListen) return; window.__bvListen = true;
  var css = document.createElement('style');
  css.textContent = '.bv-say{width:auto!important;max-width:max-content!important;min-width:0!important;flex:none!important;box-shadow:none!important;text-transform:none!important;display:inline-flex!important;align-items:center;gap:6px;border:1.5px solid #2563eb;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:5px 12px;font:600 13px/1.2 system-ui,Arial,sans-serif;cursor:pointer;margin:6px 0}' +
    '.bv-say:hover{background:#dbeafe}.bv-say.on{background:#1d4ed8;color:#fff}.bv-say.sm{padding:3px 9px;font-size:12px;float:right;margin:0 0 6px 8px}' +
    '.bv-reading{outline:3px solid #93c5fd;outline-offset:4px;border-radius:8px}@media print{.bv-say{display:none}}';
  document.head.appendChild(css);
  var cur = null, queue = [];

  function textOf(el) {   // what a student would read: no inputs, buttons, feedback or teacher boxes
    var c = el.cloneNode(true);
    c.querySelectorAll('textarea,input,select,button,script,style,noscript,.fb,.feedback,.status,.bv-tans,.bv-rep,.fbzone,.modelzone,.aizone,svg,canvas,[aria-hidden="true"],.hidden').forEach(function (x) { x.remove(); });
    c.querySelectorAll('li,p,h1,h2,h3,h4,tr,figcaption,div').forEach(function (x) { x.insertAdjacentText('beforeend', '. '); });
    return (c.textContent || '').replace(/[▶⚠✓✗→←]/g, ' ').replace(/\bhttps?:\/\/\S+/g, '').replace(/\s*\.\s*(\.\s*)+/g, '. ').replace(/\s+/g, ' ').trim();
  }
  function chunks(t) {   // short pieces: some browsers stop long speech after about 15 seconds
    var out = [], parts = t.match(/[^.!?;:]+[.!?;:]*/g) || [t], buf = '';
    parts.forEach(function (p) { if ((buf + p).length > 180 && buf) { out.push(buf); buf = ''; } buf += p; });
    if (buf.trim()) out.push(buf); return out;
  }
  function stop() {
    speechSynthesis.cancel(); queue = [];
    if (cur) { cur.btn.classList.remove('on'); cur.btn.textContent = cur.label; if (cur.el) cur.el.classList.remove('bv-reading'); cur = null; }
  }
  function speak(btn, el, label) {
    if (cur && cur.btn === btn) { stop(); return; }
    stop(); var t = textOf(el); if (!t) return;
    cur = { btn: btn, el: el, label: label }; btn.classList.add('on'); btn.textContent = '⏹ Stop'; el.classList.add('bv-reading');
    queue = chunks(t);
    (function next() {
      if (!cur || cur.btn !== btn) return;
      var piece = queue.shift(); if (!piece) { stop(); return; }
      var u = new SpeechSynthesisUtterance(piece); u.lang = 'en-GB'; u.rate = 0.95;
      u.onend = next; u.onerror = function () { stop(); }; speechSynthesis.speak(u);
    })();
  }
  function button(label, small) { var b = document.createElement('button'); b.type = 'button'; b.className = 'bv-say' + (small ? ' sm' : ''); b.textContent = label; b.setAttribute('aria-label', label.replace('🔊', '').trim() || 'Listen'); return b; }
  function hasSpeaker(el) { return !!el.querySelector('button.say, .bv-say, [data-say]') || /🔊/.test(Array.prototype.map.call(el.querySelectorAll('button'), function (b) { return b.textContent; }).join('')); }

  function addSteps() {
    var steps = document.querySelectorAll('section[id^="step"], section.step, main [id^="step"]:not(button):not(a)');
    Array.prototype.forEach.call(steps, function (sec) {
      if (sec.querySelector(':scope > .bv-say, :scope > * > .bv-say.step')) return;
      if (sec.closest('[id^="step"]') !== sec && sec.parentElement && sec.parentElement.closest('[id^="step"]')) return;   // only the outer step
      var head = sec.querySelector('h2, .stephead, h3'), b = button('🔊 Listen to this step'); b.classList.add('step');
      b.onclick = function () { speak(b, sec, '🔊 Listen to this step'); };
      if (head) head.insertAdjacentElement('afterend', b); else sec.insertBefore(b, sec.firstChild);
    });
    if (!steps.length) {   // notes pages without steps: one button per main heading
      document.querySelectorAll('main h2, body > h2, article h2').forEach(function (h) {
        if (h.nextElementSibling && h.nextElementSibling.classList && h.nextElementSibling.classList.contains('bv-say')) return;
        var b = button('🔊 Listen');
        b.onclick = function () { var wrap = document.createElement('div'); wrap.appendChild(h.cloneNode(true)); var m = h.nextElementSibling; while (m && !/^H[12]$/.test(m.tagName) && !m.classList.contains('bv-say')) { wrap.appendChild(m.cloneNode(true)); m = m.nextElementSibling; } speakText(b, wrap, h); };
        h.insertAdjacentElement('afterend', b);
      });
    }
  }
  function speakText(btn, wrap, hl) {   // read a detached copy, highlight the heading
    if (cur && cur.btn === btn) { stop(); return; }
    stop(); var t = textOf(wrap); cur = { btn: btn, el: hl, label: btn.textContent }; btn.classList.add('on'); btn.textContent = '⏹ Stop'; hl.classList.add('bv-reading'); queue = chunks(t);
    (function next() { if (!cur || cur.btn !== btn) return; var p = queue.shift(); if (!p) { stop(); return; } var u = new SpeechSynthesisUtterance(p); u.lang = 'en-GB'; u.rate = 0.95; u.onend = next; u.onerror = function () { stop(); }; speechSynthesis.speak(u); })();
  }
  function addNotes() {
    document.querySelectorAll('.notes, .note-box, .notebox, .notes-box, [class~="note"]:not(.bv-say), details.notes, .box.notes, .card.notes').forEach(function (el) {
      if (el.closest('.bv-tans, .fb, .feedback, .status')) return;
      if (hasSpeaker(el) || (el.parentElement && hasSpeaker(el.parentElement) && el.parentElement.querySelectorAll('.notes, ul').length <= 1)) return;
      if ((el.textContent || '').trim().length < 60) return;
      var b = button('🔊', true); b.setAttribute('aria-label', 'Listen to these notes'); b.title = 'Listen to these notes';
      b.onclick = function () { speak(b, el, '🔊'); };
      el.insertBefore(b, el.firstChild);
    });
  }
  function run() { try { addSteps(); addNotes(); } catch (e) { if (window.console) console.warn('listen', e); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  setTimeout(run, 1500); setTimeout(run, 4000);   // lessons that build their pages after loading
  window.addEventListener('pagehide', stop);
})();
