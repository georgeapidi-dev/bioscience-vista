/* Learnova · lesson videos and slides shown inside the lesson (no download buttons). Videos stream from the
   creator's files; slides are drawn page by page with PDF.js from this site. Both credit their creators. */
(function () {
  function overlay(fr) {   // cover the player's "open in new window" corner so the video stays in the lesson
    var w = fr.parentNode, c = document.createElement('div');
    c.style.cssText = 'position:absolute;top:0;right:0;width:64px;height:64px;z-index:2;background:transparent'; w.appendChild(c);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-play]'); if (!b) return;
    var box = b.parentNode, fr = document.createElement('iframe');
    fr.src = 'https://drive.google.com/file/d/' + encodeURIComponent(b.getAttribute('data-play')) + '/preview';
    fr.allow = 'autoplay; fullscreen'; fr.setAttribute('allowfullscreen', ''); fr.title = b.getAttribute('data-title') || 'Lesson video';
    fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:10px';
    box.innerHTML = ''; box.appendChild(fr); overlay(fr);
  });
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.lv-media')) e.preventDefault(); });
  var lib = null;
  function pdfjs() {
    if (lib) return lib;
    lib = new Promise(function (ok, bad) {
      var s = document.createElement('script'); s.src = '/assets/pdfjs/pdf.min.js';
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.js'; ok(window.pdfjsLib); };
      s.onerror = bad; document.head.appendChild(s);
    });
    return lib;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-slides]'); if (!b) return;
    var view = b.closest('.lv-media').querySelector('.lv-slides'), url = b.getAttribute('data-slides');
    view.hidden = false; view.innerHTML = '<p class="small">Loading slides…</p>';
    pdfjs().then(function (P) { return P.getDocument({ url: url }).promise; }).then(function (doc) {
      view.innerHTML = '<p class="small muted">' + doc.numPages + ' slides · scroll to read</p>';
      var n = 0;
      (function next() {
        if (++n > doc.numPages) return;
        doc.getPage(n).then(function (pg) {
          var w = Math.min(view.clientWidth || 800, 900), vp0 = pg.getViewport({ scale: 1 }), sc = w / vp0.width, vp = pg.getViewport({ scale: sc * (window.devicePixelRatio || 1) });
          var c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; c.style.cssText = 'width:100%;height:auto;display:block;margin:0 0 10px;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,.15)';
          c.setAttribute('aria-label', 'Slide ' + n); view.appendChild(c);
          pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(next);
        });
      })();
    }).catch(function () { view.innerHTML = '<p class="small">The slides could not load. Check your connection and try again.</p>'; });
  });
})();
