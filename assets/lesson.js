/* Interactive lesson player · BioScience Vista
   Six inquiry steps; read or listen; answer by typing or writing by hand; work is saved as you go; teacher checks and releases marks. */
(function () {
  var S = window.BVS, E = S.E, app = document.getElementById('app'), ME, Q, ATT, items = [], ans = {}, step = 0, lessonRow = null, preview = false, dirty = false;
  var KEYS = {}, REVEALED = {}, REP = { sec: null, ans: {}, n: 0, saved: false };   // answers shown per step; repeat of a step after its answers
  var STEPS = ['Question', 'Explore', 'Test', 'Explain', 'Challenge', 'Reflect'];
  var ICON = { Question: '❓', Explore: '🔍', Test: '🧪', Explain: '💬', Challenge: '🏔', Reflect: '🪞' };
  var id = location.hash.slice(1);
  if (!id) { app.innerHTML = '<p class="emptybox">Open a lesson from the <a href="/learn/">Learning centre</a> or your dashboard.</p>'; return; }
  S.guard(app).then(function (me) { ME = me; return load(); }).catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });
  window.addEventListener('beforeunload', function (e) { if (dirty) { saveLocal(); } });

  function key() { return 'bvl-' + id; }
  function saveLocal() { try { localStorage.setItem(key(), JSON.stringify({ ans: ans, step: step })); } catch (e) {} }
  function load() {
    return S.db.from('quizzes').select('id,title,instructions,category,show_results,published').eq('id', id).maybeSingle().then(function (r) {
      Q = r.data; if (!Q || Q.category !== 'lesson') throw new Error('This lesson is not available. It may not be set for your class yet.');
      S.db.from('lessons').select('id').eq('external_id', 'IL-' + id).maybeSingle().then(function (l) { lessonRow = l.data; });
      if (ME.staff) { preview = true; return S.db.from('quiz_questions').select('position, questions(id,kind,prompt,options,marks,image_url,section)').eq('quiz_id', id).order('position')
        .then(function (x) { items = (x.data || []).map(function (z) { var o = z.questions; return { question_id: o.id, kind: o.kind, prompt: o.prompt, options: o.options, marks: o.marks, image_url: o.image_url, section: o.section }; });
          var ids = items.map(function (z) { return z.question_id; });
          return (ids.length ? S.db.from('question_answers').select('question_id,correct_option,model_answer,mark_scheme,explanation').in('question_id', ids) : Promise.resolve({ data: [] }))
            .then(function (k) { (k.data || []).forEach(function (a) { KEYS[a.question_id] = a; }); draw(); }); }); }
      return S.db.from('quiz_attempts').select('*').eq('quiz_id', id).eq('student_id', ME.user.id).order('started_at', { ascending: false }).limit(1).then(function (a) {
        var last = (a.data || [])[0];
        if (last && last.status !== 'in_progress') { ATT = last; return paper().then(done); }
        return S.db.rpc('start_quiz', { qid: id }).then(function (s) {
          if (s.error) throw s.error;
          return S.db.from('quiz_attempts').select('*').eq('id', s.data).single().then(function (x) { ATT = x.data; ans = Object.assign({}, ATT.answers || {});
            try { var loc = JSON.parse(localStorage.getItem(key()) || 'null'); if (loc) { Object.keys(loc.ans || {}).forEach(function (k) { if (ans[k] == null || ans[k] === '') ans[k] = loc.ans[k]; }); step = loc.step || 0; } } catch (e) {}
            (ATT.revealed || []).forEach(function (sc) { REVEALED[sc] = true; });
            return paper().then(function () { return Promise.all(Object.keys(REVEALED).map(function (sc) { return S.db.rpc('step_answers', { attempt: ATT.id, sec: sc }).then(function (r) { (r.data || []).forEach(function (a) { KEYS[a.question_id] = a; }); }); })); }).then(draw); });
        });
      });
    });
  }
  function paper() { return S.db.rpc('quiz_paper', { attempt: ATT.id }).then(function (r) { if (r.error) throw r.error; items = r.data || []; }); }
  function steps() { return STEPS.filter(function (st) { return items.some(function (x) { return (x.section || 'Explore') === st; }); }); }
  function isPic(v) { return /^data:image\//.test(v || ''); }

  /* text with **bold**, bullet lines, links; YouTube links become a video */
  function rich(t) {
    return String(t || '').split(/\n{2,}/).map(function (para) {
      var lines = para.split('\n');
      var yt = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})\S*$/.exec(para.trim());
      if (yt) return '<div class="vids"><iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '" title="Lesson video" loading="lazy" allowfullscreen></iframe></div>';
      if (/^https?:\/\/\S+$/.test(para.trim())) return '<p><a class="btn sm" href="' + E(para.trim()) + '" target="_blank" rel="noopener">Open ' + (/phet|simulation|lab/i.test(para) ? 'the simulation' : 'the link') + ' ↗</a></p>';
      var fmt = function (s) { return E(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); };
      if (lines.every(function (l) { return /^\s*[•\-\*]\s+/.test(l); })) return '<ul>' + lines.map(function (l) { return '<li>' + fmt(l.replace(/^\s*[•\-\*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      return lines.map(function (l) { return /^\s*[•\-\*]\s+/.test(l) ? '<p class="bul">• ' + fmt(l.replace(/^\s*[•\-\*]\s+/, '')) + '</p>' : '<p>' + fmt(l) + '</p>'; }).join('');
    }).join('');
  }
  function speak(text, btn) {
    if (!window.speechSynthesis) return;
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.textContent = '🔊 Listen'; return; }
    var u = new SpeechSynthesisUtterance(String(text).replace(/\*\*/g, '').replace(/https?:\/\/\S+/g, '')); u.rate = 0.95; u.lang = 'en-GB';
    u.onend = function () { btn.textContent = '🔊 Listen'; }; btn.textContent = '⏹ Stop'; speechSynthesis.speak(u);
  }

  function draw() {
    var st = steps(); if (step >= st.length) step = st.length - 1; if (step < 0) step = 0;
    var cur = st[step], mine = items.filter(function (x) { return (x.section || 'Explore') === cur; });
    var answered = function (s) { return items.filter(function (x) { return (x.section || 'Explore') === s && x.kind !== 'info'; }).every(function (x) { return ans[x.question_id] != null && ans[x.question_id] !== ''; }); };
    var n = 0; items.forEach(function (x, i) { if (x.kind !== 'info') x._n = ++n; });
    app.innerHTML = (preview ? '<p class="panel tint small">Teacher preview: this is what students see. Answers are not saved in preview. <a href="/staff/#lessons/' + id + '">Edit this lesson</a></p>' : '') +
      '<section class="panel lesson-head"><p class="label">Interactive lesson</p><h2>' + E(Q.title) + '</h2>' + (Q.instructions && step === 0 ? '<div class="small"><b>Objectives</b>' + rich(Q.instructions.split('\n').map(function (o) { return '• ' + o; }).join('\n')) + '</div>' : '') + '</section>' +
      '<nav class="lsteps" aria-label="Lesson steps">' + st.map(function (s, k) { return '<button type="button" data-go="' + k + '" aria-current="' + (k === step) + '"' + '><span>' + ICON[s] + '</span> ' + (k + 1) + '. ' + s + (answered(s) && !preview ? ' ✓' : '') + '</button>'; }).join('') + '</nav>' +
      '<div class="bar"><i style="width:' + Math.round(100 * (step + 1) / st.length) + '%"></i></div>' +
      '<section class="grp" id="stepbox"><h3 class="sec-h">' + ICON[cur] + ' Step ' + (step + 1) + ': ' + cur + (REVEALED[cur] && !preview ? ' <span class="pill ok-t">Answers shown</span>' : '') + '</h3>' +
      (preview ? '<p class="panel tint small">👩‍🏫 <b>Teacher view:</b> the answer for every question is shown below it. Students see these after they finish this step.</p>' : '') +
      (inRepeat(cur) ? '<p class="panel tint rep-banner">↻ <b>Repeat ' + REP.n + ' of this step.</b> Answer again without looking. Your first answers stay as the ones that count; this repeat is saved and labelled <b>Repeat ' + REP.n + '</b> for your teacher.</p>' : REVEALED[cur] && !preview && hasQs(cur) ? '<p class="small muted">Your first answers for this step are locked (they count). Press <b>↻ Repeat this step</b> to practise it again.</p>' : '') +
      mine.map(block).join('') + stepActs(cur) + '</section>' +
      '<div class="acts lnav"><button class="btn" type="button" id="prev"' + (step === 0 ? ' disabled' : '') + '>← Back</button>' + (preview ? '' : '<button class="btn" type="button" id="save">💾 Save my work</button>') +
      (step < st.length - 1 ? '<button class="btn main" type="button" id="next">Next step →</button>' : (preview ? '' : '<button class="btn main" type="button" id="hand">✓ Hand in my lesson</button>')) + '</div><p class="msg" id="lm" role="status"></p>';
    wire();
  }
  function hasQs(sc) { return items.some(function (x) { return (x.section || 'Explore') === sc && x.kind !== 'info'; }); }
  function inRepeat(sc) { return REP.sec === sc; }
  function stepActs(sc) {
    if (preview || !hasQs(sc)) return '';
    if (inRepeat(sc)) return '<div class="acts">' + (REP.saved ? '<button class="btn sm" type="button" id="repagain">↻ Repeat again</button><button class="btn sm" type="button" id="repend">Back to my answers</button>' : '<button class="btn main sm" type="button" id="repsave">✓ Save Repeat ' + REP.n + ' and check</button><button class="btn sm" type="button" id="repend">Cancel repeat</button>') + '</div>';
    if (REVEALED[sc]) return '<div class="acts"><button class="btn sm" type="button" id="repeat">↻ Repeat this step</button></div>';
    return '<div class="acts"><button class="btn main sm" type="button" id="finish">✓ Finish this step and see the answers</button></div>';
  }
  function ansBox(x) {   // the answer, shown to teachers always and to students once the step is finished
    var k = KEYS[x.question_id], cur = steps()[step]; if (!k || x.kind === 'info') return '';
    if (!preview && !REVEALED[x.section || 'Explore']) return '';
    if (inRepeat(cur) && !REP.saved) return '';
    var body = '';
    if ((x.kind === 'mcq' || x.kind === 'tf') && k.correct_option != null) {
      var mine = inRepeat(cur) ? REP.ans[x.question_id] : ans[x.question_id];
      body = '<p><b>Correct answer:</b> ' + E((x.options || [])[k.correct_option] || '') + (!preview && mine != null && mine !== '' ? (String(mine) === String(k.correct_option) ? ' <span class="ok-t">✓ you chose this</span>' : ' <span class="bad-t">✗ you chose ' + E((x.options || [])[mine] || '') + '</span>') : '') + '</p>';
    }
    if (k.model_answer) body += '<p><b>Model answer:</b> ' + E(k.model_answer) + '</p>';
    if (k.mark_scheme) body += '<div><b>Mark scheme</b><ul>' + String(k.mark_scheme).split(/\n+/).filter(function (l) { return l.trim(); }).map(function (l) { return '<li>' + E(l.replace(/^\s*[•\-\*]\s*/, '')) + '</li>'; }).join('') + '</ul></div>';
    if (k.explanation) body += '<p class="small">' + E(k.explanation) + '</p>';
    if (!body) return '';
    return '<div class="ansbox' + (preview ? ' tview' : '') + '"><h4>' + (preview ? '👩‍🏫 Teacher view · answer' : inRepeat(cur) ? 'Check Repeat ' + REP.n : 'Answer') + '</h4>' + body + '</div>';
  }
  function block(x) {
    if (x.kind === 'info') return '<article class="panel lread">' + (x.image_url ? '<img src="' + E(x.image_url) + '" alt="" loading="lazy" class="limg">' : '') + rich(x.prompt) +
      (window.speechSynthesis ? '<button type="button" class="btn sm" data-say="' + x.question_id + '">🔊 Listen</button>' : '') + '</article>';
    var qid = x.question_id, sc = x.section || 'Explore', rp = inRepeat(sc), v = rp ? REP.ans[qid] : ans[qid], lock = !preview && REVEALED[sc] && !rp || (rp && REP.saved);
    var head = '<p><b>' + x._n + '.</b> ' + rich(x.prompt).replace(/^<p>|<\/p>$/g, '') + (x.marks ? ' <span class="pill">' + x.marks + ' mark' + (x.marks > 1 ? 's' : '') + '</span>' : '') +
      (window.speechSynthesis ? ' <button type="button" class="btn sm" data-say="' + qid + '" aria-label="Read the question aloud">🔊</button>' : '') + '</p>' + (x.image_url ? '<img src="' + E(x.image_url) + '" alt="" loading="lazy" class="limg">' : '');
    if (x.kind === 'mcq' || x.kind === 'tf') return '<fieldset class="q" data-q="' + qid + '"><legend class="sr">Question ' + x._n + '</legend>' + head + (x.options || []).map(function (o, j) {
      return '<label class="opt"><input type="radio" name="q' + qid + '" value="' + j + '"' + (String(v) === String(j) ? ' checked' : '') + (lock ? ' disabled' : '') + '> ' + E(o) + '</label>'; }).join('') + '</fieldset>' + ansBox(x);
    var pic = isPic(v);
    return '<div class="q' + (lock ? ' locked' : '') + '" data-q="' + qid + '"' + (lock ? ' data-locked="1"' : '') + '>' + head +
      '<div class="mode" role="tablist"><button type="button" data-mode="type" aria-pressed="' + !pic + '">⌨ Type</button><button type="button" data-mode="write" aria-pressed="' + pic + '">✏️ Write by hand</button></div>' +
      '<textarea rows="' + (x.marks >= 5 ? 9 : x.marks >= 3 ? 6 : 3) + '" placeholder="Type your answer"' + (pic ? ' hidden' : '') + (lock ? ' readonly' : '') + '>' + E(pic ? '' : v || '') + '</textarea>' +
      '<div class="hwbox"' + (pic ? '' : ' hidden') + '><canvas class="hwpad" width="900" height="' + (x.marks >= 5 ? 420 : 300) + '" aria-label="Writing area"></canvas>' +
      '<div class="toolbar small"><button type="button" data-pen="#172033" aria-pressed="true">Pen</button><button type="button" data-pen="#2563eb">Blue</button><button type="button" data-pen="eraser">Eraser</button><button type="button" data-clear>Clear</button></div></div></div>' + ansBox(x);
  }
  function wire() {
    var st = steps();
    app.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { collect(); REP = { sec: null, ans: {}, n: 0, saved: false }; step = +b.getAttribute('data-go'); saveLocal(); draw(); window.scrollTo(0, 0); }; });
    var pv = app.querySelector('#prev'); if (pv) pv.onclick = function () { collect(); REP = { sec: null, ans: {}, n: 0, saved: false }; step--; saveLocal(); draw(); window.scrollTo(0, 0); };
    var nx = app.querySelector('#next'); if (nx) nx.onclick = function () { collect(); REP = { sec: null, ans: {}, n: 0, saved: false }; if (!preview) save(true); step++; saveLocal(); draw(); window.scrollTo(0, 0); };
    var sv = app.querySelector('#save'); if (sv) sv.onclick = function () { collect(); save(false); };
    var hd = app.querySelector('#hand'); if (hd) hd.onclick = function () { collect(); hand(hd); };
    var fin = app.querySelector('#finish'); if (fin) fin.onclick = function () { collect(); finish(fin); };
    var rpb = app.querySelector('#repeat'), rpa = app.querySelector('#repagain'); [rpb, rpa].forEach(function (b) { if (b) b.onclick = function () { startRepeat(); }; });
    var rps = app.querySelector('#repsave'); if (rps) rps.onclick = function () { collect(); saveRepeat(rps); };
    var rpe = app.querySelector('#repend'); if (rpe) rpe.onclick = function () { REP = { sec: null, ans: {}, n: 0, saved: false }; draw(); };
    app.querySelectorAll('[data-say]').forEach(function (b) { b.onclick = function () { var x = items.filter(function (i) { return i.question_id === b.getAttribute('data-say'); })[0]; speak(x.prompt + (x.options && x.options.length ? '. Options: ' + x.options.join('; ') : ''), b); }; });
    app.querySelectorAll('.q').forEach(function (q) {
      q.addEventListener('input', function () { dirty = true; });
      q.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () {
        var w = b.getAttribute('data-mode') === 'write'; q.querySelector('textarea').hidden = w; q.querySelector('.hwbox').hidden = !w;
        q.querySelectorAll('[data-mode]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); if (w) pad(q.querySelector('canvas'), q); }; });
      var c = q.querySelector('canvas'); if (c && !q.querySelector('.hwbox').hidden) pad(c, q);
    });
  }
  /* handwriting pad (finger, stylus or mouse) */
  function pad(c, q) {
    if (c._ready) return; c._ready = true;
    var g = c.getContext('2d'), qid = q.getAttribute('data-q'), pen = '#172033', drawing = false, last = null;
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#e8ecf3'; g.lineWidth = 1; for (var y = 40; y < c.height; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
    var src = q.closest('#stepbox') && inRepeat(steps()[step]) ? REP.ans[qid] : ans[qid];
    if (isPic(src)) { var im = new Image(); im.onload = function () { g.drawImage(im, 0, 0, c.width, c.height); }; im.src = src; }
    if (q.getAttribute('data-locked')) return;
    function pos(e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; }
    c.addEventListener('pointerdown', function (e) { drawing = true; last = pos(e); c.setPointerCapture(e.pointerId); e.preventDefault(); });
    c.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = pen === 'eraser' ? '#fff' : pen; g.lineWidth = pen === 'eraser' ? 22 : (e.pressure && e.pointerType === 'pen' ? 1.5 + e.pressure * 3.5 : 3);
      g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); last = p; e.preventDefault(); });
    var end = function () { if (!drawing) return; drawing = false; dirty = true; c._used = true; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end); c.addEventListener('pointerleave', end);
    q.querySelectorAll('[data-pen]').forEach(function (b) { b.onclick = function () { pen = b.getAttribute('data-pen'); q.querySelectorAll('[data-pen]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); }; });
    q.querySelector('[data-clear]').onclick = function () { c._ready = false; c._used = false; if (inRepeat(steps()[step])) REP.ans[qid] = ''; else ans[qid] = ''; pad(c, q); };
  }
  function collect() {
    var tgt = inRepeat(steps()[step]) ? REP.ans : ans;
    app.querySelectorAll('.q[data-q]').forEach(function (q) {
      if (q.getAttribute('data-locked')) return;
      var qid = q.getAttribute('data-q'), r = q.querySelector('input[type=radio]:checked');
      if (q.querySelector('input[type=radio]')) { if (r) tgt[qid] = +r.value; return; }
      var c = q.querySelector('canvas'), writing = !q.querySelector('.hwbox').hidden;
      if (writing && c && c._used) { var tmp = document.createElement('canvas'); tmp.width = 700; tmp.height = Math.round(c.height * 700 / c.width); tmp.getContext('2d').drawImage(c, 0, 0, tmp.width, tmp.height); tgt[qid] = tmp.toDataURL('image/jpeg', 0.6); }
      else if (!writing) tgt[qid] = q.querySelector('textarea').value;
    });
  }
  function blanks(sc, src) { return items.filter(function (x) { return (x.section || 'Explore') === sc && x.kind !== 'info' && (src[x.question_id] == null || src[x.question_id] === ''); }); }
  function finish(btn) {   // save, then show the answers for this step; the first answers are then locked
    var sc = steps()[step], e = blanks(sc, ans);
    if (e.length) { msg('Answer every question in this step first (' + e.length + ' still empty: number' + (e.length > 1 ? 's ' : ' ') + e.map(function (x) { return x._n; }).join(', ') + ').'); return; }
    btn.disabled = true; msg('Saving and opening the answers…', true); saveLocal();
    S.db.rpc('save_progress', { attempt: ATT.id, given: ans }).then(function (r) { if (r.error) throw r.error; return S.db.rpc('step_answers', { attempt: ATT.id, sec: sc }); }).then(function (r) {
      if (r.error) throw r.error; (r.data || []).forEach(function (a) { KEYS[a.question_id] = a; }); REVEALED[sc] = true; dirty = false; progress(); draw();
      msg('Here are the answers. Compare them with yours and correct your book. Your first answers are kept; you can repeat this step to practise.', true);
    }).catch(function (e) { btn.disabled = false; msg(S.nice(e)); });
  }
  function startRepeat() {
    var sc = steps()[step], done = (ATT.repeats || []).filter(function (r) { return r.section === sc; }).length;
    REP = { sec: sc, ans: {}, n: done + 1, saved: false }; draw(); window.scrollTo(0, app.querySelector('#stepbox').offsetTop - 80);
  }
  function saveRepeat(btn) {
    var e = blanks(REP.sec, REP.ans);
    if (e.length) { msg('Answer every question in this repeat first (' + e.length + ' still empty).'); return; }
    btn.disabled = true; msg('Saving Repeat ' + REP.n + '…', true);
    S.db.rpc('save_repeat', { attempt: ATT.id, sec: REP.sec, given: REP.ans }).then(function (r) {
      if (r.error) throw r.error; REP.n = r.data || REP.n; REP.saved = true;
      ATT.repeats = (ATT.repeats || []).concat([{ section: REP.sec, n: REP.n, at: new Date().toISOString() }]); draw();
      msg('Repeat ' + REP.n + ' saved and sent to your teacher, labelled Repeat ' + REP.n + '. Compare your answers with the answers below.', true);
    }).catch(function (e) { btn.disabled = false; msg(S.nice(e)); });
  }
  function msg(t, good) { var m = app.querySelector('#lm'); if (m) { m.className = good ? 'msg ok' : 'msg'; m.textContent = t; } }
  function progress() {
    if (!lessonRow) return Promise.resolve();
    var st = steps(), doneSteps = st.filter(function (s) { return items.filter(function (x) { return (x.section || 'Explore') === s && x.kind !== 'info'; }).every(function (x) { return ans[x.question_id] != null && ans[x.question_id] !== ''; }); }).length;
    var pc = Math.round(100 * doneSteps / Math.max(1, st.length));
    return S.db.from('learning_progress').upsert({ student_id: ME.user.id, lesson_id: lessonRow.id, status: pc >= 100 ? 'completed' : 'in_progress', percent: Math.min(pc, 99), last_step: step + 1, updated_at: new Date().toISOString() }).then(function (r) { if (r.error && window.console) console.warn(r.error.message); });
  }
  function save(quiet) {
    saveLocal();
    return S.db.rpc('save_progress', { attempt: ATT.id, given: ans }).then(function (r) {
      if (r.error) { msg(S.nice(r.error)); return; } dirty = false; progress();
      if (!quiet) msg('Saved at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '. You can come back and finish later.', true);
    });
  }
  function hand(btn) {
    var empty = items.filter(function (x) { return x.kind !== 'info' && x.marks > 0 && (ans[x.question_id] == null || ans[x.question_id] === ''); });
    if (empty.length && !btn.dataset.sure) { btn.dataset.sure = 1; btn.textContent = 'Hand in anyway'; msg(empty.length + ' marked question' + (empty.length > 1 ? 's are' : ' is') + ' still empty (number' + (empty.length > 1 ? 's ' : ' ') + empty.map(function (x) { return x._n; }).join(', ') + '). Press again to hand in anyway.'); return; }
    btn.disabled = true; msg('Handing in…', true);
    S.db.rpc('save_progress', { attempt: ATT.id, given: ans }).then(function () { return S.db.rpc('submit_quiz', { attempt: ATT.id, given: ans }); }).then(function (r) {
      if (r.error) throw r.error; try { localStorage.removeItem(key()); } catch (e) {}
      if (lessonRow) S.db.from('learning_progress').upsert({ student_id: ME.user.id, lesson_id: lessonRow.id, status: 'completed', percent: 100, last_step: steps().length, updated_at: new Date().toISOString() }).then(function () {});
      return S.db.from('quiz_attempts').select('*').eq('id', ATT.id).single().then(function (a) { ATT = a.data; done(); });
    }).catch(function (e) { btn.disabled = false; msg(S.nice(e)); });
  }
  function done() {
    var by = {}, show = Q.show_results || ATT.released, n = 0; (ATT.detail || []).forEach(function (d) { by[d.question_id] = d; });
    app.innerHTML = '<section class="panel tint"><p class="label">' + E(Q.title) + '</p><h2>' + (show ? 'Your mark: ' + E(ATT.score) + ' / ' + E(ATT.max_score) : 'Handed in ✓') + '</h2>' +
      (show ? '' : '<p>Well done for finishing. Your teacher will check your answers and release your mark; it will appear here and on your dashboard.</p>') +
      '<div class="acts"><a class="btn sm" href="/dashboard/">My dashboard</a><a class="btn sm" href="/learn/">Learning centre</a></div></section>' +
      '<section class="grp"><h3 class="sec-h">My answers</h3>' + items.filter(function (x) { return x.kind !== 'info'; }).map(function (x) {
        var v = (ATT.answers || {})[x.question_id], d = by[x.question_id] || {};
        return '<article class="q' + (show && d.max ? (+d.got === +d.max ? ' good' : +d.got > 0 ? ' part' : ' bad') : '') + '"><p><b>' + (++n) + '.</b> ' + E(x.prompt) + (show && d.max ? ' <span class="pill">' + E(d.got) + ' / ' + E(d.max) + '</span>' : '') + '</p>' +
          (v == null || v === '' ? '<p class="small muted"><i>no answer</i></p>' : isPic(v) ? '<img class="hw" alt="My handwritten answer" src="' + E(v) + '">' : x.kind === 'short' ? '<p class="small" style="white-space:pre-wrap">' + E(v) + '</p>' : '<p class="small">' + E((x.options || [])[v]) + '</p>') +
          (show && d.comment ? '<div class="fb tch"><h4>Teacher comment</h4>' + E(d.comment) + '</div>' : '') + (show && d.explanation ? '<p class="small fb ai">' + E(d.explanation) + '</p>' : '') + '</article>'; }).join('') + '</section>';
    window.scrollTo(0, 0);
  }
})();
