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
      function add(text, kind, extra) { if (text) cands.push({ text: String(text).trim(), kind: kind, x: x, wt: wt, extra: extra || 0 }); }
      add(n.intro, 'intro');
      (n.points || []).forEach(function (pt) { add(pt, 'point'); });
      (n.terms || []).forEach(function (t) { var tw = words(t.term), hit = tw.length > 0 && tw.every(function (w) { return base.indexOf(w) >= 0; }); add(t.term + ': ' + t.meaning, 'term', hit ? 4 : 0); cands[cands.length - 1].term = t.term; cands[cands.length - 1].meaning = t.meaning; });
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
    html += '<div class="panel hask"><p><b>Still stuck?</b> Send your question to your teacher. You will see the answer here under <i>My questions</i>.</p>' +
      '<button type="button" class="btn main" id="hsend">✉ Send my question to my teacher</button><p class="msg" id="hst2" role="status"></p></div>';
    box.innerHTML = html;
    box.querySelector('#hsend').onclick = function () { sendQ(q, this); };
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    '.help textarea{width:100%}.hgloss{margin-bottom:8px}.hshort{border-left:5px solid #0f766e}.hpts{margin:.3em 0;padding-left:1.2em}.hpts li{margin:.35em 0}.hmore{margin:10px 0}.hmore summary{cursor:pointer;font-weight:600;padding:6px 0}';

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
