/* Learnova motion layer: scroll reveals, header on scroll, count-up numbers, hero network and parallax. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top = document.querySelector('header.top');
  function onScroll() { if (top) top.classList.toggle('scrolled', window.scrollY > 8); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (reduce || !('IntersectionObserver' in window)) return;

  // reveal cards and sections as they scroll into view, staggered within each group
  var sel = '.course,.card,.panel,.tile,.simc,.hm-tile,.hm-stats>div,.hm-steps li,.grp>h2,.sec-h,.res>.card,.feat>a,.hm-sec>header,.hm-band,.lwc,.vl-card';
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  function scan(root) {
    (root || document).querySelectorAll(sel).forEach(function (el) {
      if (el.classList.contains('lv-r') || el.closest('.hm-hero') || el.closest('[data-noreveal]')) return;
      var r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.9 && r.bottom > 0) return;   // already on screen: no animation, no flash
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--d', Math.min(sib, 8) * 0.06 + 's'); el.classList.add('lv-r'); io.observe(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); }); else scan();
  setTimeout(function () { scan(); }, 1200);   // content added by scripts after load

  // count-up numbers: <b data-count="119">
  var cio = new IntersectionObserver(function (es) { es.forEach(function (e) {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    var el = e.target, to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suf') || '', t0 = performance.now(), d = 1400;
    (function step(t) { var k = Math.min(1, (t - t0) / d), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = v + suf; if (k < 1) requestAnimationFrame(step); })(t0);
  }); }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suf') || ''); cio.observe(el); });

  // hero: a gently moving network of "molecules", only while visible
  var cv = document.querySelector('canvas.hm-net');
  if (cv) {
    var ctx = cv.getContext('2d'), pts = [], W = 0, H = 0, run = true, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); var n = Math.round(Math.min(70, W * H / 14000)); pts = []; for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1.2 + Math.random() * 2.2 }); }
    function frame() {
      if (!run) return; ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) { var p = pts[i]; p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        for (var j = i + 1; j < pts.length; j++) { var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy; if (d2 < 13000) { ctx.strokeStyle = 'rgba(148,163,184,' + (0.28 * (1 - d2 / 13000)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }
        ctx.fillStyle = 'rgba(165,243,252,.75)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
      requestAnimationFrame(frame);
    }
    size(); addEventListener('resize', size);
    new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !run) { run = true; frame(); } else if (!v) run = false; }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (document.hidden) run = false; else if (!run) { run = true; frame(); } });
    frame();
  }
  // hero photos follow the pointer slightly (desktop only)
  var vis = document.querySelector('.hm-vis');
  if (vis && matchMedia('(pointer:fine)').matches) {
    var items = vis.querySelectorAll('[data-depth]');
    vis.parentNode.addEventListener('pointermove', function (e) {
      var r = vis.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      items.forEach(function (el) { var d = +el.getAttribute('data-depth'); el.style.translate = (x * d * 24).toFixed(1) + 'px ' + (y * d * 24).toFixed(1) + 'px'; });
    });
  }
})();
