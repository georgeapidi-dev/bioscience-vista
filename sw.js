/* BioScience Vista service worker · version 8ee2eaa99093
   Saves this site's pages and files so they open without internet. Sign-in, results and other websites always use the network. */
var CORE = 'bv-core-8ee2eaa99093', KEEP = 'bv-pages', FONTS = 'bv-fonts';
var CORE_URLS = ["/", "/manifest.webmanifest", "/offline.html", "/g10-sperm-egg-human-reproduction/", "/lessons/", "/grade-6/", "/g9-eukaryotic-organelles-design/", "/g9-why-cells-stay-small/", "/grade-9/", "/book/", "/a21-lesson1/", "/grade-12/", "/simulations/", "/g10-pollination-dispersal/", "/g10-birth-lactation-ivf/", "/g10-reproductive-systems-meiosis/", "/g10-cloning/", "/chemistry/", "/grade-11/", "/grade-8/", "/g9-dna-in-action/", "/brand/", "/a-level/", "/assets/591.supabase.js", "/assets/app.js", "/assets/apple-touch-icon.png", "/assets/auth.js", "/assets/book.js", "/assets/bv.css", "/assets/bv.js", "/assets/content.js", "/assets/dash.js", "/assets/exams.js", "/assets/forum.js", "/assets/george-apidi.jpg", "/assets/icon-192.png", "/assets/jszip.min.js", "/assets/learn-centre.js", "/assets/learn.js", "/assets/lesson-tools.js", "/assets/lesson.js", "/assets/listen.js", "/assets/logo.svg", "/assets/math.min.js", "/assets/quizzes.js", "/assets/sb-lesson.js", "/assets/sb.js", "/assets/site-config.js", "/assets/supabase.js", "/assets/tools.js", "/assets/toolsdock.js", "/library/", "/app/", "/review/", "/g9-unit1-cell-theory/", "/progress/", "/g9-dna-profiling/", "/grade-10/", "/register/", "/quizzes/", "/forum/", "/portfolio/", "/a11-lesson2/", "/g10-reproduction-unit-intro/", "/catalase-lab/", "/staff/", "/exams/", "/exams/classic/", "/g9-prokaryotes-eukaryotes/", "/g10-hormones-menstrual-cycle/", "/igcse/", "/dp2/", "/ib/", "/teacher/", "/a11-lesson3/", "/login/", "/g9-cell-theory/", "/g9-dna-rna/", "/tools/", "/leafdisc/", "/learn/", "/g9-bioprinting-microscope-viruses/", "/g9-surface-area-cells/", "/g10-mitosis-meiosis/", "/myp/", "/lesson/", "/dashboard/", "/g9-protein-synthesis-mutation/", "/g9-cell-organelles/", "/dp1/", "/g9-living-non-living/", "/g10-fertilisation-seeds-dispersal/", "/g10-flower-structure-pollination/", "/g9-specialized-stem-cells/"], ALL_URLS = ["/", "/manifest.webmanifest", "/offline.html", "/g10-sperm-egg-human-reproduction/", "/lessons/", "/grade-6/", "/g9-eukaryotic-organelles-design/", "/g9-why-cells-stay-small/", "/grade-9/", "/book/", "/a21-lesson1/", "/grade-12/", "/simulations/", "/g10-pollination-dispersal/", "/g10-birth-lactation-ivf/", "/g10-reproductive-systems-meiosis/", "/g10-cloning/", "/kit/autosave.js", "/kit/download.js", "/chemistry/", "/grade-11/", "/grade-8/", "/g9-dna-in-action/", "/brand/", "/a-level/", "/assets/591.supabase.js", "/assets/app.js", "/assets/apple-touch-icon.png", "/assets/auth.js", "/assets/book.js", "/assets/bv.css", "/assets/bv.js", "/assets/content.js", "/assets/dash.js", "/assets/exams.js", "/assets/forum.js", "/assets/george-apidi.jpg", "/assets/html2pdf.min.js", "/assets/icon-192.png", "/assets/icon-512.png", "/assets/icon-maskable-512.png", "/assets/jszip.min.js", "/assets/learn-centre.js", "/assets/learn.js", "/assets/lesson-tools.js", "/assets/lesson.js", "/assets/listen.js", "/assets/logo.svg", "/assets/math.min.js", "/assets/pdf.min.js", "/assets/quiz-import.js", "/assets/quizzes.js", "/assets/sb-lesson.js", "/assets/sb.js", "/assets/site-config.js", "/assets/staff.js", "/assets/supabase.js", "/assets/teacher.js", "/assets/tools.js", "/assets/toolsdock.js", "/library/", "/a21-lesson2/", "/app/", "/review/", "/g9-unit1-cell-theory/", "/progress/", "/b12-lesson1/", "/g9-dna-profiling/", "/grade-10/", "/b12-lesson2/", "/register/", "/b12-lesson3/", "/quizzes/", "/c11-lesson4/", "/forum/", "/c11-lesson2/", "/portfolio/", "/a11-lesson2/", "/g10-reproduction-unit-intro/", "/catalase-lab/", "/c11-lesson5/", "/staff/", "/exams/", "/exams/classic/", "/g9-prokaryotes-eukaryotes/", "/b11-lesson1/", "/g10-hormones-menstrual-cycle/", "/igcse/", "/dp2/", "/ib/", "/b11-lesson2/", "/teacher/", "/a11-lesson1/", "/a11-lesson3/", "/c11-notes/", "/login/", "/g9-cell-theory/", "/g9-dna-rna/", "/tools/", "/leafdisc/", "/learn/", "/g9-bioprinting-microscope-viruses/", "/g9-surface-area-cells/", "/g10-mitosis-meiosis/", "/myp/", "/lesson/", "/dashboard/", "/g9-protein-synthesis-mutation/", "/g9-cell-organelles/", "/dp1/", "/g9-living-non-living/", "/g10-fertilisation-seeds-dispersal/", "/g10-flower-structure-pollination/", "/g9-specialized-stem-cells/", "/c11-lesson1/", "/separating-mixtures-2/", "/classification/"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CORE).then(function (c) { return Promise.all(CORE_URLS.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('bv-core-') === 0 && k !== CORE || /^bv-[0-9]/.test(k); }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
function keep(r, res) { if (res && res.ok && res.type === 'basic') { var cp = res.clone(); caches.open(KEEP).then(function (c) { c.put(r, cp); }); } return res; }
function saved(r) { return caches.match(r, { ignoreSearch: true, cacheName: KEEP }).then(function (m) { return m || caches.match(r, { ignoreSearch: true }); }).then(function (m) { return m || (new URL(r.url).pathname.slice(-1) === '/' ? caches.match(new URL('index.html', r.url).href, { ignoreSearch: true }) : null); }); }
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {   // fonts: saved once, reused offline
    e.respondWith(caches.open(FONTS).then(function (c) { return c.match(r).then(function (m) { return m || fetch(r).then(function (res) { c.put(r, res.clone()); return res; }); }); }).catch(function () { return fetch(r); }));
    return;
  }
  if (u.origin !== location.origin || u.pathname === '/sw.js' || /^\/(rest|auth|storage|realtime|functions)\//.test(u.pathname) || r.headers.get('Authorization')) return;   // database and sign-in: always live
  if (r.mode === 'navigate') {   // pages: newest copy when online, saved copy when offline
    e.respondWith(fetch(new Request(r.url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'follow' })).then(function (res) { return keep(r, res); }).catch(function () { return saved(r).then(function (m) { return m || caches.match('/offline.html'); }); }));   // always check for a newer page
    return;
  }
  e.respondWith(fetch(r).then(function (res) { return keep(r, res); }).catch(function () { return saved(r).then(function (m) { return m || Response.error(); }); }));   // files: newest when online, saved copy offline
});
self.addEventListener('message', function (e) {
  if (!e.data || e.data.type !== 'save-all') return;
  var src = e.source, done = 0, fail = 0, list = ALL_URLS;
  e.waitUntil(caches.open(KEEP).then(function (c) {
    var i = 0;
    function next() {
      if (i >= list.length) return Promise.resolve();
      var u = list[i++];
      return fetch(u, { cache: 'no-cache' }).then(function (res) { if (res.ok) return c.put(u, res); fail++; }).catch(function () { fail++; })
        .then(function () { done++; if (done % 5 === 0 || done === list.length) src.postMessage({ type: 'save-progress', done: done, total: list.length, fail: fail }); return next(); });
    }
    return Promise.all([next(), next(), next(), next()]);
  }).then(function () { src.postMessage({ type: 'save-done', total: list.length, fail: fail }); }));
});
