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
  function stem(w) { return w.replace(/(ies)$/, 'y').replace(/(sses)$/, 'ss').replace(/([^s])s$/, '$1').replace(/(ing|ed)$/, ''); }
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
  function results(q) {
    var box = app.querySelector('#hres'), topic = app.querySelector('#htopic').value.trim(), r = search(q, topic);
    var html = '';
    if (r.terms.length) html += '<div class="panel hgloss"><p class="label">Key words</p><dl class="hterms">' + r.terms.map(function (t) { return '<dt>' + E(t.term) + '</dt><dd>' + E(t.meaning) + '</dd>'; }).join('') + '</dl></div>';
    if (r.notes.length) html += '<p class="label">From your teacher\'s notes</p>' + r.notes.map(noteCard).join('');
    else html += '<div class="panel"><p><b>No notes match your question yet.</b> Try other key words, or send the question to your teacher below.</p></div>';
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
    '.help textarea{width:100%}.hgloss{margin-bottom:8px}';

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
