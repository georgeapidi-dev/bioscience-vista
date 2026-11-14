/* Learnova · lesson slides, built from the lesson itself: notes, diagrams, images and videos only (no questions or tasks).
   Every interactive lesson gets a slide deck inside the page: arrows, keyboard, swipe, and an Expand button
   for full screen. Nothing to download: slides are drawn live from the lesson's own content. */
(function () {
  var host = document.getElementById('lv-deck'); if (!host) return;
  var MAX = 520;   // text characters on one slide before it splits
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
  /* videos of the lesson: every YouTube link becomes a card on a "Watch" slide (thumbnail when the link names one video) */
  var seenV = {};
  function vids(links) {
    var out = [];
    [].forEach.call(links, function (a) {
      var h = a.getAttribute('href') || ''; if (!/youtube\.com|youtu\.be/.test(h) || seenV[h]) return; seenV[h] = 1;
      var m = h.match(/(?:watch\?v=|youtu\.be\/|embed\/)([\w-]{6,})/), b = a.querySelector('b'), sm = a.querySelector('small');
      var t = b ? txt(b) : txt(a); if (!t || /^https?:/i.test(t)) t = 'Video for this lesson';
      out.push('<a class="sd-vid" href="' + E(h) + '" target="_blank" rel="noopener">' + (m ? '<img src="https://i.ytimg.com/vi/' + E(m[1]) + '/mqdefault.jpg" alt="">' : '<span class="sd-play">▶</span>') +
        '<span><b>' + E(t.slice(0, 90)) + '</b><small>' + E(sm ? txt(sm) : (m ? 'Opens on YouTube' : 'Opens a YouTube search')) + '</small></span></a>');
    });
    return out;
  }
  function vidSlides(cards, step) { for (var k = 0; k < cards.length; k += 4) slides.push({ kind: 'html', head: 'Watch', step: step, html: '<div class="sd-vids">' + cards.slice(k, k + 4).join('') + '</div>' }); }
  vidSlides(vids([].filter.call(document.querySelectorAll('a[href*="youtu"]'), function (a) { return !a.closest('section.step') && !a.closest('#lv-deck') && !a.closest('header nav, footer'); })), '');
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
  function pack(head, bl, step) {   // group blocks into slides; a figure takes a slide, or shares one with a short text
    var cur = [], w = 0;
    function flush() { if (cur.length) slides.push({ kind: 'notes', head: head, step: step, nodes: cur }); cur = []; w = 0; }
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
    if (/reflect/i.test(kind)) return;   // the reflection checklist is a task, not notes
    // notes, figures, tables and diagrams in reading order (not the question cards)
    var items = [].slice.call(st.children).filter(function (n) { return !n.classList.contains('stephead') && !n.classList.contains('task') && !n.classList.contains('savecard') && !n.classList.contains('videos'); });
    var bl = [], sub = head;
    items.forEach(function (n) {
      if (n.classList.contains('nh') || /^h3$/i.test(n.tagName)) { pack(sub, bl, kind); bl = []; sub = /^(notes|read this)/i.test(txt(n)) ? head : (txt(n) || head); return; }
      if (n.classList.contains('notes') || n.classList.contains('banner')) bl = bl.concat(blocks(n));
      else if (n.querySelectorAll('input,select,button,canvas').length > 2) return;   // a live simulator: it stays in the lesson
      else if (isFig(n) || n.querySelector('img,svg,table')) bl.push({ n: clean(n), w: MAX, fig: true });
    });
    pack(sub, bl, kind);
    vidSlides(vids(st.querySelectorAll('a[href*="youtu"]')), kind);   // the step's videos follow its notes
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
  /* Every part of a slide must be visible. Text shrinks a little, then pictures shrink, then text again;
     if the slide still does not fit, it scrolls inside its frame (with a hint), so nothing is ever cut off.
     Pictures load after the slide is drawn, so the slide is fitted again each time one finishes loading. */
  function over() { var b = box.querySelector('.sd-body') || box; return b.scrollHeight > b.clientHeight + 2 || box.scrollHeight > box.clientHeight + 2; }
  function fit() {
    var f = 1, pic = box.querySelector('.sd-body img,.sd-body svg'), ih = box.classList.contains('sd-figonly') ? 38 : 26;
    box.classList.remove('sd-scroll'); box.style.removeProperty('--k'); box.style.removeProperty('--ih');
    while (over() && f > 0.76) { f -= 0.06; box.style.setProperty('--k', f.toFixed(2)); }
    while (over() && pic && ih > 13) { ih -= 3; box.style.setProperty('--ih', ih + 'cqw'); }
    while (over() && f > 0.52) { f -= 0.05; box.style.setProperty('--k', f.toFixed(2)); }
    if (over()) { box.style.setProperty('--k', '0.82'); if (pic) box.style.setProperty('--ih', '24cqw'); box.classList.add('sd-scroll'); }
  }
  box.addEventListener('load', function () { fit(); }, true);
  box.addEventListener('error', function () { setTimeout(fit, 30); }, true);
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
