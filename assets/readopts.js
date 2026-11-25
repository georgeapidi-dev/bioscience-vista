/* VistaEd reading options (George Apidi, 24 Nov 2026): one set of choices on every page and in every lesson.
   Text size (normal, bigger, biggest), easy-read font (Atkinson Hyperlegible, self-hosted, SIL Open Font Licence), high contrast,
   light / dark / match my device, and the page language (machine translation by Google Translate, loaded only when another language is chosen).
   Choices are saved on this device and kept in step with the older settings: bv-a11y (site pages, BV.a11y), bv-reading (lesson pages) and bv-theme. */
(function () {
  if (window.BV_READOPTS) return; window.BV_READOPTS = 1;
  var de = document.documentElement;
  var LANGS = [['en', 'English'], ['sw', 'Kiswahili'], ['fr', 'Français'], ['es', 'Español'], ['pt', 'Português'], ['ar', 'العربية'],
               ['zh-CN', '中文 (简体)'], ['hi', 'हिन्दी'], ['de', 'Deutsch'], ['am', 'አማርኛ'], ['so', 'Soomaali'], ['rw', 'Kinyarwanda']];
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- state ---------- */
  function read() {
    var a = (get('bv-a11y') || '').split(',').filter(Boolean), r = {};
    try { r = JSON.parse(get('bv-reading') || '{}') || {}; } catch (e) {}
    return {
      size: a.indexOf('xl') >= 0 ? 'xl' : (a.indexOf('lg') >= 0 || r.big) ? 'lg' : '',
      font: a.indexOf('read') >= 0 || !!r.dys,
      hc: a.indexOf('hc') >= 0 || !!r.hc,
      calm: a.indexOf('calm') >= 0,
      theme: get('bv-theme') || 'auto',
      lang: get('bv-lang') || 'en'
    };
  }
  var S = read();
  function save() {
    var list = [];
    if (S.size) list.push(S.size); if (S.font) list.push('read'); if (S.calm) list.push('calm'); if (S.hc) list.push('hc');
    if (window.BV && BV.a11y) BV.a11y(list); else put('bv-a11y', list.join(','));   // BV.a11y also keeps it with the account
    put('bv-reading', JSON.stringify({ big: !!S.size, dys: S.font, hc: S.hc }));
    put('bv-theme', S.theme === 'auto' ? null : S.theme);
    put('bv-lang', S.lang === 'en' ? null : S.lang);
  }
  function apply() {
    de.classList.toggle('a11y-lg', S.size === 'lg'); de.classList.toggle('a11y-xl', S.size === 'xl');
    de.classList.toggle('a11y-read', S.font); de.classList.toggle('a11y-hc', S.hc);
    if (S.theme === 'auto') de.removeAttribute('data-theme'); else de.setAttribute('data-theme', S.theme);
    var b = document.body;
    if (b) { b.classList.toggle('a11y-big', S.size === 'lg'); b.classList.toggle('a11y-bigger', S.size === 'xl'); b.classList.toggle('a11y-dys', S.font); b.classList.toggle('a11y-hc', S.hc); }
    document.querySelectorAll('.ro-set').forEach(paint);
  }

  /* ---------- styles ---------- */
  var css = ''
    + '@font-face{font-family:"BV Easy Read";src:url(/assets/fonts/atkinson-hyperlegible-latin-400-normal.woff2) format("woff2");font-weight:400;font-display:swap}'
    + '@font-face{font-family:"BV Easy Read";src:url(/assets/fonts/atkinson-hyperlegible-latin-700-normal.woff2) format("woff2");font-weight:700;font-display:swap}'
    /* text size: rem-based site pages and px-based lesson pages */
    + 'html.a11y-lg{font-size:112.5%}html.a11y-xl{font-size:130%}body.a11y-big{font-size:118%!important}body.a11y-bigger{font-size:135%!important}'
    /* easy-read font: a font designed for low vision and dyslexia, wider spacing, no justified text, no italics */
    + 'html.a11y-read body,html.a11y-read body *:not(code):not(pre):not(kbd):not(samp):not(.mono):not([class*="icon"]):not(svg *){font-family:"BV Easy Read","Atkinson Hyperlegible",Verdana,Arial,sans-serif!important;font-style:normal!important}'
    + 'html.a11y-read body{letter-spacing:.035em;word-spacing:.16em;line-height:1.8}html.a11y-read p,html.a11y-read li,html.a11y-read td{text-align:left!important;line-height:1.8}'
    /* high contrast: black page, white text, yellow links and focus, white borders */
    + 'html.a11y-hc{--bg:#000;--raised:#000;--surface:#000;--ink:#fff;--muted:#fff;--line:#fff;--card:#000;--tint:#111;--amber:#000;--green:#ffe600;--green2:#ffe600;--accent:#ffe600;--accent-ink:#000;--focus:#ffe600;'
    + '--vx-text:#fff;--vx-text-2:#fff;--vx-line:#fff;--vx-card:#000;--vx-bg:#000;color-scheme:dark}'
    + 'html.a11y-hc body{background:#000!important;color:#fff!important}'
    + 'html.a11y-hc main,html.a11y-hc .card,html.a11y-hc section,html.a11y-hc article,html.a11y-hc aside,html.a11y-hc header,html.a11y-hc footer,html.a11y-hc nav,html.a11y-hc details,html.a11y-hc table,html.a11y-hc th,html.a11y-hc td,html.a11y-hc .panel,html.a11y-hc .tile,html.a11y-hc dialog{background-color:#000!important;color:#fff!important;border-color:#fff!important}'
    + 'html.a11y-hc a{color:#ffe600!important;text-decoration:underline!important;text-underline-offset:2px}html.a11y-hc p,html.a11y-hc li,html.a11y-hc span,html.a11y-hc small,html.a11y-hc label,html.a11y-hc h1,html.a11y-hc h2,html.a11y-hc h3,html.a11y-hc h4,html.a11y-hc b,html.a11y-hc strong,html.a11y-hc em,html.a11y-hc .muted{color:inherit!important}'
    + 'html.a11y-hc button,html.a11y-hc .btn,html.a11y-hc .btnlink,html.a11y-hc input,html.a11y-hc select,html.a11y-hc textarea{background:#000!important;color:#fff!important;border:2px solid #fff!important}'
    + 'html.a11y-hc button[aria-pressed=true],html.a11y-hc .btn.main{background:#ffe600!important;color:#000!important;border-color:#ffe600!important}'
    + 'html.a11y-hc :focus-visible{outline:3px solid #ffe600!important;outline-offset:2px}html.a11y-hc *{box-shadow:none!important;text-shadow:none!important}html.a11y-hc img{background:#fff}'
    /* the reading options control */
    + '.ro-set{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.ro-set>.ro-lab{font-weight:700;margin-right:2px}'
    + '.ro-set .ro-b,.ro-set select{font-family:inherit!important;font-weight:600!important;font-size:.95rem!important;line-height:1.2!important;min-height:42px;padding:6px 12px;border:2px solid currentColor;border-radius:10px;background:transparent!important;color:inherit!important;cursor:pointer;box-shadow:none!important;text-transform:none!important;letter-spacing:normal}'
    + '.ro-set select{max-width:100%;width:auto!important}.ro-set select option{color:#111;background:#fff}'
    + '.ro-set .ro-b[aria-pressed=true]{background:var(--ink,#1f2937)!important;color:var(--bg,#fff)!important;border-color:var(--ink,#1f2937)!important}'
    + '.ro-set .ro-grp{display:inline-flex;border:2px solid currentColor;border-radius:10px;overflow:hidden}.ro-set .ro-grp .ro-b{border:0;border-radius:0;min-height:38px}.ro-set .ro-grp .ro-b+.ro-b{border-left:2px solid currentColor}'
    + '.ro-set .ro-note{flex-basis:100%;font-size:.8rem;opacity:.8;margin:0}'
    + 'html body nav.a11y.ro-set{display:flex!important;flex-wrap:wrap!important;gap:8px!important}html body nav.a11y.ro-set button{min-height:40px}html body nav.a11y.ro-set button::before,html body nav.a11y.ro-set button::after{content:none!important}'
    + '.ro-open{display:inline-flex;align-items:center;justify-content:center;min-width:46px;min-height:42px;padding:4px 12px;margin:0 8px;border:2px solid currentColor;border-radius:12px;background:transparent;color:inherit;font-family:inherit;font-weight:800;font-size:1.1rem;line-height:1;cursor:pointer}'
    + '.ro-open.ro-float{position:fixed;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:9998;background:#1f2937;color:#fff;border-color:#1f2937;box-shadow:0 2px 8px rgba(0,0,0,.25)}'
    + '.ro-pop{position:fixed;z-index:9999;top:72px;right:12px;max-width:min(440px,calc(100vw - 24px));background:#fff;color:#111827;border:2px solid #111827;border-radius:14px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.25)}'
    + ':root[data-theme=dark] .ro-pop{background:#111827;color:#f3f4f6;border-color:#f3f4f6}html.a11y-hc .ro-pop{background:#000!important;color:#fff!important;border-color:#fff!important}'
    + '.ro-pop h2{font-size:1.1rem;margin:0 0 10px;padding-right:40px}.ro-pop{--ink:#111827;--bg:#fff}:root[data-theme=dark] .ro-pop{--ink:#f3f4f6;--bg:#111827}.ro-pop .ro-x{position:absolute;top:8px;right:8px;min-height:32px;padding:2px 10px}'
    + '@media (max-width:640px){.ro-pop{left:8px;right:8px;top:auto;bottom:8px;max-width:none}}'
    /* Google Translate: hide its banner and keep the page where it was */
    + '.goog-te-banner-frame,.skiptranslate>iframe,#goog-gt-tt,.goog-te-balloon-frame{display:none!important}body{top:0!important}.goog-text-highlight{background:none!important;box-shadow:none!important}#bv-gt{display:none}';
  var st = document.createElement('style'); st.id = 'bv-readopts'; st.textContent = css; (document.head || de).appendChild(st);

  /* ---------- the control ---------- */
  function btn(label, key, val, title) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ro-b'; b.textContent = label;
    b.setAttribute('data-ro', key); if (val !== undefined) b.setAttribute('data-v', val); if (title) b.title = title; return b;
  }
  function build(box, withLabel) {
    box.classList.add('ro-set'); box.innerHTML = '';
    if (withLabel) { var l = document.createElement('span'); l.className = 'ro-lab'; l.textContent = 'Make it easier to read:'; box.appendChild(l); }
    var g = document.createElement('span'); g.className = 'ro-grp'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Text size');
    g.appendChild(btn('A', 'size', '', 'Normal text')); g.appendChild(btn('A+', 'size', 'lg', 'Bigger text')); g.appendChild(btn('A++', 'size', 'xl', 'Biggest text'));
    box.appendChild(g);
    box.appendChild(btn('Easy-read font', 'font'));
    box.appendChild(btn('High contrast', 'hc'));
    var t = document.createElement('span'); t.className = 'ro-grp'; t.setAttribute('role', 'group'); t.setAttribute('aria-label', 'Light or dark mode');
    t.appendChild(btn('☀️ Light', 'theme', 'light', 'Light mode')); t.appendChild(btn('🌙 Dark', 'theme', 'dark', 'Dark mode')); t.appendChild(btn('Auto', 'theme', 'auto', 'Match my device'));
    box.appendChild(t);
    var sel = document.createElement('select'); sel.setAttribute('aria-label', 'Language'); sel.setAttribute('data-ro', 'lang'); sel.className = 'notranslate'; sel.setAttribute('translate', 'no');
    LANGS.forEach(function (x) { var o = document.createElement('option'); o.value = x[0]; o.textContent = '🌐 ' + x[1]; sel.appendChild(o); });
    box.appendChild(sel);
    var n = document.createElement('p'); n.className = 'ro-note'; n.textContent = 'Saved on this device. Other languages use Google Translate (a machine translation: check key science words with your teacher).';
    box.appendChild(n);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ro]'); if (!b || b.tagName === 'SELECT') return;
      var k = b.getAttribute('data-ro');
      if (k === 'size') S.size = b.getAttribute('data-v'); else if (k === 'theme') S.theme = b.getAttribute('data-v'); else S[k] = !S[k];
      save(); apply();
    });
    sel.addEventListener('change', function () { setLang(sel.value); });
    paint(box); return box;
  }
  function paint(box) {
    box.querySelectorAll('[data-ro]').forEach(function (b) {
      var k = b.getAttribute('data-ro');
      if (k === 'lang') { b.value = S.lang; return; }
      var on = (k === 'size' || k === 'theme') ? (S[k] === b.getAttribute('data-v')) : !!S[k];
      b.setAttribute('aria-pressed', String(on));
    });
  }

  /* ---------- language ---------- */
  function cookie(v) {
    var host = location.hostname, parts = host.split('.'), base = parts.length > 1 ? '.' + parts.slice(-2).join('.') : host;
    var exp = v ? '' : ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'googtrans=' + (v || '') + ';path=/' + exp;
    if (parts.length > 1) document.cookie = 'googtrans=' + (v || '') + ';path=/;domain=' + base + exp;
  }
  function protectCode() {   // code, formulas and inputs stay as written
    document.querySelectorAll('code,pre,kbd,samp,.mono,.katex,math,textarea,input,.notranslate-auto').forEach(function (e) { e.setAttribute('translate', 'no'); e.classList.add('notranslate'); });
    var brand = document.querySelectorAll('.bvw,.brand'); brand.forEach(function (e) { e.setAttribute('translate', 'no'); });
  }
  function loadGT() {
    if (document.getElementById('bv-gt-js')) return;
    protectCode();
    var d = document.createElement('div'); d.id = 'bv-gt'; document.body.appendChild(d);
    window.bvGTinit = function () {
      try { new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false, includedLanguages: LANGS.map(function (x) { return x[0]; }).join(',') }, 'bv-gt'); } catch (e) {}
    };
    var s = document.createElement('script'); s.id = 'bv-gt-js'; s.src = 'https://translate.google.com/translate_a/element.js?cb=bvGTinit'; s.async = true; document.body.appendChild(s);
  }
  function setLang(code) {
    S.lang = code; save();
    if (code === 'en') { cookie(''); location.reload(); return; }
    cookie('/en/' + code);
    var combo = document.querySelector('#bv-gt select.goog-te-combo');
    if (combo) { combo.value = code; combo.dispatchEvent(new Event('change')); } else loadGT();
  }

  /* ---------- placing it ---------- */
  function popup(open) {
    var pop = document.getElementById('ro-pop');
    if (!pop) {
      pop = document.createElement('div'); pop.id = 'ro-pop'; pop.className = 'ro-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Reading options'); pop.hidden = true;
      var h = document.createElement('h2'); h.textContent = 'Reading options'; pop.appendChild(h);
      var x = document.createElement('button'); x.type = 'button'; x.className = 'ro-b ro-x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Close reading options'); x.onclick = function () { popup(false); }; pop.appendChild(x);
      pop.appendChild(build(document.createElement('div'), false));
      document.body.appendChild(pop);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) popup(false); });
    }
    pop.hidden = !open;
    document.querySelectorAll('.ro-open').forEach(function (b) { b.setAttribute('aria-expanded', String(!!open)); });
    if (open) { var f = pop.querySelector('.ro-grp .ro-b'); if (f) f.focus(); }
  }
  function opener(cls) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ro-open' + (cls ? ' ' + cls : '');
    b.innerHTML = '<span aria-hidden="true">Aa</span>'; b.setAttribute('aria-label', 'Reading options: text size, easy-read font, contrast, light or dark mode, language'); b.title = 'Reading options';
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('translate', 'no');
    b.onclick = function () { var p = document.getElementById('ro-pop'); popup(!p || p.hidden); };
    return b;
  }
  function place() {
    var bars = document.querySelectorAll('nav.a11y');
    bars.forEach(function (n) { var c = n.cloneNode(false); n.parentNode.replaceChild(c, n); build(c, true); });   // lesson pages: the full row in place of the old three buttons
    var top = document.querySelector('header.top .top-in');
    if (top) { var mb = top.querySelector('.menu-btn'); top.insertBefore(opener(), mb || null); }
    else if (!bars.length) document.body.appendChild(opener('ro-float'));
    else { var o = opener('ro-float'); document.body.appendChild(o); }   // lessons: also a small button that stays in reach while scrolling
    var tb = document.getElementById('themeBtn');   // the footer "Light / dark" button follows the same choice
    if (tb) tb.addEventListener('click', function () { setTimeout(function () { S.theme = get('bv-theme') || 'auto'; apply(); }, 0); });
  }

  apply();
  function start() { apply(); place(); if (S.lang !== 'en') { cookie('/en/' + S.lang); loadGT(); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
