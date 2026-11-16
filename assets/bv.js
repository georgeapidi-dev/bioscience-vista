/* BioscienceVista shared script · by BioscienceVista */
(function () {
  var BV = window.BV = window.BV || {};
  // menu + theme
  var mb = document.querySelector('.menu-btn'), nav = document.getElementById('mainnav');
  if (mb && nav) mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  /* installable app: service worker + install prompt (Android, Windows, Mac, Chromebook); iPhone uses Share → Add to Home Screen */
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  BV.app = { installed: standalone, can: false, ios: /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), ev: null,
    install: function () { if (!BV.app.ev) return Promise.resolve(false); BV.app.ev.prompt(); return BV.app.ev.userChoice.then(function (c) { BV.app.ev = null; BV.app.can = false; return c.outcome === 'accepted'; }); } };
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); BV.app.ev = e; BV.app.can = true; document.dispatchEvent(new Event('bv-installable'));
    if (nav && !document.getElementById('navInstall')) { var b = document.createElement('a'); b.href = '#'; b.id = 'navInstall'; b.textContent = '📲 Install app';
      b.onclick = function (x) { x.preventDefault(); BV.app.install().then(function (ok) { if (ok) b.remove(); }); }; nav.insertBefore(b, nav.querySelector('.cta-nav')); }
  });
  window.addEventListener('appinstalled', function () { BV.app.installed = true; var b = document.getElementById('navInstall'); if (b) b.remove(); document.dispatchEvent(new Event('bv-installed')); });
  /* offline notice */
  function netBar() {
    var b = document.getElementById('offbar');
    if (navigator.onLine) { if (b) b.remove(); return; }
    if (b) return; b = document.createElement('div'); b.id = 'offbar'; b.setAttribute('role', 'status');
    b.innerHTML = '📴 You are offline: showing pages saved on this device. Logging in, quizzes and sending marks need internet.';
    document.body.insertBefore(b, document.body.firstChild);
  }
  window.addEventListener('online', netBar); window.addEventListener('offline', netBar); netBar();
  var tb = document.getElementById('themeBtn');
  if (tb) tb.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', nx); BV.store('bv-theme', nx);
  });

  BV.store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
  BV.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* MYP Science (Grades 6 to 10) is kept in its three subjects everywhere: Biology, Chemistry and Physics are never mixed in one list.
     BV.subj.of(text, …): the subject a lesson, topic, question set or exam belongs to. A text that names its subject ("MYP Chemistry",
     "Physics · Waves", "Grade 10 · Biology · …") decides, in the order given; otherwise the subject is read from the words of the titles.
     BV.subj.split(items, subjectOf, render): one tab per subject; each tab shows only that subject's items.
     BV.subj.isMyp(class): true for a Grade 6 to 10 (MYP 1 to 5) science class. */
  BV.subj = (function () {
    var LIST = [['Biology', '#15803d', '🌿'], ['Chemistry', '#c2410c', '⚗️'], ['Physics', '#1d4ed8', '⚡']], OTHER = ['Other', '#6d28d9', '📚'];
    var NAMED = /\b(biology|chemistry|physics)\b/i;
    var WORDS = [['Biology', /\b(cell|dna|rna|gene|inherit|enzyme|nutri|food|diet|digest|photosynth|respirat|reproduc|evolution|biotech|classif|organism|living|understanding life|ecolog|ecosystem|plant|protein|carbohydrate|lipid|microscop|osmosis|mitosis|meiosis|cloning|stem cell|hormone|pollinat|vertebrate|microorganism|selective breeding|natural selection)/],
      ['Chemistry', /\b(matter|acid|alkali|atom|element|compound|mixture|particle|reaction|bonding|periodic|chemic|solution|solute|solvent|separat|substance)/],
      ['Physics', /\b(force|energy|electric|wave|motion|density|radioactiv|measur|speed|light|sound|heat|circuit|magnet|pressure|mass and weight|scientific investigation|introduction to science)/]];
    function of() {
      var a = [].slice.call(arguments).filter(Boolean).map(String), i, m;
      for (i = 0; i < a.length; i++) { m = NAMED.exec(a[i]); if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase(); }
      var t = a.join(' · ').toLowerCase();
      for (i = 0; i < WORDS.length; i++) if (WORDS[i][1].test(t)) return WORDS[i][0];
      return '';
    }
    function asked() {   // the subject named in the address: /grade-10/#chemistry or /quizzes/?subject=Chemistry
      var h = '', q = ''; try { h = decodeURIComponent(location.hash.slice(1)); q = new URLSearchParams(location.search).get('subject') || ''; } catch (e) {}
      return LIST.map(function (x) { return x[0]; }).filter(function (x) { return x.toLowerCase() === h.toLowerCase() || x.toLowerCase() === q.toLowerCase(); })[0] || '';
    }
    function info(n) { return LIST.filter(function (x) { return x[0] === n; })[0] || OTHER; }
    function tag(n) { var x = info(n); return '<span class="sj-tag" style="--k:' + x[1] + '">' + x[2] + ' ' + BV.esc(x[0]) + '</span>'; }
    function isMyp(c) { if (!c) return false; var t = [c.site_slug, c.follows, c.slug, c.programme, c.course, c.name].filter(Boolean).join(' ').toLowerCase(); return /\bgrade[- ]?(6|7|8|9|10)\b/.test(t) || /\bmyp ?[1-5]?\b/.test(t); }
    function groups(items, subjectOf) {
      var g = {}; items.forEach(function (it) { var s = subjectOf(it) || ''; if (!info(s) || info(s) === OTHER) s = ''; (g[s] = g[s] || []).push(it); });
      var names = LIST.map(function (x) { return x[0]; }).filter(function (n) { return g[n]; }); if (g['']) names.push('');
      return { by: g, names: names };
    }
    function split(items, subjectOf, render) {
      var G = groups(items, subjectOf), names = G.names;
      if (!names.length || (names.length === 1 && names[0] === '')) return render(items, '');   // nothing here belongs to one of the three subjects
      var want = asked() || BV.store('bv-subj'), pick = want && names.indexOf(want) >= 0 ? want : names[0];
      return '<div class="sj"><div class="sj-tabs" role="tablist" aria-label="Subjects">' + names.map(function (n) { var x = info(n);
        return '<button type="button" role="tab" data-sj-tab="' + BV.esc(x[0]) + '" aria-selected="' + (n === pick) + '" style="--k:' + x[1] + '">' + x[2] + ' ' + BV.esc(x[0]) + ' <span class="n">(' + G.by[n].length + ')</span></button>'; }).join('') + '</div>' +
        names.map(function (n) { var x = info(n);
          return '<section class="sj-pane" role="tabpanel" data-sj="' + BV.esc(x[0]) + '" aria-label="' + BV.esc(x[0]) + '" style="--k:' + x[1] + '"' + (n === pick ? '' : ' hidden') + '><h3 class="sj-h">' + x[2] + ' ' + BV.esc(x[0]) + '</h3>' + render(G.by[n], n) + '</section>'; }).join('') + '</div>';
    }
    function show(box, name) {   // open one subject's tab in a block (no change when the block has no such subject)
      var tabs = [].filter.call(box.children[0] ? box.children[0].children : [], function (b) { return b.hasAttribute('data-sj-tab'); });
      if (!tabs.some(function (b) { return b.getAttribute('data-sj-tab') === name; })) return false;
      tabs.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-sj-tab') === name ? 'true' : 'false'); });
      [].forEach.call(box.children, function (p) { if (p.hasAttribute('data-sj')) p.hidden = p.getAttribute('data-sj') !== name; });
      return true;
    }
    function showAll(name) { [].forEach.call(document.querySelectorAll('.sj'), function (b) { show(b, name); }); }
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-sj-tab]') : null; if (!b) return;
      var name = b.getAttribute('data-sj-tab'); BV.store('bv-subj', name); showAll(name);   // every list on the page follows the subject chosen
    });
    function first() {   // pages built with their tabs already in place (class pages): open the subject in the address, or the one chosen last time
      var n = asked(); if (n) BV.store('bv-subj', n); else n = BV.store('bv-subj');
      if (n) showAll(n);
    }
    first(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', first);   // this script sits below the page content, so the tabs are already there; once more when the page has finished loading
    window.addEventListener('hashchange', first);
    return { list: LIST, other: OTHER, of: of, info: info, tag: tag, isMyp: isMyp, groups: groups, split: split, show: showAll };
  })();
  /* tiny markdown for AI text: **bold**, bullets, line breaks */
  BV.md = function (t) {
    var lines = BV.esc(t).split(/\n/), out = '', inl = false;
    lines.forEach(function (l) {
      l = l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      if (/^\s*[-•*]\s+/.test(l)) { if (!inl) { out += '<ul>'; inl = true; } out += '<li>' + l.replace(/^\s*[-•*]\s+/, '') + '</li>'; }
      else { if (inl) { out += '</ul>'; inl = false; } if (l.trim()) out += '<p>' + l + '</p>'; }
    });
    return out + (inl ? '</ul>' : '');
  };
  BV.toast = function (t) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 3800);
  };
  BV.when = function (s) { if (!s) return ''; var d = new Date(String(s).indexOf('T') > 0 || /Z$/.test(s) ? s : String(s).replace(' ', 'T')); return isNaN(d) ? s : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); };
  /* call the Google script (POST, text/plain so no preflight) */
  BV.api = function (action, data) {
    if (!BV.url) return Promise.resolve({ ok: false, error: 'The learning service is not switched on yet.' });
    var body = Object.assign({ action: action }, data || {});
    return fetch(BV.url, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: 'Could not reach the learning service. Check your internet connection and try again.' }; });
  };
  /* student session */
  BV.me = function () { try { return JSON.parse(BV.store('bv-me') || sessionStorage.getItem('bv-me') || 'null'); } catch (e) { return null; } };
  BV.as = function (action, data) { var m = BV.me() || {}; return BV.api(action, Object.assign({ name: m.n, cls: m.c, code: m.k }, data || {})); };
  BV.signout = function () { BV.store('bv-me', null); try { sessionStorage.removeItem('bv-me'); } catch (e) {} location.reload(); };
  /* login box used by My learning, Exams and Forum */
  BV.loginForm = function (el, done) {
    el.innerHTML = '<form class="form narrow" id="bvlogin"><h2>Sign in</h2><p class="muted small">Use your name exactly as you type it in lessons, your class, and the personal code your teacher gave you.</p>' +
      '<label class="f">Your name<input id="ln" autocomplete="name" required></label><label class="f">Class<select id="lc" required><option value="">Choose your class</option></select></label>' +
      '<label class="f">Personal code<input id="lk" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" required></label><label class="chk"><input type="checkbox" id="lr" checked> Remember me on this device</label>' +
      '<button class="btn main" type="submit">Sign in</button><p class="msg" id="lm" role="alert"></p></form>';
    var sel = el.querySelector('#lc');
    (BV.classes || []).forEach(function (c) { sel.add(new Option(c, c)); });
    BV.api('classes').then(function (d) { if (d.ok) { var v = sel.value; sel.length = 1; d.classes.forEach(function (c) { sel.add(new Option(c, c)); }); sel.value = v; } });
    el.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault(); var m = el.querySelector('#lm'); m.textContent = 'Checking…';
      var me = { n: el.querySelector('#ln').value.trim(), c: sel.value, k: el.querySelector('#lk').value.trim() };
      BV.api('student', { name: me.n, cls: me.c, code: me.k }).then(function (d) {
        if (!d.ok) { m.textContent = d.error; return; }
        if (el.querySelector('#lr').checked) BV.store('bv-me', JSON.stringify(me)); else { try { sessionStorage.setItem('bv-me', JSON.stringify(me)); } catch (x) {} }
        done(d);
      });
    });
  };
  BV.title = function (id) { return (BV.meta && BV.meta[id] && BV.meta[id].t) || id; };
  BV.link = function (id) { return BV.meta && BV.meta[id] && BV.meta[id].p; };
})();

/* Courses menu: closes when a course is chosen, when you click elsewhere, or on Escape */
(function () { var d = document.querySelector('.navdd'); if (!d) return;
  document.addEventListener('click', function (e) { if (d.open && (!d.contains(e.target) || (e.target.closest && e.target.closest('.navdd-list a')))) d.open = false; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); } }); })();

/* Colourful menu and "All pages" directory (Nov 2026). The page list comes from data/site_pages.json: build_site.py writes it in
   place of the marker below. Every main link gets its icon and colour and stays visible (a second header row; a swipeable strip
   on phones); the Menu button becomes "🗂 All pages", a searchable directory of every page in coloured groups. */
(function () {
  var PAGES = {"primary": ["/", "#courses", "/learn/", "/simulations/", "/games/", "/quizzes/", "/practice/", "/tutor/", "/live/", "/forum/", "/tools/", "/how-it-works/"], "groups": [{"name": "Learn", "icon": "📚", "colour": "#2563eb", "pages": [["/learn/", "🎓", "Learning centre", "Every topic, by syllabus"], ["/lessons/", "🗂️", "Class lessons", "Lessons for your class"], ["/biology/", "🧬", "Biology", "MYP, IB, IGCSE and A Level"], ["/chemistry/", "⚗️", "Chemistry", "All levels"], ["/physics/", "🧲", "Physics", "All levels"], ["/environmental-systems/", "🌍", "Environmental Systems", "IB ESS"], ["/maths/", "📐", "Mathematics", "Skills for science"], ["/myp/", "🔬", "MYP Science", "Grades 6 to 10"]]}, {"name": "Explore and practise", "icon": "🧪", "colour": "#0d9488", "pages": [["/simulations/", "🧪", "Virtual labs", "Run experiments online"], ["/library/", "🔭", "Simulation library", "Every simulation"], ["/games/", "🎮", "Games", "Science and maths games"], ["/practice/", "🃏", "Practice and revision", "Flashcards and practice sets"], ["/tools/", "🧰", "Science tools", "Calculators and helpers"]]}, {"name": "Assessments", "icon": "📝", "colour": "#7c3aed", "pages": [["/quizzes/", "📝", "Assessment centre", "Exam-style questions"], ["/exams/", "⏱️", "Examinations", "Timed tests from your teacher"], ["/dashboard/", "📊", "My results", "Marks and feedback"]]}, {"name": "Help and community", "icon": "💬", "colour": "#ea580c", "pages": [["/how-it-works/", "🧭", "How the site works", "A guide for everyone"], ["/tutor/", "🙋", "Help Desk", "Ask a science question"], ["/forum/", "💬", "Forum", "Discuss with your class"], ["/live/", "🎥", "Live classroom", "Join a live lesson"], ["/messages/", "✉️", "Messages", "Write to your teacher"], ["/book/", "📅", "Book a lesson", "Private tuition"]]}, {"name": "My account", "icon": "👤", "colour": "#db2777", "pages": [["/dashboard/", "🏠", "My dashboard", "Your learning in one place"], ["/register/", "✨", "Create an account", "Free for students"], ["/login/", "🔑", "Log in", "Students, parents, teachers"], ["/parent/", "👪", "Parents", "Your child's progress"], ["/premium/", "⭐", "Premium", "Unlock every course"], ["/app/", "📲", "Get the app", "Phone, tablet, computer"], ["/donate/", "💚", "Donate", "Support free learning"]]}, {"name": "Teachers", "icon": "🧑‍🏫", "colour": "#059669", "pages": [["/teach/", "🏫", "My classes", "Students, marking, reports"], ["/build/", "🧬", "Assessment Studio", "Build assessments and lessons"], ["/board/", "🖊️", "Whiteboard", "Teach with handwriting"], ["/check/", "📡", "Live Check", "One question, live answers"], ["/time/", "⏲️", "Time on tasks", "How long work takes"]]}], "extra": {"#courses": ["📚", "Courses", "#2563eb"], "/": ["🏠", "Home", "#0f766e"]}};
  var top = document.querySelector('header.top'), nav = document.getElementById('mainnav'), mb = document.querySelector('.menu-btn');
  if (!top || !nav || top.getAttribute('data-bvnav')) return; top.setAttribute('data-bvnav', '1'); document.documentElement.classList.add('bvnav');
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var find = {}; if (PAGES) { (PAGES.groups || []).forEach(function (g) { g.pages.forEach(function (p) { if (!find[p[0]]) find[p[0]] = { icon: p[1], name: p[2], colour: g.colour }; }); }); Object.keys(PAGES.extra || {}).forEach(function (k) { var x = PAGES.extra[k]; find[k] = { icon: x[0], name: x[1], colour: x[2] }; }); }
  function deco(el, key) { var f = find[key]; if (!f || el.querySelector('.ni')) return; el.style.setProperty('--k', f.colour); var i = document.createElement('span'); i.className = 'ni'; i.setAttribute('aria-hidden', 'true'); i.textContent = f.icon; el.insertBefore(i, el.firstChild); }
  [].forEach.call(nav.querySelectorAll(':scope > a'), function (a) { var h = a.getAttribute('href') || ''; if (a.classList.contains('cta-nav')) return; if (h === '/portfolio/') { a.setAttribute('href', '/#about'); h = '/#about'; } deco(a, h); if (!find[h]) a.classList.add('nav-sub'); });
  var dd = nav.querySelector('.navdd > summary'); if (dd) { deco(dd, '#courses'); [].forEach.call(nav.querySelectorAll('.navdd-list a'), function (a) { deco(a, a.getAttribute('href')); }); }
  // pages from the main list that the built menu does not have yet (older pages): add them before the account button
  var cta = nav.querySelector('.cta-nav'), here = location.pathname;
  ((PAGES && PAGES.primary) || []).forEach(function (h) { if (h.charAt(0) !== '/' || nav.querySelector(':scope > a[href="' + h + '"]') || !find[h]) return; var a = document.createElement('a'); a.href = h; a.textContent = find[h].name; deco(a, h); nav.insertBefore(a, cta); });
  [].forEach.call(nav.querySelectorAll(':scope > a'), function (a) { if (a.getAttribute('href') === here && !a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page'); });
  var cur = nav.querySelector('[aria-current]'); if (cur && cur.scrollIntoView && innerWidth < 760) setTimeout(function () { try { nav.scrollLeft = cur.offsetLeft - 40; } catch (e) {} }, 50);
  if (!PAGES || !mb) return;
  // the "All pages" directory
  var nb = mb.cloneNode(false); nb.textContent = ''; nb.innerHTML = '<span aria-hidden="true">🗂</span> All pages'; nb.setAttribute('aria-controls', 'bvdir'); nb.className = 'menu-btn all-btn'; mb.parentNode.replaceChild(nb, mb);
  var dir = document.createElement('div'); dir.id = 'bvdir'; dir.className = 'bvdir'; dir.hidden = true; dir.setAttribute('role', 'dialog'); dir.setAttribute('aria-label', 'All pages');
  dir.innerHTML = '<div class="bvdir-in"><div class="bvdir-top"><input type="search" placeholder="🔎 Find a page: labs, biology, results…" aria-label="Find a page"><button type="button" class="bvdir-x" aria-label="Close">✕</button></div>' +
    '<div class="bv-hub">' + PAGES.groups.map(function (g) { return '<section class="bv-grp" style="--k:' + g.colour + '"><h3><span aria-hidden="true">' + g.icon + '</span> ' + E(g.name) + '</h3><div class="bv-tiles">' + g.pages.map(function (p) {
      return '<a class="bv-tile" href="' + E(p[0]) + '"' + (p[0] === here ? ' aria-current="page"' : '') + '><span class="ti" aria-hidden="true">' + p[1] + '</span><b>' + E(p[2]) + '</b><small>' + E(p[3]) + '</small></a>'; }).join('') + '</div></section>'; }).join('') + '</div><p class="bvdir-none" hidden>No page matches. Try another word, or open <a href="/how-it-works/">How the site works</a>.</p></div>';
  top.appendChild(dir);
  var q = dir.querySelector('input');
  function show(o) { dir.hidden = !o; nb.setAttribute('aria-expanded', o); if (o) { q.value = ''; filter(); setTimeout(function () { q.focus(); }, 30); } }
  function filter() { var t = q.value.trim().toLowerCase(), any = false; [].forEach.call(dir.querySelectorAll('.bv-grp'), function (s) { var n = 0; [].forEach.call(s.querySelectorAll('.bv-tile'), function (a) { var ok = !t || (a.textContent + ' ' + s.querySelector('h3').textContent).toLowerCase().indexOf(t) >= 0; a.hidden = !ok; if (ok) n++; }); s.hidden = !n; if (n) any = true; }); dir.querySelector('.bvdir-none').hidden = any; }
  nb.addEventListener('click', function (e) { e.stopPropagation(); show(dir.hidden); });
  dir.querySelector('.bvdir-x').onclick = function () { show(false); nb.focus(); };
  q.oninput = filter; q.onkeydown = function (e) { if (e.key === 'Enter') { var f = dir.querySelector('.bv-tile:not([hidden])'); if (f) location.href = f.href; } };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dir.hidden) { show(false); nb.focus(); } });
  document.addEventListener('click', function (e) { if (!dir.hidden && !dir.contains(e.target)) show(false); });
})();
