/* Learnova · Practice and revision (/practice/) · by Learnova
   🎯 Practice: choose level and topics; the site makes a set from the course questions (practice_make, migration 039),
      the quiz player marks it automatically and gives results and detailed feedback. Teachers get an editable draft instead.
   🃏 My questions: students (and teachers) write their own quick revision questions and flashcards, with pictures, graphs,
      drawings, audio and video, or have them made from their notes; practise as flashcards, a quiz or a speed round;
      share a set with their class (revision_sets).
   📈 My results: every practice set with the best score. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), T = window.BVT, QT = window.BVQT, ME, TEACH = false, TAB = 'gen';
  var css = document.createElement('style');
  css.textContent = '.pr-hero{border-radius:22px;padding:20px 22px;color:#fff;background:linear-gradient(120deg,#4f46e5,#db2777 55%,#f59e0b);box-shadow:0 14px 40px rgba(79,70,229,.25)}.pr-hero h2{margin:0 0 4px;color:#fff}.pr-hero p{margin:0;opacity:.95}' +
    '.pr-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.pr-tabs button{border:2px solid transparent;border-radius:999px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer;background:var(--card,#fff);box-shadow:0 2px 8px rgba(15,23,42,.08)}.pr-tabs button[aria-selected=true]{background:#172033;color:#fff}' +
    '.pr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.pr-card{border-radius:18px;padding:14px;background:var(--card,#fff);border:1px solid var(--line,#e2e8f0);box-shadow:0 4px 14px rgba(15,23,42,.06);display:flex;flex-direction:column;gap:8px;border-top:6px solid var(--k,#4f46e5)}.pr-card h4{margin:0}.pr-card .acts{margin-top:auto}' +
    '.pr-topics{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}.pr-topic{display:flex;gap:8px;align-items:center;border:2px solid var(--line,#e2e8f0);border-radius:12px;padding:8px 10px;cursor:pointer;background:var(--card,#fff)}.pr-topic:has(input:checked){border-color:#16a34a;background:#f0fdf4}' +
    '.pr-chips{display:flex;flex-wrap:wrap;gap:6px}.pr-chips label{border:2px solid var(--line,#e2e8f0);border-radius:999px;padding:6px 12px;cursor:pointer;background:var(--card,#fff)}.pr-chips label:has(input:checked){border-color:#4f46e5;background:#eef2ff}.pr-chips input{position:absolute;opacity:0;pointer-events:none}' +
    '.pr-bar{height:10px;border-radius:6px;background:#e2e8f0;overflow:hidden}.pr-bar i{display:block;height:100%}.pr-ed{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:14px}@media(max-width:760px){.pr-ed{grid-template-columns:1fr}}' +
    '.pr-items{display:flex;flex-direction:column;gap:6px}.pr-items button{text-align:left;border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:8px 10px;background:var(--card,#fff);cursor:pointer;font:inherit}.pr-items button[aria-current=true]{border-color:#4f46e5;box-shadow:0 0 0 2px #c7d2fe}' +
    '.pr-flip{perspective:1200px;min-height:260px;cursor:pointer}.pr-flip>div{position:relative;min-height:260px;transition:transform .5s;transform-style:preserve-3d}.pr-flip.on>div{transform:rotateY(180deg)}.pr-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:20px;padding:22px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;font-size:1.25rem;overflow:auto;box-shadow:0 10px 30px rgba(15,23,42,.12)}.pr-face.f{background:linear-gradient(135deg,#eef2ff,#fdf2f8)}.pr-face.b{background:linear-gradient(135deg,#ecfdf5,#fefce8);transform:rotateY(180deg)}' +
    '.pr-play{max-width:760px;margin:0 auto}.pr-fb{border-radius:12px;padding:10px 12px;margin-top:10px;font-weight:600}.pr-fb.good{background:#dcfce7;color:#14532d}.pr-fb.bad{background:#fee2e2;color:#7f1d1d}.pr-fb.part{background:#fef9c3;color:#713f12}.pr-big{font-size:2.4rem;font-weight:800;margin:6px 0}' +
    '.pr-opt{display:block;border:2px solid var(--line,#e2e8f0);border-radius:12px;padding:10px 12px;margin:6px 0;cursor:pointer;background:var(--card,#fff)}.pr-opt:has(input:checked){border-color:#4f46e5;background:#eef2ff}.pr-opt.ok{border-color:#16a34a;background:#dcfce7}.pr-opt.no{border-color:#dc2626;background:#fee2e2}.pr-timer{font-size:1.4rem;font-weight:800;color:#db2777}';
  document.head.appendChild(css);
  var LEVEL_TYPES = [['', '🎲 Mixed'], ['mcq', '🔘 Multiple choice'], ['quick', '⚡ Quick answers'], ['short', '✏️ Written answers']];
  var QUICK = ['mcq', 'tf', 'multi', 'match', 'order', 'classify', 'gaps', 'cloze', 'number', 'table'];
  var KINDS = [['card', '🃏', 'Flashcard'], ['mcq', '🔘', 'Multiple choice'], ['tf', '✅', 'True or false'], ['gaps', '✍️', 'Fill the gaps'], ['match', '🔗', 'Match pairs'], ['order', '🔢', 'Put in order'], ['classify', '🗂️', 'Sort into groups'], ['number', '🔟', 'Calculation'], ['short', '✏️', 'Short answer']];
  var KN = {}; KINDS.forEach(function (k) { KN[k[0]] = k; });
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem('bv-pr-' + k) || 'null'); localStorage.setItem('bv-pr-' + k, JSON.stringify(v)); } catch (e) { return null; } }
  function need039(e) { return /practice_|my_practice|revision_sets|schema cache|does not exist|relation/i.test((e && e.message) || String(e || '')); }
  function fail(e) { return '<p class="msg">' + (need039(e) ? 'This part switches on when the admin runs the database update 039.' : E(S.nice(e))) + '</p>'; }
  function rich(t) { return T && T.rich ? T.rich(t || '') : '<p>' + E(t) + '</p>'; }
  function media(list) { return list && list.length && T && T.mediaHtml ? T.mediaHtml(list) : ''; }

  S.guard(app, { school: true, allowPending: true }).then(function (me) {
    ME = me; TEACH = me.staff || me.school || (me.roles || []).indexOf('teacher') >= 0;
    var h = (location.hash || '').replace(/^#/, ''); TAB = /^(gen|mine|results)$/.test(h) ? h : 'gen'; frame();
  });
  function frame() {
    app.innerHTML = '<div class="pr-hero"><h2>🎯 Practice and revision</h2><p>' + (TEACH ? 'Generate question sets from the course questions for your classes, and make quick revision questions.' : 'Choose your level and topics: get a fresh set of questions, marked straight away with results and feedback. Make your own revision questions and flashcards too.') + '</p></div>' +
      '<nav class="pr-tabs" role="tablist"><button type="button" role="tab" data-t="gen">🎯 ' + (TEACH ? 'Generate from topics' : 'Practice questions') + '</button><button type="button" role="tab" data-t="mine">🃏 My revision questions</button>' + (TEACH ? '' : '<button type="button" role="tab" data-t="results">📈 My results</button>') + '</nav><div id="pane"></div>';
    app.querySelectorAll('[data-t]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-t') === TAB); b.onclick = function () { TAB = b.getAttribute('data-t'); history.replaceState(null, '', '#' + TAB); frame(); }; });
    var p = app.querySelector('#pane');
    ({ gen: generator, mine: mySets, results: results }[TAB] || generator)(p);
  }

  /* ================================================================ 🎯 generator */
  function generator(p) {
    p.innerHTML = '<p class="muted">Loading your topics…</p>';
    S.db.rpc('practice_topics').then(function (r) {
      if (r.error) { p.innerHTML = fail(r.error); return; }
      var rows = r.data || [], by = {}, order = [];
      rows.forEach(function (t) { var g = t.course + (t.level ? ' · ' + t.level : ''); if (!by[g]) { by[g] = []; order.push(g); } by[g].push(t); });
      if (!order.length) { p.innerHTML = '<section class="panel"><p>' + (TEACH ? 'No topics with questions yet.' : 'No topics yet. Practice uses the questions of the courses you are in: join a class or course on <a href="/dashboard/">your dashboard</a>.') + '</p></section>'; return; }
      var last = store('level'), pick = Math.max(0, order.indexOf(last));
      p.innerHTML = '<section class="panel grp"><h3>1. Your course and level</h3><div class="pr-chips" role="radiogroup">' + order.map(function (g, i) { return '<label><input type="radio" name="lv" value="' + i + '"' + (i === pick ? ' checked' : '') + '>' + E(g) + '</label>'; }).join('') + '</div>' +
        '<h3>2. Topics <button type="button" class="btn sm" id="all">Tick all</button></h3><div class="pr-topics" id="tp"></div>' +
        '<h3>3. Your set</h3><div class="row2" style="flex-wrap:wrap;gap:14px;align-items:flex-start"><div><b>Questions</b><div class="pr-chips">' + [5, 10, 15, 20].map(function (n) { return '<label><input type="radio" name="n" value="' + n + '"' + (n === (store('n') || 10) ? ' checked' : '') + '>' + n + '</label>'; }).join('') + '</div></div>' +
        '<div><b>Type</b><div class="pr-chips">' + LEVEL_TYPES.map(function (k, i) { return '<label><input type="radio" name="ty" value="' + k[0] + '"' + (i === 0 ? ' checked' : '') + '>' + k[1] + '</label>'; }).join('') + '</div></div></div>' +
        (TEACH ? '<label class="f" style="margin-top:10px">Title (optional)<input id="ttl" placeholder="e.g. Cells and transport: revision questions"></label>' : '') +
        '<p class="msg" id="m" role="status"></p><div class="acts"><button class="btn main" type="button" id="go" style="font-size:1.1rem;padding:12px 22px">' + (TEACH ? '🎲 Generate a draft' : '🚀 Make my practice set') + '</button></div>' +
        '<p class="small muted">' + (TEACH ? 'The questions are copied with their answer keys into a new draft in <a href="/build/">My assessments and lessons</a>, ready to edit, preview, save and set.' : 'Questions you had in the last three weeks come last, so each set is fresh. Choice and fill-in answers are marked at once; written answers get detailed feedback.') + '</p></section>';
      var tp = p.querySelector('#tp');
      function topics() { var g = order[+p.querySelector('[name=lv]:checked').value]; store('level', g); tp.innerHTML = by[g].map(function (t) { return '<label class="pr-topic"><input type="checkbox" value="' + t.topic_id + '"><span>' + E(t.topic) + ' <span class="small muted">(' + t.n + ')</span></span></label>'; }).join(''); }
      p.querySelectorAll('[name=lv]').forEach(function (x) { x.onchange = topics; }); topics();
      p.querySelector('#all').onclick = function () { var cs = tp.querySelectorAll('input'), all = [].every.call(cs, function (c) { return c.checked; }); cs.forEach(function (c) { c.checked = !all; }); this.textContent = all ? 'Tick all' : 'Untick all'; };
      p.querySelector('#go').onclick = function () {
        var ids = [].map.call(tp.querySelectorAll('input:checked'), function (c) { return c.value; }), m = p.querySelector('#m'), b = this;
        if (!ids.length) { m.textContent = 'Tick at least one topic.'; return; }
        var n = +p.querySelector('[name=n]:checked').value, ty = p.querySelector('[name=ty]:checked').value; store('n', n);
        b.disabled = true; b.textContent = 'Making your set…'; m.textContent = '';
        S.db.rpc('practice_make', { topic_ids: ids, n: n, kinds: ty === 'quick' ? QUICK : ty ? [ty] : null, set_title: TEACH ? (p.querySelector('#ttl').value.trim() || null) : null }).then(function (r) {
          if (r.error) throw r.error; location.href = TEACH ? '/build/#edit/' + r.data : '/quizzes/#' + r.data;
        }).catch(function (e) { b.disabled = false; b.textContent = TEACH ? '🎲 Generate a draft' : '🚀 Make my practice set'; m.innerHTML = need039(e) ? fail(e) : '⚠ ' + E(S.nice(e)); });
      };
    });
  }

  /* ================================================================ 📈 results */
  function results(p) {
    p.innerHTML = '<p class="muted">Loading your results…</p>';
    S.db.rpc('my_practice').then(function (r) {
      if (r.error) { p.innerHTML = fail(r.error); return; }
      var rows = r.data || [];
      if (!rows.length) { p.innerHTML = '<section class="panel"><p>No practice sets yet. <a href="#gen" id="mk">Make your first one</a>.</p></section>'; p.querySelector('#mk').onclick = function (e) { e.preventDefault(); TAB = 'gen'; frame(); }; return; }
      var done = rows.filter(function (x) { return x.best != null && x.max_score; }), avg = done.length ? Math.round(done.reduce(function (a, x) { return a + 100 * x.best / x.max_score; }, 0) / done.length) : null;
      p.innerHTML = '<section class="panel"><div class="row2" style="gap:16px;flex-wrap:wrap"><div><span class="small muted">Sets made</span><div class="pr-big">' + rows.length + '</div></div><div><span class="small muted">Handed in</span><div class="pr-big">' + done.length + '</div></div><div><span class="small muted">Average best score</span><div class="pr-big" style="color:' + col(avg) + '">' + (avg == null ? '–' : avg + '%') + '</div></div></div></section>' +
        '<div class="pr-grid">' + rows.map(function (x) { var pc = x.best != null && x.max_score ? Math.round(100 * x.best / x.max_score) : null;
          return '<article class="pr-card" style="--k:' + col(pc) + '"><h4>' + E(x.title) + '</h4><span class="small muted">' + new Date(x.made).toLocaleDateString() + ' · ' + x.questions + ' questions · ' + x.tries + ' of 3 tries</span>' +
            (pc == null ? '<span class="small">' + (x.open_try ? '⏳ Started, not handed in yet' : 'Not tried yet') + '</span>' : '<div><b>' + pc + '%</b> best (' + (+x.best) + ' of ' + (+x.max_score) + ')<div class="pr-bar"><i style="width:' + pc + '%;background:' + col(pc) + '"></i></div></div>') +
            '<div class="acts"><a class="btn sm main" href="/quizzes/#' + x.id + '">' + (pc == null ? (x.open_try ? '▶ Carry on' : '▶ Start') : x.tries < 3 ? '🔁 Try again or see feedback' : '📋 See feedback') + '</a></div></article>'; }).join('') + '</div>';
    });
  }
  function col(pc) { return pc == null ? '#94a3b8' : pc >= 80 ? '#16a34a' : pc >= 50 ? '#d97706' : '#dc2626'; }

  /* ================================================================ 🃏 my revision questions */
  var SET = null, SEL = 0;
  function mySets(p) {
    p.innerHTML = '<p class="muted">Loading your revision questions…</p>';
    S.db.from('revision_sets').select('id,title,subject,class_id,shared,owner,items,updated_at').order('updated_at', { ascending: false }).then(function (r) {
      if (r.error) { p.innerHTML = fail(r.error); return; }
      var mine = (r.data || []).filter(function (x) { return x.owner === ME.user.id; }), shared = (r.data || []).filter(function (x) { return x.owner !== ME.user.id; });
      var card = function (x, own) { var best = store('best-' + x.id);
        return '<article class="pr-card" style="--k:' + (own ? '#7c3aed' : '#0ea5e9') + '"><h4>' + E(x.title) + '</h4><span class="small muted">' + (x.items || []).length + ' questions' + (x.subject ? ' · ' + E(x.subject) : '') + (x.shared ? ' · 👥 shared with ' + E(className(x.class_id)) : '') + (best != null ? ' · best ' + best + '%' : '') + '</span>' +
          '<div class="acts"><button class="btn sm main" type="button" data-play="' + x.id + '">▶ Practise</button>' + (own ? '<button class="btn sm" type="button" data-ed="' + x.id + '">✎ Edit</button><button class="btn sm" type="button" data-rm="' + x.id + '" style="color:#b91c1c">🗑</button>' : TEACH ? '<button class="btn sm" type="button" data-rm="' + x.id + '" style="color:#b91c1c" title="Take down this shared set">🗑</button>' : '') + '</div></article>'; };
      p.innerHTML = '<div class="acts" style="margin-bottom:10px"><button class="btn main" type="button" id="new">＋ New set of questions</button><button class="btn" type="button" id="ai" style="background:linear-gradient(120deg,#7c3aed,#db2777);color:#fff;border-color:transparent">✨ Make them from my notes</button></div>' +
        (mine.length ? '<h3>My sets</h3><div class="pr-grid">' + mine.map(function (x) { return card(x, true); }).join('') + '</div>' : '<section class="panel tint"><p>Write your own questions and flashcards to revise: they can have pictures, graphs, drawings, audio and video. Practise them as flashcards, a quiz or a 60-second speed round, and share them with your class.</p></section>') +
        (shared.length ? '<h3>👥 Shared in my classes</h3><div class="pr-grid">' + shared.map(function (x) { return card(x, false); }).join('') + '</div>' : '');
      var all = {}; (r.data || []).forEach(function (x) { all[x.id] = x; });
      p.querySelector('#new').onclick = function () { SET = { id: null, title: '', subject: '', class_id: null, shared: false, items: [newItem('card')] }; SEL = 0; editor(p); };
      p.querySelector('#ai').onclick = function () { fromNotes(p); };
      p.querySelectorAll('[data-play]').forEach(function (b) { b.onclick = function () { play(p, all[b.getAttribute('data-play')]); }; });
      p.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { SET = JSON.parse(JSON.stringify(all[b.getAttribute('data-ed')])); SEL = 0; editor(p); }; });
      p.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { if (!confirm('Delete "' + all[b.getAttribute('data-rm')].title + '"? This cannot be undone.')) return; S.db.from('revision_sets').delete().eq('id', b.getAttribute('data-rm')).then(function () { mySets(p); }); }; });
    });
  }
  function className(id) { var c = (ME.classes || []).filter(function (x) { return (x.id || x.class_id) === id; })[0]; return c ? c.name || c.class_name || 'my class' : 'my class'; }
  function newItem(k) { var it = { k: k, q: '', a: '', o: k === 'mcq' ? ['', '', '', ''] : k === 'tf' ? ['True', 'False'] : [], c: 0, m: [] }; if (QT && QT.has(k)) it.d = QT.blank(k); return it; }

  function editor(p) {
    var it = SET.items[SEL], k = KN[it.k] || KN.card, classes = ME.classes || [];
    p.innerHTML = '<div class="row2"><h3 style="margin:0">' + (SET.id ? '✎ Edit' : '＋ New') + ' revision set</h3><div class="acts"><button class="btn" type="button" id="try">▶ Try it</button><button class="btn main" type="button" id="save">💾 Save</button><button class="btn" type="button" id="back">Back</button></div></div>' +
      '<section class="panel"><div class="row2" style="gap:12px;flex-wrap:wrap"><label class="f" style="flex:2">Title<input id="s-t" value="' + E(SET.title) + '" placeholder="e.g. Photosynthesis key words"></label><label class="f">Subject<input id="s-s" value="' + E(SET.subject || '') + '" placeholder="e.g. Biology"></label>' +
      '<label class="f">Share with<select id="s-c"><option value="">Only me</option>' + classes.map(function (c) { var id = c.id || c.class_id; return '<option value="' + id + '"' + (SET.shared && SET.class_id === id ? ' selected' : '') + '>👥 ' + E(c.name || c.class_name || 'My class') + '</option>'; }).join('') + '</select></label></div></section>' +
      '<div class="pr-ed"><aside><div class="pr-items" id="its"></div><h4>＋ Add</h4><div class="pr-chips">' + KINDS.map(function (x) { return '<button type="button" class="btn sm" data-add="' + x[0] + '">' + x[1] + ' ' + x[2] + '</button>'; }).join('') + '</div></aside><section class="panel" id="ed"></section></div><p class="msg" id="sm" role="status"></p>';
    p.querySelector('#s-t').oninput = function () { SET.title = this.value; }; p.querySelector('#s-s').oninput = function () { SET.subject = this.value; };
    p.querySelector('#s-c').onchange = function () { SET.class_id = this.value || null; SET.shared = !!this.value; };
    p.querySelector('#back').onclick = function () { mySets(p); };
    p.querySelector('#try').onclick = function () { var bad = check(); if (bad) { p.querySelector('#sm').textContent = bad; return; } play(p, SET, true); };
    p.querySelector('#save').onclick = function () { save(p); };
    p.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function () { SET.items.push(newItem(b.getAttribute('data-add'))); SEL = SET.items.length - 1; editor(p); }; });
    var its = p.querySelector('#its');
    its.innerHTML = SET.items.map(function (x, i) { return '<button type="button" data-i="' + i + '" aria-current="' + (i === SEL) + '">' + (KN[x.k] || KN.card)[1] + ' ' + (i + 1) + '. ' + E((T ? T.text(x.q) : x.q).slice(0, 50) || '(empty)') + '</button>'; }).join('');
    its.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { SEL = +b.getAttribute('data-i'); editor(p); }; });
    var ed = p.querySelector('#ed'), card = it.k === 'card';
    ed.innerHTML = '<div class="row2"><b>' + k[1] + ' ' + k[2] + '</b><div class="acts"><button type="button" class="btn sm" id="dup">⧉ Copy</button><button type="button" class="btn sm" id="del" style="color:#b91c1c">🗑 Remove</button></div></div>' +
      '<label class="f">' + (card ? 'Front: a word, question or picture' : 'Question') + '<textarea id="i-q" rows="3">' + E(it.q) + '</textarea></label>' +
      '<div class="f"><span class="small"><b>Pictures, graphs, drawings, audio, video</b></span><div id="i-m"></div></div>' +
      (card ? '<label class="f">Back: the answer or meaning<textarea id="i-a" rows="3">' + E(it.a) + '</textarea></label>' : '') +
      (it.k === 'mcq' || it.k === 'tf' ? '<fieldset><legend>Choices: tick the correct one</legend>' + it.o.map(function (o, j) { return '<div class="row2" style="gap:6px;margin:4px 0"><input type="radio" name="ok" value="' + j + '"' + (it.c === j ? ' checked' : '') + ' aria-label="Correct choice"><input type="text" data-o="' + j + '" value="' + E(o) + '"' + (it.k === 'tf' ? ' readonly' : '') + ' style="flex:1"></div>'; }).join('') + '</fieldset>' : '') +
      (it.k === 'short' ? '<label class="f">Model answer (shown after you answer, you mark yourself)<textarea id="i-a" rows="3">' + E(it.a) + '</textarea></label>' : '') +
      (it.k !== 'card' && it.k !== 'short' && it.k !== 'mcq' && it.k !== 'tf' ? '<div id="i-qt"></div><p class="small" id="i-pb" style="color:#b45309"></p>' : '') +
      (!card ? '<label class="f">Explanation (optional, shown after answering)<input id="i-x" value="' + E(it.x || '') + '"></label>' : '');
    ed.querySelector('#i-q').oninput = function () { it.q = this.value; };
    var ia = ed.querySelector('#i-a'); if (ia) ia.oninput = function () { it.a = this.value; };
    var ix = ed.querySelector('#i-x'); if (ix) ix.oninput = function () { it.x = this.value; };
    ed.querySelectorAll('[name=ok]').forEach(function (r) { r.onchange = function () { it.c = +r.value; }; });
    ed.querySelectorAll('[data-o]').forEach(function (t) { t.oninput = function () { it.o[+t.getAttribute('data-o')] = t.value; }; });
    if (window.BVM) BVM.editor(ed.querySelector('#i-m'), it.m = it.m || [], function () {}, { uid: ME.user.id });
    var qt = ed.querySelector('#i-qt'); if (qt && QT) { var pb = function () { ed.querySelector('#i-pb').textContent = QT.problems(it.k, it.d).join(' '); }; qt.appendChild(QT.editor(it.k, it.d, pb)); pb(); }
    ed.querySelector('#dup').onclick = function () { SET.items.splice(SEL + 1, 0, JSON.parse(JSON.stringify(it))); SEL++; editor(p); };
    ed.querySelector('#del').onclick = function () { SET.items.splice(SEL, 1); if (!SET.items.length) SET.items.push(newItem('card')); SEL = Math.max(0, SEL - 1); editor(p); };
  }
  function check() {
    if (!SET.items.length) return 'Add at least one question.';
    for (var i = 0; i < SET.items.length; i++) { var it = SET.items[i], n = 'Question ' + (i + 1) + ': ';
      if (!String(it.q).trim() && !(it.m || []).length && it.k !== 'gaps') return n + 'write the question or add a picture.';
      if ((it.k === 'card' || it.k === 'short') && !String(it.a).trim()) return n + 'write the answer.';
      if (it.k === 'mcq' && it.o.filter(function (o) { return String(o).trim(); }).length < 2) return n + 'write at least two choices.';
      if (it.k === 'mcq' && !String(it.o[it.c] || '').trim()) return n + 'tick a correct choice that has text.';
      if (QT && QT.has(it.k) && QT.problems(it.k, it.d).length) return n + QT.problems(it.k, it.d)[0];
    }
    return '';
  }
  function save(p) {
    var m = p.querySelector('#sm'), bad = !SET.title.trim() ? 'Give the set a title.' : check(); if (bad) { m.textContent = bad; return; }
    var row = { title: SET.title.trim(), subject: (SET.subject || '').trim() || null, class_id: SET.shared ? SET.class_id : null, shared: !!SET.shared, items: SET.items.map(function (it) { if (it.k === 'mcq') { var keep = []; it.o.forEach(function (o, j) { if (String(o).trim() || j === it.c) keep.push(j); }); it.c = keep.indexOf(it.c); it.o = keep.map(function (j) { return it.o[j]; }); } return it; }) };
    m.textContent = 'Saving…';
    (SET.id ? S.db.from('revision_sets').update(row).eq('id', SET.id).select('id').single() : S.db.from('revision_sets').insert(row).select('id').single()).then(function (r) {
      if (r.error) { m.innerHTML = need039(r.error) ? fail(r.error) : '⚠ ' + E(S.nice(r.error)); return; }
      SET.id = r.data.id; m.textContent = '✅ Saved' + (row.shared ? ' and shared with ' + className(row.class_id) : '') + '.';
    });
  }

  /* ---- ✨ questions from notes (the same server function as the teachers' builder, with a smaller daily allowance) */
  function fromNotes(p) {
    var Q = window.BVQ;
    p.innerHTML = '<section class="panel grp"><h3>✨ Make revision questions from my notes</h3><p class="small muted">Upload your notes, slides or a worksheet, or paste text. You get questions with answers to check and edit before saving. Only the text is sent; the files stay on your device.</p>' +
      '<div class="row2" style="gap:12px;flex-wrap:wrap"><label class="f" style="flex:2">Topic<input id="n-t" placeholder="e.g. Enzymes"></label><label class="f">Level<select id="n-l">' + ['Grade 6 (MYP 1)', 'Grade 7 (MYP 2)', 'Grade 8 (MYP 3)', 'Grade 9 (MYP 4)', 'Grade 10 (MYP 5)', 'IGCSE Core', 'IGCSE Extended', 'AS Level', 'A Level', 'IB Diploma SL', 'IB Diploma HL'].map(function (l) { return '<option' + (store('nl') === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></label><label class="f">How many<select id="n-n"><option>6</option><option selected>10</option><option>15</option></select></label></div>' +
      '<label class="f">Notes file (PDF, Word, PowerPoint, text)<input id="n-f" type="file" accept=".pdf,.docx,.pptx,.txt,.md,.html,.htm,.rtf,.odt"></label><label class="f">…or paste your notes<textarea id="n-p" rows="6"></textarea></label>' +
      '<ol id="n-s" class="small"></ol><p class="msg" id="n-m" role="status"></p><div class="acts"><button class="btn main" type="button" id="n-go">✨ Make my questions</button><button class="btn" type="button" id="n-b">Back</button></div></section>';
    p.querySelector('#n-b').onclick = function () { mySets(p); };
    p.querySelector('#n-go').onclick = function () {
      var title = p.querySelector('#n-t').value.trim(), level = p.querySelector('#n-l').value, n = +p.querySelector('#n-n').value, f = p.querySelector('#n-f').files[0], pasted = p.querySelector('#n-p').value.trim(), m = p.querySelector('#n-m'), b = this, steps = p.querySelector('#n-s');
      if (!title && !f && !pasted) { m.textContent = 'Give a topic, a file or some notes.'; return; }
      store('nl', level); b.disabled = true; m.textContent = '';
      var step = function (t) { var li = document.createElement('li'); li.textContent = t; steps.appendChild(li); };
      (f && Q ? (step('Reading ' + f.name + '…'), Q.readFile(f).then(function (ls) { return ls.filter(function (l) { return !/^\[\[img:/.test(l); }).join('\n'); })) : Promise.resolve('')).then(function (txt) {
        var src = (txt + '\n' + pasted).trim(); step('Planning the questions…');
        return call({ mode: 'plan', kind: 'revision', title: title, level: level, objectives: '', source: src, count: n, types: ['mcq', 'tf', 'gaps', 'match', 'order', 'number', 'short'] }).then(function (d) {
          var want = []; d.plan.sections.forEach(function (s) { s.items.forEach(function (it) { if (it.kind !== 'info') want.push(Object.assign({ section: s.name }, it)); }); });
          var out = [], chain = Promise.resolve();
          for (var i = 0; i < want.length; i += 4) (function (batch, k) { chain = chain.then(function () { step('Writing questions ' + (k + 1) + '–' + (k + batch.length) + '…');
            return call({ mode: 'items', kind: 'revision', title: d.plan.title || title, level: level, objectives: '', source: src, items: batch, done: out.map(function (x) { return x.q.slice(0, 100); }) }).then(function (r) { r.items.forEach(function (it) { var x = it && fromAI(it); if (x) out.push(x); }); }, function () { step('One batch could not be written.'); }); }); })(want.slice(i, i + 4), i);
          return chain.then(function () { if (!out.length) throw new Error('No usable questions came back. Try again, or add more notes.'); SET = { id: null, title: d.plan.title || title || 'Revision questions', subject: '', class_id: null, shared: false, items: out }; SEL = 0; editor(p);
            var ms = p.querySelector('#sm'); if (ms) ms.textContent = '✨ ' + out.length + ' questions made. Check every answer, then save.'; });
        });
      }).catch(function (e) { b.disabled = false; m.textContent = '⚠ ' + (e.code === 'daily' ? e.message : e.message || S.nice(e)); });
    };
  }
  function call(body) {
    var tries = 0;
    function go() { return S.db.functions.invoke('build-draft', { body: body }).then(function (res) {
      var d = res.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = null; } }
      if ((!d || !d.ok) && res.error && res.error.context && res.error.context.json) return res.error.context.json().then(function (j) { throw Object.assign(new Error((j && j.error) || 'Could not be reached.'), { code: j && j.code }); });
      if (!d || !d.ok) throw Object.assign(new Error((d && d.error) || 'The question maker could not be reached. Try again in a minute.'), { code: d && d.code });
      return d; }).catch(function (e) { if ((e.code === 'busy' || e.code === 'down') && tries++ < 2) return new Promise(function (r) { setTimeout(r, 20000); }).then(go); throw e; }); }
    return go();
  }
  function fromAI(it) {
    var x = { k: it.kind, q: it.prompt || '', a: '', o: [], c: 0, m: [], x: it.explanation || '' };
    if (it.kind === 'mcq') { x.o = it.options.slice(); x.c = it.correct; }
    else if (it.kind === 'tf') { x.o = ['True', 'False']; x.c = it.answer ? 0 : 1; }
    else if (it.kind === 'gaps') x.d = { text: it.text };
    else if (it.kind === 'match') x.d = { pairs: it.pairs.map(function (p) { return { l: p[0], r: p[1] }; }) };
    else if (it.kind === 'order') x.d = { items: it.items.slice() };
    else if (it.kind === 'number') { x.d = { value: String(it.value), tol: it.tolerance ? String(it.tolerance) : '', unit: it.unit || '' }; x.x = it.model_answer || x.x; }
    else if (it.kind === 'short') { x.a = it.model_answer || (it.points || []).map(function (p) { return p.text; }).join('; '); if (!x.a) return null; }
    else return null;
    if (QT && QT.has(x.k) && QT.problems(x.k, x.d).length) return null;
    return x;
  }

  /* ================================================================ ▶ practise a set: flashcards, quiz, speed round */
  function play(p, set, trial) {
    var cards = set.items.filter(function (x) { return x.k === 'card'; }).length, quick = set.items.filter(function (x) { return x.k !== 'short'; }).length;
    p.innerHTML = '<section class="panel pr-play"><p class="label">' + E(set.title) + '</p><h3>How do you want to practise?</h3><div class="pr-grid">' +
      '<article class="pr-card" style="--k:#7c3aed"><h4>🃏 Flashcards</h4><p class="small">Flip each card. Cards you did not know come back until you do.</p><div class="acts"><button class="btn main sm" data-m="cards">Start</button></div></article>' +
      '<article class="pr-card" style="--k:#0ea5e9"><h4>📝 Quiz</h4><p class="small">One question at a time, checked at once, with the answer and explanation.</p><div class="acts"><button class="btn main sm" data-m="quiz">Start</button></div></article>' +
      '<article class="pr-card" style="--k:#db2777"><h4>⚡ Speed round</h4><p class="small">60 seconds: as many as you can. Beat your best score.</p><div class="acts"><button class="btn main sm" data-m="speed"' + (quick ? '' : ' disabled') + '>Start</button></div></article></div>' +
      '<div class="acts"><button class="btn" type="button" id="bk">' + (trial ? 'Back to editing' : 'Back') + '</button></div></section>';
    p.querySelector('#bk').onclick = function () { if (trial) editor(p); else mySets(p); };
    p.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { var m = b.getAttribute('data-m'); (m === 'cards' ? flash : m === 'speed' ? speed : quiz)(p, set, trial); }; });
    void cards;
  }
  function front(it) { return rich(T ? T.text(it.q) : it.q) + media(it.m); }
  function answerText(it) {
    if (it.k === 'card' || it.k === 'short') return it.a;
    if (it.k === 'mcq' || it.k === 'tf') return it.o[it.c];
    if (QT && QT.has(it.k)) return QT.pack(it.k, it.d).model;
    return '';
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function flash(p, set, trial) {
    var deck = shuffle(set.items), known = 0, total = deck.length, seen = 0;
    function next() {
      if (!deck.length) return finish(p, set, trial, known, total, 'flashcards');
      var it = deck[0]; seen++;
      p.innerHTML = '<section class="pr-play"><div class="row2"><span class="small muted">' + known + ' of ' + total + ' known</span><span class="small muted">Click the card to flip it</span></div><div class="pr-bar"><i style="width:' + Math.round(100 * known / total) + '%;background:#16a34a"></i></div>' +
        '<div class="pr-flip" id="fc" tabindex="0" role="button" aria-label="Flip the card"><div><div class="pr-face f">' + front(it) + '</div><div class="pr-face b"><div>' + rich(answerText(it)) + (it.x ? '<p class="small">' + E(it.x) + '</p>' : '') + '</div></div></div></div>' +
        '<div class="acts" style="justify-content:center;margin-top:14px"><button class="btn" type="button" id="again" style="border-color:#dc2626;color:#b91c1c">🔁 Not yet</button><button class="btn main" type="button" id="got">✅ I knew it</button></div><div class="acts"><button class="btn sm" type="button" id="stop">Stop</button></div></section>';
      var fc = p.querySelector('#fc'); fc.onclick = function () { fc.classList.toggle('on'); }; fc.onkeydown = function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fc.classList.toggle('on'); } }; fc.focus();
      p.querySelector('#got').onclick = function () { deck.shift(); known++; next(); };
      p.querySelector('#again').onclick = function () { deck.push(deck.shift()); next(); };
      p.querySelector('#stop').onclick = function () { finish(p, set, trial, known, total, 'flashcards'); };
    }
    next();
  }
  function quiz(p, set, trial) {
    var qs = shuffle(set.items), i = 0, got = 0, max = 0, missed = [];
    function next() {
      if (i >= qs.length) return finish(p, set, trial, got, max, 'quiz', missed);
      var it = qs[i], val = null;
      p.innerHTML = '<section class="panel pr-play"><div class="row2"><span class="small muted">Question ' + (i + 1) + ' of ' + qs.length + '</span><span class="small muted">Score ' + got + ' / ' + max + '</span></div><div class="pr-bar"><i style="width:' + Math.round(100 * i / qs.length) + '%;background:#4f46e5"></i></div>' +
        '<div style="margin:12px 0">' + front(it) + '</div><div id="ans"></div><div id="fb"></div><div class="acts"><button class="btn main" type="button" id="chk">Check</button><button class="btn" type="button" id="nx" hidden>Next ➜</button></div></section>';
      var ans = p.querySelector('#ans'), fb = p.querySelector('#fb');
      if (it.k === 'mcq' || it.k === 'tf') ans.innerHTML = shuffle(it.o.map(function (o, j) { return j; })).map(function (j) { return '<label class="pr-opt"><input type="radio" name="a" value="' + j + '"> ' + E(it.o[j]) + '</label>'; }).join('');
      else if (it.k === 'card' || it.k === 'short') ans.innerHTML = '<textarea id="t" rows="3" style="width:100%;box-sizing:border-box" placeholder="Type your answer, then check"></textarea>';
      else if (QT && QT.has(it.k)) { var pk = QT.pack(it.k, it.d); ans.appendChild(QT.student(it.k, pk.options, '', function (v) { val = v; })); }
      p.querySelector('#chk').onclick = function () {
        this.hidden = true; p.querySelector('#nx').hidden = false;
        if (it.k === 'mcq' || it.k === 'tf') { var c = p.querySelector('[name=a]:checked'), ok = c && +c.value === it.c; max++; if (ok) got++; else missed.push(it);
          ans.querySelectorAll('.pr-opt').forEach(function (l) { var v = +l.querySelector('input').value; l.querySelector('input').disabled = true; if (v === it.c) l.classList.add('ok'); else if (c && v === +c.value) l.classList.add('no'); });
          fb.innerHTML = '<div class="pr-fb ' + (ok ? 'good">✅ Correct!' : 'bad">❌ Not quite. The answer: ' + E(it.o[it.c])) + (it.x ? '<br><span style="font-weight:400">' + E(it.x) + '</span>' : '') + '</div>'; }
        else if (it.k === 'card' || it.k === 'short') { var mine = p.querySelector('#t').value.trim(); p.querySelector('#t').disabled = true;
          fb.innerHTML = '<div class="pr-fb part">Model answer: ' + E(it.a) + (it.x ? '<br><span style="font-weight:400">' + E(it.x) + '</span>' : '') + '</div><p>Were you right?</p><div class="acts"><button class="btn main sm" type="button" data-s="1">✅ Yes</button><button class="btn sm" type="button" data-s="0">❌ No</button></div>';
          p.querySelector('#nx').hidden = true; void mine;
          fb.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { max++; if (b.getAttribute('data-s') === '1') got++; else missed.push(it); i++; next(); }; }); }
        else { var pk2 = QT.pack(it.k, it.d), sc = QT.score(it.k, pk2.options, pk2.accepted, val, 1); max++; got += sc.got; if (sc.got < 1) missed.push(it);
          ans.querySelectorAll('input,select,button').forEach(function (x) { x.disabled = true; });
          fb.innerHTML = '<div class="pr-fb ' + (sc.got >= 1 ? 'good">✅ All correct!' : sc.hit ? 'part">🟡 ' + sc.hit + ' of ' + sc.of + ' right. The answer: ' + E(pk2.model) : 'bad">❌ Not quite. The answer: ' + E(pk2.model)) + (it.x ? '<br><span style="font-weight:400">' + E(it.x) + '</span>' : '') + '</div>'; }
      };
      p.querySelector('#nx').onclick = function () { i++; next(); };
    }
    next();
  }
  function speed(p, set, trial) {
    var pool = set.items.filter(function (x) { return x.k !== 'short'; }), score = 0, done = 0, end = Date.now() + 60000, timer, missed = [];
    function next() {
      if (Date.now() >= end) return over();
      if (!pool.length) pool = set.items.filter(function (x) { return x.k !== 'short'; });
      var it = shuffle(pool)[0], val = null;
      p.innerHTML = '<section class="panel pr-play"><div class="row2"><span class="pr-timer" id="tm"></span><span class="pr-big" style="font-size:1.6rem">⚡ ' + score + '</span></div><div style="margin:10px 0">' + front(it) + '</div><div id="ans"></div><p id="fl" class="small"></p></section>';
      var ans = p.querySelector('#ans');
      var mark = function (ok) { done++; if (ok) score++; else missed.push(it); p.querySelector('#fl').textContent = ok ? '✅' : '❌ ' + answerText(it); setTimeout(next, ok ? 250 : 1100); };
      if (it.k === 'mcq' || it.k === 'tf') { ans.innerHTML = shuffle(it.o.map(function (o, j) { return j; })).map(function (j) { return '<button type="button" class="pr-opt" style="width:100%;text-align:left;font:inherit" data-j="' + j + '">' + E(it.o[j]) + '</button>'; }).join(''); ans.querySelectorAll('[data-j]').forEach(function (b) { b.onclick = function () { ans.querySelectorAll('button').forEach(function (x) { x.disabled = true; }); b.classList.add(+b.getAttribute('data-j') === it.c ? 'ok' : 'no'); mark(+b.getAttribute('data-j') === it.c); }; }); }
      else if (it.k === 'card') { ans.innerHTML = '<div class="acts"><button class="btn sm" type="button" id="sh">Show the answer</button></div>'; p.querySelector('#sh').onclick = function () { ans.innerHTML = '<div class="pr-fb part">' + E(it.a) + '</div><div class="acts"><button class="btn main sm" data-k="1">✅ Knew it</button><button class="btn sm" data-k="0">❌ Did not</button></div>'; ans.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { mark(b.getAttribute('data-k') === '1'); }; }); }; }
      else { var pk = QT.pack(it.k, it.d); ans.appendChild(QT.student(it.k, pk.options, '', function (v) { val = v; })); var bt = document.createElement('button'); bt.className = 'btn main sm'; bt.type = 'button'; bt.textContent = 'Check'; bt.style.marginTop = '8px'; ans.appendChild(bt); bt.onclick = function () { bt.disabled = true; mark(QT.score(it.k, pk.options, pk.accepted, val, 1).got >= 1); }; }
      tick();
    }
    function tick() { var s = Math.max(0, Math.ceil((end - Date.now()) / 1000)), el = p.querySelector('#tm'); if (el) el.textContent = '⏱ ' + s + ' s'; }
    function over() { clearInterval(timer); finish(p, set, trial, score, done, 'speed', missed); }
    timer = setInterval(function () { tick(); if (Date.now() >= end) over(); }, 250);
    next();
  }
  function finish(p, set, trial, got, max, mode, missed) {
    var pc = max ? Math.round(100 * got / max) : 0, key = 'best-' + (set.id || 'trial') + (mode === 'speed' ? '-speed' : ''), best = store(key), val = mode === 'speed' ? got : pc, newBest = best == null || val > best;
    if (newBest && set.id) store(key, val);
    p.innerHTML = '<section class="panel pr-play" style="text-align:center"><p class="label">' + E(set.title) + '</p><h3>' + (mode === 'speed' ? '⚡ Time!' : pc >= 80 ? '🌟 Brilliant!' : pc >= 50 ? '👍 Good work!' : '💪 Keep going!') + '</h3>' +
      '<div class="pr-big" style="color:' + col(mode === 'speed' ? 80 : pc) + '">' + (mode === 'speed' ? got + ' right' : mode === 'flashcards' ? got + ' of ' + max + ' known' : got + ' / ' + max + ' (' + pc + '%)') + '</div>' +
      (set.id && newBest && best != null ? '<p>🏆 New best! (before: ' + best + (mode === 'speed' ? '' : '%') + ')</p>' : best != null ? '<p class="small muted">Your best: ' + best + (mode === 'speed' ? ' right' : '%') + '</p>' : '') +
      (missed && missed.length ? '<p>' + missed.length + ' to revise again.</p>' : '') +
      '<div class="acts" style="justify-content:center">' + (missed && missed.length ? '<button class="btn main" type="button" id="miss">🔁 Practise the ones I missed</button>' : '') + '<button class="btn" type="button" id="again">Play again</button><button class="btn" type="button" id="bk">' + (trial ? 'Back to editing' : 'Back to my sets') + '</button></div></section>';
    var ms = p.querySelector('#miss'); if (ms) ms.onclick = function () { quiz(p, { id: null, title: set.title + ' · to revise', items: missed }, trial); };
    p.querySelector('#again').onclick = function () { play(p, set, trial); };
    p.querySelector('#bk').onclick = function () { if (trial) editor(p); else mySets(p); };
  }
})();
