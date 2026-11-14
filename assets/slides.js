/* Learnova · lesson slides, built from the lesson itself (notes, figures, diagrams, tables and questions).
   Every interactive lesson gets a slide deck inside the page: arrows, keyboard, swipe, and an Expand button
   for full screen. Nothing to download: slides are drawn live from the lesson's own content. */
(function () {
  var host = document.getElementById('lv-deck'); if (!host) return;
  var MAX = 620;   // text characters on one slide before it splits
  function txt(n) { return (n.textContent || '').replace(/\s+/g, ' ').trim(); }
  function clean(n) {   // a copy without buttons, inputs, answer boxes or ids that would clash
    var c = n.cloneNode(true);
    c.querySelectorAll('button,textarea,input,select,details,.say,.lv-qr,script,.savecard,.feedback').forEach(function (x) { x.remove(); });
    c.querySelectorAll('[id]').forEach(function (x) { if (x.tagName.toLowerCase() !== 'svg' && !x.closest('svg')) x.removeAttribute('id'); });
    c.removeAttribute && c.removeAttribute('id');
    return c;
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var E = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var isFig = function (n) { return /^(figure|svg|img|table)$/i.test(n.tagName) || (n.classList && (n.classList.contains('tbl') || n.classList.contains('fig') || n.classList.contains('diagram'))) || (n.querySelector && n.querySelector('img,svg,table') && txt(n).length < 260); };

  // ---------- read the lesson ----------
  var slides = [], h1 = document.querySelector('h1'), title = h1 ? txt(h1) : document.title;
  var meta = document.querySelector('header .meta, .meta'), big = document.querySelector('.big'), hook = document.querySelector('.hook p');
  slides.push({ kind: 'title', html: '<p class="sd-k">' + E(meta ? txt(meta).replace(/ · Prepared by Learnova/, '') : 'Learnova lesson') + '</p><h1>' + E(title) + '</h1>' +
    (big ? '<p class="sd-q">' + E(txt(big)) + '</p>' : '') + (hook ? '<p class="sd-hook">🎯 ' + E(txt(hook)) + '</p>' : '') });
  var firstStep = document.querySelector('section.step');
  var pre = [].slice.call(document.querySelectorAll('.card.notes')).filter(function (n) { return !n.closest('section.step') && firstStep && (n.compareDocumentPosition(firstStep) & 4); });
  pre.forEach(function (n) { if (/able to|objective|learning|success/i.test(txt(n).slice(0, 120))) slides.push({ kind: 'notes', head: 'Learning objectives', nodes: [clean(n)] }); });
  var kt = [].slice.call(document.querySelectorAll('b,strong,h3')).filter(function (b) { return /^key terms/i.test(txt(b)) && !b.closest('section.step'); })[0];
  if (kt) {
    var words = txt(kt.parentNode).replace(/^.*?key terms[^:]*:\s*/i, '').split(/\s*[·,;]\s*/).filter(Boolean);
    if (words.length) slides.push({ kind: 'html', head: 'Key terms', html: '<ul class="sd-terms">' + words.map(function (w) { return '<li>' + E(w) + '</li>'; }).join('') + '</ul>' });
  }
  function blocks(card) {   // split a notes card into slide-sized blocks
    var out = [];
    [].forEach.call(clean(card).childNodes, function (n) {
      if (n.nodeType === 3) { if (n.textContent.trim()) out.push({ n: el('p', '', E(n.textContent.trim())), w: n.textContent.length }); return; }
      if (n.nodeType !== 1) return;
      if (/^(ul|ol)$/i.test(n.tagName) && txt(n).length > MAX) {
        [].forEach.call(n.children, function (li) { var u = el(n.tagName.toLowerCase()); u.appendChild(li.cloneNode(true)); out.push({ n: u, w: txt(li).length, li: true }); });
      } else out.push({ n: n, w: isFig(n) ? MAX : txt(n).length, fig: isFig(n) });
    });
    return out;
  }
  function pack(head, bl) {   // group blocks into slides; a figure takes a slide, or shares one with a short text
    var cur = [], w = 0;
    function flush() { if (cur.length) slides.push({ kind: 'notes', head: head, nodes: cur }); cur = []; w = 0; }
    bl.forEach(function (b) {
      if (b.fig) { if (w > 320) flush(); cur.push(b.n); flush(); return; }
      if (w + b.w > MAX && cur.length) flush();
      if (b.li && cur.length && cur[cur.length - 1].tagName === b.n.tagName && cur[cur.length - 1].dataset.merge) cur[cur.length - 1].appendChild(b.n.firstChild);
      else { if (b.li) b.n.dataset.merge = 1; cur.push(b.n); }
      w += b.w;
    });
    flush();
  }
  [].forEach.call(document.querySelectorAll('section.step'), function (st) {
    var chip = st.querySelector('.chip'), h2 = st.querySelector('h2'), head = (h2 ? txt(h2) : '');
    var kind = chip ? txt(chip) : '';
    if (/reflect/i.test(kind)) {   // the "I can" checklist becomes the summary slide
      var cans = [].slice.call(st.querySelectorAll('.tl > span:first-child')).map(txt).filter(Boolean);
      if (cans.length) { slides.push({ kind: 'html', head: 'Summary: I can…', step: kind, html: '<ul class="sd-can">' + cans.map(function (c) { return '<li>' + E(c) + '</li>'; }).join('') + '</ul>' }); return; }
    }
    slides.push({ kind: 'step', html: '<p class="sd-k">' + E(kind) + '</p><h2>' + E(head) + '</h2>' });
    // notes, figures, tables and diagrams in reading order (not the question cards)
    var items = [].slice.call(st.children).filter(function (n) { return !n.classList.contains('stephead') && !n.classList.contains('task') && !n.classList.contains('savecard') && !n.classList.contains('videos'); });
    var bl = [], sub = head;
    items.forEach(function (n) {
      if (n.classList.contains('nh') || /^h3$/i.test(n.tagName)) { pack(sub, bl); bl = []; sub = /^(notes|read this)/i.test(txt(n)) ? head : (txt(n) || head); return; }
      if (n.classList.contains('notes') || n.classList.contains('banner')) bl = bl.concat(blocks(n));
      else if (n.querySelectorAll('input,select,button,canvas').length > 2) return;   // a live simulator: it stays in the lesson
      else if (isFig(n) || n.querySelector('img,svg,table')) bl.push({ n: clean(n), w: MAX, fig: true });
    });
    pack(sub, bl);
    var qs = [].slice.call(st.querySelectorAll('.card.task .ql')).map(txt).filter(Boolean).slice(0, 4);
    if (qs.length) slides.push({ kind: 'html', head: 'Check your understanding', step: kind, html: '<ol class="sd-qs">' + qs.map(function (q) { return '<li>' + E(q.replace(/^(Q?\d+\.)\s*/, '')) + '</li>'; }).join('') + '</ol><p class="sd-note">Answer in your book, then type your answers in the lesson below.</p>' });
  });
  if (slides.length < 3) { host.remove(); return; }

  // ---------- the viewer ----------
  host.className = 'card sd';
  host.innerHTML = '<div class="sd-bar"><b>📑 Lesson slides</b><span class="sd-n" aria-live="polite"></span><span class="sd-btns"><button type="button" class="sd-p" aria-label="Previous slide">‹</button><button type="button" class="sd-nx" aria-label="Next slide">›</button><button type="button" class="sd-x" aria-label="Expand slides to full screen">⛶ Expand</button></span></div>' +
    '<div class="sd-stage" tabindex="0" aria-roledescription="slides"><div class="sd-slide"></div></div><input class="sd-r" type="range" min="1" max="' + slides.length + '" value="1" aria-label="Go to slide">';
  var stage = host.querySelector('.sd-stage'), box = host.querySelector('.sd-slide'), n = host.querySelector('.sd-n'), range = host.querySelector('.sd-r'), i = 0;
  function show(k) {
    i = Math.max(0, Math.min(slides.length - 1, k)); var s = slides[i];
    box.className = 'sd-slide sd-' + s.kind; box.innerHTML = ''; box.style.removeProperty('--k');
    if (s.head) box.appendChild(el('h3', 'sd-h', E(s.head) + (s.step ? '<small>' + E(s.step) + '</small>' : '')));
    var body = el('div', 'sd-body');
    if (s.html && !s.head) box.innerHTML = s.html; else if (s.html) body.innerHTML = s.html;
    (s.nodes || []).forEach(function (x) { body.appendChild(x.cloneNode(true)); });
    if (s.head) box.appendChild(body);
    if (s.nodes && s.nodes.length === 1 && isFig(s.nodes[0])) box.classList.add('sd-figonly');
    box.appendChild(el('span', 'sd-foot', E(title) + ' · ' + (i + 1) + '/' + slides.length));
    n.textContent = (i + 1) + ' / ' + slides.length; range.value = i + 1;
    fit();
  }
  function fit() {   // shrink text until the slide fits
    var f = 1, b = box.querySelector('.sd-body') || box; box.style.removeProperty('--k');
    while ((b.scrollHeight > b.clientHeight + 2 || box.scrollHeight > box.clientHeight + 2) && f > 0.6) { f -= 0.06; box.style.setProperty('--k', f.toFixed(2)); }
  }
  host.querySelector('.sd-p').onclick = function () { show(i - 1); };
  host.querySelector('.sd-nx').onclick = function () { show(i + 1); };
  range.oninput = function () { show(+range.value - 1); };
  var xb = host.querySelector('.sd-x');
  function full() { return document.fullscreenElement === host || host.classList.contains('sd-full'); }
  xb.onclick = function () {
    if (full()) { if (document.fullscreenElement) document.exitFullscreen(); host.classList.remove('sd-full'); }
    else if (host.requestFullscreen) host.requestFullscreen().catch(function () { host.classList.add('sd-full'); });
    else host.classList.add('sd-full');
  };
  function onFull() { xb.textContent = full() ? '✕ Close' : '⛶ Expand'; setTimeout(fit, 60); }
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement) host.classList.remove('sd-full'); onFull(); });
  new MutationObserver(onFull).observe(host, { attributes: true, attributeFilter: ['class'] });
  host.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' && e.target !== range) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(i - 1); }
    if (e.key === 'Escape') host.classList.remove('sd-full');
  });
  var x0 = null;
  stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) { if (x0 == null) return; var d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) show(i + (d < 0 ? 1 : -1)); x0 = null; });
  stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('resize', function () { clearTimeout(fit.t); fit.t = setTimeout(fit, 120); });
  show(0);
})();
