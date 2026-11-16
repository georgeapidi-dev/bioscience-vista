/* BioscienceVista · lesson videos play inside the lesson.
   Any link to one YouTube video (in the notes, the "Watch and learn" box, or a "Watch" slide) opens in a player on the page
   instead of leaving the site: full width, or docked in a corner so the student can keep working while it plays.
   A link to a YouTube search cannot be shown inside another site (YouTube does not allow it), so those still open YouTube
   until a video has been chosen for the lesson. Ctrl/Cmd-click and middle-click keep their usual meaning. */
(function () {
  if (window.BV_LVIDEO) return; window.BV_LVIDEO = 1;
  var RX = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;
  function idOf(h) { var m = RX.exec(h || ''); return m ? m[1] : ''; }
  function startOf(h) {   // ?t=90, ?t=90s, ?t=1m30s, ?start=90
    var m = /[?&#](?:t|start)=(?:(\d+)h)?(?:(\d+)m)?(\d+)?s?(?:&|#|$)/.exec(h || ''); if (!m) return 0;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  }
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function css() {
    if (document.getElementById('bv-vp-css')) return;
    var s = document.createElement('style'); s.id = 'bv-vp-css';
    s.textContent = '#bv-vp{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.78);padding:12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
      '#bv-vp .bv-vp-box{width:min(980px,100%);max-height:100%;background:#0f172a;color:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden;display:flex;flex-direction:column}' +
      '#bv-vp .bv-vp-bar{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 10px;background:#1e3a8a}' +
      '#bv-vp .bv-vp-t{font-weight:700;font-size:.98rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}' +
      '#bv-vp .bv-vp-btns{display:flex;gap:6px;flex:none}' +
      '#bv-vp button{font:700 .86rem system-ui,sans-serif;border:0;border-radius:8px;padding:7px 11px;cursor:pointer;background:#fff;color:#1e3a8a}#bv-vp button[data-a="close"]{background:#fde047;color:#1f2937}' +
      '#bv-vp button:focus-visible,#bv-vp a:focus-visible{outline:3px solid #fde047;outline-offset:2px}' +
      '#bv-vp .bv-vp-frame{position:relative;width:100%;aspect-ratio:16/9;background:#000;max-height:calc(100vh - 150px)}#bv-vp iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
      '#bv-vp .bv-vp-note{margin:0;padding:7px 12px;font-size:.8rem;color:#cbd5e1;background:#0f172a}#bv-vp .bv-vp-note a{color:#fde047}' +
      '#bv-vp.dock{inset:auto 12px 64px auto;background:transparent;padding:0;display:block;width:min(400px,calc(100vw - 24px))}#bv-vp.dock .bv-vp-note{display:none}#bv-vp.dock .bv-vp-frame{max-height:none}' +
      '@media (max-width:560px){#bv-vp .bv-vp-bar{flex-wrap:wrap}#bv-vp.dock{inset:auto 8px 60px 8px;width:auto}}' +
      '@media print{#bv-vp{display:none!important}}';
    document.head.appendChild(s);
  }
  var box = null, opener = null;
  function close() {
    if (!box) return;
    box.remove(); box = null;   // removing the frame stops the video
    if (opener && document.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    opener = null;
  }
  function dock(on) {
    if (!box) return;
    box.classList.toggle('dock', on); box.setAttribute('aria-modal', on ? 'false' : 'true');
    var b = box.querySelector('[data-a="dock"]'); b.textContent = on ? '⤢ Bigger' : '▣ Watch while I work'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function open(id, title, href, from) {
    css(); close(); opener = from || null;
    box = document.createElement('div'); box.id = 'bv-vp'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Lesson video: ' + (title || 'video'));
    var st = startOf(href), yt = 'https://www.youtube.com/watch?v=' + id + (st ? '&t=' + st + 's' : '');
    box.innerHTML = '<div class="bv-vp-box"><div class="bv-vp-bar"><span class="bv-vp-t">▶ ' + E(title || 'Lesson video') + '</span><span class="bv-vp-btns">' +
      '<button type="button" data-a="dock" aria-pressed="false">▣ Watch while I work</button><button type="button" data-a="close" aria-label="Close the video">✕ Close</button></span></div>' +
      '<div class="bv-vp-frame"><iframe title="' + E(title || 'Lesson video') + '" src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1' + (st ? '&start=' + st : '') +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' +
      '<p class="bv-vp-note">The video plays here, inside your lesson. If it does not start, its owner has switched off playing on other sites: <a href="' + E(yt) + '" target="_blank" rel="noopener">open it on YouTube</a>.</p></div>';
    (document.fullscreenElement || document.body).appendChild(box);   // inside the slide deck when the slides are full screen
    box.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-a]');
      if (b) { if (b.getAttribute('data-a') === 'close') close(); else dock(!box.classList.contains('dock')); return; }
      if (e.target === box && !box.classList.contains('dock')) close();   // a click on the dark surround closes it
    });
    var c = box.querySelector('[data-a="close"]'); try { c.focus({ preventScroll: true }); } catch (e) {}
  }
  function label(a) {   // what the link says about where it opens
    var t = '';
    var b = a.querySelector && a.querySelector('b'); if (b) t = b.textContent;
    if (!t) t = a.getAttribute('aria-label') || a.textContent || '';
    t = t.replace(/\s+/g, ' ').replace(/^[▶►\s]+/, '').trim();
    return /^https?:/i.test(t) || !t ? 'Lesson video' : t.slice(0, 110);
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.closest('#bv-vp')) return;
    var h = a.getAttribute('href'), id = idOf(h); if (!id) return;
    e.preventDefault(); open(id, label(a), h, a);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box) { e.stopPropagation(); close(); } }, true);
  document.addEventListener('fullscreenchange', function () {   // keep the player on screen when the slides enter or leave full screen
    if (!box) return; var home = document.fullscreenElement || document.body; if (box.parentNode !== home) home.appendChild(box);
  });
  /* say on the page that these videos play here */
  function mark() {
    [].forEach.call(document.querySelectorAll('a[href*="youtu"]'), function (a) {
      if (a.hasAttribute('data-bvplay') || !idOf(a.getAttribute('href'))) return;
      a.setAttribute('data-bvplay', '1'); a.removeAttribute('target'); a.title = 'Plays here, inside the lesson';
      [].forEach.call(a.querySelectorAll('small,span'), function (s) {
        if (s.children.length) return;
        s.textContent = s.textContent.replace(/Opens on YouTube\.?/i, 'Plays here in the lesson').replace(/\s*·\s*YouTube\s*$/i, ' · plays here');
      });
    });
    [].forEach.call(document.querySelectorAll('.bv-videos p.small'), function (p) { if (/Opens on YouTube/.test(p.textContent)) p.textContent = p.textContent.replace(/Opens on YouTube\.?/, 'Plays here, inside the lesson.'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mark); else mark();
  setTimeout(mark, 1500); setTimeout(mark, 4000);   // pages that draw their content with a script
  window.BV_PLAY = function (idOrUrl, title) { var id = idOf(idOrUrl) || (/^[\w-]{11}$/.test(idOrUrl) ? idOrUrl : ''); if (id) open(id, title, idOrUrl, document.activeElement); };
})();
