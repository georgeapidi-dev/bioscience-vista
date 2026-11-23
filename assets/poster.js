/* Research Poster Creator · BioscienceVista · by George Apidi
   Build a printable scientific poster (A0, A1 or A3) from an IA, EE or personal project, or from scratch.
   Works without an account (kept in this browser); signed-in students can import from their projects and save the poster to them.
   Printing uses the browser's "Save as PDF" at the exact paper size. */
(function () {
  var app = document.getElementById('app'); if (!app) return;
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var KEY = 'bv-poster-v1';
  var SIZES = { A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420] };
  var THEMES = { teal: ['#0D9488', '#ECFEFF', '#0F172A'], violet: ['#7C3AED', '#F5F3FF', '#1E1B4B'], coral: ['#E11D48', '#FFF1F2', '#3F0D18'], forest: ['#16A34A', '#F0FDF4', '#052E16'], ocean: ['#0284C7', '#F0F9FF', '#0C1E33'], sunset: ['#EA580C', '#FFF7ED', '#3B1A06'] };
  var SECS = [['intro', 'Introduction and background', 'Why this matters and the key science. Two or three short paragraphs.'], ['rq', 'Research question', 'One focused question.'], ['hyp', 'Hypothesis', 'Your prediction and the scientific reason.'],
    ['method', 'Method', 'Variables, apparatus and the main steps. A labelled diagram or photo helps.'], ['results', 'Results', 'Your best graph or table, with a caption. Quote key numbers.'], ['analysis', 'Analysis', 'Trends, calculations, statistical test results.'],
    ['conclusion', 'Conclusion', 'Answer the research question, using your data.'], ['evaluation', 'Evaluation', 'Strengths, limitations and realistic improvements.'], ['refs', 'References', 'The sources you cite on the poster.'], ['ack', 'Acknowledgements', 'Optional: people who helped.']];
  var LAYOUTS = { classic: { name: 'Portrait, 3 columns', cols: 3, orient: 'portrait' }, two: { name: 'Portrait, 2 columns', cols: 2, orient: 'portrait' }, wide: { name: 'Landscape, 4 columns', cols: 4, orient: 'landscape' } };
  function blank() { return { title: '', authors: '', school: '', size: 'A1', layout: 'classic', theme: 'teal', font: 1, text: {}, img: {}, cap: {}, on: SECS.reduce(function (o, s) { o[s[0]] = s[0] !== 'ack'; return o; }, {}), link: null }; }
  var P; try { P = JSON.parse(localStorage.getItem(KEY) || 'null') || blank(); } catch (e) { P = blank(); }
  function keep() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { note('This poster is too big to keep in the browser: use smaller images.'); } }
  function words(t) { return (String(t || '').trim().match(/\S+/g) || []).length; }
  function note(t) { var n = document.getElementById('po-note'); if (n) { n.textContent = t; clearTimeout(note.t); note.t = setTimeout(function () { n.textContent = ''; }, 5000); } }

  var CSS = '.po-wrap{display:grid;grid-template-columns:minmax(300px,420px) 1fr;gap:18px;align-items:start}@media(max-width:900px){.po-wrap{grid-template-columns:1fr}}' +
    '.po-ed{background:var(--card,#fff);border:1px solid var(--line,#e5e7eb);border-radius:16px;padding:14px;max-height:calc(100vh - 120px);overflow:auto;position:sticky;top:10px}.po-ed h3{margin:14px 0 6px;font-size:1rem}.po-ed label{display:grid;gap:3px;margin:0 0 8px;font-size:.9rem}' +
    '.po-ed input,.po-ed textarea,.po-ed select{width:100%;box-sizing:border-box;padding:7px 9px;border-radius:9px;border:1px solid var(--line,#cbd5e1);font:inherit}.po-ed details{border-top:1px solid var(--line,#e5e7eb);padding:8px 0}.po-ed summary{cursor:pointer;font-weight:700;display:flex;align-items:center;gap:8px;list-style:none}.po-ed summary::-webkit-details-marker{display:none}.po-ed summary::before{content:"▸";color:#64748b}.po-ed details[open] summary::before{content:"▾"}.po-ed input[type=checkbox]{width:auto;margin:0;flex:none}.po-ed summary .po-wc{margin-left:auto}' +
    '.po-wc{font-size:.8rem;color:#64748b}.po-wc.hi{color:#B91C1C;font-weight:700}.po-sw{display:flex;gap:6px;flex-wrap:wrap}.po-sw button{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #cbd5e1;cursor:pointer}.po-sw button[aria-pressed=true]{box-shadow:0 0 0 3px #0f172a}' +
    '.po-stage{background:#e2e8f0;border-radius:16px;padding:16px;overflow:auto}.po-hero{margin:8px 0 16px;padding:22px;border-radius:20px;color:#fff;background:linear-gradient(130deg,#0284C7,#7C3AED 55%,#DB2777)}.po-hero h1{margin:4px 0 6px;color:#fff}.po-hero p{margin:0;color:#fff}' +
    /* the poster itself, drawn in mm so it prints at the exact size */
    '.pz{background:#fff;color:var(--ink);font-family:Inter,system-ui,Arial,sans-serif;transform-origin:top left;box-shadow:0 10px 30px rgba(0,0,0,.18);display:flex;flex-direction:column}' +
    '.pz-head{background:var(--acc);color:#fff;padding:var(--pad) var(--pad) calc(var(--pad)*.8)}.pz-head h1{margin:0;font-family:"Space Grotesk",Inter,sans-serif;font-size:calc(var(--fs)*3.1);line-height:1.08;color:#fff}.pz-head p{margin:calc(var(--fs)*.4) 0 0;font-size:calc(var(--fs)*1.15);opacity:.95}' +
    '.pz-body{flex:1;padding:var(--pad);column-gap:var(--pad);background:var(--soft)}.pz-sec{break-inside:avoid;background:#fff;border-radius:calc(var(--fs)*.6);padding:calc(var(--fs)*.9) calc(var(--fs)*1.1);margin:0 0 var(--pad);border-top:calc(var(--fs)*.35) solid var(--acc)}' +
    '.pz-sec h2{margin:0 0 calc(var(--fs)*.4);font-family:"Space Grotesk",Inter,sans-serif;color:var(--acc);font-size:calc(var(--fs)*1.5)}.pz-sec p{margin:0 0 calc(var(--fs)*.5);font-size:var(--fs);line-height:1.4;white-space:pre-wrap}.pz-sec.rq p{font-size:calc(var(--fs)*1.25);font-weight:700}' +
    '.pz-sec img{display:block;max-width:100%;margin:calc(var(--fs)*.4) auto;border-radius:calc(var(--fs)*.3)}.pz-sec figcaption{font-size:calc(var(--fs)*.8);color:#475569;text-align:center}.pz-sec.refs p{font-size:calc(var(--fs)*.75)}' +
    '.pz-foot{padding:calc(var(--pad)*.5) var(--pad);font-size:calc(var(--fs)*.75);color:#475569;display:flex;justify-content:space-between;background:var(--soft)}';

  function css() { if (document.getElementById('po-css')) return; var s = document.createElement('style'); s.id = 'po-css'; s.textContent = CSS; document.head.appendChild(s); }

  function posterHTML() {
    var sz = SIZES[P.size] || SIZES.A1, L = LAYOUTS[P.layout] || LAYOUTS.classic, w = L.orient === 'landscape' ? sz[1] : sz[0], h = L.orient === 'landscape' ? sz[0] : sz[1], th = THEMES[P.theme] || THEMES.teal;
    var fs = w / 841 * 13.5 * (P.font || 1), pad = w / 841 * 16;   // body text in mm: about 13.5 mm on A0 (readable at 1.5 m), scaled for smaller paper
    var secs = SECS.filter(function (s) { return P.on[s[0]] && (P.text[s[0]] || P.img[s[0]]); });
    return '<div class="pz" id="pz" style="width:' + w + 'mm;height:' + h + 'mm;--acc:' + th[0] + ';--soft:' + th[1] + ';--ink:' + th[2] + ';--fs:' + fs.toFixed(2) + 'mm;--pad:' + pad.toFixed(2) + 'mm">' +
      '<header class="pz-head"><h1>' + E(P.title || 'Your poster title') + '</h1><p>' + E(P.authors || 'Your name') + (P.school ? ' · ' + E(P.school) : '') + '</p></header>' +
      '<div class="pz-body" style="column-count:' + L.cols + '">' + (secs.length ? secs.map(function (s) {
        return '<section class="pz-sec ' + s[0] + '"><h2>' + E(s[1].split(' and ')[0] === 'Introduction' ? 'Introduction' : s[1]) + '</h2>' + (P.text[s[0]] ? String(P.text[s[0]]).split(/\n{2,}/).map(function (para) { return '<p>' + E(para) + '</p>'; }).join('') : '') +
          (P.img[s[0]] ? '<figure style="margin:0"><img src="' + P.img[s[0]] + '" alt="' + E(P.cap[s[0]] || s[1]) + '">' + (P.cap[s[0]] ? '<figcaption>' + E(P.cap[s[0]]) + '</figcaption>' : '') + '</figure>' : '') + '</section>'; }).join('') : '<section class="pz-sec"><h2>Start here</h2><p>Write in the sections on the left, or import your project. Your poster appears here as you type.</p></section>') + '</div>' +
      '<footer class="pz-foot"><span>Made with BioscienceVista Research Poster Creator</span><span>' + P.size + ' ' + L.orient + '</span></footer></div>';
  }

  function render() {
    css();
    app.innerHTML = '<section class="po-hero"><p class="vx-eye" style="color:#FDE68A">VISTA Research Hub</p><h1>🖼️ Research Poster Creator</h1><p>Turn your investigation into a clear scientific poster for a science fair, exhibition or class presentation. Print it at A0, A1, A2 or A3, or save it as a PDF.</p></section>' +
      '<div class="po-wrap"><aside class="po-ed" aria-label="Poster editor">' +
      '<div id="po-imp"></div>' +
      '<h3>Title and authors</h3><label>Title<input id="po-title" maxlength="140" value="' + E(P.title) + '" placeholder="A short, clear title (under 15 words)"></label><label>Your name(s)<input id="po-auth" value="' + E(P.authors) + '"></label><label>School and class<input id="po-sch" value="' + E(P.school) + '"></label>' +
      '<h3>Design</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>Paper<select id="po-size">' + Object.keys(SIZES).map(function (k) { return '<option' + (P.size === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label>' +
      '<label>Layout<select id="po-lay">' + Object.keys(LAYOUTS).map(function (k) { return '<option value="' + k + '"' + (P.layout === k ? ' selected' : '') + '>' + LAYOUTS[k].name + '</option>'; }).join('') + '</select></label></div>' +
      '<label>Text size <input type="range" id="po-font" min="0.8" max="1.3" step="0.05" value="' + (P.font || 1) + '"></label>' +
      '<div class="po-sw" role="group" aria-label="Colour theme">' + Object.keys(THEMES).map(function (k) { return '<button type="button" data-th="' + k + '" aria-label="' + k + ' theme" aria-pressed="' + (P.theme === k) + '" style="background:' + THEMES[k][0] + '"></button>'; }).join('') + '</div>' +
      '<h3>Sections</h3>' + SECS.map(function (s) { var w = words(P.text[s[0]]), lim = s[0] === 'refs' ? 200 : s[0] === 'rq' || s[0] === 'hyp' ? 60 : 150;
        return '<details' + (P.text[s[0]] ? '' : '') + '><summary><input type="checkbox" data-on="' + s[0] + '"' + (P.on[s[0]] ? ' checked' : '') + ' aria-label="Show ' + E(s[1]) + ' on the poster" onclick="event.stopPropagation()"> ' + E(s[1]) + ' <span class="po-wc' + (w > lim ? ' hi' : '') + '" data-wc="' + s[0] + '">' + w + ' words</span></summary>' +
          '<label><small class="po-wc">' + E(s[2]) + '</small><textarea data-t="' + s[0] + '" rows="' + (s[0] === 'rq' ? 2 : 5) + '">' + E(P.text[s[0]] || '') + '</textarea></label>' +
          (['method', 'results', 'analysis', 'intro', 'conclusion'].indexOf(s[0]) >= 0 ? '<label>Image (graph, diagram or photo)<input type="file" accept="image/*" data-img="' + s[0] + '"></label>' + (P.img[s[0]] ? '<p class="po-wc">✓ Image added · <a href="#" data-rmimg="' + s[0] + '">remove</a></p>' : '') + '<label>Caption<input data-cap="' + s[0] + '" value="' + E(P.cap[s[0]] || '') + '" placeholder="Figure 1: …"></label>' : '') + '</details>'; }).join('') +
      '<div id="po-tips"></div>' +
      '<div class="btns" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn main sm" id="po-print">🖨 Print or save as PDF</button><button class="btn sm" id="po-save">💾 Save to my project</button><button class="btn sm" id="po-new">New poster</button></div><p class="po-wc" id="po-note" role="status"></p></aside>' +
      '<div class="po-stage" id="po-stage" aria-label="Poster preview"><div id="po-fit"></div></div></div>';
    var $ = function (q) { return app.querySelector(q); };
    function draw() { var st = $('#po-stage'), fit = $('#po-fit'); fit.innerHTML = posterHTML(); var pz = fit.firstChild, scale = Math.min(1, (st.clientWidth - 32) / pz.offsetWidth);
      pz.style.transform = 'scale(' + scale + ')'; fit.style.height = (pz.offsetHeight * scale) + 'px'; fit.style.width = (pz.offsetWidth * scale) + 'px'; tips(); }
    function tips() {
      var total = SECS.reduce(function (n, s) { return n + (P.on[s[0]] ? words(P.text[s[0]]) : 0); }, 0), out = [];
      var pz = $('#pz'), body = pz && pz.querySelector('.pz-body'), over = body && body.scrollHeight > body.clientHeight + 2;
      if (over) out.push('⚠ The text does not fit: shorten sections, use bigger paper or smaller text.');
      if (total > 900) out.push('About ' + total + ' words: most good posters use 400–800. Cut to the key points.');
      if (words(P.title) > 15) out.push('Shorten the title: aim for under 15 words.');
      if (P.on.results && !P.img.results) out.push('Add your best graph to Results: posters are read for their figures first.');
      if (P.on.rq && !P.text.rq) out.push('Add your research question.');
      $('#po-tips').innerHTML = out.length ? out.map(function (t) { return '<p class="po-wc" style="background:#FEF3C7;border-radius:8px;padding:6px 8px">' + E(t) + '</p>'; }).join('') : (total ? '<p class="po-wc" style="background:#DCFCE7;border-radius:8px;padding:6px 8px">✓ ' + total + ' words, and everything fits.</p>' : '');
    }
    var drawT; function later() { keep(); clearTimeout(drawT); drawT = setTimeout(draw, 180); }
    $('#po-title').oninput = function () { P.title = this.value; later(); }; $('#po-auth').oninput = function () { P.authors = this.value; later(); }; $('#po-sch').oninput = function () { P.school = this.value; later(); };
    $('#po-size').onchange = function () { P.size = this.value; later(); }; $('#po-lay').onchange = function () { P.layout = this.value; later(); }; $('#po-font').oninput = function () { P.font = +this.value; later(); };
    [].forEach.call(app.querySelectorAll('[data-th]'), function (b) { b.onclick = function () { P.theme = b.getAttribute('data-th'); [].forEach.call(app.querySelectorAll('[data-th]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); later(); }; });
    [].forEach.call(app.querySelectorAll('[data-t]'), function (t) { t.oninput = function () { var k = t.getAttribute('data-t'), s = SECS.filter(function (x) { return x[0] === k; })[0], lim = k === 'refs' ? 200 : k === 'rq' || k === 'hyp' ? 60 : 150, w = words(t.value);
      P.text[k] = t.value; var wc = app.querySelector('[data-wc="' + k + '"]'); wc.textContent = w + ' words'; wc.classList.toggle('hi', w > lim); void s; later(); }; });
    [].forEach.call(app.querySelectorAll('[data-on]'), function (c) { c.onchange = function () { P.on[c.getAttribute('data-on')] = c.checked; later(); }; });
    [].forEach.call(app.querySelectorAll('[data-cap]'), function (c) { c.oninput = function () { P.cap[c.getAttribute('data-cap')] = c.value; later(); }; });
    [].forEach.call(app.querySelectorAll('[data-rmimg]'), function (a) { a.onclick = function (e) { e.preventDefault(); delete P.img[a.getAttribute('data-rmimg')]; keep(); render(); }; });
    [].forEach.call(app.querySelectorAll('[data-img]'), function (inp) { inp.onchange = function () { var f = inp.files[0]; if (!f) return; shrink(f, function (url) { P.img[inp.getAttribute('data-img')] = url; keep(); render(); }); }; });
    $('#po-print').onclick = printPoster;
    $('#po-new').onclick = function () { if (confirm('Start a new, empty poster? The current one in this browser will be cleared.')) { P = blank(); keep(); render(); } };
    $('#po-save').onclick = saveToProject;
    window.onresize = function () { clearTimeout(drawT); drawT = setTimeout(draw, 200); };
    draw(); importer();
  }

  /* images are reduced to at most 1200 px so the poster stays small */
  function shrink(file, done) {
    var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 1200 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); done(c.toDataURL(/png/.test(file.type) ? 'image/png' : 'image/jpeg', 0.8)); }; im.src = r.result; }; r.readAsDataURL(file);
  }

  function printPoster() {
    var sz = SIZES[P.size], L = LAYOUTS[P.layout], w = L.orient === 'landscape' ? sz[1] : sz[0], h = L.orient === 'landscape' ? sz[0] : sz[1];
    var win = window.open('', '_blank'); if (!win) { note('Allow pop-ups to print the poster.'); return; }
    var fonts = [].map.call(document.querySelectorAll('link[rel=stylesheet]'), function (l) { return '<link rel="stylesheet" href="' + l.href + '">'; }).join('');
    win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + E(P.title || 'Poster') + '</title>' + fonts + '<style>' + CSS + '@page{size:' + w + 'mm ' + h + 'mm;margin:0}html,body{margin:0;padding:0}.pz{box-shadow:none;transform:none!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>' + posterHTML() + '</body></html>');
    win.document.close(); setTimeout(function () { try { win.focus(); win.print(); } catch (e) { } }, 700);
    note('In the print window choose “Save as PDF” (or a large-format printer) and paper size ' + P.size + '.');
  }

  /* import from the student's own projects, and save back to them */
  function importer() {
    var S = window.BVS, box = document.getElementById('po-imp'); if (!box) return;
    if (!S || !S.db) { setTimeout(importer, 400); return; }
    S.db.auth.getSession().then(function (s) {
      var u = s && s.data && s.data.session && s.data.session.user;
      if (!u) { box.innerHTML = '<p class="po-wc">Your poster is kept in this browser. <a href="/login/?next=/poster/">Sign in</a> to import your IA, EE or personal project.</p>'; return; }
      Promise.all([S.db.from('research_projects').select('id,kind,title,rq,data').eq('student_id', u.id).neq('status', 'archived'), S.db.from('pp_projects').select('id,title,data').eq('student_id', u.id).neq('status', 'archived'),
        S.db.from('profiles').select('full_name').eq('id', u.id).maybeSingle()]).then(function (x) {
        var R = x[0].data || [], PP = x[1].data || [], name = (x[2].data || {}).full_name || '';
        if (!P.authors && name) { P.authors = name; keep(); var a = document.getElementById('po-auth'); if (a) a.value = name; }
        if (!R.length && !PP.length) { box.innerHTML = '<p class="po-wc">No projects to import yet. Start an IA or EE in the <a href="/research/">Research Hub</a>, or write your poster here from scratch.</p>'; return; }
        box.innerHTML = '<h3>Import from a project</h3><label><select id="po-src"><option value="">Choose…</option>' + R.map(function (p) { return '<option value="r:' + p.id + '">' + (p.kind === 'ee' ? 'Extended essay' : 'IA') + ': ' + E(p.title) + '</option>'; }).join('') + PP.map(function (p) { return '<option value="p:' + p.id + '">Personal project: ' + E(p.title) + '</option>'; }).join('') + '</select></label>' +
          '<button class="btn sm" id="po-go">Fill the poster from it</button><p class="po-wc">Only empty sections are filled; shorten them for the poster. ' + (P.link ? 'Linked to: ' + E(P.link.title) : '') + '</p>';
        document.getElementById('po-go').onclick = function () {
          var v = document.getElementById('po-src').value; if (!v) return;
          var k = v.slice(0, 1), id = v.slice(2), src = (k === 'r' ? R : PP).filter(function (p) { return p.id === id; })[0]; if (!src) return;
          var d = src.data || {}, T = P.text, fill = function (key, val) { if (val && !T[key]) T[key] = String(val).trim(); };
          if (d.poster && confirm('This project already has a saved poster. Open it instead?')) { P = Object.assign(blank(), d.poster); P.link = { kind: k, id: id, title: src.title }; keep(); render(); return; }
          if (!P.title) P.title = src.title;
          if (k === 'r') {
            var c = d.conclusion || {}, ev = ((d.evaluation || {}).rows || []).map(function (r) { return [r.issue || r.limitation || r.weakness, r.effect || r.impact, r.improvement || r.fix].filter(Boolean).join(': '); }).filter(Boolean);
            fill('intro', (d.topic || {}).background); fill('rq', (d.rq || {}).text || src.rq); fill('hyp', c.hypothesis || (d.topic || {}).hypothesis);
            var v2 = d.variables || {}; fill('method', [v2.iv && 'Independent variable: ' + (v2.iv.name || v2.iv), v2.dv && 'Dependent variable: ' + (v2.dv.name || v2.dv), (d.method || {}).procedure && (Array.isArray(d.method.procedure) ? d.method.procedure.join('\n') : d.method.procedure)].filter(function (z) { return z && typeof z === 'string'; }).join('\n'));
            fill('analysis', ((d.analysis || {}).saved || []).map(function (s) { return s.summary; }).filter(Boolean).join('\n'));
            fill('conclusion', [c.quant, c.stats, c.literature].filter(Boolean).join('\n\n')); fill('evaluation', ev.join('\n'));
          } else {
            var crit = (d.criteria || []).map(function (c2) { return '• ' + c2.c; }).join('\n'), rp = d.report || {};
            fill('intro', d.interest); fill('rq', d.goal ? 'Learning goal: ' + d.goal : ''); fill('method', [d.product && 'Product: ' + d.product, crit && 'Success criteria:\n' + crit, d.plan_notes].filter(Boolean).join('\n\n'));
            fill('results', rp.evaluation); fill('conclusion', rp.impact); fill('analysis', rp.atl_product || rp.atl_goal);
          }
          P.link = { kind: k, id: id, title: src.title }; keep(); render(); note('Imported from “' + src.title + '”. Now cut each section down to its key points.');
        };
      });
    });
  }
  function saveToProject() {
    var S = window.BVS; if (!P.link) { note('Import from one of your projects first to link the poster to it. It is always kept in this browser.'); return; }
    if (!S || !S.db) return;
    var t = P.link.kind === 'r' ? 'research_projects' : 'pp_projects', copy = Object.assign({}, P); delete copy.link;
    S.db.from(t).select('data').eq('id', P.link.id).maybeSingle().then(function (r) {
      if (r.error || !r.data) { note('Could not open the project to save the poster.'); return; }
      var d = r.data.data || {}; d.poster = copy;
      S.db.from(t).update({ data: d }).eq('id', P.link.id).then(function (x) { note(x.error ? 'Could not save: ' + (x.error.message || '') : '✓ Saved to “' + P.link.title + '”. Your supervisor can see it.'); });
    });
  }
  render();
})();
