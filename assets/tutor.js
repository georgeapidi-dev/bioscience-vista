/* Science Help Desk · Learnova · by George Apidi
   No AI. A student's question is matched against George's lesson notes (lesson_notes) and shown at once.
   If the notes do not answer it, the student sends the question to the teacher, who answers it from the staff dashboard. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME = null, NOTES = null, LESSONS = {}, MINE = [], FAQ = [];
  var COURSES = ['IB MYP', 'IB Diploma Biology', 'IB Diploma Chemistry', 'IB Environmental Systems and Societies',
    'Cambridge IGCSE Biology', 'Cambridge IGCSE Chemistry', 'Cambridge A-Level Biology', 'Cambridge A-Level Chemistry', 'General Science'];
  var STOP = ('a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those what which who whom why how when where ' +
    'do does did done can could should would will shall may might must i me my we our you your he she they them their there here than then so not no yes ' +
    'about into out up down over under again more most some any each other such only own same very just also explain describe state define give name list ' +
    'please help understand mean means meaning difference between example examples tell')
    .split(' ').reduce(function (o, w) { o[w] = 1; return o; }, {});
  function pref(k, v) { try { if (v === undefined) return localStorage.getItem('bv-help-' + k); localStorage.setItem('bv-help-' + k, v); } catch (e) { return null; } }
  function stem(w) { return w.replace(/is(e|ed|es|ing|ation)$/, 'iz$1').replace(/(ies)$/, 'y').replace(/(sses)$/, 'ss').replace(/([^s])s$/, '$1').replace(/(ing|ed)$/, ''); }
  function words(t) { return (String(t || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return w.length > 2 && !STOP[w]; }).map(stem); }
  function guessCourse(me) {
    var p = ((me.cls && (me.cls.programme + ' ' + me.cls.name)) || '').toLowerCase();
    if (/myp|grade [6-9]|grade 10/.test(p)) return 'IB MYP';
    if (/ib dp|dp[12]|diploma/.test(p)) return /chem/.test(p) ? 'IB Diploma Chemistry' : /ess|environment/.test(p) ? 'IB Environmental Systems and Societies' : 'IB Diploma Biology';
    if (/igcse/.test(p)) return /chem/.test(p) ? 'Cambridge IGCSE Chemistry' : 'Cambridge IGCSE Biology';
    if (/a.?level|as level/.test(p)) return /chem/.test(p) ? 'Cambridge A-Level Chemistry' : 'Cambridge A-Level Biology';
    return 'General Science';
  }
  function level(lesson) { var m = /^(G\d+|DP\d)/.exec(lesson || ''); return m ? (m[1][0] === 'G' ? 'Grade ' + m[1].slice(1) : m[1]) : ''; }

  // ---------- searching the notes ----------
  function index(rows) {
    return rows.map(function (r) {
      var n = r.notes || {}, terms = (n.terms || []);
      return { r: r, n: n,
        t: words(n.title), k: words(terms.map(function (x) { return x.term; }).join(' ')),
        b: words([n.intro, (n.points || []).join(' '), terms.map(function (x) { return x.meaning; }).join(' '), n.example, (n.image && n.image.caption) || ''].join(' ')) };
    });
  }
  function search(q, topic) {
    var qw = words(q + ' ' + (topic || '')); if (!qw.length || !NOTES) return { notes: [], terms: [] };
    var uniq = qw.filter(function (w, i) { return qw.indexOf(w) === i; });
    var lv = ME && ME.cls ? String(ME.cls.name || '').match(/\d+/) : null;
    var scored = NOTES.map(function (x) {
      var s = 0, hit = 0;
      uniq.forEach(function (w) {
        var h = 0;
        if (x.t.indexOf(w) >= 0) h += 4;
        if (x.k.indexOf(w) >= 0) h += 3;
        var c = x.b.filter(function (v) { return v === w; }).length; h += Math.min(c, 3);
        if (h) { hit++; s += h; }
      });
      s = s * (hit / uniq.length);
      if (lv && x.r.lesson.indexOf('G' + lv[0] + '-') === 0) s *= 1.3;   // prefer notes from the student's own grade
      return { x: x, s: s };
    }).filter(function (o) { return o.s >= 2; }).sort(function (a, b) { return b.s - a.s; });
    var seen = {}, out = [];
    scored.forEach(function (o) { var key = o.x.n.title; if (!seen[key] && out.length < 4) { seen[key] = 1; out.push(o.x); } });
    var terms = [], tseen = {};
    NOTES.forEach(function (x) { (x.n.terms || []).forEach(function (t) {
      var tw = words(t.term); if (tw.length && tw.every(function (w) { return uniq.indexOf(w) >= 0; }) && !tseen[t.term.toLowerCase()] && terms.length < 6) { tseen[t.term.toLowerCase()] = 1; terms.push(t); }
    }); });
    return { notes: out, terms: terms };
  }

  // ---------- drawing ----------
  function noteCard(x) {
    var n = x.n, L = LESSONS[x.r.lesson] || {}, img = '';
    if (n.image && n.image.src) img = '<figure class="hfig"><img src="' + E(n.image.src) + '" alt="' + E(n.image.caption || n.title) + '" loading="lazy"><figcaption>' + E(n.image.caption || '') +
      ' <a href="' + E(n.image.page || '#') + '" target="_blank" rel="noopener" class="muted">Image: ' + E((n.image.artist || 'Wikimedia Commons').slice(0, 60)) + (n.image.license ? ', ' + E(n.image.license) : '') + '</a></figcaption></figure>';
    else if (n.drawn && n.drawn.svg) img = '<figure class="hfig"><img src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(n.drawn.svg) + '" alt="' + E(n.drawn.caption || n.title) + '"><figcaption>' + E(n.drawn.caption || '') + ' · Diagram drawn for Learnova</figcaption></figure>';
    return '<article class="hcard"><p class="small muted">📘 ' + E(L.title || x.r.lesson) + (level(x.r.lesson) ? ' · ' + E(level(x.r.lesson)) : '') + '</p><h3>' + E(n.title || '') + '</h3>' +
      (n.intro ? '<p>' + E(n.intro) + '</p>' : '') + img +
      (n.points && n.points.length ? '<ul>' + n.points.map(function (p) { return '<li>' + E(p) + '</li>'; }).join('') + '</ul>' : '') +
      (n.terms && n.terms.length ? '<dl class="hterms">' + n.terms.map(function (t) { return '<dt>' + E(t.term) + '</dt><dd>' + E(t.meaning) + '</dd>'; }).join('') + '</dl>' : '') +
      (n.example ? '<p class="hex"><b>Example:</b> ' + E(n.example) + '</p>' : '') +
      (L.url ? '<p><a class="btn sm" href="' + E(L.url) + '">Open the lesson ➜</a></p>' : '') + '</article>';
  }

  // ---------- searching the web (no AI): Wikipedia summary, Wikimedia Commons picture, flow chart, simulator graph ----------
  var SEQ = 0;
  function simpleWiki() { var c = (app.querySelector('#hcourse') || {}).value || ''; return /MYP|IGCSE|General/.test(c); }
  function phrase(q, topic) {
    var t = (String(q) + ' ' + (topic || '')).toLowerCase().replace(/[^a-z0-9\s\-]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2 && !STOP[w] && !/^(happen|happens|work|works|does|occur|use|used|explain|describe)$/.test(w); });
    return t.filter(function (w, i) { return t.indexOf(w) === i; }).slice(0, 6).join(' ');
  }
  function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function sentences(t) { return String(t || '').replace(/\s*\([^)]{0,80}\)/g, '').split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 25; }); }
  function bestSentences(text, q, n) {
    var qw = expand(words(q)), ss = sentences(text);
    var sc = ss.map(function (x, i) { return { x: x, i: i, s: hits(qw, words(x)) * 2 + (i === 0 ? 1.5 : 0) - (x.length > 260 ? 1 : 0) }; });
    return sc.filter(function (o) { return o.s > 0.5; }).sort(function (a, b) { return b.s - a.s; }).slice(0, n).sort(function (a, b) { return a.i - b.i; }).map(function (o) { return o.x; });
  }
  function web(q, topic, notePick, seq) {
    var ph = phrase(q, topic), host = simpleWiki() ? 'simple.wikipedia.org' : 'en.wikipedia.org';
    if (!ph) { app.querySelector('#hweb').innerHTML = ''; return; }
    var wikiP = getJSON('https://' + host + '/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=' + encodeURIComponent(ph))
      .then(function (j) {
        var res = (j.query && j.query.search) || []; if (!res.length && host.indexOf('simple') === 0) { host = 'en.wikipedia.org'; return getJSON('https://' + host + '/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=' + encodeURIComponent(ph)).then(function (k) { return (k.query && k.query.search) || []; }); }
        return res;
      }).then(function (res) {
        if (!res.length) return null;
        var qw = words(ph), best = res.map(function (x, i) { return { x: x, s: hits(qw, words(x.title)) * 3 - i }; }).sort(function (a, b) { return b.s - a.s; })[0].x;
        return getJSON('https://' + host + '/api/rest_v1/page/summary/' + encodeURIComponent(best.title.replace(/ /g, '_'))).then(function (sm) {
          if (sm.type === 'disambiguation') return null;
          var more = getJSON('https://' + host + '/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&exchars=6000&format=json&origin=*&titles=' + encodeURIComponent(best.title))
            .then(function (j) { var pg = j.query && j.query.pages, k = pg && Object.keys(pg)[0]; return (pg && pg[k] && pg[k].extract) || ''; }, function () { return ''; });
          return more.then(function (long) { return { title: sm.title, url: (sm.content_urls && sm.content_urls.desktop && sm.content_urls.desktop.page) || ('https://' + host + '/wiki/' + encodeURIComponent(best.title)), extract: sm.extract || '', long: long, thumb: sm.thumbnail && sm.thumbnail.source, host: host }; });
        });
      }).catch(function () { return null; });
    var picP = getJSON('https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=' + encodeURIComponent(ph + ' diagram filetype:bitmap|drawing') + '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=640')
      .then(function (j) {
        var ps = Object.values((j.query || {}).pages || {}).sort(function (a, b) { return a.index - b.index; });
        var LANG = /[-_ (](ar|az|be|bg|bn|ca|cs|da|de|el|es|et|eu|fa|fi|fr|gl|he|hi|hr|hu|hy|id|it|ja|ka|kk|kn|ko|lt|lv|mk|ml|mn|mr|ms|nl|no|pl|pt|ro|ru|sk|sl|sq|sr|sv|ta|te|th|tr|uk|ur|uz|vi|zh)([-_ .)]|$)/i;
        var qw = words(ph);
        ps = ps.filter(function (p) { var t = p.title.replace(/^File:/, ''); return /^[\x20-\x7E]+$/.test(t) && !LANG.test(t.replace(/\.\w+$/, '')) && hits(qw, words(t)) > 0; });
        return ps.slice(0, 2).map(function (p) { var i = p.imageinfo[0], m = i.extmetadata || {}; return { src: i.thumburl, page: i.descriptionurl, title: p.title.replace(/^File:|\.\w+$/g, '').replace(/_/g, ' '), artist: m.Artist ? m.Artist.value.replace(/<[^>]+>/g, '').trim().slice(0, 60) : 'Wikimedia Commons', license: (m.LicenseShortName || {}).value || '' }; });
      }).catch(function () { return []; });
    Promise.all([wikiP, picP]).then(function (x) {
      if (seq !== SEQ) return;   // a newer question was asked
      var w = x[0], pics = x[1], html = '', webPick = [];
      if (w) {
        webPick = bestSentences(w.extract + ' ' + w.long, q, 3);
        if (!webPick.length) webPick = sentences(w.extract).slice(0, 2);
        html += '<div class="panel hshort hwebp"><p class="label">🌐 From the web, summarised</p>' + (w.thumb ? '<img class="hthumb" src="' + E(w.thumb) + '" alt="' + E(w.title) + '" loading="lazy">' : '') +
          '<ul class="hpts">' + webPick.map(function (t) { return '<li>' + mark(t, q) + '</li>'; }).join('') + '</ul>' +
          '<p class="small muted">Source: <a href="' + E(w.url) + '" target="_blank" rel="noopener">' + E(w.title) + '</a> · ' + (w.host.indexOf('simple') === 0 ? 'Simple English Wikipedia' : 'Wikipedia') + ' (CC BY-SA). Check web answers against your notes.</p></div>';
      }
      if (pics.length) html += '<div class="panel"><p class="label">🖼 Picture or diagram</p><div class="hpics">' + pics.map(function (p) { return '<figure class="hfig"><img src="' + E(p.src) + '" alt="' + E(p.title) + '" loading="lazy"><figcaption>' + E(p.title) + ' · <a href="' + E(p.page) + '" target="_blank" rel="noopener">' + E(p.artist) + (p.license ? ', ' + E(p.license) : '') + '</a></figcaption></figure>'; }).join('') + '</div></div>';
      if (!html) html = '<div class="panel"><p class="small muted">🌐 Nothing useful came back from the web for this question.</p></div>';
      app.querySelector('#hweb').innerHTML = html;
      visuals(q, notePick.map(function (c) { return c.kind === 'term' ? '' : c.text; }).filter(Boolean), webPick);
    });
  }
  // flow chart for process questions, built from the answer's own sentences in order
  function shortLine(t) { var w = String(t).replace(/^Example:\s*/i, '').split(/\s+/); return w.length > 16 ? w.slice(0, 15).join(' ') + '…' : w.join(' '); }
  function wrap(t, n) { var out = [], line = ''; String(t).split(/\s+/).forEach(function (w) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; }); if (line.trim()) out.push(line.trim()); return out; }
  function flow(steps) {
    var W = 560, bh = 66, gap = 26, H = steps.length * (bh + gap) - gap + 20, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Flow chart" style="width:100%;max-width:560px;height:auto"><defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#0f766e"/></marker></defs>';
    steps.forEach(function (t, i) {
      var y = 10 + i * (bh + gap), lines = wrap(shortLine(t), 62).slice(0, 3);
      s += '<rect x="20" y="' + y + '" width="' + (W - 40) + '" height="' + bh + '" rx="12" fill="' + ['#e0f2f1', '#e3f2fd', '#fff8e1', '#fce4ec', '#ede7f6'][i % 5] + '" stroke="#0f766e" stroke-width="2"/>' +
        '<circle cx="44" cy="' + (y + bh / 2) + '" r="13" fill="#0f766e"/><text x="44" y="' + (y + bh / 2 + 5) + '" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">' + (i + 1) + '</text>';
      lines.forEach(function (l, k) { s += '<text x="68" y="' + (y + bh / 2 + 5 + (k - (lines.length - 1) / 2) * 17) + '" font-size="14" fill="#111">' + E(l) + '</text>'; });
      if (i < steps.length - 1) s += '<line x1="' + W / 2 + '" y1="' + (y + bh) + '" x2="' + W / 2 + '" y2="' + (y + bh + gap - 2) + '" stroke="#0f766e" stroke-width="2.5" marker-end="url(#fa)"/>';
    });
    return s + '</svg>';
  }
  var SIMS = [[/enzyme|catalase|amylase|active site|denatur/, 'enzyme', 'enzyme'], [/osmosis|water potential|turgid|plasmolys/, 'osmosis', 'osmosis'], [/diffusion|concentration gradient/, 'diffusion'],
    [/photosynthes|limiting factor|chlorophyll/, 'photosynth'], [/density|float|sink/, 'density'], [/surface area|volume ratio|sa ?: ?v|cell size/, 'cellsize'], [/heart|cardiac|blood pressure|valve|pulse/, null, 'heart'],
    [/titrat|ph curve|neutrali[sz]|indicator|acid|alkali|base/, null, 'titration'], [/replicat|helicase|polymerase|okazaki/, 'replication', 'dna'], [/natural selection|evolution|camouflage|peppered/, 'moth'],
    [/genetic drift|allele frequenc/, 'gdrift'], [/ferment|yeast/, 'ferment'], [/mitosis|meiosis|cell division|chromosome number/, 'division'], [/magnification|microscope/, 'microscope'],
    [/mutation|codon|transcription|translation|protein synthesis/, 'codon'], [/gel electrophoresis|dna profil/, 'gel'], [/mass|weight|gravity/, 'weight'], [/states of matter|solid|liquid|gas|particle/, 'states'], [/menstrual|hormone/, 'hormones']];
  function visuals(q, noteSteps, webSteps) {
    var box = app.querySelector('#hviz'), t = String(q).toLowerCase(), html = '';
    var proc = /\b(process|steps?|stages?|cycle|sequence|pathway|happens?|order|method|procedure|formed|forms?|made|produced|works?|travels?|flows?)\b/.test(t) && !/\b(affect|effect|influence|relationship|change|depend)s?\b/.test(t);
    var steps = noteSteps.concat(webSteps).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 5);
    if (proc && steps.length >= 2) html += '<div class="panel"><p class="label">🔀 Flow chart</p>' + flow(steps) + '<p class="small muted">Built from the sentences in the answers above, in order.</p></div>';
    var m = SIMS.filter(function (x) { return x[0].test(t); })[0];
    if (m) {
      html += '<div class="panel"><p class="label">📈 Graph: try it yourself</p>' + (m[1] ? '<div class="card sim" data-sim="' + m[1] + '"></div>' : '') +
        (m[2] ? '<p><a class="btn sm" href="/simulations/' + m[2] + '/">Open the full virtual laboratory ➜</a></p>' : '') + '</div>';
    }
    box.innerHTML = html;
    if (m && m[1]) {
      var go = function () { document.querySelectorAll('#hviz [data-sim]').forEach(function (el) { if (window.BVSim && BVSim.mount) BVSim.mount(el); }); };
      if (window.BVSim) go(); else { var sc = document.createElement('script'); var vm = ((document.querySelector('script[src*="tutor.js?v="]') || {}).src || '').match(/v=([\w]+)/); sc.src = '/assets/sim.js' + (vm ? '?v=' + vm[1] : ''); document.head.appendChild(sc); }
    }
  }

  // ---------- a short, specific answer built from the best-matching sentences in the notes ----------
  function qType(q) {
    var t = String(q).toLowerCase();
    return { def: /\b(what (is|are|does)|define|definition|meaning|mean)\b/.test(t), why: /\b(why|explain|reason|cause)\b/.test(t), how: /\bhow\b/.test(t),
      ex: /\bexamples?\b/.test(t), cmp: /\b(differen|compare|comparison|versus|vs|between)\b/.test(t), calc: /\b(calculat|formula|equation|work out|units?)\b/.test(t) };
  }
  var SYN = { hot: ['temperatur', 'heat'], heat: ['temperatur', 'hot'], warm: ['temperatur'], temperatur: ['hot', 'heat'], cold: ['temperatur'], stop: ['denatur'], speed: ['rate', 'fast'], fast: ['rate'], rate: ['fast', 'speed'],
    big: ['larg', 'size'], larg: ['size', 'big'], small: ['size'], food: ['nutrient'], breath: ['respiration', 'gas'], energ: ['respiration'], kill: ['denatur'], water: ['osmosi'] };
  function expand(ws) { var out = ws.slice(); ws.forEach(function (w) { Object.keys(SYN).forEach(function (k) { if (w.indexOf(k) === 0) out = out.concat(SYN[k]); }); }); return out; }
  function hits(qw, cw) { var n = 0; qw.forEach(function (w) { if (cw.some(function (c) { return c === w || (w.length > 4 && c.indexOf(w) === 0) || (c.length > 4 && w.indexOf(c) === 0); })) n++; }); return n; }
  function summarise(q, topic, notes) {
    var base = words(q + ' ' + (topic || '')), qw = expand(base).filter(function (w, i, a) { return a.indexOf(w) === i; }), ty = qType(q), cands = [];
    notes.slice(0, 3).forEach(function (x, rank) {
      var n = x.n, wt = [1, 0.7, 0.5][rank];
      function add(text, kind, extra) {   // one sentence per candidate, so the answer stays short
        if (!text) return;
        var parts = kind === 'term' ? [String(text)] : String(text).split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
        parts.forEach(function (t) { t = t.trim(); if (t.length > 2) cands.push({ text: t, kind: kind, x: x, wt: wt, extra: extra || 0 }); });
      }
      add(n.intro, 'intro');
      (n.points || []).forEach(function (pt) { add(pt, 'point'); });
      (n.terms || []).forEach(function (t) { if (/^(function|job|structure|use|role|example|process)$/i.test(t.term.trim())) return; var tw = words(t.term), hit = tw.length > 0 && tw.every(function (w) { return base.indexOf(w) >= 0; }); add(t.term + ': ' + t.meaning, 'term', hit ? 4 : 0); cands[cands.length - 1].term = t.term; cands[cands.length - 1].meaning = t.meaning; });
      add(n.example, 'example');
    });
    cands.forEach(function (c) {
      var cw = words(c.text), ov = hits(qw, cw);
      var s = ov * 2 + (ov >= 2 ? 2 : 0) + c.extra;
      if (c.kind === 'term' && !c.extra) s -= 2;
      if (ty.def && c.kind === 'term') s += 3; if (ty.def && c.kind === 'intro') s += 1;
      if (ty.why && /\b(because|so|therefore|as a result|which means|this means|so that)\b/i.test(c.text)) s += 2;
      if (ty.how && c.kind === 'point') s += 1;
      if (ty.ex && c.kind === 'example') s += 4;
      if (ty.cmp && /\b(while|whereas|but|both|unlike|instead|than)\b/i.test(c.text)) s += 2;
      if (ty.calc && /[=÷×]|\bdivide|\bmultipl/i.test(c.text)) s += 3;
      if (c.kind === 'example' && !ty.ex) s -= 1;
      c.s = s * c.wt;
    });
    var pick = [], max = ty.cmp ? 4 : 3;
    if (ty.cmp) cands.forEach(function (c) { if (c.kind === 'point' || c.kind === 'intro') c.s += 1; });
    cands.filter(function (c) { return c.s > 2; }).sort(function (a, b) { return b.s - a.s; }).forEach(function (c) {
      if (pick.length >= max) return;
      var cw = words(c.text); if (pick.some(function (p) { if ((p.kind === 'term') !== (c.kind === 'term')) return false; var pw = words(p.text), same = cw.filter(function (w) { return pw.indexOf(w) >= 0; }).length; return same / Math.max(1, Math.min(cw.length, pw.length)) > 0.75; })) return;
      if (c.kind === 'term' && (ty.ex || ty.cmp || ty.why) && pick.filter(function (p) { return p.kind === 'term'; }).length >= 1) return;
      if (c.kind === 'term' && pick.filter(function (p) { return p.kind === 'term'; }).length >= 2) return;
      if (c.kind === 'term' && pick.some(function (p) { return p.kind === 'term' && p.term.toLowerCase() === c.term.toLowerCase(); })) return;
      pick.push(c);
    });
    if (ty.ex && !pick.some(function (p) { return p.kind === 'example'; })) { var ex = cands.filter(function (c) { return c.kind === 'example' && c.s > 0; }).sort(function (a, b) { return b.s - a.s; })[0]; if (ex) { if (pick.length >= max) pick.pop(); pick.push(ex); } }
    if (pick.length && pick.length < 2) { var top = pick[0].x, intro = cands.filter(function (c) { return c.x === top && c.kind === 'intro' && pick.indexOf(c) < 0; })[0]; if (intro) pick.push(intro); }
    var order = { term: 0, intro: 1, point: 2, example: 3 };
    pick.sort(function (a, b) { return order[a.kind] - order[b.kind]; });
    return pick;
  }
  function mark(text, q) {   // bold the question's key words inside the answer
    var qw = words(q), out = E(text);
    return out.replace(/[A-Za-z][A-Za-z\-]{2,}/g, function (w) { return qw.indexOf(stem(w.toLowerCase())) >= 0 ? '<b>' + w + '</b>' : w; });
  }
  function results(q) {
    var box = app.querySelector('#hres'), topic = app.querySelector('#htopic').value.trim(), r = search(q, topic), html = '';
    var pick = r.notes.length ? summarise(q, topic, r.notes) : [];
    if (pick.length) {
      var src = [], seen = {}; pick.forEach(function (c) { if (!seen[c.x.n.title]) { seen[c.x.n.title] = 1; src.push(c.x); } });
      html += '<div class="panel hshort"><p class="label">Short answer</p><ul class="hpts">' + pick.map(function (c) {
          return '<li>' + (c.kind === 'example' ? '<i>Example:</i> ' : '') + (c.kind === 'term' ? '<b>' + E(c.term) + '</b>: ' + mark(c.meaning, q) : mark(c.text, q)) + '</li>'; }).join('') + '</ul>' +
        '<p class="small muted">From: ' + src.map(function (x) { var L = LESSONS[x.r.lesson] || {}; return L.url ? '<a href="' + E(L.url) + '">' + E(x.n.title) + '</a>' : E(x.n.title); }).join(' · ') + '</p></div>';
      html += '<details class="hmore"><summary>Read the full note' + (r.notes.length > 1 ? 's (' + Math.min(r.notes.length, 3) + ')' : '') + '</summary>' + r.notes.slice(0, 3).map(noteCard).join('') + '</details>';
    } else if (r.notes.length) {
      html += '<div class="panel"><p><b>Your teacher\'s notes do not answer this exactly.</b> These notes are the closest:</p></div><details class="hmore" open><summary>Closest notes</summary>' + r.notes.slice(0, 2).map(noteCard).join('') + '</details>';
    } else html += '<div class="panel"><p><b>No notes match your question yet.</b> Try other key words, or send the question to your teacher below.</p></div>';
    html += '<div id="hweb" aria-live="polite"><div class="panel"><p class="small muted">🌐 Searching the web for more…</p></div></div><div id="hviz"></div>';
    html += '<div class="panel hask"><p><b>Still stuck?</b> Send your question to your teacher. You will see the answer here under <i>My questions</i>.</p>' +
      '<button type="button" class="btn main" id="hsend">✉ Send my question to my teacher</button><p class="msg" id="hst2" role="status"></p></div>';
    box.innerHTML = html;
    box.querySelector('#hsend').onclick = function () { sendQ(q, this); };
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var seq = ++SEQ;
    web(q, topic, pick, seq);
  }
  function sendQ(q, btn) {
    var st = app.querySelector('#hst2');
    q = String(q || '').trim(); if (q.length < 3) { st.textContent = 'Please write your question first.'; return; }
    btn.disabled = true; st.textContent = 'Sending…';
    S.db.from('help_questions').insert({ question: q.slice(0, 4000), course: app.querySelector('#hcourse').value, topic: app.querySelector('#htopic').value.trim().slice(0, 120) || null })
      .then(function (r) {
        if (r.error) { btn.disabled = false; st.textContent = 'Could not send just now. Please try again.'; return; }
        st.textContent = '✓ Sent to your teacher. The answer will appear under My questions.'; btn.textContent = '✓ Sent';
        loadMine();
      });
  }
  function drawMine() {
    var box = app.querySelector('#hmine'); if (!box) return;
    if (!MINE.length) { box.innerHTML = '<p class="small muted">You have not sent any questions yet.</p>'; return; }
    box.innerHTML = MINE.map(function (m) {
      return '<div class="hq' + (m.answer && !m.seen ? ' new' : '') + '"><p class="small muted">' + new Date(m.created_at).toLocaleDateString() + (m.topic ? ' · ' + E(m.topic) : '') +
        (m.answer ? (m.seen ? ' · answered' : ' · <b>new answer</b>') : ' · waiting for your teacher') + '</p><p><b>You asked:</b> ' + E(m.question).replace(/\n/g, '<br>') + '</p>' +
        (m.answer ? '<div class="hans"><b>Teacher\'s answer:</b><br>' + E(m.answer).replace(/\n/g, '<br>') + '</div>' : '') + '</div>';
    }).join('');
    var unseen = MINE.filter(function (m) { return m.answer && !m.seen; }).map(function (m) { return m.id; });
    if (unseen.length) S.db.from('help_questions').update({ seen: true }).in('id', unseen).then(function () {});
    var b = app.querySelector('#hbadge'); if (b) b.textContent = unseen.length ? ' (' + unseen.length + ' new)' : '';
  }
  function loadMine() {
    return S.db.from('help_questions').select('id,question,topic,answer,seen,created_at,answered_at').eq('student_id', ME.user.id).order('created_at', { ascending: false }).limit(50)
      .then(function (r) { MINE = r.data || []; drawMine(); });
  }
  function drawFaq() {
    var box = app.querySelector('#hfaq'); if (!box) return;
    box.parentNode.hidden = !FAQ.length;
    box.innerHTML = FAQ.map(function (f) { return '<details class="hq"><summary>' + E(f.question.slice(0, 160)) + '</summary><div class="hans">' + E(f.answer || '').replace(/\n/g, '<br>') + '</div></details>'; }).join('');
  }

  var CSS = '.help{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px}@media(max-width:860px){.help{grid-template-columns:1fr}}' +
    '.hcard{background:var(--card,#fff);border:1px solid var(--line,#dde3ea);border-radius:14px;padding:14px 16px;margin:10px 0}.hcard h3{margin:.2em 0 .4em}' +
    '.hterms{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;margin:.6em 0}.hterms dt{font-weight:700}.hterms dd{margin:0}' +
    '.hex{background:rgba(46,125,50,.08);border-radius:10px;padding:8px 10px}.hfig{margin:.6em 0}.hfig img{max-width:100%;max-height:300px;border-radius:10px;display:block}.hfig figcaption{font-size:.85em;color:var(--muted,#667)}' +
    '.hq{border-top:1px solid var(--line,#dde3ea);padding:8px 0}.hq.new{background:rgba(255,193,7,.12)}.hans{background:rgba(25,118,210,.08);border-radius:10px;padding:8px 10px;margin-top:4px}' +
    '.hthumb{float:right;max-width:120px;max-height:120px;border-radius:10px;margin:0 0 8px 10px}.hwebp{border-left-color:#1d4ed8;overflow:hidden}.hpics{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.help textarea{width:100%}.hgloss{margin-bottom:8px}.hshort{border-left:5px solid #0f766e}.hpts{margin:.3em 0;padding-left:1.2em}.hpts li{margin:.35em 0}.hmore{margin:10px 0}.hmore summary{cursor:pointer;font-weight:600;padding:6px 0}';

  S.guard(app).then(function (me) {
    ME = me;
    var course = pref('course') || guessCourse(me), topic = pref('topic') || '';
    app.innerHTML = '<style>' + CSS + '</style><div class="help"><section>' +
      '<form id="hform" class="panel"><label class="f">Course<select id="hcourse">' + COURSES.map(function (c) { return '<option' + (c === course ? ' selected' : '') + '>' + E(c) + '</option>'; }).join('') + '</select></label>' +
      '<label class="f">Topic (optional)<input id="htopic" maxlength="120" value="' + E(topic) + '" placeholder="e.g. enzymes"></label>' +
      '<label class="f" for="hq">Your question</label><textarea id="hq" rows="4" maxlength="4000" placeholder="Type your science question, e.g. Why does an enzyme stop working at high temperature?"></textarea>' +
      '<div class="row2"><button class="btn main" type="submit">🔎 Find the answer in my notes</button><span class="small muted">Searches your teacher\'s lesson notes first.</span></div>' +
      '<p class="msg" id="hst" role="status"></p></form><div id="hres" aria-live="polite"></div></section>' +
      '<aside><div class="panel"><h3>My questions<span id="hbadge"></span></h3><div id="hmine"><p class="small muted">Loading…</p></div></div>' +
      '<div class="panel" hidden><h3>Questions other students asked</h3><div id="hfaq"></div></div>' +
      '<p class="small muted">Answers come from your teacher, George Apidi, and from his lesson notes. Do not share personal information in a question.</p></aside></div>';
    var st = app.querySelector('#hst'); st.textContent = 'Loading notes…';
    var tq = app.querySelector('#hq');
    Promise.all([
      S.db.from('lesson_notes').select('lesson,step,notes').limit(2000).then(function (r) { NOTES = index(r.data || []); }),
      S.db.from('lessons').select('external_id,title,url').limit(2000).then(function (r) { (r.data || []).forEach(function (l) { LESSONS[l.external_id] = l; }); }, function () {}),
      S.db.from('help_questions').select('question,answer').eq('public_faq', true).eq('status', 'answered').order('answered_at', { ascending: false }).limit(30).then(function (r) { FAQ = r.data || []; drawFaq(); }, function () {}),
      loadMine()
    ]).then(function () { st.textContent = NOTES && NOTES.length ? '' : 'Notes could not be loaded. You can still send your question to your teacher.'; }, function () { st.textContent = ''; });
    app.querySelector('#hform').onsubmit = function (e) { e.preventDefault(); var q = tq.value.trim(); if (q.length < 3) { st.textContent = 'Please write your question first.'; return; } st.textContent = ''; results(q); };
    tq.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); app.querySelector('#hform').requestSubmit(); } });
    app.querySelector('#hcourse').onchange = function () { pref('course', this.value); };
    app.querySelector('#htopic').onchange = function () { pref('topic', this.value.trim()); };
    var ask = new URLSearchParams(location.search).get('q'); if (ask) { tq.value = ask.slice(0, 2000); window.history.replaceState(null, '', location.pathname); }
  }).catch(function () {});
})();
