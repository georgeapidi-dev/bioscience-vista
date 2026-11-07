/* Online exams for students · BioScience Vista */
(function () {
  var app = document.getElementById('app'), E = BV.esc, timer = null;
  function start() {
    if (!BV.me()) { BV.loginForm(app, list); return; }
    list();
  }
  function list() {
    app.innerHTML = '<p class="muted">Loading your exams…</p>';
    BV.as('myExams').then(function (r) {
      if (!r.ok) { if (r.auth === false) return BV.signout(); app.innerHTML = '<p class="msg">' + E(r.error) + '</p>'; return; }
      var lab = { open: ['Start', 'new'], started: ['Continue', 'new'], done: ['Submitted', 'ok'], soon: ['Opens soon', ''], closed: ['Closed', ''] };
      app.innerHTML = '<div class="row2"><h2>My exams</h2><button class="btn sm" type="button" id="so">Sign out</button></div>' + (r.exams.length ? r.exams.map(function (e) {
        var l = lab[e.state];
        return '<article class="item"><div class="row2"><b>' + E(e.title) + '</b><span class="pill ' + l[1] + '">' + l[0] + '</span></div>' +
          '<span class="meta">' + e.count + ' questions · ' + e.max + ' marks' + (e.minutes ? ' · ' + e.minutes + ' minutes' : '') + (e.opens ? ' · opens ' + E(BV.when(e.opens)) : '') + (e.due ? ' · due ' + E(BV.when(e.due)) : '') + '</span>' +
          (e.state === 'done' && e.score != null ? '<p class="score">Your score: ' + e.score + ' / ' + e.max + ' (' + Math.round(100 * e.score / e.max) + '%)' + (e.status === 'Needs marking' ? ' · some answers still being marked' : '') + '</p>' : '') +
          (e.state === 'done' && e.detail ? '<details><summary>See my answers and feedback</summary>' + e.detail.map(function (d, i) { return '<p class="small">Q' + (i + 1) + ': ' + (d.got == null ? 'awaiting marking' : d.got + '/' + d.max) + (d.comment ? ' · ' + E(d.comment) : '') + '</p>'; }).join('') + '</details>' : '') +
          (e.state === 'open' || e.state === 'started' ? '<div class="acts"><button type="button" data-go="' + E(e.id) + '">' + l[0] + ' exam</button></div>' : '') + '</article>';
      }).join('') : '<p class="emptybox">No exams have been set for your class yet.</p>');
      app.querySelector('#so').onclick = BV.signout;
      app.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { take(b.getAttribute('data-go')); }; });
      var h = location.hash.slice(1); if (h && r.exams.some(function (e) { return e.id === h && (e.state === 'open' || e.state === 'started'); })) { history.replaceState(null, '', location.pathname); take(h); }
    });
  }
  function take(id) {
    app.innerHTML = '<p class="muted">Opening the exam…</p>';
    BV.as('startExam', { id: id }).then(function (x) {
      if (!x.ok) { BV.toast(x.error); list(); return; }
      var key = 'bv-exam-' + id, saved = {}; try { saved = JSON.parse(BV.store(key) || '{}'); } catch (e) {}
      app.innerHTML = '<div class="row2"><div><p class="label">Exam</p><h2>' + E(x.title) + '</h2></div>' + (x.secondsLeft != null ? '<span class="timer" id="tm" aria-live="polite"></span>' : '') + '</div>' +
        '<p class="muted small">Your answers are saved on this device as you type. Click Submit when you have finished; you can only submit once.</p><form id="xf" class="grp">' +
        x.questions.map(function (q, i) {
          var name = 'q' + i, sv = saved[i];
          var inner = (q.type === 'mcq' || q.type === 'tf') ? '<div class="opts">' + q.options.map(function (o, j) { return '<label><input type="radio" name="' + name + '" value="' + j + '"' + (String(sv) === String(j) ? ' checked' : '') + '> <span>' + E(o) + '</span></label>'; }).join('') + '</div>'
            : '<textarea name="' + name + '" rows="5" placeholder="Write your answer">' + E(sv || '') + '</textarea>';
          return '<fieldset class="q" style="border:1px solid var(--line)"><legend class="small muted">Question ' + (i + 1) + ' · ' + q.marks + ' mark' + (q.marks > 1 ? 's' : '') + '</legend><b>' + E(q.q) + '</b>' + inner + '</fieldset>';
        }).join('') + '<button class="btn main" type="submit">Submit exam</button><p class="msg" id="xm" role="alert"></p></form>';
      var f = app.querySelector('#xf');
      function collect() { return x.questions.map(function (q, i) { var el = f.elements['q' + i]; if (!el) return ''; if (q.type === 'mcq' || q.type === 'tf') { var c = f.querySelector('input[name="q' + i + '"]:checked'); return c ? c.value : ''; } return el.value; }); }
      f.addEventListener('input', function () { BV.store(key, JSON.stringify(collect())); });
      function submit(auto) {
        clearInterval(timer); var m = app.querySelector('#xm'); m.className = 'msg'; m.textContent = auto ? 'Time is up. Submitting…' : 'Submitting and marking…';
        f.querySelectorAll('input,textarea,button').forEach(function (el) { el.disabled = true; });
        BV.as('submitExam', { id: id, answers: collect() }).then(function (r) {
          if (!r.ok) { m.textContent = r.error; f.querySelectorAll('input,textarea,button').forEach(function (el) { el.disabled = false; }); return; }
          BV.store(key, null);
          app.innerHTML = '<section class="panel tint"><p class="label">Submitted</p><h2>' + E(x.title) + '</h2>' +
            (r.showResults && r.score != null ? '<p class="score" style="font-size:1.5rem">' + r.score + ' / ' + r.max + ' (' + Math.round(100 * r.score / r.max) + '%)</p>' +
              (r.detail || []).map(function (d, i) { return '<div class="fb ' + (d.got === d.max ? 'tch' : 'ai') + '"><h4>Question ' + (i + 1) + ' · ' + (d.got == null ? 'awaiting your teacher' : d.got + ' / ' + d.max) + '</h4>' + (d.comment ? BV.md(d.comment) : '') + '</div>'; }).join('')
              : '<p>Your answers have been sent to your teacher. Results will appear here and on My learning once they are released.</p>') +
            '<div class="cta"><a class="btn" href="/exams/">Back to my exams</a><a class="btn" href="/progress/">My learning</a></div></section>';
        });
      }
      f.addEventListener('submit', function (e) { e.preventDefault(); if (confirm('Submit your exam now? You cannot change answers afterwards.')) submit(false); });
      if (x.secondsLeft != null) {
        var end = Date.now() + x.secondsLeft * 1000, tm = app.querySelector('#tm');
        timer = setInterval(function () { var s = Math.max(0, Math.round((end - Date.now()) / 1000)); tm.textContent = '⏱ ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (!s) submit(true); }, 500);
      }
    });
  }
  start();
})();
