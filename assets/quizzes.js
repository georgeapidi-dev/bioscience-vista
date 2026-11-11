/* Quiz centre · Learnova (marking is done on the server by submit_quiz) */
(function () {
  var T = window.BVT;
  var S = window.BVS, E = S.E, app = document.getElementById('app'), timer = null, beat = null, GUARD = null, ME;
  var EXAM = app.getAttribute('data-mode') === 'exam', NOUN = EXAM ? 'exam' : 'quiz', HOME = EXAM ? '/exams/' : '/quizzes/';
  S.guard(app).then(function (me) { ME = me; route(); window.addEventListener('hashchange', route); })
    .catch(function (e) { if (typeof e !== 'string') app.innerHTML = '<p class="msg">' + E(S.nice(e)) + '</p>'; });

  function route() { clearInterval(timer); clearInterval(beat); if (GUARD) GUARD.off(); var id = location.hash.slice(1); return id ? open(id) : list(); }
  function fail(r) { app.innerHTML = '<section class="panel"><p class="msg">' + E(S.nice(r.error || r)) + '</p><p><a href="#">← All ' + NOUN + 's</a></p></section>'; }

  function list() {
    app.innerHTML = '<p class="muted">Loading quizzes…</p>';
    Promise.all([
      S.db.from('quizzes').select('id,title,instructions,time_limit_minutes,opens_at,due_at,max_attempts,published,show_results, topics(name)').eq('published', true).eq('category', EXAM ? 'exam' : 'quiz').order('due_at', { ascending: true, nullsFirst: false }),
      S.db.from('quiz_attempts').select('id,quiz_id,status,score,max_score,submitted_at,released').eq('student_id', ME.user.id)
    ]).then(function (x) {
      if (x[0].error) return fail(x[0]);
      var qs = x[0].data || [], at = x[1].data || [], now = new Date();
      if (ME.staff) qs = qs.filter(function () { return true; });
      function card(q) {
        var mine = at.filter(function (a) { return a.quiz_id === q.id; }), done = mine.filter(function (a) { return a.status !== 'in_progress'; }), live = mine.filter(function (a) { return a.status === 'in_progress'; })[0];
        var open = (!q.opens_at || new Date(q.opens_at) <= now) && (!q.due_at || new Date(q.due_at) >= now), left = q.max_attempts - mine.length;
        var best = done.reduce(function (b, a) { var st = !q.show_results && !a.released ? 'held' : a.status; return a.score != null && (b == null || +a.score > b.score) ? { score: +a.score, max: +a.max_score, status: st } : b; }, null);
        var btn = live ? '<a class="btn main sm" href="#' + q.id + '">Continue</a>' : open && left > 0 ? '<a class="btn main sm" href="#' + q.id + '">' + (done.length ? 'Try again' : 'Start') + '</a>' : done.length ? '<a class="btn sm" href="#' + q.id + '">See my result</a>' : '<span class="pill">' + (q.opens_at && new Date(q.opens_at) > now ? 'Opens ' + E(S.when(q.opens_at)) : 'Closed') + '</span>';
        return '<article class="task"><div class="top2"><b>' + E(q.title) + '</b>' + (best ? '<span class="score">' + (best.status === 'held' ? 'Waiting for your teacher' : best.status === 'needs_marking' ? 'Being marked' : best.score + ' / ' + best.max) + '</span>' : '') + '</div>' +
          '<span class="small muted">' + [q.topics && q.topics.name, q.time_limit_minutes ? '⏱ ' + q.time_limit_minutes + ' min' : 'No time limit', q.due_at ? 'Due ' + S.when(q.due_at) : '', q.max_attempts + ' attempt' + (q.max_attempts > 1 ? 's' : '')].filter(Boolean).map(E).join(' · ') + '</span>' +
          (q.instructions ? '<p class="small">' + E(q.instructions) + '</p>' : '') + '<div class="acts">' + btn + '</div></article>';
      }
      var todo = qs.filter(function (q) { return !at.some(function (a) { return a.quiz_id === q.id && a.status !== 'in_progress'; }); }), past = qs.filter(function (q) { return todo.indexOf(q) < 0; });
      app.innerHTML = '<div class="row2"><div><p class="label">' + (EXAM ? 'Online exams' : 'Quiz centre') + '</p><h2>Your ' + NOUN + 's</h2></div><a class="btn sm" href="/dashboard/">My dashboard</a></div>' +
        (ME.staff ? '<p class="panel tint small">You are signed in as a teacher. Students only see ' + NOUN + 's set for their class. Build and set them in the <a href="/staff/#quizzes">Teacher dashboard</a>.</p>' : '') +
        (!ME.cls && !ME.staff ? '<p class="panel tint">Join a class on <a href="/dashboard/">your dashboard</a> to see your ' + NOUN + 's.</p>' : '') +
        '<section class="grp"><h3 class="sec-h">To do</h3>' + (todo.length ? todo.map(card).join('') : '<p class="emptybox">Nothing to do right now.</p>') + '</section>' +
        (past.length ? '<section class="grp"><h3 class="sec-h">Completed</h3>' + past.map(card).join('') + '</section>' : '');
    });
  }

  function open(qid) {
    app.innerHTML = '<p class="muted">Opening ' + NOUN + '…</p>';
    Promise.all([
      S.db.from('quizzes').select('*').eq('id', qid).maybeSingle(),
      S.db.from('quiz_attempts').select('*').eq('quiz_id', qid).eq('student_id', ME.user.id).order('started_at', { ascending: false })
    ]).then(function (x) {
      var q = x[0].data, at = x[1].data || []; if (!q) return fail((EXAM ? 'Exam' : 'Quiz') + ' not found.');
      var live = at.filter(function (a) { return a.status === 'in_progress'; })[0], done = at.filter(function (a) { return a.status !== 'in_progress'; });
      var canStart = at.length < q.max_attempts;
      if (rules(q).seb && inSEB()) {   // lockdown: inside Safe Exam Browser, check it is running the teacher's settings file
        if (ME.staff) return sebTeacher(q);
        app.innerHTML = '<p class="muted">Checking Safe Exam Browser…</p>';
        return sebPass(q.id).then(function (ok) { if (ok) go(); else sebBlocked(q); });
      }
      go();
      function go() {
      if (live) { if (rules(q).seb && !inSEB()) { app.innerHTML = '<section class="panel"><h2>' + E(q.title) + '</h2><p>This ' + NOUN + ' can only be continued in Safe Exam Browser.</p><div class="acts"><a class="btn main" href="' + E(sebLink()) + '">Open in Safe Exam Browser</a><a class="btn" href="#">Back</a></div></section>'; return; } return paper(q, live.id); }
      if (done.length && !(canStart && new URLSearchParams(location.search).get('again'))) return review(q, done[0], canStart);
      app.innerHTML = '<section class="panel"><p class="label">' + (EXAM ? 'Exam' : 'Quiz') + '</p><h2>' + E(q.title) + '</h2>' + (q.instructions ? '<p>' + E(q.instructions) + '</p>' : '') +
        (EXAM ? '<p class="panel tint small"><b>Exam conditions.</b> Work on your own. Once you start, the timer keeps running even if you close the page, and the exam is handed in automatically when time runs out.</p>' : '') + '<ul class="small"><li>' + (q.time_limit_minutes ? 'You have <b>' + q.time_limit_minutes + ' minutes</b>. The timer keeps running if you close the page.' : 'There is no time limit.') + '</li><li>Attempts allowed: ' + q.max_attempts + ' (used ' + at.length + ')</li><li>Your answers are saved as you go, so you can carry on if your device switches off. Press <b>Submit</b> when you finish.</li></ul>' +
        '<div class="acts"><button class="btn main" id="go" type="button">' + (EXAM ? 'Start exam' : 'Start quiz') + '</button><a class="btn" href="#">Back</a></div><p class="msg" id="m"></p></section>';
      var R = rules(q), ul = app.querySelector('ul.small');
      if (ul) ul.insertAdjacentHTML('beforeend', '<li><b>Stay on this page.</b> ' + (R.fullscreen && fsOK() ? 'The ' + NOUN + ' opens in full screen. ' : '') + 'Leaving the page, another tab or another window is recorded and your teacher can see it.' +
        (R.mode === 'autosubmit' ? ' If you leave ' + R.max + ' time' + (R.max > 1 ? 's' : '') + ', it is handed in automatically.' : '') + ' Copying and pasting are switched off.</li>');
      if (R.seb && !inSEB()) {
        app.querySelector('.acts').innerHTML = '<a class="btn main" href="' + E(sebLink()) + '">Open in Safe Exam Browser</a><a class="btn" href="https://safeexambrowser.org/download_en.html" target="_blank" rel="noopener">Download Safe Exam Browser</a><a class="btn" href="#">Back</a>';
        app.querySelector('#m').textContent = 'This ' + NOUN + ' can only be done in Safe Exam Browser. Install it (free), then press Open in Safe Exam Browser and sign in there.';
        return;
      }
      app.querySelector('#go').onclick = function () { this.disabled = true; if (R.fullscreen && fsOK()) goFull(); S.db.rpc('start_quiz', { qid: qid }).then(function (r) { if (r.error) { app.querySelector('#m').textContent = S.nice(r.error); return; } paper(q, r.data); }); };
      }
    });
  }

  /* ---------- Safe Exam Browser lockdown ---------- */
  // SEB 3.x gives each settings file a Config Key; the page can read a hash of it (tied to this page address) from SEB's JavaScript API.
  function sebKey() {
    return new Promise(function (res) {
      var X = window.SafeExamBrowser, t = setTimeout(function () { res(X && X.security && X.security.configKey || null); }, 2000);
      if (!X || !X.security) { clearTimeout(t); return res(null); }
      try { if (X.security.updateKeys) X.security.updateKeys(function () { clearTimeout(t); res(X.security.configKey || null); }); else { clearTimeout(t); res(X.security.configKey || null); } } catch (e) { clearTimeout(t); res(null); }
    });
  }
  function sebPass(qid) {
    return sebKey().then(function (k) { return S.db.rpc('seb_check', { qid: qid, key: k }); }).then(function (r) {
      if (r.error) return /seb_check|schema cache|PGRST202/i.test(r.error.message || '');   // before database update 012 there is nothing to check
      return r.data === true;
    }, function () { return false; });
  }
  function sebBlocked(q) {
    app.innerHTML = '<section class="panel"><p class="label">' + (EXAM ? 'Exam' : 'Quiz') + '</p><h2>' + E(q.title) + '</h2><p class="msg">This Safe Exam Browser is not set up for this ' + NOUN + '.</p>' +
      '<p>Close Safe Exam Browser, then open the ' + NOUN + ' again using the Safe Exam Browser file your teacher gave you. If it still does not open, ask your teacher.</p>' +
      '<div class="acts"><button class="btn main" type="button" id="again">Check again</button><a class="btn" href="/?seb=quit">Close Safe Exam Browser</a></div></section>';
    app.querySelector('#again').onclick = function () { open(q.id); };
  }
  function sebTeacher(q) {   // a teacher opening the exam inside SEB registers that setup, so only that settings file is accepted
    app.innerHTML = '<p class="muted">Reading Safe Exam Browser…</p>';
    sebKey().then(function (k) {
      var g = q.integrity || {}, keys = Array.isArray(g.seb_keys) ? g.seb_keys : [], has = k && keys.indexOf(k) >= 0;
      app.innerHTML = '<section class="panel"><p class="label">Teacher · Safe Exam Browser set-up</p><h2>' + E(q.title) + '</h2>' +
        (!k ? '<p class="msg">This Safe Exam Browser does not share its settings key. Use Safe Exam Browser 3 or newer, and open the exam with the settings file downloaded from Learnova (it has "Use Browser Exam Key and Config Key" switched on).</p>' :
          '<p>You are signed in as a teacher inside Safe Exam Browser. ' + (has ? '<b>✓ This set-up is registered.</b> Students opening the exam with the same settings file will be let in.' :
            'Register this set-up so that students can only take the exam with <b>this same settings file</b>. Anyone using another file, or an ordinary browser, is kept out.') + '</p>' +
          '<p class="small muted">Set-ups registered for this exam: ' + keys.length + '. Register again whenever you download a new settings file (changing the settings changes the key). Students must open the exam the same way you did, with the same file.</p>') +
        '<div class="acts">' + (k && !has ? '<button class="btn main" type="button" id="reg">Register this set-up</button>' : '') + '<a class="btn" href="/?seb=quit">Close Safe Exam Browser</a></div><p class="msg" id="m" role="status"></p></section>';
      var b = app.querySelector('#reg');
      if (b) b.onclick = function () { b.disabled = true;
        var ng = Object.assign({}, g, { seb: true, seb_keys: keys.concat([k]).slice(-10) });
        S.db.from('quizzes').update({ integrity: ng }).eq('id', q.id).select('id').single().then(function (r) {
          if (r.error) { b.disabled = false; app.querySelector('#m').textContent = S.nice(r.error); return; }
          q.integrity = ng; sebTeacher(q);
        });
      };
    });
  }


  /* ---------- exam mode: full screen, every tab / window / app switch recorded, optional hand-in ---------- */
  function rules(q) { var g = q.integrity || {}, ex = q.category === 'exam' || EXAM;
    return { mode: g.mode || (ex ? 'autosubmit' : 'warn'), max: Math.max(1, +g.max || 3), fullscreen: g.fullscreen !== false, seb: !!g.seb }; }
  function inSEB() { return /SEB\//.test(navigator.userAgent) || !!window.SafeExamBrowser; }
  function fsOK() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !inSEB(); }
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function goFull() { var d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; try { var r = f && f.call(d); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
  function exitFull() { try { if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
  function sebLink() { return 'sebs://' + location.host + '/assets/learnova-' + (EXAM ? 'exams' : 'quizzes') + '.seb'; }   // opens Safe Exam Browser on this page; the student signs in there
  function watch(q, attempt, f, prev, handIn) {
    var R = rules(q), needFs = R.fullscreen && fsOK(), away = false, since = 0, n = +(prev.away_count || 0), secs = +(prev.away_seconds || 0), done = false, offs = [];
    function on(t, ev, fn) { t.addEventListener(ev, fn, true); offs.push(function () { t.removeEventListener(ev, fn, true); }); }
    var note = document.createElement('div'); note.className = 'xwarn'; note.setAttribute('role', 'alert'); note.hidden = true; f.insertBefore(note, f.firstChild.nextSibling);
    var lock = document.createElement('div'); lock.className = 'xlock'; lock.hidden = true;
    lock.innerHTML = '<div><p class="label">' + (EXAM ? 'Exam' : 'Quiz') + ' mode</p><h2>The questions are hidden</h2><p>This ' + NOUN + ' must be done in full screen. Leaving full screen, another tab or another window is recorded and your teacher can see it.</p><button type="button" class="btn main">Return to full screen</button></div>';
    lock.querySelector('button').onclick = goFull; document.body.appendChild(lock);
    function send() { S.db.rpc('quiz_focus', { attempt: attempt, n: n, secs: Math.round(secs), away: away }).then(function () {}, function () {}); }
    function say(t) { note.textContent = t; note.hidden = false; }
    function leave() { if (away || done) return; away = true; since = Date.now(); n++; send(); }
    function present() { return !document.hidden && document.hasFocus() && (!needFs || isFull()); }
    function back() {
      if (!away || done || !present()) return; away = false; secs += (Date.now() - since) / 1000; send();
      if (R.mode === 'record') return;
      if (R.mode === 'autosubmit' && n >= R.max) { done = true; say('You left the ' + NOUN + ' ' + n + ' times, so it is being handed in now.'); handIn(); return; }
      say('⚠ You left the ' + NOUN + ' (' + n + (R.mode === 'autosubmit' ? ' of ' + R.max : '') + (n === 1 && R.mode !== 'autosubmit' ? ' time' : ' times') + '). Your teacher can see this.' +
        (R.mode === 'autosubmit' && R.max - n === 1 ? ' If you leave once more, it will be handed in automatically.' : ''));
    }
    function fsCheck() { if (!needFs) return; lock.hidden = isFull(); if (!isFull()) leave(); else back(); }
    on(document, 'visibilitychange', function () { if (document.hidden) leave(); else back(); });
    on(window, 'blur', function () { setTimeout(function () { if (!document.hasFocus()) leave(); }, 150); });
    on(window, 'focus', back);
    on(document, 'fullscreenchange', fsCheck); on(document, 'webkitfullscreenchange', fsCheck);
    ['copy', 'cut', 'paste', 'contextmenu', 'drop'].forEach(function (ev) { on(f, ev, function (e) { if (e.target.closest && e.target.closest('[data-pad]') && ev === 'contextmenu') return; e.preventDefault(); say('Copying and pasting are switched off in this ' + NOUN + '.'); }); });
    if (needFs && !isFull()) lock.hidden = false;   // e.g. after reloading the page: ask to go back into full screen (not counted)
    send();
    return { off: function () { done = true; offs.forEach(function (x) { x(); }); offs = []; if (lock.parentNode) lock.parentNode.removeChild(lock); exitFull(); GUARD = null; }, rules: R };
  }
  function key(a) { return 'bvq-' + a; }
  function paper(q, attempt) {
    S.db.rpc('quiz_paper', { attempt: attempt }).then(function (r) {
      if (r.error) return fail(r);
      var qs = r.data || [], local = {}; try { local = JSON.parse(localStorage.getItem(key(attempt)) || '{}'); } catch (e) {}
      // carry on from this device's copy, or else from answers saved on the server (e.g. a different device)
      S.db.from('quiz_attempts').select('*').eq('id', attempt).maybeSingle().then(function (a) { var row = a.data || {}; build(Object.keys(local).length ? local : (row.answers || {}), row); }, function () { build(local, {}); });
      function build(saved, row) {
      var secs = qs.length ? qs[0].seconds_left : null;
      app.innerHTML = '<form id="qf" class="grp"><div class="row2 sticky-top"><div><p class="label">' + E(q.title) + '</p><b id="cnt"></b></div>' + (secs != null ? '<span class="timer" id="tm" aria-live="off"></span>' : '') + '</div>' +
        qs.map(function (x, i) {
          var name = 'q-' + x.question_id, opts = x.options || [], v = saved[x.question_id], md = T.parse(x.prompt).mode, drawn = x.kind === 'short' && /^(graph|draw|annotate)$/.test(md);
          return '<fieldset class="q" data-id="' + x.question_id + '"><legend>' + (/^\d+\s*(\([a-z]\)|\.\s)/i.test(x.prompt || '') ? '' : '<b>' + (i + 1) + '.</b> ') + T.rich(x.prompt, true) + ' <span class="pill">' + x.marks + ' mark' + (x.marks > 1 ? 's' : '') + '</span></legend>' +
            (x.image_url && md !== 'annotate' ? '<img src="' + E(x.image_url) + '" alt="Diagram for question ' + (i + 1) + '" style="max-width:100%;max-height:420px;border-radius:8px">' : '') +
            (drawn ? '<div data-pad="' + x.question_id + '"></div>' :
             x.kind !== 'short' && md === 'dropdown' ? '<select class="qdrop" name="' + name + '"><option value="">Choose an answer…</option>' + opts.map(function (o, j) { return '<option value="' + j + '"' + (String(v) === String(j) ? ' selected' : '') + '>' + 'ABCDEFGH'.charAt(j) + '. ' + E(o) + '</option>'; }).join('') + '</select>' :
             x.kind === 'short' ? '<textarea name="' + name + '" rows="' + (x.marks >= 6 ? 12 : x.marks >= 3 ? 7 : 3) + '" placeholder="Type your answer' + (x.marks >= 3 ? ' (worth ' + x.marks + ' marks: give ' + x.marks + ' clear points)' : '') + '">' + E(v || '') + '</textarea>' :
              opts.map(function (o, j) { return '<label class="opt"><input type="radio" name="' + name + '" value="' + j + '"' + (String(v) === String(j) ? ' checked' : '') + '> <b>' + 'ABCDEFGH'.charAt(j) + '.</b> ' + E(o) + '</label>'; }).join('')) + '</fieldset>';
        }).join('') + '<div class="acts"><button class="btn main" type="submit">Submit answers</button><a class="btn" href="#">Save and leave</a></div><p class="msg" id="m" role="alert"></p></form>';
      var f = app.querySelector('#qf'), pads = {};
      qs.forEach(function (x) { var h = f.querySelector('[data-pad="' + x.question_id + '"]'); if (h) pads[x.question_id] = T.pad(h, { mode: T.parse(x.prompt).mode, x: T.parse(x.prompt).x, y: T.parse(x.prompt).y, image: x.image_url, value: saved[x.question_id], onchange: function () { keep(); push(); } }); });
      function collect() { var g = {}; qs.forEach(function (x) {
        if (pads[x.question_id]) { var d = pads[x.question_id].get(); if (d) g[x.question_id] = d; return; }
        var el = f.querySelector('select[name="q-' + x.question_id + '"]') || f.querySelector('[name="q-' + x.question_id + '"]' + (x.kind === 'short' ? '' : ':checked')); if (el && el.value !== '') g[x.question_id] = x.kind === 'short' ? el.value : +el.value; }); return g; }
      var kt = null; function keep() { clearTimeout(kt); kt = setTimeout(function () { try { localStorage.setItem(key(attempt), JSON.stringify(collect())); } catch (e) {} count(); }, 400); }
      function count() { var c = app.querySelector('#cnt'); if (!c || sent) return; c.textContent = Object.keys(collect()).length + ' of ' + qs.length + ' answered'; }
      var pt = null, lastSent = null;   // teacher's live view: answers go to the server every few seconds, plus a heartbeat
      function push(now) { clearTimeout(pt); pt = setTimeout(function () { if (sent) return; var g = collect(), js = JSON.stringify(g);
        S.db.rpc('save_quiz_progress', { attempt: attempt, given: js === lastSent ? null : g }).then(function (r) { if (!r.error) lastSent = js; }, function () {}); }, now ? 0 : 3000); }
      clearInterval(beat); beat = setInterval(function () { push(true); }, 30000); push(true);
      f.addEventListener('change', function () { push(); });
      f.addEventListener('input', function () { push(); });
      var lv = f.querySelector('.acts a.btn'); if (lv) lv.addEventListener('click', function () { push(true); });
      f.addEventListener('change', keep);
      f.addEventListener('input', function () { try { localStorage.setItem(key(attempt), JSON.stringify(collect())); } catch (e) {} count(); }); count();
      var sent = false;
      GUARD = watch(q, attempt, f, row, function () { submit(true, 'left'); });
      function submit(auto, why) {
        if (sent) return; var g = collect(), miss = qs.length - Object.keys(g).length;
        if (!auto && miss && !confirmInline(miss)) return;
        sent = true; clearInterval(timer); clearInterval(beat); clearTimeout(pt); if (GUARD) GUARD.off(); app.querySelector('#m').className = 'msg'; app.querySelector('#m').textContent = why === 'left' ? 'Handing in because you left the ' + NOUN + ' too many times…' : auto ? 'Time is up. Submitting…' : 'Submitting…';
        S.db.rpc('submit_quiz', { attempt: attempt, given: g }).then(function (res) {
          // AI suggestions for written answers the rules could not mark (hybrid / AI mode only; the server decides and never charges for objective questions)
          if (!res.error && (q.feedback_mode || 'hybrid') !== 'rule' && S.db.functions) { try { S.db.functions.invoke('ai-mark', { body: { attempt: attempt } }).then(function () {}, function () {}).then(function () { return S.db.functions.invoke('result-feedback', { body: { attempt: attempt } }); }).then(function () { return S.db.functions.invoke('analyse', { body: { attempt: attempt } }); }).then(function () {}, function () {}); } catch (e) {} }
          else if (!res.error && S.db.functions) { try { S.db.functions.invoke('result-feedback', { body: { attempt: attempt, mode: 'rule' } }).then(function () {}, function () {}); } catch (e) {} }
          if (res.error) { sent = false; app.querySelector('#m').textContent = S.nice(res.error); return; }
          try { localStorage.removeItem(key(attempt)); } catch (e) {}
          S.db.from('quiz_attempts').select('*').eq('id', attempt).maybeSingle().then(function (a) { review(q, a.data, false, res.data); });
        });
      }
      var warned = false;
      function confirmInline(miss) { if (warned) return true; warned = true; var m = app.querySelector('#m'); m.className = 'msg'; m.textContent = miss + ' question' + (miss > 1 ? 's are' : ' is') + ' not answered. Press Submit again to hand in anyway.'; return false; }
      f.onsubmit = function (e) { e.preventDefault(); submit(false); };
      if (secs != null) {
        var end = Date.now() + secs * 1000, tm = app.querySelector('#tm');
        var tick = function () { var s = Math.max(0, Math.round((end - Date.now()) / 1000)); tm.textContent = '⏱ ' + Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); tm.classList.toggle('low', s < 60); if (!s) submit(true); };
        tick(); timer = setInterval(tick, 1000);
      }
      }
    });
  }

  function review(q, a, canRetry, res) {
    if (!a) return list();
    var det = a.detail || [], hide = !q.show_results && !a.released;
    Promise.all([S.db.rpc('quiz_paper', { attempt: a.id }), hide ? Promise.resolve({ data: [] }) : S.db.from('attempt_feedback').select('question_id,source,rule,ai,teacher,reviewed').eq('attempt_id', a.id).then(function (f) { return f; }, function () { return { data: [] }; })]).then(function (rr) {
      var r = rr[0], fb = {}; ((rr[1] && rr[1].data) || []).forEach(function (f) { fb[f.question_id] = f; });
      var qs = r.data || [], by = {}; det.forEach(function (d) { by[d.question_id] = d; });
      var pc = S.pct(+a.score, +a.max_score);
      app.innerHTML = '<section class="panel tint"><p class="label">' + E(q.title) + '</p><h2>' + (hide ? 'Submitted ✓' : a.status === 'needs_marking' ? 'Submitted: ' + E(a.score) + ' / ' + E(a.max_score) + ' so far' : 'Your score: ' + E(a.score) + ' / ' + E(a.max_score) + (pc != null ? ' (' + pc + '%)' : '')) + '</h2>' +
        (hide ? '<p>Your answers are saved. Your teacher will check them and release your mark; it will appear here and on your dashboard.</p>' : a.status === 'needs_marking' ? '<p>Your written answers will be marked by your teacher. Your total will update on your dashboard.</p>' : '') +
        '<div class="acts"><a class="btn sm" href="#">All ' + NOUN + 's</a><a class="btn sm" href="/dashboard/">My dashboard</a>' + (canRetry ? '<a class="btn main sm" href="?again=1#' + q.id + '">Try again</a>' : '') + (inSEB() ? '<a class="btn main sm" href="/?seb=quit">Close Safe Exam Browser</a>' : '') + '</div></section>' +
        (hide ? '' : qs.map(function (x, i) { var d = by[x.question_id] || {}, given = (a.answers || {})[x.question_id];
          var ok = d.got != null && +d.got === +d.max, part = d.got != null && +d.got > 0 && !ok;
          return '<article class="q ' + (d.got == null ? '' : ok ? 'good' : part ? 'part' : 'bad') + '"><div>' + (/^\d+\s*(\([a-z]\)|\.\s)/i.test(x.prompt || '') ? '' : '<b>' + (i + 1) + '.</b> ') + T.rich(x.prompt, true) + ' <span class="pill">' + (d.got == null ? 'to be marked' : E(d.got) + ' / ' + E(d.max)) + '</span></div>' +
            '<p class="small"><b>Your answer:</b> ' + (given == null || given === '' ? '<i>no answer</i>' : T.isPic(given) ? '<br><img class="hw" alt="Your drawing" src="' + E(given) + '" style="max-width:100%;border:1px solid var(--line);border-radius:8px">' : x.kind === 'short' ? E(given) : 'ABCDEFGH'.charAt(given) + '. ' + E((x.options || [])[given])) + '</p>' +
            (fb[x.question_id] && T.feedback ? T.feedback(fb[x.question_id]) :   // structured feedback (rules, AI or teacher)
              (d.explanation ? '<p class="small fb ai">' + E(d.explanation) + '</p>' : '') + (d.comment ? '<div class="fb tch"><h4>Teacher comment</h4>' + E(d.comment) + '</div>' : '')) + '</article>'; }).join(''));
      window.scrollTo(0, 0);
    });
  }
})();
